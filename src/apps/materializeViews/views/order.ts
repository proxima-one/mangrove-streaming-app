import { DocumentUpdateBuilder, ViewBase } from "./types";
import * as aggregates from "../aggregates";

export interface OrderView extends ViewBase {
  mangroveId: string;
  offerListId: string;
  takerId: string;

  takerGot: string;
  takerGave: string;
  penalty: string;
  takenOffers: {
    id: string;
    takerWants: string;
    takerGives: string;
    posthookFailed: boolean;
    failReason?: string;
  }[];
}

export function order(
  order: aggregates.OrderAggregate
): DocumentUpdateBuilder<OrderView> {
  const orderState = order.state;
  return new DocumentUpdateBuilder<OrderView>(
    order.id.value,
    "Order",
    orderState == undefined
      ? undefined
      : {
          mangroveId: order.id.mangrove,
          offerListId: new aggregates.OfferListId(
            order.id.mangrove,
            orderState.offerList
          ).value,
          takerId: new aggregates.TakerId(
            order.id.mangrove,
            orderState.order.taker
          ).value,
          penalty: orderState.order.penalty,
          takerGave: orderState.order.takerGave,
          takerGot: orderState.order.takerGot,
          takenOffers: orderState.order.takenOffers.map((model) => {
            return {
              id: new aggregates.OfferId(
                order.id.mangrove,
                orderState.offerList,
                model.id
              ).value,
              takerWants: model.takerWants,
              takerGives: model.takerGives,
              failReason: model.failReason,
              posthookFailed: model.posthookFailed == true,
            };
          }),
        }
  );
}
