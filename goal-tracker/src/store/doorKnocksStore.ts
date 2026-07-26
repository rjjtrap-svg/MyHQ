import { create } from 'zustand';
import { DoorKnockEntry } from '@/src/types';
import { setDoorKnockCount, subscribeRepDoorKnocks } from '@/src/firebase/doorKnocks';

interface DoorKnocksState {
  /** Keyed by ISO date (yyyy-mm-dd), for the signed-in rep only. */
  byDate: Record<string, number>;
  subscribe: (teamId: string, repUid: string) => () => void;
  setToday: (teamId: string, repUid: string, date: string, count: number) => Promise<void>;
}

export const useDoorKnocksStore = create<DoorKnocksState>((set) => ({
  byDate: {},

  subscribe: (teamId, repUid) => {
    set({ byDate: {} });
    return subscribeRepDoorKnocks(teamId, repUid, (entries: DoorKnockEntry[]) => {
      const byDate: Record<string, number> = {};
      for (const e of entries) byDate[e.date] = e.count;
      set({ byDate });
    });
  },

  setToday: async (teamId, repUid, date, count) => {
    await setDoorKnockCount(teamId, repUid, date, count);
  },
}));
