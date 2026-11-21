# Concept Companion photographs

The photo manifest covers all 300 concept pages. A null assignment leaves the
photo area absent for manual population. Related concepts can
share a photograph. For abstract concepts, the caption describes its illustrative
connection rather than claiming that a still image demonstrates the sound.

See `../music-dictionary/music-concepts-photos.json` for every photo's author, licence, original
Wikimedia Commons file page, caption and concept assignments. The app displays
those credits alongside the photographs. Rebuild its browser manifest with:

    node scripts/build-concept-photos.cjs

Photos are selected locally; viewing a concept does not run an image search.

## Saved images

Photo editing has been removed from Music Dictionary. Saved images and captions
are displayed directly from the browser manifest without a local editor service.

## Display framing

Optional `framing` bounds in the photo manifest crop excess near-white margins
without altering the credited source image. Bounds use source-image pixels
(`x`, `y`, `width`, `height`, `sourceWidth`, `sourceHeight`); the player converts
them to proportional CSS coordinates. Keep all notation, labels and instrument
parts inside the bounds. Unframed images use their natural proportions, with
a 280px height limit, rather than a padded fixed-height box.
