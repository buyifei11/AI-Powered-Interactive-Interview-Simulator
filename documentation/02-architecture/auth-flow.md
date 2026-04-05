# Auth Flow

## Overview

Authentication is handled entirely by **Supabase Auth**. The frontend uses `@supabase/ssr` to manage cookie-based sessions that work seamlessly with Next.js Server Components, middleware, and Client Components. The FastAPI backend does not handle auth — it is called from the frontend with the `session_id` as the identifier, and Supabase RLS enforces data ownership.

---

## Sign-Up Flow

```
1. User fills SignupForm (full_name, email, password)
2. Client calls: supabase.auth.signUp({ email, password, options: { data: { full_name } } })
3. Supabase creates auth.users record → sends confirmation email (if email confirm enabled)
4. On success: INSERT into profiles (id, full_name)
5. Session cookie set automatically by @supabase/ssr
6. middleware.ts reads cookie → user is authenticated
7. Redirect to /dashboard
```

> **Email confirmation:** For MVP, disable email confirmation in Supabase dashboard (Authentication → Email → "Confirm email" toggle OFF) to reduce friction. Re-enable for production launch.

---

## Sign-In Flow

```
1. User fills LoginForm (email, password)
2. Client calls: supabase.auth.signInWithPassword({ email, password })
3. Supabase validates credentials → returns session (access_token, refresh_token)
4. @supabase/ssr writes session to cookies (sb-access-token, sb-refresh-token)
5. middleware.ts reads and validates cookie on next request
6. Redirect to /dashboard
```

---

## Session Management (`@supabase/ssr`)

`@supabase/ssr` provides two Supabase client factories that handle cookie-based sessions for Next.js:

```typescript
// lib/supabase/server.ts — used in Server Components, API routes, middleware
import { createServerClient } from '@supabase/ssr'
// Reads cookies from the incoming request; writes refreshed tokens to response cookies

// lib/supabase/client.ts — used in Client Components
import { createBrowserClient } from '@supabase/ssr'
// Reads/writes cookies in the browser; listens to onAuthStateChange
```

**Rule:** Never import `lib/supabase/server.ts` in Client Components. Never import `lib/supabase/client.ts` in Server Components or API routes.

---

## Middleware (Route Protection)

`src/middleware.ts` gates all `(app)` routes. It runs on every request that matches the configured pattern.

```typescript
// Matcher: protect all /dashboard, /interview/*, /report/* routes
export const config = {
  matcher: ['/dashboard/:path*', '/interview/:path*', '/report/:path*'],
}

// Logic:
// 1. Create Supabase server client from request cookies
// 2. Call supabase.auth.getUser() — validates the session
// 3. If no valid user → redirect to /login
// 4. If valid user → allow request through
// 5. Pass refreshed session cookies in response (token rotation)
```

Public routes (`/`, `/login`, `/signup`) are not in the matcher and are always accessible.

Authenticated users visiting `/login` or `/signup` are redirected to `/dashboard` by the respective page components (not middleware).

---

## Auth State in Client Components

Auth state is managed in a Zustand store (`store/auth-store.ts`), seeded by a `SupabaseProvider` that listens to `supabase.auth.onAuthStateChange`.

```typescript
// store/auth-store.ts
interface AuthState {
  user: User | null
  isLoading: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
}
```

```typescript
// components/providers/SupabaseProvider.tsx
// On mount: supabase.auth.getSession() → setUser
// On change: supabase.auth.onAuthStateChange → setUser
```

Components that need the current user import `useAuthStore()` — they do not call Supabase directly.

---

## Sign-Out Flow

```
1. User clicks "Sign out" in the user menu (Topbar)
2. Client calls: supabase.auth.signOut()
3. @supabase/ssr clears the session cookies
4. auth-store setUser(null)
5. Redirect to /
```

---

## Protected Data Access

The FastAPI backend does not validate Supabase tokens. The backend is called only from authenticated frontend pages where the user has already been verified by middleware. Session data ownership is enforced by Supabase RLS on the database side.

For future backend-side auth (if the FastAPI backend needs to verify the caller), the Supabase service role key can be used to verify a JWT passed in the request header:

```
Authorization: Bearer <supabase_access_token>
```

This is not implemented in the MVP.

---

## Key Edge Cases

- **Token expiry:** `@supabase/ssr` handles token refresh automatically via middleware on every request. The refresh token is rotated and written back to cookies transparently. No manual refresh logic is needed.
- **Stale cookie after sign-out on another tab:** `onAuthStateChange` in `SupabaseProvider` will fire and clear the auth store. The next navigation will hit middleware, which will redirect to `/login`.
- **Profile creation failure:** If the `INSERT into profiles` fails after `signUp`, the user has an auth record but no profile. Handle this in the dashboard by checking for a missing profile and prompting re-entry of name. Do not silently fail.
- **Sign-up without email confirmation (MVP):** Sessions are valid immediately after `signUp`. When email confirmation is enabled for production, `signUp` returns a session of `null` until the user confirms — the UI must handle this state and show a "Check your email" screen.
