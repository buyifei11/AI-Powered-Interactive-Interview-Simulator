// Auth layout — shared wrapper for /login and /register.
// Full-screen centered layout with logo header, no app topbar.

import Link from "next/link";
import { Mic } from "lucide-react";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative min-h-screen flex flex-col items-center justify-center px-4 py-16">
      {/* Background violet glow */}
      <div
        aria-hidden
        className="pointer-events-none fixed inset-0 flex items-start justify-center overflow-hidden"
      >
        <div className="h-[500px] w-[800px] rounded-full bg-violet-600/8 blur-[120px] -translate-y-1/4" />
      </div>

      <div className="relative w-full max-w-md">
        {/* Logo */}
        <Link
          href="/"
          className="flex items-center justify-center gap-2.5 mb-8 group"
        >
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            InterviewAI
          </span>
        </Link>

        {children}
      </div>
    </div>
  );
}
