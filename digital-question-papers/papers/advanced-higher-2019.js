(function(root) {
  "use strict";

  const concept = (label, answers = [label], extra = {}) => ({ label, answers, ...extra });
  const paired = (label, allTermGroups, extra = {}) => concept(label, [], { allTermGroups, allowFuzzy: false, ...extra });
  const conceptBank = (labels, correct) => labels.map(label => ({ label, answers: [label], correct: correct.includes(label) }));
  const clip = (track, markers) => ({
    file: `../exampapers/adv higher/2019/Music AH 2019 - Track ${String(track).padStart(2, "0")}-1.m4a`,
    label: "Question audio", maxPlaysExam: 1, markers,
  });
  const short = (id, label, prompt, acceptedAnswers, answerDisplay, extra = {}) => ({
    id, label, marks: 1, type: "short-text", prompt, acceptedAnswers, answerDisplay,
    capitaliseAnswer: true, ...extra,
  });

  const excerpt1Melody = [
    concept("Arpeggio", ["arpeggio", "arpeggios"]),
    concept("Chromatic", ["chromatic", "chromaticism"], { alwaysBlockedAnswers: ["chromatic scale"], excludeWithinAnswers: ["chromatic scale"] }),
    concept("Diminished 7th", ["diminished 7th", "diminished seventh"]), concept("Major"),
    concept("Modulation", ["modulation", "modulation to minor"], { blockedAnswers: ["minor"] }),
    concept("Melismatic or melisma", ["melismatic", "melisma"]), concept("Pedal", ["pedal", "pedal point", "pedal note"]),
    concept("Perfect cadence", ["perfect cadence", "V-I", "V I"]), concept("Plainchant or modal", ["plainchant", "plainsong", "modal"]),
    concept("Sequence"), concept("Suspension"), concept("Trill"),
  ];
  const excerpt1Texture = [
    concept("A cappella", ["a cappella", "unaccompanied"]),
    paired("Allegro and adagio", [["allegro"], ["adagio", "lento", "largo"]]), concept("Anacrusis"), concept("Homophonic"),
    concept("Imitation"), concept("Polyphonic or contrapuntal", ["polyphonic", "polyphony", "contrapuntal"]),
    concept("SATB or mixed choir", ["SATB", "mixed voice choir", "mixed voice chorus", "male and female voices"], { blockedAnswers: ["choir", "chorus"] }),
    paired("Soprano/mezzo-soprano and countertenor/alto", [["soprano", "mezzo soprano"], ["countertenor", "counter tenor", "alto"]]),
    concept("Strings or chamber orchestra", ["strings", "chamber orchestra", "small orchestra"]),
    concept("Trumpets or timpani", ["trumpet", "trumpets", "timpani"]), concept("Unison or octaves", ["unison", "octaves", "8ves", "monophonic"]),
    paired("Simple/common time and three beats/change of time", [["2/4", "4/4", "simple time", "common time", "2 beats", "4 beats"], ["3/4", "3 beats", "change of time", "time change"]]),
  ];
  const excerpt2Melody = [
    concept("Change of key", ["change of key", "changes of key", "key change", "key changes"]),
    concept("Discord or dissonance", ["discord", "dissonance", "dissonant"]),
    paired("Minor and major", [["minor"], ["major"]]), concept("Modal"), concept("Pedal", ["pedal", "pedal point", "pedal note"]),
    concept("Sequence"), concept("Syllabic"),
  ];
  const excerpt2Texture = [
    concept("Accents", ["accents", "accent", "sfz", ">"]), concept("Allegro"), concept("Antiphonal or imitation", ["antiphonal", "imitation"]),
    concept("Bongos, congas or cymbals", ["bongos", "congas", "cymbals"]), concept("Homophonic"), concept("Orchestra"), concept("Ostinato"), concept("Pizzicato"),
    concept("SATB, mixed or children's choir", ["SATB", "mixed voice choir", "mixed voice chorus", "male and female voices", "children's choir", "childrens choir", "boys choir", "boys' choir"], { blockedAnswers: ["choir", "chorus"] }),
    concept("Baritone, tenor, shouted or spoken", ["baritone", "tenor", "shouted", "spoken"], { blockedAnswers: ["bass", "male voice"] }),
    concept("Staccato"), concept("Syncopation or off beat", ["syncopation", "syncopated", "off beat", "off-beat"]),
    concept("Timpani, piano, trumpet or harp", ["timpani", "piano", "trumpet", "trumpets", "harp"]),
    concept("Unison or octaves", ["unison", "octaves", "8ves"]), concept("Xylophone or marimba", ["xylophone", "marimba"]),
    concept("Simple/common time", ["2/4", "4/4", "2 beats", "4 beats", "simple time", "common time"]),
    concept("5/4, irregular time or time changes", ["5/4", "5 beats", "5/8", "irregular time", "irregular metre", "time changes"]),
  ];

  const paper = {
    id: "advanced-higher-2019", title: "Advanced Higher Music 2019", level: "Advanced Higher", levelCode: "AH", year: 2019,
    totalMarks: 40, openingInstructions: ["Total marks — 40", "Attempt ALL questions"], estimatedMinutes: 75,
    sourcePath: "../exampapers/adv higher/2019/Music AH 2019 Paper.pdf",
    markingInstructionsPath: "../exampapers/adv higher/2019/Music AH 2019 Answers.pdf",
    attribution: "Original question paper and audio content © Qualifications Scotland. Interactive adaptation created independently for non-commercial educational use. This resource is not endorsed by Qualifications Scotland.",
    questions: [
      {
        id: "q1", number: "1", marks: 9, topic: "Instrumental and vocal music", layout: "ah2019-q1",
        audio: { clips: [clip(2, [{label:"(a)",time:7.05},{label:"(b)",time:249.47},{label:"(c)",time:296.88},{label:"(d)",time:357.45},{label:"(e)",time:455.0},{label:"(f)",time:562.55}])] },
        intro: "This question features instrumental and vocal music.",
        subquestions: [
          { id:"q1a", label:"(a)", marks:4, type:"concept-lines", lines:4, requiredResponses:4, additionalAnswerPenalty:true,
            prompt:"Insert your four answers on the lines below.", leadLines:["Listen to this excerpt and identify four concepts in the music from those\nlisted below.","You now have 15 seconds to read through the list of features."],
            conceptBank:conceptBank(["Fugue","Antiphonal","Consort","Pavan","Sonata form","Trill","Hemiola","Renaissance","Turn","Sequence"],["Antiphonal","Trill","Hemiola","Sequence"]),
            answerDisplay:"Antiphonal, Hemiola, Sequence, Trill", afterAnswerLines:["The music will be played twice with a pause of 10 seconds between\nplayings and a pause of 40 seconds before part (b).","Here is the music for the first time.","Here is the music for the second time."] },
          short("q1b","(b)","Listen to a new excerpt and name this vocal style.",["Recitative","Recit","Oratorio"],"Recitative"),
          short("q1c","(c)","Listen to a continuation of the previous excerpt and identify the concept\nthat describes the solo instrumental part.",["Obbligato"],"Obbligato",{allowFuzzy:false}),
          {id:"q1d",label:"(d)",marks:1,type:"radio",prompt:"Listen to a further excerpt from the same work and tick (✓) one box to\nidentify the correct version of the vocal part.",beforeAnswerLines:["You now have 30 seconds to read through the possible answers.","The excerpt will be played three times.","Here is the excerpt for the first time.","Here is the excerpt for the second time.","Here is the excerpt for the third time."],options:[0,1,2].map((optionIndex,index)=>({value:String(index+1),label:`Version ${index+1}`,notationScore:{sharedNotation:"ah-2019-q1d",optionIndex}})),answer:"3",answerDisplay:"The third version"},
          short("q1e","(e)","Listen to a new excerpt and give the order in which the voices enter.",["Soprano, Tenor, Alto, Bass"],"Soprano, Tenor, Alto, Bass",{allowFuzzy:false,numberedAnswerLines:4,numberedLineAnswers:[["Soprano","S"],["Tenor","T"],["Alto","A"],["Bass","B"]],acceptedCompactAnswers:["STAB"],allowInlineNumberedAnswers:true,compactAnswerPattern:"^[satb]{4}$",beforeAnswerLines:["You will hear the music three times.","Here is the music for the first time.","Here is the music for the second time.","Here is the music for the third time."]}),
          short("q1f","(f)","All the vocal excerpts have been taken from the same work. Listen to one further excerpt and identify the type of work.",["Oratorio"],"Oratorio",{allowFuzzy:false}),
        ],
      },
      {
        id:"q2", sourceNotationLabelWeights: {"(i) Rests": 400, "(ii) Chord:": 400},number:"2",marks:4,topic:"Musicals literacy",layout:"ah2019-literacy",
        audio:{clips:[clip(3,[{label:"(a)",time:7.22},{label:"(b)",time:375.88}])]}, intro:"This question features excerpts from musicals.",
        subquestions:[
          {id:"q2ai",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the missing rests in the boxed area of bar 1.",notationTool:"rhythm-entry",preserveRhythmSequence:true,options:[
            {value:"dottedCrotchetRest",label:"Dotted crotchet rest"},{value:"crotchetRest",label:"Crotchet rest"},{value:"quaverRest",label:"Quaver rest"},
          ],acceptedAnswers:["quaverRest,quaverRest|dottedCrotchetRest","quaverRest,quaverRest|quaverRest,crotchetRest","quaverRest,quaverRest|crotchetRest,quaverRest","quaverRest,quaverRest|quaverRest,quaverRest,quaverRest","crotchetRest|dottedCrotchetRest","crotchetRest|quaverRest,crotchetRest","crotchetRest|crotchetRest,quaverRest","crotchetRest|quaverRest,quaverRest,quaverRest"],answer:"crotchetRest|dottedCrotchetRest",answerDisplay:"A complete accepted rest pattern for both compound beats.",completion:{type:"rest-durations",beats:[1,1.5]},groupStart:{label:"(a)",prompt:"Listen to the excerpt and follow the guide to the music which is printed below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2019-q2"},scoreBeforePrompt:true,scoreFollowingLines:["You now have one minute to read through the questions below."]},
          short("q2aii","(ii)","Name the chord outlined by the boxed notes in bar 4.",["C","C major","C maj","IV","4","Chord IV","Chord 4"],"C major (or IV)",{answerInScore:true,clearOnOwnRow:true,allowFuzzy:false,caseSensitiveRejectedAnswers:["Cm","C minor"]}),
          {id:"q2aiii",label:"(iii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Re-write the boxed note in bar 6 at the same pitch in the bass clef.",notationTool:"note-entry",options:[],answer:"D4",answerDisplay:"D above one ledger line; any note value is accepted.",noteSlots:1,completion:{type:"note-slots",count:1},afterAnswerLines:["You will now hear the music two more times, with 20 seconds between playings and a pause of one minute before part (b).","You should write all your answers on the guide to the music above.","Here is the music for the second time.","Here is the music for the third time."]},
          short("q2b","(b)","Listen to part of a different musical and identify the concept that\ndescribes the overall tonality.",["Polytonality","Bitonality"],"Polytonality or bitonality",{allowFuzzy:false,beforeAnswerLines:["You will hear the music twice.","Here is the music for the first time.","Here is the music for the second time."]}),
        ],
      },
      {
        id:"q3",number:"3",marks:6,topic:"Instrumental music",layout:"ah-boxed-guide",guideBoxSubquestions:4,
        guideIntro:{label:"(a)",prompt:"In this excerpt you are required to complete the guide below by inserting appropriate music concepts.",lines:["There will now be a pause of 30 seconds to allow you to read through the question.","The music will be played three times with a pause of 20 seconds between playings and a pause of 30 seconds before part (b).","In the first two playings a voice will help guide you through the music. There is no voice in the third playing.","Here is the music for the first time.","Here is the music for the second time.","Here is the music for the third time."]},
        audio:{clips:[clip(4,[{label:"(a)",time:6.07},{label:"(b)",time:381.14},{label:"(c)",time:455.19}])]}, intro:"This question features instrumental music.",
        subquestions:[
          short("q3a1","1.","The harmonic feature in the cello is a/an [answer].",["Pedal","Pedal point","Pedal note"],"Pedal",{inlineAnswer:{before:"The harmonic feature in the cello is a/an",after:"."},forbiddenKeywordGroups:[["inverted","pedal"]]}),
          short("q3a2","2.","The texture is [answer].",["Homophonic"],"Homophonic",{inlineAnswer:{before:"The texture is",after:"."}}),
          short("q3a3","3.","This section finishes on a/an [answer] cadence.",["Imperfect","Imperfect cadence"],"Imperfect cadence",{inlineAnswer:{before:"This section finishes on a/an",after:"cadence."}}),
          short("q3a4","4.","The type of group playing is a/an [answer].",["String quartet"],"String quartet",{inlineAnswer:{before:"The type of group playing is a/an",after:"."}}),
          {id:"q3b",label:"(b)",marks:1,type:"radio",prompt:"Listen to a different excerpt and tick (✓) one box to identify the form.",options:["Passacaglia","Fugue","Concerto grosso","Ritornello"].map(label=>({value:label,label})),answer:"Fugue",answerDisplay:"Fugue"},
          short("q3c","(c)","Listen to a continuation of the same piece and identify the harmonic device used at the end of the excerpt.",["Tierce de Picardie","Tierce de Picardy","Picardy third","Picardie third"],"Tierce de Picardie"),
        ],
      },
      {
        id:"q4",number:"4",marks:5,topic:"Solo piano literacy",layout:"ah2019-literacy",
        audio:{clips:[clip(5,[{label:"Guide",time:6.46},{label:"(b)",time:187.4},{label:"(c)",time:346.42}])]}, intro:["This question is based on music for solo piano.","Listen to the complete piece and follow the guide to the music below.","Here is the music."], score:{sharedNotation:"ah-2019-q4"},
        subquestions:[
          {id:"q4ai",label:"(a) (i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the missing notes in bar 4.",notationTool:"note-entry",options:[],answer:"A4,G4,F4,D4",answerDisplay:"A, G, F and D quavers.",noteSlots:4,completion:{type:"note-slots",count:4},leadLines:["You now have 20 seconds to read through part (a)."]},
          short("q4aii","  (ii)","Identify the interval between the two boxed notes in bar 5.",["Tritone","Augmented 4th","Aug 4th","Augmented fourth"],"Tritone (augmented 4th)",{answerInScore:true,forbiddenKeywordGroups:[["diminished","5th"]],afterAnswerLines:["During the next two playings complete your answers to part (a)(i) and (ii).","The music for bars 1–6 will be played two more times with 20 seconds between playings and 40 seconds before part (b).","You should write your answers on the guide score above.","Here is the music for the first time.","Here is the music for the second time."]}),
          {id:"q4bi",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the missing accidental in bar 12 so that the music matches what you hear.",notationTool:"accidental",options:[{value:"natural",label:"Natural"},{value:"flat",label:"Flat"},{value:"sharp",label:"Sharp"}],accidentalNoteIndices:[1],answer:"sharp",answerDisplay:"A sharp before the second C in bar 12.",groupStart:{label:"(b)",prompt:"Listen to a further excerpt and follow the guide to the music below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2019-q4b"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 20 seconds to read through part (b)."]},
          {id:"q4bii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Write the enharmonic equivalent of the boxed note in bar 15.",notationTool:"note-entry",noteEntryAccidentals:true,options:[{value:"flat",label:"Flat"},{value:"natural",label:"Natural"},{value:"sharp",label:"Sharp"}],answer:"Ab2",acceptedAnswers:["Ab2","A♭2"],answerDisplay:"A-flat in the first space of the bass stave; any note value is accepted.",noteSlots:1,completion:{type:"note-slots",count:1},afterAnswerLines:["During the next two playings complete your answers to part (b)(i) and (ii).","The music will be played two more times with a pause of 20 seconds between playings and a pause of 40 seconds before part (c).","You should write your answers on the guide score above.","Here is the music for the second time.","Here is the music for the third time."]},
          short("q4c","(c)","Listen to one further excerpt and explain the effect of the sign below the two tied notes in bars 16 and 17.",["The note should be played one octave lower than written","Play one octave lower","One octave lower","An octave lower","One octave down","An octave down","One octave below","An octave below","8 notes lower","Eight notes lower","8 notes below","Eight notes below"],"Play the note one octave lower than written",{allowAnswerInPhrase:true,answerLines:2,forbiddenExactKeywordGroups:[["not play"],["not one octave lower"],["not an octave lower"],["not played one octave lower"],["not played an octave lower"],["no change"],["two octaves"],["2 octaves"],["higher"],["above"],["octave up"]],beforeAnswerLines:["Write your answer on the lines below the music.","The excerpt is short and will be played twice.","Here is the music for the first time.","Here is the music for the second time."],inlineScore:{sharedNotation:"ah-2019-q4c"},controlsAfterScore:true}),
        ],
      },
      {
        id:"q5",number:"5",marks:6,topic:"Music in different styles",layout:"ah2019-q5",
        audio:{clips:[clip(6,[{label:"(a)",time:6.8},{label:"(b)",time:233.7},{label:"(c)",time:287.64}])]}, intro:"This question features music in different styles.",
        subquestions:[
          {id:"q5a",label:"(a)",marks:4,type:"concept-lines",lines:4,requiredResponses:4,additionalAnswerPenalty:true,prompt:"Insert your four answers on the lines below.",leadLines:["Listen to this excerpt and identify four concepts in the music from those\nlisted below.","You now have 15 seconds to read through the list of features."],conceptBank:conceptBank(["Acciaccatura","Nationalist","Neo-classical","Tuba","Obbligato","Harmonic minor scale","French horn","Turn","Minimalist","Alberti bass"],["Neo-classical","French horn","Turn","Alberti bass"]),answerDisplay:"Neo-classical, French horn, Turn, Alberti bass",afterAnswerLines:["The music will be played twice with a pause of 10 seconds between playings and a pause of 40 seconds before part (b).","Here is the music for the first time.","Here is the music for the second time."]},
          short("q5b","(b)","Listen to a different excerpt and describe the time signature.",["Irregular time signature","Irregular time signatures","Irregular","Irregular metre","Time changes","7 beats","7 beats in the bar","7/4","7/8"],"Irregular time signature",{allowAnswerInPhrase:true}),
          short("q5c","(c)","Listen to a new excerpt. Identify the style of the music.",["Soul","Soul music"],"Soul music"),
        ],
      },
      {
        id:"q6",number:"6",marks:10,topic:"Comparative analysis",
        audio:{clips:[clip(7,[{label:"(a)",time:8.36},{label:"1",time:57.32},{label:"2",time:185.62},{label:"1",time:308.83},{label:"2",time:438.03},{label:"(b)",time:803.16},{label:"1",time:867.29},{label:"2",time:996.36},{label:"1",time:1119.26},{label:"2",time:1247.51}])]}, intro:["In this question you are asked to comment on two excerpts of music.","Listen to each excerpt. For each excerpt identify at least two prominent concepts from each of the following categories","• Melody/harmony","• Rhythm/texture/structure/form/timbre","Both excerpts will be played twice, with a pause of 15 seconds between playings, and a pause of 4 minutes at the end for you to complete your final answer.","You may use the table below for rough working, but your final answer must be written in the final answer section.","Your final answer could be bullet points or short answers identifying the concepts you have heard.","Here is Excerpt 1 for the first time.","Here is Excerpt 2 for the first time.","Here is Excerpt 1 for the second time.","Here is Excerpt 2 for the second time.","You now have 4 minutes to identify at least four concepts in each excerpt.","A warning tone will sound 30 seconds before the start of part (b)."], introPartLabels:{1:"(a)"}, introBoldPhrases:["Melody/harmony","Rhythm/texture/structure/form/timbre"],
        subquestions:[
          {id:"q6a1",label:"(i)",marks:2,type:"structured-review",prompt:"Excerpt 1",sourceHeading:"Excerpt 1",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"ROUGH WORK",roughWorkIntro:"For each excerpt identify at least two prominent concepts in each of the following categories",roughWorkBullets:["Melody/harmony","Rhythm/texture/structure/form/timbre"],roughWorkBoldPhrases:["two prominent","Melody/harmony","Rhythm/texture/structure/form/timbre"],roughWorkSheet:true,roughWorkColumns:["Excerpt 1","Excerpt 2"],finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"FINAL ANSWER",sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:excerpt1Melody},{id:"texture",label:"Rhythm/texture/structure/form/timbre",concepts:excerpt1Texture}]},
          {id:"q6a2",label:"(ii)",marks:2,type:"structured-review",prompt:"Excerpt 2",sourceHeading:"Excerpt 2",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"Final answer",hideFinalHeading:true,sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:excerpt2Melody},{id:"texture",label:"Rhythm/texture/structure/form/timbre",concepts:excerpt2Texture}]},
          {id:"q6bi",label:"(i)",marks:4,type:"structured-review",prompt:"Analysis",sourceHeading:"Analysis",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"ROUGH WORK",roughWorkLines:18,finalAnswerField:true,finalAnswerLines:16,finalAnswerHeading:"FINAL ANSWER",sourceHeadingPosition:"final",endOfPaper:false,finalAnswerIntro:["Comment on six similarities/differences you hear in the excerpts.","Your final answer should be a written description of what you have heard and not simply a list of similarities/differences."],leadIntro:{intro:["Analyse the two excerpts you have just heard.","In your extended answer you should refer to six similarities/differences across the following categories.","Type of work","Melody/harmony","Rhythm/texture/structure/form/timbre","Conclude your analysis with a statement on the style/period of each excerpt and justify your answer.","You will hear each excerpt two more times, with a pause of 15 seconds between playings, and a further 10 minutes to complete your answers for part (i) and part (ii).","Rough work will not be marked.","You should write your final answers in the final answer section.","Here is Excerpt 1 for the third time.","Here is Excerpt 2 for the third time.","Here is Excerpt 1 for the last time.","Here is Excerpt 2 for the last time.","You now have 10 minutes to complete your analysis and conclusion.","A warning tone will sound 30 seconds before the end of the question paper."],introPartLabels:{0:"(i)",5:"(ii)"},introBulletRange:[2,4],introCompactRanges:[[9,10],[11,12]],introBoldPhrases:["Analyse","six similarities/differences","Type of work","Melody/harmony","Rhythm/texture/structure/form/timbre","Conclude","style/period","justify","two","15 seconds","10 minutes","Rough work will not be marked.","30 seconds"]},boldPhrases:["six similarities/differences"],markingProfile:"advanced-comparison",groupStart:{label:"(b)",prompt:"This question has two parts."},
            similarities:[concept("Mass"),concept("Same Gloria text",["same Gloria text","both Gloria","settings of the Gloria","same Latin text","same text"]),concept("Modal",["modal","modality"]),concept("Both include minor sections",["minor sections","minor section","include minor","modulate to minor"],{blockedAnswers:["both minor","both are in a minor key"]}),concept("Pedal",["pedal","pedal point","pedal note"]),concept("Sequence"),concept("Unison or octaves",["unison","octaves","8ves"]),concept("Imitation"),concept("Mixed choir or SATB",["mixed voice choir","mixed choir","SATB","male and female voices"]),concept("Timpani or trumpets",["timpani","trumpet","trumpets"]),concept("Allegro"),concept("Simple or common time",["2/4","4/4","simple time","common time","2 beats","4 beats"])],
            differences:[
              {label:"Pair of solo voices and solo baritone",first:["pair of solo voices","duet","soprano and countertenor","mezzo soprano and alto"],second:["solo baritone","baritone"]},
              {label:"Melismatic and syllabic",first:["melismatic","melisma"],second:["syllabic"]},
              {label:"Small Baroque forces and symphony orchestra",firstConcept:{answers:["chamber orchestra","small orchestra"],allTermGroups:[["strings"],["brass"],["timpani"]]},second:["symphony orchestra"]},
              {label:"Timpani and wide percussion",first:["timpani"],second:["wide variety of percussion","range of percussion","bongos","congas","marimba","claves","cymbals"]},
              {label:"Polyphonic and homophonic",firstConcept:{allTermGroups:[["homophonic"],["polyphonic","contrapuntal"]]},second:["homophonic"]},
              ...[["a cappella"], ["change of time signature"], ["countertenor", "male alto"], ["diminished 7th"], ["major tonality","major","major modulating to minor"], ["modal", "plainchant"], ["modulation"], ["suspension"], ["trill"]].map(answers => ({ label: `${answers.join(" or ")} only in Excerpt 1`, first: answers, only: 1, ...(answers.includes("major")?{invalidFirst:["stays in a major key","stays in major","always major"]}:{}) })),
              ...[["antiphonal"], ["bongos", "congas", "cymbals", "claves", "piano"], ["boys choir", "childrens choir", "children's choir"], ["change of key"], ["dissonance", "discord"], ["irregular time"], ["major and minor"], ["off beat accents"], ["pizzicato"], ["shouted", "spoken"], ["syncopation", "off the beat"], ["time changes"]].map(answers => ({ label: `${answers.join(" or ")} only in Excerpt 2`, second: answers, only: 2 })),
            ],headings:[{id:"analysis",label:"Analysis",concepts:[]}],answerDisplay:"Six valid similarities/differences earn 4 marks; four or five earn 3; two or three earn 2; one earns 1. A list is capped at 2 marks."},
          {id:"q6bii",label:"(ii)",marks:2,type:"structured-review",prompt:"Conclusion",sourceHeading:"Conclusion",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:10,hideFinalHeading:true,sourceHeadingPosition:"final",finalAnswerIntro:["Write a statement on the style/period of each excerpt and justify your answer."],boldPhrases:["style/period","justify"],markingProfile:"advanced-conclusion",endOfPaper:false,headings:[{id:"conclusion",label:"Conclusion",concepts:[concept("Excerpt 1: Baroque"),concept("Excerpt 2: 20th-century or Modern")]}],styles:[
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
      "twentieth century"
    ],
    "reasons": [],
    "reasonConcepts": [
      {
        "label": "Strings with high trumpets",
        "allTermGroups": [
          [
            "strings",
            "string orchestra"
          ],
          [
            "high trumpets",
            "high trumpet"
          ]
        ],
        "allowFuzzy": false
      },
      {
        "label": "High trumpets / chamber or Baroque orchestra",
        "answers": [
          "high trumpets",
          "high trumpet",
          "chamber orchestra",
          "small orchestra",
          "baroque orchestra"
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
        "label": "Suspensions",
        "answers": [
          "suspension",
          "suspensions",
          "suspended notes"
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
        "label": "Harpsichord / basso continuo",
        "answers": [
          "harpsichord",
          "basso continuo",
          "continuo",
          "figured bass"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2019 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  },
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
      "contemporary jazz"
    ],
    "reasons": [],
    "reasonConcepts": [
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
        "label": "Named percussion / piano",
        "answers": [
          "bongos",
          "bongo",
          "claves",
          "congas",
          "conga",
          "marimba",
          "piano",
          "xylophone"
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
        "label": "Spoken / shouted solo singing",
        "answers": [
          "shouting",
          "shouted",
          "speaking",
          "spoken",
          "speak singing",
          "shout singing",
          "singer speaks",
          "singer shouts"
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
        "label": "Abrupt / unprepared key changes",
        "answers": [
          "abrupt key changes",
          "abrupt changes of key",
          "sudden key changes",
          "unprepared key changes"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2019 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
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
