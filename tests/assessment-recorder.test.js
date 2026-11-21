'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync('assessment-recorder/assessment-recorder.js', 'utf8');
const pageSource = fs.readFileSync('assessment-recorder/assessmentrecorder.html', 'utf8');

test('assessment dialogs expose accessible names and use precompiled Tailwind styles', () => {
  for (const [dialogId, titleId] of [
    ['recorderConfirmDialog', 'recorderImportTitle'],
    ['recorderClearDataDialog', 'recorderClearDataTitle'],
    ['classExportDialog', 'classExportTitle'],
    ['prelimPupilDialog', 'prelimPupilTitle']
  ]) {
    assert.match(pageSource, new RegExp(`<dialog[^>]*id="${dialogId}"[^>]*aria-labelledby="${titleId}"`));
    assert.match(pageSource, new RegExp(`id="${titleId}"`));
  }
  assert.match(pageSource, /vendor\/tailwind\/site\.css/);
  assert.doesNotMatch(pageSource, /tailwind-3\.4\.17\.js/);
});

test('prelim running order uses date and order, retaining row order for ties', () => {
  const context = vm.createContext({});
  vm.runInContext(fs.readFileSync('assessment-recorder/prelim-roster.js', 'utf8'), context);
  const {compareSchedule, formatDate} = context.AssessmentPrelimRoster;
  const rows = [
    {name:'No date', date:'', order:''},
    {name:'No order', date:'2026-03-02', order:''},
    {name:'Second', date:'2026-03-02', order:2, time:'08:30'},
    {name:'First', date:'2026-03-02', order:1, time:'09:00'},
    {name:'Same order', date:'2026-03-02', order:1, time:'07:45'}
  ];
  assert.deepEqual(rows.sort(compareSchedule).map(row => row.name), ['First','Same order','Second','No order','No date']);
  assert.equal(formatDate(rows[0].date), '02/03/26');
  assert.equal(formatDate(rows.at(-1).date), '');
});

test('Senior Phase recorder no longer ships unreachable generic-table controls', () => {
  assert.doesNotMatch(source, /COLUMN_ORDER_KEY|DEFAULT_COLUMN_ORDER|pupilColumnOrder|data-autofit-column|data-column-key|data-toggle-absent|data-record-field|data-export-csv/);
});

test('the date picker groups choices by roster and keeps older assessments accessible', () => {
  const toolbarSource = source.slice(source.indexOf('function sessionLabel('), source.indexOf('function hasExtraPieceContent('));
  const context = {
    state:{classes:[]}, view:{classId:null,assessmentId:null,date:'all'}, pupilSearch:'', esc:String,
    pupilFilterLabel:()=> 'Filter',
    currentClass:()=>null, currentAssessment:()=>null, lockedHeading:()=>'', sortableHeading:()=>'',
    window:{MLH:{ToolbarButtonClass:'toolbar-button'}, AssessmentPrelimRoster:{formatDate:() => '02/03/26'}}
  };
  const {dashboardToolbarHtml, dashboardHtml, rosterDateGroups} = vm.runInNewContext(`(() => { ${toolbarSource}; return {dashboardToolbarHtml, dashboardHtml, rosterDateGroups}; })()`, context);
  const empty = dashboardHtml();
  assert.match(empty, /<dialog[^>]*aria-labelledby="recorderSetupTitle"/);
  assert.match(empty, /recorder-start-import[^>]*data-import-assessments/);
  assert.match(empty, /assessment-roster-template\.xlsx/);
  assert.doesNotMatch(empty, /data-download-class-assessments|rosterPicker|Add Class|Add Assessment/);
  context.state.classes = [{id:'saved-roster', pupils:[], assessments:[]}];
  assert.doesNotMatch(dashboardHtml(), /recorderSetupTitle/);
  assert.match(dashboardHtml(), /<\/table>[\s\S]*data-add-pupil/);
  assert.match(dashboardToolbarHtml(), /data-download-class-assessments[\s\S]*data-clear-all-data/);
  assert.doesNotMatch(dashboardToolbarHtml(), /data-add-pupil/);

  const previousClass = {id:'old', name:'Higher', pupils:[{}], assessments:[{id:'a1',title:'Prelim'},{id:'a2',title:'Final'}]};
  const importedSession = {id:'new', name:'November Prelims', prelimRosterKey:'new-session',
    pupils:[{date:'2026-03-02'}, {date:'2026-03-03'}, {}], assessments:[{id:'b1',title:'Prelims'}]};
  context.state.classes = [previousClass, importedSession];
  context.view = {classId:'new',assessmentId:'b1',date:'2026-03-02'};
  const populated = dashboardToolbarHtml({hasDates:true, hasPupils:true});
  const groups = rosterDateGroups();
  assert.equal(groups.map(group=>group.heading).join('|'), 'Higher · Prelim|Higher · Final|November Prelims');
  assert.equal(groups[2].choices.find(choice=>choice.active).date, '2026-03-02');
  assert.equal(groups[2].choices.find(choice=>choice.date==='').label, 'Unassigned');
  assert.match(populated, /calendar\.svg[^>]*><span>Monday<\/span><span class="recorder-toolbar-selection">02\/03\/26<\/span>/);
  assert.match(populated, /id="rosterPicker"[\s\S]*data-download-class-assessments[\s\S]*id="recorderPupilSearch"[\s\S]*id="rosterFilter"/);
  const search = populated.match(/<input id="recorderPupilSearch"[^>]*>/)?.[0] ?? '';
  assert.match(search, /type="search" placeholder="Search"/);
  assert.doesNotMatch(search, /\bhidden\b/);
  context.view = {classId:'old',assessmentId:'a1',date:'all'};
  assert.match(dashboardToolbarHtml({hasPupils:true}), /title="Roster"/);
});

test('rosters hide unused date and order controls and show subtitles only when applicable', () => {
  const dashboardSource = source.slice(source.indexOf('function sessionLabel('), source.indexOf('function hasExtraPieceContent('));
  const pupils = [{id:'one',name:'Pupil One'}, {id:'two',name:'Pupil Two',teacher:'Sample Teacher'}];
  const assessment = {id:'a'};
  const klass = {id:'r',pupils,assessments:[assessment]};
  const context = {
    state:{classes:[klass]}, view:{classId:'r',assessmentId:'a',date:'all'},
    pupilSort:{}, pupilSearch:'', esc:value=>String(value ?? ''),
    currentClass:()=>klass, currentAssessment:()=>assessment, pupilsInRunningOrder:()=>pupils.slice(),
    pupilFilterLabel:()=> 'Filter', lockedHeading:label=>`<th>${label}</th>`, sortableHeading:()=> '',
    seniorInstrumentScaledMark:()=>'', seniorTotalMark:()=>'', assessmentRowProgress:()=> 'untouched',
    pupilProgressLabels:{untouched:'Not started'}, displayRosterLevel:value=>value, indexPupilDetails() {},
    window:{MLH:{ToolbarButtonClass:'toolbar-button'}, AssessmentPrelimRoster:{formatDate:()=>'02/03/26'}}
  };
  const dashboard = vm.runInNewContext(`(() => { ${dashboardSource}; return dashboardHtml; })()`,context);
  const undated = dashboard();
  assert.doesNotMatch(undated, /rosterPicker|order-cell|Unassigned|<th>Order/);
  assert.equal((undated.match(/class="roster-pupil-subtitle"/g) ?? []).length,1);
  assert.match(undated, /roster-pupil-subtitle">Sample Teacher<\/span>/);
  assert.match(undated, /colspan="7"/);

  pupils[0].date = '2026-03-02';
  pupils[0].order = 1;
  const mixed = dashboard();
  assert.match(mixed, /rosterPicker/);
  assert.match(mixed, /<th>Order<\/th>/);
  assert.match(mixed, /order-cell">–<\/td>/);
  assert.match(mixed, /Unassigned • Sample Teacher/);
  assert.match(mixed, /colspan="8"/);
});

test('roster search combines pupil details, pieces and filters', () => {
  const searchSource = source.slice(source.indexOf('function normalisePupilSearch('), source.indexOf('function assessmentHtml('));
  const rows = ['one', 'two'].map(pupilId => ({dataset:{pupilId}}));
  const empty = {}, label = {};
  const trigger = {classList:{toggle:(_name, active)=>{trigger.active=active;}}};
  const context = {
    pupilSearch:'sample elo nocturne duthie', pupilFilters:{}, pupilIndex:new Map(), BAND_OPTIONS:[],
    window:{AssessmentPrelimRoster:{formatDate:()=>'23/11/26'}},
    app:{querySelector:selector=>selector==='#rosterFilter' ? trigger : selector.includes('label') ? label : empty,querySelectorAll:()=>rows}
  };
  const {index, filter} = vm.runInNewContext(`(() => { ${searchSource}; return {index:indexPupilDetails, filter:filterPupilRows}; })()`, context);
  const klass = {name:'Prelim roster'}, assessment = {title:'Prelims'};
  index({id:'one',name:'Élodie Sample',date:'2026-11-23',assessor:'Miss Duthie'}, null, assessment, klass, {
    day:'Monday', level:'Advanced Higher', instruments:[{name:'Piano',pieces:[{title:'Nocturne'}]}], progressLabel:'Not started'
  });
  index({id:'two',name:'Jamie Example',assessor:'Mr Mackay'}, null, assessment, klass, {
    day:'Unassigned', level:'National 5', instruments:[{name:'Voice'}], progressLabel:'Not started'
  });
  filter();
  assert.deepEqual(rows.map(row=>row.hidden), [false,true]);
  assert.equal(empty.hidden, true);
  context.pupilSearch = 'monday adv. higher';
  filter();
  assert.deepEqual(rows.map(row=>row.hidden), [false,true]);
  context.pupilSearch = 'unassigned';
  filter();
  assert.deepEqual(rows.map(row=>row.hidden), [true,false]);
  context.pupilSearch = 'zzz';
  filter();
  assert.equal(empty.hidden, false);
  context.pupilSearch = '';
  context.pupilFilters = {level:'National 5', instrument:'Voice'};
  filter();
  assert.deepEqual(rows.map(row=>row.hidden), [true,false]);
  assert.equal(label.textContent, 'Filter (2)');
  assert.equal(trigger.active, true);
  context.pupilFilters = {};
  filter();
  assert.deepEqual(rows.map(row=>row.hidden), [false,false]);
  assert.equal(trigger.active, false);
  assert.equal(empty.hidden, true);
});

test('one spreadsheet produces one list across dates and assessors', () => {
  const rosterSource = fs.readFileSync('assessment-recorder/prelim-roster.js', 'utf8')
    .replace('{ read, compareSchedule, formatDate }', '{ organise, organiseLegacy, columns }');
  const context = vm.createContext({});
  vm.runInContext(rosterSource, context);
  const {organise, organiseLegacy, columns} = context.AssessmentPrelimRoster;
  const row = (number, values) => ({
    number, cells: new Map(Array.from(values, (value, index) => [String.fromCharCode(65 + index), value]))
  });
  const pupils = organise([
    row(5, columns),
    row(6, ['24/11/26','1','Next day','Higher','','Mr Mackay']),
    row(7, ['23/11/26','2','Second','National 5','','Mr Tennant']),
    row(8, ['23/11/26','1','First','Higher','','Miss Duthie','Piano','Piece A', ...Array(7).fill(''), 'Voice','Piece B'])
  ], false);
  assert.equal(pupils.length, 3);
  assert.equal(pupils.map(pupil => pupil.name).join(', '), 'First, Second, Next day');
  assert.equal(pupils.map(pupil => pupil.assessor).join(', '), 'Miss Duthie, Mr Tennant, Mr Mackay');
  assert.equal(pupils[0].instruments[1].name, 'Voice');
  assert.equal(pupils[0].instruments[1].pieces[0], 'Piece B');

  const insertTime = (values, time) => [...values.slice(0, 2), time, ...values.slice(2)];
  const legacyPupils = organise([
    row(5, insertTime(columns, 'Time')),
    row(6, insertTime(['23/11/26','1','First','Higher','','Miss Duthie','Piano','Piece A', ...Array(7).fill(''), 'Voice','Piece B'], 'unused')),
    row(7, ['', '', '09:15'])
  ], false);
  assert.deepEqual(legacyPupils, pupils.slice(0, 1));

  const sessionPupils = organiseLegacy([
    row(5, ['Session','Running Order','Pupil Name','Level','Teaching Class','Teacher','Assessor','Instrument 1','Pieces 1','Instrument 2','Pieces 2']),
    row(6, ['Monday','1','First','Higher','','Sample Teacher','','Piano','Piece A','Voice','Piece B']),
    row(7, ['Monday','2','Second','Higher','','Sample Teacher','Sample Assessor','Piano','Piece C','Voice','Piece D'])
  ]);
  assert.equal(sessionPupils.map(pupil => pupil.assessor).join(', '), 'Sample Assessor, Sample Assessor');
});

const backupSource = source.slice(source.indexOf('function normaliseAssessmentData('), source.indexOf('async function saveState('));
const {readAssessmentBackup, mergeBackupClasses} = vm.runInNewContext(`(() => {
  ${backupSource}
  return {readAssessmentBackup, mergeBackupClasses};
})()`);

test('JSON backups retain pupil records and reject malformed nested data', () => {
  const record = {seniorPhase:{instruments:[{name:'Bass Guitar',pieces:[{title:'First piece',score:0,comment:'Keep',ratings:{0:'poor'}}]}]}};
  const backup = {version:1,classes:[{id:'class-a',name:'Higher',pupils:[{id:'p1',name:'Pupil One',time:'09:15'}],assessments:[{id:'a1',title:'Prelims',records:{p1:record}}]}]};
  const restored = readAssessmentBackup(JSON.stringify(backup));
  assert.equal(restored.classes[0].assessments[0].title, 'Performance Assessment');
  assert.equal('time' in restored.classes[0].pupils[0], false);
  const instrument = restored.classes[0].assessments[0].records.p1.seniorPhase.instruments[0];
  assert.equal(instrument.name, 'Bass guitar');
  assert.equal(instrument.pieces[0].score, 0);
  assert.equal(instrument.pieces[0].comment, 'Keep');
  const pupil = backup.classes[0].pupils[0];
  pupil.date = '2026-02-30';
  assert.throws(() => readAssessmentBackup(JSON.stringify(backup)), /Invalid assessment backup/);
  pupil.date = '2026-02-28';
  pupil.teacher = 23;
  assert.throws(() => readAssessmentBackup(JSON.stringify(backup)), /Invalid assessment backup/);
  pupil.teacher = 'Teacher Example';
  assert.equal(readAssessmentBackup(JSON.stringify(backup)).classes[0].pupils[0].date, '2026-02-28');
  record.seniorPhase.instruments[0].pieces.push(...Array.from({length:8}, () => ({})));
  assert.throws(() => readAssessmentBackup(JSON.stringify(backup)), /Invalid assessment backup/);
  record.seniorPhase.instruments[0].pieces.length = 1;
  record.seniorPhase.instruments[0].pieces[0].score = 20;
  assert.throws(() => readAssessmentBackup(JSON.stringify(backup)), /Invalid assessment backup/);
  record.seniorPhase.instruments[0].pieces[0].score = 10;
  record.score = -1;
  assert.throws(() => readAssessmentBackup(JSON.stringify(backup)), /Invalid assessment backup/);
  record.score = 60;
  record.seniorPhase.instruments[0].pieces = {};
  assert.throws(() => readAssessmentBackup(JSON.stringify(backup)), /Invalid assessment backup/);
});

test('backup import replaces existing rosters by ID and keeps unrelated rosters', () => {
  const saved = {id:'class-a',name:'Higher',pupils:[],assessments:[]};
  const changed = {...saved,name:'Higher updated'};
  const added = {...saved,id:'class-b',name:'National 5'};
  const unrelated = {...saved,id:'class-c'};
  const merged = mergeBackupClasses([saved, unrelated], [changed, added]);
  assert.equal(merged[0], changed);
  assert.equal(merged[1], unrelated);
  assert.equal(merged[2], added);
  assert.equal(mergeBackupClasses(merged, [changed, added]).length, 3);
});

test('reimporting a revised Excel roster replaces its pupils and assessment records', async () => {
  const importSource = source.slice(source.indexOf('function prelimRosterClass('), source.indexOf('const clearDataDialog ='));
  const saved = {
    id:'roster-a', name:'November Prelims', prelimRosterKey:'workbook:old',
    pupils:[{id:'pupil-old', name:'Before'}],
    assessments:[{id:'old', records:{'pupil-old':{score:30, comment:'Old assessment'}}}]
  };
  const unrelated = {id:'roster-b', name:'Other roster'};
  const context = {
    state:{classes:[saved, unrelated]}, TextEncoder,
    crypto:{subtle:{digest:async () => Uint8Array.of(42).buffer}},
    window:{AssessmentPrelimRoster:{read:async () => [
      {name:'After', order:1, instruments:[{name:'Piano', pieces:['New piece']},{name:'Voice', pieces:[]}]}
    ]}},
    mergeBackupClasses, newSeniorInstrument:()=>({pieces:[{}]}),
    saveState:async (_message, state) => {context.state = state; return true;},
    render() {}, app:{querySelector:()=>null}, view:null, pupilSort:null, pupilSearch:'', pupilFilters:{}
  };
  let nextId = 0;
  context.newId = prefix => `${prefix}-${++nextId}`;
  const {importPrelimRoster, matchingWorkbookRoster} = vm.runInNewContext(`(() => { ${importSource}; return {importPrelimRoster, matchingWorkbookRoster}; })()`, context);
  const file = {name:'November Prelims.xlsx', arrayBuffer:async () => new ArrayBuffer(0)};
  await importPrelimRoster(file);
  const [replacement, other] = context.state.classes;
  assert.equal(replacement.id, saved.id);
  assert.equal(replacement.pupils[0].name, 'After');
  assert.equal(replacement.assessments.length, 1);
  assert.equal(replacement.assessments[0].title, 'Performance Assessment');
  const records = replacement.assessments[0].records;
  assert.deepEqual(Object.keys(records), [replacement.pupils[0].id]);
  assert.equal(records[replacement.pupils[0].id].score, '');
  assert.equal(other, unrelated);
  assert.equal(matchingWorkbookRoster(context.state.classes, 'Renamed file', 'workbook:2a'), replacement);
  assert.throws(() => matchingWorkbookRoster([saved, {...saved, id:'duplicate'}], saved.name, 'workbook:new'), /More than one/);
  await importPrelimRoster(file);
  assert.equal(context.state.classes.length, 2);
});

const functions = source.slice(source.indexOf('function seniorInstrumentScaledMark('), source.indexOf('function formatSeniorMark('));
const {seniorInstrumentScaledMark, seniorTotalMark} = vm.runInNewContext(`(() => { ${functions}; return {seniorInstrumentScaledMark, seniorTotalMark}; })()`);
const instrument = (...scores) => ({pieces:scores.map(score=>({score}))});
test('senior marks distinguish unassessed pieces from a real zero', () => {
  assert.equal(seniorInstrumentScaledMark(instrument('',null,undefined)), '');
  assert.equal(seniorInstrumentScaledMark(instrument(0)), 0);
  assert.equal(seniorInstrumentScaledMark(instrument(0,10,'')), 15);
});
test('two instrument averages scale to a total out of sixty', () => {
  assert.equal(seniorTotalMark({seniorPhase:{instruments:[instrument(8),instrument(6)]}}),42);
  assert.equal(seniorTotalMark({seniorPhase:{instruments:[instrument(10,10),instrument(10)]}}),60);
});

const scoreRowsSource = source.slice(source.indexOf('function classAssessmentScoreRows('), source.indexOf('let classAssessmentExportBusy'));
const scoreRows = vm.runInNewContext(`(() => { ${functions}; ${scoreRowsSource}; return classAssessmentScoreRows; })()`);
test('class score data includes raw and scaled marks, levels and the grid total only', () => {
  const klass = {pupils:[{id:'p1',name:'Pupil One'}]};
  const assessment = {records:{p1:{seniorPhase:{qualificationLevel:'Higher',instruments:[{name:'Piano',...instrument(8,6)},{name:'Voice',...instrument(10,8)}]}}}};
  const rows = JSON.parse(JSON.stringify(scoreRows(klass, assessment)));
  assert.equal(rows[0].length,9);
  assert.deepEqual(rows[1],['Pupil One','Higher','Piano',14,21,'Voice',18,27,48]);
});
test('class score data keeps missing marks blank and preserves genuine zeroes', () => {
  const klass={pupils:[{id:'blank',name:'Blank'},{id:'zero',name:'Zero'},{id:'partial',name:'Partial'}]};
  const assessment={records:{zero:{seniorPhase:{instruments:[instrument(0),instrument('')]}},partial:{seniorPhase:{instruments:[instrument(7),instrument('')]}}}};
  const rows=JSON.parse(JSON.stringify(scoreRows(klass,assessment)));
  assert.deepEqual(rows[1],['Blank','','','','','','','','']);
  assert.deepEqual(rows[2],['Zero','','',0,0,'','','',0]);
  assert.deepEqual(rows[3],['Partial','','',7,21,'','','',21]);
});

const progressSource = source.slice(source.indexOf('function recordStatus('), source.indexOf('function seniorInstrumentField('));
const rowProgress = vm.runInNewContext(`(() => { ${functions}; ${progressSource}; return assessmentRowProgress; })()`);
test('row progress distinguishes untouched, partial and complete assessments without relying on timestamps', () => {
  assert.equal(rowProgress(undefined),'untouched');
  assert.equal(rowProgress({updatedAt:'2026-10-25',seniorPhase:{qualificationLevel:'',instruments:[instrument(''),instrument('')]}}),'untouched');
  assert.equal(rowProgress({seniorPhase:{qualificationLevel:'Higher',instruments:[]}}),'untouched');
  assert.equal(rowProgress({seniorPhase:{instruments:[{name:'Voice',pieces:[{title:'A prepared piece'}]}]}}),'untouched');
  assert.equal(rowProgress({seniorPhase:{instruments:[{pieces:[{comment:'Feedback'}]}]}}),'partial');
  assert.equal(rowProgress({seniorPhase:{instruments:[instrument(0),instrument('')]}}),'partial');
  assert.equal(rowProgress({seniorPhase:{instruments:[instrument(0),instrument(0)]}}),'complete');
  assert.equal(rowProgress({seniorPhase:{instruments:[{pieces:[{score:'',ratings:{0:'secure'}}]}]}}),'partial');
  assert.equal(rowProgress({absent:true}),'untouched');
});

const seniorRecordSource = source.slice(source.indexOf('function newSeniorInstrument('), source.indexOf('function seniorInstrumentScaledMark('));
const seniorRecords = vm.runInNewContext(`(() => { ${seniorRecordSource}; return {newSeniorInstrument,ensureSeniorRecord}; })()`);
test('eight-piece records preserve existing marks and continuation content across normalisation', () => {
  const record={seniorPhase:{instruments:[{name:'Piano',pieces:[{title:'Existing',score:8,comment:'Keep',ratings:{0:'secure'}}]}]}};
  seniorRecords.ensureSeniorRecord(record);
  assert.equal(record.seniorPhase.instruments[0].pieces.length,8);
  assert.equal(record.seniorPhase.instruments[1].pieces.length,8);
  record.seniorPhase.instruments[0].pieces[7].score=10;
  seniorRecords.ensureSeniorRecord(record);
  assert.equal(record.seniorPhase.instruments[0].pieces[0].comment,'Keep');
  assert.equal(record.seniorPhase.instruments[0].pieces[7].score,10);
  assert.equal(seniorInstrumentScaledMark(record.seniorPhase.instruments[0]),27);
});
const instrumentRendererSource=source.slice(source.indexOf('function hasExtraPieceContent('),source.indexOf('function seniorAssessmentHtml('));
test('refresh restores the selected roster day and only reopens a pupil when the sheet was open', () => {
  const viewSource = source.slice(source.indexOf('function restoreRecorderView('), source.indexOf('function ensureRecord('));
  const dashboard = {mode:'dashboard', classId:null, assessmentId:null, pupilId:null};
  const selected = {mode:'assessment', classId:'roster', assessmentId:'prelim', pupilId:'pupil', date:'2026-11-24'};
  const storage = new Map();
  const context = {
    RECORDER_VIEW_KEY:'view',
    sessionStorage:{getItem:key=>storage.get(key) ?? null, setItem:(key,value)=>storage.set(key,value), removeItem:key=>storage.delete(key)},
    state:{classes:[{id:'roster', assessments:[{id:'prelim'}], pupils:[{id:'pupil'}]}]},
    view:selected
  };
  const {restoreRecorderView, rememberRecorderView} = vm.runInNewContext(`(() => { ${viewSource}; return {restoreRecorderView, rememberRecorderView}; })()`, context);
  rememberRecorderView();
  context.view = dashboard;
  restoreRecorderView();
  assert.deepEqual({...context.view}, selected);

  context.state.classes[0].pupils = [];
  context.view = dashboard;
  restoreRecorderView();
  assert.deepEqual({...context.view}, {...selected, mode:'dashboard', pupilId:null});
  context.state.classes[0].pupils = [{id:'pupil'}];

  for (const date of [selected.date, 'all', '']) {
    context.view = {...selected, mode:'dashboard', date};
    rememberRecorderView();
    context.view = dashboard;
    restoreRecorderView();
    assert.deepEqual({...context.view}, {...selected, mode:'dashboard', pupilId:null, date});
  }

  context.state.classes = [];
  context.view = dashboard;
  restoreRecorderView();
  assert.equal(context.view, dashboard);
  rememberRecorderView();
  assert.equal(storage.size, 0);
});

test('assessment arrows and position follow the current pupil’s day even in Show All', () => {
  const rosterContext = vm.createContext({});
  vm.runInContext(fs.readFileSync('assessment-recorder/prelim-roster.js', 'utf8'), rosterContext);
  const pupils = [
    {id:'last', name:'Last', date:'2026-11-23', order:3},
    {id:'other-day', name:'Other day', date:'2026-11-24', order:1},
    {id:'middle', name:'Middle', date:'2026-11-23', order:2},
    {id:'first', name:'First', date:'2026-11-23', order:1},
    {id:'undated', name:'Undated'}
  ];
  const view = {date:'all', pupilId:'middle'};
  const records = {middle:{}, last:{}};
  const context = {
    view, currentClass:()=>({pupils, prelimRosterKey:'roster'}), currentAssessment:()=>({}),
    currentPupil:()=>pupils.find(pupil=>pupil.id===view.pupilId),
    ensureRecord:(_assessment, pupil)=>records[pupil.id] ?? {}, ensureSeniorRecord:()=>({instruments:[]}),
    seniorInstrumentScaledMark:()=>'', seniorTotalMark:()=>'', SENIOR_TEMPLATE:{},
    esc:value=>String(value ?? ''),
    window:{MLH:{ToolbarButtonClass:'toolbar-button'}, AssessmentPrelimRoster:rosterContext.AssessmentPrelimRoster}
  };
  const renderer = source.slice(source.indexOf('function seniorAssessmentHtml('), source.indexOf('// Reuse the assessment renderer'));
  const runningOrder = source.slice(source.indexOf('function pupilsInRunningOrder('), source.indexOf('function normalisePupilSearch('));
  const assessment = source.slice(source.indexOf('function assessmentHtml('), source.indexOf('function render()'));
  const renderSheet = vm.runInNewContext(`(() => { ${renderer}; ${runningOrder}; ${assessment}; return assessmentHtml; })()`, context);
  const middle = renderSheet();
  assert.match(middle, /class="sheet-position" aria-hidden="true">2\/3</);
  assert.match(middle, /data-pupil-direction="previous" data-open-pupil="first"/);
  assert.match(middle, /data-pupil-direction="next" data-open-pupil="last"/);
  assert.match(middle, /class="sheet-pupil-name">Middle<\/strong>\s*<button[^>]*data-edit-prelim-pupil>Edit<\/button>/);
  assert.equal((middle.match(/data-edit-prelim-pupil/g) ?? []).length, 1);
  records.middle.locked = true;
  const locked = renderSheet();
  assert.match(locked, /data-toggle-sheet-lock[^>]*aria-pressed="true"[^>]*>[\s\S]*?<span>Locked<\/span>/);
  assert.match(locked, /<fieldset class="sheet-scroll"[^>]* disabled>/);
  assert.match(locked, /data-edit-prelim-pupil disabled/);
  assert.match(locked, /aria-label="Next pupil"\s*>/);
  view.pupilId = 'last';
  assert.match(renderSheet(), /data-toggle-sheet-lock[^>]*aria-pressed="false"[^>]*>[\s\S]*?<span>Unlocked<\/span>/);
  view.pupilId = 'middle';
  assert.match(renderSheet(), /data-toggle-sheet-lock[^>]*aria-pressed="true"/);
  for (const pupilId of ['other-day', 'undated']) {
    view.pupilId = pupilId;
    const sheet = renderSheet();
    assert.match(sheet, /class="sheet-position" aria-hidden="true">1\/1</);
    assert.equal((sheet.match(/aria-label="(?:Previous|Next) pupil" disabled/g) ?? []).length, 2);
  }
});

const instrumentPages=vm.runInNewContext(`(() => { ${functions}; ${instrumentRendererSource}; return {seniorInstrumentPageHtml,usesExtraPieces}; })()`,{
  esc:value=>String(value??''), BAND_OPTIONS:[{id:'secure',label:'Secure',range:'7–8'}], seniorInstrumentField:()=>'<input class="instrument-entry-test">'
});
test('optional continuation renders pieces five to eight with original indices and one instrument entry',()=>{
  const phase={instruments:[seniorRecords.newSeniorInstrument()]};
  assert.equal(instrumentPages.usesExtraPieces(phase.instruments[0]),false);
  phase.instruments[0].extraPieces=true;
  phase.instruments[0].name='Guitar';
  assert.equal(instrumentPages.usesExtraPieces(phase.instruments[0]),true);
  const template={criteria:[['Accuracy','']]};
  const first=instrumentPages.seniorInstrumentPageHtml(template,phase,0);
  const second=instrumentPages.seniorInstrumentPageHtml(template,phase,0,true);
  assert.match(first,/Piece 1 —/);
  assert.match(first,/Piece 4 —/);
  assert.doesNotMatch(first,/Piece 5 —|FINAL SCALED MARK/);
  assert.match(first,/instrument-entry-test/);
  assert.match(second,/Instrument 1 \/ voice:/);
  assert.match(second,/data-instrument-carried="0">Guitar<\/div>/);
  assert.doesNotMatch(second,/Pieces 5-8/);
  assert.match(second,/Piece 5 —/);
  assert.match(second,/Piece 8 —/);
  assert.match(second,/data-piece-index="7"/);
  assert.match(second,/FINAL SCALED MARK/);
  assert.doesNotMatch(second,/instrument-entry-test|Piece 4 —/);
  phase.instruments[0].extraPieces=false;
  phase.instruments[0].pieces[7].score=0;
  assert.equal(instrumentPages.usesExtraPieces(phase.instruments[0]),true);
});

const pdfRenderer = require('../assessment-recorder/assessment-pdf.js');
test('PDF and grid use identical raw and scaled marks, including eight-piece zeroes', () => {
  for (const data of [instrument(''),instrument(0),instrument(8,6),instrument(9,8,7,6,5,4,3,0)]) {
    const result=pdfRenderer.marks(data);
    assert.equal(result.scaled,seniorInstrumentScaledMark(data));
    assert.equal(result.raw,result.scaled===''?'':data.pieces.filter(piece=>piece.score!==''&&piece.score!=null).reduce((sum,piece)=>sum+Number(piece.score),0));
  }
});

const extraHelpers = source.slice(source.indexOf('function hasExtraPieceContent('),source.indexOf('function seniorInstrumentPageHtml('));
const exportPlanSource = source.slice(source.indexOf('function classExportPlan('),source.indexOf('function classExportDialogOptions('));
const runningOrderSource = source.slice(source.indexOf('function pupilsInRunningOrder('), source.indexOf('function normalisePupilSearch('));
const exportPlanContext = vm.createContext({});
vm.runInContext(fs.readFileSync('assessment-recorder/prelim-roster.js', 'utf8'), exportPlanContext);
exportPlanContext.window = {AssessmentPrelimRoster:exportPlanContext.AssessmentPrelimRoster};
const exportPlan = vm.runInContext(`(() => { ${functions}; ${progressSource}; ${extraHelpers}; ${runningOrderSource}; ${exportPlanSource}; return classExportPlan; })()`,exportPlanContext);
test('export options filter pupils and count chosen sheets including optional continuation pages',()=>{
  const klass={pupils:[{id:'a',name:'A'},{id:'b',name:'B'}]};
  const assessment={records:{a:{seniorPhase:{instruments:[{...instrument(8),extraPieces:true},instrument(7)]}}}};
  const options={pupilId:'all',pdf:true,scores:true,cover:true,instrument1:true,instrument2:true,extraPages:true};
  assert.equal(exportPlan(klass,assessment,'download',options).pageCount,7);
  const single=exportPlan(klass,assessment,'print',{...options,pupilId:'a',instrument2:false});
  assert.equal(single.pupils.length,1);
  assert.equal(single.pageCount,3);
  assert.equal(single.includeScores,false);
  assert.equal(exportPlan(klass,assessment,'print',{...options,extraPages:false}).pageCount,6);
});
test('export options allow spreadsheet-only downloads and reject empty selections',()=>{
  const klass={pupils:[{id:'a'}]},assessment={records:{}};
  const options={pupilId:'all',pdf:false,scores:true,cover:false,instrument1:false,instrument2:false,extraPages:true};
  const scoresOnly=exportPlan(klass,assessment,'download',options);
  assert.equal(scoresOnly.valid,true);assert.equal(scoresOnly.pageCount,0);assert.equal(scoresOnly.includePdf,false);
  assert.equal(exportPlan(klass,assessment,'download',{...options,scores:false}).valid,false);
  assert.equal(exportPlan(klass,assessment,'print',options).valid,false);
  assert.equal(exportPlan(klass,assessment,'download',{...options,pupilId:'missing'}).valid,false);
});

test('downloads include all dates and unassigned pupils, while print follows the selected date', () => {
  const pupils = [
    {id:'a', date:'2026-11-23', order:2},
    {id:'b', date:'2026-11-23', order:1},
    {id:'c', date:'2026-11-24', order:1},
    {id:'d', date:'', order:1}
  ];
  const klass = {pupils, prelimRosterKey:'roster'};
  const assessment = {records:{}};
  for (const [date, expected] of [['2026-11-23', 'b,a,d'], ['2026-11-24', 'c,d'], ['all', 'b,a,c,d'], ['', 'd']]) {
    const plan = exportPlan(klass, assessment, 'print',
      {pupilId:'all', date, cover:true});
    assert.equal(plan.pupils.map(pupil => pupil.id).join(','), expected);
    const download = exportPlan(klass, assessment, 'download',
      {pupilId:'all', date, scores:true});
    assert.equal(download.pupils.map(pupil => pupil.id).join(','), 'b,a,c,d');
  }
  assert.equal(pupils.map(pupil => pupil.id).join(','), 'a,b,c,d');
});

test('all-roster downloads include every assessment and individual selections use roster identity', () => {
  const sources = [
    {id:'first', pupils:[{id:'shared', date:'2026-11-23'}], assessments:[{id:'a'},{id:'b'}]},
    {id:'second', pupils:[{id:'shared', date:'2026-11-24'}], assessments:[{id:'a'}]}
  ];
  const plan = vm.runInNewContext(
    `(() => { ${runningOrderSource}; ${exportPlanSource}; return options => assessmentExportGroups(assessmentExportSources("download"),"download",options); })()`,
    {state:{classes:sources}, window:exportPlanContext.window}
  );
  const options = {pupilId:'all', date:'2026-11-23', scores:true};
  assert.equal(plan(options).map(group => `${group.klass.id}/${group.assessment.id}`).join(','), 'first/a,first/b,second/a');
  const selected = plan({...options, pupilId:JSON.stringify(['second','a','shared'])});
  assert.equal(selected.length, 1);
  assert.equal(selected[0].klass.id, 'second');
});

test('instrument names save on input before blur or navigation', () => {
  const instrumentEntry = {name:'',nameMode:'other',pieces:[]};
  const carriedLabel = {textContent:''};
  const record = {seniorPhase:{instruments:[instrumentEntry]}};
  let inputHandler;
  let saves = 0;
  const listener = source.slice(source.indexOf('      app.addEventListener("input",'), source.indexOf('      app.addEventListener("wheel",'));
  vm.runInNewContext(listener, {
    app:{addEventListener:(type,handler)=>{ inputHandler=handler; },querySelectorAll:()=>[carriedLabel]},
    ensureRecord:()=>record, currentAssessment:()=>({}), currentPupil:()=>({}),
    ensureSeniorRecord:value=>value.seniorPhase,
    INSTRUMENT_OPTIONS:[{value:'Keyboard'}], saveState:()=>{ saves++; }
  });
  inputHandler({target:{value:' Keyboard ',dataset:{seniorInstrumentName:'0'},matches:selector=>selector==='[data-senior-instrument-name]'}});
  assert.equal(instrumentEntry.name,'Keyboard');
  assert.equal(carriedLabel.textContent,'Keyboard');
  assert.equal(instrumentEntry.nameMode,undefined);
  assert.equal(saves,1);
  inputHandler({target:{value:'',dataset:{seniorInstrumentName:'0'},matches:selector=>selector==='[data-senior-instrument-name]'}});
  assert.equal(instrumentEntry.name,'');
  assert.equal(saves,2);
});

test('senior ticks immediately average marked criteria and clear the score after the last tick is removed', () => {
  const bandSource = source.slice(source.indexOf('const BAND_OPTIONS ='),source.indexOf('const INSTRUMENT_OPTIONS ='));
  const averageSource = source.slice(source.indexOf('function calculatedMark('),source.indexOf('function newSeniorInstrument('));
  const clickSource = source.slice(source.indexOf('        if (target.dataset.seniorRating) {'),source.indexOf('        if (target.dataset.seniorScoreStep) {'));
  const piece = {score:'',ratings:{}};
  const record = {seniorPhase:{instruments:[{pieces:[piece]}]}};
  let synced = 0;
  const context = vm.createContext({
    target:{dataset:{}}, ensureRecord:()=>record, currentAssessment:()=>({}),currentPupil:()=>({}),
    ensureSeniorRecord:value=>value.seniorPhase,syncSeniorScore:()=>{synced++;},saveState:()=>{},render:()=>{},
    app:{querySelector:selector=>({focus:()=>{context.focused = selector;}})}
  });
  vm.runInContext(bandSource+averageSource,context);
  const tick = (criterion,band) => {
    context.target.dataset.seniorRating=`0:0:${criterion}:${band}`;
    vm.runInContext(`(() => { ${clickSource} })()`,context);
  };
  tick(1,'secure'); // Drum kit: no melodic accuracy or dynamics tick required.
  assert.equal(piece.score,8);
  tick(2,'mainly');
  assert.equal(piece.score,7);
  tick(1,'excellent');
  assert.equal(piece.score,8);
  tick(2,'mainly');
  assert.equal(piece.score,10);
  tick(1,'excellent');
  assert.equal(piece.score,'');
  assert.equal(synced,5);
  assert.equal(context.focused, '[data-senior-rating="0:0:1:excellent"]');
});

test('the mark stepper leaves an unassessed mark blank when decreasing it', () => {
  const stepSource = source.slice(source.indexOf('        if (target.dataset.seniorScoreStep) {'), source.indexOf('      app.addEventListener("keydown",'));
  const handler = stepSource.slice(0, stepSource.lastIndexOf('      });'));
  const piece = {score:''};
  const context = {
    target:{dataset:{instrumentIndex:'0',pieceIndex:'0',seniorScoreStep:'-1'}},
    ensureRecord:()=>({}), currentAssessment:()=>({}), currentPupil:()=>({}),
    ensureSeniorRecord:()=>({instruments:[{pieces:[piece]}]}), syncSeniorScore() {}, saveState() {}, render() {},
    app:{querySelector:()=>null}
  };
  const step = vm.runInNewContext(`(() => { return () => { ${handler} }; })()`,context);
  step();
  assert.equal(piece.score,'');
  context.target.dataset.seniorScoreStep = '1';
  step();
  assert.equal(piece.score,1);
  context.target.dataset.seniorScoreStep = '-1';
  step();
  assert.equal(piece.score,0);
});

test('final total equals the displayed rounded instrument marks in the grid, spreadsheet and PDF cover', () => {
  const record={seniorPhase:{instruments:[instrument(6,7),instrument(7,8)]}};
  assert.equal(seniorTotalMark(record),43); // 19.5 -> 20 and 22.5 -> 23.
  assert.equal(scoreRows({pupils:[{id:'p',name:'Test'}]},{records:{p:record}})[1][8],43);
  const texts=[];
  const pdf=new Proxy({}, {get:(_,key)=>key==='splitTextToSize'?text=>[text]:key==='text'?(value)=>texts.push(value):()=>{}});
  pdf._assessmentPages=0;
  pdfRenderer.cover(pdf,{instruments:record.seniorPhase.instruments,options:{level:false,name:false,quavers:false}});
  assert.ok(texts.flat().includes('43 /60'));
});

test('a named or commented unscored piece prevents a completed row', () => {
  const record={seniorPhase:{instruments:[instrument(8),instrument(9)]}};
  record.seniorPhase.instruments[0].pieces.push({title:'Not yet assessed',score:'',ratings:{}});
  assert.equal(rowProgress(record),'partial');
  record.seniorPhase.instruments[0].pieces[1].score=0;
  assert.equal(rowProgress(record),'complete');
});

test('explicitly clearing a pupil level persists while new records inherit the assessment level', () => {
  const ensureSource=source.slice(source.indexOf('function ensureRecord('),source.indexOf('function calculatedMark('));
  const ensure=vm.runInNewContext(`(() => { ${seniorRecordSource}; ${ensureSource}; return ensureRecord; })()`);
  const assessment={qualificationLevel:'Higher',records:{}};
  const record=ensure(assessment,{id:'p'});
  assert.equal(record.seniorPhase.qualificationLevel,'Higher');
  record.seniorPhase.qualificationLevel='';
  assert.equal(ensure(assessment,{id:'p'}).seniorPhase.qualificationLevel,'');
  const row=scoreRows({pupils:[{id:'p',name:'P'}]},assessment)[1];
  assert.equal(row[1],'');
});

test('manual score input updates totals without replacing the field or losing the next interaction', () => {
  const fieldSource=source.slice(source.indexOf('function updateSeniorPieceField('),source.indexOf('      app.addEventListener("click",'));
  const raw={textContent:''},scaled={innerHTML:''};
  const record={seniorPhase:{instruments:[instrument(''),instrument('')]}};
  const update=vm.runInNewContext(`(() => { ${functions}; ${fieldSource}; return updateSeniorPieceField; })()`,{
    currentAssessment:()=>({}),currentPupil:()=>({}),ensureRecord:()=>record,ensureSeniorRecord:r=>r.seniorPhase,
    syncSeniorScore:()=>{},saveState:()=>{},app:{querySelectorAll:()=>[{querySelector:selector=>selector.includes('.raw)')?scaled:raw}]}
  });
  const input={value:'0',dataset:{instrumentIndex:'0',pieceIndex:'0',seniorPieceField:'score'}};
  update(input);
  assert.equal(record.seniorPhase.instruments[0].pieces[0].score,0);
  assert.equal(raw.textContent,0);
  assert.equal(scaled.innerHTML,'0<strong>/30</strong>');
  input.value='';
  input.validity={badInput:true};
  update(input);
  assert.equal(record.seniorPhase.instruments[0].pieces[0].score,0);
  update(input,{restoreInvalid:true});
  assert.equal(input.value,0);
  input.validity.badInput=false;
  input.value='';update(input);
  assert.equal(raw.textContent,'');
  assert.equal(scaled.innerHTML,'<strong>/30</strong>');
});

test('adding an unmarked piece to a completed assessment clears the completion date', () => {
  const fieldSource = source.slice(source.indexOf('function updateSeniorPieceField('), source.indexOf('      app.addEventListener("click",'));
  const syncSource = source.slice(source.indexOf('function syncSeniorScore('),source.indexOf('function seniorInstrumentField('));
  const record = {completedAt:'2026-11-21', seniorPhase:{instruments:[instrument(8, ''),instrument(8)]}};
  const update = vm.runInNewContext(`(() => { ${functions}; ${syncSource}; ${fieldSource}; return updateSeniorPieceField; })()`,{
    currentAssessment:()=>({}), currentPupil:()=>({}), ensureRecord:()=>record, ensureSeniorRecord:r=>r.seniorPhase,
    saveState() {}
  });
  const dataset = {instrumentIndex:'0',pieceIndex:'1',seniorPieceField:'title'};
  update({value:'Another piece',dataset});
  assert.equal(record.completedAt,undefined);
  update({value:'',dataset});
  assert.ok(record.completedAt);
});

test('downloads create one separate PDF per selected pupil and package files without merging pupils', async () => {
  const outputSource=source.slice(source.indexOf('async function outputClassAssessments('),source.indexOf('function assessmentHtml('));
  for (const [count,scores,rosterCount = 1] of [[2,true],[2,false],[1,false],[1,true],[2,true,2]]) {
    const pupils=Array.from({length:count},(_,i)=>({id:`p${i}`,name:`Pupil ${i+1}`}));
    const assessment={id:'a',title:'Prelim',records:{}};
    const sources=Array.from({length:rosterCount},(_,i)=>({
      klass:{name:'Class',pupils:rosterCount === 1 ? pupils : [pupils[i]],assessments:[assessment]}, assessment
    }));
    const documents=[],archives=[],downloads=[];
    const status={textContent:''};
    class Zip {
      constructor(){this.files=[];archives.push(this);}
      file(name,data){this.files.push({name,data});}
      async generateAsync(){return this.files;}
    }
    const output=vm.runInNewContext(`(() => { let classAssessmentExportBusy=false; ${outputSource}; return outputClassAssessments; })()`,{
      assessmentExportSources:()=>sources,
      assessmentExportGroups:sources=>sources.map(source=>({...source,pupils:source.klass.pupils,includePdf:true,includeScores:scores})),
      app:{querySelectorAll:()=>[],querySelector:()=>status},window:{JSZip:Zip},
      newAssessmentPdf:async()=>{
        const entries=[];documents.push(entries);
        return {pdf:{output:()=>entries.join('|')},graphic:''};
      },
      ensureRecord:()=>({}),drawAssessmentPdfPages:(pdf,graphic,record,name)=>documents.at(-1).push(name),
      newAssessmentSpreadsheet:async()=>new Uint8Array([1,2,3]),
      download:(name,type,data)=>downloads.push({name,type,data})
    });
    await output('download',{pdf:true,scores});
    assert.equal(documents.length,count);
    assert.deepEqual(documents,pupils.map(p=>[p.name]));
    assert.equal(downloads.length,1);
    if(count>1||scores){
      assert.equal(downloads[0].type,'application/zip');
      const pdfs=archives[0].files.filter(file=>file.name.endsWith('.pdf'));
      assert.equal(pdfs.length,count);
      pdfs.forEach((file,i)=>assert.equal(file.data,pupils[i].name));
      const spreadsheets=archives[0].files.filter(file=>file.name.endsWith('.xlsx'));
      assert.equal(spreadsheets.length,scores ? rosterCount : 0);
      assert.equal(new Set(spreadsheets.map(file=>file.name)).size,spreadsheets.length);
    } else {
      assert.equal(downloads[0].type,'application/pdf');
      assert.match(downloads[0].name,/Pupil 1 - Prelim\.pdf$/);
      assert.equal(archives.length,0);
    }
  }
});

test('long PDF comments stay inside the grid and retain their full text on additional pages', () => {
  const {jsPDF}=require('../digital-question-papers/vendor/jspdf-2.5.2.umd.min.js');
  const fonts={regular:fs.readFileSync('fonts/Trebuchet MS.ttf').toString('base64'),bold:fs.readFileSync('fonts/Trebuchet MS Bold.ttf').toString('base64')};
  const pdf=pdfRenderer.create(jsPDF,fonts);
  const comment='Keep the pulse steady and shape each phrase with clear dynamic contrast. '.repeat(150).trim();
  pdfRenderer.instrument(pdf,{instrument:{name:'Drum kit',pieces:[{score:8,comment,ratings:{1:'secure'}}]}});
  assert.equal(pdf._assessmentOverflow.length,1);
  assert.equal(pdf._assessmentOverflow[0].comment,comment);
  const written=[];
  const originalText=pdf.text.bind(pdf);
  pdf.text=(value,x,y,options={})=>{
    const lines=Array.isArray(value)?value:[value];
    if(pdf.getFontSize()===11) written.push(lines.join(' '));
    const lastY=y+(lines.length-1)*(options.lineHeightFactor||1.15)*pdf.getFontSize()*25.4/72;
    assert.ok(y>=0 && lastY<290,'additional comment text remains on the page');
    return originalText(value,x,y,options);
  };
  pdfRenderer.additionalComments(pdf,{pupilName:'Test Pupil',title:'Test'});
  assert.ok(pdf.getNumberOfPages()>2);
  assert.equal(pdf._assessmentOverflow.length,0);
  const text=written.join(' ').replace(/\s+/g,' ');
  // Every sentence is retained across page boundaries.
  assert.equal((text.match(/Keep the pulse steady and shape each phrase with clear dynamic contrast\./g)||[]).length,150);
});

test('a long PDF piece title stays inside the row and is retained in full on an additional page', () => {
  const {jsPDF} = require('../digital-question-papers/vendor/jspdf-2.5.2.umd.min.js');
  const fonts = {regular:fs.readFileSync('fonts/Trebuchet MS.ttf').toString('base64'),bold:fs.readFileSync('fonts/Trebuchet MS Bold.ttf').toString('base64')};
  const pdf = pdfRenderer.create(jsPDF, fonts);
  const title = 'Variations on an original theme '.repeat(40).trim();
  const written = [];
  const originalText = pdf.text.bind(pdf);
  pdf.text = (value,...args) => {
    written.push(Array.isArray(value) ? value.join(' ') : value);
    return originalText(value,...args);
  };
  pdfRenderer.instrument(pdf,{instrument:{pieces:[{title}]}});
  assert.equal(pdf._assessmentOverflow[0].comment,title);
  assert.ok(written.some(text => text.includes('See additional details.')));
  assert.ok(written.every(text => !text.includes(title)));
  pdfRenderer.additionalComments(pdf);
  assert.match(written.slice(written.indexOf('Additional assessment details')).join(' '), /Variations on an original theme/);
  assert.match(written.join(' '), new RegExp(title));
});

const saveSource=source.slice(source.indexOf('async function saveState('),source.indexOf('function esc('));
test('storage failures warn the user without reporting a successful save or changing its timestamp', async () => {
  const state={savedAt:'previous-save',classes:[]};
  const messages=[];
  const save=vm.runInNewContext(`(() => { ${saveSource}; return saveState; })()`,{
    state,STORAGE_KEY:'test',savedSnapshot:null,localStorage:{getItem:()=>null,setItem:()=>{throw Error('Quota exceeded');}},
    console:{warn:()=>{}},showToast:(message,duration)=>messages.push({message,duration})
  });
  assert.equal(await save('Saved'),false);
  assert.equal(state.savedAt,'previous-save');
  assert.equal(messages.length,1);
  assert.match(messages[0].message,/could not be saved/);
  assert.equal(messages[0].duration,8000);
});

test('opening a pupil in another tab writes nothing and stale saves cannot overwrite saved marks', async () => {
  const openSource = source.slice(source.indexOf('function openPupil('), source.indexOf('function updateSeniorPieceField('));
  let snapshot = JSON.stringify({classes:[{score:''}],savedAt:null});
  let queue = Promise.resolve();
  const navigator = {locks:{request: (_key, write) => (queue = queue.then(write))}};
  const messages = [];
  const makeTab = () => {
    const context = {
      state:JSON.parse(snapshot), savedSnapshot:snapshot, STORAGE_KEY:'test', navigator,
      localStorage:{getItem:()=>snapshot, setItem:(_key,value)=>{snapshot=value;}},
      view:{}, render() {}, window:{scrollTo() {}}, showToast:message=>messages.push(message)
    };
    const actions = vm.runInNewContext(`(() => { ${saveSource}; ${openSource}; return {saveState,openPupil}; })()`,context);
    return {state:context.state, ...actions};
  };
  const first = makeTab(), second = makeTab();
  first.state.classes[0].score = 25;
  const firstSave = first.saveState('');
  second.openPupil('pupil');
  second.state.classes[0].score = 5;
  const secondSave = second.saveState('');
  assert.deepEqual(await Promise.all([firstSave,secondSave]), [true,false]);
  assert.equal(JSON.parse(snapshot).classes[0].score,25);
  assert.equal(second.state.classes[0].score,5);
  assert.match(messages[0], /This change was not saved/);

  const stale = makeTab();
  assert.equal(await first.saveState('All assessment data cleared.', {version:1, classes:[]}), true);
  assert.deepEqual(JSON.parse(snapshot).classes, []);
  assert.equal(await stale.saveState(''), false);
  assert.deepEqual(JSON.parse(snapshot).classes, []);
});

test('leaving the worksheet builder during PDF preparation does not redraw a missing preview or allow duplicate exports', async () => {
  const blankOutputSource=source.slice(source.indexOf('async function outputBlankAssessmentPdf('),source.indexOf('function classAssessmentScoreRows('));
  let resolvePdf;
  const pending=new Promise(resolve=>{resolvePdf=resolve;});
  let preparations=0,saves=0,previews=0;
  let buttons=[{disabled:false,matches:()=>false},{disabled:false,matches:()=>false}];
  const error={};
  const output=vm.runInNewContext(`(() => { let assessmentWorksheetPreparing=false; ${blankOutputSource}; return outputBlankAssessmentPdf; })()`,{
    app:{querySelectorAll:()=>buttons,querySelector:selector=>selector==='.assessment-worksheet-builder'?null:selector==='.assessment-worksheet-error'?error:{}},
    assessmentWorksheetOptions:()=>({}),ensureSeniorRecord:()=>({instruments:[]}),
    newAssessmentPdf:()=>{preparations++;return pending;},drawAssessmentPdfPages:()=>{},
    updateAssessmentWorksheetPreview:()=>{previews++;}
  });
  const first=output('download');
  // Simulate a freshly opened builder, whose buttons are new elements.
  buttons=[{disabled:false},{disabled:false}];
  await output('download');
  assert.equal(preparations,1);
  resolvePdf({pdf:{save:()=>{saves++;}},graphic:''});
  await first;
  assert.equal(saves,1);
  assert.equal(previews,0);
  assert.equal(error.hidden,true);
});

test('formatted Excel exports preserve numbers, blanks, literal names, filters and frozen headings', async () => {
  const JSZip=require('../vendor/jszip/jszip.min.js');
  const spreadsheet=require('../assessment-recorder/assessment-spreadsheet.js');
  const rows=[Array(9).fill('Header'),
    ['Pupil <One> & Two','Higher','Drum kit',0,0,'Voice','','',0],
    ['=SUM(1,2)','National 5','Keyboard',20,15,'Bass guitar',18,14,29],
    ['Blank','Advanced Higher','','','','','','','']];
  const data=await spreadsheet.create(JSZip,fs.readFileSync('assessment-recorder/assessment-scores-template.xlsx'),rows,{className:'Test class',assessmentName:'Prelim'});
  const zip=await JSZip.loadAsync(data);
  const sheet=await zip.file('xl/worksheets/sheet1.xml').async('string');
  const table=await zip.file('xl/tables/table1.xml').async('string');
  assert.match(sheet,/Pupil &lt;One&gt; &amp; Two/);
  assert.match(sheet,/<x:t xml:space="preserve">=SUM\(1,2\)<\/x:t>/);
  assert.doesNotMatch(sheet,/<x:f[ >]/);
  assert.doesNotMatch(sheet,/Sample Pupil|Second Pupil/);
  assert.match(sheet,/<x:c r="D6" s="\d+" t="n"><x:v>0<\/x:v>/);
  assert.match(sheet,/<x:c r="G6" s="\d+"\/>/);
  assert.match(sheet,/xSplit="2" ySplit="5"/);
  assert.match(sheet,/sqref="E6:E8"/);
  assert.match(sheet,/sqref="I6:I8"/);
  assert.match(table,/ref="A5:I8"/);
  assert.match(sheet,/Test class · Prelim/);
});


test('assessment sort directions use SVG icons instead of system arrow glyphs',()=>{
 const fn=source.slice(source.indexOf('function sortableHeading('),source.indexOf('function lockedHeading('));
 for(const [key,direction]of [['other','ascending'],['pupil','ascending'],['pupil','descending']]){
  const context={pupilSort:{key,direction}};vm.runInNewContext(fn,context);
  const html=context.sortableHeading('pupil','Pupil');
  assert.match(html,/<svg[^>]*viewBox="0 0 12 16"/);
  assert.doesNotMatch(html,/[↕▲▼]/);
  assert.ok(html.includes('aria-sort="'+(key==='pupil'?direction:'none')+'"'));
 }
});

test('scaled assessment papers disable Safari text inflation without changing document scale',()=>{
 const css=fs.readFileSync('assessment-recorder/assessment-recorder.css','utf8');
 assert.match(css,/\.senior-pages,\.senior-pages \*\{[^}]*-webkit-text-size-adjust:none;[^}]*text-size-adjust:none/);
 assert.match(fs.readFileSync('assessment-recorder/blank-template.css','utf8'),/\.assessment-template-preview \.senior-pages \{[^}]*zoom:\.5/);
});
