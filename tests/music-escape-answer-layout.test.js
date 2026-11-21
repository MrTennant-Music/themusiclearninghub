'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server');
test('three or more literacy answers use two columns to keep all choices visible',()=>{
 const window={React,MLH:{}};vm.runInNewContext(fs.readFileSync('shared/escape-literacy-activity.js','utf8'),{window});
 const Options=window.MLH.EscapeLiteracyActivity.NumberedOptions;
 for(const count of [3,4,5,7,8]){
  const html=renderToStaticMarkup(React.createElement(Options,{choices:Array.from({length:count},(_,i)=>'Choice '+(i+1))}));
  assert(html.includes('is-two-column'));assert.equal((html.match(/<button/g)||[]).length,count);
 }
 const html=renderToStaticMarkup(React.createElement(Options,{choices:['Step','Leap'],columns:2}));assert(html.includes('is-two-column'));
});
