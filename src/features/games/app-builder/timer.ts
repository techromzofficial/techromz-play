export const CHALLENGE_DURATION_SECONDS = 90;

export function createChallengeDeadline(startedAt: number): number {
  return startedAt + CHALLENGE_DURATION_SECONDS * 1000;
}

export function remainingChallengeSeconds(deadline: number, now: number): number {
  return Math.max(0, Math.ceil((deadline - now) / 1000));
}
