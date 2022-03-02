import * as _ from "lodash";

export class DocumentUpdate {
  public constructor(
    public readonly metadata: DocumentMetadata,
    public readonly updateAction: UpdateAction
  ) { }
}

export class DocumentMetadata {
  public constructor(
    public readonly id: string,
    public readonly type: string
  ) { }

  public get uniqueKey() {
    return `${this.type}-${this.id}`;
  }
}

export type DocumentContent = any;

export type UpdateAction = SetDocumentContent | DeleteDocument;

export class SetDocumentContent {
  type = "setContent" as const;

  public constructor(
    public readonly content: DocumentContent
  ) { }
}

export class DeleteDocument {
  type = "delete" as const;
}

export class DocumentUpdatesReducer {
  public static reduce(actions: ReadonlyArray<DocumentUpdate>): ReadonlyArray<DocumentUpdate> {
    const aggregatedActions: Record<string, [DocumentUpdate, number]> = {};
    for (let i = 0; i < actions.length; i++) {
      const action = actions[i];
      aggregatedActions[action.metadata.uniqueKey] = [action, i];
    }

    return _.chain(_.values(aggregatedActions))
      .orderBy(x => x[1])
      .map(x => x[0])
      .value();
  }
}

export function stateToDocumentUpdate(state: DocumentUpdateState): DocumentUpdate {
  return new DocumentUpdate(
    new DocumentMetadata(
      state.i,
      state.t,
    ),
    state.d ? new DeleteDocument() : new SetDocumentContent(state.c!)
  );
}

export type DocumentUpdateState = {
  i: string;
  t: string;
  c?: any;
  d?: boolean;
}
