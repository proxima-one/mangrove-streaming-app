import * as model from "../../model";
import * as proxima from "@proxima-one/proxima-core";
import * as _ from "lodash";
import { any, failure, many, map, Parser, success } from "./parser";

export const parseMangroveEvents = (): LogParser<
  model.events.MangroveEvent[]
> =>
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
      ])
    ),
    (x) => x.flat()
  );

export const parseMakerBalanceEvent = () =>
  parseLogs<model.events.MangroveEvent[]>(["Debit", "Credit"], (log) => {
    let amountChange = log.requireParam("amount").asBigNumber();
    if (log.name == "Debit") amountChange = amountChange.times(-1);

    return [
      {
        type: "MakerBalanceUpdated",
        amountChange: amountChange.toFixed(),
        maker: log.requireParam("maker").asString(),
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
  parseLogs<model.events.MangroveEvent[]>(
    _.keys(OfferListParamsEvents),
    (log) => {
      return [
        {
          type: "OfferListParamsUpdated",
          offerList: extractOfferList(log),
          params: {
            active:
              log.name == OfferListParamsEvents.SetActive
                ? log.requireParam("value").asBool()
                : undefined,
            fee:
              log.name == OfferListParamsEvents.SetFee
                ? log.requireParam("value").asBigNumber().toFixed()
                : undefined,
            gasbase:
              log.name == OfferListParamsEvents.SetGasbase
                ? log.requireParam("offer_gasbase").asNumber()
                : undefined,
            density:
              log.name == OfferListParamsEvents.SetDensity
                ? log.requireParam("value").asBigNumber().toFixed()
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

export const parseMangroveParamsEvents = () =>
  parseLogs<model.events.MangroveEvent[]>(
    _.keys(MangroveParamsEvents),
    (log) => {
      return [
        {
          type: "MangroveParamsUpdated",
          params: {
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
          },
        },
      ];
    }
  );

export const parseApprovalEvents = () =>
  parseLogs<model.events.MangroveEvent[]>("Approval", (log) => {
    return [
      {
        type: "TakerApprovalUpdated",
        offerList: extractOfferList(log),
        amount: log.requireParam("value").asBigNumber().toFixed(),
        owner: log.requireParam("owner").asString(),
        spender: log.requireParam("spender").asString(),
      },
    ];
  });

export const parseOfferWrittenEvents = () =>
  parseLogs<model.events.MangroveEvent[]>("OfferWrite", (log) => {
    return [
      {
        type: "OfferWritten",
        offerList: extractOfferList(log),
        maker: log.requireParam("maker").asString(),
        offer: {
          wants: log.requireParam("wants").asBigNumber().toFixed(),
          gives: log.requireParam("gives").asBigNumber().toFixed(),
          gasprice: log.requireParam("gasprice").asNumber(),
          gasreq: log.requireParam("gasreq").asNumber(),
          id: log.requireParam("id").asNumber(), // 32-bits max
          prev: log.requireParam("prev").asNumber(), // 32-bits max
        },
      },
    ];
  });

export const parseOfferRetractedEvents = () =>
  parseLogs<model.events.MangroveEvent[]>("OfferRetract", (log) => {
    return [
      {
        type: "OfferRetracted",
        offerList: extractOfferList(log),
        offerId: log.requireParam("id").asNumber(),
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
  model.events.MangroveEvent[]
> => {
  const orderStartParser = parseLogs("OrderStart", (x) => x);
  const orderCompleteParser = parseLogs("OrderComplete", (x) => x);
  const takenOffersParser = parseTakenOffers();

  return (ctx) => {
    const startIndex = ctx.index;
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

    const orderId = `${txHash.toHexString()}-${startIndex}`;
    return success(orderCompletedResult.ctx, [
      ...takenOffers
        .flatMap((x) => x.callbackEvents)
        .map((x) => {
          return { ...x, parentOrderId: orderId };
        }),
      {
        type: "OrderCompleted",
        id: orderId,
        offerList: extractOfferList(log),
        order: {
          penalty: log.requireParam("penalty").asBigNumber().toFixed(),
          takerGave: log.requireParam("takerGave").asBigNumber().toFixed(),
          takerGot: log.requireParam("takerGot").asBigNumber().toFixed(),
          taker: log.requireParam("taker").asString(),
          takenOffers: takenOffers.map((x) => x.offer),
        },
      },
      ...takenOffers
        .flatMap((x) => x.posthookEvents)
        .map((x) => {
          return { ...x, parentOrderId: orderId };
        }),
    ]);
  };
};

const extractOfferList = (
  log: proxima.eth.ContractEventPayload
): model.core.OfferList => {
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
        offer: { ...currentOffer, posthookFailed: true },
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
  offer: model.core.TakenOffer;
  callbackEvents: model.events.MangroveEvent[];
  posthookEvents: model.events.MangroveEvent[];
}

// PosthoookFail for specific OfferId for correct match
const parsePosthookFailed = () => (requestedOfferId: model.core.OfferId) =>
  parseLogsIf(
    "PosthookFail",
    (log) =>
      log.requireParam("offerId").asNumber() == requestedOfferId
        ? true
        : `offerId doesn't match`,
    () => true
  );

const parseOfferSuccess = () =>
  parseLogs<model.core.TakenOffer>("OfferSuccess", (payload) => {
    return {
      id: payload.requireParam("id").asNumber(),
      takerWants: payload.requireParam("takerWants").asBigNumber().toFixed(),
      takerGives: payload.requireParam("takerGives").asBigNumber().toFixed(),
    };
  });

const parseOfferFail = () =>
  parseLogs<model.core.TakenOffer>("OfferFail", (payload) => {
    return {
      id: payload.requireParam("id").asNumber(),
      takerWants: payload.requireParam("takerWants").asBigNumber().toFixed(),
      takerGives: payload.requireParam("takerGives").asBigNumber().toFixed(),
      failReason: payload.requireParam("mgvData").asString() as model.core.OfferFailReason,
    };
  });

const parseTakenOffer = () => any([parseOfferSuccess(), parseOfferFail()]);

// Shared functions
export type LogParserContext = Readonly<{
  txHash: proxima.eth.Hash;
  events: proxima.eth.DecodedContractEvent[]; // the full input string
  index: number; // our current position in it
}>;

export type LogParser<T> = Parser<T, LogParserContext>;

export function parseLogs<T>(
  nameOrNames: string | string[],
  mapFunc: (log: proxima.eth.ContractEventPayload) => T
): LogParser<T> {
  return parseLogsIf<T>(nameOrNames, () => true, mapFunc);
}

export function parseLogsIf<T>(
  nameOrNames: string | string[],
  ifFunc: (log: proxima.eth.ContractEventPayload) => true | string,
  mapFunc: (log: proxima.eth.ContractEventPayload) => T
): LogParser<T> {
  const names = typeof nameOrNames == "string" ? [nameOrNames] : nameOrNames;
  const failReason = `log.name not in (${names.join(",")})`;
  return (ctx) => {
    if (ctx.index >= ctx.events.length) return failure(ctx, "end of input");

    const { payload } = ctx.events[ctx.index];

    if (!names.includes(payload.name)) return failure(ctx, failReason);

    const conditionResult = ifFunc(payload);
    if (typeof conditionResult == "string")
      return failure(ctx, conditionResult);

    return success({ ...ctx, index: ctx.index + 1 }, mapFunc(payload));
  };
}
