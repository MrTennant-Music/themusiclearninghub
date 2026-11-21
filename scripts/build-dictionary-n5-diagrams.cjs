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
 {id:'moderato',cid:'MC-0178',title:'Moderato',caption:'At a moderate, steady pace.'},
 {id:'ritardando',cid:'MC-0179',title:'Ritardando',caption:'Gradually getting slower.'},
 {id:'rondo',cid:'MC-0189',title:'Rondo/ABACA — episode',caption:'The main A section returns between episodes.'},
 {id:'strophic',cid:'MC-0190',title:'Strophic',caption:'The same music returns with different words.'}
];
(async()=>{for(const example of examples){context.example=example;
 const score=vm.runInContext(`(()=>{const h=React.createElement,parts=[],text=(x,y,words,size=20,extra={})=>h('text',{x,y,textAnchor:'middle',fontFamily:'sans-serif',fontSize:size,...extra},words);
 if(['moderato','ritardando'].includes(example.id)){
 parts.push(text(460,195,example.title,64,{fontFamily:'serif',fontStyle:'italic'}));
 }else{
 const strophic=example.id==='strophic',letters=strophic?['A','A','A']:['A','B','A','C','A'],width=strophic?190:125,gap=22,start=(920-(letters.length*width+(letters.length-1)*gap))/2;
 letters.forEach((letter,i)=>{const x=start+i*(width+gap),isEpisode=letter!=='A',fill=isEpisode?'#fef3c7':'#dbeafe';parts.push(h('rect',{key:'b'+i,x,y:110,width,height:105,rx:12,fill,stroke:isEpisode?'#d97706':'#2563eb',strokeWidth:1.6}));parts.push(text(x+width/2,strophic?152:176,letter,40,{fontWeight:700}));if(strophic){parts.push(text(x+width/2,191,'Verse '+(i+1),18));parts.push(text(x+width/2,250,'Different words',17,{fill:'#57534e'}));}else if(isEpisode)parts.push(text(x+width/2,250,'Episode',18,{fill:'#92400e'}));else if(example.id==='episode')parts.push(text(x+width/2,250,'Main theme',17,{fill:'#1d4ed8'}));});
 }
 return {svg:h('svg',{xmlns:'http://www.w3.org/2000/svg',viewBox:'0 0 920 365',width:1840,height:730},h('rect',{width:920,height:365,fill:'white'}),...(['moderato','ritardando'].includes(example.id)?[]:[text(460,35,example.title,25,{fontWeight:600})]),...parts,...(['moderato','ritardando'].includes(example.id)?[]:[text(460,335,example.caption,19)]))};})()`,context);
 let svg=renderToStaticMarkup(score.svg);const symbols=context.window.BRAVURA_SYMBOLS,outlines=context.window.BRAVURA_WORKSHEET_OUTLINES.symbols;
 svg=svg.replace(/<text([^>]*class="music-symbol"[^>]*)>([^<]+)<\/text>/g,(_,attrs,glyph)=>{const key=Object.keys(symbols).find(k=>symbols[k]===glyph&&outlines[k]);if(!key)throw Error('Missing glyph outline');const a=name=>attrs.match(new RegExp('(?:^| )'+name+'="([^"]*)"'))?.[1];const scale=Number(a('font-size'))/1000,o=outlines[key];return `<g transform="${a('transform')||''}"><path fill="black" d="${o.path}" transform="translate(${a('x')} ${a('y')}) scale(${scale} ${-scale}) translate(${-o.advance/2} 0)"/></g>`;});
 fs.writeFileSync(path.join(root,'music-dictionary/concept-photos',example.id+'-diagram.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,'music-dictionary/concept-photos',example.id+'-diagram.png'));
}})().catch(e=>{console.error(e);process.exitCode=1;});
