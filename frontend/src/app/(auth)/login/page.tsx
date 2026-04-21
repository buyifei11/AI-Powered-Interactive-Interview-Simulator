// Login page — renders the LoginForm at /login.
// Middleware redirects already-authenticated users to /dashboard before reaching here.

import { LoginForm } from "@/components/auth/LoginForm";

export const metadata = {
  title: "Sign in — InterviewAI",
};

export default function LoginPage() {
  return <LoginForm />;
}
