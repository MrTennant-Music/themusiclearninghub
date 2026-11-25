(() => {
// Use the same shared Bravura symbol catalogue and notation calibration as
// Practice Questions. Fallback values keep the game readable if that file has
// not loaded yet.
const SHARED_BRAVURA_SYMBOLS = window.BRAVURA_SYMBOLS ?? {};
const SHARED_NOTATION = window.SHARED_NOTATION_CONFIG ?? { drawing: {}, symbols: {} };
const bravuraSymbol = (key, fallback) => SHARED_BRAVURA_SYMBOLS[key] || fallback;
const GLYPHS = {
  trebleClef: bravuraSymbol("gClef", "\uE050"),
  quarterNote: bravuraSymbol("quarterNoteStemUp", "\uE1D5"),
  eighthNote: bravuraSymbol("eighthNoteStemUp", "\uE1D7"),
  sixteenthNote: bravuraSymbol("sixteenthNoteStemUp", "\uE1D9"),
  halfNote: bravuraSymbol("halfNoteStemUp", "\uE1D3"),
  wholeNote: bravuraSymbol("wholeNote", "\uE1D2"),
  dottedQuarterNote: `${bravuraSymbol("quarterNoteStemUp", "\uE1D5")}${bravuraSymbol("augmentationDot", "\uE1E7")}`,
  dottedEighthNote: `${bravuraSymbol("eighthNoteStemUp", "\uE1D7")}${bravuraSymbol("augmentationDot", "\uE1E7")}`,
  dottedHalfNote: `${bravuraSymbol("halfNoteStemUp", "\uE1D3")}${bravuraSymbol("augmentationDot", "\uE1E7")}`,
  dynamicForte: bravuraSymbol("forte", "\uE522"),
  dynamicPiano: bravuraSymbol("piano", "\uE520"),
  crescendo: bravuraSymbol("crescendo", "\uE53E"),
  diminuendo: bravuraSymbol("diminuendo", "\uE53F"),
  barlineFinal: bravuraSymbol("barlineFinal", "\uE032"),
  repeatRight: bravuraSymbol("repeatRight", "\uE041"),
};
const TIME_DIGITS = ["\uE080", bravuraSymbol("timeSig1", "\uE081"), bravuraSymbol("timeSig2", "\uE082"), bravuraSymbol("timeSig3", "\uE083"), bravuraSymbol("timeSig4", "\uE084"), bravuraSymbol("timeSig5", "\uE085"), bravuraSymbol("timeSig6", "\uE086"), "\uE087", bravuraSymbol("timeSig8", "\uE088"), bravuraSymbol("timeSig9", "\uE089")];
const PITCH_INDEX = { C4: 0, D4: 1, E4: 2, F4: 3, G4: 4, A4: 5, B4: 6, C5: 7, D5: 8, E5: 9, F5: 10, G5: 11, A5: 12, B5: 13, C6: 14 };
const BASS_PITCH_INDEX = { C2: -2, D2: -1, E2: 0, F2: 1, G2: 2, A2: 3, B2: 4, C3: 5, D3: 6, E3: 7, F3: 8, G3: 9, A3: 10, B3: 11, C4: 12, D4: 13, E4: 14 };
const NOTATION_FALLBACKS = { gClef: "\uE050", fClef: "\uE062", brace: "\uE000", segno: "\uE047", tie: "\uE1FD", ottavaAlta: "\uE511", ottavaBassa: "\uE51C", noteheadBlack: "\uE0A4", quarterNoteStemUp: "\uE1D5", quarterNoteStemDown: "\uE1D6", eighthNoteStemUp: "\uE1D7", eighthNoteStemDown: "\uE1D8", sixteenthNoteStemUp: "\uE1D9", halfNoteStemUp: "\uE1D3", halfNoteStemDown: "\uE1D4", wholeNote: "\uE1D2", augmentationDot: "\uE1E7", augmentationDotLine: "\uE1E7", accentAbove: "\uE4A0", staccatoAbove: "\uE4A2", wholeRest: "\uE4E3", halfRest: "\uE4E4", quarterRest: "\uE4E5", eighthRest: "\uE4E6", sharpInScore: "\uE262", flatInScore: "\uE260", naturalInScore: "\uE261", sharpKeySignature: "\uE262", flatKeySignature: "\uE260" };
const NOTE_STEM_DOWN_STEP_THRESHOLD = 4;
const NOTE_STEM_STEP_OFFSET = 2;
const WHAT_NOTE_STAFF_GAP = 18.9;

// Complete-bar time-signature questions use the same measurements and drawing
// rules as timesignatures.html. The SVG below is simply cropped after bar 1; the
// underlying stave continues briefly so it can fade naturally after the
// barline instead of ending abruptly.
const TIMESIG_PREVIEW = {
  staffLeft: 24,
  staffRight: 896,
  systemTop: 62,
  lineGap: 10,
  noteRx: 6.3,
  stemLength: 32,
  clefX: 32,
  firstBarStart: 117.44,
  firstBarEnd: 348.5,
};

const TIMESIG_RHYTHM_INFO = {
  semibreve: { beats:4, spacing: 8, stem: false, dots: 0 },
  "dotted-minim": { beats:3, spacing: 6, stem: true, dots: 1 },
  minim: { beats:2, spacing: 4, stem: true, dots: 0 },
  crotchet: { beats:1, spacing: 2.2, stem: true, dots: 0 },
  "dotted-crotchet": { beats:1.5, spacing: 3.1, stem: true, dots: 1 },
  "dotted-quaver": { beats:.75, spacing: 1.65, stem: true, dots: 1, beams: 1 },
  quaver: { beats:.5, spacing: 1.15, stem: true, dots: 0, beams: 1 },
  semiquaver: { beats:.25, spacing: .72, stem: true, dots: 0, beams: 2 },
};

const TIMESIG_GLYPH_RHYTHMS = {
  quarterNote: ["crotchet"],
  eighthNote: ["quaver"],
  sixteenthNote: ["semiquaver"],
  halfNote: ["minim"],
  dottedHalfNote: ["dotted-minim"],
  wholeNote: ["semibreve"],
  dottedQuarterNote: ["dotted-crotchet"],
  dottedEighthNote: ["dotted-quaver"],
  dottedQuaverSemiquaver: ["dotted-quaver", "semiquaver"],
  scotchSnap: ["semiquaver", "dotted-quaver"],
  pairedEighthNotes: ["quaver", "quaver"],
  fourSixteenthNotes: ["semiquaver", "semiquaver", "semiquaver", "semiquaver"],
  quaverTwoSemiquavers: ["quaver", "semiquaver", "semiquaver"],
  twoSemiquaversQuaver: ["semiquaver", "semiquaver", "quaver"],
  semiquaverQuaverSemiquaver: ["semiquaver", "quaver", "semiquaver"],
};

const N5_SIMPLE_TIME_PATTERNS = {
  "2/4": [
    ["minim"], ["crotchet", "crotchet"], ["quaver", "quaver", "crotchet"],
    ["crotchet", "quaver", "quaver"], ["quaver", "quaver", "quaver", "quaver"],
    ["dotted-crotchet", "quaver"], ["quaver", "dotted-crotchet"],
    ["semiquaver-group-4", "crotchet"], ["quaver-2semiquavers", "crotchet"],
    ["2semiquavers-quaver", "crotchet"], ["dotted-quaver-semiquaver", "crotchet"],
  ],
  "3/4": [
    ["dotted-minim"], ["minim", "crotchet"], ["crotchet", "minim"],
    ["crotchet", "crotchet", "crotchet"], ["quaver", "quaver", "crotchet", "crotchet"],
    ["crotchet", "quaver", "quaver", "crotchet"], ["crotchet", "crotchet", "quaver", "quaver"],
    ["quaver", "quaver", "quaver", "quaver", "crotchet"], ["crotchet", "quaver", "quaver", "quaver", "quaver"],
    ["semiquaver-group-4", "crotchet", "crotchet"], ["crotchet", "quaver-2semiquavers", "crotchet"],
    ["crotchet", "crotchet", "2semiquavers-quaver"], ["dotted-quaver-semiquaver", "crotchet", "crotchet"],
  ],
  "4/4": [
    ["minim", "minim"], ["minim", "crotchet", "crotchet"], ["crotchet", "crotchet", "minim"],
    ["crotchet", "crotchet", "crotchet", "crotchet"], ["quaver", "quaver", "crotchet", "crotchet", "crotchet"],
    ["crotchet", "quaver", "quaver", "crotchet", "crotchet"], ["crotchet", "crotchet", "quaver", "quaver", "crotchet"],
    ["crotchet", "crotchet", "crotchet", "quaver", "quaver"], ["quaver", "quaver", "quaver", "quaver", "minim"],
    ["minim", "quaver", "quaver", "quaver", "quaver"], ["quaver", "quaver", "quaver", "quaver", "quaver", "quaver", "quaver", "quaver"],
    ["semiquaver-group-4", "crotchet", "crotchet", "crotchet"], ["crotchet", "quaver-2semiquavers", "crotchet", "crotchet"],
    ["crotchet", "crotchet", "2semiquavers-quaver", "crotchet"], ["crotchet", "crotchet", "crotchet", "dotted-quaver-semiquaver"],
  ],
};

const TIMESIG_RHYTHM_TOKENS = {
  crotchet: ["crotchet"], minim: ["minim"], "dotted-minim": ["dotted-minim"], semibreve: ["semibreve"],
  quaver: ["quaver"], semiquaver: ["semiquaver"], "dotted-crotchet": ["dotted-crotchet"],
  "semiquaver-group-4": ["semiquaver", "semiquaver", "semiquaver", "semiquaver"],
  "quaver-2semiquavers": ["quaver", "semiquaver", "semiquaver"],
  "2semiquavers-quaver": ["semiquaver", "semiquaver", "quaver"],
  "dotted-quaver-semiquaver": ["dotted-quaver", "semiquaver"],
  "dotted-quaver-semiquaver-quaver": ["dotted-quaver", "semiquaver", "quaver"],
  "quaver-2semiquavers-quaver": ["quaver", "semiquaver", "semiquaver", "quaver"],
  "quaver-group-3": ["quaver", "quaver", "quaver"],
  "crotchet-quaver": ["crotchet", "quaver"],
  "quaver-crotchet": ["quaver", "crotchet"],
};

function timeSigRhythmInfo(rhythm) {
  return TIMESIG_RHYTHM_INFO[rhythm] || TIMESIG_RHYTHM_INFO.crotchet;
}

function timeSigYForStep(step) {
  return TIMESIG_PREVIEW.systemTop + TIMESIG_PREVIEW.lineGap * 4 - step * (TIMESIG_PREVIEW.lineGap / 2);
}

function timeSigStemGoesDown(step) {
  return step > 4;
}

function TimeSigCalibratedSymbol({ symbolKey, x, y }) {
  const actualSymbolKey = actualBravuraSymbolKey(symbolKey);
  const configuredSymbolKey = SHARED_NOTATION.symbols?.[symbolKey] ? symbolKey : actualSymbolKey;
  const settings = sharedNotationSymbol(configuredSymbolKey);
  const gap = TIMESIG_PREVIEW.lineGap;
  const adjustedX = x + gap * Number(settings.xOffsetScale || 0) + Number(settings.opticalXOffset || 0);
  const adjustedY = y + gap * Number(settings.yOffsetScale || 0) + Number(settings.opticalYOffset || 0);
  const transform = `translate(${adjustedX} ${adjustedY}) scale(${settings.widthScale || 1} ${settings.heightScale || 1}) translate(${-adjustedX} ${-adjustedY})`;
  return <text className="millionaire-music-symbol" x={adjustedX} y={adjustedY} fontSize={gap * Number(settings.fontSizeScale || 3.4)} textAnchor="middle" transform={transform}>{bravuraSymbol(actualSymbolKey, NOTATION_FALLBACKS[actualSymbolKey] || "?")}</text>;
}

function timeSigStemData(item, x, stemDownOverride = null) {
  const y = timeSigYForStep(item.pitch.step);
  const stemDown = stemDownOverride ?? timeSigStemGoesDown(item.pitch.step);
  const stemX = stemDown ? x - TIMESIG_PREVIEW.noteRx : x + TIMESIG_PREVIEW.noteRx;
  const stemEndY = stemDown ? y + TIMESIG_PREVIEW.stemLength : y - TIMESIG_PREVIEW.stemLength;
  return { y, stemDown, stemX, stemEndY };
}

function timeSigNoteSymbolKey(rhythm, stemDown, beamed = false) {
  if (rhythm === "semibreve") return "wholeNote";
  if (rhythm === "minim" || rhythm === "dotted-minim") return stemDown ? "halfNoteStemDown" : "halfNoteStemUp";
  if (beamed) return stemDown ? "noteheadBlackStemDown" : "noteheadBlackStemUp";
  if (rhythm === "quaver" || rhythm === "dotted-quaver") return stemDown ? "eighthNoteStemDown" : "eighthNoteStemUp";
  if (rhythm === "semiquaver") return stemDown ? "sixteenthNoteStemDown" : "sixteenthNoteStemUp";
  return stemDown ? "quarterNoteStemDown" : "quarterNoteStemUp";
}

function TimeSigPreviewNote({ item, x, stemDownOverride = null, forcedStemEndY = null, showFlag = true }) {
  const info = timeSigRhythmInfo(item.rhythm);
  const stem = timeSigStemData(item, x, stemDownOverride);
  const stemEndY = forcedStemEndY ?? stem.stemEndY;
  const beamed = showFlag === false;
  const dotKey = Math.abs(item.pitch.step % 2) === 1 ? "augmentationDotSpace" : "augmentationDotLine";
  const dotY = Math.abs(item.pitch.step % 2) === 1 ? stem.y : stem.y - TIMESIG_PREVIEW.lineGap * .25;
  const stemThickness = Math.max(1, TIMESIG_PREVIEW.lineGap * Number(SHARED_NOTATION.drawing?.stemThicknessScale || .12));
  return <g>
    <TimeSigCalibratedSymbol symbolKey={timeSigNoteSymbolKey(item.rhythm, stem.stemDown, beamed)} x={x} y={stem.y} />
    {beamed && info.stem && <line x1={stem.stemX} x2={stem.stemX} y1={stem.y} y2={stemEndY} stroke="currentColor" strokeWidth={stemThickness} />}
    {info.dots === 1 && <TimeSigCalibratedSymbol symbolKey={dotKey} x={x + TIMESIG_PREVIEW.lineGap * 1.3} y={dotY} />}
  </g>;
}

function timeSigBarNotePositions(notes, groupAfterBeats = null) {
  const groupGap = Number.isFinite(groupAfterBeats) ? 18 : 0;
  const totalUnits = notes.reduce((total, note) => total + timeSigRhythmInfo(note.rhythm).spacing, 0);
  const unitWidth = Math.max(1, TIMESIG_PREVIEW.firstBarEnd - 6 - (TIMESIG_PREVIEW.firstBarStart + 7) - groupGap) / Math.max(1, totalUnits);
  let cursor = TIMESIG_PREVIEW.firstBarStart + 7 + unitWidth * .35;
  let elapsedBeats = 0;
  return notes.map((note, index) => {
    const x = cursor;
    elapsedBeats += Number(timeSigRhythmInfo(note.rhythm).beats || 0);
    cursor += timeSigRhythmInfo(note.rhythm).spacing * unitWidth;
    if (index < notes.length-1 && Number.isFinite(groupAfterBeats) && Math.abs(elapsedBeats-groupAfterBeats)<.001) cursor += groupGap;
    return x;
  });
}

function timeSigBeamLineYAtX(x, start, end) {
  if (start.x === end.x) return start.y;
  return start.y + ((x - start.x) / (end.x - start.x)) * (end.y - start.y);
}

function timeSigBeamData(items, positions) {
  const averageStep = items.reduce((sum, item) => sum + item.pitch.step, 0) / items.length;
  const stemDown = averageStep > 4 || (averageStep === 4 && items[0].pitch.step > 4);
  const anchorStep = stemDown ? Math.max(...items.map((item) => item.pitch.step)) : Math.min(...items.map((item) => item.pitch.step));
  const anchorIndex = items.findIndex((item) => item.pitch.step === anchorStep);
  const startStem = timeSigStemData(items[0], positions[0], stemDown);
  const endStem = timeSigStemData(items.at(-1), positions.at(-1), stemDown);
  const anchorStem = timeSigStemData(items[anchorIndex], positions[anchorIndex], stemDown);
  const totalSlope = Math.max(-8, Math.min(8, (items.at(-1).pitch.step - items[0].pitch.step) * -2));
  const slopePerX = totalSlope / Math.max(1, endStem.stemX - startStem.stemX);
  return {
    stemDown,
    start: { x: startStem.stemX, y: anchorStem.stemEndY - slopePerX * (anchorStem.stemX - startStem.stemX) },
    end: { x: endStem.stemX, y: anchorStem.stemEndY + slopePerX * (endStem.stemX - anchorStem.stemX) },
  };
}

function timeSigQuaverGroups(notes) {
  const groups = [];
  let index = 0;
  while (index < notes.length) {
    const note = notes[index];
    const beamable = ["quaver", "semiquaver", "dotted-quaver"].includes(note.rhythm);
    if (!beamable || note.beamGroupId === null) { index += 1; continue; }
    const runStart = index;
    const groupId = note.beamGroupId;
    if (groupId === undefined) {
      while (index < notes.length && ["quaver", "semiquaver", "dotted-quaver"].includes(notes[index].rhythm) && notes[index].beamGroupId === undefined) index += 1;
    } else {
      while (index < notes.length && ["quaver", "semiquaver", "dotted-quaver"].includes(notes[index].rhythm) && notes[index].beamGroupId === groupId) index += 1;
    }
    const runEnd = index - 1;
    if (groupId !== undefined) {
      if (runEnd > runStart) groups.push({ start: runStart, end: runEnd });
      continue;
    }
    let groupStart = runStart;
    while (groupStart <= runEnd) {
      const remaining = runEnd - groupStart + 1;
      const groupSize = remaining >= 4 ? 4 : remaining === 3 ? 2 : remaining;
      const groupEnd = groupStart + groupSize - 1;
      if (groupEnd > groupStart) groups.push({ start: groupStart, end: groupEnd });
      groupStart = groupEnd + 1;
    }
  }
  return groups;
}

function TimeSigPreviewBeam({ beamData, groupNotes, groupPositions }) {
  const secondarySegments = [];
  let segmentStart = null;
  groupNotes.forEach((note, index) => {
    const isSemiquaver = timeSigRhythmInfo(note.rhythm).beams === 2;
    const nextIsSemiquaver = timeSigRhythmInfo(groupNotes[index + 1]?.rhythm).beams === 2;
    if (isSemiquaver && segmentStart === null) segmentStart = index;
    if (segmentStart !== null && (!nextIsSemiquaver || index === groupNotes.length - 1)) {
      secondarySegments.push({ startIndex: segmentStart, endIndex: index, isHook: index === segmentStart });
      segmentStart = null;
    }
  });
  const stemXFor = (index) => groupPositions[index] + TIMESIG_PREVIEW.noteRx - 1;
  return <g>
    <line x1={beamData.start.x - .5} y1={beamData.start.y} x2={beamData.end.x + .5} y2={beamData.end.y} stroke="currentColor" strokeWidth="4" strokeLinecap="butt" />
    {secondarySegments.map((segment, index) => {
      const x1 = stemXFor(segment.startIndex) + 1;
      const y1 = timeSigBeamLineYAtX(x1, beamData.start, beamData.end) + 7;
      const x2 = segment.isHook ? x1 + (segment.startIndex > 0 ? -14 : 14) : stemXFor(segment.endIndex) + 1;
      const y2 = timeSigBeamLineYAtX(x2, beamData.start, beamData.end) + 7;
      return <line key={index} x1={x1 - .5} y1={y1} x2={x2} y2={y2} stroke="currentColor" strokeWidth="4" strokeLinecap="butt" />;
    })}
  </g>;
}

function normaliseFiveFourRhythmTokens(notation) {
  const tokens = Array.isArray(notation.rhythmTokens) ? notation.rhythmTokens : [];
  if (notation.timeSignature !== "5/4") return tokens;
  const signature = tokens.join("|");
  if (signature === "minim|minim|crotchet") return ["minim", "crotchet", "minim"];
  if (signature === "dotted-crotchet|quaver|dotted-minim") return ["dotted-crotchet", "quaver", "crotchet", "minim"];
  return tokens;
}

function timeSigPreviewNotes(notation) {
  const notes = [];
  let pitchIndex = 0;
  const usesRhythmTokens = Array.isArray(notation.rhythmTokens);
  const source = usesRhythmTokens ? normaliseFiveFourRhythmTokens(notation) : notation.glyphs || [];
  source.forEach((token, tokenIndex) => {
    const rhythms = usesRhythmTokens ? TIMESIG_RHYTHM_TOKENS[token] || ["crotchet"] : TIMESIG_GLYPH_RHYTHMS[token] || ["crotchet"];
    const isExplicitGroup = rhythms.length > 1 && rhythms.every((rhythm) => ["quaver", "dotted-quaver", "semiquaver"].includes(rhythm));
    const beamGroupId = isExplicitGroup ? `beam-${tokenIndex}` : usesRhythmTokens ? undefined : null;
    rhythms.forEach((rhythm) => {
      const step = [2, 3, 4, 3, 2, 1, 2, 0][pitchIndex % 8];
      notes.push({ rhythm, pitch: { step }, beamGroupId });
      pitchIndex += 1;
    });
  });
  return notes;
}

function TimeSigFirstBarNotation({ notation }) {
  const notes = timeSigPreviewNotes(notation);
  const groupAfterBeats = notation.timeSignature === "5/4" ? 3 : notation.groupAfterBeats;
  const positions = timeSigBarNotePositions(notes, groupAfterBeats);
  const groups = timeSigQuaverGroups(notes);
  const fadeStart = TIMESIG_PREVIEW.firstBarEnd + 1;
  return <svg className="millionaire-timesig-first-bar" viewBox="14 18 365 112" aria-hidden="true">
    <defs><linearGradient id="millionaire-timesig-bar-fade" x1={fadeStart} y1="0" x2="379" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#fff" stopOpacity="0" /><stop offset="100%" stopColor="#fff" stopOpacity="1" /></linearGradient></defs>
    <rect x="14" y="18" width="365" height="112" fill="#fff" />
    {Array.from({ length: 5 }, (_, index) => <line key={index} x1={TIMESIG_PREVIEW.staffLeft} x2={TIMESIG_PREVIEW.staffRight} y1={TIMESIG_PREVIEW.systemTop + index * TIMESIG_PREVIEW.lineGap} y2={TIMESIG_PREVIEW.systemTop + index * TIMESIG_PREVIEW.lineGap} stroke="currentColor" strokeWidth="1.2" />)}
    <TimeSigCalibratedSymbol symbolKey="gClef" x={TIMESIG_PREVIEW.clefX + TIMESIG_PREVIEW.lineGap * 2.3} y={timeSigYForStep(2)} />
    {notes.map((note, index) => {
      const group = groups.find((candidate) => index >= candidate.start && index <= candidate.end);
      if (!group) return <TimeSigPreviewNote key={index} item={note} x={positions[index]} />;
      const groupNotes = notes.slice(group.start, group.end + 1);
      const groupPositions = positions.slice(group.start, group.end + 1);
      const beamData = timeSigBeamData(groupNotes, groupPositions);
      const stem = timeSigStemData(note, positions[index], beamData.stemDown);
      return <TimeSigPreviewNote key={index} item={note} x={positions[index]} stemDownOverride={beamData.stemDown} forcedStemEndY={timeSigBeamLineYAtX(stem.stemX, beamData.start, beamData.end)} showFlag={false} />;
    })}
    {groups.map((group, index) => {
      const groupNotes = notes.slice(group.start, group.end + 1);
      const groupPositions = positions.slice(group.start, group.end + 1);
      return <TimeSigPreviewBeam key={index} beamData={timeSigBeamData(groupNotes, groupPositions)} groupNotes={groupNotes} groupPositions={groupPositions} />;
    })}
    <line x1={TIMESIG_PREVIEW.firstBarEnd} x2={TIMESIG_PREVIEW.firstBarEnd} y1={TIMESIG_PREVIEW.systemTop} y2={TIMESIG_PREVIEW.systemTop + TIMESIG_PREVIEW.lineGap * 4} stroke="currentColor" strokeWidth="1.4" />
    <rect x={fadeStart} y="18" width={379 - fadeStart} height="112" fill="url(#millionaire-timesig-bar-fade)" />
  </svg>;
}

const RESTS_PREVIEW = {
  systemTop: 150,
  lineGap: 10,
  noteRx: 6.3,
  stemLength: 32,
  staffStart: 154.8,
  clefX: 185.8,
  timeSignatureX: 260.8,
  barStart: 261.776,
  barEnd: 520,
};

const RESTS_PREVIEW_BEATS = {
  quarterNote: 1,
  eighthNote: .5,
  sixteenthNote: .25,
  halfNote: 2,
  dottedHalfNote: 3,
  wholeNote: 4,
  dottedQuarterNote: 1.5,
  dottedEighthNote: .75,
  dottedQuaverSemiquaver: 1,
  scotchSnap: 1,
  pairedEighthNotes: 1,
  fourSixteenthNotes: 1,
  quaverTwoSemiquavers: 1,
  twoSemiquaversQuaver: 1,
  semiquaverQuaverSemiquaver: 1,
};

function restsYForStep(step) {
  return RESTS_PREVIEW.systemTop + RESTS_PREVIEW.lineGap * 4 - step * (RESTS_PREVIEW.lineGap / 2);
}

function restsMissingRhythm(notation) {
  const shownBeats = (notation.glyphs || []).reduce((total, glyph) => total + (glyph === "blank" ? 0 : Number(RESTS_PREVIEW_BEATS[glyph] || 0)), 0);
  const missingBeats = Math.max(.25, Number(notation.time?.[0] || 4) - shownBeats);
  if (missingBeats >= 4) return "wholeNote";
  if (missingBeats >= 3) return "dottedHalfNote";
  if (missingBeats >= 2) return "halfNote";
  if (missingBeats >= 1) return "quarterNote";
  if (missingBeats >= .5) return "eighthNote";
  return "sixteenthNote";
}

function restsPreviewItems(notation) {
  const items = [];
  let pitchIndex = 0;
  (notation.glyphs || []).forEach((glyph, glyphIndex) => {
    if (glyph === "blank") {
      const missingGlyph = restsMissingRhythm(notation);
      items.push({ rhythm: "missing", units: Number(RESTS_PREVIEW_BEATS[missingGlyph] || 1) * 4, missingGlyph });
      return;
    }
    const rhythms = TIMESIG_GLYPH_RHYTHMS[glyph] || ["crotchet"];
    const beamGroupId = rhythms.length > 1 && rhythms.every((rhythm) => ["quaver", "dotted-quaver", "semiquaver"].includes(rhythm)) ? `rests-beam-${glyphIndex}` : null;
    rhythms.forEach((rhythm) => {
      const step = [2, 3, 4, 3, 2, 1, 2, 0][pitchIndex % 8];
      items.push({ rhythm, pitch: { step }, beamGroupId });
      pitchIndex += 1;
    });
  });
  return items;
}

function restsItemSpacing(item) {
  if (item.rhythm === "missing") return Math.max(1.15, item.units / 2);
  return timeSigRhythmInfo(item.rhythm).spacing;
}

function restsBarNotePositions(items, groupAfterBeats = null) {
  const startX = RESTS_PREVIEW.barStart + 7;
  const endX = RESTS_PREVIEW.barEnd - 6;
  const groupGap = Number.isFinite(groupAfterBeats) ? 18 : 0;
  const totalSpacing = items.reduce((sum, item) => sum + restsItemSpacing(item), 0);
  const unitWidth = Math.max(1, endX - startX - groupGap) / Math.max(1, totalSpacing);
  let cursor = startX + unitWidth * .35;
  let elapsedBeats = 0;
  return items.map((item, index) => {
    const x = cursor;
    elapsedBeats += item.rhythm === "missing" ? Number(item.units || 0)/4 : Number(timeSigRhythmInfo(item.rhythm).beats || 0);
    cursor += restsItemSpacing(item) * unitWidth;
    if (index < items.length-1 && Number.isFinite(groupAfterBeats) && Math.abs(elapsedBeats-groupAfterBeats)<.001) cursor += groupGap;
    return x;
  });
}

function RestsPreviewTimeSignature({ time }) {
  const [top, bottom] = time;
  const symbolKey = `timeSig${top}${bottom}`;
  const settings = sharedNotationSymbol(symbolKey);
  const anchorY = restsYForStep(5.3);
  const adjustedX = RESTS_PREVIEW.timeSignatureX + RESTS_PREVIEW.lineGap * Number(settings.xOffsetScale || 0) + Number(settings.opticalXOffset || 0);
  const adjustedY = anchorY + RESTS_PREVIEW.lineGap * Number(settings.yOffsetScale || 0) + Number(settings.opticalYOffset || 0);
  const fontSize = RESTS_PREVIEW.lineGap * Number(settings.fontSizeScale || 3.5);
  const digitGlyphs = (value) => String(value).split("").map((digit) => bravuraSymbol(`timeSig${digit}`, TIME_DIGITS[digit])).join("");
  return <g className="millionaire-music-symbol" transform={`translate(${adjustedX} ${adjustedY}) scale(${settings.widthScale || 1} ${settings.heightScale || 1}) translate(${-adjustedX} ${-adjustedY})`}>
    <text x={adjustedX} y={adjustedY - fontSize * .14} fontSize={fontSize} textAnchor="middle">{digitGlyphs(top)}</text>
    <text x={adjustedX} y={adjustedY + fontSize * .43} fontSize={fontSize} textAnchor="middle">{digitGlyphs(bottom)}</text>
  </g>;
}

function restsStemData(item, x, stemDownOverride = null) {
  const y = restsYForStep(item.pitch.step);
  const stemDown = stemDownOverride ?? item.pitch.step > 4;
  const stemX = stemDown ? x - RESTS_PREVIEW.noteRx : x + RESTS_PREVIEW.noteRx;
  const stemEndY = stemDown ? y + RESTS_PREVIEW.stemLength : y - RESTS_PREVIEW.stemLength;
  return { y, stemDown, stemX, stemEndY };
}

function RestsPreviewNote({ item, x, stemDownOverride = null, forcedStemEndY = null, showFlag = true }) {
  const info = timeSigRhythmInfo(item.rhythm);
  const stem = restsStemData(item, x, stemDownOverride);
  const beamed = showFlag === false;
  const dotKey = Math.abs(item.pitch.step % 2) === 1 ? "augmentationDotSpace" : "augmentationDotLine";
  const dotY = Math.abs(item.pitch.step % 2) === 1 ? stem.y : stem.y - RESTS_PREVIEW.lineGap * .25;
  const stemThickness = Math.max(1, RESTS_PREVIEW.lineGap * Number(SHARED_NOTATION.drawing?.stemThicknessScale || .12));
  return <g>
    <TimeSigCalibratedSymbol symbolKey={timeSigNoteSymbolKey(item.rhythm, stem.stemDown, beamed)} x={x} y={stem.y} />
    {beamed && info.stem && <line x1={stem.stemX} x2={stem.stemX} y1={stem.y} y2={forcedStemEndY ?? stem.stemEndY} stroke="currentColor" strokeWidth={stemThickness} />}
    {info.dots === 1 && <TimeSigCalibratedSymbol symbolKey={dotKey} x={x + RESTS_PREVIEW.lineGap * 1.3} y={dotY} />}
  </g>;
}

function restsBeamData(items, positions) {
  const settings = sharedNotationSymbol("quaverBeam");
  const averageStep = items.reduce((sum, item) => sum + item.pitch.step, 0) / items.length;
  const stemDown = averageStep > 4;
  const xOffset = RESTS_PREVIEW.lineGap * Number(settings.xOffsetScale || 0) + Number(settings.opticalXOffset || 0);
  const yOffset = RESTS_PREVIEW.lineGap * Number(settings.yOffsetScale || 0) + Number(settings.opticalYOffset || 0);
  const stemLength = RESTS_PREVIEW.stemLength * Number(settings.heightScale || 1);
  const beamWidthAdjust = RESTS_PREVIEW.lineGap * Number(settings.widthScale || 1) - RESTS_PREVIEW.lineGap;
  const firstY = restsYForStep(items[0].pitch.step);
  const lastY = restsYForStep(items.at(-1).pitch.step);
  const firstStemX = positions[0] + xOffset + (stemDown ? -RESTS_PREVIEW.noteRx : RESTS_PREVIEW.noteRx);
  const lastStemX = positions.at(-1) + xOffset + (stemDown ? -RESTS_PREVIEW.noteRx : RESTS_PREVIEW.noteRx);
  return { stemDown, start: { x: firstStemX - beamWidthAdjust, y: firstY + yOffset + (stemDown ? stemLength : -stemLength) }, end: { x: lastStemX + beamWidthAdjust, y: lastY + yOffset + (stemDown ? stemLength : -stemLength) } };
}

function RestsPreviewBeam({ beamData, groupItems, groupPositions }) {
  const settings = sharedNotationSymbol("quaverBeam");
  const secondarySettings = sharedNotationSymbol("semiquaverBeam");
  const xOffset = RESTS_PREVIEW.lineGap * Number(settings.xOffsetScale || 0) + Number(settings.opticalXOffset || 0);
  const secondaryWidthAdjust = RESTS_PREVIEW.lineGap * Number(secondarySettings.widthScale || 1) - RESTS_PREVIEW.lineGap;
  const secondaryOffset = (beamData.stemDown ? -1 : 1) * RESTS_PREVIEW.lineGap * .72 * Number(secondarySettings.heightScale || 1);
  const thickness = Math.max(1, RESTS_PREVIEW.lineGap * Number(SHARED_NOTATION.drawing?.beamThicknessScale || .42) * Number(settings.fontSizeScale || 1));
  const polygon = (x1, y1, x2, y2) => {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const length = Math.hypot(dx, dy) || 1;
    const normalX = (-dy / length) * (thickness / 2);
    const normalY = (dx / length) * (thickness / 2);
    return `${x1 + normalX},${y1 + normalY} ${x2 + normalX},${y2 + normalY} ${x2 - normalX},${y2 - normalY} ${x1 - normalX},${y1 - normalY}`;
  };
  const segments = [];
  let start = null;
  groupItems.forEach((item, index) => {
    const isSemi = timeSigRhythmInfo(item.rhythm).beams === 2;
    const nextIsSemi = timeSigRhythmInfo(groupItems[index + 1]?.rhythm).beams === 2;
    if (isSemi && start === null) start = index;
    if (start !== null && (!nextIsSemi || index === groupItems.length - 1)) { segments.push({ startIndex: start, endIndex: index, hook: index === start }); start = null; }
  });
  const stemX = (index) => groupPositions[index] + xOffset + (beamData.stemDown ? -RESTS_PREVIEW.noteRx : RESTS_PREVIEW.noteRx);
  return <g>
    <polygon points={polygon(beamData.start.x, beamData.start.y, beamData.end.x, beamData.end.y)} fill="currentColor" />
    {segments.map((segment, index) => {
      const x1 = stemX(segment.startIndex) - secondaryWidthAdjust;
      const y1 = timeSigBeamLineYAtX(x1, beamData.start, beamData.end) + secondaryOffset;
      const x2 = segment.hook ? x1 + (segment.startIndex > 0 ? -14 : 14) : stemX(segment.endIndex) + secondaryWidthAdjust;
      const y2 = timeSigBeamLineYAtX(x2, beamData.start, beamData.end) + secondaryOffset;
      return <polygon key={index} points={polygon(x1, y1, x2, y2)} fill="currentColor" />;
    })}
  </g>;
}

function RestsFirstBarNotation({ notation, selectedRhythm = null }) {
  const items = restsPreviewItems(notation);
  const positions = restsBarNotePositions(items, notation.groupAfterBeats);
  const groups = timeSigQuaverGroups(items);
  const fadeStart = RESTS_PREVIEW.barEnd + 1;
  return <svg className="millionaire-rests-first-bar" viewBox="135 94 415 116" aria-hidden="true">
    <defs><linearGradient id="millionaire-rests-bar-fade" x1={fadeStart} y1="0" x2="550" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="#fff" stopOpacity="0" /><stop offset="100%" stopColor="#fff" stopOpacity="1" /></linearGradient></defs>
    <rect x="135" y="94" width="415" height="116" fill="#fff" />
    {Array.from({ length: 5 }, (_, index) => <line key={index} x1={RESTS_PREVIEW.staffStart} x2="550" y1={RESTS_PREVIEW.systemTop + index * RESTS_PREVIEW.lineGap} y2={RESTS_PREVIEW.systemTop + index * RESTS_PREVIEW.lineGap} stroke="currentColor" strokeWidth="1.2" />)}
    <TimeSigCalibratedSymbol symbolKey="gClef" x={RESTS_PREVIEW.clefX} y={restsYForStep(2)} />
    <RestsPreviewTimeSignature time={notation.time} />
    {items.map((item, index) => {
      if (item.rhythm === "missing") {
        const outlineWidth = Math.max(40, Math.min(58, item.units * 8));
        const selectedItem = selectedRhythm ? { rhythm: selectedRhythm === "dottedHalfNote" ? "dotted-minim" : selectedRhythm === "wholeNote" ? "semibreve" : selectedRhythm === "halfNote" ? "minim" : selectedRhythm === "eighthNote" ? "quaver" : selectedRhythm === "sixteenthNote" ? "semiquaver" : "crotchet", pitch: { step: 3 } } : null;
        return <g key={index}>
          <rect x={positions[index] - outlineWidth / 2 + 4} y={RESTS_PREVIEW.systemTop - 9} width={outlineWidth} height={RESTS_PREVIEW.lineGap * 4 + 17} rx="7" ry="7" fill="none" stroke="#78716c" strokeWidth="1.6" />
          {selectedItem && <RestsPreviewNote item={selectedItem} x={positions[index]} />}
        </g>;
      }
      const group = groups.find((candidate) => index >= candidate.start && index <= candidate.end);
      if (!group) return <RestsPreviewNote key={index} item={item} x={positions[index]} />;
      const groupItems = items.slice(group.start, group.end + 1);
      const groupPositions = positions.slice(group.start, group.end + 1);
      const beamData = restsBeamData(groupItems, groupPositions);
      const stem = restsStemData(item, positions[index], beamData.stemDown);
      return <RestsPreviewNote key={index} item={item} x={positions[index]} stemDownOverride={beamData.stemDown} forcedStemEndY={timeSigBeamLineYAtX(stem.stemX, beamData.start, beamData.end)} showFlag={false} />;
    })}
    {groups.map((group, index) => {
      const groupItems = items.slice(group.start, group.end + 1);
      const groupPositions = positions.slice(group.start, group.end + 1);
      return <RestsPreviewBeam key={index} beamData={restsBeamData(groupItems, groupPositions)} groupItems={groupItems} groupPositions={groupPositions} />;
    })}
    <line x1={RESTS_PREVIEW.barEnd} x2={RESTS_PREVIEW.barEnd} y1={RESTS_PREVIEW.systemTop} y2={RESTS_PREVIEW.systemTop + RESTS_PREVIEW.lineGap * 4} stroke="currentColor" strokeWidth="1.4" />
    <rect x={fadeStart} y="94" width={550 - fadeStart} height="116" fill="url(#millionaire-rests-bar-fade)" />
  </svg>;
}

const HIGHER_REST_UNITS = { "quaver-rest": 2, "crotchet-rest": 4, "dotted-crotchet-rest": 6, "minim-rest": 8, "dotted-minim-rest": 12, "semibreve-rest": 16 };

// This is the same token expansion used by rests.html. Explicit token groups
// carry their own beam id; isolated quavers stay separate, which preserves
// the dotted-crotchet beat groupings in 6/8, 9/8 and 12/8.
function higherRestBarItems(notation) {
  const items = [];
  let pitchIndex = 0;
  let beamIndex = 0;
  const addTokens = (tokens) => (tokens || []).forEach((token) => {
    const rhythms = TIMESIG_RHYTHM_TOKENS[token] || [token];
    const explicitlyBeamed = ["quaver-group-2", "quaver-group-3", "semiquaver-group-4", "quaver-2semiquavers", "2semiquavers-quaver", "dotted-quaver-semiquaver"].includes(token);
    const beamGroupId = explicitlyBeamed && rhythms.length > 1 ? `higher-rest-beam-${beamIndex++}` : null;
    rhythms.forEach((rhythm) => {
      const step = [2, 3, 4, 3, 2, 1, 2, 0][pitchIndex % 8];
      items.push({ rhythm, pitch: { step }, beamGroupId });
      pitchIndex += 1;
    });
  });
  addTokens(notation.before);
  items.push({ rhythm: "missing", units: HIGHER_REST_UNITS[notation.missingRest] || 4 });
  addTokens(notation.after);
  return items;
}

function HigherRestBarNotation({ notation, selectedRest = null }) {
  const items = higherRestBarItems(notation);
  const positions = restsBarNotePositions(items, notation.groupAfterBeats);
  const groups = timeSigQuaverGroups(items);
  return <svg className="millionaire-higher-rest-bar" viewBox="135 94 415 116" aria-hidden="true">
    <rect x="135" y="94" width="415" height="116" fill="#fff" />
    {Array.from({ length: 5 }, (_, index) => <line key={index} x1={RESTS_PREVIEW.staffStart} x2="550" y1={RESTS_PREVIEW.systemTop + index * RESTS_PREVIEW.lineGap} y2={RESTS_PREVIEW.systemTop + index * RESTS_PREVIEW.lineGap} stroke="currentColor" strokeWidth="1.2" />)}
    <TimeSigCalibratedSymbol symbolKey="gClef" x={RESTS_PREVIEW.clefX} y={restsYForStep(2)} />
    <RestsPreviewTimeSignature time={notation.time} />
    {items.map((item, index) => {
      if (item.rhythm === "missing") {
        const width = Math.max(40, Math.min(58, item.units * 8));
        const missingTargetX = positions[index] + 10;
        return <g key={index}>
          <rect x={missingTargetX - width / 2} y={RESTS_PREVIEW.systemTop - 9} width={width} height={RESTS_PREVIEW.lineGap * 4 + 17} rx="7" ry="7" fill="none" stroke="#78716c" strokeWidth="1.6" />
          {selectedRest && <HigherRestMark rest={selectedRest} x={missingTargetX} y={restsYForStep(4)} gap={RESTS_PREVIEW.lineGap} />}
        </g>;
      }
      const group = groups.find((candidate) => index >= candidate.start && index <= candidate.end);
      if (!group) return <RestsPreviewNote key={index} item={item} x={positions[index]} />;
      const groupItems = items.slice(group.start, group.end + 1);
      const groupPositions = positions.slice(group.start, group.end + 1);
      const beamData = restsBeamData(groupItems, groupPositions);
      const stem = restsStemData(item, positions[index], beamData.stemDown);
      return <RestsPreviewNote key={index} item={item} x={positions[index]} stemDownOverride={beamData.stemDown} forcedStemEndY={timeSigBeamLineYAtX(stem.stemX, beamData.start, beamData.end)} showFlag={false} />;
    })}
    {groups.map((group, index) => {
      const groupItems = items.slice(group.start, group.end + 1);
      const groupPositions = positions.slice(group.start, group.end + 1);
      return <RestsPreviewBeam key={index} beamData={restsBeamData(groupItems, groupPositions)} groupItems={groupItems} groupPositions={groupPositions} />;
    })}
    <line x1={RESTS_PREVIEW.barEnd} x2={RESTS_PREVIEW.barEnd} y1={RESTS_PREVIEW.systemTop} y2={RESTS_PREVIEW.systemTop + RESTS_PREVIEW.lineGap * 4} stroke="currentColor" strokeWidth="1.4" />
  </svg>;
}

function sharedNotationSymbol(symbolKey) {
  const settings = SHARED_NOTATION.symbols?.[symbolKey] ?? {};
  return {
    fontSizeScale: Number(settings.fontSizeScale || 3.4),
    xOffsetScale: Number(settings.xOffsetScale || 0),
    yOffsetScale: Number(settings.yOffsetScale || 0),
    widthScale: Number(settings.widthScale || 1),
    heightScale: Number(settings.heightScale || 1),
    opticalXOffset: Number(settings.opticalXOffset || 0),
    opticalYOffset: Number(settings.opticalYOffset || 0),
  };
}

function actualBravuraSymbolKey(symbolKey) {
  if (symbolKey === "noteheadBlackStemUp" || symbolKey === "noteheadBlackStemDown") return "noteheadBlack";
  if (symbolKey === "augmentationDotLine" || symbolKey === "augmentationDotSpace") return "augmentationDot";
  return symbolKey;
}

function accidentalSymbolKey(accidental, context = "score") {
  if (context === "keySignature") return accidental === "sharp" ? "sharpKeySignature" : "flatKeySignature";
  if (accidental === "sharp") return "sharpInScore";
  if (accidental === "flat") return "flatInScore";
  return "naturalInScore";
}

// This is the same calibrated Bravura-symbol approach used by Practice
// Questions, kept small here because Millionaire only needs a single stave.
function CalibratedNotationSymbol({ symbolKey, x, y, gap, settingOverrides = {} }) {
  const settings = { ...sharedNotationSymbol(symbolKey), ...settingOverrides };
  const actualSymbolKey = actualBravuraSymbolKey(symbolKey);
  const adjustedX = x + gap * settings.xOffsetScale + settings.opticalXOffset;
  const adjustedY = y + gap * settings.yOffsetScale + settings.opticalYOffset;
  const transform = `translate(${adjustedX} ${adjustedY}) scale(${settings.widthScale} ${settings.heightScale}) translate(${-adjustedX} ${-adjustedY})`;
  return <text className="millionaire-music-symbol" x={adjustedX} y={adjustedY} fontSize={gap * settings.fontSizeScale} textAnchor="middle" transform={transform}>{bravuraSymbol(actualSymbolKey, NOTATION_FALLBACKS[actualSymbolKey] || "?")}</text>;
}

function StaffNotation({ notation, compactStave = false, whatNoteQuestion = false }) {
  const pitches = notation.kind === "note" ? [notation.pitch] : notation.pitches || [];
  const bassClef = notation.clef === "bass";
  const pitchIndex = bassClef ? BASS_PITCH_INDEX : PITCH_INDEX;
  const staffGap = whatNoteQuestion ? WHAT_NOTE_STAFF_GAP : Math.max(10, Number(SHARED_NOTATION.stave?.lineGap || 14));
  const accidentalXOffset = Number(notation.accidentalXOffset || 0);
  const clefXOffset = Number(notation.clefXOffset || 0);
  const noteXOffset = Number(notation.noteXOffset || 0);
  const staveInset = Math.max(0, Number(notation.staveInset || 0));
  const left = 52 + staveInset;
  const fullRight = 462 - staveInset;
  const compactSpanScale = 0.72;
  const right = compactStave ? left + (fullRight - left) * compactSpanScale : fullRight;
  const top = 36;
  const bottom = top + staffGap * 4;
  const fullLeft = left;
  const fullStartPositions = {
    1: whatNoteQuestion ? 258 : 280,
    2: 225,
    3: 174
  };
  const fullStart = whatNoteQuestion ? 258 : (fullStartPositions[pitches.length] || 174);
  const compactStart = fullLeft + (fullStart - fullLeft) * compactSpanScale;
  const noteStart = compactStave ? compactStart : fullStart;
  const fullSpacing = pitches.length > 1 ? Math.min(62, 196 / Math.max(1, pitches.length - 1)) : 0;
  const noteSpacing = compactStave ? fullSpacing * compactSpanScale : fullSpacing;
  const staffFadeId = notation.kind === "melody" ? "millionaire-melody-staff-line-fade" : "millionaire-staff-line-fade";
  const staffClassName = `millionaire-staff${Number(notation.notationZoom) === 1.15 ? " is-enharmonic-focus" : ""}`;
  return <svg className={staffClassName} viewBox="30 10 440 130" aria-hidden="true">
    <defs><linearGradient id={staffFadeId} x1={left} y1="0" x2={right} y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="currentColor" stopOpacity="1" /><stop offset="84%" stopColor="currentColor" stopOpacity="1" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
    {Array.from({ length: 5 }, (_, index) => <line key={index} className="millionaire-staff-line" x1={left} x2={right} y1={top + index * staffGap} y2={top + index * staffGap} style={{ stroke: `url(#${staffFadeId})` }} />)}
    {notation.showClef !== false && <CalibratedNotationSymbol symbolKey={bassClef ? "fClef" : "gClef"} x={94+clefXOffset} y={bassClef ? bottom - staffGap * 3 : bottom - staffGap} gap={staffGap} />}
    {pitches.map((pitch, index) => {
      const position = pitchIndex[pitch] ?? 4;
      const y = bottom - (position - 2) * staffGap / 2;
      const x = noteStart + noteXOffset + index * noteSpacing + (notation.kind === "melody" ? (index === 0 ? -40 : -15) : 0);
      const step = position - NOTE_STEM_STEP_OFFSET;
      const stemDown = step > NOTE_STEM_DOWN_STEP_THRESHOLD;
      const ledgerAccidentalXOffset = position <= 0 || position >= 12 ? -10 : 0;
      const ledgerPositions = [];
      if (position <= 0) for (let ledger = 0; ledger >= position; ledger -= 2) ledgerPositions.push(ledger);
      if (position >= 12) for (let ledger = 12; ledger <= position; ledger += 2) ledgerPositions.push(ledger);
      return <React.Fragment key={`${pitch}-${index}`}>
        {ledgerPositions.map((ledger) => {
          const ledgerY = bottom - (ledger - 2) * staffGap / 2;
          return <line key={ledger} className="millionaire-ledger" x1={x - staffGap * Number(SHARED_NOTATION.drawing?.ledgerLineWidthScale || 2.4) / 2} x2={x + staffGap * Number(SHARED_NOTATION.drawing?.ledgerLineWidthScale || 2.4) / 2} y1={ledgerY} y2={ledgerY} />;
        })}
        {(notation.accidentals?.[index] || (index === 0 ? notation.accidental : null)) && <CalibratedNotationSymbol symbolKey={accidentalSymbolKey(notation.accidentals?.[index] || notation.accidental)} x={x - staffGap * 1.65 + accidentalXOffset + ledgerAccidentalXOffset} y={y} gap={staffGap} settingOverrides={{ fontSizeScale: 3.05 }} />}
        <CalibratedNotationSymbol symbolKey={stemDown ? "quarterNoteStemDown" : "quarterNoteStemUp"} x={x} y={y} gap={staffGap} />
      </React.Fragment>;
    })}
  </svg>;
}

function SignatureMarks({ signature, top, bottom, gap, startX = 140, clef = "treble" }) {
  const signatureCount = {
    "G major": ["sharp", 1], "E minor": ["sharp", 1], "D major": ["sharp", 2],
    "F major": ["flat", 1], "D minor": ["flat", 1], "B flat major": ["flat", 2],
  }[signature];
  const positions = clef === "bass"
    ? { sharp: [8, 5, 9, 6, 10, 7, 11], flat: [4, 7, 3, 6, 2, 5, 1] }
    : { sharp: [10, 7, 11, 8, 12, 9, 13], flat: [6, 9, 5, 8, 4, 7, 3] };
  const marks = signatureCount ? positions[signatureCount[0]].slice(0, signatureCount[1]).map((position) => ({ accidental: signatureCount[0], position })) : [];
  return marks.map((mark, index) => {
    const y = bottom - (mark.position - 2) * gap / 2;
    return <CalibratedNotationSymbol key={`${mark.accidental}-${index}`} symbolKey={accidentalSymbolKey(mark.accidental, "keySignature")} x={startX + index * gap * 1.25} y={y} gap={gap} />;
  });
}

function KeySignatureNotation({ notation }) {
  const gap = 14;
  const top = 36;
  const bottom = top + gap * 4;
  return <svg className="millionaire-key-signature" viewBox="30 10 440 130" aria-hidden="true">
    <defs><linearGradient id="millionaire-key-signature-fade" x1="52" y1="0" x2="462" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="currentColor" /><stop offset="84%" stopColor="currentColor" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
    {Array.from({ length: 5 }, (_, index) => <line key={index} className="millionaire-staff-line" x1="52" x2="462" y1={top + index * gap} y2={top + index * gap} style={{ stroke: "url(#millionaire-key-signature-fade)" }} />)}
    <CalibratedNotationSymbol symbolKey="gClef" x={94} y={bottom - gap} gap={gap} />
    <SignatureMarks signature={notation.signature} top={top} bottom={bottom} gap={gap} startX={130} />
  </svg>;
}

function IntervalNotation({ notation }) {
  if (notation.matchStepLeapLayout) return <StaffNotation notation={{ ...notation, kind: "melody" }} whatNoteQuestion={true} />;
  const gap = 14;
  const top = 36;
  const bottom = top + gap * 4;
  const noteXOffset = Number(notation.noteXOffset || 0);
  const keySignatureXOffset = Number(notation.keySignatureXOffset || 0);
  const noteXs = [260 + noteXOffset, 345 + noteXOffset];
  return <svg className={`millionaire-interval${notation.toneSemitoneZoom ? " is-tone-semitone-interval" : ""}`} viewBox="30 10 440 130" aria-hidden="true">
    <defs><linearGradient id="millionaire-interval-fade" x1="52" y1="0" x2="462" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="currentColor" /><stop offset="84%" stopColor="currentColor" /><stop offset="100%" stopColor="currentColor" stopOpacity="0" /></linearGradient></defs>
    {Array.from({ length: 5 }, (_, index) => <line key={index} className="millionaire-staff-line" x1="52" x2="462" y1={top + index * gap} y2={top + index * gap} style={{ stroke: "url(#millionaire-interval-fade)" }} />)}
    <CalibratedNotationSymbol symbolKey="gClef" x={94} y={bottom - gap} gap={gap} />
    <SignatureMarks signature={notation.keySignature} top={top} bottom={bottom} gap={gap} startX={140 + keySignatureXOffset} />
    {(notation.pitches || []).slice(0, 2).map((pitch, index) => {
      const position = PITCH_INDEX[pitch] ?? 4;
      const y = bottom - (position - 2) * gap / 2;
      const stemDown = position - NOTE_STEM_STEP_OFFSET > NOTE_STEM_DOWN_STEP_THRESHOLD;
      return <React.Fragment key={`${pitch}-${index}`}>
        {notation.accidentals?.[index] && <CalibratedNotationSymbol symbolKey={accidentalSymbolKey(notation.accidentals[index])} x={noteXs[index] - gap * 1.7} y={y} gap={gap} settingOverrides={{ fontSizeScale: 3.05 }} />}
        <CalibratedNotationSymbol symbolKey={stemDown ? "quarterNoteStemDown" : "quarterNoteStemUp"} x={noteXs[index]} y={y} gap={gap} />
      </React.Fragment>;
    })}
  </svg>;
}

function AHIntervalNotation({ notation }) {
  // Directly match intervals.html at Advanced Higher: score size, stave,
  // responsive crop, note anchors, key signatures, ledger lines and stems.
  const width=920, height=420, left=222, right=684, top=132, gap=21;
  const bottom=top+gap*4;
  const noteXs=[392,536];
  const yForStep=(step)=>bottom-step*(gap/2);
  const signatureMarks={
    "D major":[["sharp",8],["sharp",5]],
    "F major":[["flat",4]],
    "B flat major":[["flat",4],["flat",7]],
  }[notation.keySignature]||[];
  const ledgerSettings=SHARED_NOTATION.symbols?.ledgerLines||{};
  const ledgerHalfWidth=gap*Number(SHARED_NOTATION.drawing?.ledgerLineWidthScale||2.4)*Number(ledgerSettings.widthScale||1)/2;
  const ledgerThickness=Math.max(1,gap*Number(SHARED_NOTATION.drawing?.ledgerLineThicknessScale||.11)*Number(ledgerSettings.heightScale||1));
  const ledgerXOffset=gap*Number(ledgerSettings.xOffsetScale||0)+Number(ledgerSettings.opticalXOffset||0);
  const ledgerYOffset=gap*Number(ledgerSettings.yOffsetScale||0)+Number(ledgerSettings.opticalYOffset||0);
  const ledgerSteps=(step)=>{const lines=[];if(step<=-2)for(let ledger=-2;ledger>=step;ledger-=2)lines.push(ledger);if(step>=10)for(let ledger=10;ledger<=step;ledger+=2)lines.push(ledger);return lines;};
  return <svg className="millionaire-ah-interval" viewBox={`195 96 ${width/1.806} ${height/1.806}`} aria-hidden="true">
    <defs><linearGradient id="millionaire-ah-interval-staff-fade" x1={left} y1="0" x2={right} y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="currentColor"/><stop offset="86%" stopColor="currentColor"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
    <rect width={width} height={height} fill="#fff"/>
    {Array.from({length:5},(_,index)=><line key={index} x1={left} x2={right} y1={top+index*gap} y2={top+index*gap} stroke="url(#millionaire-ah-interval-staff-fade)" strokeWidth="1.5"/>)}
    <CalibratedNotationSymbol symbolKey="gClef" x={left+gap*2.5} y={yForStep(2)} gap={gap}/>
    {signatureMarks.map(([accidental,step],index)=><CalibratedNotationSymbol key={`${accidental}-${step}`} symbolKey={accidentalSymbolKey(accidental,"keySignature")} x={left+92+index*30} y={yForStep(step)} gap={gap}/>)}
    {(notation.pitches||[]).slice(0,2).map((pitch,index)=>{const step=(PITCH_INDEX[pitch]??2)-2;const x=noteXs[index];const y=yForStep(step);return <React.Fragment key={`${pitch}-${index}`}>
      {ledgerSteps(step).map((ledger)=><line key={ledger} x1={x+ledgerXOffset-ledgerHalfWidth} x2={x+ledgerXOffset+ledgerHalfWidth} y1={yForStep(ledger)+ledgerYOffset} y2={yForStep(ledger)+ledgerYOffset} stroke="currentColor" strokeWidth={ledgerThickness}/>)}
      {notation.accidentals?.[index]&&<CalibratedNotationSymbol symbolKey={accidentalSymbolKey(notation.accidentals[index])} x={x-gap*2.1} y={y} gap={gap}/>}
      <CalibratedNotationSymbol symbolKey={step>4?"quarterNoteStemDown":"quarterNoteStemUp"} x={x} y={y} gap={gap}/>
    </React.Fragment>;})}
  </svg>;
}

function NavigationSymbolNotation({ notation }) {
  return <svg className="millionaire-navigation-symbol" viewBox="0 0 180 150" aria-hidden="true">
    <CalibratedNotationSymbol symbolKey={notation.symbol || "segno"} x={90} y={82} gap={24} settingOverrides={{ fontSizeScale: 3.2 }} />
  </svg>;
}

function TieCalloutNotation({ notation }) {
  const gap = 14, top = 42, bottom = top + gap * 4;
  const position = PITCH_INDEX[notation.pitch] ?? 4;
  const step = position - 2;
  const y = bottom - step * gap / 2;
  const ledgerConfig = SHARED_NOTATION.symbols?.ledgerLines || {};
  const ledgerHalfWidth = gap * Number(SHARED_NOTATION.drawing?.ledgerLineWidthScale || 2.4) / 2;
  const ledgerThickness = Math.max(1, gap * Number(SHARED_NOTATION.drawing?.ledgerLineThicknessScale || .11));
  const ledgerXOffset = gap * Number(ledgerConfig.xOffsetScale || 0);
  const ledgerYOffset = gap * Number(ledgerConfig.yOffsetScale || 0);
  const ledgerSteps = [];
  for (let ledgerStep = -2; ledgerStep >= step; ledgerStep -= 2) ledgerSteps.push(ledgerStep);
  for (let ledgerStep = 10; ledgerStep <= step; ledgerStep += 2) ledgerSteps.push(ledgerStep);
  const noteSymbol = notation.rhythm === "halfNote" ? "halfNoteStemUp" : notation.rhythm === "eighthNote" ? "eighthNoteStemUp" : "quarterNoteStemUp";
  const orange = "#f97316";
  const firstX = 230, secondX = 300;
  const leftX = firstX + gap * .08, rightX = secondX - gap * .08;
  const width = Math.max(gap * 1.4, rightX - leftX);
  const baseY = y + gap;
  const archDepth = Math.max(gap * .55, Math.min(gap * 1.45, width * .12));
  const thickness = Math.max(1.6, gap * .22);
  const outerY = baseY + archDepth, innerY = outerY - thickness;
  const arrowSize = 46;
  const arrowCentreX = (leftX + rightX) / 2;
  const arrowY = outerY + 7;
  const tiePath = `M ${leftX} ${baseY} C ${leftX + width * .22} ${outerY}, ${rightX - width * .22} ${outerY}, ${rightX} ${baseY} C ${rightX - width * .22} ${innerY}, ${leftX + width * .22} ${innerY}, ${leftX} ${baseY} Z`;
  return <svg className="millionaire-tie-callout" viewBox="20 8 440 150" aria-hidden="true">
    <defs><linearGradient id="millionaire-tie-staff-fade" x1="52" y1="0" x2="462" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="currentColor"/><stop offset="84%" stopColor="currentColor"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
    {Array.from({length:5},(_,index)=><line key={index} x1="52" x2="462" y1={top+index*gap} y2={top+index*gap} stroke="url(#millionaire-tie-staff-fade)" strokeWidth="1.4" vectorEffect="non-scaling-stroke" />)}
    <CalibratedNotationSymbol symbolKey="gClef" x={94} y={bottom-gap} gap={gap} />
    {[firstX,secondX].map((x)=><React.Fragment key={x}>
      {ledgerSteps.map((ledgerStep)=><line key={ledgerStep} x1={x+ledgerXOffset-ledgerHalfWidth} x2={x+ledgerXOffset+ledgerHalfWidth} y1={bottom-ledgerStep*gap/2+ledgerYOffset} y2={bottom-ledgerStep*gap/2+ledgerYOffset} stroke="currentColor" strokeWidth={ledgerThickness} vectorEffect="non-scaling-stroke" />)}
      <CalibratedNotationSymbol symbolKey={noteSymbol} x={x} y={y} gap={gap} />
    </React.Fragment>)}
    <path d={tiePath} fill={orange} transform="translate(0 1)" pointerEvents="none" />
    <image className="millionaire-tie-arrow" href="ui-icons/next.svg" x={arrowCentreX-arrowSize/2} y={arrowY} width={arrowSize} height={arrowSize} transform={`rotate(-90 ${arrowCentreX} ${arrowY+arrowSize/2})`} />
  </svg>;
}

const AH_RENDER_SIGNATURE_ACCIDENTALS = {
  "G major": { F:1 }, "E minor": { F:1 }, "D major": { F:1, C:1 },
  "F major": { B:-1 }, "D minor": { B:-1 }, "B flat major": { B:-1, E:-1 },
};

function ahSelectedBassNotation(answerText, keySignature) {
  const match = String(answerText || "").match(/^([A-G])(?: (sharp|flat))?$/);
  if (!match) return null;
  const letter = match[1];
  const selectedAccidental = match[2] === "sharp" ? 1 : match[2] === "flat" ? -1 : 0;
  const signatureAccidental = AH_RENDER_SIGNATURE_ACCIDENTALS[keySignature]?.[letter] || 0;
  const writtenAccidental = selectedAccidental === signatureAccidental ? null : selectedAccidental === 1 ? "sharp" : selectedAccidental === -1 ? "flat" : "natural";
  return { pitch:`${letter}${letter === "B" ? 2 : 3}`, accidental:writtenAccidental };
}

function AHGrandStaff({ notation, showTrebleChord = true, showBassNote = true, selectedBassNote = null }) {
  // Match the Advanced Higher inversion score in chords.html: the same score
  // proportions, grand-stave spacing, brace, clefs, key signatures and chord
  // stack. The Roman numeral is omitted because identifying it is the question.
  const width=920, height=430, gap=10, trebleTop=112, bassTop=220;
  const left=255, right=665, keyX=left+68, noteX=width/2;
  const fadeId=`millionaire-ah-staff-fade-${notation.keySignature.replace(/\W+/g,"-").toLowerCase()}-${showBassNote?"chord":"bass-prompt"}`;
  const pitchStep=(pitch,clef)=>((clef==="bass"?BASS_PITCH_INDEX:PITCH_INDEX)[pitch]??2)-2;
  const yFor=(pitch,clef,top)=>top+gap*4-pitchStep(pitch,clef)*gap/2;
  const renderAccidental=(accidental,y,key)=>(accidental?<CalibratedNotationSymbol key={key} symbolKey={accidentalSymbolKey(accidental)} x={noteX-gap*2.1} y={y} gap={gap}/>:null);
  const treblePitches=notation.treblePitches||[];
  const trebleStemDown=!treblePitches.some((pitch)=>pitchStep(pitch,"treble")<4);
  const selectedBass=ahSelectedBassNotation(selectedBassNote,notation.keySignature);
  const bassPitch=selectedBass?.pitch||notation.bassPitch;
  const bassAccidental=selectedBass?selectedBass.accidental:notation.bassAccidental;
  const braceSettings=sharedNotationSymbol("brace");
  return <svg className="millionaire-ah-grand-staff" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    <defs>
      <linearGradient id={fadeId} gradientUnits="userSpaceOnUse" x1={left} x2={right} y1="0" y2="0">
        <stop offset="0%" stopColor="currentColor" stopOpacity="1"/>
        <stop offset="84%" stopColor="currentColor" stopOpacity="1"/>
        <stop offset="100%" stopColor="currentColor" stopOpacity="0"/>
      </linearGradient>
    </defs>
    <rect width={width} height={height} fill="transparent"/>
    <g transform={`translate(${width/2} 202) scale(1.13) translate(${-width/2} -202)`}>
      {[trebleTop,bassTop].flatMap((top,staff)=>(Array.from({length:5},(_,index)=><line key={`${staff}-${index}`} x1={left} x2={right} y1={top+index*gap} y2={top+index*gap} stroke={`url(#${fadeId})`} strokeWidth="1.2"/>)))}
      <CalibratedNotationSymbol symbolKey="brace" x={left-18} y={trebleTop+gap*4+19} gap={gap} settingOverrides={{widthScale:braceSettings.widthScale*1.16,heightScale:braceSettings.heightScale*1.12}}/>
      <CalibratedNotationSymbol symbolKey="gClef" x={left+gap*3.2} y={trebleTop+gap*3} gap={gap}/>
      <CalibratedNotationSymbol symbolKey="fClef" x={left+gap*3.2} y={bassTop+gap} gap={gap}/>
      <SignatureMarks signature={notation.keySignature} top={trebleTop} bottom={trebleTop+gap*4} gap={gap} startX={keyX}/>
      <SignatureMarks signature={notation.keySignature} top={bassTop} bottom={bassTop+gap*4} gap={gap} startX={keyX} clef="bass"/>
      <line x1={left} x2={left} y1={trebleTop} y2={bassTop+gap*4} stroke="currentColor" strokeWidth="1.4"/>
      <React.Fragment>
        {showTrebleChord&&treblePitches.map((pitch,index)=>{const noteY=yFor(pitch,"treble",trebleTop);return <React.Fragment key={`${pitch}-${index}`}>{renderAccidental(notation.trebleAccidentals?.[index],noteY,`ta-${index}`)}<CalibratedNotationSymbol symbolKey={trebleStemDown?"quarterNoteStemDown":"quarterNoteStemUp"} x={noteX} y={noteY} gap={gap}/></React.Fragment>;})}
        {showBassNote&&bassPitch&&<React.Fragment>{renderAccidental(bassAccidental,yFor(bassPitch,"bass",bassTop),"ba")}<CalibratedNotationSymbol symbolKey="quarterNoteStemUp" x={noteX} y={yFor(bassPitch,"bass",bassTop)} gap={gap}/></React.Fragment>}
      </React.Fragment>
    </g>
  </svg>;
}

function AHChordNotation({notation}) { return <AHGrandStaff notation={notation}/>; }
function AHBassPromptNotation({notation,selectedBassNote}) { return <AHGrandStaff notation={notation} showBassNote={Boolean(selectedBassNote)} selectedBassNote={selectedBassNote}/>; }

function OctaveSignNotation({ notation }) {
  const symbolKey=notation.marking==="8vb"?"ottavaBassa":"ottavaAlta";
  return <svg className="millionaire-octave-sign" viewBox="0 0 240 140" aria-hidden="true">
    <CalibratedNotationSymbol symbolKey={symbolKey} x={120} y={86} gap={36}/>
  </svg>;
}

function RepeatEndingNotation({ notation }) {
  return <svg className="millionaire-repeat-ending" viewBox="0 0 110 70" aria-hidden="true">
    <g transform="translate(7 25)" stroke="currentColor" fill="none" strokeWidth="2.5" strokeLinecap="square">
      <path d="M 20 28 L 20 4 L 88 4" />
      <text x="29" y="-3" fill="currentColor" stroke="none" fontFamily="Arial, sans-serif" fontSize="22" fontWeight="700">{notation.number}.</text>
    </g>
  </svg>;
}

function AccidentalSymbolNotation({ notation }) {
  return <svg className="millionaire-accidental-symbol" viewBox="0 0 120 110" aria-hidden="true">
    <CalibratedNotationSymbol symbolKey={accidentalSymbolKey(notation.accidental)} x={60} y={58} gap={24} settingOverrides={{ fontSizeScale: 3.3, xOffsetScale: 0 }} />
  </svg>;
}

function higherRestSymbolKey(rest) {
  if (rest === "semibreve-rest") return "wholeRest";
  if (["minim-rest", "dotted-minim-rest"].includes(rest)) return "halfRest";
  if (rest === "quaver-rest") return "eighthRest";
  return "quarterRest";
}

function HigherRestMark({ rest, x, y, gap = 14 }) {
  return <g>
    <CalibratedNotationSymbol symbolKey={higherRestSymbolKey(rest)} x={x} y={y} gap={gap} />
    {["dotted-crotchet-rest", "dotted-minim-rest"].includes(rest) && <CalibratedNotationSymbol symbolKey="augmentationDotLine" x={x + gap * 1.1} y={y - gap * .4} gap={gap} />}
  </g>;
}

function HigherRhythmSumsRest({ rest, x = 42, systemTop = 12, gap = 10 }) {
  const y = systemTop + gap * 2 - (["crotchet-rest", "dotted-crotchet-rest"].includes(rest) ? gap * .5 : 0);
  const exactRestGlyph = rest === "semibreve-rest" ? "\uE4F4" : ["minim-rest", "dotted-minim-rest"].includes(rest) ? "\uE4F5" : null;
  return <g>
    {exactRestGlyph
      ? <text className="millionaire-music-symbol" x={x} y={y} fontSize={gap * 3.4} textAnchor="middle" dominantBaseline="middle">{exactRestGlyph}</text>
      : <CalibratedNotationSymbol symbolKey={higherRestSymbolKey(rest)} x={x} y={y} gap={gap} />}
    {["dotted-crotchet-rest", "dotted-minim-rest"].includes(rest) && <CalibratedNotationSymbol symbolKey="augmentationDotSpace" x={x + gap * 1.1} y={y - gap * .35} gap={gap} />}
  </g>;
}

function HigherRestNotation({ notation }) {
  const visualOffset = notation.rest === "semibreve-rest" ? -5 : notation.rest === "minim-rest" ? -2 : notation.rest === "crotchet-rest" ? 5 : notation.rest === "dotted-crotchet-rest" ? 10 : 0;
  return <svg className="millionaire-higher-rest" viewBox="0 0 90 90" aria-hidden="true">
    <g transform={`translate(45 ${45 + visualOffset}) scale(2.2) translate(-42 -32)`}>
      <HigherRhythmSumsRest rest={notation.rest} x={42} systemTop={12} />
    </g>
  </svg>;
}

function HigherRestSumNotation({ notation }) {
  const noteItem = RHYTHM_SUM_ITEMS[notation.note] || RHYTHM_SUM_ITEMS.quarterNote;
  return <div className="millionaire-higher-rest-sum" aria-hidden="true">
    <span className="millionaire-higher-rest-sum-slot"><RhythmSumsGlyph item={noteItem} scale={1.14} /></span>
    <span className="millionaire-higher-rest-sum-plus">+</span>
    <span className="millionaire-higher-rest-sum-slot"><svg viewBox="0 0 90 90" className="millionaire-higher-rest-sum-rest"><g transform="translate(45 70) scale(1.14) translate(-42 -50)"><HigherRhythmSumsRest rest={notation.rest} x={42} systemTop={12} /></g></svg></span>
  </div>;
}

function HigherArticulationNotation({ notation }) {
  const gap = 14;
  const top = 36;
  const bottom = top + gap * 4;
  const notes = notation.marking === "phrase"
    ? [{ x: 154, position: 3 }, { x: 190, position: 5 }, { x: 237, position: 4 }, { x: 273, position: 6 }, { x: 320, position: 5 }, { x: 356, position: 3 }, { x: 403, position: 4 }, { x: 439, position: 2 }]
    : notation.marking === "slur"
      ? [{ x: 235, position: 3 }, { x: 325, position: 6 }]
      : [{ x: 278, position: 4 }];
  const yFor = (position) => bottom - (position - 2) * gap / 2;
  const stemDownFor = (position) => position - NOTE_STEM_STEP_OFFSET > NOTE_STEM_DOWN_STEP_THRESHOLD;
  const firstStemDown = stemDownFor(notes[0].position);
  const curveFor = (phrase) => {
    const first = notes[0];
    const last = notes.at(-1);
    const settings = sharedNotationSymbol(phrase ? "phraseMarking" : (firstStemDown ? "slurStemDown" : "slurStemUp"));
    const clamp = (value, minimum, maximum) => Math.max(minimum, Math.min(maximum, value));
    const direction = firstStemDown ? -1 : 1;
    const xOffset = gap * Number(settings.xOffsetScale || 0) + Number(settings.opticalXOffset || 0);
    const yOffset = gap * Number(settings.yOffsetScale || 0) + Number(settings.opticalYOffset || 0);
    const sizeRatio = clamp(Number(settings.fontSizeScale || 5) / 5.3, .55, 1.8);
    const endpointGap = gap * (phrase ? 1.4 : 1.05) * sizeRatio;
    const x1 = first.x + xOffset;
    const x2 = last.x + xOffset;
    const y1 = yFor(first.position) + direction * endpointGap + yOffset;
    const y2 = yFor(last.position) + direction * endpointGap + yOffset;
    const span = Math.max(gap * 1.4, Math.abs(x2 - x1));
    const handleWidth = span * .28 * clamp(Number(settings.widthScale || 1), .35, 2.5);
    const depth = direction * gap * (phrase ? 2.1 : 1) * clamp(Number(settings.heightScale || 1), .35, 2.5) * sizeRatio;
    const strokeWidth = Math.max(1.1, gap * .13 * sizeRatio);
    return <path d={`M${x1} ${y1} C${x1 + handleWidth} ${y1 + depth}, ${x2 - handleWidth} ${y2 + depth}, ${x2} ${y2}`} fill="none" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" />;
  };
  return <svg className="millionaire-higher-articulation" viewBox="30 10 440 130" aria-hidden="true">
    {Array.from({ length: 5 }, (_, index) => <line key={index} x1="52" x2="462" y1={top + index * gap} y2={top + index * gap} stroke="currentColor" strokeWidth="1.2" />)}
    <CalibratedNotationSymbol symbolKey="gClef" x={94} y={bottom - gap} gap={gap} />
    {notation.marking === "phrase" && [213, 296, 379].map((x) => <line key={x} x1={x} x2={x} y1={top} y2={bottom} stroke="currentColor" strokeWidth="1.2" />)}
    {notation.marking === "phrase" && <><line x1="457" x2="457" y1={top} y2={bottom} stroke="currentColor" strokeWidth="1.2" /><line x1="462" x2="462" y1={top - .75} y2={bottom + .75} stroke="currentColor" strokeWidth="4" /></>}
    {notes.map((note, index) => <CalibratedNotationSymbol key={index} symbolKey={stemDownFor(note.position) ? "quarterNoteStemDown" : "quarterNoteStemUp"} x={note.x} y={yFor(note.position)} gap={gap} />)}
    {notation.marking === "accent" && <CalibratedNotationSymbol symbolKey={firstStemDown ? "accentBelow" : "accentAbove"} x={notes[0].x} y={yFor(notes[0].position)} gap={gap} settingOverrides={{ opticalYOffset: firstStemDown ? 1 : -5 }} />}
    {notation.marking === "staccato" && <CalibratedNotationSymbol symbolKey={firstStemDown ? "staccatoBelow" : "staccatoAbove"} x={notes[0].x} y={yFor(notes[0].position)} gap={gap} settingOverrides={{ opticalYOffset: firstStemDown ? 2 : -6 }} />}
    {notation.marking === "slur" && curveFor(false)}
    {notation.marking === "phrase" && curveFor(true)}
  </svg>;
}

function HigherTripletNotation({ notation }) {
  const quaverTriplet = notation.triplet === "quaver";
  return <svg className="millionaire-higher-triplet" viewBox="0 -8 150 78" aria-hidden="true">
    <g transform="translate(-8,-4) scale(1.25)">
      {[35, 62, 89].map((x) => <g key={x}>
        <ellipse cx={x} cy="38" rx="6.3" ry="4.6" transform={`rotate(-18 ${x} 38)`} fill="currentColor" />
        <line x1={x + 5.3} x2={x + 5.3} y1="38" y2="12" stroke="currentColor" strokeWidth="1.5" />
      </g>)}
      {quaverTriplet && <line x1="39.3" x2="95.3" y1="12" y2="12" stroke="currentColor" strokeWidth="4" />}
      {!quaverTriplet && <g stroke="currentColor" strokeWidth="1.6" fill="none" strokeLinecap="round">
        <path d="M 40 9 L 40 0 L 56 0" />
        <path d="M 80 0 L 96 0 L 96 9" />
      </g>}
      <text x="67" y={quaverTriplet ? "8" : "10"} textAnchor="middle" fontFamily="serif" fontWeight="900" fontSize="11" fill="currentColor">3</text>
    </g>
  </svg>;
}

const RHYTHM_FIGURE_PATTERNS = {
  pairedEighthNotes: ["eighth", "eighth"],
  fourSixteenthNotes: ["sixteenth", "sixteenth", "sixteenth", "sixteenth"],
  quaverTwoSemiquavers: ["eighth", "sixteenth", "sixteenth"],
  twoSemiquaversQuaver: ["sixteenth", "sixteenth", "eighth"],
  semiquaverQuaverSemiquaver: ["sixteenth", "eighth", "sixteenth"],
};

const SHARED_RHYTHM_LINE_GAP = 10;
const SHARED_RHYTHM_NOTE_RX = 7;
const SHARED_BEAMED_STEM_X_OFFSET = -2;
const SHARED_BEAMED_STEM_Y_OFFSET = -11;
const SHARED_BEAMED_STEM_DOWN_EXTENSION = 9;
const SHARED_SEMIQUAVER_BEAM_TRIM = 4;

function calibratedRhythmPoint(symbolKey, x, y) {
  const settings = sharedNotationSymbol(symbolKey);
  return {
    x: x + SHARED_RHYTHM_LINE_GAP * Number(settings.xOffsetScale || 0) + Number(settings.opticalXOffset || 0),
    y: y + SHARED_RHYTHM_LINE_GAP * Number(settings.yOffsetScale || 0) + Number(settings.opticalYOffset || 0),
  };
}

function sharedRhythmLayout(pattern, compact = false, positionSteps = null) {
  const values = RHYTHM_FIGURE_PATTERNS[pattern] || RHYTHM_FIGURE_PATTERNS.pairedEighthNotes;
  let spacing;
  if (compact) spacing = values.length >= 4 ? 14 : values.length === 3 ? 16 : 22;
  else spacing = values.length >= 4 ? 24 : 26;
  const positions = values.reduce((result, _, index) => {
    if (index === 0) result.push(22);
    else result.push(result[index - 1] + (positionSteps?.[index - 1] ?? spacing));
    return result;
  }, []);
  const noteY = 12 + SHARED_RHYTHM_LINE_GAP * 2;
  const stemXs = positions.map((x) => calibratedRhythmPoint("noteheadBlackStemUp", x, noteY).x + SHARED_RHYTHM_NOTE_RX + SHARED_BEAMED_STEM_X_OFFSET);
  const beamY = 12 + SHARED_RHYTHM_LINE_GAP * .1 + SHARED_BEAMED_STEM_Y_OFFSET;
  return {
    values, positions, stemXs, noteY,
    start: { x: stemXs[0], y: beamY },
    end: { x: stemXs.at(-1), y: beamY },
    centreX: (stemXs[0] + stemXs.at(-1)) / 2,
  };
}

function sharedBeamLineY(x, start, end) {
  if (start.x === end.x) return start.y;
  return start.y + ((x - start.x) / (end.x - start.x)) * (end.y - start.y);
}

function sharedBeamPolygonPoints(x1, y1, x2, y2, thickness) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = (-dy / length) * thickness;
  const normalY = (dx / length) * thickness;
  return `${x1},${y1} ${x2},${y2} ${x2 + normalX},${y2 + normalY} ${x1 + normalX},${y1 + normalY}`;
}

function SharedRhythmBeam({ start, end, colour, widthScale = 1, thicknessScale = 1, trim = 0 }) {
  const thickness = SHARED_RHYTHM_LINE_GAP * Number(SHARED_NOTATION.drawing?.beamThicknessScale || .42) * thicknessScale;
  const midX = (start.x + end.x) / 2;
  const halfWidth = Math.max(1, ((end.x - start.x) * widthScale) / 2 - trim / 2);
  const x1 = midX - halfWidth;
  const x2 = midX + halfWidth;
  const y1 = sharedBeamLineY(x1, start, end);
  const y2 = sharedBeamLineY(x2, start, end);
  return <polygon points={sharedBeamPolygonPoints(x1, y1, x2, y2, thickness)} fill={colour} pointerEvents="none" />;
}

function SharedBeamedRhythmGroup({ pattern, highlightBeam = false, compact = false, positionSteps = null, secondaryBeamTrim = 0 }) {
  const layout = sharedRhythmLayout(pattern, compact, positionSteps);
  const { values, positions, stemXs, noteY, start, end } = layout;
  const stemThickness = Math.max(1, SHARED_RHYTHM_LINE_GAP * Number(SHARED_NOTATION.drawing?.stemThicknessScale || .12));
  const primaryBeamConfig = sharedNotationSymbol("quaverBeam");
  const secondBeamConfig = sharedNotationSymbol("semiquaverBeam");
  const beamColour = highlightBeam ? "#d97706" : "currentColor";
  const secondarySegments = [];

  values.forEach((value, index) => {
    const isSemiquaver = value === "sixteenth";
    const previousIsSemiquaver = values[index - 1] === "sixteenth";
    const nextIsSemiquaver = values[index + 1] === "sixteenth";
    if (!isSemiquaver) return;
    if (nextIsSemiquaver && !previousIsSemiquaver) secondarySegments.push({ startIndex: index, endIndex: null });
    const openSegment = secondarySegments.at(-1);
    if (openSegment?.endIndex === null && (!nextIsSemiquaver || index === values.length - 1)) openSegment.endIndex = index;
    if (!previousIsSemiquaver && !nextIsSemiquaver) secondarySegments.push({ startIndex: index, endIndex: index, hook: true });
  });

  return <g>
    {positions.map((noteX, index) => {
      const symbolPoint = calibratedRhythmPoint("noteheadBlackStemUp", noteX, noteY);
      const stemEndY = sharedBeamLineY(stemXs[index], start, end);
      const stemStartY = symbolPoint.y + SHARED_BEAMED_STEM_Y_OFFSET + SHARED_BEAMED_STEM_DOWN_EXTENSION;
      return <React.Fragment key={`${pattern}-${index}`}>
        <CalibratedNotationSymbol symbolKey="noteheadBlackStemUp" x={noteX} y={noteY} gap={SHARED_RHYTHM_LINE_GAP} />
        <line x1={stemXs[index]} x2={stemXs[index]} y1={stemStartY} y2={stemEndY} stroke="currentColor" strokeWidth={stemThickness} strokeLinecap="butt" />
      </React.Fragment>;
    })}
    <SharedRhythmBeam start={start} end={end} colour={beamColour} widthScale={Number(primaryBeamConfig.widthScale || 1)} thicknessScale={Number(primaryBeamConfig.heightScale || 1)} trim={(values.includes("sixteenth") ? SHARED_SEMIQUAVER_BEAM_TRIM : 0) + (pattern === "pairedEighthNotes" ? 1 : 0)} />
    {secondarySegments.map((segment, index) => {
      const segmentStartX = stemXs[segment.startIndex];
      const segmentEndX = segment.hook ? segmentStartX + (segment.startIndex > 0 ? -14 : 14) : stemXs[segment.endIndex];
      let separatedHookShift = 0;
      if (pattern === "semiquaverQuaverSemiquaver" && segment.hook) separatedHookShift = segment.startIndex === 0 ? -1 : 1;
      const leftX = Math.min(segmentStartX, segmentEndX) + separatedHookShift;
      const rightX = Math.max(segmentStartX, segmentEndX) + separatedHookShift;
      const secondStart = { x: leftX, y: sharedBeamLineY(leftX, start, end) + SHARED_RHYTHM_LINE_GAP * .58 };
      const secondEnd = { x: rightX, y: sharedBeamLineY(rightX, start, end) + SHARED_RHYTHM_LINE_GAP * .58 };
      const baseSecondaryTrim = segment.hook || pattern === "fourSixteenthNotes" ? SHARED_SEMIQUAVER_BEAM_TRIM : 0;
      const appliedSecondaryTrim = baseSecondaryTrim + secondaryBeamTrim;
      return <SharedRhythmBeam key={index} start={secondStart} end={secondEnd} colour={beamColour} widthScale={Number(secondBeamConfig.widthScale || 1)} thicknessScale={Number(secondBeamConfig.heightScale || 1)} trim={appliedSecondaryTrim} />;
    })}
  </g>;
}

function PositionedBeamedRhythm({ pattern, targetX, targetY, scale = 1, highlightBeam = false, compact = false, positionSteps = null, secondaryBeamTrim = 0 }) {
  const layout = sharedRhythmLayout(pattern, compact, positionSteps);
  return <g transform={`translate(${targetX} ${targetY}) scale(${scale}) translate(${-layout.centreX} ${-layout.noteY})`}><SharedBeamedRhythmGroup pattern={pattern} highlightBeam={highlightBeam} compact={compact} positionSteps={positionSteps} secondaryBeamTrim={secondaryBeamTrim} /></g>;
}

function RhythmFigureNotation({ notation, highlightBeam = false }) {
  const pattern = notation.pattern || "pairedEighthNotes";
  const noteCount = RHYTHM_FIGURE_PATTERNS[pattern]?.length || 2;
  const scale = noteCount >= 4 ? 1.7 : noteCount === 3 ? 2 : 2.5;
  const pairedQuaverClass = pattern === "pairedEighthNotes" ? " is-paired-quavers" : "";
  return <svg className={`millionaire-rhythm-figure${pairedQuaverClass}`} viewBox="0 0 200 105" aria-hidden="true">
    <PositionedBeamedRhythm pattern={pattern} targetX={100} targetY={74} scale={scale} highlightBeam={highlightBeam} secondaryBeamTrim={Number(notation.secondaryBeamTrim || 0)} />
    {highlightBeam && <g className="millionaire-beam-pointer" transform={pattern === "pairedEighthNotes" ? "translate(0 -10)" : undefined}><path d="M 100 -18 L 100 -2" /><path d="M 94 -8 L 100 -1 L 106 -8" /></g>}
  </svg>;
}

function NotePartNotation({ notation }) {
  const arrows = {
    notehead: { x1: 38, y1: 82, x2: 86, y2: 82 },
    stem: { x1: 164, y1: 54, x2: 113, y2: 54 },
    flag: { x1: 164, y1: 33, x2: 124, y2: 51 },
  };
  const part = arrows[notation.part] ? notation.part : "notehead";
  const arrow = arrows[part];
  const dx = arrow.x2 - arrow.x1;
  const dy = arrow.y2 - arrow.y1;
  const length = Math.hypot(dx, dy) || 1;
  const unitX = dx / length;
  const unitY = dy / length;
  const arrowHeadBackX = arrow.x2 - unitX * 10;
  const arrowHeadBackY = arrow.y2 - unitY * 10;
  const perpendicularX = -unitY * 6;
  const perpendicularY = unitX * 6;
  const arrowHeadPath = `M ${arrowHeadBackX + perpendicularX} ${arrowHeadBackY + perpendicularY} L ${arrow.x2} ${arrow.y2} L ${arrowHeadBackX - perpendicularX} ${arrowHeadBackY - perpendicularY}`;
  return <svg className="millionaire-note-part" viewBox="0 0 200 120" aria-hidden="true">
    <CalibratedNotationSymbol symbolKey="eighthNoteStemUp" x={100} y={88} gap={20} />
    <g className="millionaire-note-part-arrow"><path d={`M ${arrow.x1} ${arrow.y1} L ${arrow.x2} ${arrow.y2}`} /><path d={arrowHeadPath} /></g>
  </svg>;
}

const BAR_NOTE_SYMBOL_KEYS = { quarterNote: "quarterNoteStemUp", dottedQuarterNote: "quarterNoteStemUp", eighthNote: "eighthNoteStemUp", dottedEighthNote: "eighthNoteStemUp", sixteenthNote: "sixteenthNoteStemUp", halfNote: "halfNoteStemUp", dottedHalfNote: "halfNoteStemUp", wholeNote: "wholeNote" };
const RHYTHM_ANSWER_VALUES = { Semiquaver: "sixteenthNote", Quaver: "eighthNote", "Dotted quaver": "dottedEighthNote", Crotchet: "quarterNote", "Dotted crotchet": "dottedQuarterNote", Minim: "halfNote", "Dotted minim": "dottedHalfNote", Semibreve: "wholeNote" };
const REST_ANSWER_VALUES = { "Quaver rest": "quaver-rest", "Crotchet rest": "crotchet-rest", "Dotted crotchet rest": "dotted-crotchet-rest", "Minim rest": "minim-rest", "Dotted minim rest": "dotted-minim-rest", "Semibreve rest": "semibreve-rest" };

const RHYTHM_SUMS_INFO = {
  semibreve: { stem: false, dots: 0 },
  "dotted-minim": { stem: true, dots: 1 },
  minim: { stem: true, dots: 0 },
  crotchet: { stem: true, dots: 0 },
  "dotted-crotchet": { stem: true, dots: 1 },
  "dotted-quaver": { stem: true, dots: 1, beams: 1 },
  quaver: { stem: true, dots: 0, beams: 1 },
  semiquaver: { stem: true, dots: 0, beams: 2 },
};
const RHYTHM_SUMS_LINE_GAP = 10;
const RHYTHM_SUMS_NOTE_RX = 7;
const RHYTHM_SUMS_BEAMED_STEM_X_OFFSET = -2;
const RHYTHM_SUMS_BEAMED_STEM_Y_OFFSET = -11;
const RHYTHM_SUMS_BEAMED_STEM_DOWN_EXTENSION = 9;
const RHYTHM_SUMS_SEMIQUAVER_BEAM_TRIM = 4;

const RHYTHM_SUM_ITEMS = {
  quarterNote: { displayType: "note", rhythm: "crotchet" },
  dottedQuarterNote: { displayType: "note", rhythm: "dotted-crotchet" },
  eighthNote: { displayType: "note", rhythm: "quaver" },
  dottedEighthNote: { displayType: "note", rhythm: "dotted-quaver" },
  sixteenthNote: { displayType: "note", rhythm: "semiquaver" },
  halfNote: { displayType: "note", rhythm: "minim" },
  dottedHalfNote: { displayType: "note", rhythm: "dotted-minim" },
  wholeNote: { displayType: "note", rhythm: "semibreve" },
  pairedEighthNotes: { displayType: "beamed", rhythms: ["quaver", "quaver"] },
  fourSixteenthNotes: { displayType: "beamed", rhythms: ["semiquaver", "semiquaver", "semiquaver", "semiquaver"] },
  quaverTwoSemiquavers: { displayType: "beamed", rhythms: ["quaver", "semiquaver", "semiquaver"] },
  twoSemiquaversQuaver: { displayType: "beamed", rhythms: ["semiquaver", "semiquaver", "quaver"] },
  semiquaverQuaverSemiquaver: { displayType: "beamed", rhythms: ["semiquaver", "quaver", "semiquaver"] },
  dottedQuaverSemiquaver: { displayType: "beamed", rhythms: ["dotted-quaver", "semiquaver"] },
  scotchSnap: { displayType: "beamed", rhythms: ["semiquaver", "dotted-quaver"] },
};

function rhythmSumsInfo(rhythm) {
  return RHYTHM_SUMS_INFO[rhythm] || {};
}

function rhythmSumsCalibratedPoint(symbolKey, x, y) {
  const actualSymbolKey = actualBravuraSymbolKey(symbolKey);
  const configuredSymbolKey = SHARED_NOTATION.symbols?.[symbolKey] ? symbolKey : actualSymbolKey;
  const settings = sharedNotationSymbol(configuredSymbolKey);
  return {
    x: x + RHYTHM_SUMS_LINE_GAP * Number(settings.xOffsetScale || 0) + Number(settings.opticalXOffset || 0),
    y: y + RHYTHM_SUMS_LINE_GAP * Number(settings.yOffsetScale || 0) + Number(settings.opticalYOffset || 0),
    settings,
    actualSymbolKey,
  };
}

function RhythmSumsCalibratedSymbol({ symbolKey, x, y, colour = "currentColor" }) {
  const point = rhythmSumsCalibratedPoint(symbolKey, x, y);
  const fontSize = RHYTHM_SUMS_LINE_GAP * Number(point.settings.fontSizeScale || 3.4);
  return <text className="millionaire-music-symbol" x={point.x} y={point.y} fill={colour} fontSize={fontSize} textAnchor="middle" transform={`translate(${point.x} ${point.y}) scale(${point.settings.widthScale || 1} ${point.settings.heightScale || 1}) translate(${-point.x} ${-point.y})`} pointerEvents="none">{bravuraSymbol(point.actualSymbolKey, NOTATION_FALLBACKS[point.actualSymbolKey] || "?")}</text>;
}

function rhythmSumsNoteSymbolKey(rhythm, beamed = false) {
  if (rhythm === "semibreve") return "wholeNote";
  if (rhythm === "minim" || rhythm === "dotted-minim") return "halfNoteStemUp";
  if (beamed) return "noteheadBlackStemUp";
  if (rhythm === "quaver" || rhythm === "dotted-quaver") return "eighthNoteStemUp";
  if (rhythm === "semiquaver") return "sixteenthNoteStemUp";
  return "quarterNoteStemUp";
}

function rhythmSumsSymbolY(systemTop) {
  return systemTop + RHYTHM_SUMS_LINE_GAP * 2;
}

function RhythmSumsNote({ rhythm, x = 42, systemTop = 12, colour = "currentColor", beamed = false, stemEndY = null, dotXOffset = null }) {
  const info = rhythmSumsInfo(rhythm);
  const y = rhythmSumsSymbolY(systemTop);
  const symbolKey = rhythmSumsNoteSymbolKey(rhythm, beamed);
  const symbolPoint = rhythmSumsCalibratedPoint(symbolKey, x, y);
  const stemX = beamed ? symbolPoint.x + RHYTHM_SUMS_NOTE_RX + RHYTHM_SUMS_BEAMED_STEM_X_OFFSET : x + RHYTHM_SUMS_NOTE_RX;
  const stemStartY = beamed ? symbolPoint.y + RHYTHM_SUMS_BEAMED_STEM_Y_OFFSET + RHYTHM_SUMS_BEAMED_STEM_DOWN_EXTENSION : y;
  const dotY = y - RHYTHM_SUMS_LINE_GAP * .25;
  const stemThickness = Math.max(1, RHYTHM_SUMS_LINE_GAP * Number(SHARED_NOTATION.drawing?.stemThicknessScale || .12));
  return <g>
    <RhythmSumsCalibratedSymbol symbolKey={symbolKey} x={x} y={y} colour={colour} />
    {beamed && info.stem && <line x1={stemX} x2={stemX} y1={stemStartY} y2={stemEndY} stroke={colour} strokeWidth={stemThickness} strokeLinecap="butt" />}
    {info.dots === 1 && <RhythmSumsCalibratedSymbol symbolKey="augmentationDotLine" x={x + RHYTHM_SUMS_LINE_GAP * 1.3 + (dotXOffset ?? (rhythm === "dotted-quaver" ? 8 : 0))} y={dotY} colour={colour} />}
  </g>;
}

function rhythmSumsStemX(rhythm, x, systemTop) {
  const point = rhythmSumsCalibratedPoint(rhythmSumsNoteSymbolKey(rhythm, true), x, rhythmSumsSymbolY(systemTop));
  return point.x + RHYTHM_SUMS_NOTE_RX + RHYTHM_SUMS_BEAMED_STEM_X_OFFSET;
}

function rhythmSumsBeamLineY(x, start, end) {
  if (start.x === end.x) return start.y;
  return start.y + ((x - start.x) / (end.x - start.x)) * (end.y - start.y);
}

function rhythmSumsBeamPoints(x1, y1, x2, y2, thickness) {
  const dx = x2 - x1;
  const dy = y2 - y1;
  const length = Math.hypot(dx, dy) || 1;
  const normalX = (-dy / length) * thickness;
  const normalY = (dx / length) * thickness;
  return `${x1},${y1} ${x2},${y2} ${x2 + normalX},${y2 + normalY} ${x1 + normalX},${y1 + normalY}`;
}

function RhythmSumsBeam({ start, end, colour = "currentColor", widthScale = 1, thicknessScale = 1, trim = 0 }) {
  const thickness = RHYTHM_SUMS_LINE_GAP * Number(SHARED_NOTATION.drawing?.beamThicknessScale || .42) * thicknessScale;
  const midX = (start.x + end.x) / 2;
  const halfWidth = Math.max(1, ((end.x - start.x) * widthScale) / 2 - trim / 2);
  const x1 = midX - halfWidth;
  const x2 = midX + halfWidth;
  return <polygon points={rhythmSumsBeamPoints(x1, rhythmSumsBeamLineY(x1, start, end), x2, rhythmSumsBeamLineY(x2, start, end), thickness)} fill={colour} pointerEvents="none" />;
}

function RhythmSumsBeamedNotes({ rhythms, colour = "currentColor", scale = 1 }) {
  const systemTop = 12;
  const isDottedPair = rhythms.length === 2 && rhythms[0] === "dotted-quaver" && rhythms[1] === "semiquaver";
  const isScotchSnap = rhythms.length === 2 && rhythms[0] === "semiquaver" && rhythms[1] === "dotted-quaver";
  const spacing = isDottedPair ? 30 : rhythms.length >= 4 ? 24 : 26;
  const positions = rhythms.map((_, index) => 22 + index * spacing);
  const stemXs = positions.map((x, index) => rhythmSumsStemX(rhythms[index], x, systemTop));
  const hasSemi = rhythms.some((rhythm) => rhythmSumsInfo(rhythm).beams === 2);
  const beamY = systemTop + RHYTHM_SUMS_LINE_GAP * .1 + RHYTHM_SUMS_BEAMED_STEM_Y_OFFSET;
  const start = { x: stemXs[0], y: beamY };
  const end = { x: stemXs.at(-1), y: beamY - RHYTHM_SUMS_LINE_GAP * .08 * Math.max(0, rhythms.length - 2) };
  const primaryBeamConfig = sharedNotationSymbol("quaverBeam");
  const secondBeamConfig = sharedNotationSymbol("semiquaverBeam");
  const secondarySegments = [];
  let segmentStart = null;
  rhythms.forEach((rhythm, index) => {
    const isSemi = rhythmSumsInfo(rhythm).beams === 2;
    const nextIsSemi = rhythmSumsInfo(rhythms[index + 1]).beams === 2;
    if (isSemi && segmentStart === null) segmentStart = index;
    if (segmentStart !== null && (!nextIsSemi || index === rhythms.length - 1)) { secondarySegments.push({ startIndex: segmentStart, endIndex: index, hook: index === segmentStart }); segmentStart = null; }
  });
  return <svg viewBox="0 0 118 92" className="millionaire-rhythmsums-glyph is-beamed" aria-hidden="true">
    <g transform={`translate(58 72) scale(${scale}) translate(-54 -50)`}>
      {rhythms.map((rhythm, index) => {
        const dotXOffset = rhythm === "dotted-quaver" ? isDottedPair ? 3 : isScotchSnap ? 2 : null : null;
        return <RhythmSumsNote key={`${rhythm}-${index}`} rhythm={rhythm} x={positions[index]} systemTop={systemTop} colour={colour} beamed stemEndY={rhythmSumsBeamLineY(stemXs[index], start, end)} dotXOffset={dotXOffset} />;
      })}
      <RhythmSumsBeam start={start} end={end} colour={colour} widthScale={Number(primaryBeamConfig.widthScale || 1)} thicknessScale={Number(primaryBeamConfig.heightScale || 1)} trim={hasSemi ? RHYTHM_SUMS_SEMIQUAVER_BEAM_TRIM - (isDottedPair || isScotchSnap ? 1 : 0) : 0} />
      {secondarySegments.map((segment, index) => {
        const segmentStartX = stemXs[segment.startIndex];
        const segmentEndX = segment.hook ? segmentStartX + (segment.startIndex > 0 ? -14 : 14) : stemXs[segment.endIndex];
        const rawSecondStartX = segmentStartX + (isDottedPair ? 4 : 0) - (isScotchSnap ? 1 : 0);
        const rawSecondEndX = segmentEndX - (isScotchSnap ? 1 : 0);
        const secondBeamShiftX = isDottedPair ? -1 : 0;
        const secondBeamWidthReduction = isDottedPair ? 3 : 0;
        const secondBeamLeftX = Math.min(rawSecondStartX, rawSecondEndX) + secondBeamShiftX + secondBeamWidthReduction / 2;
        const secondBeamRightX = Math.max(rawSecondStartX, rawSecondEndX) + secondBeamShiftX - secondBeamWidthReduction / 2;
        const secondStart = { x: secondBeamLeftX, y: rhythmSumsBeamLineY(secondBeamLeftX, start, end) + RHYTHM_SUMS_LINE_GAP * .58 };
        const secondEnd = { x: secondBeamRightX, y: rhythmSumsBeamLineY(secondBeamRightX, start, end) + RHYTHM_SUMS_LINE_GAP * .58 };
        return <RhythmSumsBeam key={index} start={secondStart} end={secondEnd} colour={colour} widthScale={Number(secondBeamConfig.widthScale || 1)} thicknessScale={Number(secondBeamConfig.heightScale || 1)} trim={RHYTHM_SUMS_SEMIQUAVER_BEAM_TRIM} />;
      })}
    </g>
  </svg>;
}

function RhythmSumsGlyph({ item, colour = "currentColor", scale = 1 }) {
  if (item.displayType === "beamed") return <RhythmSumsBeamedNotes rhythms={item.rhythms} colour={colour} scale={scale} />;
  return <svg viewBox="0 0 90 90" className="millionaire-rhythmsums-glyph" aria-hidden="true"><g transform={`translate(45 70) scale(${scale}) translate(-42 -50)`}><RhythmSumsNote rhythm={item.rhythm} x={42} systemTop={12} colour={colour} /></g></svg>;
}

function RhythmSumTerm({ rhythm, scale = .9 }) {
  if (rhythm === "blank") return <span className="millionaire-rhythmsums-blank" aria-hidden="true" />;
  const item = RHYTHM_SUM_ITEMS[rhythm] || RHYTHM_SUM_ITEMS.quarterNote;
  const positionClass = rhythm === "dottedQuaverSemiquaver" ? " is-dotted-quaver-semiquaver" : rhythm === "scotchSnap" ? " is-scotch-snap" : "";
  return <span className={`millionaire-rhythmsums-slot${positionClass}`}><RhythmSumsGlyph item={item} scale={scale} /></span>;
}

function AnswerRhythmGlyph({ rhythm, label }) {
  const symbolKey = BAR_NOTE_SYMBOL_KEYS[rhythm] || "quarterNoteStemUp";
  const dotted = ["dottedEighthNote", "dottedQuarterNote", "dottedHalfNote"].includes(rhythm);
  return <span className="millionaire-answer-rhythm" role="img" aria-label={label}><svg viewBox="0 0 64 70" aria-hidden="true"><CalibratedNotationSymbol symbolKey={symbolKey} x={30} y={43} gap={10} />{dotted && <CalibratedNotationSymbol symbolKey="augmentationDotLine" x={43} y={40.5} gap={10} />}</svg></span>;
}

function AnswerRestGlyph({ rest, label }) {
  const answerYOffset = rest === "semibreve-rest" ? -1 : rest === "quaver-rest" ? 2 : 7;
  return <span className="millionaire-answer-rhythm" role="img" aria-label={label}><svg viewBox="0 0 64 70" aria-hidden="true"><g transform={`translate(0 ${answerYOffset}) scale(1.15)`}><HigherRhythmSumsRest rest={rest} x={27} systemTop={8} /></g></svg></span>;
}

function AnswerTimeSignatureGlyph({ timeSignature, label }) {
  const [upper, lower] = timeSignature.split("/").map(Number);
  return <span className="millionaire-answer-time-signature" role="img" aria-label={label}><span aria-hidden="true">{TIME_DIGITS[upper]}</span><span aria-hidden="true">{TIME_DIGITS[lower]}</span></span>;
}

function RhythmSumNotation({ notation }) {
  const terms = notation.terms || [];
  const className = `millionaire-rhythmsums${terms.length === 1 ? " is-single-term" : ""}${terms.length === 2 ? " is-two-term" : ""}${terms.length === 3 ? " is-three-term" : ""}${Number.isFinite(notation.total) ? " is-completion" : ""}`;
  return <div className={className}>
    {(notation.terms || []).map((term, index) => <React.Fragment key={`${term}-${index}`}>
      <RhythmSumTerm rhythm={term} scale={terms.length === 1 ? 1.14 : .9} />
      {notation.operators?.[index] && <span className="millionaire-rhythmsums-operator" aria-hidden="true">{notation.operators[index]}</span>}
    </React.Fragment>)}
    {Number.isFinite(notation.total) && <><span className="millionaire-rhythmsums-operator" aria-hidden="true">=</span><span className="millionaire-rhythmsums-total" aria-label={`${notation.total} beats`}>{notation.total}</span></>}
  </div>;
}

// Match the presentation in Dynamics: hairpins are drawn as two clean lines,
// while letter dynamics use the shared Bravura calibration.
const DYNAMIC_SYMBOL_KEYS = { pp: "pianissimo", p: "piano", mp: "mezzoPiano", mf: "mezzoForte", f: "forte", ff: "fortissimo", sfz: "sforzato" };

function AnswerDynamicGlyph({ dynamic, label }) {
  const symbolKey = DYNAMIC_SYMBOL_KEYS[dynamic];
  return <span className="millionaire-answer-dynamic" role="img" aria-label={label}><svg viewBox="0 0 90 70" aria-hidden="true"><CalibratedNotationSymbol symbolKey={symbolKey} x={56.5} y={44} gap={10} settingOverrides={{ fontSizeScale: 5.475 }} /></svg></span>;
}

function DynamicNotationGlyph({ dynamic, x = 80, y = 50 }) {
  if (dynamic === "crescendo") return <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d={`M ${x - 32} ${y - 2} L ${x + 32} ${y - 12}`} /><path d={`M ${x - 32} ${y - 2} L ${x + 32} ${y + 8}`} /></g>;
  if (dynamic === "diminuendo") return <g fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"><path d={`M ${x - 32} ${y - 12} L ${x + 32} ${y - 2}`} /><path d={`M ${x - 32} ${y + 8} L ${x + 32} ${y - 2}`} /></g>;
  const symbolKey = DYNAMIC_SYMBOL_KEYS[dynamic];
  const fontSizeScale = ["pp", "p", "mp", "mf", "f", "ff", "sfz"].includes(dynamic) ? 5.475 : 3.65;
  return symbolKey ? <CalibratedNotationSymbol symbolKey={symbolKey} x={x} y={y + 4} gap={14} settingOverrides={{ fontSizeScale }} /> : null;
}

function DynamicNotation({ notation }) {
  const letterDynamic = ["pp", "p", "mp", "mf", "f", "ff", "sfz"].includes(notation.dynamic);
  return <svg className="millionaire-dynamic-notation" viewBox="0 0 160 88" aria-hidden="true"><DynamicNotationGlyph dynamic={notation.dynamic} x={letterDynamic ? 95 : 80} /></svg>;
}

// This is the calibrated Bravura end-barline from Barlines, rather than two
// ordinary text strokes. It includes the correct thin and thick lines.
function FinalBarlineNotation() {
  return <svg className="millionaire-final-barline-notation" viewBox="0 0 160 110" aria-hidden="true"><CalibratedNotationSymbol symbolKey="barlineFinal" x={80} y={50} gap={14} settingOverrides={{ fontSizeScale: 12 }} /></svg>;
}

function BarTimeSignature({ time, x, top, gap }) {
  if (!time) return null;
  const [upper, lower] = time;
  const symbolKey = `timeSig${upper}${lower}`;
  const settings = sharedNotationSymbol(symbolKey);
  const anchorY = top + gap * 1.35;
  const adjustedX = x + gap * settings.xOffsetScale + settings.opticalXOffset;
  const adjustedY = anchorY + gap * settings.yOffsetScale + settings.opticalYOffset;
  const transform = `translate(${adjustedX} ${adjustedY}) scale(${settings.widthScale} ${settings.heightScale}) translate(${-adjustedX} ${-adjustedY})`;
  const fontSize = gap * settings.fontSizeScale;
  return <g className="millionaire-music-symbol" transform={transform}>
    <text x={adjustedX} y={adjustedY - fontSize * .14} fontSize={fontSize} textAnchor="middle">{bravuraSymbol(`timeSig${upper}`, TIME_DIGITS[upper])}</text>
    <text x={adjustedX} y={adjustedY + fontSize * .43} fontSize={fontSize} textAnchor="middle">{bravuraSymbol(`timeSig${lower}`, TIME_DIGITS[lower])}</text>
  </g>;
}

function StandaloneTimeSignature({ notation, centered = false }) {
  const x = centered ? 172 : 145;
  return <svg className="millionaire-time-signature-notation" viewBox="0 0 220 160" aria-hidden="true"><BarTimeSignature time={[notation.top, notation.bottom]} x={x} top={42} gap={24} /></svg>;
}

function TwoBarMelodyNotation({ notation }) {
  const gap = Math.max(10, Number(SHARED_NOTATION.stave?.lineGap || 14));
  const top = 50;
  const bottom = top + gap * 4;
  const staffLeft = 28;
  const staffRight = 492;
  const middleBarline = 286;
  const notePositions = [[142, 180, 218, 256], [330, 368, 406, 444]];
  return <svg className="millionaire-two-bar-melody" viewBox="0 0 520 160" aria-hidden="true">
    {Array.from({ length: 5 }, (_, index) => <line key={index} className="millionaire-complete-bar-line" x1={staffLeft} x2={staffRight} y1={top + index * gap} y2={top + index * gap} />)}
    <CalibratedNotationSymbol symbolKey="gClef" x={72} y={bottom - gap} gap={gap} />
    {(notation.bars || []).slice(0, 2).map((bar, barIndex) => (bar || []).slice(0, 4).map((pitch, noteIndex) => {
      const position = PITCH_INDEX[pitch] ?? 4;
      const y = bottom - (position - 2) * gap / 2;
      const x = notePositions[barIndex][noteIndex];
      const stemDown = position - NOTE_STEM_STEP_OFFSET > NOTE_STEM_DOWN_STEP_THRESHOLD;
      return <CalibratedNotationSymbol key={`${barIndex}-${noteIndex}-${pitch}`} symbolKey={stemDown ? "quarterNoteStemDown" : "quarterNoteStemUp"} x={x} y={y} gap={gap} />;
    }))}
    <line className="millionaire-complete-barline" x1={middleBarline} x2={middleBarline} y1={top} y2={bottom} />
    <line className="millionaire-complete-barline" x1={staffRight} x2={staffRight} y1={top} y2={bottom} />
  </svg>;
}

// National 5 chord questions use the same score dimensions, note positions,
// rhythm choices and shared Bravura calibration as chords.html.
function N5ChordOutlineNotation({ notation }) {
  const width = 920;
  const height = 430;
  const gap = 10;
  const top = 154;
  const staffStart = 248;
  const staffEnd = 673;
  const noteXs = [338, 458, 578];
  const fadeId = `millionaire-n5-chord-fade-${notation.scoreId || "score"}`;
  const ledgerConfig = SHARED_NOTATION.symbols?.ledgerLines || {};
  const ledgerWidth = 12 * Number(ledgerConfig.widthScale || 1);
  const ledgerThickness = Math.max(1, .6 * Number(ledgerConfig.fontSizeScale || 2) * Number(ledgerConfig.heightScale || 1));
  const ledgerXOffset = Number(ledgerConfig.xOffsetScale || 0) * gap;
  const ledgerYOffset = Number(ledgerConfig.yOffsetScale || 0) * gap;
  return <svg className="millionaire-n5-chord-outline" viewBox={`0 0 ${width} ${height}`} aria-hidden="true">
    <defs>
      <linearGradient id={fadeId} gradientUnits="userSpaceOnUse" x1={staffStart} x2={staffEnd} y1="0" y2="0">
        <stop offset="0%" stopColor="#000" stopOpacity="1" />
        <stop offset="82%" stopColor="#000" stopOpacity="1" />
        <stop offset="100%" stopColor="#000" stopOpacity="0" />
      </linearGradient>
    </defs>
    <rect width={width} height={height} fill="transparent" />
    <g transform={`translate(${width / 2} ${top + gap * 2}) scale(1.5) translate(${-width / 2} ${-(top + gap * 2)})`}>
      {Array.from({ length: 5 }, (_, line) => <line key={line} x1={staffStart} x2={staffEnd} y1={top + line * gap} y2={top + line * gap} stroke={`url(#${fadeId})`} strokeWidth="1.2" />)}
      <CalibratedNotationSymbol symbolKey="gClef" x={staffStart + gap * 3.2} y={top + gap * 3} gap={gap} />
      {(notation.notes || []).slice(0, 3).map((note, index) => {
        const position = PITCH_INDEX[note.pitch] ?? 4;
        const step = position - NOTE_STEM_STEP_OFFSET;
        const noteY = top + gap * 4 - step * gap / 2;
        const noteX = noteXs[index];
        const stemDown = step > NOTE_STEM_DOWN_STEP_THRESHOLD;
        const symbolKey = note.rhythm === "minim"
          ? (stemDown ? "halfNoteStemDown" : "halfNoteStemUp")
          : (stemDown ? "quarterNoteStemDown" : "quarterNoteStemUp");
        const ledgerSteps = [];
        for (let ledgerStep = -2; ledgerStep >= step; ledgerStep -= 2) ledgerSteps.push(ledgerStep);
        for (let ledgerStep = 10; ledgerStep <= step; ledgerStep += 2) ledgerSteps.push(ledgerStep);
        return <React.Fragment key={`${note.pitch}-${note.rhythm}-${index}`}>
          {ledgerSteps.map((ledgerStep) => {
            const ledgerY = top + gap * 4 - ledgerStep * gap / 2 + ledgerYOffset;
            return <line key={ledgerStep} x1={noteX + ledgerXOffset - ledgerWidth} x2={noteX + ledgerXOffset + ledgerWidth} y1={ledgerY} y2={ledgerY} stroke="currentColor" strokeWidth={ledgerThickness} />;
          })}
          <CalibratedNotationSymbol symbolKey={symbolKey} x={noteX} y={noteY} gap={gap} />
        </React.Fragment>;
      })}
    </g>
  </svg>;
}

// Complete-bar questions now use the Rests single-bar score. Selecting a
// Millionaire answer places that note into the outlined target.
function CompleteBarNotation({ notation, selectedRhythm = null }) {
  if (!notation.time) return <TimeSigFirstBarNotation notation={notation} />;
  return <RestsFirstBarNotation notation={notation} selectedRhythm={selectedRhythm} />;
}

function InlineNotationGlyph({ glyph, index, shiftDottedMinimRight = false }) {
  if (glyph === "blank") return <span className="millionaire-glyph-blank" key={index}>?</span>;
  const isDottedMinim = glyph === "dottedHalfNote";
  const isDottedNote = isDottedMinim || ["dottedQuarterNote", "dottedEighthNote"].includes(glyph);
  const className = [isDottedNote ? "millionaire-dotted-note" : "", shiftDottedMinimRight && isDottedMinim ? "millionaire-dotted-minim-shift-right" : ""].filter(Boolean).join(" ");
  return <span className={className} key={index}>{GLYPHS[glyph] || "?"}</span>;
}

function NotationView({ notation, className = "", whatNoteQuestion = false, selectedRhythm = null, selectedBassNote = null }) {
  if (!notation) return null;
  const singleSymbolNotation = ["glyphs", "barline", "dynamic"].includes(notation.kind);
  const timeSignatureNotation = notation.kind === "timeSignature";
  const melodyNotation = notation.kind === "melody";
  const hairpinNotation = notation.kind === "dynamic" && ["crescendo", "diminuendo"].includes(notation.dynamic);
  const trebleClefNotation = notation.kind === "glyphs" && notation.glyphs?.length === 1 && notation.glyphs[0] === "trebleClef";
  const semibreveNotation = notation.kind === "glyphs" && notation.glyphs?.length === 1 && notation.glyphs[0] === "wholeNote";
  const repeatSignNotation = notation.kind === "glyphs" && notation.glyphs?.length === 1 && notation.glyphs[0] === "repeatRight";
  const twoTermRhythmSum = notation.kind === "rhythmSum" && notation.terms?.length === 2;
  const rhythmCompletionNotation = notation.kind === "rhythmSum" && Number.isFinite(notation.total);
  let content = null;
  const compactStave = typeof className === "string" && className.includes("is-note-name-question") && notation.kind !== "melody";
  const centeredTimeSignature = typeof className === "string" && className.includes("is-time-signature-question");
  const shiftDottedMinimRight = typeof className === "string" && className.includes("is-dotted-minim-name-question");
  if (notation.kind === "note" || notation.kind === "melody") content = <StaffNotation notation={notation} compactStave={compactStave} whatNoteQuestion={whatNoteQuestion || notation.kind === "melody"} />;
  else if (notation.kind === "n5ChordOutline") content = <N5ChordOutlineNotation notation={notation} />;
  else if (notation.kind === "stave") content = <StaffNotation notation={{ ...notation, showClef: false, showBarline: false }} compactStave={compactStave} whatNoteQuestion={whatNoteQuestion} />;
  else if (notation.kind === "keySignature") content = <KeySignatureNotation notation={notation} />;
  else if (notation.kind === "interval") content = <IntervalNotation notation={notation} />;
  else if (notation.kind === "ahInterval") content = <AHIntervalNotation notation={notation} />;
  else if (notation.kind === "navigationSymbol") content = <NavigationSymbolNotation notation={notation} />;
  else if (notation.kind === "tieCallout") content = <TieCalloutNotation notation={notation} />;
  else if (notation.kind === "ahChord") content = <AHChordNotation notation={notation} />;
  else if (notation.kind === "ahBassPrompt") content = <AHBassPromptNotation notation={notation} selectedBassNote={selectedBassNote} />;
  else if (notation.kind === "octaveSign") content = <OctaveSignNotation notation={notation} />;
  else if (notation.kind === "repeatEnding") content = <RepeatEndingNotation notation={notation} />;
  else if (notation.kind === "accidentalSymbol") content = <AccidentalSymbolNotation notation={notation} />;
  else if (notation.kind === "articulation") content = <HigherArticulationNotation notation={notation} />;
  else if (notation.kind === "rest") content = <HigherRestNotation notation={notation} />;
  else if (notation.kind === "restSum") content = <HigherRestSumNotation notation={notation} />;
  else if (notation.kind === "restBar") content = <HigherRestBarNotation notation={notation} selectedRest={selectedRhythm} />;
  else if (notation.kind === "triplet") content = <HigherTripletNotation notation={notation} />;
  else if (notation.kind === "rhythmSum") content = <RhythmSumNotation notation={notation} />;
  else if (notation.kind === "dynamic") content = <DynamicNotation notation={notation} />;
  else if (notation.kind === "barline") content = <div className="millionaire-glyphs millionaire-final-barline-glyphs"><InlineNotationGlyph glyph="barlineFinal" index={0} /></div>;
  else if (notation.kind === "timeSignature") content = <StandaloneTimeSignature notation={notation} centered={centeredTimeSignature} />;
  else if (notation.kind === "bar") content = <CompleteBarNotation notation={notation} selectedRhythm={selectedRhythm} />;
  else if (notation.kind === "rhythmFigure") content = <RhythmFigureNotation notation={notation} />;
  else if (notation.kind === "beam") content = <RhythmFigureNotation notation={notation} highlightBeam={true} />;
  else if (notation.kind === "notePart") content = <NotePartNotation notation={notation} />;
  else if (notation.kind === "twoBarMelody") content = <TwoBarMelodyNotation notation={notation} />;
  else content = <div className="millionaire-glyphs">{(notation.glyphs || []).map((glyph, index) => <InlineNotationGlyph glyph={glyph} index={index} shiftDottedMinimRight={shiftDottedMinimRight} />)}</div>;
  const accessibleLabel = selectedBassNote ? `${notation.label || "Music notation"} Selected bass note: ${selectedBassNote}.` : notation.label || "Music notation";
  return <div className={`millionaire-notation${singleSymbolNotation ? " is-single-symbol-notation" : ""}${timeSignatureNotation ? " is-time-signature-question" : ""}${melodyNotation ? " is-melody-notation" : ""}${hairpinNotation ? " is-hairpin-notation" : ""}${trebleClefNotation ? " is-treble-clef-notation" : ""}${semibreveNotation ? " is-semibreve-notation" : ""}${repeatSignNotation ? " is-repeat-sign-notation" : ""}${twoTermRhythmSum ? " is-two-term-rhythm-sum" : ""}${rhythmCompletionNotation ? " is-rhythm-completion-question" : ""}${className ? ` ${className}` : ""}`} role="img" aria-label={accessibleLabel}>{content}</div>;
}

function isDottedMinimNameQuestion(question) {
  const concept = question?.concept || "";
  const prompt = question?.prompt || "";
  const normalisedPrompt = String(prompt).trim().toLowerCase();
  const isDottedMinimPrompt = normalisedPrompt === "what is this note value called?" || normalisedPrompt.includes("what is this note") && normalisedPrompt.includes("called");
  return concept === "dotted-minim-name" || isDottedMinimPrompt;
}

function isDottedMinimBeatsQuestion(question) {
  return question?.concept === "dotted-minim-beats";
}

function isTimeSignatureBarCompletionQuestion(question) {
  return question?.notation?.kind === "restBar" || (question?.notation?.kind === "bar"
    && Array.isArray(question.notation.time)
    && question.notation.glyphs?.includes("blank"));
}

function isWhatNoteQuestion(question) {
  const concept = question?.concept || "";
  const prompt = question?.prompt || "";
  const normalisedPrompt = String(prompt).trim().toLowerCase();
  return normalisedPrompt === "what note is this?" || ["treble-clef-e", "treble-clef-g", "treble-clef-c", "treble-clef-b", "treble-clef-e-space"].includes(concept);
}

function isNoteValueNameQuestion(question) {
  const concept = question?.concept || "";
  const prompt = question?.prompt || "";
  const isNamedNotePrompt = typeof prompt === "string" && (prompt === "What note is this?" || prompt.startsWith("Name the note"));
  const isSymbolPrompt = typeof prompt === "string" && (prompt === "What is this symbol called?" || prompt === "What is the name of this symbol?");
  return ["crotchet-name", "minim-name", "dotted-minim-name", "semibreve-name", "treble-clef-e", "treble-clef-g", "treble-clef-c", "treble-clef-b", "treble-clef-e-space", "double-barline-name"].includes(concept) || isNamedNotePrompt || isSymbolPrompt;
}

function isDynamicSymbolQuestion(question) {
  const concept = question?.concept || "";
  const prompt = question?.prompt || "";
  const normalisedPrompt = String(prompt).trim().toLowerCase();
  return ["crescendo-symbol", "diminuendo-symbol"].includes(concept) || (normalisedPrompt === "what is this symbol called?" && ["crescendo", "diminuendo"].includes(concept));
}

function isSymbolMeaningQuestion(question) {
  const concept = question?.concept || "";
  const prompt = question?.prompt || "";
  const normalisedPrompt = String(prompt).trim().toLowerCase();
  return (
    concept === "double-barline-meaning" ||
    normalisedPrompt === "what does this symbol usually mean?" ||
    (normalisedPrompt.includes("what does") && normalisedPrompt.includes("this symbol") && normalisedPrompt.includes("mean"))
  );
}

function isBeatTotalQuestion(question) {
  const prompt = question?.prompt || "";
  return prompt === "Calculate the total number of beats.";
}

function isSingleNoteBeatsQuestion(question) {
  const concept = question?.concept || "";
  const prompt = question?.prompt || "";
  return ["crotchet-beats", "minim-beats", "dotted-minim-beats", "semibreve-beats"].includes(concept) || prompt === "How many beats does this note last?";
}

function isTopNumberTimeSignatureQuestion(question) {
  const prompt = question?.prompt || "";
  const concept = question?.concept || "";
  return prompt === "What does the top number tell you?" || prompt === "What does a time signature tell you?" || concept === "time-signature-purpose" || question?.notation?.kind === "timeSignature";
}

window.MLH.LiteracyNotation = { AnswerDynamicGlyph, AnswerRestGlyph, AnswerRhythmGlyph, AnswerTimeSignatureGlyph, DYNAMIC_SYMBOL_KEYS, RHYTHM_ANSWER_VALUES, REST_ANSWER_VALUES, N5_SIMPLE_TIME_PATTERNS, NotationView, isBeatTotalQuestion, isDottedMinimBeatsQuestion, isDottedMinimNameQuestion, isDynamicSymbolQuestion, isNoteValueNameQuestion, isSingleNoteBeatsQuestion, isSymbolMeaningQuestion, isTimeSignatureBarCompletionQuestion, isTopNumberTimeSignatureQuestion, isWhatNoteQuestion };
})();
