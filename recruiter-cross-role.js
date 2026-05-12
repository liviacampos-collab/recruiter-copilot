/**
 * Deterministic crossRoleNote after Claude returns analysis JSON.
 * Used by recruiter-post-process.js (server.js / api/analyze.js).
 */

const ROLE_SENIOR = "Senior Software Engineer (AI Native)";
const ROLE_STAFF = "Staff Engineer (AI Native)";

const NOTE_SENIOR_TO_STAFF =
  "⭐ This candidate shows Staff-level signals \n— consider evaluating for Staff Engineer track";

const NOTE_STAFF_TO_SENIOR =
  "⚠️ Profile looks more Senior-level than Staff\n— consider evaluating for Senior Engineer track";

function roundOverallMatch(v) {
  const n = typeof v === "number" && Number.isFinite(v) ? v : Number(v);
  return Number.isFinite(n) ? Math.round(n) : 0;
}

/**
 * Mutates parsed analysis JSON in place.
 * @param {Record<string, unknown>} parsed
 * @param {string} role
 */
export function applyCrossRoleNoteToParsed(parsed, role) {
  const roleTrim = typeof role === "string" ? role.trim() : "";
  delete parsed.crossRoleNote;

  const overallMatch = roundOverallMatch(parsed.overallMatch);
  const seniority = typeof parsed.seniority === "string" ? parsed.seniority.trim() : "";

  if (roleTrim === ROLE_SENIOR) {
    if (overallMatch >= 80 && (seniority === "Staff" || seniority === "Senior")) {
      parsed.crossRoleNote = NOTE_SENIOR_TO_STAFF;
    } else {
      parsed.crossRoleNote = null;
    }
  } else if (roleTrim === ROLE_STAFF) {
    if (overallMatch < 65 || seniority === "Junior" || seniority === "Mid") {
      parsed.crossRoleNote = NOTE_STAFF_TO_SENIOR;
    } else {
      parsed.crossRoleNote = null;
    }
  } else {
    parsed.crossRoleNote = null;
  }
}

/**
 * @param {string} resultText - JSON string from Claude
 * @param {string} role - role from request body
 * @returns {string} - JSON string with crossRoleNote set or null
 */
export function applyCrossRoleNoteToResult(resultText, role) {
  try {
    const parsed = JSON.parse(resultText);
    if (!parsed || typeof parsed !== "object") return resultText;
    applyCrossRoleNoteToParsed(parsed, role);
    return JSON.stringify(parsed);
  } catch {
    return resultText;
  }
}
