import React, { useState } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { Banner } from '@/src/components/Banner';
import { Button } from '@/src/components/Button';
import { Section } from '@/src/components/Section';
import { StatTile } from '@/src/components/StatTile';
import { colors, radius, spacing, typography } from '@/src/theme';

function percent(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}

export function WrapUp({
  doors,
  contacts,
  sales,
  contactRate,
  closeRate,
  doorToSaleRate,
  doorTarget,
  tomorrowStreet,
  onSaveReflection,
}: {
  doors: number;
  contacts: number;
  sales: number;
  contactRate: number;
  closeRate: number;
  doorToSaleRate: number;
  doorTarget: number | null;
  tomorrowStreet?: string;
  onSaveReflection: (body: string) => Promise<void>;
}) {
  const [reflection, setReflection] = useState('');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function save() {
    const body = reflection.trim();
    if (!body) return;
    setSaving(true);
    setMessage('');
    setError('');
    try {
      await onSaveReflection(body);
      setReflection('');
      setMessage('Day closed. Your reflection is in Lock In.');
    } catch (caught) {
      setError(caught instanceof Error ? caught.message : 'Could not save the reflection. Try again.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <Section title="On the board">
        {/* Six, not five. StatTile is flexBasis 48% so it wraps two to a row — an odd
            count leaves the last tile stranded half-width against the left edge. */}
        <View style={styles.stats}>
          <StatTile label="Doors" value={String(doors)} />
          <StatTile label="Contacts" value={String(contacts)} />
          <StatTile label="Sales" value={String(sales)} accent={colors.knockSold} />
          <StatTile label="Contact rate" value={percent(contactRate)} sublabel="Doors that opened" />
          <StatTile label="Close rate" value={percent(closeRate)} sublabel="Of doors that opened" />
          <StatTile label="Door to sale" value={percent(doorToSaleRate)} sublabel="Of every door" />
        </View>
      </Section>

      {doorTarget !== null ? (
        <Section title="Target vs actual">
          <View style={styles.targetCard}>
            <View style={styles.targetSide}>
              <Text style={styles.targetValue}>{doorTarget}</Text>
              <Text style={styles.label}>Target</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.targetSide}>
              <Text style={styles.targetValue}>{doors}</Text>
              <Text style={styles.label}>Actual</Text>
            </View>
          </View>
        </Section>
      ) : null}

      <Section title="Close the day">
        <Text style={styles.invitation}>What do you want to remember when tomorrow starts?</Text>
        <TextInput
          multiline
          value={reflection}
          onChangeText={setReflection}
          placeholder="One honest line is enough."
          placeholderTextColor={colors.textFaint}
          style={styles.input}
          textAlignVertical="top"
        />
        {message ? <Banner message={message} tone="info" align="left" /> : null}
        {error ? <Banner message={error} tone="error" align="left" /> : null}
        <Button
          label="Save reflection"
          onPress={save}
          busy={saving}
          disabled={!reflection.trim()}
          size="lg"
        />
      </Section>

      <Section title="First street tomorrow">
        <View style={styles.tomorrowCard}>
          <Text style={styles.tomorrowStreet}>{tomorrowStreet || 'Start fresh where the street gives you energy.'}</Text>
          <Text style={styles.tomorrowLabel}>{tomorrowStreet ? 'Most open come backs' : 'Choose it at roll out'}</Text>
        </View>
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  stats: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between' },
  targetCard: {
    flexDirection: 'row',
    alignItems: 'stretch',
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.lg,
    backgroundColor: colors.surface,
    paddingVertical: spacing.md,
  },
  targetSide: { flex: 1, alignItems: 'center', gap: spacing.xs },
  targetValue: { ...typography.scoreValue, color: colors.text },
  label: { ...typography.eyebrow, color: colors.textMuted },
  divider: { width: 1, backgroundColor: colors.border },
  invitation: { ...typography.body, color: colors.textMuted, marginBottom: spacing.md },
  input: {
    ...typography.body,
    minHeight: 112,
    marginBottom: spacing.md,
    padding: spacing.md,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.md,
    backgroundColor: colors.surface,
    color: colors.text,
  },
  tomorrowCard: {
    borderLeftWidth: 3,
    borderLeftColor: colors.gold,
    paddingVertical: spacing.sm,
    paddingLeft: spacing.md,
  },
  tomorrowStreet: { ...typography.subtitle, color: colors.text },
  tomorrowLabel: { ...typography.eyebrow, color: colors.textMuted, marginTop: spacing.xs },
});
