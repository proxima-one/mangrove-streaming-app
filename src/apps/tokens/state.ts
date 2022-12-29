import { StateAccessor } from "@proxima-one/proxima-app-streaming";
import { Serdes, Lookup, mapLookup } from "@proxima-one/proxima-core";

export const boolSerdes = createBoolSerdes();

export function createBoolSerdes(): Serdes<boolean> {
  return {
    serialize(val: boolean): Buffer {
      return Buffer.of(val ? 1 : 0);
    },
    deserialize(buffer: Buffer): boolean {
      return buffer[0] == 1;
    },
  };
}

export async function getStates(
  stateAccessor: StateAccessor,
  ids: string[]
): Promise<Lookup<boolean>> {
  const states = await stateAccessor.get(ids);
  return mapLookup(states, (buffer) =>
    boolSerdes.deserialize(Buffer.from(buffer))
  );
}
