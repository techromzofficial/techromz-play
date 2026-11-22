import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import { getAppBuilderShareUrl, getMobileKickstartUrl, playMetadata } from '../config/site';
import { appBuilderSharePayload, appBuilderSocialUrl, copyAppBuilderChallenge, shareAppBuilderScore } from '../features/games/app-builder/share';
import { APP_BUILDER_STORAGE_KEY, APP_BUILDER_STORAGE_VERSION, loadProgress, parseProgress, saveResult } from '../features/games/app-builder/storage';
import type { AppBuilderResult } from '../features/games/app-builder/types';

const finishedResult: AppBuilderResult = {
  mode: 'challenge', score: 85, completed: true, timedOut: false,
  stagePoints: [25, 20, 20, 20], finishedAt: '2026-11-20T10:00:00.000Z',
};

describe('App Builder routes and links', () => {
  it('uses a clean overview share URL and attributed Institute course URL', () => {
    const previousApp = process.env.NEXT_PUBLIC_APP_URL;
    const previousInstitute = process.env.NEXT_PUBLIC_INSTITUTE_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://play.example.com';
    process.env.NEXT_PUBLIC_INSTITUTE_URL = 'https://learn.example.com';
    expect(getAppBuilderShareUrl()).toBe('https://play.example.com/app-builder?utm_source=player_share&utm_medium=social&utm_campaign=app_builder_level1');
    expect(getAppBuilderShareUrl()).not.toContain('score=');
    expect(getMobileKickstartUrl()).toBe('https://learn.example.com/institute/courses/mobile-kickstart?utm_source=techromz_play&utm_medium=organic_social&utm_campaign=app_builder_level1&utm_content=result_cta');
    if (previousApp === undefined) delete process.env.NEXT_PUBLIC_APP_URL; else process.env.NEXT_PUBLIC_APP_URL = previousApp;
    if (previousInstitute === undefined) delete process.env.NEXT_PUBLIC_INSTITUTE_URL; else process.env.NEXT_PUBLIC_INSTITUTE_URL = previousInstitute;
  });

  it('builds canonical metadata with the original App Builder image', () => {
    const previous = process.env.NEXT_PUBLIC_APP_URL;
    process.env.NEXT_PUBLIC_APP_URL = 'https://play.example.com';
    const metadata = playMetadata('/app-builder', 'App Builder | Techromz Play', 'Build an app.', '/images/play/app-builder/app-builder-og.png');
    expect(metadata.alternates?.canonical).toBe('https://play.example.com/app-builder');
    expect(metadata.openGraph?.url).toBe('https://play.example.com/app-builder');
    expect(metadata.openGraph?.images).toEqual(expect.arrayContaining([expect.objectContaining({ width: 1200, height: 630 })]));
    if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL; else process.env.NEXT_PUBLIC_APP_URL = previous;
  });

  it('contains the hub card and only the two required App Router pages', () => {
    const hub = readFileSync('src/app/page.tsx', 'utf8');
    const overview = readFileSync('src/app/app-builder/page.tsx', 'utf8');
    const level = readFileSync('src/app/app-builder/level-1/page.tsx', 'utf8');
    expect(hub).toContain('Mission 003');
    expect(hub).toContain('Play App Builder');
    expect(overview).toContain("playMetadata('/app-builder'");
    expect(level).toContain("playMetadata('/app-builder/level-1'");
    expect(readFileSync('next.config.mjs', 'utf8')).not.toContain('app-builder/level-2');
  });
});

describe('App Builder storage and sharing', () => {
  it('recovers from malformed or unsupported progress data', () => {
    expect(parseProgress('{oops')).toEqual(expect.objectContaining({ version: APP_BUILDER_STORAGE_VERSION, bestChallengeScore: 0 }));
    expect(parseProgress(JSON.stringify({ version: 99, bestChallengeScore: 100, bestPracticeScore: 100, completedRuns: 5 }))).toEqual(expect.objectContaining({ bestChallengeScore: 0, completedRuns: 0 }));
  });

  it('stores versioned results without touching other game keys', () => {
    const data = new Map<string, string>();
    data.set('ai-master-progress', 'preserve-me');
    const storage = { getItem: (key: string) => data.get(key) ?? null, setItem: (key: string, value: string) => { data.set(key, value); } };
    const progress = saveResult(finishedResult, storage);
    expect(progress.bestChallengeScore).toBe(85);
    expect(progress.completedRuns).toBe(1);
    expect(data.has(APP_BUILDER_STORAGE_KEY)).toBe(true);
    expect(data.get('ai-master-progress')).toBe('preserve-me');
  });

  it('continues safely when storage access is denied', () => {
    const denied = { getItem: () => { throw new Error('denied'); } };
    expect(loadProgress(denied)).toEqual(expect.objectContaining({ bestChallengeScore: 0 }));
  });

  it('uses native share when supported and clipboard otherwise', async () => {
    const original = Object.getOwnPropertyDescriptor(globalThis, 'navigator');
    const nativeShare = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { share: nativeShare } });
    expect(await shareAppBuilderScore(85, 'challenge')).toBe('native_share');
    expect(nativeShare).toHaveBeenCalledWith(expect.objectContaining({ url: expect.stringContaining('/app-builder?utm_source=player_share') }));

    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(globalThis, 'navigator', { configurable: true, value: { clipboard: { writeText } } });
    expect(await shareAppBuilderScore(70, 'practice')).toBe('clipboard');
    expect(writeText).toHaveBeenCalledWith(expect.stringContaining('70/100'));
    expect(await copyAppBuilderChallenge(70, 'practice')).toBe(true);
    expect(appBuilderSharePayload(70, 'practice').url).not.toContain('70');
    expect(appBuilderSocialUrl('facebook', 70, 'practice')).toContain('facebook.com/sharer');
    expect(appBuilderSocialUrl('whatsapp', 70, 'practice')).toContain('wa.me/?text=');
    if (original) Object.defineProperty(globalThis, 'navigator', original); else delete (globalThis as { navigator?: unknown }).navigator;
  });
});
