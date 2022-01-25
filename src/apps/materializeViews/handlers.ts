import * as proxima from "@proxima-one/proxima-core";
import * as model from "model";
import * as utils from "@proxima-one/proxima-utils";
import * as views from "./views";
import * as aggregates from "./aggregates";
import * as aggregatesModel from "aggregateModel";

const domainEventMatcher =
  utils.createPatternMatcher<model.events.DomainEvent>();

export function handleDomainEvent(
  aggregatesMutator: aggregatesModel.AggregatesMutator,
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
      return [];
    },
    MangroveParamsUpdated: (e) => {
      const mangroveId = aggregates.MangroveId.fromAddress(
        proxima.eth.Address.fromHexString(e.mangroveId)
      );
      const mangrove = aggregatesMutator.mutate(
        mangroveId,
        (x) => x.handleParamsUpdated(e.params),
        undo
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
      return [];
    },
  })(payload);
}

class Views {
  public static mangrove(
    id: model.core.MangroveId
  ): proxima.documents.DocumentUpdateBuilder<views.MangroveView> {
    return new proxima.documents.DocumentUpdateBuilder<views.MangroveView>(
      new proxima.documents.DocumentMetadata(id, "Mangrove")
    );
  }

  public static offer(
    id: model.core.OfferId,
    mangroveId: model.core.MangroveId
  ): proxima.documents.DocumentUpdateBuilder<views.OfferView> {
    return new proxima.documents.DocumentUpdateBuilder<views.OfferView>(
      new proxima.documents.DocumentMetadata(id.toString(), "Offer")
    );
  }

  public static offerList(
    id: model.core.OfferList,
    mangroveId: model.core.MangroveId
  ): proxima.documents.DocumentUpdateBuilder<views.OfferView> {
    return new proxima.documents.DocumentUpdateBuilder<views.OfferView>(
      new proxima.documents.DocumentMetadata(id.toString(), "Offer")
    );
  }
}
