"use strict";

const fs = require("node:fs");
const path = require("node:path");
const Babel = require("@babel/standalone");

const root = path.resolve(__dirname, "..");
const runtimeDirectory = path.join(root, "generated-runtimes");
const migrate = process.argv.includes("--migrate");

function htmlFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap(entry => {
    if (entry.name.startsWith(".") || ["dist", "node_modules", "generated-runtimes"].includes(entry.name)) return [];
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return htmlFiles(entryPath);
    return entry.isFile() && entry.name.endsWith(".html") ? [entryPath] : [];
  });
}

function pageSlug(htmlPath) {
  return path.relative(root, htmlPath).replace(/\.html$/i, "").split(path.sep).join("--").replace(/[^a-z0-9_-]/gi, "-");
}

function assetPrefix(htmlPath, html) {
  if (/<base\s+href=["']\.\.\/["']/i.test(html)) return "./";
  const relative = path.relative(path.dirname(htmlPath), root).split(path.sep).join("/");
  return relative ? `${relative}/` : "./";
}

function migrateDependencies(htmlPath, html) {
  const prefix = assetPrefix(htmlPath, html);
  html = html.replace(/<script\b[^>]*\bsrc=(["'])https:\/\/cdn\.tailwindcss\.com\/?\1[^>]*>\s*<\/script>/gi, `<link rel="stylesheet" href="${prefix}vendor/tailwind/site.css?v=20261102-local-runtime" />`);
  html = html.replace(/<script\b[^>]*\bsrc=(["'])https:\/\/unpkg\.com\/react-dom@[^"']+\/umd\/react-dom\.production\.min\.js\1[^>]*>\s*<\/script>/gi, `<script src="${prefix}vendor/react/react-dom.production.min.js"></script>`);
  html = html.replace(/<script\b[^>]*\bsrc=(["'])https:\/\/unpkg\.com\/react@[^"']+\/umd\/react\.production\.min\.js\1[^>]*>\s*<\/script>/gi, `<script src="${prefix}vendor/react/react.production.min.js"></script>`);
  html = html.replace(/<script\b[^>]*\bsrc=(["'])https:\/\/unpkg\.com\/@babel\/standalone@[^"']+\/babel\.min\.js\1[^>]*>\s*<\/script>\s*/gi, "");
  return html;
}

function migrateBabelScripts(htmlPath, html) {
  let index = 0;
  const prefix = assetPrefix(htmlPath, html);
  return html.replace(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi, (tag, attributes, body) => {
    if (!/\btype=(["'])text\/babel\1/i.test(attributes)) return tag;
    index += 1;
    const runtimeName = `${pageSlug(htmlPath)}-${index}.js`;
    const runtimeUrl = `${prefix}generated-runtimes/${runtimeName}`;
    const sourceMatch = attributes.match(/\bsrc=(["'])(.*?)\1/i);
    const inertSource = sourceMatch
      ? `<script type="text/x-mlh-jsx-source" data-src="${sourceMatch[2]}" data-runtime="${runtimeName}"></script>`
      : `<script type="text/x-mlh-jsx-source" data-runtime="${runtimeName}">${body}</script>`;
    return `${inertSource}<script src="${runtimeUrl}"></script>`;
  });
}

function compilePage(htmlPath) {
  const html = fs.readFileSync(htmlPath, "utf8");
  const baseHref = html.match(/<base\s+href=["']([^"']+)["']/i)?.[1] || "./";
  const sourceBase = path.resolve(path.dirname(htmlPath), baseHref);
  for (const match of html.matchAll(/<script\b([^>]*)\btype=(["'])text\/x-mlh-jsx-source\2([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attributes = `${match[1]} ${match[3]}`;
    const runtimeName = attributes.match(/\bdata-runtime=(["'])(.*?)\1/i)?.[2];
    if (!runtimeName) throw new Error(`${path.relative(root, htmlPath)} has a JSX source without a runtime name.`);
    const sourceReference = attributes.match(/\bdata-src=(["'])(.*?)\1/i)?.[2];
    const source = sourceReference
      ? fs.readFileSync(path.resolve(sourceBase, sourceReference.split(/[?#]/)[0]), "utf8")
      : match[4];
    const compiled = Babel.transform(source, {
      filename: sourceReference?.split(/[?#]/)[0] || path.basename(htmlPath),
      presets: ["react"], sourceMaps: false, comments: false, compact: true,
    }).code;
    fs.mkdirSync(runtimeDirectory, { recursive: true });
    fs.writeFileSync(path.join(runtimeDirectory, runtimeName), `${compiled}\n`);
  }
}

const pages = htmlFiles(root);
if (migrate) {
  for (const htmlPath of pages) {
    const before = fs.readFileSync(htmlPath, "utf8");
    const after = migrateBabelScripts(htmlPath, migrateDependencies(htmlPath, before));
    if (after !== before) fs.writeFileSync(htmlPath, after);
  }
}
for (const htmlPath of pages) compilePage(htmlPath);
console.log(`Built local JSX runtimes for ${pages.filter(file => fs.readFileSync(file, "utf8").includes("text/x-mlh-jsx-source")).length} pages.`);
