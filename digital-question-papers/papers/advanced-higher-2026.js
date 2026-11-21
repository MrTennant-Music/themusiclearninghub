(function(root) {
  "use strict";

  const concept = (label, answers = [label], extra = {}) => ({ label, answers, ...extra });
  const paired = (label, allTermGroups, extra = {}) => concept(label, [], { allTermGroups, allowFuzzy: false, ...extra });
  const conceptBank = (labels, correct) => labels.map(label => ({ label, answers: [label], correct: correct.includes(label) }));
  const clip = (track, markers) => ({
    file: `../exampapers/adv higher/2026/Music AH 2026 - Track ${String(track).padStart(2, "0")}-1.m4a`,
    label: "Question audio",
    maxPlaysExam: 1,
    markers,
  });
  const short = (id, label, prompt, acceptedAnswers, answerDisplay, extra = {}) => ({
    id, label, marks: 1, type: "short-text", prompt, acceptedAnswers, answerDisplay,
    capitaliseAnswer: true, ...extra,
  });
  const chordGroups = [
    ["Bm", "B minor", "B minor root", "B minor a", "VI", "6", "VIa", "6a"],
    ["Em", "E minor", "E minor root", "E minor a", "II", "2", "IIa", "2a"],
    ["D first inversion", "D 1st inversion", "D 1st inv", "D/F#", "D Maj/F#", "D major first inversion", "D Maj 1st Inv", "I first inversion", "I 1st inv", "Ib", "1b"],
  ];
  const chordAnswers = chordGroups[0].flatMap(first => chordGroups[1].flatMap(second => chordGroups[2].map(third => `${first}, ${second}, ${third}`)));

  const ex1Melody = [
    concept("Accents", ["accent", "accents", "sfz", "sforzando"]), concept("Anacrusis"), concept("Countermelody"),
    concept("Diminished 7th", ["diminished 7th", "diminished seventh", "dim 7th", "dim7"]), concept("Dominant 7th", ["dominant 7th", "dominant seventh", "dom 7th", "V7"]),
    concept("Dotted rhythms", ["dotted rhythm", "dotted rhythms"]), concept("Imperfect cadence"), paired("Minor and major", [["minor"], ["major"]]),
    concept("Modulation or change of key", ["modulation", "modulates", "change of key", "key change"]), concept("Perfect cadence"),
    concept("Simple time", ["simple time", "4/4", "2/4"], { blockedAnswers: ["2 beats in a bar", "4 beats in a bar"] }),
    paired("Syllabic and melismatic", [["syllabic"], ["melismatic"]]), concept("Trill or appoggiatura", ["trill", "appoggiatura"]),
    concept("Tritone", ["tritone", "augmented 4th", "aug 4th"]),
  ];
  const ex1Texture = [
    paired("Arco and strings", [["arco"], ["strings", "string orchestra"]], { blockedAnswers: ["orchestra"] }),
    concept("Fugue", ["fugue", "fugal"]), concept("Harpsichord, basso continuo or organ", ["harpsichord", "basso continuo", "organ"]),
    paired("Homophonic and polyphonic", [["homophonic"], ["polyphonic", "contrapuntal"]]), concept("Imitation", ["imitation"], { blockedAnswers: ["antiphonal"] }),
    concept("SATB", ["SATB"], { blockedAnswers: ["chorus", "choir", "mixed voice choir"] }),
    concept("Solo tenor", ["solo tenor", "solo baritone"], { blockedAnswers: ["tenor", "baritone", "solo male voice"] }), concept("Stretto"),
    concept("Subject, answer or countersubject", ["subject", "answer", "countersubject"]),
  ];
  const ex2Melody = [
    concept("Accents", ["accent", "accents", "sfz", "sforzando"]), concept("Countermelody"), concept("Dissonance or discord", ["dissonance", "dissonant", "discord", "cluster"]),
    concept("Glissando"), concept("Inverted pedal", ["inverted pedal", "inverted pedal point"]), concept("Major"),
    concept("Modulation or change of key", ["modulation", "modulates", "change of key", "key change"]), concept("Perfect cadence"), concept("Sequence"),
    concept("Simple time", ["simple time", "4/4", "2/4"], { blockedAnswers: ["2 beats in a bar", "4 beats in a bar"] }), concept("Syllabic"),
    concept("Syncopation"), concept("Time changes", ["time changes", "time change", "irregular time signature", "irregular time signatures"]),
  ];
  const ex2Texture = [
    paired("Arco and pizzicato", [["arco"], ["pizzicato"]]), concept("Percussion instruments", ["cymbal", "cymbals", "harp", "xylophone", "snare drum", "side drum"], { blockedAnswers: ["drumkit"] }),
    concept("Female chorus", ["female chorus", "sopranos and altos", "soprano and alto", "SA", "female choir", "female voices"], { blockedAnswers: ["SATB chorus"] }),
    paired("Homophonic and polyphonic", [["homophonic"], ["polyphonic", "contrapuntal"]]), concept("Imitation", ["imitation"], { blockedAnswers: ["antiphonal"] }),
    concept("Orchestra"), concept("Ostinato"), concept("Solo soprano", ["solo soprano", "solo mezzo-soprano"], { blockedAnswers: ["soprano", "mezzo-soprano", "solo female voice"] }),
    concept("Staccato"), concept("Through-composed", ["through-composed", "through composed"]), concept("Trumpets or French horns", ["trumpet", "trumpets", "French horn", "French horns", "fanfare"], { blockedAnswers: ["horn", "horns"] }),
    concept("Unison"),
  ];

  const paper = {
    id: "advanced-higher-2026",
    title: "Advanced Higher Music 2026",
    level: "Advanced Higher",
    levelCode: "AH",
    year: 2026,
    totalMarks: 40,
    openingInstructions: ["Total marks — 40", "Attempt ALL questions"],
    estimatedMinutes: 75,
    sourcePath: "../exampapers/adv higher/2026/NAH_Music_QP_2026.pdf",
    markingInstructionsPath: "../exampapers/adv higher/2026/mi_NAH_Music_mi_2026.pdf",
    attribution: "Original question paper and audio content © Qualifications Scotland. Interactive adaptation created independently for non-commercial educational use. This resource is not endorsed by Qualifications Scotland.",
    questions: [
      {
        id: "q1", number: "1", marks: 6, topic: "Vocal music", layout:"ah2022-q1",
        audio: { clips: [clip(2, [{ label: "(a)", time: 7.57 }, { label: "(b)", time: 225.93 }, { label: "(c)", time: 277.73 }])] },
        intro: "This question features vocal music.",
        subquestions: [
          { id: "q1a", label: "(a)", marks: 4, type: "concept-lines", lines: 4, requiredResponses: 4, additionalAnswerPenalty: true, prompt: "Give your four answers on the lines below.", leadLines: ["Listen to this excerpt and identify four concepts in the music from those listed below.", "You now have 15 seconds to read the list before hearing the music."], conceptBank: conceptBank(["Tritone", "Interrupted cadence", "Hemiola", "Countertenor", "Air", "Suspension", "Ballett", "Diminished triad", "Chorale", "Polyphonic"], ["Ballett", "Countertenor", "Polyphonic", "Suspension"]), answerDisplay: "Ballett, Countertenor, Polyphonic, Suspension", afterAnswerLinesBeforePrompt: 1, afterAnswerLines: ["The music will be played twice with 10 seconds between playings. You will then have 40 seconds to complete your answer.", "Here is the music for the first time.", "Here is the music for the second time."] },
          short("q1b", "(b)", "Listen to a different excerpt and identify the type of work.", ["Motet"], "Motet", { allowFuzzy: false }),
          short("q1c", "(c)", "Listen to a new excerpt and identify the type of singing featured.", ["Coloratura", "Colouratura"], "Coloratura", { allowFuzzy: false }),
        ],
      },
      {
        id: "q2", number: "2", marks: 6, topic: "Scottish music literacy", layout: "ah2026-literacy",
        audio: { clips: [clip(3, [{ label: "(a)", time: 7.51 }, { label: "(b)", time: 401.39 }, { label: "(c)", time: 517.21 }])] },
        intro: ["This question features Scottish music.", "Listen to this excerpt and follow the guide to the music which is printed below.", "Here is the music.", "You now have 2 minutes to read through part (a)."],
        subquestions: [
          short("q2ai", "(i)", "In the box provided, name the key of the music.", ["D major", "D maj", "D"], "D major", { groupStart:{label:"(a)",prompt:""},answerInScore: true, allowFuzzy: false }),
          { id: "q2aii", label: "(ii)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "repeat-sign", prompt: "Insert the appropriate sign so that the printed music matches what you hear.", promptLines:["Insert the appropriate sign so that the printed music matches what you","hear."],markAlign:"prompt-end", options: [{ value: "end-repeat", label: "End repeat" }], answer: "end-bar-8", acceptedAnswers: ["end-bar-8", "start-bar-1,end-bar-8"], answerDisplay: "An end-repeat at the end of bar 8; a matching start-repeat at bar 1 is also accepted." },
          { id: "q2aiii", label: "(iii)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "note-entry", prompt: "Using the bass stave provided, re-write the boxed notes in bar 10 at the same pitch.",promptLines:["Using the bass stave provided, re-write the boxed notes in bar 10 at the","same pitch."],markAlign:"prompt-end", options: [], answer: "E4,D4,C#4", answerDisplay: "E4 crotchet, D4 dotted crotchet and C-sharp4 quaver in bass clef.", noteSlots: 3, completion: { type: "note-slots", count: 3 } },
          { id: "q2aiv", label: "(iv)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "tie-entry", prompt: "Correct the rhythm in bars 19 and 20.", options: [], answer: "19:2-20:0", answerDisplay: "A tie between the last note of bar 19 and the first note of bar 20.", inlineScore:{sharedNotation:"ah-2026-q2a"}, beforeAnswerLines: ["The music will be played two more times with 40 seconds to complete your answer.", "You should write all your answers on the guide to the music.", "Here is the music for the second time.", "Here is the music for the third time."] },
          short("q2b", "", "Identify the type of chord in the boxed area in bar 33. Write your answer in the box provided.", ["Diminished 7th", "Diminished seventh", "Dim 7th", "Dim7"], "Diminished 7th", { answerInScore: true, allowFuzzy: false, caseSensitiveRejectedAnswers: ["Diminished"], groupStart:{label:"(b)",prompt:"Listen to a continuation of that excerpt. A guide to the music is shown below."},leadLines:["You now have 20 seconds to read through the question."],inlineScore:{sharedNotation:"ah-2026-q2b"},promptLines:["Identify the type of chord in the boxed area in bar 33.","Write your answer in the box provided."],markAlign:"prompt-end", afterAnswerLines: ["The music will be played twice with a pause of 20 seconds to complete your answer.", "Here is the music for the first time.", "Here is the music for the second time."] }),
          short("q2c", "(c)", "Identify the boxed chords used in bars 34–36. You should indicate the chord name or number and, where appropriate, 1st or 2nd inversion.", chordAnswers, "Bm or VI; Em or II; D first inversion or Ib", { inlineScore:{sharedNotation:"ah-2026-q2c"},answerInScore: true, allowFuzzy: false, beforeAnswerLines: ["The chord in bar 37 has been given.", "There will be no music played.", "You now have 2 minutes to complete your answer. A warning tone will sound 15 seconds before the next question."] }),
        ],
      },
      {
        id: "q3", number: "3", marks: 7, topic: "Instrumental music in different styles", layout: "ah-boxed-guide", guideBoxSubquestions: 4, guideBoxStartIndex:3, guideIntro: { label: "(d)", prompt: "Listen to the next excerpt and complete the guide below by inserting music concepts." , lines: ["The music will be played three times with 20 seconds between playings. You will then have 30 seconds to complete your answers.", "There will now be 30 seconds to allow you to read through the question.", "In the first two playings a voice will help guide you through the music. There is no voice in the third playing.", "Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time."] },
        audio: { clips: [clip(4, [{ label: "(a)", time: 10.01 }, { label: "(b)", time: 70.26 }, { label: "(c)", time: 129.22 }, { label: "(d)", time: 184.46 }])] },
        intro: "This question features instrumental music in different styles.",
        subquestions: [
          short("q3a", "(a)", "Listen to this excerpt and identify the type of group playing.", ["Piano trio", "Chamber group"], "Piano trio or chamber group", { allowFuzzy: false, caseSensitiveRejectedAnswers: ["Chamber music"] }),
          short("q3b", "(b)", "Listen to a new excerpt. Identify the type of chord outlined by the harp at the end of the excerpt.", ["Dominant 7th", "Dominant seventh", "Dom 7th", "V7"], "Dominant 7th", { allowFuzzy: false, beforeAnswerLines: ["The excerpt is short and will be played twice.", "Here is the excerpt for the first time.", "Here is the excerpt for the second time."] }),
          { id: "q3c", label: "(c)", marks: 1, type: "radio", prompt: "Listen to this excerpt and tick (✓) one box to identify the style of music.", options: ["Neo-classical", "Jazz funk", "Contemporary jazz", "Soul"].map(label => ({ value: label, label })), answer: "Contemporary jazz", answerDisplay: "Contemporary jazz" },
          short("q3d1", "1.", "The opening chord of the excerpt is a/an [answer].", ["Augmented triad", "Augmented", "Aug"], "Augmented triad", { inlineAnswer: { before: "The opening chord of the excerpt is a/an", after: "." }, allowFuzzy: false }),
          short("q3d2", "2.", "The word setting is [answer].", ["Syllabic"], "Syllabic", { inlineAnswer: { before: "The word setting is", after: "." }, allowFuzzy: false }),
          short("q3d3", "3.", "The playing technique used in the upper strings is [answer].", ["Tremolando", "Tremolo", "Arco"], "Tremolando, tremolo or arco", { inlineAnswer: { before: "The playing technique used in the upper strings is", after: "." }, allowFuzzy: false }),
          short("q3d4", "4.", "The interval played by the strings is a/an [answer].", ["Octave", "8ve", "8th"], "Octave", { inlineAnswer: { before: "The interval played by the strings is a/an", after: "." }, allowFuzzy: false }),
        ],
      },
      {
        id: "q4", number: "4", marks: 4, topic: "Jazz literacy", layout: "ah2026-literacy",
        audio: { clips: [clip(5, [{ label: "Guide", time: 6.69 }])] }, intro: ["This question features Jazz music.", "Listen to the excerpt and follow the guide to the music which is printed below.", "Here is the music.", "You now have 2 minutes to read through the question."], scoreIntroIndex:2,score: { sharedNotation: "ah-2026-q4" },
        subquestions: [
          { id: "q4a", label: "(a)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "time-signature", prompt: "Insert the correct time signature at the appropriate place in the music.", options: ["2/4", "3/4", "4/4", "5/4", "6/8", "9/8", "12/8"].map(value => ({ value, label: value })), answer: "5/4", answerDisplay: "5/4, written after the key signature as a musical time signature." },
          { id: "q4b", label: "(b)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "accidental", prompt: "Insert the appropriate accidental in bar 5 to make the music match what you hear.", options:[{value:"natural",label:"Natural"},{value:"flat",label:"Flat"},{value:"sharp",label:"Sharp"}], answer: "sharp", accidentalNoteIndices: [0], answerDisplay: "A sharp immediately before the C in bar 5." },
          short("q4c", "(c)", "Identify the interval between the two boxed notes in bar 7. Write your answer on the line below.", ["Augmented 4th", "Augmented fourth", "Aug 4th", "Tritone"], "Augmented 4th or tritone", { promptLines:["Identify the interval between the two boxed notes in bar 7.","Write your answer on the line below."],answerInScore: false, allowFuzzy: false, caseSensitiveRejectedAnswers: ["4th", "Augmented", "Diminished 5th", "Diminished fifth"] }),
          { id: "q4d", label: "(d)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "note-entry", prompt: "Insert the missing notes in bar 9. The rhythm is given.", options: [], answer: "G4,A4,G4,F#4", acceptedAnswers: ["G4,A4,G4,F#4", "G4,A4,G4,F♯4"], answerDisplay: "G, A, G and F-sharp quavers.", noteSlots: 4, completion: { type: "note-slots", count: 4 }, afterAnswerLines: ["The music will be played three more times with 20 seconds between playings.", "You will then have 40 seconds to complete your answers.", "Here is the music for the second time.", "Here is the music for the third time.", "Here is the music for the fourth time."] },
        ],
      },
      {
        id: "q5", number: "5", marks: 7, topic: "Music in different styles",
        audio: { clips: [clip(6, [{ label: "(a)", time: 7.63 }, { label: "(b)", time: 245.99 }, { label: "(c)", time: 363.89 }, { label: "(d)", time: 435.73 }])] }, intro: "This question features music in different styles.",
        subquestions: [
          { id: "q5a", label: "(a)", marks: 4, type: "concept-lines", lines: 4, requiredResponses: 4, additionalAnswerPenalty: true, prompt: "Give your four answers on the lines below.", leadLines: ["Listen to this excerpt and identify four concepts in the music from those listed below.", "You now have 15 seconds to read the list before hearing the music."], conceptBank: conceptBank(["Stretto", "Modulation", "Appoggiatura", "Interrupted cadence", "Sonata", "Consort", "Concertino", "Augmentation", "Modal", "Subject"], ["Appoggiatura", "Modulation", "Sonata", "Subject"]), answerDisplay: "Appoggiatura, Modulation, Sonata, Subject", afterAnswerLinesBeforePrompt: 1, afterAnswerLines: ["The music will be played twice with 10 seconds between playings. You will then have 40 seconds to complete your answer.", "Here is the music for the first time.", "Here is the music for the second time."] },
          { id: "q5b", label: "(b)", marks: 1, type: "radio", prompt: "Listen to a continuation of this excerpt and tick (✓) one box to identify the correct version of the music.", beforeAnswerLines: ["You now have 45 seconds to read through the possible answers.", "The excerpt is short and will be played three times.", "Here is the excerpt for the first time.", "Here is the excerpt for the second time.", "Here is the excerpt for the third time."], options: [0,1,2,3].map((optionIndex, index) => ({ value: String(index + 1), label: `Option ${index + 1}`, notationScore: { sharedNotation: "ah-2026-q5b", optionIndex } })), answer: "4", answerDisplay: "Option 4" },
          short("q5c", "(c)", "Listen to a new excerpt and identify the type of scale played by the strings.", ["Harmonic minor", "Harmonic minor scale"], "Harmonic minor", { allowFuzzy: false, beforeAnswerLines: ["The excerpt is short and will be played twice.", "Here is the excerpt for the first time.", "Here is the excerpt for the second time."] }),
          { id: "q5d", label: "(d)", flowArrow: { width: 54, height: 32, shaftInset: 27, hollow: false }, marks: 1, type: "radio", prompt: "Listen to this excerpt and tick (✓) one box to indicate the order in which the solo instruments enter.", options: [
            "Bassoon → Oboe → Violins and clarinet", "Oboe → Clarinet → Violins and flute", "Bassoon → Oboe → Violins and flute", "Bassoon → Flute → Violins and clarinet",
          ].map((label, index) => ({ value: String(index + 1), label,flowParts:label.split(" → ").map(part=>part.replace(" and ","|and|")) })), beforeAnswerLines: ["You now have 20 seconds to read through the possible answers.", "The excerpt will be played three times.", "Here is the excerpt for the first time.", "Here is the excerpt for the second time.", "Here is the excerpt for the third time."], answer: "3", answerDisplay: "Bassoon → Oboe → Violins and flute" },
        ],
      },
      {
        id: "q6", number: "6", marks: 10, topic: "Comparative analysis",
        audio: { clips: [clip(7, [{ label: "(a)", time: 9.60 }, { label: "1", time: 63.91 }, { label: "2", time: 203.18 }, { label: "1", time: 346.86 }, { label: "2", time: 485.43 }, { label: "(b)", time: 868.64 }, { label: "1", time: 934.11 }, { label: "2", time: 1073.94 }, { label: "1", time: 1216.41 }, { label: "2", time: 1356.7 }])] },
        intro: ["In this question you are asked to comment on two excerpts of music.", "Listen to each excerpt. For each excerpt identify at least two prominent concepts from each of the following categories:", "melody/harmony/rhythm", "texture/structure/form/timbre", "Both excerpts will be played twice with a pause of 15 seconds between playings, and a pause of 4 minutes at the end for you to complete your final answer.", "You may use the table below for rough working, but your final answer must be written in the final answer section.", "Your final answer could be bullet points or short paragraphs identifying the concepts you have heard.", "Here is Excerpt 1 for the first time.", "Here is Excerpt 2 for the first time.", "Here is Excerpt 1 for the second time.", "Here is Excerpt 2 for the second time.", "You now have 4 minutes to identify at least four concepts in each excerpt.", "A warning tone will sound 30 seconds before the start of part (b)."],
        introPartLabels: { 1: "(a)" },
        introBulletRange: [2, 3],
        introCompactRanges: [[7, 8], [9, 10]],
        introBoldPhrases: ["two prominent", "melody/harmony/rhythm", "texture/structure/form/timbre", "twice", "15 seconds", "4 minutes", "four", "30 seconds"],
        subquestions: [
          {
            id: "q6a1", label: "(i)", marks: 2, type: "structured-review", prompt: "Excerpt 1", sourceHeading: "Excerpt 1", sourcePartLabel: "(i)",
            autoMark: true, roughWork: true, roughWorkHeading: "Rough Work",roughWorkIntro:"For each excerpt identify at least two prominent concepts in each of the following categories:",roughWorkBullets:["melody/harmony/rhythm","texture/structure/form/timbre"],roughWorkBoldPhrases:["two prominent","melody/harmony/rhythm","texture/structure/form/timbre"], roughWorkSheet: true, roughWorkCategoryWeight:700,roughWorkColumns: ["Excerpt 1", "Excerpt 2"],
            finalAnswerField: true, finalAnswerLines: 9, finalAnswerHeading: "Final Answer", sourceHeadingPosition: "final", endOfPaper: false,
            conceptsPerMark: 2, maxMarksPerHeading: 1,
            headings: [{ id: "melody", label: "Melody/harmony/rhythm", concepts: ex1Melody }, { id: "texture", label: "Texture/structure/form/timbre", concepts: ex1Texture }],
          },
          {
            id: "q6a2", label: "(ii)", marks: 2, type: "structured-review", prompt: "Excerpt 2", sourceHeading: "Excerpt 2", sourcePartLabel: "(ii)",
            autoMark: true, roughWork: true, hideRoughWork: true, finalAnswerField: true, finalAnswerLines: 9,
            finalAnswerHeading: "Final Answer", hideFinalHeading: true, sourceHeadingPosition: "final", endOfPaper: false,
            conceptsPerMark: 2, maxMarksPerHeading: 1,
            headings: [{ id: "melody", label: "Melody/harmony/rhythm", concepts: ex2Melody }, { id: "texture", label: "Texture/structure/form/timbre", concepts: ex2Texture }],
          },
          {
            id: "q6bi", label: "(i)", marks: 4, type: "structured-review", prompt: "Analysis", sourceHeading: "Analysis", sourcePartLabel: "(i)",
            autoMark: true, roughWork: true, roughWorkHeading: "Rough Work", roughWorkLines: 18,
            finalAnswerField: true, finalAnswerLines: 20, finalAnswerHeading: "Final answer", sourceHeadingPosition: "final", endOfPaper: false,
            finalAnswerIntro: [
              "Comment on six similarities/differences you hear in the excerpts.",
              "Your final answer should be a written description of what you have heard and not simply a list of similarities/differences.",
            ],
            leadIntro: {
              intro: [
                "Analyse the two excerpts you have heard in part (a).",
                "In your extended answer you should refer to six similarities/differences across the following categories:",
                "melody/harmony/rhythm",
                "texture/structure/form/timbre",
                "When you have completed your analysis you should give your conclusion. You must identify the period of each excerpt and justify your answer.",
                "You will hear each excerpt two more times with 15 seconds between playings, and a further 10 minutes to complete your answers for part (i) and part (ii).",
                "Write your final answers in the final answer section.",
                "Rough work will not be marked.",
                "Here is Excerpt 1 for the third time.",
                "Here is Excerpt 2 for the third time.",
                "Here is Excerpt 1 for the last time.",
                "Here is Excerpt 2 for the last time.",
                "You now have 10 minutes to complete your analysis and conclusion.",
                "A warning tone will sound 30 seconds before the end of the question paper.",
              ],
              introPartLabels: { 0: "(i)", 4: "(ii)" },
              introBulletRange: [2, 3],
              introCompactRanges: [[8, 9], [10, 11]],
              introBoldPhrases: ["Analyse", "six similarities/differences", "melody/harmony/rhythm", "texture/structure/form/timbre", "period", "justify", "10 minutes", "Rough work will not be marked."],
            },
            boldPhrases: ["six similarities/differences"],
            markingProfile: "advanced-comparison", groupStart: { label: "(b)", prompt: "This question has two parts." }, similarities: [
            concept("Accents", ["accent", "accents", "sfz", "sforzando"]), concept("Countermelody"), concept("English text"), concept("Imitation", ["imitation"], { blockedAnswers: ["antiphonal"] }),
            paired("Homophonic and polyphonic", [["homophonic"], ["polyphonic", "contrapuntal"]]), concept("Modulation or change of key", ["modulation", "change of key", "key change"]), concept("Perfect cadence"), concept("Simple time", ["simple time", "4/4", "2/4"]),
          ], differences: [
            { label: "SATB chorus versus female chorus", first: ["SATB chorus", "SATB"], second: ["female chorus", "female choir", "female voices", "SA"] },
            { label: "Solo tenor versus solo soprano", first: ["solo tenor", "solo baritone"], second: ["solo soprano", "solo mezzo-soprano"] },
            { label: "Minor and major versus major", first: ["minor and major", "minor then major", "major and minor"], second: ["major"] },
            { label: "String orchestra versus symphony orchestra", first: ["string orchestra"], second: ["symphony orchestra", "full orchestra", "large orchestra"], blockedFirst: ["orchestra"], blockedSecond: ["orchestra"] },
            { label: "Syllabic and melismatic versus syllabic", first: ["syllabic and melismatic", "melismatic and syllabic"], second: ["syllabic"] },
            { label: "Arco versus arco and pizzicato", first: ["arco"], second: ["arco and pizzicato", "pizzicato and arco"] },
            ...[["anacrusis"], ["diminished 7th"], ["dominant 7th"], ["dotted rhythms"], ["harpsichord", "basso continuo", "organ"], ["imperfect cadence"], ["stretto"], ["trill", "appoggiatura"], ["tritone", "augmented 4th", "aug 4th"]].map(answers => ({ label: `${answers.join(" or ")} only in Excerpt 1`, first: answers, only: 1 })),
            { label: "Fugue, subject, answer or countersubject only in Excerpt 1", first: ["fugue", "fugal", "subject", "answer", "countersubject"], only: 1 },
            ...[["cymbal", "cymbals", "harp", "xylophone", "snare drum", "side drum"], ["dissonance", "discord", "cluster"], ["glissando"], ["inverted pedal"], ["ostinato"], ["sequence"], ["staccato"], ["syncopation"], ["through-composed"], ["time changes", "irregular time signature"], ["trumpet", "trumpets", "French horn", "French horns", "fanfare"], ["unison"]].map(answers => ({ label: `${answers.join(" or ")} only in Excerpt 2`, second: answers, only: 2 })),
          ], headings: [{ id: "analysis", label: "Analysis", concepts: [] }], answerDisplay: "Six valid similarities/differences earn 4 marks; four or five earn 3; two or three earn 2; one earns 1. A list is capped at 2 marks." },
          {
            id: "q6bii", label: "(ii)", marks: 2, type: "structured-review", prompt: "Conclusion", sourceHeading: "Conclusion", sourcePartLabel: "(ii)",
            autoMark: true, roughWork: true, hideRoughWork: true, finalAnswerField: true, finalAnswerLines: 10,
            hideFinalHeading: true, sourceHeadingPosition: "final", finalAnswerIntro: ["Identify the period of each excerpt and justify your answer."],
            boldPhrases: ["period", "justify"], markingProfile: "advanced-conclusion", endOfPaper: false,
            headings: [{ id: "conclusion", label: "Conclusion", concepts: [concept("Excerpt 1: Baroque"), concept("Excerpt 2: 20th century")] }], styles: [
  {
    "answers": [
      "baroque"
    ],
    "wrongStyles": [
      "renaissance",
      "classical",
      "romantic",
      "impressionist",
      "20th century",
      "twentieth century",
      "modern"
    ],
    "reasons": [],
    "reasonConcepts": [
      {
        "label": "Harpsichord / basso continuo",
        "answers": [
          "harpsichord",
          "basso continuo",
          "continuo",
          "figured bass"
        ],
        "allowFuzzy": false
      },
      {
        "label": "String orchestra",
        "answers": [
          "string orchestra",
          "orchestra of strings"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Ornamentation",
        "answers": [
          "ornamentation",
          "ornamented",
          "ornaments",
          "ornamental",
          "trill",
          "trills",
          "appoggiatura",
          "appoggiaturas",
          "turn",
          "turns"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Fugue",
        "answers": [
          "fugue",
          "fugal"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Polyphony / counterpoint",
        "answers": [
          "polyphony",
          "polyphonic",
          "contrapuntal",
          "counterpoint",
          "independent melodic lines",
          "independent melodies",
          "several melodies at once"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Diatonic harmony",
        "answers": [
          "diatonic",
          "diatonic harmony",
          "diatonic harmonies"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Tonic and dominant harmony",
        "allTermGroups": [
          [
            "tonic",
            "chord i",
            "chord 1"
          ],
          [
            "dominant",
            "chord v",
            "chord 5"
          ]
        ],
        "allowFuzzy": false
      },
      {
        "label": "Clear cadence points",
        "answers": [
          "clear cadence points",
          "clear cadences",
          "clearly defined cadences",
          "obvious cadence points",
          "well defined cadences",
          "cadences are clear"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2026 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  },
  {
    "answers": [
      "20th century",
      "twentieth century",
      "21st century",
      "twenty first century",
      "modern",
      "contemporary"
    ],
    "wrongStyles": [
      "renaissance",
      "baroque",
      "classical",
      "romantic",
      "impressionist"
    ],
    "reasons": [],
    "reasonConcepts": [
      {
        "label": "Symphony orchestra with prominent / named percussion",
        "allTermGroups": [
          [
            "symphony orchestra",
            "symphonic orchestra",
            "full orchestra",
            "large orchestra"
          ],
          [
            "prominent percussion",
            "percussion is prominent",
            "percussion stands out",
            "cymbals",
            "cymbal",
            "snare drum",
            "side drum",
            "xylophone"
          ]
        ],
        "allowFuzzy": false
      },
      {
        "label": "Dissonance / discords / clusters",
        "answers": [
          "dissonance",
          "dissonant",
          "discord",
          "discords",
          "discordant",
          "clashing notes",
          "clashing chords",
          "notes clash",
          "chords clash",
          "note cluster",
          "tone cluster",
          "clusters",
          "cluster"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Syncopation",
        "answers": [
          "syncopation",
          "syncopated",
          "off the beat",
          "off beat",
          "offbeat",
          "off beats",
          "offbeats",
          "between the beats",
          "weak beats stressed",
          "accents on weak beats"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Time-signature changes",
        "answers": [
          "time changes",
          "time signature changes",
          "changes of time signature",
          "changing time signatures",
          "changes time signature",
          "changing metre",
          "changing meter",
          "mixed metre",
          "mixed meter"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Irregular metres",
        "answers": [
          "irregular metre",
          "irregular meter",
          "irregular time",
          "irregular time signatures",
          "asymmetric metre",
          "asymmetric meter",
          "5/4",
          "5/8",
          "7/4",
          "7/8",
          "five beats in a bar",
          "five beats per bar",
          "5 beats in a bar",
          "seven beats in a bar",
          "7 beats in a bar"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Ostinato / riffs",
        "answers": [
          "ostinato",
          "ostinati",
          "riff",
          "riffs",
          "repeated rhythmic pattern",
          "repeated rhythmic patterns",
          "repeating rhythmic pattern"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Angular melody with no clear phrase structure",
        "allTermGroups": [
          [
            "angular melodic line",
            "angular melody",
            "angular melodic lines"
          ],
          [
            "no clear phrase structure",
            "unclear phrase structure",
            "irregular phrase structure",
            "no regular phrase structure",
            "no clear phrases",
            "irregular phrases"
          ]
        ],
        "allowFuzzy": false
      },
      {
        "label": "Wide dynamic range",
        "answers": [
          "wide dynamic range",
          "wide dynamics",
          "wide range of dynamics",
          "wider range of dynamics",
          "large dynamic range",
          "large range of dynamics",
          "varied dynamics",
          "extremes of dynamics",
          "very loud and very quiet",
          "very quiet and very loud",
          "pp to ff",
          "pianissimo to fortissimo"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Modern subject matter in the text",
        "answers": [
          "working women",
          "sending a fax",
          "send a fax",
          "squash club"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2026 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  }
], answerDisplay: "Both periods correctly identified and justified earn 2 marks; both identified, or one identified and justified, earns 1 mark." },
        ],
      },
    ],
  };

  root.InteractiveExamPapers = root.InteractiveExamPapers || {};
  root.InteractiveExamPapers[paper.id] = paper;
  if (typeof module !== "undefined" && module.exports) module.exports = paper;
})(typeof window !== "undefined" ? window : globalThis);
