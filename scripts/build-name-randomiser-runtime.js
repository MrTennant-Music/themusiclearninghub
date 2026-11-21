"use strict";

const fs = require("node:fs");
const path = require("node:path");
const Babel = require("@babel/standalone");

const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "namerandomiser.html");
const outputPath = path.join(root, "name-randomiser-runtime.js");
const html = fs.readFileSync(htmlPath, "utf8");
const source = html.match(/<script type="text\/x-name-randomiser-source" id="name-randomiser-jsx-source">([\s\S]*?)<\/script>/)?.[1];
if (!source) throw new Error("Name Randomiser JSX source block was not found.");

const compiled = Babel.transform(source, {
  filename: "namerandomiser.html",
  presets: ["react"],
  sourceMaps: false,
  comments: false,
  compact: true,
}).code;

fs.writeFileSync(outputPath, `${compiled}\n`);
console.log("Built name-randomiser-runtime.js");
