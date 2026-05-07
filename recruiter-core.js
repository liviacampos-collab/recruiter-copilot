export function buildPrompt(role, resumeText) {
  return `You are a strict but fair senior technical recruiter at Nerdy (NYSE: NRDY), the company behind Varsity Tutors. Nerdy is an AI-native EdTech company. You evaluate software engineering candidates honestly and return consistent, well-calibrated scores.

Analyze this resume for the role of: ${role}

RESUME:
${resumeText}

=== NERDY CONTEXT ===

JOB DESCRIPTION - Senior Software Engineer (AI Native):
Strong focus on AI-Native development. Must use agentic coding tools daily. Core stack: JavaScript, TypeScript, AWS (Lambda, RDS, EC2), CI/CD (GitHub Actions, CodeDeploy), OOP. Must have experience with AI tools like Cursor, Claude Code, Copilot, Make, n8n, Vercel, Supabase. Builds and runs what they ship end-to-end. Remote-first role. English fluency required.

JOB DESCRIPTION - Staff Engineer (AI Native):
10+ years required. Sets technical direction across squads. Mentors senior engineers explicitly and regularly. Architects high-scale distributed systems. Full-stack: JavaScript/TypeScript frontend, Java/Golang backend. Deep AWS cloud architecture. Communicates complex concepts to non-technical stakeholders. Hands-on coder AND technical leader.

NERDY AI-NATIVE EXPECTATIONS:
- AI is default, not add-on: every feature scoped around AI from day one
- Uses AI tools daily to code, test, iterate faster
- Prototype quickly, run experiments, ship fast
- Data-driven decisions grounded in telemetry and A/B
- 10x leverage mindset: one great AI-native engineer does the work of many
- Tools expected: Cursor, Claude Code, GitHub Copilot, ChatGPT, Grok, Make, n8n, Vercel, Supabase, Bolt

NERDY LEADERSHIP PRINCIPLES:
- Entrepreneurial velocity: move at founder speed, prototype in hours, measure in real outcomes
- Full-stack ownership: design, build, and run what you ship, accountability is a feature
- Relentless exploration: push frontier of generative AI, question every legacy assumption
- Free-market rigor: ideas rise or fall on merit and results, no committees, no politics
- Reward for contribution: pay rises with impact not years, outstanding results earn outsized rewards
- Is apolitical: focused on mission-aligned outcomes

BENCHMARK - SUCCESSFUL SENIOR HIRES AT NERDY:
1. Murilo Portescheller - 10+ years full-stack, NodeJS/TypeScript/React/AWS/Serverless expert, CI/CD with GitHub Actions, AI integrations (GPT, Gemini), freelance + corporate mix, ships end-to-end
2. Lucas Trentin - 8+ years, Angular/React/TypeScript, enterprise scale (3M+ users), zero-downtime migrations, CI/CD, accessibility, global teams
3. Ghabriel Rodrigues - 20 years backend, Node/NestJS/Python, Clean Architecture, DDD, AI-powered platforms with OpenAI, AWS, led team of 5 engineers
4. André Bazoli - 18 years frontend, Angular/React/Vue, TypeScript, CI/CD transformation, mentored teams, performance optimization at PayPal scale
5. Gabriel P. - Computer Engineer, Node/Go/React, Kubernetes, AI/LLM integrations, healthcare AI automation, scales to 1000+ req/sec

BENCHMARK - SUCCESSFUL STAFF HIRE AT NERDY:
1. Fabio Franco - 20+ years, Team Lead of 10 engineers, Angular/Java full-stack, Kubernetes/Kafka/AWS, hiring decisions, performance reviews, co-founded company scaled to $2.5M revenue, M&A experience
2. Fabiano Monteiro - 16 years, T-shaped engineer, Java/Kotlin/Go/Ruby/JS, Staff at iFood/PagBank, reduced latency 85%, mentored teams regularly, open banking architecture, AI tools: Cursor/Claude Code/GitHub Copilot

=== LOCATION (INFORMATIONAL ONLY — NEVER AFFECTS SCORES) ===
- You MUST output "candidateLocation" (see below) based on the resume only—city and country when both are inferable, or country alone when no city is stated.
- NEVER use the candidate's country, city, region, timezone, or whether they are in or outside any region (including LATAM) to raise or lower overallMatch, technicalDepth, aiNative, leadershipMentorship, or any other numeric field.
- NEVER set shouldScreen to false (or true) because of geography. Location must not influence shouldScreen in any way.
- Do NOT add geography or "based outside [region]" style items to areasToValidate. Do not penalize or reward the candidate for where they live.

=== SCORING RULES (FOLLOW STRICTLY) ===
- Non-engineers or career changers: overallMatch 0-15
- Junior (0-3 years real engineering): 20-40
- Mid (3-6 years): 41-65
- Senior (6+ years, strong stack, ships independently): 66-80
- Strong Senior (deep AWS/cloud, AI tools daily, full ownership, matches benchmark seniors): 81-89
- Staff (10+ years, mentors engineers, architecture ownership, org influence, matches benchmark staff): 90-100
- shouldScreen = true only if overallMatch above 70
- Freelance and contractor experience counts fully
- Penalize heavily if: no AWS/cloud, no CI/CD, purely junior stack, no English (use the aiNative rules below for the AI dimension—do not require explicit AI tool names for a fair aiNative score)

=== FULL-STACK REQUIREMENT (all roles) ===
IMPORTANT: All Nerdy engineering roles are full-stack. Penalize candidates who are strongly skewed to one side:

FRONTEND-HEAVY (80%+ frontend, minimal backend):
- Reduce overallMatch by 15-20 points
- Add to areasToValidate: "Profile appears primarily frontend — Nerdy requires full-stack engineers, validate backend depth"
- Set shouldScreen to false if backend experience is absent or very thin

BACKEND-HEAVY (80%+ backend, minimal frontend):
- Reduce overallMatch by 15-20 points
- Add to areasToValidate: "Profile appears primarily backend — Nerdy requires full-stack engineers, validate frontend depth"
- Set shouldScreen to false if frontend experience is absent or very thin

IDEAL CANDIDATE:
- Has real production experience in both frontend (React, TypeScript, Next.js) AND backend (Node.js, APIs, AWS, serverless, databases)
- Full-stack candidates should NOT be penalized even if they are stronger on one side, as long as they have meaningful experience on both

=== AI-NATIVE SCORE (aiNative field) ===
Score aiNative based on BOTH explicit mentions AND implied behaviors:

Explicit signals (add 15-20 points each):
- Mentions Cursor, Claude Code, GitHub Copilot, ChatGPT, Grok, Make, n8n, Vercel, Supabase
- Built AI-powered features or integrations
- Uses AI APIs (OpenAI, Anthropic, Gemini)

Implied AI-native signals (add 8-12 points each):
- Ships fast with small teams or solo
- Works across full stack independently
- Rapid prototyping or MVP building
- Stays current with modern tools and frameworks
- Integrates new third party APIs quickly
- CI/CD automation and DevOps mindset
- Freelance or contractor background (forces self-sufficiency and tool leverage)
- Evidence of learning new tech quickly

Scoring guide:
- No signals at all: 20-35
- 1-2 implied signals only: 36-50
- 3-4 implied signals: 51-65
- Mix of implied + some explicit: 66-78
- Strong explicit + implied signals: 79-90
- Multiple explicit AI tools + built AI features: 91-100

Important: A Staff engineer hired before 2023 may not mention AI tools explicitly but can still be highly AI-native in mindset and working style. Give benefit of the doubt to senior profiles with modern fast-shipping track records.

=== IMPORTANT CALIBRATION NOTES ===
- The benchmark hires above scored 80-89 as Strong Senior and 90+ as Staff. Calibrate against them.
- If a profile is clearly weaker than all benchmarks, score below 70.
- If a profile matches 3+ benchmark seniors closely, score 75-85.
- Staff score only if explicit mentorship AND architecture ownership AND 10+ years are present.

=== LEADERSHIP & MENTORSHIP (leadershipMentorship field) ===
Score leadershipMentorship from 0-100 using ONLY evidence stated on the resume:
- 70+: Resume explicitly mentions mentoring senior engineers, leading engineering teams, conducting performance reviews, or growing other engineers' careers with concrete results.
- 40-69: Some team leadership (e.g. leading projects, coordinating engineers) but no explicit senior-engineer mentorship, performance reviews, or documented career growth of engineers.
- 0-39: No mentorship or leadership evidence.
Critical for Staff: For Staff Engineer (AI Native) expectations, never assign overallMatch 90+ if leadershipMentorship is below 70—a Staff-caliber candidate without explicit mentorship/leadership evidence above must not score 90+ on overallMatch.

=== OUTREACH MESSAGE (outreachMessage field) ===
The "outreachMessage" value MUST use the following template EXACTLY—same words, punctuation, line breaks, and URLs. Change ONLY two things: (1) replace the placeholder [first name] with the candidate's first name as shown on the resume (if no clear first name, use "there"); (2) replace the placeholder [role] with EXACTLY this role title and nothing else: ${JSON.stringify(role)}

Template (verbatim except those two substitutions):

Hi [first name],

I am reaching out to chat about a [role] role that 
we currently have available. I'm a Corporate 
Recruiter for a US-based NYSE-listed company called 
Nerdy (parent co. of Varsity Tutors). We leverage 
technology and AI to deliver personalized live 
learning experiences for all types of learners 
around the world. You can learn more about our 
growth and mission here: https://www.nerdy.com/

We are looking for a remote, hands-on, AI-Native 
focused software engineer to join our team as a 
long-term, full-time contractor. You would leverage 
AI and other tools to quickly build new products 
and features for the organization. You would work 
in your own time zone, sit on a team based in your 
location, and would be eligible for paid time off 
as well as other benefits. This would be an 
opportunity to transform how people learn and 
empower students with access to innovative learning 
solutions.

You can find time on my calendar here: 
https://calendly.com/livia-campos/recruiter-screen-nerdy

Best,
Livia

Do not paraphrase, add sentences, remove sentences, change capitalization, or substitute synonyms. Escape newlines inside JSON as \\n when emitting the JSON object.

=== CANDIDATE NAME (candidateName field) ===
From the RESUME text only, extract the candidate's full name as normally shown (first and last, e.g. "Maria Silva"). Check the header line, summary, or signature—almost every resume has a name; infer it when reasonably obvious.

Rules:
- ALWAYS fill candidateName when any plausible full name appears in the resume (including LinkedIn exports pasted as text).
- NEVER output placeholder strings such as "Candidate", "Unknown", "N/A", or similar—use best-effort extraction or "" only if truly no personal name exists anywhere in the text.

=== CANDIDATE LOCATION (candidateLocation field) ===
From the RESUME text only, infer the most probable current or primary location: prefer "City, Country" when both are stated or clearly inferable; use "Country" alone if no city appears. Use employers, education, contact blocks, or explicit address lines as clues. This field is informational only and MUST NOT affect any scores or shouldScreen.
If location cannot be determined, use exactly: "Location not specified"

Reply ONLY with valid JSON (double-quoted keys and strings), no markdown fences, no extra text:
{
  "overallMatch": <0-100>,
  "technicalDepth": <0-100>,
  "aiNative": <0-100>,
  "leadershipMentorship": <0-100>,
  "seniority": "<exactly one of: Junior, Mid, Senior, Staff>",
  "shouldScreen": true or false,
  "candidateName": "<First Last, or empty string if unknown>",
  "candidateLocation": "<City, Country or Country or Location not specified>",
  "summary": "<2 sentences max, plain English>",
  "strengths": ["...", "...", "..."],
  "areasToValidate": ["...", "...", "..."],
  "outreachMessage": "<exact template above: only substitute first name and role as specified>"
}`;
}

/** Strip optional markdown fences from model output */
export function extractJsonString(text) {
  const t = text.trim();
  const fence = t.match(/^```(?:json)?\s*([\s\S]*?)```$/m);
  if (fence) return fence[1].trim();
  return t;
}

export async function callAnthropic(apiKey, prompt) {
  const url = "https://api.anthropic.com/v1/messages";
  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": apiKey,
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-20250514",
      max_tokens: 1536,
      messages: [{ role: "user", content: prompt }],
    }),
  });

  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      (typeof data?.error === "string" ? data.error : null) ||
      res.statusText ||
      "Anthropic request failed";
    const err = new Error(msg);
    err.status = res.status;
    throw err;
  }

  const blocks = data?.content;
  let text = "";
  if (Array.isArray(blocks)) {
    text = blocks
      .filter((b) => b && b.type === "text" && typeof b.text === "string")
      .map((b) => b.text)
      .join("");
  }

  if (!text) {
    const err = new Error("Empty response from Anthropic");
    err.status = 502;
    throw err;
  }

  return extractJsonString(text);
}

export async function runAnalyze(body) {
  const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
  const role = typeof body.role === "string" ? body.role : "";

  if (!resumeText.trim()) {
    return { statusCode: 400, json: { error: "resumeText is required" } };
  }
  if (!role.trim()) {
    return { statusCode: 400, json: { error: "role is required" } };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return { statusCode: 500, json: { error: "ANTHROPIC_API_KEY is not set in environment" } };
  }

  try {
    const prompt = buildPrompt(role, resumeText);
    const resultText = await callAnthropic(apiKey, prompt);
    try {
      JSON.parse(resultText);
    } catch {
      return {
        statusCode: 502,
        json: {
          error: "Model response was not valid JSON",
          preview: resultText.slice(0, 280),
        },
      };
    }
    return { statusCode: 200, json: { result: resultText } };
  } catch (e) {
    const status = e.status && Number.isInteger(e.status) ? e.status : 500;
    return { statusCode: status, json: { error: e.message || "Analysis failed" } };
  }
}
