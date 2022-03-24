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

import {
  buildAppHost,
  buildServiceProvider,
} from "@proxima-one/proxima-app-runtime";
import { ParseBlocksApp } from "./apps/parseBlocks";
import { MaterializeViewsApp } from "./apps/materializeViews";

const appHost = buildAppHost();
const id = "mg-blocks-dev";
appHost.start({
  app: ParseBlocksApp,
  dryRun: false,
  id: id,
  args: {
    addresses: {
      mangrove4: "0x6f531931A7EaefB95307CcD93a348e4C27F62DCF",
      //mangrove5: "0xa34b6addf822177258cbd0a9c3a80600c1028ca8",
    },
    skipUnknownEvents: false,
    reset: false,
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
