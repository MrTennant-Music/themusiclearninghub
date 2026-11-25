"use strict";

const fs = require("node:fs");
const path = require("node:path");
const { createHash } = require("node:crypto");
const { spawnSync } = require("node:child_process");
const Babel = require("@babel/standalone");

const ROOT = path.resolve(__dirname, "..");
const OUTPUT = path.join(ROOT, "dist");
const scriptVersions = new Map();
const EXAM_ASSET_PREFIX = "../exampapers/";
const GITHUB_PAGES_MAX_BYTES = 1_000_000_000;
const IS_GITHUB_PAGES_BUILD = process.env.HUB_DEPLOY_TARGET === "github-pages";
const PUBLIC_ROOT_DIRECTORIES = new Set([
  "assessment-recorder",
  "styles",
  "shared",
  "docs",
  "music-dictionary",
  "ui-icons",
  "music-games",
  "music-escape",
  "whowantstobemillionaire",
  "app-icons",
  "audio",
  "familyfortunes",
  "generated-runtimes",
  "fonts",
  "digital-question-papers",
  "images",
  "vendor",
]);
const PUBLIC_ROOT_EXTENSIONS = new Set([
  ".css", ".gif", ".html", ".jpeg", ".jpg", ".js", ".jsx", ".m4a", ".mid", ".mp3",
  ".ogg", ".otf", ".pdf", ".png", ".svg", ".ttf", ".wav", ".webp", ".woff", ".woff2",
]);
const NON_PUBLIC_ROOT_FILES = new Set(["conceptlist.pdf", "tailwind.config.js", "tailwind.millionaire.config.js"]);

function filenameIsPrivate(sourcePath) { return [".command", ".md"].includes(path.extname(sourcePath)); }

function isExcluded(sourcePath) {
  const relativePath = path.relative(ROOT, sourcePath);
  if (!relativePath) return false;
  const parts = relativePath.split(path.sep);
  if (parts.some(part => part.startsWith("."))) return true;
  if (sourcePath.endsWith(".test.js")) return true;
  if (parts[0] === "docs" && parts.length > 1 && !["Music Literacy Question Analysis.pdf", "music-concepts-exam-frequency.pdf"].some(filename => relativePath === path.join("docs", filename))) return true;
  if (parts[0] === "whowantstobemillionaire" && (parts[1] === "question-editor" || filenameIsPrivate(sourcePath))) return true;
  if (parts[0] === "music-games" && (parts[1] === "output" || filenameIsPrivate(sourcePath))) return true;
  if (parts.includes("tests") || parts.includes("scripts")) return true;
  if (parts[0] === "digital-question-papers" && parts[1] === "audit") return true;
  if (parts[0] === "music-games" && parts[1] === "activities" && [".json", ".md"].includes(path.extname(sourcePath).toLowerCase())) return true;
  if (parts[0] === "whowantstobemillionaire" && parts[1] === "soundsmillionaire" && path.extname(sourcePath).toLowerCase() === ".ogg") return true;
  if (parts[0] === "digital-question-papers" && [".md", ".py"].includes(path.extname(sourcePath).toLowerCase())) return true;
  return false;
}

function isPublishedRootFile(filename) {
  if (filename.startsWith(".") || NON_PUBLIC_ROOT_FILES.has(filename) || filename.endsWith(".test.js")) return false;
  if (filename === "audio-concept-library-data.json") return true;
  return PUBLIC_ROOT_EXTENSIONS.has(path.extname(filename).toLowerCase());
}

function listFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listFiles(entryPath);
    return entry.isFile() ? [entryPath] : [];
  });
}

function relativeAssetPath(htmlPath) {
  if (/<base\s+href=["\']\.\.\/["\']/.test(fs.readFileSync(htmlPath, "utf8"))) return "./assets/site.css";
  const relativeHtmlPath = path.relative(OUTPUT, htmlPath);
  const assetPath = path.relative(path.dirname(relativeHtmlPath), "assets/site.css").split(path.sep).join("/");
  return assetPath.startsWith(".") ? assetPath : `./${assetPath}`;
}

function compileJsx(source, filename) {
  return Babel.transform(source, {
    filename,
    presets: ["react"],
    sourceMaps: false,
    compact: true,
    comments: false,
  }).code;
}

function versionLocalScripts(html, sourceBase) {
  return html.replace(/(<script\b[^>]*?\s+src\s*=\s*)(["'])([^"'?#]+\.js)(?:\?v=[^"'#]*)?\2/gi, (tag, attribute, quote, url) => {
    if (/^(?:[a-z][a-z0-9+.-]*:|\/)/i.test(url)) return tag;
    const file = path.resolve(sourceBase, decodeURIComponent(url));
    if (!file.startsWith(OUTPUT + path.sep) || !fs.statSync(file, { throwIfNoEntry: false })?.isFile()) return tag;
    if (!scriptVersions.has(file)) {
      scriptVersions.set(file, createHash("sha256").update(fs.readFileSync(file)).digest("hex").slice(0, 12));
    }
    return `${attribute}${quote}${url}?v=${scriptVersions.get(file)}${quote}`;
  });
}

function compileBabelScripts(htmlPath) {
  let html = fs.readFileSync(htmlPath, "utf8");
  const cssPath = relativeAssetPath(htmlPath);
  const baseHref = html.match(/<base\s+href=["\']([^"\']+)["\']/i)?.[1] || "./";
  const sourceBase = path.resolve(path.dirname(htmlPath), baseHref);

  html = html.replace(/<link\b[^>]*\bhref=(['"])\s*[^'"]*vendor\/tailwind\/site\.css[^'"]*\1[^>]*>/gi, `<link rel="stylesheet" href="${cssPath}" />`);
  html = html.replace(/<script\b[^>]*\bsrc=(['"])\s*[^'"]*(?:cdn\.tailwindcss\.com|vendor\/tailwind\/tailwind-3\.4\.17\.js)[^'"]*\1[^>]*>\s*<\/script>/gi, `<link rel="stylesheet" href="${cssPath}" />`);
  html = html.replace(/<script\b[^>]*\bsrc=(['"])\s*[^'"]*(?:@babel\/standalone|vendor\/babel\/babel\.min\.js)[^'"]*\1[^>]*>\s*<\/script>\s*/gi, "");

  html = html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (fullTag, attributes, body) => {
    if (!/\btype=(['"])text\/babel\1/i.test(attributes)) return fullTag;

    const sourceMatch = attributes.match(/\bsrc=(['"])(.*?)\1/i);
    const cleanAttributes = attributes
      .replace(/\s+type=(['"])text\/babel\1/i, "")
      .replace(/\s+data-presets=(['"]).*?\1/i, "");

    if (!sourceMatch) {
      return `<script${cleanAttributes}>\n${compileJsx(body, path.relative(ROOT, htmlPath))}\n</script>`;
    }

    const sourceUrl = sourceMatch[2];
    const sourceFile = sourceUrl.split(/[?#]/)[0];
    const sourcePath = path.resolve(sourceBase, sourceFile);
    if (!fs.existsSync(sourcePath)) throw new Error(`Cannot compile JSX source: ${sourceUrl}`);

    const parsed = path.parse(sourcePath);
    const compiledPath = path.join(parsed.dir, `${parsed.name}.compiled.js`);
    fs.writeFileSync(compiledPath, `${compileJsx(fs.readFileSync(sourcePath, "utf8"), path.relative(ROOT, sourcePath))}\n`);
    const compiledUrl = `${sourceFile.slice(0, -parsed.ext.length)}.compiled.js`;
    return `<script${cleanAttributes.replace(sourceUrl, compiledUrl)}></script>`;
  });

  if (/type=(['"])text\/babel\1/i.test(html) || /(?:cdn\.tailwindcss\.com|@babel\/standalone)/i.test(html)) {
    throw new Error(`Production build still contains browser compilation code: ${path.relative(ROOT, htmlPath)}`);
  }
  fs.writeFileSync(htmlPath, versionLocalScripts(html, sourceBase));
}

function copySource() {
  fs.rmSync(OUTPUT, { recursive: true, force: true, maxRetries: 5, retryDelay: 100 });
  fs.mkdirSync(OUTPUT, { recursive: true });
  for (const entry of fs.readdirSync(ROOT, { withFileTypes: true })) {
    const published = entry.isDirectory()
      ? PUBLIC_ROOT_DIRECTORIES.has(entry.name)
      : entry.isFile() && isPublishedRootFile(entry.name);
    if (!published) continue;
    fs.cpSync(path.join(ROOT, entry.name), path.join(OUTPUT, entry.name), {
      recursive: true,
      filter: sourcePath => !isExcluded(sourcePath) && !fs.lstatSync(sourcePath).isSymbolicLink(),
    });
  }
  copyPublishedExamAssets();
}

function collectExamAssets(value, assets, visited = new WeakSet()) {
  if (typeof value === "string") {
    if (value.startsWith(EXAM_ASSET_PREFIX)) assets.add(value.slice(EXAM_ASSET_PREFIX.length).split(/[?#]/)[0]);
    return;
  }
  if (!value || typeof value !== "object" || visited.has(value)) return;
  visited.add(value);
  Object.values(value).forEach(item => collectExamAssets(item, assets, visited));
}

function copyPublishedExamAssets() {
  const paperDirectory = path.join(ROOT, "digital-question-papers", "papers");
  const examRoot = path.join(ROOT, "exampapers");
  const publishedAssets = new Set();

  for (const paperPath of listFiles(paperDirectory).filter(file => file.endsWith(".js"))) {
    delete require.cache[require.resolve(paperPath)];
    const paper = require(paperPath);
    collectExamAssets({ ...paper, sourcePath: null }, publishedAssets);
  }

  for (const relativeAsset of [...publishedAssets].sort()) {
    const sourcePath = path.resolve(examRoot, relativeAsset);
    if (!sourcePath.startsWith(`${examRoot}${path.sep}`)) throw new Error(`Exam asset escapes its source directory: ${relativeAsset}`);
    if (!fs.statSync(sourcePath, { throwIfNoEntry: false })?.isFile()) throw new Error(`Missing published exam asset: ${relativeAsset}`);
    const outputPath = path.join(OUTPUT, "exampapers", relativeAsset);
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });
    fs.copyFileSync(sourcePath, outputPath);
  }
}

function buildTailwind() {
  const outputCss = path.join(OUTPUT, "assets", "site.css");
  fs.mkdirSync(path.dirname(outputCss), { recursive: true });
  const tailwindCli = require.resolve("tailwindcss/lib/cli.js");
  const result = spawnSync(process.execPath, [tailwindCli, "-c", "tailwind.config.js", "-i", "styles/production-tailwind.css", "-o", outputCss, "--minify"], {
    cwd: ROOT,
    stdio: "inherit",
  });
  if (result.status !== 0) throw new Error("Tailwind production build failed.");
}

function removeBrowserBuildTools() {
  fs.rmSync(path.join(OUTPUT, "vendor", "babel"), { recursive: true, force: true });
  fs.rmSync(path.join(OUTPUT, "vendor", "tailwind"), { recursive: true, force: true });
}

function assertPublishedSize() {
  const bytes = listFiles(OUTPUT).reduce((total, file) => total + fs.statSync(file).size, 0);
  const mebibytes = (bytes / (1024 ** 2)).toFixed(2);
  const megabytes = (bytes / 1_000_000).toFixed(2);
  if (IS_GITHUB_PAGES_BUILD && bytes > GITHUB_PAGES_MAX_BYTES) {
    throw new Error(`Published site is ${megabytes} MB, above the GitHub Pages 1 GB limit.`);
  }
  const sizePolicy = IS_GITHUB_PAGES_BUILD ? "; GitHub Pages limit: 1000 MB" : "; no project-imposed size cap";
  console.log(`Published site size: ${mebibytes} MiB (${megabytes} MB${sizePolicy}).`);
}

async function main() {
  await require("./build-dictionary-quizzes.cjs").build();
  require("./build-inline-page-runtimes.js");
  require("./build-pitched.js");
  await require("./build-music-games.js").build();
  require("./build-millionaire-runtime.js");
  require("./build-metronome-runtime.js");
  require("./build-name-randomiser-runtime.js");
  require("./build-staff-paper-runtime.js");
  require("./build-classroom-timer-runtime.js");
  require("./build-popup-piano-runtime.js");
  copySource();
  for (const htmlPath of listFiles(OUTPUT).filter(file => file.endsWith(".html"))) compileBabelScripts(htmlPath);
  buildTailwind();
  removeBrowserBuildTools();
  fs.writeFileSync(path.join(OUTPUT, ".nojekyll"), "");
  assertPublishedSize();
  console.log(`Production site built in ${path.relative(ROOT, OUTPUT)}.`);
}

main().catch(error => { console.error(error); process.exitCode = 1; });
