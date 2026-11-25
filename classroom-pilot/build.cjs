"use strict";
const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const Babel = require("@babel/standalone");
const root = path.resolve(__dirname, "..");
const out = path.join(root, "dist", "classroom-pilot");
const files = ["shared/hub-page-names.js", "host.html", "keyboardnoteidentification.html", "keyboard-notes.js", "styles/desktop-layout.css", "desktop-layout.js", "styles/hub-ui.css", "shared/hub-input.js", "shared/hub-audio.js", "shared/hub-progress.js", "shared/hub-achievements.js", "shared/hub-shell.js", "shared/hub-menu.js", "bravura-symbols.js", "footer.js"];
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of [...files, ...fs.readdirSync(root).filter(file => /\.(svg|woff2?|ttf)$/.test(file))]) {
  fs.mkdirSync(path.dirname(path.join(out, file)), { recursive: true });
  fs.copyFileSync(path.join(root, file), path.join(out, file));
}
fs.cpSync(path.join(root, "audio"), path.join(out, "audio"), { recursive: true });
fs.cpSync(path.join(root, "ui-icons"), path.join(out, "ui-icons"), { recursive: true });
fs.cpSync(path.join(root, "app-icons"), path.join(out, "app-icons"), { recursive: true });
fs.cpSync(path.join(root, "fonts"), path.join(out, "fonts"), { recursive: true });
for (const file of files.filter(file => file.endsWith(".html"))) {
  let html = fs.readFileSync(path.join(out, file), "utf8");
  html = html.replace(/<script src="https:\/\/cdn.tailwindcss.com"><\/script>/, '<link rel="stylesheet" href="./site.css" />');
  html = html.replace(/<script[^>]*src="https:\/\/unpkg.com\/@babel\/standalone[^>]*><\/script>/, "");
  html = html.replace(/<script type="text\/babel">([\s\S]*?)<\/script>/g, (_, code) => `<script>${Babel.transform(code, { presets: ["react"] }).code}</script>`);
  fs.writeFileSync(path.join(out, file), html);
}
fs.copyFileSync(path.join(out, "host.html"), path.join(out, "index.html"));
const css = spawnSync(process.execPath, [require.resolve("tailwindcss/lib/cli.js"), "-c", "tailwind.config.js", "-i", "styles/production-tailwind.css", "-o", path.join(out, "site.css"), "--minify"], { cwd: root, stdio: "inherit" });
if (css.status !== 0) throw new Error("Pilot stylesheet build failed.");
console.log("Keyboard-only pilot built; no database credentials or server files are published.");
