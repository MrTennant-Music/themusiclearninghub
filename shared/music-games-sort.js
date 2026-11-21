/* New boards use shared source facts. Recipes preserve the exact board in compact QR links. */
(function(root,factory){const api=typeof module==='object'&&module.exports?factory(require('../music-games/core'),require('./music-games-sort-data'),require('./music-games-facts'),require('./concept-level-priority')):factory(root.IGCore,root.MLHSortData,root.MLHFacts,root.MLHConceptLevelPriority);if(typeof module==='object'&&module.exports)module.exports=api;else root.MLHSort=api;})(typeof globalThis==='undefined'?this:globalThis,function(C,D,F,prioritise){
 'use strict';
 const factsEnabled=false;
 const levels=['N3','N4','N5','H','AH'],elements=['Style','Melody/harmony','Rhythm/tempo','Texture/structure/form','Timbre'];
 const types={all:'Headings',elements:'Headings',styles:'Styles',instruments:'Instrument Families',periods:'Musical Periods',facts:'Facts'};
 const names=new Map(D.concepts.map(c=>[c.id,c]));

 // Catalogue recordings with clear examples of each selected style.
 const styleRecordings=[
  ["01. National 3", "Blues", [
   "01. Albert King - Born Under A Bad Sign - Blues.m4a",
   "02. B.B. King - Sweet Little Angel - Blues.m4a",
   "04. Bessie Smith - St. Louis Blues - Blues.m4a",
  ]],
  ["01. National 3", "Jazz", [
   "01. Art Pepper - Birk's Works - Jazz.m4a",
   "03. Benny Goodman - Sing, Sing, Sing - Jazz.m4a",
   "04. Billie Holiday - All Of Me - Jazz.m4a",
  ]],
  ["01. National 3", "Latin American", [
   "01. Buena Vista Social Club - Chan Chan - Latin American.m4a",
   "02. Celia Cruz - La Vida Es Un Carnaval - Latin American.m4a",
   "03. El Gran Combo - Me Libere - Latin American.m4a",
  ]],
  ["01. National 3", "Musical", [
   "01. Cats - Memory - Musical.m4a",
   "02. Fiddler on the Roof - If I Were A Rich Man - Musical.m4a",
   "03. Hairspray - You Can’t Stop The Beat - Musical.m4a",
  ]],
  ["01. National 3", "Rock", [
   "01. AC-DC - Back In Black - Rock.m4a",
   "02. Biffy Clyro - Black Chandelier - Rock.m4a",
   "03. Bon Jovi - Livin' On A Prayer - Rock.m4a",
  ]],
  ["01. National 3", "Rock 'n' Roll", [
   "01. Bill Haley And His Comets - Rock Around The Clock - Rock 'n' Roll.m4a",
   "02. Buddy Holly - Rave On - Rock 'n' Roll.m4a",
   "03. Carl Perkins - Blue Suede Shoes - Rock 'n' Roll.m4a",
  ]],
  ["02. National 4", "African Music", [
   "01. Africana Fefeworwor Dance Ensemble - Agbadza - African Music.m4a",
   "02. Bassidi And Khalifa Kone - Balafon And Djembe Duet - African Music.m4a",
   "03. Brown Ghanaian Drumming Ensemble - Adowa - African Music.m4a",
  ]],
  ["02. National 4", "Baroque", [
   "02. Antonio Vivaldi - Gloria - mvt. I Gloria - Baroque.m4a",
   "04. Johann Sebastian Bach - Brandenburg Concerto No. 3 - Allegro - Baroque.m4a",
   "11. Arcangelo Corelli - Concerto Grosso No. 4 - Baroque.m4a",
  ]],
  ["02. National 4", "Mouth Music", [
   "03. Brian O Headhra And Fionnag Nicchoinnich - Puirt A Beul - Mouth Music.m4a",
   "04. Coisir Bun-Sgoil Ghaidhlig Inbhir Nis - Puirt A Beul - Mouth Music.m4a",
  ]],
  ["02. National 4", "Ragtime", [
   "01. James Scott - Frog Legs Rag - Ragtime.m4a",
   "03. Joseph Lamb - American Beauty Rag - Ragtime.m4a",
   "05. Joshua Rifkin - The Ragtime Dance - Ragtime.m4a",
  ]],
  ["02. National 4", "Reggae", [
   "01. Bob Marley & The Wailers - Could You Be Loved - Reggae.m4a",
   "03. Bob Marley And The Wailers - Three Little Birds - Reggae.m4a",
   "04. Burning Spear - Follow Marcus Garvey - Reggae.m4a",
  ]],
  ["03. National 5", "Celtic Rock", [
   "01. Fiddler's Green - The Congress Reel - Celtic Rock.m4a",
   "02. Horslips - Dearg Doom - Celtic Rock.m4a",
   "07. Runrig - Loch Lomond - Celtic Rock.m4a",
  ]],
  ["03. National 5", "Gospel", [
   "01. 103rd Street Gospel Choir - I'd Sho' Shout About It - Gospel.m4a",
   "02. ACM Gospel Choir - He Reigns - Gospel.m4a",
   "03. Aretha Franklin - Mary Dont You Weep - Gospel.m4a",
  ]],
  ["03. National 5", "Indian", [
   "01. Anoushka Shankar - Pancham Se Gara - Indian.m4a",
   "02. Anupama Bhagwat And Ravindra Yavgal - Raag Mishra Kafi - Indian.m4a",
   "03. Budhaditya Mukherjee - Raag Darbari Kanada - Indian.m4a",
  ]],
  ["03. National 5", "Minimalist", [
   "01. Philip Glass - Akhnaten - Minimalist.m4a",
   "04. John Adams - Shaker Loops - Shaking And Trembling - Minimalist.m4a",
   "05. Michael Nyman - Chasing Sheep Is Best Left To Shepherds - Minimalist.m4a",
  ]],
  ["03. National 5", "Pibroch", [
   "01. Andrew Carlisle - Farewell To The Laird Of Islay - Pibroch.m4a",
   "02. Jim McGillivray - His Fathers Lament For Donald Mac Kenzie - Pibroch.m4a",
   "09. Pipe Major William Livingstone - A Flame Of Wrath For Squinting Patrick - Pibroch.m4a",
  ]],
  ["04. Higher", "Impressionist", [
   "02. Claude Debussy - Images - Book 2 - mvt. I Cloches À Travers Les Feuilles - Impressionist.m4a",
   "04. Claude Debussy - La Mer - mvt. II Jeux De Vagues - Impressionist.m4a",
   "15. Maurice Ravel - Une Barque Sur L'Océan - Très Souple De Rythme - Impressionist.m4a",
  ]],
  ["04. Higher", "Jazz Funk", [
   "01. Billy Cobham - Panhandler - Jazz Funk.m4a",
   "03. Bob James - Nautilus - Jazz Funk.m4a",
   "04. Deodato - Also Sprach Zarathustra - Jazz Funk.m4a",
  ]],
  ["04. Higher", "Mass", [
   "01. Johann Sebastian Bach - In B Minor - Kyrie - Mass.m4a",
   "02. Ludwig van Beethoven - In C Major - mvt. I Kyrie - Mass.m4a",
   "03. Leonard Bernstein - mvt. VI Gloria - Gloria Tibi  - Mass.m4a",
  ]],
  ["04. Higher", "Plainchant", [
   "01. [anonymous] - Ave Maris Stella - Hymnus - Plainchant.m4a",
   "02. Anonymous - Requiem Aeternam Dona Eis, Domine - Plainchant.m4a",
  ]],
  ["04. Higher", "Soul Music", [
   "01. Al Green - Lets Stay Together - Soul Music.m4a",
   "02. Aretha Franklin - Respect - Soul Music.m4a",
   "06. Etta James - Id Rather Go Blind - Soul Music.m4a",
  ]],
  ["04. Higher", "String Quartet", [
   "01. Alexander Borodin - String Quartet No. 2 In D - mvt. III Notturno - String Quartet.m4a",
   "02. Béla Bartók - No. 1 - Lento - String Quartet.m4a",
   "03. Ludwig van Beethoven - No. 4 - mvt. I - String Quartet.m4a",
  ]],
  ["05. Advanced Higher", "Ballett", [
   "01. Thomas Greaves - Comeaway - Ballett.m4a",
   "02. Thomas Morley - Dainty Fine Sweet Nymph - Ballett.m4a",
   "12. Thomas Weelkes - Ballets & Madrigals, Vol. 1 - No. 8, Hark, All Ye Lovely Saints Above - Ballett.m4a",
  ]],
  ["05. Advanced Higher", "Electronic Dance Music (EDM)", [
   "01. Avicii - Levels - Electronic Dance Music (EDM).m4a",
   "02. Calvin Harris - Summer - Electronic Dance Music (EDM).m4a",
   "03. Chase And Status - End Credits - Electronic Dance Music (EDM).m4a",
  ]],
  ["05. Advanced Higher", "Galliard", [
   "01. John Dowland - Captain Digorie Pipers Galliard - Galliard.m4a",
   "08. Orlando Gibbons - For Six Viols - Galliard.m4a",
   "09. Anthony Holborne - The Fairie Round - Galliard.m4a",
  ]],
  ["05. Advanced Higher", "Pavan", [
   "01. Thoinot Arbeau - Belle Qui Tiens Ma Vie - Pavane - Pavan.m4a",
   "02. William Byrd - The Earl Of Salisbury Pavan - Pavan.m4a",
   "03. John Dowland - Lachrimae Antiquae - Pavan.m4a",
  ]],
  ["05. Advanced Higher", "Serial", [
   "01. Piano Demonstration - Glass Mosaic - Serial.m4a",
   "05. Alban Berg - Lyric Suite - Allegretto Gioviale - Serial.m4a",
   "06. Luigi Dallapiccola - Quaderno Musicale Di Annalibera - mvt. VIII Ritmi - Serial.m4a",
  ]],
 ];
 const styleConcepts=new Map(D.concepts.filter(concept=>concept.categories.includes('Style')).map(concept=>[concept.name.toLowerCase(),concept]));
 const styles=new Map(styleRecordings.map(([level,folder,files])=>{
  const concept=styleConcepts.get(folder.toLowerCase());
  return [concept.name,files.map(file=>({
   key:concept.id+':'+file.split('.')[0],
   conceptId:concept.id,
   src:'./audio/concept-library/'+[level,'01. Styles',folder,file].map(encodeURIComponent).join('/')
  }))];
 }));
 const overlappingStyles=[['Blues','Soul music'],["Rock 'n' roll",'Celtic rock'],['Rock',"Rock 'n' roll"]];
 const levelStylesFamily='level-styles';
 const styleConceptForGroup=group=>names.get(styles.get(group)?.[0].conceptId);
 const styleCollection={type:'styles',title:'Styles',audio:true,icon:'./music-dictionary/quiz-icons/styles-speaker.png'};
 function inScope(c,level,below){return c.level===level||below&&levels.indexOf(c.level)<=levels.indexOf(level);}
 function eligibleStyles(level){
  return [...styles].filter(([name,recordings])=>recordings.length>=3&&inScope(styleConceptForGroup(name),level,true)).map(([name])=>name);
 }
 const collections=[...levels.map(level=>({...styleCollection,level,count:eligibleStyles(level).length})),...levels.map(level=>({type:'facts',level,title:'Facts',get count(){return F.pool(level).length;},icon:'./ui-icons/concept-sort-facts.png'})),{type:'instruments',level:'N5',title:'Instrument Families',count:D.instruments.length,icon:'./music-dictionary/quiz-icons/instruments-ensembles-orchestra.png'},...Object.entries(D.musicalPeriods).map(([level,bank])=>({type:'periods',level,title:'Musical Periods',count:bank.cards.length,icon:'./ui-icons/musical-periods-beethoven-transparent.png'}))].filter(row=>factsEnabled||row.type!=='facts');
 function availableTypes(level){return ['elements',...collections.filter(c=>c.level===level).map(c=>c.type)];}
 function styleFits(group,groups){
  return !overlappingStyles.some(pair=>pair.includes(group)&&groups.some(other=>other!==group&&pair.includes(other)));
 }
 function restoreStyles(recipe){
  const {groups,cards}=recipe;
  const counts=groups.map(group=>cards.filter(card=>card.group===group).length);
  // Previously shared rounds had one clip in each of three groups.
  const legacy=recipe.family!==levelStylesFamily&&cards.length===3&&counts.filter(count=>count===1).length===3;
  const complete=cards.length===12&&counts.every(count=>count===3);
  if(groups.length!==4||(!complete&&!legacy)||new Set(cards.map(card=>card.key)).size!==cards.length||groups.some(group=>!styles.has(group)||!styleFits(group,groups)))throw Error('Styles needs three different excerpts in each of four groups.');
  if(recipe.family===levelStylesFamily&&groups.some(group=>!inScope(styleConceptForGroup(group),recipe.level,recipe.includeBelow)))throw Error('A style is outside the levels allowed for this round.');
  const items=cards.map((card,index)=>{
   const recording=groups.includes(card.group)&&styles.get(card.group).find(row=>row.key===card.key);
   if(!recording)throw Error('This style recording is unavailable.');
   return {id:'sort-card-'+index,prompt:'',answer:card.group,group:card.group,acceptedGroups:[card.group],sourceConceptId:recording.conceptId,media:{type:'audio',src:recording.src,name:'Excerpt '+(index+1)}};
  });
  return makeSortActivity(recipe,items,'Play each excerpt and place it in the matching style.');
 }
 function makeSortActivity(recipe,items,instructions){
  const activity=C.makeActivity({id:C.uid(),level:recipe.level,title:types[recipe.type],template:'group-sort',collectionId:'generated-sort-'+recipe.type,sortRecipe:recipe,tags:['generated-sort'],instructions,sourceConceptIds:[...new Set(items.map(item=>item.sourceConceptId).filter(Boolean))],items});
  const check=C.compatibility('group-sort',activity);if(!check.ok)throw Error(check.reason);return activity;
 }
 function fromRecipe(recipe){
  if(recipe?.type==='facts')return F.fromRecipe(recipe);
  recipe={...recipe,family:recipe?.family||'topics'};
  if(recipe.type==='periods'&&recipe.level==='N5'){const group=name=>name==='Renaissance'?'Baroque':name;recipe={...recipe,groups:Array.isArray(recipe.groups)?[...new Set(recipe.groups.map(group))]:recipe.groups,cards:Array.isArray(recipe.cards)?recipe.cards.map(card=>({...card,group:group(card.group)})):recipe.cards};}
  if(recipe.type==='periods'&&recipe.level==='H'){const group=name=>['Medieval','Renaissance'].includes(name)?'Pre-Baroque':name;recipe={...recipe,groups:Array.isArray(recipe.groups)?[...new Set(recipe.groups.map(group))]:recipe.groups,cards:Array.isArray(recipe.cards)?recipe.cards.map(card=>({...card,group:group(card.group)})):recipe.cards};}
  if(recipe?.version!==D.version)throw Error('This sort uses an older source bank. Create a new shared link.');
  if(!availableTypes(recipe.level).includes(recipe.type))throw Error('This sort type is no longer available. Start a new Headings game.');
  if(!levels.includes(recipe.level)||!Array.isArray(recipe.cards)||recipe.cards.length<2||recipe.cards.length>40||!Array.isArray(recipe.groups)||recipe.groups.length<2||recipe.groups.length>6||new Set(recipe.groups).size!==recipe.groups.length)throw Error('Invalid sort setup.');
  if(recipe.type==='styles')return restoreStyles(recipe);
  const used=new Set();
  const items=recipe.cards.map((card,i)=>{
   if(!recipe.groups.includes(card.group)||used.has(card.key))throw Error('Invalid sort card.');used.add(card.key);
   let prompt,media,acceptedGroups,sourceConceptId;
   const concept=names.get(card.key);if(!concept||recipe.type==='elements'&&!inScope(concept,recipe.level,recipe.includeBelow))throw Error('Concept is outside this level.');
   prompt=concept.name;sourceConceptId=concept.id;
   if(recipe.type==='instruments'){
    const instrument=D.instrumentPhotos.find(row=>row.id===card.key);if(!instrument)throw Error('Choose an available orchestral instrument.');
    acceptedGroups=[instrument.family];media={type:'image',src:instrument.file,name:instrument.name+' photograph',sourceUrl:instrument.sourceUrl,credit:instrument.credit,license:instrument.license,licenseUrl:instrument.licenseUrl,adaptation:instrument.adaptation};
   }else if(recipe.type==='periods'){
    const row=D.musicalPeriods[recipe.level]?.cards.find(row=>row.id===card.key);if(!row)throw Error('Concept is outside this Musical Periods collection.');acceptedGroups=row.groups;
   }else acceptedGroups=concept.categories.filter(g=>recipe.groups.includes(g));
   if(!acceptedGroups.includes(card.group))throw Error('Sort card has an invalid answer group.');
   return {id:'sort-card-'+i,prompt,answer:prompt||media?.name||sourceConceptId,group:card.group,acceptedGroups,sourceConceptId,...(media?{media}:{})};
  });
  if(recipe.type==='instruments'&&(items.length!==D.instruments.length||recipe.groups.length!==4||!['Strings','Woodwind','Brass','Percussion'].every(group=>recipe.groups.includes(group))))throw Error('Instrument Families includes all available instruments in four families.');
  if(recipe.type==='periods'){const bank=D.musicalPeriods[recipe.level];if(items.length!==bank.roundSize||recipe.groups.length!==bank.groups.length||!bank.groups.every(g=>recipe.groups.includes(g)))throw Error('Musical Periods needs its complete round and period groups.');}
  if(recipe.groups.some(g=>!items.some(item=>item.group===g)))throw Error('Every sort group needs a card.');
  return makeSortActivity(recipe,items,recipe.type==='periods'?'Sort concepts by their strongest historical period associations. Some fit more than one period.':recipe.type==='instruments'?'Place each instrument in its family, then select Submit.':'Place each card in a matching group, then select Submit.');
 }
 function create({level='N3',type='elements',includeBelow=true,cardCount=12,shuffle=C.shuffle}={}){
  if(!levels.includes(level)||!Object.hasOwn(types,type))throw Error('Choose a valid sort level and type.');
  if(type==='facts')return F.create({level,shuffle});
  if(type==='styles'){
   const groups=[];
   const eligible=eligibleStyles(level);
   for(const group of prioritise(shuffle(eligible),group=>styleConceptForGroup(group)?.level===level)){
    if(styleFits(group,groups))groups.push(group);
    if(groups.length===4)break;
   }
   const cards=groups.flatMap(group=>shuffle(styles.get(group)).slice(0,3).map(({key})=>({key,group})));
   return fromRecipe({version:D.version,level,type,family:levelStylesFamily,includeBelow:true,groups:shuffle(groups),cards:shuffle(cards)});
  }
  const max=Math.max(5,Math.min(40,Math.floor(Number(cardCount)||12)));
  if(type==='instruments'){
   if(level!=='N5')throw Error('Instrument Families is available at National 5.');
   return fromRecipe({version:D.version,level,type,family:'orchestra',includeBelow:false,groups:['Strings','Woodwind','Brass','Percussion'],cards:shuffle(D.instruments.map(row=>({key:row.id,group:row.family})))});
  }
  if(type==='periods'){
   const bank=D.musicalPeriods[level];if(!bank)throw Error('Musical Periods is available at National 5, Higher and Advanced Higher.');
   const pool=prioritise(shuffle(bank.cards),card=>names.get(card.id)?.level===level),cards=[],seen=new Set();
   for(const id of bank.requiredCards||[]){const row=pool.find(row=>row.id===id);if(!row)throw Error('Missing required period concept.');seen.add(id);cards.push({key:id,group:row.groups[0]});}
   for(const group of bank.groups){if(cards.some(card=>card.group===group))continue;const row=pool.find(row=>!seen.has(row.id)&&row.groups[0]===group);if(!row)throw Error('Missing representative period concept.');seen.add(row.id);cards.push({key:row.id,group});}
   for(const row of pool){if(cards.length>=bank.roundSize)break;if(seen.has(row.id))continue;seen.add(row.id);cards.push({key:row.id,group:row.groups[0]});}
   return fromRecipe({version:D.version,level,type,family:'musical-periods',includeBelow:true,groups:bank.groups,cards:shuffle(cards)});
  }
  type='elements';
  let groups=[],cards=[],family='topics';
   const pool=prioritise(shuffle(D.concepts.filter(c=>c.categories.length&&inScope(c,level,includeBelow))),c=>c.level===level),seen=new Set();groups=elements.slice();
   for(const group of groups){const c=pool.find(c=>!seen.has(c.id)&&c.categories.includes(group));if(c){seen.add(c.id);cards.push({key:c.id,group});}}
   groups=groups.filter(g=>cards.some(c=>c.group===g));
   for(const c of pool){if(cards.length>=Math.max(max,groups.length))break;if(seen.has(c.id))continue;const allowed=c.categories.filter(g=>groups.includes(g));if(!allowed.length)continue;seen.add(c.id);cards.push({key:c.id,group:allowed.sort((a,b)=>cards.filter(c=>c.group===a).length-cards.filter(c=>c.group===b).length)[0]});}
  return fromRecipe({version:D.version,level,type,family,includeBelow:Boolean(includeBelow),groups,cards:shuffle(cards)});
 }
 return {types,elements,collections,factsEnabled,create,fromRecipe,availableTypes,data:D};
});
