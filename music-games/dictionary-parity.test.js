const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),C=require('./core'),{run}=require('../scripts/audit-music-games-parity.cjs');
test('current collections cover the same eligible concept IDs and definitions at every qualification',()=>assert.deepEqual(run().failures,[]));

