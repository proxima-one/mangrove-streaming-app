import * as proxima from "@proxima-one/proxima-core";
import * as model from "../../model";
import * as abi from "./abi";
import * as _ from "lodash";
import { parseMangroveEvents } from "./mangroveLogsParser";

const mangroveLogsParser = parseMangroveEvents();

export const ParseBlocksApp = proxima.eth.parseContractLogsApp({
  contracts: {
    mangrove: proxima.eth.ContractMetadata.fromAbi(abi.mangrove),
    oracle: proxima.eth.ContractMetadata.fromAbi(abi.oracle),
  },
  map: {
    tx: (tx, block) => {
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
            mangroveId: key,
            events: values,
            index: values[0].index,
          };
        })
        .orderBy((x) => x.index)
        .value();

      const mappedEvents: model.events.InputEvent[] = [];

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
