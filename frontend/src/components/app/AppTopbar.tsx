// AppTopbar — navigation bar for authenticated app pages (/dashboard, /interview).
// Displays the logo, nav links, theme toggle, user name, and sign-out button.
// Receives the user's first name as a prop from the parent Server Component layout.

"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Mic, LogOut } from "lucide-react";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { signOut } from "@/app/actions/auth";
import { cn } from "@/lib/utils";

interface AppTopbarProps {
  firstName: string;
}

const navLinks = [
  { href: "/interview", label: "New Interview" },
];

export function AppTopbar({ firstName }: AppTopbarProps) {
  const pathname = usePathname();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/interview" className="flex items-center gap-2.5 group shrink-0">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight hidden sm:block">
            InterviewAI
          </span>
        </Link>

        {/* Nav links */}
        <nav className="hidden md:flex items-center gap-1">
          {navLinks.map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={cn(
                "px-3 py-1.5 rounded-md text-sm font-medium transition-colors",
                pathname === link.href
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/60"
              )}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right — user + actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />

          <span className="hidden sm:block text-sm text-muted-foreground px-1">
            {firstName}
          </span>

          {/* Sign out — calls the Server Action directly from a form for correct cookie clearing */}
          <form action={signOut}>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              aria-label="Sign out"
            >
              <LogOut className="w-4 h-4" />
              <span className="hidden sm:block">Sign out</span>
            </button>
          </form>
        </div>
      </div>
    </header>
  );
}
