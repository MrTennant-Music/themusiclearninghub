'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const C=require('../music-dictionary/quiz-core.js'),B=require('../music-dictionary/quiz-data/question-bank.json');
function player(question,locked=false){const touches={current:{}};let response=question.options?.[0].id||'';const h=(tag,props,...children)=>({tag,props:props||{},children}),window={},React={createElement:h};vm.runInNewContext(fs.readFileSync('music-dictionary/quiz-player.js','utf8'),{window,React,MusicDictionaryQuizCore:C,MUSIC_DICTIONARY_QUIZ_BANK:B});function inputs(node,result=[]){if(!node||typeof node!=='object')return result;if(Array.isArray(node)){node.forEach(n=>inputs(n,result));return result;}if(node.tag==='input')result.push(node);node.children?.forEach(n=>inputs(n,result));return result;}return{render(){return inputs(window.MusicDictionaryQuizAnswer({question,response,locked,touches,onAnswer:value=>{response=value;}}));}};}
test('an existing radio answer can be cleared and another answer selected before Submit',()=>{const q=B.questions.find(q=>q.format==='multiple-choice'),p=player(q);p.render()[0].props.onClick();assert.equal(p.render()[0].props.checked,false);p.render()[1].props.onChange({target:{checked:true}});assert.equal(p.render()[1].props.checked,true);});
test('a submitted answer ignores choice changes and all removal gestures',()=>{const q=B.questions.find(q=>q.format==='multiple-choice'),p=player(q,true);p.render()[0].props.onClick();p.render()[0].props.onContextMenu({preventDefault(){}});p.render()[1].props.onChange({target:{checked:true}});assert.equal(p.render()[0].props.checked,true);assert.equal(p.render()[0].props.disabled,true);assert.equal(p.render()[1].props.checked,false);});

test('rapid taps on different answers do not clear a selection as a double-tap',()=>{
 const q=B.questions.find(q=>q.format==='multiple-choice'),p=player(q);
 const event={preventDefault(){throw new Error('Different controls must not count as a double-tap');}};
 p.render()[0].props.onTouchEnd(event);p.render()[1].props.onTouchEnd(event);
 p.render()[1].props.onChange({target:{checked:true}});assert.equal(p.render()[1].props.checked,true);
});
test('double-tapping the same answer still clears it',()=>{
 const q=B.questions.find(q=>q.format==='multiple-choice'),p=player(q);let prevented=false;
 p.render()[0].props.onTouchEnd({preventDefault(){}});p.render()[0].props.onTouchEnd({preventDefault(){prevented=true;}});
 assert.equal(prevented,true);assert.equal(p.render()[0].props.checked,false);
});
