import { Deal, RepOverrideRate } from '@/src/types';

/**
 * Override earnings: what a team lead or manager makes from the deals their reps close.
 *
 * Pure functions, no Firestore, no React — this is money, and money maths should be
 * testable without standing up a database.
 *
 * The rule that matters most here is the same one that governs every other count in this
 * app: **a cancelled deal is not a sale.** A leader does not earn an override on a deal
 * that fell through, and paying one out would be worse than a display bug. `qualifying()`
 * is the third place in the codebase that has to filter `stage === 'cancelled'`, alongside
 * stats.ts and profileStats.ts.
 */

function qualifying(deals: Deal[], rate: RepOverrideRate): Deal[] {
  return deals.filter((d) => {
    if (d.deletedAt) return false;
    if (d.stage === 'cancelled') return false;
    if (d.repUid !== rate.repUid) return false;
    // No effectiveFrom means the rate covers the rep's whole history — the sane default
    // when you're entering an arrangement that already existed before the app did.
    if (rate.effectiveFrom && d.date < rate.effectiveFrom) return false;
    return true;
  });
}

export interface RepOverrideLine {
  repUid: string;
  repName: string;
  amountPerDeal: number;
  effectiveFrom?: string;
  /** Deals that count: not cancelled, not deleted, on or after effectiveFrom. */
  deals: number;
  /** Of those, the ones that have actually paid out. */
  paidDeals: number;
  /** amountPerDeal × deals — everything booked, whether or not it has landed. */
  booked: number;
  /** amountPerDeal × paidDeals — money that has actually arrived. */
  paid: number;
}

export interface OverrideTotals {
  lines: RepOverrideLine[];
  /** Everything booked across every rep. */
  booked: number;
  /** Everything paid across every rep. */
  paid: number;
  /** Booked but not yet paid — the number a leader actually wants at month end. */
  pending: number;
  /** Reps generating an override, i.e. lines with at least one qualifying deal. */
  activeReps: number;
}

/**
 * One line per rate, newest-earning first.
 *
 * Booked and paid are reported separately rather than collapsed into one number. A leader
 * looking at "$4,200" needs to know whether that is money in the account or money that
 * still depends on seven installs happening — those are very different facts, and showing
 * only the larger one is how people end up spending money they haven't got.
 */
export function computeOverrides(rates: RepOverrideRate[], deals: Deal[]): OverrideTotals {
  const lines: RepOverrideLine[] = rates.map((rate) => {
    const counted = qualifying(deals, rate);
    const paidDeals = counted.filter((d) => d.stage === 'paid').length;
    return {
      repUid: rate.repUid,
      repName: rate.repName,
      amountPerDeal: rate.amountPerDeal,
      effectiveFrom: rate.effectiveFrom,
      deals: counted.length,
      paidDeals,
      booked: round2(rate.amountPerDeal * counted.length),
      paid: round2(rate.amountPerDeal * paidDeals),
    };
  });

  lines.sort((a, b) => b.booked - a.booked || a.repName.localeCompare(b.repName));

  const booked = round2(lines.reduce((sum, l) => sum + l.booked, 0));
  const paid = round2(lines.reduce((sum, l) => sum + l.paid, 0));

  return {
    lines,
    booked,
    paid,
    pending: round2(booked - paid),
    activeReps: lines.filter((l) => l.deals > 0).length,
  };
}

/** Rates this leader earns on, for a leader's own view. */
export function ratesForLeader(rates: RepOverrideRate[], leaderUid: string): RepOverrideRate[] {
  return rates.filter((r) => r.leaderUid === leaderUid);
}

/**
 * Money is stored and summed in dollars, so a rate like 12.35 across 3 deals lands on
 * 37.049999999999997 without this. Rounding each product and each total keeps the
 * displayed figures adding up to the displayed sum.
 */
function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

/** $1,240 / $1,240.50 — trailing cents only when there are any. */
export function formatMoney(amount: number): string {
  const whole = Number.isInteger(amount);
  return `$${amount.toLocaleString(undefined, {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: 2,
  })}`;
}
