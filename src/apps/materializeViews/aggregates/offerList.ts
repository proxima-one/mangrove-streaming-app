import * as proxima from "@proxima-one/proxima-core";
import * as _ from "lodash";
import * as model from "model";
import { AggregateAware } from "aggregateModel";

export class OfferListAggregate {
  private _state: State;

  public get state(): State {
    return this._state;
  }

  public constructor(public readonly id: OfferListId, state?: State) {
    this._state = state ?? { params: {} };
  }

  public updateParams(paramsUpdate: model.core.OfferListParams) {
    this._state = {
      params: updateParams(this._state.params, paramsUpdate),
    };
  }
}

export class OfferListId
  implements AggregateAware<OfferListId, State, OfferListAggregate>
{
  public readonly aggregate = OfferListAggregate;
  public readonly aggregateType = "offerlist";
  public readonly value: string;

  public constructor(
    public readonly mangroveId: model.core.MangroveId,
    public readonly key: model.OfferListKey
  ) {
    this.value = `${mangroveId}-${key.toString()}`;
  }
}

interface State {
  params: model.core.OfferListParams;
}

export function updateParams(
  params: model.core.OfferListParams,
  paramsUpdate: model.core.OfferListParams
): model.core.OfferListParams {
  return _.merge({}, params, paramsUpdate); // merge doesn't override undefined values from event
}
