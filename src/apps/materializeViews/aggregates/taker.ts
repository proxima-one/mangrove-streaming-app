import * as proxima from "@proxima-one/proxima-core";
import * as model from "model";
import * as _ from "lodash";
import { AggregateAware } from "../../../aggregateModel";

export class TakerAggregate {
  private _state: State;

  public get state(): State {
    return this._state;
  }

  public constructor(public readonly id: TakerId, state?: State) {
    this._state = state ?? { approvals: {} };
  }

  public updateApproval(
    offerListKey: model.OfferListKey,
    spender: proxima.eth.Address,
    amount: model.eth.UInt
  ) {
    this._state = {
      approvals: updateApproval(
        this._state.approvals,
        offerListKey,
        spender,
        amount
      ),
    };
  }
}

// store all taker approvals in single aggregate,
// if state expands enormously - consider splitting to multiple aggregates like taker/pool or taker/pool/spender
export interface State {
  // [poolKey][spender] => eth.UInt
  approvals: Approvals;
}

type Approvals = Record<string, Record<string, model.eth.UInt>>;

export function updateApproval(
  approvals: Approvals,
  poolKey: model.OfferListKey,
  spender: proxima.eth.Address,
  amount: model.eth.UInt
): Approvals {
  return _.merge({}, approvals, {
    [poolKey.toString()]: {
      [spender.toHexString()]: amount,
    },
  });
}

export class TakerId implements AggregateAware<TakerId, State, TakerAggregate> {
  public readonly aggregate = TakerAggregate;
  public readonly aggregateType = "maker";

  public readonly value: string;

  public constructor(
    public readonly mangroveId: model.core.MangroveId,
    public readonly takerAddress: proxima.eth.Address
  ) {
    this.value = `${mangroveId}-${takerAddress.toHexString()}`;
  }
}
