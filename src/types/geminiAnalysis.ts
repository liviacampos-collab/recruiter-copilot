/** Parsed JSON from /api/analyze (strict recruiter prompt; Claude-backed) */
export interface GeminiAnalysis {
  overallMatch: number;
  technicalDepth: number;
  aiNative: number;
  /** Mentoring / leading engineers (from resume evidence); used in UI for Staff role signal breakdown */
  leadershipMentorship: number;
  seniority: string;
  shouldScreen: boolean;
  /** Full name parsed from resume by the model */
  candidateName: string;
  /** City/country (or country only) inferred from resume; informational only */
  candidateLocation: string;
  summary: string;
  /** Optional; when present, Results page prefers this over summary in the Recommendation panel */
  recommendation?: string;
  strengths: string[];
  areasToValidate: string[];
  outreachMessage: string;
}

export function parseGeminiAnalysisJson(raw: string): GeminiAnalysis {
  const data = JSON.parse(raw) as Partial<GeminiAnalysis>;
  const num = (v: unknown, fallback: number) =>
    typeof v === "number" && Number.isFinite(v) ? clamp100(v) : fallback;

  return {
    overallMatch: num(data.overallMatch, 0),
    technicalDepth: num(data.technicalDepth, 0),
    aiNative: num(data.aiNative, 0),
    leadershipMentorship: num(data.leadershipMentorship, 0),
    seniority: typeof data.seniority === "string" ? data.seniority : "Mid",
    shouldScreen: Boolean(data.shouldScreen),
    candidateName: normalizeCandidateName(data.candidateName),
    candidateLocation: normalizeCandidateLocation(data.candidateLocation),
    summary: typeof data.summary === "string" ? data.summary : "",
    recommendation:
      typeof data.recommendation === "string" && data.recommendation.trim()
        ? data.recommendation.trim()
        : undefined,
    strengths: Array.isArray(data.strengths) ? data.strengths.filter((x) => typeof x === "string") : [],
    areasToValidate: Array.isArray(data.areasToValidate)
      ? data.areasToValidate.filter((x) => typeof x === "string")
      : [],
    outreachMessage: typeof data.outreachMessage === "string" ? data.outreachMessage : "",
  };
}

function clamp100(n: number) {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function normalizeCandidateName(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  if (!s || /^(candidate|unknown|n\/a|not\s+provided|none)$/i.test(s)) return "";
  return s;
}

const LOCATION_FALLBACK = "Location not specified";

function normalizeCandidateLocation(raw: unknown): string {
  const s = typeof raw === "string" ? raw.trim() : "";
  return s || LOCATION_FALLBACK;
}
