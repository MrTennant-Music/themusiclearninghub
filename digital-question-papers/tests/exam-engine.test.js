const assert = require("node:assert/strict");
const fs = require("node:fs");

global.localStorage = {
  values: new Map(),
  getItem(key) { return this.values.has(key) ? this.values.get(key) : null; },
  setItem(key, value) { this.values.set(key, value); },
  removeItem(key) { this.values.delete(key); },
};

const storage = require("../exam-storage.js");
global.ExamStorage = storage;
const marking = require("../exam-marking.js");
global.ExamMarking = marking;
const paper = require("../papers/national5-2014.js");
const paperRegistry = require("../paper-registry.js");
const paperRegistrySource = fs.readFileSync(require.resolve("../paper-registry.js"), "utf8");
const { ExamEngine, createAttempt, validateAttempt } = require("../exam-engine.js");
const examHtml = fs.readFileSync(require.resolve("../digitalquestionpapers.html"), "utf8");
const examUiSource = fs.readFileSync(require.resolve("../exam-ui.js"), "utf8");
const examAudioSource = fs.readFileSync(require.resolve("../exam-audio.js"), "utf8");
const examStyles = fs.readFileSync(require.resolve("../styles.css"), "utf8");
const examCanvasFitSource = fs.readFileSync(require.resolve("../exam-canvas-fit.js"), "utf8");

const statusPaperId = "status-test-paper";
storage.clearAll(statusPaperId);
assert.equal(storage.paperStatus(statusPaperId), null, "A paper with no saved pupil work should have the default index appearance.");
storage.saveDraft(statusPaperId, { status: "active", answers: {} });
assert.equal(storage.paperStatus(statusPaperId), null, "A fresh blank paper should retain the default index appearance.");
storage.saveDraft(statusPaperId, { status: "active", answers: { q1a: "Gospel" } });
assert.equal(storage.paperStatus(statusPaperId), "in-progress", "A paper with a saved answer should be marked in progress.");
storage.saveSubmitted(statusPaperId, { status: "submitted", answers: { q1a: "Gospel" } });
assert.equal(storage.paperStatus(statusPaperId), "completed", "A submitted paper should be marked completed.");
storage.deleteDraft(statusPaperId);
storage.deleteSubmitted(statusPaperId);
storage.saveDraft(statusPaperId, { status: "active", answers: {} });
assert.equal(storage.paperStatus(statusPaperId), null, "Try Again or Restart should restore the default index appearance until another answer is entered.");
storage.clearAll(statusPaperId);

assert.match(examHtml, /<title>Digital Question Papers<\/title>/, "The interactive-paper browser title should use the Digital Question Papers name.");
assert.match(examHtml, /<h1>Digital Question Papers<\/h1>/, "The interactive-paper header should use the Digital Question Papers name.");
assert.doesNotMatch(examUiSource, /^\s*document\.title\s*=/m, "The chooser and selected papers should keep the Digital Question Papers browser title.");
assert.match(examStyles, /mask:\s*url\("\.\.\/ui-icons\/prtick\.svg"\)/, "Selected paper answers should use the established ui-icons/prtick.svg tick.");
assert.match(examStyles, /input:checked::after\s*\{[^}]*translate\(\.5px,\s*-1px\)/, "The selected-answer tick should retain its established half-pixel right adjustment.");
assert.match(examStyles, /\.notation-rhythm-option-glyph\s*\{[^}]*top:\s*8px/, "Question 3 rhythm-button glyphs should retain their requested optical position.");
assert.match(examStyles, /\.paper-level-h\.question-q4 \[data-subquestion="q4e"\] \.notation-tool-rhythm-entry\[data-value="crotchetRest"\] \.rhythm-glyph-accent,\s*\.paper-level-h\.question-q4 \[data-subquestion="q4e"\] \.notation-tool-rhythm-entry\[data-value="quaverRest"\] \.rhythm-glyph-accent\s*\{\s*top:\s*-8px;/, "Higher 2023's rest glyphs should be optically centred in their buttons.");
assert.match(examStyles, /\.paper-level-h\.question-q4 \[data-subquestion="q4e"\] \.notation-tool-rhythm-entry\[data-value="dottedCrotchetRest"\] \.notation-rhythm-option-glyph\s*\{\s*top:\s*0;/, "Higher 2023's dotted crotchet rest glyph should be optically centred in its button.");
assert.match(examStyles, /\.paper-level-h\.question-q4 \[data-subquestion="q4e"\] \.notation-tool-rhythm-entry\[data-value="dottedCrotchetRest"\] \.rhythm-compound-preview\s*\{\s*font-size:\s*2\.35rem;/, "Higher 2023's dotted crotchet rest glyph should use the larger rest-button size.");
assert.match(examStyles, /\.rhythm-glyph-muted\s*\{[^}]*color:\s*#a8a29e/, "Question 3 rhythm tools should grey the part of the note that is already provided.");
assert.match(examStyles, /\.is-tail-tool \.rhythm-glyph-muted\s*\{[^}]*translateX\(-4\.5px\)/, "The grey note layer in the quaver tool should sit four and a half pixels left of the black tail.");
assert.match(examStyles, /\.notation-clear-button\s*\{[^}]*height:\s*44px;[^}]*min-height:\s*44px;/, "All notation Clear controls should use the same compact height.");
assert.match(examStyles, /\.q3-tonic-selection, \.q3-note-selection-outline\s*\{[^}]*fill:\s*none !important;/, "Feedback circles around selected notes should remain hollow when coloured red or green.");
assert.match(examStyles, /\.paper-level-h \.answer-reference-footer\s*\{[^}]*justify-content:\s*space-between;/, "Higher answer-reference Clear controls should align to the right edge with the other Clear controls.");
assert.match(examStyles, /question-q4 \[data-subquestion="q4b"\] \.answer-reference-footer\s*\{[^}]*width:\s*46rem;/, "Higher Question 4(b)'s answer-reference Clear control should share the other Clear controls' content width.");
assert.match(examStyles, /question-q4 \[data-subquestion="q4f"\] \.answer-reference-footer\s*\{[^}]*width:\s*46rem;/, "Higher Question 4(f)'s answer-reference Clear control should share the other Clear controls' content width.");
assert.match(examStyles, /\.exam-year-menu\s*\{[^}]*max-height:\s*430px;[^}]*overflow:\s*hidden;/, "The Year menu should use a shorter fixed container.");
assert.match(examStyles, /\.exam-year-menu \.exam-selection-menu-list\s*\{[^}]*max-height:\s*350px;[^}]*overflow-x:\s*hidden;[^}]*overflow-y:\s*auto;[^}]*overscroll-behavior:\s*contain;/, "The Year menu should scroll vertically without horizontal overflow or passing overscroll to the paper.");
assert.match(examStyles, /\.exam-year-menu\s*\{[^}]*width:\s*360px;[^}]*max-width:\s*360px;/, "The Year menu should use the narrower menu width.");
assert.match(examHtml, /data-open-mode-picker[^>]+data-exam-menu-trigger="customise"[^>]+aria-expanded="false"[^>]+aria-controls="exam-customise-menu"/, "The toolbar should open the shared Customise menu.");
assert.match(examHtml, /<div class="hub-toolbar-left">[\s\S]*data-back-to-papers[\s\S]*data-open-mode-picker/, "Customise should sit beside Back on the left.");
assert.match(examHtml, /<div class="hub-toolbar-right">\s*<div class="hub-toolbar-feedback exam-question-navigation"/, "Question navigation should sit on the right of the paper toolbar.");
assert.match(examStyles, /\.exam-paper-toolbar\s*\{[^}]*grid-template-columns:\s*minmax\(0,\s*1fr\) auto minmax\(0,\s*1fr\);/, "The paper toolbar should centre question navigation between equal side columns.");
assert.match(examStyles, /\.exam-reset-confirm:hover,\s*\.exam-reset-confirm:focus-visible\s*\{[^}]*border-color:\s*#292524;[^}]*background:\s*#292524;/, "Restart and End confirmations should retain a dark hover treatment.");
assert.match(examHtml, /data-mode-toolbar-icon src="\.\.\/ui-icons\/customise\.svg"[^>]*>[\s\S]*data-mode-toolbar-label>Customise</, "The toolbar should use the Customise glyph and label.");
assert.match(examHtml, /data-mode-option="exam"/, "Customise should offer Exam Mode.");
assert.match(examHtml, /data-reset-paper/, "Customise should retain Restart.");
assert.match(examUiSource, /examIsActive = engine\.attempt\.mode === "exam" && engine\.attempt\.examStarted && engine\.attempt\.status === "active";[\s\S]*textContent = examIsActive \? "End" : "Restart";/, "An active Exam Mode attempt should relabel Restart as End.");
assert.match(examUiSource, /\[data-reset-title\][\s\S]*examIsActive \? "End Exam Mode" : "Restart";[\s\S]*\[data-confirm-reset\][\s\S]*examIsActive \? "End" : "Restart";/, "The active Exam Mode confirmation should use End wording throughout.");
assert.doesNotMatch(examHtml, /data-mode-option="practice"|>Practice Mode</, "The pupil-facing interface should not expose Practice Mode.");
assert.match(examHtml, /<h2 id="start-title">Exam Mode<\/h2>/, "Choosing Exam Mode should open a dedicated information prompt without a duplicate duration label.");
assert.match(examHtml, /data-exam-mode-warning><ul>/, "The Exam Mode information should be expanded immediately.");
assert.match(examHtml, /data-mode-progress-warning hidden>This will clear your current progress\.<\/p>/, "The Exam Mode prompt should use the concise progress warning.");
assert.match(examHtml, /data-new-paper-overlay[\s\S]*Starting another paper, at any level, will <strong>reset your current paper<\/strong>\.[\s\S]*data-confirm-new-paper>Start<\/button>/, "Changing paper should warn that the current paper will be reset.");
assert.match(examUiSource, /openNewPaperConfirmation\(option\.dataset\.paperId\);/, "Selecting a different year or level should open the new-paper warning before navigation.");
assert.match(examUiSource, /\[data-confirm-new-paper\][\s\S]*engine\.destroy\(\);[\s\S]*deleteDraft\(paper\.id\);[\s\S]*deleteSubmitted\(paper\.id\);[\s\S]*digitalquestionpapers\.html\?paper=/, "Confirming a new paper should clear the current paper before navigation.");
assert.match(examUiSource, /discardCurrentPaperOnUnload = true;[\s\S]*deleteDraft\(paper\.id\);[\s\S]*root\.location\.href/, "Starting another paper should prevent the normal unload save from recreating the cleared draft.");
assert.match(examUiSource, /beforeunload[\s\S]*if \(!discardCurrentPaperOnUnload\) engine\.persist\(\);[\s\S]*engine\.destroy\(\);/, "Leaving a normal paper should persist its current browser-stored progress.");
assert.match(examHtml, /data-start-actions><p[^>]+data-mode-progress-warning[^>]*>This will clear your current progress\.<\/p><button[^>]+data-cancel-start-button>Cancel<\/button><button[^>]+data-start-attempt>Start<\/button>/, "The Exam Mode prompt should centre its concise progress warning to the left of the Cancel and Start actions.");
assert.match(examUiSource, /selectedStartMode = "exam";[\s\S]*data-start-overlay/, "The Customise action should prepare Exam Mode directly without a mode switcher.");
assert.match(examUiSource, /if \(!engine\.attempt\) \{\s*selectedStartMode = "practice";\s*startAttempt\("practice"\);\s*\}/, "Every fresh paper should launch directly into the unrestricted normal paper state.");
assert.match(examUiSource, /\[data-confirm-reset\][\s\S]*?engine\.destroy\(\);\s*selectedStartMode = "practice";\s*startAttempt\("practice"\);/, "Restart should return directly to a fresh normal paper state.");
assert.doesNotMatch(examHtml, /exam-start-overlay is-open/, "Exam Mode information should not cover a paper on launch.");
assert.match(examUiSource, /\[data-confirm-mode-change\]"\)\.textContent = "Start";/, "Mode-change confirmation should also use the concise Start label.");
assert.doesNotMatch(examHtml, /exam-mode-duration/, "The Exam Mode heading should not repeat the paper duration.");
assert.match(examUiSource, /document\.querySelector\("\[data-exam-mode-warning\] li"\)\.textContent = `Audio and \$\{paper\.estimatedMinutes\}-minute timer start immediately\.`;/, "Every qualification should display its paper-specific timer guidance.");
assert.doesNotMatch(examHtml, /Work at your own pace, replay audio and move freely between questions\.|Complete the full paper under timed, one-sitting conditions\./, "The two mode buttons should not contain descriptive subtitles.");
assert.match(examStyles, /\.question-header\s*\{[^}]*min-width:\s*0;/, "Question headers inside the paper should not inherit the page-wide 1280px minimum width.");
assert.match(examHtml, /exam-canvas-fit\.js/, "Interactive papers should load their desktop-canvas fitting helper.");
assert.match(examCanvasFitSource, /Math\.min\(1, visibleWidth \/ DESKTOP_WIDTH\)/, "Interactive papers should scale down only when the visible browser width is below 1280px.");
assert.match(examStyles, /html\s*\{[^}]*min-width:\s*0;[^}]*overflow-x:\s*hidden;/, "The fitted Interactive Paper canvas should not leave a horizontal page scrollbar.");
assert.match(examStyles, /\.exam-site\s*\{[^}]*zoom:\s*var\(--interactive-exam-scale\)/, "The complete Interactive Paper page should scale as one unchanged desktop canvas.");
assert.match(examStyles, /body\.exam-site\[data-pdf-feedback="true"\]\s*\{[^}]*zoom:\s*1;/, "Feedback PDF capture should retain the full unscaled desktop paper.");
assert.match(examStyles, /\[data-subquestion="q3d"\] \.notation-clear-button\s*\{[^}]*margin-left:\s*24px;\s*\}/, "The rhythm-correction Clear control should remain separated from the answer buttons while using the shared Clear-button shape.");
assert.match(examUiSource, /inlineNotationControls[\s\S]*inline-notation-controls[\s\S]*data-notation-container/, "Notation controls should support an inline position beside a question prompt.");
assert.match(examStyles, /\.question-q3 \.inline-notation-controls\s*\{[^}]*display:\s*inline-flex;[^}]*margin-left:\s*14px/, "Inline notation controls should sit beside their question text with a clear gap.");
assert.match(examStyles, /\.subquestion\.has-part-label > \.short-answer-line\s*\{[^}]*width:\s*min\(calc\(100% - 94px\),\s*calc\(46rem - 70px\)\)[^}]*margin-left:\s*44px/, "Standalone answer lines should retain their left edge and be shortened by fifty pixels from the right.");
assert.match(examStyles, /\.marked-question-card \.short-answer-line\.is-user-correct,[\s\S]*border-bottom-color:\s*var\(--paper-border\);[\s\S]*box-shadow:\s*none;/, "Marked short-answer lines should keep a neutral underline while the entered text carries the feedback colour.");
assert.match(examStyles, /\.result-footer-row\s*\{[^}]*gap:\s*16px/, "Feedback actions should have the same 16px space above them as below them.");
assert.match(examHtml, /bravura-worksheet-outlines\.js/, "Feedback PDFs should load the same Bravura vector outlines as Practice Questions PDFs.");
assert.match(examHtml, /<div class="automatic-marking-notice"><span>Marking is automated using the official marking instructions\./, "The automatic-marking notice should begin without a Notice label or bold text.");
assert.match(examHtml, /If you believe something is wrong then please give feedback using the link below\./, "The automatic-marking notice should use the requested plain-language final sentence.");
assert.match(examUiSource, /onclone:\s*clonedDocument => outlineFeedbackBravuraGlyphs\(clonedDocument\)/, "Feedback PDF capture should replace Bravura font characters with vector paths.");
assert.match(examUiSource, /symbolKey === "tie"[\s\S]*tiePath\.setAttribute\("d"/, "Feedback PDF capture should also replace tied-note font characters with a vector tie.");
assert.match(examUiSource, /feedbackPdfBreakpoints/, "Feedback PDF generation should find safe page breaks within long questions.");
assert.match(examUiSource, /while \(sourceY < canvas\.height\)/, "Long feedback questions should be divided across PDF pages instead of being shrunk.");
assert.match(examHtml, /vendor\/html2canvas-1\.4\.1\.min\.js/, "Feedback PDF generation should use the local html2canvas copy.");
assert.match(examHtml, /vendor\/jspdf-2\.5\.2\.umd\.min\.js/, "Feedback PDF generation should use the local jsPDF copy.");
assert.equal(paperRegistry["national5-2014"].dataFile.startsWith("papers/national5-2014.js"), true, "The reusable registry should load the 2014 paper without a paper-specific script in digitalquestionpapers.html.");
assert.doesNotMatch(paperRegistrySource, /document\.write/, "Paper data should load without the outdated document.write API.");
assert.match(paperRegistrySource, /InteractiveExamPaperReady[\s\S]*document\.createElement\("script"\)/, "Paper loading should expose a readiness promise for the exam interface.");
assert.match(examUiSource, /Promise\.resolve\(root\.InteractiveExamPaperReady\)\.then\(initialise, initialise\)/, "The exam interface should wait for the selected paper data before starting.");
assert.doesNotMatch(examHtml, /data-exam-menu-trigger="year"|data-paper-year-options/, "Year selection belongs on the paper chooser.");
assert.match(examAudioSource, /audio\.addEventListener\("error",/, "Audio loading failures should be reported instead of silently stalling Exam Mode.");
assert.match(examAudioSource, /async retry\(\)/, "The Exam Mode audio failure prompt should be able to retry playback from a pupil gesture.");
assert.doesNotMatch(examAudioSource, /audio\.play\(\)\.then\(\(\) => onClipStart/, "Autoplay should not fire the first clip-start callback a second time.");
assert.match(examAudioSource, /data-marker-time[\s\S]*event\.preventDefault\(\);[\s\S]*event\.stopPropagation\(\);/, "Audio marker clicks should not fall through to the progress slider.");
assert.match(examAudioSource, /async function seekTo\(seconds\)[\s\S]*loadSeekableAudioCopy\(\)/, "Audio markers should fall back to a fully loaded local copy when the web server cannot seek within the original file.");
assert.match(examAudioSource, /response\.blob\(\)[\s\S]*URL\.createObjectURL\(blob\)/, "The marker fallback should make the existing audio file seekable without changing paper data.");
assert.match(examStyles, /\.audio-markers\s*\{[^}]*z-index:\s*4;/, "Visible audio markers should sit above the progress slider so their full controls remain clickable.");
assert.match(examStyles, /\.audio-marker::after\s*\{[^}]*pointer-events:\s*auto;/, "The visible timestamp line should activate its marker instead of the progress slider underneath.");
assert.match(examUiSource, /function createRecoverableAudioPlayer[\s\S]*onPlaybackError: error => openStandardAudioErrorModal/, "Practice and feedback audio should show the same recoverable failure prompt rather than failing silently.");
assert.match(examUiSource, /The PDF tools could not be loaded\. Reload the page and try again\./, "Local PDF-tool failures should give relevant recovery advice.");
assert.doesNotMatch(examUiSource, /PDF tools could not be loaded\. Check your internet connection/, "Local PDF-tool failures should not incorrectly blame the internet connection.");
assert.doesNotMatch(examUiSource, /q8-final-answer-marks|finalAnswerMark/, "Question 8 should not repeat its mark beside the ruled Final answer area.");
assert.match(examUiSource, /data-final-answer-line/, "Structured Final answer areas should provide an independent input on every ruled line.");
assert.match(examUiSource, /finalLines\.join\("\\n"\)/, "Independent Final answer lines should remain one combined marked response.");
assert.match(examUiSource, /q8-final-answer-lines[\s\S]*data-final-answer-line/, "The shared Final answer layout should support the Higher and National 5 ruled-line questions.");
assert.match(examStyles, /\.q8-final-answer-line:focus-within\s*\{[^}]*border-bottom:\s*2px solid var\(--mlh-focus-color, #2563eb\);/, "Only the active Final answer line should receive the blue focus rule.");
assert.match(examStyles, /\.q8-final-answer-line input:focus\s*\{[^}]*box-shadow:\s*none;/, "Final answer lines should not show a whole-box focus outline.");

assert.equal(paper.questions.length, 8, "The paper should contain eight main questions.");
assert.equal(paper.questions.reduce((sum, question) => sum + question.marks, 0), 40, "Question marks should total 40.");
assert.equal(paper.questions.flatMap(question => question.subquestions).reduce((sum, part) => sum + part.marks, 0), 40, "Subquestion marks should total 40.");
assert.equal(paper.questions.flatMap(question => question.audio.clips).length, 8, "Each main question should have one complete audio track.");
assert.match(paper.introductionAudio, /Track 1-1\.m4a$/, "The separate spoken introduction should remain identified in the paper data.");
assert.deepEqual(paper.questions.map(question => question.audio.clips[0].file.match(/Track (\d+)/)[1]), ["2", "3", "4", "5", "6", "7", "8", "9"], "Tracks 2 to 9 should map to Questions 1 to 8.");
assert.equal(new Set(paper.questions.flatMap(question => question.subquestions.map(part => part.id))).size, paper.questions.flatMap(question => question.subquestions).length, "Subquestion IDs should be unique.");
assert.equal(paper.questions.flatMap(question => question.subquestions).filter(part => !part.finalAnswerField).every(part => Boolean(part.definition)), true, "Every individual answer should have a feedback definition.");

const questionThree = paper.questions.find(question => question.id === "q3");
assert.equal(questionThree.score.sharedNotation, "n5-2014-q3", "Question 3 should use its shared interactive music guide.");
assert.deepEqual(questionThree.subquestions.slice(0, 4).map(part => part.sharedScore), [true, true, true, true], "Parts (a) to (d) should update the shared score.");
assert.equal(questionThree.subquestions.find(part => part.id === "q3a").answer, "4/4", "The official Question 3 time signature should be retained.");
assert.equal(questionThree.subquestions.find(part => part.id === "q3b").answer, "p", "The official quiet dynamic should be retained.");
assert.equal(questionThree.subquestions.find(part => part.id === "q3c").answer, "B4,D4,E4", "The first three missing beats should match the corrected score transcription and preserve their stave positions.");
assert.equal(questionThree.subquestions.find(part => part.id === "q3d").answer, "end-bar-8", "The repeat sign should be placed at the end of bar 8.");
assert.equal(marking.markSubquestion(questionThree.subquestions.find(part => part.id === "q3a"), "C").marks, 1, "Question 3(a) should accept the official common-time alternative.");
assert.equal(marking.markSubquestion(questionThree.subquestions.find(part => part.id === "q3b"), "piano").marks, 1, "Question 3(b) should accept the full Italian term from the marking instructions.");

const questionSeven = paper.questions.find(question => question.id === "q7");
const concertoReason = questionSeven.subquestions.find(part => part.id === "q7a2");
const minimalistReason = questionSeven.subquestions.find(part => part.id === "q7b2");
assert.ok(["solo piano and orchestra", "solo instrument and orchestra", "piano and orchestra"].every(answer => concertoReason.acceptedAnswers.includes(answer)), "Question 7(a) should accept every reason listed in the official marking instructions.");
assert.ok(["repetition", "repeated melody", "repeated rhythm", "cells", "figures", "ideas", "motifs", "notes", "ostinato", "riff", "repeated phrase", "repeated phrases"].every(answer => minimalistReason.acceptedAnswers.includes(answer)), "Question 7(b) should accept every repetition example listed in the official marking instructions.");
assert.match(concertoReason.answerDisplay, /solo piano and orchestra; solo instrument and orchestra; or piano and orchestra/i, "Question 7(a) feedback should show all official alternatives.");
assert.match(minimalistReason.answerDisplay, /cells, figures, ideas, motifs, notes or phrases, an ostinato, or a riff/i, "Question 7(b) feedback should show the complete official guidance.");
assert.equal(marking.markSubquestion(concertoReason, "The piano is accompanied by an orchestra.").marks, 1, "Question 7(a) should accept equivalent wording that contains the official musical detail.");
assert.equal(marking.markSubquestion(concertoReason, "An orchestra plays while a soloist performs.").marks, 1, "Question 7(a) keyword marking should not depend on word order.");
assert.equal(marking.markSubquestion(concertoReason, "The piano plays throughout.").marks, 0, "Question 7(a) should still require the orchestra keyword.");
assert.equal(marking.markSubquestion(minimalistReason, "The rhythmic idea keeps repeating throughout.").marks, 1, "Question 7(b) should accept a sentence that clearly implies repetition.");

const typedParts = new Map(paper.questions.flatMap(question => question.subquestions).map(part => [part.id, part]));
const commonMisspellings = {
  q1c: "arko",
  q1e: "obow",
  q2a: "majour",
  q2c: "bras",
  q2d: "ritardendo",
  q3e: "g majer",
  q3f: "imperfect cadance",
  q4b: "reggea",
  q4d: "barritone",
  q6b: "floot",
  q6c: "pizzacato",
};
Object.entries(commonMisspellings).forEach(([id, response]) => {
  assert.equal(marking.markSubquestion(typedParts.get(id), response).marks, 1, `${id} should accept the common misspelling “${response}”.`);
});
assert.ok(["pitsicato", "pitzicato", "pitsickato"].every(answer => typedParts.get("q6c").acceptedAnswers.includes(answer)), "Question 6(c) should accept the requested common pizzicato spellings.");
assert.match(examUiSource, /target\.closest\("\.is-practice-checked"\)/, "Checked Practice Mode questions should block answer-removal gestures.");
assert.match(examUiSource, /checkAnswers\.disabled = false;/, "Practice Mode should allow pupils to check a blank or incomplete question.");
assert.doesNotMatch(examUiSource, /engine\.isQuestionChecked\(question\.id\) \|\| !questionIsComplete\(question\)/, "The Check Answers confirmation should not require a completed question.");
assert.equal(marking.markSubquestion(concertoReason, "A pianno plays with an orcestra.").marks, 1, "Question 7(a) should tolerate minor spelling errors in its required keywords.");

assert.equal(marking.normalise("  Dominant--Seventh!  "), "dominant seventh");
assert.equal(marking.normalise("Musique concrète"), "musique concrete", "Accents should not make a musical term fail marking.");
assert.equal(marking.normalise("2 / 4"), "2/4", "Spaces around a time-signature slash should not affect marking.");
assert.deepEqual(marking.markSubquestion({ type: "short-text", marks: 1, acceptedAnswers: ["dominant seventh"] }, " Dominant-Seventh. "), { marks: 1, status: "correct" });
const specialistSpellingExamples = [
  ["accelerando", "acelerando"],
  ["accelerando", "acselerando"],
  ["adagio", "adageeo"],
  ["alberti bass", "alberty base"],
  ["allegro", "allegrow"],
  ["anacrusis", "anocrusis"],
  ["andante", "andanti"],
  ["antiphonal", "anti phonal"],
  ["arco", "arcko"],
  ["ascending", "asending"],
  ["a cappella", "acappella"],
  ["a cappella", "a cappela"],
  ["a cappella", "a capella"],
  ["ballet", "ballett"],
  ["baroque", "barock"],
  ["bass guitar", "base guitar"],
  ["basso continuo", "basso continue"],
  ["basso continuo", "baso continuo"],
  ["basso continuo", "bass continuo"],
  ["bodhran", "bodran"],
  ["bodhran", "bowran"],
  ["cadenza", "cadensa"],
  ["castanets", "castinets"],
  ["cello", "chello"],
  ["cello", "celo"],
  ["chorale", "choral"],
  ["chorale", "corale"],
  ["chromatic", "cromatic"],
  ["clarsach", "carsack"],
  ["coloratura", "colouratura"],
  ["coloratura", "colour a tura"],
  ["concertino", "conchertino"],
  ["crescendo", "cresendo"],
  ["concerto", "concherto"],
  ["con sordino", "consordino"],
  ["contrapuntal", "contra puntal"],
  ["countermelody", "counter melody"],
  ["countertenor", "coutner tenor"],
  ["cymbals", "simbals"],
  ["descending", "desending"],
  ["diminution", "diminushion"],
  ["diminution", "diminootion"],
  ["distortion", "distorshon"],
  ["double bass", "double base"],
  ["fiddle", "fiddol"],
  ["flute", "floot"],
  ["flutter tonguing", "flutter tonging"],
  ["flutter tonguing", "flutter tounging"],
  ["flutter tonguing", "flutter tunging"],
  ["flutter tonguing", "flutter toungeing"],
  ["fugue", "fyoog"],
  ["fugue", "fuge"],
  ["gaelic psalm", "gaelic sam"],
  ["gaelic psalm", "gaelic salm"],
  ["glissando", "glisando"],
  ["harmonics", "harmonic"],
  ["hemiola", "hemeeloa"],
  ["hi hat", "hihat"],
  ["hi hat", "hi-hat"],
  ["homophonic", "homo phonic"],
  ["homophonic", "homo fonic"],
  ["improvisation", "improv"],
  ["improvised", "improv"],
  ["legato", "ligato"],
  ["lied", "leed"],
  ["mezzo soprano", "mezzo soparano"],
  ["mezzo soprano", "metzo soprano"],
  ["mezzo soprano", "metzo soparano"],
  ["modulation", "modulashion"],
  ["musique concrète", "musique concrete"],
  ["musique concrète", "music concrete"],
  ["neo-classical", "neo classical"],
  ["neo-classical", "neoclassical"],
  ["obbligato", "obligato"],
  ["organ", "orgun"],
  ["passacaglia", "passacalia"],
  ["passacaglia", "pasacaglia"],
  ["percussion", "percushon"],
  ["percussion", "percushin"],
  ["piano", "peeano"],
  ["pibroch", "pibrock"],
  ["pibroch", "pibroc"],
  ["piccolo", "picolo"],
  ["piccolo", "piccalo"],
  ["piccolo", "pickalo"],
  ["plainchant", "plain chant"],
  ["plainchant", "planechant"],
  ["polyphonic", "poly phonic"],
  ["polyphonic", "poly fonic"],
  ["ragtime", "rag time"],
  ["rapping", "rap"],
  ["recitative", "resitative"],
  ["reel", "real"],
  ["renaissance", "renassance"],
  ["renaissance", "renissance"],
  ["renaissance", "renasance"],
  ["renaissance", "renasans"],
  ["repetition", "repitition"],
  ["ritornello", "returnello"],
  ["rubato", "roobato"],
  ["saxophone", "saxaphone"],
  ["saxophone", "saxofone"],
  ["saxophone", "saxafone"],
  ["scat singing", "scat"],
  ["scat singing", "scatting"],
  ["sequence", "seequince"],
  ["sitar", "siter"],
  ["soul", "soul music"],
  ["sprechgesang", "spreckisang"],
  ["sprechgesang", "sprekisang"],
  ["sprechgesang", "sprecgisang"],
  ["staccato", "stacato"],
  ["strophic", "strofic"],
  ["syllabic", "silabic"],
  ["symphony", "simfony"],
  ["syncopation", "sincopation"],
  ["syncopation", "syncopashion"],
  ["syncopation", "syncapation"],
  ["syncopation", "syncopatient"],
  ["tenor", "tenner"],
  ["through-composed", "trew composed"],
  ["through-composed", "throughcomposed"],
  ["timpani", "timpany"],
  ["timpani", "timpanie"],
  ["tremolando", "tremolo"],
  ["tremolando", "tremalando"],
  ["tremolando", "tremilando"],
  ["tritone", "tri tone"],
  ["tritone", "tri-tone"],
  ["trumpet", "trumpit"],
  ["tuba", "chooba"],
  ["viola", "veeola"],
  ["waulking song", "walking song"],
  ["waltz", "walts"],
  ["whole-tone", "hole tone"],
  ["whole-tone", "holetone"],
  ["whole-tone", "wholetone"],
  ["xylophone", "zilaphone"],
  ["xylophone", "xylaphone"],
  ["xylophone", "zilafone"],
  ["counterpoint", "counterponit"],
];
specialistSpellingExamples.forEach(([answer, response]) => {
  const part = { type: "short-text", marks: 1, acceptedAnswers: [answer] };
  assert.equal(marking.markSubquestion(part, response).marks, 1, `The common musical spelling “${response}” should be accepted for “${answer}”.`);
});
const expandedCommonSpellingExamples = [
  ["a cappella", "acapella"],
  ["a cappella", "acappela"],
  ["a cappella", "cappella"],
  ["accelerando", "accelarando"],
  ["accelerando", "accellerando"],
  ["accelerando", "accelerendo"],
  ["acciaccatura", "achaccatura"],
  ["acciaccatura", "acciacattura"],
  ["acciaccatura", "acciaccutura"],
  ["accordion", "acordian"],
  ["accordion", "acordion"],
  ["accordion", "accordeon"],
  ["accordion", "accordian"],
  ["adagio", "adageo"],
  ["adagio", "adaggeo"],
  ["appoggiatura", "appogiatoura"],
  ["appoggiatura", "appoggiattura"],
  ["baroque", "baroc"],
  ["baroque", "baroak"],
  ["baroque", "barroque"],
  ["bass", "base"],
  ["bass guitar", "baseguitar"],
  ["bass guitar", "bassguitar"],
  ["bodhran", "bodrahn"],
  ["bodhran", "bodhron"],
  ["bodhran", "bohran"],
  ["bodhran", "bowron"],
  ["canon", "canan"],
  ["canon", "cannon"],
  ["ceilidh band", "caylee band"],
  ["ceilidh band", "ceildh band"],
  ["ceilidh band", "ceili band"],
  ["ceilidh band", "ceilie band"],
  ["ceilidh band", "ceilidhband"],
  ["ceilidh band", "kaylee band"],
  ["cello", "chellow"],
  ["cello", "cellow"],
  ["chord", "chored"],
  ["chord", "cord"],
  ["chromatic", "chromattic"],
  ["chromatic", "chrommatik"],
  ["clarinet", "claranet"],
  ["clarinet", "clarinett"],
  ["clarinet", "clarionet"],
  ["coloratura", "coleratura"],
  ["coloratura", "colorartura"],
  ["coloratura", "colourartura"],
  ["concerto", "conserto"],
  ["concerto", "concertoe"],
  ["crotchet", "crochet"],
  ["crotchet", "crotchett"],
  ["crotchet", "crotchit"],
  ["cymbal", "cymbol"],
  ["cymbal", "simbal"],
  ["cymbal", "symbol"],
  ["cymbals", "cymbols"],
  ["cymbals", "symbols"],
  ["discord", "dischord"],
  ["discord", "discorde"],
  ["discord", "dissord"],
  ["double bass", "doublebase"],
  ["double bass", "doublebass"],
  ["flutter tonguing", "flutter tongue"],
  ["flutter tonguing", "fluttertonging"],
  ["flutter tonguing", "fluttertonguing"],
  ["fugue", "fewg"],
  ["fugue", "fuguee"],
  ["fugue", "fyoogue"],
  ["gaelic psalm", "gaellic psarm"],
  ["gaelic psalm", "galic psam"],
  ["gaelic psalm", "gaylic psalm"],
  ["gaelic psalm", "gaelicpsalm"],
  ["glockenspiel", "glockenshpiel"],
  ["glockenspiel", "glockenspeel"],
  ["glockenspiel", "glockenspeil"],
  ["glockenspiel", "glockensspiel"],
  ["guitar", "gittar"],
  ["guitar", "guitarre"],
  ["guitar", "guiter"],
  ["guitar", "gutar"],
  ["harpsichord", "harpsichored"],
  ["harpsichord", "harpsicord"],
  ["harpsichord", "harpsicorde"],
  ["impressionist", "impresionist"],
  ["impressionist", "impressionest"],
  ["impressionist", "impressionisst"],
  ["inversion", "inverssion"],
  ["inversion", "invertion"],
  ["inversion", "inverzion"],
  ["leitmotiv", "leitmotif"],
  ["leitmotiv", "leitmotiff"],
  ["leitmotiv", "leitmotivv"],
  ["leitmotiv", "leit motif"],
  ["leitmotiv", "leit motive"],
  ["leitmotiv", "light motif"],
  ["lied", "lead"],
  ["lied", "leet"],
  ["major", "majer"],
  ["major", "majore"],
  ["major", "majour"],
  ["major", "mayjor"],
  ["mezzo forte", "metzo fortay"],
  ["mezzo forte", "mezo fortee"],
  ["mezzo forte", "mezzoforte"],
  ["mezzo piano", "metzo peano"],
  ["mezzo piano", "mezo peeano"],
  ["mezzo piano", "mezzopiano"],
  ["mezzo soprano", "mezo suprano"],
  ["mezzo soprano", "mezzosoprano"],
  ["minimalist", "minimalest"],
  ["minimalist", "minamilist"],
  ["minimalist", "minimilist"],
  ["minor", "miner"],
  ["minor", "minore"],
  ["minor", "minur"],
  ["minor", "mynor"],
  ["musique concrète", "muzique concreate"],
  ["musique concrète", "musiqueconcrete"],
  ["oboe", "obo"],
  ["oboe", "obow"],
  ["passacaglia", "pasacallia"],
  ["passacaglia", "passacagliah"],
  ["passacaglia", "passacallia"],
  ["phrase", "frase"],
  ["phrase", "fraze"],
  ["phrase", "phraze"],
  ["piccolo", "piccollo"],
  ["piccolo", "picollo"],
  ["pizzicato", "pizzacatto"],
  ["pizzicato", "pizzicarto"],
  ["pizzicato", "pizzicatto"],
  ["practice", "practise"],
  ["practise", "practice"],
  ["recapitulation", "recapitualtion"],
  ["recapitulation", "recapituation"],
  ["recapitulation", "recapitulashion"],
  ["recitative", "recetative"],
  ["recitative", "recitativ"],
  ["recitative", "recititive"],
  ["reggae", "regae"],
  ["reggae", "rege"],
  ["reggae", "regga"],
  ["reggae", "reggay"],
  ["reggae", "regge"],
  ["reggae", "reggea"],
  ["renaissance", "renaisance"],
  ["renaissance", "renaissence"],
  ["renaissance", "rennaisance"],
  ["repetition", "repetion"],
  ["repetition", "repetiton"],
  ["repetition", "reppitition"],
  ["rhythm", "rhthm"],
  ["rhythm", "rhythym"],
  ["rhythm", "rithem"],
  ["rhythm", "rithm"],
  ["rhythm", "rythem"],
  ["rhythm", "rythm"],
  ["saxophone", "saxaphon"],
  ["serial", "searial"],
  ["serial", "seriel"],
  ["serial", "seriall"],
  ["sprechgesang", "shprechgesang"],
  ["sprechgesang", "sprechgesaing"],
  ["sprechgesang", "sprechgesgang"],
  ["staccato", "stacatto"],
  ["staccato", "staccatto"],
  ["staccato", "stakkato"],
  ["strophic", "strofick"],
  ["strophic", "strophik"],
  ["timbre", "tamber"],
  ["timbre", "timber"],
  ["timbre", "timbur"],
  ["timpani", "timpanni"],
  ["timpani", "tympani"],
  ["trombone", "tromboan"],
  ["trombone", "trombon"],
  ["trombone", "trombonee"],
  ["trumpet", "trumpat"],
  ["trumpet", "trumpett"],
  ["walking bass", "walkin bass"],
  ["walking bass", "walking base"],
  ["walking bass", "walkingbass"],
  ["waulking song", "waulkin song"],
  ["waulking song", "waulkingsong"],
  ["waulking song", "wawking song"],
  ["xylophone", "xilophone"],
  ["xylophone", "xylifone"],
  ["xylophone", "xylofone"],
  ["xylophone", "zylaphone"],
  ["xylophone", "zylophone"],
];
expandedCommonSpellingExamples.forEach(([answer, response]) => {
  const part = { type: "short-text", marks: 1, acceptedAnswers: [answer] };
  assert.equal(marking.markSubquestion(part, response).marks, 1, `The expanded musical spelling “${response}” should be accepted for “${answer}”.`);
});
const structuredSpellingPart = {
  type: "structured-review",
  autoMark: true,
  finalAnswerField: true,
  marks: 4,
  maxMarksPerHeading: 4,
  headings: [{ id: "concepts", concepts: [
    { label: "Ragtime", answers: ["ragtime"] },
    { label: "Countermelody", answers: ["countermelody"] },
    { label: "A cappella", answers: ["a cappella"] },
    { label: "Tritone", answers: ["tritone"] },
  ] }],
};
assert.equal(marking.markSubquestion(structuredSpellingPart, { final: "Rag time, counter melody, acappella and tri tone." }).marks, 4, "Phrase alternatives with different spacing should work in structured final answers.");
assert.equal(marking.markSubquestion({ type: "short-text", marks: 1, acceptedKeywords: ["scat singing"] }, "The singer is scatting.").marks, 1, "Phrase alternatives should also work inside a pupil's explanatory sentence.");
const harmonicsSpellingPart = {
  type: "structured-review",
  autoMark: true,
  finalAnswerField: true,
  marks: 1,
  headings: [{ id: "melody", concepts: [{ label: "Harmonics", answers: ["harmonics"] }] }],
};
assert.equal(marking.markSubquestion(harmonicsSpellingPart, { final: "Harmonic" }).marks, 1, "Harmonic should be accepted as the requested alternative for harmonics.");
assert.equal(marking.markSubquestion(harmonicsSpellingPart, { final: "Harmonic minor scale" }).marks, 0, "Harmonic minor scale must not be mistaken for the harmonics technique.");
assert.equal(marking.markSubquestion({ type: "short-text", marks: 1, acceptedAnswers: ["cello"] }, "hello").marks, 0, "A different short word must not be treated as a cello spelling mistake.");
assert.equal(marking.markSubquestion({ type: "short-text", marks: 1, acceptedAnswers: ["major"] }, "minor").marks, 0, "Major and minor must remain distinct concepts.");
assert.equal(marking.markSubquestion({ type: "short-text", marks: 1, acceptedAnswers: ["major"] }, "miner").marks, 0, "A recognised minor misspelling must not earn a major mark.");
assert.equal(marking.markSubquestion({ type: "short-text", marks: 1, acceptedAnswers: ["minor"] }, "majer").marks, 0, "A recognised major misspelling must not earn a minor mark.");
assert.equal(marking.markSubquestion({ type: "short-text", marks: 1, acceptedAnswers: ["4/4"] }, "3/4").marks, 0, "Time signatures must remain exact.");
assert.equal(marking.markSubquestion({ type: "short-text", marks: 1, acceptedAnswers: ["concerto"], allowFuzzy: false, allowCommonSpellings: false }, "concherto").marks, 0, "Individual questions should be able to require exact spelling when a musical distinction needs it.");
assert.equal(marking.markSubquestion({ type: "short-text", marks: 1, acceptedAnswers: ["bodhran"], allowFuzzy: false }, "bowran").marks, 1, "Teacher-confirmed spellings should remain available when general fuzzy matching is disabled.");

const againstThree = ["3", "three"];
const againstTwo = ["2", "two"];
againstThree.forEach(three => againstTwo.forEach(two => {
  assert.equal(marking.markSubquestion({ type: "short-text", marks: 1, acceptedAnswers: ["3 against 2"] }, `${three} against ${two}`).marks, 1, "Every written or numerical form of three against two should be accepted.");
}));

const tierceBeginnings = ["tierce", "teerce", "tirce", "tearce", "teirce"];
const tierceMiddles = ["de", "di", "da"];
const tierceEndings = ["picardie", "picardi", "picardy", "pickardi", "pickardy"];
tierceBeginnings.forEach(beginning => tierceMiddles.forEach(middle => tierceEndings.forEach(ending => {
  const response = `${beginning} ${middle} ${ending}`;
  assert.equal(marking.markSubquestion({ type: "short-text", marks: 1, acceptedAnswers: ["tierce de picardie"] }, response).marks, 1, `The approved Tierce de Picardie spelling “${response}” should be accepted.`);
})));
assert.equal(marking.markSubquestion(typedParts.get("q2b"), "2 / 4").marks, 1, "Question 2 should accept a spaced 2/4 time signature.");
assert.equal(marking.markSubquestion(typedParts.get("q2b"), "four").marks, 1, "Question 2 should accept a beat number written as a word.");
assert.equal(marking.markSubquestion(typedParts.get("q6a"), "two").marks, 1, "Question 6 should accept a beat number written as a word.");
assert.equal(marking.markSubquestion(typedParts.get("q4b"), "Reggae music").marks, 1, "A style answer should accept the optional word music.");
assert.equal(marking.markSubquestion(typedParts.get("q4d"), "Bari-tone").marks, 1, "Question 4 should accept baritone written with a hyphen.");
assert.equal(marking.markSubquestion({ type: "checkbox", marks: 2, answers: ["A", "B"] }, ["A"]).marks, 1, "Checkbox marking should award deterministic partial marks.");
assert.equal(marking.markSubquestion({ type: "checkbox", marks: 2, answers: ["A", "B"] }, ["A", "C"]).marks, 1, "Each correct choice should earn its mark even when another selected choice is incorrect.");
assert.equal(marking.markSubquestion({ type: "checkbox", marks: 2, answers: ["A", "B"] }, ["A", "C"]).status, "partial", "A multi-mark answer containing one correct selection should receive partially-correct feedback.");

const fullAnswers = {};
paper.questions.forEach(question => question.subquestions.forEach(part => {
  if (part.type === "checkbox") fullAnswers[part.id] = [...part.answers];
  else if (part.type === "structured-review") fullAnswers[part.id] = { rhythm: "rough work is ignored", melody: "rough work is ignored", instruments: "rough work is ignored", dynamics: "rough work is ignored", final: "Swing, dotted rhythms, major tonality, piano and mf." };
  else fullAnswers[part.id] = part.answer ?? part.acceptedAnswers?.[0];
}));
const result = marking.markPaper(paper, fullAnswers);
assert.equal(result.score, 40, "All 40 marks, including Question 8, should be marked automatically.");
assert.equal(result.reviewMarks, 0, "Question 8 should not require human review.");
assert.equal(result.automaticallyMarkableMarks, 40);
const questionEightPart = paper.questions.find(question => question.id === "q8").subquestions[0];
assert.equal(marking.markSubquestion(questionEightPart, { final: "The music is in 2 / 4." }).marks, 1, "Question 8 should accept a spaced 2/4 time signature.");
assert.deepEqual(questionEightPart.headings.map(heading => heading.label), ["Rhythm/tempo", "Melody/harmony", "Instruments/voices", "Dynamics (Italian terms)"], "Question 8 feedback should retain the four official marking-instruction headings.");
assert.ok(questionEightPart.headings.every(heading => heading.concepts.length > 0), "Every Question 8 marking heading should provide its accepted-answer list.");
assert.ok(questionEightPart.headings.find(heading => heading.id === "instruments").additionalGuidance.some(item => item.includes("Bass on its own")), "Question 8 instrument feedback should include the official restrictions.");
assert.ok(questionEightPart.headings.find(heading => heading.id === "dynamics").additionalGuidance.some(item => item.includes("English equivalents")), "Question 8 dynamics feedback should include the official language restriction.");
assert.equal(marking.isAnswered(questionEightPart, { rhythm: "swing", melody: "major", instruments: "piano" }), false, "Rough work alone should not complete Question 8.");
assert.equal(marking.isAnswered(questionEightPart, { final: "Swing, major tonality and piano." }), true, "The final answer should complete Question 8.");
assert.equal(marking.markSubquestion(questionEightPart, { rhythm: "swing, major, piano, mf, crescendo", final: "" }).marks, 0, "Rough work must earn no marks when the Final answer is blank.");
assert.equal(marking.markSubquestion(questionEightPart, { rhythm: "swing, dotted rhythms, piano, mf", final: "Major" }).marks, 1, "Only concepts written in the Final answer should be marked.");
assert.equal(marking.markSubquestion(questionEightPart, { final: "2 beats in the bar, 4/4 and simple time." }).marks, 1, "Alternative descriptions of the same metre concept should earn one mark only.");
assert.equal(marking.markSubquestion(questionEightPart, { final: "3 beats in the bar." }).marks, 0, "Question 8 must not ignore an incorrect standalone beat count.");
assert.equal(marking.markSubquestion(questionEightPart, { final: "beats in the bar." }).marks, 0, "Question 8 must require an accepted beat count when marking the metre description.");
assert.deepEqual(marking.markSubquestion(questionEightPart, { final: "4 beats per bar." }).matchedEvidence.rhythm.map(item => item.text), ["4 beats per bar"], "Question 8 should highlight the accepted beat count as well as its surrounding phrase.");
assert.equal(marking.markSubquestion(questionEightPart, { final: "Major, repetition, riff, scat singing, sequence, syllabic and walking bass." }).marks, 2, "A single heading should contribute no more than two marks.");
assert.equal(marking.markSubquestion(questionEightPart, { final: "Major, repetition, riff, scat singing, triangles." }).marks, 2, "Incorrect additional concepts should not reduce National 5 structured-analysis marks.");
const cappedQuestionEightResult = marking.markSubquestion(questionEightPart, { final: "Major, repetition, riff and scat singing." });
assert.equal(cappedQuestionEightResult.validConceptCounts.melody, 4, "Question 8 feedback should retain the number of valid concepts found before applying the heading cap.");
assert.deepEqual(cappedQuestionEightResult.matchedEvidence.melody.map(item => item.text), ["Major", "repetition"], "Only the exact words which earn the two available heading marks should be highlighted.");
const highlightedQuestionEightResult = marking.markSubquestion(questionEightPart, { final: "The singer uses scat while the music swings." });
assert.deepEqual(highlightedQuestionEightResult.matchedEvidence.melody.map(item => item.text), ["scat"], "Question 8 feedback should retain the pupil's exact accepted wording.");
assert.deepEqual(highlightedQuestionEightResult.matchedEvidence.rhythm.map(item => item.text), ["swings"], "Fuzzy accepted wording should retain the exact pupil text for highlighting.");
assert.equal(marking.markSubquestion(questionEightPart, { final: "Melody/harmony: 4 beats in the bar. Rhythm/tempo: mf. Instruments: piano." }).marks, 3, "Correct concepts should not be penalised for appearing under the wrong heading.");
assert.equal(marking.markSubquestion(questionEightPart, { final: "The music uses synchopation, a crecendo and syllibic word setting." }).marks, 3, "Clear minor spelling errors should still earn the intended marks.");
assert.equal(marking.markSubquestion(questionEightPart, { final: "Guitar, bass, drums, trombone, violin and lead vocals." }).marks, 0, "Explicitly unacceptable standalone instrument and voice terms must not earn marks.");
assert.equal(marking.markSubquestion(questionEightPart, { final: "Bass guitar, drum kit, trombones, violins, male voice and backing singers." }).marks, 2, "Valid instrument concepts should be recognised but capped at two marks for the heading.");
assert.equal(marking.markSubquestion(questionEightPart, { final: "There are many irrelevant words here, but the music is in a major key, uses swing, piano, crescendo and forte." }).marks, 5, "Irrelevant prose should be ignored while valid concepts are banked up to five marks.");

const attempt = createAttempt(paper, "exam", true);
assert.equal(attempt.storageVersion, 1, "New attempts should identify their storage format.");
assert.equal(attempt.timer.remainingSeconds, 2700);
assert.ok(attempt.timer.lastUpdatedAt);
assert.equal(attempt.mode, "exam");
assert.equal(attempt.audioLimitEnabled, false, "Audio limiting should remain optional by default.");
assert.equal(attempt.questionsLocked, false, "Question locking should be off by default.");
assert.equal(createAttempt(paper, "exam").timer.enabled, false, "The timer should be off by default.");
assert.equal(validateAttempt(paper, attempt, "active"), true, "A new attempt should pass storage validation.");
assert.equal(validateAttempt(paper, { ...attempt, storageVersion: 999 }, "active"), false, "An attempt from an incompatible storage format must not be restored.");
assert.equal(validateAttempt(paper, { ...attempt, paperId: "another-paper" }, "active"), false, "An attempt saved for another paper must not be restored.");
assert.equal(validateAttempt(paper, { ...attempt, currentQuestion: "missing-question" }, "active"), false, "An attempt with an unknown current question must not be restored.");
assert.equal(validateAttempt(paper, { ...attempt, answers: { unknownPart: "answer" } }, "active"), false, "An attempt containing unknown answer IDs must not be restored.");

const engine = new ExamEngine(paper);
engine.start("practice");
engine.setAnswer("q1a", "Gospel");
engine.goToQuestion("q2");
engine.toggleFlag("q2");
engine.setPlayCounts({ track: 1 });
const saved = storage.loadDraft(paper.id);
assert.equal(saved.currentQuestion, "q2");
assert.equal(saved.answers.q1a, "Gospel");
assert.deepEqual(saved.flaggedQuestions, ["q2"]);
assert.deepEqual(saved.audioPlayCounts, { track: 1 });
engine.destroy();

// Navigation back to an unedited paper starts at Q1; refresh retains its question.
for (const answers of [{}, {q1c:"  "}, {q1a:[]}, {q1c:{notes:[],value:""}}, {q1c:"pizzicato"}, {q1c:{notes:[0]}}, {q1c:{rough:"work"}}]) {
  const reopened = new ExamEngine(paper);
  const draft = {...saved,answers,currentQuestion:"q3"};
  assert.equal(reopened.resume(draft),true);
  const edited = ["pizzicato"].includes(answers.q1c) || Boolean(answers.q1c?.notes?.length) || Boolean(answers.q1c?.rough);
  assert.equal(reopened.attempt.currentQuestion,edited?"q3":"q1");
  assert.equal(reopened.resume(draft,{navigationType:"reload"}),true);
  assert.equal(reopened.attempt.currentQuestion,"q3","Refresh retains the saved question, including a blank paper");
  assert.deepEqual(reopened.attempt.answers,answers);
  assert.equal(draft.currentQuestion,"q3","Restoring must not mutate the supplied draft");
  reopened.destroy();
}

storage.deleteDraft(paper.id);
const blankQuestionCheckEngine = new ExamEngine(paper);
blankQuestionCheckEngine.start("practice");
assert.equal(blankQuestionCheckEngine.checkQuestion("q1"), true, "A blank Practice Mode question should be checkable and lock as not answered.");
assert.equal(blankQuestionCheckEngine.isQuestionChecked("q1"), true, "A blank checked question should still be recorded as locked.");
blankQuestionCheckEngine.destroy();

storage.deleteDraft(paper.id);
const questionCheckEngine = new ExamEngine(paper);
questionCheckEngine.start("practice");
paper.questions.find(question => question.id === "q1").subquestions.forEach(part => questionCheckEngine.setAnswer(part.id, fullAnswers[part.id]));
assert.equal(questionCheckEngine.checkQuestion("q1"), true, "A completed Practice Mode question should be checkable.");
assert.equal(questionCheckEngine.isQuestionChecked("q1"), true, "A checked question should be recorded as locked.");
const lockedAnswer = questionCheckEngine.attempt.answers.q1a;
questionCheckEngine.setAnswer("q1a", "Latin American");
assert.equal(questionCheckEngine.attempt.answers.q1a, lockedAnswer, "Answers in a checked question must not be editable.");
assert.deepEqual(storage.loadDraft(paper.id).checkedQuestionIds, ["q1"], "Checked questions should remain locked after a Practice Mode refresh.");
questionCheckEngine.destroy();

storage.deleteSubmitted(paper.id);
const submittedEngine = new ExamEngine(paper);
submittedEngine.start("practice");
submittedEngine.setAnswer("q1a", "Gospel");
submittedEngine.submit();
const savedSubmission = storage.loadSubmitted(paper.id);
assert.equal(savedSubmission.status, "submitted", "A submitted attempt should be saved for persistent feedback.");
assert.equal(savedSubmission.answers.q1a, "Gospel", "The saved feedback attempt should retain the pupil's answers.");
assert.equal(savedSubmission.result.questionBreakdown[0].parts[0].status, "correct", "The saved feedback attempt should retain its marking result.");
assert.equal(validateAttempt(paper, { ...savedSubmission, result: { ...savedSubmission.result, questionBreakdown: [] } }, "submitted"), false, "A submitted attempt with a missing question breakdown must not be restored.");
const malformedSubmission = JSON.parse(JSON.stringify(savedSubmission));
malformedSubmission.result.questionBreakdown[0].parts[0].id = "unknown-part";
assert.equal(validateAttempt(paper, malformedSubmission, "submitted"), false, "A submitted attempt containing an unknown part result must not be restored.");
savedSubmission.result.legacyFeedback = true;
let restoreReason = "";
const restoredEngine = new ExamEngine(paper, (restoredAttempt, reason) => { restoreReason = reason; });
assert.equal(restoredEngine.restoreSubmitted(savedSubmission), true, "A valid submitted attempt should be restorable after refresh.");
assert.equal(restoredEngine.attempt.status, "submitted");
assert.equal(restoredEngine.attempt.result.legacyFeedback, undefined, "Restored feedback should be recalculated using the current marking rules.");
assert.equal(restoreReason, "restore-submit", "Restoring a submission should reopen the feedback screen.");
storage.deleteSubmitted(paper.id);

storage.deleteDraft(paper.id);
const examEngine = new ExamEngine(paper);
examEngine.start("exam", false);
assert.equal(storage.loadDraft(paper.id), null, "Exam attempts must not survive a refresh.");
examEngine.beginExamSession();
assert.equal(examEngine.attempt.examStarted, true);
assert.equal(examEngine.attempt.timer.enabled, true, "Starting Exam mode should start the 45-minute timer.");
assert.equal(examEngine.attempt.audioLimitEnabled, true, "Exam mode should enforce one continuous audio run.");
assert.equal(examEngine.attempt.questionsLocked, true, "Exam mode should lock future questions.");
examEngine.unlockExamQuestion(3);
assert.equal(examEngine.attempt.examUnlockedQuestionIndex, 3, "Questions should unlock as their audio begins.");
examEngine.setAnswer("q1a", "Gospel");
examEngine.convertExamToPractice();
assert.equal(examEngine.attempt.mode, "practice", "An Exam attempt can become a Practice attempt.");
assert.equal(examEngine.attempt.answers.q1a, "Gospel", "Exam-to-Practice conversion should retain progress.");
assert.equal(examEngine.attempt.timer.enabled, false);
assert.equal(examEngine.attempt.questionsLocked, false);
assert.equal(storage.loadDraft(paper.id).answers.q1a, "Gospel", "The converted Practice attempt should be saved.");
examEngine.destroy();

{
  const vm = require("node:vm");
  let now = 0;
  let tick;
  let timerStopped = false;
  const window = {
    ExamMarking: marking,
    ExamStorage: storage,
    setInterval(callback) { tick = callback; return 1; },
    clearInterval() { timerStopped = true; },
  };
  class Clock extends Date {
    static now() { return now; }
  }
  vm.runInNewContext(fs.readFileSync(require.resolve("../exam-engine.js"), "utf8"), { window, Date: Clock });
  const timedExam = new window.ExamEngineCore.ExamEngine(paper);
  timedExam.start("exam");
  timedExam.beginExamSession();
  now = 30_500;
  tick();
  assert.equal(timedExam.attempt.timer.remainingSeconds, 2670, "A delayed callback should count every elapsed second.");
  now = 31_000;
  tick();
  assert.equal(timedExam.attempt.timer.remainingSeconds, 2669, "A tick should preserve the fractional second from the previous callback.");
  now = 2_700_000;
  tick();
  assert.equal(timedExam.attempt.timer.remainingSeconds, 0);
  assert.equal(timedExam.attempt.status, "submitted", "The paper should submit when the actual time expires.");
  assert.equal(timerStopped, true);
  storage.deleteSubmitted(paper.id);
}

console.log("Interactive exam engine tests passed.");
