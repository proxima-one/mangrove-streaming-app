import { ProximaAppRuntime } from "@proxima-one/proxima-app";
import { ParseBlocksApp } from "./apps/parseBlocks";
import { MangroveStrategiesApp } from "./apps/strategies/strategiesParser";

ProximaAppRuntime.initAndRun({
  "parse-blocks": ParseBlocksApp,
  strategies: MangroveStrategiesApp,
}).catch((err) => {
  console.error(`ProximaApp error`, err);
});
