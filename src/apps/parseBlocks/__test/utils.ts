import BigNumber from "bignumber.js";
import { Context, Parser, Result, Success } from "../parser";
import { LogParserContext, PartialMangroveEvent } from "../mangroveLogsParser";
import { EthModel } from "@proxima-one/proxima-plugin-eth";

export const createParserRunner =
  <T, TContext extends Context>(parser: Parser<T, TContext>) =>
  (ctx: TContext, expected: Omit<Result<T, TContext>, "ctx">) => {
    const actual = parser(ctx);

    expect(actual.success).toBe(expected.success);

    if (expected.success) {
      if (!actual.success) fail("Expected Success Result. Got Failure");

      expect(actual.value).toEqual((expected as any).value);
    } else {
      if (actual.success) fail("Expected Failure Result. Got Success");

      expect(actual.reason).toEqual((expected as any).reason);
    }
  };

export type ValueType = string | number | boolean | BigNumber;

export function guessEthValueType(value: ValueType): string {
  if (typeof value == "string") {
    if (value.startsWith("0x")) {
      if (value.length == 42) return "address";
      return "uint" + (value.length - 2) * 4;
    }
    return "string";
  }

  if (typeof value == "number") {
    return value < 0 ? "int64" : "uint64";
  }

  if (typeof value == "boolean") return "bool";

  return value.isNegative() ? "int256" : "uint256";
}

export function parseParams(
  params: Record<string, ValueType>
): EthModel.LogParameter[] {
  const res: EthModel.LogParameter[] = [];
  for (const [key, val] of Object.entries(params)) {
    const ethType = guessEthValueType(val);
    res.push(
      new EthModel.LogParameter(
        key,
        ethType,
        BigNumber.isBigNumber(val) ? val.toString() : val
      )
    );
  }
  return res;
}

export const events = (
  events: PartialMangroveEvent[]
): Omit<Success<PartialMangroveEvent[], LogParserContext>, "ctx"> => {
  return {
    success: true,
    value: events,
  };
};
