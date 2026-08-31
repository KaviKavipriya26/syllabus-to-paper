import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import type { PaperSettings, QuestionPaper, Syllabus } from "./paper-types";

interface UploadedFileInfo {
  name: string;
  size: number;
  kind: string;
}

interface PaperState {
  rawText: string;
  fileInfo: UploadedFileInfo | null;
  syllabus: Syllabus | null;
  settings: PaperSettings;
  paper: QuestionPaper | null;
}

export const defaultSettings: PaperSettings = {
  collegeName: "Sri Institute of Technology",
  department: "Department of Computer Science and Engineering",
  examName: "End Semester Examination",
  semester: "Semester V",
  date: "",
  duration: "3 Hours",
  difficulty: { Easy: 30, Medium: 50, Hard: 20 },
  sections: [
    { id: "a", name: "Section A", count: 10, marksPerQuestion: 1, questionType: "MCQ" },
    { id: "b", name: "Section B", count: 5, marksPerQuestion: 2, questionType: "Short Answer" },
    { id: "c", name: "Section C", count: 5, marksPerQuestion: 8, questionType: "Long Answer" },
    { id: "d", name: "Section D", count: 2, marksPerQuestion: 20, questionType: "Essay" },
  ],
  unitWeightage: {},
  instructions: [
    "Answer all questions as instructed.",
    "Write answers clearly and legibly.",
    "Figures should be drawn wherever necessary.",
  ],
};

const initialState: PaperState = {
  rawText: "",
  fileInfo: null,
  syllabus: null,
  settings: defaultSettings,
  paper: null,
};

const KEY = "aqpg-state-v1";

interface Ctx extends PaperState {
  update: (patch: Partial<PaperState>) => void;
  reset: () => void;
  hydrated: boolean;
}

const PaperContext = createContext<Ctx | null>(null);

export function PaperStoreProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<PaperState>(initialState);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = sessionStorage.getItem(KEY);
      if (stored) setState({ ...initialState, ...(JSON.parse(stored) as PaperState) });
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state));
    } catch {
      /* ignore */
    }
  }, [state, hydrated]);

  const value = useMemo<Ctx>(
    () => ({
      ...state,
      hydrated,
      update: (patch) => setState((prev) => ({ ...prev, ...patch })),
      reset: () => setState(initialState),
    }),
    [state, hydrated],
  );

  return <PaperContext.Provider value={value}>{children}</PaperContext.Provider>;
}

export function usePaperStore() {
  const ctx = useContext(PaperContext);
  if (!ctx) throw new Error("usePaperStore must be used inside PaperStoreProvider");
  return ctx;
}
