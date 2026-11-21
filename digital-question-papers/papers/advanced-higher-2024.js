(function(root) {
  "use strict";

  const concept = (label, answers = [label], extra = {}) => ({ label, answers, ...extra });
  const paired = (label, allTermGroups, extra = {}) => concept(label, [], { allTermGroups, allowFuzzy:false, ...extra });
  const conceptBank = (labels, correct) => labels.map(label => ({ label, answers:[label], correct:correct.includes(label) }));
  const clip = (track, markers) => ({
    file:`../exampapers/adv higher/2024/Music AH 2024 - Track ${String(track).padStart(2,"0")}-1.m4a`,
    label:"Question audio", maxPlaysExam:1, markers,
  });
  const short = (id, label, prompt, acceptedAnswers, answerDisplay, extra = {}) => ({
    id, label, marks:1, type:"short-text", prompt, acceptedAnswers, answerDisplay,
    capitaliseAnswer:true, ...extra,
  });

  const firstChord = ["G first inversion","G 1st inversion","G/B","G major first inversion","Ib","I b","1b","1 b","G Maj/B","G Maj 1st Inv","I 1st Inv","I first inversion","1 1st Inv","1 first inversion"];
  const secondChord = ["C","C major","C maj","IV","IVa","4","4a"];
  const thirdChord = ["D","D major","D maj","V","Va","5","5a"];
  const chordTriples = firstChord.flatMap(first => secondChord.flatMap(second => thirdChord.flatMap(third => [
    `${first}, ${second}, ${third}`,`${first}; ${second}; ${third}`,`${first} / ${second} / ${third}`,
  ])));

  const excerpt1Melody = [
    concept("Change of key or modulation",["change of key","key change","modulation","modulates"]),
    concept("Dominant 7th",["dominant 7th","dominant seventh","V7"]),
    concept("Imperfect or perfect cadence",["imperfect cadence","perfect cadence","I-V","V-I"]),
    concept("Major"), concept("Octave leaps",["octave leap","octave leaps","octaves"]),
    concept("Sequence"), concept("Suspension"), concept("Trill",["trill","trills"]),
  ];
  const excerpt1Texture = [
    concept("3/4 and 4/4, time changes or simple time",["3/4 and 4/4","3 4 and 4 4","time changes","change of time","simple time","3 and 4 beats"]),
    concept("Anacrusis"), concept("Antiphonal or imitation",["antiphonal","imitation","canon","fugal"],{blockedAnswers:["fugue","question and answer"]}),
    concept("Concertino or solo strings",["concertino","solo strings","solo violins"],{blockedAnswers:["solo violin"]}),
    concept("Concerto grosso"), concept("Dotted rhythms",["dotted rhythm","dotted rhythms"]),
    concept("Harpsichord or basso continuo",["harpsichord","basso continuo"]), concept("Hemiola"),
    paired("Homophonic and polyphonic or contrapuntal",[["homophonic"],["polyphonic","polyphony","contrapuntal","counterpoint"]]),
    concept("Ripieno or group of strings",["ripieno","strings","group of strings","string group"],{blockedAnswers:["orchestra","baroque orchestra","chamber orchestra","string quartet"]}),
  ];
  const excerpt2Melody = [
    concept("Acciaccatura",["acciaccatura","acciaccaturas"],{blockedAnswers:["grace note","grace notes","ornamentation"]}),
    concept("Broken chord or arpeggio",["broken chord","broken chords","arpeggio","arpeggios"]),
    concept("Chromatic or chromatic scale",["chromatic","chromaticism","chromatic scale"]),
    concept("Contrary motion"), concept("Dissonance or discords",["dissonance","dissonant","discord","discords"]),
    paired("Major and minor or change of key",[["major"],["minor"]],{answers:["change of key","changes of key","key change","key changes"],blockedAnswers:["modulation"]}),
    concept("Octave leaps",["octave leap","octave leaps","octaves"]), concept("Pedal or inverted pedal",["pedal","pedal note","pedal point","inverted pedal","inverted pedal point"]),
    concept("Perfect cadence",["perfect cadence","V-I","V I"]), concept("Sequence"), concept("Trill",["trill","trills"]), concept("Whole-tone scale",["whole tone scale","whole-tone scale"]),
  ];
  const excerpt2Texture = [
    concept("2/4, 4/4 or simple time",["2/4","4/4","two four","four four","simple time"]),
    concept("Accents or sforzando",["accent","accents","accented","sfz","sforzando"]),
    concept("Antiphonal or imitation",["antiphonal","imitation"]),
    concept("Flutes, piccolos, oboes or bassoons",["flute","flutes","piccolo","piccolos","oboe","oboes","bassoon","bassoons"],{blockedAnswers:["woodwind"]}),
    concept("Homophonic"),
    concept("Horns, trumpets, trombones or tubas",["horn","horns","trumpet","trumpets","trombone","trombones","tuba","tubas"],{blockedAnswers:["brass"]}),
    concept("Orchestra",["orchestra","orchestral","strings woodwind brass and percussion","strings, woodwind, brass and percussion"]),
    concept("Staccato"), concept("Syncopation",["syncopation","syncopated"]),
    concept("Tambourine, triangle, cymbals or tam-tam",["tambourine","triangle","cymbal","cymbals","tam tam","tam-tam"],{blockedAnswers:["percussion"]}),
    concept("Triplets",["triplet","triplets"]),
  ];

  const paper = {
    id:"advanced-higher-2024", title:"Advanced Higher Music 2024", level:"Advanced Higher", levelCode:"AH", year:2024,
    totalMarks:40, openingInstructions:["Total marks — 40","Attempt ALL questions"], estimatedMinutes:75,
    sourcePath:"../exampapers/adv higher/2024/Music AH 2024 Paper.pdf",
    markingInstructionsPath:"../exampapers/adv higher/2024/Music AH 2024 Answers.pdf",
    attribution:"Original question paper and audio content © Qualifications Scotland. Interactive adaptation created independently for non-commercial educational use. This resource is not endorsed by Qualifications Scotland.",
    questions:[
      {
        id:"q1",number:"1",marks:6,layout:"ah2022-q1",topic:"Orchestral music",
        audio:{clips:[clip(2,[{label:"(a)",time:6.29},{label:"(b)",time:236.04},{label:"(c)",time:306.11}])]},
        intro:"This question features orchestral music.",subquestions:[
          {id:"q1a",label:"(a)",marks:4,type:"concept-lines",lines:4,requiredResponses:4,additionalAnswerPenalty:true,prompt:"Give your four answers on the lines below.",leadLines:["Listen to this excerpt and identify four concepts in the music from those listed below.","You now have 15 seconds to read the list before hearing the music."],conceptBank:conceptBank(["Atonal","Con sordino","Antiphonal","Stretto","Passacaglia","Triplets","Harmonics","Serial","Tritone","Obbligato"],["Antiphonal","Con sordino","Triplets","Tritone"]),answerDisplay:"Antiphonal, Con sordino, Triplets, Tritone",afterAnswerLinesBeforePrompt:1,afterAnswerLines:["The music will be played twice with 10 seconds between playings. You will then have 40 seconds to complete your answer.","Here is the music for the first time.","Here is the music for the second time."]},
          short("q1b","(b)","Listen to a different excerpt and identify the rhythmic device that is heard in the melody.",["Augmentation"],"Augmentation",{markAlign:"prompt-end",allowFuzzy:false,afterAnswerLinesBeforeAnswer:3,afterAnswerLines:["The excerpt will be heard twice.","Here is the excerpt for the first time.","Here is the excerpt for the second time."]}),
          {id:"q1c",label:"(c)",markAlign:"prompt-end",promptLines:["Listen to a new excerpt.","Tick (✓) one box to indicate the order in which the woodwind and brass instruments play the melody."],marks:1,type:"radio",prompt:"Listen to a new excerpt. Tick (✓) one box to indicate the order in which the woodwind and brass instruments play the melody.",beforeAnswerLines:["You now have 20 seconds to read through the possible answers.","The excerpt will be played twice.","Here is the excerpt for the first time.","Here is the excerpt for the second time."],options:["Flute, French horn, Bassoon, French horn, Clarinet","Flute, French horn, Oboe, French horn, Clarinet","Clarinet, French horn, Oboe, Trombone, Flute"].map((label,index)=>({value:String(index+1),label})),answer:"2",answerDisplay:"Flute, French horn, Oboe, French horn, Clarinet"},
        ],
      },
      {
        id:"q2",number:"2",marks:5,topic:"Song literacy",layout:"ah2024-literacy",
        audio:{clips:[clip(3,[{label:"(a)",time:6.78},{label:"(b)",time:197.83},{label:"(c)",time:357.45}])]},
        intro:"This question is based on a song.",subquestions:[
          short("q2ai","(i)","Identify the cadence in bars 4 and 5.",["Imperfect","Imperfect cadence","ii-V","ii V","2-5","I-V","I V","1-5","IV-V","IV V","4-5"],"Imperfect cadence (ii–V, I–V or IV–V)",{answerInScore:true,allowFuzzy:false,groupStart:{label:"(a)",prompt:"Listen to the complete piece and follow the guide to the music below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2024-q2a"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through parts (i) and (ii)."]}),
          {id:"q2aii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Write ‘M’ above a bar with melismatic word-setting.",notationTool:"bar-label",options:[{value:"M",label:"M"}],answer:"bar-1-M",acceptedAnswers:["bar-1-M","bar-3-M","bar-4-M","bar-11-M"],answerDisplay:"M above any one of bars 1, 3, 4 or 11.",afterAnswerLines:["The music for bars 1 to 12 will be played two more times with 20 seconds between playings and 30 seconds before part (b).","You should write your answers on the guide to the music above.","Here is the music for the second time.","Here is the music for the third time."]},
          short("q2b","(b)","Identify the boxed chords used in bar 11. You should indicate the chord name or number and, where appropriate, 1st or 2nd inversion.",chordTriples,"G first inversion (G/B or Ib), C major (IV) and D major (V)",{answerInScore:true,allowFuzzy:false,promptLines:["Identify the boxed chords used in bar 11. You should indicate the chord name or number and, where appropriate, 1st or 2nd inversion.","The chord in bar 12 has been given.","There will be no music played.","You now have two minutes to complete your answer. A warning tone will sound 15 seconds before part (c)."],markAlign:"prompt-end",inlineScore:{sharedNotation:"ah-2024-q2b"},clearOnOwnRow:true}),
          short("q2ci","(i)","The music changes key at bar 13. Write the name of the new key in the box above bar 13.",["E minor","E min","Em"],"E minor",{answerInScore:true,allowFuzzy:false,groupStart:{label:"(c)",prompt:"Listen to a continuation of this extract and follow the guide to the music below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2024-q2c"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through parts (i) and (ii)."]}),
          {id:"q2cii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the appropriate accidental in bar 17 to make the music match what you hear.",notationTool:"accidental",options:[{value:"natural",label:"Natural"},{value:"flat",label:"Flat"},{value:"sharp",label:"Sharp"}],accidentalNoteIndices:[1],answer:"sharp",answerDisplay:"A sharp before D on the fourth line in bar 17.",afterAnswerLines:["The music for bars 9 to 23 will be played two more times with 20 seconds between playings and 30 seconds to complete your answers.","You should write your answers on the guide to the music above.","Here is the music for the second time.","Here is the music for the third time."]},
        ],
      },
      {
        id:"q3",number:"3",marks:7,topic:"Music in different styles",layout:"ah-boxed-guide",guideBoxSubquestions:4,guideBoxStartIndex:2,guideIntro:{label:"(c)",prompt:"Listen to the next excerpt and complete the guide below by inserting music concepts.",lines:["The music will be played three times with 20 seconds between playings. You will then have 30 seconds to complete your answers.","There will now be 30 seconds to allow you to read through the question.","In the first two playings a voice will help guide you through the music. There is no voice in the third playing.","Here is the music for the first time.","Here is the music for the second time.","Here is the music for the third time."]},
        audio:{clips:[clip(4,[{label:"(a)",time:7.19},{label:"(b)",time:54.01},{label:"(c)",time:103.67},{label:"(d)",time:399.63}])]},
        intro:"This question features music in different styles.",subquestions:[
          {id:"q3a",label:"(a)",marks:1,type:"radio",prompt:"Listen to this excerpt and tick (✓) one box to identify what you hear.",options:["Diminished 7th","Polytonality","Turn","Suspension"].map(label=>({value:label,label})),answer:"Polytonality",answerDisplay:"Polytonality"},
          short("q3b","(b)","Listen to a further excerpt and identify the rhythmic device used.",["Diminution"],"Diminution",{allowFuzzy:false,afterAnswerLinesBeforeAnswer:3,afterAnswerLines:["The excerpt will be played twice.","Here is the excerpt for the first time.","Here is the excerpt for the second time."]}),
          short("q3c1","1.","The ornament is a/an [answer].",["Acciaccatura"],"Acciaccatura",{inlineAnswer:{before:"The ornament is a/an",after:"."},allowFuzzy:false}),
          short("q3c2","2.","The type of scale is a/an [answer].",["Chromatic","Chromatic scale"],"Chromatic or chromatic scale",{inlineAnswer:{before:"The type of scale is a/an",after:"."},allowFuzzy:false}),
          short("q3c3","3.","The cadence is a/an [answer].",["Interrupted","Interrupted cadence","V-vi","V vi","5-6","5 to 6"],"Interrupted cadence (V–vi)",{inlineAnswer:{before:"The cadence is a/an",after:"."},allowFuzzy:false}),
          short("q3c4","4.","The type of chord is a/an [answer].",["Diminished","Diminished triad","Dim","Dim triad","Diminished 7th","Diminished seventh","Dim7","Dim 7th"],"Diminished triad or diminished 7th",{inlineAnswer:{before:"The type of chord is a/an",after:"."},allowFuzzy:false}),
          short("q3d","(d)","Listen to a new excerpt. Identify the style of the music.",["Electronic Dance Music","EDM","Electronic dance"],"Electronic Dance Music (EDM)",{allowFuzzy:false,caseSensitiveRejectedAnswers:["Electric Dance Music","Electric dance"]}),
        ],
      },
      {
        id:"q4",number:"4",marks:4,topic:"Alto saxophone literacy",layout:"ah2024-literacy",
        audio:{clips:[clip(5,[{label:"(a)",time:7.76},{label:"(b)",time:162.38}])]},intro:"This question features a piece for alto saxophone.",subquestions:[
          {id:"q4ai",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Write the enharmonic equivalent of the boxed note in the first bar. Write your answer on the stave below the first bar.",notationTool:"note-entry",allowAccidentalEntry:true,promptLines:["Write the enharmonic equivalent of the boxed note in the first bar.","Write your answer on the stave below the first bar."],markAlign:"prompt-end",options:[],answer:"Db4",acceptedAnswers:["Db4","D♭4"],answerDisplay:"D-flat below the treble stave; any note value or stem direction is accepted.",noteSlots:1,completion:{type:"note-slots",count:1},groupStart:{label:"(a)",prompt:"Listen to the excerpt and follow the guide to the music which is printed below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2024-q4a"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 20 seconds to read through parts (i) and (ii)."]},
          short("q4aii","(ii)","Identify the interval between the two boxed notes in bar 6.",["Diminished 5th","Diminished fifth","Tritone"],"Diminished 5th or tritone",{promptLines:["Identify the interval between the two boxed notes in bar 6.","Write your answer on the line below."],markAlign:"prompt-end",allowFuzzy:false,caseSensitiveRejectedAnswers:["5th","Fifth","Augmented 4th","Augmented fourth"],afterAnswerLines:["The music will be played two more times with 20 seconds between playings.","You will then have 30 seconds to complete your answers before hearing part (b).","Here is the music for the second time.","Here is the music for the third time."]}),
          {id:"q4bi",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the missing notes in bar 25.",notationTool:"note-entry",options:[],answer:"C5,Bb4,A4",acceptedAnswers:["C5,Bb4,A4","C5,B♭4,A4"],answerDisplay:"C, B-flat and A as a crotchet triplet; the triplet sign may be above or below the notes.",noteSlots:3,completion:{type:"note-slots",count:3},groupStart:{label:"(b)",prompt:"Listen to a further excerpt and follow the guide to the music below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2024-q4b"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 20 seconds to read through parts (i) and (ii)."]},
          {id:"q4bii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Re-write the boxed notes in bar 30 one octave lower.",notationTool:"note-entry",allowAccidentalEntry:true,options:[],answer:"Eb3,Bb2,Bb2",acceptedAnswers:["Eb3,Bb2,Bb2","E♭3,B♭2,B♭2"],answerDisplay:"E-flat quaver, B-flat quaver tied to B-flat crotchet, one octave lower in bass clef.",noteSlots:3,completion:{type:"note-slots",count:3},afterAnswerLines:["The music will be played two more times with 20 seconds between playings.","You will then have 40 seconds to complete your answers before the next question starts.","You should write all your answers on the guide to the music.","Here is the music for the second time.","Here is the music for the third time."]},
        ],
      },
      {
        id:"q5",number:"5",marks:8,topic:"Orchestral music",
        audio:{clips:[clip(6,[{label:"(a)",time:6.97},{label:"(b)",time:209.63},{label:"(c)",time:270.23},{label:"(d)",time:331.75},{label:"(e)",time:448.45}])]},intro:"This question features orchestral music.",subquestions:[
          {id:"q5a",label:"(a)",marks:4,type:"concept-lines",lines:4,requiredResponses:4,additionalAnswerPenalty:true,prompt:"Give your four answers on the lines below.",leadLines:["Listen to this excerpt and identify four concepts in the music from those listed below.","You now have 15 seconds to read the list before hearing the music."],conceptBank:conceptBank(["Sonata","Perfect cadence","Dominant 7th","Harmonics","Impressionist","Neoclassical","Interrupted cadence","Appoggiatura","Classical","Alberti bass"],["Appoggiatura","Classical","Dominant 7th","Perfect cadence"]),answerDisplay:"Appoggiatura, Classical, Dominant 7th, Perfect cadence",afterAnswerLinesBeforePrompt:1,afterAnswerLines:["The music will be played twice with 10 seconds between playings. You will then have 40 seconds to complete your answer.","Here is the music for the first time.","Here is the music for the second time."]},
          short("q5b","(b)","Listen to a new excerpt and identify the ornament heard at the start of each woodwind phrase.",["Turn"],"Turn",{markAlign:"prompt-end",allowFuzzy:false,afterAnswerLinesBeforeAnswer:3,afterAnswerLines:["The excerpt will be played twice.","Here is the excerpt for the first time.","Here is the excerpt for the second time."]}),
          short("q5c","(c)","Listen to a new excerpt and describe the time signature.",["Irregular time signatures","Irregular time signature","Irregular","Irregular metre","Irregular meter","Time changes","Change of time","5/4","Five four"],"Irregular time signatures (time changes or 5/4 also accepted)",{allowFuzzy:false,markAlign:"prompt-end",promptLines:["Listen to a new excerpt and describe the time signature.","The excerpt will be played twice."],afterAnswerLinesBeforeAnswer:2,afterAnswerLines:["Here is the excerpt for the first time.","Here is the excerpt for the second time."]}),
          {id:"q5d",label:"(d)",flowArrow:{width:62,height:28,shaftInset:26,hollow:true},markAlign:"prompt-end",promptLines:["Listen to a new excerpt.","Tick (✓) one box to indicate the order in which the different instruments\nenter."],marks:1,type:"radio",prompt:"Listen to a new excerpt. Tick (✓) one box to indicate the order in which the different instruments enter.",beforeAnswerLines:["You now have 20 seconds to read through the possible answers.","The excerpt will be played twice.","Here is the excerpt for the first time.","Here is the excerpt for the second time."],options:[
            {value:"1",label:"Piano and Double bass; Percussion and Saxophone; Horn",flowParts:["Piano|and|Double bass","Percussion|and|Saxophone","Horn"]},
            {value:"2",label:"Piano and Guitar; Percussion and Bassoon; Trombone",flowParts:["Piano|and|Guitar","Percussion|and|Bassoon","Trombone"]},
            {value:"3",label:"Piano and Double bass; Percussion and Bassoon; Horn",flowParts:["Piano|and|Double bass","Percussion|and|Bassoon","Horn"]},
            {value:"4",label:"Piano and Double bass; Percussion and Saxophone; Trombone",flowParts:["Piano|and|Double bass","Percussion|and|Saxophone","Trombone"]},
          ],answer:"1",answerDisplay:"Piano and Double bass; Percussion and Saxophone; Horn"},
          {id:"q5e",label:"(e)",markAlign:"prompt-end",marks:1,type:"radio",prompt:"Listen to a new excerpt and tick (✓) one box to indicate the rhythm played on the wood block.",promptLines:["Listen to a new excerpt and tick (✓) one box to indicate the rhythm played on\nthe wood block."],beforeAnswerLines:["The excerpt is short and begins with a 4-bar introduction.","You now have 30 seconds to read though the possible answers.","You will hear the excerpt three times.","Here is the excerpt for the first time.","Here is the excerpt for the second time.","Here is the excerpt for the third time."],options:[0,1,2].map((optionIndex,index)=>({value:String(index+1),label:`Rhythm ${index+1}`,notationScore:{sharedNotation:"ah-2024-q5e",optionIndex}})),answer:"3",answerDisplay:"The third rhythm"},
        ],
      },
      {
        id:"q6",number:"6",marks:10,topic:"Comparative analysis",
        audio:{clips:[clip(7,[{label:"(a)",time:8.65},{label:"1",time:61.73},{label:"2",time:176.90},{label:"1",time:302.18},{label:"2",time:415.71},{label:"(b)",time:783.07},{label:"1",time:858.09},{label:"2",time:972.66},{label:"1",time:1097.94},{label:"2",time:1212.97}])]},
        intro:["In this question you are asked to comment on two excerpts of music.","Listen to each excerpt. For each excerpt identify at least two prominent concepts from each of the following categories:","melody/harmony","rhythm/texture/structure/timbre.","Both excerpts will be played twice with 15 seconds between playings, and 4 minutes at the end for you to complete your final answer.","You may use the table below for rough working, but your final answer must be written in the final answer section.","Your final answer could be bullet points or short paragraphs identifying the concepts you have heard.","Here is Excerpt 1 for the first time.","Here is Excerpt 2 for the first time.","Here is Excerpt 1 for the second time.","Here is Excerpt 2 for the second time.","You now have 4 minutes to identify at least four concepts in each excerpt.","A warning tone will sound 30 seconds before the start of part (b)."],introPartLabels:{1:"(a)"},introBulletRange:[2,3],introCompactRanges:[[7,8],[9,10]],introBoldPhrases:["two prominent","melody/harmony","rhythm/texture/structure/timbre","twice","15 seconds","4 minutes","four concepts","30 seconds"],subquestions:[
          {id:"q6a1",label:"(i)",marks:2,type:"structured-review",prompt:"Excerpt 1",sourceHeading:"Excerpt 1",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"Rough work",roughWorkIntro:"For each excerpt identify at least two prominent concepts in each of the following categories:",roughWorkBullets:["melody/harmony","rhythm/texture/structure/timbre."],roughWorkBoldPhrases:["two prominent","melody/harmony","rhythm/texture/structure/timbre"],roughWorkSheet:true,roughWorkCategoryWeight:700,roughWorkColumns:["Excerpt 1","Excerpt 2"],finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"Final answer",sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:excerpt1Melody},{id:"texture",label:"Rhythm/texture/structure/timbre",concepts:excerpt1Texture}]},
          {id:"q6a2",label:"(ii)",marks:2,type:"structured-review",prompt:"Excerpt 2",sourceHeading:"Excerpt 2",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"Final answer",hideFinalHeading:true,sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:excerpt2Melody},{id:"texture",label:"Rhythm/texture/structure/timbre",concepts:excerpt2Texture}]},
          {id:"q6bi",label:"(i)",marks:4,type:"structured-review",prompt:"Analysis",sourceHeading:"Analysis",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"Rough work",roughWorkLines:18,finalAnswerField:true,finalAnswerLines:16,finalAnswerHeading:"Final answer",sourceHeadingPosition:"final",endOfPaper:false,finalAnswerIntro:["Comment on six similarities/differences you hear in the excerpts.","Your final answer should be a written description of what you have heard and not simply a list of similarities/differences."],leadIntro:{intro:["Analyse the two excerpts you heard in part (a).","In your extended answer you should refer to six similarities/differences across the following categories:","type of work","melody/harmony","rhythm/texture/structure/timbre.","When you have completed your analysis you should give your conclusion. You must identify the period of each excerpt and justify your answer.","You will hear each excerpt two more times, with 15 seconds between playings. There will then be 10 minutes to complete your answers for part (i) and part (ii).","Write your final answers in the final answer section.","Rough work will not be marked.","Here is Excerpt 1 for the third time.","Here is Excerpt 2 for the third time.","Here is Excerpt 1 for the last time.","Here is Excerpt 2 for the last time.","You now have 10 minutes to complete your analysis and conclusion.","A warning tone will sound 30 seconds before the end of the question paper."],introPartLabels:{0:"(i)",5:"(ii)"},introBulletRange:[2,4],introCompactRanges:[[9,10],[11,12]],introBoldPhrases:["Analyse","six similarities/differences","type of work","melody/harmony","rhythm/texture/structure/timbre","period","justify","10 minutes","Rough work will not be marked."]},boldPhrases:["six similarities/differences"],markingProfile:"advanced-comparison",groupStart:{label:"(b)",prompt:"This question has two parts."},
            similarities:[concept("Antiphonal or imitation",["antiphonal","imitation"]),concept("Change of key",["change of key","key change"]),concept("Octave leaps",["octave leap","octave leaps","octaves"]),concept("Perfect cadence",["perfect cadence","V-I","V I"]),concept("Sequence"),concept("Simple time",["simple time","2/4","3/4","4/4"])],
            differences:[
              {label:"Concerto grosso versus symphony or symphonic poem",first:["concerto grosso"],second:["symphony","symphonic poem","tone poem"]},
              {label:"Strings versus full Romantic orchestra",first:["strings","group of strings","string group"],second:["full orchestra","large orchestra","romantic orchestra","symphony orchestra"],blockedFirst:["baroque orchestra","chamber orchestra","string quartet"],blockedSecond:["orchestra"]},
              {label:"Time changes versus 4/4 throughout",first:["time changes","3/4 and 4/4","3 and 4 beats"],second:["4/4 throughout","four four throughout","4 beats in a bar","4 beats in the bar","four beats in a bar","four beats in the bar"]},
              {label:"Homophonic and polyphonic versus homophonic",first:["homophonic and polyphonic","homophonic and contrapuntal"],second:["homophonic"]},
              {label:"Major versus major and minor",first:["major"],second:["major and minor","major then minor","major to minor"]},
              {label:"Trills versus trills and acciaccaturas",first:["trill","trills"],second:["trills and acciaccaturas","trill and acciaccatura"]},
              {label:"Concertino and ripieno only in Excerpt 1",firstConcept:{allTermGroups:[["concertino"],["ripieno"]]},only:1},
              ...[["anacrusis"], ["dominant 7th"], ["dotted rhythms"], ["harpsichord", "basso continuo"], ["hemiola"], ["imperfect cadence"], ["suspension"]].map(answers => ({ label: `${answers.join(" or ")} only in Excerpt 1`, first: answers, only: 1 })),
              ...[["accent", "sforzando", "sfz"], ["broken chord", "arpeggio"], ["chromatic", "chromatic scale"], ["contrary motion"], ["dissonance", "discord"], ["pedal", "inverted pedal"], ["staccato"], ["syncopation"], ["triplets"], ["whole tone scale"]].map(answers => ({ label: `${answers.join(" or ")} only in Excerpt 2`, second: answers, only: 2 })),
            ],headings:[{id:"analysis",label:"Analysis",concepts:[]}],answerDisplay:"Six valid similarities/differences earn 4 marks; four or five earn 3; two or three earn 2; one earns 1. A list is capped at 2 marks."},
          {id:"q6bii",label:"(ii)",marks:2,type:"structured-review",prompt:"Conclusion",sourceHeading:"Conclusion",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:10,hideFinalHeading:true,sourceHeadingPosition:"final",finalAnswerIntro:["Identify the period of each excerpt and justify your answer."],boldPhrases:["period","justify"],markingProfile:"advanced-conclusion",endOfPaper:false,headings:[{id:"conclusion",label:"Conclusion",concepts:[concept("Excerpt 1: Baroque"),concept("Excerpt 2: Romantic")]}],styles:[
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
        "label": "Concerto grosso forces",
        "answers": [
          "concerto grosso",
          "concertino",
          "ripieno"
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
    "reasonSource": "Official 2024 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  },
  {
    "answers": [
      "romantic"
    ],
    "wrongStyles": [
      "renaissance",
      "baroque",
      "classical",
      "impressionist",
      "20th century",
      "twentieth century",
      "modern"
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
        "label": "Named orchestral percussion",
        "answers": [
          "tambourine",
          "triangle",
          "cymbals",
          "tam tam",
          "tamtam"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Whole-tone scale",
        "answers": [
          "whole tone scale",
          "whole tone",
          "wholetone",
          "whole tones"
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
        "label": "Accents / sforzando",
        "answers": [
          "accents",
          "accented",
          "sforzando",
          "sforzandi",
          "sfz"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2024 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  }
],answerDisplay:"Both periods correctly identified and justified earn 2 marks; both identified, or one identified and justified, earns 1 mark."},
        ],
      },
    ],
  };

  root.InteractiveExamPapers = root.InteractiveExamPapers || {};
  root.InteractiveExamPapers[paper.id] = paper;
  if (typeof module !== "undefined" && module.exports) module.exports = paper;
})(typeof window !== "undefined" ? window : globalThis);
