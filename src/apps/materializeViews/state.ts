import * as aggregatesModel from "@/aggregateModel";
import * as proxima from "@proxima-one/proxima-core";

export class State {
  public constructor(
    public readonly aggregatesState: aggregatesModel.AggregatesState
  ) {}

  // TODO: split snapshot to multiple content parts
  public createSnapshot(): proxima.snapshots.SnapshotContent {
    return proxima.snapshots.SnapshotContent.singleJsonObject({
      aggregates: this.aggregatesState.aggregates,
    });
  }

  public static fromSnapshot(
    snapshotContent: proxima.snapshots.SnapshotContent
  ): State {
    const json = snapshotContent.toSingleJsonObject() as {
      aggregates: Record<
        string,
        Record<string, aggregatesModel.AggregateStateStack>
      >;
    };
    return new State(new aggregatesModel.AggregatesState(json.aggregates));
  }
}
