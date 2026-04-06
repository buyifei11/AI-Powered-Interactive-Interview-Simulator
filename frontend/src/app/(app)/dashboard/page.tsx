// Dashboard page — authenticated user's home screen at /dashboard.
// Shows a personalized greeting, placeholder stats, and a CTA to start a new interview.
// Stats are placeholders until the interview_sessions table and feedback pipeline are built.

import Link from "next/link";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ArrowRight, Mic, BarChart2, Clock, Trophy } from "lucide-react";

export const metadata = {
  title: "Dashboard — InterviewAI",
};

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export default async function DashboardPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

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
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-10 space-y-10">
      {/* Header */}
      <div>
        <h1 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
          {greeting()},{" "}
          <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
            {firstName}
          </span>
        </h1>
        <p className="text-muted-foreground mt-2">
          Ready to practice? Your next opportunity is one session away.
        </p>
      </div>

      {/* Stats row — placeholders until session tracking is implemented */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard
          icon={<Mic className="w-4 h-4" />}
          label="Total sessions"
          value="0"
          subtext="Start your first interview"
        />
        <StatCard
          icon={<Trophy className="w-4 h-4" />}
          label="Avg. score"
          value="—"
          subtext="Complete a session to see your score"
        />
        <StatCard
          icon={<Clock className="w-4 h-4" />}
          label="Practice time"
          value="0 min"
          subtext="Track your progress over time"
        />
      </div>

      {/* Main CTA — empty state */}
      <div className="rounded-2xl border border-border bg-card p-10 flex flex-col items-center text-center gap-6">
        {/* Icon */}
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/25">
          <Mic className="w-8 h-8 text-white" />
        </div>

        <div className="space-y-2 max-w-md">
          <h2 className="font-display text-xl font-bold tracking-tight">
            No interviews yet
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Start your first AI-powered mock interview. Answer questions verbally
            and receive a full feedback report when you&apos;re done.
          </p>
        </div>

        <Link
          href="/interview"
          className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-semibold text-white bg-gradient-to-r from-violet-600 to-indigo-500 hover:from-violet-500 hover:to-indigo-400 shadow-md shadow-violet-500/20 hover:shadow-violet-500/30 transition-all active:scale-95"
        >
          Start your first interview
          <ArrowRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Past sessions — placeholder for future sprint */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-display text-lg font-semibold flex items-center gap-2">
            <BarChart2 className="w-4 h-4 text-muted-foreground" />
            Past sessions
          </h2>
        </div>
        <div className="rounded-xl border border-border bg-card/50 px-6 py-10 text-center text-sm text-muted-foreground">
          Your completed interview sessions will appear here.
        </div>
      </div>
    </div>
  );
}

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string;
  subtext: string;
}

function StatCard({ icon, label, value, subtext }: StatCardProps) {
  return (
    <div className="rounded-xl border border-border bg-card p-5 space-y-3">
      <div className="flex items-center gap-2 text-muted-foreground text-sm">
        {icon}
        {label}
      </div>
      <p className="font-display text-2xl font-bold tracking-tight">{value}</p>
      <p className="text-xs text-muted-foreground">{subtext}</p>
    </div>
  );
}
