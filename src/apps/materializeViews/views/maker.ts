import { DocumentUpdateBuilder, ViewBase } from "./types";
import * as aggregates from "../aggregates";

export interface MakerView extends ViewBase {
  mangroveId: string;
  balance: string;
}

export function maker(
  maker: aggregates.MakerAggregate
): DocumentUpdateBuilder<MakerView> {
  return new DocumentUpdateBuilder(maker.id.value, "Maker", {
    mangroveId: maker.id.mangroveId,
    balance: maker.state.balance,
  });
}
