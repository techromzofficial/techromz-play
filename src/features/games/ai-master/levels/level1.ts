export const LEVEL_1_DURATION_MS = 30_000;

export const level1Roles = [
  { id: 'tutor', label: 'Study coach', detail: 'Help a student prepare for an exam.' },
  { id: 'sales', label: 'Sales assistant', detail: 'Help customers choose products.' },
  { id: 'coder', label: 'Coding assistant', detail: 'Help developers write software.' },
] as const;

export const level1Instructions = [
  { id: 'simple', label: 'Explain in simple steps', detail: 'Make the answer easy to follow.' },
  { id: 'guess', label: 'Guess missing facts', detail: 'Never admit uncertainty.' },
  { id: 'check', label: 'Ask about the subject', detail: 'Clarify before giving specific advice.' },
  { id: 'long', label: 'Use technical jargon', detail: 'Make every answer sound advanced.' },
] as const;

export type Level1Phase = 'intro' | 'role' | 'instructions' | 'test' | 'result';
export type Level1Role = typeof level1Roles[number]['id'];
export type Level1Instruction = typeof level1Instructions[number]['id'];

export type Level1State = {
  phase: Level1Phase;
  deadline: number | null;
  seconds: number;
  timed: boolean;
  role: Level1Role | null;
  selected: Level1Instruction[];
  tested: boolean;
  verified: boolean | null;
  expired: boolean;
};

export type Level1Action =
  | { type: 'start'; timed: boolean; now: number }
  | { type: 'tick'; now: number }
  | { type: 'role'; role: Level1Role; now: number }
  | { type: 'confirm-role'; now: number }
  | { type: 'toggle'; id: Level1Instruction; now: number }
  | { type: 'test'; now: number }
  | { type: 'finish'; verify: boolean; now: number }
  | { type: 'reset' };

export const createLevel1InitialState = (): Level1State => ({
  phase: 'intro',
  deadline: null,
  seconds: 30,
  timed: true,
  role: null,
  selected: [],
  tested: false,
  verified: null,
  expired: false,
});

export function level1Reducer(state: Level1State, action: Level1Action): Level1State {
  if (action.type === 'reset') return createLevel1InitialState();
  if (action.type === 'start') {
    return {
      ...createLevel1InitialState(),
      phase: 'role',
      timed: action.timed,
      deadline: action.timed ? action.now + LEVEL_1_DURATION_MS : null,
    };
  }

  if (state.phase === 'intro' || state.phase === 'result') return state;

  if (state.deadline !== null && action.now >= state.deadline) {
    return { ...state, phase: 'result', seconds: 0, expired: true };
  }

  if (action.type === 'tick') {
    return state.deadline === null
      ? state
      : { ...state, seconds: Math.ceil((state.deadline - action.now) / 1000) };
  }

  if (action.type === 'role' && state.phase === 'role') {
    return { ...state, role: action.role };
  }

  if (action.type === 'confirm-role' && state.phase === 'role' && state.role !== null) {
    return { ...state, phase: 'instructions' };
  }

  if (action.type === 'toggle' && state.phase === 'instructions') {
    const selected = state.selected.includes(action.id)
      ? state.selected.filter((id) => id !== action.id)
      : state.selected.length < 2
        ? [...state.selected, action.id]
        : state.selected;
    return { ...state, selected };
  }

  if (action.type === 'test' && state.phase === 'instructions' && state.selected.length === 2) {
    return { ...state, phase: 'test', tested: true };
  }

  if (action.type === 'finish' && state.phase === 'test') {
    return { ...state, phase: 'result', verified: action.verify };
  }

  return state;
}

export function scoreLevel1(state: Level1State) {
  const rolePoints = state.role === 'tutor' ? 20 : 0;
  const instructionPoints = state.tested
    ? (Number(state.selected.includes('simple')) + Number(state.selected.includes('check'))) * 25
    : 0;
  const verificationPoints = state.verified === true ? 30 : 0;

  return {
    rolePoints,
    instructionPoints,
    verificationPoints,
    total: rolePoints + instructionPoints + verificationPoints,
  };
}

export function level1ResponseFor(state: Level1State) {
  const simple = state.selected.includes('simple');
  const clarify = state.selected.includes('check');

  if (state.role !== 'tutor') {
    return state.role === 'sales'
      ? 'I can help you compare study products. What would you like to buy?'
      : 'I can help you write a study-planning app. Which programming language do you use?';
  }
  if (clarify) {
    return simple
      ? 'Let’s make a plan together! Which subject is your exam in, and when is it? I’ll help you divide your revision into small steps.'
      : 'Please specify your subject and exam date before we develop a revision framework.';
  }
  if (state.selected.includes('guess')) {
    return 'I will assume your exam is tomorrow and that the subject is mathematics. Here is a plan based on those guesses.';
  }
  return simple
    ? 'Try reviewing one topic, then practise questions and check your answers. Tell me your subject so we can personalise the plan.'
    : 'Optimise your revision through a structured knowledge consolidation methodology.';
}

export function level1ImprovementTip(state: Level1State) {
  if (state.expired) return 'Try practice mode first, then replay the timed mission when the three decisions feel familiar.';
  if (state.role !== 'tutor') return 'Match the assistant’s role to the student’s actual goal before adding instructions.';
  if (!state.selected.includes('simple')) return 'Ask for simple steps so the student can understand and follow the advice.';
  if (!state.selected.includes('check')) return 'Tell the assistant to clarify missing details instead of making assumptions.';
  if (state.verified !== true) return 'Always check the answer and its context before relying on AI-generated advice.';
  return 'Excellent foundation. Next, ground the assistant’s answers in trusted sources.';
}
