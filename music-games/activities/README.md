# Deferred Playnote activities

Each built-in activity has its own JSON source here. Its generated JavaScript companion is loaded only when that activity is opened, edited, duplicated or downloaded. Script loading keeps local `file://` use working as well as normal website hosting.

The library reads only `music-games/runtime/index.js`: activity metadata and paths to small, lazy-loaded WebP thumbnails. Original paused-player previews load only for cards near the viewport and unmount when they leave it. Previewing a visible card also loads its activity and shared player code. Saved activities use a separate lightweight IndexedDB summaries store; the version-2 migration indexes existing records without changing their content, drafts or results. Full saved activity content is retrieved by ID only when needed.

The player shell and learning-game engine load when an activity or an original library preview opens. The editor, media bank and diagram authoring tools load when editing begins. JSX is compiled ahead of time, so this page no longer downloads Babel to compile itself in the browser.

## Editing and rebuilding

1. Edit the individual activity JSON or the relevant JSX source.
2. Run `pnpm build:playnote` to regenerate the catalogue, static thumbnails, per-activity scripts and browser bundles.
3. Run `pnpm test:desktop-layout` after page or shared layout changes.

`pnpm build:site` also runs the Playnote builder before copying its generated files. Keep `music-games/runtime/`, generated activity `.js` files and thumbnails with the local page so it works without a build server. Portable pupil exports remain available from the library’s Download action.

The library remains at playnote.html. Opening a card navigates to music-games/playnoteactivity.html with its activity ID and source. Compressed share links open on the player page too; existing library-page share links redirect there. Both pages work locally without server route rewrites. Native browser Back returns to the library.

Creating and editing activities opens playnoteeditor.html. The template picker lives there too. Editor drafts are saved before navigation and identified by the draft query parameter so refreshing the editor restores its current content. Saving opens the separate player page.

## Dictionary and collection parity

`pnpm build:playnote` first runs `scripts/build-music-games-collections.cjs`.
It reads the current `music-concepts-data.js`, `music-concepts-simple.js` and
`quiz-collections.js`, and publishes the same collections at N3, N4, N5,
Higher and Advanced Higher for Multiple Choice, True or False, Match,
Crossword and Word Search. Each item records its source concept ID. Definition
clues use the same short definition displayed in the Dictionary, falling back
to its extended definition only when no short definition exists.

Collections split into sets to respect each game's size limit and to keep
synonymous answers apart. Numeric names use established word forms in puzzles.
The six deliberate exclusions in `scripts/music-games-excluded-concepts.cjs`
remain in force. A collection containing only one eligible concept cannot
provide Match or True or False, whose players require at least two items.

Earlier definition packs remain loadable through old links but are hidden in
the chooser in favour of current collection packs. Authored notation, diagram,
ordering, Blank, Sort and Connections games remain separate. The combined N3
Unison / octave Connections group includes both unison and octave examples.
Type has been removed from the chooser, authoring list, generated activities
and publication index. Existing pupil-authored browser data is not deleted.

Run `node scripts/audit-music-games-parity.cjs` and
`node --test music-games/dictionary-parity.test.js` to check every
collection, source definition, game limit and source concept ID. Rebuild the
browser runtimes after changing the chooser or shared game code.
