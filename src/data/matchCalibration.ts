/**
 * Weighted match calibration — recruiter-oriented, stable outcomes.
 * Overall weights are role-tuned (Senior emphasizes engineering depth; Staff adds calibration + leadership).
 * Role calibration fit blends JD dimensions with explicit Senior vs Staff dimension weights (benchmark-led; AI is enhancing).
 */

import type { EngineeringTier } from "./engineeringCalibration";
import type { InternalRoleCalibration } from "./internalCalibrationConfig";
import type { RecruiterRole } from "./roles";
import { seniorityOrgScopeCeiling, type SeniorityBand } from "./seniorityCalibration";

export type MatchConfidenceTier =
  | "non_engineering"
  | "junior_engineer"
  | "mid_partial_senior"
  | "senior_alignment"
  | "strong_senior_alignment"
  | "exceptional_staff";

export interface OverallMatchCalibration {
  match: number;
  passesEngineeringGate: boolean;
  pillarScores: {
    engineeringDepth: number;
    seniorityOwnership: number;
    /** Composite internal calibration (benchmark-primary); not AI-only token overlap */
    roleCalibrationFit: number;
    leadershipMentorship: number;
  };
  bandFloor: number;
  bandCeiling: number;
  alignmentFraction: number;
  seniorCoreUnlock: boolean;
  staffExceptionalUnlock: boolean;
  confidenceTier: MatchConfidenceTier;
  holisticSeniorStrength: number;
  unlockSeniorStrongBand: boolean;
  unlockStaffExceptional: boolean;
}

/** Temporary — Results debug panel row-level calibration overlap */
export interface CalibrationRowMatchDetail {
  label: string;
  coveragePercent: number;
  matchedTokens: string[];
  matchedPhrases: string[];
}

/** Temporary — full scoring transparency for calibration tuning */
export interface MatchCalibrationDebug {
  passesEngineeringGate: boolean;
  gateFailureReasons: string[];

  engineeringEvidenceScore: number;
  engineeringTier: EngineeringTier;
  engineeringCategoriesHit: number;
  engineeringDepthScore: number;
  engineeringTierAdjustment: string | null;
  engineeringSignalBonuses: string[];

  benchmarkScore: number;
  technologyScore: number;
  leadershipPrinciplesScore: number;
  aiNativeScore: number;

  benchmarkRowMatches: CalibrationRowMatchDetail[];
  technologyRowMatches: CalibrationRowMatchDetail[];
  leadershipPrincipleRowMatches: CalibrationRowMatchDetail[];
  aiExpectationRowMatches: CalibrationRowMatchDetail[];

  calibrationDimensionWeights: { benchmark: number; tech: number; principles: number; ai: number };
  calibrationWeightedSum: number;
  calibrationEvidenceBlendRatio: number;
  roleCalibrationAfterEvidenceBlend: number;
  benchmarkLedFloorApplied: boolean;
  benchmarkLedFloorCandidate: number | null;
  roleCalibrationBeforeAiNudges: number;
  roleCalibrationAiNudges: { description: string; delta: number }[];
  roleCalibrationFitScore: number;

  seniorityMaturityScore: number;
  seniorityScore: number;
  maturityBand: SeniorityBand;

  leadershipMentorshipScore: number;
  leadershipSeniorPathMatches: string[];
  leadershipStaffPathMatches: string[];
  seniorLeadershipBlendApplied: boolean;

  /** Regex/heuristic org influence read (0–100), independent of UI scope bar */
  organizationalInfluenceScore: number;
  /** Same formula as Results “Org scope” when gate passes */
  organizationalScopeUiScore: number | null;

  overallWeights: { engineering: number; seniority: number; calibration: number; leadership: number };
  weightedFormulaTerms: { engineering: number; seniority: number; calibration: number; leadership: number };
  matchSumBeforeClamp: number;
  globalClampRange: string;
  capsApplied: string[];
  penaltiesApplied: string[];
  staffExceptionalUnlock: boolean;
  staffRoleLiftApplied: boolean;
  finalMatch: number;
  formulaNarrative: string;
}

export interface CalibratedMatchWithDebug {
  calibration: OverallMatchCalibration;
  debug: MatchCalibrationDebug;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

export function matchConfidenceTierLabel(tier: MatchConfidenceTier): string {
  switch (tier) {
    case "non_engineering":
      return "Not showing engineering IC depth yet";
    case "junior_engineer":
      return "Reads junior / early-career engineering";
    case "mid_partial_senior":
      return "Mid-level—or partial Senior story on paper";
    case "senior_alignment":
      return "Solid Senior-level fit";
    case "strong_senior_alignment":
      return "Strong Senior-level fit";
    default:
      return "Staff-level scope—exceptional read";
  }
}

export function confidenceTierFromMatch(match: number, passesGate: boolean): MatchConfidenceTier {
  if (!passesGate || match < 12) return "non_engineering";
  if (match <= 42) return "junior_engineer";
  if (match <= 68) return "mid_partial_senior";
  if (match <= 78) return "senior_alignment";
  if (match < 90) return "strong_senior_alignment";
  return "exceptional_staff";
}

const STOPWORDS = new Set([
  "that",
  "with",
  "from",
  "their",
  "have",
  "this",
  "which",
  "than",
  "into",
  "such",
  "what",
  "when",
  "where",
  "will",
  "your",
  "been",
  "those",
  "these",
  "them",
  "about",
  "there",
  "other",
  "more",
  "most",
  "some",
  "very",
  "also",
  "just",
  "only",
  "then",
  "well",
  "much",
  "many",
  "make",
  "made",
  "like",
  "here",
  "each",
  "both",
  "same",
]);

/** Short phrases (2–4 tokens) from calibration text — stronger signal than lone tokens */
const PHRASE_RE = /\b[a-z][a-z0-9]+(?:\s+[a-z][a-z0-9]+){1,3}\b/g;

const AI_BUZZ_SURFACE = /\b(ai-first|ai powered|passionate about ai|love for ai|excited about genai)\b/i;
const AI_IN_DELIVERY =
  /\b(copilot|cursor\b|openai api|anthropic|langchain|vertex ai|bedrock|prompt engineering|\brag\b|embedding|fine-?tun|agentic workflow|llm in production)\b/i;
const AI_TOOLING_NAMED = /\b(copilot|cursor\b|claude|chatgpt|gpt-4|genai|codegen|ai-assisted)\b/i;

function normalizeProfile(profile: string): string {
  return profile.toLowerCase().replace(/\s+/g, " ");
}

function calibrationTokens(text: string): string[] {
  const raw = text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length >= 4 && !STOPWORDS.has(w));
  return [...new Set(raw)];
}

/**
 * Per calibration row: blend token recall with phrase hits — realistic overlap vs rigid keyword games.
 */
function rowCalibrationCoverage(profileNorm: string, rowText: string): number {
  const tokens = calibrationTokens(rowText).slice(0, 30);
  let tokenScore = 0;
  if (tokens.length > 0) {
    let hits = 0;
    for (const t of tokens) {
      if (profileNorm.includes(t)) hits++;
    }
    tokenScore = hits / tokens.length;
  }

  const phraseCandidates = rowText.toLowerCase().match(PHRASE_RE) ?? [];
  const phrases = [...new Set(phraseCandidates)]
    .map((p) => p.trim())
    .filter((p) => p.length >= 10 && !/^that |^with |^from /.test(p))
    .slice(0, 8);

  let phraseScore = 0;
  if (phrases.length > 0) {
    let phits = 0;
    for (const phrase of phrases) {
      if (profileNorm.includes(phrase)) phits++;
    }
    phraseScore = phits / phrases.length;
  }

  /** Weight phrases slightly higher — captures “distributed systems”, “event driven”, etc. */
  if (tokens.length === 0 && phrases.length === 0) return 0.35;
  if (tokens.length === 0) return phraseScore;
  if (phrases.length === 0) return tokenScore;
  return clamp(tokenScore * 0.55 + phraseScore * 0.45, 0, 1);
}

export function buildCalibrationRowMatchDetail(profile: string, rowText: string, label: string): CalibrationRowMatchDetail {
  const pn = normalizeProfile(profile);
  const tokens = calibrationTokens(rowText).slice(0, 30);
  const matchedTokens = tokens.filter((t) => pn.includes(t));
  const phraseCandidates = rowText.toLowerCase().match(PHRASE_RE) ?? [];
  const phrases = [...new Set(phraseCandidates)]
    .map((p) => p.trim())
    .filter((p) => p.length >= 10 && !/^that |^with |^from /.test(p))
    .slice(0, 8);
  const matchedPhrases = phrases.filter((ph) => pn.includes(ph));
  const cov = rowCalibrationCoverage(pn, rowText);
  return {
    label,
    coveragePercent: Math.round(cov * 100),
    matchedTokens,
    matchedPhrases,
  };
}

/** Average coverage across calibration strings — each row weighted equally (stable, comparable across roles). */
function corpusCalibrationOverlap(profile: string, rows: string[]): number {
  if (rows.length === 0) return 0;
  const pn = normalizeProfile(profile);
  const parts = rows.map((r) => rowCalibrationCoverage(pn, r));
  const avg = parts.reduce((a, b) => a + b, 0) / parts.length;
  return clamp(Math.round(avg * 100), 0, 100);
}

export interface CalibrationDimensionScores {
  benchmarkOverlap: number;
  preferredTechOverlap: number;
  leadershipPrinciplesOverlap: number;
  aiExpectationsOverlap: number;
}

/** Exposed for debugging / future UI — raw overlap before weighting and evidence blend */
export function computeCalibrationDimensionScores(
  profile: string,
  cal: InternalRoleCalibration
): CalibrationDimensionScores {
  const benchmarkOverlap = corpusCalibrationOverlap(profile, cal.benchmarkSuccessfulHireCharacteristics);
  const preferredTechOverlap = corpusCalibrationOverlap(
    profile,
    cal.preferredTechnologies.map((t) => `${t.name}\n${t.note}`)
  );
  const leadershipPrinciplesOverlap = corpusCalibrationOverlap(
    profile,
    cal.leadershipPrinciples.map((p) => `${p.principle}\n${p.description}`)
  );
  const aiExpectationsOverlap = corpusCalibrationOverlap(
    profile,
    cal.aiNativeExpectations.map((e) => `${e.title}\n${e.description}`)
  );
  return {
    benchmarkOverlap,
    preferredTechOverlap,
    leadershipPrinciplesOverlap,
    aiExpectationsOverlap,
  };
}

/** Role-specific weights — not equal averaging across calibration dimensions */
function calibrationDimensionWeights(role: RecruiterRole): {
  benchmark: number;
  tech: number;
  principles: number;
  ai: number;
} {
  if (role === "Staff Engineer (AI Native)") {
    return { benchmark: 0.4, tech: 0.15, principles: 0.3, ai: 0.15 };
  }
  return { benchmark: 0.5, tech: 0.25, principles: 0.15, ai: 0.1 };
}

interface RoleCalibrationFitDetailed {
  score: number;
  benchmarkOverlap: number;
  preferredTechOverlap: number;
  leadershipPrinciplesOverlap: number;
  aiExpectationsOverlap: number;
  calibrationDimensionWeights: { benchmark: number; tech: number; principles: number; ai: number };
  calibrationWeightedSum: number;
  calibrationEvidenceBlendRatio: number;
  roleCalibrationAfterEvidenceBlend: number;
  benchmarkLedFloorApplied: boolean;
  benchmarkLedFloorCandidate: number | null;
  roleCalibrationBeforeAiNudges: number;
  roleCalibrationAiNudges: { description: string; delta: number }[];
}

function roleCalibrationFitScoreDetailed(
  profile: string,
  cal: InternalRoleCalibration,
  evidenceScore: number,
  role: RecruiterRole
): RoleCalibrationFitDetailed {
  const isStaffRole = role === "Staff Engineer (AI Native)";
  const { benchmarkOverlap: B, preferredTechOverlap: T, leadershipPrinciplesOverlap: P, aiExpectationsOverlap: Ai } =
    computeCalibrationDimensionScores(profile, cal);

  const w = calibrationDimensionWeights(role);
  const calibrationWeightedSum = w.benchmark * B + w.tech * T + w.principles * P + w.ai * Ai;

  const evidenceBlend = isStaffRole ? 0.26 : 0.31;
  let composite = calibrationWeightedSum * (1 - evidenceBlend) + evidenceScore * evidenceBlend;
  const roleCalibrationAfterEvidenceBlend = composite;

  let benchmarkLedFloorCandidate: number | null = null;
  let benchmarkLedFloorApplied = false;
  if (!isStaffRole && B >= 56 && evidenceScore >= 46) {
    const cand = 0.54 * B + 0.32 * evidenceScore + 0.14 * T;
    benchmarkLedFloorCandidate = cand;
    const beforeFloor = composite;
    composite = Math.max(composite, cand);
    if (composite > beforeFloor + 1e-9) benchmarkLedFloorApplied = true;
  }
  if (isStaffRole && B >= 52 && evidenceScore >= 44) {
    const cand = 0.44 * B + 0.24 * evidenceScore + 0.2 * P + 0.12 * T;
    benchmarkLedFloorCandidate = cand;
    const beforeFloor = composite;
    composite = Math.max(composite, cand);
    if (composite > beforeFloor + 1e-9) benchmarkLedFloorApplied = true;
  }

  composite = Math.min(composite, 100);

  let score = clamp(Math.round(composite), 0, 100);
  const roleCalibrationBeforeAiNudges = score;
  const roleCalibrationAiNudges: { description: string; delta: number }[] = [];

  const grounded = /\b(ship|shipping|deploy|production|code review|pull request|pr\b|build|implement)\b/i.test(
    profile
  );
  if (AI_IN_DELIVERY.test(profile)) {
    roleCalibrationAiNudges.push({ description: "AI in delivery context", delta: +5 });
    score = clamp(score + 5, 0, 100);
  }
  if (AI_TOOLING_NAMED.test(profile) && grounded) {
    roleCalibrationAiNudges.push({ description: "Named AI tooling + grounded shipping language", delta: +4 });
    score = clamp(score + 4, 0, 100);
  }
  if (AI_BUZZ_SURFACE.test(profile) && !AI_IN_DELIVERY.test(profile)) {
    const buzzPenalty = B >= 60 ? 4 : 8;
    roleCalibrationAiNudges.push({
      description: `Surface AI buzz without delivery hooks (${B >= 60 ? "soft" : "standard"} penalty)`,
      delta: -buzzPenalty,
    });
    score = clamp(score - buzzPenalty, 0, 100);
  }

  return {
    score,
    benchmarkOverlap: B,
    preferredTechOverlap: T,
    leadershipPrinciplesOverlap: P,
    aiExpectationsOverlap: Ai,
    calibrationDimensionWeights: w,
    calibrationWeightedSum,
    calibrationEvidenceBlendRatio: evidenceBlend,
    roleCalibrationAfterEvidenceBlend,
    benchmarkLedFloorApplied,
    benchmarkLedFloorCandidate,
    roleCalibrationBeforeAiNudges,
    roleCalibrationAiNudges,
  };
}

const PROD_IMPACT = /\b(production|on-?call|postmortem|sla\b|slo\b|pagerduty|customer-facing|reliability)\b/i;
const AWS_CLOUD =
  /\b(aws|amazon web services|lambda|serverless|sqs|sns|dynamodb|api gateway|ecs|fargate|kubernetes|k8s|gcp|azure)\b/i;
const DISTRIBUTED_ARCH =
  /\b(distributed|microservices?|kafka|event[\s-]?driven|system design|architecture|rfc\b|scalabilit|high throughput)\b/i;
const CICD = /\b(ci\s*\/\s*cd|github actions|gitlab ci|jenkins|buildkite|deployment pipeline|terraform|pulumi)\b/i;
const AUTONOMOUS =
  /\b(autonomous|autonomously|independently|self-directed|sole engineer|end-to-end|owned)\b/i;
const LONG_TERM_OWN =
  /\b(maintained for \d+|years (of )?ownership|long[- ]running|legacy modernization|sustained|multi-?year)\b/i;
const MENTORING = /\b(mentor|mentorship|coached|developed engineers)\b/i;

function collectGateFailureReasons(
  profileLen: number,
  tier: EngineeringTier,
  evidenceScore: number,
  categoriesHit: number
): string[] {
  const reasons: string[] = [];
  if (tier === "insufficient" && profileLen < 100) {
    reasons.push("Engineering tier is insufficient and profile is shorter than 100 characters.");
  }
  if (profileLen > 0 && profileLen < 70) {
    reasons.push("Profile is shorter than 70 characters.");
  }
  if (categoriesHit < 1 && evidenceScore < 18) {
    reasons.push("No engineering category hit and evidence score is below 18.");
  }
  if (evidenceScore < 14 && categoriesHit < 2) {
    reasons.push("Evidence score is below 14 with fewer than two category hits.");
  }
  return reasons;
}

function engineeringTierAdjustmentLabel(tier: EngineeringTier): string | null {
  if (tier === "moderate") return "Moderate tier applies −5 to evidence basis before signal bonuses.";
  if (tier === "weak") return "Weak tier applies −12 to evidence basis before signal bonuses.";
  return null;
}

function collectEngineeringSignalBonuses(profile: string, engCal: { categoriesHit: string[] }): string[] {
  const cat = engCal.categoriesHit.length;
  const bonuses: string[] = [];
  if (PROD_IMPACT.test(profile)) bonuses.push("Production / on-call / reliability (+6 toward bonus bundle)");
  if (AWS_CLOUD.test(profile)) bonuses.push("AWS / cloud primitives (+6 toward bonus bundle)");
  if (DISTRIBUTED_ARCH.test(profile)) bonuses.push("Distributed systems / architecture signals (+6 toward bonus bundle)");
  if (CICD.test(profile)) bonuses.push("CI/CD & delivery automation (+5 toward bonus bundle)");
  if (MENTORING.test(profile)) bonuses.push("Mentoring language (+4 toward bonus bundle)");
  if (AUTONOMOUS.test(profile)) bonuses.push("Autonomy / ownership language (+3 toward bonus bundle)");
  if (cat >= 7) bonuses.push("Category breadth ≥7 (+4 capped bundle)");
  else if (cat >= 5) bonuses.push("Category breadth ≥5 (+3 capped bundle)");
  else if (cat >= 4) bonuses.push("Category breadth ≥4 (+2 capped bundle)");
  bonuses.push("Bonus bundle capped at +26 applied to depth score.");
  return bonuses;
}

/** Independent 0–100 heuristic for cross-org / strategy signals (debug only; not a scoring pillar). */
function organizationalInfluenceHeuristicScore(profile: string): number {
  let s = 0;
  if (/\b(cross[- ]?team|multi[- ]?team)\b/i.test(profile)) s += 28;
  if (/\b(org[- ]wide|organization-wide)\b/i.test(profile)) s += 22;
  if (/\b(engineering strategy|technical roadmap|platform strategy|architecture governance)\b/i.test(profile)) s += 22;
  if (/\b(stakeholders|executives?|c-suite)\b/i.test(profile)) s += 14;
  if (/\b(hiring|bar raiser)\b/i.test(profile)) s += 14;
  return clamp(s, 0, 100);
}

/** Soft minimum bar — avoids scoring noise on empty/non-IC pastes without multi-stage collapse */
function passesEngineeringImplementationGate(
  profileLen: number,
  tier: EngineeringTier,
  evidenceScore: number,
  categoriesHit: number
): boolean {
  if (tier === "insufficient" && profileLen < 100) return false;
  if (profileLen > 0 && profileLen < 70) return false;
  if (categoriesHit < 1 && evidenceScore < 18) return false;
  if (evidenceScore < 14 && categoriesHit < 2) return false;
  return true;
}

function engineeringDepthScore(
  profile: string,
  engCal: { tier: EngineeringTier; evidenceScore: number; categoriesHit: string[] }
): number {
  let s = engCal.evidenceScore;
  const tier = engCal.tier;
  const cat = engCal.categoriesHit.length;

  if (tier === "moderate") s -= 5;
  else if (tier === "weak") s -= 12;

  let bonus = 0;
  if (PROD_IMPACT.test(profile)) bonus += 6;
  if (AWS_CLOUD.test(profile)) bonus += 6;
  if (DISTRIBUTED_ARCH.test(profile)) bonus += 6;
  if (CICD.test(profile)) bonus += 5;
  if (MENTORING.test(profile)) bonus += 4;
  if (AUTONOMOUS.test(profile)) bonus += 3;
  if (cat >= 7) bonus += 4;
  else if (cat >= 5) bonus += 3;
  else if (cat >= 4) bonus += 2;

  s += Math.min(bonus, 26);
  return clamp(Math.round(s), 0, 100);
}

function seniorityOwnershipScore(profile: string, seniority: { maturityScore: number }): number {
  let s = seniority.maturityScore;
  if (AUTONOMOUS.test(profile)) s += 3;
  if (LONG_TERM_OWN.test(profile)) s += 3;
  return clamp(Math.round(s), 0, 100);
}

interface LeadershipMentorshipDetailed {
  score: number;
  seniorLeadershipBlendApplied: boolean;
  leadershipSeniorPathMatches: string[];
  leadershipStaffPathMatches: string[];
}

/**
 * Leadership pillar: strong Senior calibration should not require org-wide Staff cues.
 * Secondary dimension — when engineering + seniority already read strong, do not over-penalize partial leadership text.
 */
function leadershipMentorshipScoreDetailed(
  profile: string,
  role: RecruiterRole,
  engineeringDepth: number,
  seniorityOwnership: number
): LeadershipMentorshipDetailed {
  const hasIcLeadTitle =
    /\b(tech lead|technical lead|lead engineer|engineering lead|staff engineer|principal engineer|distinguished)\b/i.test(
      profile
    );
  const seniorChecks: { id: string; hit: boolean }[] = [
    { id: "mentoring", hit: /\b(mentor|mentorship|coached|developed engineers)\b/i.test(profile) },
    { id: "ic_lead_title", hit: hasIcLeadTitle },
    {
      id: "architecture_design",
      hit: /\b(architecture reviews?|design reviews?|rfc\b|design doc|system design)\b/i.test(profile),
    },
    { id: "hiring", hit: /\b(hiring|bar raiser|interview(\s+loop)?)\b/i.test(profile) },
    {
      id: "cross_functional_product",
      hit: /\b(cross[- ]functional|partnered with product|stakeholders)\b/i.test(profile),
    },
  ];
  const staffChecks: { id: string; hit: boolean }[] = [
    {
      id: "cross_team_org",
      hit: /\b(cross[- ]?team|multi[- ]?team|org[- ]wide|organization-wide)\b/i.test(profile),
    },
    {
      id: "strategy_governance",
      hit: /\b(engineering strategy|technical roadmap|platform strategy|architecture governance)\b/i.test(profile),
    },
  ];

  const leadershipSeniorPathMatches = seniorChecks.filter((x) => x.hit).map((x) => x.id);
  const leadershipStaffPathMatches = staffChecks.filter((x) => x.hit).map((x) => x.id);
  const sHits = leadershipSeniorPathMatches.length;
  const tHits = leadershipStaffPathMatches.length;
  const seniorFrac = sHits / seniorChecks.length;
  const staffFrac = tHits / Math.max(1, staffChecks.length);
  let score = Math.round(seniorFrac * 70 + staffFrac * 30);
  if (sHits >= 4 && tHits === 0) score = Math.max(score, 66);
  if (sHits >= 3 && tHits >= 2) score = clamp(score + 10, 0, 100);
  if (hasIcLeadTitle) {
    score = Math.max(score, clamp(48 + sHits * 4 + tHits * 10, 0, 92));
  }

  let seniorLeadershipBlendApplied = false;
  if (
    role === "Senior Software Engineer (AI Native)" &&
    engineeringDepth >= 68 &&
    seniorityOwnership >= 54 &&
    score < 60
  ) {
    seniorLeadershipBlendApplied = true;
    score = Math.round(score * 0.5 + 61 * 0.5);
  }

  return {
    score: clamp(score, 0, 100),
    seniorLeadershipBlendApplied,
    leadershipSeniorPathMatches,
    leadershipStaffPathMatches,
  };
}

function staffExceptionalEvidence(profile: string, isStaffRole: boolean): boolean {
  let pts = 0;
  if (/\b(mentor|mentorship|coached)\b/i.test(profile)) pts++;
  if (/\b(staff engineer|principal|distinguished|vp engineering|head of engineering)\b/i.test(profile)) pts++;
  if (/\b(cross[- ]?team|org-wide|stakeholders|multi[- ]?team|organizational)\b/i.test(profile)) pts++;
  if (/\b(engineering strategy|technical roadmap|platform strategy|architecture governance)\b/i.test(profile)) pts++;
  if (/\b(hiring|bar raiser)\b/i.test(profile)) pts++;
  return pts >= (isStaffRole ? 3 : 4);
}

/** Senior: engineering-first aggregate. Staff: slightly more calibration + leadership vs pure depth */
function overallMatchWeights(role: RecruiterRole): { eng: number; sen: number; cal: number; lead: number } {
  if (role === "Staff Engineer (AI Native)") {
    return { eng: 0.37, sen: 0.26, cal: 0.23, lead: 0.14 };
  }
  return { eng: 0.43, sen: 0.28, cal: 0.2, lead: 0.09 };
}

export function computeCalibratedMatchResult(
  profile: string,
  role: RecruiterRole,
  engCal: { tier: EngineeringTier; evidenceScore: number; categoriesHit: string[] },
  seniority: { band: SeniorityBand; maturityScore: number },
  internalCal: InternalRoleCalibration
): CalibratedMatchWithDebug {
  const p = profile.trim();
  const len = p.length;
  const categoriesHit = engCal.categoriesHit.length;
  const passesGate = passesEngineeringImplementationGate(len, engCal.tier, engCal.evidenceScore, categoriesHit);
  const dims = computeCalibrationDimensionScores(p, internalCal);

  const benchmarkRowMatches = internalCal.benchmarkSuccessfulHireCharacteristics.map((text) =>
    buildCalibrationRowMatchDetail(p, text, text.length > 110 ? `${text.slice(0, 107)}…` : text)
  );
  const technologyRowMatches = internalCal.preferredTechnologies.map((t) =>
    buildCalibrationRowMatchDetail(p, `${t.name}\n${t.note}`, t.name)
  );
  const leadershipPrincipleRowMatches = internalCal.leadershipPrinciples.map((row) =>
    buildCalibrationRowMatchDetail(p, `${row.principle}\n${row.description}`, row.principle)
  );
  const aiExpectationRowMatches = internalCal.aiNativeExpectations.map((row) =>
    buildCalibrationRowMatchDetail(p, `${row.title}\n${row.description}`, row.title)
  );

  const orgInf = organizationalInfluenceHeuristicScore(p);

  if (!passesGate) {
    const residual = clamp(
      Math.round(engCal.evidenceScore * 0.11 + categoriesHit * 2.2 + (len >= 40 ? 4 : 0)),
      2,
      14
    );
    const calibration: OverallMatchCalibration = {
      match: residual,
      passesEngineeringGate: false,
      pillarScores: {
        engineeringDepth: 0,
        seniorityOwnership: 0,
        roleCalibrationFit: 0,
        leadershipMentorship: 0,
      },
      bandFloor: 2,
      bandCeiling: 14,
      alignmentFraction: residual / 100,
      seniorCoreUnlock: false,
      staffExceptionalUnlock: false,
      confidenceTier: confidenceTierFromMatch(residual, false),
      holisticSeniorStrength: residual,
      unlockSeniorStrongBand: false,
      unlockStaffExceptional: false,
    };

    const ow = overallMatchWeights(role);
    const debug: MatchCalibrationDebug = {
      passesEngineeringGate: false,
      gateFailureReasons: collectGateFailureReasons(len, engCal.tier, engCal.evidenceScore, categoriesHit),
      engineeringEvidenceScore: engCal.evidenceScore,
      engineeringTier: engCal.tier,
      engineeringCategoriesHit: categoriesHit,
      engineeringDepthScore: 0,
      engineeringTierAdjustment: engineeringTierAdjustmentLabel(engCal.tier),
      engineeringSignalBonuses: collectEngineeringSignalBonuses(p, engCal),
      benchmarkScore: dims.benchmarkOverlap,
      technologyScore: dims.preferredTechOverlap,
      leadershipPrinciplesScore: dims.leadershipPrinciplesOverlap,
      aiNativeScore: dims.aiExpectationsOverlap,
      benchmarkRowMatches,
      technologyRowMatches,
      leadershipPrincipleRowMatches,
      aiExpectationRowMatches,
      calibrationDimensionWeights: calibrationDimensionWeights(role),
      calibrationWeightedSum: 0,
      calibrationEvidenceBlendRatio: 0,
      roleCalibrationAfterEvidenceBlend: 0,
      benchmarkLedFloorApplied: false,
      benchmarkLedFloorCandidate: null,
      roleCalibrationBeforeAiNudges: 0,
      roleCalibrationAiNudges: [],
      roleCalibrationFitScore: 0,
      seniorityMaturityScore: seniority.maturityScore,
      seniorityScore: 0,
      maturityBand: seniority.band,
      leadershipMentorshipScore: 0,
      leadershipSeniorPathMatches: [],
      leadershipStaffPathMatches: [],
      seniorLeadershipBlendApplied: false,
      organizationalInfluenceScore: orgInf,
      organizationalScopeUiScore: null,
      overallWeights: { engineering: ow.eng, seniority: ow.sen, calibration: ow.cal, leadership: ow.lead },
      weightedFormulaTerms: { engineering: 0, seniority: 0, calibration: 0, leadership: 0 },
      matchSumBeforeClamp: residual,
      globalClampRange: "2–14 (gate residual path)",
      capsApplied: [],
      penaltiesApplied: [],
      staffExceptionalUnlock: false,
      staffRoleLiftApplied: false,
      finalMatch: residual,
      formulaNarrative:
        "Gate failed: match = clamp(round(evidenceScore×0.11 + categoriesHit×2.2 + (profile≥40 chars ? 4 : 0)), 2, 14). Weighted pillar formula not applied.",
    };

    return { calibration, debug };
  }

  const isStaffRole = role === "Staff Engineer (AI Native)";
  const E = engineeringDepthScore(p, engCal);
  const S = seniorityOwnershipScore(p, seniority);
  const calFit = roleCalibrationFitScoreDetailed(p, internalCal, engCal.evidenceScore, role);
  const C = calFit.score;
  const leadDet = leadershipMentorshipScoreDetailed(p, role, E, S);
  const L = leadDet.score;

  const ow = overallMatchWeights(role);
  const weightedTerms = {
    engineering: ow.eng * E,
    seniority: ow.sen * S,
    calibration: ow.cal * C,
    leadership: ow.lead * L,
  };
  const rawWeightedSum = weightedTerms.engineering + weightedTerms.seniority + weightedTerms.calibration + weightedTerms.leadership;

  const capsApplied: string[] = [];
  const penaltiesApplied: string[] = [];

  let match = Math.round(rawWeightedSum);
  const beforeClamp = match;
  match = clamp(match, 38, 96);
  if (match !== beforeClamp) {
    capsApplied.push(`Pre-clamp sum rounded=${beforeClamp} → clamped to [38, 96] → ${match}`);
  }

  const staffUnlock = staffExceptionalEvidence(p, isStaffRole);
  let staffRoleLiftApplied = false;

  if (match >= 90 && !staffUnlock) {
    const prev = match;
    match = Math.min(match, 89);
    penaltiesApplied.push(`90+ Staff-evidence gate: ${prev} → ${match} (need stronger org/leadership signals for 90+)`);
  }

  if (isStaffRole && L >= 72 && staffUnlock) {
    const prev = match;
    match = clamp(match + 2, 38, 96);
    if (match !== prev) {
      staffRoleLiftApplied = true;
      capsApplied.push(`Staff opening adjustment: +2 when leadership≥72 and Staff unlock (${prev} → ${match})`);
    }
  }

  const osHi = seniorityOrgScopeCeiling(seniority.band);
  const organizationalScopeUiScore = clamp(Math.round(26 + (match / 100) * (osHi - 26)), 22, osHi);

  const confidenceTier = confidenceTierFromMatch(match, true);
  const seniorCoreUnlock = E >= 58 && S >= 52;
  const alignmentFraction = clamp(match / 100, 0, 1);

  const calibration: OverallMatchCalibration = {
    match,
    passesEngineeringGate: true,
    pillarScores: {
      engineeringDepth: E,
      seniorityOwnership: S,
      roleCalibrationFit: C,
      leadershipMentorship: L,
    },
    bandFloor: 38,
    bandCeiling: staffUnlock ? 96 : 89,
    alignmentFraction,
    seniorCoreUnlock,
    staffExceptionalUnlock: staffUnlock,
    confidenceTier,
    holisticSeniorStrength: Math.round((E + S + C + L) / 4),
    unlockSeniorStrongBand: seniorCoreUnlock,
    unlockStaffExceptional: staffUnlock,
  };

  const debug: MatchCalibrationDebug = {
    passesEngineeringGate: true,
    gateFailureReasons: [],
    engineeringEvidenceScore: engCal.evidenceScore,
    engineeringTier: engCal.tier,
    engineeringCategoriesHit: categoriesHit,
    engineeringDepthScore: E,
    engineeringTierAdjustment: engineeringTierAdjustmentLabel(engCal.tier),
    engineeringSignalBonuses: collectEngineeringSignalBonuses(p, engCal),
    benchmarkScore: dims.benchmarkOverlap,
    technologyScore: dims.preferredTechOverlap,
    leadershipPrinciplesScore: dims.leadershipPrinciplesOverlap,
    aiNativeScore: dims.aiExpectationsOverlap,
    benchmarkRowMatches,
    technologyRowMatches,
    leadershipPrincipleRowMatches,
    aiExpectationRowMatches,
    calibrationDimensionWeights: calFit.calibrationDimensionWeights,
    calibrationWeightedSum: calFit.calibrationWeightedSum,
    calibrationEvidenceBlendRatio: calFit.calibrationEvidenceBlendRatio,
    roleCalibrationAfterEvidenceBlend: calFit.roleCalibrationAfterEvidenceBlend,
    benchmarkLedFloorApplied: calFit.benchmarkLedFloorApplied,
    benchmarkLedFloorCandidate: calFit.benchmarkLedFloorCandidate,
    roleCalibrationBeforeAiNudges: calFit.roleCalibrationBeforeAiNudges,
    roleCalibrationAiNudges: calFit.roleCalibrationAiNudges,
    roleCalibrationFitScore: C,
    seniorityMaturityScore: seniority.maturityScore,
    seniorityScore: S,
    maturityBand: seniority.band,
    leadershipMentorshipScore: L,
    leadershipSeniorPathMatches: leadDet.leadershipSeniorPathMatches,
    leadershipStaffPathMatches: leadDet.leadershipStaffPathMatches,
    seniorLeadershipBlendApplied: leadDet.seniorLeadershipBlendApplied,
    organizationalInfluenceScore: orgInf,
    organizationalScopeUiScore,
    overallWeights: { engineering: ow.eng, seniority: ow.sen, calibration: ow.cal, leadership: ow.lead },
    weightedFormulaTerms: {
      engineering: weightedTerms.engineering,
      seniority: weightedTerms.seniority,
      calibration: weightedTerms.calibration,
      leadership: weightedTerms.leadership,
    },
    matchSumBeforeClamp: Math.round(rawWeightedSum * 1000) / 1000,
    globalClampRange: "[38, 96] then role-specific post-rules",
    capsApplied,
    penaltiesApplied,
    staffExceptionalUnlock: staffUnlock,
    staffRoleLiftApplied,
    finalMatch: match,
    formulaNarrative: `round(${ow.eng}×E(${E}) + ${ow.sen}×S(${S}) + ${ow.cal}×C(${C}) + ${ow.lead}×L(${L})) = ${Math.round(rawWeightedSum)}; then global clamp; then 90-cap / Staff +2 if applicable → ${match}`,
  };

  return { calibration, debug };
}

export function computeCalibratedOverallMatch(
  profile: string,
  role: RecruiterRole,
  engCal: { tier: EngineeringTier; evidenceScore: number; categoriesHit: string[] },
  seniority: { band: SeniorityBand; maturityScore: number },
  internalCal: InternalRoleCalibration
): OverallMatchCalibration {
  return computeCalibratedMatchResult(profile, role, engCal, seniority, internalCal).calibration;
}
