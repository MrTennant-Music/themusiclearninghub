#!/usr/bin/env node
"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const Babel = require("@babel/standalone");

const root = path.resolve(__dirname, "..");
require("./build-millionaire-concepts.cjs").build();
const notationSource = "shared/classroom-literacy-notation.jsx";
const notationAsset = "generated-runtimes/classroom-literacy-notation.js";
const sources = [
  notationSource,
  "music-games/image-bank.jsx",
  "whowantstobemillionaire/millionaire-media-library.jsx",
  "whowantstobemillionaire/millionaire-creator.js",
  "whowantstobemillionaire/millionaire.js",
];

for (const relativePath of sources) {
  const sourcePath = path.join(root, relativePath);
  const parsed = path.parse(sourcePath);
  const outputPath = relativePath === notationSource
    ? path.join(root, notationAsset)
    : path.join(parsed.dir, `${parsed.name}.compiled.js`);
  const compiled = Babel.transform(fs.readFileSync(sourcePath, "utf8"), {
    filename: relativePath,
    presets: ["react"],
    sourceMaps: false,
    compact: true,
    comments: false,
  }).code;
  fs.writeFileSync(outputPath, `${compiled}\n`);
}

const tailwindCli = require.resolve("tailwindcss/lib/cli.js");
const cssOutput = path.join(root, "whowantstobemillionaire", "millionaire-tailwind.css");
const result = spawnSync(process.execPath, [
  tailwindCli,
  "-c", "tailwind.millionaire.config.js",
  "-i", "styles/production-tailwind.css",
  "-o", cssOutput,
  "--minify",
], { cwd: root, stdio: "inherit" });

if (result.status !== 0) throw new Error("Millionaire Tailwind build failed.");
const pagePath = path.join(root, "whowantstobemillionaire/whowantstobeamillionaire.html");
const collectionsPagePath = path.join(root, "mycollections.html");
let html = fs.readFileSync(pagePath, "utf8");
let collectionsHtml = fs.readFileSync(collectionsPagePath, "utf8");
const bankScripts = ["millionaire-core.js", "millionaire-question-bank.js", "millionaire-concept-questions.js"];
for (const file of [...bankScripts, "millionaire.compiled.js", "millionaire.css", "millionaire-tailwind.css"]) {
  const hash = require("node:crypto").createHash("sha256").update(fs.readFileSync(path.join(root, "whowantstobemillionaire", file))).digest("hex").slice(0, 12);
  const pattern = new RegExp(file.replace(/\./g, "\\.") + "(?:\\?v=[^\" ]+)?", "g");
  html = html.replace(pattern, file + "?v=" + hash);
  if (bankScripts.includes(file)) collectionsHtml = collectionsHtml.replace(pattern, file + "?v=" + hash);
}
fs.writeFileSync(collectionsPagePath, collectionsHtml);
const notationHash = require("node:crypto").createHash("sha256").update(fs.readFileSync(path.join(root, notationAsset))).digest("hex").slice(0, 12);
html = html.replace(/generated-runtimes\/classroom-literacy-notation\.js(?:\?v=[^" ]+)?/g, notationAsset + "?v=" + notationHash);
const shellHash = require("node:crypto").createHash("sha256").update(fs.readFileSync(path.join(root, "shared/hub-shell.js"))).digest("hex").slice(0, 12);
fs.writeFileSync(pagePath, html.replace(/hub-shell\.js\?v=[^" ]+/g, "hub-shell.js?v=" + shellHash));
console.log("Millionaire browser assets built.");
