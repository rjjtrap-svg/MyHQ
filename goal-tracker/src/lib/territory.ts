import { KnockDisposition, KnockRecord } from '@/src/types';

/**
 * Territory maths. Pure functions only — no Firestore, no React — so the numbers can be
 * reasoned about and reused by the stats engines without dragging a store along.
 *
 * A note on what counts: a knock with `deletedAt` set is gone everywhere, exactly like a
 * deleted deal. Unlike deals there is no 'cancelled' equivalent — a door that said no is
 * still a door that was knocked, and hiding it would inflate the contact rate.
 */

function live(knocks: KnockRecord[]): KnockRecord[] {
  return knocks.filter((k) => !k.deletedAt);
}

/**
 * Pulls the street out of a typed address so knocks on the same street group together.
 * "1423 W Oak Ridge Dr Apt 2B" -> "w oak ridge dr". Deliberately forgiving: reps type
 * addresses one-handed on a doorstep, so this strips the leading house number, any unit
 * designator, and normalises whitespace and case rather than demanding a clean format.
 */
export function streetKey(address: string): string {
  const withoutUnit = address
    .replace(/,.*$/, '')
    .replace(/\b(apt|apartment|unit|ste|suite|#)\s*[\w-]+\s*$/i, '');
  const withoutNumber = withoutUnit.replace(/^\s*[\d-]+\s+/, '');
  return withoutNumber.trim().replace(/\s+/g, ' ').toLowerCase();
}

/** Display form of a street key — "w oak ridge dr" -> "W Oak Ridge Dr". */
export function streetLabel(key: string): string {
  return key
    .split(' ')
    .map((w) => (w ? w[0].toUpperCase() + w.slice(1) : w))
    .join(' ');
}

export interface StreetSummary {
  street: string;
  label: string;
  total: number;
  byDisposition: Record<KnockDisposition, number>;
  /** Most recent knock date on this street, ISO yyyy-mm-dd. */
  lastKnockedAt: string;
  /** Doors marked 'callback' that haven't since been resolved. */
  openCallbacks: number;
}

function emptyCounts(): Record<KnockDisposition, number> {
  return { not_home: 0, not_interested: 0, callback: 0, sold: 0, do_not_knock: 0 };
}

/**
 * Groups knocks by street, newest street first. This is the working view for a rep
 * deciding where to go next: which streets are half-finished and when they were last worked.
 */
export function summariseStreets(knocks: KnockRecord[]): StreetSummary[] {
  const groups = new Map<string, KnockRecord[]>();
  for (const k of live(knocks)) {
    const list = groups.get(k.street);
    if (list) list.push(k);
    else groups.set(k.street, [k]);
  }

  const summaries: StreetSummary[] = [];
  for (const [street, list] of groups) {
    const byDisposition = emptyCounts();
    let lastKnockedAt = '';
    for (const k of list) {
      byDisposition[k.disposition] += 1;
      if (k.date > lastKnockedAt) lastKnockedAt = k.date;
    }
    summaries.push({
      street,
      label: streetLabel(street),
      total: list.length,
      byDisposition,
      lastKnockedAt,
      openCallbacks: openCallbacks(list).length,
    });
  }

  return summaries.sort((a, b) => b.lastKnockedAt.localeCompare(a.lastKnockedAt));
}

/**
 * Doors still owed a return visit. A callback is "open" until that same address gets a
 * later knock with any other disposition — going back and getting a no closes it just as
 * definitively as going back and selling it.
 */
export function openCallbacks(knocks: KnockRecord[]): KnockRecord[] {
  const latestByAddress = new Map<string, KnockRecord>();
  for (const k of live(knocks)) {
    const key = k.address.trim().toLowerCase();
    const current = latestByAddress.get(key);
    if (!current || k.createdAt > current.createdAt) latestByAddress.set(key, k);
  }
  return [...latestByAddress.values()].filter((k) => k.disposition === 'callback');
}

/**
 * Open callbacks that are due — their callback date is today or already past. Sorted
 * oldest-first, because the one you've put off longest is the one going cold.
 */
export function callbacksDue(knocks: KnockRecord[], today: string): KnockRecord[] {
  return openCallbacks(knocks)
    .filter((k) => !!k.callbackDate && k.callbackDate <= today)
    .sort((a, b) => (a.callbackDate ?? '').localeCompare(b.callbackDate ?? ''));
}

export interface TerritoryStats {
  knocks: number;
  /** Doors where someone actually opened — everything except 'not_home'. */
  contacts: number;
  sales: number;
  /** contacts / knocks. 0 when nothing has been knocked. */
  contactRate: number;
  /** sales / contacts — the number that actually reflects pitching skill. */
  closeRate: number;
  /** sales / knocks — what the daily count alone can tell you. */
  doorToSaleRate: number;
}

/**
 * Contact rate and close rate are different skills and get conflated constantly. Not-homes
 * drag down a door-to-sale number without saying anything about how the rep pitches, so
 * close rate here is measured against contacts, not against every door walked past.
 */
export function territoryStats(knocks: KnockRecord[]): TerritoryStats {
  const list = live(knocks);
  const total = list.length;
  const contacts = list.filter((k) => k.disposition !== 'not_home').length;
  const sales = list.filter((k) => k.disposition === 'sold').length;

  return {
    knocks: total,
    contacts,
    sales,
    contactRate: total === 0 ? 0 : contacts / total,
    closeRate: contacts === 0 ? 0 : sales / contacts,
    doorToSaleRate: total === 0 ? 0 : sales / total,
  };
}

/** Knocks on a single ISO date, newest first. */
export function knocksOnDate(knocks: KnockRecord[], date: string): KnockRecord[] {
  return live(knocks)
    .filter((k) => k.date === date)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
}

/**
 * Addresses marked 'do_not_knock', as a lookup. Anything that offers an address should
 * check this first — knocking a door someone has asked you to skip is the fastest way to
 * generate a complaint.
 */
export function doNotKnockSet(knocks: KnockRecord[]): Set<string> {
  const set = new Set<string>();
  for (const k of live(knocks)) {
    if (k.disposition === 'do_not_knock') set.add(k.address.trim().toLowerCase());
  }
  return set;
}
