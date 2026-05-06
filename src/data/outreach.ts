import type { RecruiterRole } from "./roles";

const NERDY_URL = "https://www.nerdy.com/";
const CALENDLY_URL = "https://calendly.com/livia-campos/recruiter-screen-nerdy";

/** Shown in outreach when no candidate name is detected */
export const CANDIDATE_NAME_PLACEHOLDER = "[Candidate's name]";

const PLACEHOLDER_NAME = CANDIDATE_NAME_PLACEHOLDER;

/** Words that start a job headline, not a person's name */
const NON_NAME_LEADERS = new Set([
  "software",
  "senior",
  "staff",
  "principal",
  "lead",
  "full",
  "frontend",
  "front-end",
  "backend",
  "back-end",
  "machine",
  "data",
  "product",
  "project",
  "program",
  "engineering",
  "technical",
  "associate",
  "vp",
  "vice",
  "director",
  "head",
  "chief",
  "founding",
  "member",
  "of",
  "the",
]);

function normalizeWords(s: string): string {
  return s
    .toLowerCase()
    .replace(/['']/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/** Rejects lines like "Software Engineer" that matched title-case name pattern */
function isLikelyJobTitleOrHeadline(line: string): boolean {
  const n = normalizeWords(line);
  if (/\b(engineer|engineering|developer|architect|manager|management|scientist|designer|consultant|analyst|intern|contractor|freelancer|founder|cto|ceo|coo|vp)\b/i.test(line)) {
    return true;
  }
  if (/\s+at\s+[a-z]/i.test(line) || /\s+@\s+/.test(line)) return true;
  if (/[|•]/.test(line)) return false;

  const parts = n.split(" ");
  const first = parts[0] ?? "";
  if (NON_NAME_LEADERS.has(first)) return true;

  const joined = n.replace(/-/g, " ");
  if (
    joined.includes("software engineer") ||
    joined.includes("staff engineer") ||
    joined.includes("senior engineer") ||
    joined.includes("full stack") ||
    joined.includes("fullstack") ||
    joined === "engineer" ||
    joined.endsWith(" engineer")
  ) {
    return true;
  }

  return false;
}

/** Looks like a person name: 2–4 title-case tokens (hyphenated surnames ok), not a role string */
function looksLikePersonName(line: string): boolean {
  const trimmed = line.trim();
  if (trimmed.length < 3 || trimmed.length > 48) return false;
  const part = String.raw`[A-Z][a-z]+(?:-[A-Z][a-z]+)?`;
  if (!new RegExp(`^${part}(?:\\s+${part}){1,3}(?:\\s+[A-Z]\\.?)?$`).test(trimmed)) return false;
  if (isLikelyJobTitleOrHeadline(trimmed)) return false;
  return true;
}

function normalizeExtractedName(raw: string): string {
  return raw
    .trim()
    .replace(/\s+/g, " ")
    .replace(/[,;]+$/, "")
    .split(/\s+/)
    .slice(0, 6)
    .join(" ");
}

function isPlaceholderPaste(s: string): boolean {
  return /^\[Candidate'?s name\]$/i.test(s.trim());
}

/**
 * Best-effort name from pasted profile (full LinkedIn/resume, or a line like "Name: Jane Smith",
 * or a first line that looks like a person's name). Returns null → outreach uses [Candidate's name].
 */
export function extractCandidateName(profile: string): string | null {
  const lines = profile
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter(Boolean);

  for (const line of lines) {
    const labeled = line.match(/^\s*(?:candidate\s*)?name\s*[:—\-]\s*(.+)$/i);
    if (labeled?.[1]) {
      const candidate = normalizeExtractedName(labeled[1]);
      if (!candidate || isPlaceholderPaste(candidate)) continue;
      if (!isLikelyJobTitleOrHeadline(candidate)) return candidate;
    }
  }

  for (const line of lines.slice(0, 8)) {
    const beforeHeadline = line.split(/[|•]/)[0]?.trim() ?? line;
    if (isPlaceholderPaste(beforeHeadline)) continue;
    if (looksLikePersonName(beforeHeadline)) {
      return normalizeExtractedName(beforeHeadline);
    }
  }

  const linkedinHeadline = profile.match(/^([A-Z][a-z]+(?:\s+[A-Z][a-z]+)+)\s*[|•]/m);
  if (linkedinHeadline?.[1]) {
    const beforePipe = linkedinHeadline[1].trim();
    if (!isPlaceholderPaste(beforePipe) && !isLikelyJobTitleOrHeadline(beforePipe)) {
      return normalizeExtractedName(beforePipe);
    }
  }

  return null;
}

export function outreachRoleLabel(role: RecruiterRole): string {
  return role.startsWith("Staff") ? "Staff Engineer" : "Senior Software Engineer";
}

export function buildOutreachDraft(
  candidateProfile: string,
  role: RecruiterRole,
  variant: number
): string {
  const rawName = extractCandidateName(candidateProfile);
  const greetName = rawName ?? PLACEHOLDER_NAME;
  const roleTitle = outreachRoleLabel(role);
  const v = variant % 2;

  const openers = [
    `Hi ${greetName}, I am reaching out to chat about a ${roleTitle} role that we currently have available.`,
    `Hi ${greetName}, hope you're doing well — I'm reaching out about a ${roleTitle} opening on our engineering team.`,
  ];

  const body = `I'm a Corporate Recruiter for a US-based NYSE-listed company called Nerdy (parent co. of Varsity Tutors). We leverage technology and AI to deliver personalized live learning experiences for all types of learners around the world. You can learn more about our growth and mission here: ${NERDY_URL}

We are looking for a remote, hands-on, AI-Native focused software engineer to join our team as a long-term, full-time contractor. You would leverage AI and other tools to quickly build new products and features for the organization. You would work in your own time zone, sit on a team based in your location, and would be eligible for paid time off as well as other benefits. This would be an opportunity to transform how people learn and empower students with access to innovative learning solutions. You can find time on my calendar here: ${CALENDLY_URL}`;

  return `${openers[v]}

${body}`;
}
