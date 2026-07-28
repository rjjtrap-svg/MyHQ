import React, { useEffect, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { KNOCK_DISPOSITION_LABELS, KnockDisposition, KnockRecord } from '@/src/types';
import {
  callbacksDue,
  doNotKnockSet,
  knocksOnDate,
  summariseStreets,
  territoryStats,
} from '@/src/lib/territory';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { useKnocksStore } from '@/src/store/knocksStore';
import { KnockLogger } from '@/src/components/territory/KnockLogger';
import { ScreenHeader } from '@/src/components/ScreenHeader';
import { Section } from '@/src/components/Section';
import { StatTile } from '@/src/components/StatTile';
import { Banner } from '@/src/components/Banner';
import { Button } from '@/src/components/Button';
import { colors, radius, spacing, typography } from '@/src/theme';

const BAR_COLOR: Record<KnockDisposition, string> = {
  not_home: colors.knockNotHome,
  not_interested: colors.knockNotInterested,
  callback: colors.knockCallback,
  sold: colors.knockSold,
  do_not_knock: colors.knockDoNotKnock,
};

const ORDER: KnockDisposition[] = ['sold', 'callback', 'not_interested', 'not_home', 'do_not_knock'];

function pct(fraction: number): string {
  return `${Math.round(fraction * 100)}%`;
}

function todayISO(): string {
  return new Date().toISOString().slice(0, 10);
}

function lastWorked(iso: string): string {
  if (!iso) return '';
  const days = Math.round(
    (new Date(todayISO()).getTime() - new Date(iso).getTime()) / 86400000
  );
  if (days <= 0) return 'today';
  if (days === 1) return 'yesterday';
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return `${Math.floor(days / 30)}mo ago`;
}

/**
 * A street's shape at a glance. Proportional segments rather than five numbers — the
 * question a rep is actually asking is "how much of this street is left", and a bar
 * answers that in less time than reading a row of counts.
 */
function StreetBar({ counts, total }: { counts: Record<KnockDisposition, number>; total: number }) {
  return (
    <View style={styles.bar}>
      {ORDER.map((d) => {
        const n = counts[d];
        if (!n) return null;
        return (
          <View
            key={d}
            style={{ flex: n / total, backgroundColor: BAR_COLOR[d] }}
          />
        );
      })}
    </View>
  );
}

export default function TerritoryScreen() {
  const router = useRouter();
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const profile = useAuthStore((s) => s.profile);
  const teamId = useTeamStore((s) => s.teamId);

  const knocks = useKnocksStore((s) => s.knocks);
  const subscribe = useKnocksStore((s) => s.subscribe);
  const log = useKnocksStore((s) => s.log);

  const [prefill, setPrefill] = useState('');

  useEffect(() => {
    if (!teamId) return;
    return subscribe(teamId);
  }, [teamId, subscribe]);

  // Mine for the day's numbers — a shared contact rate would be meaningless. The street
  // view stays team-wide, because that's the whole point of logging a door.
  const mine = useMemo(
    () => knocks.filter((k) => k.repUid === firebaseUser?.uid),
    [knocks, firebaseUser?.uid]
  );
  const today = useMemo(() => knocksOnDate(mine, todayISO()), [mine]);
  const stats = useMemo(() => territoryStats(today), [today]);
  const due = useMemo(() => callbacksDue(mine, todayISO()), [mine]);
  const streets = useMemo(() => summariseStreets(knocks), [knocks]);
  const flagged = useMemo(() => doNotKnockSet(knocks), [knocks]);

  if (!teamId || !firebaseUser) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.content}>
          <Banner message="Sign in to your team to work a territory." tone="info" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <ScreenHeader
          eyebrow="The street"
          title="Territory"
          subtitle="Every door, so you know what's left."
          right={<Button label="Done" variant="ghost" size="sm" onPress={() => router.back()} />}
        />

        <KnockLogger
          initialAddress={prefill}
          key={prefill}
          doNotKnock={flagged}
          onLog={async ({ address, disposition, notes, callbackDate }) => {
            await log({
              teamId,
              repUid: firebaseUser.uid,
              repName: profile?.displayName ?? 'Unknown rep',
              address,
              disposition,
              notes,
              callbackDate,
            });
            setPrefill('');
          }}
        />

        <Section title="Today">
          <View style={styles.tiles}>
            <StatTile label="Doors" value={String(stats.knocks)} />
            <StatTile label="Contacts" value={String(stats.contacts)} />
            <StatTile
              label="Contact rate"
              value={pct(stats.contactRate)}
              sublabel="Doors that opened"
            />
            <StatTile
              label="Close rate"
              value={pct(stats.closeRate)}
              sublabel="Of doors that opened"
              accent={colors.knockSold}
            />
          </View>
        </Section>

        <Section title="Come back">
          {due.length === 0 ? (
            <Text style={styles.empty}>Nothing owed a return visit. Go find some.</Text>
          ) : (
            due.map((k) => <CallbackRow key={k.id} knock={k} onPress={() => setPrefill(k.address)} />)
          )}
        </Section>

        <Section title="Streets">
          {streets.length === 0 ? (
            <Text style={styles.empty}>
              No doors logged yet. The first one you log is the first one you stop
              re-knocking by accident.
            </Text>
          ) : (
            streets.map((s) => (
              <View key={s.street} style={styles.street}>
                <View style={styles.streetHead}>
                  <Text style={styles.streetLabel}>{s.label}</Text>
                  <Text style={styles.streetMeta}>{lastWorked(s.lastKnockedAt)}</Text>
                </View>
                <StreetBar counts={s.byDisposition} total={s.total} />
                <View style={styles.streetFoot}>
                  <Text style={styles.streetCount}>
                    {s.total} {s.total === 1 ? 'door' : 'doors'}
                  </Text>
                  {s.byDisposition.sold > 0 && (
                    <Text style={[styles.streetTag, { color: colors.knockSold }]}>
                      {s.byDisposition.sold} sold
                    </Text>
                  )}
                  {s.openCallbacks > 0 && (
                    <Text style={[styles.streetTag, { color: colors.knockCallback }]}>
                      {s.openCallbacks} to revisit
                    </Text>
                  )}
                </View>
              </View>
            ))
          )}
        </Section>
      </ScrollView>
    </SafeAreaView>
  );
}

function CallbackRow({ knock, onPress }: { knock: KnockRecord; onPress: () => void }) {
  const overdueDays = Math.round(
    (new Date(todayISO()).getTime() - new Date(knock.callbackDate ?? todayISO()).getTime()) / 86400000
  );
  return (
    <Pressable style={styles.callback} onPress={onPress}>
      <View style={styles.callbackText}>
        <Text style={styles.callbackAddress}>{knock.address}</Text>
        {!!knock.notes && (
          <Text style={styles.callbackNotes} numberOfLines={2}>
            {knock.notes}
          </Text>
        )}
      </View>
      <Text style={[styles.callbackDue, overdueDays > 0 && styles.callbackOverdue]}>
        {overdueDays > 0 ? `${overdueDays}d over` : 'today'}
      </Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  tiles: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  empty: {
    ...typography.quote,
    fontSize: 16,
    color: colors.textFaint,
    paddingVertical: spacing.lg,
  },
  callback: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderLeftWidth: 3,
    borderLeftColor: colors.knockCallback,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  callbackText: {
    flex: 1,
  },
  callbackAddress: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  callbackNotes: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: 2,
  },
  callbackDue: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
    marginLeft: spacing.md,
  },
  callbackOverdue: {
    color: colors.dangerText,
  },
  street: {
    marginBottom: spacing.lg,
  },
  streetHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  streetLabel: {
    ...typography.subtitle,
    color: colors.text,
    flex: 1,
  },
  streetMeta: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textFaint,
  },
  bar: {
    flexDirection: 'row',
    height: 6,
    borderRadius: radius.round,
    overflow: 'hidden',
    backgroundColor: colors.track,
  },
  streetFoot: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: spacing.sm,
    gap: spacing.md,
  },
  streetCount: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textMuted,
  },
  streetTag: {
    ...typography.eyebrow,
    fontSize: 9,
  },
});
