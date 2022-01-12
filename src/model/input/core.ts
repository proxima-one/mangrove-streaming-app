import * as eth from './eth';

export interface Pool {
  inboundToken: eth.Address;
  outboundToken: eth.Address;
}

export interface Offer {
  id: OfferId;
  prev: OfferId;
  wants: eth.UInt;
  gives: eth.UInt;
  gasprice: eth.UInt;
  gasreq: eth.UInt;
}

export interface MangroveParams {
  governance?: eth.Address;
  monitor?: eth.Address;
  vault?: eth.Address;
  useOracle?: boolean;
  notify?: boolean;
  gasmax?: eth.UInt;
  gasprice?: eth.UInt;
  dead?: boolean;
}

export interface TakenOffer {
  id: OfferId;
  takerWants: eth.UInt;
  takerGives: eth.UInt;
  failReason?: OfferFailReason;
}

export type OfferId = number;
export type MangroveId = eth.Address;
export type OfferFailReason =
  | 'mgv/makerRevert'
  | 'mgv/makerAbort'
  | 'mgv/makerTransferFail'
  | 'mgv/makerReceiveFail';
