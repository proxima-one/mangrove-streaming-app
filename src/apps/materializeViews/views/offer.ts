import { DocumentUpdateBuilder, ViewBase } from "./types";
import * as aggregates from "../aggregates";
import BigNumber from "bignumber.js";

export interface OfferView extends ViewBase {
  live: boolean;
  deprovisioned: boolean;

  maker: string;
  mangroveId: string;
  prev: string;
  wants: string;
  gives: string;
  gasprice: number;
  gasreq: number;
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
          mangroveId: offer.id.mangroveId,
          gives: offerState.offer.gives,
          wants: offerState.offer.wants,
          prev: new aggregates.OfferId(
            offer.id.mangroveId,
            offer.id.key,
            offerState.offer.prev
          ).value,
          gasprice: offerState.offer.gasprice,
          gasreq: offerState.offer.gasreq,
          deprovisioned: offer.isDeprovisioned,
          live: offer.isLive,
          maker: offerState.maker,
        }
  );
}
