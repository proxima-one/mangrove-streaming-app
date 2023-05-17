import * as ethApp from "@proxima-one/proxima-app-eth";
import * as mangrove from "@proximaone/stream-schema-mangrove";
import { EthModel } from "@proxima-one/proxima-plugin-eth";
import _ from "lodash";
import { mangroveOrder } from "./abi/mangroveOrder";
import { mangrove as mangroveAbi } from "./abi/mangrove";
import { strategyEvents } from "@proximaone/stream-schema-mangrove";
import { mangroveId, orderId } from "../../model/entities";
import { getMangroveVersion } from "../../common/helpers";

export const MangroveStrategiesApp = ethApp.parseContractLogsApp({
  contracts: {
    mangroveOrder: EthModel.ContractMetadata.fromAbi(mangroveOrder),
    mangrove8: EthModel.ContractMetadata.fromAbi(mangroveAbi),
    mangrove9: EthModel.ContractMetadata.fromAbi(mangroveAbi),
  },
  map: {
    log: ({ log, tx, block, contractType, args }) => {
      const mangroveVersion = getMangroveVersion(args);
      const chain = args.network;
      const chainlistId = (args as any).chainlistId;
      const mangroveAddress = args.addresses[mangroveVersion] as string;
      const mangroveOrderAddress = args.addresses.mangroveOrder as string;

      const txRef = {
        chain: chain,
        blockNumber: block.header.number,
        blockHash: block.header.hash.toHexString(),
        txHash: tx.original.data.hash.toHexString(),
        sender: tx.original.data.from.toHexString(),
      };

      let mappedEvent = undefined;
      if (contractType == "mangroveOrder") mappedEvent = mangroveOrder(chain);
      else return [];

      const logMangroveOrderAddress = log.payload.address.toHexString();
      if (!mappedEvent || logMangroveOrderAddress.toLowerCase() != mangroveOrderAddress.toLowerCase())
        return [];

      const outputEvent = _.assign(mappedEvent, {
        tx: txRef,
        id: id(chain, tx.hash.toHexString(), log.index),
        chainId: parseInt(chainlistId),
        address: log.payload.address.toHexString(),
      }) as mangrove.strategyEvents.StrategyEvent;

      return [ethApp.MapResult.toDefaultStream(outputEvent)];

      function mangroveOrder(chain: string) {
        switch (log.payload.name) {
          case "NewOwnedOffer": {
            const logMangroveAddress = log.payload.requireParam("mangrove").asString();
            if (logMangroveAddress.toLowerCase() != mangroveAddress.toLowerCase())
              return undefined;
            return {
              type: "NewOwnedOffer",

              mangroveId: mangroveId(chain, logMangroveAddress),
              outboundToken: log.payload.requireParam("outbound_tkn").asString(),
              inboundToken: log.payload.requireParam("inbound_tkn").asString(),
              offerId: log.payload.requireParam("offerId").asString(),
              owner: log.payload.requireParam("owner").asString(),
            };
          }
          case "LogIncident": {
            const logMangroveAddress = log.payload.requireParam("mangrove").asString();
            if (logMangroveAddress.toLowerCase() != mangroveAddress.toLowerCase())
              return undefined;
            return {
              type: "LogIncident",

              mangroveId: mangroveId(chain, logMangroveAddress),
              outboundToken: log.payload.requireParam("outbound_tkn").asString(),
              inboundToken: log.payload.requireParam("inbound_tkn").asString(),
              offerId: log.payload.requireParam("offerId").asNumber(),
              makerData: log.payload.requireParam("makerData").asString(),
              mgvData: log.payload.requireParam("mgvData").asString(),
            } as strategyEvents.LogIncident;
          }
          case "OrderSummary": {
            const logMangroveAddress = log.payload.requireParam("mangrove").asString();
            if (logMangroveAddress.toLowerCase() != mangroveAddress.toLowerCase())
              return undefined;
            // need to find latest OrderComplete log
            const orderCompleteLog = _.findLast(
              tx.contractLogs[mangroveVersion] ?? [],
              (x) => x.index < log.index
            );
            if (!orderCompleteLog)
              throw new Error(`OrderComplete log not found in tx ${tx.hash.toHexString()}`);

            return {
              type: "OrderSummary",

              mangroveId: mangroveId(chain, logMangroveAddress),
              outboundToken: log.payload.requireParam("outbound_tkn").asString(),
              inboundToken: log.payload.requireParam("inbound_tkn").asString(),
              orderId: orderId(tx.hash, orderCompleteLog),
              taker: log.payload.requireParam("taker").asString(),
              fillOrKill: log.payload.requireParam("fillOrKill").asBool(),
              takerWants: log.payload.requireParam("takerWants").asString(),
              takerGives: log.payload.requireParam("takerGives").asString(),
              fillWants: log.payload.requireParam("fillWants").asBool(),
              restingOrder: log.payload.requireParam("restingOrder").asBool(),
              expiryDate: log.payload.requireParam("expiryDate").asNumber(),
              takerGot: log.payload.requireParam("takerGot").asString(),
              takerGave: log.payload.requireParam("takerGave").asString(),
              bounty: log.payload.requireParam("bounty").asString(),
              fee: log.payload.requireParam("fee").asString(),
              restingOrderId: log.payload.requireParam("restingOrderId").asNumber(),
            };
          }
          case "SetExpiry":
            return {
              type: "SetExpiry",

              outboundToken: log.payload.requireParam("outbound_tkn").asString(),
              inboundToken: log.payload.requireParam("inbound_tkn").asString(),
              offerId: log.payload.requireParam("offerId").asNumber(),
              date: log.payload.requireParam("date").asNumber(),
            };
          default:
            return undefined;
        }
      }
    },
  },
});

function id(chain: string, address: string, index: number): string {
  return `${chain}-${address}-${index}`;
}
