import { loadJSON, saveJSON } from '@/src/lib/storage';

const KEY = '@goal-tracker/door-target';

interface StoredTarget {
  date: string;
  target: number;
}

/**
 * The door target a rep picks at roll-out, remembered until midnight.
 *
 * This started as two module-level variables, which works until the first refresh — and
 * this ships as a PWA, where a phone sleeping for an hour and waking up is a page reload.
 * A rep setting 80 doors at 7am would find the evening wrap-up had quietly forgotten it,
 * and "Target vs actual" would vanish with no explanation.
 *
 * The module cache stays so reads are synchronous during render; AsyncStorage is what
 * survives the reload, hydrated once on mount.
 */
let cachedDate = '';
let cachedTarget: number | null = null;

/** Synchronous read for render. Returns null until `hydrateDoorTarget` has resolved. */
export function getDoorTarget(date: string): number | null {
  return date === cachedDate ? cachedTarget : null;
}

/** Reads the persisted target. Call once on mount; the date guard drops yesterday's. */
export async function hydrateDoorTarget(date: string): Promise<number | null> {
  if (cachedDate === date) return cachedTarget;
  const stored = await loadJSON<StoredTarget>(KEY);
  if (!stored || stored.date !== date) return null;
  cachedDate = stored.date;
  cachedTarget = stored.target;
  return cachedTarget;
}

export function rememberDoorTarget(date: string, target: number): void {
  cachedDate = date;
  cachedTarget = target;
  void saveJSON(KEY, { date, target } satisfies StoredTarget);
}
