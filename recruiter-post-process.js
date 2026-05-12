/**
 * Post-process Claude analysis JSON: experience caps + crossRoleNote.
 * Imported by server.js and api/analyze.js.
 */

import { applyCrossRoleNoteToParsed } from "./recruiter-cross-role.js";

const ROLE_SENIOR = "Senior Software Engineer (AI Native)";
const ROLE_STAFF = "Staff Engineer (AI Native)";

const NOTE_STAFF_UNDER_10_YEARS =
  "⚠️ Profile looks more Senior-level than Staff\n— under 10 years experience is below Staff\nthreshold at Nerdy. Consider evaluating for\nSenior Engineer track instead.";

/** Always null: experience-based hard caps are disabled; Claude evaluates tenure in the prompt. */
export function extractEstimatedYearsFromResume(resumeText) {
  return null;
}

function roundOverallMatch(v) {
  const n = typeof v === "number" && Number.isFinite(v) ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Apply experience caps / shouldScreen only (no crossRoleNote here).
 */
export function applyExperienceCapsAndScreen(parsed, role, years) {
  if (years === null) return;
  const roleTrim = typeof role === "string" ? role.trim() : "";
  const om = roundOverallMatch(parsed.overallMatch);

  if (roleTrim === ROLE_STAFF && years < 10) {
    parsed.overallMatch = Math.min(om, 65);
    parsed.shouldScreen = false;
  } else if (roleTrim === ROLE_SENIOR && years < 5) {
    // Under 5y: cap; 5+ years: no cap (Claude score unchanged).
    parsed.overallMatch = Math.min(om, 45);
    parsed.shouldScreen = false;
  }
}

/**
 * Full pipeline: experience caps first, then crossRoleNote (or fixed Staff<10y banner).
 */
export function postProcessAnalysisResult(resultText, role, resumeText) {
  try {
    const parsed = JSON.parse(resultText);
    if (!parsed || typeof parsed !== "object") return resultText;

    const years = extractEstimatedYearsFromResume(resumeText);
    applyExperienceCapsAndScreen(parsed, role, years);

    const roleTrim = typeof role === "string" ? role.trim() : "";
    // Staff + <10y: fixed banner always (overrides Claude + generic crossRole); skip other crossRole rules.
    if (roleTrim === ROLE_STAFF && years !== null && years < 10) {
      parsed.crossRoleNote = NOTE_STAFF_UNDER_10_YEARS;
    } else {
      applyCrossRoleNoteToParsed(parsed, role);
    }

    return JSON.stringify(parsed);
  } catch {
    return resultText;
  }
}
