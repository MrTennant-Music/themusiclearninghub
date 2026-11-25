# Concept Companion photographs

The photo manifest covers all 300 concept pages. A null assignment leaves the
photo area absent for manual population. Related concepts can
share a photograph. For abstract concepts, the caption describes its illustrative
connection rather than claiming that a still image demonstrates the sound.

See `../music-concepts-photos.json` for each photo’s author, licence, source,
caption and concept assignments. Captions link to the original images and
carry the author, licence and modification details.

Save each image in this directory as a JPEG, PNG or GIF. Use its local path
for `src`, and keep the Commons file page in `sourceUrl` and the original
download URL in `imageUrl`. If you resize or otherwise modify the image,
record the change in `changes`. Rebuild the browser manifest after editing it.

    node scripts/build-concept-photos.cjs

The Dictionary loads these images from the Hub.

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
