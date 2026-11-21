'use strict';
const test = require('node:test'), assert = require('node:assert/strict');
const source = require('./fixtures/audio-cue-boundaries-a177.json');

test('all 892 audio markers retain fresh measured bounds and the 154 reviewed cue onsets', () => {
  assert.equal(new Set(source.tracks.map(t => t.paperId)).size, 30);
  assert.equal(source.tracks.length, 223);
  assert.equal(source.tracks.reduce((n, t) => n + t.markers.length, 0), 892);
  for (const track of source.tracks) {
    const paper = require('../papers/' + track.paperId);
    const clip = paper.questions.find(q => q.id === track.questionId).audio.clips[track.clipIndex];
    assert.deepEqual(clip.markers, track.markers, track.paperId + '/' + track.questionId);
    clip.markers.forEach((marker, i) => {
      assert.ok(marker.time >= 0 && marker.time < track.duration);
      if (i) assert.ok(marker.time > clip.markers[i - 1].time);
    });
  }
  assert.equal(source.corrections.length, 154);
  for (const correction of source.corrections) {
    const paper = require('../papers/' + correction.paperId);
    const marker = paper.questions.find(q => q.id === correction.questionId)
      .audio.clips[correction.clipIndex].markers[correction.markerIndex];
    assert.equal(marker.time, correction.finalMarkerTime);
    assert.ok(Math.abs(correction.waveformOnset - marker.time - .15) <= .006);
  }
});
