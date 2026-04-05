import { Settings2, Mic, FileText } from "lucide-react";

const steps = [
  {
    number: "01",
    icon: Settings2,
    title: "Configure your interview",
    description:
      "Choose your target job role, question type — technical, behavioral, or mixed — and set the difficulty. Takes under 30 seconds.",
  },
  {
    number: "02",
    icon: Mic,
    title: "Speak your answers",
    description:
      "The AI asks a question out loud. You click the mic, speak naturally, and click again to submit. No typing, no scripts — just you and the interviewer.",
  },
  {
    number: "03",
    icon: FileText,
    title: "Get your full debrief",
    description:
      "After the session ends, receive a comprehensive report: scores across clarity, structure, relevance, and confidence — plus specific suggestions to improve.",
  },
];

export function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 bg-muted/30">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Section header */}
        <div className="text-center mb-16">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-violet-500/30 bg-violet-500/10 text-violet-400 text-xs font-medium mb-4">
            How it works
          </div>
          <h2 className="font-display text-3xl sm:text-4xl font-bold tracking-tight">
            From zero to interview-ready{" "}
            <span className="bg-gradient-to-r from-violet-400 to-indigo-300 bg-clip-text text-transparent">
              in minutes
            </span>
          </h2>
        </div>

        {/* Steps */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 lg:gap-10 relative">
          {/* Connector line (desktop only) */}
          <div
            aria-hidden
            className="hidden md:block absolute top-9 left-[calc(33.33%+1rem)] right-[calc(33.33%+1rem)] h-px bg-gradient-to-r from-violet-600/30 via-indigo-500/30 to-violet-600/30"
          />

          {steps.map((step) => (
            <div key={step.number} className="relative flex flex-col items-center md:items-start text-center md:text-left">
              {/* Icon + number */}
              <div className="relative mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center shadow-lg shadow-violet-500/20">
                  <step.icon className="w-7 h-7 text-white" />
                </div>
                <div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-background border border-border flex items-center justify-center">
                  <span className="text-[9px] font-bold text-muted-foreground">{step.number}</span>
                </div>
              </div>

              <h3 className="font-display font-semibold text-lg mb-2">{step.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">{step.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
