import { StreamClient } from "@proximaone/stream-client-js";
import { map } from "rxjs";
import { strict as assert } from "assert";
import { DocumentUpdate, stateToDocumentUpdate } from "./documents";
import { MongoDbSink } from "./mongoDbSink";
import { barrier } from "./barrier";

const mongoDbEndpoint = process.env["MONGODB_ENDPOINT"] || "mongodb://user:pass@localhost:27017/mangrove?authSource=admin";
async function main() {
  const client = new StreamClient("streamdb.cluster.prod.proxima.one:443");

  const documentUpdatesStream = client
    .streamMessages("mangrove-views")
    .pipe(
      map(msg => {
        const undo = msg.header?.undo == true;
        assert(!undo); // no undoes by design

        const documentUpdateStates = decodeJson(msg.payload) as DocumentUpdateState[];
        return documentUpdateStates.map(stateToDocumentUpdate);
      })
    );

  // read stream to the buffer and sink buffered documents to mongodb in parallel

  const buffer: DocumentUpdate[] = [];
  let bufferWait = barrier(1);

  documentUpdatesStream.subscribe(documentUpdates => {
    buffer.push(...documentUpdates);
    bufferWait.unlock();
  });

  await sink();

  async function sink() {
    const documentSink = new MongoDbSink(mongoDbEndpoint);

    while(true) {
      await bufferWait.lock;
      bufferWait = barrier(1);

      const toSink = buffer.splice(0);

      console.log(`sinking ${toSink.length} document updates`);
      await documentSink.sinkDocumentUpdates(toSink, {ordered: true});
    }
  }
}

function decodeJson(binary: Uint8Array | string): any {
  const buffer =
    typeof binary == "string"
      ? Buffer.from(binary, "base64")
      : Buffer.from(binary);
  return JSON.parse(buffer.toString("utf8"));
}

type DocumentUpdateState = {
  i: string;
  t: string;
  c?: any;  // update content
  d?: boolean; // delete
}

main().catch(err => console.error(err));
