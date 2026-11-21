'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync(require.resolve('../exam-notation.js'),'utf8');
test('arrow previews leave the focused note target attached and the grey preview visible',()=>{
 let active=null;
 class Node{
  constructor(tag,attrs={}){this.tag=tag;this.attrs={...attrs};this.children=[];this.events={};}
  addEventListener(name,fn){(this.events[name]||=[]).push(fn);}
  setAttribute(name,value){this.attrs[name]=value;}
  append(node){if(node.parent){if(active===node){active=null;for(const fn of node.events.blur||[])fn();}node.remove();}this.children.push(node);node.parent=this;}
  insertBefore(node,target){node.remove();this.children.splice(this.children.indexOf(target),0,node);node.parent=this;}
  remove(){if(this.parent){this.parent.children=this.parent.children.filter(n=>n!==this);this.parent=null;}}
  closest(){return null;}
  querySelectorAll(){return this.children.filter(n=>/q3-note-preview/.test(n.attrs.class||''));}
 }
 const context={Q3_STAFF:{gap:10},q3NoteEntryCursors:new WeakMap(),svgElement:(tag,attrs)=>new Node(tag,attrs),q3DrawNote:(parent)=>parent.append(new Node('text')),bindRemovalGesture(){}};
 vm.runInNewContext(source.slice(source.indexOf('  function q3BindNoteKeyboard('),source.indexOf('  function q3EnteredPitch2015('))+';this.add=q3AddDirectNoteTargets',context);
 const svg=new Node('svg');context.add(svg,{},()=>{},{id:'answer',xs:[100,140],top:100,pitchMap:{A4:130,B4:125,C5:120},rhythms:['quaver','quaver']});
 const target=svg.children[0];active=target;
 for(const key of ['ArrowUp','ArrowDown','ArrowRight','ArrowLeft']){
  for(const fn of target.events.keydown)fn({key,preventDefault(){}});
  assert.equal(active,target,`${key}: focus remains on the same attached target`);
  assert.equal(svg.querySelectorAll().length,1,`${key}: exactly one preview survives`);
  assert.equal(svg.children.at(-1),target,'the transparent hit target remains above the preview');
 }
});

test('shared AH placement targets show the same faint preview on keyboard focus and retain it until blur',()=>{
 const make=()=>({attrs:{},children:[],events:{},setAttribute(k,v){this.attrs[k]=v;},addEventListener(k,fn){this.events[k]=fn;},append(n){this.children.push(n);n.parent=this;},insertBefore(n,t){this.children.splice(this.children.indexOf(t),0,n);n.parent=this;},remove(){this.parent.children=this.parent.children.filter(n=>n!==this);}});
 const document={activeElement:null},context={document,svgElement:()=>make()};
 vm.runInNewContext(source.slice(source.indexOf('  function ah2016Target('),source.indexOf('  function ah2016AnswerNotes('))+';this.target=ah2016Target',context);
 const svg=make(),target=context.target(svg,{},'Place rest',()=>{},()=>make());document.activeElement=target;
 target.events.focus();assert.equal(svg.children.length,2);assert.equal(svg.children[0].attrs.opacity,'.48');assert.equal(svg.children[1],target);
 target.events.pointerleave();assert.equal(svg.children.length,2,'focused target keeps its keyboard preview after pointer leaves');
 target.events.pointerenter();assert.equal(svg.children.length,2,'only one preview is drawn');
 document.activeElement=null;target.events.blur();assert.deepEqual(svg.children,[target]);
});
