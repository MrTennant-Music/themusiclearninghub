(function(root) {
  "use strict";

  const concept = (label, answers = [label], extra = {}) => ({ label, answers, ...extra });
  const conceptBank = (labels, correct) => labels.map(label => ({ label, answers: [label], correct: correct.includes(label) }));
  const clip = (track, markers) => ({
    file: `../exampapers/adv higher/2018/Music AH 2018 - Track ${String(track).padStart(2, "0")}-1.m4a`,
    label: "Question audio", maxPlaysExam: 1, markers,
  });
  const short = (id, label, prompt, acceptedAnswers, answerDisplay, extra = {}) => ({
    id, label, marks: 1, type: "short-text", prompt, acceptedAnswers, answerDisplay,
    capitaliseAnswer: true, ...extra,
  });

  const excerpt1Melody = [
    concept("Acciaccatura or appoggiatura", ["acciaccatura","appoggiatura"]),
    concept("Arpeggios or broken chords", ["arpeggios","arpeggio","broken chords"]),
    concept("Chromatic", ["chromatic","chromaticism"], { blockedAnswers: ["chromatic scale"] }),
    concept("Dominant 7th or diminished 7th", ["dominant 7th","dominant seventh","V7","diminished 7th","diminished seventh"], { blockedAnswers: ["diminished"] }),
    concept("Major", ["major"], { alwaysBlockedAnswers: ["major minor major"] }), concept("Melismatic or syllabic", ["melismatic","syllabic"]), concept("Pedal"),
    concept("Perfect cadence", ["perfect cadence","V-I","V I"]), concept("Sequence"), concept("Vamp"),
  ];
  const excerpt1Texture = [
    concept("Cadenza"), concept("Coloratura or vibrato", ["coloratura","vibrato"]), concept("Harp"),
    concept("Homophonic"), concept("Orchestra or strings", ["orchestra","strings"], { blockedAnswers: ["violin","violins"] }),
    concept("Pizzicato"), concept("Soprano", ["soprano"], { blockedAnswers: ["mezzo soprano"] }),
    concept("Ternary"), concept("Timpani"), concept("Triangle"),
  ];
  const excerpt2Melody = [
    concept("Added chords", ["added 6th","added sixth","added chords","added note chords"]), concept("Appoggiatura"),
    concept("Arpeggios or broken chords", ["arpeggios","arpeggio","broken chords"]),
    concept("Change of key", ["change of key","changes key"], { blockedAnswers: ["modulation"] }),
    concept("Chromatic", ["chromatic","chromaticism"], { blockedAnswers: ["chromatic scale"] }), concept("Contrary motion"),
    concept("Dominant 7th", ["dominant 7th","dominant seventh","V7"]), concept("Major"),
    concept("Perfect cadence", ["perfect cadence","V-I","V I"]), concept("Sequence"), concept("Syllabic"), concept("Vamp"),
  ];
  const excerpt2Texture = [
    concept("Canon or contrapuntal", ["canon","contrapuntal","polyphonic","polyphony","fugal"]),
    concept("Clarinet or saxophone", ["clarinet","saxophone"]), concept("Homophonic"), concept("Imitation"), concept("Orchestra"),
    concept("Pizzicato", ["pizzicato"], { blockedAnswers: ["strings","violin","violins"] }),
    concept("Male trio", ["tenors","baritones","tenor and baritone","tenors and baritone","male trio","small group of male voices"], { blockedAnswers: ["duet","tenor","baritone","male chorus","choir","backing singers"] }),
    concept("Percussion", ["timpani","timpani roll","cymbal","drum kit"]),
    concept("Trumpets", ["trumpet","trumpets","muted trumpet","muted trumpets","con sordino trumpet","fanfare","trumpet fanfare"]), concept("Unison"),
  ];

  const paper = {
    id: "advanced-higher-2018", title: "Advanced Higher Music 2018", level: "Advanced Higher", levelCode: "AH", year: 2018,
    totalMarks: 40, openingInstructions: ["Total marks — 40", "Attempt ALL questions"], estimatedMinutes: 75,
    sourcePath: "../exampapers/adv higher/2018/Music AH 2018 Paper.pdf",
    markingInstructionsPath: "../exampapers/adv higher/2018/Music AH 2018 Answers.pdf",
    attribution: "Original question paper and audio content © Qualifications Scotland. Interactive adaptation created independently for non-commercial educational use. This resource is not endorsed by Qualifications Scotland.",
    questions: [
      {
        id: "q1", number: "1", marks: 6, topic: "Music in different styles",
        audio: { clips: [clip(2, [{label:"(a)",time:7.28},{label:"(b)",time:267.64},{label:"(c)",time:315.08}])] },
        intro: "This question features music in different styles.",
        subquestions: [
          { id:"q1a", label:"(a)", marks:4, type:"concept-lines", lines:4, requiredResponses:4, additionalAnswerPenalty:true,
            prompt:"Insert your four answers on the lines below.", leadLines:["Listen to this excerpt and identify four concepts in the music from those listed below.","You now have 15 seconds to read through the list of features."],
            conceptBank:conceptBank(["Song cycle","Sprechgesang","Aria","Antiphonal","Suspension","Chorale","Motet","Plainchant","Renaissance","Anthem"],["Suspension","Renaissance","Antiphonal","Anthem"]),
            answerDisplay:"Suspension, Renaissance, Antiphonal, Anthem", afterAnswerLines:["The music will be played twice with a pause of 10 seconds between playings and a pause of 40 seconds before part (b).","Here is the music for the first time.","Here is the music for the second time."] },
          short("q1b","(b)","Listen to a different excerpt and identify the type of work.",["Lied","Lieder","Song cycle"],"Lied"),
          short("q1c","(c)","Listen to a new excerpt. Identify the style.",["Contemporary jazz"],"Contemporary jazz",{allowFuzzy:false}),
        ],
      },
      {
        id:"q2", number:"2", marks:6, topic:"Instrumental music literacy", layout:"ah2018-literacy",
        audio:{clips:[clip(3,[{label:"(a)",time:6.43},{label:"(b)",time:274.07},{label:"(c)",time:429.86},{label:"(d)",time:609.95}])]},
        intro:"This question is based on instrumental music.",
        subquestions:[
          {id:"q2ai",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the missing notes and rest(s) in bar 12.",groupStart:{label:"(a)",prompt:"Listen and follow the guide to the music below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2018-q2a"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through parts (i) and (ii)."],notationTool:"note-entry",options:[],answer:"crotchetRest,E4,D4,E4,G4",acceptedAnswers:["crotchetRest,E4,D4,E4,G4","quaverRest,quaverRest,E4,D4,E4,G4"],answerDisplay:"Crotchet rest; E and D quavers; E and G crotchets.",completion:{type:"note-slots",count:5}},
          {id:"q2aii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Draw this sign above the two bars where the bass plays:",promptParts:{before:"Draw this sign",symbol:"bracket",after:"above the two bars where the bass plays:"},inlineScore:{sharedNotation:"ah-2018-q2bassphrase"},controlsAfterScore:true,notationTool:"bar-label",options:[{value:"Bracket",label:"Bracket",symbol:"bracket"}],answer:"bars-9-10",answerDisplay:"Bars 9 and 10 only.",afterAnswerLines:["The music will be played two more times, with 20 seconds between playings and 40 seconds before part (b).","You should write all your answers on the guide to the music above.","Here is the music for the second time.","Here is the music for the third time."]},
          {id:"q2b",label:"",marks:1,type:"notation-choice",sharedScore:true,prompt:"Using the rhythm provided and the chord information printed below the stave, complete the bass line in bars 3–5.",groupStart:{label:"(b)",prompt:"Bars 2–6 of the same music are shown below."},beforeAnswerLines:["The first and last bass notes (bars 2 and 6) have been inserted for you.","There will be no music played.","You have two minutes to complete your answer. A warning tone will sound 30 seconds before part (c)."],inlineScore:{sharedNotation:"ah-2018-q2b"},controlsAfterScore:true,notationTool:"note-entry",options:[],answer:"B3,A3,G3",acceptedAnswers:["B2,A2,G2","B2,A2,G3","B2,A2,G4","B2,A2,G5","B2,A3,G2","B2,A3,G3","B2,A3,G4","B2,A3,G5","B2,A4,G2","B2,A4,G3","B2,A4,G4","B2,A4,G5","B2,A5,G2","B2,A5,G3","B2,A5,G4","B2,A5,G5","B3,A2,G2","B3,A2,G3","B3,A2,G4","B3,A2,G5","B3,A3,G2","B3,A3,G3","B3,A3,G4","B3,A3,G5","B3,A4,G2","B3,A4,G3","B3,A4,G4","B3,A4,G5","B3,A5,G2","B3,A5,G3","B3,A5,G4","B3,A5,G5","B4,A2,G2","B4,A2,G3","B4,A2,G4","B4,A2,G5","B4,A3,G2","B4,A3,G3","B4,A3,G4","B4,A3,G5","B4,A4,G2","B4,A4,G3","B4,A4,G4","B4,A4,G5","B4,A5,G2","B4,A5,G3","B4,A5,G4","B4,A5,G5","B5,A2,G2","B5,A2,G3","B5,A2,G4","B5,A2,G5","B5,A3,G2","B5,A3,G3","B5,A3,G4","B5,A3,G5","B5,A4,G2","B5,A4,G3","B5,A4,G4","B5,A4,G5","B5,A5,G2","B5,A5,G3","B5,A5,G4","B5,A5,G5"],answerDisplay:"B, A and G semibreves; any octave is accepted.",completion:{type:"note-slots",count:3}},
          {id:"q2ci",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the time signature at the appropriate place in the music.",groupStart:{label:"(c)",prompt:"Listen to a new excerpt and follow the guide to the music below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2018-q2c"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through parts (i) and (ii)."],notationTool:"time-signature",options:[{value:"2/4",label:"2/4"},{value:"3/4",label:"3/4"},{value:"4/4",label:"4/4"},{value:"6/8",label:"6/8"},{value:"9/8",label:"9/8"},{value:"12/8",label:"12/8"},{value:"5/4",label:"5/4"}],answer:"5/4",acceptedAnswers:["5/4","5 4","2/4+3/4","2/4 + 3/4"],answerDisplay:"5/4 (or 2/4 + 3/4)."},
          {id:"q2cii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Re-write the boxed note in bar 9 one octave lower.",notationTool:"note-entry",options:[],answer:"A2",answerDisplay:"A in the first space of the bass stave; any note value is accepted.",noteSlots:1,completion:{type:"note-slots",count:1},afterAnswerLines:["The music will be played one more time with a pause of 40 seconds before part (d).","You should write all of your answers on the guide to the music above.","Here is the music."]},
          {id:"q2d",label:"",marks:1,type:"notation-choice",sharedScore:true,prompt:"Write [A] above the note in bars 15–16 that is harmonised by an Augmented triad.",groupStart:{label:"(d)",prompt:"Listen to a final excerpt from the same piece."},inlineScore:{sharedNotation:"ah-2018-q2d"},controlsAfterScore:true,notationTool:"bar-label",options:[{value:"A",label:"A"}],answer:"bar-16-fsharp",answerDisplay:"A above the F-sharp in bar 16.",afterAnswerLines:["You will hear the excerpt twice, with a pause of 20 seconds between playings.","Here is the excerpt for the first time.","Here is the excerpt for the second time."]},
        ],
      },
      {
        id:"q3",number:"3",marks:6,topic:"Instrumental music",layout:"ah2018-boxed-guide",guideBoxSubquestions:4,
        audio:{clips:[clip(4,[{label:"(a)",time:6.82},{label:"(b)",time:433.75},{label:"(c)",time:492.0}])]},
        intro:[
          "This question features instrumental music.",
          "In this excerpt you are required to complete the guide below by inserting appropriate music concepts.",
          "There will now be a pause of 30 seconds to allow you to read through the question.",
          "The music will be played three times with a pause of 20 seconds between playings and a pause of 30 seconds before part (b).",
          "In the first two playings a voice will help guide you through the music. There is no voice in the third playing.",
          "Here is the music for the first time.",
          "Here is the music for the second time.",
          "Here is the music for the third time.",
        ],
        introPartLabel:"(a)",introPartLabelIndex:1,introBoldPhrases:["three"],introCompactRange:[5,7],
        subquestions:[
          short("q3a1","1.","The ornament in the melody is a/an [answer].",["Turn"],"Turn",{inlineAnswer:{before:"The ornament in the melody is a/an",after:"."}}),
          short("q3a2","2.","The harmonic device heard is a/an [answer].",["Inverted pedal"],"Inverted pedal",{inlineAnswer:{before:"The harmonic device heard is a/an",after:"."}}),
          short("q3a3","3.","The prominent solo instrument is a/an [answer].",["Bassoon"],"Bassoon",{inlineAnswer:{before:"The prominent solo instrument is a/an",after:"."}}),
          short("q3a4","4.","The type of work is a/an [answer].",["Concerto","Solo concerto"],"Concerto",{inlineAnswer:{before:"The type of work is a/an",after:"."},forbiddenExactKeywordGroups:[["concerto","grosso"]]}),
          {id:"q3b",label:"(b)",marks:1,type:"radio",prompt:"Listen to a new excerpt and identify the prominent chord featured.",options:["Augmented triad","Added 6th","Cluster","Diminished 7th"].map(label=>({value:label,label})),answer:"Diminished 7th",answerDisplay:"Diminished 7th",afterAnswerLines:["The excerpt will be played twice.","Here is the music for the first time.","Here is the music for the second time."]},
          short("q3c","(c)","Listen to a further excerpt and identify the type of group playing.",["Piano trio","Chamber group"],"Piano trio",{forbiddenKeywordGroups:[["chamber","music"]]}),
        ],
      },
      {
        id:"q4", sourceNotationLabelWeights: {"(a) Key:": 400, "(b) Cadence:": 400, "(c) Enharmonic note": 400},number:"4",marks:4,topic:"Vocal music literacy",layout:"ah2018-literacy",
        audio:{clips:[clip(5,[{label:"Guide",time:6.68},{label:"2nd",time:211.2},{label:"3rd",time:288.76}])]},
        intro:["This question features vocal music.","Listen to the excerpt and follow the guide to the music which is printed below.","Here is the music.","You now have 2 minutes to read through the questions."],score:{sharedNotation:"ah-2018-q4"},
        subquestions:[
          short("q4a","(a)","Write the name of the key in the box above bar 1.",["E minor","Em"],"E minor",{answerInScore:true,allowFuzzy:false}),
          short("q4b","(b)","Identify the cadence in bar 3.",["Imperfect cadence","Imperfect"],"Imperfect cadence",{answerInScore:true}),
          {id:"q4c",label:"(c)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Write the enharmonic equivalent of the boxed note in bar 5. Write your answer on the stave below bar 5.",promptLines:["Write the enharmonic equivalent of the boxed note in bar 5.","Write your answer on the stave below bar 5."],markAlign:"prompt-end",inlineNotationControls:true,notationTool:"note-entry",allowAccidentalEntry:true,options:[],answer:"A#4",acceptedAnswers:["A#4","A♯4"],answerDisplay:"A-sharp on the second space; any note value is accepted.",noteSlots:1,completion:{type:"note-slots",count:1}},
          short("q4d","(d)","Identify the harmonic device used in the final bar.",["Tierce de Picardie","Tierce de picardy","Picardy third","Picardie third"],"Tierce de Picardie",{answerInScore:true,afterAnswerLines:["You will now hear the music two more times, with 20 seconds between playings and a pause of 1 minute before the next question begins.","You should write all your answers on the guide to the music above.","Here is the music for the second time.","Here is the music for the third time."],afterAnswerBoldPhrases:["two","You should write all your answers on the guide to the music above."]}),
        ],
      },
      {
        id:"q5", sourceNotationLabelWeights: {"Voice": 400},number:"5",marks:8,topic:"Orchestral and vocal music",layout:"ah2018-q5",
        audio:{clips:[clip(6,[{label:"(a)",time:8.09},{label:"(b)",time:239.16},{label:"(c)",time:365.77},{label:"(d)",time:441.01},{label:"(e)",time:515.35}])]},
        intro:"This question features orchestral and vocal music.",
        subquestions:[
          {id:"q5a",label:"(a)",marks:4,type:"concept-lines",lines:4,requiredResponses:4,additionalAnswerPenalty:true,prompt:"Insert your four answers on the lines below.",leadLines:["Listen to this excerpt and identify four concepts in the music from those listed below.","You now have 15 seconds to read through the list of features."],conceptBank:conceptBank(["Modulation","Diminution","Minimalist","Modal","Rubato","Augmentation","Chamber music","Tremolando","Inverted pedal","Canon"],["Modulation","Augmentation","Inverted pedal","Canon"]),answerDisplay:"Modulation, Augmentation, Inverted pedal, Canon",afterAnswerLines:["The music will be played twice with a pause of 10 seconds between playings and a pause of 40 seconds before part (b).","Here is the music for the first time.","Here is the music for the second time."]},
          {id:"q5b",label:"(b)",marks:1,type:"radio",prompt:"Listen to a vocal version of the same melody which begins with a short instrumental introduction. Tick one box to identify the correct version of the music.",promptLines:["Listen to a vocal version of the same melody which begins with a short instrumental introduction.","Tick one box to identify the correct version of the music."],promptBoldPhrases:["one"],markAlign:"prompt-end",beforeAnswerLines:["You now have 30 seconds to read through the possible answers.","The excerpt is short and will be played three times.","Here is the music for the first time.","Here is the music for the second time.","Here is the music for the third time."],beforeAnswerBoldPhrases:["three"],options:[0,1,2].map((optionIndex,index)=>({value:String(index+1),label:`Version ${index+1}`,notationScore:{sharedNotation:"ah-2018-q5b",optionIndex}})),answer:"2",answerDisplay:"The second version"},
          short("q5c","(c)","Listen to a new excerpt. Identify the concept that describes the prominent feature of the rhythm.",["Time changes","Irregular time signatures","Changing time signatures"],"Time changes",{promptLines:["Listen to a new excerpt.","Identify the concept that describes the prominent feature of the rhythm."],markAlign:"prompt-end",forbiddenKeywordGroups:[["3","against","2"],["triplets"]],beforeAnswerLines:["The music will be played twice.","Here is the music for the first time.","Here is the music for the second time."],beforeAnswerBoldPhrases:["twice"]}),
          {id:"q5d",label:"(d)",marks:1,type:"radio",prompt:"Listen to a new excerpt. Tick one box to indicate the order in which the 4 different woodwind instruments play.",promptLines:["Listen to a new excerpt.","Tick one box to indicate the order in which the 4 different woodwind instruments play."],promptBoldPhrases:["one"],markAlign:"prompt-end",beforeAnswerLines:["You now have 20 seconds to read through the possible answers.","The excerpt is very short and will be played twice.","Here is the music for the first time.","Here is the music for the second time."],beforeAnswerBoldPhrases:["twice"],options:["Clarinet, Oboe, Piccolo, Flute","Clarinet, Piccolo, Oboe, Flute","Oboe, Piccolo, Clarinet, Flute","Oboe, Flute, Piccolo, Clarinet"].map((label,index)=>({value:String(index+1),label})),answer:"3",answerDisplay:"Oboe, Piccolo, Clarinet, Flute"},
          short("q5e","(e)","Identify the cadence that is heard three times at the end of the excerpt.",["Plagal","Plagal cadence","IV-I","IV to I"],"Plagal cadence",{promptBoldPhrases:["three"],forbiddenExactKeywordGroups:[["amen"]],beforeAnswerLines:["The music will be played once only."],beforeAnswerBoldPhrases:["once"]}),
        ],
      },
      {
        id:"q6",number:"6",marks:10,topic:"Comparative analysis",
        audio:{clips:[clip(7,[{label:"(a)",time:8.25},{label:"1",time:58.62},{label:"2",time:186.86},{label:"1",time:303.38},{label:"2",time:431.92},{label:"(b)",time:788.21},{label:"1",time:852.24},{label:"2",time:980.67},{label:"1",time:1097.17},{label:"2",time:1225.69}])]},
        intro:["In this question you are asked to comment on two excerpts of music.","Listen to each excerpt. For each excerpt identify at least two prominent concepts from each of the following categories:","Melody/harmony","Texture/structure/form/timbre","Both excerpts will be played twice, with a pause of 15 seconds between playings, and a pause of 4 minutes at the end for you to complete your final answer.","You may use the table below for rough working, but your final answer must be written in the final answer section.","Your final answer could be bullet points or short answers identifying the concepts you have heard.","Here is Excerpt 1 for the first time.","Here is Excerpt 2 for the first time.","Here is Excerpt 1 for the second time.","Here is Excerpt 2 for the second time.","You now have 4 minutes to identify at least four concepts in each excerpt.","A warning tone will sound 30 seconds before the start of part (b)."],
        introPartLabels:{1:"(a)"},introBulletRange:[2,3],introCompactRanges:[[7,8],[9,10]],introBoldPhrases:["two prominent","Melody/harmony","Texture/structure/form/timbre","twice","four"],
        subquestions:[
          {id:"q6a1",label:"(i)",marks:2,type:"structured-review",prompt:"Excerpt 1",sourceHeading:"Excerpt 1",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"Rough Work",roughWorkIntro:"For each excerpt identify at least two prominent concepts in each of the following categories:",roughWorkBullets:["Melody/harmony","Texture/structure/form/timbre"],roughWorkBoldPhrases:["two prominent","Melody/harmony","Texture/structure/form/timbre"],roughWorkSheet:true,roughWorkColumns:["Excerpt 1","Excerpt 2"],finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"FINAL ANSWER",sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:excerpt1Melody},{id:"texture",label:"Texture/structure/form/timbre",concepts:excerpt1Texture}]},
          {id:"q6a2",label:"(ii)",marks:2,type:"structured-review",prompt:"Excerpt 2",sourceHeading:"Excerpt 2",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:9,hideFinalHeading:true,sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:excerpt2Melody},{id:"texture",label:"Texture/structure/form/timbre",concepts:excerpt2Texture}]},
          {id:"q6bi",label:"(i)",marks:4,type:"structured-review",prompt:"Analysis",sourceHeading:"Analysis",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"ROUGH WORK",roughWorkLines:18,finalAnswerField:true,finalAnswerLines:16,finalAnswerHeading:"FINAL ANSWER",sourceHeadingPosition:"final",endOfPaper:false,finalAnswerIntro:["Comment on six similarities/differences you hear in the excerpts.","Your final answer should be a written description of what you have heard and not simply a list of similarities/differences."],leadIntro:{intro:["Analyse the two excerpts you have just heard.","In your extended answer you should refer to six similarities/differences across the following categories:","Type of work","Melody/harmony","Texture/structure/form/timbre","Conclude your analysis with a statement on the style/period of each excerpt and justify your answer.","You will hear each excerpt two more times, with a pause of 15 seconds between playings, and a further 10 minutes to complete your answers for part (i) and part (ii).","Rough work will not be marked.","You should write your final answers in the final answer section.","Here is Excerpt 1 for the third time.","Here is Excerpt 2 for the third time.","Here is Excerpt 1 for the last time.","Here is Excerpt 2 for the last time.","You now have 10 minutes to complete your analysis and conclusion.","A warning tone will sound 30 seconds before the end of the question paper."],introPartLabels:{0:"(i)",5:"(ii)"},introBulletRange:[2,4],introCompactRanges:[[9,10],[11,12]],introBoldPhrases:["Analyse","six similarities/differences","Type of work","Melody/harmony","Texture/structure/form/timbre","Conclude","style/period","justify","10 minutes","Rough work will not be marked."]},markingProfile:"advanced-comparison",groupStart:{label:"(b)",prompt:"This question has two parts."},
            similarities:[concept("Appoggiatura"),concept("Arpeggios or broken chords",["arpeggios","arpeggio","broken chords"]),concept("Chromatic",["chromatic","chromaticism"],{excludeWithinAnswers:["chromatic scale","chromatic scales"]}),concept("Dominant 7th chord",["dominant 7th","dominant seventh","V7"]),concept("Homophonic"),concept("Major"),concept("Orchestra"),concept("Perfect cadence",["perfect cadence","V-I","V I"]),concept("Pizzicato"),concept("Sequence"),concept("Syllabic"),concept("Timpani"),concept("Vamp")],
            differences:[
              {label:"Aria/opera and musical",first:["aria","opera"],second:["musical"]},
              {label:"Soprano and male trio",first:["soprano"],second:["tenors","baritones","male trio","tenor and baritone","tenors and baritone","tenor and baritones","small group of male voices"]},
              {label:"Melismatic only in Excerpt 1",first:["melismatic"],only:1}, {label:"Triangle or harp only in Excerpt 1",first:["triangle","harp"],only:1},
              {label:"Modern orchestra features only in Excerpt 2",second:["cymbal","drum kit","trumpet","fanfare"],only:2},
              {label:"Acciaccatura only in Excerpt 1",first:["acciaccatura"],only:1}, {label:"Cadenza or coloratura only in Excerpt 1",first:["cadenza","coloratura"],only:1},
              {label:"Added chords only in Excerpt 2",second:["added 6th","added sixth","added chords"],only:2}, {label:"Ternary only in Excerpt 1",first:["ternary"],only:1},
              {label:"Polyphonic features only in Excerpt 2",second:["canon","contrapuntal","polyphonic","imitation","fugal","contrary motion","unison"],only:2},
            ],headings:[{id:"analysis",label:"Analysis",concepts:[]}],answerDisplay:"Six valid similarities/differences earn 4 marks; four or five earn 3; two or three earn 2; one earns 1. A list is capped at 2 marks."},
          {id:"q6bii",label:"(ii)",marks:2,type:"structured-review",prompt:"Conclusion",sourceHeading:"Conclusion",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:10,hideFinalHeading:true,sourceHeadingPosition:"final",finalAnswerIntro:["Write a statement on the style/period of each excerpt and justify your answer."],markingProfile:"advanced-conclusion",endOfPaper:true,headings:[{id:"conclusion",label:"Conclusion",concepts:[concept("Excerpt 1: Romantic"),concept("Excerpt 2: 20th-century, Modern or Popular")]}],styles:[
  {
    "answers": [
      "romantic"
    ],
    "wrongStyles": [
      "renaissance",
      "baroque",
      "classical",
      "impressionist",
      "minimalist",
      "serial",
      "atonal",
      "modern",
      "20th century",
      "twentieth century",
      "popular"
    ],
    "reasons": [],
    "reasonConcepts": [
      {
        "label": "Large / symphony orchestra",
        "answers": [
          "large orchestra",
          "larger orchestra",
          "full orchestra",
          "symphony orchestra",
          "symphonic orchestra",
          "expanded orchestra",
          "large orchestral forces",
          "wider range of instruments",
          "wide range of instruments",
          "greater variety of instruments"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Triangle / harp",
        "answers": [
          "triangle",
          "harp"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Chromatic harmony",
        "answers": [
          "chromaticism",
          "chromatic harmony",
          "chromatic harmonies",
          "chromatic passages",
          "chromatic notes",
          "chromatic chords",
          "chromatic"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Diminished-seventh harmony",
        "answers": [
          "diminished 7th",
          "diminished seventh"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Rubato",
        "answers": [
          "rubato",
          "flexible tempo",
          "freedom of tempo",
          "expressive tempo changes",
          "speeds up and slows down expressively"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Wide / virtuosic vocal range",
        "answers": [
          "wide range of the soprano",
          "wide soprano range",
          "wide vocal range",
          "large vocal range",
          "wide range of the voice",
          "coloratura",
          "colouratura",
          "vocal cadenza",
          "virtuosic singing",
          "virtuosic voice",
          "virtuosic vocal",
          "florid scale passages",
          "florid vocal passages",
          "rich string sound",
          "richer string sound"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2018 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  },
  {
    "answers": [
      "20th century",
      "twentieth century",
      "modern",
      "popular"
    ],
    "blocked": [
      "contemporary"
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
        "label": "Jazz harmony",
        "answers": [
          "jazz harmony",
          "jazzy harmony"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Musical-theatre / big-band instrumentation",
        "allTermGroups": [
          [
            "saxophone",
            "saxophones",
            "clarinet",
            "clarinets",
            "trumpet",
            "trumpets",
            "muted trumpet",
            "muted trumpets"
          ],
          [
            "drum kit",
            "drumkit"
          ]
        ],
        "allowFuzzy": false
      },
      {
        "label": "Musical-theatre orchestra",
        "answers": [
          "theatre orchestra",
          "theater orchestra",
          "musical theatre orchestra",
          "musical theater orchestra"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Muted / close-harmony trumpets",
        "answers": [
          "muted trumpet",
          "muted trumpets",
          "close harmony trumpets",
          "trumpets in close harmony"
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
        "label": "Non-operatic / straight vocal style",
        "answers": [
          "not operatic",
          "non operatic",
          "nonoperatic",
          "without vibrato",
          "no vibrato",
          "sing straight",
          "straight singing",
          "straight voices",
          "american accent"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2018 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
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
