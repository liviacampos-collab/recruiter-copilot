import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { API_BASE_URL } from "@/lib/apiBase";
import { DEFAULT_ROLE, ROLE_OPTIONS, type RecruiterRole } from "@/data/roles";
import { parseGeminiAnalysisJson } from "@/types/geminiAnalysis";

export function HomePage() {
  const navigate = useNavigate();
  const [role, setRole] = useState<RecruiterRole>(DEFAULT_ROLE);
  const [candidateProfile, setCandidateProfile] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalyze = async () => {
    setError(null);
    const resumeText = candidateProfile.trim();
    if (!resumeText) {
      setError("Paste a candidate profile or résumé before generating analysis.");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, role }),
      });
      const data = (await res.json()) as { result?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error || `Analysis failed (${res.status})`);
      }
      if (typeof data.result !== "string" || !data.result.trim()) {
        throw new Error("Empty response from analysis API");
      }

      const geminiAnalysis = parseGeminiAnalysisJson(data.result);
      navigate("/results", {
        state: { optimizeFor: role, candidateProfile, geminiAnalysis },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay open={loading} message="Calling Claude…" />

      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="mb-8 text-center animate-fade-in">
          <p className="mb-3 inline-flex items-center rounded-full border border-accent/35 bg-accent-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple">
            Recruiter Copilot
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-nerdy-ink sm:text-3xl">
            Recruiter Copilot
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-accent">Nerdy - Transforming How People Learn</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-nerdy-muted">
            AI-assisted hiring briefs for technical recruiting (Claude)
          </p>
        </header>

        <p className="mb-6 text-center text-sm text-nerdy-muted">
          Welcome back, <span className="font-medium text-nerdy-ink">Livia</span> 👋
        </p>

        <GlassCard className="p-6 sm:p-8" delay={40}>
          <label htmlFor="role" className="text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple">
            Role
          </label>
          <div className="relative mt-1.5">
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as RecruiterRole)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-nerdy-ink shadow-sm transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-nerdy-muted">▾</span>
          </div>

          <label
            htmlFor="candidate"
            className="mt-6 block text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple"
          >
            Candidate profile
          </label>
          <textarea
            id="candidate"
            value={candidateProfile}
            onChange={(e) => setCandidateProfile(e.target.value)}
            placeholder="Paste LinkedIn, resume, or notes…"
            rows={10}
            className="mt-1.5 min-h-[200px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-relaxed text-nerdy-ink placeholder:text-nerdy-muted shadow-inner focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15"
          />

          {error ? (
            <p
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex justify-center">
            <PrimaryButton size="lg" className="min-w-[220px]" onClick={handleAnalyze} disabled={loading}>
              Generate analysis
            </PrimaryButton>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
