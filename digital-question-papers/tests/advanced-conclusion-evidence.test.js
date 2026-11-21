'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../exam-marking');
const years=[2016,2017,2018,2019,2022,2023,2024,2025,2026];
const part=y=>require('../papers/advanced-higher-'+y).questions.flatMap(q=>q.subquestions).find(p=>p.markingProfile==='advanced-conclusion');
const mark=(y,text,answers={})=>M.markSubquestion(part(y),{final:text},answers);
const check=(y,n,period,reason,expected)=>assert.equal(mark(y,`Excerpt ${n} is ${period} because ${reason}.`).marks,expected,`${y} excerpt ${n}: ${reason}`);
// Independently chosen from the official conclusion and additional-guidance
// pages, including explicit rejected examples. Do not generate these from data.
const evidence={
2016:[['Classical',['the harmony is tonal','there are turns','there is a chamber orchestra','there is little variation in dynamics','the piano plays Alberti accompaniment','it modulates to the relative minor'],['there are strings','there is a concerto','there are horns']],['Modern',['there are clashing chords','it is bitonal','there are two keys simultaneously','there are muted trumpets','there is a bass drum','it uses pizzicato'],['there is an orchestra']]],
2017:[['Baroque',['it uses counterpoint','the melody is imitated','there is figured bass','there are trills','it modulates to the relative major'],['there are strings','it uses nonsense words']],['Jazz',['there is scat','it uses beatboxing','it has a walking bassline','there are swung rhythms','there are close miked voices'],['there are nonsense words','it is a modern arrangement','there is a choir']]],
2018:[['Romantic',['there is a wide vocal range','there is colouratura','there are florid scale passages','there is rubato','there are diminished seventh chords','there is a harp'],['there is a soprano','there are vocals']],['Modern',['there are added sixths','there are seventh chords','the voices sing without vibrato','the voices have no vibrato','it uses straight singing','the voices are not operatic','it has an American accent','there is a saxophone and drum kit','there is jazz harmony'],['there are drums','there is a clarinet','there is an orchestra']]],
2019:[['Baroque',['it has high trumpets','there is counterpoint','it has suspensions','there is imitation','there is a chamber orchestra'],['there are strings']],['Modern',['it has off-beat rhythms','there are accents off the beat','there are five beats in a bar','the solo singer shouts','it uses congas','it uses a piano','it uses discordant chords'],['it has jazzy rhythms','there are drums']]],
2022:[['Modern',['there are accents on weak beats','the music is syncopated','there are changing time signatures','there are frequent changes of key','there are added sixths','there is a large percussion section','there are wide leaps and angular melodic lines','there are wide leaps','there is an angular melody'],['there is a choir']],['Popular',['there is distorted guitar','there is a bass guitar','there is a synthesiser','there is a solo singer with backing singers','it has reggae influences','there is a repeating rhythmic pattern','it uses offbeat rhythms'],['there is a guitar','there are drums','there is bass','there is a solo singer','there is glissando','it is through composed']]],
2023:[['Classical',['it uses balanced phrases','there are 4-bar phrases','there are clear cadence points','it uses traditional harmony','it is chamber music with a piano','there is a wind quartet plus piano','there is a piano quintet'],['there is a piano','there is chamber music','there is a chamber orchestra']],['Modern',['there are cross-rhythms','there is a guiro','there are extended chords','it uses off beats','there is a wide range of dynamics'],['there is an orchestra']]],
2024:[['Baroque',['there is figured bass','there is a ripieno','there is a string orchestra','there are sequences','it uses diatonic harmonies','it uses tonic and dominant harmony'],['it uses tonic harmony','there are dotted rhythms','there is hemiola']],['Romantic',['there is a symphony orchestra','it uses whole tones','there is a tam-tam','there is sforzando','it uses chromatic harmony'],['there are triplets','it is syncopated']]],
2025:[['Classical',['there is a chamber orchestra with woodwind','there is a small ensemble','there are clearly defined cadences','there is Alberti bass','it uses regular phrases','it uses tonic and dominant'],['there is a small orchestra','there is a chamber orchestra','there are perfect cadences','there is a dominant chord']],['Romantic',['there are abrupt key changes','there are unexpected key changes','there are complex harmonies','it has a flexible tempo','it has a large dynamic range'],['there is a change of key','it changes key']]],
2026:[['Baroque',['there is a string orchestra','there is figured bass','it is fugal','it has independent melodic lines','it uses tonic and dominant harmony'],['there are strings','there is a small orchestra','there is a chamber orchestra','there is a Baroque orchestra']],['Modern',['there is syncopation','it is syncopated','the accents are off the beat','there are offbeat rhythms','there is a full orchestra with cymbals','there is a large orchestra and percussion is prominent','it has an angular melody with no clear phrase structure','it has an angular melodic line and irregular phrases','the words mention sending a fax'],['there is a large orchestra','there is prominent percussion','there is a snare drum','there is a large orchestra with drumkit','it has an angular melody','it has no clear phrase structure']]]
};
for(const [year,excerpts]of Object.entries(evidence))for(const [i,[period,yes,no]]of excerpts.entries()){
 test(`AH ${year} excerpt ${i+1}: official evidence and equivalent wording`,()=>yes.forEach(reason=>check(year,i+1,period,reason,1)));
 test(`AH ${year} excerpt ${i+1}: incomplete / expressly excluded evidence`,()=>no.forEach(reason=>check(year,i+1,period,reason,0)));
}
for(const y of years){
 test(`AH ${y}: full credit requires two justified periods, in the conclusion itself`,()=>{
  const [a,b]=evidence[y];const labels=`Excerpt 1 is ${a[0]}. Excerpt 2 is ${b[0]}.`;
  let result=mark(y,labels);assert.equal(result.marks,1);assert.deepEqual(result.conclusionDetails.map(d=>d.justified),[false,false]);
  result=mark(y,labels,{q6a1:{final:a[1][0]},q6a2:{final:b[1][0]}});assert.equal(result.marks,1);assert.deepEqual(result.conclusionDetails.map(d=>d.justified),[false,false]);
  assert.equal(mark(y,labels,{q6a1:{rough:a[1][0]},q6a2:{rough:b[1][0]}}).marks,1);
  assert.equal(mark(y,labels,{q6bi:{final:`Excerpt 1: ${a[1][0]}. Excerpt 2: ${b[1][0]}.`}}).marks,1);
 });
}
test('negative statements cannot supply evidence or identify a period',()=>{
 for(const phrase of ['no syncopation','not syncopated','never syncopated','without syncopation',"it isn't syncopated","it does not have syncopation"] )check(2026,2,'Modern',phrase,0);
 assert.equal(mark(2026,'Excerpt 2 is not modern because there is syncopation.').marks,0);
 assert.equal(mark(2026,'Excerpt 2 is modern because there is syncopation. It has no syncopation.').marks,0);
 assert.equal(mark(2026,'Excerpt 2 is modern because there is syncopation.',{q6a2:{final:'No syncopation'}}).marks,1);
 check(2026,2,'Modern','there is not only syncopation but also ostinato',1);
 check(2018,2,'Modern','the singers are not without vibrato',0);
});
test('reasons from another excerpt, another question or rough work cannot leak into the conclusion',()=>{
 assert.equal(mark(2026,'Excerpt 1 is Baroque. Excerpt 2 is Modern because there is a harpsichord.').marks,1);
 assert.equal(mark(2026,'Excerpt 1 is Baroque. Excerpt 2 is Modern.',{q5a:{final:'harpsichord and syncopation'}}).marks,1);
 assert.equal(mark(2026,'Excerpt 1 is Baroque because both singers use syncopation. Excerpt 2 is Modern.').marks,1);
});
test('numbered, ordinal, reversed and paragraph answer formats',()=>{
 for(const text of ['1: Baroque because there is a harpsichord.\n2: Modern because it is syncopated.','The first excerpt is Baroque because there is a harpsichord. The second excerpt is Modern because it is syncopated.','The first extract is Baroque because there is a harpsichord. The second extract is Modern because it is syncopated.','Excerpt 2 is Modern because it is syncopated. Excerpt 1 is Baroque because there is a harpsichord.','Baroque because there is a harpsichord.\nModern because it is syncopated.'])assert.equal(mark(2026,text).marks,2,text);
});
test('period and work type are distinct; source-specific period alternatives remain enforced',()=>{
 assert.equal(mark(2016,'Excerpt 1 is a concerto because it uses ornamentation.').marks,0);
 assert.equal(mark(2017,'Excerpt 2 is a fugue because it uses a walking bass.').marks,0);
 assert.equal(mark(2017,'Excerpt 2 is a modern arrangement of a Baroque piece because it uses scat singing.').marks,1);
 assert.equal(mark(2017,'Excerpt 2 is contemporary jazz because it uses a walking bass.').marks,0);
 assert.equal(mark(2018,'Excerpt 2 is contemporary because it has a swing feel.').marks,0);
 assert.equal(mark(2023,'Excerpt 2 is neo-classical because it uses syncopation.').marks,0);
 assert.equal(mark(2026,'Excerpt 2 is 21st-century because it has offbeat rhythms.').marks,1);
});
