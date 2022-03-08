import * as eth from "./eth";
import * as core from "./core";

export type DomainEvent = MangroveEvent & {
  tx?: eth.TransactionRef;
  mangroveId?: core.MangroveId; //support multiple instances in the same event stream
};

export type MangroveEvent = (
  | TakerApprovalUpdated
  | MakerBalanceUpdated
  | OfferListParamsUpdated
  | MangroveCreated
  | MangroveParamsUpdated
  | OfferWritten
  | OfferRetracted
  | OrderCompleted
) & {
  parentOrderId?: core.OrderId; // not empty in case event is emitted in callback/posthook functions
};

export interface TakerApprovalUpdated {
  type: "TakerApprovalUpdated";

  owner: eth.Address;
  offerList: core.OfferList;
  spender: eth.Address;
  amount: eth.UInt;
}

export interface MakerBalanceUpdated {
  type: "MakerBalanceUpdated";

  maker: core.MakerId;
  amountChange: eth.Int;
}

export interface OfferListParamsUpdated {
  type: "OfferListParamsUpdated";

  offerList: core.OfferList;
  params: core.OfferListParams;
}

export interface MangroveParamsUpdated {
  type: "MangroveParamsUpdated";

  params: core.MangroveParams;
}

export interface MangroveCreated {
  type: "MangroveCreated";

  id: string;
  chain: {
    name: string;
    chainlistId: number;
  };
  address: string;
}

export interface OfferWritten {
  type: "OfferWritten";

  offerList: core.OfferList;
  offer: core.Offer;
  maker: core.MakerId;
}

export interface OfferRetracted {
  type: "OfferRetracted";

  offerList: core.OfferList;
  offerId: core.OfferId;
}

export interface OrderCompleted {
  type: "OrderCompleted";

  id: core.OrderId;
  offerList: core.OfferList;
  order: core.Order;
}

//
// export interface OracleStateUpdated {
//   type: 'OracleStateUpdated';
//
//   state: core.OracleState;
// }
