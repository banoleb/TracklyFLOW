import React from 'react';
import { Note } from '../../types';
import { useNotesStore } from '../../store/notesStore';

const NotesSidebar: React.FC = () => {
  const { notes, activeNote, setActiveNote, loading, createNote } = useNotesStore();

  const handleNewNote = async () => {
    await createNote({ content: '' });
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="notes-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Notes</span>
        <button className="btn-icon" onClick={handleNewNote} title="New note">＋</button>
      </div>

      {loading && <div className="sidebar-loading">Loading…</div>}

      <ul className="notes-list">
        {notes.map((note) => (
          <NoteListItem
            key={note.id}
            note={note}
            isActive={activeNote?.id === note.id}
            onClick={() => setActiveNote(note)}
            formatDate={formatDate}
          />
        ))}
        {!loading && notes.length === 0 && (
          <li className="chat-list-empty">No notes yet. Create one!</li>
        )}
      </ul>
    </aside>
  );
};

interface NoteListItemProps {
  note: Note;
  isActive: boolean;
  onClick: () => void;
  formatDate: (iso: string) => string;
}

const NoteListItem: React.FC<NoteListItemProps> = ({ note, isActive, onClick, formatDate }) => {
  const title = note.title || note.content.slice(0, 40) || 'Untitled';
  const preview = note.title ? note.content.slice(0, 50) : '';

  return (
    <li
      className={`notes-list-item${isActive ? ' active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <div className="notes-list-title">{title}</div>
      <div className="notes-list-meta">
        <span className="notes-list-date">{formatDate(note.updated_at)}</span>
        {preview && <span className="notes-list-preview">{preview}</span>}
      </div>
    </li>
  );
};

export default NotesSidebar;
