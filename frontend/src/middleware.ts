// middleware.ts — route protection and session refresh for all requests.
//
// Protected routes (/dashboard, /interview): redirect unauthenticated users to /login.
// Auth routes (/login, /register): redirect already-authenticated users to /dashboard.
// Token rotation: @supabase/ssr writes refreshed cookies on every request automatically.

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function middleware(request: NextRequest) {
  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: do not add any logic between createServerClient and getUser().
  // A mistake here can cause sessions to be randomly invalidated.
  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;

  // Redirect unauthenticated users away from protected app routes.
  const isProtected =
    pathname.startsWith("/dashboard") || pathname.startsWith("/interview");
  if (!user && isProtected) {
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    return NextResponse.redirect(url);
  }

  // Redirect /dashboard to /interview since we are bypassing the dashboard.
  if (user && pathname === "/dashboard") {
    const url = request.nextUrl.clone();
    url.pathname = "/interview";
    return NextResponse.redirect(url);
  }

  // Redirect authenticated users away from auth pages.
  const isAuthPage =
    pathname.startsWith("/login") || pathname.startsWith("/register");
  if (user && isAuthPage) {
    const url = request.nextUrl.clone();
    url.pathname = "/interview";
    return NextResponse.redirect(url);
  }

  return supabaseResponse;
}

export const config = {
  // Run on all routes except Next.js internals and static files.
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
