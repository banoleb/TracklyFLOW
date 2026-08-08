import React, { useEffect, useRef, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { useNotesStore } from '../../store/notesStore';

const NoteEditor: React.FC = () => {
  const { activeNote, updateNote, deleteNote, createNote } = useNotesStore();

  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Sync local state when active note changes
  useEffect(() => {
    if (activeNote) {
      setTitle(activeNote.title ?? '');
      setContent(activeNote.content);
      setDirty(false);
    } else {
      setTitle('');
      setContent('');
      setDirty(false);
    }
  }, [activeNote?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  const scheduleSave = (newTitle: string, newContent: string) => {
    if (!activeNote) return;
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      if (!newContent.trim()) return;
      setSaving(true);
      try {
        await updateNote(activeNote.id, {
          title: newTitle.trim() || undefined,
          content: newContent,
        });
      } finally {
        setSaving(false);
        setDirty(false);
      }
    }, 800);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setTitle(val);
    setDirty(true);
    scheduleSave(val, content);
  };

  const handleContentChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const val = e.target.value;
    setContent(val);
    setDirty(true);
    scheduleSave(title, val);
  };

  const handleDelete = async () => {
    if (!activeNote) return;
    if (!window.confirm('Delete this note?')) return;
    await deleteNote(activeNote.id);
  };

  const handleNewNote = async () => {
    await createNote({ content: '' });
  };

  if (!activeNote) {
    return (
      <div className="note-editor note-editor-empty">
        <div className="no-chat-placeholder">
          <span>📝</span>
          <p>Select a note or create a new one</p>
          <button className="btn-primary" onClick={handleNewNote}>
            New Note
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="note-editor">
      <div className="note-editor-header">
        <input
          className="note-title-input"
          placeholder="Note title…"
          value={title}
          onChange={handleTitleChange}
        />
        <div className="note-editor-actions">
          {saving && <span className="note-saving">Saving…</span>}
          {!saving && dirty && <span className="note-saving">Unsaved</span>}
          <button className="btn-secondary btn-small" onClick={handleDelete}>
            🗑 Delete
          </button>
        </div>
      </div>
      <textarea
        className="note-content-textarea"
        placeholder="Write your note here…"
        value={content}
        onChange={handleContentChange}
      />
      <div className="note-markdown-preview message-markdown">
        {content.trim() ? (
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
          </ReactMarkdown>
        ) : (
          <p className="note-preview-placeholder">Markdown preview will appear here…</p>
        )}
      </div>
    </div>
  );
};

export default NoteEditor;
