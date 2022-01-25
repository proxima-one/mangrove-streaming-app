// eslint-disable-next-line @typescript-eslint/no-var-requires
// const moduleAlias = require("module-alias");
// moduleAlias.addAlias()

import { ProximaAppRuntime } from "@proxima-one/proxima-app-runtime";
import { ParseBlocksApp } from "./apps/parseBlocks";
import { MaterializeViewsApp } from "./apps/materializeViews";

ProximaAppRuntime.initAndRun({
  "parse-blocks": ParseBlocksApp,
  "materialize-views": MaterializeViewsApp,
}).catch((err) => {
  console.error(`ProximaApp error`, err);
});
