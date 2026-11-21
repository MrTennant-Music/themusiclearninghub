/* Short, distinct interaction sounds generated locally without audio downloads. */
(function(root){
  const sounds={
    type:[{wave:'triangle',from:1500,to:650,volume:.025,duration:.025}],
    button:[{wave:'sine',from:700,to:260,volume:.045,duration:.045}],
    lift:[{wave:'triangle',from:2400,to:1500,volume:.035,duration:.03}],
    drop:[{wave:'sine',from:420,to:140,volume:.055,duration:.065}]
  };
  function play(context,kind){
    if(!sounds[kind])return;
    for(const sound of sounds[kind]){
      const at=context.currentTime+(sound.delay||0),tone=context.createOscillator(),gain=context.createGain();
      tone.type=sound.wave;
      tone.frequency.setValueAtTime(sound.from,at);
      tone.frequency.exponentialRampToValueAtTime(sound.to,at+sound.duration);
      gain.gain.setValueAtTime(.001,at);
      gain.gain.linearRampToValueAtTime(sound.volume,at+.002);
      gain.gain.exponentialRampToValueAtTime(.001,at+sound.duration);
      tone.connect(gain);gain.connect((globalThis.MLH?.audioOutput?.(context) || context.destination));
      tone.onended=()=>{tone.disconnect();gain.disconnect();};
      tone.start(at);tone.stop(at+sound.duration+.005);
    }
  }
  const api={play};
  if(typeof module==='object'&&module.exports)module.exports=api;
  else root.IGSounds=api;
})(typeof window!=='undefined'?window:globalThis);
