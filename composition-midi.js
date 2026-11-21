(function(root,factory){
  const api=factory();
  if(typeof module==='object'&&module.exports)module.exports=api;
  if(root){root.MLH=root.MLH||{};root.MLH.connectMidiKeyboards=api.connectMidiKeyboards;}
})(typeof window!=='undefined'?window:null,function(){
  function connectMidiKeyboards(access,onNote,onRelease=()=>{}){
    const attached=new Set(),held=new Map();
    const releasePort=input=>{for(const note of held.get(input)||[])onRelease(note);held.delete(input);};
    const message=(event,input)=>{const data=event.data;if(!data||data.length<3)return;const kind=data[0]&240;if(!held.has(input))held.set(input,new Set());const notes=held.get(input);if(kind===144&&data[2]>0){notes.add(data[1]);onNote(data[1]);}else if(kind===128||(kind===144&&data[2]===0)){notes.delete(data[1]);onRelease(data[1]);}else if(kind===176&&[120,123].includes(data[1]))releasePort(input);};
    function sync(){
      const connected=new Set(Array.from(access.inputs.values()).filter(input=>input.state!=='disconnected'));
      for(const input of attached)if(!connected.has(input)){releasePort(input);input.onmidimessage=null;attached.delete(input);}
      for(const input of connected){
        if(attached.has(input))continue;
        attached.add(input);input.onmidimessage=event=>message(event,input);
        if(input.open)Promise.resolve(input.open()).catch(()=>{});
      }
    }
    access.onstatechange=sync;sync();
    return ()=>{if(access.onstatechange===sync)access.onstatechange=null;for(const input of attached){releasePort(input);input.onmidimessage=null;}attached.clear();};
  }
  return {connectMidiKeyboards};
});
