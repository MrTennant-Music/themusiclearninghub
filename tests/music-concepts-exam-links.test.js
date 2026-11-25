const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const links = require('../music-dictionary/music-concepts-exam-links.js');
const registry = require('../digital-question-papers/paper-registry.js');
const evidence = require('../music-dictionary/music-concepts-exam-evidence.json');

test('every reviewed appearance in an available digital paper links to real questions', () => {
 let checked = 0;
 const expectedChecked = Object.values(registry).reduce((sum, meta) => {
  const reviewed = evidence.papers.find(item => item.exam === meta.levelCode && item.year === meta.year);
  return sum + Object.keys(reviewed.answers).length;
 }, 0);
 for (const meta of Object.values(registry)) {
  const paper = require(path.join(require('node:path').resolve(__dirname, '..'), 'digital-question-papers', meta.dataFile.split('?')[0]));
  const reviewed = evidence.papers.find(item => item.exam === meta.levelCode && item.year === meta.year);
  const mapped = links.papers[meta.id];
  assert.deepEqual(Object.keys(mapped.questions).sort(), Object.keys(reviewed.answers).sort());
  for (const conceptId of Object.keys(reviewed.answers)) {
   const targets = links.questionsFor(meta.levelCode, meta.year, conceptId);
   assert.ok(targets.length, `${meta.id} ${conceptId}`);
   assert.equal(new Set(targets.map(target => target.id)).size, targets.length);
   for (const target of targets) {
    const question = paper.questions.find(question => question.id === target.id);
    assert.ok(question);
    assert.equal(target.number, String(question.number));
    const url = new URL(target.href, 'https://local.test/');
    assert.equal(url.searchParams.get('paper'), paper.id);
    assert.equal(url.searchParams.get('question'), question.id);
   }
   checked++;
  }
 }
 assert.equal(checked, expectedChecked);
});

test('unavailable papers and non-appearances have no links', () => {
 assert.deepEqual(links.questionsFor('AH', 2025, 'MC-0275'), []);
 assert.deepEqual(links.questionsFor('N5', 2026, 'MC-0001'), []);
 assert.deepEqual(links.questionsFor('N5', 2014, 'MC-0001'), []);
});

test('new 2026 papers are present in the generated Exam Trends map', () => {
 for (const paperId of ['national5-2026', 'higher-2026', 'advanced-higher-2026']) {
  assert.ok(links.papers[paperId], paperId);
  assert.ok(Object.keys(links.papers[paperId].questions).length > 0, paperId);
 }
 assert.ok(links.questionsFor('H', 2026, 'MC-0084').some(question => question.id === 'q6'));
});

test('links distinguish credited answers from distractors and dynamics', () => {
 assert.deepEqual(links.questionsFor('N5', 2014, 'MC-0177').map(q => q.id), ['q1']);
 assert.deepEqual(links.questionsFor('N5', 2014, 'MC-0193').map(q => q.id), ['q1']);
 assert.deepEqual(links.questionsFor('N5', 2014, 'MC-0057').map(q => q.id), ['q7', 'q8'], 'Piano instrument must not link to the piano dynamic in Q3');
 assert.deepEqual(links.questionsFor('H', 2019, 'MC-0070').map(q => q.id), ['q7'], 'Baroque is a distractor in Q6');
 assert.ok(links.questionsFor('H', 2023, 'MC-0233').some(q => q.id === 'q4'), 'The printed interval-entry task is included');
});

test('tonality links do not match scales, chord qualities or relative keys', () => {
 const matching=require('../scripts/build-music-concepts-exam-links.cjs');
 const dictionary=require('../music-dictionary/music-concepts-data.js');
 const major=dictionary.concepts.find(c=>c.id==='MC-0084');
 const minor=dictionary.concepts.find(c=>c.id==='MC-0085');
 for(const text of ['major scale','relative major','major chord','major third'])assert.equal(matching.matches(major,{text,scoped:false}),false,text);
 for(const text of ['minor scale','relative minor','harmonic minor scale','minor chord','minor third'])assert.equal(matching.matches(minor,{text,scoped:false}),false,text);
 assert.equal(matching.matches(major,{text:'major tonality',scoped:true}),true);
 assert.equal(matching.matches(minor,{text:'minor',scoped:true}),true);
 assert.deepEqual(links.questionsFor('H',2015,'MC-0084').map(q=>q.id),['q6']);
 assert.deepEqual(links.questionsFor('H',2022,'MC-0084').map(q=>q.id),['q2']);
 assert.deepEqual(links.questionsFor('H',2015,'MC-0085').map(q=>q.id),['q6']);
});

test('structured accepted phrases cannot credit incidental concept names', () => {
 const {answerStrings,matches}=require('../scripts/build-music-concepts-exam-links.cjs');
 const dictionary=require('../music-dictionary/music-concepts-data.js');
 const entries=answerStrings({type:'lyric-placement',features:[{before:'major ',word:'scale',after:' played by the strings'}],concepts:[{label:'Scale',answers:['scale','major scale played by the strings']}]});
 for(const id of ['MC-0084','MC-0063'])assert.ok(!entries.some(entry=>matches(dictionary.concepts.find(c=>c.id===id),entry)));
 assert.ok(entries.some(entry=>matches(dictionary.concepts.find(c=>c.id==='MC-0090'),entry)));
});

const dictionaryUi=fs.readFileSync(path.join(require('node:path').resolve(__dirname, '..'),'music-dictionary/music-concepts.js'),'utf8');
const trendComponents=dictionaryUi.slice(dictionaryUi.indexOf('function ConceptExamYear('),dictionaryUi.indexOf('function RelatedConcepts('));
const examKeys=dictionaryUi.match(/^const literacyExamKeys=.*;$/m)[0];
const element=(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity).filter(item=>item!==null&&item!==false&&item!==undefined)});
const trendsContext={h:element,React:{useState:initial=>[initial,()=>{}],useRef:()=>({current:null}),useEffect:()=>{}},window:{MLH:{MenuPanel:'MenuPanel'},MusicConceptFrequency:require('../music-dictionary/music-concepts-frequency-core.js'),MUSIC_CONCEPT_FREQUENCY:require('../music-dictionary/music-concepts-frequency.js'),MusicConceptExamLinks:links},viewGlyph:()=>null};
vm.runInNewContext(examKeys+'\n'+trendComponents+';this.renderYear=ConceptExamYear;this.renderTrends=ConceptExamTrends;',trendsContext);
function descendants(node){return node&&typeof node==='object'?[node,...node.children.flatMap(descendants)]:[];}

test('Exam Trends only offers papers at or above the concept qualification',()=>{
 for(const [level,expected] of [['National 3',['N5','H','AH']],['National 4',['N5','H','AH']],['National 5',['N5','H','AH']],['Higher',['H','AH']],['Advanced Higher',['AH']]]){
  const tree=trendsContext.renderTrends({concept:{id:'MC-0084',name:'Major tonality',level}});
  const group=descendants(tree).find(node=>node.props['aria-label']==='Exam Trends qualification');
  assert.deepEqual(group.children.map(button=>button.children[0]),expected,level);
  assert.equal(group.children[0].props['aria-pressed'],true,level);
 }
});

test('each reviewed year renders once, even when it has several questions', () => {
 const tree=trendsContext.renderTrends({concept:{id:'MC-0084',name:'Major tonality',level:'National 4'}});
 const list=descendants(tree).find(node=>node.type==='ul');
 assert.equal(list.children.length,11);
 assert.equal(new Set(list.children.map(node=>node.props.year)).size,11);
});

test('a multi-question year has one year button and a dropdown of distinct question links', () => {
 const questions=links.questionsFor('N5',2014,'MC-0057');
 assert.ok(questions.length>1);
 const closed=trendsContext.renderYear({year:2014,appeared:true,questions,conceptName:'Piano',open:false,onToggle:()=>{}});
 assert.equal(descendants(closed).filter(node=>node.type==='button').length,1);
 assert.equal(descendants(closed).filter(node=>node.type==='a').length,0);
 const open=trendsContext.renderYear({year:2014,appeared:true,questions,conceptName:'Piano',open:true,onToggle:()=>{}});
 const anchors=descendants(open).filter(node=>node.type==='a');
 assert.equal(anchors.length,questions.length);
 assert.deepEqual(anchors.map(node=>node.props.href),questions.map(q=>q.href));
 assert.ok(anchors.every(node=>node.children[0].startsWith('Question ')));
});

test('single-question years remain direct links and unavailable years are static', () => {
 const questions=links.questionsFor('N5',2014,'MC-0177');
 const single=trendsContext.renderYear({year:2014,appeared:true,questions,conceptName:'Cross rhythms'});
 assert.equal(descendants(single).filter(node=>node.type==='a').length,1);
 assert.equal(descendants(single).filter(node=>node.type==='button').length,0);
 const unavailable=trendsContext.renderYear({year:2026,appeared:true,questions:[],conceptName:'Cross rhythms'});
 assert.equal(descendants(unavailable).filter(node=>node.type==='a'||node.type==='button').length,0);
});

const ui = fs.readFileSync(path.join(require('node:path').resolve(__dirname, '..'), 'digital-question-papers/exam-ui.js'), 'utf8');
const navigation = ui.slice(ui.indexOf('  function openLinkedQuestion() {'), ui.indexOf('  function initialise() {'));
function navigate(questionId, attempt) {
 const events = [];
 const engine = {
  attempt,
  start(mode, timerEnabled) { events.push(['start', mode, timerEnabled]); this.attempt = {mode, status:'active', answers:{}}; },
  goToQuestion(id) { events.push(['question', id]); this.attempt.currentQuestion = id; }
 };
 const context = {
  root: {location:{search:'?paper=national5-2014&question='+questionId}}, URLSearchParams,
  paper: {questions:[{id:'q1'},{id:'q5'}]}, engine, selectedStartMode:null, showingAllQuestions:true,
  $: () => ({classList:{remove: name => events.push(['hide', name])}}),
  showResultQuestion: id => events.push(['feedback', id])
 };
 vm.runInNewContext(navigation+'\nopenLinkedQuestion();', context);
 return {events, context, engine};
}

test('a valid question link starts untimed Practice at the exact question', () => {
 const {engine, context, events} = navigate('q5', null);
 assert.equal(engine.attempt.currentQuestion, 'q5');
 assert.equal(context.selectedStartMode, 'practice');
 assert.equal(context.showingAllQuestions, false);
 assert.ok(events.some(event => event[0] === 'start' && event[1] === 'practice' && event[2] === false));
});

test('question links retain existing Practice answers and saved feedback', () => {
 const draft = {mode:'practice',status:'active',answers:{q1a:'Gospel'}};
 const result = navigate('q5', draft);
 assert.equal(result.engine.attempt, draft);
 assert.deepEqual(draft.answers, {q1a:'Gospel'});
 assert.ok(!result.events.some(event => event[0] === 'start'));
 const submitted = {mode:'exam',status:'submitted',answers:{q1a:'Gospel'}};
 const feedback = navigate('q5', submitted);
 assert.deepEqual(feedback.events, [['feedback','q5']]);
 assert.equal(feedback.engine.attempt, submitted);
});

test('invalid links and active Exam attempts are not changed', () => {
 assert.deepEqual(navigate('q999', null).events, []);
 const active = {mode:'exam',status:'active',answers:{}};
 assert.deepEqual(navigate('q5', active).events, []);
});

 test('Advanced Higher 2016 links include its assessed triad and inversion questions',()=>{
 for(const id of ['MC-0277','MC-0278','MC-0279'])assert.deepEqual(links.questionsFor('AH',2016,id).map(q=>q.id),['q4']);
 assert.ok(links.questionsFor('AH',2016,'MC-0047').some(q=>q.id==='q6'));
 });


test('regenerating links preserves all reviewed papers and conditional answer matches', () => {
 const rebuilt=require('../scripts/build-music-concepts-exam-links.cjs').build({write:false});
 assert.deepEqual(rebuilt.papers,links.papers);
 for(const [exam,year,id,question] of [['AH',2022,'MC-0139','q6'],['AH',2023,'MC-0240','q6'],['H',2024,'MC-0020','q6'],['H',2016,'MC-0087','q6'],['H',2019,'MC-0087','q7']])
  assert.ok(links.questionsFor(exam,year,id).some(q=>q.id===question),`${exam} ${year} ${id}`);
});
