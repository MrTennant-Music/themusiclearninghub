const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const html = fs.readFileSync("auralrecognition.html", "utf8");
const source = html.match(/<script type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/)[1];

test("Ear Training retains every exercise and omits its unused notation renderer", () => {
  for (const topic of ["cadence", "chord", "tonality", "beatsPerBar", "scales", "ornaments", "metre", "tempoChanges"]) {
    assert.match(source, new RegExp(`${topic}: \\{ label:`));
  }
  assert.match(source, /\.\.\.EAR_TRAINING\.topics/);
  assert.match(source, /const ISOLATED_TOPICS = new Set\(\["cadence", "chord", "scales", "ornaments"/);
  assert.match(source, /ISOLATED_TOPICS\.has\(topic\)[\s\S]*?label="In Context"[\s\S]*?<p className="-mt-1 mb-3 px-3 text-xs leading-tight text-stone-500"[^>]*>Hear the concept within a complete musical excerpt\. Turn this off if you'd prefer to hear concepts in isolation\.<\/p>/);
  assert.match(source, /const FULL_EXCERPT_STORAGE_KEY = "mlh:aural-recognition:full-excerpts"/);
  assert.match(source, /const FULL_EXCERPT_DEFAULTS_VERSION = 2/);
  assert.match(source, /function initialFullExcerptPreferences\(\)[\s\S]*?window\.localStorage\.getItem\(FULL_EXCERPT_STORAGE_KEY\)/);
  assert.match(source, /const fallback = \{ ornamentPassage:true, scalesPassage:true, chordPassage:true, expandedPassages:\{\} \}/);
  assert.match(source, /expandedPassages\[questionTopic\] !== false/);
  assert.doesNotMatch(source, /const passageSetting =/);
  assert.match(source, /options:\{ tempo:"randomised-three-state", metronome:activeTopic === "ornaments" \? false : metronome, passage:true \}/);
  assert.match(source, /window\.localStorage\.setItem\(FULL_EXCERPT_STORAGE_KEY, JSON\.stringify\(\{ defaultsVersion:FULL_EXCERPT_DEFAULTS_VERSION, ornamentPassage, scalesPassage, chordPassage, expandedPassages \}\)\)/);
  assert.match(source, /\[ornamentPassage, scalesPassage, chordPassage, expandedPassages\]/);
  assert.doesNotMatch(source, /label="Full Passage"/);
  assert.match(source, /showActivityList:!validExplicitTopic/);
  assert.match(source, /function ActivityChooser\(\{ level, onSelect \}\)/);
  assert.match(source, /<h2 className="ear-training-chooser-heading ear-training-exercise-heading text-stone-950"><ExerciseIcon topic=\{activeTopic\}\/><span>\{TOPICS\[activeTopic\]\.label\}<\/span><\/h2>/);
  assert.doesNotMatch(source, /TOPICS\[topic\]\?\.preserveLevel/);
  assert.match(source, /function newConceptIdsForLevel\(level, topic\)/);
  assert.match(source, /const LEVEL_MENU_OPTIONS = \{ ALL: \{ label: "All Levels", icon:<img src=\{ASSET\.showAll\}/);
  assert.match(source, /chooserLevel === "ALL" \? ASSET\.showAll : ASSET\.level/);
  assert.match(source, /function AllLevelsActivityChooser\(\{ onSelect \}\)/);
  assert.match(html, /\.ear-training-all-levels-button \{ width: 100%; height: 100%; min-height: 86px; \}/);
  assert.match(html, /\.hub-toolbar\.ear-training-exercise-toolbar > \.hub-toolbar-feedback \{ position: absolute; left: 50%; top: 50%; transform: translate\(-50%, -50%\); \}/);
  assert.match(html, /\.ear-training-feedback-pill \{ position: absolute; left: 75%; top: 50%; width: 118px; transform: translate\(-50%, -50%\); \}/);
  assert.match(html, /\.recognition-exercise-bravura \{[^}]*border: 0;[^}]*background: transparent;/);
  assert.match(html, /grid-template-columns: repeat\(5, minmax\(0, 1fr\)\)/);
  assert.match(html, /\.ear-training-all-levels-divider \{ grid-column: 1 \/ -1; height: 1px; background: #dbe3ed; \}/);
  assert.match(source, /key=\{`divider-\$\{theme\.label\}`\} className="ear-training-all-levels-divider" aria-hidden="true"/);
  assert.match(source, /function ConceptSubtitle\(\{ level, topic, stacked = false \}\)[\s\S]*?orderedLabels = \[\.\.\.labels\.filter\(concept => !earlierLabels\.has\(concept\)\), \.\.\.labels\.filter\(concept => earlierLabels\.has\(concept\)\)\][\s\S]*?ear-training-new-concept/);
  assert.match(source, /extendsEarlierExercise && !earlierLabels\.has\(concept\) \? " ear-training-new-concept" : ""/);
  assert.match(source, /if \(!topic\) return <div key=\{`\$\{theme\.label\}-\$\{level\}`\} className="ear-training-all-levels-cell" aria-hidden="true"><\/div>/);
  assert.ok(source.includes('chooserLevel === "ALL" ? <AllLevelsActivityChooser onSelect={applyTopic}/> : <ActivityChooser level={chooserLevel} onSelect={applyTopic}/>'));
  assert.match(source, /function conceptSubtitleForLevel\(level, topic\)/);
  assert.match(source, /const TEMPOS = \[\{ id:"adagio", label:"Adagio", bpm:60 \}, \{ id:"andante", label:"Andante", bpm:80 \}, \{ id:"allegro", label:"Allegro", bpm:100 \}\]/);
  assert.match(html, /ear-training-exercises\.js\?v=[a-zA-Z0-9-]+/);
  assert.match(html, /generated-runtimes\/auralrecognition-1\.js\?v=[a-f0-9]{12}/);
  assert.match(source, /const CUSTOMISE_STORAGE_KEY = "mlh:aural-recognition:customise"/);
  assert.match(source, /function initialCustomisePreferences\(\)[\s\S]*?enabledByLevel[\s\S]*?metronome/);
  assert.match(source, /function savedEnabledForLevel\(preferences, level\)[\s\S]*?stored\.filter\(id=>available\.includes\(id\)/);
  assert.match(source, /function saveCustomisePreferences\(\{ level, enabled, metronome \}\)[\s\S]*?window\.localStorage\.setItem\(CUSTOMISE_STORAGE_KEY,JSON\.stringify\(next\)\)/);
  assert.match(source, /useProfileState\("enabled", \(\)=>savedEnabledForLevel\(startingCustomisePreferences,startingSelection\.level\)\)/);
  assert.match(source, /saveCustomisePreferences\(\{level:activeLevel,enabled:ids\}\)/);
  assert.match(source, /beatsPerBar: \{ label: "Time Signatures"/);
  assert.match(source, /const labels = \["2, 3 or 4 beats in the bar"\][\s\S]*?labels\.push\("Simple time", "Compound time"\)[\s\S]*?labels\.push\("Irregular time signature", "Time changes"\)/);
  assert.match(source, /String\(CONCEPTS\[id\]\.count\)/);
  assert.match(source, /const SUBTITLE_CONTROL_ANSWERS = new Set\(\[[\s\S]*?"change-key-no"[\s\S]*?"device-no-pedal"[\s\S]*?"suspension-no", "vamp-no"[\s\S]*?"metre-3", "metre-4"/);
  assert.match(source, /const CUSTOMISE_BUNDLED_ANSWERS = new Set\(\[[\s\S]*?"change-key-no"[\s\S]*?"device-no-pedal", "motion-no-contrary"[\s\S]*?"suspension-no", "vamp-no"/);
  assert.doesNotMatch(source, /transform-original/);
  assert.match(source, /if \(topic === "repetitionSequence"\) return "Identify the melodic device\."/);
  assert.match(source, /if \(resolvedTopic === "repetitionSequence"\) \{[\s\S]*?answerId = chooseQuestionAnswer\(resolvedOptions, resolvedTopic\)[\s\S]*?options:fullOptions/);
  assert.match(source, /const chooseBalancedQuestionFamily = EAR_TRAINING\.createBalancedAnswerChooser\(\)/);
  assert.match(source, /selectedFamily=chooseQuestionFamily\(level,resolvedTopic,familyIds\)/);
  assert.match(source, /\.filter\(id => !SUBTITLE_CONTROL_ANSWERS\.has\(id\)\)/);
  assert.match(source, /earlierConcepts = new Set\(levels\.slice\(0, Math\.max\(0, levelIndex\)\)\.flatMap\(candidate => subtitleConceptIdsForLevel\(candidate, topic\)\)\)/);
  assert.match(source, /\.filter\(topic=>newConceptIdsForLevel\(level,topic\)\.length>0\)/);
  assert.match(source, /const MERGED_TOPIC_FAMILIES = \{[\s\S]*?beatsPerBar: \["beatsPerBar", "metre", "irregularMetre"\][\s\S]*?stepLeap: \["melodyDirection", "stepLeap", "melodicMotion"\][\s\S]*?accompanimentDevices: \["accompanimentDevices", "vamp", "changeOfKey", "modulation", "tiercePicardie", "relativeKey", "suspension"\][\s\S]*?repetitionSequence: \["repetitionSequence", "melodicTransformation"\][\s\S]*?rhythmicChange: \["anacrusis", "rhythmicChange"\]/);
  assert.match(source, /if \(\["beatsPerBar", "metre"\]\.includes\(CONCEPTS\[answerId\]\.family\)\) return buildTimeListeningQuestion\(level, enabledIds, answerId, options\)/);
  assert.match(source, /function buildTimeListeningQuestion\(level, enabledIds, answerId, familyOptions = null\)[\s\S]*?options: familyOptions \|\| availableConceptIdsForLevel\(level\)\.filter\(id => CONCEPTS\[id\]\.family === topic\)/);
  assert.doesNotMatch(source, /topic === "accompanimentPresence" && level === "N4"/);
  assert.match(source, /const MERGED_SUBTOPICS = new Set\(Object\.entries\(MERGED_TOPIC_FAMILIES\)/);
  assert.match(source, /\.filter\(topic=>!MERGED_SUBTOPICS\.has\(topic\)\)/);
  assert.match(source, /const labels = subtitleConceptIdsForLevel\(level, topic\)/);
  assert.match(source, /const OPTIONAL_CONCEPT_IDS = new Set\(CHORD_TYPES\.filter\(chord => chord\.optional\)\.map\(chord => chord\.id\)\)/);
  assert.match(source, /const pool = \(\["steadyTempo", "tempoChanges"\]\.includes\(topic\) && level === "N5"\) \|\| topic === "chord" \? availableConceptIdsForLevel\(level\) : conceptIdsForLevel\(level\)/);
  assert.match(source, /function taskMatchesLevel\(level, enabledIds, topic\)\{ const expected = assessmentConceptIdsForLevel\(level, topic\)\.filter\(id => !isOptionalScoringConcept\(id, level\)\); const actual = answerOptionsFor\(level, enabledIds, topic\)\.filter\(id => !isOptionalScoringConcept\(id, level\)\)/);
  assert.match(source, /questions:scoreAnswerOptionsFor\(activeLevel, enabled, activeTopic\)/);
  assert.match(source, /const tempoChanges = TEMPO_CHANGES\.questionConceptIdsForLevel\(level\);/);
  assert.doesNotMatch(source, /questionConceptIdsForLevel\(level\)\.filter\(id => id !== "rubato"\)/);
  assert.match(source, /if \(MERGED_TOPIC_FAMILIES\[topic\]\) return MERGED_TOPIC_FAMILIES\[topic\]\.flatMap\(family => pool\.filter\(id => CONCEPTS\[id\]\.family === family\)\)/);
  assert.match(source, /topic === "chordChanges"\) return "Chord • Discord • Chord changes"/);
  assert.match(source, /topic === "chordChanges"\) return "How many chords are heard\?"/);
  assert.match(source, /topic === "accompanimentDevices"\) return question\.level === "N4" \? "Does the music use a pedal\?" : "Identify the accompaniment device\."/);
  assert.match(source, /topic === "stepLeap"\) return assessmentConceptIdsForLevel\(level, topic\)[\s\S]*?\.filter\(id => !SUBTITLE_CONTROL_ANSWERS\.has\(id\)\)[\s\S]*?\.map\(id => CONCEPTS\[id\]\.label\)/);
  assert.match(source, /topic === "steadyTempo"\) return assessmentConceptIdsForLevel\(level, topic\)\.map\(id => CONCEPTS\[id\]\.label\)\.join\(" • "\)/);
  assert.match(source, /metre: \{ label: "Metre"/);
  const pianoConceptSource = fs.readFileSync("ear-training-piano-concepts.js", "utf8");
  for (const removedTopic of ["rhythmicFeatures", "articulation", "chordPresentation", "questionAnswer", "countermelody"]) assert.doesNotMatch(pianoConceptSource, new RegExp(`${removedTopic}: \\{ label:`));
  for (const removedConcept of ["device-drone", "imitation-canon", "motion-similar"]) assert.doesNotMatch(pianoConceptSource, new RegExp(`"${removedConcept}"`));
  assert.doesNotMatch(pianoConceptSource, /imitationType|imitation-free|imitation-none|buildImitation/);
  assert.doesNotMatch(pianoConceptSource, /accompanimentPresence|presence-accompanied|presence-unaccompanied|buildPresence/);
  assert.match(pianoConceptSource, /vamp: \{ label:"Harmonic Devices"/);
  assert.match(pianoConceptSource, /accompanimentDevices: \{ label:"Harmonic Devices"/);
  assert.match(pianoConceptSource, /suspension: \{ label:"Harmonic Devices"/);
  assert.doesNotMatch(pianoConceptSource, /unisonHarmony|layer-unison|layer-harmony|buildUnison|clonePassage/);
  assert.match(fs.readFileSync("ear-training-exercises.js", "utf8"), /stepLeap: \{ label: "Melodic Movements"/);
  assert.doesNotMatch(fs.readFileSync("ear-training-exercises.js", "utf8"), /texture-polyphonic|texture-homophonic|buildTexture/);
  assert.match(fs.readFileSync("ear-training-exercises.js", "utf8"), /chordChanges: \{ label: "Chords"/);
  assert.match(fs.readFileSync("ear-training-exercises.js", "utf8"), /rhythmicChange: \{ label: "Rhythmic Devices"/);
  assert.match(fs.readFileSync("ear-training-exercises.js", "utf8"), /tiercePicardie: \{ label: "Harmonic Devices"/);
  assert.match(fs.readFileSync("ear-training-exercises.js", "utf8"), /changeOfKey: \{ label: "Harmonic Devices"/);
  assert.match(fs.readFileSync("ear-training-exercises.js", "utf8"), /modulation: \{ label: "Harmonic Devices"/);
  assert.match(fs.readFileSync("ear-training-exercises.js", "utf8"), /relativeKey: \{ label: "Harmonic Devices"/);
  const tempoChangeSource = fs.readFileSync("tempo-changes-listening.js", "utf8");
  assert.doesNotMatch(tempoChangeSource.match(/function subtitleConceptIdsForLevel[\s\S]*?\n  \}/)[0], /aTempo/);
  assert.match(source, /if \(topic === "steadyTempo"\) return "Identify the tempo\.";/);
  assert.match(source, /function AnswerOptionLabel\(\{ id \}\) \{ return CONCEPTS\[id\]\.label; \}/);
  assert.doesNotMatch(source, /sharedSymbolForKey|timeSig\$\{concept\.count\}/);
  assert.match(fs.readFileSync("ear-training-piano-concepts.js", "utf8"), /steadyTempo: \{ label:"Tempo"/);
  assert.match(source, /description: conceptSubtitleForLevel\(level, topic\)/);
  assert.match(source, /function ActivityChooser\(\{ level, onSelect \}\)[\s\S]*?return <section className="mt-6" aria-labelledby="ear-training-activities-title">/);
  assert.match(source, /className="ear-training-activity-button flex[^\n]+">\s*<ExerciseIcon topic=\{topic\} menu=\{true\}\/\>/);
  assert.match(source, /ear-training-exercise-subtitle"><ConceptSubtitle level=\{level\} topic=\{topic\}\/>/);
  assert.match(source, /<div className="ear-training-activity-list">[\s\S]*?className="ear-training-activity-button flex/);
  assert.doesNotMatch(source, /<div className="grid grid-cols-3 gap-3">/);
  assert.doesNotMatch(source, /h-\[50px\] w-\[50px\][^\n]+<ExerciseIcon topic=\{topic\} menu=\{true\}/);
  assert.match(source, /\.sort\(\(first,second\)=>TOPICS\[first\]\.label\.localeCompare\(TOPICS\[second\]\.label,"en-GB",\{sensitivity:"base",numeric:true\}\)\)/);
  assert.match(source, /function ActivityChooser\(\{ level, onSelect \}\)[\s\S]*?activities\.map\(topic/);
  assert.match(source, /hub-toolbar-feedback"><h2 id="ear-training-activities-title"[^>]*>Choose Exercise<\/h2>/);
  assert.match(html, /\.hub-toolbar\.ear-training-chooser-toolbar \{ grid-template-columns: minmax\(0, 1fr\) auto minmax\(0, 1fr\); \}/);
  assert.match(html, /\.ear-training-chooser-heading \{ margin: 0; font-size: 22px; font-weight: 700; line-height: 1\.3; text-align: center; \}/);
  assert.match(html, /\.ear-training-activity-list \{ display: flex; flex-direction: column; gap: 12px; \}/);
  assert.match(html, /\.ear-training-activity-button \{ width: 100%; min-height: 72px; \}/);
  assert.match(html, /\.ear-training-exercise-subtitle \{[^}]*color: #475569;[^}]*font-weight: 400;[^}]*\}/);
  assert.match(html, /\.ear-training-new-concept \{ color: #0f172a; font-weight: 700; \}/);
  assert.match(source, /id="ear-training-activities-title" className="ear-training-chooser-heading text-stone-950"/);
  assert.match(source, /className="hub-toolbar ear-training-chooser-toolbar relative z-20">\s*<div className="hub-toolbar-left">[\s\S]*?<window\.MLH\.LevelButton[\s\S]*?<div className="hub-toolbar-feedback"><h2 id="ear-training-activities-title"/);
  assert.match(source, /<div className="hub-toolbar-feedback"><h2 className="ear-training-chooser-heading ear-training-exercise-heading text-stone-950"><ExerciseIcon topic=\{activeTopic\}\/><span>\{TOPICS\[activeTopic\]\.label\}<\/span><\/h2><\/div>\s*\{feedback && <div className="ear-training-feedback-pill">/);
  const chooserBranch = source.slice(source.indexOf("{activityListOpen?<>"), source.indexOf("</>:<>", source.indexOf("{activityListOpen?<>") ));
  const exerciseBranch = source.slice(source.indexOf("</>:<>", source.indexOf("{activityListOpen?<>")));
  assert.doesNotMatch(chooserBranch, /CustomiseButton|RecognitionMenuRows/);
  assert.match(exerciseBranch, /Choose another exercise[\s\S]*?<window\.MLH\.CustomiseButton[\s\S]*?<RecognitionMenuRows[\s\S]*?level=\{activeLevel\} topic=\{activeTopic\}/);
  assert.doesNotMatch(exerciseBranch, /LevelButton|Current exercise:/);
  assert.doesNotMatch(source, /Available for \{LEVELS\[level\]\.label\}/);
  assert.doesNotMatch(source, />All activities</);
  assert.match(source, /function showActivityList\(\)[\s\S]*?setActivityListOpen\(true\)/);
  assert.doesNotMatch(source, /<window\.MLH\.AppHeader[^>]*onTitleClick/);
  assert.match(source, /aria-label="Choose another exercise"[\s\S]*?<span>Exercises<\/span>/);
  assert.match(source, /aria-label="Choose another exercise"[\s\S]*?<img src=\{ASSET\.next\}[^>]*rotate-180/);
  assert.doesNotMatch(source, /aria-label="Choose another exercise"[\s\S]{0,200}>←<\/span>/);
  assert.match(source, /function applyLevel\(requestedLevel\)[\s\S]*?stopAudio\(\);[\s\S]*?setActivityListOpen\(true\);/);
  assert.match(source, /const mergedFamilies = MERGED_TOPIC_FAMILIES\[resolvedTopic\] \|\| null;[\s\S]*?buildTempoChangesQuestion[\s\S]*?buildTonalityQuestion[\s\S]*?EAR_TRAINING\.buildQuestion/);
  assert.match(source, /const selectedFamilyOptions = resolvedOptions\.filter[\s\S]*?const fullFamilyOptions = fullOptions\.filter[\s\S]*?selectedFamilyOptions\.length \? \{ answers:selectedFamilyOptions, choices:fullFamilyOptions \} : null/);
  assert.doesNotMatch(source, /function chooseAnswerMode|mode:\s*chooseAnswerMode/);
  assert.doesNotMatch(source, /filter\(id => !CONCEPTS\[id\]\.typedOnly\)/);
  assert.match(source, /function rotatingChoiceOptions\(question, variation\)[\s\S]*?if \(options\.length <= 4\) return options;[\s\S]*?const rotatingDistractors[\s\S]*?\.slice\(0, 3\)/);
  assert.match(source, /question\.mode = "choice";[\s\S]*?question\.options = rotatingChoiceOptions\(question, variation\);/);
  assert.match(source, /return selected\.length \? selected : available/);
  assert.match(source, /return filtered\.length \? filtered : defaultConceptIdsForLevel\(level\)/);
  assert.match(source, /selectedFamilyOptions\.length \? \{ answers:selectedFamilyOptions, choices:fullFamilyOptions \} : null/);
  assert.match(source, /const answerId = chooseQuestionAnswer\(group\.answers, CONCEPTS\[group\.answers\[0\]\]\.family\)/);
  assert.match(source, /if \(\(question\.options \|\| \[\]\)\.length < 2\)[\s\S]*?familyChoices\.length >= 2/);
  assert.match(source, /const showConceptFilters = available\.length > 2 && !\(level === "N3" && topic === "beatsPerBar"\)/);
  assert.match(source, /function forcesFullExcerpt\(level, topic\) \{ return \["cadence", "bassPatterns", "rhythmicChange", "anacrusis"\]\.includes\(topic\) \|\| \(level === "N3" && topic === "repetitionSequence"\); \}/);
  assert.match(source, /ISOLATED_TOPICS\.has\(topic\) && !forcesFullExcerpt\(level, topic\)/);
  assert.match(source, /const fullPassage = forcesFullExcerpt\(question\.level, questionTopic\) \? true/);
  assert.match(source, /\{showConceptFilters && <>/);
  assert.match(source, /function reconcileBundledAnswers\(ids\)[\s\S]*?familyControls\.some\(id => next\.has\(id\)\)[\s\S]*?function isOnlyEnabledControl\(id\)/);
  assert.match(source, /\.filter\(id => !CUSTOMISE_BUNDLED_ANSWERS\.has\(id\)\)/);
  assert.match(source, /const minimumActiveAnswers = 2;/);
  assert.match(source, /available\.filter\(item => next\.includes\(item\)\)\.length >= minimumActiveAnswers/);
  assert.match(source, /return available\.filter\(item => next\.includes\(item\)\)\.length < minimumActiveAnswers;/);
  assert.match(source, /selectedCount - chordChangeSelectedCount < minimumActiveAnswers/);
  assert.doesNotMatch(source, /disabled=\{enabled\.includes\(id\) && selectedCount <= 1\}/);
  assert.match(source, /const chordChangeIds = topic === "chordChanges" \? available\.filter\(id => CONCEPTS\[id\]\.family === "chordChanges"\) : \[\]/);
  assert.match(source, /label="Chord changes" checked=\{chordChangesEnabled\}/);
  assert.match(source, /const beatCountIds = topic === "beatsPerBar" \? available\.filter\(id => CONCEPTS\[id\]\.family === "beatsPerBar" && \[2, 3, 4\]\.includes\(CONCEPTS\[id\]\.count\)\) : \[\]/);
  assert.match(source, /label="2, 3, or 4 beats in the bar" checked=\{beatsInBarEnabled\}/);
  assert.match(source, /selectedCount - beatCountSelectedCount < minimumActiveAnswers/);
  assert.match(source, /individuallyDisplayed\.map\(id => <window\.MLH\.MenuToggleRow/);
  assert.doesNotMatch(source, /topicOpen|setTopicOpen|topicRef|recognition-exercise-menu|recognition-topic-panel/);
  const shell = fs.readFileSync("shared/hub-shell.js", "utf8");
  assert.doesNotMatch(shell, /onTitleClick|Open \$\{activityTitle\} exercises/);
  assert.match(shell, /React\.createElement\("div", \{\s*className: "flex h-14 w-14/);
  assert.match(html, /time-signatures-listening\.js\?v=[a-zA-Z0-9-]+/);
  assert.match(html, /tempo-changes-listening\.js\?v=[a-zA-Z0-9-]+/);
  assert.match(html, /aural-accompaniment\.js\?v=[a-zA-Z0-9-]+/);
  assert.match(source, /const ACCOMPANIMENT_MIN_MIDI = 45;/);
  assert.match(source, /function accompanimentMidi\(midi\) \{ while \(midi < ACCOMPANIMENT_MIN_MIDI\) midi \+= 12; return midi; \}/);
  assert.match(source, /const MELODY_MIN_MIDI = 57;/);
  assert.match(source, /const MELODY_MAX_MIDI = 84;/);
  assert.match(source, /function melodyMidi\(midi\) \{ while \(midi < MELODY_MIN_MIDI\) midi \+= 12; while \(midi > MELODY_MAX_MIDI\) midi -= 12; return midi; \}/);
  assert.match(html, /aural-tonalities\.js\?v=[a-zA-Z0-9-]+/);
  assert.doesNotMatch(html, /composition-melody-sampler\.js/);
  assert.match(html, /ear-training-exercises\.js\?v=[a-zA-Z0-9-]+/);
  assert.doesNotMatch(source, /playSampledTexture|sampledTexture|MelodySampler/);
  assert.match(html, /ear-training-piano-concepts\.js\?v=[a-zA-Z0-9-]+/);
  assert.doesNotMatch(source, /\[\.\.\.melody\.bars,\.\.\.melody\.bars\]/,"Chord passages do not duplicate their first eight bars");
  assert.match(source, /\[\.\.\.melody\.bars,\.\.\.secondPhrase\.bars\]/,"Chord passages use an independently generated second phrase");
  const tempoChangesSource=fs.readFileSync("tempo-changes-listening.js","utf8");
  assert.doesNotMatch(tempoChangesSource,/\[\.\.\.first\.bars,\.\.\.first\.bars\]/,"Tempo passages do not duplicate their first eight bars");
  assert.match(tempoChangesSource,/\[\.\.\.first\.bars,\.\.\.second\.bars\]/,"Tempo passages use an independently generated second phrase");
  assert.doesNotMatch(source, /function Score\(|function ChordListeningScore\(|function CalibratedSymbol\(/);
});

test("all expanded piano exercise families generate complete shared-accompaniment questions", () => {
  global.window = { MLH: {} };
  delete require.cache[require.resolve("../practice-melody-generator.js")];
  delete require.cache[require.resolve("../aural-accompaniment.js")];
  delete require.cache[require.resolve("../melodic-dictation-generator.js")];
  delete require.cache[require.resolve("../aural-tonalities.js")];
  delete require.cache[require.resolve("../ear-training-exercises.js")];
  delete require.cache[require.resolve("../ear-training-piano-concepts.js")];
  window.PracticeMelodyGenerator = require("../practice-melody-generator.js");
  require("../aural-accompaniment.js");
  require("../melodic-dictation-generator.js");
  const expanded = require("../ear-training-exercises.js");
  require("../aural-tonalities.js");
  require("../ear-training-piano-concepts.js");
  assert.equal(Object.keys(expanded.topics).length, 20);
  assert.equal(Object.keys(expanded.concepts).length, 50);
  const expectedIntroductions = { N3:6, N4:10, N5:12, H:16, AH:19 };
  for (const [level, expectedTopics] of Object.entries(expectedIntroductions)) {
    const ids = expanded.conceptIdsForLevel(level);
    assert.equal(new Set(ids).size, ids.length, `${level} has duplicate concepts`);
    assert.equal(new Set(ids.map(id => expanded.concepts[id].family)).size, expectedTopics, level);
    for (const topic of new Set(ids.map(id => expanded.concepts[id].family))) {
      const options = ids.filter(id => expanded.concepts[id].family === topic);
      for (const answerId of options) {
        const question = expanded.buildQuestion({ level, topic, answerId, options, mode:"choice" });
        assert.equal(question.answerId, answerId);
        assert.equal(question.type, topic);
        for (const bar of question.bars ?? []) for (const note of bar.notes ?? []) {
          if (note.rest) continue;
          const midi = note.soundingMidi ?? note.midi;
          assert.ok(midi >= 57 && midi <= 84, `${level} ${topic} melody ${midi} is outside A3-C6`);
        }
        assert.deepEqual(question.options, options);
        assert.equal(question.melodyPlan.bars.length,question.bars.length,`${topic} plan length matches playback`);
        question.bars.forEach((bar,index)=>assert.deepEqual(question.melodyPlan.bars[index].notes,bar.notes,`${topic} plan notes match playback`));
        if(question.isolatedPassage) question.isolatedPassage.bars.forEach((bar,index)=>assert.deepEqual(question.isolatedPassage.melodyPlan.bars[index].notes,bar.notes,`${topic} isolated plan matches playback`));
        const expectedBarCount=["N4","H"].includes(level)&&topic==="anacrusis"?(answerId==="anacrusis-yes"?5:4)
          : level === "H" && topic === "rhythmicChange" ? 8
          : ["H","AH"].includes(level) && ["irregularMetre","suspension","melodicTransformation"].includes(topic) ? 8
          : ["chordChanges","irregularMetre"].includes(topic) ? 4
          : topic === "intervalRecognition" ? 8
          : topic === "chordDiscord" ? 1
          : level === "N3" && ["melodyDirection","stepLeap","repetitionSequence","steadyTempo"].includes(topic) ? 8
          : level === "N4" && ["accompanimentDevices","vamp","changeOfKey","steadyTempo"].includes(topic) ? 8
          : level === "N5" && ["melodyDirection","stepLeap","melodicMotion","accompanimentDevices","vamp","modulation","steadyTempo","bassPatterns"].includes(topic) ? 8
          : ["H","AH"].includes(level) && ["accompanimentDevices","vamp","modulation","relativeKey","tiercePicardie"].includes(topic) ? 8
          : topic === "repetitionSequence" ? (level === "AH" ? 8 : 4) : 16;
        assert.equal(question.bars.length, expectedBarCount, `${topic}/${answerId} passage length`);
        if(topic!=="irregularMetre") assert.equal(question.melodyPlan?.validation?.accepted,true,`${topic}/${answerId} uses an accepted Practice Questions plan`);
        assert.ok(question.bars.every(bar => Array.isArray(bar.notes) && Array.isArray(bar.accompaniment)), `${topic}/${answerId}`);
        assert.ok(question.bars.flatMap(bar => bar.notes).every(note => note.rest || (Number.isFinite(note.soundingMidi) && note.beats > 0)), `${topic}/${answerId}`);
        assert.ok(question.bars.every(bar => bar.notes.every(note => note.beat >= 0 && note.beat + note.beats <= (bar.beats || question.timeSignature.beats))), `${topic}/${answerId} bar duration`);
        assert.ok(question.bars.every(bar => Math.abs(Math.max(...bar.notes.map(note=>note.beat+note.beats)) - (bar.beats || question.timeSignature.beats)) < 1e-8), `${topic}/${answerId} complete bars`);
        for (const layer of question.layers || [question]) for (const bar of layer.bars) {
          assert.ok(bar.notes.every(note=>note.beat>=0&&note.beats>0&&note.beat+note.beats<=(bar.beats || layer.timeSignature.beats)+1e-8), `${topic}/${answerId} layer notes`);
          const accompanimentLimit=topic==="chordChanges" ? layer.totalBeats-bar.barIndex*layer.timeSignature.beats : (bar.beats || layer.timeSignature.beats);
          assert.ok(bar.accompaniment.every(event=>event.beat>=0&&event.beats>0&&event.beat+event.beats<=(event.sustainAcrossBars?layer.totalBeats-bar.barIndex*layer.timeSignature.beats:accompanimentLimit)+1e-8&&event.pitches.every(pitch=>Number.isFinite(pitch)&&pitch>=45)), `${topic}/${answerId} accompaniment`);
        }
        if (expanded.topics[topic].supportsIsolated) {
          assert.ok(question.isolatedPassage?.bars.length, `${topic}/${answerId} isolated`);
          assert.ok(question.isolatedPassage.bars.length <= question.bars.length, `${topic}/${answerId} isolated length`);
          assert.ok(question.isolatedPassage.notes.every((note,index,notes)=>index === 0 || note.beat >= notes[index - 1].beat), `${topic}/${answerId} isolated chronology`);
        } else {
          assert.equal(question.isolatedPassage, undefined, `${topic}/${answerId} should stay passage-only`);
        }
      }
    }
  }
  for (const removedTopic of ["rhythmicFeatures","articulation","chordPresentation","questionAnswer","countermelody"]) assert.equal(expanded.topics[removedTopic],undefined,removedTopic);
  assert.deepEqual(Object.entries(expanded.topics).filter(([,details])=>details.supportsIsolated).map(([topic])=>topic), ["melodyDirection","stepLeap","repetitionSequence","chordDiscord","bassPatterns","rhythmicChange","intervalRecognition","melodicMotion","melodicTransformation"]);
  const n4 = expanded.conceptIdsForLevel("N4");
  for(const answerId of ["pattern-ostinato","pattern-sequence"]){
    const pattern=expanded.buildQuestion({level:"N3",topic:"repetitionSequence",answerId,options:["pattern-ostinato","pattern-sequence"],mode:"choice"});
    const expectedPatternBars=8;
    const expectedFeatureBars=expectedPatternBars-1;
    assert.equal(pattern.bars.length,expectedPatternBars,`${answerId} uses the correct length for ${pattern.timeSignature.id}`);
    assert.equal(pattern.isolatedPassage.bars.length,expectedPatternBars,`${answerId} isolated question retains the complete excerpt`);
    assert.equal(pattern.patternSourceTimeSignature,pattern.timeSignature.id,`${answerId} melody and accompaniment are generated in the same metre`);
    assert.equal(pattern.patternEndsOnTonic,true);
    assert.equal(pattern.patternFeatureBars,expectedFeatureBars);
    assert.equal(pattern.patternResolutionBars,1);
    assert.equal(pattern.patternExcerptBars,8);
    assert.equal(pattern.patternCadence,"perfect");
    assert.equal(pattern.patternHarmonyFitted,true,`${answerId} harmony is selected from its accented melody notes`);
    assert.equal(pattern.patternRegisterPlanned,true,`${answerId} register is planned before playback`);
    assert.equal(pattern.patternRejectionChecks,true,`${answerId} passed the musical candidate checks`);
    assert.equal(pattern.patternGenerationFallback,false,`${answerId} uses a fully validated generated phrase`);
    assert.ok(pattern.patternRhythmTemplate,`${answerId} records its rhythmic identity`);
    assert.ok(["on-beat","upbeat"].includes(pattern.patternEntry),`${answerId} records how its motif enters`);
    assert.deepEqual(pattern.patternHarmony.slice(-2),["V","I"],`${answerId} ends with a perfect cadence`);
    const finalSoundingNote=pattern.bars.at(-1).notes.filter(note=>!note.rest).at(-1);
    assert.equal(((finalSoundingNote.relativeStep%7)+7)%7,0,`${answerId} finishes on the tonic`);
    assert.equal(pattern.bars.at(-1).notes.length,1,`${answerId} has one tonic note in the final bar`);
    assert.equal(finalSoundingNote.beat,0,`${answerId} tonic starts at the beginning of the final bar`);
    assert.equal(finalSoundingNote.beats,pattern.timeSignature.beats,`${answerId} tonic lasts for the full final bar`);
    assert.ok(pattern.bars.every(bar=>Math.abs(bar.notes.reduce((sum,note)=>sum+note.beats,0)-pattern.timeSignature.beats)<1e-8),`${answerId} fills every selected bar exactly`);
    assert.deepEqual(pattern.bars.slice(0,expectedFeatureBars).map(bar=>bar.notes.map(note=>note.beats)),Array.from({length:expectedFeatureBars},()=>pattern.bars[0].notes.map(note=>note.beats)),`${answerId} retains the motif rhythm across its feature bars`);
    if(answerId==="pattern-ostinato"){
      assert.equal(pattern.patternDirection,"repeated");
      assert.deepEqual(pattern.patternOffsets,Array(expectedFeatureBars).fill(0));
      assert.deepEqual(pattern.bars.slice(0,expectedFeatureBars).map(bar=>bar.notes.map(note=>note.relativeStep)),Array.from({length:expectedFeatureBars},()=>pattern.patternMotif),"every feature bar repeats the same motif");
      assert.ok(new Set(pattern.patternMotif.filter(degree=>degree!==null)).size>=3,"repetition motifs contain at least three different pitches");
      assert.ok(new Set(pattern.patternHarmony).size>1,"repetition varies the underlying harmony while retaining the melody");
    }else{
      assert.ok(["ascending","descending"].includes(pattern.patternDirection));
      const direction=pattern.patternDirection==="ascending"?1:-1;
      assert.ok(pattern.patternOffsets.slice(1).every((offset,index)=>(offset-pattern.patternOffsets[index])*direction>0),"the sequence moves consistently in one direction");
      const expectedBars=pattern.patternOffsets.map(offset=>pattern.patternMotif.map(degree=>degree===null?null:degree+offset));
      assert.deepEqual(pattern.bars.slice(0,expectedFeatureBars).map(bar=>bar.notes.map(note=>note.relativeStep)),expectedBars,"the feature bars progressively transpose the motif");
      if(pattern.patternDirection==="ascending") {
        const openingNote=pattern.bars[0].notes.find(note=>!note.rest).soundingMidi;
        assert.ok(openingNote>=57&&openingNote<=69,"ascending sequences begin low enough to rise cleanly");
      }
      if(pattern.patternDirection==="descending") {
        assert.equal(pattern.patternRegister,"starts-in-C5-territory");
        const openingNote=pattern.bars[0].notes.find(note=>!note.rest).soundingMidi;
        assert.ok(openingNote>=72&&openingNote<=84,"descending sequences begin in C5 territory without exceeding C6");
      }
    }
  }
  let descendingSequence=null;
  for(let attempt=0;attempt<64&&!descendingSequence;attempt++) {
    const candidate=expanded.buildQuestion({level:"N3",topic:"repetitionSequence",answerId:"pattern-sequence",options:["pattern-ostinato","pattern-sequence"],mode:"choice"});
    if(candidate.patternDirection==="descending") descendingSequence=candidate;
  }
  assert.ok(descendingSequence,"a descending sequence variant is available");
  const descendingOpening=descendingSequence.bars[0].notes.find(note=>!note.rest).soundingMidi;
  assert.ok(descendingOpening>=72&&descendingOpening<=84,"descending sequence variants begin in C5 territory without exceeding C6");
  const sequenceRhythmStyles=new Set();
  let diminishedSequence=null;
  for(let attempt=0;attempt<64&&sequenceRhythmStyles.size<2;attempt++) {
    const candidate=expanded.buildQuestion({level:"N3",topic:"repetitionSequence",answerId:"pattern-sequence",options:["pattern-ostinato","pattern-sequence"],mode:"choice"});
    sequenceRhythmStyles.add(candidate.patternRhythmStyle);
    if(candidate.patternRhythmStyle==="diminished") diminishedSequence=candidate;
  }
  assert.deepEqual(sequenceRhythmStyles,new Set(["standard","diminished"]),"sequence questions include standard and fast rhythmic variants");
  const diminishedNotes=diminishedSequence.bars[0].notes;
  const halfLength=diminishedNotes.length/2;
  assert.equal(Number.isInteger(halfLength),true,"the fast sequence repeats a complete shortened motif");
  assert.deepEqual(diminishedNotes.slice(0,halfLength).map(note=>note.relativeStep),diminishedNotes.slice(halfLength).map(note=>note.relativeStep),"the shortened motif is heard twice in its bar");
  assert.deepEqual(diminishedNotes.slice(0,halfLength).map(note=>note.beats),diminishedNotes.slice(halfLength).map(note=>note.beats),"both shortened motif statements use the same fast rhythm");
  assert.equal(diminishedNotes.reduce((total,note)=>total+note.beats,0),diminishedSequence.timeSignature.beats,"the fast variant still fills its selected metre");
  const patternAudit={directions:{ascending:0,descending:0},entries:new Set(),templates:new Set(),violations:0};
  for(let attempt=0;attempt<128;attempt++) {
    const candidate=expanded.buildQuestion({level:"N3",topic:"repetitionSequence",answerId:"pattern-sequence",options:["pattern-ostinato","pattern-sequence"],mode:"choice"});
    patternAudit.directions[candidate.patternDirection]++;
    patternAudit.entries.add(candidate.patternEntry);
    patternAudit.templates.add(candidate.patternRhythmTemplate);
    assert.equal(candidate.patternGenerationFallback,false,"sequence generation does not fall back to an unchecked melody");
    for(const bar of candidate.bars.slice(0,candidate.patternFeatureBars)) {
      const chordPitchClasses=new Set(candidate.key.chords[bar.chordSymbol].map(midi=>((midi%12)+12)%12));
      const strongBeats=candidate.timeSignature.id==="6/8"?[0,1.5]:Array.from({length:candidate.timeSignature.beats},(_,index)=>index);
      const strongNotes=bar.notes.filter(note=>!note.rest&&strongBeats.some(beat=>Math.abs(note.beat-beat)<1e-8));
      assert.ok(strongNotes.length>0,"every feature bar exposes at least one metrically strong melody note");
      assert.ok(strongNotes.every(note=>chordPitchClasses.has(((note.soundingMidi%12)+12)%12)),"every metrically strong melody note belongs to its underlying harmony");
    }
    for(const bar of candidate.bars) for(const note of bar.notes) if(!note.rest&&(note.soundingMidi<57||note.soundingMidi>84)) patternAudit.violations++;
  }
  // This sample may start and finish partway through two shuffled bags.
  assert.ok(Math.abs(patternAudit.directions.ascending-patternAudit.directions.descending)<=2,"sequence directions stay balanced across bag boundaries");
  assert.deepEqual(patternAudit.entries,new Set(["on-beat","upbeat"]),"sequence excerpts include both direct and upbeat entries");
  assert.ok(patternAudit.templates.size>=8,"sequence excerpts rotate through a broad range of rhythmic identities");
  assert.equal(patternAudit.violations,0,"the sequence rejection checks keep every melody within A3-C6");
  for (const answerId of ["direction-ascending","direction-descending"]) {
    const direction = expanded.buildQuestion({ level:"N3", topic:"melodyDirection", answerId, options:["direction-ascending","direction-descending"], mode:"choice" });
    const sign = answerId === "direction-ascending" ? 1 : -1;
    assert.ok(direction.bars.every(bar => {
      const sounding=bar.notes.filter(note=>!note.rest);
      const intervals=sounding.slice(1).map((note,index)=>(note.soundingMidi-sounding[index].soundingMidi)*sign);
      return intervals.filter(interval=>interval>0).length/intervals.length>=direction.movementTargetRatio
        && (sounding.at(-1).soundingMidi-sounding[0].soundingMidi)*sign>0;
    }), answerId);
  }
  const yesPickup = expanded.buildQuestion({ level:"N4", topic:"anacrusis", answerId:"anacrusis-yes", options:n4.filter(id=>expanded.concepts[id].family==="anacrusis"), mode:"choice" });
  assert.equal(yesPickup.bars[0].isPickup,true);
  assert.equal(yesPickup.bars[0].notes[0].beat,0,"pickup playback begins immediately");
  assert.equal(yesPickup.phraseBarCount,4);
  assert.equal(yesPickup.bars[1].startBeat,yesPickup.pickupBeats);
  for(const answerId of ["harmony-chord","harmony-discord"]){
    const sonority=expanded.buildQuestion({level:"N3",topic:"chordDiscord",answerId,options:["harmony-chord","harmony-discord"],mode:"choice"});
    assert.equal(sonority.chordRange,"C4-C5");
    assert.equal(sonority.bars[0].accompaniment.length,1,`${answerId} is one chord attack`);
    assert.ok(sonority.bars[0].accompaniment[0].pitches.every(pitch=>pitch>=60&&pitch<=72),`${answerId} stays between C4 and C5`);
    assert.ok(sonority.bars[0].notes.every(note=>note.rest),`${answerId} has no separate melody`);
    const heardVoicings=new Set(),roots=new Set(),qualities=new Set();
    for(let run=0;run<192;run++) {
      const sample=expanded.buildQuestion({level:"N3",topic:"chordDiscord",answerId,options:["harmony-chord","harmony-discord"],mode:"choice"});
      const pitches=sample.bars[0].accompaniment[0].pitches;
      assert.equal(new Set(pitches).size,3);
      assert.ok(pitches.every(pitch=>pitch>=60&&pitch<=72));
      assert.deepEqual(pitches,sample.sonority.pitches);
      assert.deepEqual([...pitches].map(pitch=>(pitch-sample.sonority.rootPitchClass+120)%12).sort((a,b)=>a-b),[...sample.sonority.intervals].sort((a,b)=>a-b));
      heardVoicings.add(pitches.join(","));roots.add(sample.sonority.rootPitchClass);qualities.add(sample.sonority.quality);
      const intervals=pitches.flatMap((pitch,index)=>pitches.slice(index+1).map(other=>(other-pitch)%12));
      if(answerId==="harmony-discord") assert.ok(intervals.some(interval=>[1,6,11].includes(interval)),"each discord contains an audible semitone or tritone");
    }
    assert.equal(roots.size,12,"single sonorities cover every root");
    assert.ok(heardVoicings.size>=(answerId==="harmony-chord"?24:40),"variety is measured from audible chord pitches");
    if(answerId==="harmony-chord") assert.deepEqual(qualities,new Set(["major","minor"]));
  }
  for(let changeCount=1;changeCount<=4;changeCount++){
    const answerId=`changes-${changeCount}`;
    const changes=expanded.buildQuestion({level:"N3",topic:"chordChanges",answerId,options:["changes-1","changes-2","changes-3","changes-4"],mode:"choice"});
    assert.equal(changes.accompanimentPattern,"block_chords");
    assert.equal(changes.chordChangeCount,changeCount);
    assert.equal(changes.melodySource,"shared-harmony-aware-planner");
    assert.equal(changes.melodyHarmonyFitted,true);
    assert.equal(changes.melodyRegisterPlanned,true);
    assert.equal(changes.melodyEndsOnTonic,true);
    assert.equal(changes.answer.label,`${changeCount} chord${changeCount===1?"":"s"}`);
    assert.equal(changes.accompanimentRange,"C4-C5");
    const expectedOnsets={1:[1],2:[1,3],3:[1,3,4],4:[1,2,3,4]}[changeCount];
    assert.equal(changes.bars.length,4);
    assert.deepEqual(changes.chordOnsetBars,expectedOnsets);
    assert.equal(new Set(changes.bars.map(bar=>bar.chordSymbol)).size,changeCount);
    assert.deepEqual(changes.bars.filter(bar=>bar.accompaniment.length).map(bar=>bar.barIndex+1),expectedOnsets);
    const onsetSymbols=changes.bars.filter(bar=>bar.accompaniment.length).map(bar=>bar.chordSymbol);
    if(changeCount>1) assert.deepEqual(onsetSymbols.slice(-2),["V","I"],`${answerId} ends its harmonic regions with a perfect cadence`);
    assert.deepEqual(changes.bars.flatMap(bar=>bar.accompaniment).map(event=>event.beats),expectedOnsets.map((barNumber,index)=>((expectedOnsets[index+1]??5)-barNumber)*changes.timeSignature.beats));
    assert.ok(changes.bars.flatMap(bar=>bar.accompaniment).every(event=>event.beat===0&&event.beats>=changes.timeSignature.beats),`${answerId} sustains each block chord until the next onset`);
    assert.ok(changes.bars.flatMap(bar=>bar.accompaniment).every(event=>event.pitches.every(pitch=>pitch>=60&&pitch<=72)),`${answerId} accompaniment stays within C4-C5`);
    let previousMelodyMidi=null;
    for(const bar of changes.bars) {
      assert.equal(changes.melodyRhythmTemplates[bar.barIndex].accepted==="fallback",false,`${answerId} bar ${bar.barIndex+1} uses a validated procedural melody`);
      const chordPitchClasses=new Set(changes.key.chords[bar.chordSymbol].map(midi=>((midi%12)+12)%12));
      const strongBeats=changes.timeSignature.id==="6/8"?[0,1.5]:Array.from({length:changes.timeSignature.beats},(_,index)=>index);
      const strongNotes=bar.notes.filter(note=>!note.rest&&strongBeats.some(beat=>Math.abs(note.beat-beat)<1e-8));
      assert.ok(strongNotes.every(note=>chordPitchClasses.has(((note.soundingMidi%12)+12)%12)),`${answerId} bar ${bar.barIndex+1} supports every strong melody note`);
      const accompanimentCeiling=Math.max(...bar.accompanimentHarmony[0].pitches);
      for(const note of bar.notes) if(!note.rest) {
        assert.ok(note.soundingMidi>accompanimentCeiling,`${answerId} melody remains above its block chord`);
        if(previousMelodyMidi!==null) assert.ok(Math.abs(note.soundingMidi-previousMelodyMidi)<=7,`${answerId} avoids awkward melodic leaps`);
        previousMelodyMidi=note.soundingMidi;
      }
    }
    const finalMelodyNote=changes.bars.at(-1).notes.filter(note=>!note.rest).at(-1);
    assert.equal(((finalMelodyNote.soundingMidi-changes.key.tonic)%12+12)%12,0,`${answerId} finishes on the tonic`);
  }
  const freshChordMelodies=new Set(Array.from({length:24},()=>{
    const question=expanded.buildQuestion({level:"N3",topic:"chordChanges",answerId:"changes-4",options:["changes-1","changes-2","changes-3","changes-4"],mode:"choice"});
    return JSON.stringify(question.melodyPlan.bars.slice(0,4).map(bar=>bar.notes.map(note=>[note.rest?null:note.relativeStep,note.beats])));
  }));
  assert.equal(freshChordMelodies.size,24,"every Chord Changes question receives a fresh generated melody");
  for(const [topic,answerId,kind] of [
    ["melodyDirection","direction-ascending","ascending"],
    ["melodyDirection","direction-descending","descending"],
    ["stepLeap","movement-step","step"],
    ["stepLeap","movement-leap","leap"],
  ]) {
    const movementMelodies=new Set(),movementTemplates=new Set(),movementKeys=new Set(),movementMetres=new Set();
    for(let attempt=0;attempt<64;attempt++) {
      const movement=expanded.buildQuestion({level:"N3",topic,answerId,options:[answerId],mode:"choice"});
      assert.equal(movement.bars.length,8,`${answerId} uses the National 3 eight-bar in-context form`);
      assert.equal(movement.movementKind,kind);
      assert.equal(movement.movementSource,"shared-harmony-aware-planner");
      assert.equal(movement.movementHarmonyFitted,true);
      assert.equal(movement.movementRegisterPlanned,true);
      assert.equal(movement.movementEndsOnTonic,true);
      assert.equal(movement.movementCadence,"perfect");
      assert.equal(movement.movementPhraseLength,4);
      assert.equal(movement.movementPhraseCount,2);
      assert.equal(movement.movementExcerptBars,8);
      assert.equal(movement.movementRhythmStructure,"AABA");
      assert.equal(movement.movementDirectionalGestureBars,2);
      assert.equal(movement.movementCrossBarDirection,true);
      assert.equal(movement.movementAccompanimentClarity,"quiet-block-chords");
      assert.equal(movement.accompanimentPattern,"block_chords");
      assert.equal(movement.isolatedPassage.bars.length,2,`${answerId} isolated listening uses a complete two-bar gesture`);
      assert.equal(movement.movementGenerationFallbacks,0,`${answerId} uses only validated movement phrases`);
      assert.equal(movement.melodyPlan.validation.accepted,true);
      assert.deepEqual(movement.bars.slice(-2).map(bar=>bar.chordSymbol),["V","I"],`${answerId} ends with a perfect cadence`);
      let previousMidi=null;
      for(const bar of movement.bars) {
        const notes=bar.notes.filter(note=>!note.rest);
        const intervals=notes.slice(1).map((note,index)=>note.relativeStep-notes[index].relativeStep);
        const targetIntervals=intervals.filter(interval=>kind==="ascending"?interval>0:kind==="descending"?interval<0:kind==="step"?Math.abs(interval)===1:Math.abs(interval)>=2);
        assert.ok(targetIntervals.length/intervals.length>=movement.movementTargetRatio,`${answerId} keeps its assessed movement clearly predominant`);
        assert.ok(intervals.every(interval=>Math.abs(interval)>=1&&Math.abs(interval)<=3),`${answerId} uses controlled singable movement`);
        if(kind==="ascending") assert.ok(notes.at(-1).relativeStep>notes[0].relativeStep,`${answerId} rises overall within the bar`);
        if(kind==="descending") assert.ok(notes.at(-1).relativeStep<notes[0].relativeStep,`${answerId} falls overall within the bar`);
        const chordPitchClasses=new Set(movement.key.chords[bar.chordSymbol].map(midi=>((midi%12)+12)%12));
        assert.ok(chordPitchClasses.has(((notes[0].soundingMidi%12)+12)%12),`${answerId} begins every bar on a chord tone`);
        assert.ok(notes.every(note=>note.soundingMidi>=57&&note.soundingMidi<=84),`${answerId} stays within A3-C6`);
        if(previousMidi!==null) assert.ok(Math.abs(notes[0].soundingMidi-previousMidi)<=12,`${answerId} keeps its bar joins controlled`);
        previousMidi=notes.at(-1).soundingMidi;
        assert.ok(Math.abs(Math.max(...bar.notes.map(note=>note.beat+note.beats))-movement.timeSignature.beats)<1e-8,`${answerId} fills its selected metre`);
        assert.ok(bar.accompaniment.every(event=>event.beat>=0&&event.beats>0&&event.beat+event.beats<=movement.timeSignature.beats+1e-8&&event.pitches.every(midi=>midi>=45)),`${answerId} accompaniment is valid and remains above the A2 floor`);
      }
      const finalNote=movement.bars.at(-1).notes.filter(note=>!note.rest).at(-1);
      assert.equal(((finalNote.soundingMidi-movement.key.tonic)%12+12)%12,0,`${answerId} resolves to the tonic`);
      if(kind==="ascending"||kind==="descending") for(let pair=0;pair<movement.bars.length/2;pair++) {
        const first=movement.bars[pair*2].notes.find(note=>!note.rest).soundingMidi;
        const last=movement.bars[pair*2+1].notes.filter(note=>!note.rest).at(-1).soundingMidi;
        assert.ok((last-first)*(kind==="ascending"?1:-1)>0,`${answerId} preserves its direction through each two-bar gesture`);
      }
      for(let phrase=0;phrase<movement.movementPhraseCount;phrase++) {
        const requested=movement.movementRhythmTemplates.slice(phrase*4,phrase*4+4).map(template=>template.requested);
        assert.equal(requested[0],requested[1],`${answerId} repeats the phrase's opening rhythm`);
        assert.equal(requested[0],requested[3],`${answerId} returns to its opening rhythm at the cadence point`);
        assert.notEqual(requested[0],requested[2],`${answerId} contrasts the third bar of each phrase`);
      }
      movement.movementRhythmTemplates.forEach(template=>{ assert.notEqual(template.accepted,"fallback"); movementTemplates.add(template.accepted); });
      movementKeys.add(movement.key.id);
      movementMetres.add(movement.timeSignature.id);
      movementMelodies.add(JSON.stringify(movement.bars.map(bar=>bar.notes.map(note=>[note.rest?null:note.soundingMidi,note.beats]))));
    }
    assert.equal(movementMelodies.size,64,`${answerId} generates a fresh melody for every question`);
    assert.equal(movementKeys.size,8,`${answerId} rotates through all eight approved keys`);
    assert.equal(movementMetres.size,4,`${answerId} rotates through all four approved metres`);
    assert.ok(movementTemplates.size>=12,`${answerId} uses a broad range of rhythmic identities`);
  }
  const modal = window.MLH.AuralTonalities.buildMelody("modal", "H");
  assert.ok(modal.key.id.endsWith("-dorian"));
  assert.equal(modal.melodyGenerationStyle,"dorian");
  assert.deepEqual(modal.bars.map(bar=>bar.chordSymbol),["i","IV","i","VII","i","IV","v","i"]);
  const modalPitchClasses=new Set(modal.bars.flatMap(bar=>bar.notes).filter(note=>!note.rest).map(note=>((note.soundingMidi%12)+12)%12));
  assert.ok(modalPitchClasses.has((modal.tonicMidi+3)%12),"Dorian melody exposes its minor third, F");
  assert.ok(modalPitchClasses.has((modal.tonicMidi+9)%12),"Dorian melody exposes its natural sixth, B");
  const dorianPitchClasses=new Set([0,2,3,5,7,9,10].map(n=>(n+modal.tonicMidi)%12));
  assert.ok(modal.bars.every(bar=>bar.accompanimentHarmony[0].pitches.every(pitch=>dorianPitchClasses.has(((pitch%12)+12)%12))),"Dorian accompaniment stays inside the mode");
  assert.ok(modal.bars.every(bar=>bar.accompaniment.length>0),"every Dorian bar has modal accompaniment");
  assert.ok(modal.bars.every(bar=>bar.generatedAccompaniment===false),"Dorian accompaniment is explicit for the native metre");
  for(const tonality of ["major","minor","atonal","modal","polytonality"]) for(let attempt=0;attempt<24;attempt++) {
    const passage=window.MLH.AuralTonalities.buildMelody(tonality,"AH");
    for(const layer of passage.layers || [passage]) for(const bar of layer.bars) for(const note of bar.notes) {
      if(note.rest) continue;
      assert.ok(note.soundingMidi>=57&&note.soundingMidi<=84,`${tonality} MIDI ${note.soundingMidi} stays within A3-C6`);
    }
  }
  const tierceMelodies = new Set();
  const tierceOpeningMelodies = new Set();
  const tierceEndings = new Set();
  for (let index=0;index<24;index++) {
    const answerId=index%2?"tierce-no":"tierce-yes";
    const tierce=expanded.buildQuestion({level:"H",topic:"tiercePicardie",answerId,options:["tierce-yes","tierce-no"],mode:"choice"});
    const finalBar=tierce.bars.at(-1),chord=finalBar.accompanimentHarmony.at(-1).pitches,root=chord[0],expectedThird=root+(answerId==="tierce-yes"?4:3);
    assert.equal(tierce.tierceVariant.melodyPlanAccepted,true,`${answerId} uses an accepted Practice Questions melody plan`);
    assert.match(tierce.tierceVariant.progression.at(-2),/^V7?$/,`${answerId} retains the generated dominant cadence approach`);
    assert.deepEqual(chord,[root,expectedThird,root+7],`${answerId} final harmony`);
    assert.equal(tierce.tierceVariant.melodyRegisterShift,0,`${answerId} melody is raised one octave`);
    assert.equal(tierce.tierceVariant.accompanimentRegisterShift,0,`${answerId} accompaniment is raised one octave`);
    assert.equal(finalBar.notes.length,1,`${answerId} ends with one held tonic`);
    assert.equal(finalBar.notes.at(-1).soundingMidi%12,tierce.key.tonic%12,`${answerId} ${tierce.tierceVariant.finalShape} resolves to the tonic`);
    assert.equal(tierce.tierceVariant.endingAccompaniment,"dominant-tonic-block-chords");
    for(const cadenceBar of tierce.bars.slice(-2)) {
      assert.equal(cadenceBar.generatedAccompaniment,false,"cadence bars use explicit block chords");
      assert.equal(cadenceBar.accompaniment.length,cadenceBar.accompanimentHarmony.length===2?4:cadenceBar.notes.length*2,"each chord attack has a block chord and root bass");
      assert.deepEqual(new Set(cadenceBar.accompaniment[0].pitches.map(n=>n%12)),new Set(cadenceBar.accompanimentHarmony[0].pitches.map(n=>n%12)),"the scheduled block chord matches its harmony");
    }
    const accompanimentPitchClasses=new Set(finalBar.accompaniment.flatMap(event=>event.pitches).map(midi=>((midi%12)+12)%12));
    assert.equal(accompanimentPitchClasses.has(((expectedThird%12)+12)%12),true,`${answerId} scheduled third`);
    assert.equal(accompanimentPitchClasses.has((((root+(answerId==="tierce-yes"?3:4))%12)+12)%12),false,`${answerId} excludes wrong third`);
    tierceMelodies.add(JSON.stringify({key:tierce.key.id,style:tierce.accompanimentPattern,bars:tierce.bars.map(bar=>bar.notes.map(note=>[note.soundingMidi,note.beats]))}));
    tierceOpeningMelodies.add(JSON.stringify(tierce.bars.slice(0,-1).map(bar=>bar.notes.map(note=>[note.rest?null:note.soundingMidi-tierce.key.tonic,note.beats]))));
    tierceEndings.add(tierce.tierceVariant.finalShape);
  }
  assert.equal(tierceMelodies.size,24,"Tierce excerpts remain unique across a classroom-sized run");
  assert.equal(tierceOpeningMelodies.size,24,"Tierce opening melodies remain unique before key, accompaniment and cadence variation");
  assert.deepEqual(tierceEndings,new Set(["held-tonic"]),"Tierce ends plainly without an embellishment");
  const chooseTierceAnswer=expanded.createBalancedAnswerChooser();
  const balancedTierceAnswers=Array.from({length:20},()=>chooseTierceAnswer(["tierce-yes","tierce-no"],"tiercePicardie"));
  for(let index=0;index<balancedTierceAnswers.length;index+=4)assert.equal(balancedTierceAnswers.slice(index,index+4).filter(answer=>answer==="tierce-yes").length,2,"Each Tierce answer round is balanced");
  assert.ok(balancedTierceAnswers.every((answer,index,answers)=>index<2||answer!==answers[index-1]||answer!==answers[index-2]),"Tierce answers never repeat three times");
  assert.equal(balancedTierceAnswers.filter(answer=>answer==="tierce-yes").length,10);
  const chooseEveryAnswer=expanded.createBalancedAnswerChooser();
  const threeWayAnswers=Array.from({length:60},()=>chooseEveryAnswer(["first","second","third"],"whole-app-balance"));
  assert.deepEqual(
    Object.fromEntries(["first","second","third"].map(answer=>[answer,threeWayAnswers.filter(candidate=>candidate===answer).length])),
    {first:20,second:20,third:20},
    "Every Ear Training answer family is balanced in complete rounds"
  );
  assert.ok(threeWayAnswers.every((answer,index,answers)=>index<2||answer!==answers[index-1]||answer!==answers[index-2]),"Balanced answer selection avoids three identical questions in succession");
  const extendedTierceMelodies = new Set();
  const checkedHarmonicMinorKeys = new Set();
  for(let index=0;index<100;index++) {
    const answerId=index%2?"tierce-no":"tierce-yes";
    const tierce=expanded.buildQuestion({level:"AH",topic:"tiercePicardie",answerId,options:["tierce-yes","tierce-no"],mode:"choice"});
    assert.equal(tierce.tierceVariant.melodyPlanAccepted,true,`extended Tierce plan ${index}`);
    assert.match(tierce.tierceVariant.progression.at(-2),/^V7?$/,`extended Tierce cadence ${index}`);
    extendedTierceMelodies.add(JSON.stringify(tierce.bars.slice(0,-1).map(bar=>bar.notes.map(note=>[note.rest?null:note.soundingMidi-tierce.key.tonic,note.beats]))));
    if(["Dm","Em"].includes(tierce.key.id)) {
      checkedHarmonicMinorKeys.add(tierce.key.id);
      const tonicPc=((tierce.key.tonic%12)+12)%12;
      const relativePitchClass=midi=>(((midi%12)+12)%12-tonicPc+12)%12;
      const openingPitchClasses=tierce.bars.slice(0,-1).flatMap(bar=>bar.notes.filter(note=>!note.rest).map(note=>relativePitchClass(note.soundingMidi)));
      assert.ok(openingPitchClasses.every(pitchClass=>[0,2,3,5,7,8,11].includes(pitchClass)),`${tierce.key.id} melody uses the harmonic-minor pitch collection`);
      assert.equal(openingPitchClasses.includes(10),false,`${tierce.key.id} melody excludes the natural seventh`);
      const dominantPitchClasses=tierce.bars.at(-2).accompanimentHarmony[0].pitches.map(relativePitchClass);
      assert.equal(dominantPitchClasses.includes(11),true,`${tierce.key.id} dominant harmony contains its raised seventh`);
      assert.equal(dominantPitchClasses.includes(10),false,`${tierce.key.id} dominant harmony excludes its natural seventh`);
    }
  }
  assert.equal(extendedTierceMelodies.size,100,"100 consecutive Tierce melodies remain distinct before key, tempo, accompaniment and ending variation");
  assert.deepEqual(checkedHarmonicMinorKeys,new Set(["Dm","Em"]),"D minor and E minor both receive explicit harmonic-minor checks");
  assert.equal(expanded.keys.Dm.chords.V.includes(61),true,"D-minor dominant contains C sharp");
  assert.equal(expanded.keys.Em.chords.V.includes(63),true,"E-minor dominant contains D sharp");
  const metreOptions = ["metre-irregular","metre-change","metre-3","metre-4"];
  const irregular = expanded.buildQuestion({ level:"H", topic:"irregularMetre", answerId:"metre-irregular", options:metreOptions, mode:"choice" });
  assert.ok(["5/4","7/4","5/8","7/8"].includes(irregular.timeSignature.id));
  const metreChange = expanded.buildQuestion({ level:"H", topic:"irregularMetre", answerId:"metre-change", options:metreOptions, mode:"choice" });
  assert.equal(expanded.concepts["metre-change"].label,"Time changes");
  assert.equal(metreChange.timeSignatureChanges[0].barIndex,0);assert.ok([2,4].includes(metreChange.timeSignatureChanges[1].barIndex));
  assert.notEqual(metreChange.timeSignatureChanges[0].signature,metreChange.timeSignatureChanges[1].signature);
  assert.equal(metreChange.bars.length,8);
  let metreCursor=0;metreChange.bars.forEach(bar=>{assert.equal(bar.startBeat,metreCursor);metreCursor+=bar.beats;});
  assert.equal(metreChange.totalBeats,metreCursor);
  const threeBeat = expanded.buildQuestion({ level:"H", topic:"irregularMetre", answerId:"metre-3", options:metreOptions, mode:"choice" });
  const fourBeat = expanded.buildQuestion({ level:"H", topic:"irregularMetre", answerId:"metre-4", options:metreOptions, mode:"choice" });
  assert.equal(threeBeat.timeSignature.id,"3/4");
  assert.equal(fourBeat.timeSignature.id,"4/4");
  assert.deepEqual(expanded.idsByFamily.accompanimentDevices,["device-pedal","device-no-pedal","device-inverted-pedal"]);
  for(const level of ["N4","N5","H","AH"]) {
    const values=new Set();
    for(let run=0;run<32;run++) {
      const sample=expanded.buildQuestion({level,topic:"accompanimentDevices",answerId:"device-pedal",options:["device-pedal","device-no-pedal"],mode:"choice"});
      values.add(sample.pedalNoteBeats);
      let pedalPitch;
      for(const bar of sample.bars) {
        const repeated=bar.accompaniment.filter(event=>event.role==="pedal");
        assert.equal(repeated.length,sample.timeSignature.beats/sample.pedalNoteBeats);
        repeated.forEach((event,index)=>{
          pedalPitch??=event.pitches[0];
          assert.deepEqual(event.pitches,[pedalPitch]);
          assert.equal(event.beat,index*sample.pedalNoteBeats);
          assert.equal(event.beats,sample.pedalNoteBeats*.88);
          assert.ok(Math.abs(.018*event.volume-.078*.82*.8)<1e-10,"pedal gain is 80% of melody gain");
        });
      }
    }
    assert.deepEqual(values,new Set([1,.5]),"pedals offer repeated crotchets and quavers");
  }
  assert.deepEqual(expanded.idsByFamily.vamp,["vamp-yes","vamp-no"]);
  const vamp = expanded.buildQuestion({ level:"N4", topic:"vamp", answerId:"vamp-yes", options:["vamp-yes","vamp-no"], mode:"choice" });
  const noVamp = expanded.buildQuestion({ level:"N4", topic:"vamp", answerId:"vamp-no", options:["vamp-yes","vamp-no"], mode:"choice" });
  assert.ok(vamp.bars.every(bar=>bar.accompaniment.some(event=>event.role==="bass")&&bar.accompaniment.some(event=>event.role==="chord")));
  assert.ok(noVamp.bars.every(bar=>bar.accompaniment.every(event=>event.role==="broken-chord")));
  for(const level of ["N4","N5","H","AH"]) for(let run=0;run<8;run++) {
    const sample=expanded.buildQuestion({level,topic:"vamp",answerId:"vamp-yes",options:["vamp-yes","vamp-no"],mode:"choice"});
    const spacing=sample.timeSignature.type==="compound"?.375:.5;
    assert.equal(sample.vampRate,2);
    sample.bars.forEach(bar=>{
      assert.equal(bar.accompaniment.length,Math.round(sample.timeSignature.beats/spacing));
      assert.ok(bar.accompaniment.every((event,index)=>Math.abs(event.beat-index*spacing)<1e-8&&event.beats<=spacing));
      assert.ok(bar.accompaniment.every(event=>Math.abs(.018*event.volume*Math.sqrt(event.pitches.length)-.078*.82*.8)<1e-10),"combined vamp energy uses 80% of melody gain");
      const chord=bar.accompanimentHarmony[0].pitches;
      const raised=pitch=>{while(pitch<45)pitch+=12;return pitch;};
      bar.accompaniment.forEach((event,index)=>{
        const expected=index%2===0?[raised(chord[index%4===2?2:0]-12)]:chord.map(raised);
        assert.deepEqual(event.pitches,expected,"vamp repeats root, chord, fifth, chord in the current harmony");
      });
    });
  }
  const harmonyAwareFamilies={
    changeOfKey:["change-key-yes","change-key-no"],
    accompanimentDevices:["device-pedal","device-no-pedal"],
    steadyTempo:["tempo-adagio","tempo-andante","tempo-allegro"],
    vamp:["vamp-yes","vamp-no"],
    suspension:["suspension-yes","suspension-no"],
  };
  for(const [topic,options] of Object.entries(harmonyAwareFamilies)) for(let run=0;run<24;run++) {
    const answerId=options[run%options.length];
    const level=topic==="suspension"?"AH":topic==="changeOfKey"||topic==="vamp"||topic==="accompanimentDevices"?"N4":"N3";
    const question=expanded.buildQuestion({level,topic,answerId,options,mode:"choice"});
    for(const bar of question.bars) {
      const opening=bar.notes.find(note=>!note.rest);
      const openingHarmony=bar.accompanimentHarmony.filter(segment=>(segment.beat??0)===0).flatMap(segment=>segment.pitches||[]);
      if(!opening||!openingHarmony.length) continue;
      const openingPitchClass=((opening.soundingMidi%12)+12)%12;
      assert.ok(openingHarmony.some(midi=>((midi%12)+12)%12===openingPitchClass),`${topic}/${answerId} bar ${bar.barIndex} opens inside its harmony`);
    }
  }
  assert.deepEqual(expanded.idsByFamily.repetitionSequence,["pattern-ostinato","pattern-sequence"]);
  assert.equal(expanded.concepts["pattern-ostinato"].label,"Repetition");
  assert.deepEqual(expanded.idsByFamily.melodicTransformation,["transform-inversion","transform-retrograde"]);
  assert.equal(expanded.concepts["transform-original"],undefined);
  assert.equal(expanded.idsByFamily.imitationType,undefined);
  assert.deepEqual(expanded.idsByFamily.melodicMotion,["motion-contrary","motion-no-contrary"]);
  assert.deepEqual(expanded.idsByFamily.relativeKey,["relative-major","relative-minor","relative-same"]);
  assert.equal(expanded.concepts["relative-same"].label,"No modulation");
  assert.deepEqual(expanded.idsByFamily.changeOfKey,["change-key-yes","change-key-no"]);
  assert.deepEqual(
    expanded.conceptIdsForLevel("N4").filter(id=>["changeOfKey","modulation"].includes(expanded.concepts[id].family)),
    ["change-key-yes","change-key-no"],
    "National 4 introduces change of key"
  );
  assert.deepEqual(
    expanded.conceptIdsForLevel("N5").filter(id=>["changeOfKey","modulation"].includes(expanded.concepts[id].family)),
    ["modulation-yes","modulation-no"],
    "National 5 and later merge change of key into modulation"
  );
  const keyChange=expanded.buildQuestion({level:"N4",topic:"changeOfKey",answerId:"change-key-yes",options:["change-key-yes","change-key-no"],mode:"choice"});
  assert.notEqual(keyChange.bars[0].notes[0].soundingMidi,keyChange.bars.at(-1).notes[0].soundingMidi);
  const tritone = expanded.buildQuestion({ level:"AH", topic:"intervalRecognition", answerId:"interval-tritone", options:["interval-tritone","interval-octave"], mode:"choice" });
  assert.equal(tritone.tritoneHarmony,"dominant-seventh-resolution");
  assert.deepEqual(tritone.bars.map(bar=>bar.harmonicFunction),[null,"dominant-seventh","tonic-resolution",null,null,"dominant-seventh","tonic-resolution",null]);
  const tritoneTargetBars=tritone.bars.filter(bar=>bar.harmonicFunction==="dominant-seventh");
  const tritoneDirections = tritoneTargetBars.map(bar=>bar.notes[1].soundingMidi-bar.notes[0].soundingMidi);
  assert.ok(tritoneDirections.every(distance=>Math.abs(distance)===6));
  assert.ok(tritoneDirections.some(distance=>distance>0), "full excerpts include an ascending tritone");
  assert.ok(tritoneDirections.some(distance=>distance<0), "full excerpts include a descending tritone");
  tritoneTargetBars.forEach(bar=>{
    const harmonyPitchClasses=new Set(bar.accompanimentHarmony[0].pitches.map(pitch=>((pitch%12)+12)%12));
    assert.ok(bar.notes.every(note=>harmonyPitchClasses.has(((note.soundingMidi%12)+12)%12)), "the dominant seventh contains both target notes");
    assert.equal(bar.accompaniment.length,2,"the target uses sparse bass-and-chord accompaniment");
  });
  tritone.bars.filter(bar=>bar.harmonicFunction==="tonic-resolution").forEach(bar=>{
    assert.ok(tritone.key.chords.I.some(p=>((p-bar.notes[0].midi)%12+12)%12===0));
    assert.equal(bar.accompaniment.length,1,"the resolution remains sparse");
  });
  assert.equal(
    tritone.isolatedPassage.notes[1].soundingMidi-tritone.isolatedPassage.notes[0].soundingMidi,
    tritoneDirections[0],
    "the isolated interval keeps the randomly selected first direction"
  );
  assert.deepEqual(expanded.idsByFamily.intervalRecognition,["interval-semitone","interval-tone","interval-tritone","interval-octave"]);
  assert.equal(expanded.conceptIdsForLevel("N5").some(id=>expanded.concepts[id].family==="intervalRecognition"),false);
  assert.deepEqual(expanded.conceptIdsForLevel("H").filter(id=>expanded.concepts[id].family==="intervalRecognition"),["interval-semitone","interval-tone","interval-octave"]);
  const adagio = expanded.buildQuestion({ level:"N3", topic:"steadyTempo", answerId:"tempo-adagio", options:["tempo-adagio","tempo-allegro"], mode:"choice" });
  assert.equal(adagio.playbackTempo.bpm,60);
  assert.equal(adagio.bars.length,8,"National 3 tempo uses an eight-bar in-context excerpt");
  assert.equal(adagio.tempoExcerptBars,8);
  assert.equal(adagio.tempoPhraseLength,4);
  assert.equal(adagio.tempoCadence,"perfect");
  assert.equal(adagio.tempoClearOpeningBars,2);
  for(let run=0;run<100;run++) {
    const sample=expanded.buildQuestion({level:"N3",topic:"steadyTempo",answerId:run%2?"tempo-adagio":"tempo-allegro",options:["tempo-adagio","tempo-allegro"],mode:"choice"});
    const pulse=sample.tempoPulseBeats;
    assert.ok(["pulse-chords","alternating-bass-chords"].includes(sample.accompanimentPattern));
    assert.equal(sample.generationVariation.accompaniment,sample.accompanimentPattern);
    for(const bar of sample.bars) {
      assert.equal(bar.accompaniment.length,sample.timeSignature.beats/pulse);
      assert.ok(bar.accompaniment.every((event,index)=>event.beat===index*pulse&&event.beats<=pulse));
      if(bar.barIndex<2) assert.ok(bar.notes.every(note=>!note.rest&&note.beats===pulse));
      else if(bar.barIndex<7) assert.ok(bar.notes.every(note=>note.beats>=pulse/2));
    }
    assert.equal(sample.bars.at(-1).notes.length,1);
    assert.equal(sample.bars.at(-1).notes[0].beats,sample.timeSignature.beats);
  }
  assert.ok(["V","V7"].includes(adagio.bars.at(-2).chordSymbol));
  assert.equal(adagio.bars.at(-1).chordSymbol,"I");
  const higherTempo = expanded.buildQuestion({ level:"H", topic:"steadyTempo", answerId:"tempo-andante", options:["tempo-adagio","tempo-andante","tempo-allegro"], mode:"choice" });
  assert.equal(higherTempo.bars.length,16,"Higher tempo retains the sixteen-bar form");
  const higherMovement = expanded.buildQuestion({level:"H",topic:"stepLeap",answerId:"movement-step",options:["movement-step","movement-leap"],mode:"choice"});
  assert.equal(higherMovement.bars.length,16,"later-level Melodic Movements retain the sixteen-bar form");
  assert.equal(higherMovement.movementPhraseCount,4);
  const suspended = expanded.buildQuestion({ level:"AH", topic:"suspension", answerId:"suspension-yes", options:["suspension-yes","suspension-no"], mode:"choice" });
  assert.equal(suspended.bars[6].accompanimentHarmony.length,2);
  assert.equal(suspended.bars[6].notes[0].tiedFromPrevious,true);
});

test("vamp melodies remain consonant throughout chord attacks and chords have balanced energy",()=>{
  const expanded=window.MLH.EarTrainingExercises;
  const pc=pitch=>((pitch%12)+12)%12;
  for(const level of ["N4","N5","H","AH"]) for(let run=0;run<(level==="N4"?1000:100);run++) {
    const q=expanded.buildQuestion({level,topic:"vamp",answerId:run%2?"vamp-yes":"vamp-no",options:["vamp-yes","vamp-no"],mode:"choice"});
    assert.equal(q.vampHarmonyFitted,true);
    for(const bar of q.bars) for(const event of bar.accompaniment) {
      assert.ok(Math.abs(Math.sqrt(event.pitches.reduce(sum=>sum+Math.pow(.018*event.volume,2),0))-.078*.82*.8*(event.metricAccent??1))<1e-10);
      const key=expanded.keys[bar.keyId]||q.key;
      const chord=new Set(key.chords[bar.chordSymbol].map(pc));
      const overlaps=bar.notes.filter(note=>!note.rest&&note.beat<event.beat+event.beats-1e-8&&note.beat+note.beats>event.beat+1e-8);
      for(const note of overlaps) {
        if(event.pitches.length>1) assert.ok(chord.has(pc(note.soundingMidi)),"all melody notes sounding against chord attacks belong to the harmony");
        else assert.ok(![1,6,11].includes(pc(note.soundingMidi-event.pitches[0])),"single bass attacks avoid exposed semitone/tritone clashes");
      }
    }
  }
  const fixture={key:expanded.keys.C,timeSignature:expanded.signatures["4/4"],bars:[{barIndex:0,chordSymbol:"I",notes:[{relativeStep:1,midi:62,soundingMidi:62,beat:.375,beats:.125},{relativeStep:2,midi:64,soundingMidi:64,beat:.5,beats:.5}],accompaniment:[{beat:0,beats:.42,pitches:[48],volume:1},{beat:.5,beats:.42,pitches:[48,52,55],volume:1}]}]};
  assert.equal(expanded.fitVampHarmony(fixture).bars[0].notes[0].passingTone,true,"brief passing notes are retained when they resolve before the chord attack");
});

test("National 4 harmonic devices fit their native metre and demonstrate their answers",()=>{
  const expanded=window.MLH.EarTrainingExercises;
  const signatures=new Set(),keys=new Set();
  for(const [topic,answers] of Object.entries({accompanimentDevices:["device-pedal","device-no-pedal"],vamp:["vamp-yes","vamp-no"],changeOfKey:["change-key-yes","change-key-no"]})) {
    for(const answerId of answers) for(let run=0;run<64;run++) {
      const q=expanded.buildQuestion({level:"N4",topic,answerId,options:answers,mode:"choice"});
      keys.add(q.generatedKey);signatures.add(q.timeSignature.id);
      assert.equal(q.bars.length,8);assert.equal(q.totalBeats,8*q.timeSignature.beats);
      assert.deepEqual(q.bars.slice(-2).map(bar=>bar.chordSymbol),["V","I"]);
      assert.equal(q.bars.at(-1).notes.length,1);
      assert.equal(q.bars.at(-1).notes[0].beats,q.timeSignature.beats);
      for(const bar of q.bars) for(const event of bar.accompaniment) {
        const limit=event.sustainAcrossBars?q.totalBeats-bar.barIndex*q.timeSignature.beats:q.timeSignature.beats;
        assert.ok(event.beat>=0&&event.beats>0&&event.beat+event.beats<=limit+1e-8);
        assert.ok(event.pitches.every(midi=>midi>=45));
      }
      if(topic==="accompanimentDevices") {
        const pedals=q.bars.flatMap(bar=>bar.accompaniment.filter(event=>event.role==="pedal").map(event=>({...event,barIndex:bar.barIndex})));
        if(answerId==="device-pedal") {
          assert.ok([1,.5].includes(q.pedalNoteBeats));
          assert.equal(pedals.length,8*q.timeSignature.beats/q.pedalNoteBeats);
          assert.ok(pedals.every(event=>event.beats===q.pedalNoteBeats*.88&&event.pitches[0]===q.pedalPitch));
          q.bars.forEach(bar=>assert.deepEqual(bar.accompaniment.filter(event=>event.role==="pedal").map(event=>event.beat),Array.from({length:q.timeSignature.beats/q.pedalNoteBeats},(_,i)=>i*q.pedalNoteBeats)));
          assert.ok(new Set(q.bars.map(bar=>bar.chordSymbol)).size>1);
        } else assert.equal(pedals.length,0);
      }
      if(topic==="vamp") {
        assert.ok(q.bars.every(bar=>bar.accompaniment.every(event=>Math.abs(.018*event.volume*Math.sqrt(event.pitches.length)-.078*.82*.8*(event.metricAccent??1))<1e-10)),"vamp and comparison accompaniment use balanced 80% gain with metre accents");
        const spacing=answerId==="vamp-yes"&&q.timeSignature.id==="6/8"?.375:.5;
        const expected=Array.from({length:Math.round(q.timeSignature.beats/spacing)},(_,i)=>i*spacing);
        assert.equal(q.vampRate,2);
        q.bars.forEach(bar=>assert.deepEqual(bar.accompaniment.map(event=>event.beat),expected));
      }
      if(topic==="changeOfKey") {
        assert.ok(q.bars.slice(0,4).every(bar=>bar.keyId===q.keyChange.from));
        assert.ok(q.bars.slice(4).every(bar=>bar.keyId===q.keyChange.to));
        assert.equal(q.keyChange.from!==q.keyChange.to,answerId==="change-key-yes");
        for(const [opening,recall] of [[0,4],[1,5]]) {
          assert.deepEqual(q.bars[recall].notes.map(note=>[note.relativeStep,note.beat,note.beats]),q.bars[opening].notes.map(note=>[note.relativeStep,note.beat,note.beats]),"opening motif returns with its rhythm and scale-degree contour in the arrival key");
        }
        const preparation=q.bars[3];
        assert.equal(preparation.accompanimentHarmony.length,2);
        assert.equal(preparation.accompanimentHarmony[1].beat,q.timeSignature.beats/2);
        assert.deepEqual(preparation.accompanimentHarmony[1].pitches,expanded.keys[q.keyChange.to].chords.V7,"destination dominant seventh prepares the new tonic");
        assert.equal(q.bars[4].notes[0].soundingMidi-preparation.notes.at(-1).soundingMidi,1,"the destination leading note resolves upwards by a semitone");
        if(answerId==="change-key-yes") {
          assert.match(q.keyChange.preparationChord,/^V7\/(III|IV|V|VI)$/);
          const pivotClasses=preparation.accompanimentHarmony[0].pitches.map(pitch=>pitch%12).sort((a,b)=>a-b);
          assert.ok(Object.values(expanded.keys[q.keyChange.to].chords).some(chord=>JSON.stringify(chord.map(pitch=>pitch%12).sort((a,b)=>a-b))===JSON.stringify(pivotClasses)),"the pivot triad belongs to both keys");
        } else assert.equal(q.keyChange.preparationChord,"V7");
        const tonic=expanded.keys[q.keyChange.to].tonic;
        const final=q.bars.at(-1).notes[0].soundingMidi;
        assert.equal((final-tonic+120)%12,0);
      }
    }
  }
  assert.equal(keys.size,8);assert.deepEqual(signatures,new Set(["2/4","3/4","4/4","6/8"]));
});

test("N4 no-vamp accompaniment groups quavers with the melody's metre",()=>{
  const core=window.MLH.EarTrainingExercises;
  for(const signature of core.variedSignaturesForLevel("N4")) for(const keyName of core.keysForLevel("N4")) {
    const q=core.withGenerationContext({level:"N4",topic:"vamp"},variation=>{
      variation.keyName=keyName;variation.signature={...signature};
      return core.makeN4HarmonicPassage("vamp",false);
    });
    const groupSize=signature.type==="compound"?3:2;
    const pulse=signature.pulseQuarterBeats;
    q.bars.forEach(bar=>{
      const events=bar.accompaniment;
      assert.equal(events.length,signature.beats*2);
      assert.ok(events.every((event,index)=>event.beat===index*.5&&event.beats<=.5&&event.pitches.length===1));
      const accents=events.filter(event=>event.metricAccent>=.85);
      assert.deepEqual(accents.map(event=>event.beat),Array.from({length:signature.pulseCount},(_,index)=>index*pulse));
      for(let index=0;index<events.length;index+=groupSize) {
        const group=events.slice(index,index+groupSize);
        assert.ok(group.slice(1).every(event=>event.volume<group[0].volume),"each metre pulse begins with a stronger note");
        assert.ok(group.every(event=>event.beat+event.beats<=(index/groupSize+1)*pulse+1e-8),"quaver groups stay inside their pulse");
      }
      assert.equal(Math.max(...bar.notes.map(note=>note.beat+note.beats)),signature.beats);
    });
  }
});

test("prepared N4 key changes resolve and recall their motif in every key and metre",()=>{
  const core=window.MLH.EarTrainingExercises;
  const pc=midi=>((midi%12)+12)%12;
  for(const keyName of core.keysForLevel("N4")) for(const signature of core.variedSignaturesForLevel("N4")) for(const changes of [true,false]) for(let run=0;run<8;run++) {
    const q=core.withGenerationContext({level:"N4",topic:"changeOfKey"},variation=>{
      variation.keyName=keyName;variation.signature={...signature};
      return core.makeN4HarmonicPassage("changeOfKey",changes);
    });
    assert.equal(q.bars.length,8);
    assert.equal(q.timeSignature.id,signature.id);
    assert.equal(q.keyChange.from,keyName);
    assert.equal(q.keyChange.to!==keyName,changes);
    assert.equal(q.accompanimentPattern,"pulse-chords");
    for(const bar of q.bars) {
      const chords=bar.accompaniment.filter(event=>event.role==="harmony");
      const expected=Array.from({length:signature.pulseCount},(_,index)=>index*signature.pulseQuarterBeats);
      if(bar.barIndex===3&&!expected.includes(signature.beats/2)) expected.push(signature.beats/2);
      expected.sort((a,b)=>a-b);
      assert.deepEqual(chords.map(event=>event.beat),expected,"repeated chords stay on the metre pulse and sound the preparation at its exact boundary");
      assert.ok(chords.every(event=>event.beats<signature.pulseQuarterBeats&&event.beat+event.beats<=signature.beats));
      for(const event of chords) {
        const segment=bar.accompanimentHarmony.find(segment=>event.beat>=segment.beat&&event.beat<segment.beat+segment.beats);
        assert.ok(event.beat+event.beats<=segment.beat+segment.beats+1e-8,"old chord releases before the new harmony");
        assert.deepEqual(event.pitches.map(pc).sort((a,b)=>a-b),segment.pitches.map(pc).sort((a,b)=>a-b));
      }
    }
    assert.equal(q.bars[4].notes[0].soundingMidi-q.bars[3].notes.at(-1).soundingMidi,1);
    for(const [opening,recall] of [[0,4],[1,5]]) assert.deepEqual(q.bars[opening].notes.map(note=>[note.relativeStep,note.beats]),q.bars[recall].notes.map(note=>[note.relativeStep,note.beats]));
    for(const bar of q.bars) for(const note of bar.notes) {
      assert.ok(note.soundingMidi>=57&&note.soundingMidi<=84);
      assert.ok(note.beat+note.beats<=signature.beats+1e-8);
      for(const segment of bar.accompanimentHarmony.filter(segment=>note.beat<segment.beat+segment.beats-1e-8&&note.beat+note.beats>segment.beat+1e-8)) {
        if(segment.pitches.some(pitch=>pc(pitch)===pc(note.soundingMidi))) continue;
        const index=bar.notes.indexOf(note),prior=bar.notes[index-1],next=bar.notes[index+1];
        assert.ok(prior&&next&&note.beats<=.5&&Math.abs(note.relativeStep-prior.relativeStep)===1&&Math.abs(next.relativeStep-note.relativeStep)===1,"non-chord tones are short, stepwise and resolved");
        assert.ok(Math.abs(note.soundingMidi-prior.soundingMidi)<=2&&Math.abs(next.soundingMidi-note.soundingMidi)<=2,"passing notes avoid augmented-second steps");
        assert.ok(segment.pitches.some(pitch=>pc(pitch)===pc(next.soundingMidi)));
        const strong=signature.type==="compound"?[0,1.5]:Array.from({length:signature.beats},(_,i)=>i);
        assert.ok(!strong.includes(note.beat),"strong beats remain supported by the harmony");
      }
    }
    const melody=q.bars.flatMap(bar=>bar.notes);
    assert.ok(melody.slice(1).every((note,index)=>Math.abs(note.soundingMidi-melody[index].soundingMidi)<=7),"the whole phrase avoids abrupt leaps across barlines");
    assert.ok(q.bars.slice(0,2).every(bar=>new Set(bar.notes.map(note=>note.soundingMidi)).size>=3),"opening motifs have varied pitches");
  }
});

test("National 4 anacrusis uses four phrase bars with triads only and an immediate native pickup",()=>{
  const core=window.MLH.EarTrainingExercises;
  for(const signature of core.variedSignaturesForLevel("N4")) for(const keyName of core.keysForLevel("N4")) for(const hasPickup of [true,false]) {
    for(let run=0;run<6;run++) {
      const q=core.withGenerationContext({level:"N4",topic:"anacrusis"},variation=>{
        variation.keyName=keyName;variation.signature={...signature};
        return core.makeN4AnacrusisPassage(hasPickup);
      });
      assert.equal(q.phraseBarCount,4);
      assert.equal(q.timeSignature.id,signature.id);
      assert.equal(q.key.id,keyName);
      assert.equal(q.hasPickup,hasPickup);
      assert.equal(q.bars.length,hasPickup?5:4);
      assert.equal(q.notes[0].beat,0);
      assert.equal(q.totalBeats,4*q.timeSignature.beats+q.pickupBeats);
      const full=q.bars.filter(bar=>!bar.isPickup);
      assert.equal(full.length,4);
      assert.equal(q.keyChange,undefined,"anacrusis does not inherit key-change preparation");
      assert.deepEqual(full.map(bar=>bar.chordSymbol),["I","IV","V","I"]);
      assert.equal(full.at(-1).accompaniment.length,1,"the final tonic is one held chord");
      assert.equal(full.at(-1).accompaniment[0].beat,0);
      assert.equal(full.at(-1).accompaniment[0].beats,signature.beats,"the concluding tonic lasts the full bar");
      for(const bar of full) {
        assert.equal(bar.accompanimentHarmony.length,1);
        assert.equal(bar.accompanimentHarmony[0].pitches.length,3,"no dominant seventh is inserted");
        assert.ok(bar.accompaniment.every(event=>event.pitches.length===3));
        assert.ok(bar.notes.every(note=>note.rest||(note.soundingMidi>=57&&note.soundingMidi<=84)),"the dedicated four-bar phrase remains in A3–C6");
        assert.deepEqual(bar.accompanimentHarmony[0].pitches,core.keys[keyName].chords[bar.chordSymbol]);
      }
      assert.equal(full[0].startBeat,q.pickupBeats);
      assert.equal(full[0].notes[0].beat,0);
      assert.ok(full[0].accompaniment.some(event=>event.beat===0));
      for(let index=1;index<q.bars.length;index++) assert.equal(q.bars[index].startBeat,q.bars[index-1].startBeat+(q.bars[index-1].beats||q.timeSignature.beats));
      assert.deepEqual(full.slice(-2).map(bar=>bar.chordSymbol),["V","I"]);
      if(hasPickup) {
        const pickup=q.bars[0];
        assert.equal(pickup.startBeat,0);assert.equal(pickup.notes[0].beat,0);
        assert.ok(pickup.notes.length>=1&&pickup.notes.length<=4);
        assert.equal(pickup.notes.reduce((sum,note)=>sum+note.beats,0),q.pickupBeats);
        assert.equal(full[0].notes[0].soundingMidi-pickup.notes.at(-1).soundingMidi,1);
        assert.equal(pickup.accompaniment.length,0);
        assert.ok(pickup.notes.every(note=>note.soundingMidi>=57&&note.soundingMidi<=84));
        assert.ok(q.pickupBeats<q.timeSignature.beats,"the pickup remains an incomplete bar");
        assert.equal(pickup.pulseOffsets.length,Math.floor(q.pickupBeats/q.timeSignature.pulseQuarterBeats));
        assert.ok(pickup.pulseOffsets.every(offset=>Number.isInteger((q.pickupBeats-offset)/q.timeSignature.pulseQuarterBeats)),"pickup clicks align backwards from the first downbeat");
        assert.ok(pickup.pulseAccents.every(accent=>accent===false));
      } else assert.equal(q.pickupBeats,0);
    }
  }
});

test("anacrusis rotates through quaver and two-beat pickup rhythms",()=>{
  const core=window.MLH.EarTrainingExercises;
  for(const signature of core.variedSignaturesForLevel("N4")) {
    const rhythms=new Set();
    for(let run=0;run<24;run++) {
      const q=core.withGenerationContext({level:"N4",topic:"anacrusis"},variation=>{
        variation.signature={...signature};return core.makeN4AnacrusisPassage(true);
      });
      rhythms.add(q.bars[0].notes.map(note=>note.beats).join(","));
      assert.ok(q.pickupBeats<signature.beats);
      assert.equal(q.phraseBarCount,4);
    }
    assert.ok(rhythms.has("0.5,0.5"),`${signature.id} includes two quavers`);
    if(signature.id==="3/4"||signature.id==="4/4") {
      for(const rhythm of ["1,1","1,0.5,0.5","0.5,0.5,1","0.5,0.5,0.5,0.5"]) assert.ok(rhythms.has(rhythm),`${signature.id} includes varied two-beat pickups`);
    }
    if(signature.id==="6/8") assert.ok(rhythms.has("0.5,0.5,0.5"),"compound time includes three grouped quavers");
  }
});

test("excerpt keys, tempos and suitable accompaniment styles vary by qualification level", () => {
  global.window = { MLH: {} };
  delete require.cache[require.resolve("../aural-accompaniment.js")];
  delete require.cache[require.resolve("../ear-training-exercises.js")];
  require("../aural-accompaniment.js");
  const expanded = require("../ear-training-exercises.js");
  const allKeys=["C","G","D","Bb","Am","Em","Dm","F"];
  const expectedKeys = Object.fromEntries(["N3","N4","N5","H","AH"].map(level=>[level,allKeys]));
  for (const [level,keys] of Object.entries(expectedKeys)) {
    assert.deepEqual(expanded.keysForLevel(level),keys,`${level} key pool`);
    const questions = Array.from({length:keys.length},()=>expanded.buildQuestion({
      level, topic:"melodyDirection", answerId:"direction-ascending",
      options:["direction-ascending","direction-descending"], mode:"choice",
    }));
    assert.deepEqual(new Set(questions.map(question=>question.generatedKey)),new Set(keys),`${level} rotates through every allowed key`);
  }
  const varied = Array.from({length:3},()=>expanded.buildQuestion({
    level:"AH", topic:"melodyDirection", answerId:"direction-ascending",
    options:["direction-ascending","direction-descending"], mode:"choice",
  }));
  assert.deepEqual(new Set(varied.map(question=>question.playbackTempo.label)),new Set(["Adagio","Andante","Allegro"]),"tempo cycle uses the three named states");
  assert.deepEqual(new Set(varied.map(question=>question.playbackTempo.bpm)),new Set([60,80,100]),"tempo cycle uses the agreed BPM values");
  assert.ok(varied.every((question,index)=>index===0||question.timeSignature.id!==varied[index-1].timeSignature.id||question.accompanimentPattern!==varied[index-1].accompanimentPattern),"a metre does not repeat the same style immediately");
  const variedMetres = Array.from({length:4},()=>expanded.buildQuestion({
    level:"AH", topic:"melodyDirection", answerId:"direction-ascending",
    options:["direction-ascending","direction-descending"], mode:"choice",
  }));
  assert.deepEqual(new Set(variedMetres.map(question=>question.timeSignature.id)),new Set(["2/4","3/4","4/4","6/8"]),"ordinary AH excerpts rotate through four suitable metres");
  assert.ok(variedMetres.every(question=>question.timeSignature.id!=="5/4"),"incidental metre variation never uses 5/4");
  assert.ok(variedMetres.every(question=>window.MLH.AuralAccompaniment.isStyleCompatible(question.accompanimentPattern,question.timeSignature)),"each accompaniment style matches its selected metre");
  const patternMetres=Array.from({length:4},()=>expanded.buildQuestion({
    level:"N3",topic:"repetitionSequence",answerId:"pattern-sequence",
    options:["pattern-ostinato","pattern-sequence"],mode:"choice",
  }));
  assert.deepEqual(new Set(patternMetres.map(question=>question.timeSignature.id)),new Set(["2/4","3/4","4/4","6/8"]),"patterns are generated natively in every ordinary metre");
  assert.ok(patternMetres.every(question=>question.patternSourceTimeSignature===question.timeSignature.id),"pattern melody and accompaniment share their source metre");
  assert.ok(patternMetres.every(question=>question.bars.every(bar=>bar.accompaniment.every(event=>event.beat+event.beats<=question.timeSignature.beats+1e-8))),"pattern accompaniment stays inside every selected metre");
  const twoFourPattern=patternMetres.find(question=>question.timeSignature.id==="2/4");
  assert.equal(twoFourPattern.bars.length,8,"National 3 2/4 patterns use eight bars");
  assert.equal(twoFourPattern.patternFeatureBars,7,"National 3 2/4 patterns use seven feature bars");
  assert.deepEqual(twoFourPattern.patternHarmony.slice(-2),["V","I"],"2/4 patterns cadence in bars 7 and 8");
  assert.equal(twoFourPattern.bars.at(-1).notes[0].beats,2,"the final 2/4 tonic fills bar 8");
  assert.deepEqual(expanded.variedSignaturesForLevel("N3").map(signature=>signature.id),["2/4","3/4","4/4","6/8"],"National 3 uses the same non-metre signature pool");
  assert.doesNotMatch(source,/label:"Varied"|VARIED_TEMPO|tempo-moderato|Moderato/);
  assert.match(source,/const isolatedScale = questionTopic === "scales" && !scalesPassage/);
  assert.match(source,/const tempo = isolatedScale \? \(question\.isolatedPlaybackTempo \|\| TEMPOS\[2\]\) : \(question\.playbackTempo \|\| TEMPOS\[1\]\)/);
  assert.match(source,/function buildSixteenBarScalePassage\(answerId,tonicMidi\)/);
  assert.match(source,/barCount:16,totalBeats:16\*signature\.beats/);
  assert.match(source,/question\.bars\?\.length \|\| question\.passage\?\.bars\?\.length/);
  assert.match(source,/passage:EAR_TRAINING\.retimePassage\(question\.passage,signature\)/);
});

test("shared accompaniment patterns honour every Ear Training metre", () => {
  global.window = { MLH:{} };
  delete require.cache[require.resolve("../aural-accompaniment.js")];
  require("../aural-accompaniment.js");
  const accompaniment = window.MLH.AuralAccompaniment;
  assert.equal(accompaniment.minimumMidi,45,"A2 is the shared accompaniment floor");
  assert.deepEqual(accompaniment.styles,["block_chords","broken_chords","alberti_bass","waltz","piano_ballad","contemporary_pop","power_chords","stride_piano","walking_bass"]);
  assert.equal(accompaniment.stylesForSignature({id:"2/4"}).includes("waltz"),false);
  assert.equal(accompaniment.stylesForSignature({id:"3/4"}).includes("waltz"),true);
  assert.equal(accompaniment.stylesForSignature({id:"6/8"}).includes("waltz"),false);
  for(const signatureId of ["2/4","3/4","4/4","6/8"]) {
    const signature={id:signatureId};
    const available=accompaniment.stylesForSignature(signature);
    const completeRotation=Array.from({length:available.length},()=>accompaniment.chooseStyle(signature));
    assert.equal(new Set(completeRotation).size,available.length,`${signatureId} uses every compatible accompaniment style before recycling one`);
  }
  const signatures = [
    {id:"2/4",beats:2,type:"simple"},
    {id:"3/4",beats:3,type:"simple"},
    {id:"4/4",beats:4,type:"simple"},
    {id:"6/8",beats:3,type:"compound"},
    {id:"5/4",beats:5,type:"irregular"},
  ];
  for (const signature of signatures) for (const style of accompaniment.styles) {
    const events = accompaniment.eventsForBar({
      signature,
      notes:[{midi:72,beat:0,beats:signature.beats}],
      segments:[{beat:0,beats:signature.beats,pitches:[48,52,55]}],
      style,
    });
    assert.ok(events.length,`${signature.id}/${style} produces accompaniment`);
    assert.ok(events.every(event=>event.beat>=0&&event.beats>0&&event.beat+event.beats<=signature.beats+1e-8),`${signature.id}/${style} stays inside the bar`);
    assert.ok(events.every(event=>event.pitches.every(pitch=>pitch>=45)),`${signature.id}/${style} never sounds below A2`);
    if(signature.id==="6/8") assert.ok(events.some(event=>Math.abs(event.beat-1.5)<1e-8),`${style} articulates both dotted-crotchet groups in 6/8`);
    if(signature.id==="5/4") assert.ok(events.some(event=>Math.abs(event.beat-3)<1e-8),`${style} articulates the 3+2 grouping in 5/4`);
  }
});

test("legacy eight-bar passage generation obeys the same level key pools", () => {
  global.window = { MLH: {} };
  delete require.cache[require.resolve("../practice-melody-generator.js")];
  delete require.cache[require.resolve("../melodic-dictation-generator.js")];
  window.PracticeMelodyGenerator = require("../practice-melody-generator.js");
  require("../melodic-dictation-generator.js");
  const generator = window.MLH.MelodicDictation;
  for (const [level,keyIds] of Object.entries(generator.LEVEL_KEY_IDS)) {
    for (let attempt=0;attempt<20;attempt++) {
      const passage = generator.makeEightBarRepetitionQuestion(level);
      assert.ok(keyIds.includes(passage.key.id),`${level}/${passage.key.id}`);
    }
  }
  for (const key of generator.KEYS) {
    const passage = generator.makeEightBarRepetitionQuestion("AH",0,key);
    assert.equal(passage.key.id,key.id);
    assert.equal(passage.bars.length,8);
  }
});

test("the approved two-or-four Beats in the Bar equivalence remains unchanged", () => {
  assert.match(source, /\["beats-2", "beats-4"\]\.includes\(question\.answerId\)\) return \["beats-2", "beats-4"\]/);
});

test("time-listening generation stays valid for every supported signature", () => {
  global.window = { MLH: {} };
  window.PracticeMelodyGenerator = require("../practice-melody-generator.js");
  delete require.cache[require.resolve("../aural-accompaniment.js")];
  delete require.cache[require.resolve("../time-signatures-listening.js")];
  require("../aural-accompaniment.js");
  require("../time-signatures-listening.js");
  const listening = window.MLH.TimeSignaturesListening;
  const allKeys=["C","G","D","Bb","Am","Em","Dm","F"];
  for(const level of Object.values(listening.levels)) assert.deepEqual(level.keyIds,allKeys);
  let checked = 0;
  for (const level of Object.keys(listening.levels)) for (const signature of listening.signaturesForLevel(level)) {
    for (let attempt = 0; attempt < 5; attempt += 1) {
      const question = listening.buildAdvancedHigherListeningMelody([signature.id], { subdivisions: true, level });
      assert.equal(question.timeSignature.id, signature.id);
      assert.ok(listening.levels[level].keyIds.includes(question.key.id),`${level}/${signature.id} key`);
      assert.ok(question.bars.length > 0);
      assert.ok(question.bars.every(bar => bar.notes.length > 0));
      assert.equal(question.bars.length,["N3","N4","H","AH"].includes(level)?8:16,`${level}/${signature.id} excerpt length`);
      assert.equal(question.listeningExcerptBars,["N3","N4","H","AH"].includes(level)?8:16);
      assert.equal(question.listeningPhraseLength,4);
      assert.equal(question.listeningCadence,"perfect");
      assert.equal(question.melodyPlan.bars.length,question.bars.length);
      question.bars.forEach((bar,index)=>assert.deepEqual(question.melodyPlan.bars[index].notes,bar.notes,"time-listening plan matches adapted playback"));
      assert.equal(question.accompanimentStyle,"metre-pulses");
      for(const bar of question.bars) {
        const pulses=bar.accompaniment.filter(event=>Math.abs(event.beat/question.timeSignature.pulseQuarterBeats-Math.round(event.beat/question.timeSignature.pulseQuarterBeats))<1e-8);
        assert.equal(pulses.length,question.timeSignature.pulseCount,"each beat has one accompaniment pulse");
        assert.ok(pulses.slice(1).every(event=>event.volume<pulses[0].volume),"the first beat is strongest");
        if(signature.id==="4/4") assert.ok(pulses[2].volume>pulses[1].volume&&pulses[2].volume>pulses[3].volume,"beat three has a secondary accent");
        assert.ok(bar.accompaniment.every(event=>event.beat>=0&&event.beats>0&&event.beat+event.beats<=question.timeSignature.beats+1e-8&&event.pitches.every(pitch=>Number.isFinite(pitch)&&pitch>=45)),"accompaniment fits the bar and stays above A2");
      }
      if(["N3","N4"].includes(level)) for(const bar of question.bars.slice(0,2)) {
        assert.equal(bar.notes.length,question.timeSignature.pulseCount);
        assert.ok(bar.notes.every((note,index)=>!note.rest&&note.beat===index*question.timeSignature.pulseQuarterBeats&&note.beats===question.timeSignature.pulseQuarterBeats),"N3 establishes the pulse clearly for two bars");
      }
      assert.ok(["V","V7"].includes(question.bars.at(-2).chordSymbol),`${level}/${signature.id} dominant cadence chord`);
      assert.equal(question.bars.at(-1).chordSymbol,"I",`${level}/${signature.id} tonic cadence chord`);
      checked += 1;
    }
  }
  assert.equal(checked, 110);
});

test("tempo-change clocks and core typed aliases remain valid", () => {
  global.window = { MLH: { MelodicDictation: {} } };
  delete require.cache[require.resolve("../tempo-changes-listening.js")];
  require("../tempo-changes-listening.js");
  const tempo = window.MLH.TempoChangesListening;
  for (const direction of ["faster", "slower", "rubato"]) {
    const clock = tempo.createTempoClock({ startBpm: 90, direction, totalBeats: 32 });
    let previous = -1;
    for (let beat = 0; beat <= 32; beat += 0.25) {
      const time = clock.timeAtBeat(beat);
      assert.ok(time >= previous);
      previous = time;
    }
  }
  for(const direction of ["faster","slower"]) {
    const clock=tempo.createTempoClock({startBpm:80,direction,totalBeats:32,steadyEnds:true});
    assert.equal(clock.bpmAtBeat(0),80);
    assert.equal(clock.bpmAtBeat(8),80);
    assert.equal(clock.bpmAtBeat(24),clock.endBpm);
    assert.equal(clock.bpmAtBeat(32),clock.endBpm);
    assert.equal(clock.timeAtBeat(8),6);
    assert.ok(Math.abs(clock.durationAtBeat(24,8)-8*60/clock.endBpm)<1e-8);
    for(let beat=0;beat<32;beat+=.25) assert.ok(clock.timeAtBeat(beat+.25)>clock.timeAtBeat(beat));
  }
  assert.equal(tempo.acceptsText("accelerando", "faster"), true);
  assert.equal(tempo.acceptsText("ritardando", "slower"), true);
  assert.equal(tempo.acceptsText("rubato", "rubato"), true);
});
