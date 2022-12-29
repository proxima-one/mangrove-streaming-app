import * as schema from "@proximaone/stream-schema-mangrove";
import * as ft from "@proximaone/stream-schema-ft";
import * as ethBase from "@proximaone/stream-schema-eth-base";
import { strict as assert } from "assert";
import {
  MapStreamEventsApp,
  MapStreamEventsArgs,
  StateAccessor,
  StreamEvent,
  StreamEventList,
  StreamEventPayload,
} from "@proxima-one/proxima-app-streaming";
import {
  AppRuntimeEnvironment,
  Bytes,
  mapLookup,
  toLookup,
} from "@proxima-one/proxima-core";
import { Erc20, EthModel, EthPlugin } from "@proxima-one/proxima-plugin-eth";
import { EthNetworkClient } from "@proxima-one/proxima-plugin-eth/dist/model/interfaces";
import { getStates, boolSerdes } from "./state";
import _ from "lodash";
import BN from "bn.js";

export class Erc20TokensApp extends MapStreamEventsApp<MapStreamEventsArgs> {
  public constructor(env: AppRuntimeEnvironment, args: MapStreamEventsArgs) {
    assert(
      args.input && args.input.default && Object.keys(args.input).length == 1,
      "single default input stream is required"
    );
    assert(
      args.output &&
        args.output.default &&
        Object.keys(args.output).length == 1,
      "single default output stream is required"
    );

    super(env, args, false);
  }

  private serdes = {
    input: schema.streams.mangrove.serdes,
    output: ft.discovery.serdes.json.JsonSerializer,
  };

  protected ethClient!: EthNetworkClient;
  protected erc20DataProvider!: Erc20.DataProvider;

  protected async initialize() {
    (this.ethClient = await (
      await this.plugin(EthPlugin)
    ).getNetworkClient(this.args.network)),
      await super.initialize();

    this.erc20DataProvider = new Erc20.DataProvider(this.ethClient);
  }

  protected async mapEvents(
    events: StreamEventList,
    stateAccessor?: StateAccessor
  ): Promise<StreamEventList> {
    if (!stateAccessor) throw new Error("State is not defined.");
    const typedEvents = events.items
      .map((x) => {
        return {
          event: this.serdes.input.deserialize(x.payload.data.toByteArray()),
          timestamp: x.timestamp,
        };
      })
      .filter((x) => x.event.type == "OfferListParamsUpdated")
      .map((x) => {
        return {
          event: x.event as schema.events.OfferListParamsUpdated,
          timestamp: x.timestamp,
        };
      });

    const tokenIds = _.uniq(
      typedEvents
        .map((x) => [
          x.event.offerList.inboundToken,
          x.event.offerList.outboundToken,
        ])
        .flat()
    );

    if (tokenIds.length == 0) return new StreamEventList([]);

    const states = await getStates(stateAccessor, _.uniq(tokenIds));
    const newTokenIds = tokenIds.filter((x) => !states[x]);

    this.logger.info(
      `found ${newTokenIds.length} new potential tokens. fetching details from the network...`
    );

    const newTokens = toLookup(
      await this.erc20DataProvider.getTokens(
        newTokenIds.map((x) => EthModel.Address.fromHexString(x))
      ),
      (x) => x.id.toHexString()
    );

    const validTokensCount = Object.values(newTokens).filter((x) => x).length;

    this.logger.info(`fetched ${validTokensCount} valid token details.`);

    const res: StreamEvent[] = [];

    for (const item of typedEvents) {
      const tokenIds = [
        item.event.offerList.inboundToken,
        item.event.offerList.outboundToken,
      ];
      for (let i = 0; i < tokenIds.length; i++) {
        const tokenId = tokenIds[i];
        const token = newTokens[tokenId];

        if (!token || states[tokenId]) continue;

        states[tokenId] = true;

        const mappedEvent = new ft.discovery.Token(
          ethBase.Address.fromHexString(token.id.toHexString()),
          token.symbol,
          token.name,
          new BN(token.totalSupply.toFixed()),
          token.decimals
        );
        res.push(
          new StreamEvent(
            new StreamEventPayload(
              "default",
              Bytes.fromByteArray(this.serdes.output.serialize(mappedEvent))
            ),
            item.timestamp.addParts(i)
          )
        );
      }
    }

    await stateAccessor.set(
      mapLookup(newTokens, (_) => boolSerdes.serialize(true))
    );

    this.logger.info(`publishing ${res.length} events.`);

    return new StreamEventList(res);
  }
}
