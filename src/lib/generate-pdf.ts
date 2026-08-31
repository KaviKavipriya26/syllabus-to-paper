import { jsPDF } from "jspdf";
import { slugSubject, type PaperSettings, type QuestionPaper } from "./paper-types";

export function downloadQuestionPaperPdf(paper: QuestionPaper, settings: PaperSettings) {
  const doc = new jsPDF({ unit: "pt", format: "a4" });
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 50;
  const contentWidth = pageWidth - margin * 2;
  let y = margin;

  const footer = () => {
    const page = doc.getCurrentPageInfo().pageNumber;
    doc.setFont("helvetica", "normal").setFontSize(9).setTextColor(120);
    doc.text(`Page ${page}`, pageWidth / 2, pageHeight - 24, { align: "center" });
    doc.setTextColor(0);
  };

  const ensure = (needed: number) => {
    if (y + needed <= pageHeight - 50) return;
    footer();
    doc.addPage();
    y = margin;
  };

  const center = (text: string, size: number, bold = false) => {
    doc.setFont("helvetica", bold ? "bold" : "normal").setFontSize(size);
    const lines = doc.splitTextToSize(text, contentWidth) as string[];
    lines.forEach((line) => {
      ensure(size + 6);
      doc.text(line, pageWidth / 2, y, { align: "center" });
      y += size + 4;
    });
  };

  const rule = (gap = 10) => {
    ensure(gap + 4);
    y += gap / 2;
    doc.setDrawColor(30).setLineWidth(0.8).line(margin, y, pageWidth - margin, y);
    y += gap;
  };

  // ---- Header
  center(settings.collegeName.toUpperCase(), 16, true);
  if (settings.department) center(settings.department.toUpperCase(), 10.5);
  y += 6;
  center(settings.examName.toUpperCase(), 13, true);
  y += 4;
  rule();

  doc.setFont("helvetica", "bold").setFontSize(11);
  ensure(20);
  doc.text(`Subject Code: ${paper.subjectCode || "-"}`, margin, y);
  doc.text(settings.semester, pageWidth - margin, y, { align: "right" });
  y += 16;
  ensure(20);
  doc.text(`Subject: ${paper.subject.toUpperCase()}`, margin, y);
  y += 16;
  doc.setFont("helvetica", "normal");
  ensure(20);
  doc.text(`Duration: ${paper.duration}`, margin, y);
  doc.text(`Maximum Marks: ${paper.totalMarks}`, pageWidth - margin, y, { align: "right" });
  y += 16;
  if (settings.date) {
    ensure(20);
    doc.text(`Date: ${settings.date}`, margin, y);
    y += 16;
  }
  rule();

  // ---- Instructions
  doc.setFont("helvetica", "bold").setFontSize(11);
  ensure(18);
  doc.text("Instructions:", margin, y);
  y += 15;
  doc.setFont("helvetica", "normal").setFontSize(10.5);
  settings.instructions.forEach((ins, i) => {
    const lines = doc.splitTextToSize(`${i + 1}. ${ins}`, contentWidth - 12) as string[];
    lines.forEach((line) => {
      ensure(16);
      doc.text(line, margin + 12, y);
      y += 14;
    });
  });
  rule();

  // ---- Sections
  paper.sections.forEach((section) => {
    ensure(60);
    y += 6;
    center(section.name.toUpperCase(), 12.5, true);
    center(section.marksLine, 10.5);
    y += 8;

    section.questions.forEach((q) => {
      doc.setFont("helvetica", "normal").setFontSize(11);
      const text = `${q.questionNumber}. ${q.questionText}`;
      const lines = doc.splitTextToSize(text, contentWidth - 50) as string[];
      ensure(lines.length * 15 + (q.options.length ? q.options.length * 14 : 0) + 12);
      const markY = y;
      lines.forEach((line) => {
        doc.text(line, margin, y);
        y += 15;
      });
      doc.setFont("helvetica", "bold").setFontSize(10);
      doc.text(`[${q.marks}]`, pageWidth - margin, markY, { align: "right" });
      doc.setFont("helvetica", "normal").setFontSize(10.5);
      q.options.forEach((opt, i) => {
        const optLines = doc.splitTextToSize(
          `${String.fromCharCode(97 + i)}) ${opt}`,
          contentWidth - 70,
        ) as string[];
        optLines.forEach((line) => {
          ensure(15);
          doc.text(line, margin + 22, y);
          y += 13;
        });
      });
      y += 8;
    });
    rule(12);
  });

  ensure(24);
  center("*** END OF QUESTION PAPER ***", 10.5, true);
  footer();

  doc.save(`Question_Paper_${slugSubject(paper.subject)}.pdf`);
}
