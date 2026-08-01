import React, { useEffect, useRef, useState } from 'react';
import { Chat, Message } from '../../types';
import { useChatStore } from '../../store/chatStore';
import { useAuthStore } from '../../store/authStore';
import { messagesApi } from '../../api';
import { sendTyping, sendStopTyping } from '../../utils/socket';
import MessageBubble from './MessageBubble';

interface ChatWindowProps {
  chat: Chat;
}

const ChatWindow: React.FC<ChatWindowProps> = ({ chat }) => {
  const { user } = useAuthStore();
  const { messages, fetchMessages, addMessage } = useChatStore();
  const [content, setContent] = useState('');
  const [sending, setSending] = useState(false);
  const [typingUsers] = useState<number[]>([]);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  const chatMessages: Message[] = messages[chat.id] || [];

  useEffect(() => {
    fetchMessages(chat.id);
  }, [chat.id, fetchMessages]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages.length]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = content.trim();
    if (!text || sending) return;
    setSending(true);
    try {
      const res = await messagesApi.send(chat.id, text);
      addMessage(res.data.data);
      setContent('');
    } catch {}
    setSending(false);
  };

  const handleTyping = () => {
    sendTyping(chat.id);
    if (typingTimeout.current) clearTimeout(typingTimeout.current);
    typingTimeout.current = setTimeout(() => sendStopTyping(chat.id), 2000);
  };

  const chatName = chat.name || `Chat #${chat.id}`;

  return (
    <div className="chat-window">
      <div className="chat-header">
        <div className="chat-header-info">
          <span className="chat-type-badge">{chat.type}</span>
          <h3>{chatName}</h3>
        </div>
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

      <form className="message-input-bar" onSubmit={handleSend}>
        <input
          type="text"
          value={content}
          onChange={(e) => {
            setContent(e.target.value);
            handleTyping();
          }}
          placeholder={`Message ${chatName}`}
          disabled={sending}
          autoFocus
        />
        <button type="submit" className="btn-send" disabled={!content.trim() || sending}>
          {sending ? '…' : '➤'}
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;
