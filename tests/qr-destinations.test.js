"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");

const oldGithubBase = "https://mrtennant-music.github.io/musicliteracy/";
const ignoredDirectories = new Set([".git", "dist", "node_modules", "tests", "vendor"]);

function source(file) {
  return fs.readFileSync(file, "utf8");
}

function websiteSourceFiles(directory = ".") {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith(".") || ignoredDirectories.has(entry.name)) return [];
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) return websiteSourceFiles(file);
    if (!entry.isFile() || entry.name.endsWith(".test.js") || !/\.(?:css|html|js)$/.test(entry.name)) return [];
    return [file];
  });
}

test("navigation and sharing stay on the current Hub origin", () => {
  const vm = require("node:vm");
  for (const origin of ["http://127.0.0.1:8768", "https://themusicliteracyhub.netlify.app", "https://themusiclearninghub.netlify.app"]) {
    const location = new URL(`${origin}/keyboardnoteidentification.html?level=N3`);
    const shareFunction = source("shared/hub-shell.js").split("  function defaultProfileShareUrl() {")[1].split("  function defaultProfileLabel()")[0];
    const context = {URL, window: {location}};
    vm.runInNewContext(source("shared/hub-page-names.js"), context);
    vm.runInNewContext("function share() {" + shareFunction + ";this.result=share();", context);
    assert.equal(context.result, location.href);
    const examContext = {URL, root: {location: new URL(`${origin}/digital-question-papers/digitalquestionpapers.html`)}, paper: {id: "national5-2014"}, showingAllQuestions: false, engine: null};
    const examFunction = source("digital-question-papers/exam-ui.js").split("  function paperShareUrl() {")[1].split("  function openQrOverlay()")[0];
    vm.runInNewContext("function share() {" + examFunction + ";this.result=share();", examContext);
    assert.equal(examContext.result, `${origin}/digital-question-papers/digitalquestionpapers.html?paper=national5-2014`);
  }
  const footer = source("footer.js");
  const footerHomeDeclaration = footer.match(/^const footerHomeUrl = .*;$/m)?.[0];
  assert.ok(footerHomeDeclaration);
  for (const base of ["https://hub.test/", "https://hub.test/themusiclearninghub/"]) {
    const footerScriptUrl = new URL("footer.js?v=current", base);
    assert.equal(vm.runInNewContext(footerHomeDeclaration + "\nfooterHomeUrl", { URL, footerScriptUrl }), base);
  }
  assert.ok(footer.includes('<a href="${footerHomeUrl}" aria-label="Return to Music Learning Hub home page">'));
  assert.ok(source("index.html").includes("navigator.clipboard.writeText(homeShareUrl)"));
  assert.ok(source("index.html").includes('encodeURIComponent(homeShareUrl)'));
});

test("published website source contains no outgoing links to the old GitHub Pages version", () => {
  const oldHostReferences = websiteSourceFiles().filter(file => source(file).includes(oldGithubBase));
  assert.deepEqual(oldHostReferences, []);
});

test("every literal Netlify asset referenced by website source exists locally", () => {
  const missingAssets = new Set();
  websiteSourceFiles().forEach(file => {
    const urls = source(file).match(/https:\/\/(?:themusicliteracyhub|themusiclearninghub)\.netlify\.app\/[^\s"'`)]+/g) || [];
    urls.filter(url => !url.includes("${")).forEach(url => {
      const pathname = new URL(url).pathname;
      if (path.extname(pathname) && !fs.existsSync(path.join(".", pathname))) missingAssets.add(pathname);
    });
  });
  assert.deepEqual([...missingAssets].sort(), []);
});
