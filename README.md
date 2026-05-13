# MagineAI — AI-Powered Personalized Magazine & Story Generator

Full-stack platform that collects reader preferences, generates story text and illustrations with Google Gemini/Imagen, moderates content, renders a magazine-style preview, and lets users download and provide feedback. Frontend is a Next.js + Tailwind glassmorphism UI; backend is Express with Supabase + JWT auth and rate limiting; deployable to Cloud Run + Firebase Hosting.

## Structure
- `frontend/` — Next.js 14 App Router UI with Tailwind, magazine preview, PDF download, feedback and admin screens.
- `backend/` — Express API with Gemini/Imagen stubs, moderation, Supabase persistence, JWT auth, and rate limiting.

## Getting Started
### Prerequisites
- Node 18+
- Supabase project (or Postgres) with the tables defined below.
- Google Gemini API key ([Get one here](https://makersuite.google.com/app/apikey))

### Quick Setup
```bash
# Frontend
cd frontend
npm install
npm run dev

# Backend (in a separate terminal)
cd backend
npm install
npm run dev
```

### Detailed Setup
**See [SETUP.md](./SETUP.md) for complete setup instructions including:**
- Environment variable configuration
- Supabase database schema setup
- API key configuration
- Testing and troubleshooting

### API Overview
- `POST /generate` — Generate story + images with moderation and persist to Supabase.
- `GET /content/:id` — Fetch generated content by id.
- `POST /feedback` — Store feedback.
- `POST /admin/moderate` — Approve/reject content (admin JWT required).
- `POST /auth/login` — Admin login (returns JWT).

### Supabase Tables
- `users(id, name, email, password_hash, role, created_at)`
- `preferences(id, user_id, age, genre, theme, keywords, language, created_at)`
- `generated_content(id, user_id, text_content, image_urls, status, created_at)`
- `feedback(id, content_id, user_id, rating, comment, created_at)`
- `admins(id, username, password_hash, role)`

### Deployment
- Backend: build container and deploy to Cloud Run; add env vars and service account with access to Gemini/Imagen APIs.
- Frontend: deploy with Firebase Hosting or Vercel; configure `NEXT_PUBLIC_API_BASE_URL`.
- Storage: configure Supabase Storage or Cloud Storage bucket; set CORS for image fetches.

### Notes
- AI calls are stubbed behind `services/ai.ts`; wire to Gemini/Imagen SDKs or REST APIs.
- Moderation retries up to two times; rejects unsafe content with a clear error.
- Glassmorphism theme uses the primary brand color defined in `tailwind.config.ts`.
