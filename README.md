# Syllabus To Paper

Prompt: Syllabus Upload to Automatic Question Paper PDF Generator

Build a complete web application for an Automatic Question Paper Generation System with only the following core workflow:

Upload Syllabus Document → Extract Syllabus Content → Generate Questions → Preview Question Paper → Download as PDF

Do not add unnecessary modules such as student management, attendance, HRMS, etc.

1. Main User Flow

The application must work like this:

User opens application
        ↓
Upload Syllabus Document
        ↓
System extracts syllabus content
        ↓
Display extracted syllabus
        ↓
User selects question-paper settings
        ↓
AI generates questions ONLY from uploaded syllabus
        ↓
Question paper preview
        ↓
User can regenerate/edit questions
        ↓
Download Question Paper as PDF


2. Syllabus Upload

Create a clean page named:

Upload Syllabus

Allow the user to upload:

PDF

DOCX

TXT

Show a drag-and-drop upload area.

Example:

┌─────────────────────────────────────┐
│                                     │
│       Upload Your Syllabus          │
│                                     │
│   Drag & Drop your file here        │
│              OR                     │
│          [ Choose File ]            │
│                                     │
│      PDF / DOCX / TXT               │
│                                     │
└─────────────────────────────────────┘


After upload display:

File name

File type

File size

Upload status

Remove button

Button:

Extract Syllabus

3. Syllabus Content Extraction

After clicking Extract Syllabus, read the uploaded document.

Extract:

Subject name

Subject code

Units

Unit titles

Topics

Subtopics

Important concepts

Course outcomes if available

Example extracted result:

Subject:
Database Management Systems

Unit 1:
Introduction to DBMS

Topics:
- Database concepts
- DBMS architecture
- Data models
- ER model
- Relational model

Unit 2:
Relational Database

Topics:
- Relational algebra
- SQL
- Joins
- Constraints
- Normalization


Display the extracted syllabus to the user.

Allow the user to edit the extracted content before generating questions.

4. Question Generation Settings

After syllabus extraction, show a configuration section.

Number of Questions

Allow:

5

10

20

30

Custom number

Total Marks

Allow the user to enter:

Example:

Total Marks: 100


Difficulty

Allow:

Easy
Medium
Hard


The user should be able to specify the percentage.

Example:

Easy:   30%
Medium: 50%
Hard:   20%


Question Type

Allow:

MCQ

Short Answer

Long Answer

Essay

The user can select one or multiple types.

Marks per Question

Allow configuration such as:

Section A
10 × 1 = 10

Section B
5 × 2 = 10

Section C
5 × 8 = 40

Section D
2 × 20 = 40


The system must calculate the total automatically.

5. Important AI Rule

The AI must generate questions ONLY from the uploaded syllabus content.

Do NOT generate questions from unrelated external knowledge.

The AI should first analyze:

Uploaded Syllabus
       ↓
Units
       ↓
Topics
       ↓
Concepts
       ↓
Generate Questions


Every generated question must be traceable to a syllabus unit/topic.

For example:

Question:
Explain the different types of database models.

Unit:
Unit 1

Topic:
Data Models


Store the source unit/topic internally for validation.

6. Question Generation

Create a button:

Generate Question Paper

When clicked:

Analyze uploaded syllabus.

Identify all units.

Identify topics under each unit.

Distribute questions across units.

Apply selected difficulty distribution.

Apply selected question types.

Apply selected marks.

Avoid duplicate questions.

Ensure questions are relevant to the syllabus.

Generate the final question paper.

Show a loading screen:

Analyzing syllabus...

✓ Reading document
✓ Identifying units
✓ Identifying topics
✓ Creating questions
✓ Checking duplicates
✓ Validating marks
✓ Preparing question paper


7. Question Generation Logic

Do NOT simply generate random questions.

The system should intelligently distribute questions.

Example:

If syllabus contains:

Unit 1
Unit 2
Unit 3
Unit 4
Unit 5


and user requests:

50 questions


the system should distribute questions across all available units instead of generating all questions from Unit 1.

Allow configurable unit weightage if required.

Example:

Unit 1 → 20%
Unit 2 → 20%
Unit 3 → 20%
Unit 4 → 20%
Unit 5 → 20%


8. Difficulty Generation

If user selects:

Easy = 30%
Medium = 50%
Hard = 20%


and total questions = 20,

generate approximately:

Easy   = 6
Medium = 10
Hard   = 4


Validate the final distribution.

9. Duplicate Prevention

The system must check generated questions for duplicates.

Example:

Question 1:
Explain normalization.

Question 15:
Describe the process of normalization.


These should be detected as potentially similar.

Regenerate one of them.

Do not allow repeated questions in the final paper.

10. Question Paper Preview

After generation, display a professional preview.

Example:

================================================

             COLLEGE NAME

       END SEMESTER EXAMINATION

Subject Code: CS3501
Subject: Database Management Systems

Duration: 3 Hours
Maximum Marks: 100

================================================

                    SECTION A
                   10 × 1 = 10

1. What is a database?

2. Define DBMS.

3. What is a primary key?

...

================================================

                    SECTION B
                   5 × 2 = 10

11. Explain database architecture.

12. Define normalization.

...

================================================

                    SECTION C
                   5 × 8 = 40

16. Explain the different types of database models.

17. Explain normalization with suitable examples.

...

================================================

                    SECTION D
                  2 × 20 = 40

21. Explain DBMS architecture in detail.

22. Discuss normalization and its different normal forms.

================================================


11. Edit Generated Questions

Before downloading, allow the user to modify the generated paper.

For every question provide:

Edit

Replace

Delete

The Replace button should generate another question from the same syllabus unit/topic and same marks/difficulty.

Example:

Question 5
Unit: Unit 2
Marks: 5
Difficulty: Medium

[Edit] [Replace] [Delete]


12. Regenerate Entire Paper

Provide:

Regenerate Paper

When clicked, generate a new paper using the same syllabus and settings but with different questions.

Do not modify the uploaded syllabus.

13. PDF Download

Create a button:

Download Question Paper PDF

Generate a professional A4 PDF.

PDF must contain:

College name

Exam name

Subject name

Subject code

Semester

Date

Duration

Maximum marks

Instructions

Sections

Questions

Question numbers

Marks

Page numbers

Use proper spacing and page breaks.

The downloaded file name should be:

Question_Paper_<SubjectName>.pdf


Example:

Question_Paper_Database_Management_Systems.pdf


14. PDF Layout

Use a clean university examination-paper format.

Header:

COLLEGE NAME
DEPARTMENT NAME

END SEMESTER EXAMINATION

SUBJECT CODE: CS3501
SUBJECT: DATABASE MANAGEMENT SYSTEMS

Duration: 3 Hours              Maximum Marks: 100


Then:

Instructions:
1. Answer all questions as instructed.
2. Write answers clearly.
3. Figures should be drawn wherever necessary.


Then sections.

Marks should be clearly displayed.

Use A4 size with professional margins.

15. Backend

Create backend APIs:

POST /api/syllabus/upload
POST /api/syllabus/extract
POST /api/questions/generate
POST /api/questions/regenerate
POST /api/questions/replace
POST /api/question-paper/generate-pdf


The backend must:

Receive uploaded document

Extract text

Parse units/topics

Send syllabus content to AI

Generate questions

Validate questions

Create final question paper

Generate PDF

Return PDF to frontend

16. Recommended Technology

Frontend:

React

TypeScript

Vite

Tailwind CSS

Axios

Backend:

Node.js

Express.js

TypeScript

Document extraction:

For PDF:

pdf-parse

For DOCX:

mammoth

For TXT:

native filesystem processing

AI:

Create an independent AI service so that an AI provider can be configured through environment variables.

PDF:

Use a reliable Node.js PDF generation library.

Database is optional for the first version.

The first version should work without requiring the user to create an account.

17. AI Prompt Architecture

Create a dedicated backend AI prompt.

The AI should receive:

SYLLABUS:

{extracted syllabus}

QUESTION PAPER REQUIREMENTS:

Number of Questions:
{number}

Total Marks:
{totalMarks}

Difficulty:
{difficultyDistribution}

Question Types:
{questionTypes}

Marks Pattern:
{marksPattern}


AI instructions:

You are an expert university examination question-paper generator.

Generate questions strictly from the provided syllabus.

Do not introduce concepts that are not present in the syllabus.

Cover the available units and topics appropriately.

Follow the requested number of questions.

Follow the requested marks distribution.

Follow the requested difficulty distribution.

Avoid duplicate or semantically similar questions.

Ensure every question is academically meaningful.

Return structured JSON only.

For every question include:

questionNumber
questionText
unit
topic
questionType
marks
difficulty


18. JSON Response Format

The AI should return:

{
  "subject": "Database Management Systems",
  "totalMarks": 100,
  "duration": "3 Hours",
  "sections": [
    {
      "name": "Section A",
      "questions": [
        {
          "questionNumber": 1,
          "questionText": "What is a database?",
          "unit": "Unit 1",
          "topic": "Database Concepts",
          "questionType": "Short Answer",
          "marks": 1,
          "difficulty": "Easy"
        }
      ]
    }
  ]
}


The backend must validate this JSON before showing the paper.

19. Validation

Before displaying the final paper, verify:

✓ Number of questions

✓ Total marks

✓ Question types

✓ Difficulty distribution

✓ Unit coverage

✓ No duplicate questions

✓ Every question belongs to syllabus content

✓ No empty questions

✓ Valid JSON response

If validation fails:

Question paper could not be generated correctly.

Reason:
Insufficient questions for Unit 4 / Hard difficulty.

[Regenerate]


Do not show raw API or server errors.

20. UI Pages

Only create these pages:

Page 1 — Home

Show:

Automatic Question Paper Generator

Upload your syllabus and generate a complete
question paper automatically using AI.

[Upload Syllabus]


Page 2 — Upload Syllabus

Upload PDF/DOCX/TXT.

Page 3 — Syllabus Preview

Show extracted:

Subject

Units

Topics

Allow editing.

Page 4 — Question Paper Settings

Configure:

Number of questions

Total marks

Difficulty

Question types

Marks pattern

Duration

Exam name

Page 5 — Generated Question Paper

Show:

Paper preview

Edit

Replace

Delete

Regenerate

Download PDF

21. UI Design

Use a modern educational application design.

Theme:

White background

Blue primary color

Dark navy text

Light gray cards

Blue buttons

Rounded corners

Clean typography

Minimal shadows

Make it fully responsive.

Desktop:

Two-column layout where appropriate.

Mobile:

Single-column layout.

22. Error Handling

Handle:

Unsupported file

Empty file

Corrupted PDF

Invalid DOCX

No syllabus content detected

AI API failure

Invalid AI response

Insufficient syllabus topics

PDF generation failure

Example:

Unable to extract syllabus content.

Please upload a valid PDF, DOCX, or TXT syllabus file.


23. Important Requirement

The core functionality must be completely working:

UPLOAD SYLLABUS
       ↓
READ SYLLABUS
       ↓
EXTRACT UNITS & TOPICS
       ↓
USER CONFIGURES PAPER
       ↓
AI GENERATES QUESTIONS
       ↓
VALIDATE QUESTIONS
       ↓
SHOW QUESTION PAPER
       ↓
EDIT / REGENERATE
       ↓
GENERATE PDF
       ↓
DOWNLOAD PDF


Do not create static/demo questions.

The generated questions must dynamically depend on the uploaded syllabus.

The PDF must dynamically contain the generated questions.

All frontend buttons must be connected to working backend functionality.

Build the complete project with clean folder structure, reusable components, proper API integration, error handling, loading states, and responsive UI.

This project was built with [Lovable](https://lovable.dev).

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/63219fa4-6b47-4e4e-9a53-b011dd0adecc).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
