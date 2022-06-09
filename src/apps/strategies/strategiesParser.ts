import * as proxima from "@proxima-one/proxima-core";
import * as mangrove from "@proximaone/stream-schema-mangrove";
import _ from "lodash";
import { takerStrategy } from "./abi/takerStrategy";
import { multiUserStrategy } from "./abi/multiUserStrategy";

type OutputEvent =
  | mangrove.strategyEvents.MultiUserStrategyEvent
  | mangrove.strategyEvents.TakerStrategyEvent;

type StrategyContractType = "multiUserStrategy" | "takerStrategy";

export const MangroveStrategiesApp = proxima.eth.parseContractLogsApp({
  contracts: {
    multiUserStrategy: proxima.eth.ContractMetadata.fromAbi(multiUserStrategy),
    takerStrategy: proxima.eth.ContractMetadata.fromAbi(takerStrategy),
  },
  discover: {
    full: true,
  },
  map: {
    event: ({ event, tx, block, contractType, args }) => {
      const chain = args.network;

      const txRef = {
        chain: chain,
        blockNumber: block.header.number,
        blockHash: block.header.hash.toHexString(),
        txHash: tx.original.data.hash.toHexString(),
        sender: tx.original.data.from.toHexString(),
      };

      const stream = outputStream(args, contractType);

      const mappedEvent =
        contractType == "multiUserStrategy"
          ? mapMultiUserStrategyEvent(event)
          : mapTakerStrategyEvent(event);

      if (!mappedEvent) return [];

      const outputEvent = _.assign(mappedEvent, {
        tx: txRef,
        id: id(chain, event.payload.address.toHexString(), event.index),
        address: event.payload.address.toHexString(),
      }) as OutputEvent;

      return [{ output: outputEvent, stream: stream }];
    },
  },
});

function mapMultiUserStrategyEvent(event: proxima.eth.DecodedContractEvent) {
  switch (event.payload.name) {
    case "CreditMgvUser":
      return {
        type: "CreditMgvUser",

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

        outboundToken: event.payload.requireParam("outbound_tkn").asString(),
        inboundToken: event.payload.requireParam("inbound_tkn").asString(),
        offerId: event.payload.requireParam("offerId").asString(),
        owner: event.payload.requireParam("owner").asString(),
      };
    default:
      return undefined;
  }
}

function mapTakerStrategyEvent(event: proxima.eth.DecodedContractEvent) {
  switch (event.payload.name) {
    case "OrderSummary":
      return {
        type: "OrderSummary",

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

function outputStream(
  args: proxima.eth.ParseContractLogsAppArgs<StrategyContractType>,
  contractType: StrategyContractType
) {
  if (typeof args.outputStream == "string")
    throw new Error(
      "Invalid outputStream type. Use Record to specify output stream for each strategy"
    );

  const stream = args.outputStream![contractType];
  if (!stream)
    throw new Error(`OutputStream for ${contractType} is not specified`);

  return stream;
}
