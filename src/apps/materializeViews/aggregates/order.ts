import * as proxima from "@proxima-one/proxima-core";
import * as _ from "lodash";
import * as model from "model";
import { AggregateAware } from "aggregateModel";

export class OrderAggregate {
  private _state: State | undefined;

  public get state(): State | undefined {
    return this._state;
  }

  public constructor(public readonly id: OrderId, state?: State) {
    this._state = state;
  }

  public create(offerList: model.core.OfferList, order: model.core.Order) {
    if (this._state != undefined)
      throw new Error(`order ${this.id.value} is already created`);

    this._state = {
      order: order,
      offerList: offerList,
    };
  }
}

export class OrderId implements AggregateAware<OrderId, State, OrderAggregate> {
  public readonly aggregate = OrderAggregate;
  public readonly aggregateType = "order";
  public readonly value: string;

  public constructor(
    public readonly mangrove: model.core.MangroveId,
    public readonly order: model.core.OrderId
  ) {
    this.value = `${mangrove}-${order}`;
  }
}

interface State {
  order: model.core.Order;
  offerList: model.core.OfferList;
}
