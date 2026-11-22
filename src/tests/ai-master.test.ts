import { describe, it, expect } from 'vitest';
import {
  createLevel1InitialState,
  level1Reducer,
  scoreLevel1,
  level1Roles,
  level1Instructions,
} from '../features/games/ai-master/levels/level1';
import {
  achievementFor,
  challengeText,
} from '../features/games/ai-master/AiMasterGame';

describe('AI Master Level 1 Gameplay & Scoring', () => {
  it('initializes with default intro state', () => {
    const state = createLevel1InitialState();
    expect(state.phase).toBe('intro');
    expect(state.seconds).toBe(30);
    expect(state.role).toBeNull();
    expect(state.selected).toEqual([]);
    expect(state.tested).toBe(false);
    expect(state.verified).toBeNull();
  });

  it('progresses through role selection, instruction building, and testing', () => {
    const now = Date.now();
    let state = level1Reducer(createLevel1InitialState(), { type: 'start', timed: true, now });
    expect(state.phase).toBe('role');
    expect(state.timed).toBe(true);

    // Select Study coach (tutor)
    state = level1Reducer(state, { type: 'role', role: 'tutor', now });
    expect(state.role).toBe('tutor');

    // Confirm role
    state = level1Reducer(state, { type: 'confirm-role', now });
    expect(state.phase).toBe('instructions');

    // Select two valid instructions: simple + check
    state = level1Reducer(state, { type: 'toggle', id: 'simple', now });
    state = level1Reducer(state, { type: 'toggle', id: 'check', now });
    expect(state.selected).toHaveLength(2);
    expect(state.selected).toContain('simple');
    expect(state.selected).toContain('check');

    // Test creation
    state = level1Reducer(state, { type: 'test', now });
    expect(state.phase).toBe('test');
    expect(state.tested).toBe(true);

    // Complete with verification = true
    state = level1Reducer(state, { type: 'finish', verify: true, now });
    expect(state.phase).toBe('result');
    expect(state.verified).toBe(true);
    expect(state.expired).toBe(false);

    // Calculate score
    const score = scoreLevel1(state);
    expect(score.rolePoints).toBe(20);
    expect(score.instructionPoints).toBe(50);
    expect(score.verificationPoints).toBe(30);
    expect(score.total).toBe(100);
  });

  it('awards correct achievement based on score', () => {
    expect(achievementFor(100).title).toBe('AI Master');
    expect(achievementFor(75).title).toBe('Prompt Pioneer');
    expect(achievementFor(50).title).toBe('AI Explorer');
    expect(achievementFor(20).title).toBe('AI Rookie');
    expect(achievementFor(30, true).title).toBe('Quick Thinker');
  });

  it('generates challenge text matching score and mode', () => {
    const timedText = challengeText(100, true);
    expect(timedText).toContain('100/100');
    expect(timedText).toContain('in 30 seconds');

    const practiceText = challengeText(80, false);
    expect(practiceText).toContain('80/100');
    expect(practiceText).toContain('in practice mode');
  });
});
