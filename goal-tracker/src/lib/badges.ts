import { FontAwesome } from '@expo/vector-icons';
import { Deal } from '@/src/types';
import { startOfWeek, toISODate } from './dates';

type IconName = React.ComponentProps<typeof FontAwesome>['name'];

export interface BadgeDef {
  id: string;
  /** Grouped so the profile can show tiers of the same achievement in a row. */
  group: 'knocks' | 'sales' | 'streak' | 'craft';
  name: string;
  /** Shown under the patch — says what earns it, in plain terms. */
  requirement: string;
  icon: IconName;
  /** How far along the rep is toward earning it, 0..1. 1 means earned. */
  progress: (ctx: BadgeContext) => number;
}

export interface BadgeContext {
  totalKnocks: number;
  totalSales: number;
  bestDaySales: number;
  bestWeekSales: number;
  longestStreak: number;
  closeRate: number;
  gradedPitches: number;
  bestPitchGrade: number;
}

function ratio(value: number, target: number): number {
  if (target <= 0) return 1;
  return Math.min(value / target, 1);
}

/**
 * Tiered patches. Every badge is a simple threshold so a rep can always tell exactly what
 * they need to do next — the profile shows the un-earned ones greyed out with their
 * requirement, which is the whole motivational point.
 */
export const BADGES: BadgeDef[] = [
  // Doors knocked — the daily grind.
  { id: 'knock-1', group: 'knocks', name: 'First Knuckle', requirement: 'Knock 1 door', icon: 'hand-o-up', progress: (c) => ratio(c.totalKnocks, 1) },
  { id: 'knock-100', group: 'knocks', name: 'Century', requirement: 'Knock 100 doors', icon: 'hand-o-up', progress: (c) => ratio(c.totalKnocks, 100) },
  { id: 'knock-500', group: 'knocks', name: 'Blister', requirement: 'Knock 500 doors', icon: 'hand-o-up', progress: (c) => ratio(c.totalKnocks, 500) },
  { id: 'knock-1000', group: 'knocks', name: 'Iron Fist', requirement: 'Knock 1,000 doors', icon: 'hand-o-up', progress: (c) => ratio(c.totalKnocks, 1000) },

  // Sales in a single day — the thing the daily alerts celebrate.
  { id: 'day-2', group: 'sales', name: 'Heating Up', requirement: '2 sales in a day', icon: 'fire', progress: (c) => ratio(c.bestDaySales, 2) },
  { id: 'day-5', group: 'sales', name: 'On Fire', requirement: '5 sales in a day', icon: 'fire', progress: (c) => ratio(c.bestDaySales, 5) },
  { id: 'day-8', group: 'sales', name: 'Selling Frenzy', requirement: '8 sales in a day', icon: 'bolt', progress: (c) => ratio(c.bestDaySales, 8) },
  { id: 'day-10', group: 'sales', name: "Daddy's Home", requirement: '10 sales in a day', icon: 'trophy', progress: (c) => ratio(c.bestDaySales, 10) },

  // Consistency.
  { id: 'streak-3', group: 'streak', name: 'Three-Peat', requirement: '3-day selling streak', icon: 'calendar-check-o', progress: (c) => ratio(c.longestStreak, 3) },
  { id: 'streak-7', group: 'streak', name: 'Full Week', requirement: '7-day selling streak', icon: 'calendar-check-o', progress: (c) => ratio(c.longestStreak, 7) },
  { id: 'week-15', group: 'streak', name: 'Big Week', requirement: '15 sales in one week', icon: 'line-chart', progress: (c) => ratio(c.bestWeekSales, 15) },
  { id: 'total-100', group: 'streak', name: 'Triple Digits', requirement: '100 career sales', icon: 'star', progress: (c) => ratio(c.totalSales, 100) },

  // Craft — closing skill and coaching effort, not just volume.
  { id: 'close-10', group: 'craft', name: 'Sharp', requirement: 'Hit a 10% close rate', icon: 'crosshairs', progress: (c) => ratio(c.closeRate, 10) },
  { id: 'close-20', group: 'craft', name: 'Deadly', requirement: 'Hit a 20% close rate', icon: 'crosshairs', progress: (c) => ratio(c.closeRate, 20) },
  { id: 'pitch-5', group: 'craft', name: 'Student', requirement: 'Get 5 pitches graded', icon: 'graduation-cap', progress: (c) => ratio(c.gradedPitches, 5) },
  { id: 'pitch-90', group: 'craft', name: 'Polished', requirement: 'Score 90+ on a pitch', icon: 'certificate', progress: (c) => ratio(c.bestPitchGrade, 90) },
];

export const BADGE_GROUP_LABELS: Record<BadgeDef['group'], string> = {
  knocks: 'Doors',
  sales: 'Big Days',
  streak: 'Consistency',
  craft: 'Craft',
};

/** Best single week total across a rep's whole history. */
export function bestWeekTotal(deals: Deal[]): number {
  const weeks = new Map<string, number>();
  for (const d of deals) {
    const key = toISODate(startOfWeek(new Date(`${d.date}T00:00:00`)));
    weeks.set(key, (weeks.get(key) ?? 0) + 1);
  }
  return weeks.size ? Math.max(...weeks.values()) : 0;
}
