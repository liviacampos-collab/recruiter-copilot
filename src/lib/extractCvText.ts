import * as pdfjs from "pdfjs-dist";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import mammoth from "mammoth";

pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;

function extensionOf(file: File): string {
  const name = file.name.toLowerCase();
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1) : "";
}

async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdf = await pdfjs.getDocument({ data: new Uint8Array(data) }).promise;
  const parts: string[] = [];
  for (let p = 1; p <= pdf.numPages; p++) {
    const page = await pdf.getPage(p);
    const content = await page.getTextContent();
    const line = content.items
      .map((item) => {
        if (item && typeof item === "object" && "str" in item && typeof (item as { str: string }).str === "string") {
          return (item as { str: string }).str;
        }
        return "";
      })
      .join(" ");
    parts.push(line);
  }
  return parts.join("\n").replace(/\n{3,}/g, "\n\n").trim();
}

/**
 * Reads plain text from a CV file in the browser (PDF via pdf.js, Word .docx via mammoth).
 * Legacy `.doc` is not supported client-side; callers should surface the thrown error.
 */
export async function extractTextFromCvFile(file: File): Promise<string> {
  const ext = extensionOf(file);
  const buf = await file.arrayBuffer();

  if (ext === "pdf") {
    const text = await extractPdfText(buf);
    if (!text) throw new Error("No text could be read from this PDF. Try another export or paste the profile instead.");
    return text;
  }

  if (ext === "docx") {
    const { value } = await mammoth.extractRawText({ arrayBuffer: buf });
    const text = value.trim();
    if (!text) throw new Error("No text could be read from this Word file. Try another export or paste the profile instead.");
    return text;
  }

  if (ext === "doc") {
    throw new Error(
      "Legacy Word (.doc) files are not supported in the browser. Save as .docx or export to PDF, then upload again.",
    );
  }

  throw new Error("Unsupported file type. Use a PDF or Word .docx file.");
}
