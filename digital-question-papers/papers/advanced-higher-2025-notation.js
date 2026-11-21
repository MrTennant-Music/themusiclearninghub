(function(root) {
  "use strict";
  const beats={demisemiquaver:.125,semiquaver:.25,quaver:.5,tripletQuaver:1/3,dottedQuaver:.75,tripletCrotchet:2/3,crotchet:1,dottedCrotchet:1.5,minim:2,dottedMinim:3,semibreve:4,quaverRest:.5,crotchetRest:1,minimRest:2,dottedMinimRest:3,semibreveRest:4};
  const note=(pitch,rhythm,extra={})=>({pitch,rhythm,beats:beats[rhythm],...extra});
  const rest=(rhythm,extra={})=>({rest:true,rhythm,beats:beats[rhythm],...extra});
  const bar=(notes,extra={})=>({notes,...extra});
  const grand=(upper,lower,extra={})=>({upper,lower,...extra});

  // Question 2(a), page 3 at 300 dpi: D major, 4/4, eight bars.
  // The three printed noteheads in bar 1 are a quaver triplet. The final
  // boxed E-sharp in bar 8 is rewritten as F on the top treble-staff line.
  const q2aBars=[
  {
    "notes": [
      {
        "pitch": "F#5",
        "rhythm": "minim",
        "beats": 2,
        "tieToNext": true,
        "stemDown": true
      },
      {
        "pitch": "F#5",
        "rhythm": "quaver",
        "beats": 0.5,
        "tiedFromPrevious": true,
        "stemDown": true
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "A4",
        "rhythm": "tripletQuaver",
        "beats": 0.3333333333333333,
        "missingRhythm": true,
        "stemDown": true
      },
      {
        "pitch": "D5",
        "rhythm": "tripletQuaver",
        "beats": 0.3333333333333333,
        "missingRhythm": true,
        "stemDown": true
      },
      {
        "pitch": "F#5",
        "rhythm": "tripletQuaver",
        "beats": 0.3333333333333333,
        "missingRhythm": true,
        "stemDown": true
      }
    ],
    "ties": [
      [
        0,
        1
      ]
    ],
    "triplets": [
      [
        3,
        5
      ]
    ],
    "missingRhythmIndices": [
      3,
      4,
      5
    ],
    "beamGroups": [
      [
        1,
        2
      ]
    ]
  },
  {
    "notes": [
      {
        "pitch": "B5",
        "rhythm": "minim",
        "beats": 2,
        "stemDown": true
      },
      {
        "pitch": "C#6",
        "rhythm": "crotchet",
        "beats": 1,
        "stemDown": true
      },
      {
        "pitch": "D6",
        "rhythm": "crotchet",
        "beats": 1,
        "stemDown": true
      }
    ],
    "beamGroups": []
  },
  {
    "notes": [
      {
        "pitch": "D5",
        "rhythm": "dottedCrotchet",
        "beats": 1.5,
        "stemDown": true
      },
      {
        "pitch": "E5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "F#5",
        "rhythm": "crotchet",
        "beats": 1,
        "turn": true,
        "stemDown": true
      },
      {
        "pitch": "A5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      }
    ],
    "beamGroups": [
      [
        3,
        4
      ]
    ]
  },
  {
    "notes": [
      {
        "pitch": "B4",
        "rhythm": "dottedMinim",
        "beats": 3,
        "stemDown": true
      },
      {
        "pitch": "C#5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "D5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      }
    ],
    "beamGroups": [
      [
        1,
        2
      ]
    ]
  },
  {
    "notes": [
      {
        "pitch": "F#5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "E5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "G5",
        "rhythm": "minim",
        "beats": 2,
        "stemDown": true
      },
      {
        "pitch": "D#5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "E5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      }
    ],
    "beamGroups": [
      [
        0,
        1
      ],
      [
        3,
        4
      ]
    ]
  },
  {
    "notes": [
      {
        "pitch": "F#5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "G5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "A5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "B5",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      },
      {
        "pitch": "B5",
        "rhythm": "crotchet",
        "beats": 1,
        "stemDown": true
      },
      {
        "pitch": "B4",
        "rhythm": "crotchet",
        "beats": 1,
        "stemDown": true
      }
    ],
    "beamGroups": [
      [
        0,
        3
      ]
    ]
  },
  {
    "notes": [
      {
        "pitch": "C#5",
        "rhythm": "minim",
        "beats": 2,
        "stemDown": true
      },
      {
        "pitch": "D5",
        "rhythm": "crotchet",
        "beats": 1,
        "accidental": "natural",
        "stemDown": true
      },
      {
        "pitch": "E5",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "stemDown": true
      },
      {
        "pitch": "D5",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "stemDown": true
      },
      {
        "pitch": "C#5",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "stemDown": true
      },
      {
        "pitch": "D5",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "stemDown": true
      }
    ],
    "beamGroups": [
      [
        2,
        5
      ]
    ]
  },
  {
    "notes": [
      {
        "pitch": "E5",
        "rhythm": "minim",
        "beats": 2,
        "stemDown": true
      },
      {
        "pitch": "E#5",
        "rhythm": "minim",
        "beats": 2,
        "stemDown": true
      }
    ],
    "enharmonic": {
      "note": 1,
      "source": "E#5",
      "answer": "F5"
    },
    "finalBarline": "double",
    "beamGroups": []
  }
];

  // Question 2(b), page 4. Each choice is the complete four-bar 4/4 phrase.
  const commonStart=[
    bar([note("C5","minim",{tieToNext:true}),note("C5","quaver",{tiedFromPrevious:true}),note("G4","quaver"),note("A4","quaver"),note("E4","quaver")],{ties:[[0,1]]}),
  ];
  const q2bOptions=[
  [
    {
      "notes": [
        {
          "pitch": "C5",
          "rhythm": "minim",
          "beats": 2,
          "tieToNext": true,
          "accidental": "natural"
        },
        {
          "pitch": "C5",
          "rhythm": "quaver",
          "beats": 0.5,
          "tiedFromPrevious": true,
          "stemDown": false
        },
        {
          "pitch": "G4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": false
        },
        {
          "pitch": "A4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": false
        },
        {
          "pitch": "E4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": false
        }
      ],
      "ties": [
        [
          0,
          1
        ]
      ],
      "beamGroups": [
        {
          "start": 1,
          "end": 4,
          "slope": 0
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
          "rhythm": "minim",
          "beats": 2
        },
        {
          "pitch": "A#4",
          "rhythm": "tripletQuaver",
          "stemDown": true,
          "beats": 0.3333333333333333
        },
        {
          "pitch": "B4",
          "rhythm": "tripletQuaver",
          "stemDown": true,
          "beats": 0.3333333333333333
        },
        {
          "pitch": "C#5",
          "rhythm": "tripletQuaver",
          "stemDown": true,
          "courtesyAccidental": "sharp",
          "beats": 0.3333333333333333
        }
      ],
      "triplets": [
        [
          2,
          4
        ]
      ],
      "beamGroups": [
        [
          2,
          4
        ]
      ]
    },
    {
      "notes": [
        {
          "pitch": "D5",
          "rhythm": "minim",
          "beats": 2,
          "tieToNext": true
        },
        {
          "pitch": "D5",
          "rhythm": "quaver",
          "beats": 0.5,
          "tiedFromPrevious": true,
          "stemDown": true
        },
        {
          "pitch": "E5",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": true
        },
        {
          "pitch": "D5",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": true
        },
        {
          "pitch": "B4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": true
        }
      ],
      "ties": [
        [
          0,
          1
        ]
      ],
      "beamGroups": [
        {
          "start": 1,
          "end": 4,
          "slope": 0.1
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
          "rhythm": "minim",
          "beats": 2
        },
        {
          "rest": true,
          "rhythm": "crotchetRest",
          "beats": 1
        }
      ],
      "finalBarline": "double"
    }
  ],
  [
    {
      "notes": [
        {
          "pitch": "C5",
          "rhythm": "minim",
          "beats": 2,
          "tieToNext": true,
          "accidental": "natural"
        },
        {
          "pitch": "C5",
          "rhythm": "quaver",
          "beats": 0.5,
          "tiedFromPrevious": true,
          "stemDown": false
        },
        {
          "pitch": "G4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": false
        },
        {
          "pitch": "A4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": false
        },
        {
          "pitch": "E4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": false
        }
      ],
      "ties": [
        [
          0,
          1
        ]
      ],
      "beamGroups": [
        {
          "start": 1,
          "end": 4,
          "slope": 0
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
          "rhythm": "minim",
          "beats": 2
        },
        {
          "pitch": "A#4",
          "rhythm": "tripletQuaver",
          "stemDown": true,
          "beats": 0.3333333333333333
        },
        {
          "pitch": "C#5",
          "rhythm": "tripletQuaver",
          "stemDown": true,
          "courtesyAccidental": "sharp",
          "beats": 0.3333333333333333
        },
        {
          "pitch": "E5",
          "rhythm": "tripletQuaver",
          "stemDown": true,
          "beats": 0.3333333333333333
        }
      ],
      "triplets": [
        [
          2,
          4
        ]
      ],
      "beamGroups": [
        [
          2,
          4
        ]
      ]
    },
    {
      "notes": [
        {
          "pitch": "E5",
          "rhythm": "minim",
          "beats": 2,
          "tieToNext": true
        },
        {
          "pitch": "E5",
          "rhythm": "quaver",
          "beats": 0.5,
          "tiedFromPrevious": true,
          "stemDown": true
        },
        {
          "pitch": "E5",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": true
        },
        {
          "pitch": "D5",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": true
        },
        {
          "pitch": "B4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": true
        }
      ],
      "ties": [
        [
          0,
          1
        ]
      ],
      "beamGroups": [
        {
          "start": 1,
          "end": 4,
          "slope": 0.1
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
          "rhythm": "minim",
          "beats": 2
        },
        {
          "rest": true,
          "rhythm": "crotchetRest",
          "beats": 1
        }
      ],
      "finalBarline": "double"
    }
  ],
  [
    {
      "notes": [
        {
          "pitch": "C5",
          "rhythm": "minim",
          "beats": 2,
          "tieToNext": true,
          "accidental": "natural"
        },
        {
          "pitch": "C5",
          "rhythm": "quaver",
          "beats": 0.5,
          "tiedFromPrevious": true,
          "stemDown": false
        },
        {
          "pitch": "G4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": false
        },
        {
          "pitch": "A4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": false
        },
        {
          "pitch": "E4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": false
        }
      ],
      "ties": [
        [
          0,
          1
        ]
      ],
      "beamGroups": [
        {
          "start": 1,
          "end": 4,
          "slope": 0
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
          "rhythm": "minim",
          "beats": 2
        },
        {
          "pitch": "A#4",
          "rhythm": "tripletQuaver",
          "stemDown": true,
          "beats": 0.3333333333333333
        },
        {
          "pitch": "C#5",
          "rhythm": "tripletQuaver",
          "stemDown": true,
          "courtesyAccidental": "sharp",
          "beats": 0.3333333333333333
        },
        {
          "pitch": "E5",
          "rhythm": "tripletQuaver",
          "stemDown": true,
          "beats": 0.3333333333333333
        }
      ],
      "triplets": [
        [
          2,
          4
        ]
      ],
      "beamGroups": [
        [
          2,
          4
        ]
      ]
    },
    {
      "notes": [
        {
          "pitch": "E5",
          "rhythm": "minim",
          "beats": 2,
          "tieToNext": true
        },
        {
          "pitch": "E5",
          "rhythm": "quaver",
          "beats": 0.5,
          "tiedFromPrevious": true,
          "stemDown": true
        },
        {
          "pitch": "B4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": true
        },
        {
          "pitch": "C5",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": true
        },
        {
          "pitch": "G4",
          "rhythm": "quaver",
          "beats": 0.5,
          "stemDown": true
        }
      ],
      "ties": [
        [
          0,
          1
        ]
      ],
      "beamGroups": [
        {
          "start": 1,
          "end": 4,
          "slope": 0
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
          "rhythm": "minim",
          "beats": 2
        },
        {
          "rest": true,
          "rhythm": "crotchetRest",
          "beats": 1
        }
      ],
      "finalBarline": "double"
    }
  ]
];

  // Question 2(c), page 5: F major, 3/4. The tied F notes across bars 2
  // and 3 have a combined value of four crotchet beats. Bars 7–8 cadence V–I.
  const q2cBars=[
  {
    "notes": [
      {
        "pitch": "C5",
        "rhythm": "crotchet",
        "beats": 1
      },
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
        "pitch": "C5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F5",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "slurs": [
      [
        1,
        4
      ]
    ],
    "beamGroups": [
      [
        1,
        4
      ]
    ],
    "slurStyle": {
      "below": true,
      "followPitch": true
    }
  },
  {
    "notes": [
      {
        "pitch": "F5",
        "rhythm": "dottedMinim",
        "beats": 3,
        "tieToNextBar": true
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "F5",
        "rhythm": "crotchet",
        "beats": 1,
        "tiedFromPreviousBar": true
      },
      {
        "pitch": "A5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "G5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "G5",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "slurs": [
      [
        1,
        4
      ]
    ],
    "beamGroups": [
      [
        1,
        4
      ]
    ]
  },
  {
    "notes": [
      {
        "pitch": "G5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "F5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "E5",
        "rhythm": "crotchet",
        "beats": 1
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "F5",
        "rhythm": "dottedMinim",
        "beats": 3,
        "tieToNextBar": true
      }
    ]
  },
  {
    "notes": [
      {
        "pitch": "F5",
        "rhythm": "crotchet",
        "beats": 1,
        "tiedFromPreviousBar": true
      },
      {
        "pitch": "A5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G5",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "slurs": [
      [
        1,
        2
      ]
    ],
    "slurStyle": {
      "above": true,
      "followPitch": true
    }
  },
  {
    "notes": [
      {
        "pitch": "G5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "Bb5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "A5",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G5",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F5",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "cadenceStart": true,
    "slurs": [
      [
        0,
        1
      ],
      [
        3,
        4
      ]
    ],
    "beamGroups": [
      [
        0,
        1
      ],
      [
        3,
        4
      ]
    ],
    "slurStyle": {
      "above": true,
      "followPitch": true
    }
  },
  {
    "notes": [
      {
        "pitch": "F5",
        "rhythm": "minim",
        "beats": 2
      },
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      }
    ],
    "cadenceEnd": true,
    "finalBarline": "double"
  }
];
  const q2dBars=[
  {
    "upper": {
      "notes": [
        {
          "pitch": "F5",
          "rhythm": "minim",
          "beats": 2
        },
        {
          "pitch": "F5",
          "rhythm": "dottedQuaver",
          "beats": 0.75,
          "staccato": false,
          "graceBefore": [
            "E5",
            "F5",
            "G5"
          ],
          "graceRhythm": "semiquaver"
        },
        {
          "pitch": "E5",
          "rhythm": "demisemiquaver",
          "beats": 0.125
        },
        {
          "pitch": "D5",
          "rhythm": "demisemiquaver",
          "beats": 0.125
        }
      ],
      "beamGroups": [
        [
          1,
          3
        ]
      ],
      "slurs": [
        [
          0,
          3
        ]
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "D3",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "pitch": "D2",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "pitch": "D3",
          "rhythm": "crotchet",
          "beats": 1
        }
      ]
    },
    "pianoUpper": {
      "notes": [
        {
          "pitch": "D4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "A3",
            "D4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "A3": true
          }
        },
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "D4": false
          }
        },
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "D4": false
          }
        },
        {
          "pitch": "D4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "A3",
            "D4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "A3": false
          }
        },
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "D4": false
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "F4": false
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "F4": false
          }
        },
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "D4": false
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "F4": false
          }
        },
        {
          "pitch": "D5",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "A4",
            "D5"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "A4": false
          }
        },
        {
          "pitch": "D5",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "A4",
            "D5"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "A4": false
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "F4": false
          }
        }
      ],
      "beamGroups": [
        [
          0,
          3
        ],
        [
          4,
          7
        ],
        [
          8,
          11
        ]
      ],
      "slurs": [
        [
          0,
          1
        ],
        [
          2,
          3
        ],
        [
          4,
          5
        ],
        [
          6,
          7
        ],
        [
          8,
          9
        ],
        [
          10,
          11
        ]
      ],
      "slurStyle": {
        "below": true,
        "followPitch": true
      }
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "D5",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "pitch": "C#5",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "rest": true,
          "rhythm": "crotchetRest",
          "beats": 1
        }
      ],
      "slurs": [
        [
          0,
          1
        ]
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "E3",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "pitch": "A2",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "rest": true,
          "rhythm": "crotchetRest",
          "beats": 1
        }
      ]
    },
    "pianoUpper": {
      "notes": [
        {
          "pitch": "G4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "E4",
            "G4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "E4": true
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "F4": true
          }
        },
        {
          "pitch": "B4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "G4",
            "B4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "G4": false
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "F4": false
          }
        },
        {
          "pitch": "G4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "E4",
            "G4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "E4": false
          }
        },
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "D4": true
          }
        },
        {
          "pitch": "E4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "C#4",
            "E4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "C#4": true
          }
        },
        {
          "pitch": "D4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "B3",
            "D4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "B3": true
          }
        },
        {
          "pitch": "C4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "A3",
            "C4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "A3": true
          }
        },
        {
          "pitch": "D4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "B3",
            "D4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "B3": false
          }
        },
        {
          "pitch": "E4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "C4",
            "E4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "C4": false
          }
        },
        {
          "pitch": "G4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "E4",
            "G4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "E4": false
          }
        }
      ],
      "beamGroups": [
        [
          0,
          3
        ],
        [
          4,
          7
        ],
        [
          8,
          11
        ]
      ],
      "slurs": [
        [
          0,
          1
        ],
        [
          2,
          3
        ],
        [
          4,
          5
        ],
        [
          6,
          7
        ],
        [
          8,
          9
        ],
        [
          10,
          11
        ]
      ],
      "slurStyle": {
        "below": true,
        "followPitch": true
      }
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "A5",
          "rhythm": "minim",
          "beats": 2
        },
        {
          "pitch": "A5",
          "rhythm": "crotchet",
          "beats": 1,
          "graceBefore": [
            "B5"
          ],
          "graceYOffset": -4.4
        }
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "D3",
          "rhythm": "crotchet",
          "beats": 1,
          "missing": true
        },
        {
          "pitch": "E3",
          "rhythm": "crotchet",
          "beats": 1,
          "missing": true
        },
        {
          "pitch": "F3",
          "rhythm": "crotchet",
          "beats": 1,
          "missing": true
        }
      ]
    },
    "missingBassIndices": [
      0,
      1,
      2
    ],
    "pianoUpper": {
      "notes": [
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "D4": true
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "F4": false
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "F4": false
          }
        },
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "D4": false
          }
        },
        {
          "pitch": "E4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "C#4",
            "E4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "C#4": true
          }
        },
        {
          "pitch": "G4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "E4",
            "G4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "E4": false
          }
        },
        {
          "pitch": "G4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "E4",
            "G4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "E4": false
          }
        },
        {
          "pitch": "E4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "C#4",
            "E4"
          ],
          "suppressAccidental": true,
          "stemDown": false,
          "chordAccidentals": {
            "C#4": false
          }
        },
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "D4": false
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "F4": false
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "F4": false
          }
        },
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "D4": false
          }
        }
      ],
      "beamGroups": [
        [
          0,
          3
        ],
        [
          4,
          7
        ],
        [
          8,
          11
        ]
      ],
      "slurs": [
        [
          0,
          1
        ],
        [
          2,
          3
        ],
        [
          4,
          5
        ],
        [
          6,
          7
        ],
        [
          8,
          9
        ],
        [
          10,
          11
        ]
      ],
      "slurStyle": {
        "below": true,
        "followPitch": true
      }
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "B5",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "pitch": "A5",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "rest": true,
          "rhythm": "crotchetRest",
          "beats": 1
        }
      ],
      "slurs": [
        [
          0,
          1
        ]
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "G3",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "pitch": "F3",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "pitch": "A3",
          "rhythm": "crotchet",
          "beats": 1
        }
      ]
    },
    "pianoUpper": {
      "notes": [
        {
          "pitch": "E4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "C#4",
            "E4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "C#4": true
          }
        },
        {
          "pitch": "B4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "E4",
            "B4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "E4": false
          }
        },
        {
          "pitch": "B4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "E4",
            "B4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "E4": false
          }
        },
        {
          "pitch": "E4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "C#4",
            "E4"
          ],
          "suppressAccidental": true,
          "stemDown": false,
          "chordAccidentals": {
            "C#4": false
          }
        },
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "D4": true
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": false,
          "chordAccidentals": {
            "F4": false
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "F4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "F4": false
          }
        },
        {
          "pitch": "F4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "D4",
            "F4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "D4": false
          }
        },
        {
          "pitch": "E4",
          "rhythm": "quaver",
          "beats": 0.5,
          "chord": [
            "C4",
            "E4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "C4": true
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "E4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "E4": false
          }
        },
        {
          "pitch": "A4",
          "rhythm": "semiquaver",
          "beats": 0.25,
          "chord": [
            "E4",
            "A4"
          ],
          "stemDown": false,
          "suppressAccidental": true,
          "chordAccidentals": {
            "E4": false
          }
        }
      ],
      "beamGroups": [
        [
          0,
          3
        ],
        [
          4,
          7
        ],
        [
          8,
          10
        ]
      ],
      "slurs": [
        [
          0,
          1
        ],
        [
          2,
          3
        ],
        [
          4,
          5
        ],
        [
          6,
          7
        ],
        [
          8,
          10
        ]
      ],
      "slurStyle": {
        "below": true,
        "followPitch": true
      }
    },
    "finalBarline": "double"
  }
];


  // Question 4, page 11. The piano/string introduction is F3–E3–D3–C3
  // and therefore F4–E4–D4–C4 one octave higher. Bar 4 omits A4 crotchet,
  // G4/F4 quavers and D4 crotchet. Bar 12's B-flat is the sole valid circle.
  const q4Bars=[
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "C5",
        "rhythm": "dottedQuaver",
        "beats": 0.75,
        "stemDown": true
      },
      {
        "pitch": "C5",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "tieToNext": true,
        "stemDown": true
      },
      {
        "pitch": "C5",
        "rhythm": "quaver",
        "beats": 0.5,
        "tiedFromPrevious": true,
        "stemDown": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      }
    ],
    "beamGroups": [
      {
        "start": 1,
        "end": 2
      },
      {
        "start": 3,
        "end": 4
      },
      {
        "start": 5,
        "end": 6
      }
    ],
    "ties": [
      [
        4,
        5
      ]
    ],
    "lyrics": [
      "",
      "You",
      "can",
      "build",
      "me___",
      "",
      "up,"
    ]
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "G4",
        "rhythm": "dottedQuaver",
        "beats": 0.75
      },
      {
        "pitch": "A4",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "tieToNext": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tiedFromPrevious": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "beamGroups": [
      {
        "start": 1,
        "end": 2
      },
      {
        "start": 3,
        "end": 4
      },
      {
        "start": 5,
        "end": 6
      }
    ],
    "ties": [
      [
        4,
        5
      ]
    ],
    "lyrics": [
      "",
      "You",
      "can",
      "tear",
      "me___",
      "",
      "down,"
    ]
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "A4",
        "rhythm": "dottedQuaver",
        "beats": 0.75
      },
      {
        "pitch": "A4",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "tieToNext": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tiedFromPrevious": true
      },
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tieToNextBar": true
      }
    ],
    "beamGroups": [
      {
        "start": 1,
        "end": 2
      },
      {
        "start": 3,
        "end": 4
      },
      {
        "start": 5,
        "end": 6
      }
    ],
    "ties": [
      [
        4,
        5
      ]
    ],
    "lyrics": [
      "",
      "You",
      "can",
      "try,",
      "but___",
      "",
      "I’m___"
    ],
    "lyricXOffsets": [
      0,
      0,
      0,
      0,
      5,
      0,
      0
    ]
  },
  {
    "notes": [
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1,
        "tiedFromPreviousBar": true
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1,
        "missing": true
      },
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5,
        "missing": true
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5,
        "missing": true
      },
      {
        "pitch": "D4",
        "rhythm": "crotchet",
        "beats": 1,
        "missing": true
      }
    ],
    "missingIndices": [
      1,
      2,
      3,
      4
    ],
    "lyrics": [
      "",
      "un-",
      "break-",
      "a-",
      "ble."
    ],
    "lyricXOffsets": [
      0,
      -5,
      -5,
      8,
      0
    ]
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "C5",
        "rhythm": "dottedQuaver",
        "beats": 0.75,
        "stemDown": true
      },
      {
        "pitch": "C5",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "tieToNext": true,
        "stemDown": true
      },
      {
        "pitch": "C5",
        "rhythm": "quaver",
        "beats": 0.5,
        "tiedFromPrevious": true,
        "stemDown": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5,
        "stemDown": true
      }
    ],
    "beamGroups": [
      {
        "start": 1,
        "end": 2
      },
      {
        "start": 3,
        "end": 4
      },
      {
        "start": 5,
        "end": 6
      }
    ],
    "ties": [
      [
        4,
        5
      ]
    ],
    "lyrics": [
      "",
      "You",
      "can",
      "do",
      "your___",
      "",
      "best,"
    ]
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "G4",
        "rhythm": "dottedQuaver",
        "beats": 0.75
      },
      {
        "pitch": "A4",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "tieToNext": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tiedFromPrevious": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "beamGroups": [
      {
        "start": 1,
        "end": 2
      },
      {
        "start": 3,
        "end": 4
      },
      {
        "start": 5,
        "end": 6
      }
    ],
    "ties": [
      [
        4,
        5
      ]
    ],
    "lyrics": [
      "",
      "but",
      "I’ll",
      "stand",
      "the___",
      "",
      "test,"
    ],
    "lyricXOffsets": [
      0,
      0,
      0,
      0,
      7,
      0,
      0
    ]
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "F4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "A4",
        "rhythm": "dottedQuaver",
        "beats": 0.75
      },
      {
        "pitch": "A4",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "tieToNext": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tiedFromPrevious": true
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
        "end": 3
      },
      {
        "start": 4,
        "end": 5
      }
    ],
    "ties": [
      [
        3,
        4
      ]
    ],
    "lyrics": [
      "",
      "You'll",
      "find",
      "that___",
      "",
      "I'm___"
    ],
    "lyricXOffsets": [
      0,
      0,
      0,
      8,
      0,
      0
    ]
  },
  {
    "notes": [
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1,
        "tiedFromPreviousBar": true
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "D4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "beamGroups": [
      {
        "start": 2,
        "end": 3
      }
    ],
    "lyrics": [
      "",
      "un-",
      "shake-",
      "a-",
      "ble."
    ],
    "lyricXOffsets": [
      0,
      -5,
      -5,
      8,
      0
    ]
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "D4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "D4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "C4",
        "rhythm": "dottedQuaver",
        "beats": 0.75
      },
      {
        "pitch": "F4",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "tieToNext": true
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tiedFromPrevious": true
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "beamGroups": [
      {
        "start": 1,
        "end": 2
      },
      {
        "start": 3,
        "end": 4
      },
      {
        "start": 5,
        "end": 6
      }
    ],
    "ties": [
      [
        4,
        5
      ]
    ],
    "missingBarlineAfter": true,
    "lyrics": [
      "",
      "When",
      "the",
      "fi -",
      "re’s",
      "",
      "burned,"
    ]
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "G4",
        "rhythm": "dottedQuaver",
        "beats": 0.75
      },
      {
        "pitch": "A4",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "tieToNext": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tiedFromPrevious": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5
      }
    ],
    "beamGroups": [
      {
        "start": 1,
        "end": 2
      },
      {
        "start": 3,
        "end": 4
      },
      {
        "start": 5,
        "end": 6
      }
    ],
    "ties": [
      [
        4,
        5
      ]
    ],
    "missingBarlineAfter": true,
    "lyrics": [
      "",
      "when",
      "the",
      "wind",
      "has___",
      "",
      "blown,"
    ],
    "lyricXOffsets": [
      0,
      0,
      0,
      0,
      10,
      0,
      0
    ]
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "A4",
        "rhythm": "dottedQuaver",
        "beats": 0.75
      },
      {
        "pitch": "A4",
        "rhythm": "semiquaver",
        "beats": 0.25,
        "tieToNext": true
      },
      {
        "pitch": "A4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tiedFromPrevious": true
      },
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tieToNextBar": true
      }
    ],
    "beamGroups": [
      {
        "start": 1,
        "end": 2
      },
      {
        "start": 3,
        "end": 4
      },
      {
        "start": 5,
        "end": 6
      }
    ],
    "ties": [
      [
        4,
        5
      ]
    ],
    "lyrics": [
      "",
      "when",
      "the",
      "wa-",
      "ter's___",
      "",
      "dried,"
    ]
  },
  {
    "notes": [
      {
        "pitch": "G4",
        "rhythm": "crotchet",
        "beats": 1,
        "tiedFromPreviousBar": true
      },
      {
        "pitch": "Bb4",
        "rhythm": "crotchet",
        "beats": 1,
        "circleAnswer": true
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5,
        "tieToNextBar": true
      }
    ],
    "beamGroups": [
      {
        "start": 3,
        "end": 4
      }
    ],
    "slurs": [
      [
        3,
        4
      ]
    ],
    "lyrics": [
      "___",
      "you’ll",
      "still",
      "find___",
      ""
    ],
    "lyricXOffsets": [
      0,
      0,
      5,
      10,
      0
    ],
    "slurStyle": {
      "below": true,
      "followPitch": true
    }
  },
  {
    "notes": [
      {
        "pitch": "F4",
        "rhythm": "crotchet",
        "beats": 1,
        "tiedFromPreviousBar": true
      },
      {
        "pitch": "D4",
        "rhythm": "dottedMinim",
        "beats": 3
      }
    ],
    "lyrics": [
      "",
      "stone"
    ]
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "semibreveRest",
        "beats": 4
      }
    ],
    "lyrics": []
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "semibreveRest",
        "beats": 4
      }
    ],
    "lyrics": []
  },
  {
    "notes": [
      {
        "rest": true,
        "rhythm": "crotchetRest",
        "beats": 1
      },
      {
        "pitch": "A4",
        "rhythm": "crotchet",
        "beats": 1
      },
      {
        "pitch": "G4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "quaver",
        "beats": 0.5
      },
      {
        "pitch": "F4",
        "rhythm": "crotchet",
        "beats": 1
      }
    ],
    "beamGroups": [
      {
        "start": 2,
        "end": 3
      }
    ],
    "slurs": [
      [
        2,
        3
      ]
    ],
    "lyrics": [
      "",
      "My",
      "heart",
      "of",
      "stone."
    ],
    "lyricXOffsets": [
      0,
      -6,
      4,
      16,
      48
    ],
    "slurStyle": {
      "below": true,
      "followPitch": true
    }
  },
  {
    "notes": [
      {
        "pitch": "F4",
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
        "rhythm": "minimRest",
        "beats": 2
      }
    ],
    "finalBarline": "double",
    "lyrics": []
  }
];

  // Question 5(d), page 13: an anacrusis and eleven 3/4 bars on a vocal
  // grand staff. The four written parts were checked independently against
  // the PDF vectors. The assessed sonorities are A#-C#-E-G in bar 6 and the
  // major sixth A4-F#5 between alto and soprano in bar 10.
  const q5Pickup={
  "upper": {
    "notes": [
      {
        "pitch": "B4",
        "rhythm": "crotchet",
        "beats": 1,
        "chord": [
          "D#4",
          "B4"
        ],
        "stemDown": false,
        "accidentalXOffset": -5
      }
    ],
    "lyrics": [
      "that"
    ]
  },
  "lower": {
    "notes": [
      {
        "pitch": "B3",
        "rhythm": "crotchet",
        "beats": 1,
        "chord": [
          "A3",
          "B3"
        ],
        "stemDown": false
      }
    ]
  }
};

  const q5Bars=[
  {
    "upper": {
      "notes": [
        {
          "pitch": "E5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "E4",
            "E5"
          ],
          "stemDown": false
        },
        {
          "pitch": "E5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "E4",
            "E5"
          ],
          "stemDown": false
        },
        {
          "pitch": "D5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "F#4",
            "D5"
          ],
          "stemDown": false
        }
      ],
      "lyrics": [
        "who -",
        "so",
        "be -"
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "B3",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "G3",
            "B3"
          ],
          "stemDown": false
        },
        {
          "pitch": "B3",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "G3",
            "B3"
          ],
          "stemDown": false
        },
        {
          "pitch": "B3",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "F#3",
            "B3"
          ],
          "stemDown": false
        }
      ]
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "C#5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "G4",
            "C#5"
          ],
          "stemDown": false
        },
        {
          "pitch": "D5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "G4",
            "D5"
          ],
          "stemDown": false
        },
        {
          "pitch": "B4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "F#4",
            "B4"
          ],
          "stemDown": false
        }
      ],
      "lyrics": [
        "liev -",
        "eth,",
        "be -"
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "A#3",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "E3",
            "A#3"
          ],
          "stemDown": false
        },
        {
          "pitch": "B3",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "D3",
            "B3"
          ],
          "stemDown": false
        },
        {
          "pitch": "D4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "D3",
            "D4"
          ],
          "stemDown": false
        }
      ]
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "B4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "E4",
            "B4"
          ],
          "stemDown": false
        },
        {
          "pitch": "A4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "E4",
            "A4"
          ],
          "stemDown": false
        },
        {
          "pitch": "F#4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "D4",
            "F#4"
          ],
          "stemDown": false
        }
      ],
      "lyrics": [
        "liev -",
        "eth",
        "in"
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "C4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "D3",
            "C4"
          ],
          "accidental": "natural",
          "stemDown": false
        },
        {
          "pitch": "C4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "D3",
            "C4"
          ],
          "suppressAccidental": true,
          "stemDown": false
        },
        {
          "pitch": "C4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "D3",
            "C4"
          ],
          "suppressAccidental": true,
          "stemDown": false
        }
      ]
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "D5",
          "rhythm": "minim",
          "beats": 2,
          "chord": [
            "G4",
            "D5"
          ],
          "stemDown": false
        },
        {
          "rest": true,
          "rhythm": "crotchetRest",
          "beats": 1,
          "stemDown": false
        }
      ],
      "lyrics": [
        "Him",
        ""
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "B3",
          "rhythm": "minim",
          "beats": 2,
          "chord": [
            "D3",
            "B3"
          ],
          "stemDown": false
        },
        {
          "rest": true,
          "rhythm": "crotchetRest",
          "beats": 1,
          "stemDown": false
        }
      ]
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "D4",
          "rhythm": "minim",
          "beats": 2,
          "stemDown": false
        },
        {
          "pitch": "G4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "D4",
            "G4"
          ],
          "stemDown": false
        }
      ],
      "lyrics": [
        "should",
        "not"
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "D4",
          "rhythm": "minim",
          "beats": 2,
          "chord": [
            "D3",
            "D4"
          ],
          "stemDown": false
        },
        {
          "pitch": "D4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "B3",
            "D4"
          ],
          "stemDown": false
        }
      ]
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "G4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "E4",
            "G4"
          ],
          "stemDown": false
        },
        {
          "pitch": "F#4",
          "rhythm": "minim",
          "beats": 2,
          "chord": [
            "E4",
            "F#4"
          ],
          "stemDown": false
        }
      ],
      "lyrics": [
        "pe -",
        "rish,"
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "C#4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "A#3",
            "C#4"
          ],
          "stemDown": false,
          "accidentalXOffset": -5
        },
        {
          "pitch": "C#4",
          "rhythm": "minim",
          "beats": 2,
          "chord": [
            "A3",
            "C#4"
          ],
          "stemDown": false
        }
      ]
    },
    "chord": {
      "answer": "Diminished 7th"
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "F#4",
          "rhythm": "minim",
          "beats": 2,
          "chord": [
            "C#4",
            "F#4"
          ],
          "stemDown": false
        },
        {
          "pitch": "F#5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "F#4",
            "F#5"
          ],
          "stemDown": false
        }
      ],
      "lyrics": [
        "should",
        "not"
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "A#3",
          "rhythm": "minim",
          "beats": 2,
          "stemDown": true
        },
        {
          "pitch": "C#4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "A3",
            "C#4"
          ],
          "stemDown": false
        }
      ],
      "overlays": [
        {
          "beat": 0,
          "pitch": "E4",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "beat": 1,
          "pitch": "D4",
          "rhythm": "crotchet",
          "beats": 1
        }
      ]
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "D5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "F#4",
            "D5"
          ],
          "stemDown": false
        },
        {
          "pitch": "C#5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "E4",
            "C#5"
          ],
          "stemDown": false
        },
        {
          "pitch": "B4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "D4",
            "B4"
          ],
          "stemDown": false
        }
      ],
      "lyrics": [
        "pe -",
        "rish,",
        "but"
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "B3",
          "rhythm": "crotchet",
          "beats": 1,
          "stemDown": false,
          "dualStem": true
        },
        {
          "pitch": "A#3",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "F#3",
            "A#3"
          ],
          "stemDown": false
        },
        {
          "pitch": "B3",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "G3",
            "B3"
          ],
          "stemDown": false
        }
      ]
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "A4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "F#4",
            "A4"
          ],
          "stemDown": false
        },
        {
          "pitch": "D5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "A4",
            "D5"
          ],
          "stemDown": false
        },
        {
          "pitch": "F#5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "A4",
            "F#5"
          ],
          "stemDown": false
        }
      ],
      "lyrics": [
        "have",
        "ev -",
        "er -"
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "D4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "A3",
            "D4"
          ],
          "stemDown": false
        },
        {
          "pitch": "F#4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "A3",
            "F#4"
          ],
          "stemDown": false
        },
        {
          "pitch": "D4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "A3",
            "D4"
          ],
          "stemDown": false
        }
      ]
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "F#5",
          "rhythm": "minim",
          "beats": 2,
          "chord": [
            "A4",
            "F#5"
          ],
          "stemDown": false
        },
        {
          "pitch": "E5",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "G4",
            "E5"
          ],
          "stemDown": false
        }
      ],
      "lyrics": [
        "last -",
        "ing"
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "A3",
          "rhythm": "minim",
          "beats": 2,
          "stemDown": true
        },
        {
          "pitch": "C#4",
          "rhythm": "crotchet",
          "beats": 1,
          "chord": [
            "A3",
            "C#4"
          ],
          "stemDown": false
        }
      ],
      "overlays": [
        {
          "beat": 0,
          "pitch": "D4",
          "rhythm": "crotchet",
          "beats": 1
        },
        {
          "beat": 1,
          "pitch": "B3",
          "rhythm": "crotchet",
          "beats": 1
        }
      ]
    },
    "interval": {
      "lower": "A4",
      "upper": "F#5",
      "answer": "Major 6th"
    }
  },
  {
    "upper": {
      "notes": [
        {
          "pitch": "D5",
          "rhythm": "dottedMinim",
          "beats": 3,
          "chord": [
            "F#4",
            "D5"
          ],
          "stemDown": false
        }
      ],
      "lyrics": [
        "life."
      ]
    },
    "lower": {
      "notes": [
        {
          "pitch": "D4",
          "rhythm": "dottedMinim",
          "beats": 3,
          "stemDown": false,
          "dualStem": true
        }
      ]
    },
    "finalBarline": "double"
  }
];


  // Source page 4: option 3's final mixed-height quaver group has up stems.
  q2bOptions[2][2].notes.slice(1).forEach(note=>{note.stemDown=false;});
  // Source page 5: the first slurred quaver group is beamed below the staff.
  q2cBars[0].notes.slice(1).forEach(note=>{note.stemDown=true;});

  const data={
    q2:{a:{key:"D major",timeSignature:"4/4",bars:q2aBars,missingRhythm:{bar:1,indices:[3,4,5],answer:["tripletQuaver","tripletQuaver","tripletQuaver"]},enharmonic:{bar:8,note:1,source:"E#5",answer:"F5"}},b:{key:"D major",timeSignature:"4/4",options:q2bOptions,answer:3},c:{key:"F major",timeSignature:"3/4",bars:q2cBars,totalValue:{bars:[2,3],answer:"4"},cadence:{bars:[7,8],answer:"Perfect"}},d:{key:"D minor",timeSignature:"3/4",bars:q2dBars,bass:{bar:11,indices:[0,1,2],answer:["D3","E3","F3"],rhythm:"crotchet"}},finalBarline:"double",layout:{height:2580,aGroups:[[0,1],[2,3,4],[5,6,7]],aTops:[110,278,526],aBounds:[[165,555,870],[145,395,602,870],[145,396,675,870]],aNoteXs:[[177,308,358,409,464,527],[587,723,804],[156,229,270,318,366],[420,543,585],[625,668,723,790,839],[156,195,233,272,310,352],[425,496,534,573,612,650],[709,777]],aRhythmBox:{x:379,y:15,width:173,height:214},aEnharmonicBox:{x:695,y:338,width:158,height:258,staffTop:430,staffRight:870},aIntroduction:{x:105,y:32,width:198,height:30},cGroups:[[0,1,2],[3,4,5],[6,7]],cTops:[1000,1220,1410],cTieWidthScale:2.2,dGroups:[[0,1],[2,3]],dTops:[1740,2200],dPianoOffset:128,dBassOffset:270,dLowerHeadXOffset:2,dPianoStemXOffset:2,dPianoAccidentalXOffset:-5,dBounds:[[165,517.5,870],[145,507.5,870]],dBassBox:{topOffset:68,bottomOffset:76},dChordGrid:{topOffset:86,height:120}}},
    q2b:{key:"D major",timeSignature:"4/4",options:q2bOptions,answer:3,layout:{height:150,bounds:[150,342,535,715,870],noteXs:[[181,240,279,306,327],[370,402,455,480,514],[562,618,645,672,699],[736,772,827]]}},
    q4:{key:"F major",timeSignature:"4/4",intro:{source:["F3","E3","D3","C3"],answer:["F4","E4","D4","C4"],rhythm:"quaver"},bars:q4Bars,missing:{bar:4,indices:[1,2,3,4],answer:["A4","G4","F4","D4"],rhythms:["crotchet","quaver","quaver","crotchet"]},circle:{bar:12,note:1,pitch:"Bb4",answer:"bar-12-bb"},barlines:{afterBars:[9,10],answer:"after-bar-9,after-bar-10"},finalBarline:"double",layout:{"height":1040,"groups":[[0,1],[2,3,4],[5,6,7],[8,9,10],[11,12,13,14,15,16]],"systemTops":[110,365,540,720,900],"bounds":[[283.3,578.2,870],[110.7,374.4,593.6,870],[110.7,383.2,634.5,870],[110.7,358.1,622.2,870],[110.7,274.9,385.4,470.8,557.9,723.4,870]],"noteXs":[[303.1,358.1,395.5,438.2,483.5,510,545.2],[598,650.8,688.2,730.9,774.9,800.9,837.9],[120.4,171,208.5,253.3,293,322.9,358.1],[395.5,446.1,494.6,525.4,569.4],[613.4,666.2,703.6,736.6,780.6,807.1,844.5],[120.4,174.1,208.5,254.2,294.3,325.1,358.1],[402.1,454.9,512.2,547.4,572.9,609],[653,705.8,758.6,796.1,842.3],[118.2,164.4,208.5,242.3,275.4,303.1,338.3],[371.3,413.1,459.3,497.2,532,569.4,600.2],[635.4,670.6,712.4,749.8,785.1,820.3,855.5],[123.9,157.8,197.9,233.5,256],[291.2,322.9],[428.5],[516.6],[573.8,613.4,649.5,679.4,705.8],[738.8,771.8,807.1]],"keySignatureXOffset":-22,"lyricOffset":94,"introBox":{"x":124,"y":15,"width":159,"height":280,"bassTop":213,"noteXs":[142,178,215,252]},"missingBox":{"topOffset":85,"bottomOffset":68},"barlineBox":{"x":111,"topOffset":55,"right":863,"height":125}}},
    q5:{key:"D major",timeSignature:"3/4",pickup:q5Pickup,bars:q5Bars,chord:{bar:6,answer:"Diminished 7th"},interval:{bar:10,lower:"A4",upper:"F#5",answer:"Major 6th"},finalBarline:"double",layout:{"height":900,"groups":[[0,1,2,3],[4,5,6],[7,8,9,10]],"systemTops":[100,375,655],"keySignatureXOffset":-20,"timeSignatureXOffset":26,"bounds":[[211.7,409.1,584.5,759.9,870],[122.6,305.4,573.1,870],[122.6,314.5,515.5,716.5,870]],"pickupBounds":[155,211.7],"pickupXs":[170.1],"noteXs":[{"upper":[259.7,308.6,362.5],"lower":[259.7,308.6,362.5]},{"upper":[431.9,484.4,537.4],"lower":[431.9,484.4,537.4]},{"upper":[606,664.9,711],"lower":[606,664.9,711]},{"upper":[780,836.7],"lower":[780,836.7]},{"upper":[131.8,221.3],"lower":[131.8,221.3]},{"upper":[340.1,425.5],"lower":[340.1,425.5]},{"upper":[594.1,785],"lower":[594.1,785]},{"upper":[131.8,201.2,263.3],"lower":[131.8,201.2,263.3]},{"upper":[328.2,396.7,465.3],"lower":[328.2,396.7,465.3]},{"upper":[542,659.4],"lower":[542,659.4]},{"upper":[733.9],"lower":[733.9]}],"overlayXs":{"6":[594.1,691.4,785],"9":[542,604.6,659.4]},"chordBox":{"left":314.5,"right":398.1,"topOffset":58,"bottomOffset":67},"intervalBox":{"left":528.8,"right":643,"topOffset":65,"height":130}}},
  };
  if(typeof module!=="undefined"&&module.exports)module.exports=data;
  root.AdvancedHigher2025Notation=data;
})(typeof window!=="undefined"?window:globalThis);
