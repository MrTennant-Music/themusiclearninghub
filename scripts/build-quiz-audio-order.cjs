/* Author the separate audio-order bank without reusing existing quiz recordings. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),C=require('../music-dictionary/quiz-core'),A=require('../music-dictionary/quiz-audio-order'),D=require('../music-dictionary/music-concepts-data');
const root=path.resolve(__dirname,'..'),source=process.argv[2]||'/Users/bobbytennant/Library/CloudStorage/OneDrive-GlowScotland/Other/Audio Concept Library',out='music-dictionary/quiz-data/audio-order-question-bank.json';
const catalogue=require('../audio-concept-library-data.json'),old=require('../music-dictionary/quiz-data/audio-question-bank.json'),previous=fs.existsSync(out)?JSON.parse(fs.readFileSync(out)):null;
const normal=s=>s.toLowerCase().replace(/[^a-z0-9]/g,''),byName=new Map(D.concepts.map(c=>[normal(c.name),c]));
const usedHashes=new Set(old.questions.map(q=>q.media.sha256)),usedPaths=new Set(old.questions.map(q=>q.media.libraryPath)),chosenHashes=new Set(),chosen=[];
const hash=file=>crypto.createHash('sha256').update(fs.readFileSync(file)).digest('hex'),dictionaryHash=hash('music-dictionary/music-concepts-data.js');
function evidence(c){return {kind:'repository',path:'music-dictionary/music-concepts-data.js',locator:'/concepts/'+D.concepts.findIndex(x=>x.id===c.id)+'/definition',sourceSha256:dictionaryHash,supportingText:c.definition,verification:'Teacher-requested ordering task; library concept assignments retained for recorded examples.'};}
function choose(name,previousMedia){
 const c=catalogue.concepts.find(c=>normal(c.concept)===normal(name));if(!c)throw Error('No library folder for '+name);
 let candidates=c.files.filter(f=>!usedPaths.has(c.path+'/'+f)).sort((a,b)=>Number(!/demonstration/i.test(a))-Number(!/demonstration/i.test(b))||Number(/example|unnamed/i.test(a))-Number(/example|unnamed/i.test(b))||a.localeCompare(b,'en',{numeric:true}));
 if(previousMedia?.libraryPath){const filename=previousMedia.libraryPath.slice(c.path.length+1);if(candidates.includes(filename))candidates=[filename,...candidates.filter(f=>f!==filename)];}
 for(const allowRepeat of [false,true])for(const file of candidates){const relative=c.path+'/'+file,src=path.join(source,relative);if(!fs.existsSync(src))continue;const sha=hash(src);if(usedHashes.has(sha)||!allowRepeat&&chosenHashes.has(sha))continue;
  const dest=path.join(root,'audio/concept-library',relative);fs.mkdirSync(path.dirname(dest),{recursive:true});if(!fs.existsSync(dest)||hash(dest)!==sha)fs.copyFileSync(src,dest);chosenHashes.add(sha);
  const media={kind:'audio',src:'./audio/concept-library/'+relative.split('/').map(encodeURIComponent).join('/'),libraryPath:relative,recording:file.replace(/^\d+\.\s*/,'').replace(/\.m4a$/i,''),duration:c.fileMeta?.[file]?.duration||45,sha256:sha};chosen.push({concept:name,...media});return media;
 }
 throw Error('No unused recording for '+name);
}
const definitions=[
 ['N3','Ascending','pitches-high-low',null,'Arrange the four piano notes from highest to lowest pitch.',{type:'pitches',direction:'high-low'}],
 ['N3','Descending','pitches-low-high',null,'Arrange the four piano notes from lowest to highest pitch.',{type:'pitches',direction:'low-high'}],
 ['N4','Soprano','voices',['Soprano','Alto','Tenor','Bass'],'Listen to each example. Arrange the voice types from highest to lowest.'],
 ['N5','Moderato','tempo',['Allegro','Moderato','Andante','Adagio'],'Listen to each example. Arrange the tempos from fastest to slowest.'],
 ['N5','Mezzo-soprano','voices',['Soprano','Mezzo-soprano','Alto','Tenor','Baritone','Bass'],'Listen to each example. Arrange the voice types from highest to lowest.'],
 ['N5','Viola','strings',['Violin','Viola','Cello','Double bass'],'Listen to each example. Arrange the string instruments from highest to lowest in their usual orchestral registers.'],
 ['N5','Piccolo','woodwind',['Piccolo','Flute','Oboe','Clarinet','Bassoon'],'Listen to each example. Arrange the woodwind instruments from highest to lowest in their usual orchestral registers.'],
 ['N5','French horn','brass',['Trumpet','French horn','Trombone','Tuba'],'Listen to each example. Arrange the brass instruments from highest to lowest in their usual orchestral registers.'],
 ['H','Augmentation','augmentation',null,'Listen to the four versions of the same piano motif. Arrange them from longest to shortest.',{type:'motifs',direction:'long-short'}],
 ['H','Diminution','diminution',null,'Listen to the four versions of the same piano motif. Arrange them from shortest to longest.',{type:'motifs',direction:'short-long'}],
 ['AH','Countertenor','male-voices',['Countertenor','Tenor','Baritone','Bass'],'Listen to each example. Arrange the male voice types from highest to lowest.'],
 ['H','Impressionist','periods',['Baroque','Classical','Romantic','Impressionist'],'Listen to each example. Arrange the musical periods and styles from oldest to newest, according to when they began.'],
 ['AH','Renaissance','periods',['Renaissance','Baroque','Classical','Romantic','Impressionist'],'Listen to each example. Arrange the musical periods and styles from oldest to newest, according to when they began.'],
 ['AH','Retrograde','retrograde',null,'Listen to the original piano motif, then arrange the four individual notes in retrograde, from top to bottom.',{type:'retrograde'}]
];
(async()=>{const questions=[];let seed=197;const random=()=>((seed=(Math.imul(seed,1664525)+1013904223)>>>0)/2**32);
for(const [level,anchorName,topic,names,prompt,generator]of definitions){const anchor=byName.get(normal(anchorName));if(!anchor)throw Error('Unknown concept '+anchorName);const id='AO-'+level+'-'+anchor.id.replace('-','')+'-ORDER01',prior=previous?.questions.find(q=>q.id===id),members=names?.map(n=>byName.get(normal(n)))||[];
 let q={id,conceptId:anchor.id,levelCode:level,objectiveId:id+'-objective',objective:prompt,factGroupId:'audio-order-'+level+'-'+topic,format:'order',modality:'audio',prompt,media:{kind:'audio-order'},options:[],answer:{correctOptionIds:[]},feedback:names?'Correct order: '+names.join(' → ')+'.':'The order is determined by the generated piano pitches or motif lengths.',evidence:[anchor,...members.filter(c=>c.id!==anchor.id)].map(evidence),relatedConceptIds:members.filter(c=>c.id!==anchor.id).map(c=>c.id),dictionaryLink:'music-dictionary/musicdictionaryconcept.html?concept='+anchor.id+'&level='+level,review:{editorialNotes:'Teacher-requested audio ordering. Recorded clips are unused in the existing listening bank; generated examples use fresh structured piano events. Full library performances have not been independently re-certified.'}};
 if(generator){q.generator=generator;q=A.realise(q,random);}else{q.options=members.map((c,i)=>({id:'clip-'+i,text:'Example '+String.fromCharCode(65+i),answerLabel:c.name,conceptId:c.id,media:choose(c.name,prior?.options.find(o=>o.conceptId===c.id)?.media)}));q.answer.correctOptionIds=q.options.map(o=>o.id);}
 if(generator){q.feedback=generator.type==='retrograde'?'Retrograde reverses the original sequence: its last note belongs at the top and its first note at the bottom.':generator.type==='motifs'?(topic==='augmentation'?'Augmentation lengthens note values. These versions keep the same pitches; the longest motif belongs at the top.':'Diminution shortens note values. These versions keep the same pitches; the shortest motif belongs at the top.'):(generator.direction==='high-low'?'The highest-pitched piano note belongs at the top and the lowest at the bottom.':'The lowest-pitched piano note belongs at the top and the highest at the bottom.');}
 q.contentSha256=await C.fingerprint(q);const errors=C.validateQuestion(q);if(errors.length)throw Error(id+': '+errors.join(' '));questions.push(q);
}
const bank={schemaVersion:1,bankId:'mlh-concept-quiz-audio-order-1',questions,recordingPolicy:'Every library clip is path- and SHA-distinct from the existing listening-question bank. Prefer different clips between these new questions, too.',recordings:chosen};fs.writeFileSync(out,JSON.stringify(bank,null,2)+'\n');console.log('Audio Order: '+questions.length+' questions, '+chosenHashes.size+' distinct additional library recordings.');
})().catch(e=>{console.error(e);process.exitCode=1;});
