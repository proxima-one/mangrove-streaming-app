import * as proxima from "@proxima-one/proxima-core";
import * as _ from "lodash";
import * as model from "model";
import { AggregateAware } from "aggregateModel";
import BigNumber from "bignumber.js";

export class OfferAggregate {
  private _state: State | undefined;

  public get state(): State | undefined {
    return this._state;
  }

  public get isLive(): boolean {
    return this._state ? new BigNumber(this._state.offer.gives).isGreaterThan(new BigNumber(0)) : false;
  }

  public get isDeprovisioned(): boolean {
    return this._state ? this._state.offer.gasprice == 0 : false;
  }

  public constructor(public readonly id: OfferId, state?: State) {
    this._state = state;
  }

  public remove() {
    if (this._state == undefined)
      throw new Error("can't remove not existing order");

    this._state = undefined;
  }

  public update(maker: string, offer: model.core.Offer) {
    if (this._state == undefined) {
      this._state = { maker: maker, offer: offer };
    } else {
      if (this._state.maker != maker) throw new Error("can't update maker");

      this._state = { ...this._state, offer: offer };
    }
  }
}

export class OfferId implements AggregateAware<OfferId, State, OfferAggregate> {
  public readonly aggregate = OfferAggregate;
  public readonly aggregateType = "offer";
  public readonly value: string;

  public constructor(
    public readonly mangroveId: model.core.MangroveId,
    public readonly key: model.OfferListKey,
    public readonly number: model.core.OfferId
  ) {
    this.value = `${mangroveId}-${key.toString()}-${number}`;
  }
}

interface State {
  maker: string;
  offer: model.core.Offer;
}
