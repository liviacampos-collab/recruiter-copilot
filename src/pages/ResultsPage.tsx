import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { KeySignals } from "@/components/KeySignals";
import { ProgressRing } from "@/components/ProgressRing";
import { parseRole, ROLE_OPTIONS } from "@/data/roles";
import type { GeminiAnalysis } from "@/types/geminiAnalysis";

const PLACEHOLDER_NAMES = /^(candidate|unknown|n\/a|not\s+provided|none)$/i;

/** Prefer model field; fall back to first resume line or outreach greeting—never show generic "Candidate". */
function resolveDisplayName(analysis: GeminiAnalysis, resumeText: string | undefined): string {
  const fromModel = analysis.candidateName?.trim() ?? "";
  if (fromModel && !PLACEHOLDER_NAMES.test(fromModel)) return fromModel;

  const raw = (resumeText ?? "").trim();
  if (raw) {
    const firstLine = raw.split(/\r?\n/).find((l) => l.trim())?.trim() ?? "";
    const head = firstLine.split(/[|\u2013\u2014\-–—]/)[0].trim();
    if (
      /^[A-Za-zÀ-ÿ'.-]+(?:\s+[A-Za-zÀ-ÿ'.-]+){1,4}$/.test(head) &&
      head.length >= 4 &&
      head.length <= 80 &&
      !PLACEHOLDER_NAMES.test(head)
    ) {
      return head;
    }
  }

  const greet = analysis.outreachMessage?.match(/^Hi\s+([^,\n]+),/i);
  if (greet?.[1]) {
    const first = greet[1].trim();
    if (first && !/^there$/i.test(first) && first.length <= 60) return first;
  }

  return "";
}

function BulletList({ items }: { items: string[] }) {
  return (
    <ul className="space-y-1.5">
      {items.map((item, idx) => (
        <li key={`${idx}-${item.slice(0, 48)}`} className="flex gap-2 text-[13px] leading-snug text-nerdy-muted">
          <span className="mt-1.5 h-1 w-1 shrink-0 rounded-full bg-accent" aria-hidden />
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function ResultsPage() {
  const location = useLocation() as {
    state?: { optimizeFor?: string; candidateProfile?: string; geminiAnalysis?: GeminiAnalysis };
  };

  const role = parseRole(location.state?.optimizeFor);
  const gemini = location.state?.geminiAnalysis;

  const [outreachOpen, setOutreachOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  if (!gemini) {
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <h1 className="text-lg font-semibold text-nerdy-ink">No analysis loaded</h1>
        <p className="mt-2 text-sm text-nerdy-muted">
          Run <strong className="text-nerdy-ink">Generate analysis</strong> from the home page so Claude can score this
          candidate.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-nerdy-ink shadow-sm transition-colors hover:border-accent/40"
        >
          Back to home
        </Link>
      </div>
    );
  }

  const outreachText = gemini.outreachMessage;
  const blendSignal = Math.round((gemini.technicalDepth + gemini.aiNative) / 2);
  const isStaffRole = role === ROLE_OPTIONS[1];
  const gateConcern = !gemini.shouldScreen || gemini.overallMatch <= 70;

  const copyOutreach = async () => {
    try {
      await navigator.clipboard.writeText(outreachText);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2000);
    } catch {
      setCopied(false);
    }
  };

  const recommendationText =
    (gemini.recommendation != null && gemini.recommendation.trim() !== ""
      ? gemini.recommendation.trim()
      : gemini.summary.trim()) || "—";

  const displayName = resolveDisplayName(gemini, location.state?.candidateProfile);

  return (
    <div className="mx-auto max-w-4xl px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <div className="mb-5 flex flex-wrap items-start justify-between gap-3 border-b border-slate-200/90 pb-4">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple">Results</p>
          <h1 className="mt-1 text-xl font-semibold text-nerdy-ink sm:text-2xl">
            {displayName ? `Analysis for ${displayName}` : "Analysis"}
          </h1>
          <p className="mt-1 text-xs text-nerdy-muted">
            📍 Based on CV: {gemini.candidateLocation}
          </p>
          <p className="mt-1 text-lg font-semibold text-nerdy-ink">{role}</p>
          <p className="mt-1 text-[11px] font-medium text-accent">Powered by Claude (Anthropic)</p>
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <span
            className={`inline-flex items-center rounded-[20px] px-4 py-[6px] text-sm font-bold text-white ${
              gemini.shouldScreen ? "bg-[#22C55E]" : "bg-[#EF4444]"
            }`}
            role="status"
          >
            {gemini.shouldScreen ? "✓ SCREEN" : "✗ DO NOT SCREEN"}
          </span>
          <Link
            to="/"
            className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-nerdy-ink shadow-sm transition-colors hover:border-accent/40 hover:text-accent"
          >
            New analysis
          </Link>
        </div>
      </div>

      <GlassCard className="p-5 sm:p-6" hover delay={0}>
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
          <div className="min-w-0 flex-1">
            <h2 className="text-sm font-semibold text-nerdy-ink">Candidate match score</h2>
            <p className="mt-2 text-sm leading-relaxed text-nerdy-muted">{gemini.summary}</p>
            {gemini.areasToValidate.length > 0 ? (
              <div
                className={`mt-3 rounded-lg border px-3 py-2 text-xs leading-snug ${
                  gateConcern
                    ? "border-amber-200/90 bg-amber-50/90 text-amber-950"
                    : "border-slate-200 bg-slate-50 text-nerdy-muted"
                }`}
              >
                <p className={`font-semibold ${gateConcern ? "text-amber-950" : "text-nerdy-ink"}`}>Areas to probe</p>
                <ul className="mt-1.5 list-disc space-y-1 pl-4">
                  {gemini.areasToValidate.map((a, i) => (
                    <li key={`${i}-${a.slice(0, 48)}`}>{a}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>
          <div className="flex shrink-0 justify-center sm:justify-end">
            <ProgressRing value={gemini.overallMatch} size={108} stroke={6} />
          </div>
        </div>

        <div className="my-5 border-t border-slate-200/90" />

        <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-[11px] text-nerdy-muted">
          <span>
            <span className="font-semibold text-nerdy-ink">Overall match:</span> {gemini.overallMatch}/100
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span>
            <span className="font-semibold text-nerdy-ink">Seniority (model):</span> {gemini.seniority}
          </span>
          <span className="hidden sm:inline text-slate-300">|</span>
          <span>
            <span className="font-semibold text-nerdy-ink">Should screen:</span>{" "}
            <span className={gemini.shouldScreen ? "text-accent" : "text-nerdy-danger"}>
              {gemini.shouldScreen ? "Yes" : "No"}
            </span>
          </span>
        </div>

        <div>
          <h3 className="text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple">Signal breakdown</h3>
          <div className="mt-3">
            <KeySignals
              technicalDepth={gemini.technicalDepth}
              leadershipMentorship={blendSignal}
              roleCalibrationFit={gemini.aiNative}
              staffLeadershipMentorship={isStaffRole ? gemini.leadershipMentorship : undefined}
              labels={{
                technical: "Technical depth",
                leadership: "Tech / AI blend",
                calibration: "AI-native",
              }}
            />
          </div>
        </div>

        <div className="my-5 border-t border-slate-200/90" />

        <div className="grid gap-5 sm:grid-cols-3 sm:gap-4">
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple">Strengths</h3>
            <div className="mt-2">
              <BulletList items={gemini.strengths.length ? gemini.strengths : ["—"]} />
            </div>
          </div>
          <div>
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple">Areas to validate</h3>
            <div className="mt-2">
              <BulletList items={gemini.areasToValidate.length ? gemini.areasToValidate : ["—"]} />
            </div>
          </div>
          <div className="sm:col-span-1">
            <h3 className="text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple">Recommendation</h3>
            <p className="mt-2 whitespace-pre-wrap rounded-xl border border-accent/30 bg-accent-muted/50 p-3 text-[13px] leading-snug text-nerdy-ink">
              {recommendationText}
            </p>
          </div>
        </div>

        <div className="mt-5 border-t border-slate-200/90 pt-3">
          <button
            type="button"
            onClick={() => setOutreachOpen((o) => !o)}
            className="flex w-full items-center justify-between gap-2 rounded-lg py-2 text-left transition-colors hover:bg-slate-50/90"
            aria-expanded={outreachOpen}
          >
            <span className="text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple">
              Generated outreach (Claude)
            </span>
            <svg
              className={`h-4 w-4 shrink-0 text-nerdy-muted transition-transform duration-200 ${outreachOpen ? "rotate-180" : ""}`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
              aria-hidden
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {outreachOpen ? (
            <div className="mt-2 animate-fade-in">
              <div className="mt-2 max-h-40 overflow-y-auto rounded-lg border border-slate-200 bg-slate-50/90 p-3 text-[13px] leading-relaxed text-nerdy-ink shadow-inner">
                <p className="whitespace-pre-wrap">{outreachText || "—"}</p>
              </div>
              <button
                type="button"
                onClick={() => void copyOutreach()}
                disabled={!outreachText}
                className="mt-3 rounded-xl bg-[#4DD9D5] px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition-[filter] hover:brightness-105 disabled:pointer-events-none disabled:opacity-40"
              >
                {copied ? "Copied!" : "Copy message"}
              </button>
            </div>
          ) : null}
        </div>
      </GlassCard>
    </div>
  );
}
