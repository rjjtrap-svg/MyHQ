import { create } from 'zustand';
import { KnockDisposition, KnockRecord } from '@/src/types';
import { generateId } from '@/src/lib/id';
import { streetKey } from '@/src/lib/territory';
import { deleteKnock, saveKnock, subscribeTeamKnocks } from '@/src/firebase/knocks';

export interface LogKnockInput {
  teamId: string;
  repUid: string;
  repName: string;
  address: string;
  disposition: KnockDisposition;
  /** ISO yyyy-mm-dd. Defaults to today. */
  date?: string;
  notes?: string;
  callbackDate?: string;
  dealId?: string;
}

interface KnocksState {
  /** Every knock on the team, newest first. */
  knocks: KnockRecord[];
  loading: boolean;
  subscribe: (teamId: string) => () => void;
  log: (input: LogKnockInput) => Promise<KnockRecord>;
  update: (knock: KnockRecord) => Promise<void>;
  remove: (teamId: string, knockId: string) => Promise<void>;
}

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export const useKnocksStore = create<KnocksState>((set) => ({
  knocks: [],
  loading: true,

  subscribe: (teamId) => {
    set({ knocks: [], loading: true });
    return subscribeTeamKnocks(teamId, (knocks) => {
      set({
        knocks: [...knocks].sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
        loading: false,
      });
    });
  },

  log: async (input) => {
    const now = new Date().toISOString();
    const address = input.address.trim();
    const knock: KnockRecord = {
      id: generateId(),
      teamId: input.teamId,
      repUid: input.repUid,
      repName: input.repName,
      date: input.date ?? today(),
      address,
      // Derived here rather than at the call site so every writer groups the same way.
      street: streetKey(address),
      disposition: input.disposition,
      // A callback date on a door that isn't a callback would quietly show up in the
      // "come back" list forever, so it's only carried through when it means something.
      ...(input.disposition === 'callback' && input.callbackDate
        ? { callbackDate: input.callbackDate }
        : {}),
      ...(input.notes ? { notes: input.notes } : {}),
      ...(input.dealId ? { dealId: input.dealId } : {}),
      createdAt: now,
      updatedAt: now,
    };
    await saveKnock(knock);
    return knock;
  },

  update: async (knock) => {
    await saveKnock({
      ...knock,
      street: streetKey(knock.address),
      updatedAt: new Date().toISOString(),
    });
  },

  remove: async (teamId, knockId) => {
    await deleteKnock(teamId, knockId);
  },
}));
