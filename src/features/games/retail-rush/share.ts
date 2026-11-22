import { getPlayBaseUrl, getRetailRushShareUrl } from '@/config/site';

export const SCENARIO_ID = 'retail-001';
export const SCENARIO_VERSION = '1';
export const CHALLENGE_PATH = `/retail-rush?scenario=${SCENARIO_ID}&v=${SCENARIO_VERSION}`;
export const RETAIL_RUSH_CHALLENGE_URL = getRetailRushShareUrl(SCENARIO_ID, SCENARIO_VERSION);

export function validateChallenge(search: string): 'default' | 'valid' | 'invalid' {
  const params = new URLSearchParams(search);
  if (!params.has('scenario') && !params.has('v')) return 'default';
  return params.getAll('scenario').length === 1 && params.getAll('v').length === 1 &&
    params.get('scenario') === SCENARIO_ID && params.get('v') === SCENARIO_VERSION ? 'valid' : 'invalid';
}

export function challengeUrl(origin: string, score?: number, mode?: 'timed' | 'practice') {
  void score;
  void mode;
  const base = origin || getPlayBaseUrl();
  return `${base}${CHALLENGE_PATH}&utm_source=player_share&utm_medium=social&utm_campaign=retail_rush`;
}

export function challengeText(score: number, mode: 'timed' | 'practice' = 'timed', rank?: string) {
  const achievement = rank ? ` and earned ${rank}` : '';
  const resultMode = mode === 'timed' ? 'the 60-second store challenge' : 'practice mode';
  return `I scored ${score}/100${achievement} in Retail Rush ${resultMode}! Can you manage six customers, stock the shelves and beat my score? Play free on Techromz Play. (Player-reported score.)`;
}

export function socialUrl(method: 'whatsapp' | 'facebook', text: string, url: string) {
  return method === 'whatsapp' ? `https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}` :
    `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}&quote=${encodeURIComponent(text)}`;
}

export function savePersonalBest(mode: 'timed' | 'practice', score: number): number | null {
  try {
    const key = `retail-rush:best:${SCENARIO_ID}:v${SCENARIO_VERSION}:${mode}`;
    const raw = localStorage.getItem(key);
    const previous = raw === null ? 0 : Number(raw);
    const safe = Number.isInteger(previous) && previous >= 0 && previous <= 100 ? previous : 0;
    const best = Math.max(safe, score);
    localStorage.setItem(key, String(best));
    return best;
  } catch { return null; }
}
