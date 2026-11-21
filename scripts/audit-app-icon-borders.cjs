/* Audit app identity icons, excluding the Hub wordmark, PWA logos and small
   concept/category illustrations that are not app tiles. */
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),sharp=require('sharp');
const root=path.resolve(__dirname,'..');
function appIcons(){const html=fs.readFileSync(path.join(root,'index.html'),'utf8'),start=html.indexOf('const appIcons = '),end=html.indexOf('\n};',start);return vm.runInNewContext(html.slice(start,end+3)+';appIcons');}
async function run(){const mapped=appIcons(),files=[...new Set([...Object.values(mapped).map(url=>url.split('?')[0]),...['bandle-icon.svg','bass-patterns-icon.svg','cadences-icon.svg','group-icon.svg'].map(file=>'app-icons/'+file)])],report={appEntries:Object.keys(mapped).length,uniqueAssets:files.length,failures:[],checked:[]};
 for(const file of files){const {data}=await sharp(path.join(root,file)).resize(128,128).ensureAlpha().raw().toBuffer({resolveWithObject:true});const px=(x,y)=>[...data.subarray((y*128+x)*4,(y*128+x)*4+4)];const outside=px(64,4),edge=px(64,6),inside=px(64,8),corner=px(0,0);const problems=[];if(outside[3]>10||corner[3]>10)problems.push('Frame does not have the shared transparent outer margin');if(edge[3]<220||edge.slice(0,3).some(v=>v<215||v>250)||edge[2]<edge[0])problems.push('Missing or mismatched light-grey border');if(inside[3]<240||inside.slice(0,3).some(v=>v<250))problems.push('Missing white tile interior');report.checked.push({file,problems});if(problems.length)report.failures.push({file,problems});}
 return report;
}
async function write(){const report=await run(),dir=path.join(root,'maintenance/generated/app-icon-borders');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,'report.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({appEntries:report.appEntries,uniqueAssets:report.uniqueAssets,failures:report.failures},null,2));if(report.failures.length)process.exitCode=1;return report;}
if(require.main===module)write();module.exports={run,appIcons};
