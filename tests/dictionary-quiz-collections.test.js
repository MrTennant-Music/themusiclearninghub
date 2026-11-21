const test=require('node:test'),assert=require('node:assert/strict');
const collections=require('../music-dictionary/quiz-collections.js'),dictionary=require('../music-dictionary/music-concepts-data.js');
const codes=['N3','N4','N5','H','AH'];
test('broader topic names reflect their existing collections',()=>{
 const groups=collections.listedGroupsForLevel('ALL');
 for(const [id,label] of [
  ['bass-lines','Bass Lines and Patterns'],
  ['voices-vocal-music','Vocal Forces and Texture'],
  ['modern-20th-century','Modern and Contemporary Music']
 ])assert.equal(groups.find(group=>group.id===id).label,label);
});
test('curriculum column collections use the exact table entries for each level',()=>{
 const all=collections.listedGroupsForLevel('ALL');
 assert(!all.some(group=>group.curriculumLevel));
 const combined=all.filter(group=>group.fullWidth);
 assert.equal(combined.length,dictionary.categories.length);
 for(const [column,label] of dictionary.categories.entries()){
  const group=combined.find(row=>row.curriculumColumn===column);
  assert.equal(group.label,label);
  assert.deepEqual(group.conceptIds,[...new Set(dictionary.levels.flatMap(level=>dictionary.tables[level][column]))]);
 }
 for(const [rank,code] of codes.entries()){
  const level=dictionary.levels[rank];
  const groups=collections.listedGroupsForLevel(code).filter(group=>group.curriculumLevel===code);
  assert.equal(groups.length,dictionary.categories.length);
  for(const [column,label] of dictionary.categories.entries()){
   const group=groups.find(row=>row.curriculumColumn===column);
   assert.equal(group.label,level+' – '+label);
   assert.deepEqual([...group.conceptIds].sort(),[...new Set(dictionary.tables[level][column])].sort());
   assert.deepEqual(collections.groupsForLevel('ALL').find(row=>row.id===group.id).conceptIds,group.conceptIds);
  }
 }
});
test('collections include the selected qualification and earlier levels, never later ones',()=>{for(const [rank,level] of codes.entries()){const groups=collections.groupsForLevel(level);assert(groups.length>0,level);for(const group of groups){assert.equal(group.level,level);assert(group.conceptIds.length>0);for(const id of group.conceptIds)assert(dictionary.levels.indexOf(dictionary.concepts.find(c=>c.id===id).level)<=rank,group.label);}}});
test('shared or saved mixed-level selections are limited to the chosen qualification and earlier levels',()=>{const ids=['MC-0001','MC-0070','MC-0274','not-a-concept','MC-0001'];assert.deepEqual(collections.scopeIds(ids,'N3'),['MC-0001']);assert.deepEqual(collections.scopeIds(ids,'AH'),['MC-0001','MC-0070','MC-0274']);assert.deepEqual(collections.scopeIds(ids,'ALL'),['MC-0001','MC-0070','MC-0274']);});

test('All Levels includes every collection from every qualification, with all five Styles collections',()=>{
 const all=collections.groupsForLevel('ALL'),byId=new Map(all.map(g=>[g.id,g]));assert.equal(byId.size,all.length);
 for(const code of codes)for(const group of collections.groupsForLevel(code)){assert(byId.has(group.id),group.label);if(group.id.endsWith('-styles'))assert.deepEqual(byId.get(group.id).conceptIds,group.conceptIds);}
 assert.equal(all.filter(g=>g.id.endsWith('-styles')).length,5);assert(all.every(g=>g.level==='ALL'));
});

test('Tempo includes speed changes and pauses at each relevant qualification',()=>{
 const expected={N3:['Adagio','Allegro','Faster','Slower','Pause'],N4:['Andante','A tempo','Accelerando','Rallentando'],N5:['Moderato','Ritardando','Rubato']};
 for(const level of [...codes,'ALL']){const groups=collections.groupsForLevel(level);assert(!groups.some(g=>g.id==='tempo-changes'));if(expected[level]){const names=groups.find(g=>g.id==='tempo').conceptIds.map(id=>dictionary.concepts.find(c=>c.id===id).name);assert.deepEqual(new Set(names),new Set(codes.slice(0,codes.indexOf(level)+1).flatMap(l=>expected[l]||[])));}}
});
test('every concept remains covered at its qualification and All Levels',()=>{
 for(const level of [...codes,'ALL']){const groups=collections.groupsForLevel(level),used=new Set(groups.flatMap(g=>g.conceptIds));for(const c of dictionary.concepts.filter(c=>level==='ALL'||c.level===dictionary.levels[codes.indexOf(level)]))assert(used.has(c.id),level+': '+c.name);for(const g of groups)assert.equal(new Set(g.conceptIds).size,g.conceptIds.length,g.label);}
});
test('retired narrow collections are consolidated into listening topics',()=>{
 const retired=['orchestral-families','ensemble-types','tonalities','textures','word-setting','playing-techniques-ornaments','serial-music'];
 for(const level of [...codes,'ALL'])for(const group of collections.groupsForLevel(level))assert(!retired.includes(group.id),group.id);
 const includes=(level,group,id)=>assert(collections.groupsForLevel(level).find(g=>g.id===group)?.conceptIds.includes(id),level+' '+group+' '+id);
 includes('N3','chords','MC-0011');includes('N3','chords','MC-0013');includes('N4','musical-development','MC-0107');includes('N5','harmony','MC-0166');includes('N5','voices-vocal-music','MC-0192');includes('AH','renaissance-music','MC-0192');includes('H','harmony','MC-0239');includes('H','rhythm-metre','MC-0247');includes('AH','chords','MC-0278');includes('AH','harmony','MC-0281');includes('AH','pitch-melody-scales','MC-0283');includes('AH','baroque','MC-0285');includes('AH','baroque','MC-0276');includes('AH','modern-20th-century','MC-0275');
});
test('period collections avoid isolated generic concepts while focused advanced topics remain',()=>{
 for(const level of ['N3','N4']){const ids=collections.groupsForLevel(level).map(g=>g.id);assert(!ids.includes('modern-20th-century'));assert(!ids.includes('renaissance-music'));if(level==='N3')for(const id of ['baroque','classical','romantic'])assert(!ids.includes(id));}
 assert(collections.groupsForLevel('AH').some(g=>g.id==='classical'));assert(!collections.groupsForLevel('H').some(g=>g.id==='renaissance-music'));
 assert.equal(collections.groupsForLevel('H').find(g=>g.id==='concerto-grosso').conceptIds.length,5);assert.equal(collections.groupsForLevel('AH').find(g=>g.id==='fugue').conceptIds.length,5);
 for(const level of [...codes,'ALL'])assert(!collections.groupsForLevel(level).some(g=>g.curriculumColumn===undefined&&g.conceptIds.length===1&&g.id!=='ornaments'),level);
});

test('topic collections build cumulatively without losing earlier concepts',()=>{
 for(let rank=1;rank<codes.length;rank++)for(const previous of collections.groupsForLevel(codes[rank-1])){
  if(previous.curriculumLevel||previous.qualification)continue;
  const next=collections.groupsForLevel(codes[rank]).find(g=>g.id===previous.id);if(codes[rank]==='H'&&previous.id==='renaissance-music'){assert(!next);continue;}assert(next,previous.id);for(const id of previous.conceptIds)assert(next.conceptIds.includes(id),codes[rank]+' '+previous.id+' '+id);
 }
 for(const [rank,level] of codes.entries()){
  const styles=collections.groupsForLevel(level).find(g=>g.id.endsWith('-styles'));const expected=dictionary.concepts.filter(c=>dictionary.levels.indexOf(c.level)===rank&&c.categories.includes('Styles')).map(c=>c.id);assert.deepEqual(styles.conceptIds,expected);
 }
});

test('Playing Techniques and Ornaments are separate cumulative collections, with no N3 ornaments',()=>{
 assert(!collections.groupsForLevel('N3').some(g=>g.id==='ornaments'));
 const all=collections.groupsForLevel('ALL'),ornaments=all.find(g=>g.id==='ornaments').conceptIds,techniques=all.find(g=>g.id==='playing-techniques').conceptIds;
 assert.equal(ornaments.length,7);assert(ornaments.every(id=>!techniques.includes(id)));
 for(const level of ['N4','N5','H','AH','ALL'])assert(collections.groupsForLevel(level).some(g=>g.id==='ornaments'));
 for(const level of [...codes,'ALL']){assert(collections.groupsForLevel(level).some(g=>g.id==='playing-techniques'));assert(!collections.groupsForLevel(level).some(g=>g.id==='playing-techniques-ornaments'));}
});

test('Articulation contains Legato, Staccato and Accent / accented separately from Playing Techniques at every level',()=>{
 for(const level of [...codes,'ALL']){const groups=collections.groupsForLevel(level),articulation=groups.find(g=>g.id==='articulation'),techniques=groups.find(g=>g.id==='playing-techniques');assert.deepEqual(articulation.conceptIds,['MC-0053','MC-0060','MC-0021']);assert(articulation.conceptIds.every(id=>!techniques.conceptIds.includes(id)));}
});

test('N3 Texture contains exactly Unison and Harmony, separate from chords and structure',()=>{
 const groups=collections.groupsForLevel('N3'),texture=groups.find(g=>g.id==='texture');assert.equal(texture.label,'Texture');assert.deepEqual(new Set(texture.conceptIds),new Set(['MC-0035','MC-0041']));
 for(const level of [...codes,'ALL']){const gs=collections.groupsForLevel(level);assert(!gs.find(g=>g.id==='harmony')?.conceptIds.includes('MC-0035'));const structure=gs.find(g=>g.id==='texture-structure');if(level==='N3'){assert(!structure);continue;}assert.equal(structure.label,'Structure and Form');assert(!structure.conceptIds.includes('MC-0035'));assert(!structure.conceptIds.includes('MC-0041'));}
});

test('Musical Patterns and Development retains Repetition but excludes Sequence and Question and answer',()=>{
 for(const level of [...codes.slice(1),'ALL']){const group=collections.groupsForLevel(level).find(g=>g.id==='musical-development');assert(group.conceptIds.includes('MC-0017'));assert(!group.conceptIds.includes('MC-0016'));assert(!group.conceptIds.includes('MC-0018'));}
});

test('N3 Orchestra contains exactly the orchestra and its four families',()=>{
 const group=collections.groupsForLevel('N3').find(g=>g.id==='orchestra');assert.equal(group.label,'Orchestra');assert.deepEqual(new Set(group.conceptIds),new Set(['MC-0054','MC-0063','MC-0047','MC-0068','MC-0056']));
 for(const level of [...codes,'ALL'])assert.equal(collections.groupsForLevel(level).find(g=>g.id==='orchestra').label,'Orchestra');
});

test('N3 World Music is removed while every former concept retains another collection',()=>{
 const n3=collections.groupsForLevel('N3');assert(!n3.some(g=>g.id==='world-music'));
 for(const id of ['MC-0003','MC-0016','MC-0061','MC-0017','MC-0014'])assert(n3.some(g=>g.conceptIds.includes(id)),id);
 assert(n3.find(g=>g.id==='instruments-ensembles').conceptIds.includes('MC-0061'));
 assert(!n3.find(g=>g.id==='orchestra').conceptIds.includes('MC-0061'));
 for(const level of ['N4','N5','H','AH','ALL'])assert(collections.groupsForLevel(level).some(g=>g.id==='world-music'));
});

test('Vocal Music includes Accompanied, Harmony, Unison, Octave and Round at every level',()=>{
 for(const level of [...codes,'ALL']){const group=collections.groupsForLevel(level).find(g=>g.id==='voices-vocal-music');for(const id of ['MC-0034','MC-0035','MC-0038','MC-0041'])assert(group.conceptIds.includes(id),level+' '+id);assert.equal(new Set(group.conceptIds).size,group.conceptIds.length);}
 assert.equal(collections.groupsForLevel('N3').find(g=>g.id==='voices-vocal-music').conceptIds.length,8);
});

test('Scottish Music excludes Question and answer and Unaccompanied at every level',()=>{
 for(const level of [...codes,'ALL']){const group=collections.groupsForLevel(level).find(g=>g.id==='scottish-music');assert(group);assert(!group.conceptIds.includes('MC-0016'));assert(!group.conceptIds.includes('MC-0040'));}
});

test('N3 Octave is excluded from Pitch and Melody but retained in Vocal Music',()=>{
 for(const level of [...codes,'ALL']){const groups=collections.groupsForLevel(level);assert(!groups.find(g=>g.id==='pitch-melody-scales').conceptIds.includes('MC-0036'));for(const id of ['voices-vocal-music'])assert(!groups.find(g=>g.id===id).conceptIds.includes('MC-0036'));}
 assert(collections.groupsForLevel('N4').find(g=>g.id==='pitch-melody-scales').conceptIds.includes('MC-0086'));
});

test('Structure and Form is available from N4 upwards, not N3',()=>{
 assert(!collections.groupsForLevel('N3').some(g=>g.id==='texture-structure'));
 for(const level of [...codes.slice(1),'ALL'])assert(collections.groupsForLevel(level).some(g=>g.id==='texture-structure'));
});

test('Rhythm and Metre excludes Drum fill, Waltz, Reel, March and Repetition at every level',()=>{
 for(const level of [...codes,'ALL']){const group=collections.groupsForLevel(level).find(g=>g.id==='rhythm-metre');for(const id of ['MC-0017','MC-0025','MC-0027','MC-0031','MC-0033'])assert(!group.conceptIds.includes(id),level+' '+id);}
});

test('Instruments and Ensembles includes orchestral concepts even when they appear in other collections',()=>{
 for(const level of [...codes,'ALL']){const groups=collections.groupsForLevel(level),instruments=groups.find(g=>g.id==='instruments-ensembles'),orchestra=groups.find(g=>g.id==='orchestra');for(const id of orchestra.conceptIds)assert(instruments.conceptIds.includes(id),level+' '+id);assert.equal(new Set(instruments.conceptIds).size,instruments.conceptIds.length);}
 assert.equal(collections.groupsForLevel('N3').find(g=>g.id==='instruments-ensembles').conceptIds.length,17);
});

test('Drone belongs only to Scottish Music across topic collections',()=>{
 for(const level of ['N4','N5','H','AH','ALL']){const containing=collections.groupsForLevel(level).filter(g=>!g.qualification&&g.curriculumColumn===undefined&&g.conceptIds.includes('MC-0083'));assert.deepEqual(containing.map(g=>g.id),['scottish-music']);}
});

test('key changes and relationships remain in Harmony and Chords after Tonality is separated',()=>{
 for(const level of [...codes,'ALL']){const groups=collections.groupsForLevel(level);assert(!groups.some(g=>g.id==='key-tonality'));const harmony=groups.find(g=>g.id==='harmony');if(harmony)assert.equal(new Set(harmony.conceptIds).size,harmony.conceptIds.length);}
 const n4=collections.groupsForLevel('N4').find(g=>g.id==='harmony').conceptIds;for(const id of ['MC-0081'])assert(n4.includes(id));
 const all=collections.groupsForLevel('ALL').find(g=>g.id==='harmony').conceptIds;for(const id of ['MC-0168','MC-0239','MC-0240'])assert(all.includes(id));
});

test('Alberti bass, Walking bass and Ground bass belong to Bass Lines rather than Harmony',()=>{
 for(const level of ['N5','H','AH','ALL']){const groups=collections.groupsForLevel(level),harmony=groups.find(g=>g.id==='harmony'),structure=groups.find(g=>g.id==='bass-lines');for(const id of ['MC-0181','MC-0191','MC-0186']){assert(!harmony.conceptIds.includes(id));assert(structure.conceptIds.includes(id));}}
});

test('Scottish styles belong to Scottish Music rather than Vocal Music',()=>{
 const styles=['MC-0072','MC-0078','MC-0145','MC-0149','MC-0153','MC-0155'];
 for(const level of [...codes,'ALL']){const groups=collections.groupsForLevel(level),vocal=groups.find(g=>g.id==='voices-vocal-music'),scottish=groups.find(g=>g.id==='scottish-music');for(const id of collections.scopeIds(styles,level)){assert(!vocal.conceptIds.includes(id),level+' '+id);assert(scottish.conceptIds.includes(id));}assert(vocal.conceptIds.includes('MC-0067'));}
});

test('Tonality contains only the five tonalities, introduced cumulatively at their own levels',()=>{
 const expected={N4:['MC-0084','MC-0085'],N5:['MC-0084','MC-0085','MC-0156'],H:['MC-0084','MC-0085','MC-0156','MC-0235'],AH:['MC-0084','MC-0085','MC-0156','MC-0235','MC-0280']};
 assert(!collections.groupsForLevel('N3').some(g=>g.id==='tonality'));
 for(const [level,ids] of Object.entries(expected)){const groups=collections.groupsForLevel(level),tonality=groups.find(g=>g.id==='tonality'),harmony=groups.find(g=>g.id==='harmony');assert.equal(tonality.label,'Tonality');assert.deepEqual(tonality.conceptIds,ids);for(const id of ids)assert(!harmony.conceptIds.includes(id));}
 assert.deepEqual(collections.groupsForLevel('ALL').find(g=>g.id==='tonality').conceptIds,expected.AH);
});

test('Renaissance Music appears only at AH and All Levels',()=>{
 assert(!collections.groupsForLevel('H').some(g=>g.id==='renaissance-music'));
 for(const level of ['N3','N4','N5','H'])assert(!collections.groupsForLevel(level).some(g=>g.id==='renaissance-music'));for(const level of ['AH','ALL'])assert(collections.groupsForLevel(level).some(g=>g.id==='renaissance-music'));
});

test('Scales is separate from Pitch and Melody and builds cumulatively from N4',()=>{
 assert(!collections.groupsForLevel('N3').some(g=>g.id==='scales'));
 const counts={N4:2,N5:4,H:6,AH:6,ALL:6};
 for(const [level,count] of Object.entries(counts)){const groups=collections.groupsForLevel(level),scales=groups.find(g=>g.id==='scales'),pitch=groups.find(g=>g.id==='pitch-melody-scales');assert.equal(scales.conceptIds.length,count);assert.equal(pitch.label,'Pitch and Melody');for(const id of scales.conceptIds)assert(!pitch.conceptIds.includes(id));}
});

test('Chords and Harmony are separate cumulative collections',()=>{
 for(const level of [...codes,'ALL']){const groups=collections.groupsForLevel(level),chords=groups.find(g=>g.id==='chords'),harmony=groups.find(g=>g.id==='harmony');assert.equal(chords.label,'Chords');assert(chords.conceptIds.includes('MC-0010'));if(harmony){assert.equal(harmony.label,'Harmony');assert(chords.conceptIds.every(id=>!harmony.conceptIds.includes(id)));}else assert.equal(level,'N3');}
 const ah=collections.groupsForLevel('AH');for(const id of ['MC-0278','MC-0279','MC-0277'])assert(ah.find(g=>g.id==='chords').conceptIds.includes(id));for(const id of ['MC-0081','MC-0168'])assert(ah.find(g=>g.id==='harmony').conceptIds.includes(id));
});

test('Cadences is separate from Harmony and builds cumulatively from N5',()=>{
 for(const level of ['N3','N4'])assert(!collections.groupsForLevel(level).some(g=>g.id==='cadences'));
 for(const [level,count] of [['N5',2],['H',4],['AH',4],['ALL',4]]){const groups=collections.groupsForLevel(level),cadences=groups.find(g=>g.id==='cadences'),harmony=groups.find(g=>g.id==='harmony');assert.equal(cadences.conceptIds.length,count);for(const id of cadences.conceptIds)assert(!harmony.conceptIds.includes(id));}
});

test('Vamp belongs to Harmony rather than Pitch and Melody, retaining its style contexts',()=>{
 for(const level of ['N4','N5','H','AH','ALL']){const groups=collections.groupsForLevel(level);assert(groups.find(g=>g.id==='harmony').conceptIds.includes('MC-0093'));assert(!groups.find(g=>g.id==='pitch-melody-scales').conceptIds.includes('MC-0093'));for(const id of ['scottish-music','jazz-popular-music'])assert(groups.find(g=>g.id===id).conceptIds.includes('MC-0093'));}
});

test('Structure and Form excludes Accompanied, Octave, Solo and Unaccompanied, which remain in Vocal Music',()=>{
 for(const level of [...codes,'ALL']){const groups=collections.groupsForLevel(level),structure=groups.find(g=>g.id==='texture-structure'),vocal=groups.find(g=>g.id==='voices-vocal-music');for(const id of ['MC-0034','MC-0039','MC-0040']){assert(!structure?.conceptIds.includes(id));assert(vocal.conceptIds.includes(id));}}
});

test('Saxophone is excluded from Orchestra but retained in Instruments and Ensembles and Jazz and Popular Music',()=>{
 for(const level of ['N4','N5','H','AH','ALL']){const groups=collections.groupsForLevel(level);assert(!groups.find(g=>g.id==='orchestra').conceptIds.includes('MC-0132'));for(const id of ['instruments-ensembles','jazz-popular-music'])assert(groups.find(g=>g.id===id).conceptIds.includes('MC-0132'));}
});


test('focused structure collections separate forms, bass lines, development and context-specific Subjects',()=>{
 for(const level of ['H','AH','ALL']){
  const gs=collections.groupsForLevel(level),get=id=>gs.find(g=>g.id===id).conceptIds;
  for(const id of ['MC-0181','MC-0186','MC-0191','MC-0248','MC-0252'])assert(get('bass-lines').includes(id));
  for(const id of ['MC-0223','MC-0251','MC-0254','MC-0255'])assert(get('sonata-form').includes(id));
  assert(!get('sonata-form').includes('MC-0296'));
  for(const id of [...get('bass-lines'),...get('sonata-form'),...get('musical-development')])assert(!get('texture-structure').includes(id),id);
  assert(get('texture-structure').includes('MC-0182'));
  if(level!=='H'){assert(get('fugue').includes('MC-0296'));assert(!get('fugue').includes('MC-0255'));assert(!get('texture-structure').includes('MC-0296'));}
 }
});
test('vocal topics keep word setting focused on syllabic and melismatic',()=>{
 const R=require('../music-dictionary/music-concepts-revision-groups.js'),source=R.groupsForLevel('AH');
 const former=[...source.find(g=>g.id==='voice-types').conceptIds,...source.find(g=>g.id==='word-setting').conceptIds,...'4 34 35 36 38 39 40 41 48 67 73 75 91 114 144 147 150 162 192 217 218 220 221 222 250 256 257 262 263 264 265 269 270 294 300'.split(' ').map(n=>'MC-'+n.padStart(4,'0'))];
 const groups=collections.groupsForLevel('AH'),ids=['voices-vocal-music','voice-types','vocal-techniques','sacred-vocal','songs-stage'];
 const actual=ids.flatMap(id=>groups.find(g=>g.id===id).conceptIds);
 assert.deepEqual(new Set(actual),new Set(former.filter(id=>!['MC-0036','MC-0075','MC-0091','MC-0257','MC-0300'].includes(id))));assert.equal(actual.length,new Set(actual).size);
 assert(groups.find(g=>g.id==='voice-types').conceptIds.includes('MC-0298'));
 assert.equal(groups.find(g=>g.id==='vocal-techniques').label,'Word Setting');
 assert.deepEqual(groups.find(g=>g.id==='vocal-techniques').conceptIds,['MC-0167','MC-0172']);
 assert(groups.find(g=>g.id==='sacred-vocal').conceptIds.includes('MC-0218'));
 assert(groups.find(g=>g.id==='songs-stage').conceptIds.includes('MC-0073'));
});


test('five qualification collections contain every concept from their own level only',()=>{
 const all=collections.groupsForLevel('ALL').filter(g=>codes.includes(g.qualification)&&!g.cumulative);assert.equal(all.length,5);
 for(const [rank,code] of codes.entries()){
  const expected=dictionary.concepts.filter(c=>c.level===dictionary.levels[rank]).map(c=>c.id);
  for(const level of [code,'ALL']){const groups=collections.groupsForLevel(level).filter(g=>g.qualification&&!g.cumulative);if(level!=='ALL')assert.equal(groups.length,1);const group=groups.find(g=>g.qualification===code);assert(group);assert.deepEqual(group.conceptIds,expected);assert.equal(group.id,'level-'+code.toLowerCase());}
 }
});


test('All Concepts leads All Levels and includes each Dictionary concept exactly once',()=>{
 const groups=collections.groupsForLevel('ALL'),all=groups[0];
 assert.equal(all.id,'all-concepts');assert.equal(all.label,'All Concepts');assert.equal(all.qualification,'ALL');
 assert.deepEqual(all.conceptIds,dictionary.concepts.map(c=>c.id));assert.equal(new Set(all.conceptIds).size,all.conceptIds.length);
 assert.deepEqual(groups.slice(1,6).map(g=>g.qualification),codes);
 for(const level of codes)assert(!collections.groupsForLevel(level).some(g=>g.id==='all-concepts'));
});


test('the selected qualification All Concepts collection comes first at every level',()=>{
 for(const code of codes){const groups=collections.groupsForLevel(code);assert.equal(groups[0].qualification,code);assert.equal(groups[0].label,dictionary.levels[codes.indexOf(code)]+' — All Concepts');assert.deepEqual(groups.slice(1).filter(g=>!g.cumulative).map(g=>g.label),groups.slice(1).filter(g=>!g.cumulative).map(g=>g.label).sort((a,b)=>a.localeCompare(b,'en-GB')));}
});

test('Concept Quizzes opens All Concepts at the selected level and honours collection links',()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const source=fs.readFileSync('music-dictionary/music-concepts.js','utf8').split('function Entry(){')[1].split('const mount=')[0];
 function open(search,validLevel,quizApp=true){
  return vm.runInNewContext('function Entry(){'+source+'Entry();',{
   App:'app',h:(_app,props)=>props?.initialRun,quizApp,params:new URLSearchParams(search),
   location:{pathname:quizApp?'/conceptquiz.html':'/music-dictionary/musicdictionary.html'},
   history:{},keys:codes,D:dictionary,validLevel,initialQuizCollection:null,tableUrl:()=>'',URLSearchParams,
   MusicDictionaryQuizCollections:collections,
   MusicDictionaryQuizzes:{config:config=>config,savedSettings:()=>({})},
   window:{MLH:{profileInitial:(_key,value)=>value},HubCollections:{selected:()=>null,pageUrl:()=>''}},
  });
 }
 for(const [index,code] of codes.entries()){
  const run=open('?level='+code,dictionary.levels[index]);
  assert.equal(run.settings.collectionId,'level-'+code.toLowerCase());
  assert.deepEqual(run.concepts,dictionary.concepts.filter(c=>c.level===dictionary.levels[index]).map(c=>c.id));
 }
 assert.equal(open('?level=ALL','National 5').concepts.length,dictionary.concepts.length);
 assert.equal(open('?level=H&group=cadences','Higher').name,'Cadences');
 assert.equal(open('?level=N3&create=1','National 3'),undefined);
 assert.equal(open('?level=H','Higher',false),undefined);
});

test('National 5 orchestral families contain only their curated orchestral instruments',()=>{
 const expected={
  brass:['Trumpet','Trombone','French horn','Tuba'],
  woodwind:['Flute','Piccolo','Oboe','Clarinet','Bassoon'],
  strings:['Violin','Viola','Cello','Double bass','Harp'],
  percussion:['Bass drum','Cymbals','Glockenspiel','Snare drum','Tambourine','Timpani','Triangle','Xylophone']
 };
 for(const level of ['N3','N4'])for(const family of Object.keys(expected))assert(!collections.groupsForLevel(level).some(g=>g.id==='orchestra-'+family));
 for(const level of ['N5','H','AH','ALL'])for(const [family,names] of Object.entries(expected)){
  const group=collections.groupsForLevel(level).find(g=>g.id==='orchestra-'+family);
  assert(group,level+' '+family);
  assert.deepEqual(group.conceptIds.map(id=>dictionary.concepts.find(c=>c.id===id).name),names);
 }
});

test('quiz cards count every concept even when the question bank is empty or generation is excluded',()=>{
 const fs=require('node:fs'),vm=require('node:vm');
 const h=(type,props,...children)=>({type,props:props||{},children:children.flat(Infinity)}),window={};
 vm.runInNewContext(fs.readFileSync('music-dictionary/music-concepts-quizzes.js','utf8'),{window,React:{createElement:h,Fragment:'fragment'},MUSIC_CONCEPTS:dictionary,MusicDictionaryQuizCollections:collections,MUSIC_DICTIONARY_QUIZ_BANK:{questions:[],conceptReviews:dictionary.concepts.map(c=>({conceptId:c.id,excludeFromGeneration:true}))},MLH:{}});
 const buttons=node=>!node||typeof node!=='object'?[]:[...(node.type==='button'&&node.props.className?.includes('cq-collection-row')?[node]:[]),...node.children.flatMap(buttons)];
 const text=node=>typeof node==='string'||typeof node==='number'?String(node):node&&typeof node==='object'?node.children.map(text).join(''):'';
 for(const level of [...codes,'ALL']){
  const saved={name:'Including concepts without questions',concepts:['MC-0278','MC-0279'],level:'AH'};
  const cards=buttons(window.MusicDictionaryQuizzes.Home({level,groups:[saved]}));
  const listed=collections.listedGroupsForLevel(level);
  assert.equal(cards.length,listed.length+1);
  assert(!cards.some(card=>text(card).includes('All Concepts')));
  for(const group of listed)assert(text(cards.find(c=>c.props.key===group.id)).includes(group.conceptIds.length+' concept'),level+' '+group.id);
  assert(text(cards.find(c=>c.props.key==='saved-0')).includes('2 concepts'));
 }
});


test('combined collections include N3 through N4, N5 or Higher, and Higher through Advanced Higher',()=>{
 assert(!collections.groupsForLevel('N3').some(g=>g.cumulative));
 for(const [rank,code] of codes.entries()){if(!rank)continue;const from=code==='AH'?3:0,id='levels-'+(code==='AH'?'h':'n3')+'-'+code.toLowerCase(),expected=dictionary.concepts.filter(c=>dictionary.levels.indexOf(c.level)>=from&&dictionary.levels.indexOf(c.level)<=rank).map(c=>c.id);
  for(const level of [code,'ALL']){const group=collections.groupsForLevel(level).find(g=>g.id===id);assert(group);assert.equal(group.label,dictionary.levels[from]+' to '+dictionary.levels[rank]+' – All Concepts');assert.deepEqual(group.conceptIds,expected);assert.equal(new Set(group.conceptIds).size,expected.length);}
  assert.equal(collections.groupsForLevel(code)[1].id,id);
 }
 for(const level of ['AH','ALL'])assert.equal(collections.groupsForLevel(level).find(g=>g.id==='levels-n3-ah').label,'National 3 to Advanced Higher – All Concepts');
 const ah=collections.groupsForLevel('AH').find(g=>g.cumulative);assert(ah.conceptIds.includes('MC-0278'));assert(ah.conceptIds.includes('MC-0279'));
});
