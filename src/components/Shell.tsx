import { Link } from "@tanstack/react-router";
import { FileText } from "lucide-react";
import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

const steps = [
  { to: "/upload", label: "Upload" },
  { to: "/syllabus", label: "Syllabus" },
  { to: "/settings", label: "Settings" },
  { to: "/paper", label: "Paper" },
] as const;

export function Shell({
  children,
  activeStep,
}: {
  children?: ReactNode;
  activeStep?: string;
}) {
  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
          <Link to="/" className="flex items-center gap-2 font-semibold text-foreground">
            <span className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
              <FileText className="size-4" />
            </span>
            Question Paper Generator
          </Link>
          <nav className="flex items-center gap-1 overflow-x-auto text-sm">
            {steps.map((s, i) => (
              <Link
                key={s.to}
                to={s.to}
                className={cn(
                  "rounded-full px-3 py-1.5 whitespace-nowrap transition-colors",
                  activeStep === s.to
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted",
                )}
              >
                <span className="mr-1 opacity-60">{i + 1}.</span>
                {s.label}
              </Link>
            ))}
          </nav>
        </div>
      </header>
      <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
    </div>
  );
}
