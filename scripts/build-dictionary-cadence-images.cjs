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
(async()=>{for(const id of ['plagal','interrupted','perfect','imperfect']){
 const score=vm.runInContext(`(()=>{const key=EXPORT_KEYS.find(k=>k.id==='C'),cadence=EXPORT_CADENCES['${id}'],xs=[330,650],top=105; const chords=cadence.progression.map(symbol=>key.chords[symbol].map((letter,index)=>NOTE_POOL.find(n=>n.letter===letter&&n.octave===(index>0&&NOTE_POOL.findIndex(n=>n.letter===letter&&n.octave===4)<NOTE_POOL.findIndex(n=>n.letter===key.chords[symbol][0]&&n.octave===4)?5:4))));return {cadence,chords,svg:React.createElement('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 920 255',width:1840,height:510},React.createElement('rect',{width:920,height:255,fill:'white'}),React.createElement('text',{x:460,y:35,textAnchor:'middle',fontFamily:'sans-serif',fontSize:24,fontWeight:600},cadence.label+' · C major'),[0,1,2,3,4].map(i=>React.createElement('line',{key:i,x1:100,x2:820,y1:top+i*GAP,y2:top+i*GAP,stroke:'black',strokeWidth:1.2})),React.createElement(CalibratedSymbol,{symbolKey:'gClef',x:140,y:yForStep(2,top)}),chords.map((notes,i)=>React.createElement(React.Fragment,{key:i},notes.map(n=>React.createElement(React.Fragment,{key:n.step},React.createElement(LedgerLines,{x:xs[i],step:n.step,top}),React.createElement(CalibratedSymbol,{symbolKey:'wholeNote',x:xs[i],y:yForStep(n.step,top)}))),React.createElement('text',{x:xs[i],y:210,textAnchor:'middle',fontFamily:'serif',fontSize:22},cadence.progression[i]))))};})()`,context);
 let svg=renderToStaticMarkup(score.svg);const symbols=context.window.BRAVURA_SYMBOLS,outlines=context.window.BRAVURA_WORKSHEET_OUTLINES.symbols;
 svg=svg.replace(/<text([^>]*class="music-symbol"[^>]*)>([^<]+)<\/text>/g,(_,attrs,glyph)=>{const key=Object.keys(symbols).find(k=>symbols[k]===glyph&&outlines[k]);if(!key)throw Error('Missing glyph outline');const a=name=>attrs.match(new RegExp('(?:^| )'+name+'="([^"]*)"'))?.[1];const scale=Number(a('font-size'))/1000,o=outlines[key];return `<g transform="${a('transform')||''}"><path fill="black" d="${o.path}" transform="translate(${a('x')} ${a('y')}) scale(${scale} ${-scale}) translate(${-o.advance/2} 0)"/></g>`;});
 fs.writeFileSync(path.join(root,'music-dictionary/concept-photos',id+'-cadence-notation.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,'music-dictionary/concept-photos',id+'-cadence-notation.png'));
 console.log(id,score.chords.map(c=>c.map(n=>n.letter+n.octave).join(' ')).join(' → '));
}})().catch(e=>{console.error(e);process.exitCode=1;});
