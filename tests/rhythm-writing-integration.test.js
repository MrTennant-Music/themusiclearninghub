const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const React = require('react');
const {renderToStaticMarkup} = require('react-dom/server');
const Babel = require('@babel/standalone');
const Writing = require('../rhythm-writing-core.js');
const html = fs.readFileSync('rhythmicdictation.html','utf8');
const source = html.match(/<script type="(?:text\/babel|text\/x-mlh-jsx-source)"[^>]*>([\s\S]*?)<\/script>/)[1].replace('ReactDOM.createRoot(document.getElementById("root")).render(<App />);','window.Test = {makeQuestion,answerState,WriteRhythmScore,visibleQuestionTypeIdsForLevel,defaultQuestionTypesForLevel,ToolGlyph,ToolButton,Score,getQuaverGroups,makePercussionBar,PercussionOptionNotation,NotesGroup};');
const window = {MLH:{RhythmWriting:Writing}};
const context = vm.createContext({React,window});
for (const file of ['bravura-symbols.js','shared/shared-notation-config.js']) vm.runInContext(fs.readFileSync(file,'utf8'),context);
vm.runInContext(Babel.transform(source,{presets:['react']}).code,context);
const T = window.Test;
const render = question => renderToStaticMarkup(React.createElement(T.WriteRhythmScore,{question,feedback:null,onSelectBar(){}}));
test('every level builds playable write questions and marks the actual entered rhythms', () => {
  for (const level of ['N3','N4','N5','H','AH']) {
    for(let i=0;i<30;i++) {
      const q = T.makeQuestion({level,enabledQuestionTypes:['write']});
      assert.equal(q.questionType,'write');
      assert.equal(q.bars.length,q.writing.patterns.length);
      for (const bar of q.bars) {
        const duration = bar.notes.reduce((sum,note)=>sum+({tripletQuaver:1/3,tripletCrotchet:2/3}[note.audioRhythm] || Writing.beats[note.audioRhythm]),0);
        assert.ok(Math.abs(duration-Writing.capacity(q.writing.signature)) < 1e-8);
      }
      assert.equal(T.answerState(q).correct,false);
      q.writing.entered=q.writing.patterns.map(pattern=>[...pattern]);
      assert.equal(T.answerState(q).correct,true);
      assert.ok(render(q).includes('Write the rhythm'));
      for(const id of Writing.toolsFor(level,q.writing.signature)) assert.ok(renderToStaticMarkup(React.createElement(T.ToolGlyph,{id,className:''})).includes('svg'));
    }
  }
});
test('blank staff exposes neither answer notes nor their count', () => {
  const q=T.makeQuestion({level:'N3',enabledQuestionTypes:['write']});
  q.writing.patterns=[['semibreve']];
  const single=render(q);
  q.writing.patterns=[['crotchet','crotchet','crotchet','crotchet']];
  assert.equal(render(q),single);
  assert.ok(single.includes('0 of 4 beats entered'));
});
test('lower levels restrict old filters to supported tasks; senior tasks remain available', () => {
  for(const level of ['N3','N4']) {
    assert.deepEqual(Array.from(T.visibleQuestionTypeIdsForLevel(level)),['write','identify']);
    assert.ok(['write','identify'].includes(T.makeQuestion({level,enabledQuestionTypes:['correct','insert']}).questionType));
  }
  for(const [level,types] of [['N5',['correct','insert','scotch']],['H',['correct','insert','triplets']],['AH',['correct','insert','tie','identify']]]) {
    for (const type of types) {
      const q=T.makeQuestion({level,enabledQuestionTypes:[type]});
      assert.ok(q.bars.length || q.options?.length);
      assert.ok(!['write',undefined].includes(q.questionType));
    }
    assert.ok(!T.defaultQuestionTypesForLevel(level).includes('write'));
    assert.ok(T.visibleQuestionTypeIdsForLevel(level).includes('write'));
    assert.equal(T.makeQuestion({level,enabledQuestionTypes:['write']}).questionType,'write');
  }
  const index=fs.readFileSync('index.html','utf8');
  assert.match(index,/title: "Rhythmic Dictation"[^\n]*disabled: \[\]/);
});
test('placed notes support double-tap removal without a duplicate compatibility double-click', () => {
  let now=100;
  const testWindow={MLH:{RhythmWriting:Writing}};
  const hooks={...React,useRef:()=>({current:null}),useState:()=>[null,()=>{}]};
  const touchContext=vm.createContext({React:hooks,window:testWindow,performance:{now:()=>now}});
  for(const file of ['bravura-symbols.js','shared/shared-notation-config.js']) vm.runInContext(fs.readFileSync(file,'utf8'),touchContext);
  vm.runInContext(Babel.transform(source,{presets:['react']}).code,touchContext);
  const q=T.makeQuestion({level:'N3',enabledQuestionTypes:['write']});
  q.writing.entered=[['minim','crotchet']];
  const removed=[];
  const tree=testWindow.Test.WriteRhythmScore({question:q,feedback:null,selectedToolId:'crotchet',onSelectBar(){},onPlace(){},onRemove:(...args)=>removed.push(args)});
  function find(node,predicate) {
    if(Array.isArray(node)) return node.flatMap(n=>find(n,predicate));
    if(!node || typeof node!=='object') return [];
    return [...(predicate(node)?[node]:[]),...find(node.props?.children,predicate)];
  }
  const target=find(tree,n=>n.props?.['aria-label']==='Remove Minim, item 1 in bar 1')[0];
  assert.ok(target);
  const touch={pointerType:'touch',preventDefault(){},stopPropagation(){}};
  target.props.onPointerDown(touch);
  assert.equal(removed.length,0);
  now=250;
  target.props.onPointerDown(touch);
  assert.deepEqual(removed,[[0,0]]);
  target.props.onDoubleClick(touch);
  assert.equal(removed.length,1);
  assert.ok(!html.includes('onClick={undoWriteRhythm}'));
});

test('National 3 and 4 identify questions have three distinct level-appropriate options and one answer', () => {
  for(const level of ['N3','N4']) for(let i=0;i<60;i++) {
    const q=T.makeQuestion({level,enabledQuestionTypes:['identify']});
    assert.equal(q.questionType,'identify');
    assert.equal(q.options.length,3);
    assert.equal(q.selectedOptionIndex,null);
    assert.equal(q.options.filter(option=>option.correct).length,1);
    const signatures=q.options.map(option=>option.bars.map(bar=>bar.notes.map(note=>note.audioRhythm).join('|')).join('/'));
    assert.equal(new Set(signatures).size,3);
    for(const option of q.options) for(const bar of option.bars) {
      assert.equal(bar.notes.reduce((sum,note)=>sum+Writing.beats[note.audioRhythm],0),Writing.capacity(q.timeSignature.id));
      assert.ok(bar.notes.every(note=>Writing.toolsFor(level,q.timeSignature.id).includes(note.audioRhythm)));
      assert.ok(bar.notes.every(note=>!note.audioTieAfter && !note.answerTripletGroupId));
    }
    q.selectedOptionIndex=q.answerIndex;
    assert.equal(T.answerState(q).correct,true);
    q.selectedOptionIndex=(q.answerIndex+1)%3;
    assert.equal(T.answerState(q).correct,false);
    assert.equal(q.performedOrder.length,Writing.levels[level].bars);
  }
});

test('semiquavers beam in groups of four with connected secondary beams in rhythm choices and writing', () => {
  const signature={id:'3/4',compound:false};
  const bar=T.makePercussionBar(0,['semiquaver','semiquaver','semiquaver','semiquaver','crotchet','semiquaver','semiquaver','semiquaver','semiquaver']);
  for(const groupFour of [true,false]) {
    const groups=T.getQuaverGroups(bar.notes,signature,groupFour);
    assert.deepEqual(Array.from(groups,g=>[g.start,g.end]),[[0,3],[5,8]]);
  }
  const markup=renderToStaticMarkup(React.createElement(T.PercussionOptionNotation,{option:{bars:[bar]},timeSignature:{...signature,top:'3',bottom:'4'}}));
  assert.equal((markup.match(/<polygon/g)||[]).length,8,'Each group has one primary and three joined secondary segments');
  assert.ok(!markup.includes(window.BRAVURA_SYMBOLS.sixteenthNoteStemUp),'Grouped semiquavers have no individual flags');
  const eight=T.makePercussionBar(0,Array(8).fill('semiquaver'));
  assert.deepEqual(Array.from(T.getQuaverGroups(eight.notes,{id:'2/4',compound:false},true),g=>[g.start,g.end]),[[0,3],[4,7]]);
});

test('every available question type renders its full score at each level', () => {
  const seen=new Set();
  for(const level of ['N3','N4','N5','H','AH']) {
    for(const type of T.visibleQuestionTypeIdsForLevel(level)) {
      for(let i=0;i<8;i++) {
        const question=T.makeQuestion({level,enabledQuestionTypes:[type]});
        seen.add(question.tripletQuestion ? 'triplets' : question.questionType);
        for(const feedback of [null,{correct:false}]) {
          const markup=renderToStaticMarkup(React.createElement(T.Score,{question,feedback,selectedToolId:null,hoverTarget:null}));
          assert.ok(markup.includes('<svg'),`${level} ${type} renders notation`);
          assert.ok(!markup.includes('NaN'),`${level} ${type} has valid positions`);
        }
      }
    }
  }
  for(const type of ['correct','insert','scotch','write','identify','tie','triplets']) assert.ok(seen.has(type),type);
});
