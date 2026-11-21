# Musical Facts

The collection now uses all 57 Dictionary Styles concepts with 228 concise fact cards. Each active concept has at least four distinct, useful facts. The other 238 headings are retired from new games, with their records kept for restoration and older shared games. The supplied cards are at most 60 characters each, preserving defining details such as instrument, language, musical direction, chord numbers and performance context. The first 66 drafted topics were refined from the user-reviewed chat lists; remaining facts were written from the Dictionary definitions. Source references remain on each concept in `music-games/data/musical-facts.json`.

At every qualification, the random pool includes that level and all earlier levels. Each game chooses four distinct concept headings and includes **every** fact for each, without sampling cards or imposing the ordinary custom-sort card limit. The two different Subject records are both in the bank, but cannot appear together because the headings would be identical.

Identical fact text across concepts accepts every matching selected heading. Explicit `also` concept IDs cover additional valid placements, including solo voice, German lyrics and bowed/plucked strings. Marking uses the snapshot's accepted groups. Reviewing errors does not reveal the answers, in keeping with Concept Sort.

## Editing

Open **Customise → Collections → Edit Musical Facts**. Search the complete catalogue, including retired headings with Show Deleted Concepts, edit wording, add/remove facts, and add alternative accepted concepts. Save applies the edits to future games in this browser. Drafts survive a refresh. Each active concept must retain at least four nonempty, distinct facts. **Delete Concept** removes a heading and all its facts from new games at every level after Save. **Show Deleted Concepts** reveals deleted headings; **Restore Concept** recovers their previous facts. The Dictionary is unaffected. Saving requires enough contrasting headings for a four-group game at each level. Saved game links retain their original text and marking even if the local bank changes.

**Download Facts** exports the active bank, deleted concepts with their recoverable facts, and local changes as `musical-facts.json`. Saving in the browser does not alter the shared website's source files. When the user asks to make edits permanent for everyone, use their downloaded bank to update `music-games/data/musical-facts.json`, preserve all 295 IDs, active or retired, and their deletion status and rebuild the game pages. Do not change the Dictionary or other quiz content as a side effect.

## Validation

`tests/musical-facts-sort.test.js` checks full coverage, concision, four distinct headings, level scope, every selected fact appearing, browser saves, alternative marking, edited snapshots in QR sharing, and a 224-card edited round without truncation. Fact sentences keep a 16px label size; longer edited rounds grow the existing fixed-width desktop canvas vertically, without reflowing it for smaller devices.

## Audit fixes — 16 November 2026

- Random rounds avoid near-equivalent heading pairs (for example Bowing/Arco, Change of key/Modulation and the two Compound time entries). Every concept remains selectable.
- Broader valid placements are explicitly accepted for equivalent terms, shared instrument features, vocal features and musical forms. Nine overly broad or unclear phrases were clarified without increasing card length or count.
- Long heading labels have measured vertical space; fact cards wrap long words instead of clipping them.
- A clean editor reopens the current saved bank. Editing different concepts in two tabs merges both changes. Conflicting edits to the same concept are blocked, preserving the draft and offering Reload Saved Facts after backup.
- Shared generated boards retain their QR snapshot through refresh. Saving a large Sort result retains answers beyond the old 200-item boundary.
- Concept Sort checks its source dependencies before starting and retries missing cached scripts in dependency order. This recovers the intermittent local preview failures seen during browser testing.

Browser checks include a 15-card round with a valid alternative and one deliberate mistake (14/15), a shared long-heading round preserved through refresh, two-tab save/merge/conflict/recovery, and four-group startup at N3, N4, N5, H and AH. All supplied cards still fit the concise bank limit.

## Four-fact review — 16 November 2026

Simple directions, short tempo instructions and similarly narrow definitions were retired where four cards would repeat the same information. Retired facts are not generated, but their original content is recoverable in the editor. Old shared snapshots still work. Existing browser edits with fewer than four cards are kept for editing, excluded from new games, and must be expanded or deleted before saving.

| Level | Active concepts at this level | Pool including earlier levels |
|---|---:|---:|
| N3 | 40 | 40 |
| N4 | 62 | 102 |
| N5 | 55 | 157 |
| H | 36 | 193 |
| AH | 35 | 228 |

Retired headings:

- **N3:** Ascending; Chord change; Descending; Leap / leaping; Repetition; Step / stepwise; Accent / accented; Adagio; Allegro; Faster; Off the beat; On the beat; Slower; Accompanied; Harmony / chord; Solo; Unaccompanied; Unison / octave; Blowing; Bowing; Legato; Plucking; Staccato; Striking / hitting; Strumming.
- **N4:** Broken chord / arpeggio; Change of key; Octave; Pedal; A tempo; Accelerando; Andante; Rallentando; Backing vocals; Muted; Soprano; Tenor.
- **N5:** Contrary motion; Inverted pedal; Melismatic; Modulation; Pitch bend; Syllabic; Moderato; Ritardando; Contrapuntal; Polyphonic; A cappella; Arco; Baritone; Mezzo-soprano.
- **H:** Interrupted cadence; Plagal cadence; Relative major; Relative minor; Tierce de Picardie; 3 against 2; Augmentation; Diminution; Time changes; Subject; Concertino; Ripieno.
- **AH:** Tritone; Inversion; Retrograde; Subject.

## User-edited bank cleanup — 16 November 2026

Preserved the latest browser export before editing, including 16 further deletions, restored Polyphonic, Interrupted cadence and Plagal cadence headings, and the fifth Sprechgesang card. Current defaults are 215 active concepts, 861 facts and 80 recoverable retired headings. The earlier four-fact review table above records the previous snapshot. User-reviewed records are labelled in the source bank.

- Corrected “Barqoue” to “Baroque”; clarified the mixed vocal/instrumental lines, minor chord VI and Sprechgesang wording.
- Added valid alternative headings for the new story, Baroque, counterpoint, German-language and atonal facts. Facts specific to one concept retain only that heading rather than inventing alternatives.
- Completed the blank fourth Plagal cadence fact with “Can follow a perfect cadence”. This is supported by [Central Washington University's theory notes](https://www.cwu.edu/academics/music/_documents/cwu-theory-2010-fundamentals-exam-help.pdf). Sprechgesang context was checked against the [Arnold Schönberg Center](https://schoenberg.at/de/schoenberg/kompositionen/pierrot-lunaire-op-21) and [LA Philharmonic programme notes](https://www.laphil.com/works/pierrot-lunaire).
- Show Deleted Concepts now filters to deleted headings only, using red cards. Switching the filter selects the matching active/deleted detail.
- Import Facts restores a complete backup into a reviewable draft, then Save applies it. Backups retain unfinished rows instead of silently omitting them.
- Saving stores only differences from the current source bank, preventing a complete imported bank from exhausting local storage. Same-concept conflict protection still applies.

Browser verification confirmed saved changes survive refresh and the deleted-only list contains all 80 red entries. Marking regressions cover the new alternative headings and reject an incorrect Minor tonality placement for the major-key interrupted-cadence fact.

## Styles-only collection — 16 November 2026

The user requested that Musical Facts retain all Styles and remove other concepts. Active membership matches the Dictionary Styles category exactly: N3 8, N4 11, N5 12, Higher 12, Advanced Higher 14. All 57 styles are active, including Scottish, with all 228 fact cards. Other headings remain recoverable as deleted records, preserving older QR snapshots. Previous counts above describe earlier reviews. The current browser bank was backed up, imported with the reviewed style facts and saved.

## Styles overlap audit — 16 November 2026

Reviewed every one of the 228 current style facts against all 57 active Styles headings. Updated 174 acceptance lists: instrumentation and ensemble size, solo/choral voices, language and religious/secular text, recurring rhythms and dance metres, electronic production, structure and historical practice. Exact matching text continues to accept every matching owner automatically. The current source has 1,040 explicit cross-style acceptance links. Non-style headings do not appear in the new style fact alternative lists; existing shared snapshots retain their own marking.

Checks protect specific distinctions: Pavan is not accepted for triple metre; Ragtime's solo piano is not treated as the Lied's piano accompaniment; Musique concrète is not credited for a combined synthesisers/samples/loops description; an unrelated style cannot take a hip-hop-specific card. Every explicit acceptance link is tested through real four-heading generation and marking.

## Collection menu names and glyphs

The public collection names are **Headings** and **Facts**. Existing storage keys, backup formats and recipe IDs are unchanged. Facts uses the transparent, image-generated music-note speech bubble in `ui-icons/concept-sort-facts.png`; its complete prompt and source are recorded in `ui-icons/concept-sort-facts-generation.json`. The Playing Techniques collection and its dedicated data and assets have been removed. Musical Periods uses `ui-icons/musical-periods-beethoven-transparent.png`.

## Fact minimum changed — 16 November 2026

The user removed the four-fact minimum. An active heading may now contain one, two or three facts; edits save, survive reload, export/import and generate normally. Keep one nonempty fact or use Delete Concept to remove the heading. New games still choose four different headings. The supplied source styles retain their existing four cards; no teacher content was removed as part of this interface change.

## Facts locked to their own qualification — 16 November 2026

New Facts games now use exactly the selected qualification, without earlier levels: N3 8 styles, N4 11, N5 12, Higher 12 and AH 14. All 817 cross-level alternative links were removed from the active source bank, leaving 223 valid same-level links. Browser edits and imported backups also filter alternatives to the owner’s level; the editor shows only active concepts at that level in Also accepted under. Facts are not deleted or rewritten by this scope change.

New recipes declare `includeBelow: false` and reject out-of-level headings. Existing shared snapshots keep their original scope and marking. Tests cover generation at all five levels, exact pool counts, every remaining alternative placement, old shared snapshots, browser edits and backup import.

## Temporarily hidden — 16 November 2026

At the user’s request, Facts is hidden from all Concept Sort menus and collection lists. The editor is unavailable while hidden; saved Facts links and direct type links return to Headings. Content, browser edits and editor drafts are preserved. The `factsEnabled` switch in `shared/music-games-sort.js` controls visibility.
