import { DocumentUpdateBuilder, ViewBase } from "./types";
import * as aggregates from "../aggregates";
import BigNumber from "bignumber.js";

export interface OfferView extends ViewBase {
  makerId: string;
  mangroveId: string;
  prev: string;
  wants: string;
  gives: string;
  gasprice: number;
  gasreq: number;

  live: boolean;
  deprovisioned: boolean;
}

export function offer(
  offer: aggregates.OfferAggregate
): DocumentUpdateBuilder<OfferView> {
  const offerState = offer.state;
  return new DocumentUpdateBuilder<OfferView>(
    offer.id.value,
    "Offer",
    offerState == undefined
      ? undefined
      : {
          mangroveId: offer.id.mangrove,
          gives: offerState.offer.gives,
          wants: offerState.offer.wants,
          prev: new aggregates.OfferId(
            offer.id.mangrove,
            offer.id.offerList,
            offerState.offer.prev
          ).value,
          gasprice: offerState.offer.gasprice,
          gasreq: offerState.offer.gasreq,
          deprovisioned: offer.isDeprovisioned,
          live: offer.isLive,
          makerId: new aggregates.MakerId(offer.id.mangrove, offerState.maker)
            .value,
        }
  );
}
