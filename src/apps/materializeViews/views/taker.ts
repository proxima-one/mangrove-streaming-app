import { DocumentUpdateBuilder, ViewBase } from "./types";
import * as aggregates from "../aggregates";

export interface TakerView extends ViewBase {
  mangroveId: string;

  approvals: Record<string, Record<string, string>>;
}

export function taker(
  taker: aggregates.TakerAggregate
): DocumentUpdateBuilder<TakerView> {
  return new DocumentUpdateBuilder(taker.id.value, "Taker", {
    mangroveId: taker.id.mangroveId,
    approvals: taker.state.approvals,
  });
}
