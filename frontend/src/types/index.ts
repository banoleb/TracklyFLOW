export interface User {
  id: number;
  username: string;
  email?: string;
  avatar: string | null;
  created_at: string;
}

export interface ChatMember {
  id: number;
  chat_id: number;
  user_id: number;
  username: string | null;
  avatar: string | null;
  role: 'owner' | 'admin' | 'member';
  joined_at: string;
}

export interface Chat {
  id: number;
  name: string | null;
  type: 'personal' | 'group' | 'channel';
  created_at: string;
  members?: ChatMember[];
}

export interface Message {
  id: number;
  chat_id: number;
  user_id: number | null;
  author: User | null;
  content: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  created_at: string;
  updated_at: string;
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: 'todo' | 'in_progress' | 'review' | 'done';
  assigned_to: number | null;
  assignee: User | null;
  created_by: number | null;
  creator: User | null;
  chat_id: number | null;
  created_at: string;
  updated_at: string;
}

export interface ApiResponse<T> {
  success: boolean;
  data?: T;
  message?: string;
}

export type TaskStatus = 'todo' | 'in_progress' | 'review' | 'done';

export interface Note {
  id: number;
  title: string | null;
  content: string;
  user_id: number;
  created_at: string;
  updated_at: string;
}
