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

  public readonly value: string;

  public constructor(
    public readonly mangrove: model.core.MangroveId,
    public readonly maker: model.core.MakerId
  ) {
    this.value = `${mangrove}-${maker}`;
  }
}

interface State {
  balance: string;
}
