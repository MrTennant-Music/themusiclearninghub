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
(async()=>{
 const score=vm.runInContext(`(()=>{const h=React.createElement,tops=[100,215],xs=[290,430,570,710],parts=[];
 tops.forEach((top,index)=>{for(let i=0;i<5;i++)parts.push(h('line',{key:index+'s'+i,x1:90,x2:830,y1:top+i*GAP,y2:top+i*GAP,stroke:'black',strokeWidth:1.2}));parts.push(h(CalibratedSymbol,{symbolKey:index?'fClef':'gClef',x:125,y:yForStep(index?6:2,top)}));
 xs.forEach((x,i)=>{const isChord=i%2===1;if((index===0&&!isChord)||(index===1&&isChord)){parts.push(h(CalibratedSymbol,{symbolKey:'quarterRest',x,y:yForStep(4,top)}));return;}
 if(isChord){const steps=[-2,0,2];for(const step of steps)parts.push(h(React.Fragment,{key:'ch'+i+step},h(LedgerLines,{x,step,top}),h(CalibratedSymbol,{symbolKey:'noteheadBlackStemUp',x,y:yForStep(step,top)})));parts.push(h('line',{key:'stem'+i,x1:x+6.55,x2:x+6.55,y1:yForStep(-2,top),y2:yForStep(2,top)-26,stroke:'black',strokeWidth:1.32}));}
 else{const step=i===0?3:0;parts.push(h(Note,{key:'bass'+i,note:{step,rhythm:'crotchet'},position:{x,y:yForStep(step,top),step}}));}
 });});
 // Note uses Cadences' first-system top for ledger lines; these bass notes require none.
 return {svg:h('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 920 365',width:1840,height:730},h('rect',{width:920,height:365,fill:'white'}),h('text',{x:460,y:35,textAnchor:'middle',fontFamily:'sans-serif',fontSize:25,fontWeight:600},'Vamp'),...parts,...xs.map((x,i)=>h('text',{key:i,x,y:320,textAnchor:'middle',fontFamily:'serif',fontSize:22},i%2?'Chord':'Bass note')))};})()`,context);
 let svg=renderToStaticMarkup(score.svg);const symbols=context.window.BRAVURA_SYMBOLS,outlines=context.window.BRAVURA_WORKSHEET_OUTLINES.symbols;
 svg=svg.replace(/<text([^>]*class="music-symbol"[^>]*)>([^<]+)<\/text>/g,(_,attrs,glyph)=>{const key=Object.keys(symbols).find(k=>symbols[k]===glyph&&outlines[k]);if(!key)throw Error('Missing glyph outline');const a=name=>attrs.match(new RegExp('(?:^| )'+name+'="([^"]*)"'))?.[1];const scale=Number(a('font-size'))/1000,o=outlines[key];return `<g transform="${a('transform')||''}"><path fill="black" d="${o.path}" transform="translate(${a('x')} ${a('y')}) scale(${scale} ${-scale}) translate(${-o.advance/2} 0)"/></g>`;});
 fs.writeFileSync(path.join(root,'music-dictionary/concept-photos/vamp-notation.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,'music-dictionary/concept-photos/vamp-notation.png'));
})().catch(e=>{console.error(e);process.exitCode=1;});
