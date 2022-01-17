import * as proxima from "@proxima-one/proxima-core";
import * as core from "./core";
import { strict as assert } from "assert";

export class OfferListKey {
  public constructor(
    public readonly inboundToken: proxima.eth.Address,
    public readonly outboundToken: proxima.eth.Address
  ) {}

  public toString(): string {
    return `${this.inboundToken.toHexString()}-${this.outboundToken.toHexString()}`;
  }

  public static fromOfferList(pool: core.OfferList) {
    return new OfferListKey(
      proxima.eth.Address.fromHexString(pool.inboundToken),
      proxima.eth.Address.fromHexString(pool.outboundToken)
    );
  }

  public static parse(value: string): OfferListKey {
    const parts = value.split("-");

    assert(parts.length == 2);

    return new OfferListKey(
      proxima.eth.Address.fromHexString(parts[0]),
      proxima.eth.Address.fromHexString(parts[1])
    );
  }
}
