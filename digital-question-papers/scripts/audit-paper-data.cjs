"use strict";

// Exhaustive implementation checks, not an independent musical/source verdict.
const fs = require("node:fs");
const path = require("node:path");
const registry = require("../paper-registry.js");
const marking = require("../exam-marking.js");
const { answerComplete } = require("../exam-engine.js");
const base = path.resolve(__dirname, "..");

function audit() {
  const papers = [];
  for (const entry of Object.values(registry)) {
    const paper = require(path.join(base, entry.dataFile.split("?")[0]));
    const issues = [];
    const ids = new Set();
    const questions = paper.questions.map(question => {
      if (question.marks !== question.subquestions.reduce((sum, part) => sum + part.marks, 0)) issues.push(`${question.id}: mark total mismatch`);
      const parts = question.subquestions.map(part => {
        if (ids.has(part.id)) issues.push(`${part.id}: duplicate id`);
        ids.add(part.id);
        const failures = [];
        let assertions = 0;
        const check = (condition, message) => { assertions++; if (!condition) failures.push(message); };
        check(marking.markSubquestion(part, undefined).marks === 0, "blank awards marks");
        check(!answerComplete(part, undefined), "blank is complete");
        const wrong = part.type === "checkbox" ? ["zzzxq"] : part.type === "comparison-grid" ? { c: ["zzzxq"] } : part.type === "structured-review" ? { final: "zzzxq" } : part.type === "lyric-placement" ? { 1: "zzzxq" } : "zzzxq";
        check(marking.markSubquestion(part, wrong).marks === 0, "nonsense awards marks");
        let answers = part.numberedLineAnswers ? [part.numberedLineAnswers.map(line => line[0]).join("\n"), ...(part.acceptedAnswers || []), ...(part.acceptedCompactAnswers || [])] : part.type === "checkbox" ? [part.answers] : part.acceptedAnswers || (part.answer !== undefined ? [part.answer] : []);
        // Accidental tools store both the symbol and its allowed note position.
        if (part.notationTool === "accidental") answers = answers.flatMap(answer => (part.accidentalNoteIndices || [0]).map(index => `${answer}@${index}`));
        for (const answer of answers) {
          check(marking.markSubquestion(part, answer).marks === part.marks, `declared accepted answer rejected: ${JSON.stringify(answer)}`);
          if (typeof answer === "string" && !part.caseSensitiveAcceptedAnswers?.includes(answer) && !part.numberedLineAnswers) {
            const variant = `  ${answer.toUpperCase().replace(/ /g, "   ")}  `;
            check(marking.markSubquestion(part, variant).marks === part.marks, `case/space variant rejected: ${JSON.stringify(answer)}`);
          }
        }
        if (part.options?.length && ["radio", "notation-choice"].includes(part.type) && !part.notationTool) {
          for (const option of part.options) {
            const value = option.value;
            const declaredCorrect = answers.some(answer => marking.normalise(answer) === marking.normalise(value));
            check((marking.markSubquestion(part, value).marks > 0) === declaredCorrect, `option conflicts with answer key: ${value}`);
          }
        }
        failures.forEach(failure => issues.push(`${part.id}: ${failure}`));
        return { id: part.id, label: part.label, type: part.type, marks: part.marks, notationTool: part.notationTool || null, markingProfile: part.markingProfile || null, acceptedAnswerChecks: answers.length, assertions, failures, sourceVerification: "pending", browserVerification: "pending" };
      });
      return { id: question.id, number: question.number, marks: question.marks, markers: (question.audio?.clips || []).flatMap(clip => clip.markers || []).length, parts };
    });
    for (const field of ["sourcePath", "markingInstructionsPath", "introductionAudio"]) {
      if (paper[field] && !fs.existsSync(path.resolve(base, paper[field]))) issues.push(`${field}: missing ${paper[field]}`);
    }
    const audio = paper.questions.flatMap(q => q.audio?.clips || []);
    for (const clip of audio) {
      if (!fs.existsSync(path.resolve(base, clip.file))) issues.push(`missing audio: ${clip.file}`);
      if ((clip.markers || []).some((m, i, a) => !Number.isFinite(m.time) || m.time < 0 || (i && m.time < a[i - 1].time))) issues.push(`invalid marker order: ${clip.file}`);
    }
    if (paper.questions.reduce((sum, q) => sum + q.marks, 0) !== paper.totalMarks) issues.push("paper total mismatch");
    papers.push({ id: paper.id, level: paper.level, year: paper.year, marks: paper.totalMarks, sourcePath: paper.sourcePath, markingInstructionsPath: paper.markingInstructionsPath, questions, issues });
  }
  return { generatedAt: new Date().toISOString(), scope: "Implementation assertions; official-source, visual and listening verification are separate", papers };
}

if (require.main === module) {
  const result = audit();
  const out = process.argv[2];
  if (out) { fs.mkdirSync(path.dirname(out), { recursive: true }); fs.writeFileSync(out, JSON.stringify(result, null, 2) + "\n"); }
  for (const paper of result.papers) console.log(paper.id, paper.issues.length ? paper.issues.join("\n  ") : "implementation checks passed");
  console.log(JSON.stringify({ papers: result.papers.length, questions: result.papers.reduce((n, p) => n + p.questions.length, 0), parts: result.papers.flatMap(p => p.questions).flatMap(q => q.parts).length, assertions: result.papers.flatMap(p => p.questions).flatMap(q => q.parts).reduce((n, p) => n + p.assertions, 0), issues: result.papers.reduce((n, p) => n + p.issues.length, 0) }));
  process.exitCode = result.papers.some(p => p.issues.length) ? 1 : 0;
}
module.exports = { audit };
