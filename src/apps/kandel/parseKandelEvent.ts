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
        type: "SetCompoundRates",
        compoundRateBase: payload.requireParam("compoundRateBase").asNumber(),
        compoundRateQuote: payload.requireParam("compoundRateQuote").asNumber(),
      };
    case "SetGasprice":
      return {
        type: "SetGasprice",
        value: payload.requireParam("value").asString(),
      };
    case "SetGasreq":
      return {
        type: "SetGasreq",
        value: payload.requireParam("value").asString(),
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
    case "SetGeometricParams":
      return {
        type: "SetGeometricParams",
        spread: payload.requireParam("spread").asNumber(),
        ratio: payload.requireParam("ratio").asNumber(),
      };
    case "SetLength":
      return {
        type: "SetLength",
        value: payload.requireParam("value").asNumber(),
      };
    default:
      throw new Error(`Unknown event type: ${payload.name}`);
  }
}
