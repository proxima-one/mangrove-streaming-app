export function barrier(resourcesCount: number = 1): Barrier {
  let unlock = () => {};
  let unlockWithError = (err:any) => {};

  let resourcesLeft = resourcesCount;
  const lock = new Promise<void>((resolve, reject) => {
    unlock = () => {
      resourcesLeft--;
      if (resourcesLeft == 0)
        resolve();
    };
    unlockWithError = (err:any) => reject(err);

    if (resourcesLeft === 0)
      resolve();
  });

  return { lock, unlock, unlockWithError }
}

export type Barrier = {
  lock: Promise<void>;
  unlock: () => void;
  unlockWithError: (err:any) => void
}
