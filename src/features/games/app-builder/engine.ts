import { REQUIRED_COMPONENTS } from './stages';
import type { ComponentId, ConnectionId, DebugFix, LogicAction, SimulationResult } from './types';

export function validateDesign(components: ComponentId[]): { valid: boolean; message: string } {
  const requiredOnly = components.filter((id) => REQUIRED_COMPONENTS.includes(id));
  const hasDistractor = components.some((id) => !REQUIRED_COMPONENTS.includes(id));
  const ordered = REQUIRED_COMPONENTS.every((id, index) => components[index] === id);
  if (hasDistractor) return { valid: false, message: 'Remove widgets that do not help someone plan or finish a study task.' };
  if (requiredOnly.length !== REQUIRED_COMPONENTS.length) return { valid: false, message: 'Your screen still needs a header, task list, and Mark Done button.' };
  if (!ordered) return { valid: false, message: 'Try a clear reading order: header, task list, then the action button.' };
  return { valid: true, message: 'Great structure: identity, content, then action.' };
}

export function validateConnections(connections: ConnectionId[]): { valid: boolean; message: string } {
  const forward = connections.includes('home-details');
  const back = connections.includes('details-home');
  if (!forward && !back) return { valid: false, message: 'Connect Home to Task Details, then create a route back.' };
  if (!forward) return { valid: false, message: 'The task needs a route from Home to Task Details.' };
  if (!back) return { valid: false, message: 'Add the return route so Back takes the learner Home.' };
  return { valid: true, message: 'Both screens now have a clear two-way navigation path.' };
}

export function validateLogic(action: LogicAction | null): { valid: boolean; message: string } {
  if (action === 'update-status') return { valid: true, message: 'The click event now updates state, so the interface can show Done.' };
  if (action === 'delete-task') return { valid: false, message: 'Deleting removes the task. The goal is to keep it and change its status.' };
  if (action === 'duplicate-task') return { valid: false, message: 'Duplicating creates another task. Choose the action that updates status.' };
  return { valid: false, message: 'Select an action for the Mark Done button before testing the logic.' };
}

export function isPersistentFix(fix: DebugFix | null): boolean {
  return fix === 'shared-app-state';
}

export function runDeterministicTest(preserveState: boolean): SimulationResult {
  const finalStatus = preserveState ? 'Done' : 'Pending';
  return {
    passed: preserveState,
    finalStatus,
    steps: [
      { id: 'home', label: 'Open Home', status: 'Pending' },
      { id: 'details', label: 'Open Task Details', status: 'Pending' },
      { id: 'mark-done', label: 'Click Mark Done', status: 'Done' },
      { id: 'back-home', label: 'Return Home', status: finalStatus },
      { id: 'verify', label: preserveState ? 'Status stayed Done' : 'Status reset to Pending', status: finalStatus },
    ],
  };
}
