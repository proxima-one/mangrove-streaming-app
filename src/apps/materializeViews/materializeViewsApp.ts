import * as proxima from "@proxima-one/proxima-core";
import * as model from "model";
import * as aggregatesModel from "aggregateModel";
import { handleDomainEvent } from "./handlers";
import { State } from "./state";

interface Args extends proxima.EventStreamingAppBaseArgs {}

export class MaterializeViewsApp extends proxima.EventStreamingAppBase<
  model.events.DomainEvent,
  State,
  Args
> {
  public constructor(env: proxima.StreamingAppEnvironment, args: Args) {
    super(env, args);
  }

  protected async initialize(): Promise<void> {
    return await super.initialize();
  }

  protected initialState(): State | undefined {
    return new State(new aggregatesModel.AggregatesState());
  }

  protected messageToSourceEvent(
    message: proxima.SourceMessage
  ): proxima.SourceEvent<model.events.DomainEvent> {
    return domainEventsConverter.messageToSourceEvent(message);
  }

  protected snapshotState(
    state: State
  ): proxima.snapshots.SnapshotContent | undefined {
    return state.createSnapshot();
  }

  protected restoreStateFromSnapshot(
    snapshotContent: proxima.snapshots.SnapshotContent
  ): State | undefined {
    return State.fromSnapshot(snapshotContent);
  }

  protected outputStreams(): string[] {
    return ["views"];
  }

  protected applyEvents(
    eventList: proxima.EventList<model.events.DomainEvent>,
    state: State
  ): proxima.ApplyEventsResult {
    const aggregatesMutator = new aggregatesModel.AggregatesMutator(
      state.aggregatesState
    );
    const documentUpdates = eventList.items.flatMap((x) =>
      handleDomainEvent(aggregatesMutator, x)
    );

    const reducedUpdates =
      proxima.documents.DocumentUpdatesReducer.reduce(documentUpdates);
    console.log(
      `generated ${documentUpdates.length} document updates. reduced to ${reducedUpdates.length}`
    );

    const lastEvent = eventList.lastItem;
    return new proxima.AppliedAllMessages([
      {
        stream: "views",
        messages: reducedUpdates.map((x) => {
          return {
            value: proxima.documents.documentUpdatesSerdes.serialize([x]),
            timestamp: lastEvent?.timestamp?.toString(),
          };
        }),
      },
    ]);
  }
}

const domainEventsConverter = new proxima.StreamEventConverter(
  proxima.createSimpleJsonSerdes<model.events.DomainEvent>()
);
