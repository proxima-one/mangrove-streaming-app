import * as _ from "lodash";
import { AnyBulkWriteOperation, MongoClient } from "mongodb";
import { DocumentUpdate } from "./documents";

export class MongoDbSink {
  private isConnected: boolean = false;
  private readonly client: MongoClient;

  public constructor(
    private readonly uri: string,
    private readonly dbName?: string,
    private readonly collectionPrefix?: string
  ) {
    this.client = new MongoClient(uri);
  }

  public async sinkDocumentUpdates(documentUpdates: readonly DocumentUpdate[], options: {ordered: boolean}): Promise<void> {
    if (!this.isConnected) {
      await this.client.connect();
      this.isConnected = true;
    }

    const db = this.client.db(this.dbName);

    const documentGroups = _.chain(documentUpdates)
      .groupBy(x => x.metadata.type)
      .map(x => {
        return {
          collection: this.documentTypeToCollection(x[0].metadata.type),
          documents: x
        }
      })
      .value();

    await Promise.all(documentGroups.map(async group => {
      await db.collection(group.collection).bulkWrite(group.documents.map(x => this.documentUpdateToBulkWrite(x)), {
        ordered: options.ordered,
      });
    }));
  }

  public async dispose() {
    if (this.isConnected)
      await this.client.close();
  }

  private documentUpdateToBulkWrite(documentUpdate: DocumentUpdate): AnyBulkWriteOperation<any> {
    const filter = {
      _id: documentUpdate.metadata.id
    };

    const action = documentUpdate.updateAction;

    if (action.type === "setContent")
      return {
        replaceOne: {
          filter: filter,
          replacement: _.assign({}, action.content, { _id: documentUpdate.metadata.id}),
          upsert: true
        }
      };
    if (action.type === "delete")
      return {
        deleteOne: { filter: filter }
      };

    throw new Error("not implemented");
  }

  private documentTypeToCollection(type: string) {
    return this.collectionPrefix ? `${this.collectionPrefix}-${type}` : type;
  }
}
