import React from 'react';
import { Chat } from '../../types';
import { useChatStore } from '../../store/chatStore';

interface ChatSidebarProps {
  onNewChat: () => void;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({ onNewChat }) => {
  const { chats, activeChat, setActiveChat, loadingChats } = useChatStore();

  return (
    <aside className="chat-sidebar">
      <div className="sidebar-header">
        <span className="sidebar-title">Messages</span>
        <button className="btn-icon" onClick={onNewChat} title="New chat">＋</button>
      </div>

      {loadingChats && <div className="sidebar-loading">Loading…</div>}

      <ul className="chat-list">
        {chats.map((chat) => (
          <ChatListItem
            key={chat.id}
            chat={chat}
            isActive={activeChat?.id === chat.id}
            onClick={() => setActiveChat(chat)}
          />
        ))}
        {!loadingChats && chats.length === 0 && (
          <li className="chat-list-empty">No chats yet. Start one!</li>
        )}
      </ul>
    </aside>
  );
};

interface ChatListItemProps {
  chat: Chat;
  isActive: boolean;
  onClick: () => void;
}

const ChatListItem: React.FC<ChatListItemProps> = ({ chat, isActive, onClick }) => {
  const label = chat.name || `Chat #${chat.id}`;
  const typeIcon = chat.type === 'personal' ? '👤' : chat.type === 'group' ? '👥' : '📢';

  return (
    <li
      className={`chat-list-item${isActive ? ' active' : ''}`}
      onClick={onClick}
      role="button"
      tabIndex={0}
      onKeyDown={(e) => e.key === 'Enter' && onClick()}
    >
      <span className="chat-list-icon">{typeIcon}</span>
      <div className="chat-list-info">
        <span className="chat-list-name">{label}</span>
        <span className="chat-list-type">{chat.type}</span>
      </div>
    </li>
  );
};

export default ChatSidebar;
