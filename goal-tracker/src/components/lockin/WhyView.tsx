import React, { useState } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { WHY_EXERCISES, WHY_LESSONS, WHY_SOURCES, WhyExercise } from '@/src/lib/why';
import { Section } from '@/src/components/Section';
import { colors, radius, spacing, typography } from '@/src/theme';

/**
 * The reading half of the Why section: four lessons, four exercises, seven sources.
 *
 * Lessons collapse because nobody reads four essays standing in a truck — the titles are
 * the argument, and the body is there when someone wants it. Exercises lead with honest
 * minutes for the same reason: a rep who thinks something takes half an hour will never
 * start it.
 */
export function WhyView({ onStartExercise }: { onStartExercise: (e: WhyExercise) => void }) {
  const [openLesson, setOpenLesson] = useState<string | null>(WHY_LESSONS[0]?.id ?? null);

  return (
    <>
      <Section title="Read">
        {WHY_LESSONS.map((lesson) => {
          const open = openLesson === lesson.id;
          return (
            <Pressable
              key={lesson.id}
              style={styles.lesson}
              onPress={() => setOpenLesson(open ? null : lesson.id)}
            >
              <View style={styles.lessonHead}>
                <Text style={styles.lessonTitle}>{lesson.title}</Text>
                <Text style={styles.chevron}>{open ? '–' : '+'}</Text>
              </View>
              {open &&
                lesson.body.map((p, i) => (
                  <Text key={i} style={styles.paragraph}>
                    {p}
                  </Text>
                ))}
            </Pressable>
          );
        })}
      </Section>

      <Section title="Work it out">
        {WHY_EXERCISES.map((ex) => (
          <Pressable key={ex.id} style={styles.exercise} onPress={() => onStartExercise(ex)}>
            <View style={styles.exerciseHead}>
              <Text style={styles.exerciseTitle}>{ex.title}</Text>
              <Text style={styles.minutes}>{ex.minutes} min</Text>
            </View>
            <Text style={styles.purpose}>{ex.purpose}</Text>
            {ex.steps.map((s, i) => (
              <View key={i} style={styles.stepRow}>
                {/* Numbered because these genuinely are a sequence — the laddering only
                    works in order. */}
                <Text style={styles.stepNumber}>{i + 1}</Text>
                <Text style={styles.stepText}>{s}</Text>
              </View>
            ))}
            <Text style={styles.startCta}>Start writing →</Text>
          </Pressable>
        ))}
      </Section>

      <Section title="Where this comes from">
        <Text style={styles.sourcesIntro}>
          Real books and research, not our opinions. Each summary is in our words — go to the
          source if you want theirs.
        </Text>
        {WHY_SOURCES.map((s) => (
          <View key={s.id} style={styles.source}>
            <Text style={styles.sourceKind}>{s.kind}</Text>
            <Text style={styles.sourceTitle}>{s.title}</Text>
            <Text style={styles.sourceAuthor}>{s.author}</Text>
            <Text style={styles.sourceTakeaway}>{s.takeaway}</Text>
          </View>
        ))}
      </Section>
    </>
  );
}

const styles = StyleSheet.create({
  lesson: {
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingVertical: spacing.md,
  },
  lessonHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  lessonTitle: {
    ...typography.subtitle,
    color: colors.text,
    flex: 1,
    paddingRight: spacing.md,
  },
  chevron: {
    ...typography.subtitle,
    color: colors.accent,
  },
  paragraph: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 24,
    marginTop: spacing.md,
  },
  exercise: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  exerciseHead: {
    flexDirection: 'row',
    alignItems: 'baseline',
    justifyContent: 'space-between',
  },
  exerciseTitle: {
    ...typography.subtitle,
    color: colors.text,
  },
  minutes: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.gold,
  },
  purpose: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.xs,
    marginBottom: spacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    marginBottom: spacing.sm,
  },
  stepNumber: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.accent,
    width: 18,
    paddingTop: 3,
  },
  stepText: {
    ...typography.body,
    color: colors.textMuted,
    flex: 1,
    lineHeight: 22,
  },
  startCta: {
    ...typography.eyebrow,
    color: colors.accent,
    marginTop: spacing.sm,
  },
  sourcesIntro: {
    ...typography.caption,
    color: colors.textMuted,
    marginBottom: spacing.md,
  },
  source: {
    borderLeftWidth: 2,
    borderLeftColor: colors.border,
    paddingLeft: spacing.md,
    marginBottom: spacing.lg,
  },
  sourceKind: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textFaint,
  },
  sourceTitle: {
    ...typography.subtitle,
    color: colors.text,
    marginTop: 2,
  },
  sourceAuthor: {
    ...typography.caption,
    color: colors.accent,
    marginBottom: spacing.xs,
  },
  sourceTakeaway: {
    ...typography.body,
    color: colors.textMuted,
    lineHeight: 22,
  },
});
