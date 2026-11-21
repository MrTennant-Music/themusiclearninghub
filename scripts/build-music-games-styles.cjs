/* Extend the authored National 3 Styles approach to N4, N5, Higher and AH.
   Source wording: local Music Dictionary and its level-specific question banks.
   Run this builder to update authored data, SVG previews and the local chooser index. */
const fs=require('node:fs'),path=require('node:path');
const C=require('../music-games/core'),dictionary=require('../music-dictionary/music-concepts-data');
const {facts,sentences,orders}=require('./music-games-styles-data.cjs');
const levels=[['N4','National 4','national4'],['N5','National 5','national5'],['H','Higher','higher'],['AH','Advanced Higher','advanced-higher']];
const groups={
 N4:[['Concerto','Opera','Mouth music','Rapping'],['Baroque','Ragtime','Reggae','Swing'],['Romantic','Scots ballad','African music','Reggae']],
 N5:[['Aria','Bothy ballad','Celtic rock','Classical'],['Chorus','Gaelic psalm','Indian','Minimalist'],['Gospel','Pibroch','Symphony','Waulking song']],
 H:[['Chamber music','Impressionist','Lied','Musique concrète'],['Jazz funk','Mass','Oratorio','Sonata'],['Plainchant','Recitative','Soul music','String quartet']],
 AH:[['Anthem','Ayre or air','Ballett','Serial'],['Chorale','Galliard','Pavan','Nationalist'],['Madrigal','Motet','Neoclassical','Contemporary jazz'],['Renaissance','Electronic dance music (EDM)','Contemporary jazz','Serial']]
};
const puzzleName=name=>({'Electronic dance music (EDM)':'Electronic dance music','Ayre or air':'Ayre'}[name]||name).normalize('NFD').replace(/[\u0300-\u036f]/g,'');
const extraAliases={
 'African music':['African'], 'Mouth music':['Puirt-a-beul','Puirt a beul','Puirt-à-beul','Puirt à beul','Port-a-beul','Port a beul'],
 'Minimalist':['Minimalism','Minimalist music'], 'Impressionist':['Impressionism','Impressionist music'],
 'Nationalist':['Nationalism','Nationalist music'], 'Neoclassical':['Neoclassicism','Neoclassical music'],
 'Serial':['Serialism','Serial music','Twelve-tone serialism'], 'Plainchant':['Gregorian chant','Plainsong'],
 'Rapping':['Rap'], 'Gaelic psalm':['Gaelic psalm singing'], 'Pibroch':['Piobaireachd','Pìobaireachd','Ceol mor','Ceòl mòr'], 'Ayre or air':['Ayre / air','Ayre/air'], 'Pavan':['Pavane'], 'Lied':['Lieder'], 'Soul music':['Soul'],'Chorus':['Choir'],'String quartet':['Quartet']
};
const musicSuffix=new Set(['Baroque','Ragtime','Reggae','Romantic','Swing','Celtic rock','Classical','Gospel','Indian','Jazz funk','Contemporary jazz','Renaissance']);
function aliases(c){return [...new Set([c.name,...c.aliases,...c.name.split(/\s+or\s+/),puzzleName(c.name),...(extraAliases[c.name]||[]),...(musicSuffix.has(c.name)?[c.name+' music']:[])])].slice(0,8);}
// Explicit work/period contexts stop broader valid terms competing as wrong answers.
const definitionClues={
 'Concerto':'Name the type of orchestral work featuring an instrumental soloist, rather than its historical period.',
 'Opera':'Name the type of staged dramatic work in which most or all of the story is sung, rather than a historical style period.',
 'Rapping':'Rhyming words delivered as rhythmic speech, characteristically over a hip-hop beat. Name the vocal style.',
 'Romantic':'Name the 19th-century historical period associated with Chopin and Liszt, expressive rubato, chromatic harmony and an expanded orchestra.',
 'Impressionist':'Name the late-19th- and early-20th-century French style associated with Debussy, atmospheric tone colour, modal or whole-tone writing and parallel harmony.',
 'Neoclassical':'Name the 20th-century revival of earlier forms and Classical balance using modern harmony and rhythm, associated with works such as Stravinsky’s Pulcinella.',
 'Serial':'Name the compositional approach using a predetermined ordered series, especially a row of twelve chromatic pitch classes and its transformations.',

 'African music':'A broad course label covering African traditions whose examples may include layered percussion, interlocking rhythms and call-and-response singing.',
 'Baroque':'The historical musical period approximately 1600–1750, associated with continuo, contrapuntal writing and composers such as Bach and Handel.',
 'Ragtime':'An early piano style with a syncopated melody against a steady left-hand bass-note-and-chord accompaniment.',
 'Reggae':'A Jamaican popular style with a strong low bass line, relaxed groove and short guitar or keyboard chords emphasising off-beats.',
 'Chamber music':'The general category of instrumental music for a small ensemble, normally with one player per part; string quartets and piano trios are examples.',
 'Minimalist':'A style using short repeating patterns which change gradually through processes such as phasing, adding notes or layering parts.',
 'Indian':'In course listening examples, this traditional music is often identified by sitar and tabla, a drone, ornamented improvisation and repeating rhythmic cycles.',
 'Classical':'The historical period associated with Haydn and Mozart, between the Baroque and Romantic periods, with clear melodies and balanced phrases.',
 'Oratorio':'A large concert work telling a sacred or biblical story through soloists, choir and orchestra, without theatrical acting, scenery or costumes.',
 'Sonata':'A multi-movement work for solo piano, often with contrasting fast and slow movements. Name the type of work.',
 'String quartet':'An ensemble of exactly two violins, viola and cello, or a work written for this ensemble.',
 'Ayre or air':'The course term for a simple song or melody, including a late-Renaissance English solo song with lute accompaniment.',
 'Contemporary jazz':'Recent jazz using improvisation with extended or chromatic harmony, complex rhythms, electronics or unusual instrumental techniques.',
 'Renaissance':'The European historical musical period approximately 1400–1600. Name the period, rather than one of its individual vocal or dance forms.'
};
function alternatives(concept,question,styles){
 const excluded=new Set(aliases(concept).map(C.canonical));
 // A ballett is itself a kind of madrigal; that broader label must never be marked false.
 if(concept.name==='Ballett')excluded.add(C.canonical('Madrigal'));
 const seen=new Set();return [...question.answers.filter(a=>!a.correct).map(a=>a.text),...styles.map(c=>c.name)].filter(name=>{const key=C.canonical(name);if(excluded.has(key)||seen.has(key))return false;seen.add(key);return true;}).slice(0,3);
}
function cloze(marked,alternatives){let clozeText='',last=0;const clozeGaps=[];for(const m of marked.matchAll(/\[\[(.*?)\]\]/g)){clozeText+=marked.slice(last,m.index);const start=clozeText.length;clozeText+=m[1];clozeGaps.push({start,end:clozeText.length,text:m[1]});last=m.index+m[0].length;}clozeText+=marked.slice(last);return {prompt:clozeText,clozeText,clozeGaps,answer:clozeGaps[0].text,distractors:alternatives};}
function makeActivities(){const activities=[];
 for(const [code,label,file]of levels){
  const styles=dictionary.concepts.filter(c=>c.level===label&&c.categories.includes('Styles'));
  const bank=require(`../data/questions/music-concepts/${file}.json`);
  function add(key,template,items,extra={}){if(!C.isHubLibraryTemplate(template))return;const id=`hub-${code.toLowerCase()}-styles-${key}`,activity=C.makeActivity({id,title:'Styles',level:code,template,folder:'Music Dictionary',tags:['Styles',label],description:`Practise the ${styles.length} ${label} Styles concepts from the Music Dictionary.`,options:{shuffle:true,timer:0,sound:true,theme:'blue'},revision:4,updatedAt:'2026-10-31T21:00:00.000Z',items:items.map((item,i)=>({id:`${id}-${i+1}`,...item})),...extra});const errors=C.validateActivity(activity);if(errors.length)throw Error(id+': '+errors.join('; '));activities.push(activity);}
  const definitions=styles.map(c=>{const q=bank.questions.find(q=>q.conceptId===c.id&&q.answerMode==='concept');if(!q)throw Error('Missing Styles clue '+c.name);return {prompt:definitionClues[c.name]||q.question.replace(/\s*(?:What is this|Which concept is this)\?\s*$/i,''),answer:c.name,distractors:alternatives(c,q,styles)};});
  for(const [key,template]of [['wordsearch','wordsearch'],['crossword','crossword']]){
   add(key+'-1',template,definitions.map((row,i)=>({...row,answer:['wordsearch','crossword'].includes(template)?puzzleName(row.answer):row.answer,distractors:['quiz','true-or-false'].includes(template)?row.distractors:[],...(['quiz','true-or-false'].includes(template)?{answerOptions:[row.answer,...row.distractors]}:{}),...(template==='type-the-answer'?{correctAnswers:aliases(styles[i])}:{})})),template==='wordsearch'?{editorMode:'with-clues'}:{});
  }
  add('blank-1','complete-the-sentence',styles.map(c=>{if(!sentences[c.name])throw Error('Missing Styles sentence '+c.name);return cloze(sentences[c.name],styles.filter(other=>other!==c).slice(0,3).map(other=>other.name));}));
  groups[code].forEach((set,i)=>{
   const items=set.flatMap(group=>{if(!facts[group]||facts[group].length!==4)throw Error('Expected four facts for '+group);return facts[group].map(fact=>({prompt:fact,answer:fact,group}));});
   if(items.some(item=>item.prompt.length>32))throw Error('Long fact: '+items.filter(item=>item.prompt.length>32).map(item=>item.prompt));
   for(const [key,template]of [['sort','group-sort'],['connections','matching-pairs']])add(`${key}-${i+1}`,template,items,{title:`Styles ${i+1}`,description:`Practise facts about ${set.join(', ')}.`,instructions:template==='group-sort'?'Place each fact under the style it best describes, then select Submit. Some musical features are shared between styles.':'Find four facts that best describe each style. Some musical features are shared between styles. Find all four groups.'});
  });
  add('order-1','rank-order',orders[code].names.map(name=>({prompt:name+' — '+orders[code].contexts[name],answer:name})),{description:orders[code].detail+' These are broad milestones, not exact beginnings.',instructions:'Order the broad development and popularity milestones, earliest first. Styles overlap and continue today.'});
 }
 return activities;
}
function build({includeNational3=false}={}){
 const activities=[...(includeNational3?require('./build-music-games-n3-styles.cjs').makeActivities():[]),...makeActivities()];
 require('./music-games-write-activities.cjs').writeActivities(activities);
 console.log(`Created and indexed ${activities.length} Styles activities across ${new Set(activities.map(a=>a.level)).size} qualification levels.`);return activities;
}
if(require.main===module)build({includeNational3:process.argv.includes('--include-n3')});module.exports={levels,groups,puzzleName,aliases,makeActivities,build};
