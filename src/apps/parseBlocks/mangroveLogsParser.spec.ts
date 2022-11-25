import { LogParserContext, parseMangroveEvents } from "./mangroveLogsParser";
import * as proxima from "@proxima-one/proxima-core";
import {
  createParserRunner,
  events,
  parseParams,
  ValueType,
} from "./__test/utils";
import { EthModel } from "@proxima-one/proxima-plugin-eth";

const txHash = EthModel.Hash.fromHexString(
  "0x580092d68d5a92f5f9495ea15d583e3f7882eb69cda8ed9da5a79f97e0b99200"
);
const mangroveId = EthModel.Address.fromHexString(
  "0xD27139C60ED051b65c3AEe193BCABFfa1067D243"
);
const token1 = EthModel.Address.fromHexString(
  "0x001b3b4d0f3714ca98ba10f6042daebf0b1b7b6f"
);
const token2 = EthModel.Address.fromHexString(
  "0x2058a9d7613eee744279e3856ef0eada5fcbaa7e"
);
const token3 = EthModel.Address.fromHexString(
  "0x2058a9d7613eee744279e3856ef0eada5fcbaa79"
);
const taker1 = EthModel.Address.fromHexString(
  "0x3073a02460d7be1a1c9afc60a059ad8d788a4502"
);
const maker1 = EthModel.Address.fromHexString(
  "0xcbb37575320ff499e9f69d0090b6944bc0ad7585"
);

const log = (
  name: string,
  params: EthModel.LogParameter[] | Record<string, ValueType>
) => {
  return new EthModel.DecodedContractLogPayload(
    name,
    mangroveId,
    Array.isArray(params) ? params : parseParams(params)
  );
};

describe("parseMangroveEvents", () => {
  const assertParsedResult = createParserRunner(parseMangroveEvents());

  const context = (
    logs: EthModel.DecodedContractLogPayload[]
  ): LogParserContext => {
    return {
      index: 0,
      events: logs.map((x, ind) => new EthModel.DecodedLog(ind, x)),
      txHash: txHash,
    };
  };

  it("should parse OfferListParamsUpdated events: SetActive", () => {
    assertParsedResult(
      context([
        log("SetActive", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          value: true,
        }),
      ]),
      events([
        {
          type: "OfferListParamsUpdated",
          offerList: {
            inboundToken: token2.toHexString(),
            outboundToken: token1.toHexString(),
          },
          params: {
            active: true,
          },
        },
      ])
    );
  });

  it("should parse recursive OrderExecution events (maker executes its own order in posthook callback)", () => {
    assertParsedResult(
      context([
        log("OrderStart", {}),
        log("OfferSuccess", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          id: 1,
          taker: taker1.toHexString(),
          takerWants: 100,
          takerGives: 100,
        }),

        // maker's callback executes order on another token list
        log("OrderStart", {}),
        log("OfferSuccess", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token3.toHexString(),
          id: 5,
          taker: maker1.toHexString(),
          takerWants: 100,
          takerGives: 100,
        }),
        log("OrderComplete", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token3.toHexString(),
          taker: maker1.toHexString(),
          takerGot: 100,
          takerGave: 100,
          penalty: 0,
        }),

        log("OfferFail", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          id: 2,
          taker: taker1.toHexString(),
          takerWants: 100,
          takerGives: 100,
          mgvData: "mgv/makerRevert",
        }),
        log("OfferSuccess", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          id: 3,
          taker: taker1.toHexString(),
          takerWants: 100,
          takerGives: 100,
        }),
        log("OfferSuccess", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          id: 4,
          taker: taker1.toHexString(),
          takerWants: 100,
          takerGives: 100,
        }),
        log("OfferWrite", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          maker: maker1.toHexString(),
          wants: 100,
          gives: 100,
          gasprice: 100,
          gasreq: 100,
          id: 4,
          prev: 0,
        }),
        log("OrderStart", {}), // posthook's order from maker
        log("OfferSuccess", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          id: 5,
          taker: maker1.toHexString(),
          takerWants: 100,
          takerGives: 100,
        }),
        log("OrderComplete", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          taker: maker1.toHexString(),
          takerGot: 100,
          takerGave: 100,
          penalty: 0,
        }),
        log("PosthookFail", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          offerId: 1,
        }),
        log("OrderComplete", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          taker: taker1.toHexString(),
          takerGot: 100,
          takerGave: 100,
          penalty: 0,
        }),
      ]),
      events([
        {
          id: "0x580092d68d5a92f5f9495ea15d583e3f7882eb69cda8ed9da5a79f97e0b99200-2",
          parentOrder: {
            id: "0x580092d68d5a92f5f9495ea15d583e3f7882eb69cda8ed9da5a79f97e0b99200-0",
            offerList: {
              inboundToken: token2.toHexString(),
              outboundToken: token1.toHexString(),
            },
          },
          offerList: {
            inboundToken: "0x2058a9d7613eee744279e3856ef0eada5fcbaa79",
            outboundToken: "0x001b3b4d0f3714ca98ba10f6042daebf0b1b7b6f",
          },
          order: {
            penalty: "0",
            takenOffers: [
              {
                id: 5,
                takerGives: "100",
                takerWants: "100",
              },
            ],
            taker: "0xcbb37575320ff499e9f69d0090b6944bc0ad7585",
            takerGave: "100",
            takerGot: "100",
          },
          type: "OrderCompleted",
        },
        {
          type: "OrderCompleted",
          offerList: {
            inboundToken: token2.toHexString(),
            outboundToken: token1.toHexString(),
          },
          id: `${txHash.toHexString()}-0`,
          order: {
            penalty: "0",
            takerGot: "100",
            takerGave: "100",
            taker: taker1.toHexString(),
            takenOffers: [
              {
                id: 1,
                posthookFailed: true,
                takerWants: "100",
                takerGives: "100",
              },
              {
                id: 2,
                takerWants: "100",
                takerGives: "100",
                failReason: "mgv/makerRevert",
              },
              {
                id: 3,
                takerWants: "100",
                takerGives: "100",
              },
              {
                id: 4,
                takerWants: "100",
                takerGives: "100",
              },
            ],
          },
        },
        {
          type: "OfferWritten",
          parentOrder: {
            id: "0x580092d68d5a92f5f9495ea15d583e3f7882eb69cda8ed9da5a79f97e0b99200-0",
            offerList: {
              inboundToken: token2.toHexString(),
              outboundToken: token1.toHexString(),
            },
          },
          maker: maker1.toHexString(),
          offerList: {
            inboundToken: token2.toHexString(),
            outboundToken: token1.toHexString(),
          },
          offer: {
            id: 4,
            prev: 0,
            wants: "100",
            gives: "100",
            gasprice: 100,
            gasreq: 100,
          },
        },
        {
          type: "OrderCompleted",
          parentOrder: {
            id: "0x580092d68d5a92f5f9495ea15d583e3f7882eb69cda8ed9da5a79f97e0b99200-0",
            offerList: {
              inboundToken: token2.toHexString(),
              outboundToken: token1.toHexString(),
            },
          },
          offerList: {
            inboundToken: token2.toHexString(),
            outboundToken: token1.toHexString(),
          },
          id: `${txHash.toHexString()}-9`,
          order: {
            penalty: "0",
            takerGot: "100",
            takerGave: "100",
            taker: maker1.toHexString(),
            takenOffers: [
              {
                id: 5,
                takerWants: "100",
                takerGives: "100",
              },
            ],
          },
        },
      ])
    );
  });

  it("should parse empty order", () => {
    assertParsedResult(
      context([
        log("OrderStart", {}),
        log("OrderComplete", {
          outbound_tkn: token1.toHexString(),
          inbound_tkn: token2.toHexString(),
          taker: taker1.toHexString(),
          takerGot: 100,
          takerGave: 100,
          penalty: 0,
        }),
      ]),
      events([
        {
          type: "OrderCompleted",
          offerList: {
            inboundToken: token2.toHexString(),
            outboundToken: token1.toHexString(),
          },
          id: `${txHash.toHexString()}-0`,
          order: {
            penalty: "0",
            takerGot: "100",
            takerGave: "100",
            taker: taker1.toHexString(),
            takenOffers: [],
          },
        },
      ])
    );
  });
});
