import { describe, it, expect } from 'vitest';
import {
  createDefaultAiMasterProgress,
  loadAiMasterProgress,
  persistAiMasterProgress,
  updateAiMasterBestScore,
  recordAiMasterResult,
  canPlayAiMasterLevel,
  LEVEL_2_UNLOCK_SCORE,
  type StorageLike,
} from '../features/games/ai-master/storage';

function createMockStorage(): StorageLike {
  const store = new Map<string, string>();
  return {
    getItem: (key: string) => store.get(key) ?? null,
    setItem: (key: string, value: string) => store.set(key, value),
  };
}

describe('AI Master Storage & Level Unlock Progression', () => {
  it('creates default progress with Level 2 locked', () => {
    const progress = createDefaultAiMasterProgress();
    expect(progress.level2Unlocked).toBe(false);
    expect(canPlayAiMasterLevel(progress, 1)).toBe(true);
    expect(canPlayAiMasterLevel(progress, 2)).toBe(false);
  });

  it('keeps Level 2 locked if Level 1 score is under 70', () => {
    const initial = createDefaultAiMasterProgress();
    const updated = updateAiMasterBestScore(initial, 1, 'timed', 65, true);
    expect(updated.level2Unlocked).toBe(false);
    expect(canPlayAiMasterLevel(updated, 2)).toBe(false);
  });

  it('unlocks Level 2 when Level 1 is completed with >= 70 score', () => {
    const initial = createDefaultAiMasterProgress();
    const updated = updateAiMasterBestScore(initial, 1, 'timed', LEVEL_2_UNLOCK_SCORE, true);
    expect(updated.level2Unlocked).toBe(true);
    expect(canPlayAiMasterLevel(updated, 2)).toBe(true);
    expect(updated.achievements).toContain('AI Knowledge Lab Unlocked');
  });

  it('persists and loads progress correctly across storage', () => {
    const storage = createMockStorage();
    const initial = loadAiMasterProgress(storage);
    expect(initial.level2Unlocked).toBe(false);

    const unlocked = updateAiMasterBestScore(initial, 1, 'timed', 100, true);
    persistAiMasterProgress(unlocked, storage);

    const reloaded = loadAiMasterProgress(storage);
    expect(reloaded.level2Unlocked).toBe(true);
    expect(reloaded.bestScores.level1.timed).toBe(100);
  });

  it('unlocks and persists after a qualifying completed practice run', () => {
    const storage = createMockStorage();
    const updated = recordAiMasterResult(1, 'practice', 70, true, storage);
    expect(updated.level2Unlocked).toBe(true);

    const afterRefresh = loadAiMasterProgress(storage);
    expect(afterRefresh.level2Unlocked).toBe(true);
    expect(afterRefresh.completedLevels).toContain(1);
    expect(afterRefresh.bestScores.level1.practice).toBe(70);
  });

  it('does not unlock from a high score unless Level 1 was completed', () => {
    const storage = createMockStorage();
    const updated = recordAiMasterResult(1, 'timed', 100, false, storage);
    expect(updated.level2Unlocked).toBe(false);
    expect(loadAiMasterProgress(storage).level2Unlocked).toBe(false);
  });
});
