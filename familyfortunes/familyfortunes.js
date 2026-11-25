const { useEffect, useLayoutEffect, useRef, useState } = React;
const CUSTOM_CATEGORY_STORAGE_KEY = "mlh-family-fortunes-custom-categories-v1";
const ROUND_OVERRIDE_STORAGE_KEY = "mlh-family-fortunes-round-overrides-v1";
const SELECTED_ROUNDS_STORAGE_KEY = "mlh-family-fortunes-selected-rounds-concept-recall-v1";
const OPTIONS_STORAGE_KEY = "mlh-family-fortunes-options-v1";
const TEAM_ROSTER_STORAGE_KEY = "mlh-family-fortunes-team-roster-v1";
const DEFAULT_TEAM_MEMBER_COUNT = 4;
const DEFAULT_ROUNDS_TO_PLAY = 5;
const MIN_ANSWERS_PER_QUESTION = 4;
const MAX_ANSWERS_PER_QUESTION = 10;
const ANSWER_TIME_SECONDS = 20;
const TOUCH_BUZZER_GAP_MS = 1000;
const BUZZER_SOUNDS = [
  { id: "classic", label: "Classic Buzz" },
  { id: "bell", label: "Ring Bell" },
  { id: "ding", label: "Ding" },
  { id: "zap", label: "Laser Zap" },
];

function createBuzzerPlayer(pair) {
  const soundUrl = (id) => `./familyfortunes/familyfortunes-audio/buzzer-${id}.mp3`;
  const AudioContext = window.AudioContext || window.webkitAudioContext;
  const context = AudioContext ? new AudioContext() : null;
  const audioElements = new Set();
  let stopped = false;

  const buffers = context && Promise.all(pair.map(async ({ id }) => {
    const response = await fetch(soundUrl(id));
    if (!response.ok) throw new Error("Buzzer sound unavailable.");
    return [id, await context.decodeAudioData(await response.arrayBuffer())];
  })).then((entries) => new Map(entries)).catch(() => null);
  context?.resume().catch(() => {});

  const playMedia = (id) => {
    const audio = new Audio(soundUrl(id));
    audioElements.add(audio);
    const forget = () => audioElements.delete(audio);
    audio.addEventListener("ended", forget, { once: true });
    audio.play().catch(forget);
  };

  return {
    play(id) {
      if (!context) { playMedia(id); return; }
      const resumed = context.state === "running" ? Promise.resolve() : context.resume().catch(() => {});
      Promise.all([buffers, resumed]).then(([decoded]) => {
        if (stopped) return;
        if (!decoded?.has(id)) {
          playMedia(id);
          return;
        }
        const source = context.createBufferSource();
        source.buffer = decoded.get(id);
        source.connect(context.destination);
        source.onended = () => source.disconnect();
        source.start();
      });
    },
    stop() {
      stopped = true;
      audioElements.forEach((audio) => audio.pause());
      audioElements.clear();
      context?.close().catch(() => {});
    },
  };
}

const LEVEL_MENU = {
  N3: { label: "National 3" },
  N4: { label: "National 4" },
  N5: { label: "National 5" },
  H: { label: "Higher" },
  AH: { label: "Advanced Higher" },
};
const cleanAnswer = window.FAMILY_FORTUNES_ANSWERS.normalize;
const capitalizeFirstLetter = (value) => String(value || "").replace(/^(\s*)(\p{L})/u, (_, leading, letter) => `${leading}${letter.toLocaleUpperCase("en-GB")}`);
const preparePlayableRound = (round) => {
  const answers = Array.isArray(round?.answers) ? round.answers.slice(0, MAX_ANSWERS_PER_QUESTION) : [];
  return answers.length >= MIN_ANSWERS_PER_QUESTION ? { ...round, answers } : null;
};
function readGameOptions() {
  const requestedLevel = new URLSearchParams(window.location.search).get("level");
  const linkedLevel = LEVEL_MENU[requestedLevel] ? requestedLevel : null;
  try {
    const stored = JSON.parse(window.localStorage.getItem(OPTIONS_STORAGE_KEY) || "null");
    const roundsToPlay = Number(stored?.roundsToPlay);
    return {
      level: linkedLevel || (LEVEL_MENU[stored?.level] ? stored.level : "H"),
      roundsToPlay: Number.isInteger(roundsToPlay) && roundsToPlay > 0 ? Math.max(3, roundsToPlay) : DEFAULT_ROUNDS_TO_PLAY,
    };
  } catch {
    return { level: linkedLevel || "H", roundsToPlay: DEFAULT_ROUNDS_TO_PLAY };
  }
}
function createDefaultTeamRoster() {
  return { teamNames: ["", ""], teamMembers: Array.from({ length: 2 }, () => Array(DEFAULT_TEAM_MEMBER_COUNT).fill("")) };
}
function readTeamRoster() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(TEAM_ROSTER_STORAGE_KEY) || "null");
    if (!saved || typeof saved !== "object") return createDefaultTeamRoster();
    const teamNames = Array.from({ length: 2 }, (_, team) => Array.isArray(saved.teamNames) && typeof saved.teamNames[team] === "string" ? saved.teamNames[team].slice(0, 22) : "");
    const teamMembers = Array.from({ length: 2 }, (_, team) => {
      const roster = Array.isArray(saved.teamMembers) && Array.isArray(saved.teamMembers[team]) ? saved.teamMembers[team] : null;
      return roster?.length ? roster.map((name) => typeof name === "string" ? name.slice(0, 32) : "") : Array(DEFAULT_TEAM_MEMBER_COUNT).fill("");
    });
    return { teamNames, teamMembers };
  } catch {
    return createDefaultTeamRoster();
  }
}
const shuffledIndexes = (length) => {
  const indexes = Array.from({ length }, (_, index) => index);
  for (let index = indexes.length - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(Math.random() * (index + 1));
    [indexes[index], indexes[swapIndex]] = [indexes[swapIndex], indexes[index]];
  }
  return indexes;
};
function dealFaceoff(queues, members) {
  const nextQueues = queues.map((queue) => [...queue]);
  const players = members.map((roster, team) => {
    if (!nextQueues[team].length) nextQueues[team] = shuffledIndexes(roster.length);
    return nextQueues[team].shift();
  });
  return { players, queues: nextQueues };
}
function FittedName({ className, name }) {
  const nameRef = useRef(null);

  useLayoutEffect(() => {
    const text = nameRef.current;
    const slot = text.parentElement;
    let mounted = true;
    const fit = () => {
      text.style.fontSize = "";
      const available = slot.getBoundingClientRect().width;
      const required = text.getBoundingClientRect().width;
      if (available > 0 && required > available) {
        const fontSize = parseFloat(getComputedStyle(text).fontSize);
        text.style.fontSize = `${Math.floor(fontSize * available / required * 10) / 10}px`;
      }
    };

    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(slot);
    document.fonts.ready.then(() => { if (mounted) fit(); });
    return () => {
      mounted = false;
      observer.disconnect();
    };
  }, [name]);

  return <span className={`${className} ff-name-slot`}><span ref={nameRef} className="ff-fitted-name">{name}</span></span>;
}

function FamilyFortunesTimer({ seconds }) {
  const remaining = Math.max(0, Math.ceil(seconds));
  const progress = Math.max(0, Math.min(100, (seconds / ANSWER_TIME_SECONDS) * 100));
  return <div className="ff-question-timer" role="timer" aria-label={`${remaining} ${remaining === 1 ? "second" : "seconds"} remaining`}>
    <svg className="ff-question-timer-ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="ff-question-timer-track" cx="50" cy="50" r="45" pathLength="100" />
      <circle className="ff-question-timer-progress" cx="50" cy="50" r="45" pathLength="100" style={{ strokeDashoffset: 100 - progress }} />
    </svg>
    <span>{remaining}</span>
  </div>;
}
function readCustomCategories() {
  try {
    const saved = JSON.parse(window.localStorage.getItem(CUSTOM_CATEGORY_STORAGE_KEY) || "[]");
    if (!Array.isArray(saved)) return [];
    return saved.filter((category) => category && typeof category.id === "string" && typeof category.name === "string" && Array.isArray(category.questions))
      .map((category) => ({
        id: category.id,
        name: category.name.slice(0, 40),
        questions: category.questions.filter((question) => question && typeof question.prompt === "string" && Array.isArray(question.answers))
          .map((question) => ({ prompt: question.prompt.slice(0, 180), answers: question.answers.filter((answer) => typeof answer === "string" && answer.trim()).slice(0, MAX_ANSWERS_PER_QUESTION).map((answer) => answer.slice(0, 70)) }))
          .filter((question) => question.prompt.trim() && question.answers.length >= MIN_ANSWERS_PER_QUESTION),
      }))
      .filter((category) => category.name.trim() && category.questions.length);
  } catch {
    return [];
  }
}

const levelStorageKey = (key, level) => level === "H" ? key : `${key}-${level.toLowerCase()}`;
function readRoundOverrides(level = "H") {
  try {
    const saved = JSON.parse(window.localStorage.getItem(levelStorageKey(ROUND_OVERRIDE_STORAGE_KEY, level)) || "{}");
    if (!saved || typeof saved !== "object" || Array.isArray(saved)) return {};
    return Object.fromEntries(Object.entries(saved).filter(([, round]) => round && typeof round === "object").map(([id, round]) => [id, {
      ...(typeof round.label === "string" ? { label: round.label.slice(0, 40) } : {}),
      ...(typeof round.prompt === "string" ? { prompt: round.prompt.slice(0, 180) } : {}),
      ...(Array.isArray(round.answers) ? { answers: round.answers.filter((answer) => typeof answer === "string").slice(0, MAX_ANSWERS_PER_QUESTION).map((answer) => answer.slice(0, 70)) } : {}),
    }]));
  } catch {
    return {};
  }
}
function readSelectedQuestionIds(availableIds, level) {
  try {
    const saved = JSON.parse(window.localStorage.getItem(levelStorageKey(SELECTED_ROUNDS_STORAGE_KEY, level)) || "null");
    if (saved?.version === 3 && saved.all) return availableIds;
    const ids = Array.isArray(saved) ? saved : saved?.ids;
    const selected = Array.isArray(ids) ? [...new Set(ids.filter((id) => availableIds.includes(id)))] : [];
    if (saved?.version === 2) {
      const previousDefault = (LITERACY_ROUNDS[level] ?? []).map(({ id }) => id).filter((id) => availableIds.includes(id));
      if (selected.length === previousDefault.length && previousDefault.every((id) => selected.includes(id))) return availableIds;
    }
    return selected.length >= 3 ? selected : availableIds;
  } catch {
    return availableIds;
  }
}

const NATIONAL_5_KEYS = ["C major", "G major", "F major", "A minor"];

function keysRound(id, includeAdvancedHigherKeys) {
  return {
    id,
    label: "Keys",
    prompt: "Name musical keys.",
    answers: includeAdvancedHigherKeys
      ? ["D major", "B♭ major", "E minor", "D minor", ...NATIONAL_5_KEYS]
      : NATIONAL_5_KEYS,
    answerAliases: { "B♭ major": ["Bb major"] },
  };
}

function chordTypesRound(id, includeAugmented) {
  const answers = ["Added 6th", "Dominant 7th", "Diminished 7th", "Diminished triad"];
  if (includeAugmented) answers.push("Augmented triad");
  return {
    id,
    label: "Chords",
    prompt: "Name types of chord.",
    answers,
    answerAliases: {
      "Added 6th": ["Added 6th chord", "Major added 6th"],
      "Dominant 7th": ["Dominant 7th chord"],
      "Diminished 7th": ["Diminished 7th chord", "Fully diminished 7th"],
      "Diminished triad": ["Diminished chord"],
      "Augmented triad": ["Augmented chord"],
    },
  };
}

const N3_NOTE_VALUES = ["Semibreve", "Dotted minim", "Minim", "Crotchet"];
const NON_MINOR_SCALES = [
  ["Whole-tone scale", ["Whole tone"]],
  ["Chromatic scale", ["Chromatic"]],
  ["Pentatonic scale", ["Pentatonic", "Major pentatonic", "Major pentatonic scale"]],
  ["Major scale", ["Major"]],
];
const MINOR_SCALES = [
  ["Harmonic minor scale", ["Harmonic minor"]],
  ["Melodic minor scale", ["Melodic minor", "Ascending melodic minor", "Ascending melodic minor scale"]],
];

function scalesRound(id, scales) {
  return {
    id,
    label: "Scales",
    prompt: "Name types of scale.",
    answers: scales.map(([name]) => name),
    answerAliases: Object.fromEntries(scales),
  };
}

function voiceTypesRound(id, includeCountertenor) {
  const answers = ["Soprano", "Mezzo soprano", "Alto", "Tenor", "Baritone", "Bass"];
  const answerAliases = { Alto: ["Contralto"] };
  if (includeCountertenor) {
    answers.push("Countertenor");
    answerAliases.Countertenor = ["Counter-tenor"];
  }
  return {
    id,
    label: "Voice Types",
    prompt: "Name classical voice types.",
    answers,
    answerAliases,
  };
}

function playingTechniquesRound(id, includeHigherTechniques) {
  const answers = ["Rolls", "Flutter tonguing", "Con sordino", "Pizzicato", "Arco"];
  if (includeHigherTechniques) answers.push("Tremolando", "Harmonics");
  return {
    id,
    label: "Playing Techniques",
    prompt: "Name instrumental playing techniques.",
    answers,
    answerAliases: { Rolls: ["Roll", "Drum roll", "Drum rolls"] },
  };
}

function timeSignaturesRound(id, includeFiveFour) {
  const answers = ["2/4", "3/4", "4/4", "6/8", "9/8", "12/8"];
  if (includeFiveFour) answers.push("5/4");
  const answerAliases = Object.fromEntries(answers.map((answer) => [answer, [answer.replace("/", " over ")]]));
  answerAliases["4/4"].push("Common time");
  return {
    id,
    label: "Time Signatures",
    prompt: "Name time signatures.",
    answers,
    answerAliases,
  };
}

const DYNAMICS_TERMS = [
  "Forte", "Piano", "Crescendo", "Diminuendo", "Mezzo forte",
  "Mezzo piano", "Fortissimo", "Pianissimo", "Sforzando",
];

function dynamicsRound(id, termCount) {
  return {
    id,
    label: "Dynamics",
    prompt: "Name Italian terms for dynamics.",
    answers: DYNAMICS_TERMS.slice(0, termCount),
    requireFullAnswer: true,
  };
}

function formAndStructureRound(id, includeHigherForms) {
  const answers = ["Strophic", "Binary", "Rondo", "Theme and variation", "Verse and chorus", "Middle 8"];
  if (includeHigherForms) answers.push("Sonata form", "Through-composed");
  return {
    id,
    label: "Form & Structure",
    prompt: "Name musical forms and sections.",
    answers,
    answerAliases: {
      Strophic: ["Strophic form"],
      Binary: ["Binary form"],
      Rondo: ["Rondo form"],
      "Theme and variation": ["Theme and variations", "Variations on a theme", "Theme with variations"],
      "Verse and chorus": ["Verse and chorus form"],
      "Middle 8": ["Middle eight"],
      "Through-composed": ["Through composed form"],
    },
  };
}

function tonalityRound(id, includePolytonality) {
  const answers = ["Atonal", "Major", "Minor", "Modal"];
  const answerAliases = {
    Atonal: ["Atonality"],
    Major: ["Major key"],
    Minor: ["Minor key"],
    Modal: ["Modality", "Modal tonality"],
  };
  if (includePolytonality) {
    answers.push("Polytonality or bitonality");
    answerAliases["Polytonality or bitonality"] = ["Polytonality", "Bitonality", "Polytonal", "Bitonal"];
  }
  return {
    id,
    label: "Tonality",
    prompt: "Name types of tonality.",
    answers,
    answerAliases,
  };
}

function rhythmicFeaturesRound(id, includeHemiola) {
  const answers = ["3 against 2", "Time changes", "Irregular time signatures", "Triplets", "Augmentation", "Diminution"];
  if (includeHemiola) answers.push("Hemiola");
  return {
    id,
    label: "Rhythmic Features",
    prompt: "Name rhythmic features.",
    answers,
    answerAliases: {
      "3 against 2": ["2 against 3"],
      "Time changes": ["Time change", "Time signature changes", "Change of time signature", "Metre changes"],
      "Irregular time signatures": ["Irregular time signature", "Irregular time", "Irregular metre"],
      Triplets: ["Triplet"],
    },
  };
}

const LITERACY_ROUNDS = {
  N3: [
    {
      id: "literacy-n3-note-values",
      label: "Rhythms",
      prompt: "Name note values.",
      answers: N3_NOTE_VALUES,
    },
    {
      id: "literacy-n3-playing-techniques",
      label: "Playing Techniques",
      prompt: "Name ways to play instruments.",
      answers: ["Blowing", "Bowing", "Plucking", "Strumming", "Striking / hitting"],
      answerAliases: { "Striking / hitting": ["Striking", "Hitting"] },
    },
    {
      id: "literacy-n3-orchestra-families",
      label: "Orchestral Families",
      prompt: "Name the orchestral instrument families.",
      answers: ["Strings", "Brass", "Woodwind", "Percussion"],
      answerAliases: { Strings: ["String family"], Woodwind: ["Woodwinds"] },
    },
    {
      id: "literacy-n3-scottish-dance-band",
      label: "Scottish Dance Band",
      prompt: "Name instruments in a Scottish dance band.",
      answers: ["Drum kit", "Piano", "Acoustic guitar", "Fiddle", "Accordion"],
      answerAliases: { "Drum kit": ["Drum set"] },
    },
    dynamicsRound("literacy-n3-dynamics", 4),
  ],
  N4: [
    {
      id: "literacy-n4-note-values",
      label: "Rhythms",
      prompt: "Name note values.",
      answers: [...N3_NOTE_VALUES, "Quaver", "Semiquaver"],
    },
    {
      id: "literacy-n4-jazz-styles",
      label: "Ragtime",
      prompt: "Name features of ragtime.",
      answers: ["Vamp", "Syncopated melody", "Piano", "Jazz"],
    },
    dynamicsRound("literacy-n4-dynamics", 6),
    {
      id: "literacy-n4-orchestral-percussion",
      label: "Orchestral Percussion",
      prompt: "Name orchestral percussion instruments.",
      answers: ["Timpani", "Glockenspiel", "Xylophone", "Snare drum", "Bass drum", "Cymbals"],
      answerAliases: {
        Timpani: ["Kettledrums", "Kettle drums"],
        "Snare drum": ["Side drum"],
        Cymbals: ["Clash cymbals", "Crash cymbals"],
      },
    },
  ],
  N5: [
    keysRound("literacy-n5-key-signatures", false),
    scalesRound("literacy-n5-scales", NON_MINOR_SCALES),
    voiceTypesRound("literacy-n5-voice-types", false),
    timeSignaturesRound("literacy-n5-time-signatures", false),
    playingTechniquesRound("literacy-n5-playing-techniques", false),
    {
      id: "literacy-n5-tempo",
      label: "Tempo",
      prompt: "Name Italian terms for tempo.",
      answers: ["Accelerando", "Ritardando", "Rallentando", "A tempo", "Andante", "Allegro", "Adagio", "Moderato", "Rubato"],
      answerAliases: {
        Accelerando: ["Accel."],
        Ritardando: ["Rit."],
        Rallentando: ["Rall."],
        Rubato: ["Tempo rubato"],
      },
    },
    {
      id: "literacy-n5-scottish-instruments",
      label: "Scottish Instruments",
      prompt: "Name instruments used in Scottish music.",
      answers: ["Accordion", "Fiddle", "Bagpipes", "Bodhran", "Clarsach"],
      answerAliases: { Clarsach: ["Scottish harp", "Celtic harp"] },
    },
    {
      id: "literacy-n5-scottish-dances",
      label: "Scottish Dances",
      prompt: "Name types of Scottish dance music.",
      answers: ["Waltz", "Strathspey", "Reel", "Jig", "March"],
    },
    formAndStructureRound("literacy-n5-form-and-structure", false),
    {
      id: "literacy-n5-woodwind-family",
      label: "Woodwind",
      prompt: "Name orchestral woodwind instruments.",
      answers: ["Piccolo", "Flute", "Clarinet", "Bassoon", "Oboe"],
      answerAliases: { Flute: ["Concert flute"] },
    },
    {
      id: "literacy-n5-string-family",
      label: "Strings",
      prompt: "Name orchestral string instruments.",
      answers: ["Violin", "Viola", "Cello", "Double bass", "Harp"],
      answerAliases: {
        Cello: ["Violoncello"],
        "Double bass": ["Contrabass"],
        Harp: ["Pedal harp", "Concert harp"],
      },
    },
    {
      id: "literacy-n5-brass-family",
      label: "Brass",
      prompt: "Name orchestral brass instruments.",
      answers: ["Trumpet", "Tuba", "French horn", "Trombone"],
      answerAliases: { "French horn": ["Horn"] },
    },
    {
      id: "literacy-n5-scottish-styles",
      label: "Scottish Styles",
      prompt: "Name styles of Scottish music.",
      answers: ["Gaelic psalm", "Pibroch", "Celtic rock", "Scots ballad", "Bothy ballad", "Mouth music"],
      answerAliases: {
        "Gaelic psalm": ["Gaelic psalms", "Gaelic psalm singing"],
        Pibroch: ["Ceòl mòr", "Pìobaireachd"],
        "Mouth music": ["Puirt-à-beul"],
      },
    },
    dynamicsRound("literacy-n5-dynamics", DYNAMICS_TERMS.length),
    {
      id: "literacy-n5-aria",
      label: "Aria",
      prompt: "Name features of an aria.",
      answers: ["Solo voice", "Opera", "Often in Italian", "Orchestral accompaniment"],
      answerAliases: {
        "Often in Italian": ["Italian", "Italian text", "Sung in Italian"],
        "Orchestral accompaniment": ["Orchestra", "Orchestral backing"],
      },
    },
    {
      id: "literacy-n5-waulking-song",
      label: "Waulking Song",
      prompt: "Name features of a waulking song.",
      answers: ["A cappella", "Steady beat", "Gaelic text", "Call and response"],
      answerAliases: {
        "A cappella": ["No instruments", "No instrumental accompaniment"],
        "Steady beat": ["Steady pulse", "Regular beat", "Regular pulse", "On-the-beat rhythm", "Distinctive on-beat rhythm"],
        "Gaelic text": ["Gaelic", "Scottish Gaelic", "Sung in Gaelic"],
        "Call and response": ["Question and answer", "Leader answered by the group"],
      },
    },
    {
      id: "literacy-n5-bothy-ballad",
      label: "Bothy Ballad",
      prompt: "Name features of a bothy ballad.",
      answers: ["Scots language", "Singing about work or life", "A cappella", "Strophic"],
      answerAliases: {
        "Singing about work or life": ["Work or life", "Farm work", "Farm life", "Rural life", "Farm workers’ lives", "Stories about work or everyday life"],
        Strophic: ["Strophic form", "Same tune for each verse"],
      },
    },
    {
      id: "literacy-n5-baroque-features",
      label: "Baroque",
      prompt: "Name features of Baroque music.",
      answers: ["Harpsichord", "Polyphonic or contrapuntal texture", "Imitation", "Sequence", "Ornamentation"],
      answerAliases: {
        "Polyphonic or contrapuntal texture": ["Polyphonic texture", "Contrapuntal texture", "Counterpoint"],
        Imitation: ["Imitative entries"],
        Sequence: ["Melodic sequence", "Sequential repetition"],
      },
    },
    {
      id: "literacy-n5-romantic-features",
      label: "Romantic",
      prompt: "Name features of Romantic music.",
      answers: ["Chromatic", "Rubato", "Wide dynamic range", "Expressive", "Large orchestra"],
      answerAliases: {
        Chromatic: ["Chromaticism", "Chromatic harmony", "Chromatic notes"],
        Expressive: ["Expression", "Expressive melody", "Expressive melodies", "Emotional expression"],
        "Large orchestra": ["Larger orchestra", "Expanded orchestra", "Expanded orchestral forces"],
      },
    },
  ],
  H: [
    chordTypesRound("literacy-h-chord-types", false),
    {
      id: "literacy-h-cadences",
      label: "Cadences",
      prompt: "Name types of cadence.",
      answers: ["Imperfect", "Perfect", "Interrupted", "Plagal"],
      answerAliases: {
        Imperfect: ["Imperfect cadence"],
        Perfect: ["Perfect cadence"],
        Interrupted: ["Interrupted cadence"],
        Plagal: ["Plagal cadence"],
      },
    },
    scalesRound("literacy-h-scales", [...MINOR_SCALES, ...NON_MINOR_SCALES]),
    tonalityRound("literacy-h-tonality", false),
    rhythmicFeaturesRound("literacy-h-rhythmic-features", false),
    {
      id: "literacy-h-concerto-grosso",
      label: "Concerto Grosso",
      prompt: "Name features of a concerto grosso.",
      answers: ["Ripieno", "Concertino", "Ritornello", "Basso continuo"],
    },
    formAndStructureRound("literacy-h-form-and-structure", true),
    {
      id: "literacy-h-articulation-types",
      label: "Articulation & Phrasing",
      prompt: "Name articulation and phrasing markings.",
      answers: ["Slurs", "Phrase marks", "Staccato", "Accents", "Legato"],
      answerAliases: {
        Slurs: ["Slur"],
        "Phrase marks": ["Phrase mark", "Phrasing mark", "Phrasing marks"],
        Accents: ["Accent", "Accent mark", "Accent marks"],
      },
    },
    playingTechniquesRound("literacy-h-playing-techniques", true),
    {
      id: "literacy-h-mass-sections",
      label: "Mass Sections",
      prompt: "Name the five main sections of the Mass Ordinary.",
      answers: ["Kyrie", "Gloria", "Credo", "Sanctus", "Agnus Dei"],
    },
    {
      id: "literacy-h-plainchant",
      label: "Plainchant",
      prompt: "Name features of plainchant.",
      answers: ["A cappella", "Monophonic", "Latin text", "Modal"],
      answerAliases: {
        "A cappella": ["No accompaniment", "No instruments"],
        Monophonic: ["Monophony", "Monophonic texture"],
        Modal: ["Modal tonality", "Church modes"],
      },
    },
    {
      id: "literacy-h-lied",
      label: "Lied",
      prompt: "Name features of a Lied.",
      answers: ["Solo voice", "Piano", "German text", "Romantic period"],
    },
    {
      id: "literacy-h-oratorio",
      label: "Oratorio",
      prompt: "Name features of an oratorio.",
      answers: ["English or German text", "Chorus", "Story from the Bible", "Orchestral accompaniment"],
      answerAliases: {
        "English or German text": ["English", "German", "English text", "German text", "English or German"],
        "Story from the Bible": ["Bible", "Biblical story", "Biblical text", "Based on the Bible"],
        "Orchestral accompaniment": ["Orchestra", "Orchestral backing", "Accompanied by an orchestra"],
      },
    },
  ],
  AH: [
    keysRound("literacy-ah-key-signatures", true),
    chordTypesRound("literacy-ah-chord-types", true),
    {
      id: "literacy-ah-ornaments",
      label: "Ornaments",
      prompt: "Name musical ornaments.",
      answers: ["Turn", "Trill", "Acciaccatura", "Appoggiatura", "Mordent"],
      answerAliases: { Mordent: ["Lower mordent"] },
    },
    voiceTypesRound("literacy-ah-voice-types", true),
    {
      id: "literacy-ah-serial-music",
      label: "Serial Music",
      prompt: "Name features of twelve-tone music.",
      answers: ["Retrograde", "Inversion", "Tone row", "Atonal"],
      answerAliases: {
        "Tone row": ["Note row", "Twelve-tone row", "Twelve-note row", "Tone row or note row"],
        Atonal: ["Atonality"],
      },
    },
    {
      id: "literacy-ah-fugue",
      label: "Fugue",
      prompt: "Name features of a fugue.",
      answers: ["Subject", "Countersubject", "Answer", "Stretto", "Polyphonic", "Imitation"],
      answerAliases: {
        Countersubject: ["Counter-subject"],
        Polyphonic: ["Polyphony", "Polyphonic texture"],
      },
    },
    tonalityRound("literacy-ah-tonality", true),
    rhythmicFeaturesRound("literacy-ah-rhythmic-features", true),
    {
      id: "literacy-ah-interval-types",
      label: "Intervals",
      prompt: "Name types of interval.",
      answers: ["Tritone", "Semitone", "Tone", "Octave"],
      answerAliases: {
        Tritone: ["Augmented fourth", "Diminished fifth"],
        Semitone: ["Half step"],
        Tone: ["Whole tone", "Whole step"],
        Octave: ["Perfect octave"],
      },
    },
    timeSignaturesRound("literacy-ah-time-signatures", true),
    {
      id: "literacy-ah-texture-types",
      label: "Texture",
      prompt: "Name types of texture.",
      answers: ["Homophonic", "Polyphonic", "Contrapuntal", "Antiphonal"],
      answerAliases: {
        Homophonic: ["Homophony", "Homophonic texture"],
        Polyphonic: ["Polyphony", "Polyphonic texture"],
        Contrapuntal: ["Counterpoint", "Contrapuntal texture"],
        Antiphonal: ["Antiphonal texture"],
      },
    },
    {
      id: "literacy-ah-repeat-navigation",
      label: "Repeats & Navigation",
      prompt: "Name repeat and navigation marks.",
      answers: ["Da capo", "Dal segno", "Fine", "Coda", "First and second time bars"],
      answerAliases: {
        "Da capo": ["D.C.", "DC"],
        "Dal segno": ["D.S.", "DS"],
        Coda: ["Coda sign", "Coda symbol"],
        "First and second time bars": ["1st and 2nd time bars", "First and second endings", "1st and 2nd endings", "Alternate endings", "Volta brackets"],
      },
    },
    {
      id: "literacy-ah-renaissance-styles",
      label: "Renaissance Styles",
      prompt: "Name Renaissance styles.",
      answers: ["Pavan", "Galliard", "Motet", "Ayre or air", "Ballett", "Madrigal", "Anthem"],
      answerAliases: {
        Pavan: ["Pavane"],
        "Ayre or air": ["Ayre", "Air", "Ayre / air"],
        Ballett: ["Ballet"],
      },
    },
    {
      id: "literacy-ah-chorale",
      label: "Chorale",
      prompt: "Name features of a chorale.",
      answers: ["German text", "Mainly homophonic", "SATB choir", "Religious"],
      answerAliases: {
        "Mainly homophonic": ["Homophonic", "Homophony", "Chordal texture"],
        "SATB choir": ["SATB", "Soprano, alto, tenor and bass", "Four-part choir", "Four-part mixed choir"],
        Religious: ["Sacred", "Sacred text", "Religious text"],
      },
    },
    {
      id: "literacy-ah-ayre",
      label: "Ayre",
      prompt: "Name features of an ayre.",
      answers: ["Solo voice", "English text", "Accompanied", "Often melancholic"],
      answerAliases: {
        "English text": ["English", "English words", "English lyrics"],
        Accompanied: ["Lute", "Lute accompaniment", "Accompanied by a lute"],
        "Often melancholic": ["Melancholy", "Reflective", "Sad", "Sad mood"],
      },
    },
    {
      id: "literacy-ah-ballett",
      label: "Ballett",
      prompt: "Name features of a ballett.",
      answers: ["A cappella", "English text", "Secular music", "Imitative", "Fa-la-la refrain"],
      answerAliases: {
        "English text": ["English", "English words", "English lyrics"],
        "Secular music": ["Secular", "Secular text", "Non-religious text"],
        Imitative: ["Imitation", "Imitative entries", "Imitative texture"],
        "Fa-la-la refrain": ["Fa-la-la", "Falala", "Falalala", "Fa-la-la chorus"],
      },
    },
  ],
};

function getRoundLibrary(level, customCategories, overrides) {
  const builtInRounds = LITERACY_ROUNDS[level] ?? [];
  const customRounds = customCategories.flatMap((category) => category.questions.map((question, index) => ({
    ...question,
    id: `${category.id}-question-${index}`,
    label: category.questions.length > 1 ? `${category.name} · ${index + 1}` : category.name,
  })));
  const rounds = [...builtInRounds, ...customRounds];
  return rounds.map((question) => preparePlayableRound({ ...question, ...overrides[question.id], id: question.id })).filter(Boolean);
}

const FF_LOGO = "./familyfortunes/familyfortunes-logo.png?v=20260928-hd-logo";

function FamilyFortunesRoundBoard({ board, questionAction, onMark, canMarkAnswer }) {
  const { teamNames, scores, strikes, activeTeam, roundIndex, roundCount, question, countdown, seconds, answers, revealed, recentAnswer, points } = board;
  const answerItems = answers.map((answer, index) => ({ answer, index }));
  const split = Math.ceil(answerItems.length / 2);
  const groups = answers.length > 5 ? [answerItems.slice(0, split), answerItems.slice(split)] : [answerItems];
  const strikeColumn = (team) => <div className="ff-strikes" role="group" aria-label={`${teamNames[team]} strikes: ${strikes[team]} of 3`}>
    {[0, 1, 2].map((strike) => <span key={strike} className={`ff-x ${strike < strikes[team] ? "is-used" : ""}`} aria-hidden="true">×</span>)}
  </div>;

  return <>
    {seconds !== null && <FamilyFortunesTimer seconds={seconds} />}
    <div className="ff-game-header">
      <div className="ff-scoreboard ff-scoreboard-game">
        {teamNames.map((name, index) => <div key={index} className={`ff-team${index === 1 ? " is-reversed" : ""}${activeTeam === index ? " is-active" : ""}${strikes[index] >= 3 ? " is-out" : ""}`}>
          <FittedName className="ff-team-name-display" name={name} />
          <div className="ff-score" aria-label={`${name}: ${scores[index]} cumulative points`}>{scores[index]}</div>
        </div>)}
        <div className="ff-logo-shine ff-game-logo"><img className="ff-brand-logo" src={FF_LOGO} alt="Family Fortunes" /></div>
      </div>
      <div className="ff-round-count ff-round-count-bottom">Round {roundIndex + 1} of {roundCount}</div>
    </div>
    <div className="ff-question-board-panel">
      <div className="ff-round-bank ff-question-panel">
        {questionAction ?? (countdown !== null
          ? <p className="ff-projector-countdown">{countdown}</p>
          : <h1 className="ff-question">{question}</h1>)}
      </div>
      <div className="ff-board">
        {strikeColumn(0)}
        <div className={`ff-answer-board${groups.length > 1 ? " is-two-column" : ""}`} aria-label="Answer board">
          {groups.map((group, groupIndex) => <div className="ff-answer-column" key={groupIndex}>
            {group.map(({ answer, index }) => {
              const isRevealed = revealed.includes(index);
              const Slot = onMark ? "button" : "div";
              const controls = onMark ? {
                type: "button", disabled: !canMarkAnswer || isRevealed, onClick: () => onMark(index),
                "aria-label": `Answer ${index + 1}: ${answer}${isRevealed ? ", revealed" : ""}`,
              } : {};
              return <Slot key={`${roundIndex}-${index}`} className={`ff-answer-slot${onMark ? " ff-teacher-answer-slot" : ""}${isRevealed ? " is-revealed" : ""}${index === recentAnswer ? " is-recent" : ""}`} {...controls}>
                <span className="ff-answer-number">{index + 1}</span>
                <span className="ff-answer-text">{(onMark || isRevealed) && <FittedName className="ff-answer-label" name={answer} />}</span>
              </Slot>;
            })}
          </div>)}
          <div className="ff-round-count ff-round-total-count" aria-label={`Points bank: ${points}`}>Points bank: {points}</div>
        </div>
        {strikeColumn(1)}
      </div>
    </div>
  </>;
}

function RoundWinAnnouncement({ result, onContinue, disabled, modal = false }) {
  const titleId = React.useId();
  return <div className="ff-overlay-backdrop ff-steal-announcement-backdrop">
    <section className="ff-modal ff-steal-announcement" role={modal ? "dialog" : "status"} aria-modal={modal || undefined}
      aria-labelledby={titleId} tabIndex={modal ? -1 : undefined}>
      <h2 id={titleId}>{result.teamName} won the round!</h2>
      <p className="ff-round-win-points">{result.points} {result.points === 1 ? "point" : "points"} earned</p>
      {onContinue && <button className="ff-opening-button ff-opening-primary" type="button" disabled={disabled} onClick={onContinue}><span>Continue</span></button>}
    </section>
  </div>;
}

function FamilyFortunesContestants({ teamNames, playerNames, onBuzz, disabled, spinning }) {
  return <div className="ff-buzzer-buttons">
    {teamNames.map((name, index) => {
      const playerName = playerNames[index];
      const Player = onBuzz ? "button" : "div";
      const controls = onBuzz ? {
        type: "button", disabled,
        "aria-label": `${playerName} from ${name}${disabled ? "" : " buzzed first"}`,
        onClick: () => onBuzz(index),
      } : {};
      return <React.Fragment key={index}>
        <Player className={`ff-opening-button ff-opening-secondary ff-faceoff-player-button${spinning ? " is-spinning" : ""}`} {...controls}>
          <FittedName className="ff-faceoff-person" name={playerName} />
          <span className="ff-faceoff-divider" aria-hidden="true" />
          <FittedName className="ff-faceoff-team" name={name} />
        </Player>
        {index === 0 && <span className="ff-faceoff-versus">vs.</span>}
      </React.Fragment>;
    })}
  </div>;
}

function FamilyFortunesGame() {
  const [screen, setScreen] = useState("setup");
  const [initialTeamRoster] = useState(readTeamRoster);
  const [teamNames, setTeamNames] = useState(initialTeamRoster.teamNames);
  const [teamMembers, setTeamMembers] = useState(initialTeamRoster.teamMembers);
  const [rosterError, setRosterError] = useState("");
  const [options, setOptions] = window.MLH.useProfileState("options", readGameOptions);
  const level = options.level || "H";
  const [customCategories, setCustomCategories] = window.MLH.useProfileState("customCategories", readCustomCategories);
  const [roundOverrides, setRoundOverrides] = window.MLH.useProfileState("roundOverrides", () => readRoundOverrides(level));
  const allQuestions = getRoundLibrary(level, customCategories, roundOverrides);
  const availableQuestionIds = allQuestions.map((question) => question.id);
  const availableQuestionIdsKey = availableQuestionIds.join("|");
  const [selectedQuestionIds, setSelectedQuestionIds] = window.MLH.useProfileState("selectedQuestionIds", () => readSelectedQuestionIds(availableQuestionIds, level));
  useEffect(() => {
    setSelectedQuestionIds((current) => {
      const filtered = current.filter((id) => availableQuestionIds.includes(id));
      if (filtered.length < Math.min(3, availableQuestionIds.length)) return availableQuestionIds;
      return filtered.length === current.length ? current : filtered;
    });
  }, [availableQuestionIdsKey]);
  const canChooseRoundCount = selectedQuestionIds.length >= 3;
  const roundsToPlay = Math.max(3, Math.min(options.roundsToPlay, selectedQuestionIds.length));
  const [roundLibraryError, setRoundLibraryError] = useState("");
  const [editingRoundId, setEditingRoundId] = useState(null);
  const [gameRounds, setGameRounds] = useState([]);
  const [roundIndex, setRoundIndex] = useState(0);
  const [scores, setScores] = useState([0, 0]);
  const [roundPoints, setRoundPoints] = useState(0);
  const [lastRoundResult, setLastRoundResult] = useState(null);
  const [roundEndCueRequested, setRoundEndCueRequested] = useState(false);
  const [roundEndMusicReady, setRoundEndMusicReady] = useState(false);
  const [answerSequencePlaying, setAnswerSequencePlaying] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === document.documentElement);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  async function toggleFullscreen() {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenError("Full screen could not open. Please try again.");
    }
  }
  const [soundEnabled, setSoundEnabled] = useState(false);
  const [buzzerPair, setBuzzerPair] = useState(() => BUZZER_SOUNDS.slice(0, 2));
  const [strikes, setStrikes] = useState([0, 0]);
  const [stealRevealMode, setStealRevealMode] = useState(false);
  const [recentCorrectAnswerIndex, setRecentCorrectAnswerIndex] = useState(null);
  const [currentTeam, setCurrentTeam] = useState(0);
  const [roundController, setRoundController] = useState(0);
  const [stealTeam, setStealTeam] = useState(null);
  const [memberQueues, setMemberQueues] = useState([[], []]);
  const [faceoffPlayers, setFaceoffPlayers] = useState([0, 0]);
  const [faceoffPhase, setFaceoffPhase] = useState("ready");
  const [spinningNames, setSpinningNames] = useState(["", ""]);
  const [typedPrompt, setTypedPrompt] = useState("");
  const [faceoffCountdown, setFaceoffCountdown] = useState(3);
  const [faceoffAttemptTeam, setFaceoffAttemptTeam] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(ANSWER_TIME_SECONDS);
  const [answerDeadline, setAnswerDeadline] = useState(null);
  const [revealed, setRevealed] = useState([]);
  const [feedback, setFeedback] = useState("");
  const [feedbackKind, setFeedbackKind] = useState("");
  const [overlay, setOverlay] = useState(null);
  const [pendingGame, setPendingGame] = useState(null);
  const [teacherWindowStatus, setTeacherWindowStatus] = useState(null);
  const [usesTeacherControls, setUsesTeacherControls] = useState(false);
  const [projectorMaximised, setProjectorMaximised] = useState(false);
  const [answerEntry, setAnswerEntry] = useState("");
  const [answerKeyOpen, setAnswerKeyOpen] = useState(false);
  const [categoryNameDraft, setCategoryNameDraft] = useState("");
  const [questionDrafts, setQuestionDrafts] = useState([{ prompt: "", answers: Array(MIN_ANSWERS_PER_QUESTION).fill("") }]);
  const [categoryError, setCategoryError] = useState("");
  const [levelOpen, setLevelOpen] = useState(false);
  const [customiseOpen, setCustomiseOpen] = useState(false);
  const stageRef = useRef(null);
  const answerKeyToggleRef = useRef(null);
  const answerKeyPopoverRef = useRef(null);
  const levelRef = useRef(null);
  const customiseRef = useRef(null);
  const teacherConnectionRef = useRef(null);
  const teacherStateRef = useRef(null);
  const teacherCommandsRef = useRef(new Map());
  const roundMenuScrollTopRef = useRef(0);
  const answerSequenceRef = useRef(false);
  const answerSequenceAudioRef = useRef(null);
  const answerSequenceGenerationRef = useRef(0);
  const answerSequenceCancelRef = useRef(null);
  const audienceFadeCancelRef = useRef(null);
  const roundEndCuePendingRef = useRef(false);
  const musicTrackRef = useRef(null);
  const buzzerPlayerRef = useRef(null);
  const firstTouchBuzzerRef = useRef(null);
  const buzzerFullscreenRef = useRef(null);
  const soundEnabledRef = useRef(false);
  const audioElementsRef = useRef(new Set());
  const previouslyFocusedRef = useRef(null);
  const round = gameRounds[roundIndex];
  const answerItems = round?.answers.map((answer, index) => ({ answer, index })) ?? [];
  const hasLiveRound = ["faceoff", "faceoff-choice", "game", "steal", "round-end"].includes(screen) && Boolean(round);
  const roundOver = screen === "round-end";
  const roundWin = overlay === "round-win" && lastRoundResult
    ? { teamName: teamNames[lastRoundResult.winningTeam], points: lastRoundResult.points }
    : null;
  const isFinalRound = roundIndex + 1 === gameRounds.length;
  const allRoundAnswersRevealed = Boolean(round) && round.answers.every((_, index) => revealed.includes(index));
  const activeLevelLabel = LEVEL_MENU[level].label;
  const levelUnavailable = screen !== "setup";
  const allowOverlayLevelChange = !fullscreen && overlay === "how-to";
  const createAudio = (source) => {
    const audio = new Audio(source);
    audio.muted = !soundEnabledRef.current;
    audioElementsRef.current.add(audio);
    return audio;
  };

  useEffect(() => {
    if (roundOver && isFinalRound && allRoundAnswersRevealed && !answerSequencePlaying && !overlay) setScreen("final");
  }, [roundOver, isFinalRound, allRoundAnswersRevealed, answerSequencePlaying, overlay]);

  useEffect(() => {
    setAnswerKeyOpen(false);
  }, [screen, roundIndex, overlay]);

  useEffect(() => {
    if (!answerKeyOpen) return undefined;
    const dismissOnOutsideClick = (event) => {
      if (answerKeyPopoverRef.current?.contains(event.target) || answerKeyToggleRef.current?.contains(event.target)) return;
      setAnswerKeyOpen(false);
    };
    const dismissOnEscape = (event) => {
      if (event.key !== "Escape") return;
      setAnswerKeyOpen(false);
      answerKeyToggleRef.current?.focus({ preventScroll: true });
    };
    document.addEventListener("pointerdown", dismissOnOutsideClick);
    document.addEventListener("keydown", dismissOnEscape);
    return () => {
      document.removeEventListener("pointerdown", dismissOnOutsideClick);
      document.removeEventListener("keydown", dismissOnEscape);
    };
  }, [answerKeyOpen]);

  useLayoutEffect(() => {
    if (!customiseOpen || overlay) return;
    const scroller = document.querySelector("#ff-customise-menu > .hub-menu-scroll");
    if (scroller) scroller.scrollTop = roundMenuScrollTopRef.current;
    roundMenuScrollTopRef.current = 0;
  }, [customiseOpen, overlay]);

  const closeTeacherWindow = () => {
    const connection = teacherConnectionRef.current;
    if (!connection) return;
    teacherConnectionRef.current = null;
    window.clearTimeout(connection.openTimeout);
    window.clearTimeout(connection.leaveTimeout);
    connection.channel.postMessage({ type: "game-closed" });
    connection.channel.close();
    connection.popup?.close();
  };

  useEffect(() => {
    window.addEventListener("pagehide", closeTeacherWindow);
    return () => {
      window.removeEventListener("pagehide", closeTeacherWindow);
      closeTeacherWindow();
    };
  }, []);

  const launchTeacherWindow = (connection, onTimeout) => {
    window.clearTimeout(connection.openTimeout);
    connection.popup = window.open(connection.url, connection.name, "popup,width=800,height=660,resizable,scrollbars");
    // Some browsers open the tab without returning a usable WindowProxy.
    connection.openTimeout = window.setTimeout(onTimeout, 5000);
  };

  const openTeacherControls = (onReady) => {
    if (teacherConnectionRef.current) return;
    const channelName = `mlh-family-fortunes-${crypto.getRandomValues(new Uint32Array(4)).join("-")}`;
    const channel = new BroadcastChannel(channelName);
    const url = new URL("./familyfortunes/teacher-controls.html", document.baseURI);
    url.hash = channelName;
    const connection = { channel, url: url.href, name: channelName, popup: null, openTimeout: null, leaveTimeout: null };
    teacherConnectionRef.current = connection;
    setTeacherWindowStatus("opening");
    channel.onmessage = ({ data }) => {
      if (data?.type === "ready") {
        window.clearTimeout(connection.openTimeout);
        window.clearTimeout(connection.leaveTimeout);
        setTeacherWindowStatus("connected");
        channel.postMessage(teacherStateRef.current?.state ?? null);
        onReady?.();
        onReady = null;
      } else if (data?.type === "leaving") {
        window.clearTimeout(connection.leaveTimeout);
        connection.leaveTimeout = window.setTimeout(() => setTeacherWindowStatus("disconnected"), 750);
      } else if (data?.type === "command" && data.revision === teacherStateRef.current?.state.revision) {
        const command = teacherCommandsRef.current.get(data.id);
        if (!command) return;
        if (data.id === "mark" && data.index !== -1) {
          const { answers, revealed } = teacherStateRef.current.state.view.board;
          if (!Number.isInteger(data.index) || data.index < 0 || data.index >= answers.length || revealed.includes(data.index)) return;
        }
        // Only one command may act on a given view, even if two clicks arrive before React commits.
        if (data.id !== "projector") teacherCommandsRef.current.clear();
        command(data.index);
      }
    };
    launchTeacherWindow(connection, () => {
      closeTeacherWindow();
      setTeacherWindowStatus("blocked");
    });
  };

  const reopenTeacherControls = () => {
    const connection = teacherConnectionRef.current;
    if (!connection) return;
    setTeacherWindowStatus("reopening");
    launchTeacherWindow(connection, () => setTeacherWindowStatus("disconnected"));
  };

  useEffect(() => {
    if (!usesTeacherControls || teacherWindowStatus !== "connected") return undefined;
    const timer = window.setInterval(() => {
      if (teacherConnectionRef.current?.popup?.closed) setTeacherWindowStatus("disconnected");
    }, 1000);
    return () => window.clearInterval(timer);
  }, [usesTeacherControls, teacherWindowStatus]);

  const releaseAudio = (audio) => {
    if (!audio) return;
    const fade = globalThis.MLH?.fadeOutAudio?.(audio);
    if (!fade) audio.pause();
    Promise.resolve(fade).then(() => { audio.src = ""; });
    audioElementsRef.current.delete(audio);
  };
  const toggleSound = () => {
    const enabled = !soundEnabledRef.current;
    soundEnabledRef.current = enabled;
    audioElementsRef.current.forEach((audio) => { audio.muted = !enabled; });
    setSoundEnabled(enabled);
  };
  const stopBuzzers = () => {
    buzzerPlayerRef.current?.stop();
    buzzerPlayerRef.current = null;
    firstTouchBuzzerRef.current = null;
  };
  const pressBuzzer = (id, button, touch = false) => {
    if (touch) {
      const pressedAt = performance.now();
      const first = firstTouchBuzzerRef.current;
      if (!first || pressedAt - first.pressedAt >= TOUCH_BUZZER_GAP_MS) {
        firstTouchBuzzerRef.current = { id, pressedAt };
      } else if (id !== first.id) {
        return;
      }
    }
    buzzerPlayerRef.current?.play(id);
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      button.firstElementChild.animate([
        { transform: "translateY(5px) scale(.97)" },
        { transform: "translateY(-3px)", offset: .55 },
        { transform: "translateY(0)" },
      ], { duration: 280, easing: "ease-out" });
    }
  };
  useEffect(() => stopBuzzers, []);
  const musicMode = answerSequencePlaying ? null
    : screen === "setup" ? "menu"
    : screen === "final" ? null
      : roundEndCueRequested ? roundEndMusicReady ? "menu" : null
        : screen === "steal" || (screen === "faceoff" && ["countdown", "typing", "buzzer"].includes(faceoffPhase)) ? "steal"
          : ["faceoff", "faceoff-choice", "game"].includes(screen) ? "game" : null;
  const roundEndCueMode = answerSequencePlaying ? null
    : screen === "final" ? "final"
      : roundEndCueRequested && !isFinalRound ? "round" : null;

  useEffect(() => {
    try { window.localStorage.setItem(CUSTOM_CATEGORY_STORAGE_KEY, JSON.stringify(customCategories)); } catch { /* Storage may be unavailable for private file origins. */ }
  }, [customCategories]);

  useEffect(() => {
    try { window.localStorage.setItem(levelStorageKey(ROUND_OVERRIDE_STORAGE_KEY, level), JSON.stringify(roundOverrides)); } catch { /* Storage may be unavailable for private file origins. */ }
  }, [roundOverrides, level]);

  useEffect(() => {
    const all = availableQuestionIds.every((id) => selectedQuestionIds.includes(id));
    try { window.localStorage.setItem(levelStorageKey(SELECTED_ROUNDS_STORAGE_KEY, level), JSON.stringify({ version: 3, all, ids: selectedQuestionIds })); } catch { /* Storage may be unavailable for private file origins. */ }
  }, [selectedQuestionIds, level, availableQuestionIdsKey]);

  useEffect(() => {
    try { window.localStorage.setItem(OPTIONS_STORAGE_KEY, JSON.stringify(options)); } catch { /* Storage may be unavailable for private file origins. */ }
  }, [options]);

  useEffect(() => {
    if (!musicMode) return undefined;
    const playbackEvents = ["pointerdown", "touchend", "click", "keydown"];
    if (musicMode === "steal") {
      let activeTrack = createAudio("./familyfortunes/familyfortunes-audio/steal.mp3");
      let nextTrack = createAudio("./familyfortunes/familyfortunes-audio/steal.mp3");
      [activeTrack, nextTrack].forEach((track) => { track.preload = "auto"; track.loop = false; });
      activeTrack.volume = 1;
      nextTrack.volume = 0;
      let crossfading = false;
      let animationFrame = null;
      const startTrack = () => {
        if (activeTrack.paused) activeTrack.play().catch(() => {});
      };
      const updateCrossfade = () => {
        const duration = activeTrack.duration;
        if (!crossfading && Number.isFinite(duration) && duration > 3 && duration - activeTrack.currentTime <= 3) {
          crossfading = true;
          nextTrack.currentTime = 0;
          nextTrack.volume = 0;
          nextTrack.play().catch(() => { crossfading = false; });
        }
        if (crossfading && Number.isFinite(duration) && duration > 3) {
          const progress = Math.max(0, Math.min(1, (activeTrack.currentTime - (duration - 3)) / 3));
          activeTrack.volume = 1 - progress;
          nextTrack.volume = progress;
        }
        animationFrame = window.requestAnimationFrame(updateCrossfade);
      };
      const handleEnded = (event) => {
        if (event.currentTarget !== activeTrack) return;
        (globalThis.MLH?.fadeOutAudio?.(activeTrack) || activeTrack.pause());
        activeTrack.currentTime = 0;
        activeTrack.volume = 0;
        [activeTrack, nextTrack] = [nextTrack, activeTrack];
        activeTrack.volume = 1;
        nextTrack.volume = 0;
        crossfading = false;
        startTrack();
      };
      activeTrack.addEventListener("ended", handleEnded);
      nextTrack.addEventListener("ended", handleEnded);
      startTrack();
      animationFrame = window.requestAnimationFrame(updateCrossfade);
      playbackEvents.forEach((eventType) => window.addEventListener(eventType, startTrack));
      return () => {
        playbackEvents.forEach((eventType) => window.removeEventListener(eventType, startTrack));
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
        activeTrack.removeEventListener("ended", handleEnded);
        nextTrack.removeEventListener("ended", handleEnded);
        [activeTrack, nextTrack].forEach(releaseAudio);
      };
    }
    const track = createAudio(`./familyfortunes/familyfortunes-audio/${musicMode === "menu" ? "1theme.mp3" : "headtohead.mp3"}`);
    track.loop = true;
    track.preload = "auto";
    musicTrackRef.current = track;
    const startTrack = () => {
      if (track.paused) track.play().catch(() => {});
    };
    startTrack();
    playbackEvents.forEach((eventType) => window.addEventListener(eventType, startTrack));
    return () => {
      playbackEvents.forEach((eventType) => window.removeEventListener(eventType, startTrack));
      track.currentTime = 0;
      releaseAudio(track);
      if (musicTrackRef.current === track) musicTrackRef.current = null;
    };
  }, [musicMode]);

  useEffect(() => {
    if (!roundEndCueMode) return undefined;
    const cue = createAudio("./familyfortunes/familyfortunes-audio/win-round.mp3");
    const audienceCue = createAudio("./familyfortunes/familyfortunes-audio/audience.mp3");
    cue.preload = "auto";
    audienceCue.preload = "auto";
    audienceCue.volume = 0.5;
    let finished = false;
    const finishCue = () => {
      if (finished) return;
      finished = true;
      setRoundEndMusicReady(true);
    };
    cue.addEventListener("ended", finishCue);
    cue.addEventListener("error", finishCue);
    cue.play().catch(finishCue);
    audienceCue.play().catch(() => {});
    return () => {
      cue.removeEventListener("ended", finishCue);
      cue.removeEventListener("error", finishCue);
      releaseAudio(cue);
      releaseAudio(audienceCue);
    };
  }, [roundEndCueMode]);

  window.MLH.useClickOutside(
    [levelRef, customiseRef],
    [() => setLevelOpen(false), () => setCustomiseOpen(false)],
  );

  const showOverlay = (nextOverlay) => {
    if (!overlay) {
      previouslyFocusedRef.current = customiseOpen
        ? customiseRef.current?.querySelector("[data-menu-trigger]")
        : document.activeElement;
    }
    setLevelOpen(false);
    setCustomiseOpen(false);
    setOverlay(nextOverlay);
  };

  const openBuzzers = () => {
    const [left, right] = shuffledIndexes(BUZZER_SOUNDS.length);
    const pair = [BUZZER_SOUNDS[left], BUZZER_SOUNDS[right]];
    stopBuzzers();
    buzzerPlayerRef.current = createBuzzerPlayer(pair);
    setBuzzerPair(pair);
    showOverlay("buzzers");
    // iPad Safari can identify itself as a Mac when requesting desktop sites.
    const isIPad = /iPad/.test(navigator.userAgent)
      || (/Macintosh/.test(navigator.userAgent) && navigator.maxTouchPoints > 1);
    if (!isIPad && !document.fullscreenElement && document.fullscreenEnabled) {
      buzzerFullscreenRef.current = document.documentElement.requestFullscreen().catch(() => {});
    }
  };

  const restoreSavedRoster = () => {
    const savedRoster = readTeamRoster();
    setTeamNames(savedRoster.teamNames);
    setTeamMembers(savedRoster.teamMembers);
  };

  const closeOverlay = () => {
    setLevelOpen(false);
    if (overlay === "buzzers") {
      stopBuzzers();
      const request = buzzerFullscreenRef.current;
      buzzerFullscreenRef.current = null;
      request?.then(() => {
        if (!buzzerFullscreenRef.current && document.fullscreenElement === document.documentElement) {
          document.exitFullscreen().catch(() => {});
        }
      });
    }
    if (overlay === "create-category") {
      setOverlay(null);
      setCustomiseOpen(true);
      return;
    }
    if (overlay === "teacher-controls") {
      closeTeacherWindow();
      setTeacherWindowStatus(null);
      setPendingGame(null);
      setOverlay("roster");
      return;
    }
    if (overlay === "roster") {
      restoreSavedRoster();
      setRosterError("");
    }
    setOverlay(null);
  };

  useEffect(() => {
    if (!overlay) return undefined;
    const dialog = document.querySelector(".ff-overlay-backdrop [role='dialog']");
    if (!dialog) return undefined;
    const overlayLevelMenu = allowOverlayLevelChange ? levelRef.current : null;
    const isolatedSiblings = [];
    let activeBranch = dialog;
    while (activeBranch.parentElement && activeBranch.parentElement !== document.body) {
      [...activeBranch.parentElement.children].forEach((sibling) => {
        if (sibling === activeBranch || !(sibling instanceof HTMLElement)) return;
        if (overlayLevelMenu && sibling.contains(overlayLevelMenu)) return;
        isolatedSiblings.push({ element: sibling, ariaHidden: sibling.getAttribute("aria-hidden"), inert: sibling.inert });
        sibling.setAttribute("aria-hidden", "true");
        sibling.inert = true;
      });
      activeBranch = activeBranch.parentElement;
    }
    const focusableSelector = "button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [href], [tabindex]:not([tabindex='-1'])";
    const focusFirst = window.requestAnimationFrame(() => {
      const firstFocusable = dialog.querySelector(focusableSelector);
      (firstFocusable || dialog).focus({ preventScroll: true });
    });
    const handleDialogKeys = (event) => {
      if (event.key === "Escape" && overlay !== "steal-announcement" && overlay !== "round-win") {
        event.preventDefault();
        if (overlayLevelMenu?.querySelector("[data-menu-panel]")) {
          setLevelOpen(false);
          overlayLevelMenu.querySelector("[data-menu-trigger]")?.focus({ preventScroll: true });
          return;
        }
        closeOverlay();
        return;
      }
      if (event.key !== "Tab") return;
      const focusable = [
        ...(overlayLevelMenu?.querySelectorAll(focusableSelector) ?? []),
        ...dialog.querySelectorAll(focusableSelector),
      ].filter((element) => element.getClientRects().length && element.getAttribute("aria-hidden") !== "true");
      if (!focusable.length) {
        event.preventDefault();
        dialog.focus();
        return;
      }
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };
    document.addEventListener("keydown", handleDialogKeys);
    return () => {
      window.cancelAnimationFrame(focusFirst);
      document.removeEventListener("keydown", handleDialogKeys);
      isolatedSiblings.forEach(({ element, ariaHidden, inert }) => {
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
        element.inert = inert;
      });
      window.requestAnimationFrame(() => {
        if (!document.querySelector(".ff-overlay-backdrop [role='dialog']")) previouslyFocusedRef.current?.focus?.();
      });
    };
  }, [overlay, allowOverlayLevelChange]);

  const openRosterSetup = () => {
    if (selectedQuestionIds.length < 3) {
      setLevelOpen(false);
      setCustomiseOpen(true);
      return;
    }
    const savedRoster = readTeamRoster();
    setTeamNames(savedRoster.teamNames);
    setTeamMembers(savedRoster.teamMembers);
    setRosterError("");
    showOverlay("roster");
  };

  const changeTeamName = (team, value) => setTeamNames((names) => names.map((name, index) => index === team ? capitalizeFirstLetter(value) : name));
  const updateTeamMember = (team, member, value) => setTeamMembers((rosters) => rosters.map((roster, index) => index === team ? roster.map((name, item) => item === member ? capitalizeFirstLetter(value) : name) : roster));
  const addTeamMember = (team) => setTeamMembers((rosters) => rosters.map((roster, index) => index === team ? [...roster, ""] : roster));
  const removeTeamMember = (team, member) => setTeamMembers((rosters) => rosters.map((roster, index) => index === team && roster.length > 1 ? roster.filter((_, item) => item !== member) : roster));

  const prepareGame = (event) => {
    event.preventDefault();
    const availableRounds = selectedQuestionIds.map((id) => allQuestions.find((question) => question.id === id)).filter(Boolean);
    if (availableRounds.length < 3) {
      setRosterError("Select at least 3 rounds in Customise before you play.");
      return;
    }
    const invalidRound = availableRounds.find((question) => !question.label?.trim() || !question.prompt.trim() || question.answers.length < MIN_ANSWERS_PER_QUESTION || question.answers.length > MAX_ANSWERS_PER_QUESTION || question.answers.some((answer) => !answer.trim()) || new Set(question.answers.map(cleanAnswer)).size !== question.answers.length);
    if (invalidRound) {
      setRoundLibraryError(`Complete “${invalidRound.label || "Untitled round"}” with a question and ${MIN_ANSWERS_PER_QUESTION}–${MAX_ANSWERS_PER_QUESTION} different answers before starting.`);
      setOverlay(null);
      setCustomiseOpen(true);
      return;
    }
    const namedMembers = teamMembers.map((roster) => roster.map((name) => name.trim()).filter(Boolean));
    if (namedMembers.some((roster) => !roster.length)) {
      setRosterError("Enter at least one member name for each team.");
      return;
    }
    setRosterError("");
    setPendingGame({ availableRounds, namedMembers });
    setOverlay("teacher-controls");
  };

  const beginGame = (withTeacherControls) => {
    if (!withTeacherControls) closeTeacherWindow();
    const { availableRounds, namedMembers } = pendingGame;
    setPendingGame(null);
    setTeacherWindowStatus(withTeacherControls ? "connected" : null);
    setUsesTeacherControls(withTeacherControls);
    const namedTeams = teamNames.map((name, index) => name.trim() || `Team ${index + 1}`);
    const shuffledQueues = namedMembers.map((roster) => shuffledIndexes(roster.length));
    const firstDeal = dealFaceoff(shuffledQueues, namedMembers);
    setTeamNames(namedTeams);
    setTeamMembers(namedMembers);
    try { window.localStorage.setItem(TEAM_ROSTER_STORAGE_KEY, JSON.stringify({ teamNames: namedTeams, teamMembers: namedMembers })); } catch { /* Storage may be unavailable for private file origins. */ }
    const orderedRounds = shuffledIndexes(availableRounds.length).map((index) => availableRounds[index]);
    setGameRounds(orderedRounds.slice(0, roundsToPlay));
    setScores([0, 0]);
    setRoundIndex(0);
    setRoundPoints(0);
    setLastRoundResult(null);
    setRoundEndCueRequested(false);
    setRoundEndMusicReady(false);
    setRoundController(0);
    setStealTeam(null);
    setStrikes([0, 0]);
    setStealRevealMode(false);
    setRevealed([]);
    setRecentCorrectAnswerIndex(null);
    setFeedback("");
    setFeedbackKind("");
    setMemberQueues(firstDeal.queues);
    setFaceoffPlayers(firstDeal.players);
    setFaceoffPhase("ready");
    setSpinningNames(namedTeams);
    setTypedPrompt("");
    setFaceoffAttemptTeam(null);
    setLevelOpen(false);
    setOverlay(null);
    setScreen("faceoff");
    window.requestAnimationFrame(() => {
      stageRef.current?.scrollTo({ top: 0, behavior: "instant" });
      window.scrollTo({ top: 0, behavior: "instant" });
    });
  };

  const resetGame = () => {
    closeTeacherWindow();
    setTeacherWindowStatus(null);
    setUsesTeacherControls(false);
    setProjectorMaximised(false);
    setAnswerEntry("");
    stopBuzzers();
    setAnswerDeadline(null);
    answerSequenceGenerationRef.current += 1;
    answerSequenceCancelRef.current?.();
    answerSequenceCancelRef.current = null;
    audienceFadeCancelRef.current?.();
    (globalThis.MLH?.fadeOutAudio?.(answerSequenceAudioRef.current) || answerSequenceAudioRef.current?.pause());
    if (answerSequenceAudioRef.current) releaseAudio(answerSequenceAudioRef.current);
    answerSequenceAudioRef.current = null;
    answerSequenceRef.current = false;
    roundEndCuePendingRef.current = false;
    setAnswerSequencePlaying(false);
    const savedRoster = readTeamRoster();
    setTeamNames(savedRoster.teamNames);
    setTeamMembers(savedRoster.teamMembers);
    setScores([0, 0]);
    setRoundIndex(0);
    setRoundPoints(0);
    setLastRoundResult(null);
    setRoundEndCueRequested(false);
    setRoundEndMusicReady(false);
    setRoundController(0);
    setStealTeam(null);
    setStrikes([0, 0]);
    setStealRevealMode(false);
    setRevealed([]);
    setRecentCorrectAnswerIndex(null);
    setFeedback("");
    setFeedbackKind("");
    setFaceoffPhase("ready");
    setTypedPrompt("");
    setFaceoffAttemptTeam(null);
    setOverlay(null);
    setScreen("setup");
  };

  const toggleQuestion = (id) => {
    if (selectedQuestionIds.includes(id) && selectedQuestionIds.length <= 3) {
      setRoundLibraryError("Choose at least 3 rounds to play.");
      return;
    }
    setRoundLibraryError("");
    setSelectedQuestionIds((current) => current.includes(id) ? current.filter((item) => item !== id) : [...current, id]);
  };

  const deleteCustomRound = (questionId) => {
    const category = customCategories.find((item) => questionId.startsWith(`${item.id}-question-`));
    if (!category) return;
    const categoryIds = category.questions.map((_, index) => `${category.id}-question-${index}`);
    setCustomCategories((current) => current.filter((item) => item.id !== category.id));
    setSelectedQuestionIds((current) => {
      const selected = current.filter((id) => !categoryIds.includes(id));
      const available = allQuestions.map((question) => question.id).filter((id) => !categoryIds.includes(id) && !selected.includes(id));
      return [...selected, ...available.slice(0, Math.max(0, 3 - selected.length))];
    });
    setRoundOverrides((current) => Object.fromEntries(Object.entries(current).filter(([id]) => !categoryIds.includes(id))));
    setRoundLibraryError("");
  };

  const roundName = (question) => question.label || "Untitled round";
  const orderedRounds = customiseOpen || overlay === "create-category"
    ? [...allQuestions].sort((first, second) => roundName(first).localeCompare(roundName(second), "en-GB", { sensitivity: "base" }))
    : [];
  const editingRoundIndex = orderedRounds.findIndex((question) => question.id === editingRoundId);
  const editingRound = orderedRounds[editingRoundIndex];
  const roundDraft = questionDrafts[0];
  const roundDraftChanged = Boolean(editingRound && (
    categoryNameDraft !== editingRound.label
    || roundDraft.prompt !== editingRound.prompt
    || roundDraft.answers.length !== editingRound.answers.length
    || roundDraft.answers.some((answer, index) => answer !== editingRound.answers[index])
  ));

  const loadRoundDraft = (question) => {
    setEditingRoundId(question?.id ?? null);
    setCategoryNameDraft(question?.label ?? "");
    setQuestionDrafts([{ prompt: question?.prompt ?? "", answers: question ? [...question.answers] : Array(MIN_ANSWERS_PER_QUESTION).fill("") }]);
    setCategoryError("");
  };

  const openRoundEditor = (question) => {
    roundMenuScrollTopRef.current = document.querySelector("#ff-customise-menu > .hub-menu-scroll")?.scrollTop ?? 0;
    loadRoundDraft(question);
    setRoundLibraryError("");
    showOverlay("create-category");
  };

  const switchEditorRound = (offset) => {
    const nextRound = orderedRounds[editingRoundIndex + offset];
    if (!nextRound) return;
    if (roundDraftChanged) {
      setCategoryError("Save your changes before switching rounds.");
      return;
    }
    loadRoundDraft(nextRound);
  };

  const updateQuestionDraft = (questionIndex, changes) => setQuestionDrafts((questions) => questions.map((question, index) => index === questionIndex ? { ...question, ...changes, ...(typeof changes.prompt === "string" ? { prompt: capitalizeFirstLetter(changes.prompt) } : {}) } : question));
  const updateAnswerDraft = (questionIndex, answerIndex, value) => setQuestionDrafts((questions) => questions.map((question, index) => index === questionIndex ? { ...question, answers: question.answers.map((answer, item) => item === answerIndex ? capitalizeFirstLetter(value) : answer) } : question));

  const saveRound = (event) => {
    event.preventDefault();
    const name = categoryNameDraft.trim();
    if (!name) { setCategoryError("Enter a round name."); return; }
    const nameKey = cleanAnswer(name);
    if (nameKey !== cleanAnswer(editingRound?.label) && allQuestions.some((round) => cleanAnswer(round.label) === nameKey)) { setCategoryError("A round with that name already exists."); return; }
    const questions = questionDrafts.map((question) => ({ prompt: question.prompt.trim(), answers: question.answers.map((answer) => answer.trim()) }));
    const invalidQuestion = questions.findIndex((question) => !question.prompt || question.answers.length < MIN_ANSWERS_PER_QUESTION || question.answers.length > MAX_ANSWERS_PER_QUESTION || question.answers.some((answer) => !answer) || new Set(question.answers.map(cleanAnswer)).size !== question.answers.length);
    if (invalidQuestion >= 0) {
      setCategoryError(`Complete Question ${invalidQuestion + 1} with ${MIN_ANSWERS_PER_QUESTION}–${MAX_ANSWERS_PER_QUESTION} different possible answers.`);
      return;
    }
    if (editingRoundId) {
      if (!roundDraftChanged) return;
      setRoundOverrides((current) => ({ ...current, [editingRoundId]: { ...questions[0], label: name } }));
      setCategoryNameDraft(name);
      setQuestionDrafts(questions);
      setCategoryError("");
      return;
    }
    const id = `custom-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setCustomCategories((current) => [...current, { id, name, questions }]);
    setSelectedQuestionIds((current) => [...current, `${id}-question-0`]);
    closeOverlay();
  };

  const requestRoundEndCue = () => {
    if (answerSequenceRef.current) {
      roundEndCuePendingRef.current = true;
      return;
    }
    if (!roundEndCueRequested) {
      setRoundEndCueRequested(true);
      setRoundEndMusicReady(false);
    }
  };

  const finishRound = (winningTeam, points, reason) => {
    requestRoundEndCue();
    setScores((current) => current.map((score, team) => team === winningTeam ? score + points : score));
    setRoundPoints(points);
    setLastRoundResult({ winningTeam, points, reason });
    setFeedback("");
    setFeedbackKind("");
    setScreen("round-end");
    showOverlay("round-win");
  };

  const nextFaceoff = () => {
    const dealt = dealFaceoff(memberQueues, teamMembers);
    setMemberQueues(dealt.queues);
    setFaceoffPlayers(dealt.players);
    setFaceoffPhase("ready");
    setSpinningNames(teamNames);
    setTypedPrompt("");
    setFaceoffAttemptTeam(null);
  };

  const revealFaceoffQuestion = () => {
    setTypedPrompt("");
    setFaceoffCountdown(3);
    setFaceoffPhase("countdown");
  };

  useEffect(() => {
    if (screen !== "faceoff" || faceoffPhase !== "spinning") return undefined;
    let spinStep = Math.floor(Math.random() * Math.max(...teamMembers.map((roster) => roster.length)));
    const spin = window.setInterval(() => {
      setSpinningNames(teamMembers.map((roster, team) => {
        return roster[(spinStep + team) % roster.length];
      }));
      spinStep += 1;
    }, 75);
    const finish = window.setTimeout(() => {
      window.clearInterval(spin);
      setSpinningNames(faceoffPlayers.map((player, team) => teamMembers[team][player]));
      const audienceCue = createAudio("./familyfortunes/familyfortunes-audio/audience.mp3");
      audienceCue.preload = "auto";
      audienceCue.volume = 0.5;
      const releaseAudienceCue = () => {
        audienceCue.removeEventListener("ended", releaseAudienceCue);
        audienceCue.removeEventListener("error", releaseAudienceCue);
        releaseAudio(audienceCue);
      };
      audienceCue.addEventListener("ended", releaseAudienceCue);
      audienceCue.addEventListener("error", releaseAudienceCue);
      audienceCue.play().catch(releaseAudienceCue);
      setFaceoffPhase("confirm");
    }, 2200);
    return () => {
      window.clearInterval(spin);
      window.clearTimeout(finish);
    };
  }, [screen, faceoffPhase, faceoffPlayers, teamMembers]);

  useEffect(() => {
    if (screen !== "faceoff" || faceoffPhase !== "countdown") return undefined;
    const countdown = window.setInterval(() => {
      setFaceoffCountdown((current) => {
        if (current <= 1) {
          window.clearInterval(countdown);
          setFaceoffPhase("typing");
          return 0;
        }
        return current - 1;
      });
    }, 1000);
    return () => window.clearInterval(countdown);
  }, [screen, faceoffPhase]);

  useEffect(() => {
    if (screen !== "faceoff" || faceoffPhase !== "typing" || !round) return undefined;
    let position = 0;
    const type = window.setInterval(() => {
      position += 1;
      setTypedPrompt(round.prompt.slice(0, position));
      if (position >= round.prompt.length) {
        window.clearInterval(type);
        setFaceoffPhase("buzzer");
      }
    }, 38);
    return () => window.clearInterval(type);
  }, [screen, faceoffPhase, round]);

  const beginRound = () => {
    setSpinningNames(teamMembers.map((roster) => roster[Math.floor(Math.random() * roster.length)]));
    setFaceoffPhase("spinning");
  };

  const chooseBuzzingTeam = (team) => {
    setFaceoffAttemptTeam(team);
    setFeedback(`${teamNames[team]} buzzed first. ${teamMembers[team][faceoffPlayers[team]]} to answer.`);
    setFeedbackKind("");
  };

  const playAnswerFeedback = async (isCorrect, revealAnswer) => {
    if (answerSequenceRef.current) return;
    setAnswerEntry("");
    setAnswerDeadline(null);
    const sequenceGeneration = answerSequenceGenerationRef.current + 1;
    answerSequenceGenerationRef.current = sequenceGeneration;
    const sequenceIsCurrent = () => answerSequenceGenerationRef.current === sequenceGeneration;
    answerSequenceRef.current = true;
    (globalThis.MLH?.fadeOutAudio?.(musicTrackRef.current) || musicTrackRef.current?.pause());
    setAnswerSequencePlaying(true);

    const playOnce = (path, onStart, onNearEnd) => new Promise((resolve) => {
      const audio = createAudio(path);
      audio.preload = "auto";
      answerSequenceAudioRef.current = audio;
      let started = false;
      let finished = false;
      let nearEndTriggered = false;
      const start = () => {
        if (started) return;
        started = true;
        onStart?.();
      };
      const triggerNearEnd = () => {
        if (nearEndTriggered) return;
        nearEndTriggered = true;
        audio.removeEventListener("timeupdate", checkNearEnd);
        onNearEnd?.();
      };
      const checkNearEnd = () => {
        if (Number.isFinite(audio.duration) && audio.duration - audio.currentTime <= 1) triggerNearEnd();
      };
      const finish = () => {
        if (finished) return;
        if (audio.currentTime > 0 && Number.isFinite(audio.duration) && audio.duration - audio.currentTime <= 1) triggerNearEnd();
        finished = true;
        audio.removeEventListener("ended", finish);
        audio.removeEventListener("error", finish);
        audio.removeEventListener("timeupdate", checkNearEnd);
        releaseAudio(audio);
        if (answerSequenceAudioRef.current === audio) answerSequenceAudioRef.current = null;
        resolve();
      };
      answerSequenceCancelRef.current = finish;
      audio.addEventListener("ended", finish);
      audio.addEventListener("error", finish);
      audio.addEventListener("timeupdate", checkNearEnd);
      const playback = audio.play();
      if (playback && typeof playback.then === "function") {
        playback.then(start).catch(() => { start(); finish(); });
      } else start();
    });

    const playAudienceFade = () => new Promise((resolve) => {
      const audio = createAudio("./familyfortunes/familyfortunes-audio/audience.mp3");
      audio.preload = "auto";
      audio.loop = true;
      audio.volume = 0.5;
      let animationFrame = null;
      let fadeDeadline = null;
      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        if (animationFrame !== null) window.cancelAnimationFrame(animationFrame);
        window.clearTimeout(fadeDeadline);
        audio.removeEventListener("error", finish);
        if (audienceFadeCancelRef.current === finish) audienceFadeCancelRef.current = null;
        releaseAudio(audio);
        resolve();
      };
      const startFade = () => {
        if (finished) return;
        const duration = 2000;
        const startedAt = performance.now();
        const fade = (timestamp) => {
          audio.volume = 0.5 * Math.max(0, 1 - (timestamp - startedAt) / duration);
          if (timestamp - startedAt >= duration) finish();
          else animationFrame = window.requestAnimationFrame(fade);
        };
        // A hidden projector tab may stop producing animation frames.
        fadeDeadline = window.setTimeout(finish, duration);
        animationFrame = window.requestAnimationFrame(fade);
      };
      audienceFadeCancelRef.current = finish;
      audio.addEventListener("error", finish);
      const playback = audio.play();
      if (playback && typeof playback.then === "function") playback.then(startFade).catch(finish);
      else startFade();
    });

    try {
      await playOnce("./familyfortunes/familyfortunes-audio/oursurveysaid.wav");
      if (!sequenceIsCurrent()) return;
      await new Promise((resolve) => {
        const timeout = window.setTimeout(resolve, 2000);
        answerSequenceCancelRef.current = () => { window.clearTimeout(timeout); resolve(); };
      });
      if (!sequenceIsCurrent()) return;
      let audiencePromise = null;
      const startCorrectSequence = () => {
        if (!sequenceIsCurrent()) return;
        revealAnswer();
        if (isCorrect) audiencePromise = playAudienceFade();
      };
      await playOnce(`./familyfortunes/familyfortunes-audio/${isCorrect ? "correct.mp3" : "wrong.wav"}`, startCorrectSequence);
      if (sequenceIsCurrent() && isCorrect) await (audiencePromise || playAudienceFade());
    } finally {
      if (!sequenceIsCurrent()) return;
      answerSequenceCancelRef.current = null;
      (globalThis.MLH?.fadeOutAudio?.(answerSequenceAudioRef.current) || answerSequenceAudioRef.current?.pause());
      answerSequenceAudioRef.current = null;
      answerSequenceRef.current = false;
      if (roundEndCuePendingRef.current) {
        roundEndCuePendingRef.current = false;
        if (!roundEndCueRequested) {
          setRoundEndCueRequested(true);
          setRoundEndMusicReady(false);
        }
      }
      setAnswerSequencePlaying(false);
    }
  };

  const renderFaceoffPlayerButtons = ({ disabled = false, spinning = false } = {}) => <FamilyFortunesContestants
    teamNames={teamNames} playerNames={spinning ? spinningNames : faceoffPlayers.map((player, team) => teamMembers[team][player])}
    onBuzz={usesTeacherControls ? undefined : chooseBuzzingTeam} disabled={disabled} spinning={spinning} />;

  const recordFaceoffAnswer = (matchIndex) => {
    if (screen !== "faceoff" || faceoffAttemptTeam === null || answerSequenceRef.current) return;
    const team = faceoffAttemptTeam;

    playAnswerFeedback(matchIndex >= 0, () => {
      if (matchIndex >= 0) {
        const updatedRevealed = [...revealed, matchIndex];
        setRevealed(updatedRevealed);
        setRecentCorrectAnswerIndex(matchIndex);
        setRoundPoints((points) => points + 1);
        setRoundController(team);
        setCurrentTeam(team);
        setFaceoffAttemptTeam(null);
        setFeedback(`${teamMembers[team][faceoffPlayers[team]]} found ${round.answers[matchIndex]}. ${teamNames[team]} won the head-to-head and added 1 point to the round bank.`);
        setFeedbackKind("good");
        if (updatedRevealed.length === round.answers.length) finishRound(team, roundPoints + 1, "cleared-board");
        else setScreen("faceoff-choice");
        return;
      }

      const updatedStrikes = [...strikes];
      updatedStrikes[team] = Math.min(3, updatedStrikes[team] + 1);
      setStrikes(updatedStrikes);
      const other = 1 - team;
      setFaceoffAttemptTeam(null);
      setRoundController(other);
      setCurrentTeam(other);
      setFeedback(`Not on the board. Control passes to ${teamNames[other]}, who can choose to play or pass without answering.`);
      setFeedbackKind("bad");
      setScreen("faceoff-choice");
    });
  };

  const chooseBoardControl = (team) => {
    setRoundController(team);
    setCurrentTeam(team);
    setFeedback("");
    setFeedbackKind("");
    setScreen("game");
  };

  const recordGuess = (matchIndex) => {
    if (screen !== "game" || answerSequenceRef.current) return;
    const team = currentTeam;

    playAnswerFeedback(matchIndex >= 0, () => {
      if (matchIndex >= 0) {
        const updatedRevealed = [...revealed, matchIndex];
        setRevealed(updatedRevealed);
        setRecentCorrectAnswerIndex(matchIndex);
        const updatedRoundPoints = roundPoints + 1;
        setRoundPoints(updatedRoundPoints);
        setFeedback("");
        setFeedbackKind("");
        if (updatedRevealed.length === round.answers.length) finishRound(team, updatedRoundPoints, "cleared-board");
        return;
      }

      const updatedStrikes = [...strikes];
      updatedStrikes[team] = Math.min(3, updatedStrikes[team] + 1);
      setStrikes(updatedStrikes);
      setFeedback("");
      setFeedbackKind("");
      if (updatedStrikes[team] >= 3) {
        setStealTeam(1 - team);
        setStealRevealMode(false);
        setFeedback(`${teamNames[team]} have three strikes. ${teamNames[1 - team]} can steal the round bank.`);
        setScreen("steal");
        setOverlay("steal-announcement");
      }
    });
  };

  const recordStealAttempt = (matchIndex) => {
    if (screen !== "steal" || stealRevealMode || stealTeam === null || answerSequenceRef.current) return;

    playAnswerFeedback(matchIndex >= 0, () => {
      if (matchIndex >= 0) {
        setRevealed((current) => [...current, matchIndex]);
        setRecentCorrectAnswerIndex(matchIndex);
        finishRound(stealTeam, roundPoints + 1, "successful-steal");
      } else {
        const updatedStrikes = [...strikes];
        updatedStrikes[stealTeam] = Math.min(3, updatedStrikes[stealTeam] + 1);
        setStrikes(updatedStrikes);
        requestRoundEndCue();
        setStealRevealMode(true);
        setFeedback("Wrong answer. Reveal the remaining answers one at a time.");
        setFeedbackKind("bad");
      }
    });
  };

  const revealNextStealAnswer = () => {
    const failedStealReveal = screen === "steal" && stealRevealMode;
    if ((!failedStealReveal && screen !== "round-end") || answerSequenceRef.current) return;
    const answerIndex = round.answers.findIndex((_, index) => !revealed.includes(index));
    if (answerIndex < 0) {
      if (failedStealReveal) finishRound(roundController, roundPoints, "failed-steal");
      return;
    }
    const updatedRevealed = [...revealed, answerIndex];
    setRevealed(updatedRevealed);
    setRecentCorrectAnswerIndex(answerIndex);
    setFeedback("");
    setFeedbackKind("");
    if (failedStealReveal && updatedRevealed.length === round.answers.length) {
      finishRound(roundController, roundPoints, "failed-steal");
    }
  };

  const canTimeAnswer = !answerSequencePlaying && (screen === "game" || (screen === "steal" && !stealRevealMode && stealTeam !== null));
  const timedAnswerActive = canTimeAnswer && answerDeadline !== null;
  const canMarkFaceoff = screen === "faceoff" && faceoffAttemptTeam !== null;
  const canMarkAnswer = hasLiveRound && !overlay && !answerSequencePlaying && (canMarkFaceoff || canTimeAnswer);
  const markAnswer = (index) => {
    if (!canMarkAnswer || answerSequenceRef.current) return;
    if (index !== -1 && (!Number.isInteger(index) || index < 0 || index >= answerItems.length || revealed.includes(index))) return;

    if (canMarkFaceoff) recordFaceoffAnswer(index);
    else if (screen === "game") recordGuess(index);
    else if (screen === "steal") recordStealAttempt(index);
  };

  const submitTypedAnswer = (event) => {
    event.preventDefault();
    const guess = answerEntry.trim();
    if (!canMarkAnswer || !guess) return;
    markAnswer(window.FAMILY_FORTUNES_ANSWERS.matchIndex(round, guess, revealed));
  };
  const renderAnswerEntry = (label, action = "Submit") => <form className="ff-entry-row" onSubmit={submitTypedAnswer}>
    <input className="ff-answer-entry" aria-label={label} placeholder="Type answer" autoComplete="off" autoCapitalize="sentences"
      value={answerEntry} readOnly={!canMarkAnswer} onChange={(event) => setAnswerEntry(capitalizeFirstLetter(event.target.value))} />
    <button className="ff-primary ff-faceoff-action" type="submit" disabled={!canMarkAnswer || !answerEntry.trim()}><span>{action}</span></button>
  </form>;

  const faceoffPlayer = canMarkFaceoff && teamMembers[faceoffAttemptTeam][faceoffPlayers[faceoffAttemptTeam]];
  const teacherTurn = canMarkFaceoff ? `${faceoffPlayer} to Answer`
    : screen === "game" ? `${teamNames[currentTeam]} to Play`
    : screen === "steal" && !stealRevealMode ? `${teamNames[stealTeam]} to Steal`
    : "";

  const startAnswerTimer = () => {
    setTimeRemaining(ANSWER_TIME_SECONDS);
    setAnswerDeadline(Date.now() + ANSWER_TIME_SECONDS * 1000);
  };

  useEffect(() => {
    if (!timedAnswerActive) return undefined;
    const interval = window.setInterval(() => {
      const remaining = Math.max(0, (answerDeadline - Date.now()) / 1000);
      setTimeRemaining(remaining);
      if (remaining === 0) {
        window.clearInterval(interval);
        setAnswerDeadline(null);
        if (screen === "game") recordGuess(-1);
        else if (screen === "steal") recordStealAttempt(-1);
      }
    }, 100);
    return () => window.clearInterval(interval);
  }, [timedAnswerActive, answerDeadline, screen]);

  const continueRound = () => {
    if (roundIndex + 1 >= gameRounds.length) {
      if (!allRoundAnswersRevealed) return;
      setRoundEndCueRequested(false);
      setRoundEndMusicReady(false);
      setScreen("final");
      return;
    }
    const nextRound = roundIndex + 1;
    setRoundIndex(nextRound);
    setRoundPoints(0);
    setLastRoundResult(null);
    setRoundEndCueRequested(false);
    setRoundEndMusicReady(false);
    setRoundController(0);
    setStealTeam(null);
    setStrikes([0, 0]);
    setStealRevealMode(false);
    setRevealed([]);
    setRecentCorrectAnswerIndex(null);
    setFeedback("");
    setFeedbackKind("");
    nextFaceoff();
    setScreen("faceoff");
  };

  const winner = scores[0] === scores[1] ? "It's a tie!" : `${teamNames[scores[0] > scores[1] ? 0 : 1]} win!`;
  const boardView = hasLiveRound ? {
    teamNames, scores, strikes, roundIndex, roundCount: gameRounds.length,
    activeTeam: screen === "game" ? currentTeam : screen === "faceoff-choice" ? roundController : screen === "steal" ? stealTeam : null,
    question: screen !== "faceoff" || faceoffAttemptTeam !== null ? round.prompt
      : ["typing", "buzzer"].includes(faceoffPhase) ? typedPrompt : "",
    questionRevealed: screen !== "faceoff" || faceoffPhase === "buzzer",
    countdown: screen === "faceoff" && faceoffPhase === "countdown" ? faceoffCountdown : null,
    seconds: timedAnswerActive ? timeRemaining : null,
    answers: round.answers, revealed, recentAnswer: recentCorrectAnswerIndex, points: roundPoints,
    contestants: screen === "faceoff" && faceoffAttemptTeam === null && faceoffPhase !== "ready"
      ? (faceoffPhase === "spinning" ? spinningNames : faceoffPlayers.map((player, team) => teamMembers[team][player]))
      : null,
    spinning: screen === "faceoff" && faceoffPhase === "spinning",
  } : null;

  useLayoutEffect(() => {
    const connection = teacherConnectionRef.current;
    if (!connection) return;
    const commands = new Map();
    const actions = [];
    const settings = [];
    const add = (id, label, run, group = actions) => {
      commands.set(id, run);
      group.push({ id, label });
    };
    let status = "Start a game to see the answers here.";
    if (usesTeacherControls) {
      add("sound", soundEnabled ? "Mute Sound" : "Turn Sound On", toggleSound, settings);
      add("projector", fullscreen || projectorMaximised ? "Restore Game Board" : "Maximise Game Board", () => {
        if (document.fullscreenElement) document.exitFullscreen().catch(() => {});
        else setProjectorMaximised(!projectorMaximised);
      }, settings);
      if (screen !== "final") add("reset", "Reset Game", resetGame, settings);

      if (answerSequencePlaying) {
        status = "Marking answer…";
      } else if (overlay === "steal-announcement") {
        status = `${teamNames[stealTeam]} can steal the points.`;
        add("continue-steal", "Continue", () => setOverlay(null));
      } else if (roundWin) {
        status = "Round complete.";
        add("continue-round-win", "Continue", () => setOverlay(null));
      } else if (screen === "faceoff" && faceoffAttemptTeam === null) {
        status = "Head-to-Head";
        if (faceoffPhase === "ready") add("begin", "Begin", beginRound);
        if (faceoffPhase === "confirm") add("reveal-question", "Reveal Question", revealFaceoffQuestion);
        if (faceoffPhase === "buzzer") {
          status = "Select the contestant who buzzed first.";
          teamNames.forEach((name, index) => {
            const player = teamMembers[index][faceoffPlayers[index]];
            add(`buzz-${index}`, `${player} · ${name}`, () => chooseBuzzingTeam(index));
          });
        }
      } else if (canMarkAnswer) {
        status = teacherTurn;
        commands.set("mark", markAnswer);
        if (timedAnswerActive) status += " · Timer running";
        else if (canTimeAnswer) add("start-timer", "Start Timer", startAnswerTimer);
      } else if (screen === "faceoff-choice") {
        status = `${teamNames[roundController]} to choose`;
        add("play", "Play", () => chooseBoardControl(roundController));
        add("pass", "Pass", () => chooseBoardControl(1 - roundController));
      } else if (screen === "round-end" || (screen === "steal" && stealRevealMode)) {
        status = screen === "round-end" ? "Round complete." : "Reveal the remaining answers.";
        if (screen === "steal" || !allRoundAnswersRevealed) add("reveal-answer", "Reveal Next Answer", revealNextStealAnswer);
        if (screen === "round-end" && !isFinalRound) add("next-round", "Next Round", continueRound);
      } else if (screen === "final") {
        status = winner;
        add("main-menu", "Main Menu", resetGame);
      }
    }

    teacherCommandsRef.current = commands;
    const controls = { screen, roundIndex, revealed, canMarkAnswer, status, actions, settings, stealAnnouncement: overlay === "steal-announcement", roundWin };
    const previous = teacherStateRef.current;
    const controlsKey = JSON.stringify(controls);
    const boardKey = JSON.stringify(boardView);
    const controlsChanged = controlsKey !== previous?.controlsKey;
    if (!controlsChanged && boardKey === previous?.boardKey) return;
    // Animation and timer frames update the replica without invalidating an in-flight command.
    const state = { type: "state", revision: (previous?.state.revision ?? 0) + Number(controlsChanged), view: { ...controls, board: boardView } };
    teacherStateRef.current = { state, controlsKey, boardKey };
    connection.channel.postMessage(state);
  });

  const setLevelMenu = (nextLevel) => {
    if (!Object.hasOwn(LEVEL_MENU, nextLevel)) return;
    if (nextLevel !== level) {
      const nextOverrides = readRoundOverrides(nextLevel);
      const availableIds = getRoundLibrary(nextLevel, customCategories, nextOverrides).map((round) => round.id);
      setRoundOverrides(nextOverrides);
      setSelectedQuestionIds(readSelectedQuestionIds(availableIds, nextLevel));
      setOptions((current) => ({ ...current, level: nextLevel }));
      setRoundLibraryError("");
      setRosterError("");
    }
    const url = new URL(window.location.href);
    url.searchParams.set("level", nextLevel);
    window.history.replaceState({}, "", url);
    setLevelOpen(false);
    if (allowOverlayLevelChange) levelRef.current?.querySelector("[data-menu-trigger]")?.focus({ preventScroll: true });
  };
  const roundEditorOverlay = overlay === "create-category" ? <div className="ff-overlay-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeOverlay(); }}>
    <section className="ff-modal ff-round-editor-dialog ig-app" role="dialog" aria-modal="true" aria-label={editingRoundId ? "Edit round" : "Create round"}>
      <form className="ff-create-round-form ig-sort-builder" onSubmit={saveRound}>
        <div className="ff-round-editor-toolbar">
          <button className={window.MLH.ToolbarButtonClass} type="button" onClick={closeOverlay}>{editingRound && !roundDraftChanged ? "Close" : "Cancel"}</button>
          <div className="ff-round-editor-navigation">
            {editingRound && <button className={window.MLH.ToolbarButtonClass + " ff-round-editor-arrow"} type="button" aria-label="Previous round" disabled={editingRoundIndex === 0} onClick={() => switchEditorRound(-1)}><img src="./ui-icons/next.svg" alt="" /></button>}
            <input aria-label="Round name" placeholder="Round name" maxLength={40} value={categoryNameDraft} onChange={(event) => setCategoryNameDraft(capitalizeFirstLetter(event.target.value))} required />
            {editingRound && <button className={window.MLH.ToolbarButtonClass + " ff-round-editor-arrow"} type="button" aria-label="Next round" disabled={editingRoundIndex === orderedRounds.length - 1} onClick={() => switchEditorRound(1)}><img src="./ui-icons/next.svg" alt="" /></button>}
          </div>
          <button className={window.MLH.ToolbarButtonClass + " hub-confirm-button"} type="submit" disabled={Boolean(editingRound && !roundDraftChanged)}>Save</button>
        </div>
        {categoryError && <p className="ff-category-error" role="alert">{categoryError}</p>}
        <div className="ff-create-round-content">
          {questionDrafts.map((question, questionIndex) => <React.Fragment key={questionIndex}>
            <label className="ff-editor-question">Question
              <input maxLength={180} value={question.prompt} onChange={(event) => updateQuestionDraft(questionIndex, { prompt: event.target.value })} placeholder="Enter a question" required />
            </label>
            <section className="ig-custom-sort-cards" aria-label="Answers">
              <p>{question.answers.filter((answer) => answer.trim()).length}/{MAX_ANSWERS_PER_QUESTION} answers</p>
              <ol className="ig-custom-sort-card-list" role="list">
                {question.answers.map((answer, index) => <li key={index}>
                  <span className="ig-custom-sort-card-number" aria-hidden="true">{index + 1}</span>
                  <input aria-label={`Answer ${index + 1}`} placeholder="Word or phrase" value={answer} maxLength={70}
                    onKeyDown={(event) => { if (event.key === "Enter" && !event.nativeEvent.isComposing) event.preventDefault(); }}
                    onChange={(event) => updateAnswerDraft(questionIndex, index, event.target.value)} />
                  <button className={window.MLH.ToolbarButtonClass + " ig-sort-card-remove"} type="button"
                    aria-label={`Remove answer ${index + 1}`} title={`Remove answer ${index + 1}`} disabled={question.answers.length <= MIN_ANSWERS_PER_QUESTION}
                    onClick={() => updateQuestionDraft(questionIndex, { answers: question.answers.filter((_, answerIndex) => answerIndex !== index) })}>
                    <img src="./ui-icons/bin.svg" alt="" />
                  </button>
                </li>)}
              </ol>
              <button className={window.MLH.ToolbarButtonClass + " ig-sort-card-add"} type="button" aria-label="Add answer" title="Add answer"
                disabled={question.answers.length >= MAX_ANSWERS_PER_QUESTION}
                onClick={() => updateQuestionDraft(questionIndex, { answers: [...question.answers, ""] })}>
                <img src="./ui-icons/plus.svg" alt="" />
              </button>
            </section>
          </React.Fragment>)}
        </div>
      </form>
    </section>
  </div> : null;

  return <div className="ff-app-shell">
    <window.MLH.AppHeader profileState={{ level, options, selectedQuestionIds, customCategories, roundOverrides }} icon="app-icons/familyfortunes-icon.svg" title="Family Fortunes" subtitle="Name the most popular musical answers in this game-show challenge." profileLabel={activeLevelLabel} profileUsesSharedSettings={false} />
    <main className="ff-content">
      <div className="ff-main-shell">
      <div className="ff-toolbar-wrap">
        <window.MLH.AppToolbar
          left={<div className="flex items-center gap-2">
            <fieldset disabled={levelUnavailable} className="m-0 min-w-0 border-0 p-0 disabled:opacity-50">
              <div className="hub-menu-anchor relative" ref={levelRef}>
                <window.MLH.LevelButton icon={<img src="ui-icons/levels.svg" alt="" className="h-[26px] w-[26px]" />} activeLevel={level} activeLabel={activeLevelLabel} onClick={() => { setCustomiseOpen(false); setLevelOpen((open) => !open); }} expanded={levelOpen} ariaControls={levelOpen ? "ff-level-menu" : undefined} dataMenuTrigger={true} />
                {levelOpen && !levelUnavailable && <window.MLH.MenuPanel id="ff-level-menu" title="Level" position="left-0" dataMenuPanel={true}><window.MLH.LevelMenu activeLevel={level} onSelect={setLevelMenu} levels={LEVEL_MENU} /></window.MLH.MenuPanel>}
              </div>
            </fieldset>
            <div className="hub-menu-anchor relative" ref={customiseRef} onKeyDown={(event) => {
              if (event.key !== "Escape" || !customiseOpen) return;
              event.preventDefault();
              setCustomiseOpen(false);
              customiseRef.current?.querySelector("[data-menu-trigger]")?.focus();
            }}>
              <window.MLH.CustomiseButton icon={<img src="ui-icons/customise.svg" alt="" className="h-[22px] w-[22px]" />}
                disabled={levelUnavailable || Boolean(overlay)} expanded={customiseOpen} ariaControls={customiseOpen ? "ff-customise-menu" : undefined} dataMenuTrigger
                onClick={() => { setLevelOpen(false); setCustomiseOpen((open) => !open); }} />
              {customiseOpen && !levelUnavailable && !overlay &&
                <window.MLH.MenuPanel id="ff-customise-menu" title="Customise" position="left-0" variant="customise" dataMenuPanel footer={
                  <div className="ig-sort-create-footer">
                    <hr className="ig-sort-create-divider" />
                    <button className="ig-crossword-menu-row ig-crossword-menu-create" type="button" onClick={() => openRoundEditor()}><span className="ig-crossword-menu-copy"><strong>Create</strong></span></button>
                  </div>
                }>
                  <div className="ig-crossword-collections-menu">
                    {roundLibraryError && <p className="ff-round-menu-message" role="alert">{roundLibraryError}</p>}
                    {!roundLibraryError && !canChooseRoundCount && <p className="ff-round-menu-message">
                      {allQuestions.length < 3 ? "Create at least 3 rounds to play." : "Select at least 3 rounds to play."}
                    </p>}
                    <label className="hub-toggle-row ff-round-count-setting">
                      <span className="hub-toggle-label"><img src="ui-icons/four-squares.svg?v=filled" alt="" />Number of Rounds</span>
                      <select aria-label="Number of Rounds" disabled={!canChooseRoundCount} value={canChooseRoundCount ? roundsToPlay : ""} onChange={(event) => setOptions((current) => ({ ...current, roundsToPlay: Number(event.target.value) }))}>
                        {!canChooseRoundCount && <option value="">Select 3 or more</option>}
                        {Array.from({ length: Math.max(0, selectedQuestionIds.length - 2) }, (_, index) => index + 3).map((count) => <option key={count} value={count}>{count}</option>)}
                      </select>
                    </label>
                    <ul className="ff-round-menu-list" aria-label="Available rounds">
                      {orderedRounds.map((question) => {
                        const name = roundName(question);
                        return <li className="ff-round-menu-row" key={question.id}>
                          <label className="ig-crossword-menu-row ff-round-menu-selection" title={name}>
                            <input type="checkbox" checked={selectedQuestionIds.includes(question.id)} onChange={() => toggleQuestion(question.id)} />
                            <span className="ig-crossword-menu-copy"><strong>{name}</strong></span>
                          </label>
                          <button className="ff-round-menu-action" type="button" aria-label={`Edit ${name}`} title={`Edit ${name}`} onClick={() => openRoundEditor(question)}><img src="./ui-icons/pencil.svg" alt="" /></button>
                          {question.id.startsWith("custom-") && <button className="ff-round-menu-action" type="button" aria-label={`Delete ${name}`} title="Delete custom round" onClick={() => deleteCustomRound(question.id)}><img src="./ui-icons/bin.svg" alt="" /></button>}
                        </li>;
                      })}
                    </ul>
                  </div>
                </window.MLH.MenuPanel>}
            </div>
          </div>}
          right={!usesTeacherControls && <button type="button" className="ff-toolbar-reset" aria-label="Reset game and return to setup" disabled={screen === "setup"} onClick={resetGame}><img src="ui-icons/restart.svg" alt="" /><span>Reset</span></button>}
        />
      </div>
      <section ref={stageRef} className={`ff-stage${screen === "setup" ? " is-setup" : ""}${hasLiveRound ? " has-live-round" : ""}${timedAnswerActive ? " has-answer-timer" : ""}${projectorMaximised ? " is-projector-maximised" : ""}`}>
        <div className="ff-sr-only" role="status" aria-live="polite" aria-atomic="true">{feedback}</div>
        {usesTeacherControls && ["disconnected", "reopening"].includes(teacherWindowStatus) &&
          <button type="button" className="ff-secondary ff-reopen-teacher" disabled={teacherWindowStatus === "reopening"}
            onClick={reopenTeacherControls}>Reopen Teacher Controls</button>}
        {!usesTeacherControls && <>
          <button className="ff-sound-toggle" type="button" aria-label="Sound" title={soundEnabled ? "Mute sound" : "Turn sound on"} aria-pressed={soundEnabled} onClick={toggleSound}>
            <img src="ui-icons/audio-svgrepo-com.svg?v=20260722-smaller15" alt="" aria-hidden="true" />
          </button>
          <button type="button" className="ff-fullscreen-toggle" aria-label={fullscreen ? "Exit Full Screen" : "Full Screen"} title={fullscreen ? "Exit Full Screen" : "Full Screen"} aria-pressed={fullscreen} disabled={!document.fullscreenEnabled} onClick={toggleFullscreen}>
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={fullscreen ? "M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6" : "M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"} /></svg>
          </button>
        </>}
        {fullscreenError && <span className="ff-fullscreen-error" role="alert">{fullscreenError}</span>}
        {!usesTeacherControls && canTimeAnswer && !timedAnswerActive && !overlay && <button className="ff-secondary ff-start-timer" type="button" onClick={startAnswerTimer}>Start Timer</button>}
        {screen === "setup" && <>
          <div className="ff-logo-shine ff-logo-shine-brand"><img className="ff-brand-logo" src="./familyfortunes/familyfortunes-logo.png?v=20260928-hd-logo" alt="Family Fortunes" /></div>
          <div className="ff-opening-actions">
            <button className="ff-opening-button ff-opening-secondary" type="button" onClick={() => showOverlay("how-to")}><span>How to Play</span></button>
            <button className="ff-opening-button ff-opening-primary" type="button" onClick={openRosterSetup}><span>Play</span></button>
          </div>
          <button className="ff-opening-button ff-opening-grey ff-buzzers-opening" type="button" aria-haspopup="dialog" onClick={openBuzzers}><span>Buzzers</span></button>
        </>}

        {hasLiveRound && <>
          <FamilyFortunesRoundBoard board={boardView} questionAction={
            !usesTeacherControls && screen === "faceoff" && ["confirm", "countdown"].includes(faceoffPhase)
              ? <button className={`ff-primary ff-faceoff-action ff-reveal-question-button${faceoffPhase === "countdown" ? " is-countdown" : ""}`} type="button" disabled={faceoffPhase === "countdown"} onClick={revealFaceoffQuestion}><span>{faceoffPhase === "countdown" ? faceoffCountdown : "Reveal Question"}</span></button>
              : null
          } />
          {screen === "faceoff" && <div className="ff-faceoff-panel ff-headtohead-panel">
            <h2 className="ff-buzzer-title">Head-to-Head</h2>
            {!usesTeacherControls && faceoffAttemptTeam === null && faceoffPhase === "ready" && <button className="ff-primary ff-faceoff-action" type="button" onClick={beginRound}><span>Begin</span></button>}
            {faceoffAttemptTeam === null && faceoffPhase === "spinning" && <>
              {renderFaceoffPlayerButtons({ disabled: true, spinning: true })}
            </>}
            {faceoffAttemptTeam === null && faceoffPhase === "confirm" && <>
              {renderFaceoffPlayerButtons({ disabled: true })}
            </>}
            {faceoffAttemptTeam === null && faceoffPhase === "countdown" && renderFaceoffPlayerButtons({ disabled: true })}
            {faceoffAttemptTeam === null && faceoffPhase === "typing" && <>
              {renderFaceoffPlayerButtons({ disabled: true })}
            </>}
            {faceoffAttemptTeam === null && faceoffPhase === "buzzer" && renderFaceoffPlayerButtons()}
            {canMarkFaceoff && (usesTeacherControls
              ? <p className="ff-turn-title">{faceoffPlayer} to Answer</p>
              : renderAnswerEntry("Head-to-head answer"))}
          </div>}
          {screen === "faceoff-choice" && <div className="ff-faceoff-panel">
            {usesTeacherControls ? <p className="ff-turn-title">{teamNames[roundController]} to choose: Play or Pass</p> : <div className="ff-buzzer-buttons">
              <button className="ff-opening-button ff-opening-primary" type="button" disabled={answerSequencePlaying} onClick={() => chooseBoardControl(roundController)}><span>Play</span></button>
              <button className="ff-opening-button ff-opening-secondary" type="button" disabled={answerSequencePlaying} onClick={() => chooseBoardControl(1 - roundController)}><span>Pass</span></button>
            </div>}
          </div>}
          {screen === "game" && <>
            <div className="ff-entry-panel">
              <h2 className="ff-turn-title">{teamNames[currentTeam]} to Play</h2>
              {!usesTeacherControls && renderAnswerEntry("Your answer attempt")}
            </div>
            {feedback && <p className={`ff-feedback ${feedbackKind ? `is-${feedbackKind}` : ""}`}>{feedback}</p>}
          </>}
          {screen === "steal" && (stealRevealMode
            ? !usesTeacherControls && <div className="ff-entry-panel">
                <button className="ff-primary ff-faceoff-action" type="button" disabled={answerSequencePlaying} onClick={revealNextStealAnswer}><span>Reveal next answer</span></button>
              </div>
            : <div className="ff-entry-panel">
                <h2 className="ff-turn-title">{teamNames[stealTeam]} to Play</h2>
                {!usesTeacherControls && renderAnswerEntry("Steal attempt answer", "Steal")}
              </div>)}
          {screen === "round-end" && !usesTeacherControls && <>
            <div className="ff-opening-actions">
              {revealed.length < round.answers.length && <button className="ff-opening-button ff-opening-secondary" type="button" disabled={answerSequencePlaying} onClick={revealNextStealAnswer}><span>Reveal next answer</span></button>}
              {!isFinalRound && <button className="ff-opening-button ff-opening-primary" type="button" disabled={answerSequencePlaying} onClick={continueRound}><span>Next Round</span></button>}
            </div>
          </>}
        </>}

        {screen === "final" && <>
          <div className="ff-logo-shine ff-logo-shine-brand"><img className="ff-brand-logo" src="./familyfortunes/familyfortunes-logo.png?v=20260928-hd-logo" alt="Family Fortunes" /></div>
          <h1 className="ff-display">{winner}</h1>
          {!usesTeacherControls && <div className="ff-opening-actions"><button className="ff-opening-button ff-opening-primary" type="button" onClick={resetGame}><span>Main Menu</span></button></div>}
        </>}
        {hasLiveRound && !usesTeacherControls && <>
          <button ref={answerKeyToggleRef} className="ff-answer-key-toggle" type="button"
            aria-label={answerKeyOpen ? "Hide answers for this round" : "Show answers for this round"}
            aria-expanded={answerKeyOpen} aria-controls={answerKeyOpen ? "ff-answer-key" : undefined}
            onClick={() => setAnswerKeyOpen((open) => !open)}><span aria-hidden="true">?</span></button>
          {answerKeyOpen && <section ref={answerKeyPopoverRef} id="ff-answer-key" className="ff-answer-key-popover" aria-labelledby="ff-answer-key-title">
            <h2 id="ff-answer-key-title">Answers</h2>
            <ol>
              {answerItems.map(({ answer, index }) => <li key={index}><span aria-hidden="true">{index + 1}</span><span>{answer}</span></li>)}
            </ol>
          </section>}
        </>}
        {overlay === "buzzers" && <div className="ff-overlay-backdrop ff-buzzer-board-backdrop">
          <section className="ff-buzzer-board" role="dialog" aria-modal="true" aria-label="Two-player buzzers">
            <button className="ff-secondary ff-buzzer-board-close" type="button" onClick={closeOverlay}>Done</button>
            {buzzerPair.map(({ id, label }, side) => <button key={id} className="ff-buzzer-pad" type="button" data-buzzer={id}
              aria-label={`${side === 0 ? "Left" : "Right"} buzzer: ${label}`}
              onPointerDown={(event) => { if (event.button === 0) pressBuzzer(id, event.currentTarget, event.pointerType === "touch"); }}
              onClick={(event) => { if (event.detail === 0) pressBuzzer(id, event.currentTarget); }}>
              <span className="ff-buzzer-cap" aria-hidden="true" />
            </button>)}
          </section>
        </div>}
        {overlay === "teacher-controls" && <div className="ff-overlay-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeOverlay(); }}>
          <section className="ff-modal ff-teacher-setup-modal" role="dialog" aria-modal="true" aria-labelledby="ff-teacher-setup-title" aria-describedby="ff-teacher-setup-intro">
            <h2 id="ff-teacher-setup-title">Teacher Controls</h2>
            <div id="ff-teacher-setup-intro">
              <p className="ff-how-to-overview">Choose whether to use Teacher Controls. On Windows, press <strong>Windows + P</strong> and select <strong>Extend</strong>, then open Teacher Controls on your own screen.</p>
              <p className="ff-how-to-overview">If you can’t extend your display, choose <strong>Don’t Use</strong> and type answers on the game board.</p>
            </div>
            {teacherWindowStatus === "blocked" && <p className="ff-how-to-overview" role="alert">Teacher Controls couldn’t open. Allow pop-ups and try again.</p>}
            <div className="ff-modal-actions">
              <button className="ff-opening-button ff-opening-grey" type="button" onClick={() => beginGame(false)}><span>Don’t Use</span></button>
              <button className="ff-opening-button ff-opening-primary" type="button" disabled={teacherWindowStatus === "opening"}
                onClick={() => openTeacherControls(() => beginGame(true))}><span>{teacherWindowStatus === "opening" ? "Opening…" : "Open Teacher Controls"}</span></button>
            </div>
          </section>
        </div>}
        {roundWin && <RoundWinAnnouncement result={roundWin} modal={!usesTeacherControls} disabled={answerSequencePlaying}
          onContinue={usesTeacherControls ? undefined : closeOverlay} />}
        {overlay === "steal-announcement" && <div className="ff-overlay-backdrop ff-steal-announcement-backdrop">
          <section className="ff-modal ff-steal-announcement" role={usesTeacherControls ? "status" : "dialog"} aria-modal={usesTeacherControls ? undefined : "true"} aria-labelledby="ff-steal-announcement-message" tabIndex={usesTeacherControls ? undefined : -1}>
            <p id="ff-steal-announcement-message">{teamNames[stealTeam]}, this is your chance to steal the points!</p>
            {!usesTeacherControls && <button className="ff-opening-button ff-opening-primary" type="button" disabled={answerSequencePlaying} onClick={() => setOverlay(null)}><span>Continue</span></button>}
          </section>
        </div>}
        {overlay === "how-to" && <div className="ff-overlay-backdrop ff-how-to-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeOverlay(); }}>
          <div className="ff-logo-shine ff-how-to-logo"><img className="ff-brand-logo" src="./familyfortunes/familyfortunes-logo.png?v=20260928-hd-logo" alt="Family Fortunes" /></div>
          <section className="ff-modal ff-how-to-modal" role="dialog" aria-modal={!allowOverlayLevelChange} aria-labelledby="ff-modal-title">
            <h2 id="ff-modal-title">How to Play</h2>
            <div className="ff-how-to-content">
              <div className="ff-how-to-rules">
                <section className="ff-how-to-rule">
                  <div className="ff-how-to-rule-heading">
                    <span className="ff-how-to-rule-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M8 4h8v3.5a4 4 0 0 1-8 0V4ZM8 6H4v1a4 4 0 0 0 4 4M16 6h4v1a4 4 0 0 1-4 4M12 11.5V17m-4 3h8m-7-3h6"/></svg></span>
                    <h3>Objective</h3>
                  </div>
                  <p>Say your answers aloud for the host to mark in Teacher Controls, or type them on the game board. Each revealed answer adds 1 point to the round bank. The team with the most points wins.</p>
                </section>
                <section className="ff-how-to-rule">
                  <div className="ff-how-to-rule-heading">
                    <span className="ff-how-to-rule-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><circle cx="7.5" cy="7" r="3"/><circle cx="16.5" cy="7" r="3"/><path d="M2.5 20c.3-3.3 2.2-5.3 5-5.3s4.7 2 5 5.3M11.5 20c.3-3.3 2.2-5.3 5-5.3s4.7 2 5 5.3"/></svg></span>
                    <h3>Head to Head</h3>
                  </div>
                  <p>The game picks one player from each team. The host selects whoever buzzes first and marks their spoken answer. If it’s correct, that team chooses to play or pass. If it’s wrong, the other team gets that choice.</p>
                </section>
                <section className="ff-how-to-rule">
                  <div className="ff-how-to-rule-heading">
                    <span className="ff-how-to-rule-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M9 6h11M9 12h11M9 18h11"/><circle cx="4" cy="6" r="1"/><circle cx="4" cy="12" r="1"/><circle cx="4" cy="18" r="1"/></svg></span>
                    <h3>Play the Board</h3>
                  </div>
                  <p>The team playing wins the bank by finding every answer. Three wrong answers give the other team a chance to steal. The host can select <strong>Start Timer</strong> during regular play or a steal attempt. Running out of time counts as a wrong answer.</p>
                </section>
                <section className="ff-how-to-rule">
                  <div className="ff-how-to-rule-heading">
                    <span className="ff-how-to-rule-icon" aria-hidden="true"><svg viewBox="0 0 24 24" fill="none"><path d="M3 8h17m-4-4 4 4-4 4M21 16H4m4-4-4 4 4 4"/></svg></span>
                    <h3>Steal</h3>
                  </div>
                  <p>The other team gets one guess. A correct answer adds 1 point and wins the bank. If the steal fails, the team that played the board wins the bank.</p>
                </section>
              </div>
            </div>
            <div className="ff-modal-actions"><button className="ff-opening-button ff-opening-secondary ff-modal-back" type="button" onClick={closeOverlay}><span>Back</span></button></div>
          </section>
        </div>}
        {overlay === "roster" && <div className="ff-overlay-backdrop ff-how-to-backdrop" onMouseDown={(event) => { if (event.target === event.currentTarget) closeOverlay(); }}>
          <div className="ff-logo-shine ff-how-to-logo"><img className="ff-brand-logo" src="./familyfortunes/familyfortunes-logo.png?v=20260928-hd-logo" alt="Family Fortunes" /></div>
          <section className="ff-modal ff-how-to-modal ff-roster-modal" role="dialog" aria-modal="true" aria-label="Team setup">
            <div className="ff-roster-view">
              <form onSubmit={prepareGame}>
                <div className="ff-roster-scroll-area">
                  <div className="ff-roster-grid">
                    {teamMembers.map((members, team) => <section className="ff-roster-team" key={team}>
                      <label className="ff-roster-team-label">Team {team + 1} Name
                        <input className="ff-roster-input" autoCapitalize="sentences" maxLength="22" value={teamNames[team]} onChange={(event) => changeTeamName(team, event.target.value)} placeholder={`Team ${team + 1}`} />
                      </label>
                      <div className="ff-roster-members-heading"><span>Members</span></div>
                      {members.map((member, index) => <div className="ff-roster-member" key={`${team}-${index}`}>
                        <span className="ff-roster-member-number">{index + 1}</span>
                        <input className="ff-roster-input" autoCapitalize="sentences" maxLength="32" value={member} onChange={(event) => updateTeamMember(team, index, event.target.value)} aria-label={`${teamNames[team].trim() || `Team ${team + 1}`} member ${index + 1}`} placeholder={`Name ${index + 1}`} />
                        {members.length > 1 && <button className="ff-roster-remove-member" type="button" aria-label={`Remove member ${index + 1} from Team ${team + 1}`} title={`Remove member ${index + 1}`} onClick={() => removeTeamMember(team, index)}><img src="ui-icons/bin.svg" alt="" aria-hidden="true" /></button>}
                      </div>)}
                      <button className="ff-add-member" type="button" aria-label={`Add member to Team ${team + 1}`} title="Add team member" onClick={() => addTeamMember(team)}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 5v14M5 12h14" /></svg></button>
                    </section>)}
                  </div>
                  <div className="ff-roster-scroll-fade" aria-hidden="true" />
                </div>
                {rosterError && <p className="ff-category-error" role="alert">{rosterError}</p>}
                <div className="ff-controls ff-modal-actions"><button className="ff-opening-button ff-opening-primary" type="submit"><span>Continue</span></button></div>
              </form>
            </div>
          </section>
        </div>}
        {roundEditorOverlay}
      </section>
      </div>
    </main>
    <div className="ff-legal-attribution">Unofficial educational classroom resource. Not affiliated with or endorsed by the owners of <em>Family Fortunes</em>.</div>
  </div>;
}

function FamilyFortunesTeacher() {
  const channelName = window.location.hash.slice(1);
  const channelRef = useRef(null);
  const [state, setState] = useState(null);
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    if (!/^mlh-family-fortunes-(?:\d+-){3}\d+$/.test(channelName)) return undefined;
    const channel = new BroadcastChannel(channelName);
    channelRef.current = channel;
    channel.onmessage = ({ data }) => {
      if (data?.type === "state" && data.view) setState(data);
      if (data?.type === "game-closed") {
        setClosed(true);
        setState(null);
        channel.close();
        channelRef.current = null;
        window.close();
      }
    };
    const requestState = () => channel.postMessage({ type: "ready" });
    const resync = (event) => { if (event.persisted && channelRef.current === channel) requestState(); };
    const notifyLeaving = () => {
      if (channelRef.current === channel) channel.postMessage({ type: "leaving" });
    };
    window.addEventListener("pageshow", resync);
    window.addEventListener("pagehide", notifyLeaving);
    requestState();
    return () => {
      window.removeEventListener("pageshow", resync);
      window.removeEventListener("pagehide", notifyLeaving);
      channel.close();
      channelRef.current = null;
    };
  }, [channelName]);

  const view = state?.view;
  const board = view?.board;
  const send = (id, index) => channelRef.current?.postMessage({ type: "command", revision: state.revision, id, index });
  const status = view?.status || (closed ? "The Family Fortunes game has closed." : "Open Teacher Controls from the Family Fortunes game.");
  const actionButton = ({ id, label }) => <button key={id} className="ff-opening-button ff-opening-primary" type="button" onClick={() => send(id)}><span>{label}</span></button>;
  const showSteal = view?.stealAnnouncement;
  const actions = view?.actions ?? [];
  const revealQuestion = actions.find(({ id }) => id === "reveal-question");
  const continueSteal = actions.find(({ id }) => id === "continue-steal");
  const continueRoundWin = actions.find(({ id }) => id === "continue-round-win");
  const canBuzz = actions.some(({ id }) => id === "buzz-0");
  const roundActions = actions.filter(({ id }) => id !== "reveal-question" && id !== "continue-steal" && id !== "continue-round-win" && !id.startsWith("buzz-"));

  return <main className="ff-content ff-teacher-content">
    <div className="ff-teacher-heading">
      <h1>Teacher Controls</h1>
      <p>Keep this window hidden from contestants.</p>
    </div>
    <div className="ff-main-shell">
      {!!view?.settings.length && <div className="ff-teacher-toolbar" role="group" aria-label="Game settings">
        {view.settings.map(({ id, label }) => <button key={id} className="ff-toolbar-reset" type="button" onClick={() => send(id)}>{label}</button>)}
      </div>}
      <section className={`ff-stage ff-teacher-stage${board ? " has-live-round" : " is-setup"}${board?.seconds != null ? " has-answer-timer" : ""}`} aria-label="Teacher game board">
        {board ? <>
          <FamilyFortunesRoundBoard board={board} canMarkAnswer={view.canMarkAnswer}
            onMark={board.questionRevealed ? (index) => send("mark", index) : undefined}
            questionAction={revealQuestion && actionButton(revealQuestion)} />
          <div className={`ff-entry-panel ff-teacher-action-panel${view.screen === "faceoff" ? " ff-headtohead-panel" : ""}`}>
            {view.screen === "faceoff" && <h2 className="ff-buzzer-title">Head-to-Head</h2>}
            {status !== "Head-to-Head" && <p className="ff-turn-title" role="status">{status}</p>}
            {board.contestants && <FamilyFortunesContestants teamNames={board.teamNames} playerNames={board.contestants}
              spinning={board.spinning} onBuzz={(index) => send(`buzz-${index}`)} disabled={!canBuzz} />}
            {(roundActions.length > 0 || view.canMarkAnswer) && <div className="ff-teacher-round-actions" role="group" aria-label="Round controls">
              {roundActions.map(actionButton)}
              {view.canMarkAnswer && <button className="ff-opening-button ff-teacher-incorrect" type="button" onClick={() => send("mark", -1)}>Incorrect</button>}
            </div>}
          </div>
          {view.roundWin && <RoundWinAnnouncement result={view.roundWin} disabled={!continueRoundWin} onContinue={() => send("continue-round-win")} />}
          {showSteal && <div className="ff-overlay-backdrop ff-steal-announcement-backdrop">
            <section className="ff-modal ff-steal-announcement" aria-label="Steal announcement">
              <p>{status}</p>
              {continueSteal && actionButton(continueSteal)}
            </section>
          </div>}
        </> : <>
          <div className="ff-logo-shine ff-logo-shine-brand"><img className="ff-brand-logo" src={FF_LOGO} alt="Family Fortunes" /></div>
          <h2 className={view?.screen === "final" ? "ff-display" : "ff-turn-title"} role="status">{status}</h2>
          {roundActions.length > 0 && <div className="ff-opening-actions">{roundActions.map(actionButton)}</div>}
        </>}
      </section>
    </div>
  </main>;
}

const App = document.body.classList.contains("ff-teacher-window") ? FamilyFortunesTeacher : FamilyFortunesGame;
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
