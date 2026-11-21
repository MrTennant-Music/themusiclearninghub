(function(root) {
  "use strict";

  const conceptBank = (labels, correct) => labels.map(label => ({ label, answers: [label], correct: correct.includes(label) }));
  const concept = (label, answers = [label], extra = {}) => ({ label, answers, ...extra });
  const clip = (track, markers) => ({
    file: `../exampapers/adv higher/2017/Music AH 2017 - Track ${String(track).padStart(2, "0")}-1.m4a`,
    label: "Question audio",
    maxPlaysExam: 1,
    markers,
  });
  const short = (id, label, prompt, acceptedAnswers, answerDisplay, extra = {}) => ({
    id, label, marks: 1, type: "short-text", prompt, acceptedAnswers, answerDisplay,
    capitaliseAnswer: true, ...extra,
  });

  const excerpt1Melody = [
    concept("Appoggiatura"),
    concept("Melismatic"),
    concept("Minor"),
    concept("Modulation or change to major", ["modulation", "change of key", "modulation to major", "modulates to major", "change to major", "changes to major"]),
    concept("Perfect cadence", ["perfect cadence", "V-I", "V I"]),
    concept("Sequence", ["sequence", "sequences"]),
    concept("Suspension", ["suspension", "suspensions"]),
    concept("Syllabic"),
    concept("Trill", ["trill", "trills"]),
  ];
  const excerpt1Texture = [
    concept("Basso continuo", ["basso continuo", "harpsichord", "cello and harpsichord", "cello bass and harpsichord"]),
    concept("Polyphonic or contrapuntal", ["polyphonic", "polyphony", "contrapuntal", "counterpoint", "imitation"], { blockedAnswers: ["canon"] }),
    concept("Two upper female voices", ["sopranos", "soprano and alto", "soprano and countertenor", "mezzo sopranos", "mezzo-sopranos", "duet"], { blockedAnswers: ["countertenors"] }),
    concept("Strings", ["strings", "string orchestra"]),
  ];
  const excerpt2Melody = [
    concept("Octave", ["octave", "octaves"]),
    concept("Minor"),
    concept("Modulation", ["modulation", "change of key", "changes key"]),
    concept("Perfect cadence", ["perfect cadence", "V-I", "V I"]),
    concept("Scat singing", ["scat singing", "scat-singing", "scat"]),
    concept("Sequence", ["sequence", "sequences"]),
    concept("Suspension", ["suspension", "suspensions"]),
    concept("Syllabic"),
  ];
  const excerpt2Texture = [
    concept("A-cappella", ["a-cappella", "a cappella", "unaccompanied"]),
    concept("Choir or SATB", ["choir", "chorus", "SATB"]),
    concept("Fugue", ["fugue", "fugal", "subject", "answer", "countersubject", "counter subject", "episode", "exposition"], { blockedAnswers: ["canon"] }),
    concept("Polyphonic or contrapuntal", ["polyphonic", "polyphony", "contrapuntal", "counterpoint", "imitation"]),
    concept("Walking bass", ["walking bass", "moving bass line"]),
    concept("Vocal percussion", ["vocal percussion", "beat boxing", "beatboxing", "snare", "cymbal", "hi-hat", "hi hat"], { blockedAnswers: ["drums", "drum kit"] }),
  ];

  const paper = {
    id: "advanced-higher-2017",
    title: "Advanced Higher Music 2017",
    level: "Advanced Higher",
    levelCode: "AH",
    year: 2017,
    totalMarks: 40,
    openingInstructions: ["Total marks — 40", "Attempt ALL questions"],
    estimatedMinutes: 75,
    sourcePath: "../exampapers/adv higher/2017/Music AH 2017 Paper.pdf",
    markingInstructionsPath: "../exampapers/adv higher/2017/Music AH 2017 Answers.pdf",
    attribution: "Original question paper and audio content © Qualifications Scotland. Interactive adaptation created independently for non-commercial educational use. This resource is not endorsed by Qualifications Scotland.",
    questions: [
      {
        id: "q1", number: "1", marks: 7, topic: "Music in different styles",
        audio: { clips: [clip(2, [
          { label: "(a)", time: 7.56 }, { label: "(b)", time: 206.62 },
          { label: "(c)", time: 262.55 }, { label: "(d)", time: 364.6 },
        ])] },
        intro: "This question features music in different styles.",
        subquestions: [
          {
            id: "q1a", label: "(a)", marks: 4, type: "concept-lines", lines: 4,
            requiredResponses: 4, additionalAnswerPenalty: true,
            prompt: "Insert your four answers on the lines below.",
            boldPhrases: ["four", "twice"],
            leadLines: ["Listen to this excerpt and identify four concepts in the music from those listed below.", "You now have 15 seconds to read through the list of features."],
            conceptBank: conceptBank(["Polytonality","Tremolando","Arco","Minimalist","Galliard","Fugue","String quartet","Trill","Plagal cadence","Harmonic minor"], ["Tremolando","Arco","String quartet","Trill"]),
            answerDisplay: "Arco, String quartet, Tremolando, Trill",
            afterAnswerLines: ["The music will be played twice with a pause of 10 seconds between playings and a pause of 40 seconds before part (b).", "Here is the music for the first time.", "Here is the music for the second time."],
          },
          short("q1b", "(b)", "Listen to a different excerpt and identify the type of group playing.", ["Piano trio","Chamber group"], "Piano trio", { boldPhrases: ["group"] }),
          short("q1c", "(c)", "Listen to a new excerpt. Identify the instrumental technique featured at the end of the excerpt.", ["Harmonics"], "Harmonics", { beforeAnswerLines: ["The excerpt will be played twice.", "Here it is for the first time.", "Here it is for the second time"], boldPhrases: ["twice"] }),
          short("q1d", "(d)", "Listen to this excerpt and identify the style of the music.", ["Electronic dance music","EDM"], "Electronic dance music", { allowFuzzy: false }),
        ],
      },
      {
        id: "q2", number: "2", marks: 7, topic: "Instrumental music",
        audio: { clips: [clip(3, [
          { label: "(a)", time: 6.78 }, { label: "(b)", time: 208.87 },
          { label: "(c)", time: 302.62 }, { label: "(d)", time: 340.53 },
        ])] },
        intro: "This question features instrumental music.",
        subquestions: [
          {
            id: "q2a", label: "(a)", marks: 4, type: "concept-lines", lines: 4,
            requiredResponses: 4, additionalAnswerPenalty: true,
            prompt: "Insert your four answers on the lines below.",
            boldPhrases: ["four", "twice"],
            leadLines: ["Listen to this excerpt and identify four concepts in the music from those listed below.", "You now have 15 seconds to read through the list of features."],
            conceptBank: conceptBank(["Basso continuo","Pavan","Consort","Concertino","Neo-classical","Chorale","Renaissance","Concerto grosso","Hemiola","Mordent"], ["Basso continuo","Concertino","Concerto grosso","Hemiola"]),
            answerDisplay: "Basso continuo, Concerto grosso, Concertino, Hemiola",
            afterAnswerLines: ["The music will be played twice with a pause of 10 seconds between playings and a pause of 40 seconds before part (b).", "Here is the music for the first time.", "Here is the music for the second time."],
          },
          {
            id: "q2b", label: "(b)", marks: 1, type: "radio",
            prompt: "Listen to a new excerpt. Tick one box to identify the correct version of the music.",
            boldPhrases: ["one", "three"],
            beforeAnswerLines: ["You now have 20 seconds to read through the possible answers.", "The excerpt is short and will be played three times.", "Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time."],
            options: [1,2,3].map((number, index) => ({ value: String(number), label: `Version ${number}`, notationScore: { sharedNotation: "ah-2017-q2b", optionIndex: index } })),
            answer: "2", answerDisplay: "The second version",
          },
          short("q2c", "(c)", "Listen to a further excerpt from the same work and identify the ornament that is played.", ["Appoggiatura"], "Appoggiatura"),
          {
            id: "q2d", label: "(d)", marks: 1, type: "radio",
            prompt: "Listen to a new excerpt and tick one box to describe what you hear.",
            boldPhrases: ["one", "twice"],
            beforeAnswerLines: ["You now have 30 seconds to read through the possible answers.", "The excerpt will be played twice.", "Here is the music for the first time.", "Here is the music for the second time."],
            options: [
              "The ornament is a trill and the music modulates to the relative major.",
              "The ornament is a trill and the music modulates to the relative minor.",
              "The ornament is a mordent and the music modulates to the relative major.",
              "The ornament is a mordent and the music modulates to the relative minor.",
            ].map((label, index) => ({ value: String(index + 1), label })),
            answer: "3", answerDisplay: "The ornament is a mordent and the music modulates to the relative major.",
          },
        ],
      },
      {
        id: "q3", number: "3", marks: 6, topic: "Vocal music", layout: "ah-boxed-guide", guideBoxSubquestions: 4,
        audio: { clips: [clip(4, [
          { label: "(a)", time: 6.32 }, { label: "(b)", time: 308.13 }, { label: "(c)", time: 365.46 },
        ])] },
        intro: [
          "This question features vocal music.",
          "In this excerpt you are required to complete the guide below by inserting appropriate music concepts.",
          "There will now be a pause of 30 seconds to allow you to read through the question.",
          "The music will be played three times with a pause of 20 seconds between playings and a pause of 30 seconds before part (b).",
          "In the first two playings a voice will help guide you through the music. There is no voice in the third playing.",
          "Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time.",
        ],
        introPartLabels: { 1: "(a)" },
        introBoldPhrases: ["three"],
        subquestions: [
          short("q3a1", "1.", "The tonality at the opening is [answer] .", ["Major"], "Major", { inlineAnswer: { before: "The tonality at the opening is", after: "." } }),
          short("q3a2", "2.", "The harmonic feature at the end of the phrase is a/an [answer] .", ["Suspension","Perfect cadence","V-I","V I"], "Suspension", { inlineAnswer: { before: "The harmonic feature at the end of the phrase is a/an", after: "." } }),
          short("q3a3", "3.", "The word setting is [answer] .", ["Syllabic"], "Syllabic", { inlineAnswer: { before: "The word setting is", after: "." } }),
          short("q3a4", "4.", "The type of vocal work is a/an [answer] .", ["Ballett","Madrigal"], "Ballett", { inlineAnswer: { before: "The type of vocal work is a/an", after: "." } }),
          short("q3b", "(b)", "Listen to a different excerpt and identify the type of work.", ["Ayre","Air","Ayre/Air","Lute song"], "Ayre/Air"),
          {
            id: "q3c", label: "(c)", marks: 1, type: "radio", prompt: "Listen to this excerpt and identify what you hear.",
            options: ["Rubato","Descant","Alberti bass","Tritone"].map(label => ({ value: label, label })),
            answer: "Tritone", answerDisplay: "Tritone",
          },
        ],
      },
      {
        id: "q4", sourceNotationLabelWeights: {"(a) Scale:": 400, "(b) Chord:": 400}, number: "4", marks: 5, topic: "Music literacy", layout: "ah2017-literacy",
        audio: { clips: [clip(5, [
          { label: "Guide", time: 6.78 }, { label: "1st", time: 198.86 },
          { label: "2nd", time: 259.12 }, { label: "3rd", time: 319.58 },
        ])] },
        intro: ["This question features music for solo piano.", "Listen to the excerpt and follow the guide to the music which is printed below.", "Here is the music.", "You now have 2 minutes to read through the question."],
        introBoldPhrases: ["2 minutes"],
        subquestions: [
          short("q4a", "(a)", "Identify the type of scale, a section of which is shown by the four crotchets in bar 4.", ["Chromatic","Chromatic scale"], "Chromatic", { answerInScore: true }),
          short("q4b", "(b)", "Identify the chord at the beginning of bar 18.", ["Added 6th","Added sixth","C added 6th","C added sixth","C maj 6","C6","C major 6","C△6","CΔ6","C∆6","C △ 6","C Δ 6","C ∆ 6"], "C added 6th", { answerInScore: true, allowFuzzy: false, caseSensitiveAcceptedAnswers: ["CM6"], caseSensitiveRejectedAnswers: ["Cm6"] }),
          short("q4c", "(c)", "Give the Italian term to describe the way the left hand notes are played (articulation) in bars 16–17.", ["Staccato"], "Staccato", { answerInScore: true }),
          {
            id: "q4d", label: "(d)", marks: 1, type: "notation-choice", sharedScore: true,
            prompt: "Write L above the bar where the left hand plays the following:", notationTool: "bar-label",
            sourceSymbols: [{ text: "L", occurrence: 0, scale: 17 / 11 }],
            boldPhrases: ["L"],
            options: [{ value: "L", label: "L" }], answer: "bar-8", answerDisplay: "L above bar 8.",
            inlineScore: { sharedNotation: "ah-2017-q4d" }, controlsAfterScore: true,
          },
          {
            id: "q4e", label: "(e)", marks: 1, type: "notation-choice", sharedScore: true,
            prompt: "Insert the missing melody notes on the stave in bar 12.", notationTool: "note-entry", options: [],
            answer: "A4,G4,G4,A4,G4", answerDisplay: "A quaver, G quaver, G semiquaver, A dotted quaver and G crotchet.",
            noteSlots: 5, completion: { type: "note-slots", count: 5 },
            beforeAnswerLines: ["You will now hear the music three more times, with 20 seconds between playings and a pause of 1 minute before the next question begins.", "You should write all your answers on the guide to the music below.", "Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time."],
            boldPhrases: ["three", "You should write all your answers on the guide to the music below."],
            inlineScore: { sharedNotation: "ah-2017-q4" }, controlsAfterScore: true,
          },
        ],
      },
      {
        id: "q5", sourceNotationLabelWeights: {"(a) Key:": 400, "(b) Enharmonic": 400}, number: "5", marks: 5, topic: "Instrumental music literacy", layout: "ah2017-literacy",
        audio: { clips: [clip(6, [
          { label: "Guide", time: 9.18 }, { label: "1st", time: 152.1 },
          { label: "2nd", time: 211.04 }, { label: "(e)", time: 372.22 },
        ])] },
        intro: ["This question is based on an excerpt from a piece of instrumental music.", "Listen to the excerpt and follow the guide to the music which is printed below.", "Here is the music.", "You now have 1 minute to read through the questions (a), (b), (c) and (d)."],
        introBoldPhrases: ["1 minute"],
        subquestions: [
          short("q5a", "(a)", "In the box provided name the key of the excerpt.", ["D","D major","D maj"], "D major", { answerInScore: true, allowFuzzy: false }),
          {
            id: "q5b", label: "(b)", marks: 1, type: "notation-choice", sharedScore: true,
            promptLines: ["Write the enharmonic equivalent of the boxed note in bar 8.", "Write your answer on the stave below bar 8."], notationTool: "note-entry", options: [],
            answer: "Gb4", acceptedAnswers: ["Gb4","G♭4"], answerDisplay: "G flat on the second line; any note value is accepted.",
            noteSlots: 1, allowAccidentalEntry: true, completion: { type: "note-slots", count: 1 },
          },
          {
            id: "q5c", label: "(c)", marks: 1, type: "notation-choice", sharedScore: true,
            prompt: "Using the bass clef in bars 14 and 15, write the boxed notes at the same pitch.", notationTool: "note-entry", options: [],
            boldPhrases: ["same"],
            answer: "E4,C#4,D4", acceptedAnswers: ["E4,C#4,D4", "E4,C♯4,D4"], answerDisplay: "E, C-sharp and D above the bass stave; any note values are accepted.",
            noteSlots: 3, completion: { type: "note-slots", count: 3 },
          },
          {
            id: "q5d", label: "(d)", marks: 1, type: "notation-choice", sharedScore: true,
            prompt: "Draw this sign above the two bars where the bass guitar plays:", promptParts: { before: "Draw this sign", symbol: "bracket", after: "above the two bars where the bass guitar plays:" }, notationTool: "bar-label",
            promptBoldPhrases: ["bars"],
            options: [{ value: "Bracket", label: "Bracket", symbol: "bracket" }], answer: "bars-5-6", answerDisplay: "Bars 5 and 6 only.",
            inlineScore: { sharedNotation: "ah-2017-q5d" }, controlsAfterScore: true,
            afterAnswerLines: ["The music will be played two more times with 20 seconds between playings.", "You then have a further 2 minutes to complete your answers.", "You should write all your answers on the guide to the music below.", "A warning tone will sound 15 seconds before part (e).", "Here is the music for the first time.", "Here is the music for the second time."],
            afterAnswerBoldPhrases: ["two", "You should write all your answers on the guide to the music below."],
          },
          {
            id: "q5e", label: "(e)", marks: 1, type: "notation-choice", sharedScore: true,
            prompt: "Using the rhythm provided and the chord information printed below the stave, complete the bass line.", notationTool: "note-entry", options: [],
            answer: "E3,B2,C3",
            acceptedAnswers: ["E2,B2,C3","E2,B2,C4","E2,B3,C3","E2,B3,C4","E3,B2,C3","E3,B2,C4","E3,B3,C3","E3,B3,C4"],
            answerDisplay: "E dotted minim, B crotchet and C minim; either octave is accepted.",
            noteSlots: 3, completion: { type: "note-slots", count: 3 },
            inlineScore: { sharedNotation: "ah-2017-q5main" }, scoreBeforePrompt: true,
            beforeAnswerLines: ["The first and last bass notes have been inserted for you.", "There will be no music played.", "You now have 2 minutes to complete your answer. A warning tone will sound 30 seconds before the start of Question 6."],
          },
        ],
        score: { sharedNotation: "ah-2017-q5e" }, scorePosition: "after",
      },
      {
        id: "q6", number: "6", marks: 10, topic: "Comparative analysis",
        audio: { clips: [clip(7, [
          { label: "(a)", time: 8.72 }, { label: "1", time: 66.68 }, { label: "2", time: 185.0 },
          { label: "1", time: 290.38 }, { label: "2", time: 409.56 }, { label: "(b)", time: 760.46 },
          { label: "1", time: 836.6 }, { label: "2", time: 956.15 }, { label: "1", time: 1061.26 }, { label: "2", time: 1180.44 },
        ])] },
        introPartLabel: "(a)", introPartLabelIndex: 1,
        intro: [
          "In this question you are asked to comment on two excerpts of music.",
          "Listen to each excerpt. For each excerpt identify at least two prominent concepts from each of the following categories:",
          "Melody/harmony", "Texture/structure/form/timbre",
          "Both excerpts will be played twice, with a pause of 15 seconds between playings, and a pause of 4 minutes at the end for you to complete your final answer.",
          "You may use the table below for rough working, but your final answer must be written in the final answer section.",
          "Your final answer could be bullet points or short answers identifying the concepts you have heard.",
          "Here is Excerpt 1 for the first time.", "Here is Excerpt 2 for the first time.",
          "Here is Excerpt 1 for the second time.", "Here is Excerpt 2 for the second time.",
          "You now have 4 minutes to identify at least four concepts in each excerpt.",
          "A warning tone will sound 30 seconds before the start of part (b).",
        ],
        introPartLabels: { 1: "(a)" }, introBulletRange: [2, 3], introCompactRanges: [[7, 8], [9, 10]],
        introBoldPhrases: ["two prominent", "Melody/harmony", "Texture/structure/form/timbre", "twice", "four"],
        subquestions: [
          {
            id: "q6a1", label: "(i)", marks: 2, type: "structured-review", prompt: "Excerpt 1", sourceHeading: "Excerpt 1", sourcePartLabel: "(i)",
            autoMark: true, roughWork: true, roughWorkHeading: "Rough Work", roughWorkIntro: "For each excerpt identify at least two prominent concepts in each of the following categories:", roughWorkBullets: ["Melody/harmony", "Texture/structure/form/timbre"], roughWorkBoldPhrases: ["two prominent", "Melody/harmony", "Texture/structure/form/timbre"], roughWorkSheet: true, roughWorkColumns: ["Excerpt 1", "Excerpt 2"], finalAnswerField: true, finalAnswerLines: 9, finalAnswerHeading: "FINAL ANSWER", sourceHeadingPosition: "final", endOfPaper: false, conceptsPerMark: 2, maxMarksPerHeading: 1,
            headings: [{ id: "melody", label: "Melody/harmony", concepts: excerpt1Melody }, { id: "texture", label: "Texture/structure/form/timbre", concepts: excerpt1Texture }],
          },
          {
            id: "q6a2", label: "(ii)", marks: 2, type: "structured-review", prompt: "Excerpt 2", sourceHeading: "Excerpt 2", sourcePartLabel: "(ii)",
            autoMark: true, roughWork: true, hideRoughWork: true, finalAnswerField: true, finalAnswerLines: 9, hideFinalHeading: true, sourceHeadingPosition: "final", endOfPaper: false, conceptsPerMark: 2, maxMarksPerHeading: 1,
            headings: [{ id: "melody", label: "Melody/harmony", concepts: excerpt2Melody }, { id: "texture", label: "Texture/structure/form/timbre", concepts: excerpt2Texture }],
          },
          {
            id: "q6bi", label: "(i)", marks: 4, type: "structured-review", prompt: "Analysis", sourceHeading: "Analysis", sourcePartLabel: "(i)",
            autoMark: true, roughWork: true, roughWorkHeading: "ROUGH WORK", roughWorkLines: 18, finalAnswerField: true, finalAnswerLines: 16, finalAnswerHeading: "FINAL ANSWER", sourceHeadingPosition: "final", endOfPaper: false,
            finalAnswerIntro: ["Comment on six similarities/differences you hear in the excerpts.", "Your final answer should be a written description of what you have heard and not simply a list of similarities/differences."],
            boldPhrases: ["six similarities/differences"],
            leadIntro: { intro: ["Analyse the two excerpts you have just heard.", "In your extended answer you should refer to six similarities/differences across the following categories:", "Type of work", "Melody/harmony", "Texture/structure/form/timbre", "Conclude your analysis with a statement on the style/period of each excerpt and justify your answer.", "You will hear each excerpt two more times, with a pause of 15 seconds between playings, and a further 10 minutes to complete your answers for part (i) and part (ii).", "Rough work will not be marked.", "You should write your final answers in the final answer section.", "Here is Excerpt 1 for the third time.", "Here is Excerpt 2 for the third time.", "Here is Excerpt 1 for the last time.", "Here is Excerpt 2 for the last time.", "You now have 10 minutes to complete your analysis and conclusion.", "A warning tone will sound 30 seconds before the end of the question paper."], introPartLabels: { 0: "(i)", 5: "(ii)" }, introBulletRange: [2, 4], introCompactRanges: [[9, 10], [11, 12]], introBoldPhrases: ["Analyse", "six similarities/differences", "Type of work", "Melody/harmony", "Texture/structure/form/timbre", "Conclude", "style/period", "justify", "10 minutes", "Rough work will not be marked."] },
            markingProfile: "advanced-comparison",
            groupStart: { label: "(b)", prompt: "This question has two parts." },
            similarities: [
              concept("Conventional harmony", ["conventional harmony","tonal harmony"]), concept("Minor"),
              concept("Modulation", ["modulation","change of key"]), concept("Perfect cadence", ["perfect cadence","V-I","V I"]),
              concept("Polyphonic", ["polyphonic","polyphony","contrapuntal","counterpoint","imitation"]),
              concept("Sequence", ["sequence","sequences"]), concept("Suspension", ["suspension","suspensions"]), concept("Syllabic"),
            ],
            differences: [
              { label: "Upper-voice duet and SATB choir", first:["sopranos","mezzo sopranos","mezzo-sopranos","duet","soprano and mezzo soprano","soprano and alto","soprano and countertenor"], second: ["SATB","choir","chorus"] },
              { label: "Strings and a-cappella", first: ["strings","string orchestra"], second: ["a-cappella","a cappella","vocal percussion"] },
              { label: "Melismatic and syllabic", first: ["melismatic"], second: ["syllabic"] },
              { label: "Ornamentation only in Excerpt 1", first: ["ornamentation","trill","appoggiatura"], only: 1 },
              { label: "Modulation to major only in Excerpt 1", first: ["modulates to major","change to major","modulation to major"], only: 1 },
              { label: "Oratorio only in Excerpt 1", first: ["oratorio"], only: 1 },
              { label: "Basso continuo only in Excerpt 1", first: ["basso continuo","harpsichord"], only: 1 },
              { label: "Fugue only in Excerpt 2", second: ["fugue","fugal"], only: 2 },
              { label: "Scat singing only in Excerpt 2", second: ["scat singing","scat-singing","scat"], only: 2 },
              { label: "Walking bass only in Excerpt 2", second: ["walking bass"], only: 2 },
            ],
            headings: [{ id: "analysis", label: "Analysis", concepts: [] }],
            answerDisplay: "Six valid similarities/differences earn 4 marks; four or five earn 3; two or three earn 2; one earns 1. A list is capped at 2 marks.",
          },
          {
            id: "q6bii", label: "(ii)", marks: 2, type: "structured-review", prompt: "Conclusion", sourceHeading: "Conclusion", sourcePartLabel: "(ii)",
            autoMark: true, roughWork: true, hideRoughWork: true, finalAnswerField: true, finalAnswerLines: 10, hideFinalHeading: true, sourceHeadingPosition: "final", finalAnswerIntro: ["Write a statement on the style/period of each excerpt and justify your answer."], boldPhrases: ["style/period", "justify"], markingProfile: "advanced-conclusion", endOfPaper: true,
            headings: [{ id: "conclusion", label: "Conclusion", concepts: [concept("Excerpt 1: Baroque"), concept("Excerpt 2: Jazz or 20th-century/modern")] }],
            styles: [
  {
    "answers": [
      "baroque"
    ],
    "wrongStyles": [
      "renaissance",
      "classical",
      "romantic",
      "impressionist",
      "minimalist",
      "serial",
      "atonal",
      "modern",
      "20th century",
      "twentieth century",
      "jazz"
    ],
    "reasons": [],
    "reasonConcepts": [
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
        "label": "Imitation",
        "answers": [
          "imitation",
          "imitative",
          "imitating",
          "imitated",
          "imitates",
          "melody is copied",
          "melodies copy"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Sequences",
        "answers": [
          "sequence",
          "sequences",
          "sequential",
          "melody repeated at a different pitch",
          "pattern repeated higher",
          "pattern repeated lower"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Suspensions",
        "answers": [
          "suspension",
          "suspensions",
          "suspended notes"
        ],
        "allowFuzzy": false
      },
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
        "label": "Cello / bass continuo",
        "answers": [
          "cello",
          "bass continuo"
        ],
        "allowFuzzy": false
      },
      {
        "label": "String orchestra with continuo",
        "allTermGroups": [
          [
            "string orchestra",
            "strings"
          ],
          [
            "continuo",
            "harpsichord"
          ]
        ],
        "allowFuzzy": false
      },
      {
        "label": "Typical Baroque harmony",
        "answers": [
          "baroque harmony",
          "typical harmony",
          "diatonic harmony"
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
        "label": "Modulation to related keys",
        "answers": [
          "modulations to related keys",
          "modulation to related keys",
          "related keys",
          "relative minor",
          "relative major",
          "modulates to the dominant",
          "modulation to the dominant"
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
        "label": "Limited vocal range",
        "answers": [
          "limited vocal range",
          "narrow vocal range"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2017 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  },
  {
    "answers": [
      "jazz",
      "20th century",
      "twentieth century",
      "modern",
      "contemporary",
      "modern arrangement",
      "arrangement of a baroque piece",
      "arrangement of a fugue"
    ],
    "blocked": [
      "contemporary jazz",
      "neo classical",
      "neoclassical"
    ],
    "wrongStyles": [
      "renaissance",
      "romantic",
      "impressionist",
      "minimalist",
      "serial",
      "atonal"
    ],
    "reasons": [],
    "reasonConcepts": [
      {
        "label": "Scat singing",
        "answers": [
          "scat singing",
          "scat",
          "scatting"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Walking bass",
        "answers": [
          "walking bass",
          "walking bassline",
          "walking bass line",
          "bass walks"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Vocal percussion / beatboxing",
        "answers": [
          "vocal percussion",
          "beatboxing",
          "beat boxing",
          "voices imitate percussion"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Swing rhythm / feel",
        "answers": [
          "swing",
          "swung",
          "swinging rhythm",
          "unequal quavers",
          "unequal eighth notes",
          "long short quavers"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Improvised vocal imitation of instruments",
        "answers": [
          "improvised singing",
          "improvised vocals",
          "vocal improvisation",
          "voices imitate instruments",
          "vocal imitation of instruments"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Close microphone recording",
        "answers": [
          "close miking",
          "close mic",
          "close miked",
          "close microphone",
          "individually recorded voices"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Modern arrangement retaining Baroque / fugal features",
        "allTermGroups": [
          [
            "modern arrangement",
            "arrangement of a baroque piece",
            "arrangement of a fugue"
          ],
          [
            "polyphonic",
            "contrapuntal",
            "fugal",
            "fugue",
            "baroque harmony",
            "suspension",
            "sequence",
            "a cappella"
          ]
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2017 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  }
],
            answerDisplay: "Both styles/periods must be identified and justified for 2 marks; both identified, or one identified and justified, earns 1 mark.",
          },
        ],
      },
    ],
  };

  if (typeof module !== "undefined" && module.exports) module.exports = paper;
  root.InteractiveExamPapers = root.InteractiveExamPapers || {};
  root.InteractiveExamPapers[paper.id] = paper;
})(typeof window !== "undefined" ? window : globalThis);
