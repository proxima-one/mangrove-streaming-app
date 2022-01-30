import { handleDomainEvent } from "./handlers";
import * as aggregatesModel from "../../aggregateModel";
import * as proxima from "@proxima-one/proxima-core";
import * as model from "../../model";
import * as views from "./views";

describe("handleDomainEvent", () => {
  let aggregatesState: aggregatesModel.AggregatesState;
  let mutator: aggregatesModel.AggregatesPool;
  let producedDocumentUpdates: proxima.documents.DocumentUpdate[];

  const mangroveAddress = proxima.eth.Address.fromHexString(
    "0xD27139C60ED051b65c3AEe193BCABFfa1067D243"
  );
  const txRef = {
    blockNumber: 1,
    blockHash:
      "0x4e38c8e9f0bbee19230da436008afa0387aaf2abcbdfa25f936915cc9b614a40",
    txHash:
      "0x4e38c8e9f0bbee19230da436008afa0387aaf2abcbdfa25f936915cc9b614a40",
    from: "0xc2be4ec20253b8642161bc3f444f53679c1f3d47",
  };

  beforeEach(() => {
    aggregatesState = new aggregatesModel.AggregatesState();
    mutator = new aggregatesModel.AggregatesPool(aggregatesState);
    producedDocumentUpdates = [];
  });

  function handle(
    payload: model.events.DomainEvent,
    opts?: { undo?: boolean; timestamp?: proxima.Timestamp }
  ) {
    const proximaEvent = new proxima.Event<model.events.DomainEvent>(
      payload,
      opts?.undo ?? false,
      opts?.timestamp ?? proxima.Timestamp.now()
    );
    producedDocumentUpdates.push(...handleDomainEvent(mutator, proximaEvent));
  }

  function materializeViews(): MaterializedViewsTestResult {
    return new MaterializedViewsTestResult(producedDocumentUpdates);
  }

  it("should handle multiple MangroveParamsUpdated events", () => {
    handle({
      type: "MangroveParamsUpdated",
      mangroveId: mangroveAddress.toHexString(),
      params: {
        dead: false,
        gasprice: 100,
        gasmax: 50,
      },
      tx: txRef,
    });

    handle({
      type: "MangroveParamsUpdated",
      mangroveId: mangroveAddress.toHexString(),
      params: {
        gasprice: 150, // increase
      },
      tx: txRef,
    });

    const result = materializeViews();

    const mangroveView = result.getView<views.MangroveView>(
      "Mangrove",
      mangroveAddress.toHexString()
    );
    expect(mangroveView).not.toBeFalsy();

    expect(mangroveView.params.dead).toBe(false);
    expect(mangroveView.params.gasprice).toBe(150);
    expect(mangroveView.params.gasmax).toBe(50);
  });

  it("should handle MangroveParamsUpdated event rollback", () => {
    handle({
      type: "MangroveParamsUpdated",
      mangroveId: mangroveAddress.toHexString(),
      params: {
        dead: false,
        gasprice: 100,
      },
      tx: txRef,
    });

    handle({
      type: "MangroveParamsUpdated",
      mangroveId: mangroveAddress.toHexString(),
      params: {
        gasprice: 150, // increase
      },
      tx: txRef,
    });

    handle(
      {
        type: "MangroveParamsUpdated",
        mangroveId: mangroveAddress.toHexString(),
        params: {
          gasprice: 150, // increase
        },
        tx: txRef,
      },
      { undo: true }
    );

    const result = materializeViews();

    const mangroveView = result.getView<views.MangroveView>(
      "Mangrove",
      mangroveAddress.toHexString()
    );
    expect(mangroveView).not.toBeFalsy();

    expect(mangroveView.params.dead).toBe(false);
    expect(mangroveView.params.gasprice).toBe(100); // should be set back to 100
  });
});

class MaterializedViewsTestResult {
  private readonly views: Record<string, proxima.JsonObject> = {};

  public constructor(
    private readonly documentUpdates: proxima.documents.DocumentUpdate[]
  ) {
    this.sink();
  }

  public getView<T extends proxima.JsonObject>(type: string, id: string): T {
    return this.views[
      new proxima.documents.DocumentMetadata(id, type).uniqueKey
    ] as T;
  }

  private sink() {
    for (const du of this.documentUpdates) {
      du.metadata.type;
      switch (du.updateAction.type) {
        case "delete":
          delete this.views[du.metadata.uniqueKey];
          break;
        case "setContent": {
          this.views[du.metadata.uniqueKey] = du.updateAction.content;
          break;
        }
      }
    }
  }
}
