'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const M=require('../exam-marking');
// Independently selected from Q6 of the corresponding official marking texts
// in fixtures/source-text/. These are examples of the rubric, not generated
// from the app's accepted-answer arrays.
const cases={
 2016:{a1:['Appoggiatura','Sequence','Alberti bass','Staccato'],a2:['Bitonality','Cluster','Piccolo','Pizzicato'],similar:['arpeggios','chromatic harmony','concerto','diminished 7th','homophonic texture','imitation'],periods:['Classical','Modern'],reasons:['ornamentation','bitonality']},
 2017:{a1:['Appoggiatura','Minor','Harpsichord','Strings'],a2:['Minor','Scat singing','Walking bass','Choir'],similar:['minor tonality','modulation','perfect cadence','imitation','sequence','suspension'],periods:['Baroque','Jazz'],reasons:['harpsichord','walking bass']},
 2018:{a1:['Major','Sequence','Soprano','Pizzicato'],a2:['Added 6th','Sequence','Orchestra','Homophonic'],similar:['appoggiatura','arpeggios','chromatic harmony','dominant 7th','homophonic texture','major tonality'],periods:['Romantic','Modern'],reasons:['harp','swing rhythm']},
 2019:{a1:['Major','Sequence','Strings','Anacrusis'],a2:['Modal','Pedal','Allegro','Orchestra'],similar:['mass','modality','minor sections','pedal','sequence','imitation'],periods:['Baroque','Modern'],reasons:['trills','syncopation']},
 2022:{a1:['Added 6ths','Sequence','Homophonic','Timpani'],a2:['Glissando','Pedal','Backing vocals','Syncopation'],similar:['7th chords','accents','added 6ths','brass','homophonic texture','major tonality'],periods:['Modern','Popular'],reasons:['syncopation','electric guitar']},
 2023:{a1:['Sequence','Dominant 7th','Piano','Adagio'],a2:['Minor','Tritone','Ostinato','Oboe'],similar:['chromatic harmony','dominant 7th','imitation','modulation','piano','sequence'],periods:['Classical','Modern'],reasons:['regular phrase structure','syncopation']},
 2024:{a1:['Major','Sequence','Harpsichord','Hemiola'],a2:['Whole tone scale','Pedal','Staccato','Orchestra'],similar:['antiphonal writing','change of key','octave leaps','perfect cadence','sequence','simple time'],periods:['Baroque','Romantic'],reasons:['harpsichord','whole tone scale']},
 2025:{a1:['Major','Sequence','Pizzicato','Alberti bass'],a2:['Tritone','Octave','Timpani','Stretto'],similar:['appoggiatura','arpeggio','chromatic harmony','dominant 7th','homophonic texture','sequence'],periods:['Classical','Romantic'],reasons:['Alberti bass','rubato']},
 2026:{a1:['Diminished 7th','Dotted rhythms','Harpsichord','Stretto'],a2:['Major','Sequence','Orchestra','Ostinato'],similar:['accents','countermelody','English text','imitation','modulation','perfect cadence'],periods:['Baroque','Modern'],reasons:['harpsichord','syncopation']},
};
const part=(year,id)=>require('../papers/advanced-higher-'+year).questions.flatMap(q=>q.subquestions).find(p=>p.id===id);
const mark=(year,id,final,answers)=>M.markSubquestion(part(year,id),{final},answers);
for(const [year,c] of Object.entries(cases)){
 test(`AH ${year}: Q6(a) requires two concepts in each category and ignores rough work`,()=>{
  for(const [id,list]of [['q6a1',c.a1],['q6a2',c.a2]]){
   assert.equal(mark(year,id,list.join('\n')).marks,2);
   assert.equal(mark(year,id,list.slice(0,2).join('\n')).marks,1);
   assert.equal(mark(year,id,list[0]).marks,0);
   assert.equal(M.markSubquestion(part(year,id),{rough:list.join('\n'),final:''}).marks,0);
  }
 });
 test(`AH ${year}: concise descriptions receive the official 1/2/3/4 analysis bands without a word quota`,()=>{
  for(const [count,expected]of [[1,1],[2,2],[3,2],[4,3],[5,3],[6,4]]){
   const prose=c.similar.slice(0,count).map(term=>'Both use '+term+'.').join(' ');
   assert.equal(mark(year,'q6bi',prose).marks,expected,prose);
  }
  assert.equal(mark(year,'q6bi','Similarities:\n'+c.similar.join('\n')).marks,2);
  assert.equal(mark(year,'q6bi',Array(6).fill('Both use '+c.similar[0]+'.').join(' ')).marks,1);
 });
 test(`AH ${year}: explicitly contradicting a similarity removes that point`,()=>{
  const prose=c.similar.map(term=>'Both use '+term+'.').join(' ');
  assert.equal(mark(year,'q6bi',prose+' Excerpt 1 does not use '+c.similar[0]+'.').marks,3);
 });
 test(`AH ${year}: conclusion awards exactly 0, 1 or 2 and requires justification in the conclusion itself`,()=>{
  const identify=c.periods.map((period,i)=>'Excerpt '+(i+1)+' is '+period+'.').join(' ');
  assert.equal(mark(year,'q6bii',identify).marks,1);
  assert.equal(mark(year,'q6bii',`Excerpt 1 is ${c.periods[0]}.`).marks,0);
  assert.equal(mark(year,'q6bii',`Excerpt 1 is ${c.periods[0]} because it uses ${c.reasons[0]}.`).marks,1);
  const justify=c.periods.map((period,i)=>`Excerpt ${i+1} is ${period} because it uses ${c.reasons[i]}.`).join(' ');
  assert.equal(mark(year,'q6bii',justify).marks,2);
  assert.equal(mark(year,'q6bii',identify,{q6a1:{final:c.reasons[0]},q6a2:{final:c.reasons[1]}}).marks,1);
  assert.equal(mark(year,'q6bii',identify,{q6a1:{rough:c.reasons[0]},q6a2:{rough:c.reasons[1]}}).marks,1);
  assert.equal(mark(year,'q6bii',identify,{q6bi:{final:`Excerpt 1 uses ${c.reasons[0]}. Excerpt 2 uses ${c.reasons[1]}.`}}).marks,1);
  const wrong=c.periods[0]==='Baroque'?'Classical':'Baroque';
  assert.equal(mark(year,'q6bii',justify.replace('Excerpt 1 is '+c.periods[0],`Excerpt 1 is ${c.periods[0]} or ${wrong}`)).marks,1);
 });
}
test('AH 2022: both modern periods may be identified in a shared sentence',()=>assert.equal(mark(2022,'q6bii','Both excerpts are modern because both use syncopation.').marks,2));
test('paired differences need both excerpts; excerpt-only features need an actual contrast',()=>{
 assert.equal(mark(2022,'q6bi','Excerpt 1 uses an organ.').marks,0);
 assert.equal(mark(2022,'q6bi','Excerpt 1 uses an organ. Excerpt 2 uses a piano.').marks,1);
 assert.equal(mark(2016,'q6bi','Excerpt 2 only uses pizzicato.').marks,1);
 assert.equal(mark(2016,'q6bi','Excerpt 2 only uses pizzicato. Excerpt 1 also uses pizzicato.').marks,0);
 assert.equal(mark(2016,'q6bi','Excerpt 2 uses pizzicato. Excerpt 1 does not use pizzicato.').marks,1);
});
test('year-specific source exclusions and compound comparisons are enforced',()=>{
 assert.equal(mark(2018,'q6bi','Both use chromatic scales.').marks,0);
 assert.equal(mark(2023,'q6bi','Both use chromatic scales.').marks,0);
 assert.equal(mark(2026,'q6bi','Both use antiphonal writing.').marks,0);
 assert.equal(mark(2026,'q6bi','Both use homophonic texture.').marks,0);
 assert.equal(mark(2026,'q6bi','Both use homophonic and polyphonic textures.').marks,1);
 assert.equal(mark(2025,'q6bi','Excerpt 1 uses a perfect cadence. Excerpt 2 uses an imperfect cadence.').marks,0);
 assert.equal(mark(2025,'q6bi','Excerpt 1 uses perfect cadences. Excerpt 2 uses perfect cadences.').marks,1);
 assert.equal(mark(2025,'q6bi','Excerpt 1 uses a pedal. Excerpt 2 uses an inverted pedal.').marks,0);
 assert.equal(mark(2025,'q6bi','Both use inverted pedal.').marks,1);
 assert.equal(mark(2019,'q6bi','Excerpt 1 is polyphonic. Excerpt 2 is homophonic.').marks,0);
 assert.equal(mark(2019,'q6bi','Excerpt 1 is homophonic and polyphonic. Excerpt 2 is homophonic.').marks,1);
 assert.equal(mark(2024,'q6bi','Excerpt 1 uses concertino only.').marks,0);
 assert.equal(mark(2024,'q6bi','Excerpt 1 only uses concertino and ripieno.').marks,1);
});
test('conclusion justifications retain explicit source combinations and exclusions',()=>{
 assert.equal(mark(2018,'q6bii','Excerpt 1 is Romantic because it uses a soprano.').marks,0);
 assert.equal(mark(2025,'q6bii','Excerpt 1 is Classical because it uses a small ensemble.').marks,1);
 assert.equal(mark(2025,'q6bii','Excerpt 1 is Classical because it uses a small ensemble with woodwind.').marks,1);
 assert.equal(mark(2025,'q6bii','Excerpt 1 is Classical because of perfect cadences.').marks,0);
 assert.equal(mark(2025,'q6bii','Excerpt 2 is Romantic because it changes key.').marks,0);
 assert.equal(mark(2026,'q6bii','Excerpt 2 is modern because it has an angular melodic line.').marks,0);
 assert.equal(mark(2026,'q6bii','Excerpt 2 is modern because it has an angular melodic line with no clear phrase structure.').marks,1);
});
test('AH 2016 accepts printed dynamic symbols without confusing the key of F',()=>{
 assert.equal(mark(2016,'q6a1','Alberti bass\nf').marks,1);
 assert.equal(mark(2016,'q6a1','Alberti bass\nF major').marks,0);
 assert.equal(mark(2016,'q6bi','Both use ff.').marks,1);
});
test('source-specific paired instrumental and tempo requirements do not accept incomplete contrasts',()=>{
 assert.equal(mark(2019,'q6bi','Excerpt 1 uses strings. Excerpt 2 uses a symphony orchestra.').marks,0);
 assert.equal(mark(2019,'q6bi','Excerpt 1 uses strings, brass and timpani. Excerpt 2 uses a symphony orchestra.').marks,1);
 assert.equal(mark(2022,'q6bi','Excerpt 1 uses SATB choir. Excerpt 2 has a solo singer with backing singers.').marks,1);
 assert.equal(mark(2022,'q6bi','Excerpt 1 has male and female voices. Excerpt 2 has a solo singer with backing singers.').marks,0);
 assert.equal(mark(2023,'q6bi','Excerpt 1 is adagio. Excerpt 2 uses accelerando from adagio to allegro.').marks,0);
 assert.equal(mark(2023,'q6bi','Excerpt 1 is adagio. Excerpt 2 uses accelerando from andante to allegro.').marks,1);
});
test('additional incorrect periods are rejected even when not present in older per-year lists',()=>{
 for(const year of [2016,2017,2018,2019,2022,2023,2024,2025,2026]){
  const c=cases[year];assert.equal(mark(year,'q6bii',`Excerpt 1 is ${c.periods[0]} or contemporary jazz because it uses ${c.reasons[0]}.`).marks,0);
 }
});
