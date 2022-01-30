import { DocumentUpdateBuilder, ViewBase } from "./types";
import * as aggregates from "../aggregates";

const topOffersCount = 100;
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
  offerList: aggregates.OfferListAggregate,
  offerListOffers: aggregates.OfferListOffersAggregate
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
    offersCount: offerListOffers.state.offers.length,
    topOffers: offerListOffers.state.offers
      .slice(0, topOffersCount)
      .map(
        (offerNumber) =>
          new aggregates.OfferId(
            offerList.id.mangroveId,
            offerList.id.key,
            offerNumber
          ).value
      ),
  });
}
