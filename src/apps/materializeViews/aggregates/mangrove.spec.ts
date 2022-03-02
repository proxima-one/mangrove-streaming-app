import * as proxima from "@proxima-one/proxima-core";
import * as model from "model";
import { MangroveAggregate, MangroveId, updateParams } from "./mangrove";

describe("MangroveAggregate", () => {
  const addr = proxima.eth.Address.fromHexString(
    "0xD27139C60ED051b65c3AEe193BCABFfa1067D243"
  );

  let sut: MangroveAggregate;
  describe("handle MangroveParamsUpdated event", () => {
    let paramsUpdate: model.core.MangroveParams;
    let act: () => void;

    beforeEach(() => {
      paramsUpdate = {
        gasprice: 100,
      };
      act = () => sut.updateParams(paramsUpdate);
    });

    describe("when state is empty", () => {
      beforeEach(() => {
        sut = new MangroveAggregate(new MangroveId(addr.toHexString()));
      });

      it("should create new state and set params", () => {
        act();
        expect(sut.state).toBeTruthy();
        expect(sut.state.params.gasprice).toBe(paramsUpdate.gasprice);
      });
    });
  });
});

describe("updateParams", () => {
  it("should update not undefined params", function () {
    const actual = updateParams(
      {
        vault: "0x1123",
        dead: false,
        monitor: "0x1111",
      },
      {
        dead: undefined,
        monitor: "0x2222",
      }
    );

    expect(actual.dead).toBe(false);
    expect(actual.vault).toBe("0x1123");
    expect(actual.monitor).toBe("0x2222");
  });
});
