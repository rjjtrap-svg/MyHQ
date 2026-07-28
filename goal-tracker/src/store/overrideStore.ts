import { create } from 'zustand';
import { CommissionOverride } from '@/src/types';
import { setCommissionOverride, subscribeOverrides } from '@/src/firebase/overrides';

interface OverrideState {
  /** Keyed by dealId. */
  byDealId: Record<string, CommissionOverride>;
  subscribe: (teamId: string, repUids: string[] | 'all') => () => void;
  setOverride: (teamId: string, dealId: string, repUid: string, amount: number, setByUid: string) => Promise<void>;
}

export const useOverrideStore = create<OverrideState>((set) => ({
  byDealId: {},

  subscribe: (teamId, repUids) => {
    set({ byDealId: {} });
    return subscribeOverrides(teamId, repUids, (overrides) => {
      const byDealId: Record<string, CommissionOverride> = {};
      for (const o of overrides) byDealId[o.dealId] = o;
      set({ byDealId });
    });
  },

  setOverride: async (teamId, dealId, repUid, amount, setByUid) => {
    await setCommissionOverride(teamId, dealId, repUid, amount, setByUid);
  },
}));
