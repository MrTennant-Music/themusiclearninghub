const test = require('node:test');
const assert = require('node:assert/strict');
const Core = require('./core.js');

test('saved and shared sessions always shuffle and remain untimed',()=>{
  const activity=Core.makeActivity({template:'quiz',title:'Session defaults',items:[{prompt:'Question',answer:'Answer'}],options:{shuffle:false,timer:120}});
  for(const shared of [false,true]) {
    const options=Core.sessionOptions(activity,shared);
    assert.equal(options.shuffle,true);
    assert.equal(options.timer,0);
  }
});
