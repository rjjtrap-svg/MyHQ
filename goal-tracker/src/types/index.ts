export type OcrStatus = 'none' | 'pending' | 'done' | 'error';

/** Pipeline position, sale through payout. Public — visible to the whole team. */
export type DealStage = 'sold' | 'installed' | 'paid';

export const DEAL_STAGES: DealStage[] = ['sold', 'installed', 'paid'];

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

  /** Every deal requires a photo; these fields tie it to the team + rep and the OCR pipeline. */
  teamId: string;
  repUid: string;
  repName: string;
  photoUrl?: string;
  ocrStatus: OcrStatus;
  /** Text lines detected by Cloud Vision, offered as tap-to-fill suggestions. */
  ocrLines?: string[];

  /** Sale-to-payout pipeline. Timestamps mark when each stage was reached. */
  stage: DealStage;
  soldAt: string;
  installedAt?: string;
  paidAt?: string;
}

/**
 * Commission is kept OUT of the Deal doc on purpose: Deal is readable by the whole team
 * (leaderboard etc.), but commission is money and should only ever be visible to the rep
 * who earned it and the manager. Lives in a sibling collection so Firestore rules can
 * enforce that split at the document level.
 */
export interface Commission {
  dealId: string;
  teamId: string;
  repUid: string;
  amount: number;
  updatedAt: string;
}

export type Role = 'manager' | 'rep';

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  teamId: string;
  role: Role;
  createdAt: string;
}

/** A team's shared goal targets, set by the manager. Distinct from each rep's personal Settings. */
export interface Team {
  id: string;
  name: string;
  ownerUid: string;
  inviteCode: string;
  salesGoal: number;
  installGoal: number;
  retentionPercent: number;
  deadline: string;
  startDate: string;
  createdAt: string;
  updatedAt: string;
}

export interface Membership {
  uid: string;
  displayName: string;
  role: Role;
  joinedAt: string;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  role: Role;
  totalSales: number;
  todaySales: number;
  weekSales: number;
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
