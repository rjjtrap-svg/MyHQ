import { create } from 'zustand';
import { Deal } from '@/src/types';
import { firebaseEnabled } from '@/src/firebase/config';
import { pullRemoteDeals, pushDeal, pushDealDelete } from '@/src/firebase/sync';
import { generateId } from '@/src/lib/id';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/src/lib/storage';
import { todayISO } from '@/src/lib/dates';

export interface AddDealInput {
  date?: string;
  customerName?: string;
  address?: string;
  notes?: string;
}

interface DealsState {
  deals: Deal[];
  hydrated: boolean;
  hydrate: () => Promise<void>;
  addDeal: (input?: AddDealInput) => Deal;
  removeDeal: (id: string) => void;
  retrySync: () => Promise<void>;
}

function mergeDeals(local: Deal[], remote: Deal[]): Deal[] {
  const byId = new Map<string, Deal>();
  for (const deal of local) byId.set(deal.id, deal);
  for (const remoteDeal of remote) {
    const existing = byId.get(remoteDeal.id);
    if (!existing || new Date(remoteDeal.updatedAt) > new Date(existing.updatedAt)) {
      byId.set(remoteDeal.id, { ...remoteDeal, synced: true });
    }
  }
  return Array.from(byId.values()).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}

export const useDealsStore = create<DealsState>((set, get) => ({
  deals: [],
  hydrated: false,

  hydrate: async () => {
    const stored = (await loadJSON<Deal[]>(STORAGE_KEYS.deals)) ?? [];
    set({ deals: stored, hydrated: true });

    if (firebaseEnabled) {
      const remote = await pullRemoteDeals();
      if (remote) {
        const merged = mergeDeals(get().deals, remote);
        set({ deals: merged });
        await saveJSON(STORAGE_KEYS.deals, merged);
      }
      await get().retrySync();
    }
  },

  addDeal: (input) => {
    const now = new Date().toISOString();
    const deal: Deal = {
      id: generateId(),
      date: input?.date ?? todayISO(),
      createdAt: now,
      updatedAt: now,
      customerName: input?.customerName?.trim() || undefined,
      address: input?.address?.trim() || undefined,
      notes: input?.notes?.trim() || undefined,
      synced: !firebaseEnabled,
    };

    const deals = [deal, ...get().deals];
    set({ deals });
    saveJSON(STORAGE_KEYS.deals, deals);

    if (firebaseEnabled) {
      pushDeal(deal).then((ok) => {
        if (!ok) return;
        const current = get().deals;
        const updated = current.map((d) => (d.id === deal.id ? { ...d, synced: true } : d));
        set({ deals: updated });
        saveJSON(STORAGE_KEYS.deals, updated);
      });
    }

    return deal;
  },

  removeDeal: (id) => {
    const now = new Date().toISOString();
    const deals = get().deals.map((d) =>
      d.id === id ? { ...d, deletedAt: now, updatedAt: now, synced: !firebaseEnabled } : d
    );
    set({ deals });
    saveJSON(STORAGE_KEYS.deals, deals);

    if (firebaseEnabled) {
      pushDealDelete(id);
    }
  },

  retrySync: async () => {
    if (!firebaseEnabled) return;
    const unsynced = get().deals.filter((d) => !d.synced);
    for (const deal of unsynced) {
      const ok = deal.deletedAt ? await pushDealDelete(deal.id) : await pushDeal(deal);
      if (ok) {
        const current = get().deals;
        const updated = current.map((d) => (d.id === deal.id ? { ...d, synced: true } : d));
        set({ deals: updated });
        saveJSON(STORAGE_KEYS.deals, updated);
      }
    }
  },
}));
