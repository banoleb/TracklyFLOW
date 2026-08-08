import React, { useCallback, useEffect, useRef, useState } from 'react';
import { Chat, Message } from '../../types';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { messagesApi } from '../../api';
import { sendTyping, sendStopTyping } from '../../utils/socket';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  chat: Chat;
}

const POLL_INTERVAL_MS = 10_000;
const IMAGE_TYPES = ['image/png', 'image/jpeg', 'image/gif', 'image/webp'];

const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
  const { user } = useAuthStore();
  const { messages, fetchMessages, refreshMessages, addMessage } = useChatStore();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [typingUsers] = useState<number[]>([]);
  const [attachment, setAttachment] = useState<File | null>(null);
  const [attachPreview, setAttachPreview] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const chatMessages: Message[] = messages[chat.id] || [];

  useEffect(() => {
    fetchMessages(chat.id);
  }, [chat.id, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  // Auto-poll every POLL_INTERVAL_MS to catch any missed socket events
  const handleRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refreshMessages(chat.id);
    } finally {
      setRefreshing(false);
    }
  }, [chat.id, refreshMessages]);

  useEffect(() => {
    pollRef.current = setInterval(handleRefresh, POLL_INTERVAL_MS);
    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [handleRefresh]);

  // Reset attachment state when switching chats
  useEffect(() => {
    setAttachment(null);
    setAttachPreview(null);
    setContent('');
  }, [chat.id]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] ?? null;
    setAttachment(file);
    if (file && IMAGE_TYPES.includes(file.type)) {
      setAttachPreview(URL.createObjectURL(file));
    } else {
      setAttachPreview(null);
    }
    // Reset input so the same file can be selected again
    e.target.value = '';
  };

  const clearAttachment = () => {
    setAttachment(null);
    setAttachPreview(null);
  };

  const handleSend = async (e?: React.FormEvent) => {
    e?.preventDefault();
    const text = content.trim();
    if ((!text && !attachment) || sending) return;
    setSending(true);
    try {
      const res = await messagesApi.send(chat.id, text, attachment ?? undefined);
      addMessage(res.data.data);
      setContent('');
      clearAttachment();
    } catch {}
    setSending(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTyping = () => {
    sendTyping(chat.id);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendStopTyping(chat.id), 2000);
  };

  const chatName = chat.name || `Chat #${chat.id}`;
  const canSend = (content.trim().length > 0 || attachment !== null) && !sending;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-type-badge">{chat.type}</span>
          <h3>{chatName}</h3>
        </div>
        <button
          className="btn-refresh"
          onClick={handleRefresh}
          disabled={refreshing}
          title="Load new messages"
        >
          {refreshing ? '⟳' : '↻'} Refresh
        </button>
      </div>

      <div className="messages-list">
        {chatMessages.length === 0 && (
          <div className="messages-empty">No messages yet. Say hello! 👋</div>
        )}
        {chatMessages.map((msg) => (
          <MessageBubble
            key={msg.id}
            message={msg}
            isOwn={msg.user_id === user?.id}
          />
        ))}
        {typingUsers.length > 0 && (
          <div className="typing-indicator">
            {typingUsers.length} user(s) typing…
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Attachment preview */}
      {attachment && (
        <div className="attachment-preview">
          {attachPreview && attachPreview.startsWith('blob:') ? (
            <img src={attachPreview} alt="" className="attach-thumb" />
          ) : (
            <span className="attach-file-icon">📎</span>
          )}
          <span className="attach-name">{attachment.name}</span>
          <button className="attach-remove" onClick={clearAttachment} title="Remove">✕</button>
        </div>
      )}

      <form className="message-input-bar" onSubmit={handleSend}>
        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileChange}
          accept="image/*,.pdf,.txt,.csv,.doc,.docx,.xls,.xlsx,.zip,.mp4,.mp3"
        />
        <button
          type="button"
          className="btn-attach"
          onClick={() => fileInputRef.current?.click()}
          title="Attach file"
        >
          📎
        </button>
        <textarea
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          onKeyDown={handleKeyDown}
          placeholder={`Message ${chatName}  (Shift+Enter for newline)`}
          disabled={sending}
          autoFocus
          rows={1}
          className="message-textarea"
        />
        <button type="submit" className="btn-send" disabled={!canSend}>
          {sending ? '…' : '➤'}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
