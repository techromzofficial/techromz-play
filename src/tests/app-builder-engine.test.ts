import { describe, expect, it } from 'vitest';
import { validateConnections, validateDesign, validateLogic, runDeterministicTest, isPersistentFix } from '../features/games/app-builder/engine';
import { applyStageValidation, earnsRookieBadge, pointsForSuccessfulAttempt, totalScore } from '../features/games/app-builder/scoring';
import { emptyStageResults } from '../features/games/app-builder/stages';
import type { StageResults } from '../features/games/app-builder/types';
import { CHALLENGE_DURATION_SECONDS, createChallengeDeadline, remainingChallengeSeconds } from '../features/games/app-builder/timer';

describe('App Builder deterministic engine', () => {
  it('requires the correct screen components in their useful order', () => {
    expect(validateDesign(['title', 'task-list', 'done-button']).valid).toBe(true);
    expect(validateDesign(['title', 'weather', 'task-list', 'done-button']).valid).toBe(false);
    expect(validateDesign(['task-list', 'title', 'done-button']).valid).toBe(false);
    expect(validateDesign(['title', 'task-list']).valid).toBe(false);
  });

  it('requires both navigation directions', () => {
    expect(validateConnections(['home-details']).valid).toBe(false);
    expect(validateConnections(['details-home']).valid).toBe(false);
    expect(validateConnections(['home-details', 'details-home']).valid).toBe(true);
  });

  it('only accepts status-updating button logic', () => {
    expect(validateLogic('update-status').valid).toBe(true);
    expect(validateLogic('delete-task').valid).toBe(false);
    expect(validateLogic('duplicate-task').valid).toBe(false);
  });

  it('reproduces the reset bug and passes only with shared app state', () => {
    const broken = runDeterministicTest(false);
    expect(broken.passed).toBe(false);
    expect(broken.finalStatus).toBe('Pending');
    expect(broken.steps.map((step) => step.status)).toContain('Done');

    expect(isPersistentFix('local-screen-state')).toBe(false);
    expect(isPersistentFix('shared-app-state')).toBe(true);
    const repaired = runDeterministicTest(true);
    expect(repaired.passed).toBe(true);
    expect(repaired.finalStatus).toBe('Done');
  });
});

describe('App Builder scoring', () => {
  it('awards the exact attempt scores', () => {
    expect(pointsForSuccessfulAttempt(1)).toBe(25);
    expect(pointsForSuccessfulAttempt(2)).toBe(20);
    expect(pointsForSuccessfulAttempt(3)).toBe(15);
    expect(pointsForSuccessfulAttempt(9)).toBe(15);
    expect(pointsForSuccessfulAttempt(0)).toBe(0);
  });

  it('scores four perfect stages at 100 and never duplicates an award', () => {
    let results = emptyStageResults();
    results = applyStageValidation(results, 1, true);
    results = applyStageValidation(results, 2, true);
    results = applyStageValidation(results, 3, true);
    results = applyStageValidation(results, 4, true);
    expect(totalScore(results)).toBe(100);
    const repeated = applyStageValidation(results, 4, true);
    expect(repeated).toBe(results);
    expect(totalScore(repeated)).toBe(100);
  });

  it('keeps unfinished stages at zero and scores second/third attempts correctly', () => {
    let results = emptyStageResults();
    results = applyStageValidation(results, 1, false);
    expect(results[1].points).toBe(0);
    results = applyStageValidation(results, 1, true);
    expect(results[1].points).toBe(20);
    results = applyStageValidation(results, 2, false);
    results = applyStageValidation(results, 2, false);
    results = applyStageValidation(results, 2, true);
    expect(results[2].points).toBe(15);
  });

  it('requires full completion for the Rookie badge at the 70-point boundary', () => {
    const completeAt70: StageResults = {
      1: { completed: true, attempts: 3, points: 15 },
      2: { completed: true, attempts: 3, points: 15 },
      3: { completed: true, attempts: 2, points: 20 },
      4: { completed: true, attempts: 2, points: 20 },
    };
    expect(totalScore(completeAt70)).toBe(70);
    expect(earnsRookieBadge(completeAt70)).toBe(true);
    expect(earnsRookieBadge({ ...completeAt70, 4: { completed: false, attempts: 2, points: 20 } })).toBe(false);
  });
});

describe('App Builder challenge clock', () => {
  it('lasts exactly 90 seconds and remains accurate after delayed callbacks', () => {
    const startedAt = 1_000_000;
    const deadline = createChallengeDeadline(startedAt);
    expect(CHALLENGE_DURATION_SECONDS).toBe(90);
    expect(remainingChallengeSeconds(deadline, startedAt)).toBe(90);
    expect(remainingChallengeSeconds(deadline, startedAt + 1_001)).toBe(89);
    expect(remainingChallengeSeconds(deadline, startedAt + 89_999)).toBe(1);
    expect(remainingChallengeSeconds(deadline, deadline)).toBe(0);
    expect(remainingChallengeSeconds(deadline, deadline + 30_000)).toBe(0);
  });
});
