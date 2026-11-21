(function(root) {
  "use strict";

  const concept = (label, answers = [label], extra = {}) => ({ label, answers, ...extra });
  const paired = (label, allTermGroups, extra = {}) => concept(label, [], { allTermGroups, allowFuzzy: false, ...extra });
  const conceptBank = (labels, correct) => labels.map(label => ({ label, answers: [label], correct: correct.includes(label) }));
  const clip = (track, markers) => ({
    file: `../exampapers/adv higher/2023/Music AH 2023 - Track ${String(track).padStart(2, "0")}-1.m4a`,
    label: "Question audio", maxPlaysExam: 1, markers,
  });
  const short = (id, label, prompt, acceptedAnswers, answerDisplay, extra = {}) => ({
    id, label, marks: 1, type: "short-text", prompt, acceptedAnswers, answerDisplay,
    capitaliseAnswer: true, ...extra,
  });

  const excerpt1Melody = [
    concept("Appoggiatura, trill or turn", ["appoggiatura", "appoggiaturas", "trill", "trills", "turn", "turns"], { blockedAnswers:["ornament", "ornaments", "ornamentation"] }),
    concept("Arpeggios or broken chords", ["arpeggio", "arpeggios", "broken chord", "broken chords"]),
    concept("Chromatic", ["chromatic", "chromaticism"], { blockedAnswers:["chromatic scale"] }),
    concept("Contrary motion"), concept("Dominant 7th", ["dominant 7th", "dominant seventh", "V7"]),
    concept("Cadence", ["imperfect cadence", "interrupted cadence", "perfect cadence"]),
    concept("Major and minor", ["major and minor", "major then minor", "major to minor"]),
    concept("Modulation or modulation to relative minor", ["modulation", "modulates to the relative minor"], { blockedAnswers:["change of key", "key change"] }),
    concept("Pedal or inverted pedal", ["pedal", "pedal point", "pedal note", "inverted pedal", "inverted pedal point"]),
    concept("Sequence"), concept("Suspension"),
  ];
  const excerpt1Texture = [
    concept("3/4 or simple time", ["3/4", "three four", "simple time"], { blockedAnswers:["3 beats", "three beats"] }),
    concept("Adagio, largo or larghetto", ["adagio", "largo", "larghetto"]),
    {"label": "Any two solo wind instruments", "answers": [], "distinctTermGroups": [["bassoon"], ["clarinet"], ["oboe"], ["french horn", "horn"]], "minDistinctTermGroups": 2, "allowFuzzy": false},
    concept("Homophonic"), concept("Imitation or antiphonal", ["imitation", "antiphonal"], { blockedAnswers:["question and answer"] }), concept("Piano"),
  ];
  const excerpt2Melody = [
    concept("Added 6th", ["added 6th", "added sixth", "added 6ths", "added sixths"]),
    concept("Chromatic, dissonant or discordant", ["chromatic", "chromaticism", "dissonance", "dissonant", "discord", "discordant"], { blockedAnswers:["chromatic scale"] }),
    concept("Countermelody", ["countermelody", "counter melody"]),
    concept("Dominant 7th or 7th chords", ["dominant 7th", "dominant seventh", "V7", "7th chord", "7th chords", "seventh chord", "seventh chords"]),
    concept("Minor"), concept("Modulation", ["modulation", "modulates"], { blockedAnswers:["change of key", "key change"] }),
    concept("Octaves", ["octave", "octaves", "8ves"]), concept("Pedal", ["pedal", "pedal point", "pedal note"]),
    concept("Perfect cadence", ["perfect cadence", "V-I", "V I"]), concept("Sequence"), concept("Tritone"),
  ];
  const excerpt2Texture = [
    concept("4/4 or simple time", ["4/4", "four four", "simple time", "common time"], { blockedAnswers:["4 beats", "four beats"] }),
    concept("Accelerando, moderato, allegro or andante", ["accelerando", "accel", "moderato", "andante", "allegro"]),
    concept("Accented or sforzando", ["accent", "accents", "accented", "sfz", "sforzando"]),
    concept("Arco or pizzicato", ["arco", "pizzicato", "pizz"]),
    concept("Guiro, piano, timpani, claves, woodblock or castanets", ["guiro", "güiro", "piano", "timpani", "kettle drum", "kettle drums", "claves", "woodblock", "wood block", "castanets"]),
    paired("Homophonic and polyphonic or contrapuntal", [["homophonic"], ["polyphonic", "polyphony", "contrapuntal", "counterpoint"]]),
    concept("Imitation or antiphonal", ["imitation", "antiphonal"]), concept("Oboe or clarinet", ["oboe", "oboes", "clarinet", "clarinets"]),
    concept("Orchestra or strings and brass", ["orchestra", "orchestral", "strings and brass", "brass and strings"]),
    concept("Ostinato"), concept("Syncopation, cross-rhythms or triplets", ["syncopation", "syncopated", "cross rhythm", "cross rhythms", "cross-rhythm", "cross-rhythms", "triplet", "triplets"]),
    concept("Time changes", ["time changes", "change of time", "changes of time", "4/4 to 6/8", "four four to six eight"], { blockedAnswers:["irregular time"] }),
  ];

  const paper = {
    id:"advanced-higher-2023", title:"Advanced Higher Music 2023", level:"Advanced Higher", levelCode:"AH", year:2023,
    totalMarks:40, openingInstructions:["Total marks — 40", "Attempt ALL questions"], estimatedMinutes:75,
    sourcePath:"../exampapers/adv higher/2023/Music AH 2023 Paper.pdf",
    markingInstructionsPath:"../exampapers/adv higher/2023/Music AH 2023 Answers.pdf",
    attribution:"Original question paper and audio content © Qualifications Scotland. Interactive adaptation created independently for non-commercial educational use. This resource is not endorsed by Qualifications Scotland.",
    questions:[
      {
        id:"q1", number:"1", marks:6, topic:"Choral and instrumental music", layout:"ah2022-q1",
        audio:{clips:[clip(2,[{label:"(a)",time:7.69},{label:"(b)",time:196.38},{label:"(c)",time:303.82}])]},
        intro:"This question features choral and instrumental music.",
        subquestions:[
          {id:"q1a",label:"(a)",marks:4,type:"concept-lines",lines:4,requiredResponses:4,additionalAnswerPenalty:true,prompt:"Give your four answers on the lines below.",leadLines:["Listen to this excerpt and identify four concepts in the music from those listed below.","You now have 15 seconds to read the list before hearing the music."],conceptBank:conceptBank(["Plainchant","Plagal cadence","Renaissance","Mezzo soprano","Da capo aria","Lied","Ballett","Countertenor","Motet","Madrigal"],["Countertenor","Motet","Plagal cadence","Renaissance"]),answerDisplay:"Countertenor, Motet, Plagal cadence, Renaissance",afterAnswerLinesBeforePrompt:1,afterAnswerLines:["The music will be played twice with 10 seconds between playings. You will then have 40 seconds to complete your answer.","Here is the music for the first time.","Here is the music for the second time."]},
          short("q1b","(b)","Now listen to a new excerpt and give the order in which the voices enter with the text, ‘And cast away’.",["Tenor, Alto, Soprano, Bass","Tenor Alto Soprano Bass","TASB","Tenor > Alto > Soprano > Bass"],"Tenor, Alto, Soprano, Bass",{allowFuzzy:false,markAlign:"prompt-end",numberedAnswerLines:4,afterAnswerLinesBeforeAnswer:4,afterAnswerLines:["You will hear the music three times.","Here is the music for the first time.","Here is the music for the second time.","Here is the music for the third time."]}),
          short("q1c","(c)","Listen to a new excerpt and identify the form of the music.",["Fugue","Fugal"],"Fugue or fugal",{allowFuzzy:false,afterAnswerLinesBeforeAnswer:3,afterAnswerLines:["You will hear the excerpt twice.","Here is the music for the first time.","Here is the music for the second time."]}),
        ],
      },
      {
        id:"q2", number:"2", marks:5, topic:"Song literacy", layout:"ah2023-literacy",
        sourceNotationLabelWeights:{Intro:400,"2 bar intro":400,"(ii) Key:":400,"To coda":400},
        audio:{clips:[clip(3,[{label:"(a)",time:5.36},{label:"(b)",time:108.40},{label:"(c)",time:471.40}])]},
        intro:"This question is based on a song.",
        subquestions:[
          {id:"q2a",label:"(a)",markAlign:"prompt-end",marks:1,type:"radio",prompt:"Listen to this excerpt. Tick (✓) one box to identify the correct version of the electric guitar riff which enters immediately after the bass guitar.",beforeAnswerLines:["You now have 20 seconds to read through the possible answers."],options:[0,1,2].map((optionIndex,index)=>({value:String(index+1),label:`Version ${index+1}`,notationScore:{sharedNotation:"ah-2023-q2a",optionIndex}})),answer:"1",answerDisplay:"The first version",afterAnswerLines:["You will hear the music three times.","Here is the music for the first time.","Here is the music for the second time.","Here is the music for the third time."]},
          {id:"q2bi",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the appropriate repeat sign(s) so that the printed music matches what you hear.",notationTool:"repeat-sign",options:[{value:"repeat-signs",label:"Repeat signs"}],answer:"start-bar-10,end-bar-25",acceptedAnswers:["start-bar-10,end-bar-25","D.S.-bar-10,end-bar-25"],answerDisplay:"A start repeat at bar 10 and an end repeat at bar 25. D.S. al Coda with the sign at bar 10 is also accepted.",groupStart:{label:"(b)",prompt:"Listen to the next excerpt and follow the guide score which is printed below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2023-q2b"},scoreBeforePrompt:true,scoreFollowingLines:["You now have one minute to read through the questions."]},
          {id:"q2bii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Draw this sign over the bar in which you first hear the brass play the following:",promptParts:{before:"Draw this sign",symbol:"bracket",after:"over the bar in which you first hear the brass play the following:"},notationTool:"bar-label",options:[{value:"bracket",label:"Bracket",symbol:"bracket"}],answer:"bar-20-bracket",answerDisplay:"The bracket belongs above bar 20.",inlineScore:{sharedNotation:"ah-2023-q2bRhythm"},controlsAfterScore:true,afterAnswerLines:["The music will be played two more times with 30 seconds before part (c).","You should write all your answers on the guide to the music.","Here is the music for the second time.","Here is the music for the third time."]},
          short("q2ci","(i)","Explain the effect of the sign above the notes in bars 2 to 4.",["Play one octave higher","Play an octave higher","Notes sound one octave higher","One octave higher","Eight notes higher","8 notes higher"],"Play the notes one octave higher",{allowFuzzy:false,groupStart:{label:"(c)",prompt:"Listen to a continuation of the song and follow the guide to the music which is printed below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2023-q2c"},scoreBeforePrompt:true,scoreFollowingLines:["You now have one minute to read through the questions."]}),
          short("q2cii","(ii)","Write the name of the key in the box above bar 9.",["D major","D","D maj"],"D major",{allowFuzzy:false,answerInScore:true,afterAnswerLines:["The music will be played two more times with 30 seconds before the next question starts.","Here is the music for the second time.","Here is the music for the third time."]}),
        ],
      },
      {
        id:"q3", number:"3", marks:6, topic:"Music in different styles", layout:"ah-boxed-guide", guideBoxStartIndex:1, guideBoxSubquestions:4,
        audio:{clips:[clip(4,[{label:"(a)",time:8.25},{label:"(b)",time:50.91},{label:"(c)",time:369.21}])]},
        intro:"In this question you will hear music in different styles.",
        guideIntro:{label:"(b)",prompt:"Listen to the next excerpt and complete the guide below by inserting music concepts.",lines:["The music will be played three times with 20 seconds between playings. You will then have 30 seconds to complete your answers.","There will now be 30 seconds to allow you to read through the question.","In the first two playings a voice will help guide you through the music. There is no voice in the third playing.","Here is the music for the first time.","Here is the music for the second time.","Here is the music for the third time."]},
        subquestions:[
          {id:"q3a",label:"(a)",marks:1,type:"radio",prompt:"Listen to this excerpt and tick (✓) one box to identify what you hear.",options:["Sprechgesang","Musique concrète","Leitmotif","Minimalist"].map(label=>({value:label,label})),answer:"Sprechgesang",answerDisplay:"Sprechgesang"},
          short("q3b1","1.","The ornament heard in the melody is a/an [answer].",["Appoggiatura"],"Appoggiatura",{inlineAnswer:{before:"The ornament heard in the melody is a/an",after:"."},allowFuzzy:false}),
          short("q3b2","2.","The cadence is [answer].",["Perfect","Perfect cadence","V-I","V I","5-1","5 to 1"],"Perfect cadence (V–I)",{inlineAnswer:{before:"The cadence is",after:"."},allowFuzzy:false}),
          short("q3b3","3.","The strings play a/an [answer].",["Inverted pedal","Inverted pedal point"],"Inverted pedal",{inlineAnswer:{before:"The strings play a/an",after:"."},allowFuzzy:false}),
          short("q3b4","4.","The type of group playing is a/an [answer].",["Piano trio"],"Piano trio",{inlineAnswer:{before:"The type of group playing is a/an",after:"."},allowFuzzy:false}),
          short("q3c","(c)","Listen to a new excerpt and identify the style of the music.",["Contemporary Jazz","Contemporary jazz"],"Contemporary Jazz",{allowFuzzy:false}),
        ],
      },
      {
        id:"q4", number:"4", marks:4, topic:"Vocal music literacy", layout:"ah2023-literacy",
        audio:{clips:[clip(5,[{label:"Guide",time:7.46}])]}, intro:["This question features vocal music.","Listen to the excerpt and follow the guide to the soprano part which is printed below.","Here is the music."], score:{sharedNotation:"ah-2023-q4"},
        subquestions:[
          short("q4a","(a)","Write the name of the cadence heard in the boxed area above bars 3 and 4.",["Imperfect","Imperfect cadence","I-V","I V","1-5","1 to 5"],"Imperfect cadence (I–V)",{answerInScore:true,allowFuzzy:false,leadLines:["You now have 1 minute to read through parts (a) ― (d)."]}),
          {id:"q4b",label:"(b)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Write the enharmonic equivalent of the boxed note in bar 5.",notationTool:"note-entry",allowAccidentalEntry:true,options:[],answer:"A#4",acceptedAnswers:["A#4","A♯4"],answerDisplay:"A-sharp on the second space; any note value and stem direction are accepted.",noteSlots:1,completion:{type:"note-slots",count:1}},
          {id:"q4c",label:"(c)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert an accidental in bar 10 so that the written music matches what you hear.",notationTool:"accidental",options:[{value:"natural",label:"Natural"},{value:"flat",label:"Flat"},{value:"sharp",label:"Sharp"}],accidentalNoteIndices:[0],answer:"natural",answerDisplay:"A natural sign before the first note, B, in bar 10."},
          {id:"q4d",label:"(d)",marks:1,type:"notation-choice",sharedScore:true,prompt:"In bar 12, above the word ‘her’, write a crotchet which is a 4th higher than the first note in the bar.",notationTool:"note-entry",options:[],answer:"F5",acceptedAnswers:["F3","F4","F5","F6"],answerDisplay:"F, a fourth above the first C in bar 12; any note value and stem direction are accepted.",noteSlots:1,completion:{type:"note-slots",count:1},afterAnswerLines:["The music will be played three more times with 20 seconds between playings.","You will then have 40 seconds to complete your answers.","You should write all your answers on the guide to the music.","Here is the music for the second time.","Here is the music for the third time.","Here is the music for the fourth time."]},
        ],
      },
      {
        id:"q5", number:"5", marks:9, topic:"Instrumental music", layout:"ah2023-literacy",
        audio:{clips:[clip(6,[{label:"(a)",time:6.79},{label:"(b)",time:205.87},{label:"(c)",time:382.04},{label:"(d)",time:416.28},{label:"(e)",time:461.18}])]},
        intro:"This question features instrumental music.",
        subquestions:[
          {id:"q5a",label:"(a)",marks:4,type:"concept-lines",lines:4,requiredResponses:4,additionalAnswerPenalty:true,prompt:"Give your four answers on the lines below.",leadLines:["Listen to this excerpt and identify four concepts in the music from those listed below.","You now have 15 seconds to read the list before hearing the music."],conceptBank:conceptBank(["Tremolando","Fugue","Musique concrète","Retrograde","Irregular time signatures","Interrupted cadence","Minimalist","Glissando","Sprechgesang","Consort"],["Glissando","Irregular time signatures","Retrograde","Tremolando"]),answerDisplay:"Glissando, Irregular time signatures, Retrograde, Tremolando",afterAnswerLinesBeforePrompt:1,afterAnswerLines:["The music will be played twice with 10 seconds between playings. You will then have 40 seconds to complete your answer.","Here is the music for the first time.","Here is the music for the second time."]},
          {id:"q5bi",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the missing notes in the boxed area of bars 9 and 10.",notationTool:"note-entry",options:[],answer:"E4,D4,E4,C4",answerDisplay:"E and D quavers complete bar 9; E and C crotchets complete bar 10.",noteSlots:4,completion:{type:"note-slots",count:4},groupStart:{label:"(b)",prompt:"Listen to the excerpt and follow the guide to the music which is printed below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2023-q5"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through the questions below."]},
          {id:"q5bii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Re-write the boxed note in bar 13 at the same pitch in the bass clef.",notationTool:"note-entry",options:[],answer:"D4",answerDisplay:"D at the same pitch in bass clef, written as a minim.",noteSlots:1,completion:{type:"note-slots",count:1},afterAnswerLines:["You will now hear the music two more times, with 20 seconds between playings and 30 seconds before the next question.","You should write all your answers on the guide to the music above.","Here is the music for the second time.","Here is the music for the third time."]},
          short("q5c","(c)","Listen to the excerpt one final time. Identify the concept that describes the tonality of the piece.",["Mode","Modal"],"Mode or modal",{promptLines:["Listen to the excerpt one final time.","Identify the concept that describes the tonality of the piece."],markAlign:"prompt-end",allowFuzzy:false}),
          short("q5d","(d)","Listen to a new excerpt. Identify the concept that describes the prominent feature of the rhythm.",["3 against 2","Three against two"],"3 against 2",{promptLines:["Listen to a new excerpt.","Identify the concept that describes the prominent feature of the rhythm."],markAlign:"prompt-end",allowFuzzy:false}),
          {id:"q5e",label:"(e)",markAlign:"prompt-end",promptLines:["Listen to a new excerpt.","Tick (✓) one box to indicate the order in which the woodwind instruments play."],marks:1,type:"radio",prompt:"Listen to a new excerpt. Tick (✓) one box to indicate the order in which the woodwind instruments play.",beforeAnswerLines:["You now have 20 seconds to read through the possible answers."],afterAnswerLines:["The excerpt will be played twice.","Here is the music for the first time.","Here is the music for the second time."],options:["Piccolo, Oboe, Bassoon, Flute","Flute, Oboe, Bassoon, Piccolo","Flute, Bassoon, Oboe, Piccolo","Piccolo, Flute, Bassoon, Oboe"].map((label,index)=>({value:String(index+1),label,columns:label.split(", ")})),answer:"2",answerDisplay:"Flute, Oboe, Bassoon, Piccolo"},
        ],
      },
      {
        id:"q6", number:"6", marks:10, topic:"Comparative analysis",
        audio:{clips:[clip(7,[{label:"(a)",time:9.31},{label:"1",time:68.27},{label:"2",time:201.61},{label:"1",time:322.56},{label:"2",time:456.63},{label:"(b)",time:820.79},{label:"1",time:901.94},{label:"2",time:1035.56},{label:"1",time:1156.84},{label:"2",time:1290.76}])]},
        intro:["In this question you are asked to comment on two excerpts of music.","Listen to each excerpt. For each excerpt identify at least two prominent concepts from each of the following categories:","Melody/harmony","Rhythm/tempo/texture/timbre","Both excerpts will be played twice with 15 seconds between playings, and 4 minutes at the end for you to complete your final answer.","You may use the table below for rough working, but your final answer must be written in the final answer section.","Your final answer could be bullet points or short paragraphs identifying the concepts you have heard.","Here is Excerpt 1 for the first time.","Here is Excerpt 2 for the first time.","Here is Excerpt 1 for the second time.","Here is Excerpt 2 for the second time.","You now have 4 minutes to identify at least four concepts in each excerpt.","A warning tone will sound 30 seconds before the start of part (b)."],
        introPartLabels:{1:"(a)"}, introBulletRange:[2,3], introCompactRanges:[[7,8],[9,10]], introBoldPhrases:["two prominent","Melody/harmony","Rhythm/tempo/texture/timbre","twice","15 seconds","4 minutes","four concepts"],
        subquestions:[
          {id:"q6a1",label:"(i)",marks:2,type:"structured-review",prompt:"Excerpt 1",sourceHeading:"Excerpt 1",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"Rough work",roughWorkIntro:"For each excerpt identify at least two prominent concepts in each of the following categories:",roughWorkBullets:["Melody/harmony","Rhythm/tempo/texture/timbre"],roughWorkBoldPhrases:["two prominent","Melody/harmony","Rhythm/tempo/texture/timbre"],roughWorkSheet:true,roughWorkCategoryWeight:700,roughWorkColumns:["Excerpt 1","Excerpt 2"],finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"Final answer",sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:excerpt1Melody},{id:"texture",label:"Rhythm/tempo/texture/timbre",concepts:excerpt1Texture}]},
          {id:"q6a2",label:"(ii)",marks:2,type:"structured-review",prompt:"Excerpt 2",sourceHeading:"Excerpt 2",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"Final Answer",hideFinalHeading:true,sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:excerpt2Melody},{id:"texture",label:"Rhythm/tempo/texture/timbre",concepts:excerpt2Texture}]},
          {id:"q6bi",label:"(i)",marks:4,type:"structured-review",prompt:"Analysis",sourceHeading:"Analysis",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"Rough work",roughWorkLines:18,finalAnswerField:true,finalAnswerLines:16,finalAnswerHeading:"Final answer",sourceHeadingPosition:"final",endOfPaper:false,finalAnswerIntro:["Comment on six similarities/differences you hear in the excerpts.","Your final answer should be a written description of what you have heard and not simply a list of similarities/differences."],leadIntro:{intro:["Analyse the two excerpts you have heard in part (a).","In your extended answer you should refer to six similarities/differences across the following categories:","Melody/harmony","Rhythm/tempo/texture/timbre","When you have completed your analysis you should give your conclusion. You must identify the period of each excerpt and justify your answer.","You will hear each excerpt two more times, with 15 seconds between playings. There will then be 10 minutes to complete your answers for part (i) and part (ii).","Write your final answers in the final answer section.","Rough work will not be marked.","Here is Excerpt 1 for the third time.","Here is Excerpt 2 for the third time.","Here is Excerpt 1 for the last time.","Here is Excerpt 2 for the last time.","You now have 10 minutes to complete your analysis and conclusion.","A warning tone will sound 30 seconds before the end of the question paper."],introPartLabels:{0:"(i)",4:"(ii)"},introBulletRange:[2,3],introCompactRanges:[[8,9],[10,11]],introBoldPhrases:["Analyse","six similarities/differences","Melody/harmony","Rhythm/tempo/texture/timbre","period","justify","10 minutes","Rough work will not be marked."]},boldPhrases:["six similarities/differences"],markingProfile:"advanced-comparison",groupStart:{label:"(b)",prompt:"This question has two parts."},
            similarities:[concept("Chromatic",["chromatic","chromaticism"],{excludeWithinAnswers:["chromatic scale","chromatic scales"]}),concept("Dominant 7th",["dominant 7th","dominant seventh","V7"]),concept("Imitation or antiphonal",["imitation","antiphonal"]),concept("Modulation",["modulation","modulates"],{blockedAnswers:["change of key","key change"]}),paired("Oboe and clarinet",[["oboe"],["clarinet"]],{blockedAnswers:["oboes","clarinets"]}),concept("Pedal",["pedal","pedal point","pedal note"]),concept("Perfect cadence",["perfect cadence","V-I","V I"]),concept("Piano"),concept("Sequence")],
            differences:[
              {label:"Major and minor versus minor",first:["major and minor","major then minor","major to minor"],second:["minor"]},
              {label:"Same slow tempo versus accelerando",first:["adagio","largo","larghetto","same slow tempo"],second:["accelerando"],invalidFirst:["allegro","moderato","andante","presto"],invalidSecond:["adagio","largo","larghetto","presto","vivace"]},
              {label:"Conventional harmony versus dissonant extended harmony",first:["conventional harmony","classical harmony","traditional harmony"],second:["dissonance","discord","added 6th","added sixth","7th chords","seventh chords"]},
              {label:"Piano quintet or chamber group versus orchestra",first:["piano quintet","chamber group","chamber music","piano and wind quartet"],second:["orchestra","orchestral"],blockedFirst:["chamber orchestra"]},
              {label:"Homophonic versus homophonic and polyphonic",first:["homophonic"],second:["homophonic and polyphonic","homophonic and contrapuntal"]},
              ...[["appoggiatura", "appoggiaturas", "trill", "trills", "turn", "turns"], ["bassoon", "french horn"], ["broken chords", "arpeggios"], ["contrary motion"], ["imperfect cadence", "interrupted cadence"], ["inverted pedal"], ["suspension"]].map(answers => ({ label: `${answers.join(" or ")} only in Excerpt 1`, first: answers, only: 1 })),
              ...[["accent", "accents", "sforzando", "sfz"], ["arco", "pizzicato"], ["countermelody"], ["guiro", "timpani", "claves", "woodblock", "castanets", "Latin American percussion"], ["octaves"], ["ostinato"], ["syncopation", "triplets", "cross rhythm"], ["time changes"], ["tritone"]].map(answers => ({ label: `${answers.join(" or ")} only in Excerpt 2`, second: answers, only: 2 })),
            ],headings:[{id:"analysis",label:"Analysis",concepts:[]}],answerDisplay:"Six valid similarities/differences earn 4 marks; four or five earn 3; two or three earn 2; one earns 1. A list is capped at 2 marks."},
          {id:"q6bii",label:"(ii)",marks:2,type:"structured-review",prompt:"Conclusion",sourceHeading:"Conclusion",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:10,hideFinalHeading:true,sourceHeadingPosition:"final",finalAnswerIntro:["Identify the period of each excerpt and justify your answer."],boldPhrases:["period","justify"],markingProfile:"advanced-conclusion",endOfPaper: false,headings:[{id:"conclusion",label:"Conclusion",concepts:[concept("Excerpt 1: Classical"),concept("Excerpt 2: 20th-century or Modern")]}],styles:[
  {
    "answers": [
      "classical"
    ],
    "wrongStyles": [
      "renaissance",
      "baroque",
      "romantic",
      "impressionist",
      "20th century",
      "twentieth century",
      "modern",
      "popular"
    ],
    "reasons": [],
    "reasonConcepts": [
      {
        "label": "Limited chromaticism / antiphonal exchanges",
        "answers": [
          "limited chromaticism",
          "limited use of chromaticism",
          "antiphonal exchanges",
          "antiphonal writing"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Regular phrase structure",
        "answers": [
          "regular phrase structure",
          "regular phrasing",
          "regular phrases",
          "balanced phrases",
          "balanced phrasing",
          "symmetrical phrases",
          "four bar phrases",
          "4 bar phrases",
          "eight bar phrases",
          "8 bar phrases",
          "question and answer phrases"
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
        "label": "Classical / traditional / conventional harmony",
        "answers": [
          "classical harmony",
          "traditional harmony",
          "conventional harmony",
          "traditional harmonies"
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
        "label": "Limited dynamic range",
        "answers": [
          "limited dynamics",
          "limited dynamic range",
          "limited dynamic variation",
          "little dynamic variation",
          "little variation in dynamics",
          "small dynamic range",
          "narrow dynamic range",
          "few dynamic changes"
        ],
        "allowFuzzy": false
      },
      {
        "label": "Chamber music including piano",
        "allTermGroups": [
          [
            "chamber music",
            "chamber ensemble",
            "wind quartet",
            "quartet",
            "quintet"
          ],
          [
            "piano"
          ]
        ],
        "allowFuzzy": false
      },
      {
        "label": "Piano quintet",
        "answers": [
          "piano quintet"
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
        "label": "Light homophonic texture / broken chords",
        "answers": [
          "homophonic",
          "melody dominated texture",
          "broken chords",
          "arpeggios"
        ],
        "allowFuzzy": false
      }
    ],
    "reasonSource": "Official 2023 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  },
  {
    "answers": [
      "20th century",
      "twentieth century",
      "modern",
      "21st century",
      "twenty first century"
    ],
    "wrongStyles": [
      "renaissance",
      "baroque",
      "classical",
      "romantic",
      "impressionist",
      "neo classical",
      "neoclassical"
    ],
    "reasons": [],
    "reasonConcepts": [
      {
        "label": "Dissonant tritone",
        "answers": [
          "tritone",
          "augmented fourth",
          "diminished fifth"
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
        "label": "Named Latin-American percussion",
        "answers": [
          "claves",
          "guiro",
          "castanets",
          "woodblock"
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
        "label": "Complex / extended / adventurous harmony",
        "answers": [
          "complex chords",
          "extended chords",
          "adventurous harmony",
          "complex harmony"
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
        "label": "Cross-rhythms / Latin-American rhythms",
        "answers": [
          "cross rhythm",
          "cross rhythms",
          "crossrhythm",
          "crossrhythms",
          "latin american rhythms",
          "latin rhythms"
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
      }
    ],
    "reasonSource": "Official 2023 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
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
