(function(root) {
  "use strict";

  const beats = {
    demisemiquaver: .125, dottedSemiquaver: .375, semiquaver: .25, quaver: .5, tripletQuaver: 1 / 3, dottedQuaver: .75,
    crotchet: 1, dottedCrotchet: 1.5, minim: 2, dottedMinim: 3, semibreve: 4,
    semiquaverRest: .25, dottedQuaverRest: .75, quaverRest: .5, crotchetRest: 1, dottedCrotchetRest: 1.5,
    minimRest: 2, dottedMinimRest: 3, semibreveRest: 4,
  };
  const note = (pitch, rhythm, extra = {}) => ({ pitch, rhythm, beats: beats[rhythm], ...extra });
  const rest = (rhythm, extra = {}) => ({ rest: true, rhythm, beats: beats[rhythm], ...extra });
  const bar = (notes, extra = {}) => ({ notes, ...extra });
  const grandBar = (upper, lower, extra = {}) => ({ upper, lower, ...extra });

  // Page 4: independently audited 600-dpi systems; see import notes.
  const q2aPickup = grandBar(
    bar([rest('quaverRest'),rest('quaverRest'),note('G3','dottedSemiquaver'),note('G3','demisemiquaver'),note('A3','quaver'),note('C4','quaver'),note('D4','quaver')],{beamGroups:[{start:2,end:3},{start:4,end:6}]}),
    bar([rest('dottedCrotchetRest'),rest('dottedCrotchetRest')]),
    {partialBarBeats:3},
  );
  const q2aBars = [
    grandBar(
      bar([note('E4','dottedCrotchet'),note('G4','quaver'),note('E4','crotchet'),note('D4','crotchet'),note('G3','dottedSemiquaver'),note('G3','demisemiquaver'),note('D4','quaver'),note('E4','quaver'),note('D4','quaver')],{beamGroups:[{start:4,end:5},{start:6,end:8}]}),
      bar([note('C3','dottedCrotchet',{stemDown:true}),note('C3','quaver',{stemDown:true}),note('C3','crotchet',{stemDown:true}),note('B2','dottedCrotchet',{stemDown:true}),note('B2','dottedCrotchet',{stemDown:true})],{ties:[[0,1]],beamGroups:[]}),
      { chordAnswer:'G first inversion', bassUpper:bar([note('C4','dottedMinim',{stemDown:false}),note('G3','dottedMinim',{stemDown:false})]) },
    ),
    grandBar(
      bar([note('E4','dottedCrotchet'),note('E4','crotchet'),note('E4','quaver'),note('C4','crotchet'),note('G3','dottedSemiquaver'),note('G3','demisemiquaver'),note('E4','quaver'),note('D4','quaver'),note('C4','quaver')],{beamGroups:[{start:4,end:5},{start:6,end:8}]}),
      bar([note('A2','dottedCrotchet',{stemDown:true}),note('A2','quaver',{stemDown:true}),note('A2','crotchet',{stemDown:true}),note('G2','dottedCrotchet',{stemDown:true}),note('G2','dottedCrotchet',{stemDown:true})],{ties:[[0,1]],beamGroups:[]}),
      { chordAnswer:'A minor', bassUpper:bar([note('C4','dottedMinim',{chord:['E3','C4'],stemDown:false}),note('G3','dottedMinim',{chord:['E3','G3'],stemDown:false})]) },
    ),
    grandBar(
      bar([note('Eb4','dottedCrotchet'),note('C4','quaver'),note('Eb4','quaver',{suppressAccidental:true}),note('C4','quaver'),note('D4','crotchet'),note('G3','dottedSemiquaver'),note('G3','demisemiquaver'),note('A3','quaver'),note('C4','quaver'),note('D4','quaver')],{boxedIndices:[7,8,9],beamGroups:[{start:1,end:3},{start:5,end:6},{start:7,end:9}]}),
      bar([rest("dottedMinimRest"),rest("dottedMinimRest")]),
      { bassClefAnswer:['A3','C4','D4'] },
    ),
    grandBar(
      bar([note('E4','quaver',{courtesyAccidental:'natural'}),note('G4','quaver'),note('E4','quaver'),note('C4','quaver'),note('G3','quaver'),note('G3','quaver'),note('A3','quaver'),note('B3','quaver'),note('G3','quaver'),rest('dottedCrotchetRest')],{beamGroups:[{start:0,end:2},{start:3,end:5},{start:6,end:8}]}),
      bar([rest("dottedMinimRest"),rest("dottedMinimRest")]),
      { finalBarline:"double" },
    ),
  ];

  // Page 5, rendered at 600 dpi and checked note by note. The accidental
  // target is the E in bar 3; the printed note is natural until the pupil
  // places the required flat.
  const q2bBars = [
    bar([rest('dottedCrotchetRest'),rest('quaverRest'),note('C5','semiquaver'),note('B4','semiquaver'),note('C5','quaver'),note('G4','dottedMinim')],{beamGroups:[{start:2,end:4}],interval:{lower:'G4',upper:'C5',answer:'Perfect 4th'},lyrics:'Sat - ur - day sun,',lyricSyllables:['','','Sat -','ur -','day','sun,']}),
    bar([rest('crotchetRest'),rest('semiquaverRest'),note('C4','semiquaver'),note('E4','semiquaver'),note('D4','semiquaver'),note('C4','quaver'),note('E4','quaver'),note('C4','dottedMinim')],{beamGroups:[{start:3,end:6}],lyrics:'came ear - ly one mor - ning,',lyricSyllables:['','','came','ear -','ly','one','mor -','ning,']}),
    bar([rest('crotchetRest'),note('C4','semiquaver'),note('C4','semiquaver'),note('Eb4','quaver'),note('D4','crotchet'),note('D4','crotchet'),note('D4','quaver'),note('G4','crotchet'),note('A4','quaver')],{beamGroups:[{start:1,end:2}],accidental:{noteIndex:3,answer:'flat'},ties:[[4,5]],lyrics:'in a sky_____ so clear and',lyricSyllables:['','in','a','sky','','','so','clear','and'],lyricExtensions:[{from:3,to:5,startOffset:18,endOffset:12}]}),
    bar([note('A4','quaver'),note('G4','crotchet'),note('G4','dottedCrotchet'),rest('dottedCrotchetRest'),rest('dottedCrotchetRest')],{beamGroups:[],ties:[[1,2]],lyrics:'blue._____',lyricSyllables:['blue.','','','',''],lyricExtensions:[{from:0,to:2,startOffset:38,endOffset:10}],finalBarline:'double'}),
  ];

  q2bBars[1].finalBarline = 'single';

  // Official page 8: four calibrated 300-dpi crops, independently checked.
  // Full transcription and line centres: advanced-higher-2022-q4a-inventory.md.
  const chord = (pitches, rhythm, extra={}) => note(pitches[0],rhythm,{chord:pitches,stemDown:true,...extra});
  const q4aPickup = grandBar(
    bar([note('D#4','quaver'),note('E4','quaver'),note('G4','quaver'),note('A4','quaver')],{beamGroups:[{start:1,end:3}]}),
    bar([rest('quaverRest'),rest('dottedCrotchetRest')],{beamGroups:[]}),
    {partialBarBeats:2,dynamic:'f',crescendo:true,finalBarline:'start-repeat'},
  );
  const q4aBassFigure = (natural=false) => bar([note('F2','crotchet'),note('C3','quaver'),note('B2','crotchet',natural?{courtesyAccidental:'natural'}:{}),note('C3','quaver'),note('F2','crotchet'),note('C3','quaver'),note('B2','crotchet'),note('C3','quaver')],{beamGroups:[],slurs:[[0,3],[4,7]]});
  const q4aEndingBass = () => bar([chord(['C3','G3'],'dottedCrotchet'),chord(['F3','A3'],'crotchet'),rest('quaverRest'),chord(['E3','G3'],'crotchet'),rest('quaverRest'),chord(['D3','F3'],'crotchet'),rest('quaverRest')],{beamGroups:[],slurs:[{from:0,to:1,above:true}]});
  const q4aBars = [
    grandBar(bar([note('C5','dottedMinim',{stemDown:false}),note('C5','dottedMinim',{stemDown:false})],{beamGroups:[]}),
      bar([rest('dottedCrotchetRest'),chord(['C3','G3'],'dottedCrotchet'),rest('dottedCrotchetRest'),chord(['D3','A3'],'dottedCrotchet')],{beamGroups:[],tenuto:[1,3]}),
      {innerVoice:bar([rest('dottedCrotchetRest'),note('E4','dottedCrotchet',{stemDown:true}),rest('dottedCrotchetRest'),note('F4','dottedCrotchet',{stemDown:true})],{beamGroups:[],tenuto:[1,3]})}),
    grandBar(bar([note('C5','dottedMinim',{stemDown:false}),note('C5','dottedMinim',{stemDown:false})],{beamGroups:[]}),
      bar([rest('dottedCrotchetRest'),chord(['D#3','A3'],'dottedCrotchet'),rest('dottedCrotchetRest'),chord(['E3','Bb3'],'dottedCrotchet',{chordAccidentalXOffsets:{Bb3:-5}})],{beamGroups:[],tenuto:[1,3]}),
      {innerVoice:bar([rest('dottedCrotchetRest'),note('F#4','dottedCrotchet',{stemDown:true}),rest('dottedCrotchetRest'),note('G4','dottedCrotchet',{stemDown:true})],{beamGroups:[],tenuto:[1,3]})}),
    grandBar(bar([chord(['Eb5','G5'],'crotchet'),note('A4','quaver'),chord(['D5','F5'],'crotchet',{chordAccidentals:{F5:'natural'}}),note('A4','quaver'),chord(['C5','Eb5'],'crotchet',{suppressAccidental:true}),chord(['D5','F5'],'quaver'),chord(['D5','F5'],'crotchet'),note('A4','quaver')],{beamGroups:[],ties:[[5,6]]}),q4aBassFigure(true)),
    grandBar(bar([chord(['Eb5','G5'],'crotchet'),note('A4','quaver'),chord(['D5','F5'],'crotchet'),chord(['C5','Eb5'],'quaver',{suppressAccidental:true}),chord(['C5','Eb5'],'crotchet',{suppressAccidental:true}),note('D#5','quaver'),note('E5','quaver',{courtesyAccidental:'natural'}),note('G5','quaver'),note('A5','quaver')],{beamGroups:[{start:6,end:8}],ties:[[3,4]]}),q4aBassFigure()),
    grandBar(bar([note('C6','crotchet'),rest('quaverRest'),note('C6','crotchet'),rest('quaverRest'),note('C6','crotchet'),rest('quaverRest'),note('C6','crotchet'),rest('quaverRest')],{beamGroups:[],tenuto:[0,2,4,6]}),
      bar([note('C2','crotchet'),note('G2','quaver'),note('D2','crotchet'),note('G2','quaver'),note('E2','crotchet'),note('G2','quaver'),note('D2','crotchet'),note('G2','quaver')],{beamGroups:[],slurs:[[0,1],[2,3],[4,5],[6,7]]})),
    grandBar(bar([note('Eb6','quaver'),note('D6','quaver'),note('C6','quaver'),note('G#5','quaver'),note('A5','quaver'),note('C6','quaver'),note('C5','quaver'),note('Eb5','quaver'),note('D5','quaver'),note('C5','quaver'),note('Eb5','quaver',{suppressAccidental:true}),note('E5','quaver',{courtesyAccidental:'natural'})],{beamGroups:[{start:0,end:2},{start:3,end:5},{start:6,end:8},{start:9,end:11}]}),
      bar([note('C2','crotchet'),rest('quaverRest'),rest('dottedCrotchetRest'),rest('dottedCrotchetRest'),rest('dottedCrotchetRest')],{beamGroups:[],tenuto:[0],tenutoBelow:true})),
    grandBar(bar([note('G5','crotchet',{courtesyAccidental:'natural'}),note('G4','quaver',{courtesyAccidental:'natural'}),note('Bb4','quaver'),note('A4','quaver'),note('G4','quaver'),note('C5','crotchet'),note('C4','quaver'),note('Eb4','quaver'),note('D4','quaver'),note('C4','quaver')],{beamGroups:[{start:2,end:4},{start:7,end:9}],tenuto:[0,5],tenutoAbove:true}),
      bar([chord(['G2','F3','B3'],'crotchet',{arpeggio:true,accent:true,accentYOffset:-13}),rest('quaverRest'),rest('dottedCrotchetRest'),chord(['Eb3','F3','A3'],'crotchet',{xOffset:-10}),rest('quaverRest'),rest('dottedCrotchetRest')],{beamGroups:[]}),{chord:{answer:'G7',noteIndices:[0],hands:['upper','lower']}}),
    grandBar(bar([note('D#4','quaver'),note('E4','quaver',{courtesyAccidental:'natural'}),note('G4','quaver'),note('C4','crotchet'),note('C4','quaver'),note('C4','crotchet'),note('C4','quaver'),note('E4','quaver'),note('G4','quaver'),note('A4','quaver')],{beamGroups:[{start:0,end:2},{start:7,end:9}]}),q4aEndingBass(),{ending:1,finalBarline:'repeat'}),
    grandBar(bar([note('D#4','quaver'),note('E4','quaver'),note('G4','quaver'),note('C4','crotchet'),note('C4','quaver'),note('C4','dottedMinim')],{beamGroups:[{start:0,end:2}]}),q4aEndingBass(),{ending:2,finalBarline:'single'}),
  ];
  q4aBars.forEach(item => {
    [item.upper, item.lower, item.innerVoice].forEach(voice => {
      if (!voice) return;
      delete voice.tenuto;
      delete voice.tenutoAbove;
      delete voice.tenutoBelow;
    });
  });

  // Page 11: calibrated six-system transcription; see q4b inventory notes.
  const riff = (flat=false) => bar([note('D4','quaver'),note('Eb4','quaver',flat?{}:{suppressAccidental:true}),note('E4','quaver',{courtesyAccidental:'natural'}),note('F4','quaver'),note('F4','quaver'),note('G4','quaver'),note('F4','crotchet')],{ties:[[3,4]],beamGroups:[{start:0,end:3},{start:4,end:5}]});
  const highRiff = () => bar([note('G4','quaver'),note('Ab4','quaver'),note('A4','quaver',{courtesyAccidental:'natural'}),note('Bb4','quaver'),note('Bb4','quaver'),note('C5','dottedCrotchet')],{ties:[[3,4]],beamGroups:[{start:0,end:3}]});
  const q4bBars = [riff(),riff(true),highRiff(),{...highRiff(),octaveSignAnswer:'8va'},riff(),riff(true),
    bar([note('Eb4','quaver'),note('D4','quaver'),note('Eb4','quaver',{suppressAccidental:true}),note('C4','quaver'),note('C4','minim')],{ties:[[3,4]],beamGroups:[{start:0,end:3}]}),
    bar([note('A3','quaver'),note('Bb3','quaver'),note('B3','quaver',{courtesyAccidental:'natural'}),note('C4','quaver'),note('C4','crotchet'),rest('crotchetRest')],{ties:[[3,4]],beamGroups:[{start:0,end:3}]}),riff(),riff(true),
    bar([note('G4','quaver'),note('Ab4','quaver'),note('A4','quaver',{courtesyAccidental:'natural'}),note('Bb4','quaver'),note('Bb4','quaver'),note('C5','quaver'),note('Bb4','crotchet')],{ties:[[3,4]],beamGroups:[{start:0,end:3},{start:4,end:5}]}),
    bar([note('C5','quaver'),note('G4','quaver'),note('Bb4','quaver'),note('C#5','quaver'),note('C#5','quaver',{suppressAccidental:true}),note('Bb4','quaver'),note('C5','quaver',{courtesyAccidental:'natural'}),note('C#5','quaver')],{ties:[[3,4]],beamGroups:[{start:0,end:3},{start:4,end:7}]}),
    grandBar(bar([note('D5','crotchet'),note('G5','quaver'),note('F5','quaver'),note('F5','quaver'),note('D5','quaver'),note('B4','quaver',{courtesyAccidental:'natural'}),note('G4','quaver')],{ties:[[2,3]],beamGroups:[{start:1,end:2},{start:3,end:6}]}),bar([note('F3','dottedCrotchet',{missing:true}),note('G3','quaver'),note('G3','minim')],{ties:[[1,2]],beamGroups:[]}),{missingBass:{answer:'F3',rhythm:'dottedCrotchet'}}),
    grandBar(bar([note('Eb4','quaver'),note('E4','quaver',{courtesyAccidental:'natural'}),note('G4','quaver'),note('Db5','quaver'),note('Db5','quaver',{suppressAccidental:true}),note('C5','quaver'),note('A4','quaver'),note('F4','quaver')],{ties:[[3,4]],beamGroups:[{start:0,end:3},{start:4,end:7}]}),bar([note('C3','dottedCrotchet',{missing:true}),note('F3','quaver'),note('F3','minim')],{ties:[[1,2]],beamGroups:[]}),{missingBass:{answer:'C3',rhythm:'dottedCrotchet'},finalBarline:'single'}),
  ];
  // The printed tie remains below the notes when bar 11 changes beam direction.
  q4bBars[10].tiesBelow = true;

  // Page 12, re-rendered at 600 dpi. Bar 8 contains three complete quaver
  // triplets; only the final triplet is omitted from the printed paper.
  const q5Bars = [
    bar([rest("crotchetRest"),note("E5","dottedCrotchet"),note("A5","quaver")]),
    bar([note("D5","crotchet"),note("G#5","crotchet"),note("B5","crotchet")]),
    bar([note("E5","crotchet"),note("A5","crotchet"),note("C6","crotchet",{tieToNextBar:true})]),
    bar([note("C6","crotchet",{tiedFromPreviousBar:true}),note("B5","crotchet"),note("A5","tripletQuaver"),note("G#5","tripletQuaver"),note("A5","tripletQuaver")],{triplets:[[2,4]]}),
    bar([note("G#5","minim"),rest("quaverRest"),note("D6","quaver")],{enharmonic:{source:"G#5",answer:"Ab5"}}),
    bar([note("C6","tripletQuaver"),note("B5","tripletQuaver"),note("A5","tripletQuaver"),note("G#5","dottedCrotchet"),note("A5","quaver")],{triplets:[[0,2]],ornament:"trill"}),
    bar([note("A5","dottedQuaver"),note("B5","semiquaver"),note("C6","tripletQuaver"),note("B5","tripletQuaver"),note("A5","tripletQuaver"),note("G5","tripletQuaver",{courtesyAccidental:"natural"}),note("F5","tripletQuaver"),note("E5","tripletQuaver")],{triplets:[[2,4],[5,7]]}),
    bar([note("D5","tripletQuaver"),note("E5","tripletQuaver"),note("F5","tripletQuaver"),note("E5","tripletQuaver"),note("D5","tripletQuaver"),note("C5","tripletQuaver"),note("G4","tripletQuaver",{missing:true}),note("A4","tripletQuaver",{missing:true}),note("F4","tripletQuaver",{missing:true})],{missingIndices:[6,7,8],triplets:[[0,2],[3,5],[6,8]]}),
    bar([note("E5","minim"),rest("crotchetRest")],{finalBarline:"double"}),
  ];

  q5Bars.forEach(item=>{item.beamGroups=(item.triplets||[]).map(([start,end])=>({start,end}));});
  q5Bars[6].beamGroups.unshift({start:0,end:1});

  const data = {
    q2:{
      key:"C major", timeSignature:"12/8", pickup:q2aPickup,aBars:q2aBars, bBars:q2bBars,
      chords:{bars:[1,2],answers:["G first inversion","A minor"]}, bassClef:{bar:3,source:['A3','C4','D4'],answer:['A3','C4','D4']},
      interval:{bar:1,answer:"Perfect 4th"}, accidental:{bar:3,note:3,answer:"flat"}, finalBarline:"double",
      layout:{height:930},
    },
    q2a:{
      key:"C major",timeSignature:"12/8",pickup:q2aPickup,aBars:q2aBars,
      chords:{bars:[1,2],answers:["G first inversion","A minor"]},bassClef:{bar:3,source:['A3','C4','D4'],answer:['A3','C4','D4']},
      finalBarline:'double',layout:{height:760,pickupXs:[145,170,190,215,243,269,293],noteXs:[[333,373,405,437,465,491,523,551,580],[612,650,687,722,751,778,811,838,860],[118,168,204,239,268,319,346,384,422,471],[541,577,610,646,676,707,742,775,810,844]]},
    },
    q2b:{
      timeSignature:"12/8",bBars:q2bBars,
      interval:{bar:1,answer:"Perfect 4th"},accidental:{bar:3,note:3,answer:"flat"},finalBarline:"double",
      layout:{height:485,tops:[145,365],barStarts:[135,481,100,497],barEnds:[481,870,497,870],noteXs:[[148,188,229,272,315,370],[504,530,543,597,647,690,740,801],[114,147,177,222,264,311,357,401,461],[517,565,626,703,783]],intervalBox:{x:292,y:31,width:128,height:175},accidentalBox:{x:99,y:293,width:237,height:175}},
    },
    q4:{
      a:{key:"C major",timeSignature:"12/8",pickup:q4aPickup,bars:q4aBars,timeSignatureBar:0,chord:{bar:7,answer:"G7"}},
      b:{key:"Bb major",timeSignature:"4/4",bars:q4bBars,octaveSign:{bar:4,answer:"8va"},bass:{bars:[13,14],answer:["F3","C3"],rhythm:"dottedCrotchet"}},
      finalBarline:"single",layout:{bassCaption:{inset:4,fontSize:17},height:2295,aGroups:[[0,1],[2,3,4],[5,6],[7,8]],aTops:[70,355,649,950],bGroups:[[0,1],[2,3],[4,5,6],[7,8,9],[10,11],[12,13]],bTops:[1245,1375,1505,1635,1765,1915]},
    },
    q4a:{
      a:{key:"C major",timeSignature:"12/8",pickup:q4aPickup,bars:q4aBars,timeSignatureBar:0,chord:{bar:7,answer:"G7"}},
      layout:{height:1115,aGroups:[[0,1],[2,3,4],[5,6],[7,8]],aTops:[70,355,649,950],aLowerOffset:100,aBoundaries:[[278,578,870],[110,344,612,870],[110,414,870],[110,501,870]],aNoteXs:[[304,444],[598,738],[118,146,175,202,230,258,286,314],[362,392,421,450,479,508,538,567,595],[633,661,690,718,747,775,804,832],[118,143,168,193,218,243,268,293,318,343,368,393],[450,558,600,638,676,714,752,790,828,856],[118,151,184,217,266,299,348,381,414,447],[519,554,589,624,674,709]],aLowerXs:[[304,374,444,514],[598,668,738,808],[118,146,175,202,230,258,286,314],[362,392,421,450,479,508,538,567],[633,661,690,718,747,775,804,832],[118,143,168,243,318],[450,558,600,714,752,790],[118,217,266,299,348,381,447],[519,624,674,709,758,791,840]]},
    },
    q4b:{
      b:{key:"Bb major",timeSignature:"4/4",bars:q4bBars,octaveSign:{bar:4,answer:"8va"},bass:{bars:[13,14],answer:["F3","C3"],rhythm:"dottedCrotchet"}},
      finalBarline:"single",layout:{bassCaption:{inset:4,fontSize:17},height:1265,bGroups:[[0,1],[2,3],[4,5,6],[7,8,9],[10,11],[12,13]],bTops:[110,285,460,635,810,985]},
    },
    q5:{
      key:"C major",timeSignature:"3/4",bars:q5Bars,enharmonic:{bar:5,source:"G#5",answer:"Ab5"},missing:{bar:8,indices:[6,7,8],answer:["G4","A4","F4"],rhythm:"tripletQuaver"},finalBarline:"double",layout:{height:660,groups:[[0,1,2,3],[4,5,6],[7,8]],systemTops:[90,350,540],lastSystemBounds:[105,625,870]},
    },
  };

  if (typeof module !== "undefined" && module.exports) module.exports = data;
  root.AdvancedHigher2022Notation = data;
})(typeof window !== "undefined" ? window : globalThis);
