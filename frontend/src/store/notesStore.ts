import { create } from 'zustand';
import { Note } from '../types';
import { notesApi } from '../api';

interface NotesState {
  notes: Note[];
  activeNote: Note | null;
  loading: boolean;

  fetchNotes: () => Promise<void>;
  setActiveNote: (note: Note | null) => void;
  createNote: (data: { title?: string; content: string }) => Promise<Note>;
  updateNote: (id: number, data: Partial<{ title: string; content: string }>) => Promise<void>;
  deleteNote: (id: number) => Promise<void>;
}

export const useNotesStore = create<NotesState>((set, get) => ({
  notes: [],
  activeNote: null,
  loading: false,

  fetchNotes: async () => {
    set({ loading: true });
    try {
      const res = await notesApi.list();
      set({ notes: res.data.data.notes, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  setActiveNote: (note) => set({ activeNote: note }),

  createNote: async (data) => {
    const res = await notesApi.create(data);
    const note: Note = res.data.data;
    set((state) => ({ notes: [note, ...state.notes], activeNote: note }));
    return note;
  },

  updateNote: async (id, data) => {
    const res = await notesApi.update(id, data);
    const updated: Note = res.data.data;
    set((state) => ({
      notes: state.notes.map((n) => (n.id === id ? updated : n)),
      activeNote: state.activeNote?.id === id ? updated : state.activeNote,
    }));
  },

  deleteNote: async (id) => {
    await notesApi.delete(id);
    set((state) => ({
      notes: state.notes.filter((n) => n.id !== id),
      activeNote: state.activeNote?.id === id ? null : state.activeNote,
    }));
  },
}));
