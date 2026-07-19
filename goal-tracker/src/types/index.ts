export interface Deal {
  id: string;
  /** ISO date string (yyyy-mm-dd) the deal counts against, not necessarily creation time */
  date: string;
  createdAt: string;
  updatedAt: string;
  customerName?: string;
  address?: string;
  notes?: string;
  /** Marks a deal created while offline and not yet pushed to Firestore */
  synced: boolean;
  /** Set when the deal is deleted locally but the delete hasn't synced yet */
  deletedAt?: string;
}

export type PaceStatus = 'ahead' | 'on-pace' | 'behind';

export interface NotificationTime {
  id: string;
  hour: number;
  minute: number;
  enabled: boolean;
}

export interface Settings {
  installGoal: number;
  salesGoal: number;
  retentionPercent: number;
  /** ISO date string (yyyy-mm-dd) */
  deadline: string;
  /** ISO date string (yyyy-mm-dd) - when the push toward the goal started */
  startDate: string;
  dailyTarget: number;
  notificationTimes: NotificationTime[];
  notificationsEnabled: boolean;
  updatedAt: string;
}

export const MILESTONES = [10, 25, 50, 75, 100] as const;

export interface GoalStats {
  totalSales: number;
  salesRemaining: number;
  percentComplete: number;
  projectedInstalls: number;
  retentionPercent: number;
  todaySales: number;
  weekSales: number;
  monthSales: number;
  daysRemaining: number;
  daysElapsed: number;
  totalDays: number;
  requiredPerDay: number;
  requiredPerWeek: number;
  expectedByToday: number;
  pace: PaceStatus;
  paceDelta: number;
  currentStreak: number;
  longestStreak: number;
  bestDay: { date: string; count: number } | null;
  bestWeek: { weekStart: string; count: number } | null;
  runningAverage: number;
  projectedFinishDate: string | null;
  nextMilestone: number | null;
  reachedMilestones: number[];
}

export interface DailyPoint {
  date: string;
  count: number;
}

export interface WeeklyPoint {
  weekStart: string;
  label: string;
  count: number;
}

export interface MonthlyPoint {
  month: string;
  label: string;
  count: number;
}
