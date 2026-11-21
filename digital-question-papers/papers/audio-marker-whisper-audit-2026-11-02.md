# Digital Question Papers audio-marker Whisper audit — 2 November 2026

## Scope and method

- Audited all 30 registered papers, covering 223 question-audio tracks and 892 stored section markers (28.61 hours of question audio).
- Ran a focused `tiny.en` Whisper window around every marker, then re-ran every non-immediate match with `small.en`.
- Used `base.en` long-context windows to resolve repeated excerpt announcements and markers that had landed inside music.
- Matched the spoken cue semantically (part letter, replay ordinal, excerpt number or Column C instruction), then checked the local waveform boundary.
- Retained the National 5 2014 convention of placing the marker approximately 0.15 seconds before the confirmed spoken cue.
- Rejected recognition-only discrepancies such as spoken “C” transcribed as “see”; only source-backed cue shifts are listed below.
- Result: 83 corrected markers across 24 papers.

## Papers requiring no timing changes

`higher-2015`, `higher-2017`, `higher-2019`, `higher-2025`, `national5-2022`, `national5-2023`.

## Corrected marker inventory

### advanced-higher-2016
- q2 `(c)`: 267.36s → 265.97s
- q4 `(b)`: 119.00s → 117.89s

### advanced-higher-2017
- q2 `(b)`: 209.80s → 208.87s
- q2 `(d)`: 342.70s → 340.53s
- q3 `(c)`: 364.54s → 365.46s

### advanced-higher-2018
- q5 `(d)`: 441.80s → 441.01s
- q5 `(e)`: 510.39s → 516.86s

### advanced-higher-2019
- q1 `(c)`: 292.07s → 296.88s
- q6 `2`: 468.74s → 438.03s

### advanced-higher-2022
- q1 `(b)`: 150.29s → 190.20s
- q3 `(c)`: 300.62s → 330.55s
- q3 `(d)`: 386.03s → 396.20s
- q5 `(b)`: 187.02s → 227.65s
- q6 `(b)`: 766.83s → 792.78s

### advanced-higher-2023
- q1 `(c)`: 305.94s → 302.79s
- q3 `(c)`: 338.34s → 369.21s
- q5 `(e)`: 455.11s → 461.18s
- q6 `1`: 307.85s → 322.56s

### advanced-higher-2024
- q1 `(c)`: 307.44s → 306.11s
- q2 `(b)`: 167.58s → 197.83s
- q2 `(c)`: 344.68s → 357.45s
- q3 `(b)`: 49.60s → 54.01s
- q3 `(d)`: 369.48s → 399.63s
- q5 `(b)`: 210.46s → 209.63s
- q5 `(d)`: 327.36s → 331.75s
- q6 `2`: 405.94s → 415.71s
- q6 `1`: 1083.05s → 1097.94s

### advanced-higher-2025
- q1 `(b)`: 227.72s → 268.25s
- q5 `(b)`: 200.58s → 241.15s
- q5 `(c)`: 283.26s → 287.93s
- q6 `1`: 358.87s → 354.00s
- q6 `2`: 1383.24s → 1393.21s

### advanced-higher-2026
- q2 `(c)`: 497.92s → 517.21s
- q3 `(d)`: 174.95s → 184.46s
- q4 `Guide`: 0.29s → 6.69s
- q6 `2`: 207.55s → 203.18s
- q6 `2`: 475.60s → 485.43s
- q6 `(b)`: 842.75s → 868.64s
- q6 `1`: 1201.88s → 1216.41s
- q6 `2`: 1361.41s → 1356.70s

### higher-2016
- q5 `(b)`: 316.06s → 314.83s

### higher-2018
- q1 `(a) 2nd`: 108.78s → 109.59s
- q3 `3rd`: 335.22s → 336.67s
- q3 `4th`: 437.18s → 438.25s
- q4 `3rd`: 204.44s → 209.15s
- q6 `(a) 2nd`: 53.92s → 55.23s
- q7 `E2 3rd`: 556.40s → 557.35s

### higher-2022
- q5 `(b)`: 231.14s → 222.61s

### higher-2023
- q3 `(a) 2nd`: 33.42s → 29.75s
- q3 `(b)`: 61.20s → 70.33s

### higher-2024
- q4 `4th`: 384.00s → 391.15s
- q5 `(a) 3rd`: 208.44s → 218.19s
- q5 `(c) 2nd`: 434.40s → 435.85s
- q6 `2nd`: 87.04s → 98.43s
- q6 `3rd`: 147.04s → 148.83s
- q7 `E1 1st`: 116.88s → 118.99s
- q7 `E2 1st`: 206.88s → 210.81s
- q7 `E2 2nd`: 356.88s → 379.25s
- q7 `E1 3rd`: 436.64s → 457.21s
- q7 `E2 3rd`: 543.84s → 544.95s

### higher-2026
- q3 `(a) 2nd`: 41.80s → 47.17s
- q3 `(b)`: 66.70s → 76.27s
- q4 `3rd`: 279.49s → 310.08s
- q7 `E1 2nd`: 257.31s → 267.32s
- q7 `Column C`: 535.09s → 536.26s

### national5-2014
- q4 `(e)`: 220.46s → 222.35s

### national5-2015
- q3 `1st`: 66.70s → 67.47s
- q4 `(e)`: 198.06s → 199.95s

### national5-2016
- q4 `(b)`: 48.70s → 47.63s
- q5 `3rd`: 200.14s → 212.03s

### national5-2017
- q1 `(f)`: 291.02s → 298.15s
- q4 `(f)`: 241.20s → 246.25s
- q5 `3rd`: 289.81s → 291.34s

### national5-2018
- q1 `(e)`: 319.72s → 321.87s
- q4 `(d)`: 189.04s → 194.01s
- q6 `1st`: 64.16s → 65.33s

### national5-2019
- q1 `(c)`: 113.00s → 114.49s
- q4 `(c)`: 84.78s → 88.79s

### national5-2024
- q1 `(f)`: 310.68s → 324.49s

### national5-2025
- q1 `(d)`: 178.40s → 192.61s
- q4 `(f)`: 306.66s → 312.45s
- q7 `(b)`: 86.70s → 87.83s

### national5-2026
- q1 `(e)`: 194.84s → 199.70s

## Regression requirements

- Exact marker arrays in the per-paper tests were updated with the corrected values.
- Every marker remains chronological and within its measured local audio duration.
- Re-run the complete Digital Question Papers test suite after any future marker edit.
