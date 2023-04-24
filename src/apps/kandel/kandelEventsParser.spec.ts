import * as proxima from "@proxima-one/proxima-core";
import {
  createParserRunner,
  events,
  parseParams,
  ValueType,
} from "./__test/utils";
import { EthModel } from "@proxima-one/proxima-plugin-eth";
import { KandelLogParserContext, parseKandelEvents } from "./kandelEvents";

const txHash = EthModel.Hash.fromHexString(
  "0x580092d68d5a92f5f9495ea15d583e3f7882eb69cda8ed9da5a79f97e0b99200"
);
const mangroveId = EthModel.Address.fromHexString(
  "0xad90a2a9bdcb630c976cacea1253d89edf74da5e"
);
const kandelAddress = EthModel.Address.fromHexString(
  "0x1c0088757dc42684dfcfd89bb5c32cbe2d547060"
);

const mangroveLog = (
  name: string,
  params: EthModel.LogParameter[] | Record<string, ValueType>
) => {
  return new EthModel.DecodedContractLogPayload(
    name,
    mangroveId,
    Array.isArray(params) ? params : parseParams(params)
  );
};

const kandelLog = (
  name: string,
  params: EthModel.LogParameter[] | Record<string, ValueType>
) => {
  return new EthModel.DecodedContractLogPayload(
    name,
    kandelAddress,
    Array.isArray(params) ? params : parseParams(params)
  );
};

describe("parseKandelEvents", () => {
  const assertParsedResult = createParserRunner(parseKandelEvents());

  const context = (
    logs: EthModel.DecodedContractLogPayload[]
  ): KandelLogParserContext => {
    return {
      address: kandelAddress,
      mangroveAddress: mangroveId,
      index: 0,
      events: logs.map((x, ind) => new EthModel.DecodedLog(ind, x)),
      txHash: txHash,
    };
  };

  it("should parse SetParams events", () => {
    assertParsedResult(
      context([
        kandelLog("Credit", {
          token: "0xd087ff96281dcf722aea82aca57e8545ea9e6c97",
          amount: 1,
        }),
        kandelLog("SetLength", {
          value: 21,
        }),
        kandelLog("SetGeometricParams", {
          spread: 1,
          ratio: 101000,
        }),
        kandelLog("Credit", {
          token: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          amount: 0,
        }),
        kandelLog("Pair", {
          base: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          quote: "0xd087ff96281dcf722aea82aca57e8545ea9e6c97",
        }),
        kandelLog("SetReserveId", {
          reserveId: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
        }),
        kandelLog("Mgv", {
          mgv: mangroveId.toHexString(),
        }),
        kandelLog("SetCompoundRates", {
          compoundRateBase: 100,
          compoundRateQuote: 200,
        }),
        kandelLog("SetGasprice", {
          value: 101,
        }),
        kandelLog("SetGasreq", {
          value: 102,
        }),
        kandelLog("SetRouter", {
          router:
            "000000000000000000000000ea488f8e6a6cb9cd81af88b57521526447f8e527",
        }),
        kandelLog("SetAdmin", {
          admin: "0x47897ee61498d02b18794601ed3a71896a1ff894",
        }),
        kandelLog("Debit", {
          token: "0xd087ff96281dcf722aea82aca57e8545ea9e6c97",
          amount: 3,
        }),
      ]),
      events([
        {
          type: "Credit",
          token: "0xd087ff96281dcf722aea82aca57e8545ea9e6c97",
          amount: "1",
        },
        {
          type: "SetParams",
          length: 21,
          geometric: {
            spread: 1,
            ratio: 101000,
          },
          pair: {
            base: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
            quote: "0xd087ff96281dcf722aea82aca57e8545ea9e6c97",
          },
          reserveId: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          mangrove: mangroveId.toHexString(),
          compoundRates: {
            base: 100,
            quote: 200,
          },
          gasPrice: "101",
          gasReq: "102",
          router:
            "000000000000000000000000ea488f8e6a6cb9cd81af88b57521526447f8e527",
          admin: "0x47897ee61498d02b18794601ed3a71896a1ff894",
        },
        {
          type: "Credit",
          token: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          amount: "0",
        },
        {
          type: "Debit",
          token: "0xd087ff96281dcf722aea82aca57e8545ea9e6c97",
          amount: "3",
        },
      ])
    );
  });

  it("should parse Populate events", () => {
    assertParsedResult(
      context([
        kandelLog("Credit", {
          token: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          amount: 0,
        }),
        kandelLog("PopulateStart", {}),
        mangroveLog("OfferWrite", {
          outbound_tkn: "0xe9dce89b076ba6107bb64ef30678efec11939234",
          inbound_tkn: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          maker: "0x1c0088757dc42684dfcfd89bb5c32cbe2d547060",
          wants: 101010100000000000,
          gives: 90909090,
          gasprice: 10,
          gasreq: 160000,
          id: 61,
          prev: 1,
        }),
        mangroveLog("Debit", {
          maker: "0xe9dce89b076ba6107bb64ef30678efec11939234",
          amount: 2732800000000000,
        }),
        kandelLog("SetIndexMapping", {
          ba: 0,
          index: 0,
          offerId: 61,
        }),
        mangroveLog("OfferWrite", {
          outbound_tkn: "0xe9dce89b076ba6107bb64ef30678efec11939234",
          inbound_tkn: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          maker: "0x1c0088757dc42684dfcfd89bb5c32cbe2d547060",
          wants: 100010000000000000,
          gives: 90909090,
          gasprice: 10,
          gasreq: 160000,
          id: 62,
          prev: 1,
        }),
        mangroveLog("Debit", {
          maker: "0x1c0088757dc42684dfcfd89bb5c32cbe2d547060",
          amount: 2732800000000000,
        }),
        kandelLog("SetIndexMapping", {
          ba: 0,
          index: 7,
          offerId: 68,
        }),
        kandelLog("PopulateEnd", {
          ba: 0,
          index: 7,
          offerId: 68,
        }),
        kandelLog("SetGeometricParams", {
          spread: 1,
          ratio: 101000,
        }),
      ]),
      events([
        {
          type: "Credit",
          token: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          amount: "0",
        },
        {
          type: "Populate",
          offers: [
            {
              type: "OfferWritten",
              offerList: {
                inboundToken: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
                outboundToken: "0xe9dce89b076ba6107bb64ef30678efec11939234",
              },
              offer: {
                id: 61,
                prev: 1,
                wants: "101010100000000000",
                gives: "90909090",
                gasprice: 10,
                gasreq: 160000,
              },
              maker: "0x1c0088757dc42684dfcfd89bb5c32cbe2d547060",
            },
            {
              type: "OfferWritten",
              offerList: {
                inboundToken: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
                outboundToken: "0xe9dce89b076ba6107bb64ef30678efec11939234",
              },
              offer: {
                id: 62,
                prev: 1,
                wants: "100010000000000000",
                gives: "90909090",
                gasprice: 10,
                gasreq: 160000,
              },
              maker: "0x1c0088757dc42684dfcfd89bb5c32cbe2d547060",
            },
          ],
          indexMapping: [
            {
              type: "SetIndexMapping",
              ba: 0,
              index: 0,
              offerId: 61,
            },
            {
              type: "SetIndexMapping",
              ba: 0,
              index: 7,
              offerId: 68,
            },
          ],
        },
        {
          type: "SetParams",
          geometric: {
            spread: 1,
            ratio: 101000,
          },
        },
      ])
    );
  });

  it("should parse Retract events", () => {
    assertParsedResult(
      context([
        kandelLog("Credit", {
          token: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          amount: 0,
        }),
        kandelLog("RetractStart", {}),
        mangroveLog("OfferRetract", {
          outbound_tkn: "0xe9dce89b076ba6107bb64ef30678efec11939234",
          inbound_tkn: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          id: 61,
        }),
        mangroveLog("Credit", {
          maker: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          amount: 0,
        }),
        mangroveLog("OfferRetract", {
          outbound_tkn: "0xe9dce89b076ba6107bb64ef30678efec11939234",
          inbound_tkn: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          id: 62,
        }),
        kandelLog("RetractEnd", {
          ba: 0,
          index: 7,
          offerId: 68,
        }),
        kandelLog("SetGeometricParams", {
          spread: 1,
          ratio: 101000,
        }),
      ]),
      events([
        {
          type: "Credit",
          token: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          amount: "0",
        },
        {
          type: "Retract",
          offers: [
            {
              type: "OfferRetracted",
              offerList: {
                inboundToken: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
                outboundToken: "0xe9dce89b076ba6107bb64ef30678efec11939234",
              },
              offerId: 61,
            },
            {
              type: "OfferRetracted",
              offerList: {
                inboundToken: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
                outboundToken: "0xe9dce89b076ba6107bb64ef30678efec11939234",
              },
              offerId: 62,
            },
          ],
        },
        {
          type: "SetParams",
          geometric: {
            spread: 1,
            ratio: 101000,
          },
        },
      ])
    );
  });

  it("should parse NewKandel without params", () => {
    assertParsedResult(
      context([
        kandelLog("NewKandel", {
          owner: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          base: "0xd087ff96281dcf722aea82aca57e8545ea9e6c95",
          quote: "0xd087ff96281dcf722aea82aca57e8545ea9e6c94",
          kandel: "0xd087ff96281dcf722aea82aca57e8545ea9e6c93",
        }),
      ]),
      events([
        {
          type: "NewKandel",
          owner: "0xd087ff96281dcf722aea82aca57e8545ea9e6c96",
          base: "0xd087ff96281dcf722aea82aca57e8545ea9e6c95",
          quote: "0xd087ff96281dcf722aea82aca57e8545ea9e6c94",
          kandel: "0xd087ff96281dcf722aea82aca57e8545ea9e6c93",
        },
      ])
    );
  });
});
