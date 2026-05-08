import * as pdfjsLib from "pdfjs-dist";
import mammoth from "mammoth";

/** jsDelivr mirrors npm `pdfjs-dist` at the same version as the app dependency (reliable on Vercel). */
pdfjsLib.GlobalWorkerOptions.workerSrc = `https://cdn.jsdelivr.net/npm/pdfjs-dist@${pdfjsLib.version}/build/pdf.worker.min.mjs`;

function extensionOf(file: File): string {
  const name = file.name.toLowerCase();
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i + 1) : "";
}

async function extractPdfText(data: ArrayBuffer): Promise<string> {
  const pdf = await pdfjsLib.getDocument({ data: new Uint8Array(data) }).promise;
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
 * Reads plain text from a CV file in the browser (PDF via pdf.js, DOCX via mammoth).
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
    if (!text) throw new Error("No text could be read from this DOCX. Try another export or paste the profile instead.");
    return text;
  }

  throw new Error("Unsupported file type. Use PDF or DOCX only.");
}
