import { Deal } from '@/src/types';
import { addDays, parseISODate, todayISO, toISODate } from './dates';

export type FollowUpKind = 'install' | 'pay';

export interface FollowUp {
  deal: Deal;
  kind: FollowUpKind;
  /** The date this became due, so the list can be sorted oldest-first. */
  dueDate: string;
}

/**
 * The Friday on or after a given date. Payroll lands weekly, so "did the money show up?"
 * is only worth asking once the first payday after the install has passed.
 */
export function fridayAfter(iso: string): string {
  const d = parseISODate(iso);
  const dow = d.getDay(); // 0 = Sun … 5 = Fri
  const daysUntilFriday = (5 - dow + 7) % 7;
  // An install *on* a Friday won't have been paid that same day — push to the next one.
  return toISODate(addDays(d, daysUntilFriday === 0 ? 7 : daysUntilFriday));
}

function label(deal: Deal): string {
  return (
    deal.customerName ||
    [deal.firstName, deal.lastName].filter(Boolean).join(' ') ||
    deal.address ||
    'this deal'
  );
}

export function followUpQuestion(followUp: FollowUp): string {
  const who = label(followUp.deal);
  return followUp.kind === 'install'
    ? `Did ${who} get installed?`
    : `Did the pay come through for ${who}?`;
}

/**
 * Deals waiting on the rep to confirm something.
 *
 * - install: the booked install date has passed but the deal is still sitting in "sold".
 * - pay: the job is installed but not marked paid, and the first Friday after the booked
 *   install date has arrived.
 *
 * Once a rep answers (advances the stage, cancels, or dismisses) the prompt stops — a
 * dismissed prompt is recorded on the deal so it doesn't come back tomorrow.
 */
export function pendingFollowUps(deals: Deal[], today = todayISO()): FollowUp[] {
  const out: FollowUp[] = [];

  for (const deal of deals) {
    if (deal.deletedAt || deal.stage === 'cancelled' || deal.stage === 'paid') continue;
    if (!deal.scheduledInstallDate) continue;

    if (deal.stage === 'sold' && !deal.installPromptSentAt && deal.scheduledInstallDate <= today) {
      out.push({ deal, kind: 'install', dueDate: deal.scheduledInstallDate });
      continue;
    }

    if (deal.stage === 'installed' && !deal.payPromptSentAt) {
      const payday = fridayAfter(deal.scheduledInstallDate);
      if (payday <= today) out.push({ deal, kind: 'pay', dueDate: payday });
    }
  }

  return out.sort((a, b) => a.dueDate.localeCompare(b.dueDate));
}

export interface CancellationStats {
  cancelled: number;
  /** Cancelled ÷ (sales + cancelled), as a percentage. */
  cancelRate: number;
  /** Commission attached to cancelled deals — money that evaporated. */
  lost: number;
}

export function cancellationStats(
  deals: Deal[],
  commissionByDealId: Record<string, { amount: number }>
): CancellationStats {
  const live = deals.filter((d) => !d.deletedAt);
  const cancelled = live.filter((d) => d.stage === 'cancelled');
  const sold = live.length - cancelled.length;
  const denominator = sold + cancelled.length;
  return {
    cancelled: cancelled.length,
    cancelRate: denominator > 0 ? (cancelled.length / denominator) * 100 : 0,
    lost: cancelled.reduce((sum, d) => sum + (commissionByDealId[d.id]?.amount ?? 0), 0),
  };
}
