import * as ethApp from "@proxima-one/proxima-app-eth";
import * as mangrove from "@proximaone/stream-schema-mangrove";
import { EthModel } from "@proxima-one/proxima-plugin-eth";
import _ from "lodash";
import { orderLogic } from "./abi/orderLogic";
import { forwarder } from "./abi/forwarder";
import { offerLogic } from "./abi/offerLogic";
import { mangrove as mangroveAbi } from "./abi/mangrove";
import { strategyEvents } from "@proximaone/stream-schema-mangrove";
import { mangroveId, orderId } from "../../model/entities";

export const MangroveStrategiesApp = ethApp.parseContractLogsApp({
  contracts: {
    forwarder: EthModel.ContractMetadata.fromAbi(forwarder),
    orderLogic: EthModel.ContractMetadata.fromAbi(orderLogic),
    offerLogic: EthModel.ContractMetadata.fromAbi(offerLogic),
    mangrove: EthModel.ContractMetadata.fromAbi(mangroveAbi),
  },
  discover: {
    full: true,
  },
  map: {
    log: ({ log, tx, block, contractType, args }) => {
      const chain = args.network;
      const chainlistId = (args as any).chainlistId;

      const txRef = {
        chain: chain,
        blockNumber: block.header.number,
        blockHash: block.header.hash.toHexString(),
        txHash: tx.original.data.hash.toHexString(),
        sender: tx.original.data.from.toHexString(),
      };

      let mappedEvent = undefined;
      switch (contractType) {
        case "forwarder":
          mappedEvent = mapForwarderEvent(log, chain);
          break;
        case "orderLogic": {
          mappedEvent = mapOrderLogicEvent(log, chain);
          break;
        }
        case "offerLogic":
          mappedEvent = {
            type: "LogIncident",

            mangroveId: mangroveId(
              chain,
              log.payload.requireParam("mangrove").asString()
            ),
            outboundToken: log.payload.requireParam("outbound_tkn").asString(),
            inboundToken: log.payload.requireParam("inbound_tkn").asString(),
            offerId: log.payload.requireParam("offerId").asNumber(),
            makerData: log.payload.requireParam("makerData").asString(),
            mgvData: log.payload.requireParam("mgvData").asString(),
          } as strategyEvents.LogIncident;
          break;
        default:
          return [];
      }

      if (!mappedEvent) return [];

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
            // need to find latest OrderComplete log

            const orderCompleteLog = _.findLast(
              tx.contractLogs.mangrove ?? [],
              (x) => x.index < event.index
            );
            if (!orderCompleteLog)
              throw new Error(
                `OrderComplete log not found in tx ${tx.hash.toHexString()}`
              );

            return {
              type: "OrderSummary",

              mangroveId: mangroveId(
                chain,
                event.payload.requireParam("mangrove").asString()
              ),
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
    },
  },
});

function mapForwarderEvent(event: EthModel.DecodedLog, chain: string) {
  switch (event.payload.name) {
    case "NewOwnedOffer":
      return {
        type: "NewOwnedOffer",

        mangroveId: mangroveId(
          chain,
          event.payload.requireParam("mangrove").asString()
        ),
        outboundToken: event.payload.requireParam("outbound_tkn").asString(),
        inboundToken: event.payload.requireParam("inbound_tkn").asString(),
        offerId: event.payload.requireParam("offerId").asString(),
        owner: event.payload.requireParam("owner").asString(),
      };
    default:
      return undefined;
  }
}

function id(chain: string, address: string, index: number): string {
  return `${chain}-${address}-${index}`;
}
