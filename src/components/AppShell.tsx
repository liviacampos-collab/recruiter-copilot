import { Link, Outlet } from "react-router-dom";
import type { ReactNode } from "react";
import nerdyLogo from "../assets/Nerdy_Logo_Black.png";
import liveAiLogo from "../assets/Live_AI_Logo_TM.png";

export function AppShell({ children }: { children?: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-nerdy-page">
      <header className="sticky top-0 z-50 border-b border-white/10 bg-nerdy-nav backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3.5 sm:px-6 lg:px-8">
          <Link to="/" className="group flex items-center gap-3 transition-opacity hover:opacity-90">
            <div className="flex shrink-0 items-center">
              <img
                src={nerdyLogo}
                alt="Nerdy"
                className="mr-2 h-6 w-auto brightness-0 invert"
              />
              <img src={liveAiLogo} alt="Live+AI" className="h-6 w-auto translate-y-px" />
            </div>
            <div>
              <p className="text-sm font-semibold tracking-tight text-white">Recruiter Copilot</p>
              <p className="text-xs text-nerdy-teal/90">Nerdy · Technical recruiting</p>
            </div>
          </Link>
        </div>
      </header>
      <main className="flex-1">{children ?? <Outlet />}</main>
      <footer className="border-t border-slate-200/90 py-5 text-center text-xs text-nerdy-muted">
        Internal tool · Hiring insights
      </footer>
    </div>
  );
}
