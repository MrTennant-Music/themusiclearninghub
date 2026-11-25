"use strict";

const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");

const menuSource = fs.readFileSync("shared/hub-menu.js", "utf8");
const practiceSource = fs.readFileSync("practicequestions.html", "utf8");

test("Help is the first section in the activity settings menus", () => {
  const helpHeading = /<(?:window\.MLH\.)?Menu(?:Subheading|SectionHeading)\b[^>]*>\s*Help\s*<\//g;
  const pages = fs.readdirSync(".").filter((name) => name.endsWith(".html"));
  let checked = 0;
  for (const page of pages) {
    const source = fs.readFileSync(page, "utf8");
    for (const heading of source.matchAll(helpHeading)) {
      const beforeHeading = source.slice(0, heading.index);
      assert.match(beforeHeading, /(?:<>|<(?:div|section|window\.MLH\.MenuPanel)\b[^<>]*>)\s*$/, page);
      checked++;
    }
  }
  assert.ok(checked > 0);
});

test("the keyboard activity loads the current Help-first runtime", () => {
  const { createHash } = require("node:crypto");
  const runtimePath = "generated-runtimes/keyboardnoteidentification-1.js";
  const runtime = fs.readFileSync(runtimePath, "utf8");
  const page = fs.readFileSync("keyboardnoteidentification.html", "utf8");
  const version = createHash("sha256").update(runtime).digest("hex").slice(0, 12);
  assert.ok(page.includes(`${runtimePath}?v=${version}`));
  assert.match(runtime, /MenuSubheading,null,"Help"[\s\S]*?label:"Guide Note"[\s\S]*?MenuSubheading,null,"Question Types"/);
});

test("formatted toggle labels do not share an object-string profile key", () => {
  assert.match(menuSource, /const toggleKey = profileKey \?\? \(typeof label === "string" \? label : null\);/);
  assert.match(menuSource, /getToggle\(toggleKey\)/);
  assert.match(menuSource, /setToggle\(toggleKey, !checked\)/);
  assert.doesNotMatch(menuSource, /getToggle\(label\)/);
  assert.doesNotMatch(menuSource, /setToggle\(label, !checked\)/);
});

test("each Practice Questions toggle has an independent profile key", () => {
  assert.match(practiceSource, /profileKey=\{`Practice Questions:\$\{type\.id\}`\}/);
});

test("floating menus follow the fullscreen host and return to the page body", () => {
  const vm=require("node:vm"),body={},fullscreen={},listeners={},states=[],refs=[],effects=[];
  let stateIndex=0,refIndex=0;
  const document={body,fullscreenElement:null,addEventListener:(type,handler)=>{listeners[type]=handler;},removeEventListener:(type)=>{delete listeners[type];}};
  const context={window:{MLH:{}},document,ReactDOM:{createPortal:(panel,host)=>({panel,host})},React:{
    Fragment:"fragment",createElement:(type,props,...children)=>({type,props,children}),
    useState(initial){const i=stateIndex++;if(!(i in states))states[i]=typeof initial==="function"?initial():initial;return [states[i],value=>{states[i]=value;}];},
    useRef(initial){const i=refIndex++;return refs[i]||(refs[i]={current:initial});},
    useEffect(){},useLayoutEffect(effect){effects.push(effect);}
  }};
  vm.runInNewContext(menuSource,context);
  const render=()=>{stateIndex=0;refIndex=0;return context.window.MLH.MenuPanel({title:"File",variant:"customise"}).children[1];};
  assert.equal(render().host,body);
  const cleanup=effects[0]();
  document.fullscreenElement=fullscreen;listeners.fullscreenchange();assert.equal(render().host,fullscreen);
  document.fullscreenElement=null;listeners.fullscreenchange();assert.equal(render().host,body);
  cleanup();assert.equal(listeners.fullscreenchange,undefined);
});
