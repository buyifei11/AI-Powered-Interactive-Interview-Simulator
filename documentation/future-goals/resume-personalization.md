# Future Goal: Resume Personalization

> **Status:** Deferred — not in active development. Build after the core MVP is stable.
> **Note:** Planned architecture only. Endpoint/schema names in this file may differ from current production flow.

---

## Overview

Allow users to upload their resume (CV) before starting an interview. The AI interviewer uses the resume content to generate personalized questions — asking about specific projects, technologies, job titles, or experience gaps that appear in the candidate's actual background. This makes practice sessions dramatically more realistic and targeted.

---

## Feature Scope

### Resume Upload (Interview Setup)

- Add an optional "Upload your resume" step on the interview setup screen.
- Accept: PDF, DOCX (common CV formats).
- Parse the resume text server-side and extract key entities.
- Store the parsed resume text in Supabase (associated with the user's profile or the specific session).

### Personalized Question Generation

When a resume is available, the RAG question bank is augmented:
1. Resume text is embedded and stored in ChromaDB alongside the general question bank.
2. The LLM is given resume context in the system prompt: "This candidate has X years of experience with Y. They listed Z projects. Ask questions relevant to their background."
3. Follow-up questions can reference the candidate's specific experience: "You mentioned working on a microservices architecture — walk me through the biggest challenge you faced there."

### Resume Storage Schema

```sql
-- profiles table: add resume fields
resume_text        text          -- extracted plain text from the uploaded CV
resume_uploaded_at timestamptz
```

Or alternatively, a separate `resumes` table if multiple resume versions are desired in the future.

---

## Implementation Approach

### Parsing

Use the Python backend for resume parsing:

- **PDF:** `pdfplumber` or `pypdf` for text extraction.
- **DOCX:** `python-docx` for text extraction.
- Extracted text is cleaned (whitespace normalization, remove headers/footers) and stored.

### Backend Endpoint (planned)

```
POST /api/resume/upload
Content-Type: multipart/form-data
  file: PDF or DOCX

Response:
  { resume_text: string, parsed_sections: { ... } }
```

The frontend stores `resume_text` in Supabase after the backend parses it.

### LLM Context Injection

During the interview session, if a resume is available, prepend resume context to the LLM system prompt:

```
System: You are a professional interviewer for a {job_role} role.
        The candidate's resume summary: {resume_text_excerpt}
        
        Ask questions that are relevant to their specific experience.
        Reference their actual projects, technologies, and roles where appropriate.
        Ask one follow-up question. Do not evaluate or score.
```

---

## Privacy Considerations

- Resume text should be stored encrypted at rest (Supabase handles this for PostgreSQL data at rest).
- Users should be able to delete their stored resume from their profile settings.
- Resume text is never sent to third parties other than Groq (as part of the LLM context).

---

## Prerequisites Before Building This

- [ ] Core MVP is live (voice interview, auth, feedback report)
- [ ] Resume upload UI on interview setup screen
- [ ] PDF/DOCX parsing added to backend (`requirements.txt`: `pdfplumber`, `python-docx`)
- [ ] `POST /api/resume/upload` endpoint implemented
- [ ] `profiles` table updated with `resume_text` field + RLS policy
- [ ] LLM system prompt updated to conditionally include resume context
- [ ] Profile settings page includes "Delete my resume" option
