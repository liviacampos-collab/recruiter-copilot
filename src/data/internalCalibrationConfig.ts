import type { RecruiterRole } from "./roles";

/**
 * Internal calibration — consumed by match scoring (`computeCalibratedOverallMatch`).
 * Dimensions used in the role-calibration pillar (benchmark-primary): benchmarks, preferred technologies,
 * leadership principles, then AI-native expectations (minority weight). JD summary is narrative context only.
 * Per role caps: 5 principles, 5 AI expectations, 6 technologies, 8 benchmarks.
 */

export interface LeadershipPrincipleCalibration {
  principle: string;
  description: string;
}

export interface AiNativeExpectationCalibration {
  title: string;
  /** Short; include concrete tokens (tools, practices) for stable overlap scoring */
  description: string;
}

export interface PreferredTechnologyCalibration {
  name: string;
  /** One line: why this stack signal matters for this track */
  note: string;
}

export interface InternalRoleCalibration {
  /** Concise internal JD — no manifesto or duplicate boilerplate */
  jobDescription: string;
  leadershipPrinciples: LeadershipPrincipleCalibration[];
  aiNativeExpectations: AiNativeExpectationCalibration[];
  preferredTechnologies: PreferredTechnologyCalibration[];
  benchmarkSuccessfulHireCharacteristics: string[];
}

const SENIOR_SSE_CALIBRATION: InternalRoleCalibration = {
  jobDescription: `Senior Software Engineer (AI Native): ship end-to-end product features (TypeScript/React/services) on AWS with CI/CD, on-call ownership, and pragmatic AI-assisted development (copilots, codegen, review discipline). Partner with product/design; prioritize production reliability, measurable delivery, and calm operational follow-through.`,

  leadershipPrinciples: [
    {
      principle: "Production ownership",
      description: "Owns delivery through deploy, observability, incidents, and durable fixes—not throw-over-the-wall handoffs.",
    },
    {
      principle: "Autonomous execution",
      description: "Breaks down ambiguity into shippable increments with clear tradeoffs and reversible changes.",
    },
    {
      principle: "Pragmatic craft",
      description: "Balances quality and speed; tests and observability where risk warrants without gold-plating.",
    },
    {
      principle: "Collaborative clarity",
      description: "Async-friendly updates, constructive review, and tight alignment with PM/design on outcomes.",
    },
    {
      principle: "Customer-grounded shipping",
      description: "Ties work to latency, reliability, accessibility, and measurable product impact.",
    },
  ],

  aiNativeExpectations: [
    {
      title: "AI-assisted delivery",
      description: "Daily use of IDE copilots, codegen, or assistants for scaffolding; human review and tests gate merges.",
    },
    {
      title: "Prompt and workflow hygiene",
      description: "Reusable prompts, small internal scripts, and documented patterns—not one-off magic strings.",
    },
    {
      title: "Evaluation reflex",
      description: "Treats model output as draft; checks correctness, security footguns, and regressions before ship.",
    },
    {
      title: "Automation in CI/CD",
      description: "Templates, checks, or hooks that speed the team without bypassing pipeline safety.",
    },
    {
      title: "Operational awareness",
      description: "Logging, tracing, or metrics so AI-accelerated changes stay observable in production.",
    },
  ],

  preferredTechnologies: [
    { name: "TypeScript", note: "Primary application language across UI and services." },
    { name: "React", note: "Credible frontend delivery with performance and accessibility basics." },
    { name: "Node.js", note: "APIs, service boundaries, and pragmatic decomposition." },
    { name: "AWS", note: "Deployable patterns: compute, datastores, IAM-aware changes." },
    { name: "CI/CD", note: "GitHub Actions–style pipelines, safe rollout and rollback habits." },
    { name: "Kubernetes", note: "Enough to work with platform abstractions and service ops." },
  ],

  benchmarkSuccessfulHireCharacteristics: [
    "Repeated production ownership: on-call, incidents, SLO-minded fixes.",
    "Clear autonomy: led features end-to-end with measurable customer or reliability impact.",
    "Distributed systems exposure: services, queues, or event-driven flows at real traffic.",
    "AWS/cloud fluency beyond buzzwords—deployed and operated what they built.",
    "CI/CD discipline: tests, pipelines, and incremental releases.",
    "AI-native tooling in delivery—Copilot, Cursor, or OpenAI-style APIs—with review rigor.",
    "Strong async collaboration: RFCs, crisp decisions, inclusive code review.",
    "Scalable mindset: performance, capacity, or cost-aware changes when scale matters.",
  ],
};

const STAFF_ENGINEER_CALIBRATION: InternalRoleCalibration = {
  jobDescription: `Staff Engineer (AI Native): set technical direction across squads—architecture ownership, cross-team alignment, mentoring senior ICs, and engineering standards. Shape platform and release strategy on AWS; ensure AI-assisted workflows scale safely (guardrails, evaluation, governance) without blocking teams. Hands-on enough to review, prototype, and unblock—multiplication over heroics.`,

  leadershipPrinciples: [
    {
      principle: "Cross-team technical leadership",
      description: "Drives alignment on boundaries, contracts, and phased delivery across multiple teams.",
    },
    {
      principle: "Architecture ownership",
      description: "Owns durable designs, migrations, and simplification of platform seams—not one-off hero projects.",
    },
    {
      principle: "Mentorship at scale",
      description: "Elevates senior engineers via design partnership, review culture, and shared playbooks.",
    },
    {
      principle: "Engineering standards",
      description: "Codifies patterns for quality, security, and operability that teams actually adopt.",
    },
    {
      principle: "Organizational influence",
      description: "Trusted bridge to product and leadership—strategy grounded in systems constraints and risk.",
    },
  ],

  aiNativeExpectations: [
    {
      title: "Org-wide AI guardrails",
      description: "Team patterns for generated code: review norms, secrets, dependency hygiene, blast-radius limits.",
    },
    {
      title: "Evaluation and quality gates",
      description: "Lightweight harnesses for high-risk AI outputs; proportionate rigor, not bureaucracy.",
    },
    {
      title: "Platform for assistants",
      description: "Prompts, tools, and workflows as internal products—versioned, discoverable, measurable savings.",
    },
    {
      title: "Risk-aware automation",
      description: "Automation with clear rollback and observability—especially on customer data paths.",
    },
    {
      title: "Technical narrative",
      description: "Decisions and diagrams that align execs, product, and engineers on tradeoffs.",
    },
  ],

  preferredTechnologies: [
    { name: "TypeScript", note: "Shapes shared libraries and API contracts across teams." },
    { name: "Distributed systems", note: "Consistency, idempotency, backpressure, graceful degradation under load." },
    { name: "AWS", note: "Architect-level reliability, networking, and cost-aware designs." },
    { name: "CI/CD & release", note: "Progressive delivery and safe paths for AI-accelerated changes." },
    { name: "Kubernetes", note: "Credible partnership with platform on operational contracts." },
    { name: "React (architecture)", note: "Frontend architecture influence—boundaries, performance, accessibility bar." },
  ],

  benchmarkSuccessfulHireCharacteristics: [
    "Led multi-team initiatives with clear technical strategy and phased execution.",
    "Deep architecture ownership: migrations, platform simplification, clarified service boundaries.",
    "Visible mentorship impact on senior engineers—design reviews and leveling.",
    "Cross-functional influence with product and stakeholders on roadmap tradeoffs.",
    "Engineering standards that stuck: patterns, docs, or tooling adopted broadly.",
    "Platform or strategy thinking—roadmaps tied to reliability and long-term maintainability.",
    "Operational excellence: observability, incident culture, and systemic prevention.",
    "Responsible AI-assisted engineering at scale—guardrails teams actually follow.",
  ],
};

export const INTERNAL_CALIBRATION_BY_ROLE: Record<RecruiterRole, InternalRoleCalibration> = {
  "Senior Software Engineer (AI Native)": SENIOR_SSE_CALIBRATION,
  "Staff Engineer (AI Native)": STAFF_ENGINEER_CALIBRATION,
};

export function getInternalCalibration(role: RecruiterRole): InternalRoleCalibration {
  return INTERNAL_CALIBRATION_BY_ROLE[role];
}
