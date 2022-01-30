import { JsonObject } from "@proxima-one/proxima-core";

export interface ViewBase extends JsonObject {
  //id: string;
}

export interface MangroveView extends ViewBase {
  params: {
    governance?: string;
    monitor?: string;
    vault?: string;
    useOracle?: boolean;
    notify?: boolean;
    gasmax?: number;
    gasprice?: number;
    dead?: boolean;
  };
}

export interface OfferListView extends ViewBase {
  mangroveId: string;
  inboundToken: string;
  outboundToken: string;
  params: {
    active?: boolean;
    fee?: string;
    gasbase?: number;
    density?: string;
  };
  offersCount: number;
  topOffers: string[];
}

export interface OfferView extends ViewBase {
  live: boolean;
  deprovisioned: boolean;

  mangroveId: string;
  prev: string;
  wants: string;
  gives: string;
  gasprice: number;
  gasreq: string;
}

export interface OrderView extends ViewBase {
  mangroveId: string;
  // todo:...
}

export interface MakerView extends ViewBase {
  mangroveId: string;
  balance: string;
}
