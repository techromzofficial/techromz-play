import type { Level2AnswerId, Level2RepairId, Level2SourceId, Level2TestId } from './levels/level2';

export type FragmentSlot = 'decision' | 'claim' | 'context';
export type ResponseParts = Partial<Record<FragmentSlot, string>>;
export const fragmentSlots: FragmentSlot[] = ['decision', 'claim', 'context'];
export const responseFragments: Record<Level2TestId, { id: string; slot: FragmentSlot; text: string }[]> = {
  'model-b-stock': [
    { id: 'stock-no', slot: 'decision', text: 'No. Model B' },
    { id: 'stock-yes', slot: 'decision', text: 'Yes. Model B' },
    { id: 'stock-zero', slot: 'claim', text: 'has zero units' },
    { id: 'stock-available', slot: 'claim', text: 'is available' },
    { id: 'stock-current', slot: 'context', text: 'in stock.' },
    { id: 'stock-flyer', slot: 'context', text: 'according to last month’s flyer.' },
  ],
  'five-day-return': [
    { id: 'return-yes', slot: 'decision', text: 'Yes, unused items' },
    { id: 'return-no', slot: 'decision', text: 'No, unused items' },
    { id: 'return-allowed', slot: 'claim', text: 'may be returned' },
    { id: 'return-denied', slot: 'claim', text: 'cannot be returned' },
    { id: 'return-seven', slot: 'context', text: 'within 7 days with a receipt.' },
    { id: 'return-lifetime', slot: 'context', text: 'under lifetime returns.' },
  ],
};
export function buildLabResponse(testId: Level2TestId, parts: ResponseParts, uncertain: boolean) {
  if (uncertain) return { text: 'Not enough verified information.', answerId: testId === 'model-b-stock' ? 'not-enough-stock-information' : 'not-enough-return-information' } as const;
  const fragments = responseFragments[testId];
  const tokens = fragmentSlots.map(slot => fragments.find(item => item.slot === slot && item.id === parts[slot]));
  if (tokens.some(item => !item)) return null;
  const correct = testId === 'model-b-stock'
    ? parts.decision === 'stock-no' && parts.claim === 'stock-zero' && parts.context === 'stock-current'
    : parts.decision === 'return-yes' && parts.claim === 'return-allowed' && parts.context === 'return-seven';
  const answerId: Level2AnswerId = correct
    ? testId === 'model-b-stock' ? 'model-b-zero' : 'return-within-seven-days'
    : testId === 'model-b-stock' ? 'all-models-available' : 'no-returns';
  return { text: tokens.map(item => item!.text).join(' '), answerId };
}
export type LabCitation = Level2SourceId | 'none' | '';
export const repairModules = [
  { id: 'acknowledge', title: 'Acknowledge missing Model C evidence', detail: 'State that Model C is not listed in the available stock information.' },
  { id: 'update', title: 'Request a verified stock update', detail: 'Ask the shop for current, verified information before answering.' },
  { id: 'guess', title: 'Guess stock availability', detail: 'Assume the unlisted model is available.' },
  { id: 'copy', title: 'Copy Model A inventory', detail: 'Use another model’s stock count as the answer.' },
  { id: 'repeat', title: 'Repeat the availability claim', detail: 'Keep the original promise without further evidence.' },
] as const;
export type RepairModuleId = typeof repairModules[number]['id'];
export function evaluateLabRepair(modules: (RepairModuleId | null)[], claimFlagged: boolean): Level2RepairId {
  if (claimFlagged && modules.length === 2 && new Set(modules).size === 2 && modules.includes('acknowledge') && modules.includes('update')) return 'request-verified-update';
  return modules.includes('copy') ? 'infer-from-model-a' : 'promise-model-c';
}
