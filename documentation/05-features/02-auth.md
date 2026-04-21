# Feature: Auth

## Purpose

Handles the full user identity lifecycle: account creation, sign-in, and sign-out. Auth gates all product features — users must be signed in to access the dashboard, start an interview, or view feedback reports.

Auth is implemented via **Supabase Auth** with cookie-based sessions managed by `@supabase/ssr`.

**Users:** Unauthenticated (sign-up/login pages), Authenticated (sign-out)

---

## Routes

| URL | Page | Auth required |
|-----|------|--------------|
| `/login` | Sign in with email + password | No |
| `/signup` | Create a new account | No |

Auth pages live in the `(auth)` route group and render without the main app shell (no sidebar, no topbar).

`middleware.ts` allows all of these through unauthenticated. Authenticated users visiting `/login` or `/signup` are redirected to `/dashboard`.

---

## Sign-Up Flow

```
1. User fills SignupForm: full_name, email, password, confirm_password
2. Zod validation runs client-side
3. supabase.auth.signUp({ email, password, options: { data: { full_name } } })
4. On success: INSERT into profiles { id: user.id, full_name }
5. @supabase/ssr sets session cookie automatically
6. Redirect to /dashboard
```

---

## Sign-In Flow

```
1. User fills LoginForm: email, password
2. Zod validation runs client-side
3. supabase.auth.signInWithPassword({ email, password })
4. @supabase/ssr sets session cookie automatically
5. Redirect to /dashboard
```

---

## Sign-Out Flow

```
1. User clicks "Sign out" in the user menu (Topbar dropdown)
2. supabase.auth.signOut()
3. @supabase/ssr clears session cookies
4. auth-store.setUser(null)
5. Redirect to /
```

---

## Backend Calls

| Action | Method | Notes |
|--------|--------|-------|
| Sign up | `supabase.auth.signUp()` | Supabase Auth SDK (client-side) |
| Create profile | Supabase client insert | `profiles` table — must happen immediately after signUp success |
| Sign in | `supabase.auth.signInWithPassword()` | Supabase Auth SDK (client-side) |
| Sign out | `supabase.auth.signOut()` | Supabase Auth SDK (client-side) |

The FastAPI backend is not involved in auth at all.

---

## State

| Data | Owner |
|------|-------|
| Authenticated user (uid, email) | `auth-store` (Zustand) — seeded by `SupabaseProvider` on mount |
| Form field state | Local component state via React Hook Form + Zod |
| Session cookie | Managed automatically by `@supabase/ssr` middleware |

---

## Components

| Component | Location | Purpose |
|-----------|----------|---------|
| `LoginForm` | `components/features/auth/` | Email + password form with Zod validation and error display |
| `SignupForm` | `components/features/auth/` | Registration form: full_name, email, password, confirm_password |
| `BrandLogo` | `components/shared/` | Displayed in the auth layout header |
| `SupabaseProvider` | `components/providers/` | Seeds and listens to auth state on the client |

---

## Zod Schemas (`lib/validations/auth.schema.ts`)

```typescript
// loginSchema
{
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
}

// signupSchema
{
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Enter a valid email"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  confirm_password: z.string()
}.refine(data => data.password === data.confirm_password, {
  message: "Passwords do not match",
  path: ["confirm_password"],
})
```

---

## Key Edge Cases

- **Email already in use (sign-up):** Supabase returns an `AuthApiError` with message `"User already registered"`. Map this to a form-level error: "An account with this email already exists. Sign in instead?"
- **Wrong password (sign-in):** Supabase returns `"Invalid login credentials"`. Display as a generic form error without specifying which field is wrong (security best practice).
- **Profile insert failure after signUp:** If the `profiles` INSERT fails, the user is authenticated but has no profile record. On dashboard load, check for a missing profile and show an inline prompt to complete setup. Do not silently fail.
- **Session cookie on first load:** `SupabaseProvider` calls `supabase.auth.getSession()` on mount to seed the auth store. There is a brief window where `isLoading` is true — the `(app)` layout should render a loading state (skeleton or spinner) rather than flashing empty protected content.
- **Token refresh:** `@supabase/ssr` handles JWT token rotation in middleware automatically. No manual refresh logic is needed.
- **Authenticated user on `/login` or `/signup`:** Redirect to `/dashboard` from the page component (not middleware) — check `auth-store.user` on mount and push if non-null.
