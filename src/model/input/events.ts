import * as eth from './eth';
import * as core from './core';

export type MangroveEvent = (
  | TakerApprovalUpdated
  | MakerBalanceUpdated
  | PoolParamsUpdated
  | MangroveParamsUpdated
  | OfferWritten
  | OfferRetracted
  | OrderCompleted
  | OracleStateUpdated
) & {
  tx: eth.TransactionRef;
  mangroveId: core.MangroveId; //support multiple instances in the same event stream
};

export interface TakerApprovalUpdated {
  type: 'TakerApprovalUpdated';

  owner: eth.Address;
  pool: core.Pool;
  spender: eth.Address;
  amount: eth.UInt;
}

export interface MakerBalanceUpdated {
  type: 'MakerBalanceUpdated';

  maker: eth.Address;
  amountChange: eth.Int;
}

export interface PoolParamsUpdated {
  type: 'PoolParamsUpdated';

  pool: core.Pool;
  active?: boolean;
  fee?: eth.UInt;
  gasbase?: eth.UInt;
}

export interface MangroveParamsUpdated {
  type: 'MangroveParamsUpdated';

  params: core.MangroveParams;
}

export interface OfferWritten {
  type: 'OfferWritten';

  pool: core.Pool;
  offer: core.Offer;
  maker: eth.Address;
}

export interface OfferRetracted {
  type: 'OfferRetracted';

  pool: core.Pool;
  offerId: core.OfferId;
}

export interface OrderCompleted {
  type: 'OrderCompleted';

  pool: core.Pool;
  taker: eth.Address;
  takerGot: eth.UInt;
  takerGave: eth.UInt;
  penalty: eth.UInt;
  takenOffers: core.TakenOffer[];
}

export interface OracleStateUpdated {
  type: 'OracleStateUpdated';

  state: core.OracleState;
}
