const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const React=require('react'),babel=require('@babel/standalone');
const source=babel.transform(fs.readFileSync('music-games/session.jsx','utf8').replace('  window.IGGameSession = GameSession;', '  window.TestFittedGameStage=FittedGameStage;window.IGGameSession=GameSession;'),{presets:['react']}).code;
test('game fitting stays inside the fixed window, reserves controls and restores size after large content',()=>{
  let effect,resize,height=1000,wide=false,cleaned=false,wordsearch=false,crossword=false,puzzleSize=0;
  const refs=[],host={clientWidth:1000,clientHeight:670};
  const board={style:{setProperty(name,value){this[name]=value;}},querySelector:()=>content,addEventListener(){},removeEventListener(){}};
  const content={querySelector:selector=>((wordsearch&&selector==='.ig-wordsearch')||(crossword&&selector==='.ig-crossword-player'))?{style:{setProperty(name,value){puzzleSize=parseFloat(value);}}}:null,get scrollHeight(){return wordsearch?puzzleSize+36:height;},get scrollWidth(){return wide?1500:Number.parseFloat(board.style.width)-36;}};
  const context={document:{body:{dataset:{}},fullscreenElement:null,addEventListener(){},removeEventListener(){}},React:{...React,useRef:()=>{const ref={current:refs.length?board:host};refs.push(ref);return ref;},useEffect:fn=>effect=fn},window:{},getComputedStyle:()=>({getPropertyValue:()=>''}),ResizeObserver:class{constructor(fn){resize=fn;}observe(){}disconnect(){cleaned=true;}},requestAnimationFrame:fn=>{fn();return 1;},cancelAnimationFrame(){}};
  vm.runInNewContext(source,context);context.window.TestFittedGameStage({children:null});const cleanup=effect();
  function check(){const scale=Number(board.style.transform.match(/scale\(([^)]+)\)/)[1]);assert.ok(scale<=1);const renderedHeight=parseFloat(board.style.height)*scale;assert.ok(renderedHeight<=host.clientHeight-72+0.001);assert.ok(parseFloat(board.style.top)-renderedHeight/2>=72);assert.ok(parseFloat(board.style.width)*scale<=1000);return scale;}
  assert.ok(check()<1);height=100;resize();assert.equal(check(),1);
  wide=true;resize();assert.ok(check()<1);wide=false;resize();assert.equal(check(),1);
  host.clientHeight=900;resize();assert.equal(check(),1);
  for(const mode of ['wordsearch','crossword']){
    wordsearch=mode==='wordsearch';crossword=mode==='crossword';
    for(const h of [900,670]){host.clientHeight=h;resize();assert.equal(board.style.transform,'translateX(-50%)');assert.equal(board.style.padding,'0 12px');assert.equal(parseFloat(board.style.top),0);assert.equal(parseFloat(board.style.height),h);assert.equal(puzzleSize,608);assert(puzzleSize+24<=h);}
  }
  cleanup();assert.equal(cleaned,true);
});
