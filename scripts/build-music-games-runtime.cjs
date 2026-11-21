/* Recompile browser code without regenerating image previews or activities. */
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),crypto=require('node:crypto'),Babel=require('@babel/standalone');
const root=path.join(__dirname,'..'),hash=v=>crypto.createHash('sha256').update(v).digest('hex').slice(0,12);
function writeAtomic(file,data){const temporary=file+'.building';fs.writeFileSync(temporary,data);fs.renameSync(temporary,file);}
function build(names=['app','session']){require('./build-music-games-concept-list.cjs').build();const index=path.join(root,'music-games/runtime/index.js'),context={window:{}};vm.runInNewContext(fs.readFileSync(index,'utf8'),context);const files=context.window.IGRuntimeFiles;delete files.editor;delete files['editor-entry'];files['concept-list']='./music-games/concept-lists.json?v='+hash(fs.readFileSync(path.join(root,'music-games/concept-lists.json')));
 for(const name of names){if(!['app','session','learning','art','silhouettes','media','diagram','arcade','image-bank'].includes(name))throw Error('Unknown runtime bundle');const source=name==='app'?'music-games/app.jsx':`music-games/${name}.jsx`,code=Babel.transform(fs.readFileSync(path.join(root,source),'utf8'),{presets:['react'],comments:false,compact:true,filename:source}).code;writeAtomic(path.join(root,`music-games/runtime/${name}.js`),code+'\n');files[name]=`./music-games/runtime/${name}.js?v=`+hash(code);}
 for(const name of ['diagram-core','sounds','timer','level-test-core']){const file=`music-games/${name}.js`;files[name]='./'+file+'?v='+hash(fs.readFileSync(path.join(root,file)));}
 writeAtomic(index,'window.IGActivityIndex='+JSON.stringify(context.window.IGActivityIndex)+';\nwindow.IGRuntimeFiles='+JSON.stringify(files)+';\n');
 require('./build-music-games-pages.cjs').build();
 console.log('Rebuilt browser bundles: '+names.join(', '));}
if(require.main===module)build(process.argv.length>2?process.argv.slice(2):undefined);module.exports={build};
