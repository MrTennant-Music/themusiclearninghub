# Integrated drum machine — reference and verification

Reference: https://www.onemotion.com/drum-machine/

REA analysed the downloaded public HTML/JavaScript without executing it. Parent evidence: `ev_3e01a0c0186f7bf8059fe98ac836cdd00a4a48f9761299978260870b0758ce9d`. Artifact SHA256: `78d9cc562fcec9cf76878dea5accf13ac875e2a239d2ca7d6e30f5bb275b5c73`. Application inventory complete, semantic graph partial (node ceiling; 6990 unresolved relationships). Static analysis does not establish runtime equivalence.

Live browser observations: Compose/Pads/Explore views; nine sequencer rows (including spare sound slot), twelve pads with keys 1–9/Q/W/E; per-track velocity, multi-bar navigation, tempo, beat subdivision and shuffle; kit, effects and pitch controls. Tools menu offers sequence duplication, echo conversion, MIDI input, fullscreen and preferences. Only the public initial views, Pads and Tools menu were operated. Reference exports and account functions were not exercised.

The Hub implements a native Drums tab, twelve percussion voices, step painting, hit strengths, bar navigation, variable resolution, multi-pattern sequences and repeats, pads/keyboard recording, acoustic/electronic synthesis, track volume/pan/mute/solo, swing, pitch, humanisation, preset beats, live pattern changes, MIDI input routing and standalone drum MIDI/WAV export. Existing project JSON save/load, URL sharing and whole-arrangement MIDI/WAV exports include drum state. Shared reverb/echo remain in Customise.

The implementation uses original code and synthesized sounds. It does not copy OneMotion's source, kit samples, visual design or community library. It is not an exact replica of its kit/effect catalog, per-step filter/echo automation, or mobile virtual-drumming feature.
