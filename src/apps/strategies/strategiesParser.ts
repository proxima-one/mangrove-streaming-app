import * as ethApp from "@proxima-one/proxima-app-eth";
import * as mangrove from "@proximaone/stream-schema-mangrove";
import { EthModel } from "@proxima-one/proxima-plugin-eth";
import _ from "lodash";
import { takerStrategy } from "./abi/takerStrategy";
import { multiUserStrategy } from "./abi/multiUserStrategy";

type OutputEvent =
  | mangrove.strategyEvents.MultiUserStrategyEvent
  | mangrove.strategyEvents.TakerStrategyEvent;

export const MangroveStrategiesApp = ethApp.parseContractLogsApp({
  contracts: {
    multiUserStrategy: EthModel.ContractMetadata.fromAbi(multiUserStrategy),
    takerStrategy: EthModel.ContractMetadata.fromAbi(takerStrategy),
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

      const mappedEvent =
        contractType == "multiUserStrategy"
          ? mapMultiUserStrategyEvent(log, chain)
          : mapTakerStrategyEvent(log, chain);

      if (!mappedEvent) return [];

      const outputEvent = _.assign(mappedEvent, {
        tx: txRef,
        id: id(chain, log.payload.address.toHexString(), log.index),
        chainId: parseInt(chainlistId),
        address: log.payload.address.toHexString(),
      }) as OutputEvent;

      return [ethApp.MapResult.toStream(contractType, outputEvent)];
    },
  },
});

function mapMultiUserStrategyEvent(event: EthModel.DecodedLog, chain: string) {
  switch (event.payload.name) {
    case "CreditMgvUser":
      return {
        type: "CreditMgvUser",

        mangroveId: mangroveId(
          chain,
          event.payload.requireParam("mangrove").asString()
        ),
        user: event.payload.requireParam("user").asString(),
        amount: event.payload.requireParam("amount").asString(),
      };
    case "CreditUserTokenBalance":
      return {
        type: "CreditUserTokenBalance",

        user: event.payload.requireParam("user").asString(),
        token: event.payload.requireParam("token").asString(),
        amount: event.payload.requireParam("amount").asString(),
      };
    case "DebitMgvUser":
      return {
        type: "DebitMgvUser",

        mangroveId: mangroveId(
          chain,
          event.payload.requireParam("mangrove").asString()
        ),
        user: event.payload.requireParam("user").asString(),
        amount: event.payload.requireParam("amount").asString(),
      };
    case "DebitUserTokenBalance":
      return {
        type: "DebitUserTokenBalance",

        user: event.payload.requireParam("user").asString(),
        token: event.payload.requireParam("token").asString(),
        amount: event.payload.requireParam("amount").asString(),
      };
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

function mapTakerStrategyEvent(event: EthModel.DecodedLog, chain: string) {
  switch (event.payload.name) {
    case "OrderSummary":
      return {
        type: "OrderSummary",

        mangroveId: mangroveId(
          chain,
          event.payload.requireParam("mangrove").asString()
        ),
        base: event.payload.requireParam("base").asString(),
        quote: event.payload.requireParam("quote").asString(),
        taker: event.payload.requireParam("taker").asString(),
        selling: event.payload.requireParam("selling").asBool(),

        takerGot: event.payload.requireParam("takerGot").asString(),
        takerGave: event.payload.requireParam("takerGave").asString(),
        penalty: event.payload.requireParam("penalty").asString(),
        restingOrderId: event.payload.requireParam("restingOrderId").asNumber(),
      };
    default:
      return undefined;
  }
}

function id(chain: string, address: string, index: number): string {
  return `${chain}-${address}-${index}`;
}

function mangroveId(chain: string, address: string): string {
  return `${chain}-${address.substring(0, 6)}`;
}
