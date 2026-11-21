(function (root) {
  const React = root.React;
  const K = root.KeyboardNotes;
  function _extends() { return _extends = Object.assign ? Object.assign.bind() : function (n) { for (var e = 1; e < arguments.length; e++) { var t = arguments[e]; for (var r in t) ({}).hasOwnProperty.call(t, r) && (n[r] = t[r]); } return n; }, _extends.apply(null, arguments); }
  function Keyboard({
    question,
    feedback,
    options,
    showC,
    onSelect,
    selected,
    enabled,
    showPendingSelection = false,
    unlabelled = false
  }) {
    const find = question.type === "find";
    const fill = (key, normal) => !find ? key.pitch === question.pitch ? feedback ? feedback.correct ? "#16a34a" : "#dc2626" : "#2563eb" : normal : feedback && key.pitch === question.pitch ? "#16a34a" : feedback && selected === key.pitch ? "#dc2626" : showPendingSelection && selected === key.pitch ? "#2563eb" : normal;
    const props = key => find ? {
      role: "button",
      tabIndex: enabled ? 0 : -1,
      "aria-label": unlabelled ? `Piano key ${key.pitch + 1}` : `${["C", "C sharp", "D", "D sharp", "E", "F", "F sharp", "G", "G sharp", "A", "A sharp", "B"][key.pitch % 12]} ${(question.baseOctave ?? 4) + Math.floor(key.pitch / 12)}`,
      "aria-disabled": !enabled,
      "aria-pressed": selected === key.pitch,
      onClick: event => {
        event.currentTarget.blur();
        if (enabled) onSelect(key);
      },
      onKeyDown: event => {
        if (enabled && (event.key === "Enter" || event.key === " ") && !event.repeat) {
          event.preventDefault();
          onSelect(key);
        }
      }
    } : {};
    const width = options.octaves === 1 ? 336 : options.octaves === 3 ? 1056 : options.includeEndC ? 720 : 672;
    return /*#__PURE__*/React.createElement("svg", {
      className: "keyboard-score",
      width: width,
      viewBox: `-1 -1 ${width + 2} 252`,
      role: find ? "group" : "img",
      "aria-label": find ? "Select the note on the piano keyboard." : "Piano keyboard with one key highlighted. Identify the highlighted note."
    }, K.visibleKeys(options).filter(key => !key.black).map(key => /*#__PURE__*/React.createElement("rect", {
      key: key.pitch,
      className: "keyboard-key",
      x: key.x,
      y: "0",
      width: "48",
      height: "248",
      rx: "5",
      fill: fill(key, "#fff"),
      stroke: "#78716c"
    })), K.visibleKeys(options).filter(key => key.black).map(key => /*#__PURE__*/React.createElement("rect", {
      key: key.pitch,
      className: "keyboard-key",
      x: key.x,
      y: "0",
      width: "30",
      height: "155",
      rx: "5",
      fill: fill(key, "#292524"),
      stroke: "#0c0a09"
    })), find && [...K.visibleKeys(options)].sort((a, b) => a.pitch - b.pitch).map(key => {
      const nextBlack = K.visibleKeys(options).some(item => item.black && item.pitch === key.pitch + 1);
      const previousBlack = K.visibleKeys(options).some(item => item.black && item.pitch === key.pitch - 1);
      const path = key.black ? `M${key.x},0h30v155h-30z` : `M${key.x + (previousBlack ? 15 : 0)},0 H${key.x + (nextBlack ? 33 : 48)} V155 H${key.x + 48} V248 H${key.x} V155 H${key.x + (previousBlack ? 15 : 0)} Z`;
      return /*#__PURE__*/React.createElement("path", _extends({
        key: `hit-${key.pitch}`,
        d: path,
        fill: "transparent",
        className: "keyboard-key"
      }, props(key)));
    }), K.visibleKeys(options).filter(key => !key.black && key.pitch % 12 === 0 && (showC || question.baseOctave != null && question.baseOctave + key.pitch / 12 === 4)).map(key => /*#__PURE__*/React.createElement("text", {
      key: `label-${key.pitch}`,
      x: key.x + 24,
      y: "225",
      textAnchor: "middle",
      fontSize: "17",
      fontWeight: "700",
      fill: fill(key, "#fff") === "#fff" ? "#57534e" : "white",
      pointerEvents: "none"
    }, question.baseOctave != null && question.baseOctave + key.pitch / 12 === 4 ? "C4" : "C")));
  }
  root.MLH.KeyboardNoteKeyboard = Keyboard;
})(window);
