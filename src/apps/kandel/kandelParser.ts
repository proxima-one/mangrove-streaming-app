import * as _ from "lodash";
import * as abi from "./abi";
import * as mangroveAbi from "../parseBlocks/abi";
import * as ethApp from "@proxima-one/proxima-app-eth";
import { AppFactory } from "@proxima-one/proxima-app";
import { EthModel } from "@proxima-one/proxima-plugin-eth";
import { DiscoveredAddress } from "@proxima-one/proxima-app-eth";
import { kandel } from "@proximaone/stream-schema-mangrove";
import { TxRef } from "@proximaone/stream-schema-base";
import { toArray } from "lodash";
import { parseKandelEvents } from "./kandelEvents";
import { KandelEvent } from "@proximaone/stream-schema-mangrove/dist/kandel";

interface Args {
  chainlistId?: string;
}

export const KandelParserApp: AppFactory = ethApp.parseContractLogsApp({
  contracts: {
    seeder: EthModel.ContractMetadata.fromAbi(abi.seeder),
    kandel: EthModel.ContractMetadata.fromAbi(abi.kandel),
    mangrove8: EthModel.ContractMetadata.fromAbi(mangroveAbi.v8.mangrove),
  },

  discover: {
    full: true,
    //skipDiscovery: ["mangrove8"],
    skipDiscovery: ["kandel", "mangrove8"],
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
      const chainlistId = parseInt((args as Args).chainlistId!);
      const txRef: TxRef = {
        chain: args.network,
        blockNumber: block.header.number,
        blockHash: block.header.hash.toHexString(),
        txHash: tx.original.data.hash.toHexString(),
        sender: tx.original.data.from.toHexString(),
      };

      const kandelEvents = [
        ...toArray(tx.contractLogs.seeder),
        ...toArray(tx.contractLogs.kandel),
        ...toArray(tx.contractLogs.mangrove8),
      ];

      console.log(`got ${kandelEvents.length} events to parse`);

      // const groupedKandelEvents = _.chain(kandelEvents)
      //   .groupBy((x) => x.payload.address.toHexString())
      //   .map((values, key) => {
      //     return {
      //       mangroveAddress: key,
      //       events: values,
      //       index: values[0].index,
      //     };
      //   })
      //   .orderBy((x) => x.index)
      //   .value();

      const mappedEvents: KandelEvent[] = [];
      //for (const { mangroveAddress, events } of groupedKandelEvents) {
      const parseResult = parseKandelEvents()({
        txHash: tx.original.data.hash,
        mangroveAddress: EthModel.Address.fromHexString(
          args.addresses.mangrove8 as string
        ),
        index: 0,
        events: kandelEvents,
      });

      if (!parseResult.success)
        throw new Error(`Parse Mangrove Logs failed: ${parseResult.reason}`);

      const setParams: kandel.SetParams | undefined = undefined;
      let newKandel = undefined;
      for (const log of parseResult.value) {
        if (log.type == "NewKandel") {
          newKandel = log;
        } else if (log.type == "SetParams") {
          _.assign(setParams, log);
        }
      }
      if (newKandel && setParams) newKandel.params = setParams;

      mappedEvents.push(
        ...parseResult.value.map((ev) => {
          return {
            tx: txRef,
            chainId: chainlistId,
            ...ev,
          } as KandelEvent;
        })
      );
      //}

      return mappedEvents.map((ev) => ethApp.MapResult.toDefaultStream(ev));
    },
  },
});
