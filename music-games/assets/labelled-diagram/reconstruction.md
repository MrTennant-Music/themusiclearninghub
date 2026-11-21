# Drumkit labelled diagram reconstruction

Source activity: https://wordwall.net/resource/86907073/s1-parts-of-the-drumkit

Local changes only. Source examined on 15 October 2026. This reconstructs the
served Label game, rather than embedding Wordwall or running its application.

## Evidence

- The served bundles are recorded with URLs and SHA-256 in `source-bundles.json`.
- REA full-bundle static analysis parent:
  `ev_4eda6b61c3b8af1276d22073bb42c95f50cd735489ead88f9555ed908ac2b5ee`.
  Six JavaScript files parsed; the complete semantic graph exceeded REA's budget.
- A bounded extraction of the Label declarations and class registrations was
  analysed separately by REA. Parent:
  `ev_8d668688d7d958de8bb514a0b892f049442be54a2c4754d1cc3eb364a9895e85`.
  Syntax/application coverage is complete for that extraction; dynamic method
  resolution remains partial. This is static evidence, not a runtime trace.
- Recovered source declarations: `nI` builds the image, two storage regions,
  target places, labels and partnered pins. `nK.$onDragStart/$4/$8` implements
  dragging, arbitrary target assignment, occupied-target eviction and return to
  storage. `nY.get_isCorrect/mark` checks target identity during marking.
- `n8.$k` balances side columns against the target partition. `n8.$d/$e/$h`
  reduces connector intersections and rearranges labels after moves.
- `nO.$2/$3` marks submitted answers. `nS.$revealAll` reveals correct placements.
  The implementation keeps the Hub's own result, timer and sound pipeline.
- `source-content.json` is the original activity content fetched from the
  content-model URL constructed by the shipped client-engine helper. It has
  all eight exact target coordinates. The seed uses those values, multiplied
  by 100 for the existing Hub editor schema.
- The label-tile, correct-tick and incorrect-cross images are assets observed
  during the original game's playback, retained locally. The original drumkit
  image remains embedded in the seed and exported activity files.

## Runtime observations

The original was played through the browser. A Kick label was deliberately
dropped onto the snare target. It stayed there without correctness feedback;
the label moved within the side column and a connector followed its pin.
Submit Answers appeared after the first placement. Submission marked that
answer incorrect and included the unanswered labels in the denominator.
The completion menu offered Show answers and Start again.

The local replacement supports label/pin dragging, return to storage,
reassignment, occupied-target eviction, neutral placements before submission,
source-derived side balancing and connector crossing reduction, submission
with unanswered labels, and a correct-placement diagram through Show answers.
Keyboard users can select a label with Enter/Space, focus a target and place it
with Enter/Space. Delete/Backspace returns a selected label to storage.

## Deliberate integration differences and limits

- Hub toolbar, play overlay, timer/audio/full-screen controls and results remain
  Hub controls. No Wordwall account, leaderboard or publishing code is used.
- The drawing uses SVG and the original raster artwork instead of the source's
  canvas engine. The 960 by 600 scene, image rectangle, palette and tile sizes
  are calibrated from the observed original. They are not claimed to be original
  layout constants. Font rendering can differ from Wordwall's canvas font.
- Marking uses a short shared reveal delay, then the Hub result screen. It does
  not copy every source animation frame or transition duration.
- A passive REA browser capture was unavailable because the open browser did
  not expose a loopback CDP endpoint. Source analysis and direct browser actions
  are recorded separately; no complete runtime graph is claimed.

## Validation

Regression coverage protects original coordinates, drop/eviction/return state,
the full scoring denominator, hit geometry and editable placement until submit.
The sharing checks cover round trips of built-in diagram images via compact
seed references; exported JSON still includes the image itself.

The focused diagram/sharing/render checks and fixed-canvas audit pass. The
broader learning-player suite still has eleven failures in other game modes
whose assertions expect earlier button labels such as Finish or Check Answer;
those unrelated gameplay implementations were not changed in this task.
