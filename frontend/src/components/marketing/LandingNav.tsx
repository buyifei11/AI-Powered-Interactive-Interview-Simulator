"use client";

import Link from "next/link";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { Mic } from "lucide-react";

export function LandingNav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 group">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-md shadow-violet-500/20 group-hover:shadow-violet-500/40 transition-shadow">
            <Mic className="w-4 h-4 text-white" />
          </div>
          <span className="font-display font-bold text-lg tracking-tight">
            InterviewAI
          </span>
        </Link>

        {/* Nav links — hidden on mobile */}
        <nav className="hidden md:flex items-center gap-6 text-sm text-muted-foreground">
          <a href="#how-it-works" className="hover:text-foreground transition-colors">
            How it works
          </a>
          <a href="#features" className="hover:text-foreground transition-colors">
            Features
          </a>
        </nav>

        {/* Right side actions */}
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <Link
            href="/login"
            className="hidden sm:inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Sign in
          </Link>
          <Link
            href="/register"
            className="inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all active:scale-95"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
