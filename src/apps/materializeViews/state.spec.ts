import { State } from "./state";
import { AggregatesState } from "../../aggregateModel";

describe("State", () => {
  it("should create snapshot and restore", () => {
    const sut = new State(
      new AggregatesState({
        mangrove: {
          testnet: [
            {
              version: "1",
              dead: false,
            },
          ],
        },
        maker: {
          "0x001": [
            { version: "1", balance: "1" },
            { version: "2", balance: "100" },
          ],
        },
      })
    );

    const snapshot = sut.createSnapshot();
    const restored = State.fromSnapshot(snapshot);

    expect(restored).toEqual(sut);
  });
});
