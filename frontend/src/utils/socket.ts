import { io, Socket } from 'socket.io-client';

const SOCKET_URL = process.env.REACT_APP_SOCKET_URL || 'http://localhost:5000';

let socket: Socket | null = null;

export function getSocket(token: string): Socket {
  if (!socket) {
    socket = io(SOCKET_URL, {
      auth: { token },
      transports: ['websocket'],
    });
  }
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}

export function joinChat(chatId: number) {
  socket?.emit('join_chat', { chat_id: chatId });
}

export function leaveChat(chatId: number) {
  socket?.emit('leave_chat', { chat_id: chatId });
}

export function sendTyping(chatId: number) {
  socket?.emit('typing', { chat_id: chatId });
}

export function sendStopTyping(chatId: number) {
  socket?.emit('stop_typing', { chat_id: chatId });
}
