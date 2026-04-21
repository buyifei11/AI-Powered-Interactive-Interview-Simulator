// auth.ts — Server Actions for authentication operations.
// These run on the server, ensuring session cookies are cleared correctly on sign-out.

"use server";

import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export async function signOut() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect("/");
}
