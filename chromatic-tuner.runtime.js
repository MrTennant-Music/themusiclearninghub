const {
  useState,
  useRef,
  useEffect
} = React;
const TUNER = window.ChromaticTuner;
function InstrumentGlyph({
  kind = 'guitar'
}) {
  const extension = kind === 'violin' || kind === 'bass' ? 'jpeg' : 'png';
  return React.createElement("img", {
    className: `tuner-instrument-glyph ${kind !== 'ukulele' ? 'tuner-instrument-glyph-angled' : ''}`,
    src: `./ui-icons/tuner-${kind}.${extension}`,
    alt: "",
    "aria-hidden": "true"
  });
}
function InstrumentHead({
  kind,
  selected,
  completed,
  onSelect
}) {
  const profile = TUNER.INSTRUMENTS[kind],
    strings = profile.strings;
  const positions = kind === 'bass' ? [[35, 213], [35, 162], [35, 111], [35, 60]] : kind === 'guitar' ? [[34, 199], [34, 137], [34, 75], [206, 75], [206, 137], [206, 199]] : kind === 'violin' ? [[34, 183], [34, 120], [206, 90], [206, 153]] : [[34, 186], [34, 105], [206, 105], [206, 186]];
  const shape = kind === 'bass' ? 'M99 257 91 207 91 67Q90 27 126 23L172 12Q196 13 185 47L159 86 151 257Z' : kind === 'violin' ? 'M102 258 94 210V68C79 58 80 29 97 19C110 11 130 11 143 19C160 29 161 58 146 68V210L138 258Z' : kind === 'ukulele' ? 'M100 257 88 215 79 61Q77 28 120 28Q163 28 161 61L152 215 140 257Z' : 'M99 257 83 210 77 50Q78 20 120 34Q161 20 163 50L157 210 141 257Z';
  return React.createElement("aside", {
    className: `tuner-head tuner-head-${kind}`,
    "aria-label": `${profile.label} tuning pegs`
  }, React.createElement("div", {
    className: "tuner-head-drawing"
  }, React.createElement("svg", {
    viewBox: "0 0 240 280",
    width: "220",
    height: "257",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: shape,
    fill: "#f5f5f4",
    stroke: "#292524",
    strokeWidth: "2.5"
  }), kind === 'violin' && React.createElement("path", {
    d: "M139 39C139 25 101 23 101 41C101 57 135 58 135 43C135 32 111 32 111 43C111 49 125 50 125 43",
    fill: "none",
    stroke: "#78716c",
    strokeWidth: "2"
  }), strings.map((midi, i) => {
    const [x, y] = positions[i],
      left = x < 120,
      post = kind === 'violin' ? left ? 104 : 136 : left ? 96 : 144;
    return React.createElement("g", {
      key: i
    }, React.createElement("path", {
      d: `M${x} ${y}H${post}`,
      stroke: "#78716c",
      strokeWidth: "5"
    }), React.createElement("path", {
      d: `M${104 + i * 32 / (strings.length - 1)} 279V249L${post} ${y}`,
      fill: "none",
      stroke: completed.includes(i) ? '#16a34a' : selected === i ? '#292524' : '#a8a29e',
      strokeWidth: 2.1 - i * .15
    }), React.createElement("circle", {
      cx: post,
      cy: y,
      r: "8",
      fill: "white",
      stroke: "#78716c",
      strokeWidth: "2"
    }), React.createElement("circle", {
      cx: post,
      cy: y,
      r: "2",
      fill: "#44403c"
    }));
  }), React.createElement("path", {
    d: "M98 249h44",
    stroke: "#292524",
    strokeWidth: "6"
  })), strings.map((midi, i) => {
    const pitch = TUNER.stringPitch(midi),
      [x, y] = positions[i];
    return React.createElement("button", {
      key: i,
      type: "button",
      className: `tuner-peg ${completed.includes(i) ? 'is-tuned' : ''} ${selected === i ? 'is-selected' : ''}`,
      style: {
        left: `${x / 240 * 100}%`,
        top: `${y / 280 * 100}%`
      },
      "aria-label": `Select ${pitch.name}${pitch.octave}, string ${strings.length - i}${completed.includes(i) ? ', tuned' : ''}`,
      "aria-pressed": selected === i,
      onClick: () => onSelect(i)
    }, React.createElement("span", null, pitch.name));
  })), completed.length === strings.length && React.createElement("div", {
    className: "tuner-complete-animation",
    "aria-hidden": "true"
  }, React.createElement("svg", {
    width: "160",
    height: "160",
    viewBox: "0 0 160 160"
  }, React.createElement("circle", {
    cx: "80",
    cy: "80",
    r: "72",
    fill: "#16a34a"
  }), React.createElement("path", {
    className: "tuner-complete-tick",
    d: "M43 82 68 107 119 55",
    pathLength: "1",
    fill: "none",
    stroke: "white",
    strokeWidth: "11",
    strokeLinecap: "round",
    strokeLinejoin: "round"
  }))), React.createElement("div", {
    className: `tuner-string-prompt ${completed.length === strings.length ? 'is-complete' : selected < 0 || completed.includes(selected) ? 'is-awaiting' : ''}`,
    role: "status"
  }, completed.length === strings.length ? 'Tuning complete' : selected < 0 || completed.includes(selected) ? 'Select a string to tune.' : ''));
}
function InstrumentDial({
  frequency,
  targetMidi,
  hint,
  confirmation
}) {
  const dial = TUNER.instrumentDialState(frequency, targetMidi);
  const colour = dial.colour;
  return React.createElement("div", {
    className: "tuner-dial tuner-instrument-dial",
    "aria-label": "Instrument tuning scale"
  }, React.createElement("div", {
    className: `tuner-pitch-warning ${confirmation ? 'is-confirmed' : ''}`,
    role: "status",
    "aria-live": "polite"
  }, React.createElement("span", null, confirmation || hint)), React.createElement("svg", {
    viewBox: "0 -40 900 330",
    role: "img",
    "aria-label": dial.name ? `${dial.name} target${dial.cents === null ? ', waiting for a note' : `, ${Math.round(dial.cents)} cents from target`}` : 'Select a string to tune'
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "tuner-straight-fade"
  }, React.createElement("stop", {
    offset: "0",
    stopColor: "white",
    stopOpacity: "0"
  }), React.createElement("stop", {
    offset: ".12",
    stopColor: "white"
  }), React.createElement("stop", {
    offset: ".88",
    stopColor: "white"
  }), React.createElement("stop", {
    offset: "1",
    stopColor: "white",
    stopOpacity: "0"
  })), React.createElement("mask", {
    id: "tuner-straight-mask"
  }, React.createElement("rect", {
    x: "60",
    y: "35",
    width: "780",
    height: "80",
    fill: "url(#tuner-straight-fade)"
  }))), React.createElement("g", {
    mask: "url(#tuner-straight-mask)"
  }, Array.from({
    length: 51
  }, (_, i) => React.createElement("line", {
    key: i,
    x1: 90 + i * 14.4,
    x2: 90 + i * 14.4,
    y1: "40",
    y2: "62",
    stroke: i === 25 ? '#78716c' : '#a8a29e',
    strokeWidth: "1.5"
  }))), React.createElement("g", {
    className: "tuner-linear-pointer",
    style: {
      transform: `translateX(${dial.position - 450}px)`
    }
  }, React.createElement("line", {
    x1: "450",
    x2: "450",
    y1: "28",
    y2: "74",
    stroke: colour,
    strokeWidth: "4",
    strokeLinecap: "round"
  })), React.createElement("text", {
    x: "450",
    y: "151",
    textAnchor: "middle",
    fill: colour,
    fontSize: "64",
    fontWeight: "700"
  }, dial.name)));
}
function tunerVoice(context, frequency, start, duration, level) {
  const oscillator = context.createOscillator(),
    gain = context.createGain();
  oscillator.type = 'sine';
  oscillator.frequency.setValueAtTime(frequency, start);
  gain.gain.setValueAtTime(0, start);
  gain.gain.linearRampToValueAtTime(level, start + .025);
  gain.gain.exponentialRampToValueAtTime(.0001, start + duration);
  oscillator.connect(gain);
  gain.connect(context.destination);
  oscillator.start(start);
  oscillator.stop(start + duration + .03);
  oscillator.onended = () => {
    oscillator.disconnect();
    gain.disconnect();
  };
}
function TunerApp() {
  const [phase, setPhase] = useState('ready'),
    [reading, setReading] = useState(null),
    [error, setError] = useState('');
  const [instrumentValue, setInstrumentValue] = window.MLH.useProfileState("instrument", null),
    instrument = Object.hasOwn(TUNER.INSTRUMENTS, instrumentValue) ? instrumentValue : null;
  const [instrumentOpen, setInstrumentOpen] = useState(false),
    [matchedString, setMatchedString] = useState(-1);
  const [selectedString, setSelectedString] = useState(-1),
    [completedStrings, setCompletedStrings] = useState([]);
  const instrumentRef = useRef(instrument),
    menuRef = useRef(null),
    suppressUntil = useRef(0),
    progress = useRef(instrument ? TUNER.createGuidedTuning(TUNER.INSTRUMENTS[instrument].strings) : null);
  const [confirmation, setConfirmation] = useState('');
  const [pitchHint, setPitchHint] = useState('');
  const confirmationTimer = useRef(null);
  window.MLH.useClickOutside([menuRef], [() => setInstrumentOpen(false)]);
  function syncProgress(value) {
    setSelectedString(value.selected);
    setCompletedStrings(value.completed);
  }
  function selectInstrument(id) {
    stop();
    instrumentRef.current = id;
    setInstrumentValue(id);
    setInstrumentOpen(false);
    progress.current = id ? TUNER.createGuidedTuning(TUNER.INSTRUMENTS[id].strings) : null;
    setSelectedString(-1);
    setCompletedStrings([]);
    setError('');
  }
  function selectString(index) {
    setConfirmation('');
    setPitchHint('');
    setMatchedString(-1);
    setReading(null);
    if (progress.current) syncProgress(progress.current.select(index));
    suppressUntil.current = performance.now() + 200;
    return start();
  }
  function resetInstrument() {
    stop();
    if (progress.current) syncProgress(progress.current.reset());
    setError('');
  }
  function checkString(frequency, now) {
    const id = instrumentRef.current;
    if (!id) return;
    let result, label;
    if (id) {
      const selected = progress.current?.snapshot().selected;
      const hint = TUNER.stringPitchHint(frequency, TUNER.INSTRUMENTS[id].strings[selected]);
      if (hint || !frequency) setPitchHint(hint);
      result = progress.current?.observe(frequency, now);
      if (!result) return;
      setMatchedString(result.matched);
      if (result.celebrate) {
        setPitchHint('');
        label = `${TUNER.stringPitch(TUNER.INSTRUMENTS[id].strings[result.matched]).name} string in tune`;
      }
    }
    if (result.celebrate) {
      const context = resources.current.context;
      if (context?.createOscillator) {
        const start = context.currentTime;
        tunerVoice(context, 880, start, .32, .10);
        tunerVoice(context, 1318.51, start + .12, .45, .09);
        suppressUntil.current = now + 850;
      }
      const next = progress.current.advance();
      stop(true);
      syncProgress(next);
      setReading(null);
      setMatchedString(result.matched);
      setConfirmation(label);
      clearTimeout(confirmationTimer.current);
      confirmationTimer.current = setTimeout(() => setConfirmation(''), 2000);
    }
  }
  const [wheel, setWheel] = useState({
    rotation: -1035,
    duration: 0
  });
  const firstReading = useRef(true);
  const resources = useRef({}),
    generation = useRef(0);
  function release(finishChime = false) {
    const state = resources.current;
    resources.current = {};
    if (state.frame) cancelAnimationFrame(state.frame);
    state.stream?.getTracks().forEach(track => {
      track.onended = null;
      track.stop();
    });
    try {
      state.source?.disconnect();
    } catch {}
    if (state.context && state.context.state !== 'closed') {
      const close = () => state.context.close().catch(() => {});
      if (finishChime === true) setTimeout(close, 650);else close();
    }
  }
  function stop(finishChime = false) {
    generation.current++;
    release(finishChime === true);
    progress.current?.resetDetection();
    setMatchedString(-1);
    setPhase('ready');
    setReading(null);
    clearTimeout(confirmationTimer.current);
    confirmationTimer.current = null;
    setConfirmation('');
    setPitchHint('');
  }
  async function start() {
    if (instrumentRef.current && (!progress.current || progress.current.snapshot().selected < 0)) return;
    const token = ++generation.current;
    release();
    progress.current?.resetDetection();
    setMatchedString(-1);
    setError('');
    setConfirmation('');
    setPitchHint('');
    setReading(null);
    firstReading.current = true;
    setPhase('requesting');
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!window.isSecureContext || !navigator.mediaDevices?.getUserMedia || !AC) {
      setError('Microphone tuning needs a supported browser using HTTPS or localhost.');
      setPhase('ready');
      return;
    }
    let stream, context;
    try {
      context = new AC();
      resources.current = {
        context
      };
      await context.resume();
      if (token !== generation.current) return;
      stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        },
        video: false
      });
      if (token !== generation.current) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      const analyser = context.createAnalyser();
      analyser.fftSize = 8192;
      const source = context.createMediaStreamSource(stream);
      source.connect(analyser);
      resources.current = {
        context,
        stream,
        source,
        analyser
      };
      stream.getAudioTracks().forEach(track => {
        track.onended = () => {
          stop();
          setError('The microphone disconnected. Reconnect it and select Start Tuning.');
        };
      });
      setPhase('listening');
      const samples = new Float32Array(analyser.fftSize);
      let lastFrame = -Infinity,
        lastGood = 0,
        history = [];
      const update = now => {
        if (token !== generation.current) return;
        if (now - lastFrame >= 50) {
          lastFrame = now;
          if (now < suppressUntil.current) {
            history = [];
            resources.current.frame = requestAnimationFrame(update);
            return;
          }
          analyser.getFloatTimeDomainData(samples);
          const result = TUNER.detectPitch(samples, context.sampleRate);
          if (result) {
            const previous = history[history.length - 1];
            if (previous && Math.abs(12 * Math.log2(result.frequency / previous)) > .65) history = [];
            history.push(result.frequency);
            if (history.length > 5) history.shift();
            const ordered = [...history].sort((a, b) => a - b);
            const frequency = ordered[Math.floor(ordered.length / 2)];
            setReading(frequency);
            checkString(frequency, now);
            lastGood = now;
          } else {
            checkString(null, now);
            if (now - lastGood > 650) {
              history = [];
              if (instrumentRef.current) setReading(null);
            }
          }
        }
        if (token === generation.current) resources.current.frame = requestAnimationFrame(update);
      };
      resources.current.frame = requestAnimationFrame(update);
    } catch (cause) {
      stream?.getTracks().forEach(track => track.stop());
      if (token !== generation.current) return;
      release();
      setPhase('ready');
      const messages = {
        NotAllowedError: 'Microphone access was denied. Allow the microphone in your browser’s site settings, then try again.',
        NotFoundError: 'No microphone was found. Connect a microphone and try again.',
        NotReadableError: 'The microphone is unavailable. Close any other app using it and try again.'
      };
      setError(messages[cause.name] || 'The microphone could not start. Check its connection and browser permissions, then try again.');
    }
  }
  useEffect(() => {
    const hidden = () => {
      if (document.hidden) {
        stop();
      }
    };
    document.addEventListener('visibilitychange', hidden);
    window.addEventListener('pagehide', stop);
    return () => {
      generation.current++;
      release();
      clearTimeout(confirmationTimer.current);
      document.removeEventListener('visibilitychange', hidden);
      window.removeEventListener('pagehide', stop);
    };
  }, []);
  const note = reading ? TUNER.noteForFrequency(reading) : null;
  useEffect(() => {
    if (!reading) return;
    const immediate = firstReading.current;
    firstReading.current = false;
    setWheel(previous => TUNER.wheelMotion(reading, previous.rotation, immediate));
  }, [reading]);
  const active = phase === 'listening',
    busy = phase === 'requesting';
  const colour = (instrument ? matchedString >= 0 : note?.inTune) ? '#16a34a' : '#111';
  const status = note ? note.inTune ? 'In tune' : note.cents < 0 ? 'Flat — tune up' : 'Sharp — tune down' : busy ? 'Allow microphone access' : active ? 'Listening…' : 'Ready to tune';
  const profile = instrument ? TUNER.INSTRUMENTS[instrument] : null;
  const targetClass = profile && selectedString >= 0 ? profile.strings[selectedString] % 12 : null;
  const completedClasses = new Set(profile ? completedStrings.map(index => profile.strings[index] % 12) : []);
  const notes = TUNER.SHARPS;
  return React.createElement("div", {
    className: window.MLH.shell.pageShellClass
  }, React.createElement(window.MLH.AppHeader, {
    profileState: {
      instrument
    },
    icon: "./app-icons/chromatic-tuner-icon.svg?v=392c2f4921ff",
    title: "Chromatic Tuner",
    subtitle: "Tune your instrument with live pitch feedback.",
    profileUsesSharedSettings: false,
    profileShowLabel: false
  }), React.createElement("div", {
    className: window.MLH.shell.pageContentClass
  }, React.createElement("main", {
    className: `${window.MLH.shell.mainShellClass} tuner-main`
  }, React.createElement("div", {
    className: "tuner-instrument-toolbar"
  }, React.createElement("div", {
    className: "hub-menu-anchor relative",
    ref: menuRef
  }, React.createElement("button", {
    type: "button",
    className: `${window.MLH.ToolbarButtonClass} gap-2`,
    "data-menu-trigger": true,
    "aria-haspopup": "menu",
    "aria-expanded": instrumentOpen,
    onClick: () => setInstrumentOpen(value => !value)
  }, instrument ? React.createElement(InstrumentGlyph, {
    kind: instrument
  }) : React.createElement("span", {
    className: "tuner-button-symbol tuner-menu-symbol",
    "aria-hidden": "true"
  }), React.createElement("span", null, profile?.label || 'Chromatic')), instrumentOpen && React.createElement(window.MLH.MenuPanel, {
    title: "Instrument",
    position: "left-0",
    className: "tuner-instrument-menu",
    dataMenuPanel: true
  }, React.createElement("div", {
    role: "menu",
    "aria-label": "Instrument"
  }, React.createElement("button", {
    type: "button",
    role: "menuitemradio",
    "aria-checked": !instrument,
    className: "tuner-instrument-option",
    onClick: () => selectInstrument(null)
  }, React.createElement("span", {
    className: "tuner-button-symbol tuner-menu-symbol",
    "aria-hidden": "true"
  }), React.createElement("span", null, "Chromatic"), !instrument && React.createElement("img", {
    src: "./ui-icons/tick.svg",
    width: "18",
    height: "18",
    alt: "Selected"
  })), Object.entries(TUNER.INSTRUMENTS).map(([id, value]) => React.createElement("button", {
    type: "button",
    role: "menuitemradio",
    "aria-checked": instrument === id,
    key: id,
    className: "tuner-instrument-option",
    onClick: () => selectInstrument(id)
  }, React.createElement(InstrumentGlyph, {
    kind: id
  }), React.createElement("span", null, value.label), instrument === id && React.createElement("img", {
    src: "./ui-icons/tick.svg",
    width: "18",
    height: "18",
    alt: "Selected"
  }))))))), React.createElement("section", {
    className: "tuner-stage",
    "aria-label": "Chromatic tuner"
  }, profile ? React.createElement(InstrumentDial, {
    frequency: reading,
    targetMidi: selectedString >= 0 ? profile.strings[selectedString] : null,
    hint: pitchHint,
    confirmation: confirmation
  }) : React.createElement("div", {
    className: "tuner-dial",
    "aria-label": "Rotating chromatic note wheel"
  }, React.createElement("svg", {
    viewBox: "0 -40 900 330",
    role: "img",
    "aria-label": note ? `${note.name}${note.octave}, ${Math.round(note.cents)} cents` : 'Chromatic wheel, waiting for a note'
  }, React.createElement("defs", null, React.createElement("linearGradient", {
    id: "tuner-wheel-fade"
  }, React.createElement("stop", {
    offset: "0",
    stopColor: "white",
    stopOpacity: "0"
  }), React.createElement("stop", {
    offset: ".18",
    stopColor: "white"
  }), React.createElement("stop", {
    offset: ".82",
    stopColor: "white"
  }), React.createElement("stop", {
    offset: "1",
    stopColor: "white",
    stopOpacity: "0"
  })), React.createElement("mask", {
    id: "tuner-wheel-mask"
  }, React.createElement("rect", {
    width: "900",
    height: "290",
    fill: "url(#tuner-wheel-fade)"
  }))), React.createElement("g", {
    mask: "url(#tuner-wheel-mask)"
  }, React.createElement("g", {
    className: "tuner-wheel-rotor",
    style: {
      transform: `rotate(${wheel.rotation}deg)`,
      transition: `transform ${wheel.duration}ms ease`
    }
  }, Array.from({
    length: 240
  }, (_, i) => React.createElement("line", {
    key: `tick-${i}`,
    x1: "450",
    y1: "40",
    x2: "450",
    y2: i % 10 === 0 ? 78 : 62,
    transform: `rotate(${i * 1.5} 450 780)`,
    stroke: i % 10 === 0 && targetClass === i / 10 % 12 ? '#292524' : i % 10 === 0 && completedClasses.has(i / 10 % 12) ? '#15803d' : '#a8a29e',
    strokeWidth: i % 10 === 0 ? 4 : 1.2
  })), Array.from({
    length: 24
  }, (_, i) => React.createElement("text", {
    key: `note-${i}`,
    x: "450",
    y: "151",
    textAnchor: "middle",
    transform: `rotate(${i * 15} 450 780)`,
    fill: targetClass === i % 12 ? '#111' : completedClasses.has(i % 12) ? '#15803d' : profile ? '#a8a29e' : '#111',
    fontSize: "64",
    fontWeight: "700"
  }, notes[i % 12])))), React.createElement("path", {
    className: "tuner-wheel-pointer",
    d: "M412 -32 H488 L450 6 Z",
    fill: colour,
    stroke: colour,
    strokeWidth: "5",
    strokeLinejoin: "round"
  }))), React.createElement("div", {
    className: `tuner-centre ${active ? 'is-listening' : ''} ${profile ? 'has-instrument' : ''}`
  }, profile && React.createElement(InstrumentHead, {
    kind: instrument,
    selected: selectedString,
    completed: completedStrings,
    onSelect: selectString
  }), !profile && React.createElement("div", {
    className: `tuner-readout ${active ? 'is-visible' : ''}`,
    "aria-live": "off",
    "aria-hidden": !active
  }, React.createElement("div", {
    className: "tuner-note",
    style: {
      color: colour
    },
    "aria-label": note ? `${note.name}${note.octave}` : 'No note detected'
  }, note?.name || '–', note && React.createElement("sub", null, note.octave), active && matchedString >= 0 && React.createElement("span", {
    className: "tuner-success",
    role: "status",
    "aria-label": "String in tune"
  }, React.createElement("svg", {
    viewBox: "0 0 24 24",
    width: "30",
    height: "30",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "3",
    "aria-hidden": "true"
  }, React.createElement("path", {
    d: "m5 12 4 4L20 5"
  })))), React.createElement("div", {
    className: "tuner-frequency"
  }, note ? note.frequency.toFixed(1) : '–', " ", React.createElement("span", null, "Hz"))), !profile && React.createElement("button", {
    type: "button",
    className: "tuner-start",
    "aria-label": active ? 'Stop' : 'Start',
    disabled: busy,
    "aria-busy": busy,
    onClick: active ? stop : start
  }, React.createElement("span", null, active ? 'Stop' : 'Start')), profile && React.createElement("div", {
    className: "tuner-instrument-actions"
  }, (active || busy) && React.createElement("button", {
    type: "button",
    className: "tuner-instrument-action is-stop",
    onClick: () => stop()
  }, busy ? 'Cancel' : 'Stop'), React.createElement("button", {
    type: "button",
    className: "tuner-instrument-action",
    disabled: !active && !busy && selectedString < 0 && completedStrings.length === 0,
    onClick: resetInstrument
  }, "Reset")), React.createElement("div", {
    className: `tuner-microphone ${active ? 'is-visible' : ''}`,
    role: "status",
    "aria-hidden": !active
  }, React.createElement("svg", {
    width: "14",
    height: "16",
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: "2",
    strokeLinecap: "round",
    "aria-hidden": "true"
  }, React.createElement("rect", {
    x: "9",
    y: "2",
    width: "6",
    height: "12",
    rx: "3"
  }), React.createElement("path", {
    d: "M5 10v2a7 7 0 0 0 14 0v-2M12 19v3m-4 0h8"
  })), React.createElement("span", null, "Listening...")), React.createElement("span", {
    className: "sr-only",
    role: "status"
  }, status)), error && React.createElement("p", {
    className: "tuner-error",
    role: "alert"
  }, error)))));
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(TunerApp, null));
