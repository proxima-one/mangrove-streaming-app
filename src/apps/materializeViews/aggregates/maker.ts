import * as proxima from "@proxima-one/proxima-core";
import * as model from "model";
import { AggregateAware } from "aggregateModel";
import BigNumber from "bignumber.js";

export class MakerAggregate {
  private _state: State;

  public get state(): State {
    return this._state;
  }

  public constructor(public readonly id: MakerId, state?: State) {
    this._state = state ?? { balance: "0" };
  }

  public changeBalance(deltaAmount: BigNumber) {
    const currentBalance = new BigNumber(this._state.balance);
    this._state = {
      ...this._state,
      balance: currentBalance.plus(deltaAmount).toFixed(),
    };
  }
}

export class MakerId implements AggregateAware<MakerId, State, MakerAggregate> {
  public readonly aggregate = MakerAggregate;
  public readonly aggregateType = "maker";

  private constructor(public readonly value: string) {}

  public static create(
    mangrove: model.core.MangroveId,
    makerAddress: proxima.eth.Address
  ): MakerId {
    return new MakerId(`${mangrove}-${makerAddress.toHexString()}`);
  }
}

interface State {
  balance: string;
}
