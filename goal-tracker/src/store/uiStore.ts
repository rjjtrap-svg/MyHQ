import { create } from 'zustand';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/src/lib/storage';

interface UIState {
  celebratedMilestones: number[];
  hydrated: boolean;
  pendingCelebration: number | null;
  hydrate: () => Promise<void>;
  checkMilestones: (reachedMilestones: number[]) => void;
  clearCelebration: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  celebratedMilestones: [],
  hydrated: false,
  pendingCelebration: null,

  hydrate: async () => {
    const stored = (await loadJSON<number[]>(STORAGE_KEYS.celebratedMilestones)) ?? [];
    set({ celebratedMilestones: stored, hydrated: true });
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

  clearCelebration: () => set({ pendingCelebration: null }),
}));
