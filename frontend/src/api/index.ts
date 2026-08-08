import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const api = axios.create({
  baseURL: API_URL,
  headers: { 'Content-Type': 'application/json' },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = 'Bearer ' + token;
  }
  return config;
});

api.interceptors.response.use(
  (res) => res,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry) {
      original._retry = true;
      const refreshToken = localStorage.getItem('refresh_token');
      if (refreshToken) {
        try {
          const res = await axios.post(`${API_URL}/auth/refresh`, {}, {
            headers: { Authorization: 'Bearer ' + refreshToken },
          });
          const newToken = res.data.data.access_token;
          localStorage.setItem('access_token', newToken);
          original.headers.Authorization = 'Bearer ' + newToken;
          return api(original);
        } catch {
          localStorage.clear();
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  }
);

export default api;

export const authApi = {
  register: (data: { username: string; email: string; password: string }) =>
    api.post('/auth/register', data),
  login: (data: { email: string; password: string }) =>
    api.post('/auth/login', data),
  logout: () => api.delete('/auth/logout'),
  me: () => api.get('/auth/me'),
};

export const usersApi = {
  search: (q: string, page = 1) => api.get('/users', { params: { q, page } }),
  getById: (id: number) => api.get(`/users/${id}`),
  updateProfile: (data: Partial<{ username: string; email: string; password: string }>) =>
    api.patch('/users/me', data),
  uploadAvatar: (file: File) => {
    const form = new FormData();
    form.append('avatar', file);
    return api.post('/users/me/avatar', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

export const chatsApi = {
  list: () => api.get('/chats'),
  create: (data: { type: string; name?: string; member_ids?: number[] }) =>
    api.post('/chats', data),
  getById: (id: number) => api.get(`/chats/${id}`),
  update: (id: number, data: { name?: string }) => api.patch(`/chats/${id}`, data),
  delete: (id: number) => api.delete(`/chats/${id}`),
  addMember: (chatId: number, userId: number) =>
    api.post(`/chats/${chatId}/members`, { user_id: userId }),
  removeMember: (chatId: number, userId: number) =>
    api.delete(`/chats/${chatId}/members/${userId}`),
};

export const messagesApi = {
  list: (chatId: number, page = 1, sinceId?: number) =>
    api.get(`/messages/chats/${chatId}/messages`, { params: { page, ...(sinceId !== undefined && { since_id: sinceId }) } }),
  send: (chatId: number, content: string) =>
    api.post(`/messages/chats/${chatId}/messages`, { content }),
  edit: (messageId: number, content: string) =>
    api.patch(`/messages/${messageId}`, { content }),
  delete: (messageId: number) => api.delete(`/messages/${messageId}`),
};

export const tasksApi = {
  list: (params?: { chat_id?: number; status?: string; assigned_to?: number; page?: number }) =>
    api.get('/tasks', { params }),
  create: (data: {
    title: string;
    description?: string;
    status?: string;
    assigned_to?: number;
    chat_id?: number;
  }) => api.post('/tasks', data),
  getById: (id: number) => api.get(`/tasks/${id}`),
  update: (
    id: number,
    data: Partial<{ title: string; description: string; status: string; assigned_to: number }>
  ) => api.patch(`/tasks/${id}`, data),
  delete: (id: number) => api.delete(`/tasks/${id}`),
};

export const notesApi = {
  list: (params?: { page?: number }) => api.get('/notes', { params }),
  create: (data: { title?: string; content: string }) => api.post('/notes', data),
  getById: (id: number) => api.get(`/notes/${id}`),
  update: (id: number, data: Partial<{ title: string; content: string }>) =>
    api.patch(`/notes/${id}`, data),
  delete: (id: number) => api.delete(`/notes/${id}`),
};
