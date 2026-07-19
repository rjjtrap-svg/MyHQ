import AsyncStorage from '@react-native-async-storage/async-storage';

export async function loadJSON<T>(key: string): Promise<T | null> {
  try {
    const raw = await AsyncStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
}

export async function saveJSON(key: string, value: unknown): Promise<void> {
  try {
    await AsyncStorage.setItem(key, JSON.stringify(value));
  } catch {
    // Best-effort local persistence; in-memory state still works for this session.
  }
}

export const STORAGE_KEYS = {
  deals: '@goal-tracker/deals',
  settings: '@goal-tracker/settings',
  celebratedMilestones: '@goal-tracker/celebrated-milestones',
} as const;
