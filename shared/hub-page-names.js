/* Page names may change; pupil progress keeps its original stable identity. */
(function () {
  const MLH = window.MLH = window.MLH || {};
  const originalNames = {
  "staffpapergenerator.html": "staff-paper.html",
  "namerandomiser.html": "name-randomiser.html",
  "rhythmicdictation.html": "correctrhythm.html",
  "timesignatures.html": "timesig.html",
  "musicdictionaryconcept.html": "music-concept.html",
  "followthescore.html": "wheredidthemusicstop.html",
  "interactivepiano.html": "popup-piano.html",
  "worksheetgenerator.html": "worksheet-generator.html",
  "melodicdictation.html": "missingnotes.html",
  "notationcalibration.html": "notation-calibration.html",
  "articulationmarkings.html": "articulation.html",
  "noteidentification.html": "notenaming.html",
  "rhythmidentification.html": "rhythmmatch.html",
  "musicdictionary.html": "music-concepts.html",
  "enharmonicequivalents.html": "enharmonics.html",
  "conceptrecall.html": "concept-recall.html",
  "keysignatures.html": "keysig.html",
  "keyboardnoteidentificationclassroom.html": "keyboard-classroom.html",
  "bravuraglyphpicker.html": "bravura-glyph-picker.html",
  "classroomtimer.html": "classroom-timer.html",
  "chromatictuner.html": "chromatic-tuner.html",
  "keyboardnoteidentification.html": "keyboard-notes.html",
  "namerandomisertonearmeditor.html": "name-randomiser-tonearm-editor.html",
  "whowantstobeamillionaire.html": "millionaire.html",
  "scaledegrees.html": "tonic.html",
  "auralrecognition.html": "aural-recognition.html",
  "digitalquestionpapers.html": "exam.html"
};
  const currentNames = Object.fromEntries(Object.entries(originalNames).map(([current, original]) => [original, current]));
  MLH.pageIdentity = name => originalNames[name] || name;
  MLH.pageFilename = name => currentNames[name] || name;
})();
