(function(root) {
  "use strict";

  const beats = {
    semiquaver: .25, quaver: .5, dottedQuaver: .75, crotchet: 1, dottedCrotchet: 1.5,
    minim: 2, dottedMinim: 3, semibreve: 4, dottedSemibreve: 6, quaverRest: .5, crotchetRest: 1,
    dottedCrotchetRest: 1.5, minimRest: 2, dottedMinimRest: 3, semibreveRest: 4,
  };
  const note = (pitch, rhythm, extra = {}) => ({ pitch, rhythm, beats: beats[rhythm], ...extra });
  const rest = (rhythm, extra = {}) => ({ rest: true, rhythm, beats: beats[rhythm], ...extra });
  const bar = (notes, extra = {}) => ({ notes, ...extra });
  const grandBar = (upper, lower, extra = {}) => ({ upper, lower, ...extra });

  // Re-audited note by note from the 600 dpi page-3 crop. The printed phrase
  // is in 3/4 and begins with a one-crotchet upbeat. Each option then has three
  // complete bars and a two-beat closing bar. Option 3 is the version identified
  // by the finalised marking instructions.
  const q1dPickup = bar([note("C4","crotchet")], { partial: true, beats: 1 });
  const q1dBeams = [{ start: 0, end: 1 }, { start: 2, end: 3 }, { start: 4, end: 5 }];
  const q1dOptions = [
    [
      bar([note("D4","crotchet"),note("A3","crotchet"),note("D4","crotchet")]),
      bar([note("C4","quaver"),note("B3","quaver"),note("A3","quaver"),note("C4","quaver"),note("B3","quaver"),note("A3","quaver")], { beamGroups: q1dBeams }),
      bar([note("B3","dottedCrotchet"),note("C4","quaver"),note("B3","quaver"),note("C4","quaver")], { beamGroups: [{ start: 2, end: 3 }] }),
      bar([note("A3","crotchet"),rest("crotchetRest")], { partial: true, beats: 2 }),
    ],
    [
      bar([note("D4","crotchet"),note("D3","crotchet"),note("D4","crotchet")]),
      bar([note("C4","quaver"),note("B3","quaver"),note("A3","quaver"),note("C4","quaver"),note("D4","quaver"),note("E4","quaver")], { beamGroups: q1dBeams }),
      bar([note("D4","dottedCrotchet"),note("C4","quaver"),note("D4","quaver"),note("E4","quaver")], { beamGroups: [{ start: 2, end: 3 }] }),
      bar([note("C4","crotchet"),rest("crotchetRest")], { partial: true, beats: 2 }),
    ],
    [
      bar([note("D4","crotchet"),note("D3","crotchet"),note("D4","crotchet")]),
      bar([note("C4","quaver"),note("B3","quaver"),note("A3","quaver"),note("C4","quaver"),note("B3","quaver"),note("A3","quaver")], { beamGroups: q1dBeams }),
      bar([note("D4","dottedCrotchet"),note("E4","quaver"),note("D4","quaver"),note("E4","quaver")], { beamGroups: [{ start: 2, end: 3 }] }),
      bar([note("C4","crotchet"),rest("crotchetRest")], { partial: true, beats: 2 }),
    ],
  ];

  // Transcribed note by note from the 600 dpi crop of official paper page 5.
  // Question 2 has three explicit time-signature regions. The missing rests
  // occupy the first two dotted-crotchet beats of bar 1; the printed opening
  // quaver remains visible and is not part of the pupil response. Bar 8 is an
  // intentionally shortened final bar: 9/8 of music under the continuing 12/8.
  const q2Bars = [
    bar([note("G4","quaver"),rest("crotchetRest",{answerSlot:0}),rest("dottedCrotchetRest",{answerSlot:1}),rest("dottedCrotchetRest"),note("C4","quaver"),note("D4","quaver"),note("G4","quaver")],{missingRestIndices:[1,2]}),
    bar([note("G4","dottedCrotchet"),rest("dottedCrotchetRest"),rest("dottedCrotchetRest"),note("A4","quaver"),note("B4","quaver"),note("G4","quaver")],{beamGroups:[{start:3,end:5}]}),
    bar([note("A4","quaver"),note("B4","quaver"),note("B4","quaver"),note("B4","dottedCrotchet"),note("B4","quaver"),note("D5","quaver"),note("D4","quaver")],{timeSignature:"9/8",beamGroups:[{start:0,end:2},{start:4,end:6}]}),
    bar([note("E4","dottedMinim"),rest("crotchetRest"),note("D4","quaver"),note("E4","quaver"),note("G4","quaver"),note("C4","quaver")],{timeSignature:"12/8",chordBoxIndices:[3,4,5],beamGroups:[{start:3,end:5}]}),
    bar([note("D4","dottedMinim"),rest("crotchetRest"),note("D4","quaver"),note("E4","quaver"),note("G4","quaver"),note("C4","quaver")],{beamGroups:[{start:3,end:5}]}),
    bar([note("D4","dottedMinim"),rest("crotchetRest"),note("D4","quaver"),note("E4","quaver"),note("G4","quaver"),note("A4","quaver",{fermata:true,fermataYOffset:15})],{bassClefAnswer:"D4",beamGroups:[{start:3,end:4}]}),
    bar([note("G4","dottedSemibreve",{tieToNextBar:true})]),
    bar([note("G4","dottedMinim",{tiedFromPreviousBar:true,tieToNext:true}),note("G4","dottedCrotchet",{tiedFromPrevious:true})],{ties:[[0,1]],incompleteBeats:4.5,finalBarline:"double"}),
  ];

  // Page 10 re-transcribed at 600 dpi, then checked independently note by note.
  // Treble lines E4/G4/B4/D5/F5; bass lines G2/B2/D3/F3/A3.
  // Beam groups, articulations and ties are source content, not renderer guesses.
  const pairs = [{start:1,end:2},{start:3,end:4}];
  const ostinato1 = () => bar([note("D3","crotchet",{staccato:true}),note("A3","quaver"),note("D3","quaver"),note("G#3","quaver",{accent:true}),note("A3","quaver",{staccato:true}),rest("crotchetRest")],{beamGroups:pairs});
  const ostinato2 = () => bar([note("D3","crotchet",{staccato:true}),note("A3","quaver"),note("D3","quaver"),note("Ab3","quaver",{accent:true}),note("G3","quaver"),note("F3","crotchet",{staccato:true})],{beamGroups:pairs});
  const ostinato3 = () => bar([note("D3","crotchet",{staccato:true}),note("F3","quaver"),note("D3","quaver"),note("G3","quaver",{accent:true}),note("G#3","quaver",{staccato:true}),rest("crotchetRest")],{beamGroups:pairs});
  const openingChord = () => bar([note("D4","semibreve",{chord:["D4","F4"]})]);
  const offbeatChords = () => bar([rest("crotchetRest"),note("D4","crotchet",{chord:["D4","F4"],staccato:true}),rest("crotchetRest"),note("D4","crotchet",{chord:["D4","F4"],staccato:true})]);
  const q4Bars = [
    grandBar(openingChord(),ostinato1(),{tiesUpperToNext:[0]}),
    grandBar(openingChord(),ostinato2(),{tiesUpperToNext:[0]}),
    grandBar(openingChord(),ostinato3()),
    grandBar(bar([note("A4","quaver"),note("G4","quaver"),note("F4","quaver"),note("D4","quaver"),rest("minimRest")],{missingIndices:[0,1,2,3],beamGroups:[{start:0,end:3}]}),bar([note("A3","quaver"),note("G3","quaver"),note("F3","quaver"),note("D3","quaver",{staccato:true}),rest("minimRest")],{beamGroups:[{start:0,end:3}]}),{missingAnswer:["A4","G4","F4","D4"],missingBoxIndices:[0,1,2,3]}),
    grandBar(offbeatChords(),ostinato1(),{interval:{indices:[2,3],lower:"D3",upper:"G#3",answer:"Tritone"}}),
    grandBar(offbeatChords(),ostinato2()),
    grandBar(offbeatChords(),ostinato3()),
    grandBar(bar([note("A4","quaver"),note("B4","quaver",{courtesyAccidental:"natural"}),note("C#5","quaver"),note("D5","quaver"),rest("minimRest")],{beamGroups:[{start:0,end:3}]}),bar([note("G3","quaver"),note("F3","quaver"),note("E3","quaver"),note("D3","quaver"),rest("minimRest")],{beamGroups:[{start:0,end:3}]})),
    grandBar(bar([rest("quaverRest"),note("D5","quaver"),note("F5","quaver"),note("G5","quaver"),note("Ab5","quaver"),note("G5","quaver"),note("F5","quaver"),note("D5","quaver")],{beamGroups:[{start:2,end:3},{start:4,end:7}]}),bar([note("G3","semibreve",{chord:["G3","B3"],chordAccidentals:{B3:"natural"}})]),{tiesUpperToNext:[7]}),
    grandBar(bar([note("D5","dottedMinim"),rest("crotchetRest")]),bar([note("D3","crotchet",{staccato:true}),note("F3","quaver"),note("D3","quaver"),note("G3","quaver"),note("G#3","quaver"),note("A3","quaver"),note("G3","quaver",{chord:["G3","B3"],chordAccidentals:{G3:"natural",B3:"natural"}})],{beamGroups:[{start:1,end:2},{start:3,end:6}]}),{tiesLowerToNext:[6]}),
    grandBar(bar([rest("quaverRest"),note("D5","quaver"),note("F5","quaver"),note("G5","quaver"),note("Ab5","quaver"),note("F5","quaver",{staccato:true}),note("Ab5","quaver",{suppressAccidental:true}),note("F5","quaver",{staccato:true})],{beamGroups:[{start:2,end:3},{start:4,end:7}]}),bar([note("G3","semibreve",{chord:["G3","B3"]})])),
    grandBar(bar([rest("quaverRest"),note("A5","crotchet",{grace:["G#5"]}),note("F5","quaver"),note("G5","quaver",{courtesyAccidental:"natural"}),note("C5","quaver"),note("C#5","quaver",{accidentalAnswer:"sharp",suppressAccidental:true}),note("D5","quaver")],{beamGroups:[{start:3,end:6}]}),bar([note("A2","minim"),rest("minimRest")]),{accidental:{noteIndex:5,answer:"sharp"},tiesUpperToNext:[6]}),
    grandBar(bar([note("D5","semibreve")]),bar([note("D2","crotchet",{staccato:true}),note("F2","quaver"),note("D2","quaver"),note("G2","quaver"),note("G#2","quaver"),note("A2","quaver"),note("D2","quaver",{staccato:true})],{beamGroups:[{start:1,end:2},{start:3,end:6}]}),{tiesUpperToNext:[0]}),
    grandBar(bar([note("D5","semibreve")]),bar([rest("crotchetRest"),note("F2","quaver"),note("D2","quaver"),note("G2","quaver"),note("F2","quaver"),note("E2","crotchet",{staccato:true})],{beamGroups:pairs}),{tiesUpperToNext:[0]}),
    grandBar(bar([note("D5","semibreve")]),bar([note("D2","crotchet",{staccato:true}),note("F2","quaver"),note("D2","quaver"),note("G2","quaver"),note("G#2","quaver"),rest("crotchetRest")],{beamGroups:pairs}),{enharmonic:{noteIndex:4,source:"G#2",answer:"Ab2"}}),
    grandBar(bar([note("A5","quaver",{staccato:true}),note("B5","quaver",{courtesyAccidental:"natural",staccato:true}),note("C#6","quaver",{staccato:true}),note("D6","quaver",{staccato:true}),rest("minimRest")],{beamGroups:[{start:0,end:3}]}),bar([note("G2","quaver",{staccato:true}),note("F2","quaver",{staccato:true}),note("E2","quaver",{staccato:true}),note("D2","quaver",{staccato:true}),rest("crotchetRest"),note("D2","crotchet")],{beamGroups:[{start:0,end:3}]}),{octaveSign:"8vb",octaveNoteIndex:5,tiesLowerToNext:[5]}),
    grandBar(bar([rest("semibreveRest")]),bar([note("D2","minim"),rest("minimRest")]),{octaveSign:"8vb",finalBarline:"double"}),
  ];

  q4Bars[7].upper.notes.slice(0,4).forEach(entry => { entry.stemDown = true; });

  const data = {
    q1d:{timeSignature:"3/4",displayTimeSignature:false,key:"A major",clef:"bass",pickup:q1dPickup,options:q1dOptions,answerOption:2,finalBarline:"single",layout:{pickupStart:155,pickupEnd:225,barStarts:[225,390,560,730],barEnds:[390,560,730,870]}},
    q2:{timeSignature:"12/8",key:"G major",pickup:bar([note("C4","quaver"),note("D4","quaver"),note("G4","quaver")],{partial:true}),bars:q2Bars,restBar:1,restSlots:[1,2],acceptedFirstBeat:["quaverRest,quaverRest","crotchetRest"],acceptedSecondBeat:["dottedCrotchetRest","quaverRest,crotchetRest","crotchetRest,quaverRest","quaverRest,quaverRest,quaverRest"],chord:{bar:4,answer:"C major",also:["IV","4"]},bassClef:{bar:6,answer:"D4"},finalBarline:"double",layout:{height:690}},
    q4:{timeSignature:"4/4",key:"F major",bars:q4Bars,missing:{bar:4,indices:[0,1,2,3],answer:["A4","G4","F4","D4"]},interval:{bar:5,answer:"Tritone",also:["Augmented 4th"]},accidental:{bar:12,note:5,answer:"sharp"},enharmonic:{bar:15,source:"G#2",answer:"Ab2"},octaveSign:{bars:[16,17],answer:"one octave lower"},finalBarline:"double",layout:{enharmonicCaption:{"placement":"above","lines":["(ii) Enharmonic"]},height:1300,groups:[[0,1,2],[3,4,5],[6,7,8,9],[10,11,12],[13,14,15,16]],systemTops:[45,295,570,820,1080],barEdges:[[150,360,615,870],[120,355,615,870],[120,275,450,665,870],[120,365,660,870],[120,340,560,770,870]]}},
  };

  if (typeof module !== "undefined" && module.exports) module.exports = data;
  root.AdvancedHigher2019Notation = data;
})(typeof window !== "undefined" ? window : globalThis);
