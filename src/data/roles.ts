export const ROLE_OPTIONS = [
  "Senior Software Engineer (AI Native)",
  "Staff Engineer (AI Native)",
] as const;

export type RecruiterRole = (typeof ROLE_OPTIONS)[number];

export const DEFAULT_ROLE: RecruiterRole = ROLE_OPTIONS[0];

export function parseRole(value: unknown): RecruiterRole {
  if (typeof value === "string" && (ROLE_OPTIONS as readonly string[]).includes(value)) {
    return value as RecruiterRole;
  }
  return DEFAULT_ROLE;
}
