/** Browser-side document text extraction for PDF / DOCX / TXT. */

export const ACCEPTED = ".pdf,.docx,.txt";

export type FileKind = "pdf" | "docx" | "txt";

export function detectKind(file: File): FileKind | null {
  const name = file.name.toLowerCase();
  if (name.endsWith(".pdf")) return "pdf";
  if (name.endsWith(".docx")) return "docx";
  if (name.endsWith(".txt") || name.endsWith(".md")) return "txt";
  return null;
}

export function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

async function extractPdf(file: File) {
  const pdfjs = await import("pdfjs-dist");
  const worker = await import("pdfjs-dist/build/pdf.worker.min.mjs?url");
  pdfjs.GlobalWorkerOptions.workerSrc = worker.default;
  const buffer = await file.arrayBuffer();
  const doc = await pdfjs.getDocument({ data: new Uint8Array(buffer) }).promise;
  let text = "";
  for (let i = 1; i <= doc.numPages; i += 1) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    text += `${content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ")}\n`;
  }
  return text;
}

async function extractDocx(file: File) {
  const mammoth = await import("mammoth/mammoth.browser.js");
  const buffer = await file.arrayBuffer();
  const result = await (mammoth as unknown as {
    extractRawText: (o: { arrayBuffer: ArrayBuffer }) => Promise<{ value: string }>;
  }).extractRawText({ arrayBuffer: buffer });
  return result.value;
}

export async function extractText(file: File): Promise<string> {
  const kind = detectKind(file);
  if (!kind) {
    throw new Error("Unsupported file. Please upload a PDF, DOCX or TXT syllabus file.");
  }
  if (file.size === 0) throw new Error("The selected file is empty. Please upload a valid file.");
  if (file.size > 20 * 1024 * 1024) throw new Error("File is too large. Maximum size is 20 MB.");

  let text = "";
  try {
    if (kind === "pdf") text = await extractPdf(file);
    else if (kind === "docx") text = await extractDocx(file);
    else text = await file.text();
  } catch {
    throw new Error(
      kind === "pdf"
        ? "This PDF could not be read. It may be corrupted or scanned as images."
        : "This document could not be read. Please check the file and try again.",
    );
  }

  if (text.replace(/\s/g, "").length < 60) {
    throw new Error(
      "Unable to extract syllabus content. Please upload a valid PDF, DOCX, or TXT syllabus file.",
    );
  }
  return text;
}
