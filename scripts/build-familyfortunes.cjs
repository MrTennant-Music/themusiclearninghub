const fs = require("node:fs");
const path = require("node:path");
const Babel = require("../vendor/babel/babel.min.js");

const projectRoot = path.resolve(__dirname, "..");
const sourcePath = path.join(projectRoot, "familyfortunes", "familyfortunes.js");
const outputPath = path.join(projectRoot, "familyfortunes", "familyfortunes.runtime.js");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = Babel.transform(source, {
  comments: false,
  compact: false,
  presets: ["react"],
  sourceMaps: false,
}).code;

fs.writeFileSync(outputPath, `${compiled}\n`);
console.log(`Built ${path.relative(projectRoot, outputPath)}`);
