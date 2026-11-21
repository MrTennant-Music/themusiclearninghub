/* Standalone listening instructions follow the Digital Question Papers style.
   Do not imply a previous excerpt, named soloist, or fixed playback schedule. */
'use strict';
const writtenFocus={
 'style':'name the style',
 'musical concept':'name the concept that describes what you hear',
 'chord or chord progression':'identify the chord or chord sequence',
 'musical device or form':'identify the musical device or form',
 'rhythm':'name the rhythmic feature',
 'articulation or playing technique':'name the articulation or playing technique',
 'tempo':'identify the tempo',
 'texture':'name the texture',
 'instrument or ensemble':'name the instrument or group of instruments',
 'orchestral instrument or family':'name the orchestral instrument or instrument family',
 'tonality':'name the tonality',
 'ornament':'name the ornament',
 'scale':'name the scale',
 'voice type':'name the type of voice',
 'cadence':'name the cadence',
 'vocal technique or word setting':'identify the vocal technique or word setting'
};
function audioPrompt(focus,format){
 if(format==='multiple-choice')return 'Listen to this excerpt and tick one box to describe what you hear.';
 if(format==='multi-select')return 'Listen to this excerpt and tick two boxes to describe what you hear.';
 if(format!=='short-answer'||!writtenFocus[focus])throw new Error('Unsupported audio question focus or format: '+focus+' / '+format);
 return 'Listen to this excerpt and '+writtenFocus[focus]+'.';
}
module.exports={audioPrompt};
