/* Update only the supplied music game activities and chooser entries. */
const fs=require('node:fs'),path=require('node:path');
function writeActivities(activities){
 activities=activities.filter(a=>!require('./concept-sort-retired-collections.json').includes(a.id)).filter(a=>require('../music-games/core.js').isHubLibraryTemplate(a.template)&&!(['labelled-diagram','rank-order'].includes(a.template)&&a.tags?.includes('Music Literacy'))).map(require('./music-games-excluded-concepts.cjs').filterActivity);
 const crypto=require('node:crypto'),vm=require('node:vm');
 const hash=value=>crypto.createHash('sha256').update(value).digest('hex').slice(0,12),root=path.join(__dirname,'..'),dir=path.join(root,'music-games/activities');
 const changed=new Set(activities.map(a=>a.id)),index=JSON.parse(fs.readFileSync(path.join(dir,'index.json'),'utf8')).filter(a=>!changed.has(a.id));
 for(const a of activities){
  fs.writeFileSync(path.join(dir,a.id+'.json'),JSON.stringify(a,null,2)+'\n');
  const serialized=JSON.stringify(a);fs.writeFileSync(path.join(dir,a.id+'.js'),'window.IGRuntime.registerActivity('+serialized+');\n');
  const {id,title,description,level,template,folder,tags,revision,updatedAt,specialMode}=a;
  index.push({id,title,description,level,template,folder,tags,revision,updatedAt,...(specialMode?{specialMode}:{}),...(a.template==='labelled-diagram'?{catalogueHidden:true}:{}),diagramKey:'',itemCount:a.items.length,_builtin:true,file:'./music-games/activities/'+id+'.js?v='+hash(serialized)});
 }
 index.sort((a,b)=>a.id.localeCompare(b.id));fs.writeFileSync(path.join(dir,'index.json'),JSON.stringify(index,null,2)+'\n');
 const runtime=path.join(root,'music-games/runtime/index.js'),context={window:{}};vm.runInNewContext(fs.readFileSync(runtime,'utf8'),context);
 fs.writeFileSync(runtime,'window.IGActivityIndex='+JSON.stringify(index)+';\nwindow.IGRuntimeFiles='+JSON.stringify(context.window.IGRuntimeFiles)+';\n');
 require('./build-music-games-pages.cjs').build();
 return activities;
}
module.exports={writeActivities};
