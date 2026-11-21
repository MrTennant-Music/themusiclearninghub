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
{id:'question-answer',title:'Question and answer'}, {id:'accent',title:'Accent'},
{id:'adagio',title:'Adagio',tempo:true},{id:'allegro',title:'Allegro',tempo:true},
{id:'beat-pulse',title:'Beat / pulse'}, {id:'faster',title:'Faster',tempo:true},
{id:'on-the-beat',title:'On the beat'},{id:'slower',title:'Slower',tempo:true}
];
(async()=>{for(const example of examples){context.example=example;
 const score=vm.runInContext(`(()=>{SYSTEM_TOPS[0]=110;const h=React.createElement,parts=[],text=(x,y,t,size=20,extra={})=>h('text',{x,y,textAnchor:'middle',fontFamily:'sans-serif',fontSize:size,...extra},t),top=110;
 if(example.tempo)parts.push(text(460,195,example.title,64,{fontFamily:'serif',fontStyle:'italic'}));
 else if(example.id==='accent')parts.push(h(CalibratedSymbol,{symbolKey:'accentAbove',x:460,y:225,settingOverrides:{fontSizeScale:28,xOffsetScale:0,yOffsetScale:0,opticalXOffset:0,opticalYOffset:0}}));
 else{parts.push(text(460,35,example.title,25,{fontWeight:600}));
 if(example.id!=='beat-pulse'){
 for(let i=0;i<5;i++)parts.push(h('line',{key:i,x1:80,x2:850,y1:top+i*GAP,y2:top+i*GAP,stroke:'black',strokeWidth:1.2}));parts.push(h(CalibratedSymbol,{symbolKey:'gClef',x:115,y:yForStep(2,top)}));
 const question=example.id==='question-answer',steps=question?[-2,-1,0,2,2,0,-1,-2]:[2,2,2,2],xs=question?[220,290,360,430,540,610,680,750]:[280,420,560,700];
 steps.forEach((step,i)=>parts.push(h(Note,{key:'n'+i,note:{step,rhythm:'crotchet'},position:{x:xs[i],y:yForStep(step,top),step}})));
 if(question){parts.push(h('line',{x1:485,x2:485,y1:top,y2:top+GAP*4,stroke:'black',strokeWidth:1.2}));parts.push(text(325,240,'Question',24),text(645,240,'Answer',24));}
 else xs.forEach((x,i)=>{parts.push(h('line',{key:'v'+i,x1:x,x2:x,y1:185,y2:234,stroke:'#a8a29e',strokeDasharray:'4 4'}));parts.push(h('circle',{key:'b'+i,cx:x,cy:250,r:8,fill:'#2563eb'}),text(x,292,String(i+1),20));});
 }else{[230,380,530,680].forEach((x,i)=>parts.push(h('circle',{key:i,cx:x,cy:165,r:15,fill:'#2563eb'}),text(x,230,String(i+1),25)));parts.push(text(460,310,'A steady, regular pulse',20));}
 }
 return {svg:h('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 920 365',width:1840,height:730},h('rect',{width:920,height:365,fill:'white'}),...parts)};})()`,context);
 let svg=renderToStaticMarkup(score.svg);const symbols=context.window.BRAVURA_SYMBOLS,outlines=context.window.BRAVURA_WORKSHEET_OUTLINES.symbols;
 svg=svg.replace(/<text([^>]*class="music-symbol"[^>]*)>([^<]+)<\/text>/g,(_,attrs,glyph)=>{const key=Object.keys(symbols).find(k=>symbols[k]===glyph&&outlines[k]);if(!key)throw Error('Missing glyph outline');const a=name=>attrs.match(new RegExp('(?:^| )'+name+'="([^"]*)"'))?.[1];const scale=Number(a('font-size'))/1000,o=outlines[key];return `<g transform="${a('transform')||''}"><path fill="black" d="${o.path}" transform="translate(${a('x')} ${a('y')}) scale(${scale} ${-scale}) translate(${-o.advance/2} 0)"/></g>`;});
 fs.writeFileSync(path.join(root,'music-dictionary/concept-photos',example.id+'-diagram.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,'music-dictionary/concept-photos',example.id+'-diagram.png'));
}})().catch(e=>{console.error(e);process.exitCode=1;});
