'use strict';
const core = require('../../music-games/core.js');
// Authoring tests must not depend on examples offered in the pupil library.
module.exports = {
  'group-sort': core.makeActivity({title:'Sort musical terms',template:'group-sort',items:[{prompt:'Forte',answer:'Loud',group:'Dynamics'},{prompt:'Piano',answer:'Quiet',group:'Dynamics'},{prompt:'Allegro',answer:'Fast',group:'Tempo'}]}),
  'complete-the-sentence': core.makeActivity({title:'Complete the musical sentence',template:'complete-the-sentence',items:[{clozeText:'Forte means loud.',clozeGaps:[{start:12,end:16,text:'loud'}]}]}),
};
