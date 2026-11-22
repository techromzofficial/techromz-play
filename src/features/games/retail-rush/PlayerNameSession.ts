const SESSION_KEY = 'retail-rush:player-name:v1';
let memoryName = '';
let storageUnavailable = false;

export function nameLength(name: string) {
  // Count visible characters, including Sinhala combining sequences.
  return typeof Intl.Segmenter === 'function'
    ? Array.from(new Intl.Segmenter(undefined, { granularity: 'grapheme' }).segment(name)).length
    : Array.from(name).length;
}

export function playerNameError(value: string): string {
  const name = value.trim();
  if (!name) return 'Please enter your name.';
  if (nameLength(name) > 30) return 'Please use 30 characters or fewer.';
  return '';
}

export function getPlayerName(): string {
  try {
    const stored = sessionStorage.getItem(SESSION_KEY);
    if (stored !== null) return playerNameError(stored) ? '' : stored.trim();
    return storageUnavailable ? memoryName : '';
  } catch { return memoryName; }
}

export function rememberPlayerName(value: string): boolean {
  if (playerNameError(value)) return false;
  memoryName = value.trim();
  try { sessionStorage.setItem(SESSION_KEY, memoryName); storageUnavailable = false; }
  catch { storageUnavailable = true; }
  return true;
}
