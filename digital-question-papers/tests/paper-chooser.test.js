const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const registry=require('../paper-registry.js');
const ui=fs.readFileSync(path.join(__dirname,'../exam-ui.js'),'utf8');
const html=fs.readFileSync(path.join(__dirname,'../digitalquestionpapers.html'),'utf8');
const registrySource=fs.readFileSync(path.join(__dirname,'../paper-registry.js'),'utf8');
function render(level,statuses={}) {
  const nodes={};
  const $=selector=>nodes[selector] ||= {style:{setProperty(name,value){this[name]=value;}},setAttribute(name,value){this[name]=value;}};
  const document={body:{dataset:{}}};
  const root={InteractiveExamPaperRegistry:registry,ExamStorage:{paperStatus:id=>statuses[id]||''}};
  const code=ui.slice(ui.indexOf('  function renderPaperChooser('),ui.indexOf('  function initialise()'));
  const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  vm.runInNewContext(code+';renderPaperChooser(level)',{root,document,$,escapeHtml,level});
  return {nodes,document};
}
test('each level shows only its registered papers in chronological order',()=>{
  for(const level of ['N5','H','AH']) {
    const {nodes,document}=render(level);
    const list=nodes['[data-paper-list]'].innerHTML;
    const ids=[...list.matchAll(/href="digitalquestionpapers.html\?paper=([^"]+)"/g)].map(m=>m[1]);
    assert.deepEqual(ids,Object.values(registry).filter(p=>p.levelCode===level).sort((a,b)=>a.year-b.year).map(p=>p.id));
    assert.equal(document.body.dataset.view,'papers');
    assert.equal(nodes['.exam-primary-shell'].hidden,true);
    assert.equal(nodes['[data-paper-chooser]'].hidden,false);
    assert.equal(nodes['[data-open-qr]'].hidden,false);
    assert.match(nodes['[data-open-qr]']['aria-label'],/question papers by QR code/);
    assert.match(list,/exam-paper-choice-arrow/);
    assert.equal(nodes['[data-paper-list]'].style['--paper-list-rows'],String(Math.ceil(ids.length/2))); 
  }
});
test('paper chooser preserves saved progress labels and handles invalid levels',()=>{
  const {nodes}=render('N5',{'national5-2014':'completed','national5-2015':'in-progress'});
  const list=nodes['[data-paper-list]'].innerHTML;
  assert.equal((list.match(/>Completed</g)||[]).length,1);
  assert.equal((list.match(/>In progress</g)||[]).length,1);
  assert.equal(render('invalid').nodes['[data-chooser-level]'].textContent,'National 5');
});
test('paper toolbar returns to its own level without a level menu',()=>{
  assert.doesNotMatch(html,/exam-level-menu|data-paper-level-options|data-exam-menu-trigger="level"/);
  assert.match(html,/data-back-to-papers/);
  const code=ui.slice(ui.indexOf('  function renderPaperSelectors()'),ui.indexOf('  function destroyAudioPlayers()'));
  for(const level of ['N5','H','AH']) {
    const nodes={};const $=selector=>nodes[selector]||=( {setAttribute(){}} );
    const paper=Object.values(registry).find(p=>p.levelCode===level);
    vm.runInNewContext(code+';renderPaperSelectors()',{paper,root:{InteractiveExamPaperRegistry:registry},$,escapeHtml:String});
    assert.equal(nodes['[data-back-to-papers]'].href,'digitalquestionpapers.html?level='+level);
  }
});
test('list routes load no paper data and direct paper links still load the requested paper',async()=>{
  for(const query of ['?level=N5','?level=H','?level=AH','','?paper=higher-2024&question=q4']) {
    const scripts=[];
    const window={location:{search:query}};
    const document={createElement:()=>({addEventListener(){}}),head:{appendChild:script=>scripts.push(script)}};
    vm.runInNewContext(registrySource,{window,document,URLSearchParams});
    assert.equal(scripts.length,query.includes('paper=')?1:0);
    if(scripts.length)assert.equal(scripts[0].src,registry['higher-2024'].dataFile);
  }
  assert.match(ui,/if \(!id\) \{[\s\S]*?renderPaperChooser\(params.get\("level"\)\);[\s\S]*?return;/);
});


test('chooser QR shares the selected level and paper QR keeps its question',()=>{
 const code=ui.slice(ui.indexOf('  function paperShareUrl()'),ui.indexOf('  function openQrOverlay()'));
 for(const level of ['N5','H','AH','invalid']) {
  const context={URL,URLSearchParams,root:{location:new URL('http://localhost:8000/digital-question-papers/digitalquestionpapers.html?level='+level)},paper:undefined,showingAllQuestions:false,engine:undefined};
  vm.runInNewContext(code+';result=paperShareUrl()',context);
  assert.equal(new URL(context.result).searchParams.get('level'),level==='invalid'?'N5':level);
 }
 const context={URL,URLSearchParams,root:{location:new URL('http://localhost:8000/digital-question-papers/digitalquestionpapers.html?paper=higher-2024')},paper:{id:'higher-2024'},showingAllQuestions:false,engine:{attempt:{}},currentQuestion:()=>({id:'q6'})};
 vm.runInNewContext(code+';result=paperShareUrl()',context);
 assert.equal(new URL(context.result).searchParams.get('question'),'q6');
});
