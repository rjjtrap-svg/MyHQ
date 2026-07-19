import { Deal, DailyPoint, GoalStats, MonthlyPoint, PaceStatus, Settings, WeeklyPoint, MILESTONES } from '@/src/types';
import {
  addDays,
  daysBetween,
  monthKey,
  monthLabel,
  parseISODate,
  shortDateLabel,
  startOfMonth,
  startOfWeek,
  todayISO,
  toISODate,
} from './dates';

function activeDeals(deals: Deal[]): Deal[] {
  return deals.filter((d) => !d.deletedAt);
}

function countByExactDate(deals: Deal[], iso: string): number {
  return deals.filter((d) => d.date === iso).length;
}

function groupByDate(deals: Deal[]): Map<string, number> {
  const map = new Map<string, number>();
  for (const d of deals) {
    map.set(d.date, (map.get(d.date) ?? 0) + 1);
  }
  return map;
}

function paceStatus(delta: number): PaceStatus {
  if (delta > 0.5) return 'ahead';
  if (delta < -0.5) return 'behind';
  return 'on-pace';
}

export function computeGoalStats(deals: Deal[], settings: Settings): GoalStats {
  const active = activeDeals(deals);
  const today = new Date();
  const todayIso = todayISO();

  const totalSales = active.length;
  const salesRemaining = Math.max(settings.salesGoal - totalSales, 0);
  const percentComplete = settings.salesGoal > 0 ? totalSales / settings.salesGoal : 0;
  const projectedInstalls = totalSales * (settings.retentionPercent / 100);

  const weekStartIso = toISODate(startOfWeek(today));
  const monthStartIso = toISODate(startOfMonth(today));

  const todaySales = countByExactDate(active, todayIso);
  const weekSales = active.filter((d) => d.date >= weekStartIso).length;
  const monthSales = active.filter((d) => d.date >= monthStartIso).length;

  const deadlineDate = parseISODate(settings.deadline);
  const startDate = parseISODate(settings.startDate);

  const daysRemaining = daysBetween(today, deadlineDate);
  const daysElapsed = Math.max(daysBetween(startDate, today) + 1, 1);
  const totalDays = Math.max(daysBetween(startDate, deadlineDate) + 1, 1);

  const requiredPerDay = daysRemaining > 0 ? salesRemaining / daysRemaining : salesRemaining;
  const requiredPerWeek = requiredPerDay * 7;

  const expectedByToday = Math.min(
    settings.salesGoal,
    settings.salesGoal * Math.min(daysElapsed / totalDays, 1)
  );
  const paceDelta = totalSales - expectedByToday;
  const pace = paceStatus(paceDelta);

  const byDate = groupByDate(active);

  // Streaks: walk backward from today (grace period if today has no sale yet).
  const sortedDates = Array.from(byDate.keys()).sort();
  const dateSet = new Set(sortedDates);
  let currentStreak = 0;
  {
    let cursor = today;
    if (!dateSet.has(todayIso)) {
      cursor = addDays(cursor, -1);
    }
    while (dateSet.has(toISODate(cursor))) {
      currentStreak += 1;
      cursor = addDays(cursor, -1);
    }
  }

  let longestStreak = 0;
  {
    let run = 0;
    let prev: Date | null = null;
    for (const iso of sortedDates) {
      const d = parseISODate(iso);
      if (prev && daysBetween(prev, d) === 1) {
        run += 1;
      } else {
        run = 1;
      }
      longestStreak = Math.max(longestStreak, run);
      prev = d;
    }
  }
  longestStreak = Math.max(longestStreak, currentStreak);

  let bestDay: { date: string; count: number } | null = null;
  for (const [date, count] of byDate) {
    if (!bestDay || count > bestDay.count) bestDay = { date, count };
  }

  const weekTotals = new Map<string, number>();
  for (const d of active) {
    const weekStart = toISODate(startOfWeek(parseISODate(d.date)));
    weekTotals.set(weekStart, (weekTotals.get(weekStart) ?? 0) + 1);
  }
  let bestWeek: { weekStart: string; count: number } | null = null;
  for (const [weekStart, count] of weekTotals) {
    if (!bestWeek || count > bestWeek.count) bestWeek = { weekStart, count };
  }

  const runningAverage = totalSales / daysElapsed;

  let projectedFinishDate: string | null = null;
  if (runningAverage > 0 && salesRemaining > 0) {
    const daysNeeded = Math.ceil(salesRemaining / runningAverage);
    projectedFinishDate = toISODate(addDays(today, daysNeeded));
  } else if (salesRemaining <= 0) {
    projectedFinishDate = todayIso;
  }

  const milestoneTargets = [...MILESTONES, settings.salesGoal].filter(
    (v, i, arr) => arr.indexOf(v) === i
  );
  const reachedMilestones = milestoneTargets.filter((m) => totalSales >= m).sort((a, b) => a - b);
  const nextMilestone =
    milestoneTargets.filter((m) => totalSales < m).sort((a, b) => a - b)[0] ?? null;

  return {
    totalSales,
    salesRemaining,
    percentComplete,
    projectedInstalls,
    retentionPercent: settings.retentionPercent,
    todaySales,
    weekSales,
    monthSales,
    daysRemaining,
    daysElapsed,
    totalDays,
    requiredPerDay,
    requiredPerWeek,
    expectedByToday,
    pace,
    paceDelta,
    currentStreak,
    longestStreak,
    bestDay,
    bestWeek,
    runningAverage,
    projectedFinishDate,
    nextMilestone,
    reachedMilestones,
  };
}

export function dailyPoints(deals: Deal[], days = 14): DailyPoint[] {
  const active = activeDeals(deals);
  const byDate = groupByDate(active);
  const today = new Date();
  const points: DailyPoint[] = [];
  for (let i = days - 1; i >= 0; i -= 1) {
    const d = addDays(today, -i);
    const iso = toISODate(d);
    points.push({ date: iso, count: byDate.get(iso) ?? 0 });
  }
  return points;
}

export function weeklyPoints(deals: Deal[], weeks = 8): WeeklyPoint[] {
  const active = activeDeals(deals);
  const today = new Date();
  const points: WeeklyPoint[] = [];
  const thisWeekStart = startOfWeek(today);
  for (let i = weeks - 1; i >= 0; i -= 1) {
    const weekStart = addDays(thisWeekStart, -7 * i);
    const weekEnd = addDays(weekStart, 6);
    const weekStartIso = toISODate(weekStart);
    const weekEndIso = toISODate(weekEnd);
    const count = active.filter((d) => d.date >= weekStartIso && d.date <= weekEndIso).length;
    points.push({ weekStart: weekStartIso, label: shortDateLabel(weekStart), count });
  }
  return points;
}

export function monthlyPoints(deals: Deal[], months = 6): MonthlyPoint[] {
  const active = activeDeals(deals);
  const today = new Date();
  const points: MonthlyPoint[] = [];
  for (let i = months - 1; i >= 0; i -= 1) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const key = monthKey(d);
    const count = active.filter((deal) => deal.date.startsWith(key)).length;
    points.push({ month: key, label: monthLabel(d), count });
  }
  return points;
}
