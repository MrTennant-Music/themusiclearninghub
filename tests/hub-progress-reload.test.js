const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {parser,generator}=require('@babel/standalone').packages;
const {harness,values,legacyKey}=require('./helpers/hub-progress-harness.cjs');
const root=path.resolve(__dirname,'..');
const active=new Set(['streak','followStreak','currentStreak']);
const reset=value=>value&&typeof value==='object'?Object.fromEntries(Object.entries(value).map(([key,item])=>[key,active.has(key)?0:reset(item)])):value;
const options={level:'N5',scope:'exercise',settings:{questions:['major','minor'],options:{tempo:80,metronome:false}}};

test('refresh resets the active streak across all 24 activities and keeps scores, bests and medals',()=>{
  const pages=fs.readdirSync(root).filter(name=>name.endsWith('.html')&&fs.readFileSync(path.join(root,name),'utf8').includes('ScoreStreakPanel'));
  assert.equal(pages.length,24);
  for(const page of pages) {
    const html=fs.readFileSync(path.join(root,page),'utf8');
    const progressHash=require('node:crypto').createHash('sha256').update(fs.readFileSync(path.join(root,'shared/hub-progress.js'))).digest('hex').slice(0,12);
    assert.ok(html.includes('hub-progress.js?v='+progressHash),page+' loads the current shared progress helper');
    const chunks=[...html.matchAll(/<script\b[^>]*type="text\/x-mlh-jsx-source"[^>]*>([\s\S]*?)<\/script>/g)].map(match=>match[1]).join('\n');
    const ast=parser.parse(chunks,{plugins:['jsx']}),fields={};
    function walk(node) {
      if(!node||typeof node!=='object')return;
      if(node.type==='CallExpression'&&node.callee?.property?.name==='usePersistentScoreState') fields[node.arguments[1].value]=vm.runInNewContext('('+generator.default(node.arguments[0]).code+')');
      for(const item of Object.values(node)){if(Array.isArray(item))item.forEach(walk);else if(item&&typeof item==='object')walk(item);}
    }
    walk(ast);
    assert.ok(Object.keys(fields).length,page+' uses shared score persistence');
    const earned=Object.fromEntries(Object.entries(fields).map(([field,initial])=>[field,typeof initial==='object'?{...initial,correct:12,attempted:14,...('streak' in initial?{streak:7,best:10}:{})}:active.has(field)?7:field==='correct'?12:field==='attempted'?14:10]));
    const storage=new Map([['mlh:achievements:v1','earned-medals']]);
    const h=harness(page,storage,fields);
    let r=h.render(options);for(const [field,value] of Object.entries(earned))r[field][1](value);
    assert.deepEqual(values(h.render(options)),earned,page+' before refresh');
    const refreshed=harness(page,storage,fields);
    assert.deepEqual(values(refreshed.render(options)),reset(earned),page+' after refresh');
    assert.equal(storage.get('mlh:achievements:v1'),'earned-medals');
    r=refreshed.render(options);
    for(const [field,[value,set]] of Object.entries(r)) {
      if(active.has(field))set(1);
      else if(typeof value==='object')set({...value,correct:value.correct+1,attempted:value.attempted+1,...('streak' in value?{streak:1}:{})});
      else if(['correct','attempted'].includes(field))set(value+1);
    }
    const next=values(refreshed.render(options));
    for(const [field,value] of Object.entries(next)) {
      if(active.has(field))assert.equal(value,1,page+' restarts at one');
      if(typeof value==='object'&&'streak' in value)assert.equal(value.streak,1,page+' nested streak restarts at one');
    }
  }
});

test('refresh cannot recover a streak by changing level, exercise or saved customisation',()=>{
  const h=harness('auralrecognition.html');
  const setups=[options,{...options,level:'N4'},{...options,scope:'scales'},{...options,settings:{questions:['other'],options:{}}}];
  for(const setup of setups) {const r=h.render(setup);for(const [field,value] of Object.entries({correct:20,attempted:22,streak:19,best:20}))r[field][1](value);h.render(setup);}
  const refreshed=harness('auralrecognition.html',h.storage);
  for(const setup of setups)assert.deepEqual(values(refreshed.render(setup)),{correct:20,attempted:22,streak:0,best:20});
  const r=refreshed.render(options);r.streak[1](1);refreshed.render(options);
  assert.equal(values(refreshed.render({...options,scope:'scales'})).streak,0);
  assert.equal(values(refreshed.render(options)).streak,1,'switching setup within the same document preserves the new streak');
});

test('legacy migration resets streak before any hook can claim the record for this page session',()=>{
  const storage=new Map([[legacyKey('auralrecognition.html',options),JSON.stringify({version:1,fields:{correct:12,attempted:14,streak:9,best:10}})]]);
  const fields={correct:0,attempted:0,best:0};
  const h=harness('auralrecognition.html',storage,fields);
  h.render(options);
  fields.streak=0;
  assert.deepEqual(values(h.render(options)),{correct:12,attempted:14,best:10,streak:0},'mounting the streak hook later cannot resurrect the old streak');
});
