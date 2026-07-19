import { create } from 'zustand';
import { Settings } from '@/src/types';
import { firebaseEnabled } from '@/src/firebase/config';
import { pullRemoteSettings, pushSettings } from '@/src/firebase/sync';
import { createDefaultSettings } from '@/src/lib/defaults';
import { loadJSON, saveJSON, STORAGE_KEYS } from '@/src/lib/storage';

interface SettingsState {
  settings: Settings;
  hydrated: boolean;
  hydrate: () => Promise<void>;
  updateSettings: (partial: Partial<Settings>) => void;
}

export const useSettingsStore = create<SettingsState>((set, get) => ({
  settings: createDefaultSettings(),
  hydrated: false,

  hydrate: async () => {
    const stored = await loadJSON<Settings>(STORAGE_KEYS.settings);
    let settings = stored ?? createDefaultSettings();

    if (firebaseEnabled) {
      const remote = await pullRemoteSettings();
      if (remote && (!stored || new Date(remote.updatedAt) > new Date(stored.updatedAt))) {
        settings = remote;
      }
    }

    set({ settings, hydrated: true });
    await saveJSON(STORAGE_KEYS.settings, settings);
  },

  updateSettings: (partial) => {
    const settings: Settings = { ...get().settings, ...partial, updatedAt: new Date().toISOString() };
    set({ settings });
    saveJSON(STORAGE_KEYS.settings, settings);
    if (firebaseEnabled) {
      pushSettings(settings);
    }
  },
}));
