# Project Structure

> **Current state:** The repository contains a working prototype — a single-page Next.js frontend and a FastAPI backend with ASR, LLM, TTS, and RAG modules. The structure below reflects the **target architecture** after the first development sprint, not the current prototype state. Sections marked `[prototype]` exist now; sections marked `[planned]` are to be built.
>
> **Note on `src/`:** The frontend uses the `src/` wrapper and the `@` import alias points to `src/`. All first-class application folders (`app/`, `components/`, `lib/`, `store/`, `types/`) live under `src/`.

---

## Annotated Folder Tree

```text
AI-Powered-Interactive-Interview-Simulator/
│
├── README.md                              Repo-level quick start
├── documentation/                         All product, architecture, and feature docs
│   └── (see documentation/README.md)
│
├── frontend/                              Next.js application
│   ├── next.config.ts                     Next.js config
│   ├── package.json                       Frontend dependencies
│   ├── tsconfig.json                      TypeScript compiler config
│   ├── tailwind.config.ts                 Tailwind v4 config
│   ├── components.json                    shadcn/ui config
│   │
│   ├── public/                            Static assets served at /
│   │   └── branding/                      Logo and brand assets
│   │
│   └── src/
│       │
│       ├── middleware.ts                   [planned] Route protection: redirects unauthenticated
│       │                                   users from (app) routes to /login
│       │
│       ├── app/                            Next.js App Router root
│       │   ├── layout.tsx                  Root layout — mounts providers (Supabase, React Query,
│       │   │                               Zustand hydration)
│       │   ├── globals.css                 Global theme tokens, Tailwind theme mapping
│       │   ├── favicon.ico
│       │   │
│       │   ├── page.tsx                    [planned] Public landing/marketing page at /
│       │   │
│       │   ├── (auth)/                     [planned] Public auth route group — no app shell
│       │   │   ├── layout.tsx              Centered auth layout with brand logo
│       │   │   ├── login/page.tsx          URL: /login
│       │   │   └── signup/page.tsx         URL: /signup
│       │   │
│       │   ├── (app)/                      [planned] Authenticated application route group
│       │   │   ├── layout.tsx              Protected layout — verifies session, renders AppShell
│       │   │   │
│       │   │   ├── dashboard/page.tsx      [planned] URL: /dashboard — past sessions, score
│       │   │   │                           summary, start new interview CTA
│       │   │   │
│       │   │   └── interview/              [planned] Interview flow
│       │   │       ├── setup/page.tsx      URL: /interview/setup — configuration: job role,
│       │   │       │                       question type, difficulty
│       │   │       └── [sessionId]/
│       │   │           └── page.tsx        URL: /interview/:sessionId — active interview session
│       │   │                               with mic recording, transcript, AI audio playback
│       │   │
│       │   └── report/
│       │       └── [sessionId]/page.tsx    [planned] URL: /report/:sessionId — post-session
│       │                                   feedback report (scores, transcript, suggestions)
│       │
│       ├── components/
│       │   ├── ui/                         shadcn/ui primitives (Button, Card, Input, Badge,
│       │   │                               Skeleton, Dialog, Select, Separator, Avatar, etc.)
│       │   │                               Never modify these manually — use `npx shadcn add`.
│       │   │
│       │   ├── shared/                     App-wide layout and branding components
│       │   │   ├── AppShell.tsx            [planned] Authenticated shell: sidebar + topbar
│       │   │   ├── Sidebar.tsx             [planned] Desktop navigation sidebar
│       │   │   ├── Topbar.tsx              [planned] Top bar: mobile menu, user menu
│       │   │   └── BrandLogo.tsx           [planned] Theme-aware logo component
│       │   │
│       │   ├── providers/                  Top-level client providers
│       │   │   ├── SupabaseProvider.tsx    [planned] Supabase client + auth state seeding
│       │   │   └── QueryProvider.tsx       [planned] React Query provider
│       │   │
│       │   ├── marketing/                  Public landing-page components
│       │   │   ├── LandingHero.tsx         [planned] Hero section and CTA
│       │   │   └── FeatureGrid.tsx         [planned] Feature highlights grid
│       │   │
│       │   └── features/                   Feature-scoped UI components
│       │       ├── auth/
│       │       │   ├── LoginForm.tsx       [planned]
│       │       │   └── SignupForm.tsx      [planned]
│       │       │
│       │       ├── interview/
│       │       │   ├── SetupForm.tsx       [planned] Job role / type / difficulty config form
│       │       │   ├── MicButton.tsx       [prototype → refactor] Recording trigger button
│       │       │   ├── MessageFeed.tsx     [prototype → refactor] Q&A transcript display
│       │       │   └── AudioPlayer.tsx     [planned] Plays back AI TTS audio response
│       │       │
│       │       ├── report/
│       │       │   ├── ScoreCard.tsx       [planned] Per-dimension score display
│       │       │   ├── TranscriptView.tsx  [planned] Full session transcript with Q&A pairs
│       │       │   └── SuggestionList.tsx  [planned] AI improvement suggestions
│       │       │
│       │       └── dashboard/
│       │           ├── SessionCard.tsx     [planned] Past session summary card
│       │           └── ScoreTrend.tsx      [planned] Score trend chart (future)
│       │
│       ├── lib/                            Non-component logic
│       │   ├── supabase/
│       │   │   ├── client.ts               [planned] Supabase browser client
│       │   │   └── server.ts               [planned] Supabase server client (SSR/middleware)
│       │   │
│       │   ├── services/
│       │   │   ├── interview.service.ts    [planned] API calls: start session, submit audio, end session
│       │   │   ├── report.service.ts       [planned] Fetch feedback report by sessionId
│       │   │   └── session.service.ts      [planned] Fetch session history for dashboard
│       │   │
│       │   ├── hooks/
│       │   │   ├── use-audio-recorder.ts   [planned] MediaRecorder abstraction hook
│       │   │   └── use-interview-state.ts  [planned] Active interview state machine hook
│       │   │
│       │   ├── validations/
│       │   │   ├── auth.schema.ts          [planned] Zod schemas for login/signup
│       │   │   └── interview.schema.ts     [planned] Zod schema for interview setup form
│       │   │
│       │   └── utils.ts                    Generic utility helpers
│       │
│       ├── store/
│       │   ├── auth-store.ts               [planned] Supabase auth session state (user, loading)
│       │   └── interview-store.ts          [planned] Active session state: messages, sessionId,
│       │                                   isRecording, isLoading
│       │
│       └── types/
│           └── index.ts                    [planned] Shared TypeScript models: InterviewSession,
│                                           SessionMessage, FeedbackReport, UserProfile
│
└── backend/                                FastAPI (Python) service
    ├── main.py                             [prototype] FastAPI app, CORS config, route registration
    ├── asr.py                              [prototype] Groq Whisper transcription
    ├── llm.py                              [prototype] Groq LLaMA — follow-up generation + feedback
    ├── tts.py                              [prototype → replace] TTS — macOS say → ElevenLabs
    ├── rag.py                              [prototype] ChromaDB question bank retrieval
    ├── requirements.txt                    Python dependencies
    ├── .env.example                        Required env var template
    ├── .env                                Local env (gitignored)
    └── data/
        ├── starter_questions.json          [prototype] Seed question bank (4 questions → expand)
        └── chroma_db/                      ChromaDB persistent storage (gitignored in production)
```

---

## Top-Level Folder Responsibilities

### `frontend/src/app/`
The App Router layer. Every file here is a page, a layout, a special Next.js file, or an API route. Keep business logic out of this layer: pages should orchestrate data loading and render composition, then defer actual behavior to `components/`, `lib/`, and `store/`.

Route groups:
- `(auth)` — public auth pages with a minimal centered layout and no app chrome.
- `(app)` — authenticated routes with the full sidebar/topbar shell.
- `report/` — sits outside `(app)` so the feedback report can be shared publicly in the future (no auth wall for a shared link).

### `frontend/src/components/`
React UI only. Split by responsibility:
- `ui/` for shadcn/ui primitive building blocks — never write custom styles here, never commit manual edits to generated files
- `shared/` for cross-feature shell and branding pieces
- `providers/` for top-level client providers
- `marketing/` for public landing page content
- `features/` for feature-local UI — import outward carefully; if a component is needed in two unrelated features, it belongs in `shared/` or `ui/`

### `frontend/src/lib/`
All non-visual logic: Supabase client/server bootstrapping, service wrappers around backend API calls, reusable hooks with behavioral responsibility, validation schemas, utilities.

This is the layer that should absorb integration complexity so components stay readable.

### `frontend/src/store/`
Zustand stores for client-global concerns only. If state is local to one screen or one feature component tree, keep it in local component state. Stores are intentionally narrow: auth and active interview session.

### `backend/`
FastAPI Python service. Handles all AI integration: audio → ASR → LLM → TTS. This service is stateless between requests (session state lives in Supabase). Temporary audio files are written to disk during a request and cleaned up after.
