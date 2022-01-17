import { ProximaAppRuntime } from '@proxima-one/proxima-app-runtime';
import { ParseBlocksApp } from './apps/parseBlocks';

ProximaAppRuntime.initAndRun({
  'parse-blocks': ParseBlocksApp,
}).catch((err) => {
  console.error(`ProximaApp error`, err);
});
