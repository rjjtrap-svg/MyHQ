import { create } from 'zustand';
import { DAILY_SALE_ALERTS, dailySaleAlertFor } from '@/src/types';
import { todayISO } from '@/src/lib/dates';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/src/lib/storage';

type DailyAlert = (typeof DAILY_SALE_ALERTS)[number];

/** Which same-day thresholds have already been celebrated, and on what date. */
interface CelebratedDaily {
  date: string;
  counts: number[];
}

interface UIState {
  celebratedMilestones: number[];
  celebratedDaily: CelebratedDaily;
  hydrated: boolean;
  /** A career milestone (10/25/50…) awaiting its confetti overlay. */
  pendingCelebration: number | null;
  /** A same-day streak alert (Heating Up, On Fire…) awaiting its overlay. */
  pendingDailyAlert: DailyAlert | null;
  hydrate: () => Promise<void>;
  checkMilestones: (reachedMilestones: number[]) => void;
  checkDailyAlerts: (todaySales: number) => void;
  clearCelebration: () => void;
  clearDailyAlert: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  celebratedMilestones: [],
  celebratedDaily: { date: todayISO(), counts: [] },
  hydrated: false,
  pendingCelebration: null,
  pendingDailyAlert: null,

  hydrate: async () => {
    const stored = (await loadJSON<number[]>(STORAGE_KEYS.celebratedMilestones)) ?? [];
    const daily = (await loadJSON<CelebratedDaily>(STORAGE_KEYS.celebratedDailyAlerts)) ?? {
      date: todayISO(),
      counts: [],
    };
    set({ celebratedMilestones: stored, celebratedDaily: daily, hydrated: true });
  },

  checkMilestones: (reachedMilestones) => {
    const { celebratedMilestones } = get();
    const newOnes = reachedMilestones.filter((m) => !celebratedMilestones.includes(m));
    if (newOnes.length === 0) return;

    const highest = Math.max(...newOnes);
    const updated = [...celebratedMilestones, ...newOnes];
    set({ celebratedMilestones: updated, pendingCelebration: highest });
    saveJSON(STORAGE_KEYS.celebratedMilestones, updated);
  },

  /**
   * Fires the in-app version of the push the whole team gets. Tracked per calendar day
   * so tomorrow's second sale celebrates again — these are same-day streaks, not
   * once-in-a-career milestones.
   */
  checkDailyAlerts: (todaySales) => {
    const today = todayISO();
    const { celebratedDaily } = get();
    const counts = celebratedDaily.date === today ? celebratedDaily.counts : [];

    const crossed = DAILY_SALE_ALERTS.filter((a) => todaySales >= a.count && !counts.includes(a.count));
    if (crossed.length === 0) {
      if (celebratedDaily.date !== today) {
        const reset = { date: today, counts: [] };
        set({ celebratedDaily: reset });
        saveJSON(STORAGE_KEYS.celebratedDailyAlerts, reset);
      }
      return;
    }

    const updated = { date: today, counts: [...counts, ...crossed.map((a) => a.count)] };
    set({ celebratedDaily: updated, pendingDailyAlert: dailySaleAlertFor(todaySales) });
    saveJSON(STORAGE_KEYS.celebratedDailyAlerts, updated);
  },

  clearCelebration: () => set({ pendingCelebration: null }),
  clearDailyAlert: () => set({ pendingDailyAlert: null }),
}));
