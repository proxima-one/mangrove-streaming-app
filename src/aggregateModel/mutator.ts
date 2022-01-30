import {
  Aggregate,
  AggregateAware,
  AggregateConstructor,
  AggregateId,
  AggregateStateStore,
} from "./types";

export class AggregatesPool {
  public constructor(private readonly stateStore: AggregateStateStore) {}

  /**
   * if undo = false mutator will load aggregate and calls mutator func, else mutator will rollback state automatically and always return
   * returns Aggregate with an updated state
   * @param id - Unique Id of the Aggregate to mutate
   * @param mutator - Custom func to be executed on the Aggregate
   * @param undo - If true - Aggregate's state will be rollbacked. Mutator func isn't called in this case
   */

  public mutate<
    TId extends AggregateId & AggregateAware<TId, TState, TAggregate>,
    TState,
    TAggregate extends Aggregate<TId, TState>
  >(
    id: TId & AggregateAware<TId, TState, TAggregate>,
    mutator: (aggregate: TAggregate) => void,
    undo: boolean = false
  ): TAggregate {
    if (undo) {
      this.rollback(id);
      return this.load(id, id.aggregate);
    } else {
      const aggregate = this.load(id, id.aggregate);
      mutator(aggregate);
      this.store(aggregate);
      return aggregate;
    }
  }

  private load<
    TId extends AggregateId,
    TState,
    TAggregate extends Aggregate<TId, TState>
  >(
    id: TId,
    constructor: AggregateConstructor<TId, TState, TAggregate>
  ): TAggregate {
    const state = this.stateStore.get(id);
    return new constructor(id, state);
  }

  private store<
    TId extends AggregateId,
    TState,
    TAggregate extends Aggregate<TId, TState>
  >(aggregate: TAggregate) {
    this.stateStore.update(aggregate.id, aggregate.state);
  }

  private rollback<TId extends AggregateId, TState>(id: TId): TState {
    return this.stateStore.rollback(id);
  }
}
