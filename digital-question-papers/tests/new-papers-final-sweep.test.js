const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const { answerComplete } = require("../exam-engine.js");
const marking = require("../exam-marking.js");
const registry = require("../paper-registry.js");
const styles = fs.readFileSync(path.resolve(__dirname, "../styles.css"), "utf8");

assert.match(styles, /\.paper-level-ah :is\(\.shared-notation-score-wrap, \.notation-score-wrap\)\s*\{[^}]*max-width:\s*100%;[^}]*overflow-x:\s*visible;/s, "Advanced Higher score wrappers must fit without horizontal scrolling.");
assert.match(styles, /\.paper-level-ah :is\(\.q3-shared-score, \.notation-score\)\s*\{[^}]*min-width:\s*0;[^}]*width:\s*100%;[^}]*max-width:\s*100%;/s, "Advanced Higher scores must scale to their complete container width without clipping.");
assert.match(styles, /\.paper-level-ah \.answer-option-score\s*\{[^}]*width:\s*650px;[^}]*max-width:\s*100%;/s, "Advanced Higher score choices must never exceed their available question width.");

const paperIds = [
  "national5-2026",
  "higher-2026",
  "advanced-higher-2017",
  "advanced-higher-2018",
  "advanced-higher-2019",
  "advanced-higher-2022",
  "advanced-higher-2023",
  "advanced-higher-2024",
  "advanced-higher-2025",
  "advanced-higher-2026",
];

const audioFiles = new Set();

for (const paperId of paperIds) {
  const paper = require(`../papers/${paperId}.js`);
  const registryEntry = registry[paperId];
  const questions = paper.questions;
  const parts = questions.flatMap(question => question.subquestions);

  assert.equal(paper.id, paperId, `${paperId}: paper id`);
  assert.ok(registryEntry, `${paperId}: registry entry`);
  assert.equal(registryEntry.id, paperId, `${paperId}: registry id`);
  const expectedMinutes = paper.levelCode === "AH" ? 75 : paper.levelCode === "H" ? 60 : 45;
  assert.equal(paper.estimatedMinutes, expectedMinutes, `${paperId}: qualification-specific Exam Mode duration`);
  assert.equal(paper.totalMarks, 40, `${paperId}: advertised total`);
  assert.equal(questions.reduce((sum, question) => sum + question.marks, 0), 40, `${paperId}: question-mark total`);
  assert.equal(parts.reduce((sum, part) => sum + part.marks, 0), 40, `${paperId}: part-mark total`);
  assert.equal(new Set(questions.map(question => question.id)).size, questions.length, `${paperId}: unique question ids`);
  assert.equal(new Set(parts.map(part => part.id)).size, parts.length, `${paperId}: unique part ids`);
  assert.deepEqual(questions.map(question => question.number), questions.map((_, index) => String(index + 1)), `${paperId}: question order`);

  const source = path.resolve(__dirname, "..", paper.sourcePath);
  const markingInstructions = path.resolve(__dirname, "..", paper.markingInstructionsPath);
  const dataFile = path.resolve(__dirname, "..", registryEntry.dataFile.split("?")[0]);
  assert.equal(fs.existsSync(source), true, `${paperId}: official paper exists`);
  assert.equal(fs.existsSync(markingInstructions), true, `${paperId}: official marking instructions exist`);
  assert.equal(fs.existsSync(dataFile), true, `${paperId}: registered data file exists`);
  assert.notEqual(source, markingInstructions, `${paperId}: source and marking paths are distinct`);
  assert.match(source, new RegExp(String(paper.year)), `${paperId}: source year`);
  assert.match(markingInstructions, new RegExp(String(paper.year)), `${paperId}: marking-instruction year`);

  for (const question of questions) {
    assert.ok(question.audio?.clips?.length, `${paperId} ${question.id}: question audio`);
    for (const clip of question.audio.clips) {
      const audioPath = path.resolve(__dirname, "..", clip.file);
      assert.equal(fs.existsSync(audioPath), true, `${paperId} ${question.id}: audio file exists`);
      assert.equal(clip.maxPlaysExam, 1, `${paperId} ${question.id}: Exam Mode play limit`);
      assert.ok(clip.markers?.length, `${paperId} ${question.id}: section markers`);
      clip.markers.forEach((marker, index) => {
        assert.equal(typeof marker.label, "string", `${paperId} ${question.id}: marker label`);
        assert.ok(marker.label.trim(), `${paperId} ${question.id}: non-empty marker label`);
        assert.ok(Number.isFinite(marker.time) && marker.time >= 0, `${paperId} ${question.id}: finite marker time`);
        if (index) assert.ok(marker.time > clip.markers[index - 1].time, `${paperId} ${question.id}: marker order`);
      });
      audioFiles.add(audioPath);
    }
  }

  for (const part of parts) {
    assert.equal(marking.markSubquestion(part, undefined).marks, 0, `${paperId} ${part.id}: blank response scores zero`);
    assert.equal(answerComplete(part, undefined), false, `${paperId} ${part.id}: blank response remains incomplete`);
  }

  if (paper.levelCode === "AH") {
    const finalQuestion = questions.at(-1);
    assert.equal(finalQuestion.id, "q6", `${paperId}: comparative-analysis question`);
    assert.deepEqual(finalQuestion.subquestions.map(part => part.marks), [2, 2, 4, 2], `${paperId}: Question 6 marks`);
    assert.deepEqual(finalQuestion.subquestions.map(part => part.type), ["structured-review", "structured-review", "structured-review", "structured-review"], `${paperId}: Question 6 response types`);
    const endMarkers = finalQuestion.subquestions.filter(part => part.endOfPaper !== false);
    assert.ok(endMarkers.length <= 1, `${paperId}: at most one optional print end marker`);
    if (endMarkers.length) assert.equal(endMarkers[0], finalQuestion.subquestions.at(-1), `${paperId}: an end marker follows only the conclusion`);
  }
}

assert.equal(audioFiles.size, 64, "all ten papers use their own 64 question tracks");

console.log("New-paper final cross-paper sweep passed.");
