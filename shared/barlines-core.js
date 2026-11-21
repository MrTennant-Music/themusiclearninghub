(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.BARLINES_CORE=api;})(typeof window==='object'?window:globalThis,function(){
function create(random=globalThis.Math.random){
const Math=Object.create(globalThis.Math);Math.random=random;
const MAX_SEMIQUAVERS_PER_BAR=8;
const SYSTEM_TOPS_ONE_LINE=[82],SYSTEM_TOPS_TWO_LINES=[42,182];
// Separate bags prevent a metre's pattern count from changing its frequency.
const bags = new Map();
function balancedChoice(name, items, identity = item => typeof item === "object" ? JSON.stringify(item) : String(item)) {
  if (!items.length) throw new RangeError("No playable choices remain.");
  const key = name + ":" + items.map(identity).join("|");
  let bag = bags.get(key);
  if (!bag || !bag.remaining.length) {
    const remaining = items.slice();
    for (let i = remaining.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [remaining[i], remaining[j]] = [remaining[j], remaining[i]]; }
    if (bag && remaining.length > 1 && identity(remaining.at(-1)) === bag.last) {
      const swap = remaining.findIndex(item => identity(item) !== bag.last);
      if (swap >= 0) [remaining[swap], remaining[remaining.length - 1]] = [remaining.at(-1), remaining[swap]];
    }
    bag = { remaining, last: bag?.last }; bags.set(key, bag);
  }
  const item = bag.remaining.pop(); bag.last = identity(item); return item;
}
function spacingSlots(items, width, minimum = 16) {
  const gaps = items.map((item,i) => Math.max(rhythmInfo(item.rhythm).dots ? minimum+8 : minimum, items[i+1]?.pitch?.writtenAccidental || items[i+1]?.writtenAccidental ? minimum+12 : minimum));
  const base = Math.min(minimum,width/Math.max(1,items.length)), baseWidth = base*items.length, extraWidth = gaps.reduce((sum,gap)=>sum+Math.max(0,gap-base),0);
  const extraScale = Math.min(1,Math.max(0,width-baseWidth)/Math.max(1,extraWidth)), remaining = Math.max(0,width-baseWidth-extraWidth), totalWeight = items.reduce((sum,item)=>sum+rhythmInfo(item.rhythm).spacing,0);
  return gaps.map((gap,i)=>base+Math.max(0,gap-base)*extraScale+remaining*rhythmInfo(items[i].rhythm).spacing/Math.max(1,totalWeight));
}
function normaliseSettings(levelKey, saved, rests) {
  const level = LEVELS[levelKey] || LEVELS.N3, defaults = levelEnabledMap(levelKey);
  let enabledRhythms = Object.fromEntries(Object.keys(defaults).map(id => [id, typeof saved?.[id] === "boolean" ? saved[id] : defaults[id]]));
  const restsEnabled = level.rhythmIds.includes("rests") && (typeof rests === "boolean" ? rests : true);
  enabledRhythms.rests = restsEnabled;
  if (!level.keyIds.some(id => enabledRhythms[`key-${id}`])) level.keyIds.forEach(id => enabledRhythms[`key-${id}`] = true);
  if (!hasValidSelection(levelKey, enabledRhythms, restsEnabled)) enabledRhythms = defaults;
  return { enabledRhythms, restsEnabled };
}
function hasValidSelection(levelKey, enabledRhythms, restsEnabled) {
  const level = LEVELS[levelKey] || LEVELS.N3;
  return level.keyIds.some(id => enabledRhythms[`key-${id}`]) && TIME_SIGNATURES.some(signature => level.timeSignatureIds.includes(signature.id) && signatureCanBeGenerated(signature, enabledRhythms, restsEnabled));
}
function questionFingerprint(q) { return JSON.stringify([q.key.id,q.timeSignature.id,q.nextTimeSignature?.id,q.items.map(item => [item.rhythm,item.pitch?.step,item.pitch?.writtenAccidental,!!item.tieToNext])]); }
const recentQuestions=[];
function buildQuestion(level, types, enabled, rests, options={}) {
  let question, chosen;
  for (let attempt=0;attempt<16;attempt++) {
    question=buildQuestionData(level,types,enabled,rests,{...options,chosen});
    chosen={key:question.key,timeSignature:question.timeSignature,nextTimeSignature:question.nextTimeSignature};
    if (!recentQuestions.includes(questionFingerprint(question))) break;
  }
  recentQuestions.push(questionFingerprint(question));if(recentQuestions.length>24)recentQuestions.shift();
  return question;
}
const NOTES = [
  { name: "A3", letter: "A", octave: 3, step: -4, midi: 57 },
  { name: "B3", letter: "B", octave: 3, step: -3, midi: 59 },
  { name: "C4", letter: "C", octave: 4, step: -2, midi: 60 },
  { name: "D4", letter: "D", octave: 4, step: -1, midi: 62 },
  { name: "E4", letter: "E", octave: 4, step: 0, midi: 64 },
  { name: "F4", letter: "F", octave: 4, step: 1, midi: 65 },
  { name: "G4", letter: "G", octave: 4, step: 2, midi: 67 },
  { name: "A4", letter: "A", octave: 4, step: 3, midi: 69 },
  { name: "B4", letter: "B", octave: 4, step: 4, midi: 71 },
  { name: "C5", letter: "C", octave: 5, step: 5, midi: 72 },
  { name: "D5", letter: "D", octave: 5, step: 6, midi: 74 },
  { name: "E5", letter: "E", octave: 5, step: 7, midi: 76 },
  { name: "F5", letter: "F", octave: 5, step: 8, midi: 77 },
  { name: "G5", letter: "G", octave: 5, step: 9, midi: 79 },
  { name: "A5", letter: "A", octave: 5, step: 10, midi: 81 },
  { name: "B5", letter: "B", octave: 5, step: 11, midi: 83 },
  { name: "C6", letter: "C", octave: 6, step: 12, midi: 84 },
];

const TIME_SIGNATURES = [
  { id: "2/4", top: "2", bottom: "4", unitsPerBar: 8, type: "simple", weight: 1 },
  { id: "3/4", top: "3", bottom: "4", unitsPerBar: 12, type: "simple", weight: 1 },
  { id: "4/4", top: "4", bottom: "4", unitsPerBar: 16, type: "simple", weight: 1 },
  { id: "5/4", top: "5", bottom: "4", unitsPerBar: 20, type: "simple", weight: 0.7 },
  { id: "6/8", top: "6", bottom: "8", unitsPerBar: 12, type: "compound", compoundGroups: 2, weight: 1 },
  { id: "9/8", top: "9", bottom: "8", unitsPerBar: 18, type: "compound", compoundGroups: 3, weight: 0.75 },
  { id: "12/8", top: "12", bottom: "8", unitsPerBar: 24, type: "compound", compoundGroups: 4, weight: 0.4 },
];

const RHYTHM_INFO = {
  semibreve: { units: 16, beats: 4, spacing: 8, open: true, stem: false, dots: 0 },
  "dotted-minim": { units: 12, beats: 3, spacing: 6, open: true, stem: true, dots: 1 },
  minim: { units: 8, beats: 2, spacing: 4, open: true, stem: true, dots: 0 },
  "dotted-crotchet": { units: 6, beats: 1.5, spacing: 3, open: false, stem: true, dots: 1 },
  crotchet: { units: 4, beats: 1, spacing: 2.2, open: false, stem: true, dots: 0 },
  quaver: { units: 2, beats: 0.5, spacing: 1.15, open: false, stem: true, dots: 0, flag: true, beams: 1 },
  "dotted-quaver": { units: 3, beats: 0.75, spacing: 1.5, open: false, stem: true, dots: 1, flag: true, beams: 1 },
  semiquaver: { units: 1, beats: 0.25, spacing: 0.72, open: false, stem: true, dots: 0, flag: true, beams: 2 },
  tie: { units: 0, beats: 0, spacing: 0, tie: true },
  "semibreve-rest": { units: 999, beats: 4, spacing: 8, rest: true },
  "minim-rest": { units: 8, beats: 2, spacing: 4, rest: true },
  "dotted-crotchet-rest": { units: 6, beats: 1.5, spacing: 3, rest: true },
  "crotchet-rest": { units: 4, beats: 1, spacing: 2.2, rest: true },
  "quaver-rest": { units: 2, beats: 0.5, spacing: 1.15, rest: true },
};

const RHYTHM_OPTIONS = [
  { id: "crotchet", label: "Crotchet" },
  { id: "minim", label: "Minim" },
  { id: "dotted-minim", label: "Dotted Minim" },
  { id: "semibreve", label: "Semibreve" },
  { id: "quaver", label: "Quaver" },
  { id: "semiquaver", label: "Semiquaver" },
  { id: "dotted-crotchet", label: "Dotted Crotchet" },
  { id: "dotted-quaver", label: "Dotted Quaver" },
  { id: "rests", label: "Rests" },
  { id: "ties", label: "Ties" },
  { id: "syncopation", label: "Syncopation" },
  { id: "time-changes", label: "Time Changes" },
];

const KEYS = {
  C: { id: "C", label: "C major", tonic: "C", signature: [], scale: ["C", "D", "E", "F", "G", "A", "B"] },
  G: { id: "G", label: "G major", tonic: "G", signature: [{ type: "sharp", step: 8 }], scale: ["G", "A", "B", "C", "D", "E", "F"] },
  F: { id: "F", label: "F major", tonic: "F", signature: [{ type: "flat", step: 4 }], scale: ["F", "G", "A", "B", "C", "D", "E"] },
  Am: { id: "Am", label: "A minor", tonic: "A", signature: [], scale: ["A", "B", "C", "D", "E", "F", "G"], melodicSharps: { G: 1 } },
  D: { id: "D", label: "D major", tonic: "D", signature: [{ type: "sharp", step: 8 }, { type: "sharp", step: 5 }], scale: ["D", "E", "F", "G", "A", "B", "C"] },
  Bb: { id: "Bb", label: "B flat major", tonic: "B", signature: [{ type: "flat", step: 4 }, { type: "flat", step: 7 }], scale: ["B", "C", "D", "E", "F", "G", "A"] },
  Em: { id: "Em", label: "E minor", tonic: "E", signature: [{ type: "sharp", step: 8 }], scale: ["E", "F", "G", "A", "B", "C", "D"] },
  Dm: { id: "Dm", label: "D minor", tonic: "D", signature: [{ type: "flat", step: 4 }], scale: ["D", "E", "F", "G", "A", "B", "C"] },
};

const LEVELS = {
  N3: {
    label: "National 3",
    description: "Crotchet • Minim • Dotted minim • Semibreve • Barlines • Double barlines",
    rhythmIds: ["crotchet", "minim", "dotted-minim", "semibreve"],
    timeSignatureIds: ["2/4", "3/4", "4/4"],
    keyIds: ["C"],
    minStep: 0,
    maxStep: 8,
  },
  N4: {
    label: "National 4",
    description: "Quaver • Semiquaver • Grouped semiquavers • Paired quavers",
    rhythmIds: ["crotchet", "minim", "dotted-minim", "semibreve", "quaver", "semiquaver"],
    timeSignatureIds: ["2/4", "3/4", "4/4"],
    keyIds: ["C"],
    minStep: -2,
    maxStep: 10,
  },
  N5: {
    label: "National 5",
    description: "Dotted rhythms • Dotted crotchet • Dotted quaver",
    rhythmIds: ["crotchet", "minim", "dotted-minim", "semibreve", "quaver", "semiquaver", "dotted-crotchet", "dotted-quaver"],
    timeSignatureIds: ["2/4", "3/4", "4/4"],
    keyIds: ["C", "G", "F", "Am"],
    minStep: -2,
    maxStep: 10,
  },
  H: {
    label: "Higher",
    description: "6/8, 9/8 and 12/8 • Rests",
    rhythmIds: ["crotchet", "minim", "dotted-minim", "semibreve", "quaver", "semiquaver", "dotted-crotchet", "dotted-quaver", "rests"],
    timeSignatureIds: ["2/4", "3/4", "4/4", "6/8", "9/8", "12/8"],
    keyIds: ["C", "G", "F", "Am"],
    minStep: -2,
    maxStep: 10,
  },
  AH: {
    label: "Advanced Higher",
    description: "Ties • Syncopated rhythms • 5/4 • Time changes",
    rhythmIds: ["crotchet", "minim", "dotted-minim", "semibreve", "quaver", "semiquaver", "dotted-crotchet", "dotted-quaver", "rests", "ties", "syncopation", "time-changes"],
    timeSignatureIds: ["2/4", "3/4", "4/4", "5/4", "6/8", "9/8", "12/8"],
    keyIds: ["C", "G", "F", "Am", "D", "Bb", "Em", "Dm"],
    minStep: -4,
    maxStep: 12,
  },
};

const SIMPLE_FULL_BAR_PATTERNS = {
  "2/4": [
    ["minim"], ["crotchet", "crotchet"], ["quaver-group-2", "crotchet"], ["crotchet", "quaver-group-2"],
    ["quaver-group-2", "quaver-group-2"], ["semiquaver-group-4", "semiquaver-group-4"], ["semiquaver-group-4", "crotchet"], ["crotchet", "semiquaver-group-4"],
    ["quaver-2semiquavers", "crotchet"], ["2semiquavers-quaver", "crotchet"], ["dotted-quaver-semiquaver", "crotchet"],
    ["dotted-crotchet", "quaver"], ["quaver", "dotted-crotchet"], ["crotchet-rest", "crotchet"],
    ["crotchet", "crotchet-rest"], ["quaver-rest", "quaver", "crotchet"],
  ],
  "3/4": [
    ["dotted-minim"], ["minim", "crotchet"], ["crotchet", "minim"], ["crotchet", "crotchet", "crotchet"],
    ["quaver-group-2", "crotchet", "crotchet"], ["crotchet", "quaver-group-2", "crotchet"], ["crotchet", "crotchet", "quaver-group-2"],
    ["semiquaver-group-4", "semiquaver-group-4", "semiquaver-group-4"], ["semiquaver-group-4", "crotchet", "crotchet"], ["crotchet", "semiquaver-group-4", "crotchet"],
    ["dotted-crotchet", "quaver", "crotchet"], ["crotchet", "dotted-crotchet", "quaver"],
    ["crotchet-rest", "crotchet", "crotchet"], ["crotchet", "crotchet-rest", "crotchet"], ["crotchet", "crotchet", "crotchet-rest"],
  ],
  "4/4": [
    ["semibreve"], ["minim", "minim"], ["minim", "crotchet", "crotchet"], ["crotchet", "crotchet", "minim"],
    ["crotchet", "crotchet", "crotchet", "crotchet"], ["quaver-group-2", "crotchet", "crotchet", "crotchet"],
    ["crotchet", "quaver-group-2", "crotchet", "crotchet"], ["crotchet", "crotchet", "quaver-group-2", "crotchet"],
    ["quaver-group-2", "quaver-group-2", "minim"], ["semiquaver-group-4", "semiquaver-group-4", "semiquaver-group-4", "semiquaver-group-4"], ["semiquaver-group-4", "crotchet", "crotchet", "crotchet"],
    ["crotchet", "quaver-2semiquavers", "crotchet", "crotchet"], ["crotchet", "crotchet", "2semiquavers-quaver", "crotchet"],
    ["dotted-crotchet", "quaver", "minim"], ["minim", "dotted-crotchet", "quaver"], ["semibreve-rest"],
    ["minim-rest", "minim"], ["crotchet", "crotchet-rest", "minim"],
  ],
  "5/4": [
    ["semibreve", "crotchet"], ["crotchet", "semibreve"], ["minim", "minim", "crotchet"],
    ["crotchet", "minim", "minim"], ["crotchet", "crotchet", "crotchet", "crotchet", "crotchet"],
    ["syncopated-crotchets", "minim", "crotchet"], ["minim", "syncopated-crotchets", "crotchet"],
    ["dotted-crotchet", "quaver", "minim", "crotchet"], ["crotchet", "dotted-crotchet", "quaver", "minim"],
    ["quaver-group-2", "crotchet", "crotchet", "minim"], ["semiquaver-group-4", "crotchet", "crotchet", "minim"],
  ],
};

// Cover the same established beat cells in every compatible simple metre.
for (const id of Object.keys(SIMPLE_FULL_BAR_PATTERNS)) {
  const beats=Number(id.split("/")[0]), patterns=SIMPLE_FULL_BAR_PATTERNS[id];
  const candidates=[Array(beats).fill("quaver-group-2"),Array(beats).fill("dotted-quaver-semiquaver")];
  for(let position=0;position<beats;position++) {
    candidates.push(Array.from({length:beats},(_,i)=>i===position?"dotted-quaver-semiquaver":"crotchet"));
    if(position<beats-1)candidates.push([...Array(position).fill("crotchet"),"syncopated-crotchets",...Array(beats-position-2).fill("crotchet")]);
  }
  for(const candidate of candidates)if(!patterns.some(pattern=>pattern.join("|")===candidate.join("|")))patterns.push(candidate);
}

const COMPOUND_BEAT_PATTERNS = [
  { pattern: ["dotted-crotchet"], weight: 4 },
  { pattern: ["crotchet", "quaver"], weight: 4 },
  { pattern: ["quaver", "crotchet"], weight: 4 },
  { pattern: ["quaver-group-3"], weight: 1 },
  { pattern: ["dotted-crotchet-rest"], weight: 1 },
];

function randomIndex(length) { return Math.floor(Math.random() * length); }

function randomItem(items) { return items[randomIndex(items.length)]; }

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function rhythmInfo(rhythm) { return RHYTHM_INFO[rhythm] || RHYTHM_INFO.crotchet; }

function noteByIndex(index) { return NOTES[clamp(index, 0, NOTES.length - 1)]; }

function noteIndexByStep(step) { return NOTES.findIndex((note) => note.step === step); }

function weightedItem(items) {
  const pool = [];
  items.forEach((item) => {
    for (let i = 0; i < item.weight; i += 1) pool.push(item.pattern);
  });
  return randomItem(pool);
}

function signatureCanBeGenerated(signature, enabledRhythms, restsEnabled) {
  if (!enabledRhythms[`time-${signature.id}`]) return false;
  if (signature.type === "simple") {
    const patterns = SIMPLE_FULL_BAR_PATTERNS[signature.id] || [];
    return patterns.some((pattern) => patternAllowed(pattern, enabledRhythms, restsEnabled));
  }
  return COMPOUND_BEAT_PATTERNS.some((item) => patternAllowed(item.pattern, enabledRhythms, restsEnabled));
}

function weightedSignatureChoice(enabledTimeTypes, enabledRhythms, restsEnabled, allowedTimeSignatureIds = TIME_SIGNATURES.map((signature) => signature.id)) {
  const available = TIME_SIGNATURES.filter((signature) => allowedTimeSignatureIds.includes(signature.id) && enabledTimeTypes[signature.type] && signatureCanBeGenerated(signature, enabledRhythms, restsEnabled));
  return balancedChoice("metre", available, item => item.id);
}

function nearestMelodicIndex(previousIndex, stepwise, range) {
  const minIndex = Math.max(0, noteIndexByStep(range.minStep));
  const maxIndex = Math.max(minIndex, noteIndexByStep(range.maxStep));
  if (!stepwise) return clamp(previousIndex + randomItem([-2, -1, 0, 0, 1, 2]), minIndex, maxIndex);
  if (previousIndex <= minIndex) return minIndex + 1;
  if (previousIndex >= maxIndex) return maxIndex - 1;
  return previousIndex + randomItem([-1, 1]);
}

function expandRhythmToken(token) {
  if (token === "syncopated-crotchets") return ["quaver", "tie", "crotchet", "quaver"];
  if (token === "tied-minims") return ["minim", "tie", "minim"];
  if (token === "quaver-group-2") return ["quaver", "quaver"];
  if (token === "quaver-group-3") return ["quaver", "quaver", "quaver"];
  if (token === "semiquaver-group-4") return ["semiquaver", "semiquaver", "semiquaver", "semiquaver"];
  if (token === "quaver-2semiquavers") return ["quaver", "semiquaver", "semiquaver"];
  if (token === "2semiquavers-quaver") return ["semiquaver", "semiquaver", "quaver"];
  if (token === "dotted-quaver-semiquaver") return ["dotted-quaver", "semiquaver"];
  return [token];
}

function shouldExplicitlyBeam(token) {
  return ["quaver-group-2", "quaver-group-3", "semiquaver-group-4", "quaver-2semiquavers", "2semiquavers-quaver", "dotted-quaver-semiquaver"].includes(token);
}

function rhythmAllowed(rhythm, enabledRhythms, restsEnabled) {
  if (rhythm === "tie") return !!enabledRhythms.ties;
  if (!restsEnabled && rhythmInfo(rhythm).rest) return false;
  if (rhythmInfo(rhythm).rest && !enabledRhythms.rests) return false;
  if (rhythm === "semibreve-rest") return !!enabledRhythms.semibreve;
  if (rhythm === "minim-rest") return !!enabledRhythms.minim;
  if (rhythm === "dotted-crotchet-rest") return !!enabledRhythms["dotted-crotchet"];
  if (rhythm === "crotchet-rest") return !!enabledRhythms.crotchet;
  if (rhythm === "quaver-rest") return !!enabledRhythms.quaver;
  if (rhythm === "dotted-quaver") return !!enabledRhythms["dotted-quaver"];
  return !!enabledRhythms[rhythm];
}

function tokenAllowed(token, enabledRhythms, restsEnabled) {
  if (token === "syncopated-crotchets") return !!enabledRhythms.syncopation && !!enabledRhythms.ties && tokenAllowed("quaver-group-2", enabledRhythms, restsEnabled) && !!enabledRhythms.crotchet;
  if (token === "tied-minims") return !!enabledRhythms.ties && !!enabledRhythms.minim;
  return expandRhythmToken(token).every((rhythm) => rhythmAllowed(rhythm, enabledRhythms, restsEnabled));
}

function semiquaverCount(pattern) {
  return pattern.reduce((count, token) => count + expandRhythmToken(token).filter((rhythm) => rhythm === "semiquaver").length, 0);
}

function patternAllowed(pattern, enabledRhythms, restsEnabled) {
  return semiquaverCount(pattern) <= MAX_SEMIQUAVERS_PER_BAR && pattern.every((token) => tokenAllowed(token, enabledRhythms, restsEnabled));
}

function levelEnabledMap(levelKey) {
  const level = LEVELS[levelKey] || LEVELS.N3;
  const enabled = {};
  level.rhythmIds.forEach((id) => { enabled[id] = true; });
  level.timeSignatureIds.forEach((id) => { enabled[`time-${id}`] = true; });
  level.keyIds.forEach((id) => { enabled[`key-${id}`] = true; });
  return enabled;
}

function enabledMapMatchesLevel(levelKey, enabledRhythms) {
  const official = levelEnabledMap(levelKey);
  const keys = new Set([...Object.keys(official), ...Object.keys(enabledRhythms)]);
  return [...keys].every(key => Boolean(enabledRhythms[key]) === Boolean(official[key]));
}

function taskMatchesLevel(levelKey, enabledRhythms, restsEnabled) {
  const officialRests = LEVELS[levelKey].rhythmIds.includes("rests");
  return enabledMapMatchesLevel(levelKey, enabledRhythms) && restsEnabled === officialRests;
}

function levelTimeTypes(levelKey, enabledRhythms = levelEnabledMap(levelKey)) {
  const level = LEVELS[levelKey] || LEVELS.N3;
  const activeSignatures = level.timeSignatureIds.filter((id) => enabledRhythms[`time-${id}`]);
  return {
    simple: activeSignatures.some((id) => TIME_SIGNATURES.find((signature) => signature.id === id)?.type === "simple"),
    compound: activeSignatures.some((id) => TIME_SIGNATURES.find((signature) => signature.id === id)?.type === "compound"),
  };
}

function chooseSimplePattern(timeSignature, enabledRhythms, restsEnabled) {
  const allPatterns = SIMPLE_FULL_BAR_PATTERNS[timeSignature.id] || SIMPLE_FULL_BAR_PATTERNS["4/4"];
  const filtered = allPatterns.filter((pattern) => patternAllowed(pattern, enabledRhythms, restsEnabled));
  return filtered.length ? balancedChoice("pattern-" + timeSignature.id, filtered) : null;
}

function buildCompoundBar(timeSignature, enabledRhythms, restsEnabled) {
  const allowed = COMPOUND_BEAT_PATTERNS.filter((item) => patternAllowed(item.pattern, enabledRhythms, restsEnabled));
  if (!allowed.length) return null;
  const groups = [];
  for (let i = 0; i < timeSignature.compoundGroups; i += 1) groups.push(weightedItem(allowed));
  return groups.flat();
}

function activeKeyIds(enabledRhythms, level) {
  return level.keyIds.filter((id) => enabledRhythms[`key-${id}`]);
}

function randomKey(level, enabledRhythms) {
  const ids = activeKeyIds(enabledRhythms, level);
  return KEYS[balancedChoice("key", ids.length ? ids : level.keyIds)];
}

function applyKeyAccidental(note, key) {
  if (key?.id === "Am" && note.letter === "G") return { ...note, writtenAccidental: 1 };
  return { ...note, writtenAccidental: null };
}

function addItemsFromRhythms(rhythms, previousIndex, options) {
  const items = [];
  let noteIndex = previousIndex;
  let beamGroupCounter = 0;
  let pendingTieFrom = null;
  rhythms.forEach((token) => {
    const expanded = expandRhythmToken(token);
    const beamed = shouldExplicitlyBeam(token) && expanded.length > 1;
    const beamGroupId = beamed ? `beam-${beamGroupCounter++}` : undefined;
    expanded.forEach((rhythm) => {
      const info = rhythmInfo(rhythm);
      if (info.tie) {
        pendingTieFrom = items.length - 1;
        return;
      }
      if (info.rest) {
        items.push({ rhythm, isRest: true, beamGroupId: null, boundaryAfter: true });
        return;
      }
      const stepwise = ["quaver", "semiquaver", "dotted-quaver"].includes(rhythm);
      noteIndex = nearestMelodicIndex(noteIndex, stepwise, options.range);
      let pitch;
      if (pendingTieFrom !== null && items[pendingTieFrom]?.pitch) {
        pitch = { ...items[pendingTieFrom].pitch };
        const tiedIndex = noteIndexByStep(pitch.step);
        if (tiedIndex >= 0) noteIndex = tiedIndex;
      } else {
        pitch = noteByIndex(noteIndex);
        if (options.key?.scale?.length) {
          let attempts = 0;
          while (!options.key.scale.includes(pitch.letter) && attempts < 8) {
            noteIndex = nearestMelodicIndex(noteIndex, stepwise, options.range);
            pitch = noteByIndex(noteIndex);
            attempts += 1;
          }
        }
        pitch = applyKeyAccidental(pitch, options.key);
      }
      const item = { rhythm, pitch, beamGroupId: options.disableAutoBeam && !beamed ? null : beamGroupId, boundaryAfter: false, tieFromPrevious: pendingTieFrom !== null };
      if (pendingTieFrom !== null && items[pendingTieFrom]) items[pendingTieFrom].tieToNext = true;
      pendingTieFrom = null;
      items.push(item);
    });
  });
  for (let i = 0; i < items.length; i += 1) {
    const current = items[i];
    const next = items[i + 1];
    if (!current.beamGroupId || !next || current.beamGroupId !== next.beamGroupId) current.boundaryAfter = true;
  }
  return { items, nextIndex: noteIndex };
}

function buildQuestionData(activeLevel, enabledTimeTypes, enabledRhythms, restsEnabled, options = {}) {
  const level = LEVELS[activeLevel] || LEVELS.N3;
  if (!hasValidSelection(activeLevel, enabledRhythms, restsEnabled)) throw new RangeError("The selected rhythms cannot fill the selected time signatures.");
  const key = options.chosen?.key || randomKey(level, enabledRhythms);
  const timeChangeSignatureIds = level.timeSignatureIds.filter((id) => !["9/8", "12/8"].includes(id));
  const availableTimeChangeSignatureIds = timeChangeSignatureIds.filter((id) => {
    const signature = TIME_SIGNATURES.find((item) => item.id === id);
    return signature && enabledTimeTypes[signature.type] && signatureCanBeGenerated(signature, enabledRhythms, restsEnabled);
  });
  const timeSignature = options.chosen?.timeSignature || weightedSignatureChoice(enabledTimeTypes, enabledRhythms, restsEnabled, level.timeSignatureIds);
  const useTimeChange = options.chosen ? Boolean(options.chosen.nextTimeSignature) : activeLevel === "AH" && enabledRhythms["time-changes"] && availableTimeChangeSignatureIds.includes(timeSignature.id) && availableTimeChangeSignatureIds.length >= 2 && Math.random() < 0.35;
  const totalBars = useTimeChange ? (options.compact ? 4 : 8) : options.compact ? (timeSignature.id === "12/8" ? 2 : ["4/4", "5/4", "9/8"].includes(timeSignature.id) ? 3 : 4) : 4;
  const changeBarIndex = useTimeChange ? totalBars / 2 : null;
  const nextTimeSignature = useTimeChange ? (options.chosen?.nextTimeSignature || weightedSignatureChoice(enabledTimeTypes, enabledRhythms, restsEnabled, availableTimeChangeSignatureIds.filter(id => id !== timeSignature.id))) : null;
  const systemCount = useTimeChange || (!options.compact && ["9/8", "12/8"].includes(timeSignature.id)) ? 2 : 1;
  const barsPerSystem = systemCount === 2 ? totalBars / 2 : 4;
  const systemTops = systemCount === 2 ? SYSTEM_TOPS_TWO_LINES : SYSTEM_TOPS_ONE_LINE;
  const items = [];
  const correctBoundaries = [];
  const correctBoundaryTypes = {};
  const minIndex = noteIndexByStep(level.minStep);
  const maxIndex = noteIndexByStep(level.maxStep);
  let previousIndex = clamp(randomIndex(NOTES.length), minIndex, maxIndex);
  let runningUnits = 0;
  const fixedBoundaries = [];
  for (let barIndex = 0; barIndex < totalBars; barIndex += 1) {
    const barTimeSignature = useTimeChange && barIndex >= changeBarIndex ? nextTimeSignature : timeSignature;
    const pattern = barTimeSignature.type === "compound" ? buildCompoundBar(barTimeSignature, enabledRhythms, restsEnabled) : chooseSimplePattern(barTimeSignature, enabledRhythms, restsEnabled);
    if (!pattern) throw new RangeError("The selected rhythms cannot fill this bar.");
    const built = addItemsFromRhythms(pattern, previousIndex, { disableAutoBeam: barTimeSignature.type === "compound", range: level, key });
    previousIndex = built.nextIndex;
    built.items.forEach((item) => {
      runningUnits += item.rhythm === "semibreve-rest" ? barTimeSignature.unitsPerBar : rhythmInfo(item.rhythm).units;
      const safeBeamGroupId = item.beamGroupId ? `bar-${barIndex}-${item.beamGroupId}` : item.beamGroupId;
      items.push({ ...item, beamGroupId: safeBeamGroupId, id: `item-${items.length}`, cumulativeUnits: runningUnits, barIndex });
    });
    if (barIndex < totalBars - 1) {
      const boundaryId = `boundary-${runningUnits}`;
      const isSystemBreakBoundary = systemCount > 1 && (barIndex + 1) % barsPerSystem === 0;
      if (isSystemBreakBoundary) {
        // The end of a stave already implies this barline.
      } else if (useTimeChange && barIndex < changeBarIndex) fixedBoundaries.push(boundaryId);
      else {
        correctBoundaries.push(runningUnits);
        correctBoundaryTypes[boundaryId] = "single";
      }
    }
  }
  const requiresFinalDouble = activeLevel === "N3";
  if (requiresFinalDouble) correctBoundaryTypes["boundary-final"] = "double";
  if (activeLevel === "AH" && enabledRhythms.ties) {
    const candidateBoundaries = [];
    for (let barIndex = useTimeChange ? changeBarIndex : 0; barIndex < totalBars - 1; barIndex += 1) {
      if ((barIndex + 1) % barsPerSystem === 0 && systemCount > 1) continue;
      const before = [...items].reverse().find(item => item.barIndex === barIndex);
      const after = items.find(item => item.barIndex === barIndex + 1);
      if (before && after && !before.isRest && !after.isRest && !before.tieToNext && !after.tieFromPrevious && !after.tieToNext) candidateBoundaries.push({ before, after });
    }
    const boundaryTie = randomItem(candidateBoundaries);
    if (boundaryTie) {
      boundaryTie.after.pitch = { ...boundaryTie.before.pitch };
      boundaryTie.before.tieToNext = true;
      boundaryTie.after.tieFromPrevious = true;
    }
  }
  return { id: Math.random().toString(36).slice(2), activeLevel, key, timeSignature, nextTimeSignature, changeBarIndex, items, correctBoundaries, correctBoundaryTypes, fixedBoundaries, requiresFinalDouble, totalBars, systemCount, barsPerSystem, systemTops };
}
return {spacingSlots, balancedChoice, normaliseSettings, hasValidSelection, questionFingerprint, NOTES, TIME_SIGNATURES, RHYTHM_INFO, RHYTHM_OPTIONS, KEYS, LEVELS, SIMPLE_FULL_BAR_PATTERNS, COMPOUND_BEAT_PATTERNS, randomIndex, randomItem, clamp, rhythmInfo, noteByIndex, noteIndexByStep, weightedItem, signatureCanBeGenerated, weightedSignatureChoice, nearestMelodicIndex, expandRhythmToken, shouldExplicitlyBeam, rhythmAllowed, tokenAllowed, semiquaverCount, patternAllowed, levelEnabledMap, enabledMapMatchesLevel, taskMatchesLevel, levelTimeTypes, chooseSimplePattern, buildCompoundBar, activeKeyIds, randomKey, applyKeyAccidental, addItemsFromRhythms, buildQuestion};
}
return {create};
});
