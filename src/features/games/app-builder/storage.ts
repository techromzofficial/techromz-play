import type { AppBuilderMode, AppBuilderResult } from './types';

export const APP_BUILDER_STORAGE_KEY = 'techromz.app-builder.progress.v1';
export const APP_BUILDER_STORAGE_VERSION = 1;

export type AppBuilderProgress = {
  version: 1;
  bestChallengeScore: number;
  bestPracticeScore: number;
  completedRuns: number;
  lastResult?: AppBuilderResult;
};

export const emptyProgress = (): AppBuilderProgress => ({
  version: APP_BUILDER_STORAGE_VERSION,
  bestChallengeScore: 0,
  bestPracticeScore: 0,
  completedRuns: 0,
});

const validScore = (value: unknown): value is number => Number.isInteger(value) && Number(value) >= 0 && Number(value) <= 100;

export function parseProgress(raw: string | null): AppBuilderProgress {
  if (!raw) return emptyProgress();
  try {
    const value = JSON.parse(raw) as Partial<AppBuilderProgress>;
    const completedRuns = value.completedRuns;
    if (value.version !== APP_BUILDER_STORAGE_VERSION || !validScore(value.bestChallengeScore) || !validScore(value.bestPracticeScore) || !Number.isInteger(completedRuns) || typeof completedRuns !== 'number' || completedRuns < 0) {
      return emptyProgress();
    }
    return {
      version: APP_BUILDER_STORAGE_VERSION,
      bestChallengeScore: value.bestChallengeScore,
      bestPracticeScore: value.bestPracticeScore,
      completedRuns,
      ...(value.lastResult ? { lastResult: value.lastResult } : {}),
    };
  } catch {
    return emptyProgress();
  }
}

export function loadProgress(storage?: Pick<Storage, 'getItem'>): AppBuilderProgress {
  try {
    const target = storage ?? window.localStorage;
    return parseProgress(target.getItem(APP_BUILDER_STORAGE_KEY));
  } catch {
    return emptyProgress();
  }
}

export function saveResult(result: AppBuilderResult, storage?: Pick<Storage, 'getItem' | 'setItem'>): AppBuilderProgress {
  const target = storage ?? window.localStorage;
  const current = loadProgress(target);
  const next: AppBuilderProgress = {
    version: APP_BUILDER_STORAGE_VERSION,
    bestChallengeScore: result.mode === 'challenge' ? Math.max(current.bestChallengeScore, result.score) : current.bestChallengeScore,
    bestPracticeScore: result.mode === 'practice' ? Math.max(current.bestPracticeScore, result.score) : current.bestPracticeScore,
    completedRuns: current.completedRuns + (result.completed ? 1 : 0),
    lastResult: result,
  };
  try { target.setItem(APP_BUILDER_STORAGE_KEY, JSON.stringify(next)); } catch { /* Continue in memory when storage is unavailable. */ }
  return next;
}

export function bestForMode(progress: AppBuilderProgress, mode: AppBuilderMode): number {
  return mode === 'challenge' ? progress.bestChallengeScore : progress.bestPracticeScore;
}
