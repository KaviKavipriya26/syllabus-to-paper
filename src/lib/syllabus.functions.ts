import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { AiError, aiJson } from "./ai.server";
import type { Question, QuestionPaper } from "./paper-types";

/* ---------------------------------- schemas -------------------------------- */

const syllabusSchema = {
  type: "object",
  additionalProperties: false,
  required: ["subject", "subjectCode", "courseOutcomes", "units"],
  properties: {
    subject: { type: "string" },
    subjectCode: { type: "string" },
    courseOutcomes: { type: "array", items: { type: "string" } },
    units: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "title", "topics"],
        properties: {
          name: { type: "string" },
          title: { type: "string" },
          topics: { type: "array", items: { type: "string" } },
        },
      },
    },
  },
} as const;

const questionProps = {
  type: "object",
  additionalProperties: false,
  required: [
    "questionNumber",
    "questionText",
    "options",
    "unit",
    "topic",
    "questionType",
    "marks",
    "difficulty",
  ],
  properties: {
    questionNumber: { type: "number" },
    questionText: { type: "string" },
    options: {
      type: "array",
      description: "Four options for MCQ questions, empty array otherwise.",
      items: { type: "string" },
    },
    unit: { type: "string" },
    topic: { type: "string" },
    questionType: { type: "string", enum: ["MCQ", "Short Answer", "Long Answer", "Essay"] },
    marks: { type: "number" },
    difficulty: { type: "string", enum: ["Easy", "Medium", "Hard"] },
  },
} as const;

const paperSchema = {
  type: "object",
  additionalProperties: false,
  required: ["subject", "totalMarks", "duration", "sections"],
  properties: {
    subject: { type: "string" },
    totalMarks: { type: "number" },
    duration: { type: "string" },
    sections: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "questions"],
        properties: {
          name: { type: "string" },
          questions: { type: "array", items: questionProps },
        },
      },
    },
  },
} as const;

const singleQuestionSchema = {
  type: "object",
  additionalProperties: false,
  required: ["question"],
  properties: { question: questionProps },
} as const;

/* ------------------------------- validators -------------------------------- */

const unitZ = z.object({ name: z.string(), title: z.string(), topics: z.array(z.string()) });
const syllabusZ = z.object({
  subject: z.string(),
  subjectCode: z.string(),
  courseOutcomes: z.array(z.string()),
  units: z.array(unitZ),
});

const sectionConfigZ = z.object({
  id: z.string(),
  name: z.string(),
  count: z.number(),
  marksPerQuestion: z.number(),
  questionType: z.enum(["MCQ", "Short Answer", "Long Answer", "Essay"]),
});

const settingsZ = z.object({
  collegeName: z.string(),
  department: z.string(),
  examName: z.string(),
  semester: z.string(),
  date: z.string(),
  duration: z.string(),
  difficulty: z.object({ Easy: z.number(), Medium: z.number(), Hard: z.number() }),
  sections: z.array(sectionConfigZ),
  unitWeightage: z.record(z.number()),
  instructions: z.array(z.string()),
});

/* --------------------------------- helpers --------------------------------- */

const STOP = new Set([
  "the","a","an","of","and","or","in","on","with","for","to","is","are","what","explain",
  "describe","discuss","define","its","different","types","suitable","examples","example",
  "how","why","write","short","note","detail","about","give","state","list","briefly",
]);

const tokens = (s: string) =>
  new Set(
    s
      .toLowerCase()
      .replace(/[^a-z0-9\s]/g, " ")
      .split(/\s+/)
      .filter((t) => t.length > 2 && !STOP.has(t)),
  );

const similarity = (a: string, b: string) => {
  const ta = tokens(a);
  const tb = tokens(b);
  if (!ta.size || !tb.size) return 0;
  let inter = 0;
  ta.forEach((t) => {
    if (tb.has(t)) inter += 1;
  });
  return inter / new Set([...ta, ...tb]).size;
};

const syllabusText = (s: z.infer<typeof syllabusZ>) =>
  [
    `Subject: ${s.subject}`,
    `Subject Code: ${s.subjectCode}`,
    ...s.units.map(
      (u) => `${u.name}: ${u.title}\nTopics:\n${u.topics.map((t) => `- ${t}`).join("\n")}`,
    ),
    s.courseOutcomes.length ? `Course Outcomes:\n${s.courseOutcomes.join("\n")}` : "",
  ]
    .filter(Boolean)
    .join("\n\n");

const GENERATOR_SYSTEM = `You are an expert university examination question-paper generator.
- Generate questions STRICTLY from the provided syllabus content.
- Never introduce concepts that are not present in the syllabus.
- Cover the available units and topics appropriately using the requested unit weightage.
- Follow the requested number of questions per section, marks per question, question types and difficulty distribution exactly.
- Avoid duplicate or semantically similar questions.
- MCQ questions must include exactly 4 plausible options; other types must use an empty options array.
- Every question must be academically meaningful and traceable to a syllabus unit and topic.
- Return structured JSON only.`;

const requirementsText = (
  syl: z.infer<typeof syllabusZ>,
  st: z.infer<typeof settingsZ>,
  seed: number,
  avoid: string[],
) => `SYLLABUS:

${syllabusText(syl)}

QUESTION PAPER REQUIREMENTS:

Number of Questions:
${st.sections.reduce((a, s) => a + s.count, 0)}

Total Marks:
${st.sections.reduce((a, s) => a + s.count * s.marksPerQuestion, 0)}

Difficulty:
Easy ${st.difficulty.Easy}%, Medium ${st.difficulty.Medium}%, Hard ${st.difficulty.Hard}%

Question Types:
${[...new Set(st.sections.map((s) => s.questionType))].join(", ")}

Marks Pattern:
${st.sections.map((s) => `${s.name}: ${s.count} x ${s.marksPerQuestion} = ${s.count * s.marksPerQuestion}`).join("\n")}

Unit Weightage:
${Object.entries(st.unitWeightage).map(([u, w]) => `${u} -> ${w}%`).join("\n")}

Duration: ${st.duration}
Exam: ${st.examName}

Number the questions continuously across sections starting from 1.
Variation seed (produce a distinctly different set for each seed): ${seed}
${avoid.length ? `\nDo NOT produce these questions or anything semantically similar:\n${avoid.map((q) => `- ${q}`).join("\n")}` : ""}`;

let idCounter = 0;
const newId = () => `q_${Date.now().toString(36)}_${(idCounter += 1)}`;

/* ------------------------------ server functions --------------------------- */

export const extractSyllabus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => z.object({ text: z.string() }).parse(data))
  .handler(async ({ data }) => {
    const raw = data.text.replace(/\s+\n/g, "\n").trim();
    if (raw.replace(/\s/g, "").length < 60) {
      throw new Error(
        "Unable to extract syllabus content. Please upload a valid PDF, DOCX, or TXT syllabus file.",
      );
    }
    try {
      const result = await aiJson<z.infer<typeof syllabusZ>>({
        system:
          "You extract structured syllabus data from raw academic documents. Use only content present in the document. Name units as 'Unit 1', 'Unit 2', ... in document order. If a subject code is absent, return an empty string.",
        prompt: `Extract the subject name, subject code, units (with unit titles, topics and subtopics) and course outcomes from this syllabus document.\n\nDOCUMENT:\n\n${raw.slice(0, 60000)}`,
        schemaName: "syllabus",
        schema: syllabusSchema,
      });
      const parsed = syllabusZ.parse(result);
      if (!parsed.units.length || parsed.units.every((u) => !u.topics.length)) {
        throw new Error(
          "No syllabus content detected. Please upload a document that contains units and topics.",
        );
      }
      return parsed;
    } catch (e) {
      if (e instanceof AiError) throw new Error(e.message);
      throw e instanceof Error
        ? e
        : new Error("Unable to extract syllabus content. Please try another file.");
    }
  });

function validatePaper(
  paper: QuestionPaper,
  syl: z.infer<typeof syllabusZ>,
  st: z.infer<typeof settingsZ>,
) {
  const problems: string[] = [];
  const all = paper.sections.flatMap((s) => s.questions);

  st.sections.forEach((cfg) => {
    const sec = paper.sections.find((s) => s.name === cfg.name);
    if (!sec) return problems.push(`Missing ${cfg.name}.`);
    if (sec.questions.length !== cfg.count)
      problems.push(`${cfg.name} has ${sec.questions.length} of ${cfg.count} questions.`);
  });

  if (all.some((q) => !q.questionText.trim())) problems.push("Some questions are empty.");

  const expected = st.sections.reduce((a, s) => a + s.count * s.marksPerQuestion, 0);
  if (paper.totalMarks !== expected)
    problems.push(`Total marks mismatch (${paper.totalMarks} instead of ${expected}).`);

  const unitNames = new Set(syl.units.map((u) => u.name.toLowerCase()));
  if (all.some((q) => !unitNames.has(q.unit.toLowerCase())))
    problems.push("Some questions are not traceable to a syllabus unit.");

  const covered = new Set(all.map((q) => q.unit.toLowerCase()));
  const missing = syl.units.filter((u) => !covered.has(u.name.toLowerCase()));
  if (missing.length && all.length >= syl.units.length)
    problems.push(`No questions generated for ${missing.map((u) => u.name).join(", ")}.`);

  return problems;
}

async function replaceOne(
  q: Question,
  syl: z.infer<typeof syllabusZ>,
  existing: string[],
): Promise<Question> {
  const result = await aiJson<{ question: Omit<Question, "id"> }>({
    system: GENERATOR_SYSTEM,
    prompt: `SYLLABUS:\n\n${syllabusText(syl)}\n\nGenerate ONE replacement examination question.
Requirements: unit "${q.unit}", topic "${q.topic}", question type "${q.questionType}", marks ${q.marks}, difficulty ${q.difficulty}, questionNumber ${q.questionNumber}.
It must be clearly different from all of these existing questions:\n${existing.map((t) => `- ${t}`).join("\n")}`,
    schemaName: "single_question",
    schema: singleQuestionSchema,
  });
  return { ...result.question, id: newId() };
}

async function buildPaper(
  syl: z.infer<typeof syllabusZ>,
  st: z.infer<typeof settingsZ>,
  seed: number,
  avoid: string[],
) {
  const ai = await aiJson<{
    subject: string;
    totalMarks: number;
    duration: string;
    sections: { name: string; questions: Omit<Question, "id">[] }[];
  }>({
    system: GENERATOR_SYSTEM,
    prompt: requirementsText(syl, st, seed, avoid),
    schemaName: "question_paper",
    schema: paperSchema,
  });

  const paper: QuestionPaper = {
    subject: syl.subject || ai.subject,
    subjectCode: syl.subjectCode,
    totalMarks: st.sections.reduce((a, s) => a + s.count * s.marksPerQuestion, 0),
    duration: st.duration || ai.duration,
    sections: st.sections.map((cfg) => {
      const src = ai.sections.find((s) => s.name === cfg.name) ?? { questions: [] };
      return {
        name: cfg.name,
        marksLine: `${cfg.count} × ${cfg.marksPerQuestion} = ${cfg.count * cfg.marksPerQuestion}`,
        questions: src.questions.slice(0, cfg.count).map((q) => ({
          ...q,
          marks: cfg.marksPerQuestion,
          questionType: cfg.questionType,
          options: cfg.questionType === "MCQ" ? q.options ?? [] : [],
          id: newId(),
        })),
      };
    }),
  };

  // Duplicate prevention: replace semantically similar questions.
  const flat = () => paper.sections.flatMap((s) => s.questions);
  for (const section of paper.sections) {
    for (let i = 0; i < section.questions.length; i += 1) {
      const q = section.questions[i]!;
      const others = flat().filter((o) => o.id !== q.id);
      if (others.some((o) => similarity(o.questionText, q.questionText) > 0.62)) {
        try {
          section.questions[i] = {
            ...(await replaceOne(q, syl, others.map((o) => o.questionText))),
            marks: q.marks,
            questionType: q.questionType,
            questionNumber: q.questionNumber,
          };
        } catch {
          /* keep original if replacement fails */
        }
      }
    }
  }

  // Continuous numbering.
  let n = 1;
  paper.sections.forEach((s) => s.questions.forEach((q) => (q.questionNumber = n++)));

  const problems = validatePaper(paper, syl, st);
  if (problems.length) {
    throw new Error(`Question paper could not be generated correctly.\n\n${problems.join(" ")}`);
  }
  return paper;
}

const generateInput = z.object({
  syllabus: syllabusZ,
  settings: settingsZ,
  seed: z.number().optional(),
  avoid: z.array(z.string()).optional(),
});

export const generateQuestionPaper = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => generateInput.parse(data))
  .handler(async ({ data }) => {
    try {
      return await buildPaper(
        data.syllabus,
        data.settings,
        data.seed ?? Math.floor(Math.random() * 100000),
        data.avoid ?? [],
      );
    } catch (e) {
      if (e instanceof AiError) throw new Error(e.message);
      throw e instanceof Error ? e : new Error("Question paper could not be generated correctly.");
    }
  });

export const replaceQuestion = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) =>
    z
      .object({
        syllabus: syllabusZ,
        question: z.object({
          id: z.string(),
          questionNumber: z.number(),
          questionText: z.string(),
          options: z.array(z.string()),
          unit: z.string(),
          topic: z.string(),
          questionType: z.string(),
          marks: z.number(),
          difficulty: z.string(),
        }),
        existing: z.array(z.string()),
      })
      .parse(data),
  )
  .handler(async ({ data }) => {
    try {
      const q = await replaceOne(data.question as Question, data.syllabus, data.existing);
      return {
        ...q,
        marks: data.question.marks,
        questionType: data.question.questionType,
        questionNumber: data.question.questionNumber,
      };
    } catch (e) {
      if (e instanceof AiError) throw new Error(e.message);
      throw new Error("Could not generate a replacement question. Please try again.");
    }
  });
