import * as proxima from "@proxima-one/proxima-core";
import * as model from "../../model";
import * as utils from "@proxima-one/proxima-utils";
import * as views from "./views";
import * as aggregates from "./aggregates";
import BigNumber from "bignumber.js";
import * as aggregatesModel from "aggregateModel";

const domainEventMatcher =
  utils.createPatternMatcher<model.events.DomainEvent>();

export function handleDomainEvent(
  aggregatesPool: aggregatesModel.AggregatesPool,
  { undo, timestamp, payload }: proxima.Event<model.events.DomainEvent>
): ReadonlyArray<proxima.documents.DocumentUpdate> {
  return domainEventMatcher({
    OrderCompleted: (e) => {
      // TODO: implement, change offer state as well (deprovisioning and gives = 0 to delete offer, also from list)
      return [];
    },
    OfferRetracted: (e) => {
      const key = model.OfferListKey.fromOfferList(e.offerList);
      const offerId = new aggregates.OfferId(e.mangroveId, key, e.offerId);

      const offerList = aggregatesPool.load(
        new aggregates.OfferListId(e.mangroveId, key)
      );
      const offerListOffers = aggregatesPool.mutate(
        new aggregates.OfferListOffersId(e.mangroveId, key),
        (x) => x.removeOffer(e.offerId),
        undo
      );

      const offer = aggregatesPool.mutate(offerId, (x) => x.remove());

      return [
        views.offer(offer).setContent(),
        views.offerList(offerList, offerListOffers).setContent(),
      ];
    },
    OfferWritten: (e) => {
      const key = model.OfferListKey.fromOfferList(e.offerList);
      const offerId = new aggregates.OfferId(e.mangroveId, key, e.offer.id);

      const offerList = aggregatesPool.load(
        new aggregates.OfferListId(e.mangroveId, key)
      );
      const offerListOffers = aggregatesPool.mutate(
        new aggregates.OfferListOffersId(e.mangroveId, key),
        (x) => x.writeOffer(e.offer.id, e.offer.prev),
        undo
      );

      const offer = aggregatesPool.mutate(
        offerId,
        (x) => x.update(e.maker, e.offer),
        undo
      );
      return [
        views.offer(offer).setContent(),
        views.offerList(offerList, offerListOffers).setContent(),
      ];
    },
    TakerApprovalUpdated: (e) => {
      return [];
    },
    MakerBalanceUpdated: (e) => {
      let amountChange = new BigNumber(e.amountChange);
      if (undo)
        // handle undo logically
        amountChange = amountChange.times(-1);

      const makerId = new aggregates.MakerId(
        e.mangroveId,
        proxima.eth.Address.fromHexString(e.maker)
      );
      const maker = aggregatesPool.mutate(makerId, (x) =>
        x.changeBalance(amountChange)
      );
      return [views.maker(maker).setContent()];
    },
    MangroveParamsUpdated: (e) => {
      const mangroveId = new aggregates.MangroveId(e.mangroveId);
      const mangrove = aggregatesPool.mutate(
        mangroveId,
        (x) => x.updateParams(e.params),
        undo // let the infrastructure handle state undo
      );
      return [views.mangrove(mangrove).setContent()];
    },
    OfferListParamsUpdated: (e) => {
      const key = model.OfferListKey.fromOfferList(e.offerList);

      const offerList = aggregatesPool.mutate(
        new aggregates.OfferListId(e.mangroveId, key),
        (x) => x.updateParams(e.params),
        undo
      );
      const offerListOffers = aggregatesPool.load(
        new aggregates.OfferListOffersId(e.mangroveId, key)
      );

      return [views.offerList(offerList, offerListOffers).setContent()];
    },
  })(payload);
}
