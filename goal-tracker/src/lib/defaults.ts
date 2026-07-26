import { Settings } from '@/src/types';
import { addDays, toISODate } from './dates';
import { generateId } from './id';

const today = new Date();

export function createDefaultSettings(): Settings {
  const startDate = toISODate(today);
  const deadline = toISODate(addDays(today, 60));
  return {
    installGoal: 88,
    salesGoal: 118,
    retentionPercent: 75,
    startDate,
    deadline,
    dailyTarget: 2,
    notificationsEnabled: false,
    notificationTimes: [{ id: generateId(), hour: 9, minute: 0, enabled: true }],
    dealLogReminderEnabled: false,
    dealLogReminderHour: 20,
    dealLogReminderMinute: 0,
    updatedAt: new Date().toISOString(),
  };
}
