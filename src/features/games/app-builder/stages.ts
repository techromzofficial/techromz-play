import type { ComponentId, StageId } from './types';

export const STAGES: ReadonlyArray<{
  id: StageId;
  eyebrow: string;
  title: string;
  objective: string;
  learning: string;
  concept: 'UI Builder' | 'Navigation Connected' | 'Logic Activated' | 'Bug Fixed';
}> = [
  { id: 1, eyebrow: 'Design', title: 'Design your app', objective: 'Build the Study Planner screen from useful UI components.', learning: 'UI components give a screen its structure and purpose.', concept: 'UI Builder' },
  { id: 2, eyebrow: 'Connect', title: 'Connect your screens', objective: 'Create a route from Home to Task Details and back again.', learning: 'Routes connect screens and define how people move through an app.', concept: 'Navigation Connected' },
  { id: 3, eyebrow: 'Logic', title: 'Add button logic', objective: 'Wire Mark Done to an action that updates task status.', learning: 'Events trigger actions; state changes make the interface update.', concept: 'Logic Activated' },
  { id: 4, eyebrow: 'Debug', title: 'Test and fix', objective: 'Reproduce a state-reset bug, repair it, and run the test again.', learning: 'Shared state keeps important data alive while screens change.', concept: 'Bug Fixed' },
];

export const REQUIRED_COMPONENTS: ComponentId[] = ['title', 'task-list', 'done-button'];

export const COMPONENTS: ReadonlyArray<{
  id: ComponentId;
  label: string;
  description: string;
  useful: boolean;
}> = [
  { id: 'title', label: 'App header', description: 'Names the Study Planner screen', useful: true },
  { id: 'task-list', label: 'Task list', description: 'Shows study tasks and status', useful: true },
  { id: 'done-button', label: 'Mark Done button', description: 'Lets a learner complete a task', useful: true },
  { id: 'weather', label: 'Weather widget', description: 'Shows a weather forecast', useful: false },
  { id: 'shop', label: 'Shopping cart', description: 'Adds products to a basket', useful: false },
  { id: 'social', label: 'Social feed', description: 'Shows public posts', useful: false },
];

export const emptyStageResults = (): Record<StageId, { completed: boolean; attempts: number; points: number }> => ({
  1: { completed: false, attempts: 0, points: 0 },
  2: { completed: false, attempts: 0, points: 0 },
  3: { completed: false, attempts: 0, points: 0 },
  4: { completed: false, attempts: 0, points: 0 },
});
