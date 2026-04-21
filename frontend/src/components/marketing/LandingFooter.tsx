import { Mic } from "lucide-react";

export function LandingFooter() {
  return (
    <footer className="border-t border-border py-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-md bg-gradient-to-br from-violet-600 to-indigo-500 flex items-center justify-center">
            <Mic className="w-3 h-3 text-white" />
          </div>
          <span className="font-display font-bold text-sm">InterviewAI</span>
        </div>

        {/* Links - Placeholder until privacy and terms of service are determined */}
        <div className="flex items-center gap-5 text-sm text-muted-foreground">
          <a href="#" className="hover:text-foreground transition-colors">Privacy</a>
          <a href="#" className="hover:text-foreground transition-colors">Terms</a>
        </div>

        <p className="text-xs text-muted-foreground">
          © {new Date().getFullYear()} InterviewAI. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
