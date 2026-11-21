"use strict";

const fs = require("node:fs");
const path = require("node:path");
const Babel = require("@babel/standalone");

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "metronome.html");
const outputPath = path.join(root, "metronome-runtime.js");
const html = fs.readFileSync(htmlPath, "utf8");
const source = html.match(/<script type="text\/x-metronome-source" id="metronome-jsx-source">([\s\S]*?)<\/script>/)?.[1];
if (!source) throw new Error("Metronome JSX source block was not found.");

const compiled = Babel.transform(source, {
  filename: "metronome.html",
  presets: ["react"],
  sourceMaps: false,
  comments: false,
  compact: true,
}).code;

fs.writeFileSync(outputPath, `${compiled}\n`);
console.log("Built metronome-runtime.js");
