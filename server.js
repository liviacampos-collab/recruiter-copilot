import "dotenv/config";
import http from "http";
// Prompt + analyze: ./recruiter-core.js — post-process (crossRole + experience caps): ./recruiter-post-process.js
import { runAnalyze } from "./recruiter-core.js";
import { postProcessAnalysisResult } from "./recruiter-post-process.js";

const PORT = 3001;
const ALLOWED_ORIGIN = "http://localhost:5174";

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", ALLOWED_ORIGIN);
  res.setHeader("Access-Control-Allow-Methods", "POST, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function sendJson(res, status, body) {
  setCors(res);
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(body));
}

function readBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on("data", (c) => chunks.push(c));
    req.on("end", () => {
      try {
        const raw = Buffer.concat(chunks).toString("utf8");
        resolve(raw ? JSON.parse(raw) : {});
      } catch (e) {
        reject(e);
      }
    });
    req.on("error", reject);
  });
}

const server = http.createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    setCors(res);
    res.writeHead(204);
    return res.end();
  }

  if (req.method !== "POST" || req.url !== "/api/analyze") {
    if (req.method === "GET" && req.url === "/health") {
      setCors(res);
      res.writeHead(200, { "Content-Type": "application/json" });
      return res.end(JSON.stringify({ ok: true }));
    }
    return sendJson(res, 404, { error: "Not found" });
  }

  let body;
  try {
    body = await readBody(req);
  } catch {
    return sendJson(res, 400, { error: "Invalid JSON body" });
  }

  const out = await runAnalyze(body);
  if (out.statusCode === 200 && typeof out.json?.result === "string") {
    const resumeText = typeof body.resumeText === "string" ? body.resumeText : "";
    out.json.result = postProcessAnalysisResult(out.json.result, body.role, resumeText);
  }
  return sendJson(res, out.statusCode, out.json);
});

server.listen(PORT, () => {
  console.log(`API server listening on http://localhost:${PORT}`);
});
