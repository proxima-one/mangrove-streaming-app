import * as _ from "lodash";
import * as abi from "./abi";
import * as ethApp from "@proxima-one/proxima-app-eth";
import { AppFactory } from "@proxima-one/proxima-app";
import { EthModel } from "@proxima-one/proxima-plugin-eth";
import { DiscoveredAddress } from "@proxima-one/proxima-app-eth";
import { kandel } from "@proximaone/stream-schema-mangrove";
import { TxRef } from "@proximaone/stream-schema-base";
import { toArray } from "lodash";
import { KandelParamsEvents, parseKandelEvents, parseNewKandel } from "./kandelEvents";
import { mangroveId } from "../../model/entities";
import { getMangroveVersion } from "../../common/helpers";

interface Args {
  chainlistId?: string;
}

export const KandelParserApp: AppFactory = ethApp.parseContractLogsApp({
  contracts: {
    seeder: EthModel.ContractMetadata.fromAbi(abi.seeder),
    kandel: EthModel.ContractMetadata.fromAbi(abi.kandel),
    kandelMangrove: EthModel.ContractMetadata.fromAbi(abi.kandelMangrove),
    mangrove8: EthModel.ContractMetadata.fromAbi(abi.mangrove8),
    mangrove9: EthModel.ContractMetadata.fromAbi(abi.mangrove9),
  },

  discover: {
    fullDiscoveryContractTypes: ["seeder", "kandelMangrove"],
    tx: ({ tx, timestamp, args }) => {
      const mangroveVersion = getMangroveVersion(args);
      const mangroveAddress = args.addresses[mangroveVersion] as string;
      const seederLogs = [...toArray(tx.contractLogs.seeder)];

      const seederMangroveAddreses = tx.contractLogs.kandelMangrove
        ?.filter(x => x.payload.name == KandelParamsEvents.Mgv)
        ?.map(x => x.payload.requireParam("mgv").asString());

      // filter seeders by mangrove address
      if (!seederMangroveAddreses || seederMangroveAddreses.length == 0
        || seederMangroveAddreses[seederMangroveAddreses.length-1].toLowerCase() != mangroveAddress.toLowerCase())
        return {};

      for (const log of seederLogs) {
        const address = parseNewKandel(log.payload).kandel;
        if (!address) return {};
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
      const mangroveVersion = getMangroveVersion(args);
      const chainlistId = parseInt((args as Args).chainlistId!);
      const txRef: TxRef = {
        chain: args.network,
        blockNumber: block.header.number,
        blockHash: block.header.hash.toHexString(),
        txHash: tx.original.data.hash.toHexString(),
        sender: tx.original.data.from.toHexString(),
      };

      const kandelEvents = toArray(tx.contractLogs.kandel);
      const groupedKandelEvents = _.chain(kandelEvents)
        .groupBy((x) => x.payload.address.toHexString())
        .map((kandelEvents, key) => {
          const seederEvents = toArray(tx.contractLogs.seeder).filter((x) => {
            const parsed = parseNewKandel(x.payload);
            return parsed.kandel == key;
          });

          const allEvents = [
            ...kandelEvents,
            ...seederEvents,
            ...toArray(tx.contractLogs.mangrove8),
            ...toArray(tx.contractLogs.mangrove9),
          ].sort((a, b) => a.index - b.index);

          return {
            kandelAddress: key,
            events: allEvents,
            index: kandelEvents[0].index,
          };
        })
        .orderBy((x) => x.index)
        .value();

      const mappedEvents: kandel.KandelEvent[] = [];
      for (const { kandelAddress, events } of groupedKandelEvents) {
        const mangroveAddress = args.addresses[mangroveVersion] as string;
        const parseResult = parseKandelEvents()({
          txHash: tx.original.data.hash,
          mangroveAddress: EthModel.Address.fromHexString(mangroveAddress),
          kandelAddress: EthModel.Address.fromHexString(kandelAddress),
          index: 0,
          events: events,
        });

        if (!parseResult.success)
          throw new Error(`Parse Mangrove Logs failed: ${parseResult.reason}`);

        let setParams = undefined;
        let newKandel = undefined;
        for (const log of parseResult.value) {
          if (log.type == "NewKandel" || log.type == "NewAaveKandel") {
            log.mangroveId = mangroveId(args.network, mangroveAddress);
            newKandel = log;
          } else if (log.type == "SetParams") {
            setParams = log as kandel.SetParams;
          }
        }

        let skipSetParamsEvent = false;
        if (newKandel && setParams) {
          newKandel.params = setParams;
          skipSetParamsEvent = true;
        }

        mappedEvents.push(
          ...parseResult.value
            .filter((x) => x.type != "SetParams" || !skipSetParamsEvent)
            .map((ev) => {
              return {
                tx: txRef,
                address: kandelAddress,
                chainId: chainlistId,
                ...ev,
              } as kandel.KandelEvent;
            })
        );
      }

      return mappedEvents.map((ev) => ethApp.MapResult.toDefaultStream(ev));
    },
  },
});
