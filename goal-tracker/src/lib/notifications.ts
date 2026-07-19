import { Platform } from 'react-native';
import * as Notifications from 'expo-notifications';
import { Deal, Settings } from '@/src/types';
import { computeGoalStats } from './stats';

const CATEGORY = 'goal-tracker-daily-reminder';

if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
      shouldShowBanner: true,
      shouldShowList: true,
    }),
  });
}

export async function requestNotificationPermissions(): Promise<boolean> {
  if (Platform.OS === 'web') return false;
  const existing = await Notifications.getPermissionsAsync();
  if (existing.granted) return true;
  const result = await Notifications.requestPermissionsAsync();
  return result.granted;
}

export function buildReminderMessage(deals: Deal[], settings: Settings): string {
  const stats = computeGoalStats(deals, settings);

  if (stats.salesRemaining <= 0) {
    return "Goal reached! You've hit your sales target — keep the streak going.";
  }
  if (stats.salesRemaining <= 20) {
    return `Only ${stats.salesRemaining} sale${stats.salesRemaining === 1 ? '' : 's'} left to hit your goal.`;
  }
  if (stats.pace === 'ahead') {
    return `You're ahead of schedule. ${stats.salesRemaining} sales to go — nice work.`;
  }
  const needed = Math.max(1, Math.ceil(stats.requiredPerDay - stats.todaySales));
  return `You need ${needed} more sale${needed === 1 ? '' : 's'} today to stay on pace.`;
}

async function ensureAndroidChannel() {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CATEGORY, {
    name: 'Daily goal reminders',
    importance: Notifications.AndroidImportance.DEFAULT,
  });
}

/**
 * Re-schedules every enabled reminder time with a freshly computed message.
 * Called on app foreground and whenever deals/settings change, since Expo's
 * local scheduler can't compute content dynamically at fire time.
 */
export async function syncDailyReminder(settings: Settings, deals: Deal[] = []): Promise<void> {
  // Local scheduled notifications aren't supported on web at all.
  if (Platform.OS === 'web') return;

  await Notifications.cancelAllScheduledNotificationsAsync();

  if (!settings.notificationsEnabled) return;

  const granted = await requestNotificationPermissions();
  if (!granted) return;

  await ensureAndroidChannel();

  const body = buildReminderMessage(deals, settings);
  const enabledTimes = settings.notificationTimes.filter((t) => t.enabled);

  for (const time of enabledTimes) {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: 'Goal Tracker',
        body,
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DAILY,
        hour: time.hour,
        minute: time.minute,
        channelId: Platform.OS === 'android' ? CATEGORY : undefined,
      },
    });
  }
}
