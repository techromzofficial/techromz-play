import { describe, expect, it } from 'vitest';
import { celebrationTier, facebookShareUrl, whatsappShareUrl } from '../features/games/shared/scoreShare';
import { getAiMasterShareUrl, getAppBuilderShareUrl, getRetailRushShareUrl } from '../config/site';

describe('public score sharing', () => {
  it('uses production URLs and never localhost', () => {
    for (const url of [getAiMasterShareUrl(1), getAiMasterShareUrl(2), getRetailRushShareUrl(), getAppBuilderShareUrl()]) {
      expect(url).toMatch(/^https:\/\/play\.techromzit\.com\//);
      expect(url).not.toContain('localhost');
    }
  });
  it('builds encoded Facebook and WhatsApp links', () => {
    const publicUrl = getAiMasterShareUrl(1);
    expect(decodeURIComponent(facebookShareUrl(publicUrl))).toContain(publicUrl);
    expect(decodeURIComponent(whatsappShareUrl('I scored 90/100', publicUrl))).toContain(`I scored 90/100\n${publicUrl}`);
  });
  it('uses launch celebration thresholds only for completed scores', () => {
    expect(celebrationTier(100, true)).toBe('perfect');
    expect(celebrationTier(95, true)).toBe('strong');
    expect(celebrationTier(80, true)).toBe('achievement');
    expect(celebrationTier(74, true)).toBe('normal');
    expect(celebrationTier(100, false)).toBe('normal');
  });
});
