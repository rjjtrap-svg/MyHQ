import { create } from 'zustand';
import { CoachChatMessage } from '@/src/types';
import { subscribeCoachChat } from '@/src/firebase/coachChat';

interface CoachChatState {
  messages: CoachChatMessage[];
  subscribe: (teamId: string, repUid: string) => () => void;
}

export const useCoachChatStore = create<CoachChatState>((set) => ({
  messages: [],

  subscribe: (teamId, repUid) => {
    set({ messages: [] });
    return subscribeCoachChat(teamId, repUid, (messages) => set({ messages }));
  },
}));
