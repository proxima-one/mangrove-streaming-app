import { AggregateId, AggregateState, AggregateStateStore } from "./types";

export type AggregateStateStack = AggregateState[];

/**
 * Simple In-Memory store for all aggregates
 */
export class AggregatesState implements AggregateStateStore {
  // to allow fast rollbacks
  stackSize = 10 as const;

  public constructor(
    public readonly aggregates: Record<
      string,
      Record<string, AggregateStateStack>
    > = {}
  ) {}

  public get(id: AggregateId): AggregateState | undefined {
    const stack = this.aggregates[id.aggregateType]?.[id.value];
    if (stack == undefined || stack.length == 0) return undefined;
    return stack[stack.length - 1];
  }

  public rollback(id: AggregateId): AggregateState {
    const stack = this.aggregates[id.aggregateType]?.[id.value];
    if (!stack || stack.length == 0)
      throw new Error("FATAL! Can't rollback state");

    return stack.pop()!;
  }

  public update(id: AggregateId, state: AggregateState) {
    let aggregates = this.aggregates[id.aggregateType];
    if (aggregates == undefined)
      aggregates = this.aggregates[id.aggregateType] = {};

    let stack = aggregates[id.value];
    if (stack == undefined) stack = aggregates[id.value] = [];

    stack.push(state);
    if (stack.length > this.stackSize) stack.splice(0, 1);
  }
}
