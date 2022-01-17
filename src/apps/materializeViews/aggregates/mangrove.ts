import * as proxima from "@proxima-one/proxima-core";
import * as _ from "lodash";

import * as model from "@/model";

export class MangroveAggregate {
  private _state: State;

  public get state(): State {
    return this._state;
  }

  public constructor(public readonly id: MangroveId, state?: State) {
    this._state = state ?? { params: {} };
  }

  public handleParamsUpdated(paramsUpdate: model.core.MangroveParams) {
    this._state = {
      params: updateParams(this._state.params, paramsUpdate),
    };
  }
}

export interface State {
  params: model.core.MangroveParams;
}

export function updateParams(
  params: model.core.MangroveParams,
  paramsUpdate: model.core.MangroveParams
): model.core.MangroveParams {
  return _.merge({}, params, paramsUpdate); // merge doesn't override undefined values from event
}

export class MangroveId {
  private constructor(public readonly value: string) {}

  public static fromAddress(address: proxima.eth.Address): MangroveId {
    return new MangroveId(address.toHexString());
  }
}
