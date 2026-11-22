import type { StageId, StageResults } from './types';

export const MAX_STAGE_SCORE = 25;
export const MAX_SCORE = 100;

export function pointsForSuccessfulAttempt(attempt: number): number {
  if (!Number.isFinite(attempt) || attempt < 1) return 0;
  if (attempt === 1) return 25;
  if (attempt === 2) return 20;
  return 15;
}

export function totalScore(results: StageResults): number {
  return Math.min(MAX_SCORE, Math.max(0, Object.values(results).reduce((sum, stage) => sum + stage.points, 0)));
}

export function applyStageValidation(results: StageResults, stage: StageId, valid: boolean): StageResults {
  if (results[stage].completed) return results;
  const attempts = results[stage].attempts + 1;
  return {
    ...results,
    [stage]: {
      completed: valid,
      attempts,
      points: valid ? pointsForSuccessfulAttempt(attempts) : 0,
    },
  };
}

export function earnsRookieBadge(results: StageResults): boolean {
  return Object.values(results).every((stage) => stage.completed) && totalScore(results) >= 70;
}

export function scoreBand(score: number): '0-39' | '40-69' | '70-79' | '80-100' {
  if (score >= 80) return '80-100';
  if (score >= 70) return '70-79';
  if (score >= 40) return '40-69';
  return '0-39';
}
