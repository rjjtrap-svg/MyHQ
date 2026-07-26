import { create } from 'zustand';
import { Commission } from '@/src/types';
import { setCommission as setCommissionApi, subscribeCommissions } from '@/src/firebase/commissions';

interface CommissionState {
  /** Keyed by dealId. */
  byDealId: Record<string, Commission>;
  subscribe: (teamId: string, uid: string, isManager: boolean) => () => void;
  setCommission: (teamId: string, dealId: string, repUid: string, amount: number) => Promise<void>;
}

export const useCommissionStore = create<CommissionState>((set) => ({
  byDealId: {},

  subscribe: (teamId, uid, isManager) => {
    set({ byDealId: {} });
    return subscribeCommissions(teamId, uid, isManager, (commissions) => {
      const byDealId: Record<string, Commission> = {};
      for (const c of commissions) byDealId[c.dealId] = c;
      set({ byDealId });
    });
  },

  setCommission: async (teamId, dealId, repUid, amount) => {
    await setCommissionApi(teamId, dealId, repUid, amount);
  },
}));
