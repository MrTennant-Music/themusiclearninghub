const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const root=path.resolve(__dirname,'..'),Core=require('../music-dictionary/quiz-core.js'),build=require('../scripts/build-dictionary-quizzes.cjs');
const bank=JSON.parse(fs.readFileSync(path.join(root,'music-dictionary/quiz-data/question-bank.json')));
test('Music Literacy has one editable multiple-choice question per Dictionary concept',async()=>{
 const dictionary=require('../music-dictionary/music-literacy-dictionary');
 const {bank:literacy,ready,pictureFor}=require('../music-dictionary/literacy-quiz-bank')(dictionary,Core);
 await ready;
 assert.deepEqual(literacy.questions.map(q=>q.conceptId),dictionary.entries.map(entry=>entry.id));
 const correctPositions=[0,0,0,0];
 for(const q of literacy.questions){
  assert.equal(q.format,'multiple-choice');
  assert.equal(q.levelCode,dictionary.entry(q.conceptId).level);
  assert.equal(q.options.length,4);
  assert.equal(q.options.filter(option=>Core.isCorrect(q,option.id)).length,1);
  correctPositions[q.options.findIndex(option=>Core.isCorrect(q,option.id))]++;
  const illustration=pictureFor(q);
  assert(illustration.picture&&illustration.description,q.id);
  if(illustration.picture.src)assert(fs.existsSync(path.resolve(root,illustration.picture.src)),q.id);
 }
 assert(Math.max(...correctPositions)-Math.min(...correctPositions)<=1);
 const base=literacy.questions.find(q=>q.conceptId==='crotchet');
 assert(base.picture&&base.pictureDescription);
 const question=await Core.saveQuestion(base,{...base,prompt:'How many beats does this note last?'});
 const saved=await Core.applyReviews(literacy,[{id:base.id,baseContentSha256:base.contentSha256,question}]);
 assert.equal(saved.get(base.id).question.prompt,question.prompt);
 assert.deepEqual(pictureFor(saved.get(base.id).question),pictureFor(base));
});
test('Steps asks about the movement in its picture and migrates older reviews',async()=>{
 const dictionary=require('../music-dictionary/music-literacy-dictionary');
 const {bank:literacy,ready,pictureFor}=require('../music-dictionary/literacy-quiz-bank')(dictionary,Core);
 await ready;
 const steps=literacy.questions.find(q=>q.conceptId==='steps');
 assert.match(steps.prompt,/first note to the second/);
 assert.deepEqual(pictureFor(steps).picture.scores,['treble C4 D4']);
 assert.equal(steps.options.find(option=>Core.isCorrect(steps,option.id)).text,'Up by step');
 const migration=literacy.reviewMigrations.find(m=>m.id===steps.id);
 const old={...steps,...migration.previous,contentSha256:migration.from};
 const edited=await Core.saveQuestion(old,{...old,feedback:'My feedback.'});
 const saved=await Core.applyReviews(literacy,[{id:steps.id,baseContentSha256:migration.from,question:edited}]);
 assert.equal(saved.get(steps.id).question.prompt,steps.prompt);
 assert.deepEqual(saved.get(steps.id).question.options,steps.options);
 assert.equal(saved.get(steps.id).question.feedback,'My feedback.');
 const reorder=literacy.reviewMigrations.find(m=>m.id===steps.id&&!m.previous.prompt);
 const beforeReorder={...steps,options:[...steps.options].sort((a,b)=>a.id.localeCompare(b.id)),contentSha256:reorder.from};
 const reviewed=await Core.saveQuestion(beforeReorder,{...beforeReorder,feedback:'My other feedback.'});
 const migrated=await Core.applyReviews(literacy,[{id:steps.id,baseContentSha256:reorder.from,question:reviewed}]);
 assert.deepEqual(migrated.get(steps.id).question.options,steps.options);
 assert.equal(migrated.get(steps.id).question.feedback,'My other feedback.');
});
test('the complete bank covers every current Dictionary entry and labels every same-fact alternative',async()=>{const result=await build.validateBank(bank);assert.equal(result.concepts,require('../music-dictionary/music-concepts-data.js').concepts.length);assert(bank.questions.every(q=>!('status' in q.review)));assert.equal(new Set(bank.coverage.map(c=>c.levelCode)).size,5);});
test('question edits save immediately without approval metadata',async()=>{const base=bank.questions[0],edit=Core.copy(base);edit.feedback='Clearer explanation.';edit.review.status='rejected';const saved=await Core.saveQuestion(base,edit);assert.equal(saved.feedback,edit.feedback);assert.equal(saved.review.status,undefined);assert.equal(saved.contentSha256,await Core.fingerprint(saved));assert.notEqual(saved.contentSha256,base.contentSha256);});
test('typed answers accept only listed normalised variants, not similar musical terms',()=>{const q=bank.questions.find(q=>q.format==='short-answer');assert(Core.isCorrect(q,'  '+q.answer.canonical.toUpperCase()+'  '));assert(!Core.isCorrect(q,q.answer.canonical+' wrong musical term'));const fake={options:null,answer:{canonical:'Ballett',acceptedVariants:['Ballett'],matching:{fuzzyMatching:false}}};assert(!Core.isCorrect(fake,'Ballet'));});
test('multi-select requires the exact set with no extra or duplicate options',()=>{const sample=bank.questions.find(q=>q.options?.length>=2);const q={...sample,format:'multi-select',answer:{correctOptionIds:sample.options.slice(0,2).map(o=>o.id)}};assert(Core.isCorrect(q,[...q.answer.correctOptionIds].reverse()));assert(!Core.isCorrect(q,[...q.answer.correctOptionIds,q.answer.correctOptionIds[0]]));assert(!Core.isCorrect(q,q.answer.correctOptionIds.slice(1)));});
test('imports preserve exact source identity and reject stale or tampered edits without partial writes',async()=>{const q=bank.questions[0];const saved=await Core.saveQuestion(q,q);const item={id:q.id,baseContentSha256:q.contentSha256,question:saved};assert.equal((await Core.applyReviews(bank,[item])).size,1);await assert.rejects(Core.applyReviews(bank,[{...item,baseContentSha256:'stale'}]),/source question has changed/);const bad=Core.copy(item);bad.question.feedback='Tampered';await assert.rejects(Core.applyReviews(bank,[bad]),/checksum/);await assert.rejects(Core.applyReviews(bank,[item,item]),/duplicate/);assert.equal(q.review.status,undefined);});
test('all questions share one bank with no approval-only adapter',()=>{assert(!fs.existsSync(path.join(root,'music-dictionary/quiz-approved.js')));const player=fs.readFileSync(path.join(root,'music-dictionary/quiz-player.js'),'utf8');assert(!player.includes('approvedQuestions'));assert(!player.includes('config.testing'));});
test('every concept has at least three own questions, including former exclusions',()=>{for(const row of bank.coverage){assert(row.questionIds.length+(row.retiredQuestionIds||[]).length>=3,row.conceptId);assert.equal(new Set(row.questionIds).size,row.questionIds.length);assert.equal(new Set(row.questionIds.map(id=>bank.questions.find(q=>q.id===id).prompt.trim().toLowerCase())).size,row.questionIds.length);}});
test('Higher Subject uses sonata context and AH Subject uses fugue context',()=>{const ah=bank.questions.filter(q=>q.conceptId==='MC-0296'),higher=bank.questions.filter(q=>q.conceptId==='MC-0255');assert(ah.length+(bank.retiredQuestions||[]).filter(q=>q.conceptId==='MC-0296').length>=3);assert(higher.length+(bank.retiredQuestions||[]).filter(q=>q.conceptId==='MC-0255').length>=3);for(const q of ah)assert.match(q.prompt,/fugue|fugal/i);for(const q of higher)assert.match(q.prompt,/sonata/i);});
test('quizzes have a dedicated app entry and Hub tile while sharing the current question bank',()=>{const html=fs.readFileSync(path.join(root,'index.html'),'utf8');assert(html.includes('conceptquiz.html'));const app=fs.readFileSync(path.join(root,'conceptquiz.html'),'utf8');assert(app.includes('MLH_CONCEPT_QUIZ_APP=true'));for(const file of ['quiz-core.js','quiz-bank.js','quiz-player.js','quiz-review.js'])assert(app.includes('music-dictionary/'+file));assert(fs.existsSync(path.join(root,'app-icons/concept-quiz-icon.svg')));});

test('Dictionary quiz sharing preserves settings and legacy saved groups',()=>{
 const values=new Map([['mlh-concept-quiz-groups-v1',JSON.stringify([{name:'Existing group',level:'N3',concepts:['MC-0001']}])]]);
 const box={window:{},MUSIC_CONCEPTS:require('../music-dictionary/music-concepts-data.js'),React:{createElement(){},useEffect(){},useState:init=>[typeof init==='function'?init():init,()=>{}]},localStorage:{getItem:key=>values.get(key)||null,setItem:(key,value)=>values.set(key,value)}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'music-dictionary/music-concepts-quizzes.js'),'utf8'),{...box,URLSearchParams});
 const api=box.window.MusicDictionaryQuizzes;
 assert.equal(api.useGroups()[0][0].name,'Existing group');
 const url=new URL(api.url({concepts:['MC-0001','MC-0001'],level:'N3',name:'Class quiz',settings:{count:5,testing:false,audioQuestions:false,nonAudioQuestions:true}}),'https://example.com/');
 assert.equal(url.pathname,'/conceptquiz.html');
 const config=JSON.parse(url.searchParams.get('quiz'));assert.equal(config.start,true);assert.equal(config.count,undefined);assert.equal(config.testing,undefined);assert.equal(config.audioQuestions,false);assert.deepEqual(config.concepts,['MC-0001']);
});

test('Styles, Tempo, Orchestra and Harmony share requested glyphs, other glyphs are unique, and saved collections use Quizzes',()=>{
 const box={window:{},MUSIC_CONCEPTS:require('../music-dictionary/music-concepts-data.js'),React:{createElement(){}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'music-dictionary/music-concepts-quizzes.js'),'utf8'),box);
 const api=box.window.MusicDictionaryQuizzes,collections=require('../music-dictionary/quiz-collections.js');
 const ids=[...new Set(['N3','N4','N5','H','AH','ALL'].flatMap(l=>collections.groupsForLevel(l).map(g=>g.id)))];
 const styles=ids.filter(id=>id.endsWith('-styles'));assert.equal(styles.length,5);for(const id of styles)assert.equal(api.collectionGlyph({id}),'./music-dictionary/quiz-icons/styles-speaker.png');
 for(const id of ['tempo','tempo-changes'])assert.equal(api.collectionGlyph({id}),'./ui-icons/ear-training/tempo-icon.svg');
 assert.equal(api.collectionGlyph({id:'orchestra'}),api.collectionGlyph({id:'instruments-ensembles'}));
 assert.equal(api.collectionGlyph({id:'harmony'}),api.collectionGlyph({id:'chords'}));
 assert.equal(api.collectionGlyph({id:'musical-development'}),api.collectionGlyph({id:'pitch-melody-scales'}));
 assert.deepEqual(api.collectionGlyphStyle({id:'musical-development'}),api.collectionGlyphStyle({id:'pitch-melody-scales'}));
 assert.deepEqual(api.collectionGlyphStyle({id:'harmony'}),api.collectionGlyphStyle({id:'chords'}));
 const paths=collections.listedGroupsForLevel('ALL').filter(g=>g.curriculumColumn===undefined&&!['tempo-changes','orchestra','harmony','musical-development'].includes(g.id)).map(g=>api.collectionGlyph(g));assert.equal(new Set(paths).size,paths.length);
 for(const group of collections.listedGroupsForLevel('ALL').filter(g=>g.curriculumColumn>0))assert(fs.existsSync(path.join(root,api.collectionGlyph(group))),group.id);
 const artwork=paths.map(file=>{assert(fs.existsSync(path.join(root,file.split('?')[0])),file);return fs.readFileSync(path.join(root,file.split('?')[0])).toString('base64');});assert.equal(new Set(artwork).size,paths.length);assert(fs.existsSync(path.join(root,api.collectionGlyph({id:styles[0]}))));
 for(const id of ['saved-0','saved-1','saved-20'])assert.equal(api.collectionGlyph({id}),'./ui-icons/concept-quiz.svg');
});

test('every collection has finite optical framing and saved collections share the same crop',()=>{
 const box={window:{},MUSIC_CONCEPTS:require('../music-dictionary/music-concepts-data.js'),React:{createElement(){}}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'music-dictionary/music-concepts-quizzes.js'),'utf8'),box);
 const api=box.window.MusicDictionaryQuizzes,collections=require('../music-dictionary/quiz-collections.js');
 for(const level of ['N3','N4','N5','H','AH','ALL'])for(const group of collections.groupsForLevel(level)){const crop=api.collectionGlyphStyle(group);assert(crop,group.id);for(const field of ['width','height','left','top'])assert(Number.isFinite(crop[field]),group.id+': '+field);assert(crop.width>0&&crop.height>0);}
 assert.deepEqual(api.collectionGlyphStyle({id:'saved-0'}),api.collectionGlyphStyle({id:'saved-123'}));
});

test('questions ask for musical answers rather than yes or no',()=>{
 for(const q of bank.questions){
  assert(!/answer yes or no/i.test(q.prompt),q.id);
  assert(!/^(yes|no)$/i.test(q.answer.canonical||''),q.id);
  assert(!(q.answer.acceptedVariants||[]).some(a=>/^(yes|no)$/i.test(a)),q.id);
  assert(!(q.options||[]).some(o=>/^(yes|no)[:;]/i.test(o.text)),q.id);
  if(!q.options){assert(Core.isCorrect(q,q.answer.canonical),q.id);assert(!Core.isCorrect(q,'yes'),q.id);assert(!Core.isCorrect(q,'no'),q.id);}
 }
});

test('every concept retains one baseline typed, tick-one and tick-two question, alongside additional formats',()=>{
 for(const row of bank.coverage){
  const qs=bank.questions.filter(q=>q.conceptId===row.conceptId);
  const retired=(bank.retiredQuestions||[]).filter(q=>q.conceptId===row.conceptId);
  assert.equal(qs.filter(q=>q.format!=='order').length+retired.length,3,row.conceptId);
  for(const format of ['short-answer','multiple-choice','multi-select'])assert.equal([...qs,...retired].filter(q=>q.format===format).length,1,row.conceptId+': '+format);
  const single=qs.filter(q=>q.format==='multiple-choice'),pair=qs.filter(q=>q.format==='multi-select');
  assert(single.length<=1);assert(pair.length<=1);
  if(single.length){assert.equal(single[0].options.length,4);assert.equal(single[0].answer.correctOptionIds.length,1);assert.match(single[0].prompt,/Tick ONE box/i);}
  if(pair.length){assert.equal(pair[0].options.length,6);assert.equal(pair[0].answer.correctOptionIds.length,2);assert.match(pair[0].prompt,/Tick TWO/i);}
 }
});
test('tick-two marking awards a mark per correct choice, with no credit for invalid excess selections',()=>{
 const q=bank.questions.find(q=>q.format==='multi-select'),[a,b]=q.answer.correctOptionIds,wrong=q.options.find(o=>![a,b].includes(o.id)).id;
 assert.deepEqual(Core.markQuestion(q,[a,b]),{earned:2,available:2});
 assert.deepEqual(Core.markQuestion(q,[a,wrong]),{earned:1,available:2});
 assert.deepEqual(Core.markQuestion(q,[a]),{earned:1,available:2});
 assert.deepEqual(Core.markQuestion(q,[]),{earned:0,available:2});
 for(const input of [[a,b,wrong],[a,a],['unknown']])assert.deepEqual(Core.markQuestion(q,input),{earned:0,available:2});
 for(const format of ['short-answer','multiple-choice']){const question=bank.questions.find(q=>q.format===format),answer=question.options?question.answer.correctOptionIds[0]:question.answer.canonical;assert.deepEqual(Core.markQuestion(question,answer),{earned:1,available:1});assert.deepEqual(Core.markQuestion(question,''),{earned:0,available:1});}
});

// Typed recall must identify the target concept, rather than a fact about it.
test('every typed definition accepts its Dictionary concept name without supplied choices',()=>{
 const concepts=require('../music-dictionary/music-concepts-data.js').concepts;
 for(const c of concepts){
  const q=bank.questions.find(q=>q.conceptId===c.id&&q.format==='short-answer');
  if(!q){assert((bank.retiredQuestions||[]).some(r=>r.conceptId===c.id&&r.format==='short-answer'),c.id+': missing without a recorded deletion');continue;}
  // The teacher's modal-tonality question asks which early vocal style uses modes.
  if(q.id==='CQ-H-MC0235-F03'&&q.review?.updatedAt&&q.prompt.includes('early vocal style')){assert(Core.isCorrect(q,'Plainchant'));assert(!Core.isCorrect(q,'Mode or modal'));continue;}
  assert(Core.isCorrect(q,["MC-0035","MC-0041"].includes(c.id)?c.name.split(" / ")[0]:c.name),c.id+': target concept name must be accepted');
  assert(!/^(?:does|do|can|is|are|which of|what vibrates)\b/i.test(q.prompt),q.id+': no binary or supplied-choice question');
  if(!q.review?.updatedAt)assert.match(q.prompt,/(?:What is this called\?|Name [^.]+\.|Give [^.]+\.|What is a succession of chords called\?)$|^Name the concept: /,q.id);
 }
});
test('recorder typed question gives a definition and expects recorder',()=>{
 const q=bank.questions.find(q=>q.conceptId==='MC-0131'&&q.format==='short-answer');
 assert.match(q.prompt,/finger holes/);assert.match(q.prompt,/whistle-like mouthpiece/);
 assert(!/recorder|bowed strings/i.test(q.prompt));
 assert.equal(q.answer.canonical,'Recorder');assert(Core.isCorrect(q,'recorder'));
 assert(!Core.isCorrect(q,'whistle-like mouthpiece'));
});

test('Musical choices test audible musical-theatre clues rather than dramatic roles',()=>{
 const questions=bank.questions.filter(q=>q.conceptId==='MC-0004'&&q.options);
 for(const q of questions){
  const correct=q.options.filter(o=>q.answer.correctOptionIds.includes(o.id)).map(o=>o.text).join(' ');
  assert.match(correct,/singing|singers/);assert.match(correct,/band|orchestra/);assert.match(correct,/solo|chorus/);
  assert(!/character|acting|costume|scenery/i.test(q.prompt+' '+q.options.map(o=>o.text).join(' ')));
 }
});
test('instrument and vocal-work choices connect to tone and texture rather than unseen mechanisms or staging',()=>{
 const correctText=(id,format)=>{const q=bank.questions.find(q=>q.conceptId===id&&q.format===format);if(q)return q.options.filter(o=>q.answer.correctOptionIds.includes(o.id)).map(o=>o.text).join(' ');const retired=require('../music-dictionary/quiz-data/workbook-choice-audit.json').retiredQuestions.find(q=>q.conceptId===id&&q.format===format);assert(retired,'Teacher-deleted question must retain its source audit');return retired.checkedCorrectOptions.join(' ');};
 assert.match(correctText('MC-0131','multiple-choice'),/whistle-like/);
 assert.match(correctText('MC-0128','multiple-choice'),/crisp|twangy/);
 assert.match(correctText('MC-0133','multiple-choice'),/rattling/);
 assert.match(correctText('MC-0220','multiple-choice'),/soloists, choir and orchestra/);
 assert.match(correctText('MC-0222','multiple-choice'),/speech rhythm/);
 for(const q of bank.questions.filter(q=>q.options))assert(!/developing the character|costumes and scenery|theatrical staging/i.test(q.prompt+' '+q.options.map(o=>o.text).join(' ')),q.id);
});

test('editor and quiz share safe question emphasis without storing markup',()=>{
 assert.equal(Core.promptHtml('Tick TWO statements.'),'Tick <strong>two</strong> statements.');
 assert.equal(Core.promptHtml('Name the concept: A melody.'),'<strong>Name the concept:</strong> A melody.');
 assert.equal(Core.promptHtml('<img src=x onerror=alert(1)> Tick ONE box.'),'&lt;img src=x onerror=alert(1)&gt; Tick <strong>one</strong> box.');
});

test('retired questions are explicitly recorded and absent from active coverage',()=>{
 const retired=bank.retiredQuestions||[],ids=bank.retiredQuestionIds||[];
 assert.equal(new Set(ids).size,ids.length);
 assert.deepEqual(retired.map(q=>q.id).sort(),[...ids].sort());
 for(const q of retired){
  assert(!bank.questions.some(active=>active.id===q.id));
  const row=bank.coverage.find(row=>row.conceptId===q.conceptId);
  if(!row){assert(["MC-0036","MC-0185"].includes(q.conceptId));continue;}
  assert(row.retiredQuestionIds.includes(q.id));
  assert(!row.questionIds.includes(q.id));assert(Number.isFinite(Date.parse(q.deletedAt)));
 }
});

test('question-type settings recover an empty profile and cannot turn off the last active type',()=>{const box={window:{},MUSIC_CONCEPTS:require('../music-dictionary/music-concepts-data.js'),React:{createElement:(tag,props,...children)=>({tag,props,children})},MLH:{MenuSubheading:'heading',MenuToggleRow:'toggle'}};vm.runInNewContext(fs.readFileSync(path.join(root,'music-dictionary/music-concepts-quizzes.js'),'utf8'),box);const api=box.window.MusicDictionaryQuizzes,config=api.config({concepts:['MC-0001'],level:'N3',settings:{audioQuestions:false,nonAudioQuestions:false}});assert.equal(config.audioQuestions,true);assert.equal(config.nonAudioQuestions,true);for(const settings of [{audioQuestions:true,nonAudioQuestions:false},{audioQuestions:false,nonAudioQuestions:true}]){let changed=false;const tree=api.Options({settings,onChange:()=>changed=true});tree.children.filter(node=>node?.tag==='toggle').find(node=>node.props.checked).props.onChange();assert.equal(changed,false);}});

test('Multiple Choice controls listening selections and migrates older format settings',()=>{
 const box={window:{},MUSIC_CONCEPTS:require('../music-dictionary/music-concepts-data.js'),React:{createElement:(tag,props,...children)=>({tag,props,children})},MLH:{MenuSubheading:'heading',MenuToggleRow:'toggle'}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'music-dictionary/music-concepts-quizzes.js'),'utf8'),box);
 const api=box.window.MusicDictionaryQuizzes;
 const grouped=['multiple-choice','audio-select-2','audio-select-3','audio-select-4'];
 for(const format of grouped){
  assert.deepEqual(Array.from(api.normaliseSettings({formats:[format]}).formats),grouped);
 }
 let settings={formats:['audio-select-4','order'],audioQuestions:true,nonAudioQuestions:true};
 const toggles=()=>api.Options({settings,onChange:patch=>{settings={...settings,...patch};}}).children.at(-1);
 assert.deepEqual(Array.from(toggles(),toggle=>toggle.props.label),['Multiple Choice','Short Answer','Musical Features','Selection','Order']);
 const multipleChoice=()=>toggles().find(toggle=>toggle.props.label==='Multiple Choice').props;
 assert.equal(multipleChoice().checked,true);
 multipleChoice().onChange();
 assert.deepEqual(Array.from(settings.formats),['order']);
 multipleChoice().onChange();
 assert.deepEqual(Array.from(settings.formats),['order',...grouped]);
});

test('written clues accept plausible alternatives only where the wording supports them',()=>{
 const byId=id=>bank.questions.find(q=>q.id===id);
 const canon=byId('CQ-N4-MC0107-Q02');
 for(const answer of ['Canon','Fugue','fuge','Imitation','Round'])assert(Core.isCorrect(canon,answer),answer);
 assert(!Core.isCorrect(canon,'Unison'));
 assert(!Core.isCorrect(byId('CQ-AH-MC0290-02'),'Canon'));
 assert(!Core.isCorrect(byId('CQ-AH-000024'),'Fugue'));
 assert(Core.isCorrect(byId('CQ-N4-MC0109-Q02'),'Bridge'));
 assert(Core.isCorrect(byId('CQ-N5-MC0186-01'),'Bass ostinato'));
 assert(Core.isCorrect(byId('CQ-AH-MC0287-F02'),'Call and response'));
});

test('reconciling old saved answers adds alternatives only if the clue still matches',async()=>{
 const current=bank.questions.find(q=>q.id==='CQ-N4-MC0107-Q02');
 const migration=bank.reviewMigrations.findLast(m=>m.id===current.id&&m.teacherAuthorizedCorrection&&m.acceptedVariantPrompt===current.prompt);
 const old=Core.copy(current);
 old.evidence.find(evidence=>evidence.kind==='repository').sourceSha256='a328e807c9449de5ecd90064157e86b022bc965e591766f04d7daa3414b27f2c';
 old.answer.acceptedVariants=old.answer.acceptedVariants.filter(value=>!migration.acceptedVariantAdditions.includes(value));
 old.contentSha256=await Core.fingerprint(old);
 assert.equal(migration.from,old.contentSha256);
 const priorRecord=question=>({id:current.id,baseContentSha256:old.contentSha256,question});
 const upgraded=(await Core.applyReviews(bank,[priorRecord(old)])).get(current.id).question;
 assert(Core.isCorrect(upgraded,'Fugue'));
 const edited=await Core.saveQuestion(old,{...old,prompt:'Name the strict form in which each following voice copies the entire melody exactly.'});
 const customised=(await Core.applyReviews(bank,[priorRecord(edited)])).get(current.id).question;
 assert.equal(customised.prompt,edited.prompt);
 assert(!Core.isCorrect(customised,'Fugue'));
});
