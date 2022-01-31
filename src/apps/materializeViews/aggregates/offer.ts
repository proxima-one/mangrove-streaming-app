import * as proxima from "@proxima-one/proxima-core";
import * as _ from "lodash";
import * as model from "../../../model";
import { AggregateAware } from "../../../aggregateModel";
import BigNumber from "bignumber.js";

export class OfferAggregate {
  private _state: State | undefined;

  public get state(): State | undefined {
    return this._state;
  }

  public get isLive(): boolean {
    return this._state
      ? new BigNumber(this._state.offer.gives).isGreaterThan(new BigNumber(0))
      : false;
  }

  public get isDeprovisioned(): boolean {
    return this._state ? this._state.offer.gasprice == 0 : false;
  }

  public constructor(public readonly id: OfferId, state?: State) {
    this._state = state;
  }

  public remove() {
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

  public taken(opts: { failReason: model.core.OfferFailReason | undefined }) {
    if (this._state == undefined) throw new Error("not created");

    const deprovision = opts.failReason != undefined;

    this._state = {
      ...this._state,
      offer: {
        ...this._state.offer,
        gives: new BigNumber(0).toFixed(),
        gasprice: deprovision ? 0 : this._state.offer.gasprice,
      },
    };
  }
}

export class OfferId implements AggregateAware<OfferId, State, OfferAggregate> {
  public readonly aggregate = OfferAggregate;
  public readonly aggregateType = "offer";
  public readonly value: string;

  public constructor(
    public readonly mangrove: model.core.MangroveId,
    public readonly offerList: model.core.OfferList,
    public readonly number: model.core.OfferId
  ) {
    this.value = `${mangrove}-${model.OfferListKey.fromOfferList(
      offerList
    ).toString()}-${number}`;
  }
}

interface State {
  maker: string;
  offer: model.core.Offer;
}
