/* Reuse the existing Bravura notation assets. Each N3 row has three notes;
   its total is kept in source data, never printed on the pupil's card. */
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'..'),folder=path.join(ROOT,'music-games/assets/rhythm-order');
const rows=require('../music-games/assets/rhythm-order/n3-combinations.json');
const beats={'crotchet':1,'minim':2,'dotted-minim':3,'semibreve':4};
const names={'crotchet':'Crotchet','minim':'Minim','dotted-minim':'Dotted minim','semibreve':'Semibreve'};
// Rhythm Sums now generates Order Mode questions from level-specific rhythm pools.
async function write(){return [];}
if(require.main===module)write().catch(e=>{console.error(e);process.exitCode=1;});
module.exports={rows,beats};
