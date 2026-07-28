import { create } from 'zustand';
import { RepOverrideRate } from '@/src/types';
import {
  removeOverrideRate,
  setOverrideRate,
  subscribeOverrideRates,
} from '@/src/firebase/overrideRates';

export interface SaveRateInput {
  teamId: string;
  leaderUid: string;
  leaderName: string;
  repUid: string;
  repName: string;
  amountPerDeal: number;
  effectiveFrom?: string;
  setByUid: string;
}

interface OverrideRateState {
  rates: RepOverrideRate[];
  loading: boolean;
  subscribe: (teamId: string, leaderUid: string | 'all') => () => void;
  save: (input: SaveRateInput) => Promise<void>;
  remove: (teamId: string, leaderUid: string, repUid: string) => Promise<void>;
}

export const useOverrideRateStore = create<OverrideRateState>((set) => ({
  rates: [],
  loading: true,

  subscribe: (teamId, leaderUid) => {
    set({ rates: [], loading: true });
    return subscribeOverrideRates(teamId, leaderUid, (rates) => set({ rates, loading: false }));
  },

  save: async (input) => {
    await setOverrideRate({
      teamId: input.teamId,
      leaderUid: input.leaderUid,
      leaderName: input.leaderName,
      repUid: input.repUid,
      repName: input.repName,
      amountPerDeal: input.amountPerDeal,
      // Firestore rejects undefined, and an absent effectiveFrom is meaningful here —
      // it's what makes a rate cover the rep's whole history — so the key is omitted
      // rather than written as undefined.
      ...(input.effectiveFrom ? { effectiveFrom: input.effectiveFrom } : {}),
      setByUid: input.setByUid,
      updatedAt: new Date().toISOString(),
    });
  },

  remove: async (teamId, leaderUid, repUid) => {
    await removeOverrideRate(teamId, leaderUid, repUid);
  },
}));
