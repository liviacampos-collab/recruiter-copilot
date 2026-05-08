import { useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/GlassCard";
import { PrimaryButton } from "@/components/PrimaryButton";
import { LoadingOverlay } from "@/components/LoadingOverlay";
import { API_BASE_URL } from "@/lib/apiBase";
import { DEFAULT_ROLE, ROLE_OPTIONS, type RecruiterRole } from "@/data/roles";
import { parseGeminiAnalysisJson } from "@/types/geminiAnalysis";
import { extractTextFromCvFile } from "@/lib/extractCvText";

const CV_ACCEPT = ".pdf,.docx,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document";

/** Shown as upload helper text and for wrong-file-type errors (no legacy .doc messaging). */
const FORMAT_HINT = "Supported formats: PDF or DOCX";

function CvUploadIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width="44"
      height="44"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M12 15V3m0 12-4-4m4 4 4-4M4 19h16a1 1 0 0 0 1-1v-3"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type ProfileInputMode = "paste" | "upload";

type UploadStatus = "idle" | "reading" | "success" | "error";

const UPLOAD_READ_ERROR =
  "Could not read file. Please try a PDF or DOCX file.";

function FileReadSpinner({ className }: { className?: string }) {
  return (
    <svg
      className={`animate-spin ${className ?? ""}`}
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
      width="20"
      height="20"
      aria-hidden
    >
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  );
}

export function HomePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [role, setRole] = useState<RecruiterRole>(DEFAULT_ROLE);
  const [candidateProfile, setCandidateProfile] = useState("");
  const [inputMode, setInputMode] = useState<ProfileInputMode>("paste");
  const [uploadStatus, setUploadStatus] = useState<UploadStatus>("idle");
  const [uploadFileName, setUploadFileName] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const resetUploadUi = () => {
    setUploadStatus("idle");
    setUploadFileName(null);
  };

  const processCvFile = async (file: File) => {
    setError(null);
    setUploadStatus("reading");
    try {
      const text = await extractTextFromCvFile(file);
      setCandidateProfile(text);
      setUploadFileName(file.name);
      setUploadStatus("success");
    } catch {
      setCandidateProfile("");
      setUploadFileName(null);
      setUploadStatus("error");
    }
  };

  const handleFileInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (file) void processCvFile(file);
  };

  const handleDrop = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer.files?.[0];
    if (file) void processCvFile(file);
  };

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleAnalyze = async () => {
    setError(null);
    const resumeText = candidateProfile.trim();
    if (!resumeText) {
      setError(
        inputMode === "upload"
          ? "Upload a CV or switch to Paste Profile."
          : "Paste a candidate profile or résumé before generating analysis.",
      );
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`${API_BASE_URL}/api/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ resumeText, role }),
      });
      const data = (await res.json()) as { result?: string; error?: string };

      if (!res.ok) {
        throw new Error(data.error || `Analysis failed (${res.status})`);
      }
      if (typeof data.result !== "string" || !data.result.trim()) {
        throw new Error("Empty response from analysis API");
      }

      const geminiAnalysis = parseGeminiAnalysisJson(data.result);
      navigate("/results", {
        state: { optimizeFor: role, candidateProfile, geminiAnalysis },
      });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong";
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <LoadingOverlay open={loading} message="Calling Claude…" />

      <div className="mx-auto max-w-xl px-4 py-10 sm:px-6 lg:py-14">
        <header className="mb-8 text-center animate-fade-in">
          <p className="mb-3 inline-flex items-center rounded-full border border-accent/35 bg-accent-muted/80 px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple">
            Recruiter Copilot
          </p>
          <h1 className="text-balance text-2xl font-semibold tracking-tight text-nerdy-ink sm:text-3xl">
            Recruiter Copilot
          </h1>
          <p className="mx-auto mt-2 max-w-lg text-sm font-medium text-accent">Nerdy - Transforming How People Learn</p>
          <p className="mx-auto mt-2 max-w-md text-sm text-nerdy-muted">
            AI-assisted hiring briefs for technical recruiting (Claude)
          </p>
        </header>

        <p className="mb-6 text-center text-sm text-nerdy-muted">
          Welcome back — hire well, we must! 🧙
        </p>

        <GlassCard className="p-6 sm:p-8" delay={40}>
          <label htmlFor="role" className="text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple">
            Role
          </label>
          <div className="relative mt-1.5">
            <select
              id="role"
              value={role}
              onChange={(e) => setRole(e.target.value as RecruiterRole)}
              className="w-full appearance-none rounded-xl border border-slate-200 bg-white px-4 py-3 pr-10 text-sm text-nerdy-ink shadow-sm transition-colors focus:border-accent/50 focus:outline-none focus:ring-2 focus:ring-accent/20"
            >
              {ROLE_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-nerdy-muted">▾</span>
          </div>

          <label
            htmlFor={inputMode === "paste" ? "candidate" : undefined}
            className="mt-6 block text-[10px] font-semibold uppercase tracking-wider text-nerdy-purple"
          >
            Candidate profile
          </label>

          <div
            className="mt-2 flex rounded-xl border border-slate-200 bg-slate-50/80 p-1"
            role="tablist"
            aria-label="Candidate input mode"
          >
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === "paste"}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                inputMode === "paste"
                  ? "bg-white text-nerdy-ink shadow-sm"
                  : "text-nerdy-muted hover:text-nerdy-ink"
              }`}
              onClick={() => {
                setInputMode("paste");
                resetUploadUi();
              }}
            >
              Paste Profile
            </button>
            <button
              type="button"
              role="tab"
              aria-selected={inputMode === "upload"}
              className={`flex-1 rounded-lg px-3 py-2 text-xs font-semibold transition-colors sm:text-sm ${
                inputMode === "upload"
                  ? "bg-white text-nerdy-ink shadow-sm"
                  : "text-nerdy-muted hover:text-nerdy-ink"
              }`}
              onClick={() => setInputMode("upload")}
            >
              Upload CV
            </button>
          </div>

          {inputMode === "paste" ? (
            <textarea
              id="candidate"
              value={candidateProfile}
              onChange={(e) => setCandidateProfile(e.target.value)}
              placeholder="Paste LinkedIn, resume, or notes…"
              rows={10}
              className="mt-1.5 min-h-[200px] w-full resize-y rounded-xl border border-slate-200 bg-slate-50/50 px-4 py-3 text-sm leading-relaxed text-nerdy-ink placeholder:text-nerdy-muted shadow-inner focus:border-accent/40 focus:outline-none focus:ring-2 focus:ring-accent/15"
            />
          ) : (
            <div className="mt-1.5">
              <input
                ref={fileInputRef}
                type="file"
                accept={CV_ACCEPT}
                className="sr-only"
                aria-label={`Choose CV file. ${FORMAT_HINT}`}
                onChange={handleFileInputChange}
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                disabled={uploadStatus === "reading"}
                className="flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-[#4DD9D5] bg-slate-50/40 px-4 py-12 text-center transition-colors hover:bg-slate-50/80 focus:outline-none focus:ring-2 focus:ring-[#4DD9D5]/35 disabled:pointer-events-none disabled:opacity-60"
              >
                <CvUploadIcon className="mb-3 text-[#4DD9D5]" />
                <span className="text-sm font-medium text-nerdy-ink">Drop your CV here or click to browse</span>
                <span className="mt-1 text-xs text-nerdy-muted">{FORMAT_HINT}</span>
              </button>

              {uploadStatus === "reading" ? (
                <div
                  className="mt-3 flex flex-col items-center gap-2 text-center text-xs text-nerdy-muted"
                  role="status"
                  aria-live="polite"
                >
                  <FileReadSpinner className="text-nerdy-muted" />
                  <span>Reading your file...</span>
                </div>
              ) : null}

              {uploadStatus === "success" && uploadFileName ? (
                <div
                  className="mt-3 flex flex-col items-center gap-0.5 text-center text-xs text-[#22C55E]"
                  role="status"
                  aria-live="polite"
                >
                  <span className="text-base font-semibold leading-none" aria-hidden>
                    ✓
                  </span>
                  <span className="mt-1 max-w-full truncate font-medium" title={uploadFileName}>
                    {uploadFileName}
                  </span>
                  <span className="font-medium">Ready to analyze</span>
                </div>
              ) : null}

              {uploadStatus === "error" ? (
                <div
                  className="mt-3 flex flex-col items-center gap-1 text-center text-xs text-[#EF4444]"
                  role="alert"
                >
                  <span className="text-base font-semibold leading-none" aria-hidden>
                    ✗
                  </span>
                  <span className="max-w-[280px] leading-snug">{UPLOAD_READ_ERROR}</span>
                </div>
              ) : null}
            </div>
          )}

          {error ? (
            <p
              className="mt-3 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-900"
              role="alert"
            >
              {error}
            </p>
          ) : null}

          <div className="mt-8 flex justify-center">
            <PrimaryButton
              size="lg"
              className="min-w-[220px]"
              onClick={handleAnalyze}
              disabled={loading || uploadStatus === "reading"}
            >
              Generate analysis
            </PrimaryButton>
          </div>
        </GlassCard>
      </div>
    </>
  );
}
