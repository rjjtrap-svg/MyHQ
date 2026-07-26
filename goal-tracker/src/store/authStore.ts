import { create } from 'zustand';
import type { User } from 'firebase/auth';
import { UserProfile } from '@/src/types';
import { subscribeAuthState } from '@/src/firebase/auth';
import { fetchUserProfile } from '@/src/firebase/teams';

interface AuthState {
  initialized: boolean;
  firebaseUser: User | null;
  profile: UserProfile | null;
  init: () => () => void;
  setProfile: (profile: UserProfile | null) => void;
  refreshProfile: () => Promise<void>;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  initialized: false,
  firebaseUser: null,
  profile: null,

  init: () => {
    return subscribeAuthState(async (user) => {
      if (!user) {
        set({ firebaseUser: null, profile: null, initialized: true });
        return;
      }
      const profile = await fetchUserProfile(user.uid);
      set({ firebaseUser: user, profile, initialized: true });
    });
  },

  setProfile: (profile) => set({ profile }),

  refreshProfile: async () => {
    const uid = get().firebaseUser?.uid;
    if (!uid) return;
    const profile = await fetchUserProfile(uid);
    set({ profile });
  },
}));
