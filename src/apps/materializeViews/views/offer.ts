import { ViewBase } from "./types";

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
