import { describe, it, expect } from 'vitest';
import {
  createLevel2InitialState,
  level2Reducer,
  scoreLevel2,
  level2Sources,
  level2Instructions,
  level2Tests,
  expectedLevel2TestSelection,
  isLevel2TestCorrect,
} from '../features/games/ai-master/levels/level2';
import { evaluateLabRepair } from '../features/games/ai-master/labInteraction';

describe('AI Master Level 2 — Knowledge Lab Simulation', () => {
  it('initializes in briefing phase with zero points', () => {
    const state = createLevel2InitialState();
    expect(state.phase).toBe('briefing');
    expect(state.seconds).toBe(90);
    const score = scoreLevel2(state);
    expect(score.total).toBe(0);
  });

  it('completes all four stages with perfect 100/100 score', () => {
    const now = Date.now();
    let state = level2Reducer(createLevel2InitialState(), { type: 'start', mode: 'timed', now });
    expect(state.phase).toBe('sources');

    // Stage 1: Source Hunt (place 2 verified sources)
    state = level2Reducer(state, { type: 'place-source', slot: 0, id: 'verified-stock', now });
    state = level2Reducer(state, { type: 'place-source', slot: 1, id: 'official-returns', now });
    state = level2Reducer(state, { type: 'confirm-sources', now });
    expect(state.phase).toBe('configure');

    // Stage 2: Core Configuration (place 2 reliable instruction modules)
    state = level2Reducer(state, { type: 'place-instruction', slot: 0, id: 'verified-only', now });
    state = level2Reducer(state, { type: 'place-instruction', slot: 1, id: 'admit-uncertainty', now });
    state = level2Reducer(state, { type: 'confirm-configuration', now });
    expect(state.phase).toBe('tests');

    // Stage 3: Evidence Challenge Test 1 & 2
    for (const test of level2Tests) {
      const expected = expectedLevel2TestSelection(state, test.id);
      state = level2Reducer(state, {
        type: 'select-test-answer',
        testId: test.id,
        answerId: expected.answerId,
        sourceId: expected.sourceId,
        responseText: 'Sample response text',
        now,
      });
      state = level2Reducer(state, { type: 'confirm-test', testId: test.id, now });
    }
    expect(state.phase).toBe('improve');

    // Stage 4: Repair Lab
    const repairId = evaluateLabRepair(['acknowledge', 'update'], true);
    expect(repairId).toBe('request-verified-update');

    state = level2Reducer(state, { type: 'select-repair', id: repairId, now });
    state = level2Reducer(state, { type: 'confirm-repair', now });
    expect(state.phase).toBe('result');

    // Total score validation
    const score = scoreLevel2(state);
    expect(score.sourcePoints).toBe(30);
    expect(score.configurationPoints).toBe(20);
    expect(score.testPoints).toBe(30);
    expect(score.repairPoints).toBe(20);
    expect(score.total).toBe(100);
  });
});
