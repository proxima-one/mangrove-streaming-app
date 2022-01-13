import { ProximaAppRuntime } from '@proxima-one/proxima-app-runtime';

ProximaAppRuntime.initAndRun({}).catch((err) => {
  console.error(`ProximaApp error`, err);
});
