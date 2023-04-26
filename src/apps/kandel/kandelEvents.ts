import {
  LogParserContext,
  parseLogs,
  parseMangroveEvents,
} from "../parseBlocks/mangroveLogsParser";
import { any, many, map, Parser, seq, success } from "../parseBlocks/parser";
import * as _ from "lodash";
import { kandel } from "@proximaone/stream-schema-mangrove";
import {
  OfferRetracted,
  OfferWritten,
} from "@proximaone/stream-schema-mangrove/dist/events";
import {
  NewKandel,
  SetIndexMapping,
} from "@proximaone/stream-schema-mangrove/dist/kandel";
import { EthModel } from "@proxima-one/proxima-plugin-eth";

export type KandelLogParserContext = LogParserContext & {
  mangroveAddress?: EthModel.Address;
  paramsProcessed?: boolean;
};
export type KandelLogParser<T> = Parser<T, KandelLogParserContext>;

export const parseKandelEvents = (): KandelLogParser<PartialKandelEvent[]> =>
  map(
    many(
      any([
        parseBalanceEvent(),
        parseSetParamsEvent(),
        parsePopulateEvent(),
        parseRetractEvent(),
        parseNewKandelEvent(),
      ])
    ),
    (x) => x.flat()
  );

export type PartialKandelEvent =
  | Partial<kandel.KandelEvent>
  | SetIndexMapping
  | OfferWritten
  | OfferRetracted
  | Partial<NewKandel>;

export enum KandelParamsEvents {
  SetCompoundRates = "SetCompoundRates",
  SetGasprice = "SetGasprice",
  SetGasreq = "SetGasreq",
  SetGeometricParams = "SetGeometricParams",
  SetLength = "SetLength",
  Pair = "Pair",
  Mgv = "Mgv",
  SetReserveId = "SetReserveId",
  SetAdmin = "SetAdmin",
  SetRouter = "SetRouter",
}

export const parseBalanceEvent = () =>
  parseLogs<PartialKandelEvent[]>(["Debit", "Credit"], ({ payload }) => {
    const token = payload.requireParam("token").asString();
    const amount = payload.requireParam("amount").asString();

    return [
      {
        type: payload.name as "Debit" | "Credit",
        token: token,
        amount: amount,
      },
    ];
  });

export const parseIndexMappingEvent = () =>
  parseLogs<PartialKandelEvent[]>(["SetIndexMapping"], ({ payload }) => {
    return [
      {
        type: "SetIndexMapping",
        ba: payload.requireParam("ba").asNumber(),
        index: payload.requireParam("index").asNumber(),
        offerId: payload.requireParam("offerId").asNumber(),
      },
    ];
  });

export const parseNewKandelEvent = () =>
  parseLogs<PartialKandelEvent[]>(["NewKandel", "NewAaveKandel"],
    ({ payload }) => [parseNewKandel(payload)]
  );

export function parseNewKandel(payload: EthModel.DecodedContractLogPayload): Partial<NewKandel> {
  switch (payload.name) {
    case "NewKandel":
      return {
        type: "NewKandel",
        owner: payload.requireParam("owner").asString(),
        base: payload.requireParam("base").asString(),
        quote: payload.requireParam("quote").asString(),
        kandel: payload.requireParam("kandel").asString(),
      }
      case "NewAaveKandel":
        return {
          type: "NewKandel",
          owner: payload.requireParam("owner").asString(),
          base: payload.requireParam("base").asString(),
          quote: payload.requireParam("quote").asString(),
          kandel: payload.requireParam("aaveKandel").asString(),
          reserveId: payload.requireParam("reserveId").asString(),
        };
      default:
        throw new Error(`Unknown event type: ${payload.name}`);
  }
}

export const parseSetParamsEvent = (): KandelLogParser<
  PartialKandelEvent[]
> => {
  const setParamsPartialParser = parseSetParamsPartialEvent();
  return (ctx) => {
    const probeParseParamsRes = setParamsPartialParser(ctx);
    if (probeParseParamsRes.success) {
      if (ctx.paramsProcessed) {
        return success({ ...ctx, index: ctx.index + 1 }, []);
      }
      const setParamsCtx = {
        ...ctx,
        index: 0,
        events: ctx.events.filter((x) =>
          _.keys(KandelParamsEvents).includes(x.payload.name)
        ),
      };
      const res = many(setParamsPartialParser)(setParamsCtx);

      if (res.success && res.value.length > 0) {
        const setParamsEvent: Partial<kandel.SetParams> = {};
        res.value.map((x) => _.assign(setParamsEvent, x[0]));

        return success(
          { ...ctx, index: ctx.index + 1, paramsProcessed: true },
          [setParamsEvent]
        );
      }
    }
    return probeParseParamsRes;
  };
};

export const parsePopulateEvent = (): KandelLogParser<PartialKandelEvent[]> => {
  const populateStartParser = parseLogs<PartialKandelEvent[]>(
    "PopulateStart",
    (x) => []
  );
  const populateEndParser = parseLogs<PartialKandelEvent[]>(
    "PopulateEnd",
    (x) => []
  );

  const parseMangroveOrIndexMapping = () =>
    map(
      many(
        any([
          parseIndexMappingEvent(),
          wrapToMangroveContext(parseMangroveEvents(true), (x) =>
            x
              .flat()
              .filter((x) => x.type == "OfferWritten")
              .map((x) => {
                return x as PartialKandelEvent;
              })
          ),
        ])
      ),
      (x) => x.flat()
    );

  const populateFlatParser = seq([
    populateStartParser,
    parseMangroveOrIndexMapping(),
    populateEndParser,
  ]);

  return map(populateFlatParser, (x) => {
    const flatEvents = x.flat();
    return [
      {
        type: "Populate",
        offers: flatEvents.filter(
          (x) => x.type == "OfferWritten"
        ) as OfferWritten[],
        indexMapping: flatEvents.filter(
          (x) => x.type == "SetIndexMapping"
        ) as SetIndexMapping[],
      },
    ];
  });
};

export const parseRetractEvent = (): KandelLogParser<PartialKandelEvent[]> => {
  const retractStartParser = parseLogs<PartialKandelEvent[]>(
    "RetractStart",
    (x) => []
  );
  const retractEndParser = parseLogs<PartialKandelEvent[]>(
    "RetractEnd",
    (x) => []
  );

  const parseMangrove = () =>
    map(
      many(
        any([
          //parseIndexMappingEvent(),
          wrapToMangroveContext(parseMangroveEvents(true), (x) =>
            x
              .flat()
              .filter((x) => x.type == "OfferRetracted")
              .map((x) => {
                return x as PartialKandelEvent;
              })
          ),
        ])
      ),
      (x) => x.flat()
    );

  const populateFlatParser = seq([
    retractStartParser,
    parseMangrove(),
    retractEndParser,
  ]);

  return map(populateFlatParser, (x) => {
    const flatEvents = x.flat();
    return [
      {
        type: "Retract",
        offers: flatEvents.filter(
          (x) => x.type == "OfferRetracted"
        ) as OfferRetracted[],
      },
    ];
  });
};

export const parseSetParamsPartialEvent = () =>
  parseLogs<Partial<kandel.SetParams>[]>(
    _.keys(KandelParamsEvents),
    ({ payload }) => {
      switch (payload.name) {
        case KandelParamsEvents.SetCompoundRates:
          return [
            {
              type: "SetParams",
              compoundRates: {
                base: payload.requireParam("compoundRateBase").asNumber(),
                quote: payload.requireParam("compoundRateQuote").asNumber(),
              },
            },
          ];
        case KandelParamsEvents.SetGasprice:
          return [
            {
              type: "SetParams",
              gasPrice: payload.requireParam("value").asString(),
            },
          ];
        case KandelParamsEvents.SetGasreq:
          return [
            {
              type: "SetParams",
              gasReq: payload.requireParam("value").asString(),
            },
          ];
        case KandelParamsEvents.SetGeometricParams:
          return [
            {
              type: "SetParams",
              geometric: {
                spread: payload.requireParam("spread").asNumber(),
                ratio: payload.requireParam("ratio").asNumber(),
              },
            },
          ];
        case KandelParamsEvents.SetLength:
          return [
            {
              type: "SetParams",
              length: payload.requireParam("value").asNumber(),
            },
          ];
        case KandelParamsEvents.Pair:
          return [
            {
              type: "SetParams",
              pair: {
                base: payload.requireParam("base").asString(),
                quote: payload.requireParam("quote").asString(),
              },
            },
          ];
        case KandelParamsEvents.Mgv:
          return [
            {
              type: "SetParams",
              mangrove: payload.requireParam("mgv").asString(),
            },
          ];
        case KandelParamsEvents.SetReserveId:
          return [
            {
              type: "SetParams",
              reserveId: payload.requireParam("reserveId").asString(),
            },
          ];
        case KandelParamsEvents.SetAdmin:
          return [
            {
              type: "SetParams",
              admin: payload.requireParam("admin").asString(),
            },
          ];
        case KandelParamsEvents.SetRouter:
          return [
            {
              type: "SetParams",
              router: payload.requireParam("router").asString(),
            },
          ];
        default:
          throw new Error(`Unknown event type: ${payload.name}`);
      }
    }
  );

export function wrapToMangroveContext<
  A,
  B,
  TContext extends KandelLogParserContext
>(parser: Parser<A, TContext>, fn: (val: A) => B): Parser<B, TContext> {
  return (ctx) => {
    const res = parser({
      ...ctx,
      address: ctx.mangroveAddress,
    });
    return res.success
      ? success({ ...res.ctx, address: ctx.address }, fn(res.value))
      : res;
  };
}
