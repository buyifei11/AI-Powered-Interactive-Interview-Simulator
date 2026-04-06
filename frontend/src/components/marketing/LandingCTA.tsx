import Link from "next/link";
import { ArrowRight } from "lucide-react";

export function LandingCTA() {
  return (
    <section className="py-24 relative overflow-hidden">
      {/* Glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 flex items-center justify-center"
      >
        <div className="h-[400px] w-[700px] rounded-full bg-violet-600/8 blur-[100px]" />
      </div>

      <div className="relative max-w-3xl mx-auto px-4 sm:px-6 text-center">
        <h2 className="font-display text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight mb-5">
          Your next interview could be{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            your last job search.
          </span>
        </h2>
        <p className="text-lg text-muted-foreground mb-8 max-w-xl mx-auto">
          Stop winging it. Ten minutes of focused AI practice is worth more
          than hours of reading answers online.
        </p>

        <Link
          href="/register"
          className="inline-flex items-center gap-2 px-8 py-4 rounded-xl text-base font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 shadow-xl shadow-violet-500/25 hover:shadow-violet-500/40 transition-all active:scale-95"
        >
          Start practicing — it&apos;s free
          <ArrowRight className="w-4 h-4" />
        </Link>

        <p className="mt-4 text-sm text-muted-foreground">
          Free to start · No credit card · No judgment
        </p>
      </div>
    </section>
  );
}
