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
      return [];
    },
    OfferRetracted: (e) => {
      return [];
    },
    OfferWritten: (e) => {
      return [];
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
      const mangroveId = aggregates.MangroveId.fromAddress(
        proxima.eth.Address.fromHexString(e.mangroveId)
      );
      const mangrove = aggregatesPool.mutate(
        mangroveId,
        (x) => x.updateParams(e.params),
        undo // let the infrastructure handle state undo
      );
      return [views.mangrove(mangrove).setContent()];
    },
    OfferListParamsUpdated: (e) => {
      const offerListId = new aggregates.OfferListId(
        e.mangroveId,
        model.OfferListKey.fromOfferList(e.offerList)
      );

      const offerList = aggregatesPool.mutate(
        offerListId,
        (x) => x.updateParams(e.params),
        undo
      );

      return [views.offerList(offerList).setContent()];
    },
  })(payload);
}
