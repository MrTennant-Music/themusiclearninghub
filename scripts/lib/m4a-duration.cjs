'use strict';
// Read the movie timescale directly so stale catalogue durations cannot extend a clip.
module.exports=function m4aDuration(data){
 function atom(start,end,type){
  for(let offset=start;offset+8<=end;){
   let size=data.readUInt32BE(offset),header=8;
   if(size===1){if(offset+16>end)break;size=Number(data.readBigUInt64BE(offset+8));header=16;}
   else if(size===0)size=end-offset;
   if(size<header||offset+size>end)break;
   if(data.toString('ascii',offset+4,offset+8)===type)return {start:offset+header,end:offset+size};
   offset+=size;
  }
 }
 function seconds(header){
  const version=data[header.start];if(version!==0&&version!==1)throw Error('Unsupported M4A duration version');
  const offset=header.start+(version===1?20:12),scale=data.readUInt32BE(offset);
  const ticks=version===1?Number(data.readBigUInt64BE(offset+4)):data.readUInt32BE(offset+4);
  if(!scale||!ticks||ticks===0xffffffff||ticks===Number(0xffffffffffffffffn))throw Error('Invalid M4A duration');
  return ticks/scale;
 }
 const movie=atom(0,data.length,'moov');if(!movie)throw Error('Missing M4A movie header');
 const header=atom(movie.start,movie.end,'mvhd');if(!header)throw Error('Missing M4A duration');
 let duration=seconds(header);
 for(let offset=movie.start;offset<movie.end;){
  const track=atom(offset,movie.end,'trak');if(!track)break;
  const media=atom(track.start,track.end,'mdia');
  const handler=media&&atom(media.start,media.end,'hdlr');
  if(handler&&data.toString('ascii',handler.start+8,handler.start+12)==='soun'){
   const timing=atom(media.start,media.end,'mdhd');
   if(timing)duration=Math.min(duration,seconds(timing));
  }
  offset=track.end;
 }
 return duration;
};
