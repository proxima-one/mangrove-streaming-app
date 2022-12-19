import { ProximaAppRuntime } from "@proxima-one/proxima-app";
import { ParseBlocksApp } from "./apps/parseBlocks";
import { MangroveStrategiesApp } from "./apps/strategies/strategiesParser";
import { Erc20TokensApp } from "./apps/tokens/erc20Tokens";

ProximaAppRuntime.initAndRun({
  "parse-blocks": ParseBlocksApp,
  strategies: MangroveStrategiesApp,
  tokens: Erc20TokensApp,
}).catch((err) => {
  console.error(`ProximaApp error`, err);
});
