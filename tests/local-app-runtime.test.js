const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const Babel = require("@babel/standalone");

const root = path.resolve(__dirname, "..");
function files(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith(".") || ["dist", "node_modules", "generated-runtimes"].includes(entry.name)) return [];
    const entryPath = path.join(directory, entry.name);
    return entry.isDirectory() ? files(entryPath) : entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
  });
}
const pages = files(root);

test("published app pages do not rely on remote Tailwind, React or Babel", () => {
  for (const page of pages) {
    const html = fs.readFileSync(page, "utf8");
    assert.doesNotMatch(html, /cdn\.tailwindcss\.com|unpkg\.com\/react|@babel\/standalone/i, path.relative(root, page));
    assert.doesNotMatch(html, /type=["']text\/babel["']/i, path.relative(root, page));
  }
});

test("every inert JSX source has a current local runtime", () => {
  let checked = 0;
  for (const page of pages) {
    const html = fs.readFileSync(page, "utf8");
    const baseHref = html.match(/<base\s+href=["']([^"']+)["']/i)?.[1] || "./";
    const sourceBase = path.resolve(path.dirname(page), baseHref);
    for (const match of html.matchAll(/<script\b([^>]*)\btype=(["'])text\/x-mlh-jsx-source\2([^>]*)>([\s\S]*?)<\/script>/gi)) {
      const attributes = `${match[1]} ${match[3]}`;
      const runtimeName = attributes.match(/\bdata-runtime=(["'])(.*?)\1/i)?.[2];
      const sourceReference = attributes.match(/\bdata-src=(["'])(.*?)\1/i)?.[2];
      assert.ok(runtimeName, `${path.relative(root, page)} is missing data-runtime`);
      const source = sourceReference ? fs.readFileSync(path.resolve(sourceBase, sourceReference.split(/[?#]/)[0]), "utf8") : match[4];
      const expected = Babel.transform(source, { filename: sourceReference?.split(/[?#]/)[0] || path.basename(page), presets: ["react"], sourceMaps: false, comments: false, compact: true }).code;
      const runtimePath = path.join(root, "generated-runtimes", runtimeName);
      assert.equal(fs.readFileSync(runtimePath, "utf8").trim(), expected.trim(), runtimeName);
      assert.match(html, new RegExp(`generated-runtimes/${runtimeName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}`));
      checked += 1;
    }
  }
  assert.ok(checked >= 45, `Checked ${checked} generated runtimes`);
});

test("all shared-menu pages load the current accessible menu runtime", () => {
  let checked = 0;
  for (const page of pages) {
    const html = fs.readFileSync(page, "utf8");
    if (!html.includes("shared/hub-menu.js")) continue;
    assert.ok(html.includes("hub-menu.js?v=" + require("node:crypto").createHash("sha256").update(fs.readFileSync(path.join(root,"shared/hub-menu.js"))).digest("hex").slice(0,12)), path.relative(root, page));
    checked += 1;
  }
  assert.ok(checked >= 45);
  const menu = fs.readFileSync(path.join(root, "shared/hub-menu.js"), "utf8");
  assert.match(menu, /trigger\.setAttribute\("aria-haspopup", "true"\)/);
  assert.match(menu, /trigger\.setAttribute\("aria-controls", panelId\)/);
  assert.match(menu, /trigger\.setAttribute\("aria-expanded", "true"\)/);
  assert.match(menu, /role: "region", "aria-label": title \|\| "Menu"/);
});

test("worksheet headers only show a disabled host glyph for activities that support hosting", () => {
  const React = require("react");
  const vm = require("node:vm");
  const { renderToStaticMarkup } = require("react-dom/server");
  const source = fs.readFileSync(path.join(root, "shared/hub-shell.js"), "utf8");
  const start = source.indexOf("  function AppHeader(");
  const helperStart = source.indexOf("  function worksheetSourceSupportsHosting(");
  const end = source.indexOf("\n  function ", start + 1);
  let config = { sourceUrl: "/practicequestions.html" };
  const context = {
    React, URL, URLSearchParams,
    window: { sessionStorage: { getItem: () => JSON.stringify(config) } },
    location: new URL("https://example.test/worksheetgenerator.html"),
    MLH: {
      classroomActivities: require("../shared/classroom-activities.js"),
      profileSettings: { hasCustomSettings: () => false },
      worksheetHeaderMode: { title: "Practice Questions" },
    },
    defaultProfileShareUrl: () => "https://example.test/worksheetgenerator.html",
    defaultProfileLabel: () => "",
    ProfileQrButton: () => null, WorksheetButton: () => null,
  };
  const renderHeader = vm.runInNewContext(source.slice(helperStart, end) + "\nAppHeader", context);
  const props = { title: "Create a worksheet", subtitle: "Identical activity subtitle." };
  const worksheet = renderToStaticMarkup(React.createElement(renderHeader, props));
  assert.match(worksheet, /<button disabled=""[^>]+aria-label="Host"[^>]*><img src="ui-icons\/lobby-players\.svg/);
  assert.match(worksheet, /Identical activity subtitle\./);
  for (const sourceUrl of ["wordsearch.html", "/keyboardnoteidentification.html", "/conceptrecall.html", "/readingrhythms.html"]) {
    config = { sourceUrl };
    assert.match(renderToStaticMarkup(React.createElement(renderHeader, props)), /<button disabled=""[^>]+aria-label="Host"/);
  }
  for (const sourceUrl of ["/music-dictionary/musicdictionary.html"]) {
    config = { sourceUrl };
    assert.doesNotMatch(renderToStaticMarkup(React.createElement(renderHeader, props)), /aria-label="Host"/);
  }
  config = { sourceUrl: "/practicequestions.html", supportsHosting: false };
  assert.doesNotMatch(renderToStaticMarkup(React.createElement(renderHeader, props)), /aria-label="Host"/);
  context.MLH.worksheetHeaderMode = null;
  context.MLH.classroomExercise = true;
  const hosted = renderToStaticMarkup(React.createElement(renderHeader, {...props,classroomActivityUrl:"/conceptquiz.html?level=N5"}));
  assert.doesNotMatch(hosted, /aria-label="Host"/);
  context.MLH.classroomExercise = false;
  const solo = renderToStaticMarkup(React.createElement(renderHeader, props));
  assert.doesNotMatch(solo, /aria-label="Host"/);
});

test("worksheet generators do not render optional QR codes", () => {
  for (const file of ["worksheetgenerator.html", "worksheet-generic.jsx", "music-dictionary/music-concepts-booklet.js"]) {
    const source = fs.readFileSync(path.join(root, file), "utf8");
    assert.doesNotMatch(source, /QR Code|WorksheetQr|includeQr|setQr|showQr|qrserver\.com/, file);
  }
});
