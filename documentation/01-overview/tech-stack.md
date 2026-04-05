# Tech Stack

> **Installation status:** This document reflects the planned and current stack. The prototype uses a subset of this stack. See [`03-setup/getting-started.md`](../03-setup/getting-started.md) for local install and runtime setup.

---

## Frontend Framework

| Package | Version | Purpose | Why chosen |
|---------|---------|---------|------------|
| `next` | 15+ | Full-stack React framework — routing, SSR, API routes, middleware | Industry standard for React full-stack apps. App Router gives us server components, route groups for auth/app shell separation, and middleware for protected routes. Native Vercel deployment. |
| `react` / `react-dom` | 19 | UI rendering | Ships with Next.js 15+. React 19 adds the React Compiler and improved Server Component ergonomics. |
| `typescript` | 5 | Static typing | Strict mode throughout. Shared types define the contract between frontend components and backend API responses. |
| `tailwindcss` | v4 | Utility-first CSS | Pairs natively with shadcn/ui. No CSS-in-JS runtime cost. Composable with all component primitives. |

---

## UI Components

| Package | Purpose | Why chosen |
|---------|---------|------------|
| `shadcn/ui` | Base component library: Button, Input, Card, Badge, Dialog, Select, Skeleton, etc. | Components are copied directly into the repo (`components/ui/`) — full ownership, no version lock-in, no library upgrade breaking changes. Built on Tailwind so everything composes with utility classes. |
| `@radix-ui/*` | Headless primitives underlying shadcn/ui | Accessibility is handled out of the box: focus traps, ARIA attributes, keyboard navigation. We get compliant interactive components without building them from scratch. |

---

## Authentication & Database

| Package / Service | Purpose | Why chosen |
|---------|---------|------------|
| **Supabase** | Auth (email/password), PostgreSQL database, file storage | PostgreSQL is better suited than Firestore for this app's relational data model (users → sessions → messages → reports). Supabase has first-class Vercel integration, built-in Row-Level Security, and a generous free tier. Single platform for auth + DB + storage. |
| `@supabase/supabase-js` | Supabase client SDK for the browser | Official client. Used in client components for auth state, real-time subscriptions if needed. |
| `@supabase/ssr` | Supabase server helpers for Next.js App Router | Handles cookie-based session management for Server Components, middleware, and API routes. Required for SSR-compatible auth. |

---

## AI / Speech Services

| Service | API | Purpose | Why chosen |
|---------|---------|---------|------------|
| **Groq** | `whisper-large-v3` | Speech-to-Text (ASR) — transcribes user's audio answer | Already working in prototype. Groq's inference is fast (low latency matters in an interactive loop). `whisper-large-v3` is highly accurate. |
| **Groq** | `llama-3.1-8b-instant` (or `llama-3.3-70b`) | LLM — generates follow-up questions and post-session feedback | Already working. Fast inference. Can upgrade to a larger model for better feedback quality. |
| **ElevenLabs** | Text-to-Speech API | Converts AI interviewer text to audio — played back to user | Replaces the macOS `say` command from the prototype. Cloud-based, high-quality voice, deployable anywhere. Critical for production. |

> **Note on TTS:** The prototype uses macOS `say` + ffmpeg. This is macOS-only and will not work on any cloud deployment (Railway, Render, etc.). ElevenLabs is the planned replacement. OpenAI TTS is an acceptable alternative if ElevenLabs is unavailable.

---

## Backend

| Package | Purpose | Why chosen |
|---------|---------|------------|
| `fastapi` | Python web framework for the AI backend | Already in use. Python is the right runtime for audio processing and AI/ML libraries. FastAPI is fast, async, and has excellent OpenAPI docs auto-generation. |
| `uvicorn` | ASGI server for FastAPI | Standard production server for FastAPI. |
| `groq` (Python SDK) | Calls Groq ASR + LLM APIs | Official SDK. Used for both Whisper transcription and LLaMA chat completions. |
| `elevenlabs` (Python SDK) | Calls ElevenLabs TTS API | Official SDK. Replaces the subprocess call to `say`. |
| `chromadb` | Vector database for RAG question bank | Already in use. Stores interview questions as embeddings; retrieves semantically relevant questions for a given job role/topic. |
| `python-dotenv` | Loads `.env` file into environment | Standard for local development config. |
| `ffmpeg` | Audio conversion (`.webm` → `.mp3`) | Browser records in `.webm`; Groq Whisper requires `.mp3`. ffmpeg handles the conversion. Must be installed on the deployment server. |

---

## Forms & Validation

| Package | Purpose | Why chosen |
|---------|---------|------------|
| `zod` | Schema validation for forms and API response shapes | TypeScript-first — schemas produce inferred types directly. Used for interview configuration forms, auth forms, and validating API response shapes on the frontend. |
| `react-hook-form` | Form state management | Minimal re-renders, integrates cleanly with Zod via `@hookform/resolvers`. Used for auth forms and interview setup form. |

---

## State Management

| Package | Purpose | Why chosen |
|---------|---------|------------|
| `zustand` | Global client-side state: auth session, active interview state, UI flags | Minimal boilerplate. Used only for client-side state that must be shared across the component tree. Server data stays in React Query or server components. |
| `@tanstack/react-query` | Server state: fetching, caching, mutations | Used for dashboard data (session history), report fetching. Excellent devtools. |

---

## Deployment

| Service | Hosts | Why chosen |
|---------|---------|------------|
| **Vercel** | Next.js frontend | Native Next.js deployment. Zero-config. Edge middleware support. Automatic preview deployments per branch. |
| **Railway** | FastAPI backend | Supports Docker + Python runtimes. GitHub deploy, automatic restarts, persistent file system for audio temp files. Straightforward environment variable management. |
| **Supabase** | Database, Auth, Storage | Managed PostgreSQL. No infrastructure to provision. Connects to both Vercel (frontend) and Railway (backend) via connection string and service role key. |

---

## What Is Not Here (and Why)

| Excluded | Reason |
|----------|--------|
| Firebase | No need for RTDB real-time chat or Firestore. Supabase PostgreSQL is better suited for relational interview session data. |
| Redux | Zustand covers the use case with far less boilerplate. |
| CSS-in-JS (Emotion, styled-components) | Tailwind v4 covers all styling. CSS-in-JS adds runtime cost and conflicts with shadcn/ui. |
| GraphQL | All backend communication goes through REST endpoints on the FastAPI service. No GraphQL layer needed. |
| macOS `say` | macOS-only. Replaced by ElevenLabs for cloud compatibility. |
| Prisma / Drizzle | Supabase is accessed via its JS client SDK and the Python `supabase` library, not an ORM. The Supabase client handles query building. |
