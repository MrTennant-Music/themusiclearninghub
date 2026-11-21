const fs=require('node:fs'),path=require('node:path'),sharp=require('sharp');
const root=path.resolve(__dirname,'..');
const examples=[
 {id:'a-tempo',cid:'MC-0094',word:'A tempo',caption:'Return to the previous tempo.'},
 {id:'accelerando',cid:'MC-0095',word:'Accelerando',caption:'Gradually getting faster.'},
 {id:'andante',cid:'MC-0097',word:'Andante',caption:'At a walking pace.'},
 {id:'rallentando',cid:'MC-0101',word:'Rallentando',caption:'Gradually getting slower.'},
 {id:'ternary',cid:'MC-0110',letters:['A','B','A'],labels:['Opening section','Contrasting section','Return of A'],caption:'Ternary form: A–B–A.'},
 {id:'theme-and-variation',cid:'MC-0111',letters:['A','A₁','A₂','A₃'],labels:['Theme','Variation 1','Variation 2','Variation 3'],caption:'A theme followed by varied versions of the same music.'}
];
(async()=>{for(const e of examples){let content='';
 if(e.word)content=`<text x="460" y="195" font-size="64" font-style="italic">${e.word}</text>`;
 else{const left=35,right=885,y=172,w=(right-left)/e.letters.length;content=`<line x1="${left}" x2="${right}" y1="${y}" y2="${y}" stroke="black" stroke-width="1.5"/>`;
 e.letters.forEach((letter,i)=>{const x=left+w*(i+.5);content+=`<text x="${x}" y="130" font-size="50">${letter}</text><text x="${x}" y="232" font-size="24">${e.labels[i]}</text>`;});
 for(let i=0;i<=e.letters.length;i++){const x=left+i*w;content+=`<line x1="${x}" x2="${x}" y1="155" y2="189" stroke="black" stroke-width="${i===e.letters.length?4:1.5}"/>`;}
 }
 const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 920 365" width="1840" height="730"><rect width="920" height="365" fill="white"/><g fill="black" font-family="serif" text-anchor="middle">${content}</g></svg>`;
 fs.writeFileSync(path.join(root,'music-dictionary/concept-photos',e.id+'-diagram.svg'),svg);await sharp(Buffer.from(svg)).png().toFile(path.join(root,'music-dictionary/concept-photos',e.id+'-diagram.png'));
 }})();
