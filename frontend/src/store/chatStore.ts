import { create } from 'zustand';
import { Chat, Message } from '../types';
import { chatsApi, messagesApi } from '../api';

interface ChatState {
  chats: Chat[];
  activeChat: Chat | null;
  messages: Record<number, Message[]>;
  loadingChats: boolean;
  loadingMessages: boolean;

  fetchChats: () => Promise<void>;
  setActiveChat: (chat: Chat | null) => void;
  fetchMessages: (chatId: number) => Promise<void>;
  refreshMessages: (chatId: number) => Promise<void>;
  addMessage: (message: Message) => void;
  updateMessage: (message: Message) => void;
  removeMessage: (messageId: number, chatId: number) => void;
  addChat: (chat: Chat) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  chats: [],
  activeChat: null,
  messages: {},
  loadingChats: false,
  loadingMessages: false,

  fetchChats: async () => {
    set({ loadingChats: true });
    try {
      const res = await chatsApi.list();
      set({ chats: res.data.data, loadingChats: false });
    } catch {
      set({ loadingChats: false });
    }
  },

  setActiveChat: (chat) => set({ activeChat: chat }),

  fetchMessages: async (chatId) => {
    set({ loadingMessages: true });
    try {
      const res = await messagesApi.list(chatId);
      const msgs: Message[] = res.data.data.messages;
      set((state) => ({
        messages: { ...state.messages, [chatId]: msgs },
        loadingMessages: false,
      }));
    } catch {
      set({ loadingMessages: false });
    }
  },

  refreshMessages: async (chatId) => {
    const existing = get().messages[chatId] || [];
    const lastId = existing.length > 0 ? existing[existing.length - 1].id : undefined;
    try {
      const res = await messagesApi.list(chatId, 1, lastId);
      const newMsgs: Message[] = res.data.data.messages;
      if (newMsgs.length === 0) return;
      set((state) => {
        const current = state.messages[chatId] || [];
        const existingIds = new Set(current.map((m) => m.id));
        const toAppend = newMsgs.filter((m) => !existingIds.has(m.id));
        if (toAppend.length === 0) return state;
        return {
          messages: { ...state.messages, [chatId]: [...current, ...toAppend] },
        };
      });
    } catch {}
  },

  addMessage: (message) => {
    set((state) => {
      const existing = state.messages[message.chat_id] || [];
      // Avoid duplicates
      if (existing.find((m) => m.id === message.id)) return state;
      return {
        messages: {
          ...state.messages,
          [message.chat_id]: [...existing, message],
        },
      };
    });
  },

  updateMessage: (message) => {
    set((state) => {
      const existing = state.messages[message.chat_id] || [];
      return {
        messages: {
          ...state.messages,
          [message.chat_id]: existing.map((m) => (m.id === message.id ? message : m)),
        },
      };
    });
  },

  removeMessage: (messageId, chatId) => {
    set((state) => {
      const existing = state.messages[chatId] || [];
      return {
        messages: {
          ...state.messages,
          [chatId]: existing.filter((m) => m.id !== messageId),
        },
      };
    });
  },

  addChat: (chat) => {
    set((state) => {
      if (state.chats.find((c) => c.id === chat.id)) return state;
      return { chats: [chat, ...state.chats] };
    });
  },
}));
