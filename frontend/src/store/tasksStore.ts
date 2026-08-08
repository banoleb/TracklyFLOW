import { create } from 'zustand';
import { Task, TaskStatus } from '../types';
import { tasksApi } from '../api';

interface TasksState {
  tasks: Task[];
  loading: boolean;

  fetchTasks: (params?: { chat_id?: number; status?: string; assigned_to?: number }) => Promise<void>;
  createTask: (data: {
    title: string;
    description?: string;
    status?: TaskStatus;
    assigned_to?: number;
    chat_id?: number;
  }) => Promise<Task>;
  updateTask: (
    id: number,
    data: Partial<{ title: string; description: string; status: TaskStatus; assigned_to: number }>
  ) => Promise<void>;
  deleteTask: (id: number) => Promise<void>;
}

export const useTasksStore = create<TasksState>((set) => ({
  tasks: [],
  loading: false,

  fetchTasks: async (params) => {
    set({ loading: true });
    try {
      const res = await tasksApi.list(params);
      set({ tasks: res.data.data.tasks, loading: false });
    } catch {
      set({ loading: false });
    }
  },

  createTask: async (data) => {
    const res = await tasksApi.create(data);
    const task: Task = res.data.data;
    set((state) => ({ tasks: [task, ...state.tasks] }));
    return task;
  },

  updateTask: async (id, data) => {
    const res = await tasksApi.update(id, data);
    const updated: Task = res.data.data;
    set((state) => ({
      tasks: state.tasks.map((t) => (t.id === id ? updated : t)),
    }));
  },

  deleteTask: async (id) => {
    await tasksApi.delete(id);
    set((state) => ({ tasks: state.tasks.filter((t) => t.id !== id) }));
  },
}));
