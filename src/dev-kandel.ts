import { buildAppHost } from "@proxima-one/proxima-app";
import { KandelParserApp } from "./apps/kandel/kandelParser";

const appHost = buildAppHost();

appHost.start({
  app: KandelParserApp,
  dryRun: true,
  id: "kandel.parser",
  args: {
    batch: 500,
    readBuffer: 1000,
    addresses: {
      seeder: "0xe8904c912ffe1445cfb3f6d6643db6590639910f",
    },
    network: "polygon-mumbai",
    blockIdInput: true,
    startBlock: "33055259",
    input: {
      default: {
        id: "proxima.polygon-mumbai.blocks-sync.1_0",
        height: "33055259",
        startHeight: "33055259",
        db: "core-us",
      },
    },
    output: {
      default: "polygon-mumbai-kandel",
    },
    db: "kafka-dev-ivan",
    stateManager: "state-manager-local",
  },
});
