import { EthModel } from "@proxima-one/proxima-plugin-eth";
import { kandel } from "@proximaone/stream-schema-mangrove";

export function parseSeederEvent(
  event: EthModel.DecodedLog
): Partial<kandel.SeederEvent> {
  const payload = event.payload;

  switch (payload.name) {
    case "NewKandel":
      return {
        type: "NewKandel",
        owner: payload.requireParam("owner").asString(),
        base: payload.requireParam("base").asString(),
        quote: payload.requireParam("quote").asString(),
        kandel: payload.requireParam("kandel").asString(),
      };
    case "NewAaveKandel":
      return {
        type: "NewAaveKandel",
        owner: payload.requireParam("owner").asString(),
        base: payload.requireParam("base").asString(),
        quote: payload.requireParam("quote").asString(),
        aaveKandel: payload.requireParam("aaveKandel").asString(),
        reserveId: payload.requireParam("reserveId").asString(),
      };
    default:
      throw new Error(`Unknown event type: ${payload.name}`);
  }
}
