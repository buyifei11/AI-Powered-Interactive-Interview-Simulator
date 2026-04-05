# Future Goal: Analytics & Progress Tracking

> **Status:** Deferred — not in active development. Build after the core MVP (sessions, feedback reports, dashboard) is stable with real user data.

---

## Overview

Give users a longitudinal view of their interview performance — how their scores have changed over time, which dimensions they are strongest and weakest in, and what patterns appear in their practice history. The goal is to make repeated practice feel rewarding by making improvement visible.

---

## Feature Scope

### Score Trend Chart

A line chart on the dashboard showing `overall_rating` across all sessions over time.

- X axis: session date
- Y axis: score 1–10
- Each point links to the session's feedback report on click
- Show a trend line or rolling average to smooth out single-session variance

**Library:** Recharts — lightweight, React-native, composable. Add to `frontend/package.json`.

### Dimension Breakdown

A radar/spider chart showing average scores across the four dimensions (clarity, structure, relevance, confidence) aggregated across all sessions.

- Helps users instantly see their strongest and weakest dimension.
- Overlaid with a "benchmark" average if enough aggregate data is available across users (future).

### Session History Filters

Filter the session history list on the dashboard by:
- Job role
- Question type (technical / behavioral / mixed)
- Difficulty
- Date range

### Weak Area Identification

Derived insight card on the dashboard: "Your lowest-scoring dimension across recent sessions is **Structure**. Consider practicing answer frameworks like STAR."

Computed as: `MIN(AVG(clarity_score), AVG(structure_score), AVG(relevance_score), AVG(confidence_score))` across the last 5 sessions.

### Session Count Milestones

Lightweight gamification: surface milestone notifications when users hit session counts (5, 10, 25, 50 sessions). E.g. "You've completed 10 interview practice sessions. Keep it up!"

---

## Data Requirements

All analytics data is derived from existing tables — no new tables needed initially:

```sql
-- Example: average scores by dimension over time
SELECT
  DATE_TRUNC('week', is.created_at) AS week,
  AVG(fr.overall_rating) AS avg_overall,
  AVG(fr.clarity_score) AS avg_clarity,
  AVG(fr.structure_score) AS avg_structure,
  AVG(fr.relevance_score) AS avg_relevance,
  AVG(fr.confidence_score) AS avg_confidence
FROM interview_sessions is
JOIN feedback_reports fr ON fr.session_id = is.id
WHERE is.user_id = $1
  AND is.status = 'completed'
GROUP BY 1
ORDER BY 1;
```

---

## Implementation Approach

### Dashboard Analytics Section

Add a new analytics section below the recent sessions list on `/dashboard`:

```
/dashboard
  ├── Welcome + stats bar (existing)
  ├── [new] Analytics section
  │     ├── Score trend chart (Recharts LineChart)
  │     ├── Dimension radar chart (Recharts RadarChart)
  │     └── Weak area insight card
  └── Recent sessions list (existing)
```

Hide the analytics section if the user has fewer than 3 completed sessions (not enough data to be meaningful).

### Data Fetching

Use React Query with a dedicated query key:

```typescript
useQuery({
  queryKey: ['analytics', userId],
  queryFn: () => supabase.rpc('get_user_analytics', { user_id: userId }),
  staleTime: 5 * 60 * 1000, // 5 minutes
})
```

Consider a Supabase SQL function (`get_user_analytics`) to compute aggregates server-side rather than pulling raw rows and computing in JavaScript.

---

## Prerequisites Before Building This

- [ ] Core MVP is live with real users generating session data
- [ ] At least one week of session history exists to validate the chart is meaningful
- [ ] `recharts` added to `frontend/package.json`
- [ ] Supabase SQL function `get_user_analytics` created and tested
- [ ] Dashboard refactored to support the analytics section without layout regression
