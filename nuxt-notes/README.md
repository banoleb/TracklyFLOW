# nuxt-notes

A simple Notes app built with **Nuxt 3** (frontend) + **Flask** (backend API).

## Features

- Register / Login with JWT auth
- Create, view, edit, and delete notes
- Responsive card grid layout
- Persisted login via cookie

## Development

```bash
# 1. Start the Flask backend (from repo root)
cd ../backend
pip install -r requirements.txt
flask db upgrade
python run.py

# 2. Start the Nuxt dev server
cd ../nuxt-notes
cp .env.example .env   # edit API_BASE if needed
npm install
npm run dev            # http://localhost:3001
```

## Docker

```bash
# From repo root
docker compose up --build
# Nuxt Notes → http://localhost:3001
# Flask API  → http://localhost:5000
```

## Environment variables

| Variable   | Default                  | Description          |
|------------|--------------------------|----------------------|
| `API_BASE` | `http://localhost:5000`  | Flask backend URL    |
