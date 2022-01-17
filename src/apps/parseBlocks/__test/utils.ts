import BigNumber from 'bignumber.js';
import * as proxima from '@proxima-one/proxima-core';
import * as model from '../../../model';
import { Context, Parser, Result, Success } from '../parser';
import { LogParserContext } from '../mangroveLogsParser';

export const createParserRunner =
  <T, TContext extends Context>(parser: Parser<T, TContext>) =>
  (ctx: TContext, expected: Omit<Result<T, TContext>, 'ctx'>) => {
    const actual = parser(ctx);

    expect(actual.success).toBe(expected.success);

    if (expected.success) {
      if (!actual.success) fail('Expected Success Result. Got Failure');

      expect(actual.value).toEqual((expected as any).value);
    } else {
      if (actual.success) fail('Expected Failure Result. Got Success');

      expect(actual.reason).toEqual((expected as any).reason);
    }
  };

export type ValueType = string | number | boolean | BigNumber;

export function guessEthValueType(value: ValueType): string {
  if (typeof value == 'string') {
    if (value.startsWith('0x')) {
      if (value.length == 42) return 'address';
      return 'uint' + (value.length - 2) * 4;
    }
    return 'string';
  }

  if (typeof value == 'number') {
    return value < 0 ? 'int64' : 'uint64';
  }

  if (typeof value == 'boolean') return 'bool';

  return value.isNegative() ? 'int256' : 'uint256';
}

export function parseParams(
  params: Record<string, ValueType>
): proxima.eth.EventParameter[] {
  const res: proxima.eth.EventParameter[] = [];
  for (const [key, val] of Object.entries(params)) {
    const ethType = guessEthValueType(val);
    res.push(
      new proxima.eth.EventParameter(
        key,
        ethType,
        BigNumber.isBigNumber(val) ? val.toString() : val
      )
    );
  }
  return res;
}

export const events = (
  events: model.input.events.MangroveEvent[]
): Omit<
  Success<model.input.events.MangroveEvent[], LogParserContext>,
  'ctx'
> => {
  return {
    success: true,
    value: events,
  };
};
