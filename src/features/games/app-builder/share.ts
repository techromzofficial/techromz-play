import { getAppBuilderShareUrl } from '@/config/site';
import type { AppBuilderMode } from './types';

export function appBuilderShareText(score: number, mode: AppBuilderMode): string {
  const modeLabel = mode === 'challenge' ? '90-second Challenge' : 'Practice mode';
  return `I scored ${score}/100 in Techromz Play App Builder ${modeLabel}! Can you build your first Study Planner app? Try the free challenge. (Player-reported score.)`;
}

export function appBuilderSharePayload(score: number, mode: AppBuilderMode) {
  return {
    title: 'Techromz Play App Builder',
    text: appBuilderShareText(score, mode),
    url: getAppBuilderShareUrl(),
  };
}

export async function shareAppBuilderScore(score: number, mode: AppBuilderMode): Promise<'native_share' | 'clipboard' | 'unavailable'> {
  const payload = appBuilderSharePayload(score, mode);
  try {
    if (typeof navigator !== 'undefined' && navigator.share) {
      await navigator.share(payload);
      return 'native_share';
    }
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') return 'unavailable';
  }
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      return 'clipboard';
    }
  } catch { /* Fall through to safe unsupported state. */ }
  return 'unavailable';
}

export async function copyAppBuilderChallenge(score: number, mode: AppBuilderMode): Promise<boolean> {
  const payload = appBuilderSharePayload(score, mode);
  try {
    if (typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(`${payload.text}\n${payload.url}`);
      return true;
    }
  } catch {
    // Clipboard access can be blocked by browser privacy settings.
  }
  return false;
}

export function appBuilderSocialUrl(network: 'facebook' | 'whatsapp', score: number, mode: AppBuilderMode): string {
  const payload = appBuilderSharePayload(score, mode);
  if (network === 'whatsapp') {
    return `https://wa.me/?text=${encodeURIComponent(`${payload.text}\n${payload.url}`)}`;
  }
  return `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(payload.url)}&quote=${encodeURIComponent(payload.text)}`;
}
