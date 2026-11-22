export const LEVEL_2_DURATION_MS = 90_000;
export const LEVEL_2_MAX_SCORE = 100;

export const level2Sources = [
  {
    id: 'verified-stock',
    title: 'Verified stock sheet',
    trust: 'verified',
    content: 'Model A: 3 units. Model B: 0 units. Updated today within this simulation.',
    points: 15,
  },
  {
    id: 'official-returns',
    title: 'Official returns policy',
    trust: 'verified',
    content: 'Unused items may be returned within 7 days with a receipt. No other conditions are supplied.',
    points: 15,
  },
  {
    id: 'old-flyer',
    title: 'Old promotional flyer',
    trust: 'outdated',
    content: 'Model B was available last month and 14-day returns were advertised.',
    points: 0,
  },
  {
    id: 'social-comment',
    title: 'Unverified social comment',
    trust: 'unverified',
    content: 'Claims that all laptops have lifetime returns.',
    points: 0,
  },
] as const;

export const level2Instructions = [
  {
    id: 'verified-only',
    title: 'Use verified sources only',
    detail: 'Ground each answer in selected, trusted knowledge.',
    points: 10,
  },
  {
    id: 'admit-uncertainty',
    title: 'Admit uncertainty and ask for clarification',
    detail: 'Say when reliable information is missing.',
    points: 10,
  },
  {
    id: 'always-guess',
    title: 'Always guess',
    detail: 'Invent an answer when information is unavailable.',
    points: 0,
  },
  {
    id: 'promise-availability',
    title: 'Promise every item is available',
    detail: 'Give customers certainty without checking stock.',
    points: 0,
  },
] as const;

export const level2Tests = [
  {
    id: 'model-b-stock',
    question: 'Is Model B available?',
    requiredSource: 'verified-stock',
    supportedAnswer: 'model-b-zero',
    insufficientAnswer: 'not-enough-stock-information',
    answers: [
      { id: 'model-b-zero', text: 'No. Model B currently has zero units in stock.' },
      { id: 'model-b-old-flyer', text: 'Yes. An older flyer advertised Model B.' },
      { id: 'all-models-available', text: 'Yes. All laptop models are always available.' },
      { id: 'not-enough-stock-information', text: 'Not enough verified information.' },
    ],
  },
  {
    id: 'five-day-return',
    question: 'Can I return an unused item after 5 days with a receipt?',
    requiredSource: 'official-returns',
    supportedAnswer: 'return-within-seven-days',
    insufficientAnswer: 'not-enough-return-information',
    answers: [
      { id: 'return-within-seven-days', text: 'Yes, under the 7-day return policy.' },
      { id: 'lifetime-returns', text: 'Yes. Every laptop has lifetime returns.' },
      { id: 'no-returns', text: 'No. The shop does not accept returns.' },
      { id: 'not-enough-return-information', text: 'Not enough verified information.' },
    ],
  },
] as const;

export const level2Repairs = [
  {
    id: 'request-verified-update',
    text: 'The available stock sheet does not list Model C. Request a verified stock update before answering.',
    points: 20,
  },
  { id: 'promise-model-c', text: 'Promise that Model C is available.', points: 0 },
  { id: 'infer-from-model-a', text: 'Infer Model C availability from Model A stock.', points: 0 },
] as const;

export type Level2SourceId = typeof level2Sources[number]['id'];
export type Level2InstructionId = typeof level2Instructions[number]['id'];
export type Level2TestId = typeof level2Tests[number]['id'];
export type Level2AnswerId = typeof level2Tests[number]['answers'][number]['id'];
export type Level2RepairId = typeof level2Repairs[number]['id'];
export type Level2Mode = 'timed' | 'practice';
export type Level2Phase = 'briefing' | 'sources' | 'configure' | 'tests' | 'improve' | 'result';

export type Level2TestSelection = {
  answerId: Level2AnswerId;
  sourceId: Level2SourceId | null;
  responseText?: string;
};

export type Level2State = {
  phase: Level2Phase;
  mode: Level2Mode;
  deadline: number | null;
  seconds: number;
  selectedSources: Level2SourceId[];
  sourceSlots: [Level2SourceId | null, Level2SourceId | null];
  sourcesConfirmed: boolean;
  selectedInstructions: Level2InstructionId[];
  instructionSlots: [Level2InstructionId | null, Level2InstructionId | null];
  configurationConfirmed: boolean;
  currentTestIndex: number;
  testSelections: Partial<Record<Level2TestId, Level2TestSelection>>;
  confirmedTests: Level2TestId[];
  repairSelection: Level2RepairId | null;
  repairConfirmed: boolean;
  expired: boolean;
};

export type Level2Action =
  | { type: 'start'; mode: Level2Mode; now: number }
  | { type: 'tick'; now: number }
  | { type: 'place-source'; id: Level2SourceId | null; slot: 0 | 1; now: number }
  | { type: 'place-instruction'; id: Level2InstructionId | null; slot: 0 | 1; now: number }
  | { type: 'toggle-source'; id: Level2SourceId; now: number }
  | { type: 'confirm-sources'; now: number }
  | { type: 'toggle-instruction'; id: Level2InstructionId; now: number }
  | { type: 'confirm-configuration'; now: number }
  | { type: 'select-test-answer'; testId: Level2TestId; answerId: Level2AnswerId; sourceId: Level2SourceId | null; responseText?: string; now: number }
  | { type: 'confirm-test'; testId: Level2TestId; now: number }
  | { type: 'select-repair'; id: Level2RepairId; now: number }
  | { type: 'confirm-repair'; now: number }
  | { type: 'reset' };

export const createLevel2InitialState = (): Level2State => ({
  phase: 'briefing',
  mode: 'timed',
  deadline: null,
  seconds: 90,
  selectedSources: [],
  sourceSlots: [null, null],
  sourcesConfirmed: false,
  selectedInstructions: [],
  instructionSlots: [null, null],
  configurationConfirmed: false,
  currentTestIndex: 0,
  testSelections: {},
  confirmedTests: [],
  repairSelection: null,
  repairConfirmed: false,
  expired: false,
});

function toggleLimited<T>(items: T[], item: T, limit: number) {
  if (items.includes(item)) return items.filter((candidate) => candidate !== item);
  return items.length < limit ? [...items, item] : items;
}

function expireIfRequired(state: Level2State, now: number) {
  if (state.deadline !== null && now >= state.deadline) {
    return { ...state, phase: 'result' as const, seconds: 0, expired: true };
  }
  return null;
}

export function level2Reducer(state: Level2State, action: Level2Action): Level2State {
  if (action.type === 'reset') return createLevel2InitialState();
  if (action.type === 'start') {
    return {
      ...createLevel2InitialState(),
      phase: 'sources',
      mode: action.mode,
      deadline: action.mode === 'timed' ? action.now + LEVEL_2_DURATION_MS : null,
    };
  }
  if (state.phase === 'briefing' || state.phase === 'result') return state;

  const expired = expireIfRequired(state, action.now);
  if (expired) return expired;

  if (action.type === 'tick') {
    return state.deadline === null
      ? state
      : { ...state, seconds: Math.ceil((state.deadline - action.now) / 1000) };
  }
  if (action.type === 'place-source' && state.phase === 'sources') {
    if (action.id !== null && !level2Sources.some(source => source.id === action.id)) return state;
    const slots = placeInLabSlots(state.sourceSlots, action.slot, action.id);
    return { ...state, sourceSlots: slots, selectedSources: slots.filter((id): id is Level2SourceId => id !== null) };
  }
  if (action.type === 'place-instruction' && state.phase === 'configure') {
    if (action.id !== null && !level2Instructions.some(item => item.id === action.id)) return state;
    const slots = placeInLabSlots(state.instructionSlots, action.slot, action.id);
    return { ...state, instructionSlots: slots, selectedInstructions: slots.filter((id): id is Level2InstructionId => id !== null) };
  }
  if (action.type === 'toggle-source' && state.phase === 'sources') {
    const selectedSources = toggleLimited(state.selectedSources, action.id, 2);
    return { ...state, selectedSources, sourceSlots: [selectedSources[0] ?? null, selectedSources[1] ?? null] };
  }
  if (action.type === 'confirm-sources' && state.phase === 'sources' && state.selectedSources.length === 2) {
    return { ...state, sourcesConfirmed: true, phase: 'configure' };
  }
  if (action.type === 'toggle-instruction' && state.phase === 'configure') {
    const selectedInstructions = toggleLimited(state.selectedInstructions, action.id, 2);
    return { ...state, selectedInstructions, instructionSlots: [selectedInstructions[0] ?? null, selectedInstructions[1] ?? null] };
  }
  if (action.type === 'confirm-configuration' && state.phase === 'configure' && state.selectedInstructions.length === 2) {
    return { ...state, configurationConfirmed: true, phase: 'tests' };
  }
  if (action.type === 'select-test-answer' && state.phase === 'tests') {
    const expectedTest = level2Tests[state.currentTestIndex];
    if (!expectedTest || expectedTest.id !== action.testId || state.confirmedTests.includes(action.testId)) return state;
    if (!expectedTest.answers.some((answer) => answer.id === action.answerId)) return state;
    if (action.sourceId !== null && !state.selectedSources.includes(action.sourceId)) return state;
    return {
      ...state,
      testSelections: {
        ...state.testSelections,
        [action.testId]: { answerId: action.answerId, sourceId: action.sourceId, ...(action.responseText ? { responseText: action.responseText } : {}) },
      },
    };
  }
  if (action.type === 'confirm-test' && state.phase === 'tests') {
    const expectedTest = level2Tests[state.currentTestIndex];
    if (!expectedTest || expectedTest.id !== action.testId || !state.testSelections[action.testId]) return state;
    const confirmedTests = [...state.confirmedTests, action.testId];
    const hasMoreTests = state.currentTestIndex + 1 < level2Tests.length;
    return {
      ...state,
      confirmedTests,
      currentTestIndex: hasMoreTests ? state.currentTestIndex + 1 : state.currentTestIndex,
      phase: hasMoreTests ? 'tests' : 'improve',
    };
  }
  if (action.type === 'select-repair' && state.phase === 'improve') {
    return { ...state, repairSelection: action.id };
  }
  if (action.type === 'confirm-repair' && state.phase === 'improve' && state.repairSelection !== null) {
    return { ...state, repairConfirmed: true, phase: 'result' };
  }
  return state;
}

export function expectedLevel2TestSelection(state: Pick<Level2State, 'selectedSources'>, testId: Level2TestId): Level2TestSelection {
  const fixture = level2Tests.find((test) => test.id === testId);
  if (!fixture) throw new Error(`Unknown Level 2 test: ${testId}`);

  if (state.selectedSources.includes(fixture.requiredSource)) {
    return { answerId: fixture.supportedAnswer, sourceId: fixture.requiredSource };
  }
  return { answerId: fixture.insufficientAnswer, sourceId: null };
}

export function isLevel2TestCorrect(state: Level2State, testId: Level2TestId) {
  if (!state.confirmedTests.includes(testId)) return false;
  const selection = state.testSelections[testId];
  if (!selection) return false;
  const expected = expectedLevel2TestSelection(state, testId);
  return selection.answerId === expected.answerId && selection.sourceId === expected.sourceId;
}

export function scoreLevel2(state: Level2State) {
  const sourcePoints = state.sourcesConfirmed
    ? state.selectedSources.reduce((points, id) => points + (level2Sources.find((source) => source.id === id)?.points ?? 0), 0)
    : 0;
  const configurationPoints = state.configurationConfirmed
    ? state.selectedInstructions.reduce((points, id) => points + (level2Instructions.find((instruction) => instruction.id === id)?.points ?? 0), 0)
    : 0;
  const testPoints = level2Tests.reduce(
    (points, test) => points + (isLevel2TestCorrect(state, test.id) ? 15 : 0),
    0,
  );
  const repairPoints = state.repairConfirmed
    ? level2Repairs.find((repair) => repair.id === state.repairSelection)?.points ?? 0
    : 0;
  const total = Math.min(LEVEL_2_MAX_SCORE, Math.max(0, sourcePoints + configurationPoints + testPoints + repairPoints));

  return { sourcePoints, configurationPoints, testPoints, repairPoints, total };
}

export function level2StageFeedback(state: Level2State) {
  const score = scoreLevel2(state);
  return {
    sources: score.sourcePoints === 30
      ? 'Both selected sources are current and authoritative.'
      : 'Prefer current, official sources over outdated or unverified claims.',
    configuration: score.configurationPoints === 20
      ? 'The assistant is configured to use evidence and admit uncertainty.'
      : 'Reliable assistants should avoid guesses and clearly communicate uncertainty.',
    tests: score.testPoints === 30
      ? 'Both answers match the knowledge that was actually selected.'
      : 'An answer is grounded only when its claim and cited source both match.',
    repair: score.repairPoints === 20
      ? 'The unsupported claim was repaired by requesting verified information.'
      : 'When evidence is missing, acknowledge the gap instead of inferring or promising.',
  };
}


/** Slot placement is atomic: replace or move a component without duplicating it. */
export function placeInLabSlots<T extends string>(slots: [T | null, T | null], target: 0 | 1, item: T | null): [T | null, T | null] {
  const next: [T | null, T | null] = [...slots];
  if (item !== null) {
    if (next[0] === item) next[0] = null;
    if (next[1] === item) next[1] = null;
  }
  next[target] = item;
  return next;
}
