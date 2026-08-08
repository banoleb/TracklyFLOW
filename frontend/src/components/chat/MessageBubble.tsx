import React, { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { Message } from '../../types';
import { format } from 'date-fns/format';
import { messagesApi } from '../../api';
import { useChatStore } from '../../store/chatStore';

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
}

const IMAGE_EXTS = ['.png', '.jpg', '.jpeg', '.gif', '.webp'];

function isImageUrl(url: string): boolean {
  const lower = url.toLowerCase().split('?')[0];
  return IMAGE_EXTS.some((ext) => lower.endsWith(ext));
}

const API_URL = process.env.REACT_APP_API_URL?.replace('/api', '') || 'http://localhost:5000';

const MessageBubble: React.FC<MessageBubbleProps> = ({ message, isOwn }) => {
  const { updateMessage, removeMessage } = useChatStore();
  const [editing, setEditing] = useState(false);
  const [editContent, setEditContent] = useState(message.content ?? '');

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

  const handleCopy = async () => {
    if (!message.content) return;
    try {
      await navigator.clipboard.writeText(message.content);
    } catch {}
  };

  const time = format(new Date(message.created_at), 'HH:mm');
  const isEdited = message.created_at !== message.updated_at;

  const attachmentUrl = message.attachment_url
    ? `${API_URL}${message.attachment_url}`
    : null;

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
          <button type="button" onClick={handleEdit} className="btn-small">Save</button>
          <button type="button" onClick={() => setEditing(false)} className="btn-small ghost">Cancel</button>
        </div>
      ) : (
        <>
          {message.content && (
            <div className="message-content message-markdown">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {message.content}
              </ReactMarkdown>
            </div>
          )}
          {attachmentUrl && (
            <div className="message-attachment">
              {isImageUrl(message.attachment_url!) ? (
                <a href={attachmentUrl} target="_blank" rel="noopener noreferrer">
                  <img
                    src={attachmentUrl}
                    alt={message.attachment_name ?? 'attachment'}
                    className="attach-image"
                  />
                </a>
              ) : (
                <a
                  href={attachmentUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="attach-file-link"
                  download={message.attachment_name ?? true}
                >
                  📎 {message.attachment_name ?? 'Download file'}
                </a>
              )}
            </div>
          )}
        </>
      )}

      <div className="message-meta">
        <span className="message-time">{time}</span>
        {isEdited && <span className="message-edited">(edited)</span>}
        {!editing && (
          <span className="message-actions">
            {message.content && (
              <button type="button" className="icon-btn" onClick={handleCopy} title="Copy">📋</button>
            )}
            {isOwn && message.content && (
              <button type="button" className="icon-btn" onClick={() => setEditing(true)} title="Edit">✏️</button>
            )}
            {isOwn && (
              <button type="button" className="icon-btn" onClick={handleDelete} title="Delete">🗑️</button>
            )}
          </span>
        )}
      </div>
    </div>
  );
};

export default MessageBubble;
