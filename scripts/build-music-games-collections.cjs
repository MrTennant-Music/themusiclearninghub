/* Current collection membership and definitions are shared with Concept Quizzes. */
const fs = require('node:fs'),
  path = require('node:path'),
  crypto = require('node:crypto'),
  C = require('../music-games/core'),
  G = require('../music-dictionary/quiz-collections'),
  S = require('./music-games-dictionary-content.cjs');
const dir = path.resolve(__dirname, '../music-games/activities'),
  formats = ['wordsearch', 'crossword'];
function batches(rows, maximum, puzzle = false) {
  const conflict = (a, b) => S.overlaps(a, b) || puzzle && S.word(a).replace(/[^a-z]/gi, '').toLowerCase() === S.word(b).replace(/[^a-z]/gi, '').toLowerCase();
  const minimum=Math.max(1,Math.ceil(rows.length/maximum),...rows.map(row=>rows.filter(other=>conflict(row,other)).length));
  const groups=Array.from({length:minimum},()=>[]);
  for (const row of rows) {
    let group = groups.slice().sort((a,b)=>a.length-b.length).find(g => g.length < maximum && !g.some(c => conflict(c, row)));
    if (!group) {
      group = [];
      groups.push(group);
    }
    group.push(row);
  }
  for (const group of groups) if (group.length === 1) {
    const donor = groups.find(other => other.length > 2 && other.some(row => !group.some(c => conflict(c, row))));
    if (donor) {
      const at = donor.findIndex(row => !group.some(c => conflict(c, row)));
      group.push(...donor.splice(at, 1));
    }
  }
  return groups.filter(group=>group.length);
}
function makeActivities() {
  const activities = [];
  for (const level of S.codes) for (const collection of G.groupsForLevel(level)) for (const template of formats) {
    const all = collection.conceptIds.map(id => S.byId.get(id)).filter(Boolean),
      puzzle = ['wordsearch', 'crossword'].includes(template),
      eligible = all.filter(c => !puzzle || S.word(c)),
      limit = puzzle ? 15 : template === 'match-up' ? 24 : 200,
      chunks = batches(eligible, limit, puzzle);
    for (const [part, rows] of chunks.entries()) {
      if (!rows.length || rows.length < 2 && ['match-up', 'true-or-false'].includes(template)) continue;
      const id = `hub-collection-${level.toLowerCase()}-${collection.id}-${template}-${part + 1}`;
      const a = C.makeActivity({
        id,
        level,
        template,
        title: collection.id.endsWith('-styles') ? 'Styles' : collection.label + (chunks.length > 1 ? ` ${part + 1}` : ''),
        description: `${collection.label}: current Music Dictionary definitions${chunks.length > 1 ? ` — set ${part + 1} of ${chunks.length}` : ''}.`,
        folder: 'Music Dictionary',
        tags: [collection.label, S.D.levels[S.codes.indexOf(level)]],
        options: {
          shuffle: true,
          timer: 0,
          sound: true
        },
        revision: 1,
        updatedAt: '2026-11-14T00:00:00.000Z',
        ...(template === 'wordsearch' ? {
          editorMode: 'with-clues'
        } : {}),
        collectionId: collection.id,
        ...(['crossword','wordsearch'].includes(template) && collection.id.endsWith('-styles') ? {
          collectionEdition: require('../shared/music-games-collections.js').collectionEdition
        } : {}),
        sourceConceptIds: rows.map(c => c.id),
        ...(collection.qualification && ['quiz', 'true-or-false'].includes(template) ? {
          specialMode: 'level-test',
          conceptCount: rows.length
        } : {}),
        items: rows.map(c => {
          const answer = puzzle ? S.word(c) : c.name,
            wrong = [...rows, ...all, ...S.distractorCandidates(c,level), ...S.concepts.filter(other => S.codes.indexOf(level) >= S.D.levels.indexOf(other.level))].filter(other => !S.overlaps(c, other) && !require('./quiz-distractor-overlap.cjs').overlaps(c.id,other.id) && !require('./build-music-games-columns.cjs').related.some(pair => pair.includes(c.id) && pair.includes(other.id))).map(other => other.name).filter((name, i, names) => names.indexOf(name) === i).slice(0, 3);
          return {
            id: id + '-' + c.id,
            sourceConceptId: c.id,
            prompt: S.definition(c),
            answer,
            ...(['quiz', 'true-or-false'].includes(template) ? {
              distractors: wrong,
              answerOptions: [answer, ...wrong]
            } : {})
          };
        })
      });
      const errors = C.validateActivity(a);
      if (errors.length) throw Error(id + ': ' + errors.join('; '));
      if (!C.compatibility(template, a).ok) throw Error(id + ': ' + C.compatibility(template, a).reason);
      activities.push(a);
    }
  }
  return activities;
}
function build() {
  const activities = makeActivities();
  fs.mkdirSync(dir, {
    recursive: true
  });
  const ids=new Set(activities.map(a=>a.id));
  for(const file of fs.readdirSync(dir).filter(file=>file.startsWith('hub-collection-')&&file.endsWith('.json'))){const id=file.slice(0,-5);if(ids.has(id))continue;for(const ext of ['.json','.js'])if(fs.existsSync(path.join(dir,id+ext)))fs.unlinkSync(path.join(dir,id+ext));}
  for (const a of activities) fs.writeFileSync(path.join(dir, a.id + '.json'), JSON.stringify(a, null, 2) + '\n');
  console.log(`Prepared ${activities.length} current Dictionary collection activities.`);
  return activities;
}
if (require.main === module) build();
module.exports = {
  formats,
  batches,
  makeActivities,
  build
};
