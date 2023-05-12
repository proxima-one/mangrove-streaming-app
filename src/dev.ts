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
import { Erc20TokensApp } from "./apps/tokens/erc20Tokens";

const appHost = buildAppHost();

const mangroveStrategiesApp = {
  app: MangroveStrategiesApp,
  dryRun: true,
  id: "mangrove-strategies",
  args: {
    startBlock: "26587386", //"26524069",
    input: {
      default: {
        id: "proxima.polygon-mumbai.blocks.1_0",
        startHeight: "26587386",
      },
    },
    output: {
      default: "strategies1",
    },
    addresses: {
      mangrove8: "0xad90a2a9bdcb630c976cacea1253d89edf74da5e",
      mangroveOrder: "0xF511135Bc98D7a5cf694Fa6751322de93e2135dA"
    },
    network: "polygon-mumbai",
    stateManager: "state-manager-local",
    batch: "10",
    readBuffer: "1000",
    chainlistId: 80001,
    mangroveAddress: "0x6f531931a7eaefb95307ccd93a348e4c27f62dcf",

    db: "core-us",
  },
};

const parseBlocksApp = {
  app: ParseBlocksApp,
  dryRun: false,
  id: "mg-blocks-dev",
  args: {
    reset: true,
    batch: 50,
    readBuffer: 100,
    db: "kafka-dev-ivan",
    output: {
      default: "domain-events1",
    },
    stateManager: "state-manager-local",
    input: {
      default: {
        id: "proxima.polygon-mumbai.blocks-sync.1_0",
        startHeight: "32291088",
        db: "core-us",
      },
    },
    network: "polygon-mumbai",
    addresses: { mangrove8: "0xAd90a2a9BdcB630c976CaceA1253D89edf74da5e" },
    chainlistId: 80001,
    startBlock: "32291188",
    blockIdInput: true,
  },

};

const tokenDiscoveryApp = {
  app: Erc20TokensApp,
  dryRun: true,
  id: "mangrove-erc20-tokens",
  args: {
    network: "polygon-mumbai",
    stateManager: "state-manager-local",
    reset: false,
    input: {
      default: "proxima.mangrove.polygon-mumbai.domain-events.0_3",
    },
    output: {
      default: "debug-mangrove-polygon-mumbai-discovery-erc20",
    },
    db: "core-us",
  },
};

appHost.start(tokenDiscoveryApp);

if (false) {
  appHost.start(parseBlocksApp);
}
