/* Rebuild only the reviewed games whose required answers exceeded their level.
   N3 literacy's original authored JSON remains its source; keep the two content
   corrections idempotent here so the review can be reproduced. */
const fs=require('node:fs'),path=require('node:path'),C=require('../music-games/core');
const dir=path.resolve(__dirname,'../music-games/activities');
function build(){
 const changed=require('./build-music-games-level-tests.cjs').makeActivities().filter(a=>['hub-n3-level-test-blank','hub-n4-level-test-blank','hub-n5-level-test-blank'].includes(a.id));
 changed.push(require('./build-music-games-n3-styles.cjs').makeActivities().find(a=>a.id==='hub-n3-styles-blank-1'));
 const read=id=>JSON.parse(fs.readFileSync(path.join(dir,id+'.json')));
 const mixed=read('hub-dictionary-n5-mixed-definitions-complete-the-sentence-1');
 mixed.items=require('./music-games-blank-passages.cjs').buildBlankItems('N5',mixed.id);changed.push(C.normalize(mixed));
 const blank=read('hub-n3-music-literacy-blank-1');
 const item=blank.items.find(i=>/Notes moving from C up to D|repeated notes C then C/.test(i.clozeText||i.prompt));
 if(!item)throw Error('N3 pitch movement question is missing');
 const marked='Notes moving from C up to D move by [[step]]; the repeated notes C then C show [[repetition]].';
 let text='',end=0;const gaps=[];
 for(const match of marked.matchAll(/\[\[(.*?)\]\]/g)){text+=marked.slice(end,match.index);const start=text.length;text+=match[1];gaps.push({start,end:text.length,text:match[1]});end=match.index+match[0].length;}text+=marked.slice(end);
 Object.assign(item,{prompt:text,clozeText:text,clozeGaps:gaps,answer:gaps[0].text,distractors:['barline','clef','tempo','volume']});changed.push(C.normalize(blank));
 const connections=read('hub-n3-music-literacy-connections-1');
 const pitch=connections.items.find(i=>i.group==='Pitch movement'&&['Leap','Repetition'].includes(i.answer));
 if(!pitch)throw Error('N3 pitch movement card is missing');
 pitch.prompt=pitch.answer='Repetition';changed.push(C.normalize(connections));
 for(const a of changed){const errors=C.validateActivity(a);if(errors.length)throw Error(a.id+': '+errors.join('; '));}
 require('./music-games-write-activities.cjs').writeActivities(changed);
 return changed;
}
if(require.main===module)console.log('Updated '+build().length+' reviewed games.');
module.exports={build};
