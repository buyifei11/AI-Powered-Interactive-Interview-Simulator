# Inline Code Documentation Standards

## Purpose

This document is the authoritative standard for how code is documented inline across the entire codebase — frontend (TypeScript / React) and backend (Python / FastAPI).

**This file is designed to be passed as context to any AI coding session.** When writing or reviewing code in this project, follow these rules exactly. Consistent documentation makes every file understandable in isolation, makes AI-assisted development more reliable, and keeps PR reviews fast.

---

## Core Philosophy

**Comment intent, not implementation.**

Comments explain *why* something is done, not *what* the code does. If you can understand the code by reading it, do not add a comment. Reserve comments for:

- Non-obvious decisions ("We delay X because Y causes a race condition")
- Important constraints ("Must run after Z is initialized")
- External API quirks ("Groq returns audio as base64, not binary")
- Business logic that variable names cannot convey

**These patterns are explicitly banned — remove them on sight:**

```typescript
// Import the component
// Define the function
// Handle the error
// Return the result
// Increment the counter
```

```python
# Import libraries
# Define the function
# Return the result
```

---

## TypeScript / React (Frontend)

### 1. File Header

Every file must begin with a 1–3 line `//` comment block describing what the file exports and what it is responsible for. This comment is the first thing in the file, before any imports.

```typescript
// RegisterForm — sign-up form component.
// Collects first name, last name, email, and password (confirmed twice).
// Validates with Zod, submits via supabase.auth.signUp(), and inserts a profiles row.
```

```typescript
// createBrowserClient — Supabase client factory for Client Components.
// Do not use this in Server Components or middleware; use createServerClient instead.
```

**Format:** Plain `//` comment, no JSDoc block, 1–3 lines. Answer: *"What is this file responsible for?"*

---

### 2. Component Props (Interface / Type)

Comment interface properties only when the name alone is insufficient.

```typescript
interface InterviewCardProps {
  sessionId: string;
  /** ISO 8601 string — formatted client-side to avoid server/client hydration mismatch. */
  createdAt: string;
  /** Number of questions answered, not the total bank size. */
  questionCount: number;
  /** undefined until the feedback report has been generated for this session. */
  score?: number;
  className?: string; // self-documenting — no comment needed
}
```

**Do not comment** self-documenting props: `isLoading: boolean`, `className?: string`, `children: React.ReactNode`, `onClick: () => void`.

---

### 3. Exported Functions and Hooks

Use a TSDoc block (`/** */`) for all exported functions and hooks when their behavior is not immediately obvious.

```typescript
/**
 * Creates a Supabase browser client for use in Client Components.
 * Reads NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY from env.
 */
export function createBrowserClient() { ... }
```

```typescript
/**
 * Returns the authenticated user and a hydration loading flag.
 * `user` is null during the initial session check — always guard against this.
 *
 * @returns `{ user, loading }` — loading is true until the session resolves.
 */
export function useCurrentUser(): { user: User | null; loading: boolean } { ... }
```

**Skip the TSDoc block** for trivial wrappers and one-liners where the function name is fully self-explanatory.

---

### 4. Inline Logic Comments

Only add `//` comments inside function bodies for logic that would genuinely surprise a competent developer reading it cold.

```typescript
// supabase.auth.signUp() does not throw on duplicate email — it returns an error object.
// We check error.code explicitly to surface the right message to the user.
if (error?.code === "user_already_exists") { ... }
```

```typescript
// router.refresh() must be called after sign-out to force the middleware to
// re-evaluate the session cookie, triggering the redirect to /login.
router.refresh();
```

```typescript
// Delay is intentional — ElevenLabs streams audio in chunks and the first
// chunk is not available until ~300ms after the request resolves.
await new Promise((resolve) => setTimeout(resolve, 300));
```

---

### 5. Error Handling

Comment when the error shape, source, or subset is non-obvious.

```typescript
const { error } = await supabase.auth.signIn(credentials);
// Supabase Auth error.message is user-safe for authentication errors.
if (error) setFormError(error.message);
```

```typescript
try {
  await fetchTranscript(audioBlob);
} catch (err) {
  // Network errors from the FastAPI backend surface as generic fetch failures.
  // Do not expose raw error messages to the user — show a generic retry prompt.
  setError("Something went wrong. Please try again.");
}
```

---

### 6. Constants and Config

Comment non-obvious magic values.

```typescript
const MAX_RECORDING_MS = 120_000; // 2 minutes — enforced to prevent runaway audio files
const FEEDBACK_DELAY_MS = 500;    // Gives the DB write time to flush before the read
```

---

## Python (Backend)

### 1. Module-Level Docstring

Every Python file must start with a triple-quoted docstring **before any imports**. One summary line, a blank line, then 1–3 elaboration lines.

```python
"""
tts.py — Text-to-speech synthesis via the ElevenLabs API.

Converts a text string to MP3 audio and saves it to a temporary file.
Returns the absolute file path for the caller to stream or serve.
"""

import os
...
```

```python
"""
rag.py — Question retrieval from ChromaDB using semantic similarity.

Queries the local ChromaDB vector store with an embedded topic string
and returns the top-k matching interview questions.
"""
```

---

### 2. Function Docstrings

Use **Google-style docstrings** for all non-trivial functions. Skip for one-liners.

```python
def synthesize_speech(text: str, voice_id: str) -> str:
    """Convert text to speech using ElevenLabs and return the output file path.

    Args:
        text: The text to synthesize. ElevenLabs free tier caps at 5,000 characters.
        voice_id: ElevenLabs voice ID. Read from ELEVENLABS_VOICE_ID env var.

    Returns:
        Absolute path to the generated MP3 file written to /tmp.

    Raises:
        HTTPException: If the ElevenLabs API returns a non-200 status.
    """
```

```python
def retrieve_questions(topic: str, k: int = 3) -> list[str]:
    """Query ChromaDB for the top-k interview questions closest to the given topic.

    Args:
        topic: Free-text description of the job role or skill area.
        k: Number of results to return. Defaults to 3.

    Returns:
        List of question strings ordered by semantic similarity (closest first).
    """
```

**Omit `Args` / `Returns`** when the function signature and name make them redundant.

---

### 3. FastAPI Route Docstrings

Every route handler must have a single-line docstring. This text populates the auto-generated OpenAPI / Swagger docs.

```python
@app.post("/api/chat")
async def chat(request: ChatRequest):
    """Process a user's transcribed answer and return the next interview question."""
```

```python
@app.post("/api/end")
async def end_interview(request: EndInterviewRequest):
    """End interview session early and clear server-side session state."""
```

---

### 4. Inline Comments in Python

Same philosophy as TypeScript — explain why, never what.

```python
# ChromaDB returns cosine distance scores (lower = more similar).
# We do not invert — callers should treat lower scores as better matches.
results = collection.query(query_texts=[topic], n_results=k)
```

```python
# Groq Whisper returns the transcript as plain text, not a structured object.
# Strip whitespace before passing to the LLM to avoid prompt injection via padding.
transcript = response.text.strip()
```

```python
# Temporary files in /tmp are not guaranteed to persist across Railway restarts.
# For production, audio files should be uploaded to Supabase Storage instead.
output_path = f"/tmp/tts_{uuid4().hex}.mp3"
```

---

### 5. Constants

```python
CHROMA_COLLECTION_NAME = "interview_questions"  # must match the name used during ingestion
MAX_CONTEXT_MESSAGES = 10  # keep last 10 turns to stay within Groq's context window
```

---

## Summary Checklist

Before committing any file, verify:

- [ ] **File header** — TS file starts with a `//` comment stating its purpose; Python file starts with a module docstring
- [ ] **Exported functions/hooks** — non-obvious ones have TSDoc or Google-style docstrings
- [ ] **Props** — interface properties are commented only where the name is insufficient
- [ ] **Inline comments** — explain *why*, never *what*
- [ ] **FastAPI routes** — every route handler has a one-line docstring for OpenAPI
- [ ] **No narration comments** — "// Import", "// Define", "// Handle", "// Return" are all banned
- [ ] **Magic values** — non-obvious constants and timeouts have a comment explaining the value

---

## Quick Reference — Decide Whether to Comment

| Situation | Comment? |
|---|---|
| `const [loading, setLoading] = useState(false)` | No — obvious |
| `await new Promise(r => setTimeout(r, 300))` | Yes — explain why the delay exists |
| `if (error?.code === "user_already_exists")` | Yes — explain the non-obvious API behavior |
| `className?: string` prop | No — obvious |
| `/** ISO 8601 string — formatted client-side */` on a date prop | Yes — non-obvious constraint |
| `return <div>{children}</div>` | No — obvious |
| FastAPI route handler | Yes — always, one line for OpenAPI |
| Python module file | Yes — always, module docstring |
| Helper function whose name fully explains it | No |
| Exported hook that returns a non-obvious shape | Yes |
