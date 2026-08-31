import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { Plus, Trash2 } from "lucide-react";
import { useEffect, useState } from "react";
import { Shell } from "@/components/Shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { usePaperStore } from "@/lib/paper-store";
import {
  totalMarks,
  totalQuestions,
  type PaperSettings,
  type QuestionType,
  type SectionConfig,
} from "@/lib/paper-types";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Question Paper Settings | Question Paper Generator" },
      {
        name: "description",
        content:
          "Configure number of questions, total marks, difficulty split, question types and marks pattern for your exam paper.",
      },
      { property: "og:title", content: "Question Paper Settings" },
      {
        property: "og:description",
        content: "Set marks pattern, difficulty distribution and question types for your paper.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: SettingsPage;
});

const TYPES: QuestionType[] = ["MCQ", "Short Answer", "Long Answer", "Essay"];
const PRESET_COUNTS = [5, 10, 20, 30];

function SettingsPage() {
  const store = usePaperStore();
  const navigate = useNavigate();
  const [draft, setDraft] = useState<PaperSettings>(store.settings);

  useEffect(() => {
    setDraft(store.settings);
  }, [store.settings]);

  if (!store.hydrated) return <Shell activeStep="/settings" />;

  if (!store.syllabus) {
    return (
      <Shell activeStep="/settings">
        <div className="rounded-xl border border-border bg-card p-8 text-center">
          <p className="font-medium text-foreground">Upload a syllabus first</p>
          <Button asChild className="mt-5">
            <Link to="/upload">Upload Syllabus</Link>
          </Button>
        </div>
      </Shell>
    );
  }

  const units = store.syllabus.units;
  const qTotal = totalQuestions(draft.sections);
  const mTotal = totalMarks(draft.sections);
  const diffTotal = draft.difficulty.Easy + draft.difficulty.Medium + draft.difficulty.Hard;
  const weightTotal = units.reduce((a, u) => a + (draft.unitWeightage[u.name] ?? 0), 0);

  const setSection = (id: string, patch: Partial<SectionConfig>) =>
    setDraft({
      ...draft,
      sections: draft.sections.map((s) => (s.id === id ? { ...s, ...patch } : s)),
    });

  const scaleTo = (target: number) => {
    const current = qTotal || 1;
    let remaining = target;
    const sections = draft.sections.map((s, i) => {
      const share =
        i === draft.sections.length - 1
          ? remaining
          : Math.max(1, Math.round((s.count / current) * target));
      remaining -= share;
      return { ...s, count: Math.max(0, share) };
    });
    setDraft({ ...draft, sections });
  };

  const valid = qTotal > 0 && mTotal > 0 && diffTotal === 100;

  return (
    <Shell activeStep="/settings">
      <h1 className="text-2xl font-bold text-foreground">Question Paper Settings</h1>
      <p className="mt-1 text-sm text-muted-foreground">
        {store.syllabus.subject} · {units.length} units
      </p>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Paper details</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <Label>College name</Label>
              <Input
                className="mt-1.5"
                value={draft.collegeName}
                onChange={(e) => setDraft({ ...draft, collegeName: e.target.value })}
              />
            </div>
            <div className="sm:col-span-2">
              <Label>Department</Label>
              <Input
                className="mt-1.5"
                value={draft.department}
                onChange={(e) => setDraft({ ...draft, department: e.target.value })}
              />
            </div>
            <div>
              <Label>Exam name</Label>
              <Input
                className="mt-1.5"
                value={draft.examName}
                onChange={(e) => setDraft({ ...draft, examName: e.target.value })}
              />
            </div>
            <div>
              <Label>Semester</Label>
              <Input
                className="mt-1.5"
                value={draft.semester}
                onChange={(e) => setDraft({ ...draft, semester: e.target.value })}
              />
            </div>
            <div>
              <Label>Date</Label>
              <Input
                type="date"
                className="mt-1.5"
                value={draft.date}
                onChange={(e) => setDraft({ ...draft, date: e.target.value })}
              />
            </div>
            <div>
              <Label>Duration</Label>
              <Input
                className="mt-1.5"
                value={draft.duration}
                onChange={(e) => setDraft({ ...draft, duration: e.target.value })}
              />
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border bg-card p-5">
          <h2 className="font-semibold text-foreground">Number of questions</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            {PRESET_COUNTS.map((n) => (
              <Button
                key={n}
                variant={qTotal === n ? "default" : "outline"}
                size="sm"
                onClick={() => scaleTo(n)}
              >
                {n}
              </Button>
            ))}
            <div className="flex items-center gap-2">
              <Label htmlFor="custom" className="text-xs text-muted-foreground">
                Custom
              </Label>
              <Input
                id="custom"
                type="number"
                min={1}
                className="w-24"
                value={qTotal}
                onChange={(e) => scaleTo(Math.max(1, Number(e.target.value) || 1))}
              />
            </div>
          </div>

          <h2 className="mt-6 font-semibold text-foreground">Difficulty distribution (%)</h2>
          <div className="mt-3 grid grid-cols-3 gap-3">
            {(["Easy", "Medium", "Hard"] as const).map((level) => (
              <div key={level}>
                <Label className="text-xs">{level}</Label>
                <Input
                  type="number"
                  min={0}
                  max={100}
                  className="mt-1.5"
                  value={draft.difficulty[level]}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      difficulty: {
                        ...draft.difficulty,
                        [level]: Math.max(0, Number(e.target.value) || 0),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
          <p
            className={`mt-2 text-xs ${diffTotal === 100 ? "text-muted-foreground" : "text-destructive"}`}
          >
            Total: {diffTotal}% {diffTotal !== 100 && "· must equal 100%"}
          </p>

          <h2 className="mt-6 font-semibold text-foreground">Unit weightage (%)</h2>
          <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {units.map((u) => (
              <div key={u.name}>
                <Label className="text-xs">{u.name}</Label>
                <Input
                  type="number"
                  min={0}
                  className="mt-1.5"
                  value={draft.unitWeightage[u.name] ?? 0}
                  onChange={(e) =>
                    setDraft({
                      ...draft,
                      unitWeightage: {
                        ...draft.unitWeightage,
                        [u.name]: Math.max(0, Number(e.target.value) || 0),
                      },
                    })
                  }
                />
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">Total: {weightTotal}%</p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <h2 className="font-semibold text-foreground">Marks pattern &amp; question types</h2>
        <div className="mt-4 space-y-3">
          {draft.sections.map((s) => (
            <div
              key={s.id}
              className="grid gap-3 rounded-lg border border-border bg-background p-3 sm:grid-cols-[1fr_auto_auto_1fr_auto_auto] sm:items-end"
            >
              <div>
                <Label className="text-xs">Section name</Label>
                <Input
                  className="mt-1.5"
                  value={s.name}
                  onChange={(e) => setSection(s.id, { name: e.target.value })}
                />
              </div>
              <div>
                <Label className="text-xs">Questions</Label>
                <Input
                  type="number"
                  min={0}
                  className="mt-1.5 w-24"
                  value={s.count}
                  onChange={(e) =>
                    setSection(s.id, { count: Math.max(0, Number(e.target.value) || 0) })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Marks each</Label>
                <Input
                  type="number"
                  min={1}
                  className="mt-1.5 w-24"
                  value={s.marksPerQuestion}
                  onChange={(e) =>
                    setSection(s.id, {
                      marksPerQuestion: Math.max(1, Number(e.target.value) || 1),
                    })
                  }
                />
              </div>
              <div>
                <Label className="text-xs">Question type</Label>
                <select
                  className="mt-1.5 h-9 w-full rounded-md border border-input bg-background px-3 text-sm text-foreground"
                  value={s.questionType}
                  onChange={(e) =>
                    setSection(s.id, { questionType: e.target.value as QuestionType })
                  }
                >
                  {TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>
              <p className="text-sm font-medium text-foreground sm:pb-2">
                = {s.count * s.marksPerQuestion}
              </p>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Remove section"
                onClick={() =>
                  setDraft({ ...draft, sections: draft.sections.filter((x) => x.id !== s.id) })
                }
              >
                <Trash2 className="size-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 flex flex-wrap items-center justify-between gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() =>
              setDraft({
                ...draft,
                sections: [
                  ...draft.sections,
                  {
                    id: `s${Date.now()}`,
                    name: `Section ${String.fromCharCode(65 + draft.sections.length)}`,
                    count: 5,
                    marksPerQuestion: 2,
                    questionType: "Short Answer",
                  },
                ],
              })
            }
          >
            <Plus className="mr-2 size-4" /> Add section
          </Button>
          <p className="text-sm text-foreground">
            <span className="font-semibold">{qTotal}</span> questions ·{" "}
            <span className="font-semibold">Total Marks: {mTotal}</span>
          </p>
        </div>
      </div>

      <div className="mt-6 rounded-xl border border-border bg-card p-5">
        <Label>Instructions (one per line)</Label>
        <Textarea
          className="mt-1.5 min-h-24"
          value={draft.instructions.join("\n")}
          onChange={(e) => setDraft({ ...draft, instructions: e.target.value.split("\n") })}
        />
      </div>

      <div className="mt-6 flex flex-wrap gap-3">
        <Button
          size="lg"
          disabled={!valid}
          onClick={() => {
            store.update({
              settings: {
                ...draft,
                instructions: draft.instructions.map((i) => i.trim()).filter(Boolean),
              },
              paper: null,
            });
            navigate({ to: "/paper" });
          }}
        >
          Generate Question Paper
        </Button>
        <Button variant="outline" size="lg" asChild>
          <Link to="/syllabus">Back to syllabus</Link>
        </Button>
      </div>
    </Shell>
  );
}
