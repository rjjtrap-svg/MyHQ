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
  /** Raw text lines detected by Cloud Vision — kept as a fallback, not shown directly. */
  ocrLines?: string[];
  /** Best-guess name/address the Cloud Function picked out of ocrLines via heuristics. */
  ocrGuessedName?: string;
  ocrGuessedAddress?: string;

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

/** manager sees/oversees everyone; team_lead oversees an assigned subset of reps; rep is a rep. */
export type Role = 'manager' | 'team_lead' | 'rep';

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
  /** Free-text label shown in Settings, e.g. "Cityside" — informational only. */
  company?: string;
  /**
   * Set when this company's confirmation paperwork never has customer info on it (e.g.
   * Cityside), so the Add Deal screen skips waiting on/showing OCR results and goes
   * straight to manual entry instead of wasting the rep's time.
   */
  autoFillDisabled?: boolean;
}

export interface Membership {
  uid: string;
  displayName: string;
  role: Role;
  joinedAt: string;
  /** Only meaningful when role is 'rep' — the uid of the team_lead who oversees them. Set by the manager. */
  overseerUid?: string;
  /** Profile card, visible to the whole team. Both are optional and self-edited. */
  photoUrl?: string;
  bio?: string;
}

export interface LeaderboardEntry {
  uid: string;
  displayName: string;
  role: Role;
  totalSales: number;
  todaySales: number;
  weekSales: number;
}

/** A rep's self-reported door-knock count for one day — used to compute closing %. */
export interface DoorKnockEntry {
  teamId: string;
  repUid: string;
  /** ISO date string (yyyy-mm-dd) */
  date: string;
  count: number;
  updatedAt: string;
}

/**
 * A manager/team_lead correction to a rep's commission on a specific deal. Deliberately kept
 * in its own collection with its own Firestore rules — NOT readable by the rep it's about,
 * only by that rep's overseeing team_lead and the manager.
 */
export interface CommissionOverride {
  dealId: string;
  teamId: string;
  repUid: string;
  amount: number;
  setByUid: string;
  updatedAt: string;
}

/** A registered web-push token for one browser/device, so Cloud Functions can send to it. */
export interface PushToken {
  token: string;
  uid: string;
  teamId: string;
  createdAt: string;
}

/**
 * Same-day sale streaks the team gets pinged about, in escalating order. Keep the
 * thresholds and copy in sync with DAILY_SALE_ALERTS in functions/index.js — the Cloud
 * Function sends the push, this copy is what the app shows.
 */
export const DAILY_SALE_ALERTS = [
  { count: 2, title: 'Heating Up 🔥', blurb: 'Two on the board.' },
  { count: 4, title: 'On Fire 🔥🔥🔥', blurb: 'Four deep and rolling.' },
  { count: 6, title: 'Burning Up 🔥🔥🔥🔥🔥', blurb: 'Six. The street is yours.' },
  { count: 8, title: 'Selling Frenzy 🔥🔥🔥🔥🔥🔥🔥', blurb: 'Eight sales. Absolute tear.' },
  { count: 10, title: "Daddy's Home 🍆🍆🍆", blurb: 'Ten in a day. Legendary.' },
] as const;

export const DAILY_SALE_MILESTONES = DAILY_SALE_ALERTS.map((a) => a.count);

/** The alert copy for the highest threshold a rep has crossed today, if any. */
export function dailySaleAlertFor(count: number) {
  return [...DAILY_SALE_ALERTS].reverse().find((a) => count >= a.count) ?? null;
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
  /** A simple end-of-day nudge to log any deals from today — separate from pace reminders. */
  dealLogReminderEnabled: boolean;
  dealLogReminderHour: number;
  dealLogReminderMinute: number;
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

export type PitchSubmissionStatus = 'uploading' | 'transcribing' | 'grading' | 'done' | 'error';

/** A rep's recorded practice pitch, transcribed and graded by an AI coach. */
export interface PitchSubmission {
  id: string;
  teamId: string;
  repUid: string;
  repName: string;
  status: PitchSubmissionStatus;
  audioUrl?: string;
  transcript?: string;
  /** 0-100 */
  grade?: number;
  summary?: string;
  strengths?: string[];
  improvements?: string[];
  errorMessage?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ObjectionExchange {
  id: string;
  question: string;
  answer: string;
}

/** One turn in a rep's ongoing chat with the persistent Managed Agent coach. */
export interface CoachChatMessage {
  id: string;
  role: 'user' | 'agent';
  text: string;
  /** Present when the user attached a photo or voice memo to this message. */
  attachmentType?: 'image' | 'audio';
  attachmentUrl?: string;
  createdAt: string;
}
