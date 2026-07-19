import { useEffect, useMemo } from 'react';
import { useDealsStore } from '@/src/store/dealsStore';
import { useSettingsStore } from '@/src/store/settingsStore';
import { useUIStore } from '@/src/store/uiStore';
import { computeGoalStats } from '@/src/lib/stats';

export function useGoalStats() {
  const deals = useDealsStore((s) => s.deals);
  const settings = useSettingsStore((s) => s.settings);
  const checkMilestones = useUIStore((s) => s.checkMilestones);

  const stats = useMemo(() => computeGoalStats(deals, settings), [deals, settings]);

  useEffect(() => {
    checkMilestones(stats.reachedMilestones);
  }, [stats.reachedMilestones.join(','), checkMilestones]);

  return { deals, settings, stats };
}
