import { buildAppHost } from "@proxima-one/proxima-app-runtime";
import { ParseBlocksApp } from "./apps/parseBlocks";
import { MaterializeViewsApp } from "./apps/materializeViews";

const appHost = buildAppHost();

const id = "dev1";
appHost.start({
  app: MaterializeViewsApp,
  dryRun: false,
  id: id,
  args: {},
  source: {
    db: "kafka-main-prod",
    streams: ["mangrove4-domain-events"]
  },
  target: {
    db: "kafka-dev",
    namespace: id,
  }
});
