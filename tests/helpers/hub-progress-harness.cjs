const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname,'../../shared/hub-progress.js'),'utf8');
const prefix = 'mlh:activity-progress:v1:';
const stable = value => Array.isArray(value) ? value.map(stable).sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b))) : value && typeof value==='object' ? Object.fromEntries(Object.keys(value).sort().map(key=>[key,stable(value[key])])) : value;
const legacyKey = (page,options) => prefix+JSON.stringify([page,options.level,options.scope||'',stable(options.settings)]);
function harness(page,storage=new Map(),fields={correct:0,attempted:0,streak:0,best:0}) {
  let states=[],cursor=0,effects=[],changed=false;
  const React={
    useState(initial){const i=cursor++;if(!(i in states))states[i]=typeof initial==='function'?initial():initial;return [states[i],value=>{states[i]=typeof value==='function'?value(states[i]):value;changed=true;}];},
    useCallback:fn=>fn,
    useLayoutEffect:fn=>effects.push(fn),
  };
  const window={React,location:{pathname:'/'+page,href:'https://example.test/'+page},history:{replaceState(){}},localStorage:{get length(){return storage.size;},key:index=>[...storage.keys()][index],getItem:key=>storage.get(key)??null,setItem:(key,value)=>storage.set(key,value)}};
  vm.runInNewContext(source,{window,URL});
  function render(options){
    let result;
    do {changed=false;cursor=0;effects=[];result=Object.fromEntries(Object.entries(fields).map(([name,initial])=>[name,window.MLH.usePersistentScoreState(initial,name,options)]));} while(changed);
    effects.forEach(fn=>fn());return result;
  }
  return {render,storage};
}
const values=result=>JSON.parse(JSON.stringify(Object.fromEntries(Object.entries(result).map(([key,[value]])=>[key,value]))));

module.exports={harness,values,legacyKey,prefix,stable};
