import * as proxima from "@proxima-one/proxima-core";
import * as _ from "lodash";
import * as model from "model";
import { AggregateAware } from "aggregateModel";

export class OfferListOffersAggregate {
  private _state: State;

  public get state(): State {
    return this._state;
  }

  public constructor(public readonly id: OfferListOffersId, state?: State) {
    this._state = state ?? { offers: [] };
  }

  public writeOffer(id: model.core.OfferId, prev: model.core.OfferId) {
    const idx = this._state.offers.findIndex((x) => x == prev);
    this._state = {
      ...this._state,
      offers: [
        ...this._state.offers.slice(0, idx + 1).filter(x => x != id),
        id,
        ...this._state.offers.slice(idx + 1).filter(x => x != id),
      ],
    };
  }

  public removeOffer(id: model.core.OfferId) {
    const idx = this._state.offers.findIndex((x) => x == id);
    if (idx < 0)
      return;

    this._state = {
      ...this._state,
      offers: [
        ...this._state.offers.slice(0, idx),
        ...this._state.offers.slice(idx + 1),
      ],
    };
  }
}

export class OfferListOffersId
  implements AggregateAware<OfferListOffersId, State, OfferListOffersAggregate>
{
  public readonly aggregate = OfferListOffersAggregate;
  public readonly aggregateType = "offerlistoffers";
  public readonly value: string;

  public constructor(
    public readonly mangroveId: model.core.MangroveId,
    public readonly key: model.OfferListKey
  ) {
    this.value = `${mangroveId}-${key.toString()}`;
  }
}

interface State {
  offers: model.core.OfferId[];
}
