(function(root) {
  "use strict";

  const beats = { semiquaver:.25, quaver:.5, crotchet:1, dottedCrotchet:1.5, minim:2, dottedMinim:3, semibreve:4, quaverRest:.5, crotchetRest:1, minimRest:2 };
  const note = (pitch, rhythm, extra = {}) => ({ pitch, rhythm, beats: beats[rhythm], ...extra });
  const rest = (rhythm, extra = {}) => ({ rest:true, rhythm, beats: beats[rhythm], ...extra });
  const bar = (notes, extra = {}) => ({ notes, ...extra });

  // Audited from independent 600 dpi crops of every printed staff system. The
  // answer locations were then checked against the final marking instructions.
  const q2aBars = [
    bar([note("D5","crotchet"),note("E5","crotchet"),note("F5","crotchet"),note("A5","crotchet",{grace:["G#5"]})]),
    bar([note("G5","minim",{courtesyAccidental:"natural"}),note("E4","quaver"),note("F4","quaver"),note("E4","quaver"),note("D4","quaver",{tieToNextBar:true})]),
    bar([note("D4","quaver"),note("G4","dottedCrotchet"),note("G4","minim")],{ties:[[1,2]]}),
    bar([rest("minimRest"),note("F4","quaver"),note("E4","quaver"),note("F4","quaver"),note("E4","quaver",{tieToNextBar:true})]),
    bar([note("E4","crotchet"),note("D4","quaver"),note("D4","quaver"),note("D4","minim")],{ties:[[2,3]]}),
    bar([rest("minimRest"),note("E4","quaver"),note("F4","quaver"),note("E4","quaver"),note("D4","quaver",{tieToNextBar:true})]),
    bar([note("D4","dottedCrotchet"),note("G4","quaver"),note("G4","minim")],{ties:[[1,2]]}),
    bar([rest("minimRest"),note("F4","quaver"),note("E4","quaver"),note("F4","quaver"),note("E4","quaver",{tieToNextBar:true})]),
    bar([note("E4","crotchet"),note("D4","quaver"),note("D4","quaver"),note("D4","minim")],{ties:[[2,3]]}),
    bar([rest("minimRest"),note("A4","crotchet"),note("A4","quaver"),note("A4","quaver")]),
    bar([note("G4","crotchet"),note("D4","dottedMinim")]),
    bar([rest("crotchetRest"),note("E4","quaver"),note("D4","quaver"),note("E4","crotchet"),note("G4","crotchet")],{missingIndices:[0,1,2,3,4]}),
    bar([note("E4","semiquaver"),note("D4","semiquaver"),note("C4","quaver"),note("C4","minim"),note("D4","quaver"),note("E4","quaver")],{ties:[[2,3]]}),
    bar([note("F4","dottedMinim"),note("F4","quaver"),note("E4","quaver")]),
    bar([note("D4","crotchet"),note("D4","quaver"),note("E4","quaver"),note("E4","crotchet"),note("D4","crotchet")],{ties:[[2,3]]}),
    bar([note("C4","minim"),note("E5","quaver",{grace:["D#5"]}),note("D5","quaver",{courtesyAccidental:"natural"}),note("C5","quaver"),note("D5","quaver")]),
  ];
  const q2bMelody = [
    bar([note("G5","minim"),note("E4","quaver"),note("F4","quaver"),note("E4","quaver"),note("D4","quaver",{tieToNextBar:true})]),
    bar([note("D4","quaver"),note("G4","dottedCrotchet"),note("G4","minim")],{ties:[[1,2]]}),
    bar([rest("minimRest"),note("F4","quaver"),note("E4","quaver"),note("F4","quaver"),note("E4","quaver",{tieToNextBar:true})]),
    bar([note("E4","crotchet"),note("D4","quaver"),note("D4","quaver"),note("D4","minim")],{ties:[[2,3]]}),
    bar([rest("minimRest"),note("E4","quaver"),note("F4","quaver"),note("E4","quaver"),note("D4","quaver")]),
  ];
  const q2cBars = [
    bar([note("A3","minim"),note("D4","minim"),note("E4","crotchet")]),
    bar([note("F#4","crotchet"),note("A4","quaver"),note("F#4","quaver"),note("B4","minim"),note("A4","crotchet")]),
    bar([note("E4","crotchet"),note("F#4","quaver"),note("G4","quaver"),note("F#4","crotchet"),note("E4","crotchet"),note("F#4","crotchet")]),
    bar([note("B3","crotchet"),note("C#4","quaver"),note("D4","quaver"),note("C#4","crotchet"),note("B3","crotchet"),note("E4","crotchet")]),
    bar([note("A3","minim"),note("D4","minim"),note("E4","crotchet")]),
    bar([note("F#4","crotchet"),note("A4","quaver"),note("F#4","quaver"),note("D5","minim"),note("C#5","crotchet")]),
    bar([note("B4","crotchet"),note("C#5","quaver"),note("D5","quaver"),note("C#5","crotchet"),note("B4","crotchet"),note("C#5","crotchet")]),
    bar([note("F#4","crotchet"),note("G#4","quaver"),note("A4","quaver"),note("G4","crotchet"),note("F#4","crotchet"),note("B4","crotchet")]),
    bar([note("A4","minim"),note("A3","minim"),note("A3","crotchet")],{octaveAnswer:"A2"}),
  ];
  const q2dBars = [
    bar([note("D4","crotchet"),note("F4","crotchet",{courtesyAccidental:"natural"}),note("G4","minim"),note("F4","crotchet")]),
    bar([note("E4","minim"),note("E4","dottedMinim")],{ties:[[0,1]]}),
    bar([note("D4","crotchet"),note("F4","crotchet",{courtesyAccidental:"natural"}),note("G4","minim"),note("F4","crotchet")]),
    bar([note("E4","minim"),note("E4","minim"),note("E4","crotchet")]),
    bar([note("F#4","crotchet"),note("A4","crotchet"),note("B4","minim"),note("A4","crotchet")]),
    bar([note("G4","crotchet"),note("B4","crotchet"),note("D5","minim"),note("C5","crotchet",{courtesyAccidental:"natural"})]),
    bar([note("B4","crotchet"),note("D5","crotchet"),note("F#5","minim"),note("E5","crotchet")],{augmentedIndex:2}),
    bar([rest("crotchetRest"),note("F#4","crotchet"),note("E4","crotchet"),note("F#4","crotchet"),note("E4","crotchet")]),
  ];

  const q4Bars = [
    bar([note("E4","crotchet"),note("E4","crotchet"),note("D#4","crotchet"),note("B3","crotchet")]),
    bar([note("E4","crotchet"),note("F#4","crotchet"),note("G4","crotchet"),note("G4","crotchet")]),
    bar([note("A4","crotchet"),note("G4","crotchet"),note("F#4","crotchet",{fermata:true}),note("F#4","crotchet")]),
    bar([note("G4","crotchet"),note("A4","crotchet"),note("B4","crotchet"),note("A4","quaver"),note("G4","quaver")]),
    bar([note("C5","crotchet"),note("C5","crotchet"),note("B4","crotchet"),note("Bb4","quaver"),note("A4","quaver")],{enharmonicIndex:3}),
    bar([note("A4","minim"),note("G4","crotchet",{fermata:true}),note("G4","crotchet")]),
    bar([note("F#4","crotchet"),note("E4","crotchet"),note("D4","crotchet"),note("B3","quaver"),note("C4","quaver")]),
    bar([note("D4","crotchet"),note("D4","crotchet"),note("E4","crotchet"),note("D4","crotchet")]),
    bar([note("C4","minim"),note("B3","crotchet",{fermata:true,fermataYOffset:-35}),note("B3","crotchet")]),
    bar([note("A4","crotchet"),note("G4","quaver"),note("F#4","quaver"),note("F#4","minim")]),
    bar([note("E4","dottedMinim")],{partial:true}),
  ];

  const q5bRhythms = [
    "semiquaver","semiquaver",
    "quaver","semiquaver","semiquaver",
    "semiquaver","semiquaver","semiquaver","semiquaver",
    "semiquaver","semiquaver","quaver",
    "quaver","semiquaver","semiquaver",
    "quaver","quaver","quaver","quaver",
    "semiquaver","semiquaver","semiquaver","semiquaver","crotchet",
  ];
  const q5bBarRanges = [[0,2],[2,9],[9,15],[15,19],[19,24]];
  const q5bBarWidths = [0.5,2.05,1.85,1.55,1.65];
  const q5bBarBeamGroups = [
    [{start:0,end:1}],
    [{start:0,end:2},{start:3,end:6}],
    [{start:0,end:2},{start:3,end:5}],
    [{start:0,end:1},{start:2,end:3}],
    [{start:0,end:3}],
  ];
  const option = pitches => q5bBarRanges.map(([start,end],barIndex) => bar(
    pitches.slice(start,end).map((pitch,index) => note(pitch,q5bRhythms[start+index])),
    {beamGroups:q5bBarBeamGroups[barIndex],width:q5bBarWidths[barIndex],partial:barIndex===0},
  ));
  const q5bOptions = [
    option(["C4","C4","F4","F4","G4","A4","F4","A4","Bb4","C5","C5","Bb4","A4","G4","F4","G4","G4","G4","A4","G4","A4","G4","E4","C4"]),
    option(["C4","C4","F4","F4","G4","A4","F4","A4","Bb4","C5","C5","Bb4","A4","G4","F4","G4","G4","G4","F4","G4","A4","G4","E4","C4"]),
    option(["C4","C4","F4","F4","G4","A4","F4","A4","Bb4","C5","C5","Bb4","A4","Bb4","A4","G4","G4","G4","F4","G4","A4","G4","F4","E4"]),
  ];

  const data = {
    q2:{timeSignature:"4/4",key:"C major",bars:q2aBars,missingBar:12,missingAnswer:["crotchetRest","E4","D4","E4","G4"],bassPhraseBars:[9,10],bassPhrase:[bar([note("G2","dottedMinim"),note("G2","quaver"),note("Gb2","quaver")]),bar([note("F2","semibreve")])],bassLine:{melody:q2bMelody,chords:["C","G 1st Inv.","F 1st Inv.","G7","C"],romanNumerals:["I","Vb","IVb","V7","I"],chordPitches:[["E4","G4"],["D4","G4"],["C4","F4"],["B3","F4","G4"],["E4","G4","C5"]],chordXOffsets:[[0,0],[0,0],[0,0],[0,0,16],[0,0,0]],given:["C3","C3"],answer:["B3","A3","G3"],rhythms:["semibreve","semibreve","semibreve"]},second:{timeSignature:"5/4",key:"D major",bars:q2cBars,octaveAnswer:"A2",finalBarline:"repeatRight",layout:{height:625,systemTops:[75,225,375],barStarts:[[145,400,620],[145,400,620],[145,405,640]],barEnds:[[400,620,870],[400,620,870],[405,640,870]],staffLeft:50,staffRight:870,keySignatureYOffset:10,answerBox:{x:680,y:325,width:128,height:250},bassStaff:{top:520,left:575,right:870,barlineX:640}}},third:{key:"D major",bars:q2dBars,augmentedBar:16,augmentedIndex:2},finalBarline:"single",layout:{height:1450}},
    q4:{timeSignature:"4/4",key:"E minor",pickup:bar([note("E4","crotchet")]),bars:q4Bars,enharmonic:{bar:5,note:3,answer:"A#4"},finalBarline:"double",layout:{enharmonicCaption:{"placement":"above","lines":["(c) Enharmonic","note"]},height:780,keySignatureXOffset:-25,keySignatureYOffset:10,timeSignatureXOffset:12,fermataYOffset:-20,pickupBarlineX:168,systemEndBarlines:[0,1],keyBox:{x:48,y:12,width:220,height:58,labelY:55,input:{x:122,y:31,width:130,height:27}},cadenceBox:{bar:3,startBeat:2,endBeat:3,y:58,height:165,outerPaddingX:5,inputY:173,inputHeight:28,inset:5},enharmonicBox:{bar:5,note:3,paddingX:25,y:288,height:215,staffTop:445,staffWidth:110,staffLeftExtension:15},harmonicBox:{x:642,y:483,width:238,height:238,input:{x:660,y:662,width:200,height:28}}}},
    q5b:{timeSignature:"2/4",key:"F major",options:q5bOptions,answerOption:1,finalBarline:"single",layout:{barWidths:q5bBarWidths,viewBox:{x:30,y:0,width:790,height:150},staffTop:53,staffLeft:55,staffRight:800,scoreStart:170,noteXOffset:-10,firstNoteExtraXOffset:-5,voiceX:195}},
  };

  if (typeof module !== "undefined" && module.exports) module.exports = data;
  root.AdvancedHigher2018Notation = data;
})(typeof window !== "undefined" ? window : globalThis);
