import { handleDomainEvent } from "./handlers";
import * as aggregatesModel from "../../aggregateModel";
import * as aggregates from "./aggregates";
import * as proxima from "@proxima-one/proxima-core";
import * as model from "../../model";
import * as views from "./views";
import { OfferListKey } from "../../model";

describe("handleDomainEvent", () => {
  const token1 = proxima.eth.Address.fromHexString(
    "0x001b3b4d0f3714ca98ba10f6042daebf0b1b7b6f"
  );
  const token2 = proxima.eth.Address.fromHexString(
    "0x2058a9d7613eee744279e3856ef0eada5fcbaa7e"
  );
  const token3 = proxima.eth.Address.fromHexString(
    "0x2058a9d7613eee744279e3856ef0eada5fcbaa79"
  );
  const taker1 = proxima.eth.Address.fromHexString(
    "0x3073a02460d7be1a1c9afc60a059ad8d788a4502"
  );
  const maker1 = proxima.eth.Address.fromHexString(
    "0xcbb37575320ff499e9f69d0090b6944bc0ad7585"
  );

  let aggregatesState: aggregatesModel.AggregatesState;
  let mutator: aggregatesModel.AggregatesPool;
  let producedDocumentUpdates: proxima.documents.DocumentUpdate[];

  const mangroveId = "mangrove-tests";
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
      mangroveId: mangroveId,
      params: {
        dead: false,
        gasprice: 100,
        gasmax: 50,
      },
      tx: txRef,
    });

    handle({
      type: "MangroveParamsUpdated",
      mangroveId: mangroveId,
      params: {
        gasprice: 150, // increase
      },
      tx: txRef,
    });

    const result = materializeViews();

    const mangroveView = result.getView<views.MangroveView>(
      "Mangrove",
      mangroveId
    );
    expect(mangroveView).not.toBeFalsy();

    expect(mangroveView.params.dead).toBe(false);
    expect(mangroveView.params.gasprice).toBe(150);
    expect(mangroveView.params.gasmax).toBe(50);
  });

  it("should handle MangroveParamsUpdated event rollback", () => {
    handle({
      type: "MangroveParamsUpdated",
      mangroveId: mangroveId,
      params: {
        dead: false,
        gasprice: 100,
      },
      tx: txRef,
    });

    handle({
      type: "MangroveParamsUpdated",
      mangroveId: mangroveId,
      params: {
        gasprice: 150, // increase
      },
      tx: txRef,
    });

    handle(
      {
        type: "MangroveParamsUpdated",
        mangroveId: mangroveId,
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
      mangroveId
    );
    expect(mangroveView).not.toBeFalsy();

    expect(mangroveView.params.dead).toBe(false);
    expect(mangroveView.params.gasprice).toBe(100); // should be set back to 100
  });

  const offerList = {
    inboundToken: token1.toHexString(),
    outboundToken: token2.toHexString(),
  };
  it("should handle offer events", () => {
    handle({
      type: "OfferListParamsUpdated",
      mangroveId: mangroveId,
      offerList: offerList,
      params: {
        active: true,
      },
      tx: txRef,
    });

    handle({
      type: "OfferWritten",
      mangroveId: mangroveId,
      offerList,
      maker: maker1.toHexString(),
      tx: txRef,
      offer: {
        id: 1,
        gasprice: 100,
        gasreq: 100,
        gives: "100",
        prev: 0,
        wants: "100",
      },
    });

    handle({
      type: "OfferWritten",
      mangroveId: mangroveId,
      offerList,
      maker: maker1.toHexString(),
      tx: txRef,
      offer: {
        id: 2,
        gasprice: 100,
        gasreq: 100,
        gives: "100",
        prev: 0,
        wants: "100",
      },
    });

    // 2,3,1 now
    handle({
      type: "OfferWritten",
      mangroveId: mangroveId,
      offerList,
      maker: maker1.toHexString(),
      tx: txRef,
      offer: {
        id: 3,
        gasprice: 100,
        gasreq: 100,
        gives: "100",
        prev: 2,
        wants: "100",
      },
    });

    // 2,3
    handle({
      type: "OfferRetracted",
      mangroveId: mangroveId,
      offerList,
      tx: txRef,
      offerId: 1,
    });

    // 2 isLive = false
    handle({
      type: "OfferWritten",
      mangroveId: mangroveId,
      offerList,
      maker: maker1.toHexString(),
      tx: txRef,
      offer: {
        id: 2,
        gasprice: 100,
        gasreq: 100,
        gives: "0",
        prev: 2,
        wants: "100",
      },
    });

    const result = materializeViews();

    const expectedOffers = [2, 3].map(
      (offerNum) =>
        new aggregates.OfferId(mangroveId, offerList, offerNum).value
    );

    const offerListView = result.getView<views.OfferListView>(
      "OfferList",
      new aggregates.OfferListId(mangroveId, {
        inboundToken: token1.toHexString(),
        outboundToken: token2.toHexString(),
      }).value
    );
    expect(offerListView).not.toBeFalsy();

    expect(offerListView.inboundToken).toEqual(token1.toHexString());
    expect(offerListView.outboundToken).toEqual(token2.toHexString());
    expect(offerListView.topOffers).toEqual(expectedOffers);
    expect(offerListView.offersCount).toBe(expectedOffers.length);
    expect(offerListView.params.active).toBe(true);

    const offer2 = result.getView<views.OfferView>("Offer", expectedOffers[0]);
    expect(offer2).not.toBeFalsy();
    expect(offer2.live).toBe(false);
    expect(offer2.makerId).toBe(
      new aggregates.MakerId(mangroveId, maker1.toHexString()).value
    );
    expect(offer2.wants).toBe("100");
    expect(offer2.gives).toBe("0");
    expect(offer2.gasprice).toBe(100);
    expect(offer2.gasreq).toBe(100);
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
