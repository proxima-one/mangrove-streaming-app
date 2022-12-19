import * as ethApp from "@proxima-one/proxima-app-eth";
import * as abi from "./abi";
import * as schema from "@proximaone/stream-schema-mangrove";
import * as _ from "lodash";
import { strict as assert } from "assert";
import { parseMangroveEvents } from "./mangroveLogsParser";
import { EthModel } from "@proxima-one/proxima-plugin-eth";

const mangroveLogsParser = parseMangroveEvents();

interface Args {
  chainlistId?: string;
}

export const ParseBlocksApp = ethApp.parseContractLogsApp({
  contracts: {
    mangrove4: EthModel.ContractMetadata.fromAbi(abi.v4.mangrove),
    mangrove5: EthModel.ContractMetadata.fromAbi(abi.v5.mangrove),
    mangrove6: EthModel.ContractMetadata.fromAbi(abi.v6.mangrove),
    mangrove7: EthModel.ContractMetadata.fromAbi(abi.v7.mangrove),
  },
  initialEvents: ({ args }) => {
    const chainlistId = (args as Args).chainlistId;
    assert(chainlistId);

    const mangroveAddresses = [
      ...toArray(args.addresses.mangrove4),
      ...toArray(args.addresses.mangrove5),
      ...toArray(args.addresses.mangrove6),
      ...toArray(args.addresses.mangrove7),
    ];
    const events = mangroveAddresses.map<schema.events.MangroveEvent>(
      (address) => {
        return {
          type: "MangroveCreated",
          id: mangroveId(args.network, address),
          address: address,
          chain: {
            name: args.network,
            chainlistId: parseInt(chainlistId),
          },
          // common parts
          chainId: parseInt(chainlistId),
          mangroveId: mangroveId(args.network, address),
          tx: {
            blockNumber: 0,
            blockHash: "0x",
            sender: "0x",
            txHash: "0x",
          },
        };
      }
    );

    return events.map((ev) => ethApp.MapResult.toDefaultStream(ev));
  },
  map: {
    tx: ({ tx, block, args }) => {
      const chainlistId = parseInt((args as Args).chainlistId!);

      const txRef = {
        blockNumber: block.header.number,
        blockHash: block.header.hash.toHexString(),
        txHash: tx.original.data.hash.toHexString(),
        sender: tx.original.data.from.toHexString(),
      };

      const mangroveEvents = [
        ...toArray(tx.contractLogs.mangrove4),
        ...toArray(tx.contractLogs.mangrove5),
        ...toArray(tx.contractLogs.mangrove6),
        ...toArray(tx.contractLogs.mangrove7),
      ];

      // expect contractEvents from multiple Mangrove instances
      const groupedMangroveEvents = _.chain(mangroveEvents)
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

      const mappedEvents: schema.events.MangroveEvent[] = [];

      for (const { mangroveId, events } of groupedMangroveEvents) {
        const parseResult = mangroveLogsParser({
          txHash: tx.original.data.hash,
          index: 0,
          events: events,
        });

        if (!parseResult.success)
          throw new Error(`Parse Mangrove Logs failed: ${parseResult.reason}`);

        mappedEvents.push(
          ...parseResult.value.map((ev) => {
            return {
              tx: txRef,
              mangroveId: mangroveId,
              chainId: chainlistId,
              ...ev,
            } as schema.events.MangroveEvent;
          })
        );
      }

      return mappedEvents.map((ev) => ethApp.MapResult.toDefaultStream(ev));
    },
  },
});

function mangroveId(chain: string, address: string): string {
  return `${chain}-${address.substring(0, 6)}`;
}

function toArray<T>(value: T | T[] | ReadonlyArray<T> | undefined): T[] {
  if (value == undefined) return [];

  if (Array.isArray(value)) return value;

  return [value as T];
}
