/**
 * Seniority / engineering maturity — technology overlap alone cannot imply Senior or Staff level.
 */

export type SeniorityBand = "junior_execution" | "mid_contribution" | "strong_senior" | "staff_ready";

export interface SeniorityCalibration {
  maturityScore: number;
  band: SeniorityBand;
  alerts: string[];
}

function clamp(n: number, min: number, max: number) {
  return Math.min(max, Math.max(min, n));
}

const OWNERSHIP_MARKERS =
  /\b(owned|ownership|led (the )?technical|technical lead|staff engineer|principal|architected|architectural|drove the|primary (owner|contributor)|accountable for|responsible for (the )?(system|platform|service))\b/i;

/**
 * Senior IC maturity — ownership, production, design participation, autonomy.
 * Does not require org-wide or Staff-only narratives.
 */
const SENIOR_MATURITY_POSITIVE: { id: string; pts: number; re: RegExp }[] = [
  { id: "architecture ownership", pts: 15, re: /\b(architecture owner|owned (the )?architecture|defined architecture|evolved (the )?architecture)\b/i },
  {
    id: "architecture participation",
    pts: 11,
    re: /\b(architecture reviews?|design reviews?|technical design|rfc\b|contributed to (the )?architecture|shaped (the )?architecture)\b/i,
  },
  { id: "system design depth", pts: 14, re: /\b(system design|designed (distributed )?systems|large-scale design|hld\b|design doc)\b/i },
  { id: "technical decision-making", pts: 13, re: /\b(technical (decisions|tradeoffs)|chose (the )?stack|evaluated technologies|decision record)\b/i },
  { id: "mentoring / uplift", pts: 12, re: /\b(mentor(ed|ship)?|coached engineers| grew (the )?team|level(ed|ing) up)\b/i },
  { id: "scaling systems", pts: 13, re: /\b(scaled (to|from)|high throughput|millions of|latency (budget|slos?)|capacity planning|performance at scale)\b/i },
  /** Product/partner collaboration — normal at Senior; not org-wide Staff bar */
  {
    id: "cross-functional delivery",
    pts: 9,
    re: /\b(cross[- ]?functional|partnered with product|worked (closely )?with (pm|product)|influenced (the )?roadmap)\b/i,
  },
  {
    id: "ambiguity handling",
    pts: 10,
    re: /\b(navigated ambiguity|undefined requirements|clarified requirements|0\s*→\s*1|greenfield|wore multiple hats|high uncertainty)\b/i,
  },
  { id: "long-term ownership", pts: 12, re: /\b(maintained for \d+|years (of )?ownership|long[- ]running|legacy modernization|sustained)\b/i },
  { id: "operational responsibility", pts: 13, re: /\b(on-?call|incident commander|postmortem|production support|pagerduty|runbooks?|sla\b|slo\b)\b/i },
];

/** Staff-scope narrative — used only to assign staff_ready band, not to imply mid-level when absent */
const STAFF_SCOPE_POSITIVE: { id: string; pts: number; re: RegExp }[] = [
  {
    id: "multi-team / org technical leadership",
    pts: 16,
    re: /\b(cross[- ]?team|multi[- ]?team|org[- ]wide|organization-wide|multiple teams|engineering-wide)\b/i,
  },
  {
    id: "strategic engineering direction",
    pts: 16,
    re: /\b(engineering strategy|technical roadmap|platform strategy|north star|multi-?year (technical |engineering )?plan|architecture governance)\b/i,
  },
  {
    id: "Staff+ title or explicit staff scope",
    pts: 14,
    re: /\b(staff engineer|principal engineer|distinguished engineer|head of engineering|vp engineering)\b/i,
  },
];

/** Junior / learning-context indicators — dampen seniority */
const MATURITY_NEGATIVE: { pts: number; re: RegExp; requireNoOwnership?: boolean }[] = [
  { pts: 24, re: /\b(internship|summer intern|intern)\b/i },
  { pts: 20, re: /\b(bootcamp|coding bootcamp|hack\s*reactor|lambda school|general assembly|flatiron)\b/i },
  { pts: 18, re: /\b(academic project|capstone project|coursework|thesis (project)?|university project|student project)\b/i },
  { pts: 12, re: /\bassisted with\b/i },
  { pts: 10, re: /\bcontributed to\b/i, requireNoOwnership: true },
  { pts: 14, re: /\bhelped (the )?team (with|to)\b/i, requireNoOwnership: true },
  { pts: 20, re: /\b(entry[\s-]level|junior developer|junior engineer|associate engineer|graduate engineer|new grad|recent graduate)\b/i },
  { pts: 12, re: /\b(first (engineering )?job|first role in tech|<\s*2\s*years|less than 2 years)\b/i },
  { pts: 10, re: /\bbasic (tasks|fixes)|small bug(s)?|minor feature(s)?|tickets only\b/i },
];

/** Keyword-rich stack lists without narrative maturity */
function techKeywordDensity(profile: string): number {
  const hits =
    (profile.match(/\b(react|typescript|python|java|aws|kubernetes|docker|node\.?js)\b/gi) ?? []).length;
  return hits;
}

const STAFF_BAND_MIN_MATURITY = 66;
const STAFF_BAND_MIN_SCOPE_PTS = 20;

function bandFromSeniorAndStaffScope(totalMaturity: number, staffScopePoints: number): SeniorityBand {
  if (totalMaturity < 40) return "junior_execution";
  if (totalMaturity < 54) return "mid_contribution";
  /** Strong Senior stands on IC + production maturity alone — Staff band needs explicit org/strategy signals */
  if (staffScopePoints >= STAFF_BAND_MIN_SCOPE_PTS && totalMaturity >= STAFF_BAND_MIN_MATURITY) {
    return "staff_ready";
  }
  return "strong_senior";
}

export function computeSeniorityCalibration(
  profile: string,
  engineeringEvidenceScore: number,
  engineeringCategoryHits: number
): SeniorityCalibration {
  const p = profile.trim();
  const alerts: string[] = [];

  let score = 44;
  let staffScopePoints = 0;

  const seenSenior = new Set<string>();
  for (const row of SENIOR_MATURITY_POSITIVE) {
    if (row.re.test(p) && !seenSenior.has(row.id)) {
      seenSenior.add(row.id);
      score += row.pts;
    }
  }

  const seenStaff = new Set<string>();
  for (const row of STAFF_SCOPE_POSITIVE) {
    if (row.re.test(p) && !seenStaff.has(row.id)) {
      seenStaff.add(row.id);
      staffScopePoints += row.pts;
      score += row.pts;
    }
  }

  for (const row of MATURITY_NEGATIVE) {
    if (!row.re.test(p)) continue;
    if (row.requireNoOwnership && OWNERSHIP_MARKERS.test(p)) continue;
    score -= row.pts;
  }

  /** Long tech lists without maturity narrative — soften penalty when ownership/production already shows */
  const kw = techKeywordDensity(p);
  const hasOwnershipOrProd =
    OWNERSHIP_MARKERS.test(p) || /\b(on-?call|production|postmortem|sla\b|architect)\b/i.test(p);
  if (engineeringCategoryHits >= 5 && seenSenior.size < 2 && kw >= 8 && score > 48) {
    const factor = hasOwnershipOrProd ? 0.9 : 0.82;
    score = Math.round(score * factor);
    alerts.push(
      "Stacks and tools show up, but ownership, architecture, and production responsibility are thin—reads more junior than the tech list suggests."
    );
  } else if (engineeringCategoryHits >= 4 && seenSenior.size < 3 && kw >= 6 && score > 50) {
    const factor = hasOwnershipOrProd ? 0.97 : 0.94;
    score = Math.round(score * factor);
    alerts.push(
      "Breadth of tech mentions without clear ownership of design, unclear scope, or navigating ambiguity—worth validating real Senior scope in conversation."
    );
  }

  if (engineeringEvidenceScore >= 52 && score < 40 && kw >= 6) {
    alerts.push(
      "Coding-adjacent wording present, but impact still reads junior or mid—confirm decision-making, complexity, and what they owned end-to-end before pitching Senior."
    );
  }

  score = clamp(score, 0, 100);

  const band = bandFromSeniorAndStaffScope(score, staffScopePoints);

  if (band === "junior_execution") {
    alerts.push(
      "Reads junior: internships, coursework, ‘assisted’ or ‘contributed’ framing, or limited ownership. Expect a lower match unless you gather stronger Senior-scope examples."
    );
  } else if (band === "mid_contribution") {
    alerts.push(
      "Solid mid-level read: execution and scope look contained—validate ownership, production responsibility, and design judgment before pitching strong Senior."
    );
  } else if (band === "strong_senior" && engineeringCategoryHits < 4) {
    alerts.push(
      "Senior-level ownership language with thinner concrete engineering detail—balance the narrative with hands-on depth in screen."
    );
  } else if (band === "strong_senior" && staffScopePoints < STAFF_BAND_MIN_SCOPE_PTS && score >= 62) {
    alerts.push(
      "Reads as strong Senior IC: depth and autonomy can land without org-wide Staff narrative—probe Staff themes only if the role demands cross-team technical leadership."
    );
  }

  const uniq = [...new Set(alerts)].slice(0, 4);

  return {
    maturityScore: score,
    band,
    alerts: uniq,
  };
}

/** Multiplier on technical depth after engineering gate */
export function seniorityTechnicalMultiplier(band: SeniorityBand): number {
  switch (band) {
    case "junior_execution":
      return 0.58;
    case "mid_contribution":
      return 0.76;
    case "strong_senior":
      return 0.93;
    default:
      return 0.96;
  }
}

/** Hard cap on displayed technical depth by maturity */
export function seniorityTechnicalCeiling(band: SeniorityBand): number {
  switch (band) {
    case "junior_execution":
      return 52;
    case "mid_contribution":
      return 68;
    case "strong_senior":
      return 88;
    default:
      return 90;
  }
}

/** Leadership & mentorship cannot present as Staff-heavy when maturity is junior/mid */
export function seniorityLeadershipCeiling(band: SeniorityBand): number {
  switch (band) {
    case "junior_execution":
      return 56;
    case "mid_contribution":
      return 70;
    case "strong_senior":
      return 86;
    default:
      return 90;
  }
}

export function seniorityStaffReadinessCeiling(band: SeniorityBand): number {
  switch (band) {
    case "junior_execution":
      return 42;
    case "mid_contribution":
      return 54;
    case "strong_senior":
      return 78;
    default:
      return 86;
  }
}

export function seniorityOrgScopeCeiling(band: SeniorityBand): number {
  switch (band) {
    case "junior_execution":
      return 40;
    case "mid_contribution":
      return 52;
    case "strong_senior":
      return 66;
    default:
      return 84;
  }
}

export function seniorityBandLabel(band: SeniorityBand): string {
  switch (band) {
    case "junior_execution":
      return "Junior-level";
    case "mid_contribution":
      return "Mid-level";
    case "strong_senior":
      return "Strong Senior";
    default:
      return "Staff-scope narrative";
  }
}
