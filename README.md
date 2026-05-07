# DevSchool Pro - Separated Full-Stack Setup

`frontend/` and `backend/` are the active source of truth for this project. Each app can be run independently from its folder.

## Folder Structure

```text
/
|-- frontend/              # React + Vite app
|   |-- public/
|   |-- src/
|   |-- .env.example
|   `-- package.json
|-- backend/               # Express API
|   |-- src/
|   |-- .env.example
|   `-- package.json
```

## Quick Start

Run each app from its directory:

```bash
cd backend
npm install
npm run dev
```

In another terminal:

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

That starts:
- frontend at `http://localhost:5173`
- backend at `http://localhost:4000`

You can also run each app independently.

## Frontend Setup

```bash
cd frontend
npm install
cp .env.example .env
npm run dev
```

Frontend uses:
- `VITE_API_URL=http://localhost:4000`
- optional Supabase browser keys for auth

## Backend Setup

```bash
cd backend
npm install
cp .env.example .env
npm run dev
```

Backend runs on `http://localhost:4000`.

Example endpoints:
- `GET /api/health`
- `GET /api/daily-plan`
- `GET /api/quiz/random`
- `GET /api/dashboard/overview`
- `POST /api/dashboard/overview/sync`
- `POST /api/tutor`

## Integration Details

- Frontend content and UI live under `frontend/src/`.
- Backend reads lesson quiz content from `frontend/src/content/` so the split frontend stays the content source.
- Backend CORS is configurable through `backend/.env`.
- Root scripts proxy into `frontend/` and `backend/`; do not rely on legacy root app files for active development.

## Notes

- Both projects are independently runnable.
- Frontend is a Vite React app with routing, Supabase-ready auth, and PWA assets.
- Backend exposes learning, quiz, dashboard, and tutor APIs.
