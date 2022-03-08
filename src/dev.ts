import { buildAppHost } from "@proxima-one/proxima-app-runtime";
import { ParseBlocksApp } from "./apps/parseBlocks";
import { MaterializeViewsApp } from "./apps/materializeViews";

const appHost = buildAppHost();

const id = "mangrove-parseblocks-dev-03";
appHost.start({
  app: ParseBlocksApp,
  dryRun: false,
  id: id,
  args: {
    addresses: {
      mangrove: "0x6f531931A7EaefB95307CcD93a348e4C27F62DCF",
    },
    blockIndexer: "amur",
    network: "polygon-mumbai",
    chainlistId: "80001",
    startBlock: "24053512",
    initialOffset: 24053512,
    outputStream: "domain-events",
  },
  source: {
    db: "kafka-amur",
    streams: ["polygon-mumbai-blockindex"],
  },
  target: {
    db: "kafka-dev",
    namespace: id,
  },
});
