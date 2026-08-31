export type Difficulty = "Easy" | "Medium" | "Hard";

export type QuestionType = "MCQ" | "Short Answer" | "Long Answer" | "Essay";

export interface SyllabusUnit {
  name: string;
  title: string;
  topics: string[];
}

export interface Syllabus {
  subject: string;
  subjectCode: string;
  courseOutcomes: string[];
  units: SyllabusUnit[];
}

export interface SectionConfig {
  id: string;
  name: string;
  count: number;
  marksPerQuestion: number;
  questionType: QuestionType;
}

export interface PaperSettings {
  collegeName: string;
  department: string;
  examName: string;
  semester: string;
  date: string;
  duration: string;
  difficulty: { Easy: number; Medium: number; Hard: number };
  sections: SectionConfig[];
  unitWeightage: Record<string, number>;
  instructions: string[];
}

export interface Question {
  id: string;
  questionNumber: number;
  questionText: string;
  options: string[];
  unit: string;
  topic: string;
  questionType: string;
  marks: number;
  difficulty: string;
}

export interface PaperSection {
  name: string;
  marksLine: string;
  questions: Question[];
}

export interface QuestionPaper {
  subject: string;
  subjectCode: string;
  totalMarks: number;
  duration: string;
  sections: PaperSection[];
}

export const totalQuestions = (s: SectionConfig[]) =>
  s.reduce((a, x) => a + (x.count || 0), 0);

export const totalMarks = (s: SectionConfig[]) =>
  s.reduce((a, x) => a + (x.count || 0) * (x.marksPerQuestion || 0), 0);

export const slugSubject = (subject: string) =>
  (subject || "Question_Paper").trim().replace(/[^a-zA-Z0-9]+/g, "_").replace(/^_|_$/g, "");
