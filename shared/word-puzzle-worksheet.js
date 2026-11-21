/* Printable snapshots use the same puzzle builders as the interactive games. */
(function(root, factory) {
  if (typeof module === 'object' && module.exports) module.exports = factory();
  else root.MLHWordPuzzleWorksheet = factory();
})(typeof globalThis !== 'undefined' ? globalThis : this, function() {
  function snapshot(puzzle, kind) {
    const entries = puzzle.placed.map(entry => ({
      answer: entry.item.answer, clue: entry.item.prompt, word: entry.word,
      number: entry.number, direction: entry.dir,
      cells: (entry.positions || entry.cells).map(cell => ({ row: cell.row - (puzzle.minR || 0), col: cell.col - (puzzle.minC || 0), letter: cell.letter || cell.c }))
    }));
    const rows = kind === 'crossword' ? puzzle.height : puzzle.grid.length;
    const cols = kind === 'crossword' ? puzzle.width : puzzle.size;
    const grid = kind === 'crossword' ? Array.from({ length: rows }, () => Array(cols).fill('')) : puzzle.grid.map(row => [...row]);
    if (kind === 'crossword') entries.forEach(entry => entry.cells.forEach(cell => { grid[cell.row][cell.col] = cell.letter; }));
    return { kind, rows, cols, grid, entries };
  }
  function createConfig(activity, kind, builders, shuffle = items => [...items]) {
    if (!['crossword', 'wordsearch'].includes(kind) || !activity?.items?.length) throw new Error('Choose a collection first.');
    const build = kind === 'crossword' ? builders.makeCrossword : builders.makeWordsearch;
    const puzzles = Array.from({ length: 6 }, (_, seedOffset) => snapshot(build(shuffle(activity.items), { seedOffset }), kind));
    if (puzzles.some(puzzle => !puzzle.entries.length)) throw new Error('This collection has no printable words.');
    return { version: 1, activityId: kind, sourceUrl: kind === 'crossword' ? 'crosswords.html' : 'wordsearch.html', settings: { level: activity.level, collectionTitle: activity.title, editorMode: activity.editorMode, puzzles } };
  }
  // Keep long custom clues on continuation pages instead of overflowing A4.
  function cluePages(puzzle, wordsOnly = false) {
    const groups = puzzle.kind === 'crossword'
      ? ['across', 'down'].map(direction => ({ title: direction === 'across' ? 'Across' : 'Down', entries: puzzle.entries.filter(entry => entry.direction === direction).sort((a,b) => a.number-b.number) }))
      : [{ title: wordsOnly ? 'Words to find' : 'Clues', entries: puzzle.entries }];
    const chunks = [];
    groups.forEach(group => {
      let current = { title: group.title, entries: [] }, weight = 0;
      for (const entry of group.entries) {
        const cost = Math.max(1, Math.ceil(String(wordsOnly ? entry.answer : entry.clue).length / 48)) + .65;
        if (weight + cost > 30 && current.entries.length) {
          chunks.push(current); current = { title: group.title + ' (continued)', entries: [] }; weight = 0;
        }
        current.entries.push(entry); weight += cost;
      }
      if (current.entries.length) chunks.push(current);
    });
    if (puzzle.kind === 'wordsearch' && chunks.length === 1 && chunks[0].entries.length > 1) {
      const group=chunks.pop(), halfway=Math.ceil(group.entries.length/2);
      chunks.push({title:group.title,entries:group.entries.slice(0,halfway)},{title:group.title+' (continued)',entries:group.entries.slice(halfway)});
    }
    const pages = [];
    for (let index=0;index<chunks.length;index+=2) pages.push(chunks.slice(index,index+2));
    return pages;
  }
  return { snapshot, createConfig, cluePages };
});
