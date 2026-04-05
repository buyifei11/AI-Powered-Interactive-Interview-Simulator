# Platform Strategy

## What the AI Interview Simulator Is

The AI Interview Simulator is a web-based interview practice platform that puts users through realistic mock interviews using voice interaction. The AI acts as an interviewer — asking questions, listening to verbal answers, and probing with intelligent follow-ups — then delivers a comprehensive feedback report when the session ends.

The key product philosophy: **the AI behaves like a real interviewer during the session**. It does not score or critique answers in real-time. Feedback is withheld until the session is over, which forces users to stay in the mindset of a real interview and generates more honest, unguarded performance data for the debrief report.

---

## Who Uses It

The platform serves a single primary user type: **job seekers preparing for interviews**.

There are no role tiers (no admin/lawyer/client split like other platforms). All authenticated users have the same access scope. Future role expansion (e.g. a coach/admin view) is deferred.

---

## Core Product Loop

```
User configures interview (job role, question type, difficulty)
    ↓
AI asks first question — text displayed, audio played (ElevenLabs TTS)
    ↓
User clicks microphone → speaks their answer → clicks to stop
    ↓
Audio uploaded → Groq Whisper transcribes → LLaMA generates follow-up
    ↓
AI asks follow-up — no score shown, no feedback — pure interview mode
    ↓
[Loop continues N rounds]
    ↓
User ends session
    ↓
LLaMA generates full feedback report (scores, transcript, suggestions)
    ↓
Report saved to Supabase → displayed to user → accessible from dashboard
```

---

## Feature Scope

### Launched / In Active Development

| Feature | Description | Status |
|---|---|---|
| **Voice Interview Session** | Core loop: mic recording, ASR transcription, LLM follow-up, TTS playback | Prototype exists |
| **Landing Page** | Marketing page for unauthenticated visitors | Planned |
| **Auth** | Email/password sign-up and sign-in via Supabase | Planned |
| **Interview Configuration** | Job role, question type (behavioral/technical), difficulty selection before session starts | Planned |
| **Post-Session Feedback Report** | AI-generated debrief: per-question scores, full transcript, improvement suggestions | Planned |
| **Dashboard** | Session history, score trends, start new interview | Planned |

### Planned (Post-MVP)

| Feature | Description |
|---|---|
| **Video Interview Mode** | Camera access, face-to-face simulation |
| **Attention/Distraction Detection** | AI detects looking away, low engagement during video sessions |
| **Resume Upload** | Personalize questions based on user's uploaded CV |
| **Question Bank Expansion** | Expand beyond starter questions; topic-specific question sets |
| **Progress Analytics** | Score trends over time, weak area identification |
| **Shareable Feedback Report** | PDF export or shareable link to post-session report |

---

## What This App Is Not

- **Not a recruitment tool.** It does not connect users with employers or run real interviews.
- **Not a real-time coaching product.** The AI does not interrupt or coach mid-interview.
- **Not multi-role.** There is no admin panel or coach dashboard in the MVP.
- **Not mobile-native.** The product is web-first. Mobile browser support is a goal, but a native app is not planned.

---

## Development Approach

1. **Prototype → Production migration.** A working prototype exists. The priority is to productionize the core loop (replace macOS TTS, add auth, add database persistence) before adding new features.
2. **Feature completeness over feature count.** Ship fewer features that work well end-to-end rather than many partial features.
3. **Feedback timing is non-negotiable.** The product decision to withhold scores during the session must be preserved. It is central to the UX philosophy and should not be reverted to inline feedback without explicit product discussion.
4. **Deployability first.** Every decision should keep Vercel + Railway deployment in mind. No macOS-specific dependencies, no persistent in-memory state that breaks serverless.
