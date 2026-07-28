import React, { useMemo, useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { LockInNote } from '@/src/types';
import { Section } from '@/src/components/Section';
import { confirmAction } from '@/src/lib/dialogs';
import { NoteComposer } from './NoteComposer';
import { colors, radius, spacing, typography } from '@/src/theme';

function dayLabel(iso: string): string {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date(today.getTime() - 86400000);
  const same = (a: Date, b: Date) => a.toDateString() === b.toDateString();
  if (same(d, today)) return 'Today';
  if (same(d, yesterday)) return 'Yesterday';
  return d.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric' });
}

export function JournalView({
  notes,
  prompt,
  onCreate,
  onDelete,
  onClearPrompt,
}: {
  notes: LockInNote[];
  /** Set when the rep opened an exercise — seeds the composer with its prompt. */
  prompt?: { exerciseId: string; text: string };
  onCreate: (v: { body: string; title?: string; exerciseId?: string }) => Promise<void>;
  onDelete: (noteId: string) => Promise<void>;
  onClearPrompt: () => void;
}) {
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const entries = useMemo(
    () => notes.filter((n) => n.kind === 'journal'),
    [notes]
  );

  const grouped = useMemo(() => {
    const map = new Map<string, LockInNote[]>();
    for (const n of entries) {
      const key = dayLabel(n.createdAt);
      const list = map.get(key);
      if (list) list.push(n);
      else map.set(key, [n]);
    }
    return [...map.entries()];
  }, [entries]);

  async function remove(id: string) {
    if (!(await confirmAction('Delete entry', 'Delete this entry? It cannot be recovered.', 'Delete'))) return;
    setDeletingId(id);
    try {
      await onDelete(id);
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <>
      <NoteComposer
        kind="journal"
        prompt={prompt?.text}
        placeholder="What happened out there today."
        submitLabel="Save entry"
        onCancel={prompt ? onClearPrompt : undefined}
        onSubmit={async ({ body, title }) => {
          await onCreate({ body, title, exerciseId: prompt?.exerciseId });
          onClearPrompt();
        }}
      />

      {entries.length === 0 ? (
        <Text style={styles.empty}>
          Nothing written yet. The days worth remembering are rarely the ones you think
          you'll remember.
        </Text>
      ) : (
        grouped.map(([day, dayNotes]) => (
          <Section key={day} title={day}>
            {dayNotes.map((n) => (
              <View key={n.id} style={styles.entry}>
                {!!n.title && <Text style={styles.entryTitle}>{n.title}</Text>}
                <Text style={styles.entryBody}>{n.body}</Text>
                <Pressable
                  onPress={() => remove(n.id)}
                  disabled={deletingId === n.id}
                  hitSlop={8}
                >
                  <Text style={styles.delete}>
                    {deletingId === n.id ? 'Deleting…' : 'Delete'}
                  </Text>
                </Pressable>
              </View>
            ))}
          </Section>
        ))
      )}
    </>
  );
}

const styles = StyleSheet.create({
  empty: {
    ...typography.quote,
    fontSize: 16,
    color: colors.textFaint,
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  entry: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  entryTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  entryBody: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 24,
  },
  delete: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textFaint,
    marginTop: spacing.md,
  },
});
