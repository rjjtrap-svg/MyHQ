import { useEffect, useMemo } from 'react';
import { useDealsStore } from '@/src/store/dealsStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useUIStore } from '@/src/store/uiStore';
import { useAuthStore } from '@/src/store/authStore';
import { computeGoalStats } from '@/src/lib/stats';

/** Personal dashboard stats: this rep's own deals against their own goal settings. */
export function useGoalStats() {
  const uid = useAuthStore((s) => s.firebaseUser?.uid);
  const allDeals = useDealsStore((s) => s.deals);
  const settings = useSettingsStore((s) => s.settings);
  const checkMilestones = useUIStore((s) => s.checkMilestones);
  const checkDailyAlerts = useUIStore((s) => s.checkDailyAlerts);

  const deals = useMemo(() => allDeals.filter((d) => d.repUid === uid), [allDeals, uid]);
  const stats = useMemo(() => computeGoalStats(deals, settings), [deals, settings]);

  useEffect(() => {
    checkMilestones(stats.reachedMilestones);
  }, [stats.reachedMilestones.join(','), checkMilestones]);

  useEffect(() => {
    checkDailyAlerts(stats.todaySales);
  }, [stats.todaySales, checkDailyAlerts]);

  return { deals, settings, stats };
}
