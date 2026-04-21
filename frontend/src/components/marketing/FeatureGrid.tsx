import { Mic2, Brain, BarChart3, Zap, Target, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    icon: Mic2,
    title: "Voice-first interaction",
    description:
      "Speak naturally, just like a real interview. No typing, no forms — your voice is the interface.",
    accent: true,
  },
  {
    icon: Brain,
    title: "Intelligent follow-ups",
    description:
      "The AI listens to your specific answer and probes deeper — not a script, but a real conversation.",
    accent: false,
  },
  {
    icon: BarChart3,
    title: "Post-session debrief",
    description:
      "Scores across clarity, structure, relevance, and confidence — revealed after the session, not during. Stay in the zone.",
    accent: false,
  },
  {
    icon: Zap,
    title: "Powered by Groq Whisper",
    description:
      "Your words are transcribed in real-time with near-perfect accuracy. Latency measured in milliseconds, not seconds.",
    accent: false,
  },
  {
    icon: Target,
    title: "Any role, any level",
    description:
      "Software engineering, data science, product management, finance, marketing — the question bank adapts to your target role.",
    accent: false,
  },
  {
    icon: ShieldCheck,
    title: "Private by design",
    description:
      "No recordings stored. No judgment. Practice as many times as you want without anything saved beyond your session report.",
    accent: false,
  },
];

export function FeatureGrid() {
  return (
    <section id="features" className="py-24">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium mb-4">
            Why practice here?
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            Everything you need to walk in{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
              confident
            </span>
          </h2>
          <p className="mt-4 text-muted-foreground max-w-xl mx-auto">
            Built for serious preparation — not a toy chatbot, not a quiz app.
            A realistic interview simulation with real evaluation.
          </p>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {features.map((feature) => (
            <div
              key={feature.title}
              className={cn(
                "group relative rounded-2xl border p-6 transition-all duration-300",
                "hover:border-violet-500/40 hover:shadow-lg hover:shadow-violet-500/5",
                feature.accent
                  ? "bg-gradient-to-br from-violet-600/10 to-indigo-600/10 border-violet-500/30"
                  : "bg-card border-border"
              )}
            >
              {/* Icon */}
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center mb-4",
                  feature.accent
                    ? "bg-gradient-to-br from-violet-600 to-indigo-500 shadow-md shadow-violet-500/30"
                    : "bg-muted group-hover:bg-violet-500/10 transition-colors"
                )}
              >
                <feature.icon
                  className={cn(
                    "w-5 h-5",
                    feature.accent ? "text-white" : "text-muted-foreground group-hover:text-violet-400 transition-colors"
                  )}
                />
              </div>

              <h3 className="font-display font-semibold text-base mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
