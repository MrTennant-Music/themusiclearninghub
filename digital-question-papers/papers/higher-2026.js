(function (root) {
  "use strict";

  const audio = (question, markers = []) => ({
    file: `../exampapers/higher/2026/Music H 2026 - Track ${String(question + 1).padStart(2, "0")}-1.m4a`,
    label: "Question audio",
    maxPlaysExam: 1,
    markers,
  });
  const option = (value, label = value) => ({ value, label });
  const concept = (label, answers, correct = false, options = {}) => ({ label, answers: answers || [label], correct, ...options });
  const reviewConcept = (label, answers) => concept(label, answers, true);

  const paper = {
    id: "higher-2026",
    title: "Higher Music 2026",
    level: "Higher",
    levelCode: "H",
    year: 2026,
    totalMarks: 40,
    openingInstructions: ["Total marks — 40", "Attempt ALL questions"],
    estimatedMinutes: 60,
    sourcePath: "../exampapers/higher/2026/NH_Music_QP_2026.pdf",
    markingInstructionsPath: "../exampapers/higher/2026/mi_NH_Music_mi_2026.pdf",
    attribution: "Original question paper and audio content © Qualifications Scotland. Interactive adaptation created independently for non-commercial educational use. This resource is not endorsed by Qualifications Scotland.",
    questions: [
      {
        id: "q1", number: "1", marks: 5, topic: "Vocal music",
        audio: { clips: [audio(1, [
          { label: "(a) 1st", time: 43.44 }, { label: "(a) 2nd", time: 121.32 },
          { label: "(b)", time: 229.98 }, { label: "(c)", time: 285.4 },
          { label: "(c) 1st", time: 295.45 }, { label: "(c) 2nd", time: 328.41 },
        ])] },
        intro: "This question features vocal music.",
        subquestions: [
          {
            id: "q1a", label: "(a)", marks: 3, type: "concept-lines", letteredConcept: true,
            lines: 3, requiredResponses: 3, additionalAnswerPenalty: true,
            leadLines: ["Listen to this excerpt and identify three concepts in the music from those listed below.", "Read through the concepts before hearing the music."],
            prompt: "Give your three answers on the lines below.", boldPhrases: ["three"],
            conceptBank: [
              concept("Recitative"), concept("Rubato", ["rubato"], true), concept("Added 6th"), concept("Tierce de Picardie"),
              concept("Lied", ["lied"], true), concept("Time changes"), concept("3 against 2"), concept("Da capo aria"), concept("Mordent", ["mordent"], true),
            ],
            beforeAnswerLines: ["The music will be played twice with a pause of 10 seconds between playings and a pause of 40 seconds before part (b)."],
            afterAnswerLines: ["Here is the music for the first time.", "Here is the music for the second time."],
            answerDisplay: "Lied, Mordent and Rubato",
            definition: "One mark is awarded for each credited concept, in any order.",
          },
          { id: "q1b", label: "(b)", marks: 1, type: "short-text", capitaliseAnswer: true, prompt: "Listen to a different excerpt and identify the type of work.", acceptedAnswers: ["oratorio"], answerDisplay: "Oratorio", definition: "The work is an oratorio." },
          { id: "q1c", label: "(c)", marks: 1, type: "short-text", capitaliseAnswer: true, promptLines: ["Listen to another excerpt and identify the tonality.", "The excerpt will be played twice."], beforeAnswerLines: ["Here is the excerpt for the first time.", "Here is the excerpt for the second time."], acceptedAnswers: ["modal", "mode"], answerDisplay: "Modal or mode", definition: "The tonality is modal." },
        ],
      },
      {
        id: "q2", number: "2", marks: 5, topic: "Orchestral music", layout: "higher-guide",
        audio: { clips: [audio(2, [{ label: "1st", time: 74.10 }, { label: "2nd", time: 188.19 }, { label: "3rd", time: 302.67 }])] },
        intro: [
          "In this question you will hear orchestral music.",
          "A guide to the music is shown below. You are required to complete this guide by inserting music concepts.",
          "There will now be a pause of 30 seconds to allow you to read through the question.",
          "The music will be played three times with a pause of 20 seconds between playings. You will then have a further 30 seconds to complete your answer.",
          "In the first two playings a voice will help guide you through the music.", "There is no voice in the third playing.",
          "Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time.",
        ],
        introCompactRange: [6, 8],
        subquestions: [
          { id: "q2a", label: "1.", marks: 1, type: "short-text", inlineAnswer: { before: "The instrument playing the melody is a/an", after: "." }, acceptedAnswers: ["french horn", "horn"], answerDisplay: "French horn or horn", definition: "The melody is played by a French horn." },
          { id: "q2b", label: "2.", marks: 1, type: "short-text", inlineAnswer: { before: "The rhythmic feature heard in the melody is", after: "." }, acceptedAnswers: ["augmentation"], answerDisplay: "Augmentation", definition: "The rhythmic feature is augmentation." },
          { id: "q2c", label: "3.", marks: 1, type: "short-text", inlineAnswer: { before: "The instrument playing the melody is a/an", after: "." }, acceptedAnswers: ["clarinet"], answerDisplay: "Clarinet", definition: "The melody is played by a clarinet." },
          { id: "q2d", label: "4.", marks: 1, type: "short-text", inlineAnswer: { before: "The playing technique heard in the lower strings is", after: "(Italian term)." }, acceptedAnswers: ["pizzicato", "pizz"], answerDisplay: "Pizzicato or pizz.", definition: "The lower strings play pizzicato." },
          { id: "q2e", label: "5.", marks: 1, type: "short-text", inlineAnswer: { before: "The violins play a/an", after: "." }, acceptedAnswers: ["inverted pedal", "harmonic", "harmonics"], answerDisplay: "Inverted pedal or harmonic(s)", definition: "The violins play an inverted pedal; harmonic(s) is also accepted." },
        ],
      },
      {
        id: "q3", number: "3", marks: 4, topic: "Contrasting music",
        audio: { clips: [audio(3, [
          { label: "(a) 1st", time: 22.74 }, { label: "(a) 2nd", time: 47.17 }, { label: "(b)", time: 76.27 },
          { label: "(c) 1st", time: 146.34 }, { label: "(c) 2nd", time: 174.24 }, { label: "(d)", time: 206.57 },
        ])] },
        intro: "This question features contrasting music.",
        subquestions: [
          { id: "q3a", label: "(a)", marks: 1, type: "radio", promptLines: ["Listen to this excerpt which features a descending scale.", "Tick (✓) one box to describe the type of scale you hear.", "The excerpt will be played twice."], beforeAnswerLines: ["Here is the excerpt for the first time.", "Here is the excerpt for the second time."], options: ["Melodic minor scale", "Harmonic minor scale", "Whole-tone scale", "Pentatonic scale"].map(value => option(value)), answer: "Melodic minor scale", answerDisplay: "Melodic minor scale", definition: "The descending scale is melodic minor." },
          { id: "q3b", label: "(b)", marks: 1, type: "short-text", capitaliseAnswer: true, prompt: "Listen to a different excerpt and write a concept which describes the time signature.", acceptedAnswers: ["irregular time signature", "irregular time signatures", "irregular", "time changes", "7/4", "7 4", "seven beats", "7 beats", "seven beats in the bar", "7 beats in the bar"], answerDisplay: "Irregular time signature, time changes or seven beats in the bar", definition: "Any clear indication of seven beats in the bar is accepted." },
          { id: "q3c", label: "(c)", marks: 1, type: "short-text", capitaliseAnswer: true, promptLines: ["Listen to another excerpt and identify the playing technique featured by the electric guitar.", "The excerpt is short and will be played twice."], beforeAnswerLines: ["Here is the excerpt for the first time.", "Here is the excerpt for the second time."], acceptedAnswers: ["harmonics", "harmonic"], answerDisplay: "Harmonics or harmonic", definition: "The electric guitar uses harmonics." },
          { id: "q3d", label: "(d)", marks: 1, type: "short-text", capitaliseAnswer: true, prompt: "Listen to a new excerpt and identify the style of the music.", acceptedAnswers: ["musique concrète", "musique concrete"], answerDisplay: "Musique concrète", definition: "The style is musique concrète." },
        ],
      },
      {
        id: "q4", sourceNotationLabelWeights: {"C": 400, "IV": 400}, number: "4", marks: 6, topic: "Music literacy",
        audio: { clips: [audio(4, [{ label: "Guide", time: 12.53 }, { label: "2nd", time: 220.54 }, { label: "3rd", time: 310.08 }, { label: "4th", time: 399.08 }])] },
        intro: ["This question is based on rock music.", "Listen to the excerpt and follow the guide to the music below.", "Here is the music for the first time.", "You now have 2 minutes to read the question."],
        outro: ["During the next three playings complete your answers (a) to (f).", "All answers must be written in the boxes above.", "The music will be played three more times with a pause of 30 seconds between playings and a pause of 2 minutes before the next question starts.", "Here is the music for the second time.", "Here is the music for the third time.", "Here is the music for the fourth time."],
        outroBoldPhrases: ["three", "All answers must be written in the boxes above."], outroCompactRange: [3, 5], outroPosition: "before-score",
        score: { key: "G major", timeSignature: "4/4 changing to 3/4", bars: 20, sharedNotation: "higher-2026-q4" }, scorePosition: "before",
        subquestions: [
          { id: "q4a", label: "(a)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "note-entry", inlineNotationControls: true, prompt: "Transpose the notes in the box in bar 2 one octave lower into the bass clef. Use the given blank stave.", options: [], noteSlots: 4, answer: "B3,A3,A3,G3", answerDisplay: "B3 crotchet, A3 quaver tied to A3 quaver, and G3 crotchet", definition: "The pitch and rhythm of all four notes must be correct and the tie must be included." },
          { id: "q4b", label: "(b)", marks: 1, type: "short-text", answerInScore: true, capitaliseAnswer: true, prompt: "Describe the interval formed by the two notes in the box in bars 6 and 7. Write your answer in the box.", acceptedAnswers: ["6", "6th", "sixth", "major 6th", "major sixth", "minor 6th", "minor sixth", "augmented 6th", "augmented sixth", "diminished 6th", "diminished sixth"], answerDisplay: "6th or 6", definition: "Any type of sixth is accepted." },
          { id: "q4c", label: "(c)", marks: 1, type: "short-text", answerInScore: true, capitaliseAnswer: true, prompt: "Name the chords that you hear in bars 10 and 11. You may use letter names or numbers. The chord in bar 9 is given.", answerReference: { heading: "Choose from the following:", rows: [["G", "Chord I"], ["C", "Chord IV"], ["D", "Chord V"], ["Em", "Chord VI"]], footer: "Insert your answers in the boxes provided." }, acceptedAnswers: ["d g", "d, g", "v i", "v, i", "5 1", "5, 1", "chord v chord i", "chord 5 chord 1"], answerDisplay: "D and G; V and I; or 5 and 1", definition: "Both chords must be correct." },
          { id: "q4d", label: "(d)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "note-entry", inlineNotationControls: true, prompt: "Insert the missing notes in bar 13. The rhythm is given above the stave.", options: [], noteSlots: 4, answer: "G4,B4,G4,E4", answerDisplay: "G4, B4, G4 and E4 quavers", definition: "The pitch and rhythm of all four notes must be correct." },
          { id: "q4e", label: "(e)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "rhythm-entry", inlineNotationControls: true, prompt: "Insert the missing rest in bar 16.", options: [option("semibreveRest", "Whole rest"), option("minimRest", "Minim rest"), option("crotchetRest", "Crotchet rest"), option("quaverRest", "Quaver rest")], answer: "quaverRest", answerDisplay: "A quaver rest between the first two notes in bar 16", definition: "The quaver rest may be placed at any vertical position between the first two notes." },
          { id: "q4f", label: "(f)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "time-signature", inlineNotationControls: true, prompt: "There is a time signature change in bar 20. Insert the new time signature at the appropriate place in the bar.", options: ["2/4", "3/4", "4/4", "6/8", "9/8", "12/8"].map(value => option(value)), answer: "3/4", answerDisplay: "3/4", definition: "Bar 20 changes to three crotchet beats in a bar." },
        ],
      },
      {
        id: "q5", number: "5", marks: 4, topic: "Instrumental music", layout: "higher-2026-concepts",
        audio: { clips: [audio(5, [{ label: "1st", time: 44.52 }, { label: "2nd", time: 108.04 }, { label: "3rd", time: 172.71 }])] },
        intro: "This question features instrumental music.",
        subquestions: [{
          id: "q5a", label: "", marks: 4, type: "concept-lines", lines: 4, requiredResponses: 4, additionalAnswerPenalty: true,
          leadLines: ["Listen to this excerpt and identify four concepts in the music from those listed below.", "Read through the concepts before hearing the music."],
          prompt: "Give your four answers on the lines below.", boldPhrases: ["four"],
          conceptBank: [concept("Passacaglia"), concept("Concertino", ["concertino"], true), concept("Arpeggio", ["arpeggio", "broken chord"], true), concept("String quartet"), concept("Impressionist"), concept("Triplets"), concept("Through-composed"), concept("Basso continuo", ["basso continuo"], true), concept("Plagal cadence"), concept("Sequence", ["sequence"], true)],
          beforeAnswerLines: ["The music will be played three times with a pause of 10 seconds between playings and a pause of 40 seconds before the next question starts."],
          afterAnswerLines: ["Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time."],
          answerDisplay: "Arpeggio, Basso continuo, Concertino and Sequence", definition: "One mark is awarded for each credited concept, in any order.",
        }],
      },
      {
        id: "q6", number: "6", marks: 6, topic: "Listening analysis",
        audio: { clips: [audio(6, [{ label: "1st", time: 53.33 }, { label: "2nd", time: 140.94 }, { label: "3rd", time: 228.19 }])] },
        intro: ["This question is based on instrumental music.", "In this question you should identify the most prominent concepts which are present in the music.", "As you listen, identify at least two concepts from each of the following headings:", "Melody/harmony", "Rhythm/tempo", "Style/texture/form", "", "You will hear the music three times and you should make notes as you listen.", "Rough work will not be marked.", "Marks will only be awarded for the final answer.", "After the third playing you will have 3 minutes to write your final answer in the space provided.", "Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time."],
        introBoldPhrases: ["two", "Melody/harmony", "Rhythm/tempo", "Style/texture/form", "three times", "Rough work will not be marked."], introHeadingRowRange: [3, 5], introCompactRange: [11, 13], introTotalMarks: 6, introTotalMarksIndex: 10, showPartMarks: false,
        subquestions: [{
          id: "q6a", label: "Final answer", marks: 6, type: "structured-review", autoMark: true, maxMarksPerHeading: 2, minHeadingsForFullMarks: 3, roughWork: true, finalAnswerField: true, finalAnswerLines: 10, endOfPaper: false, requiredResponses: 6, prompt: "Final answer",
          headings: [
            { id: "melody", label: "Melody/harmony", concepts: [reviewConcept("Arpeggios or broken chords", ["arpeggio", "arpeggios", "broken chord", "broken chords"]), reviewConcept("Countermelody"), reviewConcept("Dominant 7th", ["dominant 7th", "dominant seventh"]), reviewConcept("Interrupted cadence"), reviewConcept("Major", ["major", "major tonality", "major scale"]), reviewConcept("Modulation", ["modulation", "change of key", "key change"]), reviewConcept("Pedal", ["pedal", "pedal note"]), reviewConcept("Perfect cadence")] },
            { id: "rhythm", label: "Rhythm/tempo", concepts: [reviewConcept("Simple time / 3/4", ["simple time", "3/4", "3 4", "3 beats in a bar", "three beats in a bar"]), reviewConcept("A tempo"), reviewConcept("Anacrusis", ["anacrusis", "upbeat"]), reviewConcept("Andante or moderato", ["andante", "moderato"]), reviewConcept("Rallentando or ritardando", ["rallentando", "ritardando", "rall", "rit"]), reviewConcept("Triplets", ["triplets", "triplet"])] },
            { id: "style", label: "Style/texture/form", concepts: [reviewConcept("Chamber music"), reviewConcept("Classical", ["classical", "classicism"]), reviewConcept("Homophonic", ["homophonic", "homophony"]), reviewConcept("Imitation"), reviewConcept("Ternary / ABA", ["ternary", "aba", "a b a"])] },
          ],
          answerDisplay: "Any six valid concepts, with no more than two credited from each heading", additionalGuidance: ["Concepts are credited even when written under a different heading."],
        }],
      },
      {
        id: "q7", number: "7", marks: 5, topic: "Comparing music",
        audio: { clips: [audio(7, [{ label: "E1 1st", time: 120.75 }, { label: "E2 1st", time: 184.87 }, { label: "E1 2nd", time: 267.32 }, { label: "E2 2nd", time: 327.29 }, { label: "E1 3rd", time: 407.08 }, { label: "E2 3rd", time: 466.33 }, { label: "Column C", time: 536.26 }])] },
        intro: ["In this question you compare two excerpts of music.", "You must first identify concepts present in each excerpt and then decide which five concepts are common to both excerpts. Both excerpts will be played three times with a pause of 10 seconds between playings.", "As you listen, tick (✓) boxes in Column A and Column B to identify what you hear in Excerpt 1 and Excerpt 2.", "These columns are for rough work only and will not be marked.", "After the music has been played three times you will be given 2 minutes to decide which concepts are common to both excerpts and to tick (✓) five boxes in Column C.", "You now have one minute to read through the question.", "Here is Excerpt 1 for the first time. Remember to tick (✓) concepts in Column A.", "Here is Excerpt 2 for the first time. Remember to tick (✓) concepts in Column B.", "Here is Excerpt 1 for the second time.", "Here is Excerpt 2 for the second time.", "Here is Excerpt 1 for the third time.", "Here is Excerpt 2 for the third time.", "You now have 2 minutes to identify the five concepts common to both excerpts.", "Remember to tick (✓) five boxes only in Column C."],
        introBoldPhrases: ["five", "three", "Column A", "Column B", "Column C", "These columns are for rough work only and will not be marked.", "Remember to tick concepts in Column A.", "Remember to tick concepts in Column B.", "Remember to tick (✓) five boxes only in Column C."], introCompactRanges: [[6, 7], [8, 9], [10, 11]], introTotalMarks: 5, introTotalMarksIndex: 4, showPartMarks: false,
        subquestions: [{
          id: "q7a", comparisonFooterBold: true, label: "", marks: 5, type: "comparison-grid", comparisonRoughWorkShaded: false, comparisonColumnHeaderBold: true, requiredResponses: 5, additionalAnswerPenalty: true, hidePrompt: true, prompt: "Identify the five concepts common to both excerpts in Column C. Columns A and B are rough work only.",
          answers: ["Romantic", "Sonata", "Minor tonality", "Anacrusis", "Compound time"],
          columns: [{ id: "a", label: "Column A", sublabel: "Excerpt 1" }, { id: "b", label: "Column B", sublabel: "Excerpt 2" }, { id: "c", label: "Column C", sublabel: "5 concepts common to both" }],
          groups: [
            { label: "Style", concepts: [concept("Classical"), concept("Romantic", ["romantic"], true), concept("Concerto"), concept("Sonata", ["sonata"], true)] },
            { label: "Melody/harmony", concepts: [concept("Obbligato"), concept("Glissando"), concept("Minor tonality", ["minor tonality", "minor"], true), concept("Diminished 7th")] },
            { label: "Rhythm", concepts: [concept("Anacrusis", ["anacrusis"], true), concept("Rubato"), concept("Compound time", ["compound time"], true)] },
            { label: "Texture/structure/form", concepts: [concept("Alberti bass"), concept("Imitation"), concept("Concerto grosso")] },
          ],
          answerDisplay: "Romantic; Sonata; Minor tonality; Anacrusis; Compound time", definition: "Only Column C is marked. Additional incorrect selections are deducted.",
        }],
      },
      {
        id: "q8", number: "8", marks: 5, topic: "Musical theatre features",
        audio: { clips: [audio(8, [{ label: "1st", time: 102.73 }, { label: "2nd", time: 227.53 }, { label: "3rd", time: 352.07 }])] },
        intro: ["This question is based on a song from a musical.", "Below is a list of features which occur in the music.", "You now have one minute to read through the question.", "The lyrics grid is shown below. Insert each feature once in the column on the right at the point where it occurs.", "You only need to insert the underlined words."], showPartMarks: false,
        subquestions: [{
          id: "q8a", label: "", marks: 5, type: "lyric-placement", requiredResponses: 5, additionalAnswerPenalty: true, hidePrompt: true,
          prompt: "Insert the five underlined words at the point where they occur. Insert each word once only.",
          playbackLines: ["The music will now be played three times with a pause of 20 seconds between playings and a pause of 30 seconds at the end.", "Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time."],
          featuresBullets: false, features: [{ before: "", word: "interrupted", after: " cadence" }, { before: "first example of ", word: "SATB", after: " chorus in harmony" }, { before: "first example of a ", word: "perfect", after: " cadence" }, { before: "solo ", word: "tenor", after: "" }, { before: "", word: "modulation", after: "" }],
          lyricLines: [
            "God help my people,",
            "They look to you still.",
            "God help the outcasts, or nobody will.",
            "I ask for wealth.",
            "I ask for fame.",
            "I ask for glory to shine on my name.",
            "I ask for love I can possess.",
            "I ask for God and his angels to bless me.",
            "I ask for nothing, I can get by.",
            "But I know so many less lucky than I.",
            "Please help my people,",
            "The poor and down trod.",
            "I thought we all were the children of God.",
            "God help the outcasts,",
            "Children of God.",
          ],
          concepts: [
            { id: "perfect", label: "Perfect", answers: ["perfect", "perfect cadence"], lines: [3] },
            { id: "tenor", label: "Tenor", answers: ["tenor", "solo tenor"], lines: [5] },
            { id: "satb", label: "SATB", answers: ["satb", "satb chorus", "satb chorus in harmony"], lines: [7, 8] },
            { id: "modulation", label: "Modulation", answers: ["modulation", "key change", "change of key"], lines: [8, 9] },
            { id: "interrupted", label: "Interrupted", answers: ["interrupted", "interrupted cadence"], lines: [13] },
          ],
          answerDisplay: "Perfect—line 3; Tenor—line 5; SATB—line 7 or 8; Modulation—line 8 or 9; Interrupted—line 13",
          definition: "Each feature earns one mark when placed on an accepted numbered row.",
        }],
      },
    ],
  };

  root.InteractiveExamPapers = root.InteractiveExamPapers || {};
  root.InteractiveExamPapers[paper.id] = paper;
  if (typeof module !== "undefined" && module.exports) module.exports = paper;
})(typeof window !== "undefined" ? window : globalThis);
