(function(root) {
  "use strict";

  const beats = {
    semiquaver:.25, quaver:.5, tripletQuaver:1/3, dottedQuaver:.75,
    tripletCrotchet:2/3, crotchet:1, dottedCrotchet:1.5,
    minim:2, dottedMinim:3, semibreve:4,
    quaverRest:.5, crotchetRest:1, dottedCrotchetRest:1.5,
    minimRest:2, dottedMinimRest:3, semibreveRest:4,
  };
  const note = (pitch, rhythm, extra = {}) => ({ pitch, rhythm, beats:beats[rhythm], ...extra });
  const rest = (rhythm, extra = {}) => ({ rest:true, rhythm, beats:beats[rhythm], ...extra });
  const bar = (notes, extra = {}) => ({ notes, ...extra });

  // Pages 4 and 6 were rendered at 600 dpi. Each system was calibrated
  // independently before the notehead centres were read. The opening two
  // quavers on page 4 form an anacrusis and are stored separately.
  const q2aPickup=bar([note("B4","quaver"),note("A4","quaver")],{partial:true,lyricSyllables:["I","at -"]});
  const q2aBars = [
    bar([note("G4","crotchet"),note("D5","crotchet"),note("A4","semiquaver"),note("B4","semiquaver"),note("C5","quaver")],{"lyricSyllables": ["tempt", "from", "love\u2019s__", "", ""], "beamGroups": [{"start": 2, "end": 4}]}),
    bar([note("B4","crotchet"),note("G4","crotchet"),note("D5","crotchet")],{"lyricSyllables": ["sick-", "ness", "to"]}),
    bar([note("E5","quaver"),note("D5","quaver"),note("C5","quaver"),note("B4","quaver"),note("C5","quaver"),note("A4","quaver")],{"lyricSyllables": ["fly_______", "", "", "", "", ""], "beamGroups": [{"start": 0, "end": 1}, {"start": 2, "end": 3}, {"start": 4, "end": 5}]}),
    bar([note("B4","quaver"),note("C5","quaver"),note("D5","quaver"),note("B4","quaver"),note("A4","quaver"),note("G4","quaver")],{"lyricSyllables": ["", "", "", "", "in___", ""], "beamGroups": [{"start": 0, "end": 1}, {"start": 2, "end": 3}, {"start": 4, "end": 5}]}),
    bar([note("F#4","minim"),note("F#4","crotchet")],{"lyricSyllables": ["vain,", "Since"]}),
    bar([note("G4","crotchet"),note("A4","crotchet"),note("B4","crotchet")],{"lyricSyllables": ["I", "am", "my -"]}),
    bar([note("E4","crotchet"),note("F#4","crotchet"),note("G4","crotchet")],{"lyricSyllables": ["self", "my", "own"]}),
    bar([note("A4","crotchet"),note("D4","crotchet"),note("B4","crotchet")],{"lyricSyllables": ["fe -", "ver,", "Since"]}),
    bar([note("C5","crotchet"),note("D5","crotchet"),note("E5","crotchet")],{"lyricSyllables": ["I", "am", "my -"]}),
    bar([note("A4","crotchet"),note("B4","crotchet"),note("C5","crotchet")],{"lyricSyllables": ["self", "my", "own"]}),
    bar([note("D5","crotchet"),note("C5","quaver"),note("B4","quaver"),note("A4","quaver"),note("G4","quaver")],{"lyricSyllables": ["fe -", "ver___", "", "and___", ""], "beamGroups": [{"start": 1, "end": 2}, {"start": 3, "end": 4}]}),
    bar([note("G4","minim")],{"lyricSyllables": ["pain."], "partial": true, "finalBarline": "double"}),
  ];

  q2aBars[2].notes.slice(4,6).forEach(entry=>{entry.stemDown=true;});

  const q2cBars = [
    bar([note("C5","crotchet"),note("D5","crotchet"),note("E5","crotchet")],{"number": 9, "lyricSyllables": ["I", "am", "my -"]}),
    bar([note("A4","crotchet"),note("B4","crotchet"),note("C5","crotchet")],{"number": 10, "lyricSyllables": ["self", "my", "own"]}),
    bar([note("D5","crotchet"),note("C5","quaver"),note("B4","quaver"),note("A4","quaver"),note("G4","quaver")],{"number": 11, "lyricSyllables": ["fe -", "ver___", "", "and___", ""], "beamGroups": [{"start": 1, "end": 2}, {"start": 3, "end": 4}]}),
    bar([note("G4","minim"),note("B4","crotchet")],{"number": 12, "lyricSyllables": ["pain.", "No"]}),
    bar([note("G4","crotchet"),note("E4","crotchet"),note("E5","crotchet")],{"number": 13, "lyricSyllables": ["more", "now", "no"]}),
    bar([note("D#5","crotchet"),note("B4","crotchet"),note("B4","semiquaver"),note("C5","semiquaver"),note("D5","quaver",{"courtesyAccidental": "natural"})],{"number": 14, "lyricSyllables": ["more", "now", "fond___", "", ""], "beamGroups": [{"start": 2, "end": 4}]}),
    bar([note("C5","minim"),note("B4","crotchet")],{"number": 15, "lyricSyllables": ["heart", "with"]}),
    bar([note("B4","dottedCrotchet"),note("C5","quaver"),note("A4","crotchet",{"gracePitch": "B4"})],{"number": 16, "lyricSyllables": ["pride", "no", "more"]}),
    bar([note("B4","minim"),note("D5","crotchet",{"missingAccidental": "sharp"})],{"number": 17, "lyricSyllables": ["swell,", "Thou"]}),
    bar([note("E5","crotchet"),note("B4","quaver"),note("C5","quaver"),note("D5","quaver"),note("B4","quaver")],{"number": 18, "lyricSyllables": ["canst", "not___", "", "raise___", ""], "beamGroups": [{"start": 1, "end": 2}, {"start": 3, "end": 4}]}),
    bar([note("C5","crotchet"),note("A4","crotchet"),note("F#4","crotchet")],{"number": 19, "lyricSyllables": ["for -", "ces,", "Thou"]}),
    bar([note("B4","crotchet"),note("F#4","quaver"),note("G4","quaver"),note("A4","quaver"),note("F#4","quaver")],{"number": 20, "lyricSyllables": ["canst", "not___", "", "raise___", ""], "beamGroups": [{"start": 1, "end": 2}, {"start": 3, "end": 4}]}),
    bar([note("G4","crotchet"),note("E4","crotchet"),note("B4","crotchet")],{"number": 21, "lyricSyllables": ["for -", "ces", "e -"]}),
    bar([note("G4","dottedCrotchet"),note("F#4","quaver"),note("E4","crotchet")],{"number": 22, "lyricSyllables": ["nough", "to", "re -"]}),
    bar([note("E4","minim")],{"number": 23, "lyricSyllables": ["bel."], "partial": true, "finalBarline": "double"}),
  ];

  // Pages 10–11. The first displayed phrase begins with a three-beat pickup.
  // In bar 25 the omitted notes are a crotchet triplet C–B-flat–A. In bar
  // 30 the source E-flat–B-flat–B-flat is copied one octave lower in bass
  // clef, retaining the tie between the B-flat notes.
  const q4aPickup=bar([note("A3","crotchet"),note("F4","dottedCrotchet"),note("C#4","quaver")],{partial:true,enharmonic:{note:2,source:"C#4",answer:"Db4"}});
  const q4aBars = [
    bar([note("E4","quaver"),note("D4","quaver"),note("D4","dottedMinim")],{"beamGroups": [{"start":0,"end":1}], "ties": [[1, 2]]}),
    bar([rest("quaverRest"),note("D4","quaver"),note("A4","quaver"),note("Bb4","quaver"),note("C5","quaver"),note("D5","semiquaver"),note("C5","semiquaver"),note("Bb4","quaver"),note("A4","quaver")],{"beamGroups": [{"start": 2, "end": 3}, {"start": 4, "end": 6}, {"start": 7, "end": 8}]}),
    bar([note("A4","quaver"),note("G4","quaver"),note("G4","dottedMinim")],{"beamGroups": [{"start":0,"end":1}], "ties": [[1, 2]]}),
    bar([rest("quaverRest"),note("E4","quaver"),note("G4","quaver"),note("Bb4","quaver"),note("D5","quaver"),note("E5","semiquaver"),note("D5","semiquaver"),note("C5","quaver"),note("Bb4","quaver")],{"beamGroups": [{"start": 2, "end": 3}, {"start": 4, "end": 6}, {"start": 7, "end": 8}]}),
    bar([note("C5","quaver"),note("F4","quaver"),rest("crotchetRest"),rest("quaverRest"),note("C5","quaver"),note("D5","quaver"),note("C5","quaver")],{"beamGroups": [{"start": 0, "end": 1}, {"start": 5, "end": 6}]}),
    bar([note("Bb4","quaver"),note("E4","quaver"),rest("crotchetRest"),rest("quaverRest"),note("Bb4","quaver"),note("C5","quaver"),note("Bb4","quaver")],{"beamGroups": [{"start": 0, "end": 1}, {"start": 5, "end": 6}]}),
    bar([note("A4","quaver"),note("D4","quaver"),rest("crotchetRest"),rest("minimRest")],{"beamGroups": [{"start": 0, "end": 1}], "finalBarline": "single"}),
  ];
  const q4bBars = [
    bar([rest("minimRest"),rest("crotchetRest"),note("F4","crotchet")],{"number": 24, "beamGroups": []}),
    bar([note("D5","minim"),note("C5","tripletCrotchet",{"missing": true}),note("Bb4","tripletCrotchet",{"missing": true}),note("A4","tripletCrotchet",{"missing": true})],{"number": 25, "beamGroups": [], "triplets": [[1, 3]], "missingIndices": [1, 2, 3]}),
    bar([note("Bb4","quaver"),note("D4","quaver"),note("D4","crotchet"),rest("quaverRest"),note("B3","quaver"),note("D4","quaver"),note("F4","quaver")],{"number": 26, "beamGroups": [{"start": 0, "end": 1}, {"start": 5, "end": 6}], "ties": [[1, 2]]}),
    bar([note("Bb4","minim"),note("Ab4","tripletCrotchet"),note("G4","tripletCrotchet"),note("F4","tripletCrotchet")],{"number": 27, "beamGroups": [], "triplets": [[1, 3]]}),
    bar([note("G4","dottedMinim"),rest("crotchetRest")],{"number": 28, "beamGroups": []}),
    bar([note("G4","minim"),note("F4","tripletCrotchet"),note("Eb4","tripletCrotchet"),note("D4","tripletCrotchet")],{"number": 29, "beamGroups": [], "triplets": [[1, 3]]}),
    bar([note("Eb4","quaver"),note("Bb3","quaver"),note("Bb3","crotchet"),rest("minimRest")],{"number": 30, "beamGroups": [{"start": 0, "end": 1}], "ties": [[1, 2]]}),
    bar([note("C4","quaver"),note("Eb4","crotchet"),note("C4","quaver"),note("B3","quaver",{"courtesyAccidental": "natural"}),note("Eb4","crotchet",{suppressAccidental:true}),note("B3","quaver")],{"number": 31, "beamGroups": []}),
    bar([note("Bb3","minim",{"courtesyAccidental": "flat"}),rest("quaverRest"),note("Eb4","quaver"),note("G4","quaver"),note("C5","quaver")],{"number": 32, "beamGroups": [{"start":3,"end":4}]}),
    bar([note("Bb4","quaver"),note("F4","quaver"),note("F4","crotchet"),rest("quaverRest"),note("D4","quaver"),note("F4","quaver"),note("C5","quaver")],{"number": 33, "beamGroups": [{"start": 0, "end": 1}, {"start": 5, "end": 6}], "ties": [[1, 2]]}),
    bar([note("Bb4","quaver"),note("G4","quaver"),note("G4","crotchet"),rest("minimRest")],{"number": 34, "beamGroups": [{"start": 0, "end": 1}], "ties": [[1, 2]]}),
    bar([note("C5","quaver"),note("Eb5","crotchet"),note("C5","quaver"),note("B4","quaver",{"courtesyAccidental": "natural"}),note("Eb5","crotchet",{suppressAccidental:true}),note("B4","quaver")],{"number": 35, "beamGroups": []}),
    bar([note("Bb4","minim",{"courtesyAccidental": "flat"}),rest("minimRest")],{"number": 36, "beamGroups": [], "finalBarline": "single"}),
  ];

  // Page 14: one-line wood-block notation. Each option contains the four
  // bars following the printed four-bar introduction; the third is correct.
  const q5eOptions = [
    [
      bar([rest("crotchetRest"),note("B4","crotchet"),note("B4","crotchet"),rest("crotchetRest")]),
      bar([note("B4","dottedCrotchet"),note("B4","quaver",{tieToNext:true}),note("B4","crotchet",{tiedFromPrevious:true}),note("B4","crotchet")],{ties:[[1,2]]}),
      bar([rest("crotchetRest"),note("B4","quaver"),note("B4","quaver"),note("B4","crotchet"),rest("crotchetRest")]),
      bar([note("B4","dottedCrotchet"),note("B4","quaver",{tieToNext:true}),note("B4","crotchet",{tiedFromPrevious:true}),rest("crotchetRest")],{ties:[[1,2]]}),
    ],
    [
      bar([rest("crotchetRest"),note("B4","crotchet"),note("B4","crotchet"),rest("crotchetRest")]),
      bar([note("B4","minim"),note("B4","crotchet"),note("B4","crotchet")]),
      bar([rest("crotchetRest"),note("B4","crotchet"),note("B4","crotchet"),rest("crotchetRest")]),
      bar([note("B4","crotchet"),note("B4","crotchet"),note("B4","minim")]),
    ],
    [
      bar([rest("crotchetRest"),note("B4","crotchet"),note("B4","crotchet"),rest("crotchetRest")]),
      bar([note("B4","dottedCrotchet"),note("B4","quaver",{tieToNext:true}),note("B4","crotchet",{tiedFromPrevious:true}),note("B4","crotchet")],{ties:[[1,2]]}),
      bar([rest("crotchetRest"),note("B4","crotchet"),note("B4","crotchet"),rest("crotchetRest")]),
      bar([note("B4","dottedCrotchet"),note("B4","quaver",{tieToNext:true}),note("B4","crotchet",{tiedFromPrevious:true}),note("B4","crotchet")],{ties:[[1,2]]}),
    ],
  ];

  q5eOptions.flat().forEach(bar=>bar.notes.forEach(note=>{if(!note.rest)note.stemDown=false;}));

  const data = {
    q2:{
      a:{key:"G major",timeSignature:"3/4",pickup:q2aPickup,bars:q2aBars,cadence:{bars:[4,5],answer:"Imperfect"},melisma:{acceptedBars:[1,3,4,11]}},
      b:{bar:11,chords:["G first inversion","C major","D major"],answer:"G/B, C, D",treble:[["D4","G4","D5"],["E4","G4","C5"],["D4","F#4","A4"]],bass:["B2","C3","D3"],given:{treble:["B3","D4","G4"],bass:"G2"}},
      c:{pickup:bar([note("B4","crotchet")],{partial:true,lyricSyllables:["Since"]}),key:"G major",newKey:"E minor",timeSignature:"3/4",bars:q2cBars,keyChange:{bar:13,key:"E minor"},accidental:{bar:17,note:1,answer:"sharp"}},
      finalBarline:"double",layout:{height:2600,aGroups:[[0,1,2],[3,4,5],[6,7,8],[9,10,11]],aTops:[90,310,490,670],cGroups:[[0,1,2],[3,4,5],[6,7,8],[9,10,11],[12,13,14]],cTops:[1565,1785,2005,2225,2445]},
    },
    q4:{
      a:{key:"F major",timeSignature:"4/4",pickup:q4aPickup,bars:q4aBars,enharmonic:{source:"C#4",answer:"Db4"},interval:{bar:6,notes:[0,1],answer:"Diminished 5th"}},
      b:{key:"F major",timeSignature:"4/4",bars:q4bBars,missing:{bar:25,indices:[1,2,3],answer:["C5","Bb4","A4"],rhythm:"crotchet triplet"},octaveLower:{bar:30,source:["Eb4","Bb3","Bb3"],answer:["Eb3","Bb2","Bb2"],rhythms:["quaver","quaver","crotchet"],tie:[1,2]}},
      finalBarline:"single",layout:{height:1660,aGroups:[[0,1],[2,3,4],[5,6]],aTops:[110,400,600],aWeights:[[.8,1.2],[.75,1.4,1],[1.3,1]],bGroups:[[0,1,2],[3,4,5],[6,7,8],[9,10,11,12]],bTops:[850,1010,1170,1440]},
    },
    q5e:{key:"percussion",timeSignature:"4/4",options:q5eOptions,answer:3,layout:{height:150}},
  };

  if (typeof module !== "undefined" && module.exports) module.exports = data;
  root.AdvancedHigher2024Notation = data;
})(typeof window !== "undefined" ? window : globalThis);
