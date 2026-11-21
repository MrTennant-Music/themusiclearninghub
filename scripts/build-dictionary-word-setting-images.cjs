// Reuse Cadences' calibrated notation components and chord data, with Bravura outlines.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const React=require('react'),{renderToStaticMarkup}=require('react-dom/server'),Babel=require('@babel/standalone'),sharp=require('sharp');
const root=path.resolve(__dirname,'..'),read=f=>fs.readFileSync(path.join(root,f),'utf8');
const context={window:{MLH:{}},React};vm.createContext(context);
for(const f of ['bravura-symbols.js','shared/shared-notation-config.js','bravura-worksheet-outlines.js'])vm.runInContext(read(f),context);
const page=read('cadences.html'),source=page.split(/<script type="(?:text\/babel|text\/x-mlh-jsx-source)"[^>]*>/)[1].split('function MenuSvgGlyph')[0];
vm.runInContext(Babel.transform(source,{presets:['react']}).code,context);
// These data are read from the source activity, rather than separately approximated.
vm.runInContext('const NOTE_POOL='+page.match(/const NOTE_POOL = (\[[\s\S]*?\n\]);/)[1]+';',context);
const keySource=page.match(/const KEYS = (\[[\s\S]*?\n\]);/)[1];
vm.runInContext('const EXPORT_KEYS='+keySource+'; const EXPORT_CADENCES='+page.match(/const CADENCES = (\{[\s\S]*?\n\});/)[1]+';',context);
const examples=[{id:'syllabic',title:'Syllabic',caption:'One syllable sung to one note.'},{id:'melismatic',title:'Melismatic',caption:'One syllable sung across several notes.'}];
(async()=>{for(const example of examples){context.example=example;
 const score=vm.runInContext(`(()=>{const h=React.createElement,top=SYSTEM_TOPS[0],melismatic=example.id==='melismatic';const notes=melismatic?[0,1,2,3].map((step,i)=>({id:'n'+i,step,rhythm:'quaver',x:310+i*100})): [{id:'n0',step:2,rhythm:'minim',x:460}];const beam=melismatic?getBeamData(notes,{start:0,end:3}):null;
 return {svg:h('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 920 285',width:1840,height:570},h('rect',{width:920,height:285,fill:'white'}),h('text',{x:460,y:35,textAnchor:'middle',fontFamily:'sans-serif',fontSize:24,fontWeight:600},example.title),[0,1,2,3,4].map(i=>h('line',{key:i,x1:100,x2:820,y1:top+i*GAP,y2:top+i*GAP,stroke:'black',strokeWidth:1.2})),h(CalibratedSymbol,{symbolKey:'gClef',x:140,y:yForStep(2,top)}),notes.map(n=>h(Note,{key:n.id,note:n,position:{x:n.x,y:yForStep(n.step,top),step:n.step},beamed:melismatic,stemDownOverride:false,forcedStemEndY:beam?beamYAtX(stemData(n,n.x,yForStep(n.step,top),false).stemX,beam.start,beam.end):null})),beam&&h(Beam,{beam}),melismatic&&h('path',{d:'M 310 151 Q 460 180 610 135',fill:'none',stroke:'black',strokeWidth:1.5}),h('text',{x:460,y:210,textAnchor:'middle',fontFamily:'serif',fontSize:24},'Love'),h('text',{x:460,y:260,textAnchor:'middle',fontFamily:'sans-serif',fontSize:17},example.caption))};})()`,context);
 let svg=renderToStaticMarkup(score.svg);const symbols=context.window.BRAVURA_SYMBOLS,outlines=context.window.BRAVURA_WORKSHEET_OUTLINES.symbols;
 svg=svg.replace(/<text([^>]*class="music-symbol"[^>]*)>([^<]+)<\/text>/g,(_,attrs,glyph)=>{const key=Object.keys(symbols).find(k=>symbols[k]===glyph&&outlines[k]);if(!key)throw Error('Missing glyph outline');const a=name=>attrs.match(new RegExp('(?:^| )'+name+'="([^"]*)"'))?.[1];const scale=Number(a('font-size'))/1000,o=outlines[key];return `<g transform="${a('transform')||''}"><path fill="black" d="${o.path}" transform="translate(${a('x')} ${a('y')}) scale(${scale} ${-scale}) translate(${-o.advance/2} 0)"/></g>`;});
 fs.writeFileSync(path.join(root,'music-dictionary/concept-photos',example.id+'-notation.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,'music-dictionary/concept-photos',example.id+'-notation.png'));
}})().catch(e=>{console.error(e);process.exitCode=1;});
