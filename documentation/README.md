# AI Interview Simulator — Documentation

**→ [NEXT-STEPS.md](./NEXT-STEPS.md)** — Active implementation prompt. Reference this first when starting a new dev session.

**→ [archive/](./archive/)** — Completed milestone prompts and historical feature handoff docs. When `NEXT-STEPS.md` is replaced, archive the completed prompt here first.

**→ [future-goals/](./future-goals/)** — Deferred product/design features that are worth preserving but are not active implementation targets.

---

The AI Interview Simulator is a voice-first (and planned video-first) interview practice platform. Users configure a mock interview by job role and question type, answer questions verbally, and receive a comprehensive AI-generated feedback report after the session ends — not during. The core loop is: AI asks a question → user answers via microphone → AI transcribes and generates a follow-up → repeat → end of session → full debrief report.

The stack is Next.js (App Router), FastAPI (Python), Supabase (auth + database), Groq (ASR + LLM), ElevenLabs (TTS), ChromaDB (RAG question bank), deployed on Vercel (frontend) + Railway (backend).

---

## Section Index


| #      | Section                                                                    | What it covers                                                            |
| ------ | -------------------------------------------------------------------------- | ------------------------------------------------------------------------- |
| 01     | [Overview](./01-overview/)                                                 | Platform strategy, full tech-stack rationale, annotated project structure |
|        | ↳ [platform-strategy.md](./01-overview/platform-strategy.md)               | What the app is, who uses it, product philosophy, feature scope           |
|        | ↳ [tech-stack.md](./01-overview/tech-stack.md)                             | Every dependency and why it was chosen                                    |
|        | ↳ [project-structure.md](./01-overview/project-structure.md)               | Annotated folder/file tree with per-folder responsibilities               |
| 02     | [Architecture](./02-architecture/)                                         | Data flow, auth flow                                                      |
|        | ↳ [data-flow.md](./02-architecture/data-flow.md)                           | How data moves through the system end-to-end                              |
|        | ↳ [auth-flow.md](./02-architecture/auth-flow.md)                           | Supabase auth, session handling, protected routes                         |
| 03     | [Setup](./03-setup/)                                                       | Local development, environment variables                                  |
|        | ↳ [getting-started.md](./03-setup/getting-started.md)                      | Clone, install, configure, and run the app locally                        |
|        | ↳ [environment-variables.md](./03-setup/environment-variables.md)          | Every required env var explained                                          |
| 04     | [Backend](./04-backend/)                                                   | FastAPI service overview, full API reference                              |
|        | ↳ [overview.md](./04-backend/overview.md)                                  | Backend architecture, modules, deployment                                 |
|        | ↳ [api-reference.md](./04-backend/api-reference.md)                        | Every endpoint: method, params, request/response shapes                   |
| 05     | [Features](./05-features/)                                                 | One spec doc per feature                                                  |
|        | ↳ [01-landing.md](./05-features/01-landing.md)                             | Landing/marketing page                                                    |
|        | ↳ [02-auth.md](./05-features/02-auth.md)                                   | Sign-up, sign-in, session management                                      |
|        | ↳ [03-interview-session.md](./05-features/03-interview-session.md)         | Core interview flow: config, voice recording, AI loop                     |
|        | ↳ [04-post-session-feedback.md](./05-features/04-post-session-feedback.md) | Post-interview debrief report                                             |
|        | ↳ [05-dashboard.md](./05-features/05-dashboard.md)                         | User dashboard: past sessions, progress, start new                        |
| 06     | [Components](./06-components/)                                             | Design system, shadcn/ui conventions, component authoring                 |
|        | ↳ [design-principles.md](./06-components/design-principles.md)             | Tokens, layout patterns, shadcn/ui conventions, responsive rules          |
| 07     | [Conventions](./07-conventions/)                                           | Code style and documentation standards                                    |
|        | ↳ [inline-documentation.md](./07-conventions/inline-documentation.md)     | Inline comment and docstring rules for TypeScript and Python              |
| Future | [future-goals/](./future-goals/)                                           | Deferred features: video interview, resume personalization, analytics     |


---

## Active Implementation Briefs

See [NEXT-STEPS.md](./NEXT-STEPS.md) — current sprint: TTS replacement (ElevenLabs), interview setup screen, post-session feedback.

## Completed Milestones

- [Milestone 01 — Foundation](./archive/MILESTONE-01-FOUNDATION.md): Design system, landing page, route structure, ThemeProvider, fonts
- [Milestone 02 — Auth & Dashboard](./archive/MILESTONE-02-AUTH-DASHBOARD.md): Supabase auth, protected routes, register/login/sign-out, basic dashboard

## Deferred Features

- [Video Interview & Attention Detection](./future-goals/video-interview-attention-detection.md)
- [Resume Personalization](./future-goals/resume-personalization.md)
- [Analytics & Progress Tracking](./future-goals/analytics-progress-tracking.md)

---

## Start Here — Recommended Read Order for New Developers

1. **[01-overview/platform-strategy.md](./01-overview/platform-strategy.md)** — understand what the app is and what problem it solves.
2. **[01-overview/tech-stack.md](./01-overview/tech-stack.md)** — learn every dependency and why it was chosen before writing any code.
3. **[01-overview/project-structure.md](./01-overview/project-structure.md)** — understand where every file type lives before creating files.
4. **[03-setup/getting-started.md](./03-setup/getting-started.md)** — get the app running locally.
5. **[03-setup/environment-variables.md](./03-setup/environment-variables.md)** — configure all required env vars.
6. **[02-architecture/data-flow.md](./02-architecture/data-flow.md)** — understand how data moves between frontend, backend, and external APIs.
7. **[02-architecture/auth-flow.md](./02-architecture/auth-flow.md)** — understand the Supabase auth and session flow before touching any protected route.
8. **[07-conventions/inline-documentation.md](./07-conventions/inline-documentation.md)** — read before writing any code; defines how every file should be commented and documented.
9. **[04-backend/api-reference.md](./04-backend/api-reference.md)** — reference for every API endpoint you will call from the frontend.
10. **[05-features/](./05-features/)** — read the spec doc for the feature you are working on.

