const TRAINING_KEY = 'doomed.trainingDone';

export function isTrainingDone(): boolean {
  try {
    return window.localStorage.getItem(TRAINING_KEY) === '1';
  } catch {
    return false;
  }
}

export function markTrainingDone(): void {
  try {
    window.localStorage.setItem(TRAINING_KEY, '1');
  } catch {
    return;
  }
}
