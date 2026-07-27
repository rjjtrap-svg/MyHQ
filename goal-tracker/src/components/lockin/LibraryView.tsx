import React, { useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import {
  LOCK_IN_ENTRIES,
  LockInEntry,
  TOPICS,
  TopicId,
  entriesForSource,
  searchEntries,
  shelves,
} from '@/src/lib/lockIn';
import { colors, radius, spacing, typography } from '@/src/theme';

type Browse = 'topic' | 'shelf';

function EntryCard({ entry }: { entry: LockInEntry }) {
  const isQuote = entry.kind === 'quote';
  return (
    <View style={styles.card}>
      <Text style={isQuote ? styles.quote : styles.idea}>
        {isQuote ? `“${entry.text}”` : entry.text}
      </Text>
      <View style={styles.metaRow}>
        <Text style={styles.author}>{entry.author}</Text>
        {!!entry.source && <Text style={styles.source}>· {entry.source}</Text>}
        {/* The tag is the integrity mechanism, not decoration: it's how a reader knows
            they're looking at our summary rather than the person's actual words. */}
        {!isQuote && <Text style={styles.tag}>idea</Text>}
      </View>
    </View>
  );
}

export function LibraryView() {
  const [query, setQuery] = useState('');
  const [browse, setBrowse] = useState<Browse>('topic');
  const [topic, setTopic] = useState<TopicId | 'all'>('all');
  const [shelf, setShelf] = useState<string | null>(null);

  const allShelves = useMemo(() => shelves(), []);

  const results = useMemo(() => {
    if (query.trim()) return searchEntries(query);
    if (browse === 'shelf') return shelf ? entriesForSource(shelf) : [];
    return topic === 'all' ? LOCK_IN_ENTRIES : LOCK_IN_ENTRIES.filter((e) => e.topics.includes(topic));
  }, [query, browse, topic, shelf]);

  const searching = !!query.trim();
  const activeTopic = TOPICS.find((t) => t.id === topic);

  return (
    <>
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder="Search a name, book, or word"
        placeholderTextColor={colors.textFaint}
        autoCorrect={false}
      />

      <Text style={styles.integrity}>
        Quotation marks mean they said it. Anything tagged “idea” is their framework in our
        words.
      </Text>

      {!searching && (
        <>
          <View style={styles.browseRow}>
            {(['topic', 'shelf'] as Browse[]).map((b) => (
              <Pressable key={b} onPress={() => setBrowse(b)} style={styles.browseItem}>
                <Text style={[styles.browseLabel, browse === b && styles.browseLabelActive]}>
                  {b === 'topic' ? 'By topic' : 'By book'}
                </Text>
              </Pressable>
            ))}
          </View>

          {browse === 'topic' ? (
            <>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
                {(['all', ...TOPICS.map((t) => t.id)] as (TopicId | 'all')[]).map((t) => {
                  const active = topic === t;
                  const label = t === 'all' ? 'All' : TOPICS.find((x) => x.id === t)!.label;
                  return (
                    <Pressable
                      key={t}
                      onPress={() => setTopic(t)}
                      style={[styles.chip, active && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, active && styles.chipTextActive]}>{label}</Text>
                    </Pressable>
                  );
                })}
              </ScrollView>
              {!!activeTopic && <Text style={styles.blurb}>{activeTopic.blurb}</Text>}
            </>
          ) : (
            <View style={styles.shelfList}>
              {allShelves.map((s) => {
                const active = shelf === s.source;
                return (
                  <Pressable
                    key={s.source}
                    onPress={() => setShelf(active ? null : s.source)}
                    style={[styles.shelf, active && styles.shelfActive]}
                  >
                    <View style={styles.shelfText}>
                      <Text style={[styles.shelfTitle, active && styles.shelfTitleActive]}>
                        {s.source}
                      </Text>
                      <Text style={styles.shelfAuthor}>{s.author}</Text>
                    </View>
                    <Text style={styles.shelfCount}>{s.count}</Text>
                  </Pressable>
                );
              })}
            </View>
          )}
        </>
      )}

      {browse === 'shelf' && !searching && !shelf ? (
        <Text style={styles.empty}>Pick a book to read what's filed under it.</Text>
      ) : results.length === 0 ? (
        <Text style={styles.empty}>
          Nothing matches that. Try a different word, or clear the search.
        </Text>
      ) : (
        <>
          <Text style={styles.count}>
            {results.length} {results.length === 1 ? 'entry' : 'entries'}
          </Text>
          {results.map((e) => (
            <EntryCard key={e.id} entry={e} />
          ))}
        </>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  search: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
    color: colors.text,
    fontSize: 15,
  },
  integrity: {
    ...typography.caption,
    color: colors.textFaint,
    marginTop: spacing.sm,
    marginBottom: spacing.lg,
  },
  browseRow: {
    flexDirection: 'row',
    marginBottom: spacing.md,
  },
  browseItem: {
    marginRight: spacing.lg,
  },
  browseLabel: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textFaint,
  },
  browseLabelActive: {
    color: colors.accent,
  },
  chipRow: {
    paddingRight: spacing.md,
    gap: spacing.sm,
  },
  chip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs + 2,
    borderRadius: radius.round,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.surface,
  },
  chipActive: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  chipText: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textMuted,
  },
  chipTextActive: {
    color: colors.background,
  },
  blurb: {
    ...typography.caption,
    color: colors.textMuted,
    marginTop: spacing.md,
  },
  shelfList: {
    marginBottom: spacing.md,
  },
  shelf: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  shelfActive: {
    borderBottomColor: colors.accent,
  },
  shelfText: {
    flex: 1,
  },
  shelfTitle: {
    ...typography.body,
    fontWeight: '600',
    color: colors.text,
  },
  shelfTitleActive: {
    color: colors.accent,
  },
  shelfAuthor: {
    ...typography.caption,
    color: colors.textFaint,
  },
  shelfCount: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textFaint,
  },
  count: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.textFaint,
    marginTop: spacing.lg,
    marginBottom: spacing.md,
  },
  empty: {
    ...typography.quote,
    fontSize: 16,
    color: colors.textFaint,
    textAlign: 'center',
    paddingVertical: spacing.xl,
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    padding: spacing.md,
    marginBottom: spacing.md,
  },
  quote: {
    ...typography.quote,
    color: colors.text,
  },
  idea: {
    ...typography.body,
    color: colors.text,
    lineHeight: 24,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    marginTop: spacing.md,
  },
  author: {
    ...typography.eyebrow,
    fontSize: 10,
    color: colors.accent,
  },
  source: {
    ...typography.caption,
    color: colors.textFaint,
    marginLeft: spacing.xs,
  },
  tag: {
    ...typography.eyebrow,
    fontSize: 9,
    color: colors.textFaint,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: radius.round,
    paddingHorizontal: spacing.sm,
    paddingVertical: 1,
    marginLeft: spacing.sm,
  },
});
