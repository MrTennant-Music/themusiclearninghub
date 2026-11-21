/* A listening task names the musical feature being assessed, without naming
   its answer or inventing a performer, count, chord sequence or audio cue. */
'use strict';
const D=require('../music-dictionary/music-concepts-data.js'),C=require('../music-dictionary/quiz-core.js');
const {allowedDistractor,recordingConcepts}=require('./quiz-distractor-overlap.cjs');
const {distractorScopeErrors}=require('./quiz-distractor-scope.cjs');
const byId=new Map(D.concepts.map(c=>[c.id,c])),focus=new Map();
const ids=numbers=>numbers.split(/\s+/).map(n=>'MC-'+n.padStart(4,'0'));
function assign(numbers,choice,typed=choice){for(const id of ids(numbers))focus.set(id,{choice,typed});}
assign('9 12','the direction of the melody');
assign('15 19','how the melody moves','the movement of the melody');
assign('10 13 80 159','the sound of the notes played together','the sound of the notes played together');
assign('11','the change in the chords','the change in the chords');
assign('14','the performer’s playing or singing','how the performer creates the musical phrases');
assign('16 17 18 108','the pattern in the melodic phrases','the pattern in the melodic phrases');
assign('21 24 28 29 99 102 105 177 242 247 285','the rhythmic feature');
assign('20 98 103 176 245 246','how the beats are grouped','the grouping of the beats');
assign('22 23 26 32 94 95 97 101 178 179 180','the tempo');
assign('25 209','the drumming','the drumming technique');
assign('27','the Scottish dance','the Scottish dance');
assign('31 33 100 104','the dance rhythm','the type of dance or march');
assign('30','what happens to the timing','the change in timing');
assign('34 40','the use of accompaniment','the use of accompaniment');
assign('35 38 41 107 184 187 188','how the parts sound together','the texture');
assign('36 86 171 173 233 283','the distance in pitch between notes');
assign('37 83 88 93 166 181 186 191 248','the accompaniment pattern');
assign('39','the performer’s role','the role of the featured performer');
assign('45 46 58 62 64','how the instrument is played','the playing technique');
assign('47 56 63 68','the instrument family');
assign('48 52 54 59 61 118 142 225 297 299','the group of performers');
assign('53 60','how the notes are played','the articulation');
assign('67','the sound source');
assign('81 168','what happens to the key','the change of key');
assign('82 157 227 228 229 230 277 278 279','the chord or chord sequence');
assign('84 85 156 235 280','the tonality');
assign('87 164 174 226 236 276 284','the ornament');
assign('89 90 175 231 234','the scale');
assign('91 167 172 257','the singing technique or word setting');
assign('96','how the melody begins','the opening of the melody');
assign('106','the solo passage');
assign('109 110 111 112 182 183 185 189 190 250 251 252 253 254 255 256 282 286 287 288 289 290 291 292 293 294 295 296','the musical structure or device');
assign('113 115 134 136 194 204 298','the type of singing voice');
assign('114','the role of the supporting voices');
assign('122 129 200 208','the effect on the instrument’s sound');
assign('158','the movement between neighbouring notes');
assign('160','the directions of the melodic parts');
assign('161 162 237','the extra melodic line');
assign('163 170','the change in pitch');
assign('165 169 232 238','the cadence');
assign('192','the use of instruments with the voices');
assign('193 201 207 259 261','the playing technique');
assign('239 240','the relationship between the keys');
assign('241','the final chord of the minor-key passage');
assign('243 244','the change in note lengths');
assign('258 260','the role of the instrumental group');
const periods=new Set(ids('70 77 148 274'));
for(const c of D.concepts){
 if(!focus.has(c.id)&&c.categories.includes('Styles'))focus.set(c.id,{choice:'the style',typed:periods.has(c.id)?'the period the music is from':'the style'});
 if(!focus.has(c.id)&&c.categories.includes('Timbre'))focus.set(c.id,{choice:'the instrument',typed:'the instrument'});
}
function focusedPrompt(q){
 const f=focus.get(q.conceptId);if(!f)return q.prompt;
 const action=q.options?'tick one box to identify '+f.choice:'name '+f.typed;
 return 'Listen to this excerpt and '+action+'.';
}
// Different dimensions can describe one melody at once. A leap can rise;
// a solo can be accompanied; a melody can repeat above a bass pattern.
const independentGroups=[ids('9 12'),ids('15 19'),ids('16 17 18 108'),ids('34 40'),ids('35 38 41 107 184 187 188'),ids('37 83 88 93 166 181 186 191'),ids('39')];
function independentDescription(target,candidate){
 const a=independentGroups.findIndex(g=>g.includes(target)),b=independentGroups.findIndex(g=>g.includes(candidate));
 if(a<0||b<0||a===b)return false;
 // Melody direction, size and recurring phrases are independent properties.
 if(a<=2&&b<=2)return true;
 // Texture and accompaniment patterns can coexist with melody features.
 return a>=3||b>=3;
}
const cues={
 'MC-0015':'A leap skips over neighbouring notes. The melody can leap upwards or downwards.',
 'MC-0016':'Listen for an opening phrase followed by a reply. This is question and answer.',
 'MC-0017':'Listen for the same musical idea returning. This is repetition.',
 'MC-0018':'A sequence repeats a phrase at a higher or lower pitch while keeping its melodic shape.',
 'MC-0019':'Stepwise movement uses neighbouring notes. The melody can move upwards or downwards.',
 'MC-0021':'An accent makes a note stand out with extra emphasis.',
 'MC-0024':'The pulse is the steady beat you can tap along with.',
 'MC-0025':'A drum fill is a short burst of extra drumming, often leading into a new phrase or section.',
 'MC-0030':'A pause holds a note or rest longer than expected before the music continues.',
 'MC-0034':'Accompaniment is a backing part that supports the melody.',
 'MC-0035':'Harmony is heard when different pitches sound together.',
 'MC-0036':'An octave uses the same note name at a higher or lower pitch, such as one C and the next C.',
 'MC-0037':'Listen for a short musical pattern that keeps repeating. This is an ostinato or riff.',
 'MC-0038':'In a round, parts begin the same melody at different times and overlap.',
 'MC-0039':'A solo features one performer. Other instruments or voices may still accompany them.',
 'MC-0040':'Unaccompanied means there is no backing part beneath the melody.',
 'MC-0041':'Unison means the parts play or sing the same melody at the same pitch and time.',
 'MC-0045':'Blowing sends air into an instrument to make a sound.',
 'MC-0046':'Bowing moves a bow across the strings to make a sound.',
 'MC-0053':'Legato means the notes are smooth and joined together.',
 'MC-0058':'Plucking pulls and releases a string, giving a clear attack followed by a fading sound.',
 'MC-0060':'Staccato means the notes are short and detached.',
 'MC-0062':'Striking or hitting makes a sound with a hand, stick or beater.',
 'MC-0064':'Strumming brushes across several strings to play a chord.',
 'MC-0080':'A broken chord plays the notes of a chord one after another instead of together.',
 'MC-0083':'A drone holds or repeats a note beneath a changing melody.',
 'MC-0086':'An octave uses the same note name at a higher or lower pitch, such as one C and the next C.',
 'MC-0087':'An ornament adds extra notes to decorate a melody.',
 'MC-0088':'A pedal holds or repeats a low note while the chords above it change.',
 'MC-0089':'A pentatonic scale uses five different notes in an octave.',
 'MC-0090':'A scale arranges notes in pitch order, going up or down.',
 'MC-0091':'Scat singing uses improvised vocal sounds, such as doo or ba, instead of words.',
 'MC-0093':'A vamp is a repeated accompaniment, often alternating a bass note on the beat with a chord off the beat.',
 'MC-0096':'An anacrusis is an incomplete opening bar leading into the first strong beat.',
 'MC-0098':'In compound time, each main beat divides into three equal parts.',
 'MC-0099':'Dotted rhythms use unequal note lengths, often in a long-short pattern.',
 'MC-0102':'A Scotch snap has a short accented note followed by a longer note.',
 'MC-0103':'In simple time, each main beat divides into two equal parts.',
 'MC-0106':'In a cadenza, the soloist plays a free, showy passage while the orchestra is silent.',
 'MC-0107':'In a canon, one part starts a melody and another follows with the same melody.',
 'MC-0108':'Imitation happens when one part copies a musical idea heard in another part.',
 'MC-0109':'A middle 8 is a contrasting section in a song, often eight bars long.',
 'MC-0110':'Ternary form follows an A–B–A plan: the opening section returns after a contrasting middle.',
 'MC-0111':'Theme and variation repeats a recognisable theme with changes to its musical features.',
 'MC-0112':'A verse usually brings new words. The chorus usually returns with the same words and music.',
 'MC-0122':'Distortion makes an amplified sound rougher or more buzzing.',
 'MC-0129':'A mute softens or changes an instrument’s tone.',
 'MC-0156':'Atonal music has no settled home key.',
 'MC-0158':'Chromatic movement uses semitone steps.',
 'MC-0159':'A cluster sounds neighbouring notes together, creating a clash.',
 'MC-0160':'Contrary motion means the parts move in opposite directions: one rises while another falls.',
 'MC-0161':'A countermelody is a separate melody heard alongside the main melody.',
 'MC-0162':'A descant is an extra high melody above the main vocal melody.',
 'MC-0163':'A glissando moves quickly through a series of pitches in a sliding effect.',
 'MC-0164':'A grace note is a short extra note that decorates a main note.',
 'MC-0165':'An imperfect cadence ends on chord V and sounds unfinished.',
 'MC-0166':'An inverted pedal holds or repeats a high note while the harmony below changes.',
 'MC-0167':'Melismatic word setting uses several notes for one syllable.',
 'MC-0168':'Modulation moves the music to a new key.',
 'MC-0169':'A perfect cadence moves from chord V to chord I and gives a settled ending.',
 'MC-0170':'A pitch bend raises or lowers a note smoothly.',
 'MC-0171':'A semitone is the smallest distance between neighbouring notes on a keyboard, such as C to C-sharp.',
 'MC-0172':'Syllabic word setting uses one note for each syllable.',
 'MC-0173':'A tone is a distance of two semitones, such as C to D.',
 'MC-0174':'A trill rapidly alternates a main note with the neighbouring note above.',
 'MC-0175':'Every step of a whole-tone scale is one tone.',
 'MC-0176':'In compound time, each main beat divides into three equal parts.',
 'MC-0177':'Cross rhythms combine contrasting rhythmic groupings at the same time.',
 'MC-0180':'Rubato allows small changes of speed for expression.',
 'MC-0181':'An Alberti bass repeats broken-chord notes in a low–high–middle–high pattern.',
 'MC-0182':'Binary form has two main sections, A and B.',
 'MC-0183':'A coda is an added closing section at the end.',
 'MC-0184':'Contrapuntal music combines two or more independent melodic lines.',
 'MC-0185':'An episode is a contrasting section between returns of the main theme in rondo form.',
 'MC-0186':'A ground bass repeats a bass pattern while the music above it changes.',
 'MC-0187':'Homophonic texture has a main melody supported by chords. Parts may move together in the same rhythm.',
 'MC-0188':'Polyphonic texture combines two or more independent melodic lines.',
 'MC-0189':'Rondo form brings back the main A section between contrasting episodes, as in A–B–A–C–A.',
 'MC-0190':'A strophic song uses the same music for each verse, with different words.',
 'MC-0191':'A walking bass moves steadily on the beat, often using steps.',
 'MC-0192':'A cappella means singing without instruments.',
 'MC-0201':'Flutter-tonguing gives a held wind note a rapid fluttering or growling sound.',
 'MC-0208':'Reverb makes a sound linger, as if it is in a large hall.',
 'MC-0209':'A roll uses rapid repeated percussion strokes to make a continuing sound.',
 'MC-0233':'An interval is the distance in pitch between two notes.',
 'MC-0257':'Coloratura uses fast vocal runs and ornaments.',
 'MC-0258':'The concertino is the small group of soloists in a concerto grosso.',
 'MC-0260':'The ripieno is the larger instrumental group that contrasts with the concertino in a concerto grosso.',
 'MC-0261':'Tremolando rapidly repeats notes to create a trembling sound.'
};
function refineListeningQuestion(q,selection,protectedIds=new Set()){
 const next=C.copy(q);if(q.editorialCheck?.scottishMarchContext||q.modality!=='audio'||protectedIds.has(q.id)||q.review?.updatedAt||q.review?.finalisedAt)return next;
 next.prompt=focusedPrompt(q);
 if(cues[q.conceptId])next.feedback=cues[q.conceptId];
 if(q.options){
  const entry=selection.entries.find(e=>e.conceptId===q.conceptId&&e.sha256===q.media.sha256);
  if(!entry)return next;
  const known=recordingConcepts(entry,selection.entries),ceiling=D.levels.indexOf(byId.get(q.conceptId).level),used=new Set(next.options.map(o=>o.conceptId));
  for(const option of next.options.filter(o=>!next.answer.correctOptionIds.includes(o.id)&&independentDescription(q.conceptId,o.conceptId))){
   const candidates=D.concepts.filter(c=>!used.has(c.id)&&D.levels.indexOf(c.level)<=ceiling&&!independentDescription(q.conceptId,c.id)&&allowedDistractor(q.conceptId,c.id,known)&&!distractorScopeErrors({id:q.id,levelCode:q.levelCode,options:[{id:'x',text:c.name}],answer:{correctOptionIds:[]}}).length);
   // Prefer another term answering the same focused task. Otherwise use a
   // distinct taught feature, as in the teacher's mixed N3 answer choices.
   candidates.sort((a,b)=>Number(focus.get(b.id)?.choice===focus.get(q.conceptId)?.choice)-Number(focus.get(a.id)?.choice===focus.get(q.conceptId)?.choice)||C.stable([q.id,a.id]).split('').reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0)-C.stable([q.id,b.id]).split('').reduce((n,c)=>(n*31+c.charCodeAt(0))>>>0,0));
   if(!candidates.length)continue;const replacement=candidates[0];used.delete(option.conceptId);used.add(replacement.id);option.conceptId=replacement.id;option.text=replacement.name;option.editorialRationale='A distinct taught concept; independent descriptions of the target feature and compatible recording concepts excluded.';
  }
  next.relatedConceptIds=next.options.filter(o=>!next.answer.correctOptionIds.includes(o.id)).map(o=>o.conceptId);
 }
 return next;
}
module.exports={focusedPrompt,independentDescription,refineListeningQuestion};

async function prepare(exportFile){
 const fs=require('node:fs'),path=require('node:path'),root=path.resolve(__dirname,'..'),dir=path.join(root,'music-dictionary/quiz-data');
 const read=name=>JSON.parse(fs.readFileSync(path.join(dir,name+'.json'),'utf8'));
 const browser=JSON.parse(fs.readFileSync(exportFile,'utf8')),protectedIds=new Set(browser.records.map(r=>r.id));
 const bank=read('audio-question-bank'),selection=read('audio-library-selection'),records=[],changes=[];
 const {questionVocabularyErrors}=require('./quiz-question-vocabulary.cjs'),{audioOverlapErrors}=require('./quiz-distractor-overlap.cjs');
 for(const q of bank.questions){
  const next=refineListeningQuestion(q,selection,protectedIds);
  if(C.stable(C.content(next))===C.stable(C.content(q)))continue;
  next.editorialCheck={...next.editorialCheck,listeningFocusReview:'2026-11-12'};
  next.contentSha256=await C.fingerprint(next);
  const errors=[...C.validateQuestion(next),...questionVocabularyErrors(next),...audioOverlapErrors(next,selection.entries)];
  if(errors.length)throw new Error(q.id+': '+errors.join('; '));
  records.push({id:q.id,baseContentSha256:q.contentSha256,question:next});
  changes.push({id:q.id,before:{prompt:q.prompt,feedback:q.feedback,options:q.options},after:{prompt:next.prompt,feedback:next.feedback,options:next.options}});
 }
 const review={schemaVersion:browser.schemaVersion,bankId:browser.bankId,records};
 fs.writeFileSync('/private/tmp/listening-focus-review.json',JSON.stringify(review,null,2)+'\n');
 fs.writeFileSync(path.join(dir,'listening-focus-audit.json'),JSON.stringify({date:'2026-11-12',protectedIds:[...protectedIds],changes},null,2)+'\n');
 console.log('Prepared '+records.length+' listening question revisions.');
 return review;
}
module.exports.prepare=prepare;
if(require.main===module)prepare(process.argv[2]).catch(error=>{console.error(error);process.exitCode=1;});
