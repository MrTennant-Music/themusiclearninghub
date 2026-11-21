(function (root) {
  function request(kind) {
    if (root.parent === root) return null;
    const params = new URLSearchParams(root.location.search);
    if (params.get("embed") !== "escape") return null;
    const token = params.get("token");
    const bridge = root.parent.EscapePracticeBridge;
    const clue = bridge?.clue(token);
    if (clue?.kind !== kind) return null;
    return { bridge, clue, token, level: params.get("level") };
  }

  function useQuestion(activity, generate) {
    const [question] = root.React.useState(() => {
      const saved = activity.bridge.readActivity(activity.token);
      if (saved) return saved;
      const generated = generate(activity);
      activity.bridge.saveActivity(activity.token, generated);
      return generated;
    });
    return question;
  }

  // Keep task-defining instructions; obvious identification clues need no question.
  function simplifyPrompt(content, kind) {
    const prompt = content.querySelector(".escape-literacy-content-title");
    if (!prompt) return;
    if (["interval", "keyboardNote", "keyboardSingle", "noteNames", "noteValue", "dynamics", "repeats", "rest", "time", "rhythmSum", "rhythmDictation"].includes(kind)) {
      prompt.hidden = true;
    } else if (["triplets"].includes(kind)) {
      prompt.textContent = "Crotchet beats";
    }
  }

  function useContentHeight(activity) {
    const ref = root.React.useRef(null);
    root.React.useLayoutEffect(() => {
      if (!activity) return undefined;
      const content = ref.current;
      simplifyPrompt(content, activity.clue.kind);
      let lastHeight = 0;
      document.documentElement.classList.add("escape-literacy-activity");
      document.documentElement.classList.toggle("escape-literacy-fixed", activity.clue.kind !== "earTraining");
      const sync = () => {
        const height = Math.ceil(content.getBoundingClientRect().height);
        if (height === lastHeight) return;
        lastHeight = height;
        root.parent.postMessage({ type: "escape-practice", event: "height", token: activity.token, height }, root.location.origin);
      };
      const observer = new ResizeObserver(sync);
      observer.observe(content);
      root.addEventListener("resize", sync);
      sync();
      return () => {
        observer.disconnect();
        root.removeEventListener("resize", sync);
        document.documentElement.classList.remove("escape-literacy-activity", "escape-literacy-fixed");
      };
    }, [activity?.token]);
    return ref;
  }

  function codeOrder(choices, correct, digit) {
    const ordered = choices.filter(choice => choice !== correct);
    ordered.splice(digit - 1, 0, correct);
    return ordered;
  }

  function useDigitSelection(activity) {
    const { bridge, token } = activity ?? {};
    const [selected, setSelected] = root.React.useState(() => bridge?.readDigit?.(token) ?? null);
    function select(digit) {
      bridge?.saveDigit?.(token, digit);
      setSelected(digit);
    }
    return [selected, select];
  }

  function NumberedOptions({ activity, choices, columns, digits }) {
    const e = root.React.createElement;
    const [selected, select] = useDigitSelection(activity);
    return e("div", { className: `escape-literacy-digit-options${columns === 2 || choices.length >= 3 ? " is-two-column" : ""}` },
      choices.map((choice, index) => {
        const digit = digits?.[index] ?? index + 1;
        return e("button", {
          type: "button", key: index, "aria-pressed": selected === digit,
          className: "escape-literacy-numbered-option",
          onClick: () => select(digit)
        }, e("strong", null, digit), choice);
      }));
  }

  function numberedChoices(correct, distractors, digit, count = 4) {
    return codeOrder([...new Set(distractors)].filter(choice => choice !== correct).slice(0, count - 1), correct, digit);
  }

  function AudioHeader({ activity, prompt, playing, onPlay }) {
    const e = root.React.createElement;
    const slot = activity?.bridge.playbackSlot?.(activity.token);
    const button = e("button", {
      type: "button",
      className: `${root.MLH.PlayButtonClass}${slot ? " escape-clue-play" : ""}`,
      onClick: onPlay
    }, e("span", { className: `hub-playback-glyph ${playing ? "is-stop" : "is-play"}`, "aria-hidden": true }),
      e("span", null, playing ? "Stop" : "Play"));
    if (!slot) return e("div", { className: "escape-literacy-audio-header" }, e("p", null, prompt), button);
    return e(root.React.Fragment, null,
      root.ReactDOM.createPortal(button, slot),
      e("p", { className: "escape-literacy-content-title" }, prompt));
  }

  function useStopAudio(activity, stop) {
    const stopRef = root.React.useRef(stop);
    stopRef.current = stop;
    root.React.useEffect(() => {
      if (!activity) return undefined;
      const receive = event => {
        if (event.origin === root.location.origin && event.source === root.parent && event.data?.type === "escape-practice-stop") stopRef.current();
      };
      root.addEventListener("message", receive);
      return () => root.removeEventListener("message", receive);
    }, [activity]);
  }

  root.MLH.EscapeLiteracyActivity = { request, useQuestion, useContentHeight, useStopAudio, useDigitSelection, codeOrder, NumberedOptions, numberedChoices, AudioHeader };
})(window);
