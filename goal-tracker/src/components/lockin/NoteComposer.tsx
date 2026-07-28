import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { NoteKind } from '@/src/types';
import { Button } from '@/src/components/Button';
import { Banner } from '@/src/components/Banner';
import { colors, radius, spacing, typography } from '@/src/theme';

/**
 * One composer for all three kinds of writing. The prompt above the field does the work of
 * telling you what this is for, so the field itself stays a plain sheet of paper — a
 * journal that looks like a form doesn't get written in.
 */
export function NoteComposer({
  kind,
  prompt,
  placeholder,
  initialBody = '',
  initialTitle = '',
  showTitle = false,
  showTargetDate = false,
  submitLabel,
  onSubmit,
  onCancel,
}: {
  kind: NoteKind;
  prompt?: string;
  placeholder: string;
  initialBody?: string;
  initialTitle?: string;
  showTitle?: boolean;
  showTargetDate?: boolean;
  submitLabel: string;
  onSubmit: (v: { body: string; title?: string; targetDate?: string }) => Promise<void>;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState(initialBody);
  const [title, setTitle] = useState(initialTitle);
  const [targetDate, setTargetDate] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function submit() {
    const trimmed = body.trim();
    if (!trimmed) {
      setError('Write something first.');
      return;
    }
    if (targetDate && !/^\d{4}-\d{2}-\d{2}$/.test(targetDate)) {
      setError('Target date needs to look like 2026-08-31.');
      return;
    }
    setError(null);
    setBusy(true);
    try {
      await onSubmit({
        body: trimmed,
        title: title.trim() || undefined,
        targetDate: targetDate || undefined,
      });
      setBody('');
      setTitle('');
      setTargetDate('');
    } catch (err: any) {
      setError(err?.message ?? "That didn't save. Try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <View style={styles.card}>
      {!!prompt && <Text style={styles.prompt}>{prompt}</Text>}

      {showTitle && (
        <TextInput
          style={styles.title}
          value={title}
          onChangeText={setTitle}
          placeholder={kind === 'goal' ? 'The goal, in a few words' : 'Title (optional)'}
          placeholderTextColor={colors.textFaint}
        />
      )}

      <TextInput
        style={styles.body}
        value={body}
        onChangeText={setBody}
        placeholder={placeholder}
        placeholderTextColor={colors.textFaint}
        multiline
        textAlignVertical="top"
      />

      {showTargetDate && (
        <View style={styles.dateRow}>
          <Text style={styles.dateLabel}>By when</Text>
          <TextInput
            style={styles.dateInput}
            value={targetDate}
            onChangeText={setTargetDate}
            placeholder="2026-08-31"
            placeholderTextColor={colors.textFaint}
            autoCapitalize="none"
          />
        </View>
      )}

      {!!error && <Banner message={error} />}

      <View style={styles.actions}>
        {!!onCancel && (
          <Button label="Cancel" variant="ghost" size="sm" onPress={onCancel} />
        )}
        <Button label={submitLabel} onPress={submit} busy={busy} style={styles.submit} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.xl,
  },
  prompt: {
    ...typography.quote,
    fontSize: 16,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  title: {
    ...typography.subtitle,
    color: colors.text,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.sm,
    marginBottom: spacing.sm,
  },
  body: {
    ...typography.body,
    color: colors.text,
    minHeight: 130,
    lineHeight: 24,
    paddingVertical: spacing.sm,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: colors.border,
    paddingTop: spacing.md,
    marginTop: spacing.sm,
  },
  dateLabel: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
    marginRight: spacing.md,
  },
  dateInput: {
    ...typography.body,
    color: colors.text,
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    marginTop: spacing.md,
  },
  submit: {
    marginLeft: spacing.sm,
  },
});
