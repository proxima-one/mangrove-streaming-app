import { StreamClient } from "@proximaone/stream-client-js";
import { map } from "rxjs";

async function main() {
  const client = new StreamClient("streamdb.cluster.prod.proxima.one:443");

  // rxjs's Observable<T>
  const mangroveEvents = client
    .streamMessages("mangrove-domain-events")
    .pipe(
      map(msg => {
        return {
          payload: decodeJson(msg.payload),
          id: msg.id, // event id, can be used to continue streaming
          undo: msg.header?.undo == true,
          timestamp: msg.timestamp,
        };
      })
    );

  mangroveEvents.subscribe(x => console.log(x));
}

function decodeJson(binary: Uint8Array | string): any {
  const buffer =
    typeof binary == "string"
      ? Buffer.from(binary, "base64")
      : Buffer.from(binary);
  return JSON.parse(buffer.toString("utf8"));
}

main().catch(err => console.error(err));
