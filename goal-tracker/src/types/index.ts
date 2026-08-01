export type OcrStatus = 'none' | 'pending' | 'done' | 'error';

/**
 * Pipeline position, sale through payout. Public — visible to the whole team.
 * 'cancelled' is terminal and sits outside the forward pipeline: a cancelled deal can be
 * reached from any stage and isn't something you advance *to* in order.
 */
export type DealStage = 'sold' | 'installed' | 'paid' | 'cancelled';

/** The forward pipeline only — 'cancelled' is deliberately excluded. */
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
  /** Parsed from labelled fields on the screenshot — "First Name:", "Phone:" and friends. */
  ocrGuessedFirstName?: string;
  ocrGuessedLastName?: string;
  ocrGuessedPhone?: string;

  /** Optional customer details — nice to have, never required to log a sale. */
  firstName?: string;
  lastName?: string;
  phone?: string;
  /** ISO date (yyyy-mm-dd) the install is booked for. Drives the follow-up reminders. */
  scheduledInstallDate?: string;

  /** Sale-to-payout pipeline. Timestamps mark when each stage was reached. */
  stage: DealStage;
  soldAt: string;
  installedAt?: string;
  paidAt?: string;
  cancelledAt?: string;
  cancelReason?: string;

  /**
   * Set once each follow-up nudge has gone out, so the daily job doesn't re-send it every
   * morning for the rest of the deal's life.
   */
  installPromptSentAt?: string;
  payPromptSentAt?: string;
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
  /** Career numbers from before this app, typed in by the rep — see PersonalBestOverrides. */
  bests?: PersonalBestOverrides;
}

/**
 * Bests a rep achieved before they started logging here. The Profile tab shows whichever
 * is larger, the entered number or the one computed from logged deals, so a rep's card
 * reflects their actual career rather than restarting at zero on install day.
 */
export interface PersonalBestOverrides {
  bestDay?: number;
  bestWeek?: number;
  bestMonth?: number;
  longestStreak?: number;
  biggestPaycheck?: number;
  biggestCommissionDay?: number;
  careerSales?: number;
  careerKnocks?: number;
}

export const PERSONAL_BEST_FIELDS: {
  key: keyof PersonalBestOverrides;
  label: string;
  hint: string;
  money?: boolean;
}[] = [
  { key: 'bestDay', label: 'Best day', hint: 'Most sales in one day' },
  { key: 'bestWeek', label: 'Best week', hint: 'Most sales in one week' },
  { key: 'bestMonth', label: 'Best month', hint: 'Most sales in one month' },
  { key: 'longestStreak', label: 'Longest streak', hint: 'Days in a row with a sale' },
  { key: 'biggestPaycheck', label: 'Biggest paycheck', hint: 'Largest single commission', money: true },
  { key: 'biggestCommissionDay', label: 'Biggest day', hint: 'Most commission in one day', money: true },
  { key: 'careerSales', label: 'Career sales', hint: 'Total sales before this app' },
  { key: 'careerKnocks', label: 'Career doors', hint: 'Total doors before this app' },
];

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
 * What happened at one door. `DoorKnockEntry` above is the daily total a rep types in;
 * this is the per-address record behind it. Both exist on purpose — a rep who doesn't want
 * to log every door individually can still enter a count and keep their close rate honest.
 */
export type KnockDisposition =
  | 'not_home'
  | 'not_interested'
  | 'callback'
  | 'sold'
  | 'do_not_knock';

/** Dispositions in the order they should be offered — most common first. */
export const KNOCK_DISPOSITIONS: KnockDisposition[] = [
  'not_home',
  'not_interested',
  'callback',
  'sold',
  'do_not_knock',
];

export const KNOCK_DISPOSITION_LABELS: Record<KnockDisposition, string> = {
  not_home: 'Not home',
  not_interested: 'Not interested',
  callback: 'Come back',
  sold: 'Sold',
  do_not_knock: 'Do not knock',
};

export interface KnockRecord {
  id: string;
  teamId: string;
  repUid: string;
  repName: string;
  /** ISO date (yyyy-mm-dd) the knock counts against. */
  date: string;
  /** Free-text as the rep typed it. `street` is derived from this for grouping. */
  address: string;
  /** Street portion of `address`, lowercased — the grouping key. Derived, never typed. */
  street: string;
  disposition: KnockDisposition;
  notes?: string;
  /** Only meaningful when disposition === 'callback': ISO date to come back on. */
  callbackDate?: string;
  /** Set when disposition === 'sold' and the rep logged the deal from this door. */
  dealId?: string;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string;
}

/**
 * A rep's private writing in Lock In — journal entries, goals, and their why.
 *
 * Private means private. Like coach chat, this is NOT readable by managers or team leads,
 * and the Firestore rules enforce that. A why is usually about money someone doesn't have
 * or a person they're trying to prove something to; it only gets written honestly if the
 * rep is certain their boss can't read it. Do not add a manager view over this.
 */
export type NoteKind = 'journal' | 'why' | 'goal';

export interface LockInNote {
  id: string;
  teamId: string;
  repUid: string;
  kind: NoteKind;
  /** Optional for journal entries; goals and whys generally have one. */
  title?: string;
  body: string;
  /** Set when the entry was started from a Why exercise — the exercise's id. */
  exerciseId?: string;
  /** kind 'goal' only. ISO yyyy-mm-dd. */
  targetDate?: string;
  /** kind 'goal' only. Set when the rep marks it done. */
  completedAt?: string;
  /** The current why floats to the top and shows before the first door. */
  pinned?: boolean;
  createdAt: string;
  updatedAt: string;
}

/**
 * A standing override rate: what one leader earns per deal closed by one rep.
 *
 * NOT the same thing as `CommissionOverride` below, despite the shared word. That one is a
 * correction to a single rep's commission on a single deal. This is the leader's own
 * earnings structure — a rate that applies to every deal that rep closes from now on, and
 * the thing that rolls up into a team lead's or manager's override total.
 *
 * Doc id is `${leaderUid}_${repUid}`, so a rep can carry overrides to more than one leader
 * at once — the normal case, where a team lead and the manager above them both earn on the
 * same deal.
 */
export interface RepOverrideRate {
  teamId: string;
  /** The leader who earns this. */
  leaderUid: string;
  leaderName: string;
  /** The rep whose deals generate it. */
  repUid: string;
  repName: string;
  /** Dollars per closed deal. */
  amountPerDeal: number;
  /**
   * ISO date (yyyy-mm-dd). Deals dated before this don't count. Left unset, the rate
   * applies to the rep's whole history — which is what you want when first entering an
   * arrangement that already existed. Set it when a rate genuinely changes, so raising
   * someone's rate doesn't silently rewrite what you earned last quarter.
   */
  effectiveFrom?: string;
  setByUid: string;
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

/**
 * One thread in a rep's coach chat history. `id` is `'legacy'` for messages sent before
 * conversations existed as their own unit (kept in place, never migrated — see
 * coachChat.ts) — every conversation created after that has a real id.
 */
export interface CoachConversation {
  id: string;
  preview: string;
  updatedAt: string;
}
