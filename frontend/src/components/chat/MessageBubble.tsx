import React, { useState } from 'react';
import { Message } from '../../types';
import { format } from 'date-fns/format';
import { messagesApi } from '../../api';
import { useChatStore } from '../../store/chatStore';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const { updateMessage, removeMessage } = useChatStore();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content);

  const handleEdit = async () => {
    if (!editContent.trim()) return;
    try {
      const res = await messagesApi.edit(message.id, editContent.trim());
      updateMessage(res.data.data);
      setEditing(false);
    } catch {}
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this message?')) return;
    try {
      await messagesApi.delete(message.id);
      removeMessage(message.id, message.chat_id);
    } catch {}
  };

  const time = format(new Date(message.created_at), 'HH:mm');
  const isEdited = message.created_at !== message.updated_at;

  return (
    <div className={`message-bubble ${isOwn ? 'own' : 'other'}`}>
      {!isOwn && (
        <span className="message-author">
          {message.author?.username || 'Unknown'}
        </span>
      )}
      {editing ? (
        <div className="message-edit">
          <input
            type="text"
            value={editContent}
            onChange={(e) => setEditContent(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleEdit();
              if (e.key === 'Escape') setEditing(false);
            }}
            autoFocus
          />
          <button onClick={handleEdit} className="btn-small">Save</button>
          <button onClick={() => setEditing(false)} className="btn-small ghost">Cancel</button>
        </div>
      ) : (
        <div className="message-content">{message.content}</div>
      )}
      <div className="message-meta">
        <span className="message-time">{time}</span>
        {isEdited && <span className="message-edited">(edited)</span>}
        {isOwn && !editing && (
          <span className="message-actions">
            <button className="icon-btn" onClick={() => setEditing(true)} title="Edit">✏️</button>
            <button className="icon-btn" onClick={handleDelete} title="Delete">🗑️</button>
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
