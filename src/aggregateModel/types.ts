// useful conventions for better type inference & intellisense support

export type AggregateState = any; // todo: make sure it's json serializable

export interface AggregateId {
  value: string;
  aggregateType: string;
}

export interface AggregateAware<
  TId extends AggregateId,
  TState,
  TAggregate extends Aggregate<TId, TState>
> {
  aggregate: AggregateConstructor<TId, TState, TAggregate>;
}

export interface Aggregate<TId extends AggregateId, TState> {
  id: TId;
  state: TState | undefined;
}

export interface AggregateConstructor<
  TId extends AggregateId,
  TState,
  TAggregate extends Aggregate<TId, TState>
> {
  new (id: TId, state: TState | undefined): TAggregate;
}

export interface AggregateStateStore {
  get(id: AggregateId): AggregateState | undefined;
  update(id: AggregateId, state: AggregateState | undefined): AggregateState;
  rollback(id: AggregateId): AggregateState;
}
