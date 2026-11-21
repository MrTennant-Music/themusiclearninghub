const test=require('node:test'),assert=require('node:assert/strict');
const T=require('../music-dictionary/music-concepts-audio-timing.js');
test('Section times accept seconds, minutes and hours, with an optional end',()=>{
 for(const [input,expected] of [['45',45],['0:45',45],['1:02.125',62.125],['1:02:03',3723],['',0]])assert.equal(T.parse(input),expected);
 assert.equal(T.parse('',true),null);
 assert.deepEqual(T.normalize(45,57),{startSeconds:45,endSeconds:57});
 for(const value of ['-1','0:60','1:99:00','abc','Infinity'])assert.throws(()=>T.parse(value));
 for(const [start,end] of [[-1,null],[45,45],[45,40],[Infinity,null],[0,NaN],['45',57]])assert.throws(()=>T.normalize(start,end));
});
test('Formatted times round-trip without losing fractional seconds',()=>{
 for(const seconds of [0,45,57,62.125,3723,45.123,1.999])assert.equal(T.parse(T.format(seconds)),seconds);
});
