import { computeEngineeringCalibration, engineeringDepthMultiplier, type EngineeringTier } from "./engineeringCalibration";
import { getInternalCalibration } from "./internalCalibrationConfig";
import {
  computeCalibratedOverallMatch,
  matchConfidenceTierLabel,
  type MatchConfidenceTier,
} from "./matchCalibration";
import type { RecruiterRole } from "./roles";
import {
  computeSeniorityCalibration,
  seniorityBandLabel,
  seniorityLeadershipCeiling,
  seniorityOrgScopeCeiling,
  seniorityStaffReadinessCeiling,
  seniorityTechnicalCeiling,
  seniorityTechnicalMultiplier,
  type SeniorityBand,
} from "./seniorityCalibration";

/** Retained for shared UI utilities (e.g. tables) — not used on the simplified results screen. */
export type StrengthLabel = "Strong" | "Moderate" | "Weak";

export interface AnalysisResult {
  optimizeFor: RecruiterRole;
  candidateMatch: number;
  /** Short paragraph under match score — reflects engineering gate when relevant */
  matchIntro: string;
  keySignals: {
    technicalDepth: number;
    leadershipMentorship: number;
    /** Full internal calibration blend (benchmark-primary), not AI-token overlap alone */
    roleCalibrationFit: number;
  };
  engineeringCalibration: {
    evidenceScore: number;
    tier: EngineeringTier;
    alerts: string[];
  };
  seniorityCalibration: {
    maturityScore: number;
    band: SeniorityBand;
    bandLabel: string;
    alerts: string[];
  };
  /** Gated Staff metrics — leadership/AI cannot inflate without implementation evidence */
  staffReadiness: number;
  organizationalScope: number;
  strengths: string[];
  areasToValidate: string[];
  recommendation: string;
  /** Overall fit band — drives recruiter summary copy */
  matchConfidenceTier: MatchConfidenceTier;
  matchConfidenceLabel: string;
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const TECH_RANGE: Record<SeniorityBand, [number, number]> = {
  junior_execution: [22, 42],
  mid_contribution: [32, 54],
  strong_senior: [44, 78],
  staff_ready: [46, 82],
};
const LEAD_RANGE: Record<SeniorityBand, [number, number]> = {
  junior_execution: [26, 48],
  mid_contribution: [36, 58],
  strong_senior: [46, 80],
  staff_ready: [50, 84],
};
const AI_RANGE: Record<SeniorityBand, [number, number]> = {
  junior_execution: [18, 42],
  mid_contribution: [28, 52],
  strong_senior: [34, 62],
  staff_ready: [38, 72],
};

function keySignalsFromCalibration(
  band: SeniorityBand,
  alignmentFraction: number,
  passesGate: boolean,
  evidenceScore: number,
  categoriesHit: number,
  unlockStrongSeniorAi: boolean
): { technicalDepth: number; leadershipMentorship: number; roleCalibrationFit: number } {
  const f = passesGate ? alignmentFraction : 0.12;
  const [tLo, tHi] = TECH_RANGE[band];
  const [lLo, lHi] = LEAD_RANGE[band];
  const [aLo, aHi] = AI_RANGE[band];
  let technicalDepth = clamp(Math.round(tLo + f * (tHi - tLo)), 12, 88);
  let leadershipMentorship = Math.min(
    clamp(Math.round(lLo + f * (lHi - lLo)), 18, 88),
    seniorityLeadershipCeiling(band)
  );
  let roleCalibrationFit = clamp(Math.round(aLo + f * (aHi - aLo)), 12, 86);
  if (!unlockStrongSeniorAi) roleCalibrationFit = Math.min(roleCalibrationFit, 68);
  if (!passesGate) {
    technicalDepth = clamp(Math.round(6 + evidenceScore * 0.22 + categoriesHit * 2), 4, 22);
    leadershipMentorship = clamp(Math.round(14 + categoriesHit * 2.5), 10, 32);
    roleCalibrationFit = clamp(Math.round(12 + evidenceScore * 0.15), 8, 28);
  }
  return { technicalDepth, leadershipMentorship, roleCalibrationFit };
}

const DIM: { re: RegExp; strength: string; area: string }[] = [
  { re: /\b(mentor|mentorship|coached|coaching)\b/i, strength: "Mentoring and people development", area: "Depth of mentorship ownership" },
  { re: /\b(tech(nical)? lead|lead engineer|technical direction)\b/i, strength: "Technical leadership in delivery", area: "Sustained technical leadership scope" },
  { re: /\b(cross[- ]?team|cross[- ]?functional|multi[- ]?team|stakeholders)\b/i, strength: "Cross-team partnership", area: "Scope of cross-team influence" },
  { re: /\b(hiring|interview(ing)?|bar raiser)\b/i, strength: "Hiring and bar-raising participation", area: "Depth of involvement in hiring and interview loops" },
  { re: /\b(architecture|rfc|design review|system design)\b/i, strength: "Architecture and design ownership", area: "Long-term technical strategy exposure" },
  { re: /\b(standards|golden path|developer experience|platform)\b/i, strength: "Engineering standards and platform thinking", area: "Ownership of durable engineering standards" },
];

const MATCH_STRONG_ENG = `Strong technical profile relative to what successful Nerdy engineering hires typically show—ownership and shipping language come through clearly.`;

function buildMatchIntro(tier: EngineeringTier, seniorityBand: SeniorityBand, passesEngineeringGate: boolean): string {
  if (!passesEngineeringGate) {
    return `This paste doesn’t yet show enough hands-on engineering—languages, shipped work, production systems, or delivery rhythm—to support a confident IC match. Ask for specifics before investing heavy interview time.`;
  }

  let intro: string;
  if (tier === "strong") {
    intro = MATCH_STRONG_ENG;
  } else if (tier === "moderate") {
    intro = `Hands-on engineering shows up, but with less depth than we usually see on strong Senior or Staff hires at Nerdy. Shape the screen around coding, systems ownership, and how they run production.`;
  } else if (tier === "weak") {
    intro = `Software engineering depth looks thin on paper. Leadership or AI mentions don’t replace evidence of building and running software—confirm delivery experience before advancing.`;
  } else {
    intro = `Very little here to judge engineering depth; treat the summary as tentative until the candidate adds concrete technical detail.`;
  }

  if (seniorityBand === "junior_execution" && (tier === "strong" || tier === "moderate")) {
    intro += ` Experience level still reads closer to junior than Senior—dig into scope of ownership, design decisions, and production responsibility.`;
  } else if (seniorityBand === "mid_contribution" && tier === "strong") {
    intro += ` Senior-level ownership isn’t fully evidenced yet—that’s different from missing Staff-style org influence; validate scope in screen.`;
  }

  return intro;
}

function buildRecommendation(args: {
  confidenceTier: MatchConfidenceTier;
  isStaff: boolean;
  passesGate: boolean;
}): string {
  const { confidenceTier, isStaff, passesGate } = args;

  if (!passesGate || confidenceTier === "non_engineering") {
    return (
      "Not ready to present as an engineering IC from this résumé alone—there isn’t enough evidence of building and shipping software. " +
      "Next step: ask for languages, recent deliveries, production ownership, and how they work with AI in practice before scheduling engineering time. " +
      "For leadership: candidate not validated as an engineering hire on available materials."
    );
  }

  switch (confidenceTier) {
    case "junior_engineer":
      return (
        "Early-career engineering story—appropriate for junior pipelines or roles with ramp room. " +
        "Confirm trajectory, complexity they’ve touched, and mentorability before pitching as Senior. Keep leveling honest in outreach."
      );
    case "mid_partial_senior":
      return (
        "Reads mid-level, or Senior where the résumé only partly backs Senior scope. " +
        (isStaff
          ? "For this Staff opening, stay exploratory until you’ve seen multiplication, cross-org leadership, and technical strategy in interview. "
          : "Run an engineering-heavy screen before presenting as a solid Senior fit. ") +
        "Exec takeaway: promising but needs depth validation."
      );
    case "senior_alignment":
      return (
        "Credible Senior prospect on paper—worth prioritizing for recruiter screen. " +
        "Brief the hiring manager on architecture judgment and how they operate once code is in production. " +
        "Exec takeaway: worth a technical loop."
      );
    case "strong_senior_alignment":
      return (
        "Strong Senior read: ownership, systems complexity, thoughtful AI-in-delivery habits, and production responsibility come through. " +
        "Fast-track to hiring-manager conversation; lead with impact and scope rather than tool names."
      );
    case "exceptional_staff":
      return (
        "Rare profile: Staff-level technical leadership, mentorship, cross-team architecture, and org-wide influence all read clearly. " +
        (isStaff
          ? "Exec-ready summary; plan a Staff-caliber panel and expect bar-raising behavior in loop. "
          : "Unusually strong Staff-level themes for a Senior posting—design the loop for Staff-level expectations if you advance. ") +
        "This should feel like a standout file, not a typical pass."
      );
    default:
      return "Keep standard engineering diligence—the summary landed in an open-ended band; stay conservative until interview fills gaps.";
  }
}

function buildStrengths(
  profile: string,
  technicalDepth: number,
  leadershipOverall: number,
  engScore: number,
  tier: EngineeringTier
): string[] {
  const out: string[] = [];

  if (engScore >= 48) {
    if (/distributed|microservice|systems?\s+design|service mesh|kafka|event[\s-]?driven/i.test(profile)) {
      out.push("Strong distributed systems experience");
    }
    if (/architect|rfc|design review|platform/i.test(profile)) {
      out.push("Clear architecture ownership");
    }
    if (/aws|kubernetes|k8s|ci\s*\/\s*cd|terraform|docker/i.test(profile)) {
      out.push("Strong AWS and CI/CD exposure");
    }
    if (technicalDepth >= 62) {
      out.push("Credible implementation and delivery experience on paper");
    }
  }

  if (leadershipOverall >= 58 && engScore >= 35 && /\bmentor|lead\s+engineer|tech\s+lead|coaching\b/i.test(profile)) {
    out.push("Evidence of mentoring and technical leadership alongside engineering work");
  }

  if (engScore >= 42 && /copilot|gpt|llm|gen\s*ai|ai-native|machine learning|ml\b|prompt/i.test(profile)) {
    out.push("AI-native tooling in an engineering delivery context");
  }

  DIM.forEach((d) => {
    if (d.re.test(profile) && !out.includes(d.strength) && out.length < 6) {
      out.push(d.strength);
    }
  });

  if (tier === "weak" || tier === "insufficient") {
    if (out.length === 0) {
      out.push("Profile may reflect transferable leadership or operations—software engineering depth still needs validation");
    }
    return out.slice(0, 5);
  }

  const defaults = [
    "Solid engineering fundamentals versus typical successful Nerdy hires",
    "Collaboration style consistent with recent strong hires",
  ];
  while (out.length < 3 && engScore >= 40) {
    const next = defaults[out.length % defaults.length];
    if (!out.includes(next)) out.push(next);
    else break;
  }

  return out.slice(0, 6);
}

function buildAreasToValidate(
  profile: string,
  isStaff: boolean,
  leadershipOverall: number,
  engCal: { alerts: string[]; tier: EngineeringTier; evidenceScore: number },
  seniorityAlerts: string[]
): string[] {
  const areas: string[] = [];

  for (const a of [...new Set([...engCal.alerts, ...seniorityAlerts])]) {
    if (!areas.includes(a) && areas.length < 8) areas.push(a);
  }

  if (engCal.tier !== "strong") {
    areas.push("Hands-on programming languages, frameworks, and recent shipping examples");
    areas.push("Production systems, on-call, or operational ownership of software");
  }

  DIM.forEach((d) => {
    if (!d.re.test(profile) && areas.length < 10 && engCal.evidenceScore >= 35) {
      areas.push(d.area);
    }
  });

  if (isStaff && leadershipOverall < 68 && engCal.evidenceScore >= 40) {
    areas.push("Staff-level multiplication and mentorship depth");
  }
  const lacksCrossTeam = !/cross[- ]?team|multi[- ]?team|org[- ]wide/i.test(profile);
  if (isStaff && lacksCrossTeam && !areas.some((x) => x.includes("cross-team"))) {
    areas.push("Cross-team technical leadership and organizational influence");
  }

  const uniq = [...new Set(areas)];
  return uniq.slice(0, 8);
}

/** Builds recruiter-facing analysis for the selected engineering role */
export function buildMockAnalysis(role: RecruiterRole, candidateProfile: string): AnalysisResult {
  const cal = getInternalCalibration(role);
  const profile = candidateProfile.trim();
  const density = clamp(profile.length / 1200, 0, 1);
  const isStaff = role === "Staff Engineer (AI Native)";

  const engCal = computeEngineeringCalibration(profile);
  const { evidenceScore, tier, alerts, categoriesHit } = engCal;

  const seniority = computeSeniorityCalibration(profile, evidenceScore, categoriesHit.length);

  const overallCalib = computeCalibratedOverallMatch(profile, role, engCal, seniority, cal);
  const candidateMatch = overallCalib.match;

  const techKw =
    /typescript|react|kubernetes|aws|distributed|system design|microservice|api\s|service\b/i.test(profile);

  const keySignals = keySignalsFromCalibration(
    seniority.band,
    overallCalib.alignmentFraction,
    overallCalib.passesEngineeringGate,
    evidenceScore,
    categoriesHit.length,
    overallCalib.unlockSeniorStrongBand
  );
  let { technicalDepth, leadershipMentorship, roleCalibrationFit } = keySignals;

  /** Role calibration bar tracks scoring pillar (benchmark + tech + principles + AI expectations blend) */
  if (overallCalib.passesEngineeringGate) {
    const pillarFit = overallCalib.pillarScores.roleCalibrationFit;
    roleCalibrationFit = clamp(Math.round(roleCalibrationFit * 0.2 + pillarFit * 0.8), 18, 92);
    if (!overallCalib.unlockSeniorStrongBand) {
      roleCalibrationFit = Math.min(roleCalibrationFit, 74);
    }
  }

  /** Light engineering-evidence shaping on displayed technical depth — does not change hard overall match */
  const techShape = clamp(Math.round(54 + density * 10 + (techKw ? 1 : 0)), 38, 88);
  technicalDepth = Math.round(
    (technicalDepth * 0.72 +
      Math.min(
        techShape * engineeringDepthMultiplier(evidenceScore) * seniorityTechnicalMultiplier(seniority.band),
        seniorityTechnicalCeiling(seniority.band)
      ) *
        0.28) /
      1
  );
  technicalDepth = clamp(Math.round(technicalDepth), 12, seniorityTechnicalCeiling(seniority.band));

  const srHi = seniorityStaffReadinessCeiling(seniority.band);
  const staffReadiness = overallCalib.passesEngineeringGate
    ? clamp(Math.round(30 + overallCalib.alignmentFraction * (srHi - 30)), 26, srHi)
    : clamp(Math.round(20 + evidenceScore * 0.14), 16, 34);

  const osHi = seniorityOrgScopeCeiling(seniority.band);
  const organizationalScope = overallCalib.passesEngineeringGate
    ? clamp(Math.round(26 + overallCalib.alignmentFraction * (osHi - 26)), 22, osHi)
    : clamp(Math.round(16 + evidenceScore * 0.12), 14, 30);

  const strengths = buildStrengths(profile, technicalDepth, leadershipMentorship, evidenceScore, tier);
  const extraAreas = !overallCalib.passesEngineeringGate
    ? [
        "Résumé is light on hands-on engineering—confirm languages, shipping history, and production ownership before investing interview capacity.",
      ]
    : [];
  const areasToValidate = buildAreasToValidate(profile, isStaff, leadershipMentorship, engCal, [
    ...seniority.alerts,
    ...extraAreas,
  ]);

  const recommendation = buildRecommendation({
    confidenceTier: overallCalib.confidenceTier,
    isStaff,
    passesGate: overallCalib.passesEngineeringGate,
  });

  const matchConfidenceLabel = matchConfidenceTierLabel(overallCalib.confidenceTier);

  return {
    optimizeFor: role,
    candidateMatch,
    matchIntro: buildMatchIntro(tier, seniority.band, overallCalib.passesEngineeringGate),
    keySignals: {
      technicalDepth,
      leadershipMentorship,
      roleCalibrationFit,
    },
    engineeringCalibration: {
      evidenceScore,
      tier,
      alerts,
    },
    seniorityCalibration: {
      maturityScore: seniority.maturityScore,
      band: seniority.band,
      bandLabel: seniorityBandLabel(seniority.band),
      alerts: seniority.alerts,
    },
    staffReadiness,
    organizationalScope,
    strengths,
    areasToValidate,
    recommendation,
    matchConfidenceTier: overallCalib.confidenceTier,
    matchConfidenceLabel,
  };
}
