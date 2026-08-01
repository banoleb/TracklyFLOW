import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { getSocket, joinChat, leaveChat } from '../utils/socket';
import { Message } from '../types';
import Navbar from '../components/common/Navbar';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';

const MainLayout: React.FC = () => {
  const { activeChat, fetchChats, addMessage, updateMessage, removeMessage } = useChatStore();
  const [showNewChat, setShowNewChat] = useState(false);

  // Connect socket and load chats on mount
  useEffect(() => {
    fetchChats();
    const token = localStorage.getItem('access_token');
    if (!token) return;
    const socket = getSocket(token);

    socket.on('new_message', (msg: Message) => addMessage(msg));
    socket.on('message_updated', (msg: Message) => updateMessage(msg));
    socket.on('message_deleted', ({ message_id, chat_id }: { message_id: number; chat_id: number }) =>
      removeMessage(message_id, chat_id)
    );

    return () => {
      socket.off('new_message');
      socket.off('message_updated');
      socket.off('message_deleted');
    };
  }, [fetchChats, addMessage, updateMessage, removeMessage]);

  // Join/leave socket room when active chat changes
  useEffect(() => {
    if (activeChat) {
      joinChat(activeChat.id);
      return () => leaveChat(activeChat.id);
    }
  }, [activeChat]);

  return (
    <div className="app-shell">
      <Navbar />
      <div className="app-body">
        <ChatSidebar onNewChat={() => setShowNewChat(true)} />
        <main className="main-content">
          {activeChat ? (
            <ChatWindow chat={activeChat} />
          ) : (
            <div className="no-chat-selected">
              <div className="no-chat-placeholder">
                <span>💬</span>
                <p>Select a conversation or start a new one</p>
                <button className="btn-primary" onClick={() => setShowNewChat(true)}>
                  New Chat
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  );
};

export default MainLayout;
