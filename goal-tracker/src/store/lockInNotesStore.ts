import { create } from 'zustand';
import { LockInNote, NoteKind } from '@/src/types';
import { generateId } from '@/src/lib/id';
import { deleteNote, saveNote, subscribeNotes } from '@/src/firebase/lockInNotes';

export interface CreateNoteInput {
  teamId: string;
  repUid: string;
  kind: NoteKind;
  body: string;
  title?: string;
  exerciseId?: string;
  targetDate?: string;
}

interface LockInNotesState {
  notes: LockInNote[];
  loading: boolean;
  subscribe: (teamId: string, repUid: string) => () => void;
  create: (input: CreateNoteInput) => Promise<LockInNote>;
  update: (note: LockInNote) => Promise<void>;
  remove: (teamId: string, repUid: string, noteId: string) => Promise<void>;
  /** Pins one why and unpins any other — there is only ever one current why. */
  pinWhy: (teamId: string, repUid: string, noteId: string) => Promise<void>;
  toggleGoalDone: (note: LockInNote) => Promise<void>;
}

export const useLockInNotesStore = create<LockInNotesState>((set, get) => ({
  notes: [],
  loading: true,

  subscribe: (teamId, repUid) => {
    set({ notes: [], loading: true });
    return subscribeNotes(teamId, repUid, (notes) => set({ notes, loading: false }));
  },

  create: async (input) => {
    const now = new Date().toISOString();
    const note: LockInNote = {
      id: generateId(),
      teamId: input.teamId,
      repUid: input.repUid,
      kind: input.kind,
      body: input.body,
      ...(input.title ? { title: input.title } : {}),
      ...(input.exerciseId ? { exerciseId: input.exerciseId } : {}),
      ...(input.targetDate ? { targetDate: input.targetDate } : {}),
      createdAt: now,
      updatedAt: now,
    };
    await saveNote(note);
    return note;
  },

  update: async (note) => {
    await saveNote({ ...note, updatedAt: new Date().toISOString() });
  },

  remove: async (teamId, repUid, noteId) => {
    await deleteNote(teamId, repUid, noteId);
  },

  pinWhy: async (teamId, repUid, noteId) => {
    const now = new Date().toISOString();
    // Old whys are kept, not overwritten — reading back what used to matter to you is the
    // point of the exercise. Only the pin moves.
    const previouslyPinned = get().notes.filter((n) => n.pinned && n.id !== noteId);
    await Promise.all(
      previouslyPinned.map((n) => saveNote({ ...n, pinned: false, updatedAt: now }))
    );
    const target = get().notes.find((n) => n.id === noteId);
    if (target) await saveNote({ ...target, pinned: true, updatedAt: now });
  },

  toggleGoalDone: async (note) => {
    const now = new Date().toISOString();
    await saveNote({
      ...note,
      completedAt: note.completedAt ? undefined : now,
      updatedAt: now,
    });
  },
}));

/** The why shown before the first door. Undefined until the rep writes one. */
export function currentWhy(notes: LockInNote[]): LockInNote | undefined {
  return notes.find((n) => n.kind === 'why' && n.pinned) ?? notes.find((n) => n.kind === 'why');
}
