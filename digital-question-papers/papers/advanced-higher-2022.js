(function(root) {
  "use strict";

  const concept = (label, answers = [label], extra = {}) => ({ label, answers, ...extra });
  const paired = (label, allTermGroups, extra = {}) => concept(label, [], { allTermGroups, allowFuzzy: false, ...extra });
  const conceptBank = (labels, correct) => labels.map(label => ({ label, answers: [label], correct: correct.includes(label) }));
  const clip = (track, markers) => ({
    file: `../exampapers/adv higher/2022/Music AH 2022 - Track ${String(track).padStart(2, "0")}-1.m4a`,
    label: "Question audio", maxPlaysExam: 1, markers,
  });
  const short = (id, label, prompt, acceptedAnswers, answerDisplay, extra = {}) => ({
    id, label, marks: 1, type: "short-text", prompt, acceptedAnswers, answerDisplay,
    capitaliseAnswer: true, ...extra,
  });
  const chord1 = ["G 1st inversion", "G first inversion", "G/B", "Vb", "5b", "5 first inversion", "V first inversion"];
  const chord2 = ["Am", "A minor", "VI", "VIa", "6", "6a"];
  const chordPairs = chord1.flatMap(first => chord2.flatMap(second => [
    `${first}, ${second}`, `${first} and ${second}`, `${first} | ${second}`,
  ]));
  const bassPairs = [];
  for (let f = 1; f <= 5; f += 1) for (let c = 1; c <= 5; c += 1) bassPairs.push(`F${f},C${c}`);

  const excerpt1Melody = [
    concept("7th chords", ["7th chords", "seventh chords"], { blockedAnswers: ["dominant 7th", "dominant seventh"] }),
    concept("Added 6ths", ["added 6th", "added sixth", "added 6ths", "added sixths"]),
    concept("Change of key or modulation", ["change of key", "changes of key", "key change", "modulation"]),
    concept("Contrary motion"), concept("Major"),
    concept("Octaves or octave leaps", ["octaves", "octave leaps", "8ves"]),
    concept("Pedal", ["pedal", "pedal point", "pedal note"]), concept("Sequence"),
    concept("Syllabic or melismatic", ["syllabic", "melismatic", "melisma"]), concept("Trill"),
  ];
  const excerpt1Texture = [
    concept("Accents or sforzando", ["accents", "accent", "sfz", "sforzando"]), concept("Allegro"),
    concept("Antiphonal or imitation", ["antiphonal", "imitation"]),
    {"label": "Brass or any two brass instruments", "answers": ["brass"], "distinctTermGroups": [["trumpet", "trumpets"], ["trombone", "trombones"], ["tuba", "tubas"]], "minDistinctTermGroups": 2, "allowFuzzy": false},
    concept("Homophonic"),
    concept("Irregular time or time changes", ["irregular time", "irregular metre", "time changes", "change of time", "3/4 and 4/4", "7/4", "5/8", "5 beats", "7 beats"]),
    concept("Organ"), concept("Polyphonic, fugal or contrapuntal", ["polyphonic", "polyphony", "fugue", "fugal", "contrapuntal"]),
    concept("SATB or mixed-voice choir", ["SATB", "mixed voice choir", "mixed voice chorus", "choir of male and female voices"], { blockedAnswers: ["choir", "chorus", "male voices", "female voices"] }),
    concept("Snare drum or side drum", ["snare drum", "snare drum rolls", "side drum", "side drum rolls"], { blockedAnswers: ["drums"] }),
    concept("Staccato"), concept("Syncopation", ["syncopation", "syncopated"]),
    concept("Xylophone or timpani", ["xylophone", "marimba", "timpani", "kettle drum"], { blockedAnswers: ["tuned percussion"] }),
  ];
  const excerpt2Melody = [
    concept("Added 6th", ["added 6th", "added sixth"]),
    concept("Change of key", ["change of key", "changes of key", "key change", "key changes"], { blockedAnswers: ["modulation"] }),
    concept("Countermelody", ["countermelody", "counter melody"]), concept("Discord or dissonance", ["discord", "dissonance", "dissonant"]),
    concept("Dominant 7th, diminished chord or 9th", ["dominant 7th", "dominant seventh", "diminished chord", "diminished 7th", "diminished seventh", "7th chord", "seventh chord", "9th chord", "ninth chord"]),
    concept("Glissando"), concept("Major"), concept("Minor or modal", ["minor", "modal"]),
    concept("Pedal", ["pedal", "pedal point", "pedal note"]), concept("Syllabic"),
  ];
  const excerpt2Texture = [
    concept("Simple or common time", ["2/4", "4/4", "simple time", "common time"], { blockedAnswers: ["2 beats", "4 beats"] }),
    concept("Accents or sforzando", ["accents", "accent", "sfz", "sforzando"]), concept("Anacrusis"),
    paired("Andante or Moderato followed by Allegro", [["andante", "moderato"], ["allegro"]]),
    concept("Backing vocals", ["backing vocals", "backing singers", "backing voices"]), concept("Brass"),
    {"label": "Any two rock-band instruments", "answers": [], "distinctTermGroups": [["bass guitar"], ["drum kit", "drumkit"], ["electric guitar"], ["piano"], ["synthesizer", "synthesiser", "synth"]], "minDistinctTermGroups": 2, "allowFuzzy": false},
    concept("Distortion or reverb", ["distortion", "reverb", "reverberation"]), concept("Homophonic"), concept("Imitation"),
    concept("Male voice or tenor", ["male voice", "male singer", "tenor"]), concept("Piccolo"),
    concept("Riff or ostinato", ["riff", "ostinato"]), concept("Strings"), concept("Syncopation", ["syncopation", "syncopated"]),
    concept("Through-composed", ["through composed", "through-composed"]), concept("Time changes", ["time changes", "change of time"]),
    concept("Timpani or congas", ["timpani", "kettle drum", "congas"]),
    concept("Xylophone or marimba", ["xylophone", "marimba"], { blockedAnswers: ["tuned percussion"] }),
  ];

  const paper = {
    id: "advanced-higher-2022", title: "Advanced Higher Music 2022", level: "Advanced Higher", levelCode: "AH", year: 2022,
    totalMarks: 40, openingInstructions: ["Total marks — 40", "Attempt ALL questions"], estimatedMinutes: 75,
    sourcePath: "../exampapers/adv higher/2022/Music AH 2022 Paper.pdf",
    markingInstructionsPath: "../exampapers/adv higher/2022/Music AH 2022 Answers.pdf",
    attribution: "Original question paper and audio content © Qualifications Scotland. Interactive adaptation created independently for non-commercial educational use. This resource is not endorsed by Qualifications Scotland.",
    questions: [
      {
        id: "q1", number: "1", marks: 5, topic: "Instrumental music", layout: "ah2022-q1",
        audio: { clips: [clip(2, [{label:"(a)",time:5.24},{label:"(b)",time:190.2}])] },
        intro: "This question is based on instrumental music.",
        subquestions: [
          { id:"q1a", label:"(a)", marks:4, type:"concept-lines", lines:4, requiredResponses:4, additionalAnswerPenalty:true,
            prompt:"Give your four answers on the lines below.", leadLines:["Listen to this excerpt and identify four concepts in the music from those listed\nbelow.","You now have 15 seconds to read the list before hearing the music."],
            conceptBank:conceptBank(["Triplets","Time changes","Harmonics","Tone row","Hemiola","Antiphonal","Stretto","Semitone","Pedal","Retrograde"],["Triplets","Antiphonal","Semitone","Pedal"]),
            answerDisplay:"Antiphonal, Pedal, Semitone, Triplets", afterAnswerLinesBeforePrompt:1, afterAnswerLines:["The music will be played twice with 10 seconds between playings. You will\nthen have 40 seconds to complete your answer.","Here is the music for the first time.","Here is the music for the second time."] },
          short("q1b","(b)","Listen to a new excerpt and identify the ornament.",["Turn"],"Turn",{allowFuzzy:false,afterAnswerLinesBeforeAnswer:3,afterAnswerLines:["The music will be played twice.","Here is the music for the first time.","Here is the music for the second time."]}),
        ],
      },
      {
        id:"q2", number:"2", marks:5, topic:"Song literacy", layout:"ah2022-literacy",
        audio:{clips:[clip(3,[{label:"(a)",time:4.04},{label:"(b)",time:214.72},{label:"(c)",time:422.62}])]},
        intro:"This question is based on a song.",
        subquestions:[
          short("q2ai","(i)","Identify the chords used in bars 1 and 2. You should indicate the chord\nname or number and, where appropriate, 1st or 2nd inversion or 7th.",chordPairs,"Bar 1: G first inversion (Vb); Bar 2: A minor (VI)",{answerInScore:true,allowFuzzy:false,clearOnOwnRow:true,promptLines:["Identify the chords used in bars 1 and 2. You should indicate the chord\nname or number and, where appropriate, 1st or 2nd inversion or 7th.","The first and last chords have been completed for you.","The key is C major."],groupStart:{label:"(a)",prompt:"Listen to the excerpt and follow the guide to the music which is printed below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2022-q2a"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through parts (i) and (ii)."]}),
          {id:"q2aii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Re-write the three boxed notes in bar 3 at the same pitch. Write your\nanswer on the stave below bar 3.",notationTool:"note-entry",options:[],answer:"A3,C4,D4",answerDisplay:"A3, C4 and D4 at the same pitch in bass clef; any note values and stem grouping are accepted.",noteSlots:3,completion:{type:"note-slots",count:3},afterAnswerLines:["You will hear the music two more times with 20 seconds between playings. You\nwill then have 40 seconds to complete your answers.","You should write your answers on the guide to the music above.","Here is the music for the second time.","Here is the music for the third time."]},
          short("q2bi","(i)","Identify the interval formed by the two boxed notes in bar 1.",["4th","4","Perfect 4th","Perfect fourth"],"Perfect 4th",{answerInScore:true,allowFuzzy:false,clearOnOwnRow:true,groupStart:{label:"(b)",prompt:"Listen to a further excerpt and follow the guide to the music which is printed\nbelow."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2022-q2b"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through parts (i) and (ii)."]}),
          {id:"q2bii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert an accidental in bar 3 to make the printed music match what you\nhear.",notationTool:"accidental",options:[{value:"natural",label:"Natural"},{value:"flat",label:"Flat"},{value:"sharp",label:"Sharp"}],accidentalNoteIndices:[3],answer:"flat",answerDisplay:"A flat before the E in bar 3.",afterAnswerLines:["You will now hear the music two more times with 20 seconds between\nplayings. You will then have 40 seconds to complete your answers.","You should write your answers on the guide to the music above.","Here is the music for the second time.","Here is the music for the third time."]},
          short("q2c","(c)","Listen to a final excerpt. Identify the cadence heard at the end.",["Plagal","Plagal cadence","IV-I","IV I","F to C"],"Plagal cadence (IV–I)",{allowFuzzy:false,afterAnswerLinesBeforeAnswer:3,afterAnswerLines:["The music will be played twice.","Here is the music for the first time.","Here is the music for the second time."]}),
        ],
      },
      {
        id:"q3", number:"3", marks:7, topic:"Chamber music", layout:"ah-boxed-guide", guideBoxStartIndex:1, guideBoxSubquestions:4,
        audio:{clips:[clip(4,[{label:"(a)",time:5.10},{label:"(b)",time:62.88},{label:"(c)",time:330.55},{label:"(d)",time:396.2}])]},
        intro:"This question is based on chamber music.",
        guideIntro:{label:"(b)",prompt:"Listen to the next excerpt and complete the guide below by inserting\nappropriate music concepts.",lines:["The music will be played three times with 20 seconds between playings. You\nwill then have 30 seconds to complete your answer.","There will now be 30 seconds to allow you to read through the question.","In the first two playings a voice will help guide you through the music. There is\nno voice in the third playing.","Here is the music for the first time.","Here is the music for the second time.","Here is the music for the third time."]},
        subquestions:[
          {id:"q3a",label:"(a)",marks:1,type:"radio",prompt:"Listen to this excerpt and tick (✓) one box to identify what you hear.",options:["Galliard","Obbligato","Alberti bass","Passacaglia"].map(label=>({value:label,label})),answer:"Passacaglia",answerDisplay:"Passacaglia"},
          short("q3b1","1.","In this fugue the instrument playing the subject is a/an [answer].",["Viola"],"Viola",{inlineAnswer:{before:"In this fugue the instrument playing the subject is a/an",after:"."}}),
          short("q3b2","2.","The second entry, heard on the violin, is known as the [answer].",["Answer"],"Answer",{inlineAnswer:{before:"The second entry, heard on the violin, is known as the",after:"."}}),
          short("q3b3","3.","The texture of this piece is [answer].",["Contrapuntal","Polyphonic","Polyphony"],"Contrapuntal or polyphonic",{inlineAnswer:{before:"The texture of this piece is",after:"."}}),
          short("q3b4","4.","At this point the melody features a/an [answer].",["Sequence","Descending sequence","Contrary motion"],"Sequence (including descending sequence) or contrary motion",{inlineAnswer:{before:"At this point the melody features a/an",after:"."}}),
          short("q3c","(c)","Listen as that excerpt continues. The third entry of the subject has been altered. Identify the rhythmic device used to develop the subject.",["Augmentation"],"Augmentation",{allowFuzzy:false,promptLines:["Listen as that excerpt continues. The third entry of the subject has been\naltered.","Identify the rhythmic device used to develop the subject."],promptBoldPhrases:["rhythmic"],markAlign:"prompt-end",afterAnswerLinesBeforeAnswer:3,afterAnswerBoldPhrases:["twice"],afterAnswerLines:["The excerpt is short and will be played twice.","Here is the music for the first time.","Here is the music for the second time."]}),
          short("q3d","(d)","Listen to a further excerpt. Identify the harmonic device used at the end of the excerpt.",["Tierce de Picardie","Tierce de Picardy","Picardy third","Picardie third"],"Tierce de Picardie",{promptLines:["Listen to a further excerpt.","Identify the harmonic device used at the end of the excerpt."],markAlign:"prompt-end"}),
        ],
      },
      {
        id:"q4", number:"4", marks:5, topic:"Piano literacy", layout:"ah2022-literacy",
        audio:{clips:[clip(5,[{label:"(a)",time:5.06},{label:"(b)",time:225.12}])]},
        intro:"This question is based on piano music.",
        subquestions:[
          {id:"q4ai",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the correct time signature at the appropriate place in the music.",notationTool:"time-signature",options:["2/4","3/4","4/4","5/4","6/8","9/8","12/8"].map(value=>({value,label:value})),answer:"12/8",answerDisplay:"12 over 8, written as a time signature rather than a fraction.",groupStart:{label:"(a)",prompt:"Listen to the excerpt and follow the guide to the music which is printed below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2022-q4a"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through the question."]},
          short("q4aii","(ii)","Identify the boxed chord in bar 7.",["G7","G 7","Dominant 7th","Dominant seventh","V7","V 7"],"G7 (dominant 7th or V7)",{answerInScore:true,allowFuzzy:false,caseSensitiveRejectedAnswers:["G","V","Dominant"],beforeAnswerLines:["The music is in the key of C major."],afterAnswerLines:["You will now hear the music two more times, with 20 seconds between playings. You will then have 40 seconds to complete your answers.","You should write all your answers on the guide to the music above.","Here is the music for the second time.","Here is the music for the third time."]}),
          short("q4bi","(i)","Write the name of the key in the box above bar 1.",["B flat major","B-flat major","Bb major","B flat","B-flat","Bb"],"B-flat major",{answerInScore:true,allowFuzzy:false,groupStart:{label:"(b)",prompt:"Listen to a new excerpt and follow the guide to the music which is printed below."},leadLines:["Here is the music.","You now have one minute to read parts (i), (ii) and (iii)."]}),
          {id:"q4bii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the appropriate sign in bar 4 to make the printed music match what you hear.",notationTool:"bar-label",barLabel:"8va",options:[{value:"8va",label:"8va",symbol:"ottavaAlta"},{value:"8vb",label:"8vb",symbol:"ottavaBassa"},{value:"D.C.",label:"D.C.",symbol:"daCapo"},{value:"D.S.",label:"Dal Segno",symbol:"dalSegno"}],answer:"bar-4-8va",acceptedAnswers:["bar-4-8va","bar-4-8ve"],answerDisplay:"8va (or 8ve) above the first note in bar 4; the continuation line is optional."},
          {id:"q4biii",label:"(iii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Using the rhythm provided and the chord information printed below the stave, insert the missing bass notes in the boxed areas in bars 13 and 14.",notationTool:"note-entry",options:[],answer:"F3,C3",acceptedAnswers:bassPairs,answerDisplay:"F in bar 13 and C in bar 14, both dotted crotchets; either octave is accepted.",noteSlots:2,completion:{type:"note-slots",count:2},afterAnswerLinesBeforeAnswer:4,afterAnswerLines:["You will now hear the music two more times, with 20 seconds between playings. You will then have 2 minutes to complete your answers.","You should write all your answers on the guide to the music below.","Here is the music for the second time.","Here is the music for the third time."],inlineScore:{sharedNotation:"ah-2022-q4b"}},
        ],
      },
      {
        id:"q5", number:"5", marks:8, topic:"Music in different styles", layout:"ah2022-literacy",
        audio:{clips:[clip(6,[{label:"(a)",time:6.41},{label:"(b)",time:227.65},{label:"(c)",time:276.93},{label:"(d)",time:518.32}])]},
        intro:"This question is based on instrumental music in different styles.",
        subquestions:[
          {id:"q5ai",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Write the enharmonic equivalent of the boxed note in bar 5.",notationTool:"note-entry",allowAccidentalEntry:true,options:[],answer:"Ab5",acceptedAnswers:["Ab5","A♭5"],answerDisplay:"A-flat on the first ledger line above the treble stave; any note value is accepted.",noteSlots:1,completion:{type:"note-slots",count:1},groupStart:{label:"(a)",prompt:"Listen to this excerpt and follow the guide to the music which is printed below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2022-q5"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through parts (i) and (ii)."]},
          {id:"q5aii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the missing notes in bar 8.",notationTool:"note-entry",options:[],answer:"G4,A4,F4",answerDisplay:"G, A and F as a quaver triplet, including the triplet sign.",noteSlots:3,completion:{type:"note-slots",count:3},afterAnswerLines:["You will now hear the music two more times, with 20 seconds between playings. You will then have 40 seconds to complete your answers.","You should write all of your answers on the guide to the music above.","Here is the music for the second time.","Here is the music for the third time."]},
          short("q5b","(b)","Listen to a new excerpt and identify the type of group playing.",["Consort","Recorder consort","Whole consort"],"Consort (recorder or whole consort)",{allowFuzzy:false,caseSensitiveRejectedAnswers:["Recorders","Recorder"]}),
          {id:"q5c",label:"(c)",marks:4,type:"concept-lines",lines:4,requiredResponses:4,additionalAnswerPenalty:true,prompt:"Give your four answers on the lines below.",leadLines:["Listen to a different excerpt and identify four concepts in the music from those listed below.","You now have 15 seconds to read the list before hearing the music."],conceptBank:conceptBank(["Contrary motion","Pentatonic scale","Triplets","Interrupted cadence","Classical","Piano trio","Concertino","Dominant 7th","Acciaccatura","Nationalist"],["Contrary motion","Classical","Dominant 7th","Acciaccatura"]),afterAnswerLinesBeforePrompt:1,afterAnswerLines:["The music will be played twice with 10 seconds between playings. You will then have 40 seconds to complete your answer.","Here is the music for the first time.","Here is the music for the second time."],answerDisplay:"Acciaccatura, Classical, Contrary motion, Dominant 7th"},
          short("q5d","(d)","Listen to a new excerpt. Identify the style of the music.",["Impressionist","Impressionism","Sonata"],"Impressionist (Impressionism) or sonata",{promptLines:["Listen to a new excerpt.","Identify the style of the music."],markAlign:"prompt-end"}),
        ],
      },
      {
        id:"q6", number:"6", marks:10, topic:"Comparative analysis",
        audio:{clips:[clip(7,[{label:"(a)",time:6.55},{label:"1",time:53.87},{label:"2",time:187.03},{label:"1",time:303.59},{label:"2",time:436.38},{label:"(b)",time:792.78},{label:"1",time:857.05},{label:"2",time:989.56},{label:"1",time:1108.96},{label:"2",time:1242.06}])]},
        intro:["In this question you are asked to comment on two excerpts of music.","Listen to each excerpt. For each excerpt identify at least two prominent concepts from each of the following categories.","Melody/harmony","Rhythm/texture/structure/form/timbre","Both excerpts will be played twice, with 15 seconds between playings, and 4 minutes at the end for you to complete your final answer.","You may use the table below for rough working, but your final answer must be written in the final answer section.","Your final answer could be bullet points or short paragraphs identifying the concepts you have heard.","Here is Excerpt 1 for the first time.","Here is Excerpt 2 for the first time.","Here is Excerpt 1 for the second time.","Here is Excerpt 2 for the second time.","You now have 4 minutes to identify at least four concepts in each excerpt.","A warning tone will sound 30 seconds before the start of part (b)."],introPartLabels:{1:"(a)"},introBulletRange:[2,3],introCompactRanges:[[7,8],[9,10]],
        subquestions:[
          {id:"q6a1",label:"(i)",marks:2,type:"structured-review",prompt:"Excerpt 1",sourceHeading:"Excerpt 1",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"Rough work",roughWorkIntro:"For each excerpt identify at least two prominent concepts in each of the following categories.",roughWorkBullets:["Melody/harmony","Rhythm/texture/structure/form/timbre"],roughWorkBoldPhrases:["two prominent","Melody/harmony","Rhythm/texture/structure/form/timbre"],roughWorkSheet:true,roughWorkCategoryWeight:700,roughWorkColumns:["Excerpt 1","Excerpt 2"],finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"Final answer",sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:excerpt1Melody},{id:"texture",label:"Rhythm/texture/structure/form/timbre",concepts:excerpt1Texture}]},
          {id:"q6a2",label:"(ii)",marks:2,type:"structured-review",prompt:"Excerpt 2",sourceHeading:"Excerpt 2",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"Final answer",hideFinalHeading:true,sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:excerpt2Melody},{id:"texture",label:"Rhythm/texture/structure/form/timbre",concepts:excerpt2Texture}]},
          {id:"q6bi",label:"(i)",marks:4,type:"structured-review",prompt:"Analysis",sourceHeading:"Analysis",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"Rough work",roughWorkLines:18,finalAnswerField:true,finalAnswerLines:16,finalAnswerHeading:"Final answer",sourceHeadingPosition:"final",endOfPaper:false,finalAnswerIntro:["Comment on six similarities/differences you hear in the excerpts.","Your final answer should be a written description of what you have heard and not simply a list of similarities/differences."],leadIntro:{intro:["Analyse the two excerpts you heard in part (a).","In your extended answer you should refer to six similarities/differences across the following categories.","Melody/harmony","Rhythm/texture/structure/form/timbre","When you have completed your analysis you should give your conclusion. You must identify the period of each excerpt and justify your answer.","You will hear each excerpt two more times with 15 seconds between playings. There will then be 10 minutes to complete your answers for parts (i) and (ii).","Write your final answers in the final answer section.","Rough work will not be marked.","Here is Excerpt 1 for the third time.","Here is Excerpt 2 for the third time.","Here is Excerpt 1 for the last time.","Here is Excerpt 2 for the last time.","You now have 10 minutes to complete your analysis and conclusion.","A warning tone will sound 30 seconds before the end of the question paper."],introPartLabels:{0:"(i)",4:"(ii)"},introBulletRange:[2,3],introCompactRanges:[[8,9],[10,11]],introBoldPhrases:["Analyse","six similarities/differences","Melody/harmony","Rhythm/texture/structure/form/timbre","conclusion","period","justify","10 minutes","Rough work will not be marked."]},boldPhrases:["six similarities/differences"],markingProfile:"advanced-comparison",groupStart:{label:"(b)",prompt:"This question has two parts."},
            similarities:[
              concept("7th chords",["7th chords","seventh chords"]),concept("Accents or sforzando",["accents","accent","sfz","sforzando"]),concept("Added 6ths",["added 6th","added sixth","added 6ths","added sixths"]),concept("Brass"),concept("Change of key",["change of key","key change"]),concept("Homophonic"),concept("Imitation"),concept("Major"),concept("Pedal",["pedal","pedal point","pedal note"]),concept("Syllabic"),concept("Syncopation",["syncopation","syncopated"]),concept("Time changes",["time changes","change of time"]),concept("Timpani",["timpani","kettle drum"]),concept("Xylophone",["xylophone","marimba"]),
            ],
            differences:[
              {label:"Mixed choir and solo voice with backing vocals",first:["SATB","mixed choir","mixed voice choir","mixed voice chorus"],secondConcept:{allTermGroups:[["solo voice","solo singer","male voice","tenor"],["backing vocals","backing singers","accompanying singers"]]}},
              {label:"Brass and percussion versus rock band",firstConcept:{allTermGroups:[["brass"],["percussion"]]},secondConcept:{answers:["rock band"],distinctTermGroups:[["bass guitar"],["drum kit","drumkit"],["electric guitar"],["piano"],["synthesizer","synthesiser","synth"]],minDistinctTermGroups:2}},
              {label:"Organ and piano",first:["organ"],second:["piano"]},
              {label:"Snare drum and drum kit",first:["snare drum","side drum"],second:["drum kit"]},
              {label:"Allegro and changing tempo",first:["allegro"],secondConcept:{allTermGroups:[["andante","moderato"],["allegro"]]}},
              ...[["antiphonal"], ["fugue", "fugal", "polyphonic", "contrapuntal"], ["irregular time"], ["melismatic"], ["sequence"]].map(answers => ({ label: `${answers.join(" or ")} only in Excerpt 1`, first: answers, only: 1 })),
              ...[["anacrusis"], ["diminished chords", "diminished 7th"], ["discord", "dissonance"], ["distortion", "reverb"], ["glissando"], ["minor", "modal"], ["through-composed"]].map(answers => ({ label: `${answers.join(" or ")} only in Excerpt 2`, second: answers, only: 2 })),
            ],headings:[{id:"analysis",label:"Analysis",concepts:[]}],answerDisplay:"Six valid similarities/differences earn 4 marks; four or five earn 3; two or three earn 2; one earns 1. A list is capped at 2 marks."},
          {id:"q6bii",label:"(ii)",marks:2,type:"structured-review",prompt:"Conclusion",sourceHeading:"Conclusion",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:10,hideFinalHeading:true,sourceHeadingPosition:"final",finalAnswerIntro:["Identify the period of each excerpt and justify your answer."],boldPhrases:["period","justify"],markingProfile:"advanced-conclusion",endOfPaper: false,headings:[{id:"conclusion",label:"Conclusion",concepts:[concept("Excerpt 1: 20th-century or Modern"),concept("Excerpt 2: 20th-century, Modern or Popular")]}],styles:[
  {
    "answers": [
      "20th century",
      "twentieth century",
      "modern"
    ],
    "wrongStyles": [
      "renaissance",
      "baroque",
      "classical",
      "romantic",
      "impressionist",
      "minimalist",
      "serial",
      "atonal",
      "popular"
    ],
    "reasons": [],
    "reasonConcepts": [
      {
        "label": "Key changes",
        "answers": [
          "key changes",
          "change of key",
          "changes of key",
          "frequent key changes",
          "frequent changes of key",
          "many key changes",
          "constantly changing key",
          "changes key frequently"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Added-note / sixth / seventh chords",
        "answers": [
          "added note chords",
          "added chords",
          "added 6th",
          "added sixth",
          "added 6ths",
          "added sixths",
          "sixth chords",
          "6th chords",
          "7th chords",
          "7th chord",
          "seventh chords",
          "seventh chord",
          "added 7th",
          "added seventh"
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
        "label": "Accents / sforzando",
        "answers": [
          "accents",
          "accented",
          "sforzando",
          "sforzandi",
          "sfz"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Wide leaps / angular melodic lines",
        "answers": [
          "wide leaps",
          "wide leaping notes",
          "large leaps",
          "wide intervals",
          "angular melody",
          "angular melodic line",
          "angular melodic lines"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Prominent / extensive percussion",
        "answers": [
          "prominent percussion",
          "percussion is prominent",
          "large percussion section",
          "wide range of percussion",
          "range of percussion instruments",
          "lots of percussion",
          "extensive percussion",
          "percussion stands out"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Prominent snare drum / xylophone",
        "answers": [
          "prominent snare drum",
          "prominent side drum",
          "prominent xylophone"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2022 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  },
  {
    "answers": [
      "20th century",
      "twentieth century",
      "modern",
      "popular"
    ],
    "wrongStyles": [
      "renaissance",
      "baroque",
      "classical",
      "romantic",
      "impressionist",
      "minimalist",
      "serial",
      "atonal"
    ],
    "reasons": [],
    "reasonConcepts": [
      {
        "label": "Diminished harmony",
        "answers": [
          "diminished chords",
          "diminished 7th",
          "diminished seventh"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Orchestral percussion colours",
        "allTermGroups": [
          [
            "orchestra",
            "orchestral instruments",
            "brass section"
          ],
          [
            "congas",
            "xylophone",
            "bell tree"
          ]
        ],
        "allowFuzzy": false
      },
      {
        "label": "Added-note / sixth / seventh chords",
        "answers": [
          "added note chords",
          "added chords",
          "added 6th",
          "added sixth",
          "added 6ths",
          "added sixths",
          "sixth chords",
          "6th chords",
          "7th chords",
          "7th chord",
          "seventh chords",
          "seventh chord",
          "added 7th",
          "added seventh"
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
        "label": "Modern rock instrumentation / effects",
        "answers": [
          "rock band",
          "rock instruments",
          "modern rock instruments",
          "electric guitar",
          "bass guitar",
          "drum kit",
          "drumkit",
          "distortion",
          "distorted guitar",
          "reverb",
          "reverberation",
          "synthesizer",
          "synthesiser",
          "synthesizers",
          "synthesisers"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Solo singer with backing vocals",
        "allTermGroups": [
          [
            "soloist",
            "solo voice",
            "solo singer",
            "lead singer",
            "lead vocal"
          ],
          [
            "backing vocals",
            "backing singers",
            "backing voices",
            "backing singing"
          ]
        ],
        "allowFuzzy": false
      },
      {
        "label": "Rock / reggae influences",
        "answers": [
          "rock style",
          "rock influence",
          "rock influences",
          "reggae",
          "rock music"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2022 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  }
],answerDisplay:"Both styles/periods correctly identified and justified earn 2 marks; both identified, or one identified and justified, earns 1 mark."},
        ],
      },
    ],
  };

  root.InteractiveExamPapers = root.InteractiveExamPapers || {};
  root.InteractiveExamPapers[paper.id] = paper;
  if (typeof module !== "undefined" && module.exports) module.exports = paper;
})(typeof window !== "undefined" ? window : globalThis);
