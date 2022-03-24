import { buildAppHost, buildServiceProvider } from "@proxima-one/proxima-app-runtime";
import { ParseBlocksApp } from "./apps/parseBlocks";
import { MaterializeViewsApp } from "./apps/materializeViews";

const appHost = buildAppHost();
const id = "mangrove-parseblocks-dev-08";
appHost.start({
  app: ParseBlocksApp,
  dryRun: false,
  id: id,
  args: {
    addresses: {
      //mangrove4: "0x6f531931A7EaefB95307CcD93a348e4C27F62DCF",
      mangrove5: "0xa34b6addf822177258cbd0a9c3a80600c1028ca8",
    },

    blockIndexer: "amur",
    network: "polygon-mumbai",
    chainlistId: "80001",
    startBlock: "25605808",
    initialOffset: 25705808,
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
