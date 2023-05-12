import * as ethApp from "@proxima-one/proxima-app-eth";
import * as mangrove from "@proximaone/stream-schema-mangrove";
import { EthModel } from "@proxima-one/proxima-plugin-eth";
import _ from "lodash";
import { mangroveOrder } from "./abi/mangroveOrder";
import { mangrove as mangroveAbi } from "./abi/mangrove";
import { strategyEvents } from "@proximaone/stream-schema-mangrove";
import { mangroveId, orderId } from "../../model/entities";

export const MangroveStrategiesApp = ethApp.parseContractLogsApp({
  contracts: {
    mangroveOrder: EthModel.ContractMetadata.fromAbi(mangroveOrder),
    mangrove8: EthModel.ContractMetadata.fromAbi(mangroveAbi),
  },
  map: {
    log: ({ log, tx, block, contractType, args }) => {
      const chain = args.network;
      const chainlistId = (args as any).chainlistId;
      const mangroveAddress = args.addresses.mangrove8 as string;
      const mangroveOrderAddress = args.addresses.mangroveOrder as string;

      const txRef = {
        chain: chain,
        blockNumber: block.header.number,
        blockHash: block.header.hash.toHexString(),
        txHash: tx.original.data.hash.toHexString(),
        sender: tx.original.data.from.toHexString(),
      };

      let mappedEvent = undefined;
      if (contractType == "mangroveOrder")
        mappedEvent = mangroveOrder(chain)
      else
        return [];

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

      function mapOrderLogicEvent(
        event: EthModel.DecodedLog,
        chain: string
      ): strategyEvents.OrderSummary | strategyEvents.SetExpiry | undefined {
        switch (event.payload.name) {
          case "OrderSummary":
            // filter out events with unknown mangrove or order addresses
            const logMangroveAddress = event.payload.requireParam("mangrove").asString();
            if (logMangroveAddress.toLowerCase() != mangroveAddress.toLowerCase())
              return undefined;

            // need to find latest OrderComplete log
            const orderCompleteLog = _.findLast(
              tx.contractLogs.mangrove8 ?? [],
              (x) => x.index < event.index
            );
            if (!orderCompleteLog)
              throw new Error(
                `OrderComplete log not found in tx ${tx.hash.toHexString()}`
              );

            return {
              type: "OrderSummary",

              mangroveId: mangroveId(chain, logMangroveAddress),
              outboundToken: event.payload
                .requireParam("outbound_tkn")
                .asString(),
              inboundToken: event.payload
                .requireParam("inbound_tkn")
                .asString(),
              orderId: orderId(tx.hash, orderCompleteLog),
              taker: event.payload.requireParam("taker").asString(),
              fillOrKill: event.payload.requireParam("fillOrKill").asBool(),
              takerWants: event.payload.requireParam("takerWants").asString(),
              takerGives: event.payload.requireParam("takerGives").asString(),
              fillWants: event.payload.requireParam("fillWants").asBool(),
              restingOrder: event.payload.requireParam("restingOrder").asBool(),
              expiryDate: event.payload.requireParam("expiryDate").asNumber(),
              takerGot: event.payload.requireParam("takerGot").asString(),
              takerGave: event.payload.requireParam("takerGave").asString(),
              bounty: event.payload.requireParam("bounty").asString(),
              fee: event.payload.requireParam("fee").asString(),
              restingOrderId: event.payload
                .requireParam("restingOrderId")
                .asNumber(),
            };
          case "SetExpiry":
            return {
              type: "SetExpiry",

              outboundToken: event.payload
                .requireParam("outbound_tkn")
                .asString(),
              inboundToken: event.payload
                .requireParam("inbound_tkn")
                .asString(),
              offerId: event.payload.requireParam("offerId").asNumber(),
              date: event.payload.requireParam("date").asNumber(),
            };
          default:
            return undefined;
        }
      }

      function mangroveOrder(chain: string) {
        const logMangroveAddress = log.payload.requireParam("mangrove").asString();
        if (logMangroveAddress.toLowerCase() != mangroveAddress.toLowerCase())
          return undefined;

        switch (log.payload.name) {
          case "NewOwnedOffer":
            return {
              type: "NewOwnedOffer",

              mangroveId: mangroveId(chain, logMangroveAddress),
              outboundToken: log.payload.requireParam("outbound_tkn").asString(),
              inboundToken: log.payload.requireParam("inbound_tkn").asString(),
              offerId: log.payload.requireParam("offerId").asString(),
              owner: log.payload.requireParam("owner").asString(),
            };
          case "LogIncident":
            return {
              type: "LogIncident",

              mangroveId: mangroveId(chain, logMangroveAddress),
              outboundToken: log.payload.requireParam("outbound_tkn").asString(),
              inboundToken: log.payload.requireParam("inbound_tkn").asString(),
              offerId: log.payload.requireParam("offerId").asNumber(),
              makerData: log.payload.requireParam("makerData").asString(),
              mgvData: log.payload.requireParam("mgvData").asString(),
            } as strategyEvents.LogIncident;
          case "OrderSummary":
            // need to find latest OrderComplete log
            const orderCompleteLog = _.findLast(
              tx.contractLogs.mangrove8 ?? [],
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
