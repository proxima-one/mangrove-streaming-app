// import { buildAppHost, buildServiceProvider } from "@proxima-one/proxima-app-runtime";
// import { ParseBlocksApp } from "./apps/parseBlocks";
// import { MaterializeViewsApp } from "./apps/materializeViews";
//
// import { eth } from "@proxima-one/proxima-core";
// import * as abi from "./apps/parseBlocks/abi";
//
// const appHost = buildAppHost();
//
// const contract = eth.ContractMetadata.fromAbi(abi.v5.mangrove);
//
// async function main() {
//   const services = buildServiceProvider();
//   const bi = await services.getEthBlockIndexer("amur", "polygon-mumbai");
//
//   const blocks = await bi.filterBlocks(["24081013-0xb9e2564cb72b779889d4294a9f7a300d8bd2b112f0148efa786d9748a031253d"],
//     new eth.BlockFilter(new eth.AddressSet().add([eth.Address.fromHexString("0x6f531931A7EaefB95307CcD93a348e4C27F62DCF")])));
//
//   for (const block of blocks) {
//     for (const tx of block!.transactions) {
//       for (const ev of tx.originalTx.receipt!.events) {
//         const decodedEvent = contract.tryDecodeEventPayload(ev.payload);
//         console.log(decodedEvent);
//       }
//     }
//   }
//   console.log(blocks);
// }
//
// main();

import { buildAppHost } from "@proxima-one/proxima-app";
import { MangroveStrategiesApp } from "./apps/strategies/strategiesParser";
import { ParseBlocksApp } from "./apps/parseBlocks";

const appHost = buildAppHost();

const mangroveStrategiesApp = {
  app: MangroveStrategiesApp,
  dryRun: false,
  id: "mangrove-strategies",
  args: {
    initialOffset: "26587386", //"26524069",
    input: {
      default: "polygon-mumbai-blockheader",
    },
    output: {
      default: "strategies"
    },
    network: "polygon-mumbai",
    stateManager: "state-manager-local",
    batch: "10",
    readBuffer: "1000",
    chainlistId: "80001",
    mangroveAddress: "0x6f531931a7eaefb95307ccd93a348e4c27f62dcf",

    db: "streamdb-01",
  },
};

const parseBlocksApp = {
  app: ParseBlocksApp,
  dryRun: false,
  id: "mg-blocks-dev",
  args: {
    addresses: {
      mangrove4: "0x6f531931A7EaefB95307CcD93a348e4C27F62DCF",
      mangrove5: "0xa34b6addf822177258cbd0a9c3a80600c1028ca8",
      mangrove6: "0xF3e339d8a0B989114412fa157Cc846ebaf4BCbd8",
    },
    skipUnknownEvents: false,
    reset: true,
    network: "polygon-mumbai",
    stateManager: "state-manager-local",
    chainlistId: "80001",
    startBlock: "26224255",
    initialOffset: 26224255,

    input: {
      default: "polygon-mumbai-blockheader",
    },
    output: {
      default: "domain-events",
    },

    db: "streamdb-01",
  },
};

appHost.start(mangroveStrategiesApp);

if (false) {
  appHost.start(parseBlocksApp);
}
