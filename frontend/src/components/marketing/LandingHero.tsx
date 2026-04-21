import Link from "next/link";
import { ArrowRight, Mic, Sparkles } from "lucide-react";

export function LandingHero() {
  return (
    <section className="relative overflow-hidden pt-20 pb-24 sm:pt-28 sm:pb-32">
      {/* Background glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-start justify-center"
      >
        <div className="h-[480px] w-[900px] rounded-full bg-violet-600/10 blur-[120px] -translate-y-1/3" />
      </div>

      <div className="relative max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col lg:flex-row items-center gap-16">
          {/* Left — copy */}
          <div className="flex-1 text-center lg:text-left">
            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium mb-6 animate-fade-in">
              <Sparkles className="w-3.5 h-3.5" />
              Voice-first AI interview practice
            </div>

            {/* Headline */}
            <h1 className="font-display text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight leading-[1.1] mb-6 animate-fade-in animate-delay-100">
              Ace your next{" "}
              <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
                interview
              </span>
              <br />
              with AI-powered practice.
            </h1>

            {/* Subtitle */}
            <p className="text-lg text-muted-foreground leading-relaxed max-w-xl mx-auto lg:mx-0 mb-8 animate-fade-in animate-delay-200">
              Practice with a realistic AI interviewer that listens to your spoken
              answers, probes with intelligent follow-ups, and delivers a full
              feedback report when you&apos;re done — not during.
            </p>

            {/* CTAs */}
            <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 mb-5 animate-fade-in animate-delay-300">
              <Link
                href="/register"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 shadow-lg shadow-violet-500/25 hover:shadow-violet-500/40 transition-all active:scale-95"
              >
                Start practicing free
                <ArrowRight className="w-4 h-4" />
              </Link>
              <a
                href="#how-it-works"
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl text-base font-medium border border-border hover:border-violet-500/50 hover:bg-violet-500/5 transition-all"
              >
                See how it works
              </a>
            </div>

            {/* Trust line */}
            <p className="text-sm text-muted-foreground animate-fade-in animate-delay-400">
              Free to start · No credit card · No judgment
            </p>
          </div>

          {/* Right — mock interview card */}
          <div className="flex-shrink-0 w-full max-w-sm lg:max-w-md animate-fade-in-scale animate-delay-200">
            <MockInterviewCard />
          </div>
        </div>
      </div>
    </section>
  );
}

function MockInterviewCard() {
  return (
    <div className="relative rounded-2xl border border-border bg-card shadow-2xl shadow-black/20 overflow-hidden">
      {/* Card header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border bg-muted/40">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center">
            <Mic className="w-3.5 h-3.5 text-white" />
          </div>
          <span className="text-sm font-semibold">AI Interview Simulator</span>
        </div>
        <div className="flex items-center gap-1.5">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-xs text-emerald-500 font-medium">Live</span>
        </div>
      </div>

      {/* Messages */}
      <div className="p-4 space-y-4 min-h-[260px]">
        {/* AI message */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">AI</span>
          </div>
          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 max-w-[85%]">
            <p className="text-sm leading-relaxed">
              Walk me through a time you had to solve a technically challenging problem under a tight deadline.
            </p>
          </div>
        </div>

        {/* User message */}
        <div className="flex items-start justify-end gap-3">
          <div className="bg-gradient-to-br from-violet-600 to-indigo-500 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[85%]">
            <p className="text-sm leading-relaxed text-white">
              Sure — at my last role, we had a production database migration that needed to complete in a 2-hour window...
            </p>
          </div>
          <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center shrink-0 border border-border">
            <span className="text-[10px] font-bold text-muted-foreground">You</span>
          </div>
        </div>

        {/* AI typing */}
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shrink-0">
            <span className="text-[10px] font-bold text-white">AI</span>
          </div>
          <div className="bg-muted rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "0ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "150ms" }} />
            <div className="w-1.5 h-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: "300ms" }} />
          </div>
        </div>
      </div>

      {/* Card footer — mic bar */}
      <div className="border-t border-border bg-muted/30 px-4 py-3 flex items-center justify-center gap-3">
        <div className="relative flex items-center justify-center w-11 h-11 rounded-full bg-rose-500 shadow-lg shadow-rose-500/40">
          <span className="absolute inset-0 rounded-full bg-rose-400 animate-ping opacity-60" />
          <Mic className="w-5 h-5 text-white z-10" />
        </div>
        <span className="text-sm text-muted-foreground font-medium">Recording your answer...</span>
      </div>
    </div>
  );
}
