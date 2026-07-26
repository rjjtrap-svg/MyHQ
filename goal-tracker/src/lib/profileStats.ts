import { Commission, Deal } from '@/src/types';
import {
  addDays,
  monthKey,
  monthLabel,
  parseISODate,
  startOfWeek,
  todayISO,
  toISODate,
  weekdayLabel,
} from './dates';

export interface PersonalBests {
  bestDay: { date: string; count: number } | null;
  bestWeek: { weekStart: string; count: number } | null;
  bestMonth: { month: string; label: string; count: number } | null;
  /** Largest single commission on one deal. */
  biggestPaycheck: number;
  /** Largest total commission earned across a single day. */
  biggestCommissionDay: { date: string; amount: number } | null;
}

export interface Trends {
  last7: number;
  prev7: number;
  last30: number;
  prev30: number;
  closeRateLast30: number;
  closeRatePrev30: number;
  /** The weekday this rep knocks the most doors on. */
  favoriteKnockingDay: { day: string; knocks: number } | null;
}

export interface ProfileStats extends PersonalBests, Trends {
  totalSales: number;
  totalKnocks: number;
  /** Career close rate as a percentage (sales ÷ knocks). */
  closeRate: number;
  totalEarned: number;
  /** Straight-line projection of this quarter's earnings from the pace so far. */
  quarterlyProjectedEarnings: number;
  quarterEarnedSoFar: number;
}

/** Same rule as the goal stats engine: a cancelled deal is not a sale. */
function activeDeals(deals: Deal[]): Deal[] {
  return deals.filter((d) => !d.deletedAt && d.stage !== 'cancelled');
}

function countBetween(deals: Deal[], startIso: string, endIso: string): number {
  return deals.filter((d) => d.date >= startIso && d.date <= endIso).length;
}

function sumBetween(byDate: Map<string, number>, startIso: string, endIso: string): number {
  let total = 0;
  for (const [date, n] of byDate) {
    if (date >= startIso && date <= endIso) total += n;
  }
  return total;
}

function rate(sales: number, knocks: number): number {
  return knocks > 0 ? (sales / knocks) * 100 : 0;
}

/**
 * Everything the Profile tab shows, derived from the rep's own deals, commissions and
 * door-knock log. All pure — no I/O — so it stays cheap to recompute on every render.
 */
export function computeProfileStats(
  deals: Deal[],
  commissions: Commission[],
  knocksByDate: Record<string, number>
): ProfileStats {
  const active = activeDeals(deals);
  const today = new Date();
  const todayIso = todayISO();

  // --- Bests: day, week, month ---
  const dayTotals = new Map<string, number>();
  const weekTotals = new Map<string, number>();
  const monthTotals = new Map<string, number>();
  for (const d of active) {
    dayTotals.set(d.date, (dayTotals.get(d.date) ?? 0) + 1);
    const wk = toISODate(startOfWeek(parseISODate(d.date)));
    weekTotals.set(wk, (weekTotals.get(wk) ?? 0) + 1);
    const mk = d.date.slice(0, 7);
    monthTotals.set(mk, (monthTotals.get(mk) ?? 0) + 1);
  }

  let bestDay: PersonalBests['bestDay'] = null;
  for (const [date, count] of dayTotals) {
    if (!bestDay || count > bestDay.count) bestDay = { date, count };
  }
  let bestWeek: PersonalBests['bestWeek'] = null;
  for (const [weekStart, count] of weekTotals) {
    if (!bestWeek || count > bestWeek.count) bestWeek = { weekStart, count };
  }
  let bestMonth: PersonalBests['bestMonth'] = null;
  for (const [month, count] of monthTotals) {
    if (!bestMonth || count > bestMonth.count) {
      bestMonth = { month, label: `${monthLabel(parseISODate(`${month}-01`))} ${month.slice(0, 4)}`, count };
    }
  }

  // --- Money ---
  const dealDateById = new Map(active.map((d) => [d.id, d.date]));
  const commissionByDate = new Map<string, number>();
  let biggestPaycheck = 0;
  let totalEarned = 0;
  for (const c of commissions) {
    const date = dealDateById.get(c.dealId);
    if (!date) continue;
    totalEarned += c.amount;
    biggestPaycheck = Math.max(biggestPaycheck, c.amount);
    commissionByDate.set(date, (commissionByDate.get(date) ?? 0) + c.amount);
  }
  let biggestCommissionDay: PersonalBests['biggestCommissionDay'] = null;
  for (const [date, amount] of commissionByDate) {
    if (!biggestCommissionDay || amount > biggestCommissionDay.amount) {
      biggestCommissionDay = { date, amount };
    }
  }

  // Quarter-to-date earnings, extended straight-line to the end of the quarter.
  const quarterStartMonth = Math.floor(today.getMonth() / 3) * 3;
  const quarterStart = new Date(today.getFullYear(), quarterStartMonth, 1);
  const quarterEnd = new Date(today.getFullYear(), quarterStartMonth + 3, 0);
  const quarterStartIso = toISODate(quarterStart);
  const quarterEndIso = toISODate(quarterEnd);
  const quarterEarnedSoFar = sumBetween(commissionByDate, quarterStartIso, todayIso);
  const daysIntoQuarter = Math.max(
    Math.round((today.getTime() - quarterStart.getTime()) / 86400000) + 1,
    1
  );
  const daysInQuarter = Math.round((quarterEnd.getTime() - quarterStart.getTime()) / 86400000) + 1;
  const quarterlyProjectedEarnings =
    quarterEarnedSoFar > 0 ? (quarterEarnedSoFar / daysIntoQuarter) * daysInQuarter : 0;

  // --- Knocks and close rate ---
  const totalKnocks = Object.values(knocksByDate).reduce((a, b) => a + b, 0);
  const totalSales = active.length;

  const knockMap = new Map(Object.entries(knocksByDate));
  const last7Start = toISODate(addDays(today, -6));
  const prev7Start = toISODate(addDays(today, -13));
  const prev7End = toISODate(addDays(today, -7));
  const last30Start = toISODate(addDays(today, -29));
  const prev30Start = toISODate(addDays(today, -59));
  const prev30End = toISODate(addDays(today, -30));

  const last30Sales = countBetween(active, last30Start, todayIso);
  const prev30Sales = countBetween(active, prev30Start, prev30End);
  const last30Knocks = sumBetween(knockMap, last30Start, todayIso);
  const prev30Knocks = sumBetween(knockMap, prev30Start, prev30End);

  // Favourite knocking day — which weekday this rep actually puts the doors in on.
  const byWeekday = new Map<string, number>();
  for (const [date, count] of knockMap) {
    const label = weekdayLabel(parseISODate(date));
    byWeekday.set(label, (byWeekday.get(label) ?? 0) + count);
  }
  let favoriteKnockingDay: Trends['favoriteKnockingDay'] = null;
  for (const [day, knocks] of byWeekday) {
    if (!favoriteKnockingDay || knocks > favoriteKnockingDay.knocks) {
      favoriteKnockingDay = { day, knocks };
    }
  }

  return {
    bestDay,
    bestWeek,
    bestMonth,
    biggestPaycheck,
    biggestCommissionDay,

    last7: countBetween(active, last7Start, todayIso),
    prev7: countBetween(active, prev7Start, prev7End),
    last30: last30Sales,
    prev30: prev30Sales,
    closeRateLast30: rate(last30Sales, last30Knocks),
    closeRatePrev30: rate(prev30Sales, prev30Knocks),
    favoriteKnockingDay,

    totalSales,
    totalKnocks,
    closeRate: rate(totalSales, totalKnocks),
    totalEarned,
    quarterlyProjectedEarnings,
    quarterEarnedSoFar,
  };
}

/** Monthly sales totals for the last `months` months, oldest first. */
export function recentMonthlySales(deals: Deal[], months = 6) {
  const active = activeDeals(deals);
  const today = new Date();
  const out: { label: string; count: number }[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = monthKey(d);
    out.push({ label: monthLabel(d), count: active.filter((deal) => deal.date.startsWith(key)).length });
  }
  return out;
}
