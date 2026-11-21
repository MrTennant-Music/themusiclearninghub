"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const sharedStyles = fs.readFileSync("styles/hub-ui.css", "utf8");
const desktopStyles = fs.readFileSync("styles/desktop-layout.css", "utf8");
const homepage = fs.readFileSync("index.html", "utf8");

test("shared Hub buttons use the standard pressed-down interaction", () => {
  assert.match(sharedStyles, /button:not\(:disabled\):not\(\[aria-disabled="true"\]\):active\s*\{[\s\S]*?transform:\s*scale\(\.96\);[\s\S]*?filter:\s*brightness\(\.92\);/);
  assert.match(sharedStyles, /transition:\s*transform \.08s ease, filter \.08s ease/);
});

test("menu button hover remains contained and shadow-free", () => {
  assert.match(sharedStyles, /\.hub-menu-panel button:hover\s*\{[\s\S]*?transform:\s*none;[\s\S]*?box-shadow:\s*none;/);
  assert.match(desktopStyles, /:is\(button, \[role="button"\]\):not\(:disabled\):not\(\[aria-disabled="true"\]\):active\s*\{[\s\S]*?transform:\s*scale\(\.96\) !important;[\s\S]*?filter:\s*brightness\(\.92\) !important;/);
});

test("all fitted desktop pages inherit the standard pressed-down interaction", () => {
  assert.match(desktopStyles, /button:not\(:disabled\):not\(\[aria-disabled="true"\]\):active\s*\{[\s\S]*?transform:\s*scale\(\.96\);[\s\S]*?filter:\s*brightness\(\.92\);/);
});

test("the responsive homepage uses the same pressed-down interaction", () => {
  assert.match(homepage, /button:not\(:disabled\):not\(\[aria-disabled="true"\]\):active\s*\{[\s\S]*?transform:\s*scale\(\.96\);[\s\S]*?filter:\s*brightness\(\.92\);/);
});
