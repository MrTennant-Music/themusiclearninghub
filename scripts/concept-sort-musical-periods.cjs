/* Cumulative, characteristic period associations. Generic pitch, texture and
   articulation terms are excluded apart from the specifically requested modal
   concept, which is included with Mass in every new Higher round.
   The first group is the usual course association; the remaining groups are
   accepted historical overlaps, not a claim that the concept is exclusive. */
const D=require('../music-dictionary/music-concepts-data');
const periods=['Medieval','Renaissance','Baroque','Classical','Romantic','20th century'];
const rows=[
 ['MC-0128',['Baroque','Renaissance']], // Harpsichord
 ['MC-0131',['Renaissance','Baroque']], // Recorder
 ['MC-0106',['Classical','Romantic']], // Cadenza
 ['MC-0186',['Baroque']], // Ground bass
 ['MC-0181',['Classical']], // Alberti bass
 ['MC-0180',['Romantic']], // Rubato
 ['MC-0152',['20th century']], // Minimalist
 ['MC-0156',['20th century']], // Atonal
 ['MC-0159',['20th century']], // Cluster
 ['MC-0175',['20th century','Romantic']], // Whole-tone scale
 ['MC-0221',['Medieval']], // Plainchant
 ['MC-0235',['Medieval','Renaissance','20th century']], // Mode or modal
 ['MC-0218',['Renaissance','Baroque','Classical','Romantic','20th century']], // Mass
 ['MC-0248',['Baroque']], // Basso continuo
 ['MC-0249',['Baroque']], // Concerto grosso
 ['MC-0250',['Baroque']], // Da capo aria
 ['MC-0252',['Baroque','20th century']], // Passacaglia
 ['MC-0253',['Baroque']], // Ritornello
 ['MC-0258',['Baroque']], // Concertino
 ['MC-0260',['Baroque']], // Ripieno
 ['MC-0254',['Classical','Romantic','20th century']], // Sonata form
 ['MC-0251',['Classical','Romantic','20th century']], // Exposition
 ['MC-0217',['Romantic','20th century']], // Lied
 ['MC-0256',['Romantic','20th century']], // Through-composed
 ['MC-0215',['20th century','Romantic']], // Impressionist
 ['MC-0219',['20th century']], // Musique concrete
 ['MC-0262',['Renaissance','Baroque','Romantic','20th century']], // Anthem
 ['MC-0263',['Renaissance','Baroque']], // Ayre or air
 ['MC-0264',['Renaissance']], // Ballett
 ['MC-0268',['Renaissance']], // Galliard
 ['MC-0269',['Renaissance','Baroque']], // Madrigal
 ['MC-0270',['Renaissance','Medieval','Baroque']], // Motet
 ['MC-0273',['Renaissance']], // Pavan
 ['MC-0297',['Renaissance','Baroque']], // Consort
 ['MC-0265',['Baroque','Renaissance']], // Chorale
 ['MC-0290',['Baroque','20th century']], // Fugue
 ['MC-0288',['Classical','Romantic','20th century']], // Sonata-form bridge
 ['MC-0271',['Romantic','20th century']], // Nationalist
 ['MC-0294',['Romantic','20th century']], // Song cycle
 ['MC-0292',['Romantic','20th century']], // Leitmotif
 ['MC-0272',['20th century']], // Neoclassical
 ['MC-0275',['20th century']], // Serial
 ['MC-0280',['20th century']], // Polytonality/bitonality
 ['MC-0282',['20th century']], // Tone row
 ['MC-0300',['20th century']], // Sprechgesang
 ['MC-0154',['Classical','Romantic','20th century']], // Symphony
 ['MC-0220',['Baroque','Classical','Romantic','20th century']], // Oratorio
 ['MC-0237',['Baroque','Classical','Romantic','20th century']], // Obbligato
 ['MC-0223',['Classical','Romantic','20th century']], // Sonata
 ['MC-0225',['Classical','Romantic','20th century']], // String quartet
 ['MC-0286',['Baroque','Classical','Romantic','20th century']], // Answer
 ['MC-0289',['Baroque','Classical','Romantic','20th century']], // Countersubject
 ['MC-0295',['Baroque','Classical','Romantic','20th century']], // Stretto
 ['MC-0285',['Renaissance','Baroque']], // Hemiola
 ['MC-0298',['Renaissance','Baroque']], // Countertenor
 ['MC-0299',['Classical','Romantic','20th century']], // Piano trio
 ['MC-0293',['20th century']] // Retrograde
].map(([id,groups])=>({id,groups}));
function build(){const result={};for(const [rank,level]of ['N3','N4','N5','H','AH'].entries()){
 let cards=rows.filter(row=>{const c=D.concepts.find(c=>c.id===row.id);if(!c)throw Error('Unknown period concept '+row.id);return D.levels.indexOf(c.level)<=rank;});
 if(level==='N5')cards=cards.map(row=>({...row,groups:row.groups.filter(group=>group!=='Renaissance')})).filter(row=>row.groups.length);
 const grouping=level==='H'?['Pre-Baroque','Baroque','Classical','Romantic','20th century']:periods;
 if(level==='H')cards=cards.map(row=>({...row,groups:[...new Set(row.groups.map(group=>['Medieval','Renaissance'].includes(group)?'Pre-Baroque':group))]}));
 const groups=grouping.filter(group=>cards.some(c=>c.groups[0]===group));
 if(cards.length>=10&&groups.length>=3)result[level]={groups,cards:cards.map(row=>({...row,groups:row.groups.filter(group=>groups.includes(group))})),roundSize:Math.min(18,cards.length),...(level==='H'?{requiredCards:['MC-0235','MC-0218']}:{} )};
 }return result;}
module.exports={periods,rows,build};
