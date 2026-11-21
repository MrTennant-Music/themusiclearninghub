'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const source=fs.readFileSync('music-escape/app.js','utf8');
test('direct room previews cover the six standard rooms and stay local to testing',()=>{
 const scope={literacyReviewEnabled:true,URLSearchParams,location:{search:''},C:require('../music-escape/core.js')};vm.createContext(scope);
 vm.runInContext(source.slice(source.indexOf('function testRoomFromUrl(){'),source.indexOf('const roomPreviewIndex=')),scope);
 for(let room=1;room<=6;room++){scope.location.search='?testRoom='+room;assert.equal(scope.testRoomFromUrl(),room-1);}
 for(const value of ['',0,7,-1,1.5,'no']){scope.location.search='?testRoom='+value;assert.equal(scope.testRoomFromUrl(),null);}
 scope.literacyReviewEnabled=false;scope.location.search='?testRoom=3';assert.equal(scope.testRoomFromUrl(),null);
});
