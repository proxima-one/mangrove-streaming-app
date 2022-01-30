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

      const makerId = aggregates.MakerId.create(
        e.mangroveId,
        proxima.eth.Address.fromHexString(e.maker)
      );
      const maker = aggregatesPool.mutate(makerId, (x) =>
        x.changeBalance(amountChange)
      );
      return [
        Views.maker(makerId.value).setContent({
          mangroveId: e.mangroveId,
          balance: maker.state.balance,
        }),
      ];
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
      const currentParams = mangrove.state.params;

      return [
        Views.mangrove(mangroveId.value).setContent({
          params: {
            governance: currentParams.governance,
            monitor: currentParams.monitor,
            vault: currentParams.vault,
            useOracle: currentParams.useOracle ?? false,
            notify: currentParams.notify ?? false,
            gasmax: currentParams.gasmax ?? 0,
            gasprice: currentParams.gasprice ?? 0,
            dead: currentParams.dead ?? false,
          },
        }),
      ];
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
      const currentParams = offerList.state.params;

      return [
        Views.offerList(offerListId.value).setContent({
          mangroveId: e.mangroveId,
          params: {
            active: currentParams.active,
            fee: currentParams.fee,
            gasbase: currentParams.gasbase,
            density: currentParams.density,
          },
          inboundToken: offerListId.key.inboundToken.toHexString(),
          outboundToken: offerListId.key.outboundToken.toHexString(),
          offersCount: 0,
          topOffers: [],
        }),
      ];
    },
  })(payload);
}

// todo: view is a function of 1 or more aggregates

class Views {
  public static mangrove(
    id: model.core.MangroveId
  ): proxima.documents.DocumentUpdateBuilder<views.MangroveView> {
    return new proxima.documents.DocumentUpdateBuilder<views.MangroveView>(
      new proxima.documents.DocumentMetadata(id, "Mangrove")
    );
  }

  public static maker(
    id: string
  ): proxima.documents.DocumentUpdateBuilder<views.MakerView> {
    return new proxima.documents.DocumentUpdateBuilder<views.MakerView>(
      new proxima.documents.DocumentMetadata(id, "Maker")
    );
  }

  public static offer(
    id: model.core.OfferId
  ): proxima.documents.DocumentUpdateBuilder<views.OfferView> {
    return new proxima.documents.DocumentUpdateBuilder<views.OfferView>(
      new proxima.documents.DocumentMetadata(id.toString(), "Offer")
    );
  }

  public static offerList(
    id: string
  ): proxima.documents.DocumentUpdateBuilder<views.OfferListView> {
    return new proxima.documents.DocumentUpdateBuilder<views.OfferListView>(
      new proxima.documents.DocumentMetadata(id.toString(), "OfferList")
    );
  }
}
