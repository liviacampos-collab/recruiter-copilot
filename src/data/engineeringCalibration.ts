/**
 * Engineering implementation evidence & gating for Senior / Staff software engineer calibration.
 * Leadership, AI-native, or operational language cannot substitute for hands-on engineering signals.
 */

export type EngineeringTier = "strong" | "moderate" | "weak" | "insufficient";

export interface EngineeringCalibration {
  /** 0–100 aggregate strength of software implementation evidence */
  evidenceScore: number;
  tier: EngineeringTier;
  /** Recruiter-facing explanations (gaps, false positives, adjacent profiles) */
  alerts: string[];
  /** Category hits for debugging / future UI */
  categoriesHit: string[];
}

const CATEGORY_WEIGHTS: { id: string; weight: number; re: RegExp }[] = [
  {
    id: "Programming languages",
    weight: 14,
    re: /\b(python|java|typescript|javascript|js\b|node\.?js|go\b|golang|ruby|rust|kotlin|swift|c\+\+|c#|csharp|scala|php|perl|elixir)\b/i,
  },
  {
    id: "Software architecture",
    weight: 12,
    re: /\b(software architecture|system design|microservices?|monolith|bounded context|domain model|hexagonal|clean architecture|erd\b|rfc\b)\b/i,
  },
  {
    id: "Frontend / backend frameworks",
    weight: 12,
    re: /\b(react|vue\.?js|angular|svelte|next\.?js|nuxt|express|django|flask|fastapi|spring boot|\.net core|rails|nestjs)\b/i,
  },
  {
    id: "Cloud infrastructure",
    weight: 12,
    re: /\b(aws|amazon web services|gcp|google cloud|azure|kubernetes|k8s|eks|gke|aks|terraform|pulumi|cloudformation|lambda|ecs|s3\b|rds)\b/i,
  },
  {
    id: "CI/CD",
    weight: 10,
    re: /\b(ci\s*\/\s*cd|continuous integration|continuous deployment|github actions|gitlab ci|jenkins|circleci|buildkite|deployment pipeline)\b/i,
  },
  {
    id: "Distributed systems",
    weight: 11,
    re: /\b(distributed systems?|kafka|pulsar|redis cluster|sharding|replication|consistency|cap theorem|event[\s-]?driven|cqrs|saga\b)\b/i,
  },
  {
    id: "Production & reliability",
    weight: 11,
    re: /\b(production|on-?call|incident response|postmortem|post-mortem|sla\b|slo\b|observability|monitoring|tracing|pagerduty|datadog|prometheus|runbook)\b/i,
  },
  {
    id: "APIs & services",
    weight: 10,
    re: /\b(rest api|graphql|grpc|openapi|swagger|microservice|service mesh|backend service|endpoint)\b/i,
  },
  {
    id: "Engineering delivery",
    weight: 8,
    re: /\b(pull requests?|merge requests?|\bPRs?\b|code review|shipping code|released|sprint|story points|technical debt|refactor)\b/i,
  },
  {
    id: "Technical implementation",
    weight: 10,
    re: /\b(implemented|built from scratch|developed|engineered|wrote code|coding|programming|debugged|unit test|integration test|e2e test)\b/i,
  },
];

/** Strong overlap without implementation → dampen perceived engineering */
const GENERIC_TECH_FLUFF =
  /\b(leverage|synerg|stakeholder|alignment|roadmap|strategy|operational excellence|cross-functional|executed initiatives)\b/i;

const OPERATIONAL_ROLE =
  /\b(project manager|program manager|scrum master|agile coach|business analyst|operations analyst)\b/i;

const ADJACENT_NON_SOFTWARE =
  /\b(financial analyst|digital marketing|growth marketing|recruiter|talent acquisition|hr\b|human resources|customer success|account executive)\b/i;

const LEADERSHIP_ONLY_VERTICALS = /\b(managed team|people manager|direct reports)\b/i;

/** Primary-role style non-engineering (when little code evidence) */
const PRIMARY_NON_ENG_ROLE =
  /\b(head of people|director of marketing|vp sales|chief of staff)\b/i;

function tierFromScore(score: number, profileLength: number): EngineeringTier {
  if (profileLength < 40) return "insufficient";
  if (score >= 58) return "strong";
  if (score >= 32) return "moderate";
  return "weak";
}

export function computeEngineeringCalibration(profile: string): EngineeringCalibration {
  const p = profile.trim();
  const len = p.length;

  let weightedSum = 0;
  let maxPossible = 0;
  const categoriesHit: string[] = [];

  for (const c of CATEGORY_WEIGHTS) {
    maxPossible += c.weight;
    if (c.re.test(p)) {
      weightedSum += c.weight;
      categoriesHit.push(c.id);
    }
  }

  let evidenceScore = maxPossible > 0 ? Math.round((weightedSum / maxPossible) * 100) : 0;

  /** Short paste → cannot validate implementation */
  if (len > 0 && len < 120) {
    evidenceScore = Math.round(evidenceScore * 0.55);
  }

  /** Generic business language without category hits suggests non-implementation profile */
  if (categoriesHit.length <= 1 && GENERIC_TECH_FLUFF.test(p) && evidenceScore > 28) {
    evidenceScore = Math.round(evidenceScore * 0.65);
  }

  let tier = tierFromScore(evidenceScore, len);

  const alerts: string[] = [];

  const hasStrongCodeSignal = categoriesHit.length >= 4 || weightedSum >= 36;
  const codeAdjacent = OPERATIONAL_ROLE.test(p) || ADJACENT_NON_SOFTWARE.test(p);
  const leadershipHeavy = LEADERSHIP_ONLY_VERTICALS.test(p) && !/\b(engineer|developer|software|full[\s-]?stack)\b/i.test(p);

  if (tier === "insufficient" || len < 40) {
    alerts.push(
      "Very little text to judge hands-on engineering—ask for concrete examples of building and shipping software before relying on this summary."
    );
  }

  if (codeAdjacent && !hasStrongCodeSignal) {
    alerts.push(
      "Reads like PM, ops, analytics, or recruiting adjacent—software delivery depth isn’t coming through yet; confirm IC engineering experience if you advance."
    );
    evidenceScore = Math.min(evidenceScore, 38);
    tier = tierFromScore(evidenceScore, len);
  }

  if (PRIMARY_NON_ENG_ROLE.test(p) && evidenceScore < 45) {
    alerts.push(
      "Primary role looks outside core software engineering—leadership or AI mentions won’t substitute for hands-on build-and-ship experience."
    );
    evidenceScore = Math.min(evidenceScore, 32);
    tier = tierFromScore(evidenceScore, len);
  }

  if (leadershipHeavy && categoriesHit.length < 3) {
    alerts.push(
      "Heavy on leadership language; light on languages, delivery, and production systems—confirm they still write code and own shipping."
    );
    evidenceScore = Math.min(evidenceScore, 42);
    tier = tierFromScore(evidenceScore, len);
  }

  if (tier === "weak") {
    alerts.push(
      "Limited evidence of stacks, production systems, APIs, CI/CD, or distributed work—worth a targeted pass on what they’ve actually built and run."
    );
  } else if (tier === "moderate" && categoriesHit.length < 4) {
    alerts.push(
      "Some engineering depth on paper, but thinner than most Senior/Staff hires we screen—probe architecture, production ownership, and delivery cadence."
    );
  }

  if (GENERIC_TECH_FLUFF.test(p) && categoriesHit.length <= 2 && evidenceScore >= 25) {
    alerts.push(
      "Lots of strategy and stakeholder vocabulary; thin on shipped software—prioritize examples of code, releases, and operational ownership."
    );
  }

  const uniqAlerts = [...new Set(alerts)];
  return {
    evidenceScore: clamp(evidenceScore, 0, 100),
    tier,
    alerts: uniqAlerts.slice(0, 5),
    categoriesHit,
  };
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

/** Multiplier applied to raw technical depth before caps */
export function engineeringDepthMultiplier(evidenceScore: number): number {
  if (evidenceScore >= 58) return 1;
  if (evidenceScore >= 40) return 0.66;
  if (evidenceScore >= 22) return 0.44;
  return 0.26;
}

/** Scale leadership display so non-engineering profiles cannot score high on mentorship/influence alone */
export function gateLeadershipScore(rawLeadership: number, evidenceScore: number): number {
  const gate = clamp(evidenceScore / 62, 0, 1);
  /** Skeptical blend — leadership language cannot substitute for implementation context */
  const blended = 40 + (rawLeadership - 40) * (0.16 + 0.84 * gate);
  return clamp(Math.round(blended), 36, 92);
}

/** AI-native alignment requires engineering context for SWE roles */
export function gateAiNativeScore(rawAi: number, evidenceScore: number): number {
  const gate = clamp(evidenceScore / 55, 0, 1);
  const blended = 52 + (rawAi - 52) * (0.35 + 0.65 * gate);
  return clamp(Math.round(blended), 45, 92);
}

export function gateStaffReadiness(raw: number, evidenceScore: number): number {
  let v = raw;
  if (evidenceScore < 35) v = Math.min(v, 46);
  else if (evidenceScore < 48) v = Math.min(v, 58);
  else if (evidenceScore < 58) v = Math.min(v, 72);
  return clamp(Math.round(v), 38, 91);
}

export function gateOrganizationalScope(raw: number, evidenceScore: number): number {
  let v = raw;
  if (evidenceScore < 30) v = Math.min(v, 44);
  else if (evidenceScore < 45) v = Math.min(v, 56);
  else if (evidenceScore < 55) v = Math.min(v, 68);
  return clamp(Math.round(v), 36, 90);
}
