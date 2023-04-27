export interface Context {
  index: number;
}

export type Parser<T, TContext extends Context> = (
  ctx: TContext
) => Result<T, TContext>;

// our result types
export type Result<T, TContext extends Context> =
  | Success<T, TContext>
  | Failure<TContext>;

// on success we'll return a value of type T, and a new Ctx
// (position in the string) to continue parsing from
export type Success<T, TContext extends Context> = Readonly<{
  success: true;
  value: T;
  ctx: TContext;
}>;

// when we fail we want to know where and why
export type Failure<TContext extends Context> = Readonly<{
  success: false;
  reason: string;
  ctx: TContext;
}>;

// some convenience methods to build `Result`s for us
export function success<T, TContext extends Context>(
  ctx: TContext,
  value: T
): Success<T, TContext> {
  return { success: true, value, ctx };
}

export function failure<TContext extends Context>(
  ctx: TContext,
  reason: string
): Failure<TContext> {
  return { success: false, reason: reason, ctx };
}

// try each matcher in order, starting from the same point in the input. return the first one that succeeds.
// or return the failure that got furthest in the input string.
// which failure to return is a matter of taste, we prefer the furthest failure because.
// it tends be the most useful / complete error message.
export function any<T, TContext extends Context>(
  parsers: Parser<T, TContext>[]
): Parser<T, TContext> {
  return (ctx) => {
    let furthestRes: Result<T, TContext> | null = null;
    for (const parser of parsers) {
      const res = parser(ctx);
      if (res.success) return res;
      if (!furthestRes || furthestRes.ctx.index < res.ctx.index)
        furthestRes = res;
    }
    return furthestRes!;
  };
}

// match a parser, or succeed with null
export function optional<T, TContext extends Context>(
  parser: Parser<T, TContext>
): Parser<T | null, TContext> {
  return any([parser, (ctx) => success(ctx, null)]);
}

// look for 0 or more of something, until we can't parse any more. note that this function never fails, it will instead succeed with an empty array.
export function many<T, TContext extends Context>(
  parser: Parser<T, TContext>
): Parser<T[], TContext> {
  return (ctx) => {
    const values: T[] = [];
    let nextCtx = ctx;
    while (true) {
      const res = parser(nextCtx);
      if (!res.success) break;
      values.push(res.value);
      nextCtx = res.ctx;
    }

    return success(nextCtx, values);
  };
}

export function oneOrMore<T, TContext extends Context>(parser: Parser<T, TContext>): Parser<T[], TContext> {
  return (ctx) => {
    const values: T[] = [];
    let nextCtx = ctx;
    while (true) {
      const res = parser(nextCtx);
      if (!res.success) break;
      values.push(res.value);
      nextCtx = res.ctx;
    }
    if (values.length == 0)
      return failure(nextCtx, "there are no parsed values");

    return success(nextCtx, values);
  };
}

// look for an exact sequence of parsers, or fail
export function seq<T, TContext extends Context>(
  parsers: (Parser<T, TContext> | undefined)[]
): Parser<T[], TContext> {
  return (ctx) => {
    const values: T[] = [];
    let nextCtx = ctx;
    for (const parser of parsers.filter((x) => x) as Parser<T, TContext>[]) {
      const res = parser(nextCtx);
      if (!res.success) return res;
      values.push(res.value);
      nextCtx = res.ctx;
    }
    return success(nextCtx, values);
  };
}

// a convenience method that will map a Success to callback, to let us do common things like build AST nodes from input strings.
export function map<A, B, TContext extends Context>(
  parser: Parser<A, TContext>,
  fn: (val: A) => B
): Parser<B, TContext> {
  return (ctx) => {
    const res = parser(ctx);
    return res.success ? success(res.ctx, fn(res.value)) : res;
  };
}
