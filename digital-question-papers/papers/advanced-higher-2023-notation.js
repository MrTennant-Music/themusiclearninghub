(function(root) {
  "use strict";

  const beats = {
    semiquaver:.25, quaver:.5, tripletQuaver:1/3, dottedQuaver:.75,
    crotchet:1, dottedCrotchet:1.5, minim:2, dottedMinim:3, semibreve:4,
    quaverRest:.5, crotchetRest:1, dottedCrotchetRest:1.5,
    minimRest:2, dottedMinimRest:3, semibreveRest:4,
  };
  const note = (pitch, rhythm, extra = {}) => ({ pitch, rhythm, beats:beats[rhythm], ...extra });
  const rest = (rhythm, extra = {}) => ({ rest:true, rhythm, beats:beats[rhythm], ...extra });
  const bar = (notes, extra = {}) => ({ notes, ...extra });

  // Page 4, rendered at 300 dpi. Each option is a complete two-bar 4/4
  // electric-guitar riff. The first option is the official answer.
  const q2aOptions = [
    ['C4','D4','E4','G4','A4','C5'],
    ['C4','D4','E4','F4','E4','C5'],
    ['C4','D4','E4','F4','G4','B4'],
  ].map(pitches=>[0,1].map(()=>bar(pitches.map((pitch,index)=>note(pitch,index?'quaver':'dottedCrotchet')),{beamGroups:[{start:2,end:5}],finalBarline:'single'})));


  // Page 7, rendered at 600 dpi. This is the one-bar brass rhythm printed
  // beneath part (b)(ii), not an answer entry stave.
  const q2bRhythmBars = [
    bar([
      rest("quaverRest"),
      note("C5","semiquaver",{chord:["C5","E5"]}),
      note("D5","semiquaver",{chord:["D5","F5"]}),
      note("E5","quaver",{chord:["E5","G5"]}),
      note("C5","semiquaver",{chord:["C5","E5"]}),
      note("D5","semiquaver",{chord:["D5","F5"]}),
      note("E5","minim",{chord:["E5","G5"]}),
    ],{beamGroups:[{start:1,end:2},{start:3,end:5}],finalBarline:"double"}),
  ];

  // Page6: independently calibrated eight-system audit, see q2b inventory.
  const q2bBars = [
    bar([rest("minimRest"),rest("quaverRest"),note("E5","crotchet"),note("D5","quaver")],{beamGroups:[],lyricSyllables:["", "", "I've", "got"]}),
    bar([note("E5","crotchet"),note("C5","crotchet"),note("C5","quaver"),note("D5","quaver"),note("C5","crotchet")],{ties:[[1,2]],beamGroups:[{start:2,end:3}],lyricSyllables:["sun", "shine", "", "", ""],lyricExtensions:[{from:1,to:4,offset:28}]}),
    bar([rest("crotchetRest"),rest("tripletQuaver"),note("C5","tripletQuaver"),note("D5","tripletQuaver"),note("C5","minim")],{triplets:[[1,3]],beamGroups:[{start:2,end:3}],lyricSyllables:["", "", "on", "a", "cloud -"]}),
    bar([note("C5","quaver"),note("A4","semiquaver"),note("G4","semiquaver"),note("G4","minim"),rest("crotchetRest")],{ties:[[2,3]],beamGroups:[{start:0,end:2}],lyricSyllables:["-", "dy", "day.", "", ""],lyricOffsets:[0,-7,7]}),
    bar([rest("minimRest"),rest("crotchetRest"),rest("quaverRest"),note("C5","semiquaver"),note("D5","semiquaver")],{beamGroups:[{start:3,end:4}],lyricSyllables:["", "", "", "When", "it's"],lyricOffsets:[0,0,0,-9,9]}),
    bar([rest("quaverRest"),note("E5","crotchet"),note("C5","quaver"),note("C5","crotchet"),note("C5","semiquaver"),note("A4","semiquaver"),note("C5","quaver")],{ties:[[2,3]],beamGroups:[{start:4,end:6}],lyricSyllables:["", "cold", "out -", "", "side,", "", ""],lyricExtensions:[{from:4,to:6,offset:25}]}),
    bar([note("C5","crotchet"),rest("crotchetRest"),rest("quaverRest"),note("D5","quaver"),note("D5","tripletQuaver"),note("C5","tripletQuaver"),note("A4","tripletQuaver")],{ties:[[3,4]],triplets:[[4,6]],beamGroups:[{start:4,end:6}],lyricSyllables:["", "", "", "I've", "got", "the", "month"]}),
    bar([note("C5","quaver"),note("A4","semiquaver"),note("G4","semiquaver"),note("G4","minim"),rest("crotchetRest")],{ties:[[2,3]],beamGroups:[{start:0,end:2}],lyricSyllables:["of", "", "", "May.", ""]}),
    bar([rest("semibreveRest")],{beamGroups:[],lyricSyllables:[""]}),
    bar([note("G4","minim"),note("A4","minim")],{beamGroups:[],lyricSyllables:["I", "guess"]}),
    bar([note("C5","minim"),note("D5","minim")],{beamGroups:[],lyricSyllables:["you'll", "say,"]}),
    bar([note("G4","crotchet"),note("G4","crotchet"),note("A4","crotchet"),note("A4","crotchet")],{beamGroups:[],lyricSyllables:["what", "can", "make", "me"]}),
    bar([note("C5","crotchet"),note("C5","crotchet"),note("D5","dottedQuaver"),note("C5","semiquaver"),note("A4","quaver"),rest("quaverRest")],{beamGroups:[{start:2,end:3}],lyricSyllables:["feel", "this", "way?", "", "", ""]}),
    bar([note("C5","quaver"),note("G4","dottedCrotchet"),note("C5","quaver"),note("G4","dottedCrotchet")],{beamGroups:[],lyricSyllables:["My", "girl,", "(my", "girl,)"]}),
    bar([note("E5","quaver"),note("C5","dottedCrotchet"),note("G4","quaver"),note("A4","quaver"),note("C5","crotchet")],{beamGroups:[{start:2,end:3}],lyricSyllables:["(my", "girl,)", "talk-", "in'", "'bout"]}),
    bar([note("C5","quaver"),note("D5","quaver"),note("D5","tripletQuaver"),note("C5","tripletQuaver"),note("A4","tripletQuaver"),note("C5","minim")],{ties:[[1,2]],triplets:[[2,4]],beamGroups:[{start:0,end:1},{start:2,end:4}],toCoda:true,lyricSyllables:["", "my", "", "", "girl.", ""],lyricExtensions:[{from:1,to:2,offset:15},{from:4,to:5,offset:22}]}),
    bar([note("E5","quaver"),note("D5","quaver"),rest("crotchetRest"),rest("quaverRest"),note("D5","crotchet"),note("E5","quaver")],{beamGroups:[{start:0,end:1}],lyricSyllables:["(My", "girl.)", "", "", "I've", "got"]}),
    bar([note("G5","minim"),note("G5","dottedCrotchet"),note("E5","quaver")],{ties:[[0,1]],lyricSyllables:["so", "", "much"],lyricExtensions:[{from:0,to:1,offset:14}]}),
    bar([note("E5","semiquaver"),note("D5","semiquaver"),note("C5","quaver"),note("C5","crotchet"),rest("quaverRest"),note("A4","semiquaver"),note("D5","semiquaver"),note("D5","semiquaver"),note("C5","quaver"),note("A4","semiquaver")],{ties:[[6,7]],beamGroups:[{start:0,end:2},{start:5,end:6},{start:7,end:9}],lyricSyllables:["ho", "", "-", "ney,", "", "the", "bees", "", "en-", "vy"],lyricOffsets:[0,0,0,0,0,-2,4]}),
    bar([note("G4","minim"),rest("minimRest")],{brassBracket:true,lyricSyllables:["me.", ""]}),
    bar([rest("minimRest"),rest("crotchetRest"),note("A4","tripletQuaver"),note("C5","tripletQuaver"),note("D5","tripletQuaver")],{triplets:[[2,4]],beamGroups:[{start:2,end:4}],lyricSyllables:["", "", "I've", "got", "a"]}),
    bar([note("D5","quaver"),note("E5","quaver"),note("D5","quaver"),note("D5","quaver"),note("D5","semiquaver"),note("C5","semiquaver"),note("A4","quaver"),rest("crotchetRest")],{ties:[[3,4]],beamGroups:[{start:0,end:3},{start:4,end:6}],lyricSyllables:["", "sweet-", "er", "song", "", "", "", ""],lyricExtensions:[{from:3,to:6,offset:22}]}),
    bar([rest("crotchetRest"),rest("tripletQuaver"),note("C5","tripletQuaver"),note("D5","tripletQuaver"),note("C5","crotchet"),rest("tripletQuaver"),note("C5","tripletQuaver"),note("A4","tripletQuaver")],{triplets:[[1,3],[5,7]],beamGroups:[{start:2,end:3},{start:6,end:7}],lyricSyllables:["", "", "than", "the", "birds", "", "in", "the"]}),
    bar([note("G4","minim"),rest("minimRest")],{beamGroups:[],lyricSyllables:["trees.", ""]}),
    bar([rest("minimRest"),rest("quaverRest"),note("E5","quaver"),note("E5","crotchet",{gracePitch:"D5"})],{finalBarline:"single",lyricSyllables:["", "", "Well,", ""],lyricExtensions:[{from:2,to:3,offset:25}]}),
  ];
  // Source page 6: continuation below the new system, final melisma and italic echoes.
  q2bBars[6].lyricContinuation={to:0,startOffset:-16,endOffset:10};
  q2bBars[12].lyricExtensions=[{from:2,to:4,offset:22}];
  q2bBars[13].lyricItalicIndices=[2,3];
  q2bBars[14].lyricItalicIndices=[0,1];
  q2bBars[16].lyricItalicIndices=[0,1];
  q2bBars[16].lyricOffsets=[-4,4];
  q2bBars[6].lyricOffsets=[0,0,0,0,0,-4,6];
  q2bBars[18].lyricOffsets=[0,0,0,0,0,-7,7];
  [[2,3],[5,6],[14,15],[20,21]].forEach(([from,to])=>{q2bBars[from].notes.at(-1).tieToNextBar=true;q2bBars[to].notes[0].tiedFromPreviousBar=true;});

  // Page 8, rendered at 300 dpi. Bars 2–4 sound an octave above the written
  // notes. A two-sharp D-major signature begins at bar 9.
  const q2cBars = [
    bar([note("G5","quaver"),rest("quaverRest"),note("C6","crotchet"),note("C6","quaver"),note("G5","crotchet"),note("C6","quaver")],{"ties": [[2, 3]], "beamGroups": []}),
    bar([note("A5","semiquaver"),note("G5","semiquaver"),note("F5","quaver"),note("F5","crotchet"),rest("crotchetRest"),rest("quaverRest"),note("E4","semiquaver"),note("F4","semiquaver")],{"ties": [], "beamGroups": [{"start": 0, "end": 2}, {"start": 6, "end": 7}]}),
    bar([note("G4","quaver"),rest("quaverRest"),note("C5","crotchet"),note("C5","quaver"),note("G4","crotchet"),note("C5","quaver")],{"ties": [[2, 3]], "beamGroups": []}),
    bar([note("A4","semiquaver"),note("G4","semiquaver"),note("F4","quaver"),note("F4","crotchet"),rest("crotchetRest"),note("F5","semiquaver"),note("A5","semiquaver"),note("F5","semiquaver"),note("E5","semiquaver")],{"ties": [], "beamGroups": [{"start": 0, "end": 2}, {"start": 5, "end": 8}]}),
    bar([note("F5","quaver"),rest("quaverRest"),note("D5","crotchet"),note("D5","quaver"),note("E5","quaver"),note("F5","quaver"),note("A5","quaver")],{"ties": [[2, 3]], "beamGroups": [{"start": 3, "end": 6}]}),
    bar([note("B5","crotchet"),note("B5","crotchet"),note("B5","quaver"),note("D5","semiquaver"),note("E5","semiquaver"),note("F5","semiquaver"),note("G5","semiquaver"),note("A5","semiquaver"),note("G5","semiquaver")],{"ties": [[1, 2]], "beamGroups": [{"start": 2, "end": 4}, {"start": 5, "end": 8}]}),
    bar([note("B4","quaver",{"chord": ["B4", "E5"]}),rest("quaverRest"),note("B4","crotchet",{"chord": ["B4", "E5"]}),note("B4","quaver",{"chord": ["B4", "E5"]}),note("B4","quaver",{"chord": ["B4", "E5"]}),note("B4","quaver",{"chord": ["B4", "E5"]}),note("B4","quaver",{"chord": ["B4", "E5"]})],{"ties": [[2, 3]], "beamGroups": [{"start": 3, "end": 6}]}),
    bar([note("A4","quaver",{"chord": ["A4", "C#5"]}),note("A4","quaver",{"chord": ["A4", "C#5"]}),note("A4","quaver",{"chord": ["A4", "C#5"]}),rest("quaverRest"),rest("quaverRest"),note("F#5","crotchet"),note("F#5","quaver")],{"ties": [], "beamGroups": [{"start": 0, "end": 1}]}),
    bar([note("F#5","quaver"),note("E5","quaver"),note("D5","quaver"),note("E5","quaver"),note("E5","semiquaver"),note("F#5","semiquaver"),note("E5","semiquaver"),note("D5","semiquaver"),note("D5","quaver"),rest("quaverRest")],{"ties": [[3, 4], [7, 8]], "beamGroups": [{"start": 0, "end": 3}, {"start": 4, "end": 7}]}),
    bar([rest("crotchetRest"),rest("quaverRest"),note("E5","quaver"),note("E5","dottedCrotchet"),note("D5","quaver")],{"ties": [[2, 3]], "beamGroups": []}),
    bar([note("B4","quaver"),note("B4","quaver"),note("A4","crotchet"),rest("minimRest")],{"ties": [], "beamGroups": [{"start": 0, "end": 1}], "finalBarline": "single"}),
  ];
  const q2cPickup=bar([rest("quaverRest"),note("E5","semiquaver"),note("F5","semiquaver")],{beamGroups:[{start:1,end:2}],anacrusis:true});

  // Page 12, rendered at 300 dpi. The score was audited system by system in
  // F major. Bar 5's B-flat is rewritten as A-sharp, bar 10 needs a natural
  // on its first B, and bar 12 needs F above the word “her”.
  q2cBars[7].lyricSyllables=["","","","","","I","don’t"];
  q2cBars[6].chordTieYOffset=-6;
  q2cBars[6].lowerChordTie=true;
  q2cBars[7].notes.slice(0,3).forEach(item=>{item.stemDown=true;item.chordAccidentalXOffset=-7;});
  q2cBars[7].notes[1].suppressChordAccidental=true;
  q2cBars[7].notes[2].suppressChordAccidental=true;
  q2cBars[7].notes[6].suppressAccidental=true;
  q2cBars[7].finalBarline="double";
  q2cBars[8].lyricSyllables=["need","no","","mo","","-","","ney,","",""];
  q2cBars[8].lyricExtensions=[{from:1,to:2,offset:14}];
  q2cBars[9].lyricSyllables=["","","for -","","tune"];
  q2cBars[10].lyricSyllables=["or","fame.","",""];
  q2cBars[10].lyricOffsets=[-3,7];
  q2cBars[10].lyricExtensions=[{from:1,to:2,offset:24}];

  const q4Bars = [
    bar([rest("crotchetRest"),note("C5","crotchet"),note("C5","crotchet"),note("D5","crotchet")],{"lyrics": ["", "The", "sil -", "ver"]}),
    bar([note("E5","dottedMinim"),note("F5","crotchet")],{"lyrics": ["swan,", "who"]}),
    bar([note("D5","dottedCrotchet"),note("C5","quaver"),note("Bb4","crotchet"),note("A4","crotchet")],{"lyrics": ["liv -", "ing", "had", "no"]}),
    bar([note("G4","dottedMinim"),note("G4","crotchet")],{"lyrics": ["note.", "When"]}),
    bar([note("Bb4","dottedCrotchet"),note("C5","quaver"),note("D5","crotchet"),note("A4","crotchet")],{"lyrics": ["death", "ap-", "proached", "un -"]}),
    bar([note("C5","crotchet"),note("F4","crotchet"),note("G4","dottedCrotchet"),note("F4","quaver")],{"lyrics": ["locked", "her", "si -", "lent"]}),
    bar([note("F4","minim"),rest("minimRest")],{"lyrics": ["throat.", ""]}),
    bar([rest("crotchetRest"),note("F5","crotchet"),note("F5","quaver"),note("F5","quaver"),note("E5","crotchet")],{"lyrics": ["", "Lean-", "ing", "her", "breast"], "ties": [[1, 2]], "beamGroups": [{"start": 2, "end": 3}]}),
    bar([note("D5","dottedMinim"),note("C5","crotchet")],{"lyrics": ["", "a -"]}),
    bar([note("B4","crotchet",{missingAccidental:"natural"}),note("C5","crotchet"),note("D5","dottedCrotchet"),note("C5","quaver")],{"lyrics": ["gainst", "the", "reed -", "y"]}),
    bar([note("C5","minim"),rest("crotchetRest"),note("G5","crotchet")],{"lyrics": ["shore,", "", "Thus"]}),
    bar([note("C5","crotchet"),note("F5","crotchet",{missing:true}),note("Bb4","crotchet"),note("D5","crotchet")],{"lyrics": ["sung", "her", "first", "and"], "missingIndices": [1]}),
    bar([note("G4","crotchet"),note("A4","quaver"),note("Bb4","quaver"),note("C5","dottedCrotchet"),note("Bb4","quaver")],{"lyrics": ["last,", "and_", "sung", "no", ""], "slurs": [{"start": 1, "end": 2}], "beamGroups": [{"start": 1, "end": 2}]}),
    bar([note("A4","minim"),rest("minimRest")],{"lyrics": ["more.", ""], "finalBarline": "double"}),
  ];
  q4Bars[7].lyricOffsets=[0,0,0,-5,8];
  q4Bars[12].lyricOffsets=[0,-5,4,5,0];
  q4Bars[6].cueVoice={notes:[rest("crotchetRest"),note("A4","crotchet",{stemDown:true}),note("A4","quaver",{stemDown:true}),note("A4","quaver",{stemDown:true}),note("G4","crotchet",{stemDown:true})],ties:[[1,2]],beamGroups:[{start:2,end:3}],lyricSyllables:["","(Lean","","- ing","her"]};
  q4Bars[7].cueVoice={notes:[note("F4","crotchet",{stemDown:true})],partial:true,lyricSyllables:["breast)"]};

  // Page 15, rendered at 300 dpi. Bars 9–10 have four omitted notes; bar 13
  // contains the treble D4 that must be copied at sounding pitch in bass clef.
  const q5Bars = [
    bar([note("F4","crotchet"),note("E4","quaver"),note("D4","quaver")]),
    bar([note("E4","quaver"),note("F4","quaver"),note("G4","crotchet")]),
    bar([note("D4","minim")]),
    bar([note("C5","crotchet"),note("B4","quaver"),note("A4","quaver")]),
    bar([note("B4","quaver"),note("C5","quaver"),note("D5","crotchet")]),
    bar([note("A4","minim")]),
    bar([note("D5","quaver",{stemDown:true}),note("C5","quaver",{stemDown:true}),note("B4","quaver",{stemDown:false}),note("A4","quaver",{stemDown:false})],{beamGroups:[{start:0,end:1},{start:2,end:3}]}),
    bar([note("B4","crotchet"),note("G4","crotchet")]),
    bar([note("G4","quaver"),note("F4","quaver"),note("E4","quaver",{missing:true}),note("D4","quaver",{missing:true})],{missingIndices:[2,3],beamGroups:[{start:0,end:1}]}),
    bar([note("E4","crotchet",{missing:true}),note("C4","crotchet",{missing:true})],{missingIndices:[0,1]}),
    bar([note("F4","crotchet"),note("E4","quaver"),note("D4","quaver")]),
    bar([note("E4","quaver"),note("F4","quaver"),note("G4","crotchet")]),
    bar([note("D4","minim")],{bassClefAnswer:"D4",finalBarline:"double"}),
  ];

  const data = {
    q2a:{key:"C major",timeSignature:"4/4",options:q2aOptions,answer:1,layout:{height:160}},
    q2bRhythm:{key:"C major",timeSignature:"4/4",bars:q2bRhythmBars,layout:{height:170}},
    q2:{
      b:{key:"C major",timeSignature:"4/4",bars:q2bBars,repeatSigns:{startBar:10,endBar:25,answer:"start-bar-10,end-bar-25"},brassBracket:{bar:20,answer:"bar-20-bracket"}},
      c:{key:"C major",timeSignature:"4/4",pickup:q2cPickup,bars:q2cBars,octaveSign:{bars:[2,4],answer:"one octave higher"},keyChange:{bar:9,key:"D major"}},
      finalBarline:"single",layout:{height:2200,bGroups:[[0,1,2],[3,4,5],[6,7,8],[9,10,11,12],[13,14,15],[16,17,18],[19,20,21],[22,23,24]],bTops:[90,260,430,600,770,940,1110,1280],bBounds:[[165,357,614,870],[105,336,596,870],[105,423,709,870],[105,272,430,641,870],[105,356,613,870],[105,351,542,870],[105,289,547,870],[105,435,624,870]],cGroups:[[0,1],[2,3],[4,5],[6,7],[8,9,10]],cTops:[1540,1670,1800,1930,2060]},
    },
    q4:{key:"F major",timeSignature:"4/4",bars:q4Bars,cadence:{bars:[3,4],answer:"Imperfect"},enharmonic:{bar:5,note:0,source:"Bb4",answer:"A#4"},accidental:{bar:10,note:0,answer:"natural"},interval:{bar:12,sourceNote:0,targetNote:1,source:"C5",answer:"F5",guideRhythm:"crotchet"},finalBarline:"double",cueLayout:{quaverStemOffset:1,bar7MinimRestTopOffset:-11,bar7CueRestTopOffset:38,bar8CrotchetRestTopOffset:-26,cueLyricTopOffset:73,throatLyricTopOffset:94},layout:{height:1050,groups:[[0,1,2,3],[4,5],[6,7,8,9],[10,11,12,13]],systemTops:[130,380,650,900]}},
    q5:{key:"C major",timeSignature:"2/4",bars:q5Bars,missing:{bars:[9,10],indices:[[2,3],[0,1]],answer:["E4","D4","E4","C4"],rhythms:["quaver","quaver","crotchet","crotchet"]},bassClef:{bar:13,source:"D4",answer:"D4",rhythm:"minim"},finalBarline:"double",layout:{height:660,groups:[[0,1,2,3],[4,5,6,7],[8,9,10,11,12]],systemTops:[85,260,445]}},
  };

  if (typeof module !== "undefined" && module.exports) module.exports = data;
  root.AdvancedHigher2023Notation = data;
})(typeof window !== "undefined" ? window : globalThis);
