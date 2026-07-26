import { create } from 'zustand';
import { PitchSubmission } from '@/src/types';
import { subscribePitchSubmissions } from '@/src/firebase/pitchCoaching';

interface PitchCoachState {
  submissions: PitchSubmission[];
  subscribe: (teamId: string, repUid: string) => () => void;
}

export const usePitchCoachStore = create<PitchCoachState>((set) => ({
  submissions: [],

  subscribe: (teamId, repUid) => {
    set({ submissions: [] });
    return subscribePitchSubmissions(teamId, repUid, (submissions) => set({ submissions }));
  },
}));
