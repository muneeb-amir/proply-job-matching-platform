# Proply

**Match smarter. Pitch faster.**

Proply is an AI-powered freelance job matching platform. It pulls live gigs from Upwork and Freelancer RSS feeds, ranks them against your skills with semantic embeddings (Gemini), and drafts tailored proposals with Groq (Llama 3.3) — with Gemini fallback.

## Key metrics

| Metric | Proply | Baseline |
|--------|--------|----------|
| Match accuracy | **78%** (semantic AI) | 41% (keyword search) |
| Time per proposal | **~3 min** | ~25 min manual |

## Project structure

```
proply--job-matching-platform/
├── backend/          # FastAPI (Python 3.11+)
├── frontend/         # Next.js 14 (App Router, TypeScript)
└── README.md
```

## Prerequisites

- Node.js 18+
- Python 3.11+
- API keys: [Google AI Studio](https://aistudio.google.com/) (Gemini), [Groq](https://console.groq.com/) (recommended for proposals)
- [Supabase](https://supabase.com/) project (for session/job/proposal persistence)

## Environment variables

### Backend (`backend/.env`)

```env
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your_anon_key
GEMINI_API_KEY=your_gemini_key
GROQ_API_KEY=your_groq_key
```

### Supabase setup

1. Create a project at [supabase.com](https://supabase.com/)
2. Open **SQL Editor** and run the contents of `backend/supabase/schema.sql`
3. Copy **Project URL** → `SUPABASE_URL` and **anon public key** → `SUPABASE_ANON_KEY`

The backend saves:
- **user_sessions** on every `/api/match-jobs` call
- **job_matches** for each returned match
- **proposals** on generate (scores filled on score)

If Supabase is not configured, the app still works — persistence is skipped with a log warning.

### Frontend (`frontend/.env.local`)

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

All secrets stay on the backend. The frontend only talks to FastAPI.

## Local setup

### Backend

```bash
cd backend
python -m venv .venv

# Windows
.venv\Scripts\activate

# macOS/Linux
source .venv/bin/activate

pip install -r requirements.txt
# Copy .env and add GEMINI_API_KEY (required) and GROQ_API_KEY (recommended)
uvicorn main:app --reload --port 8000
```

API docs: http://localhost:8000/docs

### Frontend

```bash
cd frontend
npm install
```

**shadcn/ui** (if setting up from scratch):

```bash
npx shadcn@latest init
# Choose: dark theme, slate base color, CSS variables yes

npx shadcn@latest add button card badge progress textarea select separator sheet skeleton toggle input label sonner
```

> Note: shadcn v4 uses **Sonner** instead of the legacy Toast component. Copy success uses `toast.success()` from `sonner`.

```bash
npm run dev
```

App: http://localhost:3000

## API endpoints

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| POST | `/api/match-jobs` | RSS fetch + Gemini embeddings + top 10 matches |
| POST | `/api/generate-proposal` | Groq proposal (Gemini fallback) |
| POST | `/api/score-proposal` | Gemini proposal quality scores |

## Built with

- [Next.js 14](https://nextjs.org/) · [TypeScript](https://www.typescriptlang.org/) · [Tailwind CSS](https://tailwindcss.com/) · [shadcn/ui](https://ui.shadcn.com/)
- [FastAPI](https://fastapi.tiangolo.com/) · [Google Gemini](https://ai.google.dev/) · [Groq / Llama 3.3](https://groq.com/) · [Supabase](https://supabase.com/)

---

Proply © 2026
