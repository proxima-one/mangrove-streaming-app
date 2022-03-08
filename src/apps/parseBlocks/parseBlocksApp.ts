import * as proxima from "@proxima-one/proxima-core";
import * as model from "../../model";
import * as abi from "./abi";
import * as _ from "lodash";
import { strict as assert } from "assert";
import { parseMangroveEvents } from "./mangroveLogsParser";
import { MangroveCreated } from "../../model/events";

const mangroveLogsParser = parseMangroveEvents();

interface Args {
  chainlistId?: string;
}

export const ParseBlocksApp = proxima.eth.parseContractLogsApp({
  contracts: {
    mangrove: proxima.eth.ContractMetadata.fromAbi(abi.mangrove),
    oracle: proxima.eth.ContractMetadata.fromAbi(abi.oracle),
  },
  initialEvents: ({ args }) => {
    assert(args.addresses.mangrove);
    const chainlistId = (args as Args).chainlistId;

    assert(chainlistId);

    const mangroveAddresses = Array.isArray(args.addresses.mangrove)
      ? args.addresses.mangrove
      : [args.addresses.mangrove];
    return mangroveAddresses.map<MangroveCreated>((address) => {
      return {
        type: "MangroveCreated",
        id: mangroveId(args.network, address),
        address: address,
        chain: {
          name: args.network,
          chainlistId: parseInt(chainlistId),
        },
      };
    });
  },
  map: {
    tx: ({ tx, block, args }) => {
      const txRef = {
        blockNumber: block.header.number,
        blockHash: block.header.hash.toHexString(),
        txHash: tx.original.data.hash.toHexString(),
        from: tx.original.data.from.toHexString(),
      };

      // expect contractEvents from multiple Mangrove instances
      const groupedMangroveEvents = _.chain(tx.contractEvents.mangrove)
        .groupBy((x) => x.payload.address.toHexString())
        .map((values, key) => {
          return {
            mangroveId: mangroveId(args.network, key),
            events: values,
            index: values[0].index,
          };
        })
        .orderBy((x) => x.index)
        .value();

      const mappedEvents: model.events.DomainEvent[] = [];

      for (const { mangroveId, events } of groupedMangroveEvents) {
        const parseResult = mangroveLogsParser({
          txHash: tx.original.data.hash,
          index: 0,
          events: events,
        });

        if (!parseResult.success)
          throw new Error(`Parse Mangrove Logs failed: ${parseResult.reason}`);

        mappedEvents.push(
          ...parseResult.value.map((ev) =>
            _.assign({}, ev, {
              tx: txRef,
              mangroveId,
            })
          )
        );
      }

      return mappedEvents;
    },
  },
});

function mangroveId(chain: string, address: string): string {
  return `${chain}-${address.substring(0, 6)}`;
}
