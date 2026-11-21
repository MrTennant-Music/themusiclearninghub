(function (root) {
  "use strict";

  const audio = (track, markers = []) => ({
    file: `../exampapers/n5/2026/Music N5 2026 - Track ${String(track).padStart(2, "0")}-1.m4a`,
    label: "Question audio",
    maxPlaysExam: 1,
    markers,
  });
  const option = (value, label = value, presentation = {}) => ({ value, label, ...presentation });
  const definitions = {
    q1a: "Gospel music commonly features expressive singing, repeated phrases and call and response.",
    q1b: "A bothy ballad is a Scottish work song associated with farm workers living in a bothy.",
    q1c: "The time signature 12/8 has four dotted-crotchet beats in each bar.",
    q1d: "Bass is the lowest standard male voice; baritone lies between bass and tenor.",
    q1e: "Rallentando means gradually slowing down; a descant is an additional high melody above the main tune.",
    q1f: "The chord sequence I-V-VI-IV in G major is G-D-E minor-C.",
    q2a: "Hi-hat cymbals are a pair of cymbals operated by a pedal and often struck with sticks.",
    q2b: "A glissando slides continuously between notes; a chromatic scale moves in semitone steps.",
    q2c: "Syllabic word setting gives one note to each syllable.",
    q2d: "Simple duple and quadruple metre have two or four beats in each bar.",
    q3a: "The score contains three crotchet beats in each complete bar, so the time signature is 3/4.",
    q3b: "Mezzo piano means moderately soft; piano means soft and mezzo forte means moderately loud.",
    q3c: "A tone spans two semitones and may also be described as a major second.",
    q3d: "A dotted minim lasts three crotchet beats.",
    q3e: "Bar 11 is completed by the crotchets B, C and B.",
    q3f: "An imperfect cadence ends on chord V and sounds unfinished.",
    q4a: "Pan pipes are a set of pipes of different lengths blown across their open ends.",
    q4b: "A pentatonic scale uses five different notes within the octave.",
    q4c: "Atonal music has no key centre; flutter-tonguing creates a rapid fluttering wind-instrument sound.",
    q4d: "Polyphonic or contrapuntal texture combines two or more independent melodic lines.",
    q4e: "Contrary motion sends parts in opposite directions; a brass band is formed mainly from brass and percussion.",
    q5a: "A grace note is a short ornament played immediately before a main note.",
    q5b: "Rubato allows flexible timing for expressive effect.",
    q5c: "Legato means played smoothly and connected.",
    q5d: "Romantic music often uses expressive melodies, rich harmony and a wide dynamic range.",
    q6a: "An Alberti bass is a broken-chord accompaniment commonly played low-high-middle-high.",
    q6b: "Arco means to play a string instrument with the bow.",
    q6c: "Andante indicates a steady walking pace; moderato means at a moderate speed.",
    q7a1: "A reel is a fast Scottish dance usually in simple time.",
    q7a2: "A reel may be identified by a fast or moderate tempo, simple time, an upbeat and rapid quavers or semiquavers.",
    q7b1: "A concerto features a solo instrument with an orchestra.",
    q7b2: "Evidence for a concerto must identify both a solo instrument and the orchestra.",
  };

  const paper = {
    id: "national5-2026",
    title: "National 5 Music 2026",
    level: "National 5",
    levelCode: "N5",
    year: 2026,
    totalMarks: 40,
    openingInstructions: ["Total marks — 40", "Attempt ALL questions"],
    estimatedMinutes: 45,
    introductionAudio: "../exampapers/n5/2026/Music N5 2026 - Track 01-1.m4a",
    sourcePath: "../exampapers/n5/2026/N5_Music_QP_2026.pdf",
    markingInstructionsPath: "../exampapers/n5/2026/mi_N5_Music_mi_2026.pdf",
    attribution: "Original question paper and audio content © Qualifications Scotland. Interactive adaptation created independently for non-commercial educational use. This resource is not endorsed by Qualifications Scotland.",
    questions: [
      {
        id: "q1", number: "1", marks: 7, topic: "Vocal music", audio: { clips: [audio(2, [
          { label: "(a)", time: 5.96 }, { label: "(b)", time: 52 }, { label: "(c)", time: 95.76 },
          { label: "(d)", time: 158.45 }, { label: "(e)", time: 199.7 }, { label: "(f)", time: 304.59 },
        ])] },
        intro: "This question features vocal music.",
        subquestions: [
          { id: "q1a", label: "(a)", marks: 1, type: "radio", prompt: "Listen to this excerpt. Tick (✓) one box to describe what you hear.", boldPhrases: ["one"], options: ["Mouth music", "Latin American", "Rock ‘n’ roll", "Gospel"].map(x => option(x)), answer: "Gospel" },
          { id: "q1b", label: "(b)", marks: 1, type: "short-text", capitaliseAnswer: true, prompt: "Listen to a new excerpt and name the type of Scottish song.", acceptedAnswers: ["bothy ballad", "bothy"], answerDisplay: "Bothy ballad" },
          { id: "q1c", label: "(c)", marks: 1, type: "radio", prompt: "Listen to this excerpt. Tick (✓) one box to describe what you hear.", boldPhrases: ["one"], options: ["A cappella", "Backing vocals", "12/8", "Simple time"].map(x => option(x)), answer: "12/8" },
          { id: "q1d", label: "(d)", marks: 1, type: "short-text", capitaliseAnswer: true, prompt: "Listen to a new excerpt and name the type of voice featured.", acceptedAnswers: ["bass", "bass voice", "baritone", "baritone voice"], answerDisplay: "Bass or baritone" },
          { id: "q1e", label: "(e)", marks: 2, type: "checkbox", maxSelections: 2, continuationBefore: true, prompt: "Listen to a different excerpt and tick two boxes to describe what you hear. The excerpt will be played twice.", promptLines: ["Listen to a different excerpt and tick (✓) two boxes to describe what you hear.", "The excerpt will be played twice.", "Here is the excerpt for the first time.", "Here is the excerpt for the second time."], boldPhrases: ["two"], options: ["Rallentando", "Gaelic psalm", "Descant", "Rondo", "Cadenza"].map(x => option(x)), answers: ["Rallentando", "Descant"] },
          { id: "q1f", sourceChordWeight: 400, label: "(f)", marks: 1, type: "radio", prompt: "Tick one box to identify the chord sequence heard in this song. The music is in the key of G major. You will hear the music twice, with a pause of 10 seconds between playings.", promptLines: ["Tick (✓) one box to identify the chord sequence heard in this song.", "The music is in the key of G major.", "You will hear the music twice, with a pause of 10 seconds between playings.", "", "Here is the music for the first time.", "Here is the music for the second time."], markAlign: "prompt-end", boldPhrases: ["one"], options: [
            { value: "I VI IV V", label: "I VI IV V", secondaryLabel: "G Em C D" },
            { value: "I V VI IV", label: "I V VI IV", secondaryLabel: "G D Em C" },
            { value: "I IV VI V", label: "I IV VI V", secondaryLabel: "G C Em D" },
          ], answer: "I V VI IV" },
        ],
      },
      {
        id: "q2", number: "2", marks: 4, topic: "Musical theatre", audio: { clips: [audio(3, [
          { label: "1st", time: 95.66 }, { label: "2nd", time: 184.88 }, { label: "3rd", time: 273.96 },
        ])] },
        intro: [
          "In this question you will hear a song from a musical.",
          "A guide to the music has been laid out below. You will see that further information is required and you should insert this in each of the four areas.",
          "There will now be a pause of one minute to allow you to read through the question.",
          "The music will be played three times, with a pause of 20 seconds between playings.",
          "In the first two playings, a voice will help guide you through the music. There is no voice in the third playing.",
          "Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time.",
        ],
        introTotalMarks: 4, introTotalMarksIndex: 1, showPartMarks: false, layout: "music-guide-vertical",
        subquestions: [
          { id: "q2a", label: "1", marks: 1, type: "short-text", prompt: "Name the percussion instrument: [answer]", inlineAnswer: { before: "Name the percussion instrument:", after: "" }, acceptedAnswers: ["hi-hat cymbals", "hi hat cymbals", "hi-hat", "hi hat", "cymbal", "cymbals"], answerDisplay: "Hi-hat cymbals, hi-hat or cymbals" },
          { id: "q2b", label: "2", marks: 1, type: "short-text", prompt: "The melody features a descending [answer].", inlineAnswer: { before: "The melody features a descending", after: "." }, acceptedAnswers: ["glissando", "gliss", "chromatic", "chromatic scale"], answerDisplay: "Glissando, gliss, chromatic or chromatic scale" },
          { id: "q2c", label: "3", marks: 1, type: "short-text", prompt: "The word setting is [answer].", inlineAnswer: { before: "The word setting is", after: "." }, acceptedAnswers: ["syllabic", "syllabic word setting"], answerDisplay: "Syllabic" },
          { id: "q2d", label: "4", marks: 1, type: "short-text", prompt: "There are [answer] beats in the bar.", inlineAnswer: { before: "There are", after: "beats in the bar." }, acceptedAnswers: ["2", "two", "4", "four", "2/4", "2 / 4", "4/4", "4 / 4"], answerDisplay: "2 or 4 beats; 2/4 or 4/4" },
        ],
      },
      {
        id: "q3", sourceNotationLabelWeights: {"(c) Interval": 400, "(d) Value": 400, "(e) Notes": 400}, number: "3", marks: 6, topic: "Music notation", audio: { clips: [audio(4, [
          { label: "Guide", time: 7.24 }, { label: "1st", time: 114.5 }, { label: "2nd", time: 168.97 }, { label: "3rd", time: 224.12 },
        ])] },
        intro: [
          "You now have to answer questions about the guide to the music printed below.",
          "Listen to the excerpt and follow the music. Here is the music.",
          "You now have one minute to read through the question.",
          "The music will be played three more times with a pause of 30 seconds between playings. After the final playing you will have 2 minutes in which to complete your answers. A warning tone will sound 30 seconds before the next question starts.",
          "Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time.",
        ],
        score: { key: "G major", bars: 16, sharedNotation: "n5-2026-q3" },
        subquestions: [
          { id: "q3a", label: "(a)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "time-signature", prompt: "Insert the time signature in the correct place.", scoreHint: "Select a button to apply it to the score.", options: [option("2/4"), option("3/4"), option("4/4")], answer: "3/4", answerDisplay: "3/4" },
          { id: "q3b", label: "(b)", marks: 1, type: "short-text", prompt: "The dynamic heard at the start of the music is [answer] (Italian term).", inlineAnswer: { before: "The dynamic heard at the start of the music is", after: "(Italian term)." }, acceptedAnswers: ["mp", "mezzo piano", "p", "piano", "mf", "mezzo forte"], answerDisplay: "mp, mezzo piano, p, piano, mf or mezzo forte" },
          { id: "q3c", label: "(c)", marks: 1, type: "short-text", capitaliseAnswer: true, prompt: "The interval between the first two notes in bar 5 is a/an [answer].", inlineAnswer: { before: "The interval between the first two notes in bar 5 is a/an", after: "." }, acceptedAnswers: ["tone", "whole tone", "2", "2nd", "second", "major 2nd", "major second", "minor 2nd", "minor second"], answerDisplay: "Tone, 2 or any 2nd" },
          { id: "q3d", label: "(d)", marks: 1, type: "short-text", prompt: "The value of the note in bar 7 is [answer] beat(s).", inlineAnswer: { before: "The value of the note in bar 7 is", after: "beat(s)." }, acceptedAnswers: ["3", "three"], answerDisplay: "3" },
          { id: "q3e", label: "(e)", marks: 1, type: "notation-choice", sharedScore: true, notationTool: "note-entry", inlineNotationControls: true, prompt: "Complete bar 11 by inserting the missing notes.", options: [], noteSlots: 3, answer: "B4,C5,B4", answerDisplay: "B, C and B crotchets" },
          { id: "q3f", label: "(f)", marks: 1, type: "short-text", capitaliseAnswer: true, prompt: "Name the cadence at the end of the excerpt [answer].", inlineAnswer: { before: "Name the cadence at the end of the excerpt", after: "." }, acceptedAnswers: ["imperfect", "imperfect cadence", "ends on v", "ending on v", "v", "5", "ends on 5", "ending on 5"], answerDisplay: "Imperfect cadence, ending on V or 5" },
        ],
      },
      {
        id: "q4", number: "4", marks: 7, topic: "Different styles", audio: { clips: [audio(5, [
          { label: "(a)", time: 6.69 }, { label: "(b)", time: 47.52 }, { label: "(c)", time: 131.22 }, { label: "(d)", time: 184.35 }, { label: "(e)", time: 221.15 },
        ])] },
        intro: "This question features different styles of music.",
        subquestions: [
          { id: "q4a", label: "(a)", marks: 1, type: "radio", prompt: "Listen to this excerpt and tick (✓) one box to describe what you hear.", boldPhrases: ["one"], options: ["Bassoon", "Clarinet", "Pan pipes", "Piccolo"].map(x => option(x)), answer: "Pan pipes" },
          { id: "q4b", label: "(b)", marks: 1, type: "short-text", capitaliseAnswer: true, prompt: "Listen to another excerpt and name the scale on which the melody is based. The excerpt will be played twice.", promptLines: ["Listen to another excerpt and name the scale on which the melody is based.", "The excerpt will be played twice.", "Here is the excerpt for the first time.", "Here is the excerpt for the second time."], acceptedAnswers: ["pentatonic", "pentatonic scale"], answerDisplay: "Pentatonic or pentatonic scale" },
          { id: "q4c", label: "(c)", marks: 2, type: "checkbox", maxSelections: 2, prompt: "Listen to this excerpt and tick (✓) two boxes to describe what you hear.", boldPhrases: ["two"], options: ["Distortion", "Atonal", "Strophic", "Flutter-tonguing", "Minimalist"].map(x => option(x)), answers: ["Atonal", "Flutter-tonguing"] },
          { id: "q4d", label: "(d)", marks: 1, type: "short-text", capitaliseAnswer: true, prompt: "Listen to this excerpt and describe the texture of the music.", acceptedAnswers: ["polyphonic", "polyphony", "contrapuntal", "counterpoint"], answerDisplay: "Polyphonic or contrapuntal" },
          { id: "q4e", label: "(e)", marks: 2, type: "checkbox", maxSelections: 2, continuationBefore: true, prompt: "Listen to this excerpt and tick two boxes to describe what you hear. The excerpt will be played twice.", promptLines: ["Listen to this excerpt and tick (✓) two boxes to describe what you hear.", "The excerpt will be played twice.", "Here is the excerpt for the first time.", "Here is the excerpt for the second time."], boldPhrases: ["two"], options: ["Contrary motion", "Ragtime", "Orchestra", "Middle 8", "Brass band"].map(x => option(x)), answers: ["Contrary motion", "Brass band"] },
        ],
      },
      {
        id: "q5", number: "5", marks: 4, topic: "Musical concepts", audio: { clips: [audio(6, [
          { label: "1st", time: 83.77 }, { label: "2nd", time: 131.31 }, { label: "3rd", time: 178.72 },
        ])] },
        intro: ["In this question you will hear an excerpt of instrumental music which will be played three times.", "Tick (✓) one answer only in each of the four sections:", "melody/harmony", "rhythm/tempo", "timbre", "style.", "", "You now have one minute to read the question before hearing the excerpt.", "Here is the excerpt for the first time.", "Here is the excerpt for the second time.", "Here is the excerpt for the third time."],
        introBoldPhrases: ["one", "melody/harmony", "rhythm/tempo", "timbre", "style"], introBulletRange: [2, 5], introBulletEmphasis: false, introTotalMarks: 4, introTotalMarksIndex: 1, showPartMarks: false, layout: "category-groups",
        subquestions: [
          { id: "q5a", tickHeading: "Tick (✓)", label: "Melody/harmony", marks: 1, type: "radio", prompt: "Melody/harmony", instruction: "Tick (✓) one box from this selection", options: ["Drone", "Grace note", "Inverted pedal"].map(x => option(x)), answer: "Grace note" },
          { id: "q5b", label: "Rhythm/tempo", marks: 1, type: "radio", prompt: "Rhythm/tempo", instruction: "Tick (✓) one box from this selection", options: [option("Rubato"), option("4/4", "4/4", { stackedFraction: ["4", "4"] }), option("Strathspey")], answer: "Rubato" },
          { id: "q5c", label: "Timbre", marks: 1, type: "radio", prompt: "Timbre", instruction: "Tick (✓) one box from this selection", options: ["Legato", "Harpsichord", "Con sordino"].map(x => option(x)), answer: "Legato" },
          { id: "q5d", label: "Style", marks: 1, type: "radio", prompt: "Style", instruction: "Tick (✓) one box from this selection", options: ["Chorus", "Classical", "Romantic"].map(x => option(x)), answer: "Romantic" },
        ],
      },
      {
        id: "q6", number: "6", marks: 3, topic: "Musical concepts", audio: { clips: [audio(7, [
          { label: "1st", time: 54.77 }, { label: "2nd", time: 132.37 },
        ])] },
        intro: ["In this question, you are asked to describe music you hear by inserting the appropriate concepts in the text below.", "There will now be a pause of 30 seconds to allow you to read through the question.", "You will hear the music twice, with a pause of 20 seconds between playings and 20 seconds before the next question starts.", "Here is the music for the first time.", "Here is the music for the second time."],
        introBoldPhrases: ["twice"], introTotalMarks: 3, introTotalMarksIndex: 0, showPartMarks: false, layout: "sentence-completion",
        subquestions: [
          { id: "q6a", label: "", marks: 1, type: "short-text", prompt: "The type of bass line featured is a/an [answer].", inlineAnswer: { before: "The type of bass line featured is a/an", after: "." }, acceptedAnswers: ["alberti bass", "alberti"], answerDisplay: "Alberti bass or Alberti" },
          { id: "q6b", label: "", marks: 1, type: "short-text", prompt: "The Italian term to describe the string playing technique is [answer].", inlineAnswer: { before: "The Italian term to describe the string playing technique is", after: "." }, acceptedAnswers: ["arco"], answerDisplay: "Arco" },
          { id: "q6c", label: "", marks: 1, type: "short-text", prompt: "The tempo of the music is [answer] (Italian term).", inlineAnswer: { before: "The tempo of the music is", after: "(Italian term)." }, acceptedAnswers: ["andante", "moderato"], answerDisplay: "Andante or moderato" },
        ],
      },
      {
        id: "q7", number: "7", marks: 4, topic: "Styles and justification", audio: { clips: [audio(8, [
          { label: "(a)", time: 5.74 }, { label: "(b)", time: 80.99 },
        ])] },
        intro: "This question features music in different styles.", layout: "style-reason-groups",
        subquestions: [
          { id: "q7a1", label: "(i)", marks: 1, type: "radio", groupStart: { label: "(a)", prompt: "As you listen to the excerpt:" }, prompt: "tick (✓) one box to describe the style of music, and", boldPhrases: ["one"], instructionLines: ["There will be a pause of 20 seconds before the next question starts.", "Here is the music."], options: ["Strathspey", "Waltz", "Jig", "Reel"].map(x => option(x)), answer: "Reel" },
          { id: "q7a2", label: "(ii)", marks: 1, type: "short-text", answerStyle: "reason", prompt: "in the space below, give a reason to support your answer.", minAcceptedConcepts: 2, acceptedConcepts: [
            { id: "time", answers: ["2/4", "2 / 4", "4/4", "4 / 4", "simple time", "two beats", "2 beats", "four beats", "4 beats"] },
            { id: "tempo", answers: ["allegro", "fast", "quick", "quickly", "moderato", "moderate tempo"] },
            { id: "rhythm", answers: ["quaver", "quavers", "semiquaver", "semiquavers"] },
            { id: "upbeat", answers: ["upbeat", "up beat", "anacrusis", "pickup", "pick up"] },
          ], answerDisplay: "Any two linked reel features: simple time, a fast or moderate tempo, rapid quavers or semiquavers, or an upbeat" },
          { id: "q7b1", label: "(i)", marks: 1, type: "radio", groupStart: { label: "(b)", prompt: "As you listen to a different excerpt:" }, prompt: "tick (✓) one box to describe the style of music, and", boldPhrases: ["one"], instructionLines: ["There will be a pause of 20 seconds before the next question starts.", "Here is the music."], options: ["Symphony", "Concerto", "Aria", "Baroque"].map(x => option(x)), answer: "Concerto" },
          { id: "q7b2", label: "(ii)", marks: 1, type: "short-text", answerStyle: "reason", prompt: "in the space below, give a reason to support your answer.", minAcceptedConcepts: 2, acceptedConcepts: [
            { id: "solo-instrument", answers: ["solo instrument", "instrumental solo", "solo violin", "solo piano", "solo flute", "solo clarinet", "solo trumpet", "solo cello", "solo guitar"] },
            { id: "orchestra", answers: ["orchestra", "orchestral"] },
          ], answerDisplay: "A solo instrument with an orchestra" },
        ],
      },
      {
        id: "q8", number: "8", marks: 5, topic: "Listening analysis", audio: { clips: [audio(9, [
          { label: "1st", time: 41.3 }, { label: "2nd", time: 127.44 }, { label: "3rd", time: 214.71 },
        ])] },
        intro: ["As you listen to this excerpt you are asked to identify the prominent features of the music.", "In your answer, comment on at least three of the following:", "melody/harmony", "rhythm/tempo", "timbre", "dynamics (Italian terms).", "", "You will hear the music three times, with a pause of 2 minutes at the end for you to complete your final answer. A warning tone will sound 30 seconds before the end of the question paper.", "You may use the table below for rough working, but your final answer must be written in the final answer section.", "Here is the music for the first time.", "Here is the music for the second time.", "Here is the music for the third time."],
        introBoldPhrases: ["at least three", "melody/harmony", "rhythm/tempo", "timbre", "dynamics (Italian terms)", "final answer must be written in the final answer section"], introBulletRange: [2, 5], introBulletEmphasis: false, introTotalMarks: 5, introTotalMarksIndex: 8, showPartMarks: false,
        subquestions: [{ id: "q8a", label: "Final answer", marks: 5, type: "structured-review", autoMark: true, maxMarksPerHeading: 2, minHeadingsForFullMarks: 3, roughWork: true, finalAnswerField: true, finalAnswerHeading: "Final Answer", continuationBefore: true, prompt: "Final answer", headings: [
          { id: "melody", label: "Melody/harmony", concepts: [
            { label: "Chromatic", answers: ["chromatic", "chromatic scale"] }, { label: "Glissando", answers: ["glissando", "gliss"] }, { label: "Grace notes / trills / ornaments", answers: ["grace note", "grace notes", "trill", "trills", "ornament", "ornaments", "ornamentation"] }, { label: "Imperfect cadence", answers: ["imperfect cadence", "imperfect"] }, { label: "Minor", answers: ["minor", "minor key", "minor tonality"] }, { label: "Pedal", answers: ["pedal", "pedal note"] }, { label: "Perfect cadence", answers: ["perfect cadence", "perfect"] }, { label: "Question and answer", answers: ["question and answer", "question-answer"] }, { label: "Repetition", answers: ["repetition", "repeated", "repeats"], creditId: "repetition" }, { label: "Vamp", answers: ["vamp"] },
          ] },
          { id: "rhythm", label: "Rhythm/tempo", concepts: [
            { label: "3 beats / 3/4 / simple time", answers: ["3 beats in the bar", "3 beats in a bar", "three beats in the bar", "three beats in a bar", "3/4", "3 / 4", "simple time"] }, { label: "Accents", answers: ["accent", "accents", "accented"] }, { label: "Allegro", answers: ["allegro"] }, { label: "Anacrusis", answers: ["anacrusis", "upbeat", "up beat", "pickup", "pick up"] }, { label: "Dotted rhythms", answers: ["dotted rhythm", "dotted rhythms"] }, { label: "Repetition", answers: ["repetition", "repeated", "repeats"], creditId: "repetition" }, { label: "Syncopation", answers: ["syncopation", "syncopated", "off the beat", "off-beat", "off beat"] },
          ] },
          { id: "timbre", label: "Timbre", concepts: [
            { label: "Arco", answers: ["arco"] }, { label: "Cymbals", answers: ["cymbal", "cymbals"] }, { label: "Drum kit / snare drum", answers: ["drum kit", "snare drum"], blockedAnswers: ["drums", "drum"] }, { label: "Harp", answers: ["harp"] }, { label: "Orchestra", answers: ["orchestra", "orchestral"] }, { label: "Piccolo", answers: ["piccolo"] }, { label: "Pizzicato", answers: ["pizzicato", "pizz"] }, { label: "Rolls", answers: ["roll", "rolls", "drum roll", "drum rolls"] }, { label: "Staccato", answers: ["staccato"] }, { label: "Strings / violins", answers: ["strings", "string section", "violins"], blockedAnswers: ["violin"] }, { label: "Timpani / kettle drums", answers: ["timpani", "kettle drum", "kettle drums"] }, { label: "Triangle", answers: ["triangle"] }, { label: "Trumpets", answers: ["trumpet", "trumpets"] }, { label: "Xylophone", answers: ["xylophone"] },
          ] },
          { id: "dynamics", label: "Dynamics (Italian terms)", concepts: [
            { label: "p or mp", answers: ["p", "mp", "piano", "mezzo piano"] }, { label: "mf or f", answers: ["mf", "f", "mezzo forte", "forte"] }, { label: "Crescendo", answers: ["crescendo", "cresc"] }, { label: "Diminuendo", answers: ["diminuendo", "dim"] }, { label: "Sforzando", answers: ["sforzando", "sforzato", "sfz"] },
          ], additionalGuidance: ["Full Italian terms are accepted. English equivalents are not accepted."] },
        ], answerDisplay: "One mark for each valid concept, with a maximum of two marks per heading and five marks overall. Full marks require concepts from at least three headings." }],
      },
    ],
  };

  paper.questions.forEach(question => question.subquestions.forEach(subquestion => {
    subquestion.definition = definitions[subquestion.id];
  }));

  root.InteractiveExamPapers = root.InteractiveExamPapers || {};
  root.InteractiveExamPapers[paper.id] = paper;
  if (typeof module !== "undefined" && module.exports) module.exports = paper;
})(typeof window !== "undefined" ? window : globalThis);
