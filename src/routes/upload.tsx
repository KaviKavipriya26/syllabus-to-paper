import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { AlertCircle, FileText, Loader2, UploadCloud, X } from "lucide-react";
import { useRef, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { ACCEPTED, detectKind, extractText, formatSize } from "@/lib/extract-text";
import { usePaperStore } from "@/lib/paper-store";
import { extractSyllabus } from "@/lib/syllabus.functions";

export const Route = createFileRoute("/upload")({
  head: () => ({
    meta: [
      { title: "Upload Syllabus | Question Paper Generator" },
      {
        name: "description",
        content: "Upload your syllabus document as PDF, DOCX or TXT to extract units and topics.",
      },
      { property: "og:title", content: "Upload Syllabus" },
      {
        property: "og:description",
        content: "Drag and drop a PDF, DOCX or TXT syllabus to begin generating a question paper.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: UploadPage,
});

function UploadPage() {
  const navigate = useNavigate();
  const store = usePaperStore();
  const runExtract = useServerFn(extractSyllabus);
  const inputRef = useRef<HTMLInputElement>(null);

  const [file, setFile] = useState<File | null>(null);
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "reading" | "ready" | "extracting">("idle");
  const [error, setError] = useState("");
  const [dragging, setDragging] = useState(false);

  const accept = async (picked: File) => {
    setError("");
    setText("");
    setFile(picked);
    if (!detectKind(picked)) {
      setStatus("idle");
      setError("Unsupported file. Please upload a PDF, DOCX or TXT syllabus file.");
      return;
    }
    setStatus("reading");
    try {
      const raw = await extractText(picked);
      setText(raw);
      setStatus("ready");
    } catch (e) {
      setStatus("idle");
      setError(e instanceof Error ? e.message : "This document could not be read.");
    }
  };

  const onExtract = async () => {
    if (!text) return;
    setStatus("extracting");
    setError("");
    try {
      const syllabus = await runExtract({ data: { text } });
      store.update({
        rawText: text,
        fileInfo: file
          ? { name: file.name, size: file.size, kind: detectKind(file) ?? "txt" }
          : null,
        syllabus,
        paper: null,
        settings: {
          ...store.settings,
          unitWeightage: Object.fromEntries(
            syllabus.units.map((u) => [u.name, Math.round(100 / syllabus.units.length)]),
          ),
        },
      });
      navigate({ to: "/syllabus" });
    } catch (e) {
      setStatus("ready");
      setError(
        e instanceof Error && e.message
          ? e.message
          : "Unable to extract syllabus content. Please upload a valid PDF, DOCX, or TXT syllabus file.",
      );
    }
  };

  return (
    <Shell activeStep="/upload">
      <h1 className="text-2xl font-bold text-foreground">Upload Syllabus</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        We read the document in your browser and extract the units and topics.
      </p>

      <div
        role="button"
        tabIndex={0}
        onClick={() => inputRef.current?.click()}
        onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          const dropped = e.dataTransfer.files?.[0];
          if (dropped) void accept(dropped);
        }}
        className={`mt-6 flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-14 text-center transition-colors ${
          dragging ? "border-primary bg-accent" : "border-border bg-card hover:border-primary/60"
        }`}
      >
        <UploadCloud className="size-9 text-primary" />
        <p className="mt-4 text-lg font-semibold text-foreground">Upload Your Syllabus</p>
        <p className="mt-1 text-sm text-muted-foreground">Drag &amp; Drop your file here</p>
        <p className="my-2 text-xs uppercase text-muted-foreground">or</p>
        <Button type="button" variant="outline" onClick={() => inputRef.current?.click()}>
          Choose File
        </Button>
        <p className="mt-4 text-xs text-muted-foreground">PDF / DOCX / TXT · max 20 MB</p>
        <input
          ref={inputRef}
          type="file"
          accept={ACCEPTED}
          className="hidden"
          onChange={(e) => {
            const picked = e.target.files?.[0];
            if (picked) void accept(picked);
            e.target.value = "";
          }}
        />
      </div>

      {file && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-border bg-card p-4">
          <FileText className="mt-0.5 size-5 text-primary" />
          <div className="min-w-0 flex-1">
            <p className="truncate font-medium text-foreground">{file.name}</p>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {(detectKind(file) ?? "unknown").toUpperCase()} · {formatSize(file.size)}
            </p>
            <p className="mt-1 text-xs font-medium text-primary">
              {status === "reading" && "Reading document…"}
              {status === "ready" && "Uploaded · text extracted"}
              {status === "extracting" && "Analyzing syllabus…"}
              {status === "idle" && "Upload failed"}
            </p>
          </div>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Remove file"
            onClick={() => {
              setFile(null);
              setText("");
              setStatus("idle");
              setError("");
            }}
          >
            <X className="size-4" />
          </Button>
        </div>
      )}

      {error && (
        <div className="mt-4 flex items-start gap-2 rounded-lg border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <AlertCircle className="mt-0.5 size-4 shrink-0" />
          <p className="whitespace-pre-line">{error}</p>
        </div>
      )}

      <div className="mt-6">
        <Button
          size="lg"
          disabled={status !== "ready"}
          onClick={() => void onExtract()}
          className="w-full sm:w-auto"
        >
          {status === "extracting" && <Loader2 className="mr-2 size-4 animate-spin" />}
          Extract Syllabus
        </Button>
      </div>
    </Shell>
  );
}
