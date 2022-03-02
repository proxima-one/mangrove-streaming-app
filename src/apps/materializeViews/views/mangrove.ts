import { JsonObject } from "@proxima-one/proxima-core";
import * as aggregates from "../aggregates";
import { DocumentUpdateBuilder } from "./types";

export interface MangroveView extends JsonObject {
  params: {
    governance?: string;
    monitor?: string;
    vault?: string;
    useOracle?: boolean;
    notify?: boolean;
    gasmax?: number;
    gasprice?: number;
    dead?: boolean;
  };
}

export function mangrove(
  mangrove: aggregates.MangroveAggregate
): DocumentUpdateBuilder<MangroveView> {
  const params = mangrove.state.params;
  return new DocumentUpdateBuilder(mangrove.id.value, "Mangrove", {
    params: {
      governance: params.governance,
      monitor: params.monitor,
      vault: params.vault,
      useOracle: params.useOracle ?? false,
      notify: params.notify ?? false,
      gasmax: params.gasmax ?? 0,
      gasprice: params.gasprice ?? 0,
      dead: params.dead ?? false,
    },
  });
}
