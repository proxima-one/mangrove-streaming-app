import { DocumentUpdateBuilder, ViewBase } from "./types";
import * as aggregates from "../aggregates";

export interface OfferListView extends ViewBase {
  mangroveId: string;
  inboundToken: string;
  outboundToken: string;
  params: {
    active?: boolean;
    fee?: string;
    gasbase?: number;
    density?: string;
  };
  offersCount: number;
  topOffers: string[];
}

export function offerList(
  offerList: aggregates.OfferListAggregate
): DocumentUpdateBuilder<OfferListView> {
  const params = offerList.state.params;
  return new DocumentUpdateBuilder(offerList.id.value, "OfferList", {
    mangroveId: offerList.id.mangroveId,
    params: {
      active: params.active,
      fee: params.fee,
      gasbase: params.gasbase,
      density: params.density,
    },
    inboundToken: offerList.id.key.inboundToken.toHexString(),
    outboundToken: offerList.id.key.outboundToken.toHexString(),
    offersCount: 0,
    topOffers: [],
  });
}
