import * as eth from "./eth";

export interface OfferList {
  inboundToken: eth.Address;
  outboundToken: eth.Address;
}

export interface OfferListParams {
  active?: boolean;
  fee?: eth.UInt;
  gasbase?: number; // todo: 24 bits
  density?: eth.UInt;
}

export interface Offer {
  id: OfferId;
  prev: OfferId;
  wants: eth.UInt;
  gives: eth.UInt;
  gasprice: number; // todo: 16 bits
  gasreq: number; // todo: 24 bits
}

export interface MangroveParams {
  governance?: eth.Address;
  monitor?: eth.Address;
  vault?: eth.Address;
  useOracle?: boolean;
  notify?: boolean;
  gasmax?: number; //todo: 24 bits
  gasprice?: number; //todo: 16 bits
  dead?: boolean;
}

export interface Order {
  taker: TakerId;
  takerGot: eth.UInt;
  takerGave: eth.UInt;
  penalty: eth.UInt;
  takenOffers: TakenOffer[];
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
