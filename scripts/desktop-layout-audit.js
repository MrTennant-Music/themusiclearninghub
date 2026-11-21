const fs = require("fs");
const path = require("path");

const ROOT = path.resolve(__dirname, "..");
const SOURCE_EXTENSIONS = new Set([".html", ".css", ".js", ".jsx", ".ts", ".tsx"]);
const IGNORED_DIRECTORIES = new Set([
  ".git",
  "dist",
  "generated-runtimes",
  "node_modules",
  "vendor",
]);
const INTERACTIVE_EXAM_CANVAS_FIT = "digital-question-papers/exam-canvas-fit.js";
const LEGACY_DESKTOP_VARIANT_LIMITS = {
  "accidentals.html": 13,
  "articulationmarkings.html": 33,
  "barlines.html": 7,
  "cadences.html": 5,
  "chords.html": 67,
  "conceptrecall.html": 6,
  "rhythmicdictation.html": 22,
  "dynamics.html": 39,
  "enharmonicequivalents.html": 19,
  "shared/hub-menu.js": 25,
  "shared/hub-shell.js": 45,
  "intervals.html": 16,
  "keysignatures.html": 36,
  "whowantstobemillionaire/millionaire.js": 14,
  "melodicdictation.html": 17,
  "namerandomiser.html": 3,
  "noteidentification.html": 40,
  "practicequestions.html": 45,
  "readingrhythms.html": 10,
  "repeatsigns.html": 19,
  "rests.html": 27,
  "rhythmidentification.html": 16,
  "rhythmsums.html": 5,
  "tempo.html": 5,
  "timesignatures.html": 6,
  "scaledegrees.html": 23,
  "transposing.html": 6,
  "triplets.html": 4,
  "worksheetgenerator.html": 1,
  "worksheet-generic.jsx": 3,
};

function collectFiles(directory, files = []) {
  for (const entry of fs.readdirSync(directory, { withFileTypes: true })) {
    if (entry.isDirectory() && IGNORED_DIRECTORIES.has(entry.name)) continue;
    const absolutePath = path.join(directory, entry.name);
    if (entry.isDirectory()) collectFiles(absolutePath, files);
    else if (SOURCE_EXTENSIONS.has(path.extname(entry.name))) files.push(absolutePath);
  }
  return files;
}

function relative(file) {
  return path.relative(ROOT, file).replaceAll(path.sep, "/");
}

const failures = [];
const sourceFiles = collectFiles(ROOT);
const productionFiles = sourceFiles.filter((file) => !file.endsWith(".test.js"));
const htmlFiles = productionFiles.filter((file) => file.endsWith(".html"));
const desktopLayoutCss = fs.readFileSync(path.join(ROOT, "styles/desktop-layout.css"), "utf8");
const desktopLayoutJs = fs.readFileSync(path.join(ROOT, "desktop-layout.js"), "utf8");

if (!/html\s*\{[^}]*overflow-x:\s*hidden/i.test(desktopLayoutCss)) {
  failures.push("styles/desktop-layout.css: fitted canvas must prevent horizontal page scrolling");
}
if (!/body\s*\{[^}]*overflow-x:\s*hidden\s*!important/i.test(desktopLayoutCss)) {
  failures.push("styles/desktop-layout.css: page body must prevent horizontal drift");
}
if (!desktopLayoutCss.includes("--mlh-page-background: #f8fafc") ||
    !/body\s*\{[^}]*background-color:\s*var\(--mlh-page-background\)\s*!important/i.test(desktopLayoutCss) ||
    !desktopLayoutCss.includes("body > #root > :first-child")) {
  failures.push("styles/desktop-layout.css: every activity canvas must use the homepage background colour");
}
if (!/viewport\.setAttribute\("content", `width=\$\{DESKTOP_WIDTH\}`\)/.test(desktopLayoutJs)) {
  failures.push("desktop-layout.js: viewport must request the fixed canvas width only");
}
if (/viewport\.setAttribute\([^\n]*initial-scale/.test(desktopLayoutJs)) {
  failures.push("desktop-layout.js: forced initial scale prevents fitted mobile rendering");
}
if (!desktopLayoutCss.includes('[class$="-menu"]') ||
    !desktopLayoutCss.includes('[class$="-dropdown"]') ||
    !desktopLayoutCss.includes('[class$="-popover"]') ||
    !desktopLayoutCss.includes("transform: none !important") ||
    !desktopLayoutCss.includes("box-shadow: none !important") ||
    !desktopLayoutCss.includes("outline-offset: -2px !important")) {
  failures.push("styles/desktop-layout.css: menu controls must keep hover and focus effects inside menu borders");
}

for (const file of htmlFiles) {
  const name = relative(file);
  const text = fs.readFileSync(file, "utf8");
  const viewportTracker = text.indexOf("shared/hub-layout-viewport.js");
  if (viewportTracker < 0) {
    failures.push(`${name}: shared zoom tracker is missing`);
  }
  if (name === "index.html") {
    if (!/<meta name="viewport" content="width=device-width, initial-scale=1\.0" \/>/.test(text)) {
      failures.push(`${name}: responsive homepage viewport is missing`);
    }
    if (text.includes("styles/desktop-layout.css") || text.includes("desktop-layout.js")) {
      failures.push(`${name}: homepage must not load the fitted fixed-canvas policy`);
    }
    continue;
  }
  if (!/<meta name="viewport" content="width=1280" \/>/.test(text)) {
    failures.push(`${name}: viewport must fit the fixed 1280px canvas without forcing 100% zoom`);
  }
  if (!text.includes("styles/desktop-layout.css")) {
    failures.push(`${name}: styles/desktop-layout.css is missing`);
  }
  if (!text.includes("desktop-layout.js")) {
    failures.push(`${name}: desktop-layout.js is missing`);
  }
  const tailwindIndex = text.search(/<script[^>]+(?:tailwindcss\.com|tailwind-[^"']+\.js)/);
  const policyIndex = text.indexOf("desktop-layout.js");
  if (viewportTracker > policyIndex && policyIndex >= 0) {
    failures.push(`${name}: shared zoom tracker must load before the desktop layout`);
  }
  if (tailwindIndex >= 0 && policyIndex < tailwindIndex) {
    failures.push(`${name}: desktop-layout.js must load after Tailwind`);
  }
}

for (const file of productionFiles) {
  const name = relative(file);
  if (name === "desktop-layout.js" || name === "shared/hub-layout-viewport.js" || name === "scripts/desktop-layout-audit.js" || name === "tailwind.config.js") continue;
  const text = fs.readFileSync(file, "utf8");
  const isResponsiveHomepage = name === "index.html";
  const isInteractiveExamCanvasFit = name === INTERACTIVE_EXAM_CANVAS_FIT;
  if (!isResponsiveHomepage && /@media[^{]*(?:min-width|max-width)/i.test(text)) {
    failures.push(`${name}: viewport-width media query found`);
  }
  if (!isResponsiveHomepage && /(?:\d|\))\s*(?:vw|dvw|vmin|vmax)\b/i.test(text)) {
    failures.push(`${name}: viewport-width sizing found`);
  }
  if (!isInteractiveExamCanvasFit && /matchMedia[^\n]*(?:min-width|max-width)|\b(?:innerWidth|outerWidth|visualViewport)\b|screen\.width/i.test(text)) {
    failures.push(`${name}: JavaScript viewport layout switch found`);
  }
  if (/hub-mobile\.js/.test(text)) {
    failures.push(`${name}: removed mobile layout helper is referenced`);
  }

  const variantCount = (text.match(/\b(?:sm|md|lg|xl|2xl):/g) || []).length;
  const allowedCount = LEGACY_DESKTOP_VARIANT_LIMITS[name] || 0;
  if (variantCount > allowedCount) {
    failures.push(`${name}: new responsive utility class found (${variantCount}; allowed ${allowedCount})`);
  }
}

const mobileCssFiles = productionFiles.filter((file) => /mobile/i.test(path.basename(file)) && file.endsWith(".css"));
for (const file of mobileCssFiles) failures.push(`${relative(file)}: mobile-specific CSS file found`);

if (failures.length) {
  console.error("Fixed-canvas layout audit failed:\n");
  failures.forEach((failure) => console.error(`- ${failure}`));
  process.exit(1);
}

console.log(`Layout audit passed: responsive homepage plus ${htmlFiles.length - 1} fitted fixed-canvas pages.`);
