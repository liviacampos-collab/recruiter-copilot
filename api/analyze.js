import { runAnalyze } from "../recruiter-core.js";
import { postProcessAnalysisResult } from "../recruiter-post-process.js";

function setCors(res, req) {
  const origin = req.headers.origin;
  res.setHeader("Access-Control-Allow-Origin", origin || "*");
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function parseBody(req) {
  let body = req.body;
  if (typeof body === "string") {
    try {
      body = JSON.parse(body || "{}");
    } catch {
      body = {};
    }
  }
  if (!body || typeof body !== "object") body = {};
  return body;
}

export default async function handler(req, res) {
  setCors(res, req);

  if (req.method === "OPTIONS") {
    return res.status(204).end();
  }

  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  const body = parseBody(req);
  const out = await runAnalyze(body);
  if (out.statusCode === 200 && typeof out.json?.result === "string") {
    const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
    out.json.result = postProcessAnalysisResult(out.json.result, body.role, resumeText);
  }
  return res.status(out.statusCode).json(out.json);
}
