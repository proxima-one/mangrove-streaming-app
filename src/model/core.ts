import * as eth from "./eth";

export interface OfferList {
  inboundToken: eth.Address;
  outboundToken: eth.Address;
}

export interface OfferListParams {
  active?: boolean;
  fee?: eth.UInt;
  gasbase?: eth.UInt;
  density?: eth.UInt;
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
  posthookFailed?: boolean;
}

export interface OracleState {
  gasprice?: eth.UInt;
}

export type MakerId = string;
export type TakerId = string;
export type OrderId = string;
export type OfferId = number;
export type MangroveId = eth.Address;
export type OfferFailReason =
  | "mgv/makerRevert"
  | "mgv/makerAbort"
  | "mgv/makerTransferFail"
  | "mgv/makerReceiveFail";
