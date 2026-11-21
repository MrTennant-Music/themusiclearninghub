#!/usr/bin/env python3
"""Import the selected original Pixabay recordings. Never synthesise or append sounds."""
import argparse,array,hashlib,json,os,re,shutil,subprocess,tempfile,wave
from pathlib import Path
ROOT=Path(__file__).resolve().parents[1]
RATE=44100

def main():
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--source-dir',type=Path,default=Path.home()/'Downloads')
 parser.add_argument('--ffmpeg',default=os.environ.get('FFMPEG','/Applications/Downie 4.app/Contents/Resources/ffmpeg'))
 args=parser.parse_args();config=json.loads((ROOT/'music-escape/audio/pixabay-sources.json').read_text())
 destination=ROOT/'music-escape/audio/pixabay';destination.mkdir(exist_ok=True)
 manifest={'version':2,'maxEffectDurationSeconds':1,'durationExceptions':config.get('durationExceptions',[]),'processing':config['processing'],'rooms':{str(i):{} for i in range(9)}}
 def run(options):subprocess.run([args.ffmpeg,'-v','error','-xerror','-y',*map(str,options)],check=True)
 def media_duration(file):
  details=subprocess.check_output(['/usr/bin/afinfo',str(file)],text=True)
  return float(re.search(r'estimated duration:\s*([0-9.]+)',details)[1])
 def register(source,effect,file,**extra):
  entry={k:v for k,v in source.items() if k not in ['room','key','downloadFilename','file','effect']}
  entry.update(effect=effect,sha256=hashlib.sha256(file.read_bytes()).hexdigest(),durationSeconds=media_duration(file),**extra)
  if entry['durationSeconds']>1 and effect not in config.get('durationExceptions',[]):raise ValueError('Effect exceeds one second: '+str(file))
  manifest['rooms'][str(source['room'])][source['key']]=entry
 with tempfile.TemporaryDirectory(prefix='mlh-pixabay-cues-') as temporary:
  temporary=Path(temporary)
  for source in config['downloads']:
   original=args.source_dir/source['downloadFilename']
   if source.get('fullLength'):
    effect=f"pixabay/room-{source['room']}-{source['key']}-{source['sourceId']}"
    target=ROOT/'music-escape/audio'/Path(effect+'.mp3')
    run(['-i',original,'-ac','1','-ar',RATE,'-af','afade=t=in:d=0.008','-codec:a','libmp3lame','-b:a','96k',target])
    register(source,effect,target,sourceSha256=hashlib.sha256(original.read_bytes()).hexdigest(),fullLength=True)
    continue
   wav=temporary/'original.wav';run(['-i',original,'-ac','1','-ar',RATE,wav])
   with wave.open(str(wav)) as audio:samples=array.array('h',audio.readframes(audio.getnframes()))
   # Locate the first audible activity; preserve the original performance and timbre.
   window=882
   energy=[sum(abs(v) for v in samples[i:i+window])/window for i in range(0,len(samples),window)]
   threshold=max(30,max(energy)*.06)
   first=next((i for i,value in enumerate(energy) if value>threshold),0)
   start=max(0,first*window-int(.025*RATE))
   end=min(len(samples),start+int(.88*RATE))
   # End after a natural quiet gap once the first action is complete.
   for i in range(first+13,min(len(energy)-8,int(end/window))):
    if all(v<threshold for v in energy[i:i+8]):
     end=min(end,(i+3)*window);break
   clip=samples[start:end]
   peak=max(1,max(abs(v) for v in clip));gain=(32767*.72)/peak
   pcm=array.array('h',(int(max(-32767,min(32767,v*gain))) for v in clip))
   cue=temporary/'excerpt.wav'
   with wave.open(str(cue),'wb') as audio:
    audio.setnchannels(1);audio.setsampwidth(2);audio.setframerate(RATE);audio.writeframes(pcm.tobytes())
   duration=len(pcm)/RATE
   effect=f"pixabay/room-{source['room']}-{source['key']}-{source['sourceId']}"
   target=ROOT/'music-escape/audio'/Path(effect+'.mp3')
   run(['-i',cue,'-af',f'afade=t=in:d=0.008,afade=t=out:st={max(0,duration-.08)}:d=0.08','-codec:a','libmp3lame','-b:a','96k',target])
   register(source,effect,target,sourceSha256=hashlib.sha256(original.read_bytes()).hexdigest(),excerptStart=round(start/RATE,4),excerptDuration=round(duration,4))
  for source in config['retained']:
   file=ROOT/'music-escape/audio'/source['file'];effect=source['effect']
   if effect=='piano-original':
    effect='pixabay/piano-do-80236';target=ROOT/'music-escape/audio'/Path(effect+'.mp3');shutil.copyfile(file,target);file=target
   register(source,effect,file,processing='Existing Pixabay recording retained.')
 for key,reference_room in config.get('sharedEffects',{}).items():
  reference=manifest['rooms'][str(reference_room)][key]
  for room,entries in manifest['rooms'].items():
   if key in entries and room!=str(reference_room) and f'{room}:{key}' not in config.get('sharedEffectExclusions',[]):
    label=entries[key].get('label')
    entries[key]={**reference,'label':label,'sharedWith':f'{reference_room}:{key}'}
 for target,reference in config.get('effectOverrides',{}).items():
  room,key=target.split(':');reference_room,reference_key=reference.split(':')
  label=manifest['rooms'][room][key].get('label')
  manifest['rooms'][room][key]={**manifest['rooms'][reference_room][reference_key],'label':label,'sharedWith':reference}
 for target,entry in config.get('retainedOverrides',{}).items():
  room,key=target.split(':');manifest['rooms'][room][key]=entry
 effects={key:{room:entries[key]['effect'] for room,entries in manifest['rooms'].items() if key in entries} for key in ['archive','mechanism','recording','order','help','exit','ear-training']}
 (destination/'manifest.json').write_text(json.dumps(manifest,indent=2)+'\n')
 (ROOT/'music-escape/object-effects.js').write_text('/* Original Pixabay recordings; generated by scripts/build-music-escape-object-audio.py. */\n(function(root,data){if(typeof module==="object"&&module.exports)module.exports=data;else root.EscapeObjectEffects=data;})(typeof globalThis!=="undefined"?globalThis:this,'+json.dumps(effects,separators=(',',':'))+');\n')
 print('Imported',len(config['downloads']),'recordings; retained',len(config['retained']),'approved Pixabay clips.')
if __name__=='__main__':main()
