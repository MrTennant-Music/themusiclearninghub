// Loopback-only editor. Save credited Commons URLs; Wikimedia serves the image files.
const http=require('node:http'),fs=require('node:fs/promises'),path=require('node:path');
const root=path.resolve(__dirname,'..');
const allowedOrigins=new Set(['http://127.0.0.1:8765','http://localhost:8765']);
const plain=value=>String(value||'').replace(/<[^>]*>/g,' ').replace(/&amp;/g,'&').replace(/&quot;/g,'"').replace(/&#39;/g,"'").replace(/\s+/g,' ').trim();
function commonsTitle(source){const u=new URL(source);if(u.protocol!=='https:'||u.hostname!=='commons.wikimedia.org'||u.port||u.username||u.password||!u.pathname.startsWith('/wiki/File:'))throw Error('Choose an image from the photo library.');return decodeURIComponent(u.pathname.slice('/wiki/'.length)).replaceAll('_',' ');}
function commonsPhotoInfo(page){
 const info=page?.imageinfo?.[0];if(!info?.mime?.startsWith('image/'))throw Error('This photo is unavailable. Choose another image.');
 const title=page.title,url=new URL(info.thumburl||info.url);
 if(url.protocol!=='https:'||url.port||url.username||url.password||!['upload.wikimedia.org','thumb.wikimedia.org'].includes(url.hostname))throw Error('Unsupported photo source.');
 const meta=info.extmetadata||{};
 return {pageId:page.pageid,photo:{src:url.href,alt:title.slice(5).replace(/\.[^.]+$/,''),caption:title.slice(5).replace(/\.[^.]+$/,''),credit:plain(meta.Artist?.value||meta.Credit?.value)||'Unknown author',license:plain(meta.LicenseShortName?.value)||'Source details',licenseUrl:meta.LicenseUrl?.value||info.descriptionurl,sourceUrl:info.descriptionurl.split('?')[0],sourceTitle:title.slice(5)}};
}
async function downloadPhoto(source){
 const title=commonsTitle(source);
 const api='https://commons.wikimedia.org/w/api.php?'+new URLSearchParams({action:'query',format:'json',formatversion:'2',redirects:'1',titles:title,prop:'imageinfo',iiprop:'url|mime|extmetadata',iiurlwidth:'960'});
 const response=await fetch(api,{headers:{'User-Agent':'MusicLearningHub-PhotoEditor/1.0'},signal:AbortSignal.timeout(30000)});if(!response.ok)throw Error('The photo source is unavailable. Please try again.');
 const data=await response.json();return commonsPhotoInfo(data.query?.pages?.[0]);
}
function browserManifest(data){return '/* Credited photographic illustrations for Concept Companion. Source: music-concepts-photos.json. */\n(function(root){const data='+JSON.stringify(data)+';if(typeof module!=="undefined"&&module.exports)module.exports=data;else root.MUSIC_CONCEPT_PHOTOS=data;})(typeof window!=="undefined"?window:globalThis);\n';}
function createPhotoServer({projectRoot=root,resolvePhoto=downloadPhoto}={}){
 let saving=Promise.resolve();
 const manifestPath=path.join(projectRoot,'music-dictionary/music-concepts-photos.json');
 const readManifest=async()=>JSON.parse(await fs.readFile(manifestPath,'utf8'));
 return http.createServer(async(req,res)=>{
  const origin=req.headers.origin;const headers={'Content-Type':'application/json','Cache-Control':'no-store'};
  if(origin&&!allowedOrigins.has(origin)){res.writeHead(403,headers);res.end(JSON.stringify({error:'Local editor access only.'}));return;}
  if(origin)headers['Access-Control-Allow-Origin']=origin;
  headers['Access-Control-Allow-Headers']='Content-Type';headers['Access-Control-Allow-Methods']='GET, POST, OPTIONS';
  const send=(status,data)=>{res.writeHead(status,headers);res.end(JSON.stringify(data));};
  try{
   if(req.method==='OPTIONS'){send(204,{});return;}
   if(req.method==='GET'&&req.url==='/photos'){send(200,await readManifest());return;}
   const match=/^\/photos\/(MC-\d{4})$/.exec(req.url);
   if(req.method!=='POST'||!match){send(404,{error:'Not found.'});return;}
   if(!origin||req.headers['content-type']!=='application/json'){send(403,{error:'Save photos from Music Dictionary.'});return;}
   let body='';for await(const chunk of req){body+=chunk;if(body.length>20000)throw Error('Photo request is too large.');}
   const {sourceUrl,remove}=JSON.parse(body);if(remove!==true)commonsTitle(sourceUrl);
   const id=match[1],initial=await readManifest();if(!Object.hasOwn(initial.concepts,id)){send(404,{error:'Unknown concept.'});return;}
   const chosen=remove===true?null:await resolvePhoto(sourceUrl);
   const save=async()=>{
    const manifest=await readManifest();let photo=null;
    if(chosen){const key='custom-'+id.toLowerCase();
     photo={...chosen.photo};manifest.subjects[key]=photo;manifest.concepts[id]=key;
    }else manifest.concepts[id]=null;
    await fs.writeFile(manifestPath+'.tmp',JSON.stringify(manifest,null,2)+'\n');await fs.rename(manifestPath+'.tmp',manifestPath);
    const browserPath=path.join(projectRoot,'music-dictionary/music-concepts-photos.js');await fs.writeFile(browserPath+'.tmp',browserManifest(manifest));await fs.rename(browserPath+'.tmp',browserPath);
    return photo;
   };
   const job=saving.then(save);saving=job.catch(()=>{});send(200,{photo:await job});
  }catch(error){send(400,{error:error.message||'The photo could not be saved.'});}
 });
}
if(require.main===module)createPhotoServer().listen(8766,'127.0.0.1',()=>console.log('Concept photo editor ready on 127.0.0.1:8766'));
module.exports={createPhotoServer,commonsTitle,downloadPhoto,commonsPhotoInfo,browserManifest};
