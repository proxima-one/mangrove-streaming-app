import * as proxima from '@proxima-one/proxima-core';
import * as input from './input';
import { strict as assert } from 'assert';

export class PoolKey {
  public constructor(
    public readonly inboundToken: proxima.eth.Address,
    public readonly outboundToken: proxima.eth.Address
  ) {}

  public toString(): string {
    return `${this.inboundToken.toHexString()}-${this.outboundToken.toHexString()}`;
  }

  public static fromPool(pool: input.core.Pool) {
    return new PoolKey(
      proxima.eth.Address.fromHexString(pool.inboundToken),
      proxima.eth.Address.fromHexString(pool.outboundToken)
    );
  }

  public static parse(value: string): PoolKey {
    const parts = value.split('-');

    assert(parts.length == 2);

    return new PoolKey(
      proxima.eth.Address.fromHexString(parts[0]),
      proxima.eth.Address.fromHexString(parts[1])
    );
  }
}
