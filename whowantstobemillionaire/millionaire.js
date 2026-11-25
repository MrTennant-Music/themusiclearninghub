const { useEffect, useId, useLayoutEffect, useMemo, useRef, useState } = React;
const CORE = window.MILLIONAIRE_CORE;
const QUESTION_BANK = window.MILLIONAIRE_QUESTION_BANK || [];
const sharedCollection = window.HubCollections.selected();
const QUESTION_POOLS = window.MILLIONAIRE_QUESTION_POOLS || {};

const MILLIONAIRE_SOUND_PATH = "./whowantstobemillionaire/soundsmillionaire/";
window.MILLIONAIRE_SOUND_CONFIG = {
  opening: `${MILLIONAIRE_SOUND_PATH}opening menu.mp3`,
  start: `${MILLIONAIRE_SOUND_PATH}start.mp3`,
  lifeline: `${MILLIONAIRE_SOUND_PATH}lifeline.mp3`,
  earlyQuestion: `${MILLIONAIRE_SOUND_PATH}11 $100-$1,000 Questions.mp3`,
  earlyFinalAnswer: `${MILLIONAIRE_SOUND_PATH}final answer 1-5.mp3`,
  earlyCorrect: `${MILLIONAIRE_SOUND_PATH}correct 1-5.mp3`,
  earlyIncorrect: `${MILLIONAIRE_SOUND_PATH}incorrect 1-5.mp3`,
  thousandWin: `${MILLIONAIRE_SOUND_PATH}12 Win $1,000.mp3`,
  stages: {
    6: ["13 Let's Play $2,000.mp3", "14 $2,000 Question.mp3", "15 $2,000 Final Answer-.mp3", "16 $2,000 Lose.mp3", "17 $2,000 Win.mp3"],
    7: ["18 Let's Play $4,000.mp3", "19 $4,000 Question.mp3", "20 $4,000 Final Answer-.mp3", "21 $4,000 Lose.mp3", "22 $4,000 Win.mp3"],
    8: ["23 Let's Play $8,000.mp3", "24 $8,000 Question.mp3", "25 $8,000 Final Answer-.mp3", "26 $8,000 Lose.mp3", "27 $8,000 Win.mp3"],
    9: ["28 Let's Play $16,000.mp3", "29 $16,000 Question.mp3", "30 $16,000 Final Answer-.mp3", "31 $16,000 Lose.mp3", "32 $16,000 Win.mp3"],
    10: ["33 Let's Play $32,000.mp3", "34 $32,000 Question.mp3", "35 $32,000 Final Answer-.mp3", "36 $32,000 Lose.mp3", "37 $32,000 Win.mp3"],
    11: ["38 Let's Play $64,000.mp3", "39 $64,000 Question.mp3", "40 $64,000 Final Answer-.mp3", "41 $64,000 Lose.mp3", "42 $64,000 Win.mp3"],
    12: ["43 Let's Play $125,000.mp3", "44 $125,000 Question.mp3", "45 $125,000 Final Answer-.mp3", "46 $125,000 Lose.mp3", "47 $125,000 Win.mp3"],
    13: ["48 Let's Play $250,000.mp3", "49 $250,000 Question.mp3", "50 $250,000 Final Answer-.mp3", "51 $250,000 Lose.mp3", "52 $250,000 Win.mp3"],
    14: ["53 Let's Play $500,000.mp3", "54 $500,000 Question.mp3", "55 $500,000 Final Answer-.mp3", "56 $500,000 Lose.mp3", "57 $500,000 Win.mp3"],
    15: ["58 Let's Play $1,000,000.mp3", "59 $1,000,000 Question.mp3", "60 $1,000,000 Final Answer-.mp3", "61 $1,000,000 Lose.mp3", "62 $1,000,000 Win.mp3"],
  },
};

Object.values(window.MILLIONAIRE_SOUND_CONFIG.stages).forEach((files) => {
  files.forEach((file, index) => { files[index] = `${MILLIONAIRE_SOUND_PATH}${file}`; });
});

const SETTINGS_KEY = "mlh-millionaire-settings-v4";
const HISTORY_KEY = "mlh-millionaire-recent-games-v1";
const PERFORMANCE_KEY = "mlh-millionaire-performance-v1";
const DEFAULT_SETTINGS = {
  soundEffects: false,
  backgroundMusic: false,
  timer: false,
  audioQuestions: false,
  selectedLevelOnly: false,
  questionTypes: ["literacy"],
  musicLiteracyEnabled: true,
  musicConceptsEnabled: true,
  conceptAudioEnabled: true,
  conceptNonAudioEnabled: true,
  level: "N3",
};
const TIMER_DURATION_SECONDS = 30;
const MILLIONAIRE_LEVELS = {
  N3: { label: "National 3" },
  N4: { label: "National 4" },
  N5: { label: "National 5" },
  H: { label: "Higher" },
  AH: { label: "Advanced Higher" },
};
const CATEGORY_LABELS = { listening: "Listening", literacy: "Music literacy", concepts: "Music Concepts" };
const selectedQuestionCategories = (settings, bank = QUESTION_BANK) => [
  (settings.musicLiteracyEnabled ?? true) ? "literacy" : null,
  (settings.musicConceptsEnabled ?? true) && (settings.conceptNonAudioEnabled ?? true) ? "concepts" : null,
  (settings.musicConceptsEnabled ?? true) && (settings.conceptAudioEnabled ?? true)
    && bank.some(question => question.level === settings.level && question.category === "listening" && CORE.isListeningQuestion(question)) ? "listening" : null,
].filter(Boolean);
// Keep at least one main category and one enabled concept question type.
function toggleQuestionPreference(current, key) {
  const next = { ...current, [key]: !(current[key] ?? true) };
  if (next.musicLiteracyEnabled === false && next.musicConceptsEnabled === false) return current;
  if ((next.musicConceptsEnabled ?? true) && next.conceptAudioEnabled === false && next.conceptNonAudioEnabled === false) {
    if (key === "musicConceptsEnabled") next.conceptAudioEnabled = true;
    else return current;
  }
  return next;
}
function QuestionTypeOptions({ settings, setSettings }) {
  const enabled = (key) => settings[key] ?? true;
  const toggle = (key) => setSettings((current) => toggleQuestionPreference(current, key));
  useEffect(() => {
    if (!enabled("musicLiteracyEnabled") && !enabled("musicConceptsEnabled")) {
      setSettings((current) => ({ ...current, musicLiteracyEnabled: true }));
    }
    if (enabled("musicConceptsEnabled") && !enabled("conceptAudioEnabled") && !enabled("conceptNonAudioEnabled")) {
      setSettings((current) => ({ ...current, conceptAudioEnabled: true }));
    }
  }, [settings.musicLiteracyEnabled, settings.musicConceptsEnabled, settings.conceptAudioEnabled, settings.conceptNonAudioEnabled]);
  return <>
    <window.MLH.SelectedLevelOnlyToggle level={settings.level} checked={settings.selectedLevelOnly === true} onChange={() => setSettings(current => ({ ...current, selectedLevelOnly: !current.selectedLevelOnly }))} />
    <window.MLH.MenuSubheading>Questions</window.MLH.MenuSubheading>
    <window.MLH.MenuToggleRow glyph={<img src="ui-icons/trebleclef.svg" alt="" aria-hidden="true" className="object-contain" style={{ width: 28, height: 28, maxWidth: "none", flexShrink: 0 }} />} label="Music Literacy" checked={enabled("musicLiteracyEnabled")} onChange={() => toggle("musicLiteracyEnabled")} />
    <window.MLH.MenuToggleRow glyph={<img src="ui-icons/music-dictionary.svg" alt="" aria-hidden="true" className="object-contain" style={{ width: 30, height: 30, maxWidth: "none", flexShrink: 0 }} />} label="Music Concepts" checked={enabled("musicConceptsEnabled")} onChange={() => toggle("musicConceptsEnabled")} />
    {enabled("musicConceptsEnabled") && <>
      <window.MLH.MenuToggleRow glyph={<img src="ui-icons/audio-svgrepo-com.svg" alt="" aria-hidden="true" className="object-contain" style={{ width: 30, height: 30, maxWidth: "none", flexShrink: 0 }} />} label="Audio" checked={enabled("conceptAudioEnabled")} onChange={() => toggle("conceptAudioEnabled")} />
      <window.MLH.MenuToggleRow glyph={<img src="ui-icons/worksheet.svg" alt="" aria-hidden="true" className="h-5 w-5 object-contain" />} label="Non-Audio Questions" checked={enabled("conceptNonAudioEnabled")} onChange={() => toggle("conceptNonAudioEnabled")} />
    </>}
  </>;
}
const LIFELINE_RESULTS = [
  { key: "fifty", icon: "whowantstobemillionaire/50.50.svg", label: "50:50" },
  { key: "hint", icon: "whowantstobemillionaire/hint.svg", label: "Hint" },
  { key: "switch", icon: "whowantstobemillionaire/switch.svg", label: "Switch" },
];
const QUESTION_REWARDS = {
  3: { icon: "ui-icons/bronze.svg", label: "Bronze medal", tier: "bronze", celebrationIcon: "ui-icons/bronzehighres.svg" },
  5: { icon: "ui-icons/silver.svg", label: "Silver medal", tier: "silver", celebrationIcon: "ui-icons/silverhighres.svg" },
  10: { icon: "ui-icons/gold.svg", label: "Gold medal", tier: "gold", celebrationIcon: "ui-icons/goldhighres.svg" },
  15: { icon: "ui-icons/diamond.svg", label: "Diamond", tier: "diamond", celebrationIcon: "ui-icons/diamondhighres.svg" },
};

function safeRead(key, fallback) {
  try {
    const value = JSON.parse(window.localStorage.getItem(key));
    return value == null ? fallback : value;
  } catch {
    return fallback;
  }
}

function safeWrite(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch {
    return false;
  }
}

function levelPerformance(level) {
  const saved = safeRead(PERFORMANCE_KEY, {});
  const record = saved && typeof saved === "object" ? saved[level] : null;
  const highestQuestion = Number.isFinite(record?.highestQuestion) ? Math.max(0, Math.min(15, Math.round(record.highestQuestion))) : 0;
  const legacyBestAmount = highestQuestion ? CORE.PRIZE_LADDER[Math.max(0, highestQuestion - 2)] || 0 : 0;
  const bestTimesByQuestion = record?.bestTimesByQuestion && typeof record.bestTimesByQuestion === "object"
    ? Object.fromEntries(Object.entries(record.bestTimesByQuestion).filter(([question, time]) => Number(question) >= 1 && Number(question) <= 15 && Number.isFinite(time) && time >= 0))
    : {};
  if (Number.isFinite(record?.bestWinMs) && record.bestWinMs >= 0 && bestTimesByQuestion[15] == null) bestTimesByQuestion[15] = record.bestWinMs;
  return {
    bestWinMs: Number.isFinite(record?.bestWinMs) && record.bestWinMs >= 0 ? record.bestWinMs : null,
    highestQuestion,
    bestAmount: Number.isFinite(record?.bestAmount) && record.bestAmount >= 0 ? record.bestAmount : legacyBestAmount,
    bestTimesByQuestion,
  };
}

function formatTime(milliseconds) {
  const seconds = Math.max(0, Math.round(milliseconds / 1000));
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, "0")}`;
}

function midiFrequency(midi) {
  return 440 * (2 ** ((midi - 69) / 12));
}

function finalAnswerDelay(stage) {
  if (stage <= 5) return 2000;
  if (stage <= 8) return 3000;
  if (stage <= 12) return 4000;
  return 5000;
}

const ANSWER_FLASH_DURATION_MS = 1000;

class AudioDirector {
  constructor() {
    this.context = null;
    this.music = null;
    this.musicIncoming = null;
    this.introMusic = null;
    this.earlyStartTimer = null;
    this.musicLoopTimer = null;
    this.musicFadeTimer = null;
    this.earlyStartRemaining = null;
    this.earlyStartBeganAt = null;
    this.effectAudio = null;
    this.effectResolve = null;
    this.effectFadeStartTimer = null;
    this.effectFadeTimer = null;
    this.effectStopTimer = null;
    this.finalAnswerTimer = null;
    this.finalAnswerResolve = null;
    this.desiredMusic = null;
    this.musicSequence = 0;
    this.effectSequence = 0;
    this.unlockHandler = null;
    this.excerptNodes = [];
    this.excerptAudio = null;
    this.excerptTimer = null;
    this.excerptFadeTimer = null;
    this.musicEnabled = false;
    this.effectsEnabled = false;
    this.stage = 1;
    this.excerptPlaying = false;
    this.excerptSequence = 0;
  }

  ensureContext() {
    const Context = window.AudioContext || window.webkitAudioContext;
    if (!Context) return null;
    if (!this.context || this.context.state === "closed") this.context = new Context();
    return this.context;
  }

  configure(settings) {
    this.musicEnabled = Boolean(settings.backgroundMusic);
    this.effectsEnabled = Boolean(settings.soundEffects);
    if (!this.musicEnabled) this.stopMusic(false);
    else if (!this.excerptPlaying) this.resumeMusic();
    if (!this.effectsEnabled) this.stopEffect();
  }

  makeAudio(path, loop = false) {
    const audio = new Audio(path);
    audio.loop = loop;
    audio.preload = "auto";
    return audio;
  }

  safelyPlay(audio) {
    if (!audio) return;
    audio.play().then(() => this.removeUnlockListeners()).catch(() => this.addUnlockListeners());
  }

  addUnlockListeners() {
    if (this.unlockHandler) return;
    this.unlockHandler = () => {
      this.removeUnlockListeners();
      if (this.musicEnabled && !this.excerptPlaying) this.resumeMusic();
    };
    document.addEventListener("pointerdown", this.unlockHandler, { once: true, capture: true });
    document.addEventListener("keydown", this.unlockHandler, { once: true, capture: true });
  }

  removeUnlockListeners() {
    if (!this.unlockHandler) return;
    document.removeEventListener("pointerdown", this.unlockHandler, true);
    document.removeEventListener("keydown", this.unlockHandler, true);
    this.unlockHandler = null;
  }

  setMusic(path, loop = true) {
    this.stopMusic(false);
    this.desiredMusic = { path, loop };
    if (!this.musicEnabled || this.excerptPlaying || !path) return;
    this.music = this.makeAudio(path, loop);
    this.safelyPlay(this.music);
  }

  playMusicSequence(firstPath, nextPath, nextLoops = true, crossfadeSeconds = 0) {
    this.stopMusic(false);
    this.desiredMusic = crossfadeSeconds > 0
      ? { path: nextPath, loop: false, crossfadeSeconds, waitForIntro: true }
      : { path: nextPath, loop: nextLoops };
    const sequence = this.musicSequence;
    if (!this.musicEnabled || this.excerptPlaying) return;
    const first = this.makeAudio(firstPath, false);
    if (crossfadeSeconds > 0) this.introMusic = first;
    else this.music = first;
    first.addEventListener("ended", () => {
      if (sequence !== this.musicSequence) return;
      if (this.introMusic === first) this.introMusic = null;
      if (crossfadeSeconds > 0) {
        this.desiredMusic.waitForIntro = false;
        this.startEarlyQuestionLoop(nextPath, sequence);
      } else {
        this.setMusic(nextPath, nextLoops);
      }
    }, { once: true });
    this.safelyPlay(first);
  }

  playOpening() {
    const path = window.MILLIONAIRE_SOUND_CONFIG.opening;
    if (this.desiredMusic?.path === path && this.music) {
      this.resumeMusic();
      return;
    }
    this.setMusic(path, true);
  }

  startGame() {
    this.stage = 1;
    this.stopMusic(false);
    const questionPath = window.MILLIONAIRE_SOUND_CONFIG.earlyQuestion;
    this.desiredMusic = { path: questionPath, loop: false, crossfadeSeconds: 5 };
    const sequence = this.musicSequence;
    if (!this.musicEnabled || this.excerptPlaying) return;
    const intro = this.makeAudio(window.MILLIONAIRE_SOUND_CONFIG.start, false);
    this.introMusic = intro;
    intro.addEventListener("ended", () => {
      if (sequence === this.musicSequence && this.introMusic === intro) this.introMusic = null;
    }, { once: true });
    this.safelyPlay(intro);
    this.scheduleEarlyStart(8000, questionPath, sequence);
  }

  playQuestion(stage) {
    this.stage = stage;
    if (stage <= 5) {
      this.startEarlyQuestionLoop(window.MILLIONAIRE_SOUND_CONFIG.earlyQuestion);
      return;
    }
    const stageFiles = window.MILLIONAIRE_SOUND_CONFIG.stages[stage];
    if (stageFiles) this.playMusicSequence(stageFiles[0], stageFiles[1], false, 5);
  }

  pauseMusic() {
    if (this.earlyStartTimer) {
      const elapsed = Date.now() - this.earlyStartBeganAt;
      this.earlyStartRemaining = Math.max(0, this.earlyStartRemaining - elapsed);
    }
    window.clearTimeout(this.earlyStartTimer);
    window.clearTimeout(this.musicLoopTimer);
    window.clearInterval(this.musicFadeTimer);
    this.earlyStartTimer = null;
    this.musicLoopTimer = null;
    this.musicFadeTimer = null;
    if (this.musicIncoming) {
      const keepIncoming = this.musicIncoming.volume >= (this.music?.volume ?? 0);
      const keep = keepIncoming ? this.musicIncoming : this.music;
      const discard = keepIncoming ? this.music : this.musicIncoming;
      (globalThis.MLH?.fadeOutAudio?.(discard) || discard?.pause());
      this.music = keep;
      this.musicIncoming = null;
      if (this.music) this.music.volume = 1;
    }
    (globalThis.MLH?.fadeOutAudio?.(this.music) || this.music?.pause());
    (globalThis.MLH?.fadeOutAudio?.(this.introMusic) || this.introMusic?.pause());
  }

  resumeMusic() {
    if (!this.musicEnabled || this.excerptPlaying || !this.desiredMusic) return;
    if (this.desiredMusic.crossfadeSeconds) {
      if (this.introMusic) {
        this.safelyPlay(this.introMusic);
        if (this.desiredMusic.waitForIntro) return;
      }
      if (this.music?.src) {
        this.safelyPlay(this.music);
        this.scheduleEarlyCrossfade(this.music, this.desiredMusic.path, this.musicSequence);
      } else if (this.earlyStartRemaining != null) {
        this.scheduleEarlyStart(this.earlyStartRemaining, this.desiredMusic.path, this.musicSequence);
      } else {
        this.startEarlyQuestionLoop(this.desiredMusic.path, this.musicSequence);
      }
      return;
    }
    if (this.music?.src) {
      this.safelyPlay(this.music);
      return;
    }
    this.setMusic(this.desiredMusic.path, this.desiredMusic.loop);
  }

  stopMusic(clearDesired = true) {
    this.musicSequence += 1;
    window.clearTimeout(this.earlyStartTimer);
    window.clearTimeout(this.musicLoopTimer);
    window.clearInterval(this.musicFadeTimer);
    (globalThis.MLH?.fadeOutAudio?.(this.music) || this.music?.pause());
    (globalThis.MLH?.fadeOutAudio?.(this.musicIncoming) || this.musicIncoming?.pause());
    (globalThis.MLH?.fadeOutAudio?.(this.introMusic) || this.introMusic?.pause());
    this.music = null;
    this.musicIncoming = null;
    this.introMusic = null;
    this.earlyStartTimer = null;
    this.musicLoopTimer = null;
    this.musicFadeTimer = null;
    this.earlyStartRemaining = null;
    this.earlyStartBeganAt = null;
    if (clearDesired) this.desiredMusic = null;
  }

  scheduleEarlyStart(delay, path, sequence) {
    window.clearTimeout(this.earlyStartTimer);
    this.earlyStartRemaining = Math.max(0, delay);
    this.earlyStartBeganAt = Date.now();
    this.earlyStartTimer = window.setTimeout(() => {
      this.earlyStartTimer = null;
      this.earlyStartRemaining = null;
      this.earlyStartBeganAt = null;
      this.startEarlyQuestionLoop(path, sequence);
    }, this.earlyStartRemaining);
  }

  startEarlyQuestionLoop(path, expectedSequence = null) {
    let sequence = expectedSequence;
    if (sequence == null) {
      this.stopMusic(false);
      this.desiredMusic = { path, loop: false, crossfadeSeconds: 5 };
      sequence = this.musicSequence;
    }
    if (sequence !== this.musicSequence || !this.musicEnabled || this.excerptPlaying) return;
    const audio = this.makeAudio(path, false);
    audio.volume = 1;
    this.music = audio;
    this.safelyPlay(audio);
    this.scheduleEarlyCrossfade(audio, path, sequence);
  }

  scheduleEarlyCrossfade(audio, path, sequence) {
    const schedule = () => {
      if (sequence !== this.musicSequence || !Number.isFinite(audio.duration)) return;
      const fadeSeconds = 5;
      const delay = Math.max(0, audio.duration - audio.currentTime - fadeSeconds) * 1000;
      window.clearTimeout(this.musicLoopTimer);
      this.musicLoopTimer = window.setTimeout(() => this.beginEarlyCrossfade(audio, path, sequence, fadeSeconds), delay);
    };
    if (audio.readyState >= 1) schedule();
    else audio.addEventListener("loadedmetadata", schedule, { once: true });
  }

  beginEarlyCrossfade(outgoing, path, sequence, fadeSeconds) {
    if (sequence !== this.musicSequence || !this.musicEnabled || this.excerptPlaying) return;
    const incoming = this.makeAudio(path, false);
    incoming.volume = 0;
    this.musicIncoming = incoming;
    this.safelyPlay(incoming);
    this.scheduleEarlyCrossfade(incoming, path, sequence);
    const startedAt = Date.now();
    window.clearInterval(this.musicFadeTimer);
    this.musicFadeTimer = window.setInterval(() => {
      if (sequence !== this.musicSequence) return;
      const progress = Math.min(1, (Date.now() - startedAt) / (fadeSeconds * 1000));
      outgoing.volume = 1 - progress;
      incoming.volume = progress;
      if (progress < 1) return;
      window.clearInterval(this.musicFadeTimer);
      this.musicFadeTimer = null;
      (globalThis.MLH?.fadeOutAudio?.(outgoing) || outgoing.pause());
      if (this.music === outgoing) this.music = incoming;
      if (this.musicIncoming === incoming) this.musicIncoming = null;
    }, 50);
  }

  clearEffectFadeTimers() {
    window.clearTimeout(this.effectFadeStartTimer);
    window.clearInterval(this.effectFadeTimer);
    window.clearTimeout(this.effectStopTimer);
    this.effectFadeStartTimer = null;
    this.effectFadeTimer = null;
    this.effectStopTimer = null;
  }

  stopEffect() {
    this.clearEffectFadeTimers();
    window.clearTimeout(this.finalAnswerTimer);
    this.finalAnswerTimer = null;
    this.effectSequence += 1;
    (globalThis.MLH?.fadeOutAudio?.(this.effectAudio) || this.effectAudio?.pause());
    this.effectAudio = null;
    const resolve = this.effectResolve;
    this.effectResolve = null;
    resolve?.();
    const resolveFinalAnswer = this.finalAnswerResolve;
    this.finalAnswerResolve = null;
    resolveFinalAnswer?.();
  }

  scheduleEffectFade(audio, sequence, shortenBy, fadeSeconds) {
    const schedule = () => {
      if (sequence !== this.effectSequence || !Number.isFinite(audio.duration)) return;
      const stopAt = Math.max(0, audio.duration - shortenBy);
      const fadeAt = Math.max(0, stopAt - fadeSeconds);
      const fadeDelay = Math.max(0, fadeAt - audio.currentTime) * 1000;
      const stopDelay = Math.max(0, stopAt - audio.currentTime) * 1000;
      this.effectFadeStartTimer = window.setTimeout(() => {
        if (sequence !== this.effectSequence) return;
        const startedAt = Date.now();
        const startingVolume = audio.volume;
        this.effectFadeTimer = window.setInterval(() => {
          if (sequence !== this.effectSequence) return;
          const progress = Math.min(1, (Date.now() - startedAt) / (fadeSeconds * 1000));
          audio.volume = startingVolume * (1 - progress);
        }, 50);
      }, fadeDelay);
      this.effectStopTimer = window.setTimeout(() => {
        if (sequence === this.effectSequence) this.stopEffect();
      }, stopDelay);
    };
    if (audio.readyState >= 1) schedule();
    else audio.addEventListener("loadedmetadata", schedule, { once: true });
  }

  playEffect(path, { shortenBy = 0, fadeSeconds = 0, stopAfterSeconds = 0 } = {}) {
    if (!this.effectsEnabled || !path) return Promise.resolve();
    this.stopEffect();
    const sequence = this.effectSequence;
    const audio = this.makeAudio(path, false);
    this.effectAudio = audio;
    return new Promise((resolve) => {
      let settled = false;
      const finish = () => {
        if (settled) return;
        settled = true;
        if (sequence === this.effectSequence) {
          this.clearEffectFadeTimers();
          this.effectAudio = null;
          this.effectResolve = null;
        }
        resolve();
      };
      this.effectResolve = finish;
      audio.addEventListener("ended", finish, { once: true });
      audio.addEventListener("error", finish, { once: true });
      audio.play().then(() => {
        if (stopAfterSeconds > 0) {
          this.effectStopTimer = window.setTimeout(() => {
            if (sequence === this.effectSequence) this.stopEffect();
          }, stopAfterSeconds * 1000);
        }
      }).catch(finish);
      if (shortenBy > 0 && fadeSeconds > 0) this.scheduleEffectFade(audio, sequence, shortenBy, fadeSeconds);
    });
  }

  playFinalAnswer(stage) {
    this.stopMusic();
    const path = stage <= 5
      ? window.MILLIONAIRE_SOUND_CONFIG.earlyFinalAnswer
      : window.MILLIONAIRE_SOUND_CONFIG.stages[stage]?.[2];
    if (!this.effectsEnabled || !path) return Promise.resolve();
    this.playEffect(path);
    return new Promise((resolve) => {
      this.finalAnswerResolve = resolve;
      this.finalAnswerTimer = window.setTimeout(() => this.stopEffect(), finalAnswerDelay(stage));
    });
  }

  playOutcome(stage, correct, { finishNaturally = false, stopAfterSeconds = 0 } = {}) {
    let path;
    if (stage <= 5) {
      path = correct
        ? (stage === 5 ? window.MILLIONAIRE_SOUND_CONFIG.thousandWin : window.MILLIONAIRE_SOUND_CONFIG.earlyCorrect)
        : window.MILLIONAIRE_SOUND_CONFIG.earlyIncorrect;
    } else {
      path = window.MILLIONAIRE_SOUND_CONFIG.stages[stage]?.[correct ? 4 : 3];
    }
    if (!this.effectsEnabled || !path) {
      return new Promise((resolve) => window.setTimeout(resolve, ANSWER_FLASH_DURATION_MS));
    }
    const shortenEarlyCorrect = path === window.MILLIONAIRE_SOUND_CONFIG.earlyCorrect && !finishNaturally;
    return this.playEffect(path, shortenEarlyCorrect ? { shortenBy: 3, fadeSeconds: 1 } : stopAfterSeconds > 0 ? { stopAfterSeconds } : undefined);
  }

  playLifeline() {
    return this.playEffect(window.MILLIONAIRE_SOUND_CONFIG.lifeline);
  }

  clearExcerptFade() {
    window.clearInterval(this.excerptFadeTimer);
    this.excerptFadeTimer = null;
  }

  fadeOutMusicForExcerpt(seconds, onComplete) {
    this.clearExcerptFade();
    if (this.earlyStartTimer) {
      const elapsed = Date.now() - this.earlyStartBeganAt;
      this.earlyStartRemaining = Math.max(0, this.earlyStartRemaining - elapsed);
    }
    window.clearTimeout(this.earlyStartTimer);
    window.clearTimeout(this.musicLoopTimer);
    window.clearInterval(this.musicFadeTimer);
    this.earlyStartTimer = null;
    this.musicLoopTimer = null;
    this.musicFadeTimer = null;
    if (this.musicIncoming) {
      const keepIncoming = this.musicIncoming.volume >= (this.music?.volume ?? 0);
      const keep = keepIncoming ? this.musicIncoming : this.music;
      const discard = keepIncoming ? this.music : this.musicIncoming;
      (globalThis.MLH?.fadeOutAudio?.(discard) || discard?.pause());
      this.music = keep;
      this.musicIncoming = null;
    }
    const sources = [this.music, this.introMusic].filter((audio) => audio && !audio.paused);
    if (!this.musicEnabled || sources.length === 0) {
      this.pauseMusic();
      onComplete();
      return;
    }
    const startingVolumes = sources.map((audio) => audio.volume);
    const startedAt = Date.now();
    this.excerptFadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / (seconds * 1000));
      sources.forEach((audio, index) => { audio.volume = startingVolumes[index] * (1 - progress); });
      if (progress < 1) return;
      this.clearExcerptFade();
      sources.forEach((audio) => (globalThis.MLH?.fadeOutAudio?.(audio) || audio.pause()));
      onComplete();
    }, 25);
  }

  fadeInMusicAfterExcerpt(seconds) {
    this.clearExcerptFade();
    if (!this.musicEnabled || !this.desiredMusic) return;
    const sources = [this.music, this.introMusic].filter(Boolean);
    sources.forEach((audio) => { audio.volume = 0; });
    this.resumeMusic();
    const playingSources = [this.music, this.introMusic].filter(Boolean);
    if (playingSources.length === 0) return;
    const startedAt = Date.now();
    this.excerptFadeTimer = window.setInterval(() => {
      const progress = Math.min(1, (Date.now() - startedAt) / (seconds * 1000));
      playingSources.forEach((audio) => { audio.volume = progress; });
      if (progress >= 1) this.clearExcerptFade();
    }, 25);
  }

  stopExcerpt(resume = true) {
    this.excerptSequence += 1;
    window.clearTimeout(this.excerptTimer);
    this.clearExcerptFade();
    this.excerptNodes.forEach((node) => {
      try {
        const now=node.context.currentTime,gain=node.excerptGain?.gain;
        if(gain){if(gain.cancelAndHoldAtTime)gain.cancelAndHoldAtTime(now);else{const value=gain.value;gain.cancelScheduledValues(now);gain.setValueAtTime(value,now);}gain.linearRampToValueAtTime(0,now+.16);}
        node.stop(now+.17);
      } catch {}
    });
    this.excerptNodes = [];
    (globalThis.MLH?.fadeOutAudio?.(this.excerptAudio) || this.excerptAudio?.pause());
    this.excerptAudio = null;
    this.excerptPlaying = false;
    if (resume) this.resumeMusic();
  }

  playFileExcerpt(src, onEnded) {
    if (!src) return null;
    this.stopExcerpt(false);
    const audio = this.makeAudio(src, false);
    this.excerptAudio = audio;
    this.excerptPlaying = true;
    const finish = (completed) => {
      if (this.excerptAudio !== audio) return;
      this.excerptAudio = null;
      this.excerptPlaying = false;
      this.fadeInMusicAfterExcerpt(.5);
      onEnded?.(completed);
    };
    audio.addEventListener("ended", () => finish(true), { once: true });
    audio.addEventListener("error", () => finish(false), { once: true });
    this.fadeOutMusicForExcerpt(.5, () => audio.play().catch(() => finish(false)));
    return true;
  }

  playGenerated(generator, onEnded) {
    const context = this.ensureContext();
    if (!context || !generator) return null;
    this.stopExcerpt(false);
    const sequence = this.excerptSequence;
    const resumed = context.resume().then(() => context.state === "running").catch(() => false);
    this.excerptPlaying = true;
    const bpm = generator.bpm || 96;
    const beatSeconds = 60 / bpm;
    const voices = generator.voices || [{
      notes: generator.notes || [], beats: generator.beats || [], gains: generator.gains,
      gain: generator.gain, gate: generator.gate, waveform: generator.waveform,
    }];
    let totalDuration = 0;
    voices.forEach((voice) => {
      const totalBeats = (voice.notes || []).reduce((sum, note, index) => sum + (voice.beats?.[index] || 1), 0);
      totalDuration = Math.max(totalDuration, totalBeats * beatSeconds);
    });
    const startExcerpt = async () => {
      const ready = await resumed;
      if (!this.excerptPlaying || sequence !== this.excerptSequence) return;
      if (!ready) { this.stopExcerpt(); onEnded?.(false); return; }
      const start = context.currentTime + .05;
      voices.forEach((voice) => {
        let cursor = 0;
        (voice.notes || []).forEach((midi, index) => {
          const beats = voice.beats?.[index] || 1;
          const noteStart = start + cursor * beatSeconds;
          const noteDuration = beats * beatSeconds;
          const gate = voice.gate ?? generator.gate ?? .82;
          const peak = voice.gains?.[index] ?? voice.gain ?? generator.gains?.[index] ?? generator.gain ?? .14;
          const oscillator = context.createOscillator();
          const gain = context.createGain();
          oscillator.type = voice.waveform || generator.waveform || "triangle";
          oscillator.frequency.setValueAtTime(midiFrequency(midi), noteStart);
          gain.gain.setValueAtTime(.0001, noteStart);
          gain.gain.exponentialRampToValueAtTime(Math.max(.002, peak), noteStart + .012);
          gain.gain.setValueAtTime(Math.max(.002, peak * .72), noteStart + Math.max(.02, noteDuration * gate * .7));
          gain.gain.exponentialRampToValueAtTime(.0001, noteStart + Math.max(.04, noteDuration * gate));
          oscillator.connect(gain).connect((globalThis.MLH?.audioOutput?.(context) || context.destination));
          oscillator.start(noteStart);
          oscillator.stop(noteStart + Math.max(.06, noteDuration * gate) + .03);
          oscillator.excerptGain=gain;
          this.excerptNodes.push(oscillator);
          cursor += beats;
        });
      });
      this.excerptTimer = window.setTimeout(() => {
        this.excerptNodes = [];
        this.excerptPlaying = false;
        this.fadeInMusicAfterExcerpt(.5);
        onEnded?.(true);
      }, (totalDuration + .12) * 1000);
    };
    this.fadeOutMusicForExcerpt(.5, startExcerpt);
    return totalDuration + .62;
  }

  destroy() {
    this.removeUnlockListeners();
    this.stopExcerpt(false);
    this.stopMusic();
    this.stopEffect();
    try { (globalThis.MLH?.closeAudioContext?.(this.context) || this.context?.close()); } catch {}
  }
}

function Dialog({ title, onClose, children, actions, wide = false }) {
  const titleId = useId();
  const dialogRef = useRef(null);
  const previousFocus = useRef(document.activeElement);

  useEffect(() => {
    const dialog = dialogRef.current;
    const focusable = () => [...dialog.querySelectorAll("button:not(:disabled), a[href], [tabindex]:not([tabindex='-1'])")];
    window.setTimeout(() => (focusable()[0] || dialog)?.focus(), 0);
    function onKeyDown(event) {
      if (event.key === "Escape") { event.preventDefault(); onClose?.(); return; }
      if (event.key !== "Tab") return;
      const items = focusable();
      if (!items.length) { event.preventDefault(); return; }
      const first = items[0];
      const last = items.at(-1);
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    }
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      previousFocus.current?.focus?.({ preventScroll: true });
    };
  }, [onClose]);

  return <div className="millionaire-dialog-backdrop" onPointerDown={(event) => { if (event.target === event.currentTarget) onClose?.(); }}>
    <section ref={dialogRef} className="millionaire-dialog" style={wide ? { width: "min(720px, 100%)" } : undefined} role="dialog" aria-modal="true" aria-labelledby={titleId} tabIndex="-1">
      <h2 id={titleId}>{title}</h2>
      {children}
      {actions && <div className="millionaire-dialog-actions">{actions}</div>}
    </section>
  </div>;
}

function AutoFitAnswer({ answer, question }) {
  const contentRef = useRef(null);
  const textRef = useRef(null);
  const rhythm = (question?.notation?.kind === "bar" || (question?.notation?.kind === "rhythmSum" && Number.isFinite(question.notation.total))) ? RHYTHM_ANSWER_VALUES[answer.text] : null;
  const rest = question?.notation?.kind === "restBar" ? REST_ANSWER_VALUES[answer.text] : null;
  const timeSignature = question?.notation?.kind === "bar" && /^(?:[2-5]\/4|6\/8)$/.test(answer.text) ? answer.text : null;
  const dynamic = question?.answerDisplay === "dynamic" && DYNAMIC_SYMBOL_KEYS[answer.text] ? answer.text : null;

  useLayoutEffect(() => {
    const content = contentRef.current;
    const text = textRef.current;
    if (!content || !text || rhythm || rest || timeSignature || dynamic) return undefined;

    function fitText() {
      text.classList.remove("is-wrapped");
      text.style.fontSize = "";
      let fontSize = parseFloat(window.getComputedStyle(text).fontSize) || 24;
      while (fontSize > 16 && text.scrollWidth > text.clientWidth) {
        fontSize -= .5;
        text.style.fontSize = `${fontSize}px`;
      }
      if (fontSize <= 16 || text.scrollWidth > text.clientWidth) text.classList.add("is-wrapped");
    }

    fitText();
    const observer = typeof ResizeObserver === "function" ? new ResizeObserver(fitText) : null;
    observer?.observe(content);
    window.addEventListener("resize", fitText);
    return () => {
      observer?.disconnect();
      window.removeEventListener("resize", fitText);
    };
  }, [answer.letter, answer.text, dynamic, rest, rhythm, timeSignature]);

  return <span ref={contentRef} className={`millionaire-answer-content${dynamic ? " has-dynamic-answer" : ""}${rest ? " has-rest-answer" : ""}`}><span className="millionaire-answer-diamond" aria-hidden="true">◆</span><span className="millionaire-answer-letter">{answer.letter}:</span>{rhythm ? <AnswerRhythmGlyph rhythm={rhythm} label={answer.text} /> : rest ? <AnswerRestGlyph rest={rest} label={answer.text} /> : timeSignature ? <AnswerTimeSignatureGlyph timeSignature={timeSignature} label={answer.text} /> : dynamic ? <AnswerDynamicGlyph dynamic={dynamic} label={answer.text} /> : <span ref={textRef} className="millionaire-answer-text">{answer.text}</span>}</span>;
}

const { AnswerDynamicGlyph, AnswerRestGlyph, AnswerRhythmGlyph, AnswerTimeSignatureGlyph, DYNAMIC_SYMBOL_KEYS, RHYTHM_ANSWER_VALUES, REST_ANSWER_VALUES, N5_SIMPLE_TIME_PATTERNS, NotationView, isBeatTotalQuestion, isDottedMinimBeatsQuestion, isDottedMinimNameQuestion, isDynamicSymbolQuestion, isNoteValueNameQuestion, isSingleNoteBeatsQuestion, isSymbolMeaningQuestion, isTimeSignatureBarCompletionQuestion, isTopNumberTimeSignatureQuestion, isWhatNoteQuestion } = window.MLH.LiteracyNotation;

function QuestionImage({ image }) {
  const [failed, setFailed] = useState(false);
  if (!image || failed) return image ? <div className="millionaire-placeholder-note" role="status">The question image is unavailable. Use the accessible description: {image.alt || "No description supplied."}</div> : null;
  return <img src={image.src} alt={image.alt || "Question illustration"} onError={() => setFailed(true)} style={{ maxWidth: 520, maxHeight: 180, marginTop: 16, borderRadius: 10 }} />;
}

function QuestionYouTube({ youtube }) {
  if (!youtube?.src) return null;
  return <iframe className="millionaire-youtube-question" src={youtube.src} title={youtube.title || "Question video"} loading="lazy" allow="accelerometer; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
}

function AudioCard({ playsUsed, playing, onPlay, onStop, learning = false }) {
  const remaining = Math.max(0, 3 - playsUsed);
  return <div className="millionaire-audio-controls">
    <button type="button" className="millionaire-primary millionaire-final-answer millionaire-audio-button" onClick={() => playing ? onStop() : onPlay(learning)} disabled={!playing && !learning && remaining === 0} aria-label={playing ? "Stop listening excerpt" : `Play listening excerpt. ${remaining} plays remaining`}>
      <span className={`millionaire-audio-glyph hub-playback-glyph ${playing ? "is-stop" : "is-play"}`} aria-hidden="true"></span>
      <span className="millionaire-final-answer-label">{playing ? "Stop" : "Play"}</span>
    </button>
    {!learning && <span className="millionaire-audio-count">Remaining: {remaining}</span>}
  </div>;
}

const MILESTONE_CONFETTI_COLOURS = ["#f6c453", "#38bdf8", "#ffffff", "#a78bfa", "#4ade80"];

function MilestoneCelebration({ reward, prize, showBurst = true }) {
  const prizeLabel = prize === 1000000 ? "£1 MILLION" : CORE.formatPrize(prize);
  return <div className={`millionaire-milestone-reveal${prize ? " is-prize-only" : ""}`} role="img" aria-label={prize ? `${prizeLabel} won` : `${reward.label} earned`}>
    {showBurst && <div className="millionaire-milestone-confetti" aria-hidden="true">
      {Array.from({ length: 28 }, (_, index) => {
        const angle = (index / 28) * Math.PI * 2;
        const distance = 54 + (index % 5) * 13;
        return <span key={index} className="millionaire-confetti-piece" style={{
          "--confetti-x": `${Math.cos(angle) * distance}px`,
          "--confetti-y": `${Math.sin(angle) * distance}px`,
          "--confetti-rotate": `${(index % 2 ? 1 : -1) * (180 + index * 23)}deg`,
          backgroundColor: MILESTONE_CONFETTI_COLOURS[index % MILESTONE_CONFETTI_COLOURS.length],
          animationDelay: `${(index % 7) * .035}s`,
        }} />;
      })}
    </div>}
    {prize ? <span className="millionaire-milestone-prize">{prizeLabel}</span> : <>
      <img className="millionaire-milestone-medal" src={reward.celebrationIcon} alt="" aria-hidden="true" />
      <span className="millionaire-milestone-shine" style={{ "--millionaire-medal-mask": `url("${reward.celebrationIcon}")` }} aria-hidden="true" />
    </>}
  </div>;
}

const FinalConfetti = window.MLH.FinalConfetti;

function PrizeLadder({ currentIndex, correctCount, completedStages = [], incompleteStages = [], warningDetails = {}, controls, onSelect, showRewards = true }) {
  const [visibleWarningStage, setVisibleWarningStage] = React.useState(null);
  React.useEffect(() => {
    if (visibleWarningStage === null) return undefined;
    const dismissWarning = (event) => {
      if (!event.target.closest(".millionaire-prize-warning-control")) setVisibleWarningStage(null);
    };
    document.addEventListener("pointerdown", dismissWarning);
    return () => document.removeEventListener("pointerdown", dismissWarning);
  }, [visibleWarningStage]);
  return <aside className="millionaire-ladder" aria-label="Prize ladder">
    {controls}
    {[...CORE.PRIZE_LADDER].map((value, index) => ({ value, stage: index + 1 })).reverse().map(({ value, stage }) => {
      const classes = ["millionaire-prize-row"];
      const reward = QUESTION_REWARDS[stage];
      const isEditorComplete = completedStages.includes(stage);
      const isEditorIncomplete = incompleteStages.includes(stage);
      if (showRewards && reward && stage !== 3) classes.push("is-reward");
      if (stage === currentIndex + 1) classes.push("is-current");
      if (stage <= correctCount) classes.push("is-complete");
      if (onSelect) classes.push("is-selectable");
      const prizeLabel = value === 1000000 ? "£1 MILLION" : CORE.formatPrize(value);
      const warningItems = warningDetails[stage]?.length ? warningDetails[stage] : ["Missing information"];
      const content = <><span className="millionaire-prize-number">{stage}</span><span className="millionaire-prize-diamond" aria-hidden="true">◆</span><span className="millionaire-prize-value-wrap"><span className="millionaire-prize-value">{prizeLabel}</span>{onSelect && (isEditorComplete ? <img className="millionaire-prize-completion-tick" src="ui-icons/tick.svg" alt="Question complete" /> : isEditorIncomplete ? <span className="millionaire-prize-warning-control" onMouseEnter={() => setVisibleWarningStage(stage)} onMouseLeave={() => setVisibleWarningStage(null)} onClick={(event) => { event.preventDefault(); event.stopPropagation(); setVisibleWarningStage(stage); }}><img className="millionaire-prize-completion-warning" src="ui-icons/warning.svg" alt="Question incomplete — show issues" />{visibleWarningStage === stage && <span className="millionaire-prize-warning-tooltip" role="tooltip"><ul>{warningItems.map((item) => <li key={item}>{item}</li>)}</ul></span>}</span> : <span className="millionaire-prize-completion-placeholder" aria-hidden="true">–</span>)}</span></>;
      return onSelect
        ? <button type="button" key={stage} className={classes.join(" ")} aria-current={stage === currentIndex + 1 ? "step" : undefined} aria-label={`Edit Question ${stage}, ${prizeLabel}${isEditorComplete ? ", complete" : isEditorIncomplete ? ", incomplete" : ""}`} onClick={() => onSelect(stage - 1)}>{content}</button>
        : <div key={stage} className={classes.join(" ")} aria-current={stage === currentIndex + 1 ? "step" : undefined}>{content}</div>;
    })}
  </aside>;
}

function ResultStat({ label, children, previous = null, valueClassName = "" }) {
  return <div className="millionaire-result-stat">
    <span>{label}</span>
    <strong className={valueClassName}>{children}</strong>
    {previous != null && <small>{previous}</small>}
  </div>;
}

function hasQuestionAudio(question) {
  return Boolean(question?.audio?.generator || question?.audioSrc);
}

function QuestionTimer({ seconds }) {
  const remaining = Math.max(0, Math.ceil(seconds));
  const progress = Math.max(0, Math.min(100, (seconds / TIMER_DURATION_SECONDS) * 100));
  return <div className="millionaire-question-timer" role="timer" aria-label={`${remaining} seconds remaining`}>
    <svg className="millionaire-question-timer-ring" viewBox="0 0 100 100" aria-hidden="true">
      <circle className="millionaire-question-timer-track" cx="50" cy="50" r="45" pathLength="100" />
      <circle className="millionaire-question-timer-progress" cx="50" cy="50" r="45" pathLength="100" style={{ strokeDashoffset: 100 - progress }} />
    </svg>
    <span>{remaining}</span>
  </div>;
}

function HintText({ question }) {
  const emphasis = question.tipEmphasis;
  const emphasisIndex = emphasis ? question.tip.indexOf(emphasis) : -1;
  if (emphasisIndex < 0) return question.tip;
  const before = question.tip.slice(0, emphasisIndex);
  const emphasised = question.tip.slice(emphasisIndex, emphasisIndex + emphasis.length);
  const after = question.tip.slice(emphasisIndex + emphasis.length);
  return <>{before}<b>{emphasised}</b>{after}</>;
}

function App() {
  const classroomActivities = window.MLH.classroomActivities;
  const classroomSeed = classroomActivities.seed(window.location.search);
  const classroomGame = classroomSeed !== null;
  const millionaireRace = classroomActivities.isRace() && window.parent !== window;
  const raceProgress = millionaireRace ? classroomActivities.progressStorage() : null;
  const raceAttempt = useRef(raceProgress?.read("millionaire-attempt", 0) ?? 0);
  const [fullscreen, setFullscreen] = useState(false);
  const [fullscreenError, setFullscreenError] = useState("");
  useEffect(() => {
    const update = () => setFullscreen(document.fullscreenElement === document.documentElement);
    document.addEventListener("fullscreenchange", update);
    return () => document.removeEventListener("fullscreenchange", update);
  }, []);
  async function toggleFullscreen() {
    setFullscreenError("");
    try {
      if (document.fullscreenElement) await document.exitFullscreen();
      else await document.documentElement.requestFullscreen();
    } catch {
      setFullscreenError("Full screen could not open. Please try again.");
    }
  }

  const [screen, setScreen] = useState(() => {
    if (classroomGame) return "title";
    try {
      const queryLevel = new URLSearchParams(window.location.search).get("level");
      if (CORE.SUPPORTED_LEVELS.includes(queryLevel)) return "title";
      return localStorage.getItem("mlh-millionaire-creator-resume") ? "creator" : "title";
    } catch {
      return "title";
    }
  });
  const [creatorEditing, setCreatorEditing] = useState(false);
  const [settings, setSettings] = window.MLH.useProfileState("settings", () => {
    const saved = classroomGame ? {} : safeRead(SETTINGS_KEY, {});
    const queryLevel = new URLSearchParams(window.location.search).get("level");
    const level = CORE.SUPPORTED_LEVELS.includes(queryLevel) ? queryLevel
      : CORE.SUPPORTED_LEVELS.includes(saved.level) ? saved.level : DEFAULT_SETTINGS.level;
    return { ...DEFAULT_SETTINGS, ...saved, level, questionTypes: ["literacy"], audioQuestions: false };
  });
  const [levelOpen, setLevelOpen] = useState(false);
  const [customiseOpen, setCustomiseOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [dialog, setDialog] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedLetter, setSelectedLetter] = useState(null);
  const [locked, setLocked] = useState(false);
  const [revealed, setRevealed] = useState(null);
  const [removedLetters, setRemovedLetters] = useState([]);
  const [hintVisible, setHintVisible] = useState(false);
  const [playsUsed, setPlaysUsed] = useState(0);
  const [audioPlaying, setAudioPlaying] = useState(false);
  const [audioFinished, setAudioFinished] = useState(false);
  const [lifelines, setLifelines] = useState({ fifty: true, hint: true, switch: true });
  const [records, setRecords] = useState([]);
  const [correctCount, setCorrectCount] = useState(0);
  const [outcome, setOutcome] = useState(null);
  const [finalPrize, setFinalPrize] = useState(0);
  const [highestReached, setHighestReached] = useState(0);
  const [startedAt, setStartedAt] = useState(null);
  const [finishedAt, setFinishedAt] = useState(null);
  const [clockNow, setClockNow] = useState(Date.now());
  const [previousPerformance, setPreviousPerformance] = useState({ bestWinMs: null, highestQuestion: 0, bestAmount: 0, bestTimesByQuestion: {} });
  const [milestone, setMilestone] = useState(null);
  const [timeRemaining, setTimeRemaining] = useState(TIMER_DURATION_SECONDS);
  const [announcement, setAnnouncement] = useState("Welcome to Who Wants to Be a Millionaire.");
  const [transitioning, setTransitioning] = useState(false);
  const [correctRevealSkippable, setCorrectRevealSkippable] = useState(false);
  const [openingZooming, setOpeningZooming] = useState(false);
  const [activeCustomSet, setActiveCustomSet] = useState(null);
  const levelRef = useRef(null);
  const customiseRef = useRef(null);
  const lifelineRef = useRef(null);
  const audioDirector = useRef(new AudioDirector());
  const gameSaved = useRef(false);
  const timerExpired = useRef(false);
  const answerTimer = useRef({ questionId: null, remaining: TIMER_DURATION_SECONDS });
  const timerTickAudio = useRef(null);
  const lastTimerTick = useRef(null);
  const gameOperation = useRef(0);
  const twoBarPatternHistory = useRef(new Map());
  const openingZoomTimer = useRef(null);
  const customRuntimeRef = useRef(null);

  const question = questions[currentIndex];
  window.MLH.useClickOutside(
    [levelRef, customiseRef],
    [() => setLevelOpen(false), () => setCustomiseOpen(false)],
  );

  useEffect(() => {
    const errors = CORE.validateQuestionPools(QUESTION_POOLS);
    if (errors.length) console.error("Millionaire question-bank validation errors:", errors);
    else console.info(`Millionaire question bank validated: ${QUESTION_BANK.length} questions across 45 pools.`);
    const isDevelopment = window.location.protocol === "file:" || ["localhost", "127.0.0.1"].includes(window.location.hostname);
    if (isDevelopment) console.info(`Millionaire question-bank summary:\n${CORE.questionPoolSummary(QUESTION_POOLS).join("\n")}`);
  }, []);

  useEffect(() => {
    if (!classroomGame) safeWrite(SETTINGS_KEY, settings);
    audioDirector.current.configure(settings);
  }, [classroomGame, settings]);

  useEffect(() => {
    if (answerTimer.current.questionId !== question?.id) {
      answerTimer.current = { questionId: question?.id, remaining: TIMER_DURATION_SECONDS };
      timerExpired.current = false;
      setTimeRemaining(TIMER_DURATION_SECONDS);
    }
    const canRunTimer = settings.timer && screen === "game" && question && !openingZooming && !locked && !transitioning && !revealed
      && !audioPlaying && (!hasQuestionAudio(question) || audioFinished);
    if (!canRunTimer) return undefined;
    const timer = answerTimer.current;
    const endsAt = Date.now() + timer.remaining * 1000;
    const updateTimer = () => {
      const remaining = Math.max(0, (endsAt - Date.now()) / 1000);
      timer.remaining = remaining;
      setTimeRemaining(remaining);
      if (remaining === 0 && !timerExpired.current) {
        timerExpired.current = true;
        handleTimerExpired();
      }
    };
    updateTimer();
    const interval = window.setInterval(updateTimer, 100);
    return () => {
      timer.remaining = Math.max(0, (endsAt - Date.now()) / 1000);
      window.clearInterval(interval);
    };
  }, [settings.timer, screen, currentIndex, question?.id, openingZooming, locked, transitioning, revealed, audioPlaying, audioFinished]);

  useEffect(() => {
    const timerIsActive = settings.timer && settings.soundEffects && screen === "game" && question && !locked && !transitioning && !revealed
      && !audioPlaying && (!hasQuestionAudio(question) || audioFinished);
    if (!timerIsActive) {
      lastTimerTick.current = null;
      (globalThis.MLH?.fadeOutAudio?.(timerTickAudio.current) || timerTickAudio.current?.pause());
      return;
    }
    const seconds = Math.ceil(timeRemaining);
    if (seconds > 8 || seconds < 1 || seconds === lastTimerTick.current) return;
    lastTimerTick.current = seconds;
    const audio = timerTickAudio.current || new Audio(`${MILLIONAIRE_SOUND_PATH}tick.mp3`);
    timerTickAudio.current = audio;
    audio.currentTime = 0;
    audio.play().catch(() => {});
  }, [settings.timer, settings.soundEffects, screen, question?.id, locked, transitioning, revealed, timeRemaining, audioPlaying, audioFinished]);

  useEffect(() => () => {
    window.clearTimeout(openingZoomTimer.current);
    audioDirector.current.destroy();
    customRuntimeRef.current?.revoke();
  }, []);

  useEffect(() => {
    if (screen === "results" && outcome === "won") audioDirector.current.pauseMusic();
    else if (["title", "rules", "results", "creator"].includes(screen)) audioDirector.current.playOpening();
    else if (screen !== "game") audioDirector.current.pauseMusic();
  }, [screen, outcome]);

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: "auto" });
  }, [screen, currentIndex]);

  useEffect(() => {
    function onKeyDown(event) {
      if (event.defaultPrevented) return;
      if (dialog || helpOpen || screen !== "game") return;
      if (["INPUT", "TEXTAREA", "SELECT"].includes(event.target.tagName)) return;
      if ((event.key === "Enter" || event.code === "Space") && event.target.closest?.("button, a, [role='button']")) return;
      const key = event.key.toLowerCase();
      const answerMap = { a: "A", "1": "A", b: "B", "2": "B", c: "C", "3": "C", d: "D", "4": "D" };
      if (answerMap[key]) { event.preventDefault(); selectAnswer(answerMap[key]); }
      else if (event.key === "Enter") { event.preventDefault(); lockAnswer(); }
      else if (event.code === "Space" && hasQuestionAudio(question)) { event.preventDefault(); audioPlaying ? stopQuestionAudio() : playQuestionAudio(false); }
      else if (key === "l") { event.preventDefault(); lifelineRef.current?.querySelector("button:not(:disabled)")?.focus(); }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  });

  function toggleGameAudio() {
    const enabled = settings.backgroundMusic && settings.soundEffects;
    const nextSettings = { ...settings, backgroundMusic: !enabled, soundEffects: !enabled };
    audioDirector.current.configure(nextSettings);
    setSettings(nextSettings);
  }

  function createQuestions() {
    const recentGames = classroomGame ? [] : safeRead(HISTORY_KEY, []);
    const random = classroomGame ? classroomActivities.random(classroomSeed) : Math.random;
    if (classroomGame) twoBarPatternHistory.current.clear();
    try {
      const race = classroomActivities.isRace();
      const bank = race ? QUESTION_BANK.filter(question => !CORE.isListeningQuestion(question)) : QUESTION_BANK;
      const categories = selectedQuestionCategories(settings, bank);
      if (race && !categories.length) categories.push("concepts");
      if (!categories.length) throw new Error("Turn on Music Literacy or Non-Audio Questions to start a game.");
      for (let gameAttempt = 0; gameAttempt < 20; gameAttempt += 1) {
        const prepared = [];
        const usedFingerprints = new Set();
        const selected = CORE.composeGame(bank, recentGames, random, { level: settings.level, categories, includeEarlier: settings.selectedLevelOnly !== true });
        let collision = false;
        for (const targetQuestion of selected) {
          let candidate = targetQuestion;
          let fingerprint = "";
          for (let variantAttempt = 0; variantAttempt < 40; variantAttempt += 1) {
            candidate = randomiseTwoBarQuestion(targetQuestion, random);
            fingerprint = CORE.questionFingerprint(candidate);
            if (!usedFingerprints.has(fingerprint)) break;
          }
          if (usedFingerprints.has(fingerprint)) { collision = true; break; }
          usedFingerprints.add(fingerprint);
          prepared.push(candidate);
        }
        if (!collision && prepared.length === 15) return prepared;
      }
      throw new Error("Could not prepare fifteen pupil-facing questions without a repeat.");
    } catch (error) {
      console.error("Millionaire game composition failed.", error);
      setDialog({ type: "error", message: /^Enable Non-Audio Questions/.test(error.message) ? error.message : `A complete ${MILLIONAIRE_LEVELS[settings.level].label} game could not be prepared. Please check the question options and try again.` });
      return null;
    }
  }

  function randomiseTwoBarQuestion(targetQuestion, random = Math.random) {
    if (targetQuestion?.concept === "national-5-time-signature") {
      const notation = targetQuestion.notation || {};
      const timeSignature = targetQuestion.answers?.find((answer) => answer.id === targetQuestion.correctAnswer)?.text || notation.timeSignature;
      const patterns = N5_SIMPLE_TIME_PATTERNS[timeSignature] || [];
      const semiquaverPatterns = patterns.filter((pattern) => pattern.some((token) => token.includes("semiquaver")));
      const regularPatterns = patterns.filter((pattern) => !pattern.some((token) => token.includes("semiquaver")));
      const pool = semiquaverPatterns.length && random() < .16 ? semiquaverPatterns : regularPatterns;
      const finalPool = timeSignature === "4/4" ? [["semibreve"], ...pool] : pool;
      const rhythmTokens = CORE.shuffle(finalPool.length ? finalPool : patterns, random)[0];
      return { ...targetQuestion, notation: { ...notation, timeSignature, rhythmTokens } };
    }
    if (targetQuestion?.concept === "chord-identification") {
      const notation = targetQuestion.notation || {};
      const rhythmPatterns = [
        ["crotchet", "crotchet", "minim"],
        ["minim", "crotchet", "crotchet"],
      ];
      const pattern = CORE.shuffle(rhythmPatterns, random)[0];
      const notes = CORE.shuffle(notation.pitches || [], random).map((pitch, index) => ({ pitch, rhythm: pattern[index] }));
      return { ...targetQuestion, notation: { ...notation, scoreId: targetQuestion.id, notes } };
    }
    const previousSignature = twoBarPatternHistory.current.get(targetQuestion?.concept) || "";
    const generated = CORE.generateTwoBarMelody(targetQuestion?.concept, random, previousSignature);
    if (!generated) return targetQuestion;
    twoBarPatternHistory.current.set(targetQuestion.concept, generated.signature);
    return CORE.applyGeneratedTwoBarMelody(targetQuestion, generated);
  }

  function resetQuestionState() {
    audioDirector.current.stopExcerpt();
    setSelectedLetter(null);
    setLocked(false);
    setRevealed(null);
    setRemovedLetters([]);
    setHintVisible(false);
    setPlaysUsed(0);
    setAudioPlaying(false);
    setAudioFinished(false);
    answerTimer.current = { questionId: null, remaining: TIMER_DURATION_SECONDS };
    setTimeRemaining(TIMER_DURATION_SECONDS);
    setTransitioning(false);
    setCorrectRevealSkippable(false);
  }

  function beginPreparedGame(nextQuestions, keepOpeningZoom = false) {
    gameSaved.current = false;
    setQuestions(nextQuestions);
    setCurrentIndex(0);
    setRecords([]);
    setCorrectCount(0);
    setOutcome(null);
    setFinalPrize(0);
    setHighestReached(1);
    setLifelines({ fifty: true, hint: true, switch: true });
    setStartedAt(Date.now());
    setFinishedAt(null);
    setMilestone(null);
    resetQuestionState();
    if (!keepOpeningZoom) setOpeningZooming(false);
    setScreen("game");
    setAnnouncement("Question 1 for £100.");
  }

  function reportRaceProgress(correct, reset = false) {
    if (!millionaireRace) return;
    if (reset) {
      raceAttempt.current += 1;
      raceProgress?.write("millionaire-attempt", raceAttempt.current);
    }
    window.parent.postMessage({ type: "mlh:classroom-millionaire-progress", correct, millionaireAttempt: raceAttempt.current }, window.location.origin);
  }

  function startGame() {
    if (openingZooming) return;
    let collectionGame;
    if (sharedCollection) {
      try { collectionGame = CORE.composeCollectionGame(QUESTION_BANK, sharedCollection.concepts); }
      catch (error) { setDialog({ type: "error", message: error.message }); return; }
    }
    const nextQuestions = collectionGame?.questions || createQuestions();
    if (!nextQuestions) return;
    reportRaceProgress(0, true);
    setLevelOpen(false);
    setCustomiseOpen(false);
    setPreviousPerformance(collectionGame ? { bestWinMs: null, highestQuestion: 0, bestAmount: 0, bestTimesByQuestion: {} } : levelPerformance(settings.level));
    setActiveCustomSet(collectionGame ? { id: sharedCollection.id, title: sharedCollection.name, variants: collectionGame.variants } : null);
    customRuntimeRef.current?.revoke();
    customRuntimeRef.current = null;
    audioDirector.current.configure(settings);
    audioDirector.current.startGame();
    setOpeningZooming(true);
    beginPreparedGame(nextQuestions, true);
    openingZoomTimer.current = window.setTimeout(() => {
      openingZoomTimer.current = null;
      setOpeningZooming(false);
    }, 1600);
  }

  async function startCustomGame(set) {
    if (openingZooming) return;
    try {
      const prepared = window.MILLIONAIRE_CUSTOM_SETS.runtimeSet(set);
      customRuntimeRef.current?.revoke();
      customRuntimeRef.current = prepared;
      setLevelOpen(false);
      setCustomiseOpen(false);
      setPreviousPerformance({ bestWinMs: null, highestQuestion: 0, bestAmount: 0, bestTimesByQuestion: {} });
      audioDirector.current.configure(settings);
      audioDirector.current.startGame();
      setActiveCustomSet({ id: set.id, title: set.title, variants: prepared.variants, shuffleVariants: set.shuffleVariants || [] });
      beginPreparedGame(prepared.questions);
    } catch (error) {
      console.error("Custom Millionaire game could not start.", error);
      const firstIssue = error?.validation?.issues?.[0]?.message;
      setDialog({ type: "error", message: firstIssue || "This custom question set could not be loaded. Return to the library and check that all questions and media are complete." });
    }
  }

  function resetGame() {
    gameOperation.current += 1;
    window.clearTimeout(openingZoomTimer.current);
    openingZoomTimer.current = null;
    setOpeningZooming(false);
    resetQuestionState();
    audioDirector.current.stopMusic();
    audioDirector.current.stopEffect();
    setDialog(null);
    setMilestone(null);
    setActiveCustomSet(null);
    customRuntimeRef.current?.revoke();
    customRuntimeRef.current = null;
    setScreen("title");
  }

  function restartRace() {
    if (!questions.length) return;
    gameOperation.current += 1;
    reportRaceProgress(0, true);
    const audio = audioDirector.current;
    audio.stopExcerpt(false);
    audio.stopEffect();
    audio.stopMusic();
    beginPreparedGame(questions);
    audio.playQuestion(1);
  }

  function selectAnswer(letter) {
    if (locked || transitioning || removedLetters.includes(letter) || !question?.answers.some((answer) => answer.letter === letter)) return;
    setSelectedLetter(letter);
    setAnnouncement(`Answer ${letter} selected. Press Final Answer to lock it in.`);
  }

  function currentRecord(isCorrect) {
    const pupil = question.answers.find((answer) => answer.letter === selectedLetter);
    const correct = question.answers.find((answer) => answer.letter === question.correctLetter);
    return {
      questionNumber: currentIndex + 1,
      question,
      category: question.category,
      concept: question.concept,
      pupilLetter: selectedLetter,
      pupilAnswer: pupil?.text || "Not answered",
      correctLetter: question.correctLetter,
      correctAnswer: correct?.text || "",
      correct: isCorrect,
    };
  }

  async function lockAnswer() {
    if (!selectedLetter || locked || transitioning || !question) return;
    audioDirector.current.stopExcerpt(false);
    setAudioPlaying(false);
    setHintVisible(false);
    setLocked(true);
    setTransitioning(true);
    setAnnouncement(`Answer ${selectedLetter} locked.`);
    const operation = gameOperation.current;
    await audioDirector.current.playFinalAnswer(currentIndex + 1);
    if (operation !== gameOperation.current) return;
    const isCorrect = selectedLetter === question.correctLetter;
    const record = currentRecord(isCorrect);
    setRecords((current) => [...current, record]);
    setRevealed(isCorrect ? "correct" : "incorrect");
    setTransitioning(false);
    if (isCorrect) await handleCorrectAnswer(record, operation);
    else await handleIncorrectAnswer(record, operation);
  }

  async function handleTimerExpired() {
    if (locked || transitioning || !question) return;
    audioDirector.current.stopExcerpt(false);
    setAudioPlaying(false);
    setHintVisible(false);
    setLocked(true);
    setTransitioning(true);
    setAnnouncement("Time is up. The correct answer is being revealed.");
    setSelectedLetter(null);
    const record = { ...currentRecord(false), pupilLetter: null, pupilAnswer: "Not answered" };
    setRecords((current) => [...current, record]);
    setRevealed("incorrect");
    setTransitioning(false);
    const operation = gameOperation.current;
    await handleIncorrectAnswer(record, operation);
    if (operation === gameOperation.current) audioDirector.current.stopMusic();
  }

  async function handleCorrectAnswer(record, operation = gameOperation.current) {
    const stage = currentIndex + 1;
    const nextCorrect = correctCount + 1;
    setCorrectCount(nextCorrect);
    reportRaceProgress(nextCorrect);
    if (medalEligible && QUESTION_REWARDS[stage]) window.MLH.achievements?.award(window.location.pathname, settings.level, QUESTION_REWARDS[stage].tier);
    setAnnouncement(`Correct. You have won ${CORE.formatPrize(CORE.PRIZE_LADDER[currentIndex])}.`);
    if (stage === 15) {
      setOutcome("won");
      setFinalPrize(1000000);
      setHighestReached(15);
      setMilestone({ stage: 15, prize: 1000000, victory: true });
      setScreen("milestone");
      audioDirector.current.playOutcome(15, true, { finishNaturally: true });
      return;
    }
    if (!medalEligible && (stage === 5 || stage === 10)) {
      setMilestone({ stage, prize: CORE.PRIZE_LADDER[currentIndex], nextIndex: currentIndex + 1, autoAdvance: true, prizeOnly: true });
      setAnnouncement(`Milestone reached. You have won ${CORE.formatPrize(CORE.PRIZE_LADDER[currentIndex])}. Moving to Question ${stage + 1} when the correct-answer audio finishes.`);
      const stopAfterSeconds = stage === 5 ? 7 : 8;
      await audioDirector.current.playOutcome(stage, true, { finishNaturally: false, stopAfterSeconds });
      if (operation !== gameOperation.current) return;
      setMilestone(null);
      goToQuestion(currentIndex + 1);
      return;
    }
    if (medalEligible && QUESTION_REWARDS[stage]) {
      setMilestone({ stage, prize: CORE.PRIZE_LADDER[currentIndex], nextIndex: currentIndex + 1, autoAdvance: true });
      setAnnouncement(`Milestone reached. You have won ${CORE.formatPrize(CORE.PRIZE_LADDER[currentIndex])}. Moving to Question ${stage + 1} when the correct-answer audio finishes.`);
      const stopAfterSeconds = stage === 5 ? 7 : stage === 10 ? 8 : 0;
      await audioDirector.current.playOutcome(stage, true, { finishNaturally: stage !== 3, stopAfterSeconds });
      if (operation !== gameOperation.current) return;
      setMilestone(null);
      goToQuestion(currentIndex + 1);
      return;
    }
    setCorrectRevealSkippable(true);
    await audioDirector.current.playOutcome(stage, true);
    if (operation !== gameOperation.current) return;
    setCorrectRevealSkippable(false);
    goToQuestion(currentIndex + 1);
  }

  async function handleIncorrectAnswer(_record, operation = gameOperation.current) {
    reportRaceProgress(0, true);
    const prize = CORE.guaranteedPrize(correctCount);
    setOutcome("incorrect");
    setFinalPrize(prize);
    setHighestReached(currentIndex + 1);
    setAnnouncement(`Incorrect. The correct answer is ${question.correctLetter}.`);
    if (currentIndex + 1 <= 5) audioDirector.current.stopMusic();
    await audioDirector.current.playOutcome(currentIndex + 1, false);
    if (operation !== gameOperation.current) return;
  }

  function skipCorrectReveal() {
    if (!correctRevealSkippable) return;
    setCorrectRevealSkippable(false);
    audioDirector.current.stopEffect();
  }

  function goToQuestion(index) {
    resetQuestionState();
    setCurrentIndex(index);
    setHighestReached(index + 1);
    setScreen("game");
    setAnnouncement(`Question ${index + 1} for ${CORE.formatPrize(CORE.PRIZE_LADDER[index])}.`);
    audioDirector.current.playQuestion(index + 1);
  }

  function saveCompletedGame(finalOutcome, completedAt) {
    if (gameSaved.current) return;
    if (!medalEligible) {
      gameSaved.current = true;
      return;
    }
    const recent = safeRead(HISTORY_KEY, []);
    const next = [...(Array.isArray(recent) ? recent : []), questions.map((item) => item.id)].slice(-5);
    safeWrite(HISTORY_KEY, next);
    const allPerformance = safeRead(PERFORMANCE_KEY, {});
    const previous = levelPerformance(settings.level);
    const completedDuration = Math.max(0, completedAt - (startedAt || completedAt));
    const completedHighestQuestion = Math.max(1, Math.min(15, highestReached || currentIndex + 1));
    const lastCorrectRecord = [...records].reverse().find((record) => record.correct);
    const completedAmount = lastCorrectRecord ? CORE.PRIZE_LADDER[lastCorrectRecord.questionNumber - 1] || 0 : 0;
    const nextBestWinMs = finalOutcome === "won" && (previous.bestWinMs == null || completedDuration < previous.bestWinMs) ? completedDuration : previous.bestWinMs;
    const previousQuestionBestMs = previous.bestTimesByQuestion[completedHighestQuestion];
    const nextQuestionBestMs = previousQuestionBestMs == null || completedDuration < previousQuestionBestMs ? completedDuration : previousQuestionBestMs;
    safeWrite(PERFORMANCE_KEY, {
      ...(allPerformance && typeof allPerformance === "object" ? allPerformance : {}),
      [settings.level]: {
        bestWinMs: nextBestWinMs,
        highestQuestion: Math.max(previous.highestQuestion, completedHighestQuestion),
        bestAmount: Math.max(previous.bestAmount, completedAmount),
        bestTimesByQuestion: { ...previous.bestTimesByQuestion, [completedHighestQuestion]: nextQuestionBestMs },
      },
    });
    gameSaved.current = true;
  }

  function finishGame(finalOutcome = outcome, prize = finalPrize) {
    const preserveMillionWinAudio = finalOutcome === "won" && prize === 1000000;
    audioDirector.current.stopExcerpt();
    audioDirector.current.stopMusic();
    if (!preserveMillionWinAudio) audioDirector.current.stopEffect();
    const now = Date.now();
    setOutcome(finalOutcome);
    setFinalPrize(prize);
    setFinishedAt(now);
    setScreen("results");
    setDialog(null);
    saveCompletedGame(finalOutcome, now);
    setAnnouncement(`Game complete. Final prize ${CORE.formatPrize(prize)}.`);
    if (classroomGame && !millionaireRace && window.parent !== window) {
      window.parent.postMessage({ type: "mlh:classroom-finished", solved: finalOutcome === "won" }, window.location.origin);
    }
  }

  function useFiftyFifty() {
    if (!lifelines.fifty || locked || transitioning || !question) return;
    const random = classroomGame ? classroomActivities.random((classroomSeed + currentIndex) >>> 0) : Math.random;
    const removed = CORE.fiftyFifty(question, random);
    setRemovedLetters(removed);
    if (removed.includes(selectedLetter)) setSelectedLetter(null);
    setLifelines((current) => ({ ...current, fifty: false }));
    setAnnouncement(`50:50 used. Answers ${removed.join(" and ")} removed.`);
    audioDirector.current.playLifeline();
  }

  function useHint() {
    if (!lifelines.hint || locked || transitioning || !question) return;
    setLifelines((current) => ({ ...current, hint: false }));
    setHintVisible(true);
    setAnnouncement(`Hint: ${question.tip}`);
    audioDirector.current.playLifeline();
  }

  function useSwitch() {
    if (classroomGame || !lifelines.switch || locked || transitioning || !question) return;
    if (activeCustomSet) {
      const stageVariants = activeCustomSet.variants?.[currentIndex] || [];
      const replacement = activeCustomSet.shuffleVariants?.[currentIndex]
        ? stageVariants.filter((item) => item.id !== question.id)[Math.floor(Math.random() * Math.max(1, stageVariants.filter((item) => item.id !== question.id).length))]
        : stageVariants[0];
      if (!replacement) {
        setDialog({ type: "error", message: "This prize level needs another complete question before the Switch lifeline can be used." });
        return;
      }
      resetQuestionState();
      setQuestions((current) => current.map((item, index) => index === currentIndex ? replacement : item));
      setLifelines((current) => ({ ...current, switch: false }));
      setAnnouncement(`Switch used. Prize level ${currentIndex + 1} has been replaced by another question from ${activeCustomSet.title}.`);
      audioDirector.current.playLifeline();
      return;
    }
    const enabledCategories = selectedQuestionCategories(settings);
    const enabledQuestionBank = QUESTION_BANK.filter((item) => enabledCategories.includes(item.category));
    const otherFingerprints = new Set(questions.filter((_, index) => index !== currentIndex).map(CORE.questionFingerprint));
    let randomisedReplacement = null;
    for (let attempt = 0; attempt < 40; attempt += 1) {
      const replacement = CORE.switchQuestion(enabledQuestionBank, questions, currentIndex + 1, settings.level, Math.random, { includeEarlier: settings.selectedLevelOnly !== true });
      if (!replacement) break;
      const candidate = randomiseTwoBarQuestion(replacement);
      if (!otherFingerprints.has(CORE.questionFingerprint(candidate))) { randomisedReplacement = candidate; break; }
    }
    if (!randomisedReplacement) {
      setDialog({ type: "error", message: "A replacement question of the same difficulty is not available." });
      return;
    }
    resetQuestionState();
    setQuestions((current) => current.map((item, index) => index === currentIndex ? randomisedReplacement : item));
    setLifelines((current) => ({ ...current, switch: false }));
    setAnnouncement(`Switch used. A replacement question has been selected for question ${currentIndex + 1}.`);
    audioDirector.current.playLifeline();
  }

  function playQuestionExcerpt(targetQuestion, onEnded) {
    if (targetQuestion?.audio?.generator) return audioDirector.current.playGenerated(targetQuestion.audio.generator, onEnded);
    return audioDirector.current.playFileExcerpt(targetQuestion?.audioSrc || targetQuestion?.audio?.src, onEnded);
  }

  function playQuestionAudio(learning = false) {
    if (!hasQuestionAudio(question)) {
      setAnnouncement("The listening excerpt is unavailable.");
      return;
    }
    if (audioPlaying || (!learning && playsUsed >= 3)) return;
    const duration = playQuestionExcerpt(question, (completed) => {
      setAudioPlaying(false);
      if (completed) setAudioFinished(true);
      else {
        if (!learning) setPlaysUsed((count) => Math.max(0, count - 1));
        setAnnouncement("The listening excerpt could not be played. No play has been counted.");
      }
    });
    if (!duration) {
      setAnnouncement("The listening excerpt is unavailable. No play has been counted.");
      return;
    }
    if (!learning) setPlaysUsed((count) => count + 1);
    setAudioPlaying(true);
  }

  function stopQuestionAudio() {
    audioDirector.current.stopExcerpt();
    setAudioPlaying(false);
    setAnnouncement("Listening excerpt stopped.");
  }

  useEffect(() => {
    if (!startedAt || finishedAt || !["game", "milestone"].includes(screen)) return undefined;
    setClockNow(Date.now());
    const interval = window.setInterval(() => setClockNow(Date.now()), 250);
    return () => window.clearInterval(interval);
  }, [startedAt, finishedAt, screen]);
  const elapsedMs = Math.max(0, (finishedAt || clockNow) - (startedAt || clockNow));
  const usedLifelines = LIFELINE_RESULTS.filter(({ key }) => !lifelines[key]);

  function renderQuestionMedia(recordQuestion = question, learning = false) {
    const noteValueNameQuestion = isNoteValueNameQuestion(recordQuestion);
    const whatNoteQuestion = isWhatNoteQuestion(recordQuestion);
    const beatTotalQuestion = isBeatTotalQuestion(recordQuestion);
    const singleNoteBeatsQuestion = isSingleNoteBeatsQuestion(recordQuestion);
    const timeSignatureQuestion = isTopNumberTimeSignatureQuestion(recordQuestion);
    const dottedMinimNameQuestion = isDottedMinimNameQuestion(recordQuestion);
    const dottedMinimBeatsQuestion = isDottedMinimBeatsQuestion(recordQuestion);
    const dynamicSymbolQuestion = isDynamicSymbolQuestion(recordQuestion);
    const symbolMeaningQuestion = isSymbolMeaningQuestion(recordQuestion);
    const timeSignatureBarCompletionQuestion = isTimeSignatureBarCompletionQuestion(recordQuestion);
    const selectedBarAnswer = recordQuestion === question && selectedLetter ? recordQuestion.answers?.find((answer) => answer.letter === selectedLetter) : null;
    const selectedBarRhythm = selectedBarAnswer ? (recordQuestion.notation?.kind === "restBar" ? REST_ANSWER_VALUES[selectedBarAnswer.text] : RHYTHM_ANSWER_VALUES[selectedBarAnswer.text]) || null : null;
    const selectedBassNote = recordQuestion.notation?.kind === "ahBassPrompt" ? selectedBarAnswer?.text || null : null;
    const notationClassName = [noteValueNameQuestion ? "is-name-note-question is-note-name-question" : "", whatNoteQuestion ? "is-what-note-question" : "", recordQuestion.notation?.kind === "melody" ? "is-name-note-question" : "", singleNoteBeatsQuestion ? "is-note-name-question" : "", beatTotalQuestion ? "is-beat-total-question" : "", timeSignatureQuestion ? "is-time-signature-question" : "", dottedMinimNameQuestion ? "is-dotted-minim-name-question" : "", dottedMinimBeatsQuestion ? "is-dotted-minim-beats-question" : "", dynamicSymbolQuestion ? "is-dynamic-symbol-question" : "", symbolMeaningQuestion ? "is-symbol-meaning-question" : "", timeSignatureBarCompletionQuestion ? "is-time-signature-bar-completion" : ""].filter(Boolean).join(" ");
    return <>
      {(recordQuestion.type === "notation" || recordQuestion.type === "text-notation") && <NotationView notation={recordQuestion.notation} className={notationClassName} whatNoteQuestion={whatNoteQuestion} selectedRhythm={selectedBarRhythm} selectedBassNote={selectedBassNote} />}
      {recordQuestion.type === "image" && <QuestionImage image={recordQuestion.image} />}
      {recordQuestion.type === "youtube" && <QuestionYouTube youtube={recordQuestion.youtube} />}
      {recordQuestion.mediaCredit?.sourceUrl && <a className="millionaire-media-credit" href={recordQuestion.mediaCredit.sourceUrl} target="_blank" rel="noopener noreferrer" title={[recordQuestion.mediaCredit.credit, recordQuestion.mediaCredit.license].filter(Boolean).join(' · ')}>Media credit</a>}
      {hasQuestionAudio(recordQuestion) && <AudioCard playsUsed={recordQuestion === question ? playsUsed : 0} playing={recordQuestion === question ? audioPlaying : false} onPlay={() => {
        if (recordQuestion === question) playQuestionAudio(learning);
        else {
          const duration = playQuestionExcerpt(recordQuestion, () => {});
          if (!duration) setAnnouncement("The listening excerpt is unavailable.");
        }
      }} onStop={stopQuestionAudio} learning={learning} />}
    </>;
  }

  function TitleScreen() {
    const openingLightRayLengths = [64, 71.5, 66, 73, 68.5, 70, 63, 69, 72, 65.5, 70.5, 62, 67.5, 74, 64.5, 71, 67, 73.5, 63.5, 69.5, 62.5, 72.5, 68, 65];
    return <section className={`millionaire-screen millionaire-opening-screen ${openingZooming ? "is-opening-zoom" : ""}`} aria-busy={openingZooming} aria-hidden={openingZooming || undefined}>
      <span className="millionaire-opening-logo-stage">
        <span className="millionaire-opening-logo-shine"><img className="millionaire-opening-logo" src="whowantstobemillionaire/millionairelogo new.svg" alt="Who Wants to Be a Millionaire" /></span>
        <span className="millionaire-opening-logo-backlight" aria-hidden="true">
          <span className="millionaire-opening-logo-rays">
            {openingLightRayLengths.map((length, index) => <span className="millionaire-opening-logo-ray" key={length} style={{ "--ray-angle": `${index * 15}deg`, "--ray-length": `${length}%`, "--ray-width": `${8 + index % 5 * 1.8}px`, "--ray-opacity": .54 + index % 4 * .07 }} />)}
          </span>
        </span>
      </span>
      <p className="millionaire-screen-copy millionaire-opening-copy">Test your musical knowledge and climb the prize ladder to £1 million.</p>
      <div className="millionaire-opening-actions">
        <button type="button" className="millionaire-secondary millionaire-play millionaire-opening-play" disabled={openingZooming} onClick={() => setScreen("rules")}><span className="millionaire-opening-play-label">How to Play</span></button>
        <button type="button" className="millionaire-primary millionaire-play millionaire-opening-play" disabled={openingZooming} onClick={startGame}><span className="millionaire-opening-play-label">Play</span></button>
      </div>
      {!classroomGame && <button type="button" className="millionaire-play millionaire-opening-play millionaire-opening-create" disabled={openingZooming} onClick={() => { try { localStorage.removeItem("mlh-millionaire-creator-resume"); } catch {} setScreen("creator"); }}><span className="millionaire-opening-play-label">Create &amp; Import</span></button>}
    </section>;
  }

  function RulesScreen() {
    return <section className="millionaire-screen millionaire-rules-screen"><div className="millionaire-setup-card millionaire-rules-card">
      <h2>How to Play</h2>
      <div className="millionaire-rules-grid">
        <section className="millionaire-rules-section" aria-labelledby="millionaire-rules-gameplay">
          <h3 id="millionaire-rules-gameplay">Playing the game</h3>
          <div className="millionaire-game-rules-copy">
            <p>Answer 15 music questions which progressively get more challenging.</p>
            <p>Each question is multiple choice with four possible answers.</p>
            {!classroomGame && <p>Earn awards for correctly answering the following questions:</p>}
          </div>
          {!classroomGame && <ul className="millionaire-rewards-list">
            {[15, 10, 5, 3].map((stage) => <li key={stage}><img className="millionaire-reward-icon" src={QUESTION_REWARDS[stage].icon} alt={QUESTION_REWARDS[stage].label} /><span className={`millionaire-reward-label is-${QUESTION_REWARDS[stage].tier}`}>Question {stage}</span></li>)}
          </ul>}
        </section>
        <section className="millionaire-rules-section millionaire-lifeline-rules-section" aria-labelledby="millionaire-rules-lifelines">
          <h3 id="millionaire-rules-lifelines">Lifelines</h3>
          <div className="millionaire-game-rules-copy millionaire-lifeline-intro"><p>If you get stuck on a question, you can use a lifeline:</p></div>
          <ul className="millionaire-lifeline-rules">
            <li><span className="millionaire-lifeline-badge millionaire-lifeline-rule-badge"><img className="millionaire-lifeline-rule-icon" src="whowantstobemillionaire/50.50.svg" alt="" /></span><strong>50:50</strong><span>Removes two incorrect answers</span></li>
            <li><span className="millionaire-lifeline-badge millionaire-lifeline-rule-badge"><img className="millionaire-lifeline-rule-icon" src="whowantstobemillionaire/hint.svg" alt="" /></span><strong>Hint</strong><span>Guides you towards the correct answer with a hint</span></li>
            {!classroomGame && <li><span className="millionaire-lifeline-badge millionaire-lifeline-rule-badge"><img className="millionaire-lifeline-rule-icon" src="whowantstobemillionaire/switch.svg" alt="" /></span><strong>Switch</strong><span>Switch your current question to a different question</span></li>}
          </ul>
          <p className="millionaire-rules-note">Each lifeline can only be used once per game.</p>
        </section>
      </div>
      <div className="millionaire-rules-actions">
        <button type="button" className="millionaire-secondary millionaire-play millionaire-back-button" onClick={() => setScreen("title")}><span className="millionaire-back-button-label">Back</span></button>
      </div>
    </div></section>;
  }

  function GameScreen() {
    if (!question) return null;
    const earnedReward = medalEligible && revealed === "correct" && currentIndex < 14 ? QUESTION_REWARDS[currentIndex + 1] : null;
    const milestoneIsShowing = Boolean((earnedReward || milestone?.prizeOnly) && milestone?.stage === currentIndex + 1);
    const prizeMilestoneIsShowing = Boolean(milestone?.prizeOnly && milestone.stage === currentIndex + 1);
    const autoAdvancingMilestone = Boolean(milestoneIsShowing && milestone?.autoAdvance);
    const earnedPrize = CORE.PRIZE_LADDER[currentIndex] === 1000000 ? "£1 MILLION" : CORE.formatPrize(CORE.PRIZE_LADDER[currentIndex]);
    const showWonAmount = revealed === "correct";
    return <div className="millionaire-game-grid">
      <section className="millionaire-play-area">
        {settings.timer && !revealed && !earnedReward && <QuestionTimer seconds={timeRemaining} />}
        <div className="millionaire-question-panel">
          {hintVisible && <div className="millionaire-inline-hint" role="note"><strong>Hint</strong><span><HintText question={question} /></span></div>}
          <div className="millionaire-question-media">{earnedReward ? <MilestoneCelebration reward={earnedReward} /> : prizeMilestoneIsShowing ? <MilestoneCelebration prize={CORE.PRIZE_LADDER[currentIndex]} /> : renderQuestionMedia(question, outcome === "incorrect")}</div>
          <div className="millionaire-question-rail"><div className="millionaire-question-bar"><h2 className={showWonAmount ? "is-milestone-amount" : undefined}>{showWonAmount ? <span className="millionaire-milestone-amount" aria-label={earnedPrize}><span aria-hidden="true">◆</span><span>{earnedPrize}</span><span aria-hidden="true">◆</span></span> : question.prompt || question.question}</h2></div></div>
        </div>
        <div className="millionaire-answers" role="group" aria-label="Answer choices">
          {[question.answers.slice(0, 2), question.answers.slice(2, 4)].map((answerRow, rowIndex) => <div className="millionaire-answer-row" role="presentation" key={rowIndex}>{answerRow.map((answer) => {
            const removed = removedLetters.includes(answer.letter);
            const isCorrect = revealed && answer.letter === question.correctLetter;
            const isIncorrect = revealed === "incorrect" && answer.letter === selectedLetter;
            const classes = ["millionaire-answer"];
            if (selectedLetter === answer.letter && !revealed) classes.push(locked ? "is-locked" : "is-selected");
            if (isCorrect) classes.push("is-correct", revealed === "correct" ? "is-correct-selection" : "is-correct-reveal");
            if (isIncorrect) classes.push("is-incorrect");
            if (removed) classes.push("is-removed");
            const answerDisabled = locked || transitioning || removed;
            const status = isCorrect ? "Correct answer" : isIncorrect ? "Incorrect answer" : "";
            return <button key={answer.letter} type="button" className={classes.join(" ")} disabled={answerDisabled} tabIndex={removed ? -1 : undefined} aria-hidden={removed || undefined} aria-label={`${answer.letter}: ${answer.text}`} aria-pressed={selectedLetter === answer.letter} onClick={() => selectAnswer(answer.letter)}>
              <AutoFitAnswer answer={answer} question={question} /><span className="millionaire-answer-status">{status}</span>
            </button>;
          })}</div>)}
        </div>
        {revealed === "incorrect" ?
          <div className="millionaire-actions">
            <button type="button" className="millionaire-primary millionaire-final-answer" onClick={millionaireRace ? restartRace : () => finishGame("incorrect", finalPrize)}>
              <span className="millionaire-final-answer-label">{millionaireRace ? "Restart" : "Review"}</span>
            </button>
          </div>
        : <div className="millionaire-actions millionaire-final-answer-actions">
          <button type="button" className="millionaire-primary millionaire-final-answer" disabled={autoAdvancingMilestone || !selectedLetter || locked || transitioning} onClick={lockAnswer}><span className="millionaire-final-answer-label">Final Answer</span></button>
        </div>}
      </section>
      <PrizeLadder currentIndex={currentIndex} correctCount={correctCount} controls={<div className="millionaire-lifelines millionaire-ladder-lifelines" ref={lifelineRef} aria-label="Lifelines">
        <button type="button" className={`millionaire-lifeline ${!lifelines.fifty ? "is-used" : ""}`} disabled={!lifelines.fifty || locked || transitioning} aria-label={`50:50 lifeline${!lifelines.fifty ? ", used" : ""}`} aria-pressed={!lifelines.fifty} onClick={useFiftyFifty}><span className="millionaire-lifeline-badge"><img className="millionaire-lifeline-icon" src="whowantstobemillionaire/50.50.svg" alt="" /></span></button>
        <button type="button" className={`millionaire-lifeline ${!lifelines.hint ? "is-used" : ""}`} disabled={!lifelines.hint || locked || transitioning} aria-label={`Hint lifeline${!lifelines.hint ? ", used" : ""}`} aria-pressed={!lifelines.hint} onClick={useHint}><span className="millionaire-lifeline-badge"><img className="millionaire-lifeline-icon" src="whowantstobemillionaire/hint.svg" alt="" /></span></button>
        {!classroomGame && <button type="button" className={`millionaire-lifeline ${!lifelines.switch ? "is-used" : ""}`} disabled={!lifelines.switch || locked || transitioning} aria-label={`Switch lifeline${!lifelines.switch ? ", used" : ""}`} aria-pressed={!lifelines.switch} onClick={useSwitch}><span className="millionaire-lifeline-badge"><img className="millionaire-lifeline-icon" src="whowantstobemillionaire/switch.svg" alt="" /></span></button>}
      </div>} />
    </div>;
  }

  function MilestoneScreen() {
    return <section className="millionaire-screen millionaire-celebration">
      <FinalConfetti />
      <div className="millionaire-celebration-centre">
        {medalEligible ? <MilestoneCelebration reward={QUESTION_REWARDS[15]} showBurst={false} /> : <MilestoneCelebration prize={1000000} showBurst={false} />}
        <h2>£1 MILLION</h2>
        <p className="millionaire-celebration-message">Congratulations!</p>
      </div>
      <button type="button" className="millionaire-primary millionaire-final-answer" onClick={() => finishGame("won", 1000000)}><span className="millionaire-final-answer-label">Review</span></button>
    </section>;
  }

  function ResultsScreen() {
    const lastCorrectRecord = [...records].reverse().find((record) => record.correct);
    const reviewQuestionNumber = lastCorrectRecord?.questionNumber || 0;
    const reachedQuestionNumber = Math.max(1, Math.min(15, highestReached || currentIndex + 1));
    const reviewPrizeValue = reviewQuestionNumber ? CORE.PRIZE_LADDER[reviewQuestionNumber - 1] || 0 : 0;
    const reviewPrize = reviewPrizeValue === 1000000 ? "£1 Million" : CORE.formatPrize(reviewPrizeValue);
    const previousPrizeValue = previousPerformance.bestAmount || 0;
    const previousPrize = previousPrizeValue === 1000000 ? "£1 Million" : CORE.formatPrize(previousPrizeValue);
    const previousQuestionBestMs = previousPerformance.bestTimesByQuestion[reachedQuestionNumber];
    const earnedMedalStage = [15, 10, 5, 3].find((stage) => stage <= correctCount);
    const earnedMedal = earnedMedalStage ? QUESTION_REWARDS[earnedMedalStage] : null;
    return <section className="millionaire-screen millionaire-results">
      {outcome === "won" && <FinalConfetti />}
      <h2>Review</h2>
      <div className={`millionaire-results-grid${medalEligible ? "" : " is-custom-game"}`}>
        <ResultStat label="Question" previous={`Previous best: ${previousPerformance.highestQuestion ? `${previousPerformance.highestQuestion} / 15` : "—"}`}>{reachedQuestionNumber} / 15</ResultStat>
        <ResultStat label="Amount" valueClassName="millionaire-result-amount" previous={<React.Fragment>Previous best: <span className="millionaire-result-previous-amount">{previousPerformance.highestQuestion ? previousPrize : "—"}</span></React.Fragment>}>{lastCorrectRecord ? reviewPrize : "—"}</ResultStat>
        {medalEligible && <ResultStat label="Award"><span className="millionaire-result-medal">{earnedMedal ? <img src={earnedMedal.icon} alt={earnedMedal.label} /> : "—"}</span></ResultStat>}
        <ResultStat label="Time" previous={`Previous best for ${reachedQuestionNumber}/15: ${previousQuestionBestMs == null ? "—" : formatTime(previousQuestionBestMs)}`}>{formatTime(elapsedMs)}</ResultStat>
        <ResultStat label="Lifelines used"><span className="millionaire-result-lifelines">{usedLifelines.length ? usedLifelines.map(({ key, icon, label }) => <img key={key} src={icon} alt={label} />) : "—"}</span></ResultStat>
      </div>
      {!classroomGame && <div className="millionaire-result-actions"><button type="button" className="millionaire-primary millionaire-final-answer" onClick={resetGame}><span className="millionaire-final-answer-label">Exit</span></button></div>}
    </section>;
  }

  function ReviewScreen() {
    return <section className="millionaire-screen millionaire-review">
      <div className="millionaire-review-header"><h2>Answer review</h2><button type="button" className="millionaire-secondary" onClick={() => setScreen("results")}>Back to results</button></div>
      <div className="millionaire-review-list">{records.map((record) => <article className="millionaire-review-card" key={record.question.id}>
        <div className="millionaire-review-meta">Question {record.questionNumber} • {CATEGORY_LABELS[record.category]} • {record.concept.replaceAll("-", " ")}</div>
        <h3>{record.question.question}</h3>
        {(record.question.notation || record.question.image) && <div>{record.question.notation ? <NotationView notation={record.question.notation} whatNoteQuestion={isWhatNoteQuestion(record.question)} className={[isNoteValueNameQuestion(record.question) ? "is-name-note-question is-note-name-question" : "", isWhatNoteQuestion(record.question) ? "is-what-note-question" : "", record.question.notation.kind === "melody" ? "is-name-note-question" : "", isSingleNoteBeatsQuestion(record.question) ? "is-note-name-question" : "", isBeatTotalQuestion(record.question) ? "is-beat-total-question" : "", isTopNumberTimeSignatureQuestion(record.question) ? "is-time-signature-question" : "", isDottedMinimNameQuestion(record.question) ? "is-dotted-minim-name-question" : "", isDottedMinimBeatsQuestion(record.question) ? "is-dotted-minim-beats-question" : "", isDynamicSymbolQuestion(record.question) ? "is-dynamic-symbol-question" : "", isSymbolMeaningQuestion(record.question) ? "is-symbol-meaning-question" : "", isTimeSignatureBarCompletionQuestion(record.question) ? "is-time-signature-bar-completion" : ""].filter(Boolean).join(" ")} /> : <QuestionImage image={record.question.image} />}</div>}
        <ul className="millionaire-review-options">{record.question.answers.map((answer) => <li key={answer.letter} className={`millionaire-review-option ${answer.letter === record.pupilLetter ? "is-pupil" : ""} ${answer.letter === record.correctLetter ? "is-right" : ""}`}>{answer.letter}: {answer.text}{answer.letter === record.pupilLetter ? " — your answer" : ""}{answer.letter === record.correctLetter ? " — correct" : ""}</li>)}</ul>
        {hasQuestionAudio(record.question) && <div className="millionaire-review-audio"><button type="button" className="millionaire-secondary" onClick={() => playQuestionExcerpt(record.question, () => {})}>Replay excerpt</button></div>}
      </article>)}</div>
    </section>;
  }

  function CurrentScreen() {
    if (screen === "title") return TitleScreen();
    if (screen === "rules") return RulesScreen();
    if (screen === "creator") return <window.MillionaireCreator onBack={() => { setCreatorEditing(false); setScreen("title"); }} onPlay={startCustomGame} PrizeLadderComponent={PrizeLadder} onEditingChange={setCreatorEditing} />;
    if (screen === "game") return GameScreen();
    if (screen === "milestone") return MilestoneScreen();
    if (screen === "results") return ResultsScreen();
    return ReviewScreen();
  }

  const customiseUnavailable = classroomGame || openingZooming || screen === "game" || screen === "milestone" || screen === "creator";
  const activeLevelLabel = MILLIONAIRE_LEVELS[settings.level]?.label || "National 3";
  const isCustomGame = Boolean(activeCustomSet);
  const medalEligible = !classroomGame && !sharedCollection && !isCustomGame;
  const classroomActivityUrl = !classroomGame && !sharedCollection && screen === "title"
    ? window.MLH.profileShareUrl({ settings }, new URL(window.location.pathname, window.location.origin))
    : null;
  const headerHasGame = screen !== "title" && screen !== "creator" && Boolean(startedAt);
  const headerQuestion = headerHasGame ? Math.min(15, Math.max(1, highestReached, currentIndex + 1)) : 0;
  const headerBest = Math.max(medalEligible ? levelPerformance(settings.level).highestQuestion : 0, headerQuestion);

  return <div className={window.MLH.shell.pageShellClass} style={{ overflowX: "clip" }}>
    <window.MLH.AppHeader profileState={{ settings }} icon="app-icons/millionaire-icon.svg" title="Who Wants to Be a Millionaire?" subtitle="Test your musical knowledge and climb the prize ladder to £1 million." profileLabel={activeLevelLabel} profileUsesSharedSettings={false} profileShareDisabled={classroomGame || screen === "creator"} classroomActivityUrl={classroomActivityUrl}>
      {screen !== "creator" && <window.MLH.ScoreStreakPanel
        assets={{ bronze: "ui-icons/bronze.svg", silver: "ui-icons/silver.svg", gold: "ui-icons/gold.svg", diamond: "ui-icons/diamond.svg" }}
        correct={correctCount} attempted={records.length} accuracy={0} streak={headerHasGame ? correctCount : 0} bestStreak={headerBest}
        scoreDisplay={{ label: "Time", value: formatTime(headerHasGame ? elapsedMs : 0), subtitle: "\u00a0", fillPercent: 0 }}
        streakDisplay={{ label: "Question", value: `${headerQuestion}/15`, subtitle: `Best: ${headerBest}` }}
        medalThresholdValues={[3, 5, 10, 15]} medalThresholdLabels={[3, 5, 10, 15]} medalEligible={medalEligible}
        scoreInteractive={false} resetScore={() => {}}
      />}
    </window.MLH.AppHeader>
    <div className="millionaire-page-content"><main className="millionaire-main-shell">
      {screen === "creator" && !creatorEditing && <div className="millionaire-creator-global-toolbar millionaire-toolbar-wrap"><window.MLH.AppToolbar left={<div className="flex items-center gap-2">
        {!isCustomGame && <fieldset disabled={customiseUnavailable} className="millionaire-customise-fieldset m-0 min-w-0 border-0 p-0">
          <div className="hub-menu-anchor relative" ref={levelRef}>
            <window.MLH.LevelButton icon={<img src="ui-icons/levels.svg" alt="" className="h-[26px] w-[26px]" />} activeLevel={settings.level} activeLabel={activeLevelLabel} expanded={levelOpen} ariaControls="millionaire-level-menu" onClick={() => { setCustomiseOpen(false); setLevelOpen((open) => !open); }} dataMenuTrigger={true} />
            {levelOpen && !customiseUnavailable && <window.MLH.MenuPanel id="millionaire-level-menu" title="Level" position="left-0" dataMenuPanel={true}><window.MLH.LevelMenu activeLevel={settings.level} updateUrl={!sharedCollection} onSelect={(level) => { if (sharedCollection) { location.href = window.HubCollections.standardLevelUrl(level); return; } setSettings((current) => ({ ...current, level, questionTypes: ["literacy"], audioQuestions: false })); setLevelOpen(false); }} levels={MILLIONAIRE_LEVELS} /></window.MLH.MenuPanel>}
          </div>
        </fieldset>}
        <fieldset disabled={customiseUnavailable} className="millionaire-customise-fieldset m-0 min-w-0 border-0 p-0">
          <div className="hub-menu-anchor relative" ref={customiseRef}>
            <window.MLH.CustomiseButton icon={<img src="ui-icons/customise.svg" alt="" aria-hidden="true" className="h-[26px] w-[26px] object-contain" />} onClick={() => { setLevelOpen(false); setCustomiseOpen((open) => !open); }} dataMenuTrigger={true} />
            {customiseOpen && !customiseUnavailable && <window.MLH.MenuPanel title="Customise" position="left-0" variant="customise" dataMenuPanel={true} className="millionaire-opening-customise-menu">
              {!sharedCollection && <QuestionTypeOptions settings={settings} setSettings={setSettings} /> }
              <window.MLH.MenuSubheading>Options</window.MLH.MenuSubheading>
              <window.MLH.MenuToggleRow glyph={<img src="ui-icons/timer.svg" alt="" aria-hidden="true" className="h-5 w-5 object-contain" />} label="Timer" checked={settings.timer} onChange={() => setSettings((current) => ({ ...current, timer: !current.timer }))} />
              {window.HubCollections.menu("millionaire", null, settings.level)}
            </window.MLH.MenuPanel>}
          </div>
        </fieldset>
      </div>} right={<button type="button" className="millionaire-toolbar-reset flex h-11 w-auto items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-2.5 text-sm font-semibold text-stone-800" aria-label="Reset game and return to opening screen" disabled={true} onClick={resetGame}><img src="ui-icons/restart.svg" alt="" className="h-[20px] w-[20px]" /><span className="relative -left-[1.5px] inline">Reset</span></button>} /></div>}
      {!classroomGame && (screen !== "creator" || creatorEditing) && <div className="millionaire-toolbar-wrap"><window.MLH.AppToolbar left={screen === "creator" ? <div id="millionaire-creator-toolbar-left" /> : <div className="flex items-center gap-2">
        {(!isCustomGame || sharedCollection) && <fieldset disabled={customiseUnavailable} className="millionaire-customise-fieldset m-0 min-w-0 border-0 p-0">
          <div className="hub-menu-anchor relative" ref={levelRef}>
            <window.MLH.LevelButton icon={<img src="ui-icons/levels.svg" alt="" className="h-[26px] w-[26px]" />} activeLevel={settings.level} activeLabel={activeLevelLabel} expanded={levelOpen} ariaControls="millionaire-level-menu" onClick={() => { setCustomiseOpen(false); setLevelOpen((open) => !open); }} dataMenuTrigger={true} />
            {levelOpen && !customiseUnavailable && <window.MLH.MenuPanel id="millionaire-level-menu" title="Level" position="left-0" dataMenuPanel={true}><window.MLH.LevelMenu activeLevel={settings.level} updateUrl={!sharedCollection} onSelect={(level) => { if (sharedCollection) { location.href = window.HubCollections.standardLevelUrl(level); return; } setSettings((current) => ({ ...current, level, questionTypes: ["literacy"], audioQuestions: false })); setLevelOpen(false); }} levels={MILLIONAIRE_LEVELS} /></window.MLH.MenuPanel>}
          </div>
        </fieldset>}
        {(!isCustomGame || sharedCollection) && <fieldset disabled={customiseUnavailable} className="millionaire-customise-fieldset m-0 min-w-0 border-0 p-0">
          <div className="hub-menu-anchor relative" ref={customiseRef}>
            <window.MLH.CustomiseButton icon={<img src="ui-icons/customise.svg" alt="" aria-hidden="true" className="h-[26px] w-[26px] object-contain" />} onClick={() => { setLevelOpen(false); setCustomiseOpen((open) => !open); }} dataMenuTrigger={true} />
            {customiseOpen && !customiseUnavailable && <window.MLH.MenuPanel title="Customise" position="left-0" variant="customise" dataMenuPanel={true} className="millionaire-opening-customise-menu">
              {!sharedCollection && <QuestionTypeOptions settings={settings} setSettings={setSettings} /> }
              <window.MLH.MenuSubheading>Options</window.MLH.MenuSubheading>
              <window.MLH.MenuToggleRow glyph={<img src="ui-icons/timer.svg" alt="" aria-hidden="true" className="h-5 w-5 object-contain" />} label="Timer" checked={settings.timer} onChange={() => setSettings((current) => ({ ...current, timer: !current.timer }))} />
              {window.HubCollections.menu("millionaire", null, settings.level)}
            </window.MLH.MenuPanel>}
          </div>
        </fieldset>}
        {sharedCollection && window.HubCollections.clearCollectionLink(sharedCollection.name, settings.level)}
      </div>} feedback={screen === "creator" ? <div id="millionaire-creator-toolbar-centre" /> : null} right={screen === "creator" ? <div id="millionaire-creator-toolbar-right" /> : <button type="button" className="millionaire-toolbar-reset flex h-11 w-auto items-center justify-center gap-1.5 rounded-xl border border-stone-300 bg-white px-2.5 text-sm font-semibold text-stone-800" aria-label="Reset game and return to opening screen" disabled={classroomGame || screen !== "game"} onClick={resetGame}><img src="ui-icons/restart.svg" alt="" className="h-[20px] w-[20px]" /><span className="relative -left-[1.5px] inline">Reset</span></button>} /></div>}
      <div className={`millionaire-scroll${screen === "creator" ? " is-creator" : ""}`}><div className={`millionaire-stage${screen === "creator" ? " is-creator" : ""}`}><div className={`millionaire-board${screen === "creator" ? " is-creator" : ""}`}>
        <button type="button" className="millionaire-audio-toggle" aria-label={settings.backgroundMusic && settings.soundEffects ? "Turn off game audio" : "Turn on game audio"} aria-pressed={settings.backgroundMusic && settings.soundEffects} onClick={toggleGameAudio}>
          <img src="ui-icons/audio-svgrepo-com.svg?v=20260722-smaller15" alt="" aria-hidden="true" />
        </button>
        <button type="button" className="millionaire-fullscreen-toggle" aria-label={fullscreen ? "Exit Full Screen" : "Full Screen"} title={fullscreen ? "Exit Full Screen" : "Full Screen"} aria-pressed={fullscreen} disabled={!document.fullscreenEnabled} onClick={toggleFullscreen}>
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true"><path d={fullscreen ? "M9 3v6H3m18 0h-6V3M3 15h6v6m6 0v-6h6" : "M9 3H3v6m12-6h6v6M3 15v6h6m6 0h6v-6"} /></svg>
        </button>
        {fullscreenError && <span className="millionaire-fullscreen-error" role="alert">{fullscreenError}</span>}

        {CurrentScreen()}
        {openingZooming && TitleScreen()}
        {openingZooming && <span className="millionaire-opening-flash" aria-hidden="true" />}
      </div></div></div>
    </main></div>
    <div className="millionaire-legal-attribution">Unofficial educational classroom resource. Not affiliated with or endorsed by the owners of <em>Who Wants to Be a Millionaire?</em></div>
    <div className="millionaire-live-region" aria-live="polite" aria-atomic="true">{announcement}</div>
    {correctRevealSkippable && <button type="button" className="millionaire-skip-correct-overlay" aria-label="Skip correct answer animation" onClick={skipCorrectReveal} />}

    {helpOpen && <Dialog title="Help and keyboard shortcuts" onClose={() => setHelpOpen(false)} actions={<button type="button" className="millionaire-primary" onClick={() => setHelpOpen(false)}>Close</button>}><dl className="millionaire-shortcuts"><dt>A–D or 1–4</dt><dd>Select an answer</dd><dt>Enter</dt><dd>Final Answer</dd><dt>Space</dt><dd>Play a listening excerpt</dd><dt>L</dt><dd>Focus the lifelines</dd><dt>Escape</dt><dd>Close an open pop-up</dd></dl><p>Choose an answer first, then press Final Answer. Each lifeline can be used once.</p></Dialog>}
    {dialog?.type === "error" && <Dialog title="Game unavailable" onClose={() => setDialog(null)} actions={<button type="button" className="millionaire-primary" onClick={() => setDialog(null)}>Close</button>}><p>{dialog.message}</p></Dialog>}
  </div>;
}

ReactDOM.createRoot(document.getElementById("root")).render(<App />);
window.dispatchEvent(new Event("millionaire-ready"));
