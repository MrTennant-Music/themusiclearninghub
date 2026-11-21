(function(root) {
  "use strict";

  const beats = {
    semiquaver: 0.25,
    quaver: 0.5,
    dottedQuaver: 0.75,
    crotchet: 1,
    dottedCrotchet: 1.5,
    minim: 2,
    dottedMinim: 3,
    semibreve: 4,
    semiquaverRest: 0.25,
    quaverRest: 0.5,
    crotchetRest: 1,
    minimRest: 2,
    dottedMinimRest: 3,
  };
  const note = (pitch, rhythm, extra = {}) => ({ pitch, rhythm, beats: beats[rhythm], ...extra });
  const rest = (rhythm, extra = {}) => ({ rest: true, rhythm, beats: beats[rhythm], ...extra });
  const bar = (notes, extra = {}) => ({ notes, ...extra });
  const grand = (upper, lower, extra = {}) => ({ upper: bar(upper), lower: bar(lower), ...extra });

  // Question 2(a), official question-paper page 5 rendered at 600 dpi.
  // D major, 3/4, 24 bars. The score deliberately omits the end repeat at
  // bar 8 and the tie from the final note of bar 19 to the first note of bar
  // 20. Bar 10 is copied at sounding pitch into the supplied bass stave.
  const q2aBars = [
  {
    "notes": [
      {
        "pitch": "F#4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "A4",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "D4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "D4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "E4",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "D4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "F#4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "B4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "D4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "E4",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "D4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "F#4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "F#4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "F#4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "E4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "D4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "F#4",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "pitch": "E4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "missingEndRepeat": true
  },
  {
    "notes": [
      {
        "pitch": "E4",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "D4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "E4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F#4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "beamGroups": [
      {
        "start": 2,
        "end": 3
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "E4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "D4",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "C#4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "boxed": true
  },
  {
    "notes": [
      {
        "pitch": "B3",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "F#4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "D4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "B4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "F#4",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "pitch": "E4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "E4",
        "rhythm": "dottedMinim",
        "beats": 3
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "E4",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "pitch": "D4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "E4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "F#4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "F#4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "D4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "B4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "C#5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "D5",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "missingTieFrom": 2
  },
  {
    "notes": [
      {
        "pitch": "D5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "D4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "missingTieTo": 0
  },
  {
    "notes": [
      {
        "pitch": "B4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "F#4",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "pitch": "E4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "E4",
        "rhythm": "dottedMinim",
        "beats": 3,
        "tieToNext": true
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "E4",
        "rhythm": "dottedMinim",
        "beats": 3,
        "tiedFromPrevious": true
      }
    ],
    "finalBarline": "single"
  }
];

  // Question 2(b), official page 6. Bars 25–35 continue the same D-major
  // 3/4 melody. The boxed grand-staff chord in bar 33 is a diminished 7th.
  const q2bBars = [
  {
    "notes": [
      {
        "pitch": "F#5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "A5",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "number": 25
  },
  {
    "notes": [
      {
        "pitch": "D5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "E5",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "number": 26
  },
  {
    "notes": [
      {
        "pitch": "F#5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "A5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "B5",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "number": 27
  },
  {
    "notes": [
      {
        "pitch": "D5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "E5",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "number": 28
  },
  {
    "notes": [
      {
        "pitch": "F#5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "A5",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "number": 29
  },
  {
    "notes": [
      {
        "pitch": "A5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "F#5",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "number": 30
  },
  {
    "notes": [
      {
        "pitch": "F#5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "E5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "D5",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "number": 31
  },
  {
    "notes": [
      {
        "pitch": "F#5",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "pitch": "E5",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "number": 32
  },
  {
    "notes": [
      {
        "pitch": "E5",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "E5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F#5",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "number": 33,
    "beamGroups": [
      {
        "start": 2,
        "end": 3
      }
    ],
    "boxedChord": true,
    "accompaniment": {
      "upper": [
        "C#4",
        "E4"
      ],
      "lower": [
        "A#2",
        "E3",
        "G3"
      ],
      "rhythm": "dottedMinim"
    }
  },
  {
    "notes": [
      {
        "pitch": "E5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "D5",
        "rhythm": "dottedCrotchet",
        "beats": 1.5
      },
      {
        "pitch": "C#5",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "number": 34
  },
  {
    "notes": [
      {
        "pitch": "B4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "number": 35,
    "partial": true
  }
];

  // Question 2(c), official page 7. All chord notes are dotted minims.
  const q2cBars = [
  {
    "upper": {
      "notes": [
        {
          "pitch": "B3",
          "rhythm": "dottedMinim",
          "beats": 3
        },
        {
          "pitch": "D4",
          "rhythm": "dottedMinim",
          "beats": 3
        },
        {
          "pitch": "F#4",
          "rhythm": "dottedMinim",
          "beats": 3
        }
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "B2",
          "rhythm": "dottedMinim",
          "beats": 3
        }
      ]
    },
    "number": 34,
    "answer": "Bm or VI"
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "B3",
          "rhythm": "dottedMinim",
          "beats": 3
        },
        {
          "pitch": "E4",
          "rhythm": "dottedMinim",
          "beats": 3
        },
        {
          "pitch": "G4",
          "rhythm": "dottedMinim",
          "beats": 3
        }
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "E2",
          "rhythm": "dottedMinim",
          "beats": 3
        }
      ]
    },
    "number": 35,
    "answer": "Em or II"
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "A3",
          "rhythm": "dottedMinim",
          "beats": 3
        },
        {
          "pitch": "D4",
          "rhythm": "dottedMinim",
          "beats": 3
        },
        {
          "pitch": "A4",
          "rhythm": "dottedMinim",
          "beats": 3
        }
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "F#2",
          "rhythm": "dottedMinim",
          "beats": 3
        }
      ]
    },
    "number": 36,
    "answer": "D first inversion or Ib"
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "B3",
          "rhythm": "dottedMinim",
          "beats": 3
        },
        {
          "pitch": "D4",
          "rhythm": "dottedMinim",
          "beats": 3
        },
        {
          "pitch": "G4",
          "rhythm": "dottedMinim",
          "beats": 3
        }
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "G2",
          "rhythm": "dottedMinim",
          "beats": 3
        }
      ]
    },
    "number": 37,
    "given": "G or IV",
    "finalBarline": "double"
  }
];

  const q2 = {
    a: {
      key: "D major",
      timeSignature: "3/4",
      bars: q2aBars,
      keyAnswer: "D major",
      repeat: { bar: 8, answer: "end-bar-8", accepted: ["end-bar-8", "start-bar-1,end-bar-8"] },
      bassClef: { bar: 10, labelLines: ["(iii) Re-write at", "same pitch"], labelLineOffsets: [0, 28], answer: ["E4", "D4", "C#4"], rhythms: ["crotchet", "dottedCrotchet", "quaver"] },
      tie: { fromBar: 19, fromNote: 2, toBar: 20, toNote: 0, answer: "19:2-20:0" },
      printedTie: { fromBar: 23, fromNote: 0, toBar: 24, toNote: 0 },
    },
    b: {
      key: "D major",
      timeSignature: "3/4",
      bars: q2bBars,
      chord: { bar: 33, answer: "Diminished 7th" },
    },
    c: {
      key: "D major",
      timeSignature: "3/4",
      bars: q2cBars,
      melody: [{"notes":[{"pitch":"E5","rhythm":"crotchet","beats":1},{"pitch":"D5","rhythm":"dottedCrotchet","beats":1.5},{"pitch":"C#5","rhythm":"quaver","beats":0.5}]},{"notes":[{"pitch":"B4","rhythm":"crotchet","beats":1},{"pitch":"G5","rhythm":"dottedCrotchet","beats":1.5},{"pitch":"A5","rhythm":"quaver","beats":0.5}]},{"notes":[{"pitch":"G5","rhythm":"crotchet","beats":1},{"pitch":"F#5","rhythm":"crotchet","beats":1},{"pitch":"D5","rhythm":"crotchet","beats":1}]},{"notes":[{"pitch":"B5","rhythm":"crotchet","beats":1},{"pitch":"A5","rhythm":"crotchet","beats":1},{"pitch":"G5","rhythm":"crotchet","beats":1}],"finalBarline":"double"}],
      answer: ["Bm or VI", "Em or II", "D first inversion or Ib"],
    },
    layout: {
      height: 2850,
      aGroups: [[0,1,2,3],[4,5,6,7],[8,9,10,11],[12,13,14,15],[16,17,18,19],[20,21,22,23]],
      aTops: [130,310,500,830,1010,1190],
      bGroups: [[0,1,2,3],[4,5,6,7],[8,9,10]],
      bTops: [1500,1680,1860],
      cTop: 2410,
    },
    finalBarline: "double",
  };

  // Question 4, official page 10 at 300 dpi and marking pages 4–5.
  // G major, 5/4, twelve complete bars. Bar 9 contains four printed quaver
  // stems whose required pitches are G4, A4, G4 and F-sharp4.
  const q4Bars = [
  {
    "notes": [
      {
        "pitch": "E4",
        "rhythm": "dottedMinim",
        "beats": 3
      },
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "E4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "E4",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "E5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "B4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "beamGroups": [
      {
        "start": 2,
        "end": 5
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "A#4",
        "rhythm": "dottedMinim",
        "beats": 3
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1,
        "accidental": "natural"
      },
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "E4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tieToNextBar": true
      }
    ],
    "beamGroups": [
      {
        "start": 2,
        "end": 3
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "E4",
        "rhythm": "minim",
        "beats": 2,
        "tiedFromPreviousBar": true
      },
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "B4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "B4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "beamGroups": [
      {
        "start": 2,
        "end": 5
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "C5",
        "rhythm": "dottedMinim",
        "beats": 3
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "B4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "missingAccidentalIndex": 0
  },
  {
    "notes": [
      {
        "pitch": "C5",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "C5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "C5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "beamGroups": [
      {
        "start": 2,
        "end": 5
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "B4",
        "rhythm": "dottedMinim",
        "beats": 3
      },
      {
        "pitch": "A#4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "E4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "intervalIndices": [
      1,
      2
    ]
  },
  {
    "notes": [
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "E4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F#4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "A4",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "beamGroups": [
      {
        "start": 0,
        "end": 3
      }
    ],
    "missingIndices": [
      0,
      1,
      2,
      3
    ]
  },
  {
    "notes": [
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "E4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "Bb4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "A4",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "beamGroups": [
      {
        "start": 0,
        "end": 3
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "D#4",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      }
    ],
    "partial": true,
    "finalBarline": "none"
  }
];
  const q4 = {
    key: "G major",
    timeSignature: "5/4",
    bars: q4Bars,
    pickup: {"notes":[{"pitch":"B3","rhythm":"crotchet","beats":1},{"pitch":"C#4","rhythm":"crotchet","beats":1}]},
    time: { answer: "5/4", placement: "after-key-signature" },
    accidental: { bar: 5, note: 0, answer: "sharp@0", pitch: "C#5" },
    interval: { bar: 7, notes: [1,2], answer: "Augmented 4th" },
    missing: { bar: 9, indices: [0,1,2,3], rhythms: ["quaver","quaver","quaver","quaver"], answer: ["G4","A4","G4","F#4"] },
    layout: { height:1170,groups:[[0,1],[2,3,4],[5,6,7],[8,9],[10,11]],systemTops:[100,300,500,770,1020] },
    finalBarline: "none",
  };

  // Question 5(b), official page 13 rendered at 600 dpi. Each choice has a
  // one-beat French-horn upbeat, three complete 4/4 bars, and a two-beat
  // ending. Options 1 and 4 use horn version A; options 2 and 3 use version
  // B. Options 1 and 3 end on D5; options 2 and 4 end on F5. Option 4 is the
  // credited combination.
  const q5bPickup = bar([
    note("C4", "dottedQuaver"), note("C4", "semiquaver"),
  ], { width: 0.7, beamGroups: [{ start: 0, end: 1 }] });
  const q5bHornA = bar([
    note("D4", "crotchet"), note("C4", "crotchet"), rest("quaverRest"),
    note("C4", "quaver"), note("D4", "quaver"), note("E4", "quaver"),
  ], { width: 1.45, beamGroups: [{ start: 4, end: 5 }] });
  const q5bHornB = bar([
    note("D4", "crotchet"), note("C4", "crotchet"), rest("quaverRest"),
    note("D4", "quaver"), note("E4", "quaver"), note("G4", "quaver"),
  ], { width: 1.45, beamGroups: [{ start: 4, end: 5 }] });
  const q5bChangeover = bar([
    note("G4", "crotchet"), note("F4", "crotchet"), rest("quaverRest"), rest("semiquaverRest"),
    note("F5", "semiquaver"), note("G5", "dottedQuaver"), note("A5", "semiquaver"),
  ], { width: 1.55, beamGroups: [{ start: 5, end: 6 }] });
  const q5bPianoRun = bar([
    note("C6", "quaver"), note("Bb5", "quaver"), note("A5", "quaver"), note("G5", "quaver"),
    note("G5", "quaver"), note("F5", "quaver"), note("F5", "quaver"), note("E5", "quaver"),
  ], { width: 2.05, beamGroups: [{ start: 0, end: 3 }, { start: 4, end: 7 }] });
  const q5bEnding = pitch => bar([
    note(pitch, "crotchet"), rest("crotchetRest"),
  ], { width: 0.55 });
  const q5bOption = (horn, ending) => [q5bPickup, horn, q5bChangeover, q5bPianoRun, q5bEnding(ending)];
  const q5b = {
    key: "F major",
    timeSignature: "4/4",
    answer: 4,
    options: [
      q5bOption(q5bHornA, "D5"),
      q5bOption(q5bHornB, "F5"),
      q5bOption(q5bHornB, "D5"),
      q5bOption(q5bHornA, "F5"),
    ],
    layout: { height: 190 },
    finalBarline: "none",
  };

  // The mixed-height quaver group in source Q4 bar 2 is beamed below.
  q4.bars[1].notes.slice(2).forEach(note => { note.stemDown = true; });
  const data = { q2, q4, q5b };
  root.AdvancedHigher2026Notation = data;
  if (typeof module !== "undefined" && module.exports) module.exports = data;
})(typeof window !== "undefined" ? window : globalThis);
