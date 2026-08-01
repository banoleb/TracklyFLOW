# TracklyFlow

A full-featured web chat messenger with real-time messaging, team management, and task tracking.

## Stack

| Layer | Technology |
|-------|-----------|
| Backend | Python 3.11, Flask, Flask-SocketIO |
| Database | SQLite (dev) / PostgreSQL (prod) via SQLAlchemy |
| Auth | JWT (access + refresh tokens) |
| Frontend | React 18, TypeScript, Zustand |
| Real-time | Socket.IO |
| Deploy | Docker + Docker Compose |

---

## Features

- 🔐 JWT authentication (register, login, logout, token refresh)
- 💬 Personal, group, and channel chats
- ⚡ Real-time messaging via WebSockets
- ✏️ Edit and delete messages
- 👥 Chat member management (add/remove, roles: owner/admin/member)
- 📋 Task tracking per chat (todo / in_progress / review / done)
- 🖼️ Avatar upload
- 🔍 User search

---

## Quick Start

### Using Docker Compose

```bash
cp backend/.env.example backend/.env   # edit secrets
docker compose up --build
```

- Frontend → http://localhost:3000
- Backend API → http://localhost:5000/api

---

### Manual development setup

#### Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env           # edit as needed

flask db init
flask db migrate -m "initial"
flask db upgrade

python run.py
```

#### Frontend

```bash
cd frontend
cp .env.example .env           # edit REACT_APP_API_URL if needed
npm install
npm start
```

---

## API Reference

### Auth

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/auth/register` | Register new user |
| POST | `/api/auth/login` | Login (email or username) |
| DELETE | `/api/auth/logout` | Logout (revoke token) |
| POST | `/api/auth/refresh` | Refresh access token |
| GET | `/api/auth/me` | Get current user |

### Users

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/users?q=` | Search users |
| GET | `/api/users/:id` | Get user by ID |
| PATCH | `/api/users/me` | Update profile |
| POST | `/api/users/me/avatar` | Upload avatar |

### Chats

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/chats` | List my chats |
| POST | `/api/chats` | Create chat |
| GET | `/api/chats/:id` | Get chat details |
| PATCH | `/api/chats/:id` | Update chat |
| DELETE | `/api/chats/:id` | Delete chat |
| POST | `/api/chats/:id/members` | Add member |
| DELETE | `/api/chats/:id/members/:uid` | Remove member |

### Messages

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/messages/chats/:id/messages` | List messages (paginated) |
| POST | `/api/messages/chats/:id/messages` | Send message |
| PATCH | `/api/messages/:id` | Edit message |
| DELETE | `/api/messages/:id` | Delete message |

### Tasks

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/tasks` | List tasks |
| POST | `/api/tasks` | Create task |
| GET | `/api/tasks/:id` | Get task |
| PATCH | `/api/tasks/:id` | Update task |
| DELETE | `/api/tasks/:id` | Delete task |

---

## WebSocket Events

### Client → Server

| Event | Payload | Description |
|-------|---------|-------------|
| `join_chat` | `{ chat_id }` | Subscribe to chat room |
| `leave_chat` | `{ chat_id }` | Unsubscribe from chat room |
| `typing` | `{ chat_id }` | Broadcast typing indicator |
| `stop_typing` | `{ chat_id }` | Stop typing indicator |

### Server → Client

| Event | Payload | Description |
|-------|---------|-------------|
| `new_message` | Message object | New message in room |
| `message_updated` | Message object | Edited message |
| `message_deleted` | `{ message_id, chat_id }` | Deleted message |
| `user_typing` | `{ chat_id, user_id }` | Someone is typing |
| `user_stop_typing` | `{ chat_id, user_id }` | Typing stopped |

---

## Data Models

```
User         id, username, email, password_hash, avatar, created_at
Chat         id, name, type (personal|group|channel), created_at
ChatMember   id, chat_id, user_id, role (owner|admin|member), joined_at
Message      id, chat_id, user_id, content, created_at, updated_at
Task         id, title, description, status, assigned_to, created_by, chat_id, created_at, updated_at
```

---

## Project Structure

```
TracklyFLOW/
├── backend/
│   ├── app/
│   │   ├── __init__.py          # App factory
│   │   ├── config.py            # Configuration
│   │   ├── extensions.py        # Flask extensions
│   │   ├── sockets.py           # WebSocket event handlers
│   │   ├── models/
│   │   │   ├── user.py
│   │   │   ├── chat.py
│   │   │   ├── message.py
│   │   │   └── task.py
│   │   ├── routes/
│   │   │   ├── auth.py
│   │   │   ├── users.py
│   │   │   ├── chats.py
│   │   │   ├── messages.py
│   │   │   └── tasks.py
│   │   └── utils/
│   │       ├── jwt_utils.py     # Token blocklist + revocation
│   │       └── response.py      # JSON helpers
│   ├── requirements.txt
│   ├── run.py
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── api/index.ts         # Axios client + all API calls
│   │   ├── store/               # Zustand state stores
│   │   ├── components/          # React components
│   │   ├── pages/               # Page components
│   │   ├── types/               # TypeScript interfaces
│   │   └── utils/socket.ts      # Socket.IO client
│   └── Dockerfile
└── docker-compose.yml
```