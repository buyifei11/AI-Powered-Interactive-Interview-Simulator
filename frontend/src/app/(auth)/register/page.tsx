// Register page — renders the RegisterForm at /register.
// Middleware redirects already-authenticated users to /dashboard before reaching here.

import { RegisterForm } from "@/components/auth/RegisterForm";

export const metadata = {
  title: "Create account — InterviewAI",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
