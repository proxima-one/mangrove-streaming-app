import * as proxima from "@proxima-one/proxima-core";
import * as model from "../../model";
import * as utils from "@proxima-one/proxima-utils";
import * as views from "./views";
import * as aggregates from "./aggregates";
import BigNumber from "bignumber.js";
import * as aggregatesModel from "aggregateModel";
import { strict as assert } from "assert";

const domainEventMatcher =
  utils.createPatternMatcher<model.events.DomainEvent>();

export function handleDomainEvent(
  aggregatesPool: aggregatesModel.AggregatesPool,
  { undo, timestamp, payload }: proxima.Event<model.events.DomainEvent>
): ReadonlyArray<proxima.documents.DocumentUpdate> {
  //console.log(JSON.stringify(payload));

  return domainEventMatcher({
    MangroveCreated: (e) => {
      return [];
    },
    OrderCompleted: (e) => {
      assert(e.mangroveId);
      const order = aggregatesPool.mutate(
        new aggregates.OrderId(e.mangroveId, e.id),
        (x) => x.create(e.offerList, e.order),
        undo
      );

      const takenOffers: aggregates.OfferAggregate[] = [];
      for (const offer of e.order.takenOffers) {
        const takenOffer = aggregatesPool.mutate(
          new aggregates.OfferId(e.mangroveId, e.offerList, offer.id),
          (x) => x.taken({ failReason: offer.failReason }),
          undo
        );

        takenOffers.push(takenOffer);
      }

      const offerList = aggregatesPool.load(
        new aggregates.OfferListId(e.mangroveId, e.offerList)
      );
      const offerListOffers = aggregatesPool.mutate(
        new aggregates.OfferListOffersId(e.mangroveId, e.offerList),
        (x) => x.removeOffers(e.order.takenOffers.map((x) => x.id)),
        undo
      );

      return [
        views.order(order).setContent(),
        ...takenOffers.map((offer) => views.offer(offer).setContent()),
        views.offerList(offerList, offerListOffers).setContent(),
      ];
    },
    OfferRetracted: (e) => {
      assert(e.mangroveId);
      const offerId = new aggregates.OfferId(
        e.mangroveId,
        e.offerList,
        e.offerId
      );

      const offerList = aggregatesPool.load(
        new aggregates.OfferListId(e.mangroveId, e.offerList)
      );
      const offerListOffers = aggregatesPool.mutate(
        new aggregates.OfferListOffersId(e.mangroveId, e.offerList),
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
      assert(e.mangroveId);
      const offerId = new aggregates.OfferId(
        e.mangroveId,
        e.offerList,
        e.offer.id
      );

      const offerList = aggregatesPool.load(
        new aggregates.OfferListId(e.mangroveId, e.offerList)
      );
      const offerListOffers = aggregatesPool.mutate(
        new aggregates.OfferListOffersId(e.mangroveId, e.offerList),
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
      assert(e.mangroveId);
      const key = model.OfferListKey.fromOfferList(e.offerList);
      const taker = aggregatesPool.mutate(
        new aggregates.TakerId(e.mangroveId, e.owner),
        (x) =>
          x.updateApproval(
            key,
            proxima.eth.Address.fromHexString(e.spender),
            e.amount
          ),
        undo
      );

      return [views.taker(taker).setContent()];
    },
    MakerBalanceUpdated: (e) => {
      assert(e.mangroveId);
      let amountChange = new BigNumber(e.amountChange);
      if (undo)
        // handle undo logically
        amountChange = amountChange.times(-1);

      const makerId = new aggregates.MakerId(e.mangroveId, e.maker);
      const maker = aggregatesPool.mutate(makerId, (x) =>
        x.changeBalance(amountChange)
      );
      return [views.maker(maker).setContent()];
    },
    MangroveParamsUpdated: (e) => {
      assert(e.mangroveId);
      const mangroveId = new aggregates.MangroveId(e.mangroveId);
      const mangrove = aggregatesPool.mutate(
        mangroveId,
        (x) => x.updateParams(e.params),
        undo // let the infrastructure handle state undo
      );
      return [views.mangrove(mangrove).setContent()];
    },
    OfferListParamsUpdated: (e) => {
      assert(e.mangroveId);
      const offerList = aggregatesPool.mutate(
        new aggregates.OfferListId(e.mangroveId, e.offerList),
        (x) => x.updateParams(e.params),
        undo
      );
      const offerListOffers = aggregatesPool.load(
        new aggregates.OfferListOffersId(e.mangroveId, e.offerList)
      );

      return [views.offerList(offerList, offerListOffers).setContent()];
    },
  })(payload);
}
