import * as proxima from '@proxima-one/proxima-core';
import * as input from '../input';
import * as _ from 'lodash';
import { OfferListKey } from '../offerList';

export class TakerAggregate {
  private _state: State;

  public get state(): State {
    return this._state;
  }

  public constructor(public readonly id: TakerId, state?: State) {
    this._state = state ?? { approvals: {} };
  }

  public updateApproval(
    poolKey: OfferListKey,
    spender: proxima.eth.Address,
    amount: input.eth.UInt
  ) {
    this._state = {
      approvals: updateApproval(
        this._state.approvals,
        poolKey,
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

type Approvals = Record<string, Record<string, input.eth.UInt>>;

export function updateApproval(
  approvals: Approvals,
  poolKey: OfferListKey,
  spender: proxima.eth.Address,
  amount: input.eth.UInt
): Approvals {
  return _.merge({}, approvals, {
    [poolKey.toString()]: {
      [spender.toHexString()]: amount,
    },
  });
}

export class TakerId {
  private constructor(public readonly value: string) {}

  public static create(taker: proxima.eth.Address): TakerId {
    return new TakerId(taker.toHexString());
  }
}
