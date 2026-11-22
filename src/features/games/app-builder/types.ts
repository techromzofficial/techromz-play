export type AppBuilderMode = 'challenge' | 'practice';
export type StageId = 1 | 2 | 3 | 4;
export type GameStatus = 'ready' | 'playing' | 'completed' | 'expired';
export type ComponentId = 'title' | 'task-list' | 'done-button' | 'weather' | 'shop' | 'social';
export type ScreenId = 'home' | 'details';
export type ConnectionId = 'home-details' | 'details-home';
export type LogicAction = 'update-status' | 'delete-task' | 'duplicate-task';
export type DebugFix = 'local-screen-state' | 'shared-app-state' | 'longer-animation';
export type TaskStatus = 'Pending' | 'Done';

export type StageResult = {
  completed: boolean;
  attempts: number;
  points: number;
};

export type StageResults = Record<StageId, StageResult>;

export type SimulationStep = {
  id: 'home' | 'details' | 'mark-done' | 'back-home' | 'verify';
  label: string;
  status: TaskStatus;
};

export type SimulationResult = {
  passed: boolean;
  finalStatus: TaskStatus;
  steps: SimulationStep[];
};

export type AppBuilderResult = {
  mode: AppBuilderMode;
  score: number;
  completed: boolean;
  timedOut: boolean;
  stagePoints: [number, number, number, number];
  finishedAt: string;
};
