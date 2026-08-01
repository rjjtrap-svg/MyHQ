import { create } from 'zustand';
import { CoachChatMessage, CoachConversation } from '@/src/types';
import { subscribeCoachConversationMessages, subscribeCoachConversations } from '@/src/firebase/coachChat';

interface CoachChatState {
  conversations: CoachConversation[];
  /** Recent (last 30 days) conversation list, for the History view. */
  subscribe: (teamId: string, repUid: string) => () => void;

  /** `null` means a fresh conversation that hasn't sent its first message yet — no
   * subscription, empty thread, matching "open Coach and get a clean slate" by default. */
  activeConversationId: string | null;
  messages: CoachChatMessage[];
  /** Switches the active thread and (re)subscribes to its messages. Pass `null` to start a
   * new, empty conversation instead of opening an existing one. */
  openConversation: (teamId: string, repUid: string, conversationId: string | null) => void;
}

let messagesUnsub: (() => void) | null = null;

export const useCoachChatStore = create<CoachChatState>((set) => ({
  conversations: [],
  activeConversationId: null,
  messages: [],

  subscribe: (teamId, repUid) => {
    set({ conversations: [] });
    return subscribeCoachConversations(teamId, repUid, (conversations) => set({ conversations }));
  },

  openConversation: (teamId, repUid, conversationId) => {
    messagesUnsub?.();
    messagesUnsub = null;
    set({ activeConversationId: conversationId, messages: [] });
    if (!conversationId) return;
    messagesUnsub = subscribeCoachConversationMessages(teamId, repUid, conversationId, (messages) =>
      set({ messages })
    );
  },
}));
