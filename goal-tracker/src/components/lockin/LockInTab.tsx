import React, { useEffect, useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { WhyExercise } from '@/src/lib/why';
import { useAuthStore } from '@/src/store/authStore';
import { useTeamStore } from '@/src/store/teamStore';
import { currentWhy, useLockInNotesStore } from '@/src/store/lockInNotesStore';
import { Banner } from '@/src/components/Banner';
import { ModeRail } from './ModeRail';
import { WhyCard } from './WhyCard';
import { WhyView } from './WhyView';
import { JournalView } from './JournalView';
import { GoalsView } from './GoalsView';
import { LibraryView } from './LibraryView';
import { NoteComposer } from './NoteComposer';
import { spacing, typography, colors } from '@/src/theme';

type Mode = 'why' | 'journal' | 'goals' | 'library';

const MODES: { key: Mode; label: string }[] = [
  { key: 'why', label: 'Why' },
  { key: 'journal', label: 'Journal' },
  { key: 'goals', label: 'Goals' },
  { key: 'library', label: 'Library' },
];

/**
 * Lock In. Four modes behind one rail: the rep's why, their journal, their goals, and the
 * reference library.
 *
 * The why card sits above the rail rather than inside the Why mode, because it is the one
 * thing worth seeing regardless of what you opened this tab to do.
 */
export function LockInTab() {
  const firebaseUser = useAuthStore((s) => s.firebaseUser);
  const teamId = useTeamStore((s) => s.teamId);
  const repUid = firebaseUser?.uid;

  const notes = useLockInNotesStore((s) => s.notes);
  const subscribe = useLockInNotesStore((s) => s.subscribe);
  const create = useLockInNotesStore((s) => s.create);
  const remove = useLockInNotesStore((s) => s.remove);
  const pinWhy = useLockInNotesStore((s) => s.pinWhy);
  const toggleGoalDone = useLockInNotesStore((s) => s.toggleGoalDone);

  const [mode, setMode] = useState<Mode>('why');
  const [editingWhy, setEditingWhy] = useState(false);
  const [prompt, setPrompt] = useState<{ exerciseId: string; text: string } | undefined>();

  useEffect(() => {
    if (!teamId || !repUid) return;
    return subscribe(teamId, repUid);
  }, [teamId, repUid, subscribe]);

  const why = useMemo(() => currentWhy(notes), [notes]);

  if (!teamId || !repUid) {
    return <Banner message="Sign in to your team to use Lock In." tone="info" />;
  }

  function startExercise(ex: WhyExercise) {
    setPrompt({ exerciseId: ex.id, text: ex.prompt });
    setMode('journal');
  }

  return (
    <>
      {editingWhy ? (
        <NoteComposer
          kind="why"
          prompt="A why with a face, a number or a date attached. If it doesn't change a decision you're about to make, keep writing."
          placeholder="The reason you knock the next door."
          initialBody=""
          submitLabel="Save my why"
          onCancel={() => setEditingWhy(false)}
          onSubmit={async ({ body }) => {
            const note = await create({ teamId, repUid, kind: 'why', body });
            // Pin immediately so the new one is what shows before the first door. The old
            // one is kept, not replaced — that history is the point.
            await pinWhy(teamId, repUid, note.id);
            setEditingWhy(false);
          }}
        />
      ) : (
        <WhyCard why={why} onPress={() => setEditingWhy(true)} />
      )}

      <ModeRail options={MODES} value={mode} onChange={setMode} />

      {mode === 'why' && <WhyView onStartExercise={startExercise} />}

      {mode === 'journal' && (
        <JournalView
          notes={notes}
          prompt={prompt}
          onClearPrompt={() => setPrompt(undefined)}
          onCreate={async ({ body, title, exerciseId }) => {
            await create({ teamId, repUid, kind: 'journal', body, title, exerciseId });
          }}
          onDelete={async (noteId) => {
            await remove(teamId, repUid, noteId);
          }}
        />
      )}

      {mode === 'goals' && (
        <GoalsView
          notes={notes}
          onCreate={async ({ body, title, targetDate }) => {
            await create({ teamId, repUid, kind: 'goal', body, title, targetDate });
          }}
          onToggleDone={toggleGoalDone}
        />
      )}

      {mode === 'library' && <LibraryView />}

      {mode !== 'library' && (
        <View style={{ marginTop: spacing.xl }}>
          <Text style={{ ...typography.caption, color: colors.textFaint, textAlign: 'center' }}>
            Your why, journal and goals are private. Your manager cannot read them.
          </Text>
        </View>
      )}
    </>
  );
}
