# Project Structure

> **Current state:** The landing page, design system, and route structure have been built. The frontend now has a proper component hierarchy, theme system (dark/light), and marketing page. The interview prototype has been moved to `/interview`. Auth, dashboard, and post-session feedback are still planned.
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
│   │
│   ├── public/                            Static assets served at /
│   │
│   └── src/
│       │
│       ├── middleware.ts                   [planned] Route protection: redirects unauthenticated
│       │                                   users from (app) routes to /login
│       │
│       ├── app/                            Next.js App Router root
│       │   ├── layout.tsx                  Root layout — mounts ThemeProvider; loads Geist Sans,
│       │   │                               Geist Mono, Plus Jakarta Sans; sets metadata
│       │   ├── globals.css                 Design token system (light/dark CSS vars), @theme inline
│       │   │                               mappings for Tailwind, base resets, animation classes
│       │   ├── favicon.ico
│       │   │
│       │   ├── page.tsx                    ✅ Landing/marketing page at /
│       │   │                               Composes: LandingNav, LandingHero, HowItWorks,
│       │   │                               FeatureGrid, LandingCTA, LandingFooter
│       │   │
│       │   ├── interview/
│       │   │   └── page.tsx                ✅ URL: /interview — prototype interview session
│       │   │                               (voice recording, transcript, AI audio playback)
│       │   │                               Temporary home until auth + setup flow is built
│       │   │
│       │   ├── (auth)/                     [planned] Public auth route group — no app shell
│       │   │   ├── layout.tsx              Centered auth layout with brand logo
│       │   │   ├── login/page.tsx          URL: /login
│       │   │   └── signup/page.tsx         URL: /signup
│       │   │
│       │   ├── (app)/                      [planned] Authenticated application route group
│       │   │   ├── layout.tsx              Protected layout — verifies session, renders AppShell
│       │   │   │
│       │   │   ├── dashboard/page.tsx      [planned] URL: /dashboard
│       │   │   │
│       │   │   └── interview/              [planned] Will replace current /interview prototype
│       │   │       ├── setup/page.tsx      URL: /interview/setup — configuration form
│       │   │       └── [sessionId]/
│       │   │           └── page.tsx        URL: /interview/:sessionId — active session
│       │   │
│       │   └── report/
│       │       └── [sessionId]/page.tsx    [planned] URL: /report/:sessionId — feedback report
│       │
│       ├── components/
│       │   ├── ui/                         [planned] shadcn/ui primitives — add via
│       │   │                               `npx shadcn@latest add <component>`
│       │   │
│       │   ├── shared/                     App-wide layout and branding components
│       │   │   ├── ThemeToggle.tsx         ✅ Sun/Moon toggle button (next-themes)
│       │   │   ├── AppShell.tsx            [planned] Authenticated shell: sidebar + topbar
│       │   │   ├── Sidebar.tsx             [planned] Desktop navigation sidebar
│       │   │   ├── Topbar.tsx              [planned] Top bar: mobile menu, user menu
│       │   │   └── BrandLogo.tsx           [planned] Theme-aware logo component
│       │   │
│       │   ├── providers/                  Top-level client providers
│       │   │   ├── ThemeProvider.tsx       ✅ next-themes wrapper (defaultTheme="dark")
│       │   │   ├── SupabaseProvider.tsx    [planned] Supabase client + auth state seeding
│       │   │   └── QueryProvider.tsx       [planned] React Query provider
│       │   │
│       │   ├── marketing/                  Public landing-page components
│       │   │   ├── LandingNav.tsx          ✅ Sticky nav: logo, anchor links, ThemeToggle, CTAs
│       │   │   ├── LandingHero.tsx         ✅ Hero: badge, headline, subtitle, CTAs, mock
│       │   │   │                           interview card with animated typing indicator
│       │   │   ├── HowItWorks.tsx          ✅ 3-step section with numbered icons
│       │   │   ├── FeatureGrid.tsx         ✅ 6-card feature highlights grid
│       │   │   ├── LandingCTA.tsx          ✅ Bottom CTA section with glow effect
│       │   │   └── LandingFooter.tsx       ✅ Footer: logo, links, copyright
│       │   │
│       │   └── features/                   [planned] Feature-scoped UI components
│       │       ├── auth/
│       │       │   ├── LoginForm.tsx       [planned]
│       │       │   └── SignupForm.tsx      [planned]
│       │       │
│       │       ├── interview/
│       │       │   ├── SetupForm.tsx       [planned] Job role / type / difficulty config form
│       │       │   ├── MicButton.tsx       [planned → refactor from prototype]
│       │       │   ├── MessageFeed.tsx     [planned → refactor from prototype]
│       │       │   └── AudioPlayer.tsx     [planned]
│       │       │
│       │       ├── report/
│       │       │   ├── ScoreCard.tsx       [planned]
│       │       │   ├── TranscriptView.tsx  [planned]
│       │       │   └── SuggestionList.tsx  [planned]
│       │       │
│       │       └── dashboard/
│       │           ├── SessionCard.tsx     [planned]
│       │           └── ScoreTrend.tsx      [planned — future]
│       │
│       ├── lib/                            Non-component logic
│       │   ├── utils.ts                    ✅ cn() helper (clsx + tailwind-merge)
│       │   │
│       │   ├── supabase/
│       │   │   ├── client.ts               [planned] Supabase browser client
│       │   │   └── server.ts               [planned] Supabase server client (SSR/middleware)
│       │   │
│       │   ├── services/
│       │   │   ├── interview.service.ts    [planned] API calls to FastAPI backend
│       │   │   ├── report.service.ts       [planned] Fetch feedback report
│       │   │   └── session.service.ts      [planned] Fetch session history
│       │   │
│       │   ├── hooks/
│       │   │   ├── use-audio-recorder.ts   [planned] MediaRecorder abstraction
│       │   │   └── use-interview-state.ts  [planned] Active interview state machine
│       │   │
│       │   └── validations/
│       │       ├── auth.schema.ts          [planned] Zod schemas for login/signup
│       │       └── interview.schema.ts     [planned] Zod schema for interview setup form
│       │
│       ├── store/
│       │   ├── auth-store.ts               [planned] Supabase auth session state
│       │   └── interview-store.ts          [planned] Active session state
│       │
│       └── types/
│           └── index.ts                    [planned] Shared TypeScript models
│
└── backend/                                FastAPI (Python) service
    ├── main.py                             ✅ FastAPI app, CORS config, route registration
    ├── asr.py                              ✅ Groq Whisper transcription
    ├── llm.py                              ✅ Groq LLaMA — follow-up generation
    ├── tts.py                              ⚠️  macOS say + ffmpeg — replace with ElevenLabs
    ├── rag.py                              ✅ ChromaDB question bank retrieval
    ├── requirements.txt                    Python dependencies
    ├── .env.example                        Required env var template
    ├── .env                                Local env (gitignored)
    └── data/
        ├── starter_questions.json          ✅ Seed question bank (4 questions — needs expansion)
        └── chroma_db/                      ChromaDB persistent storage (gitignored in production)
```

---

## Status Key

| Symbol | Meaning |
|---|---|
| ✅ | Built and working |
| ⚠️ | Exists but needs replacement/refactor before production |
| `[planned]` | Not yet built |
| `[planned → refactor]` | Logic exists in prototype; needs to be extracted into a proper component |

---

## Top-Level Folder Responsibilities

### `frontend/src/app/`
The App Router layer. Every file here is a page, a layout, a special Next.js file, or an API route. Keep business logic out of this layer: pages should orchestrate data loading and render composition, then defer actual behavior to `components/`, `lib/`, and `store/`.

Route groups (when auth is added):
- `(auth)` — public auth pages with a minimal centered layout and no app chrome.
- `(app)` — authenticated routes with the full sidebar/topbar shell.
- `report/` — sits outside `(app)` so the feedback report can be made shareable in the future.

### `frontend/src/components/`
React UI only. Split by responsibility:
- `ui/` for shadcn/ui primitive building blocks — never write custom styles here, add via CLI only
- `shared/` for cross-feature shell, branding, and utility components (e.g. `ThemeToggle`)
- `providers/` for top-level client providers
- `marketing/` for public landing page sections
- `features/` for feature-local UI — if a component is needed across unrelated features, move it to `shared/`

### `frontend/src/lib/`
All non-visual logic: Supabase client/server bootstrapping, service wrappers around the FastAPI backend, reusable hooks with real behavioral responsibility, validation schemas, and the `cn()` utility.

### `frontend/src/store/`
Zustand stores for client-global concerns only. State local to one screen stays in local component state. Planned stores are intentionally narrow: auth session and active interview state.

### `backend/`
FastAPI Python service. Handles all AI integration: audio → ASR → LLM → TTS. Stateless between requests. Temporary audio files written to disk during a request and cleaned up after. The `tts.py` module must be replaced with ElevenLabs before any cloud deployment.
