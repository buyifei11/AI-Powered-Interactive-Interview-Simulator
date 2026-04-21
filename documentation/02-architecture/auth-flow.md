# Auth Flow

## Overview

Authentication is handled entirely by **Supabase Auth**. The frontend uses `@supabase/ssr` to manage cookie-based sessions that work seamlessly with Next.js Server Components, middleware, and Client Components. The FastAPI backend does not handle auth — it is called from authenticated frontend pages where the session is already validated by middleware.

---

## Sign-Up Flow

```
1. User fills RegisterForm (first_name, last_name, email, password × 2)
2. Zod validates client-side; submit is blocked until valid
3. Client calls: supabase.auth.signUp({ email, password, options: { data: { first_name, last_name } } })
   - first_name and last_name are stored in user_metadata as a fallback
4. On success: INSERT into public.profiles (id, first_name, last_name)
   - Profile insert failure is non-blocking; user_metadata is the fallback
5. Session cookie set automatically by @supabase/ssr
6. middleware.ts reads cookie → user is authenticated
7. Redirect to /dashboard
```

> **Email confirmation:** Disabled for MVP. Disable in Supabase Dashboard → Authentication → Providers → Email → "Confirm email" toggle OFF. Re-enable for production launch — when enabled, `signUp` returns `session: null` until confirmed and the UI must show a "check your email" screen.

---

## Sign-In Flow

```
1. User fills LoginForm (email, password)
2. Zod validates client-side
3. Client calls: supabase.auth.signInWithPassword({ email, password })
4. Supabase validates credentials → returns session (access_token, refresh_token)
5. @supabase/ssr writes session to cookies automatically
6. Redirect to /dashboard
```

---

## Sign-Out Flow

```
1. User clicks "Sign out" in the AppTopbar
2. HTML form submits to the signOut() Server Action (app/actions/auth.ts)
3. Server Action calls supabase.auth.signOut() — clears session cookies server-side
4. redirect("/") — user lands on the landing page
```

Sign-out is implemented as a **Server Action** (not a client-side call) to ensure session cookies are correctly cleared and the redirect happens server-side without a client-side race condition.

---

## Session Management (`@supabase/ssr`)

`@supabase/ssr` provides two Supabase client factories:

```typescript
// lib/supabase/client.ts — Client Components only
import { createBrowserClient } from '@supabase/ssr'
// Reads/writes cookies in the browser

// lib/supabase/server.ts — Server Components, Server Actions, API routes only
import { createServerClient } from '@supabase/ssr'
// Reads cookies from next/headers; writes refreshed tokens back to cookies
```

**Rule:** Never import `lib/supabase/server.ts` in Client Components. Never import `lib/supabase/client.ts` in Server Components or Server Actions.

---

## Middleware (Route Protection)

`src/middleware.ts` runs on every non-static request and handles two things:

1. **Token rotation:** Calls `supabase.auth.getUser()` which refreshes the access token transparently and writes updated cookies to the response.
2. **Route gating:**

```typescript
// Protected routes — redirect to /login if no valid session
if (!user && (pathname.startsWith('/dashboard') || pathname.startsWith('/interview'))) {
  redirect('/login')
}

// Auth routes — redirect to /dashboard if already signed in
if (user && (pathname.startsWith('/login') || pathname.startsWith('/register'))) {
  redirect('/dashboard')
}
```

Public routes (`/`) are not gated. The matcher excludes `_next/static`, `_next/image`, and static file extensions.

---

## Route Structure

```
app/
  (auth)/               ← public-only auth pages
    layout.tsx          ← centered layout with logo, no app topbar
    login/page.tsx      → /login
    register/page.tsx   → /register
  (app)/                ← authenticated-only app pages
    layout.tsx          ← fetches user, renders AppTopbar
    dashboard/page.tsx  → /dashboard
    interview/page.tsx  → /interview
  page.tsx              → / (landing, always public)
```

Route groups (`(auth)`, `(app)`) affect layout nesting but not URL structure.

---

## Profiles Table

The `public.profiles` table stores display names for each user. It is created by running `supabase/migrations/001_profiles.sql` in the Supabase SQL editor.

```sql
create table public.profiles (
  id          uuid references auth.users(id) on delete cascade primary key,
  first_name  text not null,
  last_name   text not null,
  created_at  timestamp with time zone default now() not null
);
```

Row Level Security is enabled. Users can only read and write their own row. Profile rows are inserted at sign-up time by the client (not via a database trigger) so the logic is visible and testable.

**Fallback:** `first_name` is also stored in `user.user_metadata` during sign-up so the app gracefully displays the name even if the profiles table hasn't been created yet.

---

## Auth State in Server Components

Server Components and layouts use `createClient()` from `lib/supabase/server.ts` and call `supabase.auth.getUser()` to get the authenticated user. This is safe and validated because middleware has already confirmed the session.

```typescript
// (app)/layout.tsx — Server Component
const { data: { user } } = await supabase.auth.getUser()
// user is guaranteed non-null here because middleware blocked unauthenticated requests
```

Client Components that need the current user should use `createClient()` from `lib/supabase/client.ts`.

---

## Protected Data Access

The FastAPI backend does not validate Supabase tokens. It is called only from authenticated frontend pages where middleware has already verified the session. Supabase RLS on the database enforces data ownership at the database level.

For future backend-side auth, the Supabase access token can be passed in the `Authorization` header and verified using the Supabase service role key. This is not implemented in the MVP.

---

## Key Edge Cases

- **Token expiry:** `@supabase/ssr` refreshes tokens automatically via middleware on every request. No manual refresh logic is needed.
- **Profile insert failure at sign-up:** Non-blocking. `first_name` is also in `user_metadata`, so the dashboard still displays the correct name.
- **Stale session after sign-out on another tab:** The next navigation will hit middleware, which will see no valid session and redirect to `/login`.
- **Email confirmation (when re-enabled for production):** `signUp` returns `session: null` until confirmed. The RegisterForm must handle this by showing a "Check your email" screen instead of redirecting to `/dashboard`.
