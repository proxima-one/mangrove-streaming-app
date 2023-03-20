import * as _ from "lodash";
import * as abi from "./abi";
import * as ethApp from "@proxima-one/proxima-app-eth";
import { AppFactory } from "@proxima-one/proxima-app";
import { EthModel } from "@proxima-one/proxima-plugin-eth";
import { DiscoveredAddress } from "@proxima-one/proxima-app-eth";
import { parseSeederEvent } from "./parseSeederEvent";
import { parseKandelEvent } from "./parseKandelEvent";
import { kandel } from "@proximaone/stream-schema-mangrove";
import { TxRef } from "@proximaone/stream-schema-base";

export const KandelParserApp: AppFactory = ethApp.parseContractLogsApp({
  contracts: {
    seeder: EthModel.ContractMetadata.fromAbi(abi.seeder),
    kandel: EthModel.ContractMetadata.fromAbi(abi.kandel),
  },
  discover: {
    log: ({ log, contractType, timestamp }) => {
      if (contractType == "seeder") {
        let address;
        if (log.payload.name == "NewKandel") {
          address = log.payload.requireParam("kandel").asString();
        } else if (log.payload.name == "NewAaveKandel") {
          address = log.payload.requireParam("aaveKandel").asString();
        } else return {};
        return {
          kandel: [
            new DiscoveredAddress(
              EthModel.Address.fromHexString(address),
              timestamp
            ),
          ],
        };
      }
      return {};
    },
  },
  map: {
    tx: ({ tx, block, args }) => {
      const txRef: TxRef = {
        chain: args.network,
        blockNumber: block.header.number,
        blockHash: block.header.hash.toHexString(),
        txHash: tx.original.data.hash.toHexString(),
        sender: tx.original.data.from.toHexString(),
      };

      let setParamsEvent: Partial<kandel.SetParams> | undefined = undefined;
      const outputEvents = [];
      for (const log of tx.flatLogs()) {
        const parseEvent = {
          seeder: parseSeederEvent,
          kandel: parseKandelEvent,
        }[log.contractType];
        const event = parseEvent(log.log);
        if (event.type == "SetParams") {
          if (setParamsEvent) {
            setParamsEvent = _.assign(setParamsEvent, event);
          } else {
            setParamsEvent = event;
          }
        } else {
          outputEvents.push(event);
        }
      }

      if (setParamsEvent != undefined) {
        outputEvents.push(setParamsEvent);
      }
      return outputEvents.map(event =>
        ethApp.MapResult.toDefaultStream(
          _.assign(event, { tx: txRef })
        ),
      );
    }
  },
});
