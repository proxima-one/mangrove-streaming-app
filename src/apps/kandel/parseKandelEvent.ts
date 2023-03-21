import { EthModel } from "@proxima-one/proxima-plugin-eth";
import { kandel } from "@proximaone/stream-schema-mangrove";

export function parseKandelEvent(
  event: EthModel.DecodedLog
): Partial<kandel.KandelEvent> {
  const payload = event.payload;

  switch (payload.name) {
    case "AllAsks":
      return {
        type: "AllAsks",
      };
    case "AllBids":
      return {
        type: "AllBids",
      };
    case "SetCompoundRates":
      return {
        type: "SetParams",
        compoundRates: {
          base: payload.requireParam("compoundRateBase").asNumber(),
          quote: payload.requireParam("compoundRateQuote").asNumber(),
        }
      };
    case "SetGasprice":
      return {
        type: "SetParams",
        gasPrice: payload.requireParam("value").asString(),
      };
    case "SetGasreq":
      return {
        type: "SetParams",
        gasReq: payload.requireParam("value").asString(),
      };
    case "SetGeometricParams":
      return {
        type: "SetParams",
        geometric: {
          spread: payload.requireParam("spread").asNumber(),
          ratio: payload.requireParam("ratio").asNumber(),
        }
      };
    case "SetLength":
      return {
        type: "SetParams",
        length: payload.requireParam("value").asNumber(),
      };
    case "Credit":
      return {
        type: "Credit",
        token: payload.requireParam("token").asString(),
        amount: payload.requireParam("amount").asString(),
      };
    case "Debit":
      return {
        type: "Debit",
        token: payload.requireParam("token").asString(),
        amount: payload.requireParam("amount").asString(),
      };
    default:
      throw new Error(`Unknown event type: ${payload.name}`);
  }
}
