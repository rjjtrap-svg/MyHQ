import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LockInNote } from '@/src/types';
import { Section } from '@/src/components/Section';
import { NoteComposer } from './NoteComposer';
import { colors, radius, spacing, typography } from '@/src/theme';

const DAY = 86400000;

/** Days until a target date. Negative means it's gone by. */
function daysOut(target: string): number {
  const t = new Date(`${target}T00:00:00`).getTime();
  const today = new Date();
  const midnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime();
  return Math.round((t - midnight) / DAY);
}

function dueLabel(target?: string): { text: string; overdue: boolean } | null {
  if (!target) return null;
  const d = daysOut(target);
  if (d < 0) return { text: `${Math.abs(d)}d over`, overdue: true };
  if (d === 0) return { text: 'Today', overdue: false };
  if (d === 1) return { text: 'Tomorrow', overdue: false };
  return { text: `${d}d left`, overdue: false };
}

export function GoalsView({
  notes,
  onCreate,
  onToggleDone,
}: {
  notes: LockInNote[];
  onCreate: (v: { body: string; title?: string; targetDate?: string }) => Promise<void>;
  onToggleDone: (note: LockInNote) => Promise<void>;
}) {
  const [busyId, setBusyId] = useState<string | null>(null);

  const goals = useMemo(() => notes.filter((n) => n.kind === 'goal'), [notes]);
  const open = goals.filter((g) => !g.completedAt);
  const done = goals.filter((g) => !!g.completedAt);

  async function toggle(note: LockInNote) {
    setBusyId(note.id);
    try {
      await onToggleDone(note);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <>
      <NoteComposer
        kind="goal"
        placeholder="What hitting it actually looks like, and what changes when you do."
        showTitle
        showTargetDate
        submitLabel="Add goal"
        onSubmit={onCreate}
      />

      {/* One number, and only one. The count of what's done is the only stat this view
          needs — everything else is the goals themselves. */}
      {goals.length > 0 && (
        <View style={styles.tally}>
          <Text style={styles.tallyValue}>{done.length}</Text>
          <Text style={styles.tallyLabel}>
            {done.length === 1 ? 'goal met' : 'goals met'} of {goals.length}
          </Text>
        </View>
      )}

      {open.length === 0 && done.length === 0 ? (
        <Text style={styles.empty}>
          No goals yet. Write one you could be wrong about — a goal you can't fail isn't a
          goal.
        </Text>
      ) : null}

      {open.length > 0 && (
        <Section title="Working on">
          {open.map((g) => {
            const due = dueLabel(g.targetDate);
            return (
              <Pressable
                key={g.id}
                style={styles.goal}
                onPress={() => toggle(g)}
                disabled={busyId === g.id}
              >
                <View style={styles.checkRow}>
                  <View style={styles.check} />
                  <View style={styles.goalText}>
                    {!!g.title && <Text style={styles.goalTitle}>{g.title}</Text>}
                    <Text style={styles.goalBody}>{g.body}</Text>
                  </View>
                  {!!due && (
                    <Text style={[styles.due, due.overdue && styles.dueOverdue]}>{due.text}</Text>
                  )}
                </View>
              </Pressable>
            );
          })}
        </Section>
      )}

      {done.length > 0 && (
        <Section title="Met">
          {done.map((g) => (
            <Pressable
              key={g.id}
              style={[styles.goal, styles.goalDone]}
              onPress={() => toggle(g)}
              disabled={busyId === g.id}
            >
              <View style={styles.checkRow}>
                <View style={[styles.check, styles.checkDone]} />
                <View style={styles.goalText}>
                  {!!g.title && <Text style={styles.goalTitleDone}>{g.title}</Text>}
                  <Text style={styles.goalBodyDone}>{g.body}</Text>
                </View>
              </View>
            </Pressable>
          ))}
        </Section>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  tally: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: spacing.xl,
  },
  tallyValue: {
    ...typography.scoreValue,
    color: colors.text,
  },
  tallyLabel: {
    ...typography.eyebrow,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  empty: {
    ...typography.quote,
    fontSize: 16,
    color: colors.textFaint,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  goal: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  goalDone: {
    backgroundColor: 'transparent',
    borderColor: colors.border,
  },
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  check: {
    width: 18,
    height: 18,
    borderRadius: radius.round,
    borderWidth: 2,
    borderColor: colors.accent,
    marginRight: spacing.md,
    marginTop: 2,
  },
  checkDone: {
    backgroundColor: colors.success,
    borderColor: colors.success,
  },
  goalText: {
    flex: 1,
  },
  goalTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  goalTitleDone: {
    ...typography.subtitle,
    color: colors.textFaint,
    textDecorationLine: 'line-through',
  },
  goalBody: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
    marginTop: 2,
  },
  goalBodyDone: {
    ...typography.body,
    color: colors.textFaint,
    lineHeight: 22,
    marginTop: 2,
  },
  due: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textMuted,
    marginLeft: spacing.sm,
  },
  dueOverdue: {
    color: colors.dangerText,
  },
});
