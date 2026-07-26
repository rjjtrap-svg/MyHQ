import { create } from 'zustand';
import { collection, doc, onSnapshot, orderBy, query, setDoc, updateDoc } from 'firebase/firestore';
import { Deal } from '@/src/types';
import { db } from '@/src/firebase/config';
import { generateId } from '@/src/lib/id';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/src/lib/storage';
import { todayISO } from '@/src/lib/dates';

export interface AddDealInput {
  date?: string;
  customerName?: string;
  address?: string;
  notes?: string;
  photoUrl?: string;
}

export interface DealDetailsInput {
  customerName?: string;
  address?: string;
  notes?: string;
  date?: string;
}

interface DealsState {
  deals: Deal[];
  teamId: string | null;
  loading: boolean;
  subscribe: (teamId: string) => () => void;
  addDeal: (repUid: string, repName: string, input: AddDealInput, id?: string) => Promise<Deal>;
  updateDealDetails: (dealId: string, input: DealDetailsInput) => Promise<void>;
}

export const useDealsStore = create<DealsState>((set, get) => ({
  deals: [],
  teamId: null,
  loading: true,

  subscribe: (teamId) => {
    set({ teamId, loading: true });

    // Instant paint from the last-synced cache while the live listener spins up.
    loadJSON<Deal[]>(STORAGE_KEYS.deals).then((cached) => {
      if (cached && get().teamId === teamId && get().loading) {
        set({ deals: cached });
      }
    });

    if (!db) {
      set({ loading: false });
      return () => {};
    }

    const dealsQuery = query(collection(db, 'teams', teamId, 'deals'), orderBy('createdAt', 'desc'));
    const unsubscribe = onSnapshot(
      dealsQuery,
      (snap) => {
        const deals = snap.docs.map((d) => d.data() as Deal);
        set({ deals, loading: false });
        saveJSON(STORAGE_KEYS.deals, deals);
      },
      () => set({ loading: false })
    );
    return unsubscribe;
  },

  addDeal: async (repUid, repName, input, id) => {
    const { teamId } = get();
    if (!teamId || !db) throw new Error('No team loaded.');

    const now = new Date().toISOString();
    const dealId = id ?? generateId();
    const deal: Deal = {
      id: dealId,
      date: input.date ?? todayISO(),
      createdAt: now,
      updatedAt: now,
      customerName: input.customerName?.trim() || undefined,
      address: input.address?.trim() || undefined,
      notes: input.notes?.trim() || undefined,
      synced: true,
      teamId,
      repUid,
      repName,
      photoUrl: input.photoUrl,
      ocrStatus: input.photoUrl ? 'pending' : 'none',
    };

    await setDoc(doc(db, 'teams', teamId, 'deals', dealId), deal);
    return deal;
  },

  updateDealDetails: async (dealId, input) => {
    const { teamId } = get();
    if (!teamId || !db) throw new Error('No team loaded.');
    await updateDoc(doc(db, 'teams', teamId, 'deals', dealId), {
      ...(input.customerName !== undefined ? { customerName: input.customerName.trim() || null } : {}),
      ...(input.address !== undefined ? { address: input.address.trim() || null } : {}),
      ...(input.notes !== undefined ? { notes: input.notes.trim() || null } : {}),
      ...(input.date !== undefined ? { date: input.date } : {}),
      updatedAt: new Date().toISOString(),
    });
  },
}));
