const test=require('node:test'),assert=require('node:assert/strict'),C=require('./core.js');
const seed=C.SEEDS.find(seed=>seed.template==='matching-pairs');
test('Connection requires exactly four named groups of four distinct cards',()=>{
 assert.equal(C.TEMPLATES.find(template=>template.id==='matching-pairs').name,'Connections');
 assert.deepEqual(C.validateActivity(seed),[]);
 const invalid=items=>assert.equal(C.compatibility('matching-pairs',{...seed,items}).ok,false);
 invalid(seed.items.slice(0,15));invalid([...seed.items,seed.items[0]]);
 invalid(seed.items.map((item,i)=>i===0?{...item,group:'Other'}:item));
 invalid(seed.items.map((item,i)=>i===0?{...item,prompt:seed.items[1].prompt}:item));
 invalid(seed.items.map((item,i)=>i===0?{...item,group:''}:item));
 assert.equal(C.compatibility('matching-pairs',{...seed,items:seed.items.map(item=>({...item,answer:''}))}).ok,true);
});
test('Connection accepts media cards and retains group data through export',()=>{
 const media={type:'image',src:'https://example.com/instrument.png',name:'Instrument'};
 const activity=C.normalize({...seed,items:seed.items.map((item,i)=>i===0?{...item,prompt:'',answer:'',media}:item)});
 assert.equal(C.validateActivity(activity).length,0);
 assert.equal(activity.items[0].group,seed.items[0].group);
 assert.equal(activity.items[0].media.src,media.src);
});
