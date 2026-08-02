import React, { useEffect, useState } from 'react';
import { useChatStore } from '../store/chatStore';
import { useNotesStore } from '../store/notesStore';
import { getSocket, joinChat, leaveChat } from '../utils/socket';
import { Message } from '../types';
import Navbar from '../components/common/Navbar';
import ChatSidebar from '../components/chat/ChatSidebar';
import ChatWindow from '../components/chat/ChatWindow';
import NewChatModal from '../components/chat/NewChatModal';
import NotesSidebar from '../components/notes/NotesSidebar';
import NoteEditor from '../components/notes/NoteEditor';

type View = 'chat' | 'notes';

const MainLayout: React.FC = () => {
  const { activeChat, fetchChats, addMessage, updateMessage, removeMessage } = useChatStore();
  const { fetchNotes } = useNotesStore();
  const [showNewChat, setShowNewChat] = useState(false);
  const [view, setView] = useState<View>('chat');

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

  // Load notes when switching to notes view
  useEffect(() => {
    if (view === 'notes') {
      fetchNotes();
    }
  }, [view, fetchNotes]);

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
      <div className="view-tabs">
        <button
          className={`view-tab${view === 'chat' ? ' active' : ''}`}
          onClick={() => setView('chat')}
        >
          💬 Messages
        </button>
        <button
          className={`view-tab${view === 'notes' ? ' active' : ''}`}
          onClick={() => setView('notes')}
        >
          📝 Notes
        </button>
      </div>
      <div className="app-body">
        {view === 'chat' ? (
          <>
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
          </>
        ) : (
          <>
            <NotesSidebar />
            <main className="main-content">
              <NoteEditor />
            </main>
          </>
        )}
      </div>
      {showNewChat && <NewChatModal onClose={() => setShowNewChat(false)} />}
    </div>
  );
};

export default MainLayout;
