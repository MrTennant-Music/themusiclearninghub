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
    const puzzles = Array.from({ length: 6 }, (_, seedOffset) => {
      const items = shuffle(activity.items);
      const puzzle = kind === 'crossword' ? builders.makeCrossword(items, { seedOffset }) : builders.makeWordsearch(items);
      return snapshot(puzzle, kind);
    });
    if (puzzles.some(puzzle => !puzzle.entries.length)) throw new Error('This collection has no printable words.');
    return { version: 1, activityId: kind, sourceUrl: kind === 'crossword' ? 'crosswords.html' : 'wordsearch.html', settings: { level: activity.level, collectionTitle: activity.title, editorMode: activity.editorMode, puzzles } };
  }
  function clueGroups(puzzle, wordsOnly = false) {
    if (puzzle.kind === 'crossword') {
      return [['across', 'Across'], ['down', 'Down']].map(([direction, title]) => ({
        title,
        entries: puzzle.entries.filter(entry => entry.direction === direction).sort((a, b) => a.number - b.number),
      })).filter(group => group.entries.length > 0);
    }
    const title = wordsOnly ? 'Words' : 'Clues';
    const halfway = Math.ceil(puzzle.entries.length / 2);
    return [puzzle.entries.slice(0, halfway), puzzle.entries.slice(halfway)]
      .filter(entries => entries.length > 0).map(entries => ({title, entries}));
  }
  return { snapshot, createConfig, clueGroups };
});
