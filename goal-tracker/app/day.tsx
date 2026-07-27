import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { SegmentedToggle } from '@/src/components/Button';
import { PullQuote } from '@/src/components/PullQuote';
import { RollOut } from '@/src/components/day/RollOut';
import { getDoorTarget, hydrateDoorTarget, rememberDoorTarget } from '@/src/components/day/targetMemory';
import { WrapUp } from '@/src/components/day/WrapUp';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { useGoalStats } from '@/src/hooks/useGoalStats';
import { callbacksDue, knocksOnDate, summariseStreets, territoryStats } from '@/src/lib/territory';
import { useAuthStore } from '@/src/store/authStore';
import { useKnocksStore } from '@/src/store/knocksStore';
import { currentWhy, useLockInNotesStore } from '@/src/store/lockInNotesStore';
import { useTeamStore } from '@/src/store/teamStore';
import { colors, spacing } from '@/src/theme';

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
  const { stats } = useGoalStats();
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
        <ScreenHeader
          eyebrow="The day"
          title={mode === 'roll_out' ? 'Roll Out' : 'Wrap Up'}
        />

        {/* Below the header, not in its `right` slot: that slot replaces the brand
            emblem and is sized for a 44px mark, so a two-option toggle squeezed the
            title on narrow phones. */}
        <View style={styles.modeRow}>
          <SegmentedToggle
            options={[
              { key: 'roll_out', label: 'Roll Out' },
              { key: 'wrap_up', label: 'Wrap Up' },
            ]}
            value={mode}
            onChange={setMode}
            stretch
          />
        </View>

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
  content: { padding: spacing.lg, paddingBottom: spacing.xxl },
  modeRow: { marginBottom: spacing.xl },
});
