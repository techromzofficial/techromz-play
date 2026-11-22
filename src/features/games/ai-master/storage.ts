export const AI_MASTER_PROGRESS_KEY = 'techromz.ai-master.progress';
export const AI_MASTER_PROGRESS_VERSION = 2;
export const LEVEL_2_UNLOCK_SCORE = 70;
export type AiMasterLevel = 1 | 2;
export type AiMasterMode = 'timed' | 'practice';
export type ModeBestScores = Record<AiMasterMode, number>;
export type AiMasterProgress = {
  version: typeof AI_MASTER_PROGRESS_VERSION;
  level2Unlocked: boolean;
  completedLevels: AiMasterLevel[];
  achievements: string[];
  bestScores: { level1: ModeBestScores; level2: ModeBestScores };
};
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;
export const createDefaultAiMasterProgress = (): AiMasterProgress => ({
  version: AI_MASTER_PROGRESS_VERSION,
  level2Unlocked: false,
  completedLevels: [],
  achievements: [],
  bestScores: { level1: { timed: 0, practice: 0 }, level2: { timed: 0, practice: 0 } },
});
function safeScore(value: unknown) {
  return typeof value === 'number' && Number.isFinite(value) ? Math.min(100, Math.max(0, Math.round(value))) : 0;
}
function scoresFrom(value: unknown): ModeBestScores {
  if (!value || typeof value !== 'object') return { timed: 0, practice: 0 };
  const scores = value as Record<string, unknown>;
  return { timed: safeScore(scores.timed ?? scores.timedBest), practice: safeScore(scores.practice ?? scores.practiceBest) };
}
export function migrateAiMasterProgress(value: unknown): AiMasterProgress {
  if (!value || typeof value !== 'object') return createDefaultAiMasterProgress();
  const candidate = value as Record<string, unknown>;
  const bestScores = candidate.bestScores && typeof candidate.bestScores === 'object' ? candidate.bestScores as Record<string, unknown> : {};
  const level1 = scoresFrom(bestScores.level1 ?? candidate.level1 ?? candidate);
  const level2 = scoresFrom(bestScores.level2 ?? candidate.level2);
  // Preserve an existing earned milestone. Legacy scores alone cannot prove
  // completion: the old personal-best writer also recorded timed-out attempts.
  const earnedUnlock = candidate.level2Unlocked === true;
  return {
    version: AI_MASTER_PROGRESS_VERSION,
    level2Unlocked: earnedUnlock,
    completedLevels: Array.isArray(candidate.completedLevels)
      ? [...new Set(candidate.completedLevels.filter((level): level is AiMasterLevel => level === 1 || level === 2))]
      : earnedUnlock ? [1] : [],
    achievements: Array.isArray(candidate.achievements)
      ? [...new Set(candidate.achievements.filter((item): item is string => typeof item === 'string'))] : [],
    bestScores: { level1, level2 },
  };
}
function browserStorage(): StorageLike | null {
  if (typeof window === 'undefined') return null;
  try { return window.localStorage; } catch { return null; }
}
export function loadAiMasterProgress(storage: StorageLike | null = browserStorage()): AiMasterProgress {
  if (!storage) return createDefaultAiMasterProgress();
  try {
    const raw = storage.getItem(AI_MASTER_PROGRESS_KEY);
    if (!raw) return createDefaultAiMasterProgress();
    const progress = migrateAiMasterProgress(JSON.parse(raw));
    persistAiMasterProgress(progress, storage);
    return progress;
  } catch { return createDefaultAiMasterProgress(); }
}
export function persistAiMasterProgress(progress: AiMasterProgress, storage: StorageLike | null = browserStorage()) {
  if (!storage) return false;
  try { storage.setItem(AI_MASTER_PROGRESS_KEY, JSON.stringify(progress)); return true; } catch { return false; }
}
export function updateAiMasterBestScore(current: AiMasterProgress, level: AiMasterLevel, mode: AiMasterMode, score: number, completed: boolean): AiMasterProgress {
  const normalized = safeScore(score);
  const levelKey = level === 1 ? 'level1' : 'level2';
  const level2Unlocked = current.level2Unlocked || (level === 1 && completed && normalized >= LEVEL_2_UNLOCK_SCORE);
  const achievements = new Set(current.achievements);
  if (completed && level === 1) achievements.add(normalized === 100 ? 'AI Master' : normalized >= 70 ? 'Prompt Pioneer' : normalized >= 40 ? 'AI Explorer' : 'AI Rookie');
  if (level2Unlocked) achievements.add('AI Knowledge Lab Unlocked');
  if (level === 2 && completed && normalized >= 80) achievements.add('AI Knowledge Lab Mastery');
  return {
    ...current, level2Unlocked,
    completedLevels: completed ? [...new Set([...current.completedLevels, level])] : current.completedLevels,
    achievements: [...achievements],
    bestScores: { ...current.bestScores, [levelKey]: { ...current.bestScores[levelKey], [mode]: Math.max(current.bestScores[levelKey][mode], normalized) } },
  };
}
export function recordAiMasterResult(level: AiMasterLevel, mode: AiMasterMode, score: number, completed: boolean, storage: StorageLike | null = browserStorage(), current: AiMasterProgress = createDefaultAiMasterProgress()) {
  const saved = loadAiMasterProgress(storage);
  // Merge session progress so a denied or full localStorage cannot relock a level.
  const merged: AiMasterProgress = {
    ...saved,
    level2Unlocked: saved.level2Unlocked || current.level2Unlocked,
    completedLevels: [...new Set([...saved.completedLevels, ...current.completedLevels])],
    achievements: [...new Set([...saved.achievements, ...current.achievements])],
    bestScores: {
      level1: { timed: Math.max(saved.bestScores.level1.timed, current.bestScores.level1.timed), practice: Math.max(saved.bestScores.level1.practice, current.bestScores.level1.practice) },
      level2: { timed: Math.max(saved.bestScores.level2.timed, current.bestScores.level2.timed), practice: Math.max(saved.bestScores.level2.practice, current.bestScores.level2.practice) },
    },
  };
  const updated = updateAiMasterBestScore(merged, level, mode, score, completed);
  persistAiMasterProgress(updated, storage);
  return updated;
}
export function canPlayAiMasterLevel(progress: AiMasterProgress, level: number) {
  return level === 1 || (level === 2 && progress.level2Unlocked);
}
