import { readFlag, writeFlag } from './storage';

const TRAINING_KEY = 'doomed.trainingDone';

export function isTrainingDone(): boolean {
  return readFlag(TRAINING_KEY, false);
}

export function markTrainingDone(): void {
  writeFlag(TRAINING_KEY, true);
}
