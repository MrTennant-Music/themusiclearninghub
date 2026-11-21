#!/usr/bin/env node
"use strict";

const fs = require("fs");
const path = require("path");

const projectRoot = path.resolve(__dirname, "../..");
const registry = require(path.join(projectRoot, "digital-question-papers/paper-registry.js"));
const outputFlag = process.argv.indexOf("--output");
const outputPath = outputFlag >= 0 ? process.argv[outputFlag + 1] : "";

const tracks = [];
for (const entry of Object.values(registry)) {
  const dataFile = entry.dataFile.split("?")[0];
  const paper = require(path.join(projectRoot, "digital-question-papers", dataFile));
  for (const question of paper.questions) {
    for (const [clipIndex, clip] of (question.audio?.clips || []).entries()) {
      tracks.push({
        paperId: paper.id,
        questionId: question.id,
        clipIndex,
        source: path.resolve(projectRoot, "digital-question-papers", clip.file),
        markers: clip.markers || [],
      });
    }
  }
}

const manifest = {
  generatedAt: new Date().toISOString(),
  paperCount: Object.keys(registry).length,
  trackCount: tracks.length,
  markerCount: tracks.reduce((sum, track) => sum + track.markers.length, 0),
  tracks,
};
const json = `${JSON.stringify(manifest, null, 2)}\n`;
if (outputPath) {
  fs.mkdirSync(path.dirname(path.resolve(outputPath)), { recursive: true });
  fs.writeFileSync(path.resolve(outputPath), json);
  console.log(path.resolve(outputPath));
} else {
  process.stdout.write(json);
}
