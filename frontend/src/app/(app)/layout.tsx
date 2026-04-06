// App layout — shared wrapper for all authenticated routes (/dashboard, /interview).
// Fetches the authenticated user's display name and renders the AppTopbar.
// Middleware guarantees a valid session before this layout runs.

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppTopbar } from "@/components/app/AppTopbar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Middleware should prevent unauthenticated access, but guard defensively.
  if (!user) redirect("/login");

  // Prefer profile table name; fall back to user_metadata set during sign-up.
  const { data: profile } = await supabase
    .from("profiles")
    .select("first_name")
    .eq("id", user.id)
    .single();

  const firstName =
    profile?.first_name ??
    user.user_metadata?.first_name ??
    user.email?.split("@")[0] ??
    "there";

  return (
    <div className="min-h-screen flex flex-col">
      <AppTopbar firstName={firstName} />
      <main className="flex-1">{children}</main>
    </div>
  );
}
