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
const examples=[
 {id:'pedal',title:'Pedal',caption:'A sustained bass C beneath changing chords.',upper:[[-2,0,2],[1,3,5],[2,4,6],[-2,0,2]],lower:[[3],[3],[3],[3]],pedalStaff:1,pedalStep:3},
 {id:'inverted-pedal',title:'Inverted pedal',caption:'A sustained upper G above changing chords.',upper:[[9],[9],[9],[9]],lower:[[3,5,7],[-1,1,3],[0,2,4],[3,5,7]],pedalStaff:0,pedalStep:9}
];
(async()=>{for(const example of examples){
 context.example=example;
 const score=vm.runInContext(`(()=>{
 const h=React.createElement, tops=[100,225],xs=[280,440,600,760];
 const note=(step,x,top)=>h(React.Fragment,{key:step},h(LedgerLines,{step,x,top}),h(CalibratedSymbol,{symbolKey:'wholeNote',x,y:yForStep(step,top)}));
 const staff=(top,index)=>h('g',{key:index},[0,1,2,3,4].map(i=>h('line',{key:i,x1:90,x2:840,y1:top+i*GAP,y2:top+i*GAP,stroke:'black',strokeWidth:1.2})),h(CalibratedSymbol,{symbolKey:index?'fClef':'gClef',x:125,y:yForStep(index?6:2,top)}),[360,520,680,840].map(x=>h('line',{key:x,x1:x,x2:x,y1:top,y2:top+4*GAP,stroke:'black',strokeWidth:1.2})),(index?example.lower:example.upper).map((chord,i)=>h('g',{key:i},chord.map(step=>note(step,xs[i],top)))));
 const tieY=yForStep(example.pedalStep,tops[example.pedalStaff])+(example.pedalStaff?9:-9),curve=example.pedalStaff?12:-12;
 return {svg:h('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 920 365',width:1840,height:730},h('rect',{width:920,height:365,fill:'white'}),h('text',{x:460,y:35,textAnchor:'middle',fontFamily:'sans-serif',fontSize:24,fontWeight:600},example.title),tops.map(staff),[0,1,2].map(i=>h('path',{key:i,d:'M '+(xs[i]+12)+' '+tieY+' Q '+((xs[i]+xs[i+1])/2)+' '+(tieY+curve)+' '+(xs[i+1]-12)+' '+tieY,fill:'none',stroke:'black',strokeWidth:1.5})),h('text',{x:460,y:335,textAnchor:'middle',fontFamily:'sans-serif',fontSize:17},example.caption))};
 })()`,context);
 let svg=renderToStaticMarkup(score.svg);const symbols=context.window.BRAVURA_SYMBOLS,outlines=context.window.BRAVURA_WORKSHEET_OUTLINES.symbols;
 svg=svg.replace(/<text([^>]*class="music-symbol"[^>]*)>([^<]+)<\/text>/g,(_,attrs,glyph)=>{const key=Object.keys(symbols).find(k=>symbols[k]===glyph&&outlines[k]);if(!key)throw Error('Missing glyph outline');const a=name=>attrs.match(new RegExp('(?:^| )'+name+'="([^"]*)"'))?.[1];const scale=Number(a('font-size'))/1000,o=outlines[key];return `<g transform="${a('transform')||''}"><path fill="black" d="${o.path}" transform="translate(${a('x')} ${a('y')}) scale(${scale} ${-scale}) translate(${-o.advance/2} 0)"/></g>`;});
 fs.writeFileSync(path.join(root,'music-dictionary/concept-photos',example.id+'-notation.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,'music-dictionary/concept-photos',example.id+'-notation.png'));
}})().catch(e=>{console.error(e);process.exitCode=1;});
