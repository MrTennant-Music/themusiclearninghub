const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const test = require("node:test");
const vm = require("node:vm");
const Babel = require("../vendor/babel/babel.min.js");
const hubCollections = require("../shared/hub-collections.js");

const projectRoot = path.resolve(__dirname, "..");
const read = (relativePath) => fs.readFileSync(path.join(projectRoot, relativePath), "utf8");

test("the round library keeps level-specific answers and custom rounds", () => {
  const runtime = read("familyfortunes/familyfortunes.runtime.js");
  const savedIds = ["literacy-n3-note-values", "literacy-n3-playing-techniques", "custom-existing-question-0"];
  const saved = { version: 2, ids: ["MC-0001", ...savedIds] };
  const window = { FAMILY_FORTUNES_ANSWERS: {}, localStorage: { getItem: () => JSON.stringify(saved) } };
  const { getRoundLibrary, readSelectedQuestionIds } = vm.runInNewContext(
    `${runtime.split("const App = document.body")[0]}\n({ getRoundLibrary, readSelectedQuestionIds });`,
    { React: {}, window }
  );
  const overrides = { "MC-0001": { label: "Old style round" } };
  const [national3Rhythms, national3Techniques, national3OrchestraFamilies, national3DanceBand] = getRoundLibrary("N3", [], overrides);
  const [national4Rhythms, national4Ragtime] = getRoundLibrary("N4", [], overrides);
  const basicRhythms = ["Semibreve", "Dotted minim", "Minim", "Crotchet"];
  assert.deepEqual(Array.from(national3Rhythms.answers), basicRhythms);
  assert.deepEqual(Array.from(national4Rhythms.answers), [...basicRhythms, "Quaver", "Semiquaver"]);
  assert.equal(national4Ragtime.label, "Ragtime");
  assert.equal(national4Ragtime.prompt, "Name features of ragtime.");
  assert.deepEqual(Array.from(national4Ragtime.answers), ["Vamp", "Syncopated melody", "Piano", "Jazz"]);
  const custom = [{ id: "custom-existing", name: "My round", questions: [{ prompt: "Name four answers.", answers: ["A", "B", "C", "D"] }] }];
  const rounds = getRoundLibrary("N3", custom, overrides);
  assert.deepEqual(Array.from(rounds, (round) => round.label), ["Rhythms", "Playing Techniques", "Orchestral Families", "Scottish Dance Band", "Dynamics", "My round"]);
  assert.deepEqual(Array.from(readSelectedQuestionIds(rounds.map((round) => round.id), "N3")), savedIds);

  vm.runInNewContext(read("familyfortunes/familyfortunes-answer-aliases.js"), { window });
  const { matchIndex } = window.FAMILY_FORTUNES_ANSWERS;
  const [national5, national5Scales, national5VoiceTypes, national5TimeSignatures, national5Techniques, national5Tempo, national5ScottishInstruments, national5ScottishDances, national5Forms, national5Woodwinds] = getRoundLibrary("N5", [], overrides);
  const [advancedHigher] = getRoundLibrary("AH", [], overrides);
  assert.deepEqual(Array.from(national5.answers), ["C major", "G major", "F major", "A minor"]);
  assert.deepEqual(Array.from(advancedHigher.answers), ["D major", "B♭ major", "E minor", "D minor", ...national5.answers]);
  assert.deepEqual(Array.from(readSelectedQuestionIds([national5.id], "N5")), [national5.id]);
  assert.equal(matchIndex(national5, "A minor"), 3);
  assert.equal(matchIndex(national5, "no sharps or flats"), -1);
  assert.equal(matchIndex(advancedHigher, "D major"), 0);
  assert.equal(matchIndex(advancedHigher, "Bb major"), 1);
  assert.equal(matchIndex(advancedHigher, "C major"), 4);

  const [higherChords, higherCadences, higherScales, higherTonality, higherRhythmicFeatures, higherConcertoGrosso, higherForms] = getRoundLibrary("H", [], overrides);
  const [, advancedHigherChords, advancedHigherOrnaments, advancedHigherVoiceTypes, advancedHigherSerialMusic, advancedHigherFugue, advancedHigherTonality, advancedHigherRhythmicFeatures, advancedHigherIntervals, advancedHigherTimeSignatures, advancedHigherTextures] = getRoundLibrary("AH", [], overrides);
  const chordTypes = ["Added 6th", "Dominant 7th", "Diminished 7th", "Diminished triad"];
  assert.equal(higherChords.prompt, "Name types of chord.");
  assert.deepEqual(Array.from(higherChords.answers), chordTypes);
  assert.deepEqual(Array.from(advancedHigherChords.answers), [...chordTypes, "Augmented triad"]);
  assert.equal(matchIndex(higherChords, "fully diminished seventh"), 2);
  assert.equal(matchIndex(higherChords, "augmented triad"), -1);
  assert.equal(matchIndex(advancedHigherChords, "augmented chord"), 4);
  assert.deepEqual(Array.from(advancedHigherOrnaments.answers), ["Turn", "Trill", "Acciaccatura", "Appoggiatura", "Mordent"]);
  assert.ok(advancedHigherOrnaments.prompt.length <= 180);
  assert.equal(matchIndex(advancedHigherOrnaments, "lower mordent"), 4);
  assert.equal(matchIndex(advancedHigherOrnaments, "upper mordent"), -1);
  assert.deepEqual(Array.from(higherCadences.answers), ["Imperfect", "Perfect", "Interrupted", "Plagal"]);
  assert.equal(higherCadences.prompt, "Name types of cadence.");
  assert.equal(matchIndex(higherCadences, "Interrupted cadence"), 2);
  const nonMinorScales = ["Whole-tone scale", "Chromatic scale", "Pentatonic scale", "Major scale"];
  assert.deepEqual(Array.from(national5Scales.answers), nonMinorScales);
  assert.deepEqual(Array.from(higherScales.answers), ["Harmonic minor scale", "Melodic minor scale", ...nonMinorScales]);
  assert.equal(higherScales.prompt, "Name types of scale.");
  assert.ok(higherScales.prompt.length <= 180);
  assert.equal(matchIndex(higherScales, "ascending melodic minor"), 1);
  assert.equal(matchIndex(national5Scales, "major pentatonic"), 2);
  assert.equal(matchIndex(national5Scales, "minor pentatonic"), -1);
  const voiceTypes = ["Soprano", "Mezzo soprano", "Alto", "Tenor", "Baritone", "Bass"];
  assert.deepEqual(Array.from(national5VoiceTypes.answers), voiceTypes);
  assert.deepEqual(Array.from(advancedHigherVoiceTypes.answers), [...voiceTypes, "Countertenor"]);
  assert.equal(matchIndex(national5VoiceTypes, "mezzo-soprano"), 1);
  assert.equal(matchIndex(national5VoiceTypes, "contralto"), 2);
  assert.equal(matchIndex(national5VoiceTypes, "countertenor"), -1);
  assert.equal(matchIndex(advancedHigherVoiceTypes, "counter-tenor"), 6);
  assert.deepEqual(Array.from(advancedHigherSerialMusic.answers), ["Retrograde", "Inversion", "Tone row", "Atonal"]);
  assert.ok(advancedHigherSerialMusic.prompt.length <= 180);
  assert.equal(matchIndex(advancedHigherSerialMusic, "note row"), 2);
  assert.equal(matchIndex(advancedHigherSerialMusic, "note row", [2]), -1);
  assert.equal(matchIndex(advancedHigherSerialMusic, "atonality"), 3);
  assert.deepEqual(Array.from(advancedHigherFugue.answers), ["Subject", "Countersubject", "Answer", "Stretto", "Polyphonic", "Imitation"]);
  assert.ok(advancedHigherFugue.prompt.length <= 180);
  assert.equal(matchIndex(advancedHigherFugue, "counter-subject"), 1);
  assert.equal(matchIndex(advancedHigherFugue, "polyphony"), 4);
  const tonalities = ["Atonal", "Major", "Minor", "Modal"];
  assert.deepEqual(Array.from(higherTonality.answers), tonalities);
  assert.deepEqual(Array.from(advancedHigherTonality.answers), [...tonalities, "Polytonality or bitonality"]);
  assert.ok(advancedHigherTonality.prompt.length <= 180);
  assert.equal(matchIndex(higherTonality, "bitonality"), -1);
  assert.equal(matchIndex(advancedHigherTonality, "polytonality"), 4);
  assert.equal(matchIndex(advancedHigherTonality, "bitonality"), 4);
  assert.equal(matchIndex(advancedHigherTonality, "bitonality", [4]), -1);
  const rhythmicFeatures = ["3 against 2", "Time changes", "Irregular time signatures", "Triplets", "Augmentation", "Diminution"];
  assert.deepEqual(Array.from(higherRhythmicFeatures.answers), rhythmicFeatures);
  assert.deepEqual(Array.from(advancedHigherRhythmicFeatures.answers), [...rhythmicFeatures, "Hemiola"]);
  assert.ok(advancedHigherRhythmicFeatures.prompt.length <= 180);
  assert.equal(matchIndex(higherRhythmicFeatures, "two against three"), 0);
  assert.equal(matchIndex(higherRhythmicFeatures, "two against two"), -1);
  assert.equal(matchIndex(higherRhythmicFeatures, "hemiola"), -1);
  assert.equal(matchIndex(advancedHigherRhythmicFeatures, "hemiola"), 6);
  assert.deepEqual(Array.from(higherConcertoGrosso.answers), ["Ripieno", "Concertino", "Ritornello", "Basso continuo"]);
  assert.equal(matchIndex(higherConcertoGrosso, "continuo"), 3);
  assert.deepEqual(Array.from(advancedHigherIntervals.answers), ["Tritone", "Semitone", "Tone", "Octave"]);
  assert.equal(matchIndex(advancedHigherIntervals, "diminished fifth"), 0);
  assert.equal(matchIndex(advancedHigherIntervals, "half step"), 1);
  assert.equal(matchIndex(advancedHigherIntervals, "whole tone"), 2);
  assert.equal(matchIndex(advancedHigherIntervals, "perfect octave"), 3);
  const timeSignatures = ["2/4", "3/4", "4/4", "6/8", "9/8", "12/8"];
  assert.deepEqual(Array.from(national5TimeSignatures.answers), timeSignatures);
  assert.deepEqual(Array.from(advancedHigherTimeSignatures.answers), [...timeSignatures, "5/4"]);
  assert.equal(matchIndex(national5TimeSignatures, "common time"), 2);
  assert.equal(matchIndex(national5TimeSignatures, "5/4"), -1);
  assert.equal(matchIndex(advancedHigherTimeSignatures, "five over four"), 6);
  assert.deepEqual(Array.from(national3Techniques.answers), ["Blowing", "Bowing", "Plucking", "Strumming", "Striking / hitting"]);
  assert.equal(matchIndex(national3Techniques, "striking"), 4);
  assert.equal(matchIndex(national3Techniques, "hitting"), 4);
  assert.deepEqual(Array.from(national3OrchestraFamilies.answers), ["Strings", "Brass", "Woodwind", "Percussion"]);
  assert.equal(matchIndex(national3OrchestraFamilies, "woodwinds"), 2);
  assert.deepEqual(Array.from(national3DanceBand.answers), ["Drum kit", "Piano", "Acoustic guitar", "Fiddle", "Accordion"]);
  assert.equal(matchIndex(national3DanceBand, "drum set"), 0);
  assert.equal(matchIndex(national3DanceBand, "electric guitar"), -1);
  assert.deepEqual(Array.from(national5Techniques.answers), ["Rolls", "Flutter tonguing", "Con sordino", "Pizzicato", "Arco"]);
  assert.equal(matchIndex(national5Techniques, "drum roll"), 0);
  assert.equal(matchIndex(national5Techniques, "flutter-tonguing"), 1);
  const higherTechniques = getRoundLibrary("H", [], overrides).find((round) => round.id === "literacy-h-playing-techniques");
  assert.deepEqual(Array.from(higherTechniques.answers), [...national5Techniques.answers, "Tremolando", "Harmonics"]);
  assert.ok(higherTechniques.prompt.length <= 180);
  assert.equal(matchIndex(higherTechniques, "drum roll"), 0);
  assert.equal(matchIndex(higherTechniques, "tremolo"), 5);
  assert.equal(matchIndex(higherTechniques, "harmonic"), 6);
  assert.equal(matchIndex(national5Techniques, "tremolo"), -1);
  assert.deepEqual(Array.from(national5Tempo.answers), ["Accelerando", "Ritardando", "Rallentando", "A tempo", "Andante", "Allegro", "Adagio", "Moderato", "Rubato"]);
  assert.equal(matchIndex(national5Tempo, "rit."), 1);
  assert.equal(matchIndex(national5Tempo, "rall.", [1]), 2);
  assert.deepEqual(Array.from(national5ScottishInstruments.answers), ["Accordion", "Fiddle", "Bagpipes", "Bodhran", "Clarsach"]);
  assert.equal(matchIndex(national5ScottishInstruments, "bodhrán"), 3);
  assert.equal(matchIndex(national5ScottishInstruments, "clàrsach"), 4);
  assert.equal(matchIndex(national5ScottishInstruments, "Scottish harp"), 4);
  assert.deepEqual(Array.from(national5ScottishDances.answers), ["Waltz", "Strathspey", "Reel", "Jig", "March"]);
  assert.deepEqual(Array.from(advancedHigherTextures.answers), ["Homophonic", "Polyphonic", "Contrapuntal", "Antiphonal"]);
  assert.equal(matchIndex(advancedHigherTextures, "polyphony"), 1);
  assert.equal(matchIndex(advancedHigherTextures, "counterpoint", [1]), 2);
  const forms = ["Strophic", "Binary", "Rondo", "Theme and variation", "Verse and chorus", "Middle 8"];
  assert.deepEqual(Array.from(national5Forms.answers), forms);
  assert.deepEqual(Array.from(higherForms.answers), [...forms, "Sonata form", "Through-composed"]);
  assert.ok(higherForms.prompt.length <= 180);
  assert.equal(matchIndex(national5Forms, "theme and variations"), 3);
  assert.equal(matchIndex(national5Forms, "middle eight"), 5);
  assert.equal(matchIndex(national5Forms, "sonata form"), -1);
  assert.equal(matchIndex(higherForms, "through composed"), 7);
  assert.deepEqual(Array.from(national5Woodwinds.answers), ["Piccolo", "Flute", "Clarinet", "Bassoon", "Oboe"]);
  assert.equal(matchIndex(national5Woodwinds, "concert flute"), 1);
  const national5Strings = getRoundLibrary("N5", [], overrides).find((round) => round.id === "literacy-n5-string-family");
  assert.deepEqual(Array.from(national5Strings.answers), ["Violin", "Viola", "Cello", "Double bass", "Harp"]);
  assert.equal(matchIndex(national5Strings, "contrabass"), 3);
  assert.equal(matchIndex(national5Strings, "pedal harp"), 4);
  const national5Brass = getRoundLibrary("N5", [], overrides).find((round) => round.id === "literacy-n5-brass-family");
  assert.deepEqual(Array.from(national5Brass.answers), ["Trumpet", "Tuba", "French horn", "Trombone"]);
  assert.equal(matchIndex(national5Brass, "horn"), 2);
  const national5ScottishStyles = getRoundLibrary("N5", [], overrides).find((round) => round.id === "literacy-n5-scottish-styles");
  assert.deepEqual(Array.from(national5ScottishStyles.answers), ["Gaelic psalm", "Pibroch", "Celtic rock", "Scots ballad", "Bothy ballad", "Mouth music"]);
  assert.equal(matchIndex(national5ScottishStyles, "ceol mor"), 1);
  assert.equal(matchIndex(national5ScottishStyles, "bothy ballad", [3]), 4);
  assert.equal(matchIndex(national5ScottishStyles, "puirt a beul"), 5);
  const getDynamics = (level) => getRoundLibrary(level, [], overrides).find((round) => round.label === "Dynamics");
  const national3Dynamics = ["Forte", "Piano", "Crescendo", "Diminuendo"];
  const national4Dynamics = [...national3Dynamics, "Mezzo forte", "Mezzo piano"];
  assert.deepEqual(Array.from(getDynamics("N3").answers), national3Dynamics);
  assert.deepEqual(Array.from(getDynamics("N4").answers), national4Dynamics);
  const national5Dynamics = getDynamics("N5");
  assert.deepEqual(Array.from(national5Dynamics.answers), [...national4Dynamics, "Fortissimo", "Pianissimo", "Sforzando"]);
  assert.equal(matchIndex(national5Dynamics, "sfz"), -1);
  assert.equal(matchIndex(national5Dynamics, "pianoforte"), -1);
  assert.equal(matchIndex(national5Dynamics, "sforzando"), 8);
  assert.equal(matchIndex(national5Dynamics, "mezzo-forte"), 4);
  assert.equal(matchIndex({ label: "Dynamics", answers: ["Fortissimo"] }, "ff"), 0);
  const national5Aria = getRoundLibrary("N5", [], overrides).find((round) => round.id === "literacy-n5-aria");
  assert.deepEqual(Array.from(national5Aria.answers), ["Solo voice", "Opera", "Often in Italian", "Orchestral accompaniment"]);
  assert.equal(matchIndex(national5Aria, "one singer"), 0);
  assert.equal(matchIndex(national5Aria, "Italian"), 2);
  assert.equal(matchIndex(national5Aria, "orchestra"), 3);
  const national5WaulkingSong = getRoundLibrary("N5", [], overrides).find((round) => round.id === "literacy-n5-waulking-song");
  assert.deepEqual(Array.from(national5WaulkingSong.answers), ["A cappella", "Steady beat", "Gaelic text", "Call and response"]);
  assert.equal(matchIndex(national5WaulkingSong, "unaccompanied"), 0);
  assert.equal(matchIndex(national5WaulkingSong, "steady pulse"), 1);
  assert.equal(matchIndex(national5WaulkingSong, "Scottish Gaelic"), 2);
  assert.equal(matchIndex(national5WaulkingSong, "question and answer"), 3);
  const national5BothyBallad = getRoundLibrary("N5", [], overrides).find((round) => round.id === "literacy-n5-bothy-ballad");
  assert.deepEqual(Array.from(national5BothyBallad.answers), ["Scots language", "Singing about work or life", "A cappella", "Strophic"]);
  assert.equal(matchIndex(national5BothyBallad, "Scots"), 0);
  assert.equal(matchIndex(national5BothyBallad, "farm work"), 1);
  assert.equal(matchIndex(national5BothyBallad, "unaccompanied"), 2);
  assert.equal(matchIndex(national5BothyBallad, "same tune for each verse"), 3);
  const national5Baroque = getRoundLibrary("N5", [], overrides).find((round) => round.id === "literacy-n5-baroque-features");
  assert.deepEqual(Array.from(national5Baroque.answers), ["Harpsichord", "Polyphonic or contrapuntal texture", "Imitation", "Sequence", "Ornamentation"]);
  assert.equal(matchIndex(national5Baroque, "polyphonic"), 1);
  assert.equal(matchIndex(national5Baroque, "contrapuntal"), 1);
  assert.equal(matchIndex(national5Baroque, "imitation", [1]), 2);
  assert.equal(matchIndex(national5Baroque, "ornaments"), 4);
  const national5Romantic = getRoundLibrary("N5", [], overrides).find((round) => round.id === "literacy-n5-romantic-features");
  assert.deepEqual(Array.from(national5Romantic.answers), ["Chromatic", "Rubato", "Wide dynamic range", "Expressive", "Large orchestra"]);
  assert.equal(matchIndex(national5Romantic, "chromatic harmony"), 0);
  assert.equal(matchIndex(national5Romantic, "expressive melodies"), 3);
  assert.equal(matchIndex(national5Romantic, "expanded orchestra"), 4);
  const national4Percussion = getRoundLibrary("N4", [], overrides).find((round) => round.id === "literacy-n4-orchestral-percussion");
  assert.deepEqual(Array.from(national4Percussion.answers), ["Timpani", "Glockenspiel", "Xylophone", "Snare drum", "Bass drum", "Cymbals"]);
  assert.equal(matchIndex(national4Percussion, "kettledrums"), 0);
  assert.equal(matchIndex(national4Percussion, "side drum"), 3);
  const higherArticulation = getRoundLibrary("H", [], overrides).find((round) => round.id === "literacy-h-articulation-types");
  assert.equal(higherArticulation.label, "Articulation & Phrasing");
  assert.deepEqual(Array.from(higherArticulation.answers), ["Slurs", "Phrase marks", "Staccato", "Accents", "Legato"]);
  assert.equal(matchIndex(higherArticulation, "slur"), 0);
  assert.equal(matchIndex(higherArticulation, "phrase mark", [0]), 1);
  assert.equal(matchIndex(higherArticulation, "legato", [0, 1]), 4);
  const higherMass = getRoundLibrary("H", [], overrides).find((round) => round.id === "literacy-h-mass-sections");
  assert.deepEqual(Array.from(higherMass.answers), ["Kyrie", "Gloria", "Credo", "Sanctus", "Agnus Dei"]);
  assert.equal(matchIndex(higherMass, "agnus dei"), 4);
  const higherPlainchant = getRoundLibrary("H", [], overrides).find((round) => round.id === "literacy-h-plainchant");
  assert.deepEqual(Array.from(higherPlainchant.answers), ["A cappella", "Monophonic", "Latin text", "Modal"]);
  assert.equal(matchIndex(higherPlainchant, "unaccompanied"), 0);
  assert.equal(matchIndex(higherPlainchant, "monophony"), 1);
  assert.equal(matchIndex(higherPlainchant, "Latin"), 2);
  assert.equal(matchIndex(higherPlainchant, "church modes"), 3);
  const higherLied = getRoundLibrary("H", [], overrides).find((round) => round.id === "literacy-h-lied");
  assert.deepEqual(Array.from(higherLied.answers), ["Solo voice", "Piano", "German text", "Romantic period"]);
  assert.equal(matchIndex(higherLied, "one singer"), 0);
  assert.equal(matchIndex(higherLied, "German"), 2);
  assert.equal(matchIndex(higherLied, "Romantic"), 3);
  const higherOratorio = getRoundLibrary("H", [], overrides).find((round) => round.id === "literacy-h-oratorio");
  assert.deepEqual(Array.from(higherOratorio.answers), ["English or German text", "Chorus", "Story from the Bible", "Orchestral accompaniment"]);
  assert.equal(matchIndex(higherOratorio, "English"), 0);
  assert.equal(matchIndex(higherOratorio, "German", [0]), -1);
  assert.equal(matchIndex(higherOratorio, "German"), 0);
  assert.equal(matchIndex(higherOratorio, "choir"), 1);
  assert.equal(matchIndex(higherOratorio, "biblical story"), 2);
  assert.equal(matchIndex(higherOratorio, "orchestra"), 3);
  const advancedHigherRepeats = getRoundLibrary("AH", [], overrides).find((round) => round.id === "literacy-ah-repeat-navigation");
  assert.deepEqual(Array.from(advancedHigherRepeats.answers), ["Da capo", "Dal segno", "Fine", "Coda", "First and second time bars"]);
  assert.equal(matchIndex(advancedHigherRepeats, "D.C."), 0);
  assert.equal(matchIndex(advancedHigherRepeats, "DS"), 1);
  assert.equal(matchIndex(advancedHigherRepeats, "1st and 2nd time bars"), 4);
  const advancedHigherRenaissance = getRoundLibrary("AH", [], overrides).find((round) => round.id === "literacy-ah-renaissance-styles");
  assert.deepEqual(Array.from(advancedHigherRenaissance.answers), ["Pavan", "Galliard", "Motet", "Ayre or air", "Ballett", "Madrigal", "Anthem"]);
  assert.ok(advancedHigherRenaissance.prompt.length <= 180);
  assert.equal(matchIndex(advancedHigherRenaissance, "ayre"), 3);
  assert.equal(matchIndex(advancedHigherRenaissance, "air"), 3);
  assert.equal(matchIndex(advancedHigherRenaissance, "ballet"), 4);
  assert.equal(matchIndex(advancedHigherRenaissance, "anthem", [5]), 6);
  const advancedHigherChorale = getRoundLibrary("AH", [], overrides).find((round) => round.id === "literacy-ah-chorale");
  assert.deepEqual(Array.from(advancedHigherChorale.answers), ["German text", "Mainly homophonic", "SATB choir", "Religious"]);
  assert.equal(matchIndex(advancedHigherChorale, "German"), 0);
  assert.equal(matchIndex(advancedHigherChorale, "homophonic"), 1);
  assert.equal(matchIndex(advancedHigherChorale, "SATB"), 2);
  assert.equal(matchIndex(advancedHigherChorale, "sacred"), 3);
  const advancedHigherAyre = getRoundLibrary("AH", [], overrides).find((round) => round.id === "literacy-ah-ayre");
  assert.deepEqual(Array.from(advancedHigherAyre.answers), ["Solo voice", "English text", "Accompanied", "Often melancholic"]);
  assert.equal(matchIndex(advancedHigherAyre, "English"), 1);
  assert.equal(matchIndex(advancedHigherAyre, "lute accompaniment"), 2);
  assert.equal(matchIndex(advancedHigherAyre, "melancholic"), 3);
  const advancedHigherBallett = getRoundLibrary("AH", [], overrides).find((round) => round.id === "literacy-ah-ballett");
  assert.deepEqual(Array.from(advancedHigherBallett.answers), ["A cappella", "English text", "Secular music", "Imitative", "Fa-la-la refrain"]);
  assert.equal(matchIndex(advancedHigherBallett, "unaccompanied"), 0);
  assert.equal(matchIndex(advancedHigherBallett, "imitation"), 3);
  assert.equal(matchIndex(advancedHigherBallett, "fa la la"), 4);
});

test("the round library and saved selections are restricted to the selected level", () => {
  const runtime = read("familyfortunes/familyfortunes.runtime.js");
  const savedSelections = new Map();
  const window = { FAMILY_FORTUNES_ANSWERS: {}, localStorage: { getItem: (key) => savedSelections.get(key) } };
  const { getRoundLibrary, readSelectedQuestionIds, levelStorageKey, storageKey } = vm.runInNewContext(
    `${runtime.split("const App = document.body")[0]}\n({ getRoundLibrary, readSelectedQuestionIds, levelStorageKey, storageKey: SELECTED_ROUNDS_STORAGE_KEY });`,
    { React: {}, window }
  );

  for (const level of ["N3", "N4", "N5", "H", "AH"]) {
    const library = getRoundLibrary(level, [], {});
    const availableIds = Array.from(library, ({ id }) => id);
    assert.ok(availableIds.length > 0);
    assert.ok(availableIds.every((id) => id.startsWith(`literacy-${level.toLowerCase()}-`)));
    assert.equal(new Set(availableIds).size, availableIds.length);
    assert.deepEqual(Array.from(readSelectedQuestionIds(availableIds, level)), availableIds);
  }

  const inheritedId = "literacy-n3-note-values";
  const higherKey = levelStorageKey(storageKey, "H");
  const higherLibrary = getRoundLibrary("H", [], { [inheritedId]: { label: "Edited rhythms" } });
  assert.equal(higherLibrary.some(({ id }) => id === inheritedId), false);
  assert.equal(getRoundLibrary("N3", [], {}).find(({ id }) => id === inheritedId).label, "Rhythms");
  const savedIds = ["literacy-h-cadences", "literacy-h-playing-techniques", "literacy-h-lied"];
  savedSelections.set(higherKey, JSON.stringify({ version: 3, ids: [...savedIds, "literacy-n5-dynamics", inheritedId] }));
  assert.deepEqual(Array.from(readSelectedQuestionIds(higherLibrary.map(({ id }) => id), "H")), savedIds);
});

test("Family Fortunes offers its own round library and editor", () => {
  const source = read("familyfortunes/familyfortunes.js");
  assert.equal(Object.hasOwn(hubCollections.applications, "familyfortunes"), false);
  assert.match(source, /<ul className="ff-round-menu-list" aria-label="Available rounds">/);
  assert.match(source, /onClick=\{\(\) => openRoundEditor\(\)\}><span className="ig-crossword-menu-copy"><strong>Create<\/strong>/);
  assert.doesNotMatch(source, /FamilyFortunesStyles|National 3 Styles|HubCollections|Jazz and Popular Music/);
});

test("playable and newly created rounds enforce four to ten answers", () => {
  const source = read("familyfortunes/familyfortunes.js");
  assert.match(source, /const MIN_ANSWERS_PER_QUESTION = 4/);
  assert.match(source, /answers\.slice\(0, MAX_ANSWERS_PER_QUESTION\)/);
  assert.match(source, /answers\.length >= MIN_ANSWERS_PER_QUESTION/);
  assert.match(source, /Array\(MIN_ANSWERS_PER_QUESTION\)\.fill\(""\)/);
  assert.match(source, /questions\.findIndex[\s\S]*question\.answers\.length < MIN_ANSWERS_PER_QUESTION/);
  assert.match(source, /disabled=\{question\.answers\.length <= MIN_ANSWERS_PER_QUESTION\}/);
});

test("rounds are always shuffled and the editor has no reorder controls", () => {
  const source = read("familyfortunes/familyfortunes.js");
  assert.match(source, /const orderedRounds = shuffledIndexes\(availableRounds\.length\)\.map\(\(index\) => availableRounds\[index\]\);/);
  assert.doesNotMatch(source, /randomiseRounds|ff-round-order-handle|moveRound\b|onDragStart=/);
});

test("the round editor omits the Minimum 3 shortcut", () => {
  assert.doesNotMatch(read("familyfortunes/familyfortunes.js"), />Minimum 3</);
});

test("the deployed runtime is rebuilt from the current JSX source", () => {
  const source = read("familyfortunes/familyfortunes.js");
  const expected = `${Babel.transform(source, { comments: false, compact: false, presets: ["react"], sourceMaps: false }).code}\n`;
  assert.equal(read("familyfortunes/familyfortunes.runtime.js"), expected);
  const html = read("familyfortunes/familyfortunes.html");
  assert.match(html, /familyfortunes\.runtime\.js/);
  assert.doesNotMatch(html, /babel\.min\.js|text\/babel/);
});

test("reset invalidates and cancels pending answer feedback", () => {
  const source = read("familyfortunes/familyfortunes.js");
  const resetBody = source.slice(source.indexOf("const resetGame ="), source.indexOf("const toggleQuestion ="));
  assert.match(resetBody, /answerSequenceGenerationRef\.current \+= 1/);
  assert.match(resetBody, /answerSequenceCancelRef\.current\?\.\(\)/);
  assert.match(resetBody, /audienceFadeCancelRef\.current\?\.\(\)/);
  assert.match(resetBody, /releaseAudio\(answerSequenceAudioRef\.current\)/);
  assert.match(source, /if \(!sequenceIsCurrent\(\)\) return;/);
});

test("audience feedback releases audio even when the projector tab paints no frames", async () => {
  const source = read("familyfortunes/familyfortunes.js");
  const start = source.indexOf("    const playAudienceFade =");
  const end = source.indexOf("\n    try {", start);
  const timers = new Map();
  const audio = { play: () => Promise.resolve(), addEventListener() {}, removeEventListener() {} };
  const released = [];
  const audienceFadeCancelRef = { current: null };
  const fade = vm.runInNewContext(`${source.slice(start, end)}\nplayAudienceFade`, {
    createAudio: () => audio,
    releaseAudio: (track) => released.push(track),
    audienceFadeCancelRef,
    performance: { now: () => 0 },
    window: {
      requestAnimationFrame: () => 1,
      cancelAnimationFrame() {},
      setTimeout(callback, delay) { timers.set(delay, callback); return delay; },
      clearTimeout(delay) { timers.delete(delay); },
    },
  });
  const finished = fade();
  await Promise.resolve();
  assert.equal(timers.size, 1);
  timers.get(2000)();
  assert.equal(released[0], audio);
  assert.equal(audienceFadeCancelRef.current, null);
  await finished;
});

test("modal and status accessibility contracts remain present", () => {
  const source = read("familyfortunes/familyfortunes.js");
  assert.match(source, /\.focus\(\{ preventScroll: true \}\)/);
  assert.doesNotMatch(source, /document\.body\.style\.overflow/);
  assert.match(read("familyfortunes/familyfortunes.css"), /\.ff-overlay-backdrop \{ position: absolute;/);
  assert.match(source, /event\.key !== "Tab"/);
  assert.match(source, /sibling\.inert = true/);
  assert.match(source, /role="status" aria-live="polite" aria-atomic="true"/);
  assert.match(source, /aria-label="Sound"[\s\S]*aria-pressed=\{soundEnabled\}/);
  assert.doesNotMatch(source, /ff-stage[^\n]+aria-live=/);
});
