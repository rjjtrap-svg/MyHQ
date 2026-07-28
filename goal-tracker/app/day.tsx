import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button } from '@/src/components/Button';
import { DayStrip } from '@/src/components/DayStrip';
import { HeroPanel } from '@/src/components/HeroPanel';
import { PullQuote } from '@/src/components/PullQuote';
import { RollOut } from '@/src/components/day/RollOut';
import { getDoorTarget, hydrateDoorTarget, rememberDoorTarget } from '@/src/components/day/targetMemory';
import { WrapUp } from '@/src/components/day/WrapUp';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { parseISODate, startOfWeek } from '@/src/lib/dates';
import { callbacksDue, knocksOnDate, summariseStreets, territoryStats } from '@/src/lib/territory';
import { useAuthStore } from '@/src/store/authStore';
import { useKnocksStore } from '@/src/store/knocksStore';
import { currentWhy, useLockInNotesStore } from '@/src/store/lockInNotesStore';
import { useTeamStore } from '@/src/store/teamStore';
import { colors, layout, spacing } from '@/src/theme';

type DayMode = 'roll_out' | 'wrap_up';

function localISODate(): string {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`;
}

function defaultMode(): DayMode {
  return new Date().getHours() < 14 ? 'roll_out' : 'wrap_up';
}

export default function DayScreen() {
  const firebaseUser = useAuthStore((state) => state.firebaseUser);
  const profile = useAuthStore((state) => state.profile);
  const teamId = useTeamStore((state) => state.teamId) ?? profile?.teamId;
  const knocks = useKnocksStore((state) => state.knocks);
  const subscribeKnocks = useKnocksStore((state) => state.subscribe);
  const notes = useLockInNotesStore((state) => state.notes);
  const subscribeNotes = useLockInNotesStore((state) => state.subscribe);
  const createNote = useLockInNotesStore((state) => state.create);
  const { deals, stats } = useGoalStats();
  const todayISO = localISODate();
  const [mode, setMode] = useState<DayMode>(defaultMode);
  const [doorTarget, setDoorTarget] = useState<number | null>(() => getDoorTarget(todayISO));

  // The target survives a reload via AsyncStorage, which can't be read synchronously —
  // so the initial state is the module cache and this fills it in a tick later.
  useEffect(() => {
    let live = true;
    hydrateDoorTarget(todayISO).then((stored) => {
      if (live && stored !== null) setDoorTarget(stored);
    });
    return () => {
      live = false;
    };
  }, [todayISO]);

  useEffect(() => {
    if (!teamId) return;
    return subscribeKnocks(teamId);
  }, [subscribeKnocks, teamId]);

  useEffect(() => {
    if (!teamId || !firebaseUser?.uid) return;
    return subscribeNotes(teamId, firebaseUser.uid);
  }, [firebaseUser?.uid, subscribeNotes, teamId]);

  const mine = useMemo(
    () => knocks.filter((knock) => knock.repUid === firebaseUser?.uid),
    [firebaseUser?.uid, knocks]
  );
  const todayTerritory = useMemo(
    () => territoryStats(knocksOnDate(mine, todayISO)),
    [mine, todayISO]
  );
  const dueCallbacks = useMemo(() => callbacksDue(mine, todayISO), [mine, todayISO]);
  const why = useMemo(() => currentWhy(notes), [notes]);
  const tomorrowStreet = useMemo(() => {
    const streets = summariseStreets(mine);
    const first = streets.reduce<(typeof streets)[number] | undefined>(
      (best, street) => (!best || street.openCallbacks > best.openCallbacks ? street : best),
      undefined
    );
    return first && first.openCallbacks > 0 ? first.label : undefined;
  }, [mine]);

  // Seven counts, Monday first, to match startOfWeek. Cancelled and deleted deals are
  // excluded here for the same reason they're excluded from every other count in the app —
  // a fallen-through deal was never a sale.
  const weekStart = useMemo(() => startOfWeek(new Date()), []);
  const weekCounts = useMemo(() => {
    const counts = [0, 0, 0, 0, 0, 0, 0];
    for (const deal of deals) {
      if (deal.deletedAt || deal.stage === 'cancelled') continue;
      const offset = Math.floor(
        (parseISODate(deal.date).getTime() - weekStart.getTime()) / 86400000
      );
      if (offset >= 0 && offset < 7) counts[offset] += 1;
    }
    return counts;
  }, [deals, weekStart]);
  const todayIndex = Math.floor((new Date().setHours(0, 0, 0, 0) - weekStart.getTime()) / 86400000);
  const shortfall = Math.max(Math.ceil(stats.requiredPerDay) - stats.todaySales, 0);

  function chooseTarget(target: number) {
    rememberDoorTarget(todayISO, target);
    setDoorTarget(target);
  }

  async function saveReflection(body: string) {
    if (!teamId || !firebaseUser?.uid) throw new Error('Your profile is still loading. Try again in a moment.');
    await createNote({
      teamId,
      repUid: firebaseUser.uid,
      kind: 'journal',
      body,
      title: 'Day wrap-up',
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* The two halves of the day are now signalled by the surface itself — warm going
            out, cool coming back — rather than by two identical tabs. A rep opening this at
            7am and at 9pm should not be looking at the same screen. */}
        <HeroPanel
          tone={mode === 'roll_out' ? 'dawn' : 'dusk'}
          eyebrow={mode === 'roll_out' ? 'Roll out' : 'Wrap up'}
          title={
            mode === 'roll_out'
              ? shortfall > 0
                ? `${shortfall} to go`
                : "Today's number is done"
              : `${todayTerritory.sales} today`
          }
          detail={
            mode === 'roll_out'
              ? doorTarget
                ? `${doorTarget} doors is the plan.`
                : 'Set a door target and get out there.'
              : `${todayTerritory.knocks} doors, ${todayTerritory.contacts} conversations.`
          }
        >
          <View style={styles.heroCta}>
            <Button
              label={mode === 'roll_out' ? 'Wrap up instead' : 'Back to roll out'}
              onPress={() => setMode(mode === 'roll_out' ? 'wrap_up' : 'roll_out')}
              variant="hero"
              size="xl"
            />
          </View>
        </HeroPanel>

        <DayStrip counts={weekCounts} todayIndex={todayIndex} />

        {mode === 'roll_out' ? (
          <RollOut
            why={why?.body}
            requiredPerDay={stats.requiredPerDay}
            pace={stats.pace}
            paceDelta={stats.paceDelta}
            callbackCount={dueCallbacks.length}
            doorTarget={doorTarget}
            onDoorTargetChange={chooseTarget}
          />
        ) : (
          <WrapUp
            doors={todayTerritory.knocks}
            contacts={todayTerritory.contacts}
            sales={todayTerritory.sales}
            contactRate={todayTerritory.contactRate}
            closeRate={todayTerritory.closeRate}
            doorToSaleRate={todayTerritory.doorToSaleRate}
            doorTarget={doorTarget}
            tomorrowStreet={tomorrowStreet}
            onSaveReflection={saveReflection}
          />
        )}

        <PullQuote seed={`day-${todayISO}`} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  content: { width: '100%', maxWidth: layout.contentMaxWidth, alignSelf: 'center', padding: spacing.lg, paddingBottom: spacing.xxl },
  heroCta: { marginTop: spacing.lg },
});
