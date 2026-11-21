"use strict";

const fs = require("node:fs");
const path = require("node:path");
const Babel = require("@babel/standalone");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "staff-paper.jsx");
const outputPath = path.join(root, "staff-paper-runtime.js");
const compiled = Babel.transform(fs.readFileSync(sourcePath, "utf8"), {
  filename: "staff-paper.jsx",
  presets: ["react"],
  sourceMaps: false,
  comments: false,
  compact: true,
}).code;

fs.writeFileSync(outputPath, `${compiled}\n`);
console.log("Built staff-paper-runtime.js");
