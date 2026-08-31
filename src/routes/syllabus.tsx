import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePaperStore } from "@/lib/paper-store";
import type { Syllabus } from "@/lib/paper-types";

export const Route = createFileRoute("/syllabus")({
  head: () => ({
    meta: [
      { title: "Syllabus Preview | Question Paper Generator" },
      {
        name: "description",
        content:
          "Review and edit the subject, units and topics extracted from your uploaded syllabus document.",
      },
      { property: "og:title", content: "Syllabus Preview" },
      {
        property: "og:description",
        content: "Review and edit extracted units and topics before generating questions.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SyllabusPage,
});

function SyllabusPage() {
  const store = usePaperStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<Syllabus | null>(store.syllabus);

  useEffect(() => {
    if (store.syllabus) setDraft(store.syllabus);
  }, [store.syllabus]);

  if (!store.hydrated) return <Shell activeStep="/syllabus" />;

  if (!draft) {
    return (
      <Shell activeStep="/syllabus">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="font-medium text-foreground">No syllabus extracted yet</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Upload a syllabus document to get started.
          </p>
          <Button asChild className="mt-5">
            <Link to="/upload">Upload Syllabus</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const setUnit = (i: number, patch: Partial<Syllabus["units"][number]>) =>
    setDraft({
      ...draft,
      units: draft.units.map((u, idx) => (idx === i ? { ...u, ...patch } : u)),
    });

  const save = () => {
    const cleaned: Syllabus = {
      ...draft,
      units: draft.units
        .map((u) => ({ ...u, topics: u.topics.map((t) => t.trim()).filter(Boolean) }))
        .filter((u) => u.title.trim() || u.topics.length),
    };
    store.update({
      syllabus: cleaned,
      paper: null,
      settings: {
        ...store.settings,
        unitWeightage: Object.fromEntries(
          cleaned.units.map((u) => [
            u.name,
            store.settings.unitWeightage[u.name] ??
              Math.round(100 / Math.max(cleaned.units.length, 1)),
          ]),
        ),
      },
    });
    navigate({ to: "/settings" });
  };

  return (
    <Shell activeStep="/syllabus">
      <h1 className="text-2xl font-bold text-foreground">Syllabus Preview</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Edit anything that was extracted incorrectly. Questions are generated only from this content.
      </p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <div>
          <Label htmlFor="subject">Subject name</Label>
          <Input
            id="subject"
            className="mt-1.5"
            value={draft.subject}
            onChange={(e) => setDraft({ ...draft, subject: e.target.value })}
          />
        </div>
        <div>
          <Label htmlFor="code">Subject code</Label>
          <Input
            id="code"
            className="mt-1.5"
            value={draft.subjectCode}
            onChange={(e) => setDraft({ ...draft, subjectCode: e.target.value })}
          />
        </div>
      </div>

      <div className="mt-8 space-y-4">
        {draft.units.map((unit, i) => (
          <div key={i} className="rounded-xl border border-border bg-card p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
              <div className="w-full sm:w-32">
                <Label>Unit</Label>
                <Input
                  className="mt-1.5"
                  value={unit.name}
                  onChange={(e) => setUnit(i, { name: e.target.value })}
                />
              </div>
              <div className="flex-1">
                <Label>Unit title</Label>
                <Input
                  className="mt-1.5"
                  value={unit.title}
                  onChange={(e) => setUnit(i, { title: e.target.value })}
                />
              </div>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove unit"
                onClick={() =>
                  setDraft({ ...draft, units: draft.units.filter((_, idx) => idx !== i) })
                }
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
            <div className="mt-3">
              <Label>Topics (one per line)</Label>
              <Textarea
                className="mt-1.5 min-h-28"
                value={unit.topics.join("\n")}
                onChange={(e) => setUnit(i, { topics: e.target.value.split("\n") })}
              />
            </div>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        className="mt-4"
        onClick={() =>
          setDraft({
            ...draft,
            units: [
              ...draft.units,
              { name: `Unit ${draft.units.length + 1}`, title: "", topics: [] },
            ],
          })
        }
      >
        <Plus className="mr-2 size-4" /> Add unit
      </Button>

      {draft.courseOutcomes.length > 0 && (
        <div className="mt-8">
          <Label>Course outcomes (one per line)</Label>
          <Textarea
            className="mt-1.5 min-h-24"
            value={draft.courseOutcomes.join("\n")}
            onChange={(e) => setDraft({ ...draft, courseOutcomes: e.target.value.split("\n") })}
          />
        </div>
      )}

      <div className="mt-8 flex flex-wrap gap-3">
        <Button size="lg" onClick={save} disabled={!draft.units.length}>
          Continue to Settings
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/upload">Upload a different file</Link>
        </Button>
      </div>
    </Shell>
  );
}
