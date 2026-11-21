const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const Babel = require("@babel/standalone");

const root = path.resolve(__dirname, "..");
const sourcePath = path.join(root, "classroom-timer.jsx");
const outputPath = path.join(root, "classroom-timer-runtime.js");
const source = fs.readFileSync(sourcePath, "utf8");
const compiled = Babel.transform(source, {
  filename: "classroom-timer.jsx",
  presets: ["react"],
  sourceMaps: false,
  comments: false,
  compact: true,
}).code;

fs.writeFileSync(outputPath, `${compiled}\n`);
const cssDirectory = path.join(root, "vendor", "tailwind");
const cssPath = path.join(cssDirectory, "site.css");
fs.mkdirSync(cssDirectory, { recursive: true });
const tailwindCli = require.resolve("tailwindcss/lib/cli.js");
const cssBuild = spawnSync(process.execPath, [tailwindCli, "-c", "tailwind.config.js", "-i", "styles/production-tailwind.css", "-o", cssPath, "--minify"], {
  cwd: root,
  stdio: "inherit",
});
if (cssBuild.status !== 0) throw new Error("Classroom Timer stylesheet build failed.");
console.log("Built classroom-timer-runtime.js and vendor/tailwind/site.css");
