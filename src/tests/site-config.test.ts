import { describe, it, expect } from 'vitest';
import {
  getPlayBaseUrl,
  getInstituteBaseUrl,
  getAiMasterShareUrl,
  getRetailRushShareUrl,
  playMetadata,
} from '../config/site';

describe('Site Configuration & Dynamic Domain Handling', () => {
  it('uses configured APP_URL or defaults to play.techromzit.com', () => {
    const originalEnv = process.env.NEXT_PUBLIC_APP_URL;

    delete process.env.NEXT_PUBLIC_APP_URL;
    expect(getPlayBaseUrl()).toBe('https://play.techromzit.com');

    process.env.NEXT_PUBLIC_APP_URL = 'https://games.techromz.io/';
    expect(getPlayBaseUrl()).toBe('https://games.techromz.io');

    process.env.NEXT_PUBLIC_APP_URL = originalEnv;
  });

  it('generates domain-independent share URLs', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://play.example.com';
    const aiShare = getAiMasterShareUrl(1);
    expect(aiShare).toContain('https://play.example.com/ai-master?utm_source=player_share');

    const aiShareL2 = getAiMasterShareUrl(2);
    expect(aiShareL2).toContain('https://play.example.com/ai-master?level=2&utm_source=player_share');

    const retailShare = getRetailRushShareUrl('retail-001', '1');
    expect(retailShare).toContain('https://play.example.com/retail-rush?scenario=retail-001&v=1');
  });

  it('generates complete metadata object with canonical and openGraph', () => {
    process.env.NEXT_PUBLIC_APP_URL = 'https://play.example.com';
    const meta = playMetadata('/ai-master', 'AI Master Game', 'Test description');
    expect(meta.alternates?.canonical).toBe('https://play.example.com/ai-master');
    expect(meta.openGraph?.url).toBe('https://play.example.com/ai-master');
    expect(meta.description).toBe('Test description');
  });
});
