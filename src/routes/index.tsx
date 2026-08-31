import { createFileRoute, Link } from "@tanstack/react-router";
import { FileUp, Sparkles, FileDown } from "lucide-react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Automatic Question Paper Generator from Syllabus" },
      {
        name: "description",
        content:
          "Upload a syllabus in PDF, DOCX or TXT and generate a complete university question paper with AI, then download it as a print-ready A4 PDF.",
      },
      { property: "og:title", content: "Automatic Question Paper Generator" },
      {
        property: "og:description",
        content:
          "Upload your syllabus and generate a complete exam question paper automatically using AI.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

const features = [
  {
    icon: FileUp,
    title: "Upload syllabus",
    text: "PDF, DOCX or TXT. Units and topics are extracted automatically.",
  },
  {
    icon: Sparkles,
    title: "AI generates questions",
    text: "Questions come strictly from your syllabus, balanced across units and difficulty.",
  },
  {
    icon: FileDown,
    title: "Download PDF",
    text: "A clean university examination format, ready to print on A4.",
  },
];

function Home() {
  return (
    <Shell>
      <section className="mx-auto max-w-2xl text-center">
        <span className="inline-flex items-center gap-2 rounded-full bg-accent px-3 py-1 text-xs font-medium text-accent-foreground">
          <Sparkles className="size-3.5" /> Syllabus-driven question papers
        </span>
        <h1 className="mt-5 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Automatic Question Paper Generator
        </h1>
        <p className="mt-4 text-base text-muted-foreground sm:text-lg">
          Upload your syllabus and generate a complete question paper automatically using AI. No
          account needed.
        </p>
        <div className="mt-8">
          <Button asChild size="lg">
            <Link to="/upload">Upload Syllabus</Link>
          </Button>
        </div>
      </section>

      <section className="mt-14 grid gap-4 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="rounded-xl border border-border bg-card p-5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
              <f.icon className="size-4.5" />
            </span>
            <h2 className="mt-3 font-semibold text-foreground">{f.title}</h2>
            <p className="mt-1 text-sm text-muted-foreground">{f.text}</p>
          </div>
        ))}
      </section>
    </Shell>
  );
}
