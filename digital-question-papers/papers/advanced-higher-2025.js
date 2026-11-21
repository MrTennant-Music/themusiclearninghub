(function(root){
  "use strict";
  const concept=(label,answers=[label],extra={})=>({label,answers,...extra});
  const paired=(label,allTermGroups,extra={})=>concept(label,[],{allTermGroups,allowFuzzy:false,...extra});
  const conceptBank=(labels,correct)=>labels.map(label=>({label,answers:[label],correct:correct.includes(label)}));
  const clip=(track,markers)=>({file:`../exampapers/adv higher/2025/Music AH 2025 - Track ${String(track).padStart(2,"0")}-1.m4a`,label:"Question audio",maxPlaysExam:1,markers});
  const short=(id,label,prompt,acceptedAnswers,answerDisplay,extra={})=>({id,label,marks:1,type:"short-text",prompt,acceptedAnswers,answerDisplay,capitaliseAnswer:true,...extra});
  const bassAnswers=[];for(const d of ["D2","D3","D4","D5"])for(const e of ["E2","E3","E4","E5"])for(const f of ["F2","F3","F4","F5"])bassAnswers.push(`${d},${e},${f}`);

  const ex1Melody=[concept("Appoggiatura or suspension",["appoggiatura","suspension","suspended chord","suspended chords"]),concept("Arpeggio or broken chord",["arpeggio","arpeggios","broken chord","broken chords"]),concept("Chromatic or chromatic scale",["chromatic","chromaticism","chromatic scale"]),concept("Dominant 7th",["dominant 7th","dominant seventh","V7"]),concept("Major"),concept("Modulation",["modulation","modulates"],{blockedAnswers:["change of key","key change"]}),concept("Pedal or inverted pedal",["pedal","pedal note","pedal point","inverted pedal","inverted pedal point"]),concept("Perfect or imperfect cadence",["perfect cadence","imperfect cadence","V-I","I-V"]),concept("Sequence")];
  const ex1Texture=[concept("Alberti bass"),concept("Homophonic"),concept("Imitation or antiphonal",["imitation","antiphonal"]),concept("Pizzicato"),concept("Staccato"),concept("Strings or violins",["strings","violins"],{blockedAnswers:["violin"]}),concept("Theme, subject or theme and variations",["theme","subject","theme and variations"]),{"label": "Any two solo wind instruments", "answers": [], "distinctTermGroups": [["bassoon"], ["clarinet"], ["oboe"], ["french horn", "horn"]], "minDistinctTermGroups": 2, "allowFuzzy": false}];
  const ex2Melody=[concept("Appoggiatura"),concept("Arpeggio or broken chord",["arpeggio","arpeggios","broken chord","broken chords"]),concept("Change of key",["change of key","key change"],{blockedAnswers:["modulation"]}),concept("Chromatic or chromatic scale",["chromatic","chromaticism","chromatic scale"]),concept("Dissonance or discord",["dissonance","dissonant","discord","discords"]),concept("Dominant 7th",["dominant 7th","dominant seventh","V7"]),paired("Major and minor",[["major"],["minor"]]),concept("Octave",["octave","octaves","octave leap","octave leaps"]),concept("Pedal or inverted pedal",["pedal","pedal note","pedal point","inverted pedal","inverted pedal point"]),concept("Perfect or imperfect cadence",["perfect cadence","imperfect cadence","V-I","I-V"]),concept("Sequence"),concept("Tritone")];
  const ex2Texture=[concept("Accents or sforzando",["accent","accents","sfz","sforzando"]),concept("French horn",["french horn","horn"],{blockedAnswers:["french horns","horns"]}),concept("Homophonic or unison",["homophonic","unison"]),concept("Imitation or antiphonal",["imitation","antiphonal"]),concept("Orchestra or strings",["orchestra","orchestral","strings"]),concept("Staccato"),concept("Stretto"),concept("Theme, subject or leitmotif",["theme","subject","leitmotif","leitmotiv"]),concept("Through-composed",["through composed","through-composed"]),concept("Timpani",["timpani"],{blockedAnswers:["percussion"]}),concept("Tremolando or tremolo",["tremolando","tremolo"]),{"label": "Any two woodwind instruments", "answers": [], "distinctTermGroups": [["bassoon", "bassoons"], ["clarinet", "clarinets"], ["flute", "flutes"], ["oboe", "oboes"]], "minDistinctTermGroups": 2, "allowFuzzy": false}];

  const paper={id:"advanced-higher-2025",title:"Advanced Higher Music 2025",level:"Advanced Higher",levelCode:"AH",year:2025,totalMarks:40,openingInstructions:["Total marks — 40 marks","Attempt ALL questions"],estimatedMinutes:75,sourcePath:"../exampapers/adv higher/2025/Music AH 2025 Paper.pdf",markingInstructionsPath:"../exampapers/adv higher/2025/Music AH 2025 Answers.pdf",attribution:"Original question paper and audio content © Qualifications Scotland. Interactive adaptation created independently for non-commercial educational use. This resource is not endorsed by Qualifications Scotland.",questions:[
    {id:"q1",number:"1",marks:5,topic:"Contemporary music",layout:"ah2022-q1",audio:{clips:[clip(2,[{label:"(a)",time:5.94},{label:"(b)",time:268.25}])]},intro:"This question features contemporary music.",subquestions:[
      {id:"q1a",label:"(a)",marks:4,type:"concept-lines",lines:4,requiredResponses:4,additionalAnswerPenalty:true,prompt:"Give your four answers on the lines below.",leadLines:["Listen to this excerpt and identify four concepts in the music from those listed below.","You now have 15 seconds to read the list before hearing the music."],conceptBank:conceptBank(["Ritardando","Jazz funk","Reverb","Sprechgesang","Melismatic","Time changes","Inverted pedal","Electronic dance music","Diminution","Leitmotif"],["Diminution","Electronic dance music","Reverb","Ritardando"]),answerDisplay:"Diminution, Electronic dance music, Reverb, Ritardando",afterAnswerLinesBeforePrompt:1,afterAnswerLines:["The music will be played twice with 10 seconds between playings. You will then have 40 seconds to complete your answer.","Here is the music for the first time.","Here is the music for the second time."]},
      short("q1b","(b)","Listen to a different excerpt and identify the type of group playing.",["String quartet"],"String quartet",{allowFuzzy:false}),
    ]},
    {id:"q2",number:"2",marks:6,topic:"Instrumental literacy",layout:"ah2025-literacy",audio:{clips:[clip(3,[{label:"(a)",time:7.12},{label:"(b)",time:229.98},{label:"(c)",time:307.55},{label:"(d)",time:450.36}])]},intro:"This question features instrumental music.",subquestions:[
      {id:"q2ai",label:"(i)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the missing rhythm in bar 1 using the notes provided.",notationTool:"rhythm-entry",options:[{value:"tripletQuaver",label:"Quaver triplet"},{value:"crotchet",label:"Crotchet"},{value:"quaver",label:"Quaver"}],answer:"tripletQuaver,tripletQuaver,tripletQuaver",answerDisplay:"Three quavers marked as a triplet; the quavers may be joined or separate.",completion:{type:"note-slots",count:3},groupStart:{label:"(a)",prompt:"Listen to this excerpt and follow the guide to the music which is printed below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2025-q2a"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through parts (i) and (ii)."]},
      {id:"q2aii",label:"(ii)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Write the enharmonic equivalent of the boxed note in bar 8 using the stave provided.",notationTool:"note-entry",allowAccidentalEntry:true,options:[],answer:"F5",acceptedAnswers:["F5","Fn5","F♮5"],answerDisplay:"F on the top treble-staff line; a natural is also accepted.",noteSlots:1,completion:{type:"note-slots",count:1},afterAnswerLines:["The music will be played two more times with 40 seconds to complete your answers.","Here is the music for the second time.","Here is the music for the third time."]},
      {id:"q2b",label:"(b)",marks:1,type:"radio",markAlign:"prompt-end",prompt:"Listen to a continuation of this excerpt and tick (✓) one box to identify the correct version of the music.",beforeAnswerLines:["You now have 15 seconds to read through the possible answers."],afterAnswerLines:["The excerpt is short and will be played twice.","Here is the excerpt for the first time.","Here is the excerpt for the second time."],options:[0,1,2].map((optionIndex,index)=>({value:String(index+1),label:`Version ${index+1}`,notationScore:{sharedNotation:"ah-2025-q2b",optionIndex}})),answer:"3",answerDisplay:"The third version"},
      short("q2ci","(i)","Give the total value of the tied notes in bars 2 and 3. Write your answer\nin the box provided.",["4","Four","4 crotchets","Four crotchets","4 beats","Four beats"],"4 crotchet beats",{answerInScore:true,clearOnOwnRow:true,markAlign:"prompt-end",boldPhrases:["bars 2 and 3"],allowFuzzy:false,groupStart:{label:"(c)",prompt:"Listen to a new excerpt and follow the guide to the music which is printed\nbelow."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2025-q2c"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 30 seconds to read through parts (i) and (ii)."]}),
      short("q2cii","(ii)","Identify the cadence heard in the boxed area in bars 7 and 8.",["Perfect","Perfect cadence","V-I","V7-I","V7 I","5-1","5 to 1"],"Perfect cadence (V–I)",{answerInScore:true,clearOnOwnRow:true,allowFuzzy:false,afterAnswerLines:["The music will be played two more times with 20 seconds to complete your answers.","Here is the music for the second time.","Here is the music for the third time."]}),
      {id:"q2d",label:"(d)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Using the rhythm provided and the chord information printed below the stave,\ninsert the bass line in bar 11. The key has changed to D minor.",markAlign:"prompt-end",notationTool:"note-entry",options:[],answer:"D3,E3,F3",acceptedAnswers:bassAnswers,answerDisplay:"D, E and F crotchets; any octave is accepted.",noteSlots:3,completion:{type:"note-slots",count:3},inlineScore:{sharedNotation:"ah-2025-q2d"},beforeAnswerLines:["The music will be played twice with 10 seconds between playings. You will then have 40 seconds to complete your answer.","Here is the music for the first time.","Here is the music for the second time."]},
    ]},
    {id:"q3",number:"3",marks:7,topic:"Music in different styles",layout:"ah-boxed-guide",guideBoxSubquestions:4,guideIntro:{label:"(a)",prompt:"Listen to the next excerpt and complete the guide below by inserting music concepts.",lines:["The music will be played three times with 20 seconds between playings. You will then have 30 seconds to complete your answers.","There will now be 30 seconds to allow you to read through the question.","In the first two playings a voice will help guide you through the music. There is no voice in the third playing.","Here is the music for the first time.","Here is the music for the second time.","Here is the music for the third time."]},audio:{clips:[clip(4,[{label:"(a)",time:7.38},{label:"(b)",time:368.80},{label:"(c)",time:421.64},{label:"(d)",time:462.58}])]},intro:"This question features music in different styles.",subquestions:[
      short("q3a1","1.","The prominent interval heard at the beginning is a/an [answer].",["Octave","8","8ve"],"Octave",{inlineAnswer:{before:"The prominent interval heard at the beginning is a/an",after:"."},allowFuzzy:false}),
      short("q3a2","2.","The harmonic device heard throughout this section is a/an [answer].",["Suspension","Pedal","Pedal note","Pedal point"],"Suspension or pedal",{inlineAnswer:{before:"The harmonic device heard throughout this section is a/an",after:"."},allowFuzzy:false}),
      short("q3a3","3.","The choral texture is [answer].",["Homophonic"],"Homophonic",{inlineAnswer:{before:"The choral texture is",after:"."},allowFuzzy:false}),
      short("q3a4","4.","The music modulates to the [answer].",["Relative minor"],"Relative minor",{inlineAnswer:{before:"The music modulates to the",after:"."},allowFuzzy:false,caseSensitiveRejectedAnswers:["Minor"]}),
      {id:"q3b",label:"(b)",marks:1,type:"radio",prompt:"Listen to this excerpt and tick (✓) one box to identify the concept you hear.",beforeAnswerLines:["The excerpt is short and will be played twice.","Here is the excerpt for the first time.","Here is the excerpt for the second time."],options:["Tritone","Interrupted cadence","Melodic minor scale","Appoggiatura"].map(label=>({value:label,label})),answer:"Tritone",answerDisplay:"Tritone"},
      short("q3c","(c)","Listen to a new excerpt and identify the playing technique featured in the melody.",["Harmonics"],"Harmonics",{allowFuzzy:false}),
      short("q3d","(d)","Listen to a new excerpt and identify the tonality.",["Polytonality","Polytonal","Bitonal","Bitonality"],"Polytonality",{allowFuzzy:false}),
    ]},
    {id:"q4",number:"4",marks:4,topic:"Song literacy",layout:"ah2025-literacy",audio:{clips:[clip(5,[{label:"Guide",time:6.52}])]},intro:["This question features a song from a musical.","Listen to the excerpt and follow the guide to the music which is printed below.","Here is the music.","You now have 2 minutes to read through the question."],scorePosition:"after",score:{sharedNotation:"ah-2025-q4"},subquestions:[
      {id:"q4a",label:"(a)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Using the treble stave provided, transpose the boxed notes of the piano and\nstrings introduction one octave higher.",notationTool:"note-entry",options:[],markAlign:"prompt-end",answer:"F4,E4,D4,C4",answerDisplay:"F, E, D and C quavers one octave higher in treble clef.",noteSlots:4,completion:{type:"note-slots",count:4}},
      {id:"q4b",label:"(b)",marks:1,type:"notation-choice",sharedScore:true,prompt:"Insert the missing notes and rhythm in bar 4.",notationTool:"note-entry",options:[],answer:"A4,G4,F4,D4",answerDisplay:"A crotchet, G and F quavers, then D crotchet.",noteSlots:4,completion:{type:"note-slots",count:4}},
      {id:"q4c",label:"(c)",marks:1,type:"notation-choice",sharedScore:true,notationTool:"note-select",inlineNotationControls:true,prompt:"Circle an example of the subdominant note.",options:[],answer:"bar-12-bb",answerDisplay:"The B-flat in bar 12; no other note is accepted."},
      {id:"q4d",label:"(d)",marks:1,type:"notation-choice",sharedScore:true,notationTool:"barline-entry",inlineNotationControls:true,prompt:"Insert the missing barline(s) in the boxed area from bar 9.",options:[],answer:"after-bar-9,after-bar-10",acceptedAnswers:["after-bar-9,after-bar-10","after-bar-10,after-bar-9"],answerDisplay:"Both barlines in their official positions.",afterAnswerLines:["The music will be played three more times with 20 seconds between playings.","You will then have 30 seconds to complete your answers.","You should write all of your answers on the guide to the music below.","Here is the music for the second time.","Here is the music for the third time.","Here is the music for the fourth time."]},
    ]},
    {id:"q5",number:"5",marks:8,topic:"Music in different styles",layout:"ah2025-literacy",audio:{clips:[clip(6,[{label:"(a)",time:6.61},{label:"(b)",time:241.15},{label:"(c)",time:287.93},{label:"(d)",time:341.97}])]},intro:"This question features music in different styles.",subquestions:[
      {id:"q5a",label:"(a)",marks:4,type:"concept-lines",lines:4,requiredResponses:4,additionalAnswerPenalty:true,prompt:"Give your four answers on the lines below.",leadLines:["Listen to this excerpt and identify four concepts in the music from those listed below.","You now have 15 seconds to read the list before hearing the music."],conceptBank:conceptBank(["Concertino","Ritornello","Sequence","Tierce de Picardie","Pavan","Consort","Galliard","Hemiola","Obbligato","Interrupted cadence"],["Consort","Galliard","Hemiola","Sequence"]),answerDisplay:"Consort, Galliard, Hemiola, Sequence",afterAnswerLinesBeforePrompt:1,afterAnswerLines:["The music will be played twice with 10 seconds between playings. You will then have 40 seconds to complete your answer.","Here is the music for the first time.","Here is the music for the second time."]},
      short("q5b","(b)","Listen to a new excerpt and identify the style of the music.",["Madrigal"],"Madrigal",{allowFuzzy:false}),
      short("q5c","(c)","Listen to another excerpt and identify the style of the music.",["Anthem","Oratorio"],"Anthem or oratorio",{allowFuzzy:false}),
      short("q5di","(i)","Name the type of chord in the box in bar 6. Write your answer on the line below.",["Diminished 7th","Diminished seventh","Dim 7th","Dim7","A# diminished 7th","A sharp diminished 7th"],"Diminished 7th",{answerInScore:false,allowFuzzy:false,caseSensitiveRejectedAnswers:["Diminished","Diminished triad"],groupStart:{label:"(d)",prompt:"Listen to a continuation of that excerpt and follow the guide to the music\nwhich is printed below."},leadLines:["Here is the music."],inlineScore:{sharedNotation:"ah-2025-q5"},scoreBeforePrompt:true,scoreFollowingLines:["You now have 20 seconds to read through parts (i) and (ii)."],promptLines:["Name the type of chord in the box in bar 6.","Write your answer on the line below."],markAlign:"prompt-end"}),
      short("q5dii","(ii)","Identify the interval between the soprano and alto parts in the box in\nbar 10. Write your answer on the line below.",["6th","Sixth","6","Major 6th","Major sixth"],"6th or major 6th",{answerInScore:false,promptLines:["Identify the interval between the soprano and alto parts in the box in\nbar 10.","Write your answer on the line below."],markAlign:"prompt-end",allowFuzzy:false,caseSensitiveRejectedAnswers:["Minor 6th","Minor sixth","Augmented 6th","Augmented sixth"],afterAnswerLines:["The music will be played two more times with 20 seconds to complete your\nanswers.","Here is the music for the second time.","Here is the music for the third time."]}),
    ]},
    {id:"q6",number:"6",marks:10,topic:"Comparative analysis",audio:{clips:[clip(7,[{label:"(a)",time:8.85},{label:"1",time:63.74},{label:"2",time:209.07},{label:"1",time:354.0},{label:"2",time:499.99},{label:"(b)",time:889.28},{label:"1",time:960.01},{label:"2",time:1104.72},{label:"1",time:1248.92},{label:"2",time:1393.21}])]},intro:["In this question you are asked to comment on two excerpts of music.","Listen to each excerpt. For each excerpt identify at least two prominent concepts from each of the following categories:","melody/harmony","texture/structure/form/timbre.","Both excerpts will be played twice with a pause of 15 seconds between playings, and a pause of 4 minutes at the end for you to complete your final answer.","You may use the table below for rough working, but your final answer must be written in the final answer section.","Your final answer could be bullet points or short paragraphs identifying the concepts you have heard.","Here is Excerpt 1 for the first time.","Here is Excerpt 2 for the first time.","Here is Excerpt 1 for the second time.","Here is Excerpt 2 for the second time.","You now have 4 minutes to identify at least four concepts in each excerpt.","A warning tone will sound 30 seconds before the start of part (b)."],introPartLabels:{1:"(a)"},introBulletRange:[2,3],introCompactRanges:[[7,8],[9,10]],introBoldPhrases:["two prominent","melody/harmony","texture/structure/form/timbre","twice","15 seconds","4 minutes","four","30 seconds"],subquestions:[
      {id:"q6a1",label:"(i)",marks:2,type:"structured-review",prompt:"Excerpt 1",sourceHeading:"Excerpt 1",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"Rough Work",roughWorkIntro:"For each excerpt identify at least two prominent concepts in each of the following categories:",roughWorkBullets:["melody/harmony","texture/structure/form/timbre."],roughWorkBoldPhrases:["two prominent","melody/harmony","texture/structure/form/timbre"],roughWorkSheet:true,roughWorkCategoryWeight:700,roughWorkColumns:["Excerpt 1","Excerpt 2"],finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"Final Answer",sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:ex1Melody},{id:"texture",label:"Texture/structure/form/timbre",concepts:ex1Texture}]},
      {id:"q6a2",label:"(ii)",marks:2,type:"structured-review",prompt:"Excerpt 2",sourceHeading:"Excerpt 2",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:9,finalAnswerHeading:"Final Answer",hideFinalHeading:true,sourceHeadingPosition:"final",endOfPaper:false,conceptsPerMark:2,maxMarksPerHeading:1,headings:[{id:"melody",label:"Melody/harmony",concepts:ex2Melody},{id:"texture",label:"Texture/structure/form/timbre",concepts:ex2Texture}]},
      {id:"q6bi",label:"(i)",marks:4,type:"structured-review",prompt:"Analysis",sourceHeading:"Analysis",sourcePartLabel:"(i)",autoMark:true,roughWork:true,roughWorkHeading:"Rough Work",roughWorkLines:16,finalAnswerField:true,finalAnswerLines:20,finalAnswerHeading:"Final Answer",sourceHeadingPosition:"final",endOfPaper:false,finalAnswerIntro:["Comment on six similarities/differences you hear in the excerpts.","Your final answer should be a written description of what you have heard and not simply a list of similarities/differences."],leadIntro:{intro:["Analyse the two excerpts you have heard in part (a).","In your extended answer you should refer to six similarities/differences across the following categories:","melody/harmony","texture/structure/form/timbre.","When you have completed your analysis you should give your conclusion. You must identify the period of each excerpt and justify your answer.","You will hear each excerpt two more times with 15 seconds between playings, and a further 10 minutes to complete your answers for part (i) and part (ii).","Write your final answers in the final answer section.","Rough work will not be marked.","Here is Excerpt 1 for the third time.","Here is Excerpt 2 for the third time.","Here is Excerpt 1 for the last time.","Here is Excerpt 2 for the last time.","You now have 10 minutes to complete your analysis and conclusion.","A warning tone will sound 30 seconds before the end of the question paper."],introPartLabels:{0:"(i)",4:"(ii)"},introBulletRange:[2,3],introCompactRanges:[[8,9],[10,11]],introBoldPhrases:["Analyse","six similarities/differences","melody/harmony","texture/structure/form/timbre","period","justify","10 minutes","Rough work will not be marked."]},boldPhrases:["six similarities/differences"],markingProfile:"advanced-comparison",groupStart:{label:"(b)",prompt:"This question has two parts."},similarities:[concept("Appoggiatura"),concept("Arpeggio or broken chord",["arpeggio","broken chord"]),concept("Chromatic or chromatic scale",["chromatic","chromatic scale"]),concept("Dominant 7th",["dominant 7th","dominant seventh","V7"]),concept("Homophonic"),concept("Imitation or antiphonal",["imitation","antiphonal"]),concept("Pedal",["pedal","inverted pedal"],{sameAlternatives:[{answers:["pedal"],excludeWithinAnswers:["inverted pedal"]},{answers:["inverted pedal"]}]}),concept("Perfect or imperfect cadence",["perfect cadence","imperfect cadence"],{sameAlternatives:[["perfect cadence"],["imperfect cadence"]]}),concept("Sequence"),concept("Staccato"),concept("Theme or subject",["theme","subject"])],differences:[
        {label:"Major versus major and minor",first:["major"],second:["major and minor","major then minor","major to minor"]},
        {label:"Classical harmony versus chromatic dissonant harmony",first:["classical harmony","diatonic harmony","simple harmony","straightforward harmony"],second:["chromatic harmony","dissonance","discord","complex harmony"]},
        {label:"Small chamber orchestra versus large symphony orchestra",first:["small orchestra","chamber orchestra","chamber group","small ensemble"],second:["large orchestra","symphony orchestra"]},
        {label:"Alberti bass only in Excerpt 1",first:["alberti bass"],only:1},
        {label:"Modulation only in Excerpt 1",first:["modulation","modulates"],blockedFirst:["modulation to a minor key","modulates to a minor key"],only:1},
        {label:"Pizzicato only in Excerpt 1",first:["pizzicato"],only:1},
        {label:"Suspension or suspended chords only in Excerpt 1",first:["suspension","suspensions","suspended chord","suspended chords"],only:1},
        {label:"Theme and variations only in Excerpt 1",first:["theme and variations","theme and variation"],only:1},
        {label:"Accents or sforzando only in Excerpt 2",second:["accent","accents","sforzando","sfz"],only:2},
        {label:"Change of key only in Excerpt 2",second:["change of key","key change"],only:2},
        {label:"Flute only in Excerpt 2",second:["flute","flutes"],only:2},
        {label:"Leitmotif only in Excerpt 2",second:["leitmotif","leitmotiv"],only:2},
        ...["octave","stretto","timpani","tremolando","tritone","unison"].map(answer=>({label:`${answer} only in Excerpt 2`,second:[answer],only:2})),
        {label:"Through-composed only in Excerpt 2",second:["through composed","through-composed"],only:2},
      ],headings:[{id:"analysis",label:"Analysis",concepts:[]}],answerDisplay:"Six valid similarities/differences earn 4 marks; four or five earn 3; two or three earn 2; one earns 1. A list is capped at 2 marks."},
      {id:"q6bii",label:"(ii)",marks:2,type:"structured-review",prompt:"Conclusion",sourceHeading:"Conclusion",sourcePartLabel:"(ii)",autoMark:true,roughWork:true,hideRoughWork:true,finalAnswerField:true,finalAnswerLines:10,hideFinalHeading:true,sourceHeadingPosition:"final",finalAnswerIntro:["Identify the period of each excerpt and justify your answer."],boldPhrases:["period","justify"],markingProfile:"advanced-conclusion",endOfPaper:false,headings:[{id:"conclusion",label:"Conclusion",concepts:[concept("Excerpt 1: Classical"),concept("Excerpt 2: Romantic")]}],styles:[
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
      "modern"
    ],
    "reasons": [],
    "reasonConcepts": [
      {
        "label": "Small / chamber orchestra with wind",
        "allTermGroups": [
          [
            "small orchestra",
            "chamber orchestra"
          ],
          [
            "wind",
            "woodwind",
            "bassoon",
            "clarinet",
            "oboe",
            "horn",
            "horns"
          ]
        ],
        "allowFuzzy": false
      },
      {
        "label": "Small / chamber ensemble",
        "answers": [
          "small ensemble",
          "chamber ensemble"
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
        "label": "Alberti bass / broken-chord accompaniment",
        "answers": [
          "alberti bass",
          "alberti accompaniment",
          "alberti style",
          "broken chord accompaniment",
          "broken chords in the piano"
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
      }
    ],
    "reasonSource": "Official 2025 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  },
  {
    "answers": [
      "romantic",
      "late romantic"
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
        "label": "Complex harmony",
        "answers": [
          "complex harmony",
          "complex harmonies",
          "complex chords"
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
        "label": "Abrupt key changes",
        "answers": [
          "abrupt changes of key",
          "abrupt key changes",
          "sudden changes of key",
          "sudden key changes",
          "unexpected key changes",
          "unprepared key changes"
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
    "reasonSource": "Official 2025 Q6(b)(ii), including additional guidance; see advanced-higher-conclusion-audit.md."
  }
],answerDisplay:"Both periods correctly identified and justified earn 2 marks; both identified, or one identified and justified, earns 1 mark."},
    ]},
  ]};
  root.InteractiveExamPapers=root.InteractiveExamPapers||{};root.InteractiveExamPapers[paper.id]=paper;if(typeof module!=="undefined"&&module.exports)module.exports=paper;
})(typeof window!=="undefined"?window:globalThis);
