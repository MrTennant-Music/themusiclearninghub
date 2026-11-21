const test=require('node:test'),assert=require('node:assert/strict');
const {connectMidiKeyboards}=require('../composition-midi');
function port(id){return {id,state:'connected',opened:0,open(){this.opened++;return Promise.resolve();}};}
test('MIDI keyboards attach on startup, hot-plug and reconnect without a selector',()=>{
 const first=port('first'),second=port('second'),notes=[],access={inputs:new Map([['first',first]])};
 const dispose=connectMidiKeyboards(access,n=>notes.push(n));
 assert.equal(first.opened,1);first.onmidimessage({data:[0x90,60,100]});
 first.onmidimessage({data:[0x90,61,0]});first.onmidimessage({data:[0x80,60,0]});
 access.inputs.set('second',second);access.onstatechange();assert.equal(second.opened,1);assert.equal(first.opened,1);
 second.onmidimessage({data:[0x92,64,90]});
 first.state='disconnected';access.onstatechange();assert.equal(first.onmidimessage,null);
 first.state='connected';access.onstatechange();assert.equal(first.opened,2);first.onmidimessage({data:[0x90,67,90]});
 assert.deepEqual(notes,[60,64,67]);dispose();assert.equal(access.onstatechange,null);assert.equal(first.onmidimessage,null);assert.equal(second.onmidimessage,null);
});
test('a new keyboard can connect after the page starts with none attached',()=>{
 const access={inputs:new Map()},notes=[],dispose=connectMidiKeyboards(access,n=>notes.push(n));
 const keyboard=port('later');access.inputs.set('later',keyboard);access.onstatechange();keyboard.onmidimessage({data:[0x90,48,127]});assert.deepEqual(notes,[48]);
 access.inputs.delete('later');access.onstatechange();assert.equal(keyboard.onmidimessage,null);dispose();
});

test('MIDI release, zero-velocity note-on and disconnect finish held notes',()=>{
 const input=port('keys'),access={inputs:new Map([['keys',input]])},offs=[];
 const dispose=connectMidiKeyboards(access,()=>{},n=>offs.push(n));
 input.onmidimessage({data:[0x90,60,100]});input.onmidimessage({data:[0x80,60,0]});
 input.onmidimessage({data:[0x90,62,100]});input.onmidimessage({data:[0x90,62,0]});
 input.onmidimessage({data:[0x90,64,100]});input.state='disconnected';access.onstatechange();
 assert.deepEqual(offs,[60,62,64]);dispose();
});
