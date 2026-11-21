const test = require('node:test');
const assert = require('node:assert/strict');
const K = require('../keyboard-notes.js');
test('natural-note level marks only white keys and offers seven names', () => {
  assert.equal(K.answers(K.defaults.N3).length, 7);
  assert.ok(K.pool(K.defaults.N3).every(key => !key.black));
  assert.deepEqual(K.visibleKeys(K.defaults.N5).filter(key => !key.black).map(key => key.pitch), [0,2,4,5,7,9,11,12,14,16,17,19,21,23]);
});
test('black keys occupy the two-and-three pattern and accept sharp or flat names', () => {
  assert.deepEqual(K.visibleKeys(K.defaults.N5).filter(key => key.black).map(key => key.pitch), [1,3,6,8,10,13,15,18,20,22]);
  const answers = K.answers(K.defaults.N5);
  const expected = {'C#':1,Db:1,'D#':3,Eb:3,'F#':6,Gb:6,'G#':8,Ab:8,'A#':10,Bb:10};
  for (const [id,pitch] of Object.entries(expected)) {
    assert.equal(answers.find(a=>a.id===id).pitch,pitch);
    assert.ok(K.correct(answers.find(a=>a.id===id),{pitch:pitch+12}));
  }
  assert.equal(answers.length,17);
});
test('enharmonic white-key names wrap correctly at octave boundaries', () => {
  const answers = K.answers({...K.defaults.N5, enharmonics:true});
  for (const [id,pitch] of Object.entries({'E#':5,'B#':0,Cb:11,Fb:4})) {
    assert.ok(K.correct(answers.find(a=>a.id===id),{pitch}));
  }
  assert.equal(answers.length,21);
});
test('custom groups restrict both questions and names, avoiding immediate repeats', () => {
  const options={naturals:false,sharps:false,flats:true,enharmonics:false};
  assert.deepEqual(K.answers(options).map(a=>a.id),['Db','Eb','Gb','Ab','Bb']);
  for(let index=0;index<100;index++){
    const key=K.question(options,1,()=>index/100);
    assert.notEqual(key.pitch,1);
    assert.ok(key.black);
    assert.ok(K.answers(options).some(a=>K.correct(a,key)));
  }
  assert.throws(()=>K.question({}),/Select at least one/);
});

test('National 3 has a single octave and later levels have two', () => {
  assert.deepEqual(K.pool(K.defaults.N3).map(key => key.pitch), [0,2,4,5,7,9,11]);
  assert.equal(K.visibleKeys(K.defaults.N3).length, 12);
  assert.equal(K.visibleKeys(K.defaults.N4).length, 24);
  assert.equal(K.visibleKeys(K.defaults.N5).length, 24);
  assert.deepEqual(Object.fromEntries(Object.entries(K.subtitles).filter(([key]) => ["N3","N4","N5"].includes(key))), {N3:'One octave',N4:'Two octaves',N5:'Tones, semitones, accidentals — flats, sharps and naturals'});
});


test('written notes map to the correct keyboard octave and enharmonic spelling', () => {
  const options = {...K.defaults.N5, enharmonics:true};
  const spelling = (pitch, id) => K.writtenNotes({pitch}, options).find(note => note.id === id);
  assert.equal(spelling(0, 'C').step, -2);
  assert.equal(spelling(12, 'C').step, 5);
  assert.equal(spelling(24, 'C').step, 12);
  assert.equal(spelling(12, 'B#').step, 4);
  assert.equal(spelling(11, 'Cb').step, 5);
  assert.equal(spelling(1, 'C#').step, -2);
  assert.equal(spelling(1, 'Db').step, -1);
  assert.equal(spelling(1, 'Db').accidental, 'flat');
});

test('question types respect the selected mode', () => {
  assert.equal(K.makeQuestion(K.defaults.N3, {name:false, find:true}, null, () => 0).type, 'find');
  assert.equal(K.makeQuestion(K.defaults.N3, {name:true, find:false}, null, () => 0).type, 'name');
  assert.throws(() => K.makeQuestion(K.defaults.N3, {name:false, find:false}), /question type/);
});


test('find the key never needs more than one ledger line', () => {
  for (const options of [K.defaults.N3, K.defaults.N4, K.defaults.N5, {...K.defaults.N5, enharmonics:true}]) {
    for (let i=0; i<1000; i++) {
      const question=K.makeQuestion(options,{name:false,find:true});
      assert.ok(question.note.step >= -2 && question.note.step <= 10);
      assert.ok(K.correct(question.note, question));
    }
  }
  assert.equal(K.writtenNotes({pitch:24}, K.defaults.N5).some(note => note.step <= 10), false);
});


test('find the key uses written notes from C4 through A5 at National 4 and 5', () => {
  for (const options of [K.defaults.N4, K.defaults.N5, {...K.defaults.N5, enharmonics:true}]) {
    for (let i=0; i<1000; i++) {
      const q=K.makeQuestion(options,{name:false,find:true});
      assert.ok(q.note.step >= -2 && q.note.step <= 10, `${q.note.id} step ${q.note.step}`);
    }
  }
});


test('Higher and Advanced Higher generate matching clefs and note ranges', () => {
  for (const level of ['H','AH']) for (const clef of ['treble','bass']) {
    const options={...K.defaults[level],treble:clef==='treble',bass:clef==='bass'};
    for(let i=0;i<400;i++){
      const q=K.makeQuestion(options,{name:false,find:true},null,Math.random,level);
      const minimum=level==='AH'?-4:-2;
      const maximum=level==='AH'?12:10;
      assert.equal(q.note.clef,clef); assert.ok(q.note.step>=minimum && q.note.step<=maximum);
      assert.equal(q.note.pitch,q.pitch%12); assert.equal(q.type,'find');
      assert.ok(q.pitch>=0 && q.pitch<=24); assert.ok(q.x>=0 && q.x<=672);
      assert.equal(q.baseOctave*12+q.pitch, q.note.octave*12+[0,2,4,5,7,9,11][q.note.index]+q.note.offset);
    }
  }
});


test('Higher keyboards span two octaves while retaining the full note ranges', () => {
  for (const level of ['H','AH']) {
    assert.equal(K.defaults[level].octaves,2);
    for (const clef of ['treble','bass']) {
      const options={...K.defaults[level],treble:clef==='treble',bass:clef==='bass'};
      const steps=new Set(Array.from({length:5000},()=>K.makeQuestion(options,{find:true},null,Math.random,level).note.step));
      const min=level==='AH'?-4:-2, max=level==='AH'?12:10;
      assert.ok(steps.has(min)); assert.ok(steps.has(max));
    }
  }
});
