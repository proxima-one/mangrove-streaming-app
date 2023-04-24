import * as schema from "@proximaone/stream-schema-mangrove";
import * as _ from "lodash";
import { any, failure, many, map, Parser, success } from "./parser";
import { EthModel } from "@proxima-one/proxima-plugin-eth";
import { orderId } from "../../model/entities";

export type PartialMangroveEvent = Partial<schema.events.MangroveEvent>;
export const parseMangroveEvents = (
  failWhenNoResult?: boolean
): LogParser<PartialMangroveEvent[]> =>
  map(
    many(
      any([
        parseMakerBalanceEvent(),
        parseOfferListParamsEvents(),
        parseMangroveParamsEvents(),
        parseApprovalEvents(),
        parseOfferWrittenEvents(),
        parseOfferRetractedEvents(),
        parseOrderExecutionEvents(),
      ]),
      failWhenNoResult
    ),
    (x) => x.flat()
  );

export const parseMakerBalanceEvent = () =>
  parseLogs<PartialMangroveEvent[]>(["Debit", "Credit"], ({ payload }) => {
    let amountChange = payload.requireParam("amount").asBigNumber();
    if (payload.name == "Debit") amountChange = amountChange.times(-1);

    return [
      {
        type: "MakerBalanceUpdated",
        amountChange: amountChange.toFixed(),
        maker: payload.requireParam("maker").asString(),
      },
    ];
  });

enum OfferListParamsEvents {
  SetActive = "SetActive",
  SetFee = "SetFee",
  SetGasbase = "SetGasbase",
  SetDensity = "SetDensity",
}

export const parseOfferListParamsEvents = () =>
  parseLogs<PartialMangroveEvent[]>(
    _.keys(OfferListParamsEvents),
    ({ payload }) => {
      return [
        {
          type: "OfferListParamsUpdated",
          offerList: extractOfferList(payload),
          params: {
            active:
              payload.name == OfferListParamsEvents.SetActive
                ? payload.requireParam("value").asBool()
                : undefined,
            fee:
              payload.name == OfferListParamsEvents.SetFee
                ? payload.requireParam("value").asBigNumber().toFixed()
                : undefined,
            gasbase:
              payload.name == OfferListParamsEvents.SetGasbase
                ? payload.requireParam("offer_gasbase").asNumber()
                : undefined,
            density:
              payload.name == OfferListParamsEvents.SetDensity
                ? payload.requireParam("value").asBigNumber().toFixed()
                : undefined,
          },
        },
      ];
    }
  );

enum MangroveParamsEvents {
  NewMgv = "NewMgv",
  SetGovernance = "SetGovernance",
  SetMonitor = "SetMonitor",
  SetVault = "SetVault",
  SetUseOracle = "SetUseOracle",
  SetNotify = "SetNotify",
  SetGasmax = "SetGasmax",
  SetGasprice = "SetGasprice",
  Kill = "Kill",
}

function extractParams(
  log: EthModel.DecodedContractLogPayload
): schema.core.MangroveParams {
  return {
    governance:
      log.name == MangroveParamsEvents.SetGovernance
        ? log.requireParam("value").asString()
        : undefined,
    monitor:
      log.name == MangroveParamsEvents.SetMonitor
        ? log.requireParam("value").asString()
        : undefined,
    vault:
      log.name == MangroveParamsEvents.SetVault
        ? log.requireParam("value").asString()
        : undefined,
    useOracle:
      log.name == MangroveParamsEvents.SetUseOracle
        ? log.requireParam("value").asBool()
        : undefined,
    notify:
      log.name == MangroveParamsEvents.SetNotify
        ? log.requireParam("value").asBool()
        : undefined,
    gasmax:
      log.name == MangroveParamsEvents.SetGasmax
        ? log.requireParam("value").asNumber()
        : undefined,
    gasprice:
      log.name == MangroveParamsEvents.SetGasprice
        ? log.requireParam("value").asNumber()
        : undefined,
    dead:
      log.name == MangroveParamsEvents.NewMgv
        ? false
        : log.name == "Kill"
        ? true
        : undefined,
  };
}

export const parseMangroveParamsEvents = () =>
  parseLogs<PartialMangroveEvent[]>(_.keys(MangroveParamsEvents), (log) => {
    const changedParams = extractParams(log.payload);
    return [
      {
        type: "MangroveParamsUpdated",
        params: changedParams,
      },
    ];
  });

export const parseApprovalEvents = () =>
  parseLogs<PartialMangroveEvent[]>("Approval", ({ payload }) => {
    return [
      {
        type: "TakerApprovalUpdated",
        offerList: extractOfferList(payload),
        amount: payload.requireParam("value").asBigNumber().toFixed(),
        owner: payload.requireParam("owner").asString(),
        spender: payload.requireParam("spender").asString(),
      },
    ];
  });

export const parseOfferWrittenEvents = () =>
  parseLogs<PartialMangroveEvent[]>("OfferWrite", ({ payload }) => {
    return [
      {
        type: "OfferWritten",
        offerList: extractOfferList(payload),
        maker: payload.requireParam("maker").asString(),
        offer: {
          wants: payload.requireParam("wants").asBigNumber().toFixed(),
          gives: payload.requireParam("gives").asBigNumber().toFixed(),
          gasprice: payload.requireParam("gasprice").asNumber(),
          gasreq: payload.requireParam("gasreq").asNumber(),
          id: payload.requireParam("id").asNumber(), // 32-bits max
          prev: payload.requireParam("prev").asNumber(), // 32-bits max
        },
      },
    ];
  });

export const parseOfferRetractedEvents = () =>
  parseLogs<PartialMangroveEvent[]>("OfferRetract", ({ payload }) => {
    return [
      {
        type: "OfferRetracted",
        offerList: extractOfferList(payload),
        offerId: payload.requireParam("id").asNumber(),
      },
    ];
  });

/**
 * This parser is complex since custom callback can be executed after all offers in the order taken. This custom callback
 * may also start new order in the same Mangrove contract, so we have to parse it recursively while preserving order
 *
 * Logs might look like:
 * - OfferSuccess (id = 1)
 * - OfferFail (id = 2)
 * - OfferSuccess (id = 3)
 * - OfferSuccess (id = 4)
 * - *** order is complete **
 * - *** Maker's posthook callback for Offer (id = 4)
 * - OfferWrite (id = 4)
 * - *** Maker's posthook callback for Offer (id = 3)
 *    - *** Maker decided to start new order
 *    - OfferSuccess (id=5)
 *    - OrderComplete
 * - PosthookFail (offer id = 1)
 * - OrderComplete
 *
 * Parser produces following events (and assigns id based on txHash + first event index):
 * - OrderCompleted (id=0x2134123-1)
 *   - takenOffers: [{id=1, posthookFailed=true}, {id=2, failureReason= "mgv/reason"}, {id=3}, {id=4}]
 * - OfferWritten (id=4)
 * - OrderCompleted (id=0x2134123-2)
 *   - takenOffers: [{id=5}]
 * @param opts
 */
export const parseOrderExecutionEvents = (): LogParser<
  PartialMangroveEvent[]
> => {
  const orderStartParser = parseLogs("OrderStart", (x) => x);
  const orderCompleteParser = parseLogs("OrderComplete", (x) => x);
  const takenOffersParser = parseTakenOffers();

  return (ctx) => {
    const txHash = ctx.txHash;

    const orderStart = orderStartParser(ctx);

    if (!orderStart.success) return orderStart;

    const takenOffersResult = takenOffersParser(orderStart.ctx);
    if (!takenOffersResult.success) {
      return takenOffersResult;
    }

    const orderCompletedResult = orderCompleteParser(takenOffersResult.ctx);
    if (!orderCompletedResult.success) return orderCompletedResult;

    const log = orderCompletedResult.value;
    const takenOffers = takenOffersResult.value;

    const offerList = extractOfferList(log.payload);
    const id = orderId(txHash, log);
    return success(orderCompletedResult.ctx, [
      ...takenOffers
        .flatMap((x) => x.callbackEvents)
        .map((x) => {
          return { ...x, parentOrder: { id: id, offerList: offerList } };
        }),
      {
        type: "OrderCompleted",
        id: id,
        offerList: offerList,
        order: {
          penalty: log.payload.requireParam("penalty").asBigNumber().toFixed(),
          takerGave: log.payload
            .requireParam("takerGave")
            .asBigNumber()
            .toFixed(),
          takerGot: log.payload
            .requireParam("takerGot")
            .asBigNumber()
            .toFixed(),
          taker: log.payload.requireParam("taker").asString(),
          takenOffers: takenOffers.map((x) => x.offer),
          feePaid:
            log.payload.findParam("feePaid")?.asBigNumber()?.toFixed() || "",
        },
      },
      ...takenOffers
        .flatMap((x) => x.posthookEvents)
        .map((x) => {
          return { ...x, parentOrder: { id: id, offerList: offerList } };
        }),
    ]);
  };
};

const extractOfferList = (
  log: EthModel.DecodedContractLogPayload
): schema.core.OfferList => {
  return {
    inboundToken: log.requireParam("inbound_tkn").asString(),
    outboundToken: log.requireParam("outbound_tkn").asString(),
  };
};

// [...Maker's Callback Events]
// TakenOffer
//   [...TakenOffers] <--- RECURSIVE
// [...Posthook Events]
// ? PosthookFailed (offerId)
const parseTakenOffers = (): LogParser<ParsedTakenOffer[]> => (ctx) => {
  const mangroveEventsParser = parseMangroveEvents();
  const takenOfferParser = parseTakenOffer();
  const posthookFailParser = parsePosthookFailed();

  const callbackEvents = mangroveEventsParser(ctx);
  if (!callbackEvents.success) return callbackEvents;

  const currentTakenOfferResult = takenOfferParser(callbackEvents.ctx);
  if (!currentTakenOfferResult.success) return success(ctx, []); // don't parse callbackEvents and fallback

  const restOffersResult = parseTakenOffers()(currentTakenOfferResult.ctx);
  if (!restOffersResult.success) return restOffersResult;

  const restOffers = restOffersResult.value;
  const currentOffer = currentTakenOfferResult.value;
  const posthookFail = posthookFailParser(currentTakenOfferResult.value.id)(
    restOffersResult.ctx
  );

  if (posthookFail.success)
    return success(posthookFail.ctx, [
      {
        offer: {
          ...currentOffer,
          posthookFailed: true,
          posthookData: posthookFail.value.posthookData?.toString(),
        },
        posthookEvents: [],
        callbackEvents: callbackEvents.value,
      },
      ...restOffers,
    ]);

  const posthookEvents = parseMangroveEvents()(restOffersResult.ctx);
  if (!posthookEvents.success) return posthookEvents;

  return success(posthookEvents.ctx, [
    {
      offer: currentOffer,
      posthookEvents: posthookEvents.value,
      callbackEvents: callbackEvents.value,
    },
    ...restOffers,
  ]);
};

interface ParsedTakenOffer {
  offer: schema.core.TakenOffer;
  callbackEvents: PartialMangroveEvent[];
  posthookEvents: PartialMangroveEvent[];
}

// PosthoookFail for specific OfferId for correct match
const parsePosthookFailed = () => (requestedOfferId: schema.core.OfferId) =>
  parseLogsIf(
    "PosthookFail",
    (log) =>
      log.payload.requireParam("offerId").asNumber() == requestedOfferId
        ? true
        : `offerId doesn't match`,
    (log) => {
      const posthookData = log.payload.findParam("posthookData");
      return {
        posthookData: posthookData ? posthookData.value : undefined,
      };
    }
  );

const parseOfferSuccess = () =>
  parseLogs<schema.core.TakenOffer>("OfferSuccess", ({ payload }) => {
    return {
      id: payload.requireParam("id").asNumber(),
      takerWants: payload.requireParam("takerWants").asBigNumber().toFixed(),
      takerGives: payload.requireParam("takerGives").asBigNumber().toFixed(),
    };
  });

const parseOfferFail = () =>
  parseLogs<schema.core.TakenOffer>("OfferFail", ({ payload }) => {
    return {
      id: payload.requireParam("id").asNumber(),
      takerWants: payload.requireParam("takerWants").asBigNumber().toFixed(),
      takerGives: payload.requireParam("takerGives").asBigNumber().toFixed(),
      failReason: payload
        .requireParam("mgvData")
        .asString() as schema.core.OfferFailReason,
    };
  });

const parseTakenOffer = () => any([parseOfferSuccess(), parseOfferFail()]);

// Shared functions
export type LogParserContext = Readonly<{
  txHash: EthModel.Hash;
  events: EthModel.DecodedLog[]; // the full input string
  index: number; // our current position in it
  address?: EthModel.Address;
}>;

export type LogParser<T> = Parser<T, LogParserContext>;

export function parseLogs<T>(
  nameOrNames: string | string[],
  mapFunc: (log: EthModel.DecodedLog) => T
): LogParser<T> {
  return parseLogsIf<T>(nameOrNames, () => true, mapFunc);
}

export function parseLogsIf<T>(
  nameOrNames: string | string[],
  ifFunc: (log: EthModel.DecodedLog) => true | string,
  mapFunc: (log: EthModel.DecodedLog) => T
): LogParser<T> {
  const names = typeof nameOrNames == "string" ? [nameOrNames] : nameOrNames;
  const failReason = `log.name not in (${names.join(",")})`;
  return (ctx) => {
    if (ctx.index >= ctx.events.length) return failure(ctx, "end of input");

    const log = ctx.events[ctx.index];

    if (!names.includes(log.payload.name)) return failure(ctx, failReason);
    if (
      ctx.address &&
      log.payload.address.toHexString() != ctx.address.toHexString()
    )
      return failure(ctx, "wrong address");

    const conditionResult = ifFunc(log);
    if (typeof conditionResult == "string")
      return failure(ctx, conditionResult);

    return success({ ...ctx, index: ctx.index + 1 }, mapFunc(log));
  };
}
