# Feature: Dashboard

## Purpose

The home screen for authenticated users. The dashboard shows a summary of past interview sessions, highlights performance trends at a glance, and provides the primary entry point to start a new interview. It is the first page a user sees after signing in.

**Users:** Authenticated

---

## Routes

| URL | Page | Auth required |
|-----|------|--------------|
| `/dashboard` | User dashboard | Yes |

---

## Page Layout

### 1. Header / Welcome
- "Welcome back, {first_name}" or "Good morning / afternoon, {first_name}"
- Subtitle: "Ready for today's practice?"
- Primary CTA: "Start New Interview" → `/interview/setup`

### 2. Stats Summary Bar
Three at-a-glance metric cards (horizontal row):

| Metric | Description |
|---|---|
| **Total Sessions** | Total number of completed interview sessions |
| **Average Score** | Mean `overall_rating` across all completed sessions |
| **Last Session** | Relative time of most recent session (e.g. "2 days ago") |

These are computed from `interview_sessions` and `feedback_reports` for the current user.

### 3. Recent Sessions List
Table or card list of the user's most recent sessions (last 10), sorted by `created_at` DESC.

Each session card shows:
- Job role + question type badge (e.g. "Software Engineering — Technical")
- Date and duration
- Overall score badge (color-coded: red <5, yellow 5–7, green >7)
- "View Report" link → `/report/:sessionId`

If no sessions: show an empty state card — "No sessions yet. Start your first interview to see your results here."

### 4. (Future) Score Trend Chart
A small line chart showing `overall_rating` over time across sessions. Deferred to post-MVP — see [`future-goals/analytics-progress-tracking.md`](../future-goals/analytics-progress-tracking.md).

---

## Data Loading

```
1. auth-store.user.id (available from Supabase session)

2. Supabase:
   SELECT interview_sessions.*
   FROM interview_sessions
   WHERE user_id = auth.uid()
     AND status = 'completed'
   ORDER BY created_at DESC
   LIMIT 10

3. Supabase:
   SELECT session_id, overall_rating
   FROM feedback_reports
   WHERE session_id IN (...session ids from step 2)

4. Compute stats:
   - total_sessions: count of all completed sessions (separate COUNT query)
   - average_score: AVG(overall_rating) across all sessions
   - last_session: created_at of most recent session

5. Render
```

Use React Query (`useQuery`) for the session list — enables background refresh and caching.

---

## Backend Calls

No FastAPI backend calls on the dashboard. All data comes directly from Supabase.

---

## State

| Data | Owner |
|------|-------|
| Session list | React Query (`useQuery` key: `['sessions', userId]`) |
| Stats summary | Derived from session list data + separate Supabase aggregate query |
| Auth user | `auth-store` (Zustand) |

---

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `SessionCard` | `components/features/dashboard/` | Individual session summary: role, type, date, score, report link |
| `StatsBar` | `components/features/dashboard/` | Three metric summary cards at top of dashboard |
| `EmptyState` | `components/features/dashboard/` | Empty state when user has no sessions yet |

---

## Key Edge Cases

- **No sessions:** Show the empty state with a prominent "Start your first interview" CTA. Do not render the stats bar or session list skeleton — replace the entire content area with the empty state.
- **Sessions without feedback reports:** A session may be in `status = 'active'` (user navigated away mid-session) or `status = 'completed'` but without a `feedback_reports` row (report generation failed). Filter these out of the main list or show them with a "No report" badge and a "Resume" or "Retry report" action.
- **Large session count:** Paginate or infinite-scroll the session list. The initial query fetches the 10 most recent — add "Load more" pagination as session count grows.
- **First sign-in (no sessions, brand new user):** Show a brief onboarding prompt alongside the empty state: "Welcome! Here's how it works:" with a quick 3-step explainer before the CTA.
