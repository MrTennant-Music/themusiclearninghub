(function () {
  const MLH = window.MLH || (window.MLH = {});
  const e = React.createElement;
  const { useEffect, useLayoutEffect, useRef, useState } = React;

  const MENU_PANEL_CLASS = "hub-menu-panel hub-menu-panel-level";
  const MENU_TITLE_CLASS = "hub-menu-title";
  const TOOLBAR_BUTTON_CLASS = "flex h-11 w-auto items-center justify-center rounded-xl border border-stone-300 bg-white px-2.5 text-sm font-semibold text-stone-800";
  const CUSTOMISE_MENU_PANEL_CLASS = "hub-menu-panel hub-menu-panel-customise";
  const PLAY_BUTTON_CLASS = "flex h-11 w-[112px] items-center justify-center gap-2 rounded-xl border border-stone-950 bg-stone-950 px-3 py-[10px] text-sm font-bold text-white disabled:opacity-50";
  const CLEAR_BUTTON_CLASS = "flex h-11 w-[112px] min-w-0 items-center justify-center rounded-xl border border-stone-300 bg-white px-3 text-sm font-bold text-stone-800 disabled:opacity-40";
  const CONFIRM_BUTTON_CLASS = "hub-confirm-button flex h-11 w-[112px] min-w-0 items-center justify-center rounded-xl border border-black bg-black px-3 py-[10px] text-sm font-bold text-white disabled:opacity-60";
  const AUDIO_CONFIRM_BUTTON_CLASS = "";
  const ACTION_BUTTON_GROUP_CLASS = "grid w-auto grid-cols-[112px_112px] gap-2";
  const PLAY_CLEAR_CONFIRM_ROW_CLASS = "mt-3 flex flex-row items-center justify-between gap-2";
  const TYPED_ANSWER_INPUT_BASE_CLASS = "mlh-typed-answer-input h-12 w-full rounded-xl border bg-white px-4 text-base font-semibold outline-none transition placeholder:font-medium placeholder:text-stone-400 focus:placeholder:text-transparent disabled:opacity-60";
  const WRONG_NOTATION_COLOUR = "#dc2626";
  const WRONG_NOTATION_OPACITY = 0.4;
  const CORRECT_NOTATION_COLOUR = "#16a34a";
  let nextMenuPanelId = 0;

  function useClickAway(ref, handler) {
    useEffect(() => {
      function onClick(event) {
        if (!ref.current || ref.current.contains(event.target)) return;
        handler(event);
      }

      document.addEventListener("click", onClick);
      return () => document.removeEventListener("click", onClick);
    }, [ref, handler]);
  }

  function useClickOutside(refs, handlers) {
    useEffect(() => {
      function onClick(event) {
        if (event.target.closest?.("[data-menu-panel]") || event.target.closest?.("[data-menu-trigger]")) return;
        refs.forEach((ref, index) => {
          if (ref.current && !ref.current.contains(event.target)) handlers[index]?.(event);
        });
      }

      document.addEventListener("click", onClick);
      return () => document.removeEventListener("click", onClick);
    }, [refs, handlers]);
  }

  function MenuPanel({ id, title, children, footer, position = "left-0", variant = "level", dataMenuPanel = false, floating = false, className: extraClass = "" }) {
    const anchorRef = useRef(null);
    const panelRef = useRef(null);
    const generatedIdRef = useRef(null);
    if (!generatedIdRef.current) generatedIdRef.current = `hub-menu-panel-${++nextMenuPanelId}`;
    const panelId = id || generatedIdRef.current;
    const [floatingStyle, setFloatingStyle] = useState(null);
    const [portalHost, setPortalHost] = useState(() => document.fullscreenElement || document.body);
    useLayoutEffect(() => {
      const syncHost = () => setPortalHost(document.fullscreenElement || document.body);
      document.addEventListener("fullscreenchange", syncHost);
      syncHost();
      return () => document.removeEventListener("fullscreenchange", syncHost);
    }, []);
    const isFloating = Boolean((variant === "customise" || floating) && typeof ReactDOM !== "undefined" && ReactDOM.createPortal);
    const panelClassName = `${variant === "customise" ? CUSTOMISE_MENU_PANEL_CLASS : MENU_PANEL_CLASS} ${position} ${isFloating ? "hub-menu-panel-floating" : ""} ${extraClass}`.trim();

    useLayoutEffect(() => {
      if (!isFloating) return undefined;
      function updatePosition(event) {
        // Scrolling menu contents does not move its toolbar anchor.
        if (event?.type === 'scroll' && panelRef.current?.contains(event.target)) return;
        const anchor = anchorRef.current;
        if (!anchor) return;
        const trigger = anchor.parentElement?.querySelector?.("[data-menu-trigger]") || anchor;
        // The wrapper keeps layout bounds while the button press/hover animates.
        const wrapper = trigger.parentElement;
        const target = wrapper?.classList.contains('hub-menu-anchor') ? wrapper : trigger;
        const rect = target.getBoundingClientRect();
        const canvasScale = Number.parseFloat(window.getComputedStyle?.(document.body)?.zoom) || 1;
        const panelWidth = panelRef.current?.offsetWidth || 360;
        const gap = 8;
        const edge = 16;
        const rawLeft = rect.left / canvasScale;
        const left = Math.max(edge, Math.min(rawLeft, 1280 - panelWidth - edge));
        const top = Math.max(edge, rect.bottom / canvasScale + gap);
        setFloatingStyle({ left: `${left}px`, top: `${top}px`, maxHeight: `calc(100dvh - ${top + edge}px)` });
      }

      updatePosition();
      window.addEventListener("resize", updatePosition);
      window.addEventListener("scroll", updatePosition, true);
      return () => {
        window.removeEventListener("resize", updatePosition);
        window.removeEventListener("scroll", updatePosition, true);
      };
    }, [isFloating, portalHost]);

    useLayoutEffect(() => {
      const trigger = isFloating
        ? anchorRef.current?.parentElement?.querySelector?.("[data-menu-trigger]")
        : panelRef.current?.parentElement?.querySelector?.("[data-menu-trigger]");
      if (!trigger) return undefined;
      trigger.setAttribute("aria-haspopup", "true");
      trigger.setAttribute("aria-controls", panelId);
      trigger.setAttribute("aria-expanded", "true");
      return () => {
        if (trigger.getAttribute("aria-controls") === panelId) trigger.setAttribute("aria-expanded", "false");
      };
    }, [isFloating, panelId]);

    const props = { id: panelId, className: panelClassName, role: "region", "aria-label": title || "Menu" };
    if (dataMenuPanel || isFloating) props["data-menu-panel"] = true;
    const panel = e(
      "div",
      {
        ...props,
        ref: panelRef,
        style: isFloating ? floatingStyle || { left: "-9999px", top: "-9999px" } : undefined,
      },
      title != null && e(
        "div",
        { className: MENU_TITLE_CLASS },
        e("div", { className: "hub-menu-title-text" }, title),
      ),
      e("div", { className: "hub-menu-scroll" }, children),
      footer,
    );
    if (!isFloating) return panel;
    return e(React.Fragment, null, e("span", { ref: anchorRef, className: "hub-menu-portal-anchor", "aria-hidden": true }), ReactDOM.createPortal(panel, portalHost));
  }

  function AppToolbar({ left, feedback, right, className = "" }) {
    return e(
      "div",
      { className: `hub-toolbar relative z-20 ${className}`.trim() },
      e("div", { className: "hub-toolbar-left" }, left),
      e("div", { className: "hub-toolbar-feedback" }, feedback),
      e("div", { className: "hub-toolbar-right" }, right),
    );
  }

  function ToolbarButton({ icon, label, mobileLabel = "", onClick, className = "", textClassName = "", iconClassName = "", dataMenuTrigger = false, dataProfileCustomise = false, disabled = false, expanded, ariaControls }) {
    const props = {
      type: "button",
      onClick,
      disabled,
      className: `${TOOLBAR_BUTTON_CLASS} ${className} disabled:cursor-default disabled:opacity-40`.trim(),
    };
    const children = [iconClassName ? e("span", { key: "icon", className: iconClassName }, icon) : icon];
    if (mobileLabel) {
      children.push(e("span", { key: "mobile-label", className: `hidden ${textClassName}`.trim() }, mobileLabel));
    }
    if (label) {
      children.push(e("span", { key: "desktop-label", className: `inline ${textClassName}`.trim() }, label));
    }
    if (dataMenuTrigger) {
      props["data-menu-trigger"] = true;
      props["aria-haspopup"] = true;
    }
    if (typeof expanded === "boolean") props["aria-expanded"] = expanded;
    if (ariaControls) props["aria-controls"] = ariaControls;
    if (dataProfileCustomise) props["data-profile-customise"] = true;
    return e(
      "button",
      props,
      children,
    );
  }

  function LevelButton({ icon, activeLevel, activeLabel, onClick, isCustom = false, dataMenuTrigger = false, expanded, ariaControls, disabled = false }) {
    return e(ToolbarButton, {
      icon,
      label: activeLabel,
      mobileLabel: isCustom ? "" : activeLevel,
      onClick,
      disabled,
      dataMenuTrigger,
      expanded,
      ariaControls,
      className: "gap-1",
      textClassName: isCustom ? "relative -left-[1px]" : "relative -left-[1.5px]",
    });
  }

  function CustomiseButton({ icon, onClick, dataMenuTrigger = false, disabled = false, expanded, ariaControls }) {
    return e(ToolbarButton, {
      icon,
      label: "Customise",
      onClick,
      dataMenuTrigger,
      expanded,
      ariaControls,
      dataProfileCustomise: true,
      disabled,
      className: "gap-2",
    });
  }

  function HelpButton({ icon, onClick, dataMenuTrigger = false }) {
    return e(ToolbarButton, {
      icon,
      label: "Help",
      onClick,
      dataMenuTrigger,
      className: "gap-2",
    });
  }

  function runSkipQuestion({ resetStreak, nextQuestion } = {}) {
    resetStreak?.();
    nextQuestion?.();
  }

  function resetLevelSessionProgress({
    setCorrect,
    setAttempted,
    setStreak,
    setBestStreak,
    setBest,
    setConfettiKey,
    setConfetti,
    setAutoShowMedals,
    setScore,
  } = {}) {
    // Persistent counters restore the selected setup themselves.
    [setCorrect, setAttempted, setStreak, setBestStreak, setBest].forEach(setter => {
      if (!setter?.persistentScoreState) setter?.(0);
    });
    setConfettiKey?.(0);
    setConfetti?.(0);
    setAutoShowMedals?.(false);
    if (!setScore?.persistentScoreState) setScore?.({ correct: 0, attempted: 0, streak: 0, best: 0 });
  }

  function SkipButton({ onClick, icon, resetStreak, disabled = false }) {
    return e(
      "button",
      { type: "button", disabled, onClick: () => runSkipQuestion({ resetStreak, nextQuestion: onClick }), className: `${TOOLBAR_BUTTON_CLASS} shrink-0 disabled:cursor-default disabled:opacity-40` },
      e(
        "span",
        { className: "relative left-[4px] flex w-auto items-center justify-center gap-1" },
        e("span", { className: "inline" }, "Skip"),
        icon,
      ),
    );
  }

  function ConfirmButton({ onClick, disabled = false, children = "Confirm", className = "" }) {
    return e(
      "button",
      {
        type: "button",
        disabled,
        onClick,
        className: `${CONFIRM_BUTTON_CLASS} ${className}`.trim(),
      },
      children,
    );
  }

  function typedAnswerClass(feedback, baseClass = "") {
    const tone = !feedback
      ? "border-stone-300 text-stone-900 focus:border-stone-950"
      : feedback.correct
        ? "border-2 border-green-600 text-green-700 focus:border-green-600"
        : "border-2 border-red-600 text-red-700 focus:border-red-600";
    return `${TYPED_ANSWER_INPUT_BASE_CLASS} ${baseClass} ${tone}`.trim();
  }

  function feedbackNotationStyle(correct, { wrongOpacity = WRONG_NOTATION_OPACITY, correctOpacity = 1 } = {}) {
    return {
      colour: correct ? CORRECT_NOTATION_COLOUR : WRONG_NOTATION_COLOUR,
      color: correct ? CORRECT_NOTATION_COLOUR : WRONG_NOTATION_COLOUR,
      opacity: correct ? correctOpacity : wrongOpacity,
    };
  }

  function feedbackSvgProps(correct, options) {
    const style = feedbackNotationStyle(correct, options);
    return {
      stroke: style.colour,
      fill: style.colour,
      opacity: style.opacity,
    };
  }

  function createFeedbackAdvanceHandler({ feedback, feedbackFading, onCorrect, onIncorrect }) {
    return function onFeedbackPointerDown() {
      if (!feedback || feedbackFading) return false;
      return MLH.advanceFeedbackPointerDown?.({ feedback, onCorrect, onIncorrect }) || false;
    };
  }

  function MenuToggleRow({ glyph, showGlyph = true, label, checked, disabled = false, onChange, labelWidthClass = "min-w-[145px]", profileKey = null, describedBy }) {
    const toggleKey = profileKey ?? (typeof label === "string" ? label : null);
    useEffect(() => {
      if (!toggleKey) return undefined;
      const restored = MLH.profileSettings?.getToggle(toggleKey);
      if (typeof restored !== "boolean" || restored === checked) return;
      // Enable extra choices before disabling defaults so minimum-choice rules
      // cannot block restoration of a valid shared profile.
      const timer = window.setTimeout(() => onChange?.(), restored ? 0 : 70);
      return () => window.clearTimeout(timer);
    }, [toggleKey, checked, onChange]);
    return e(
      "button",
      {
        type: "button",
        disabled,
        onClick: () => {
          if (toggleKey) MLH.profileSettings?.setToggle(toggleKey, !checked);
          onChange?.();
        },
        "aria-pressed": checked,
        "aria-describedby": describedBy,
        ...(toggleKey ? { "data-profile-toggle": toggleKey } : {}),
        className: "hub-toggle-row",
      },
      e(
        "span",
        { className: `hub-toggle-label ${labelWidthClass}` },
        showGlyph && e("span", { className: "hub-toggle-glyph flex items-center justify-center" }, glyph),
        e("span", { className: "leading-none" }, label),
      ),
      e(
        "span",
        { className: `hub-toggle-track ${checked ? "is-on" : ""}` },
        e("span", { className: "hub-toggle-thumb" }),
      ),
    );
  }

  function SelectedLevelOnlyToggle({ level, checked, disabled, onChange }) {
    const descriptionId = React.useId();
    if (level === "N3") return null;
    return e("div", { className: "hub-level-scope-setting" },
      e(MenuToggleRow, {
        label: "Selected Level Only",
        showGlyph: false,
        profileKey: false,
        checked,
        disabled,
        onChange,
        describedBy: descriptionId,
      }),
      e("p", { id: descriptionId, className: "hub-level-scope-description" },
        "Practise only the concepts introduced at this level."),
    );
  }

  function MenuSubheading({ children }) {
    return e(
      "div",
      {
        className: "px-2 pb-1 pt-3 text-[11px] font-black uppercase tracking-[0.12em] text-stone-400 first:pt-0",
      },
      children,
    );
  }

  function LevelMenu({ activeLevel, onSelect, levels, updateUrl = true }) {
    return e(
      "div",
      { className: "flex w-full min-w-0 flex-col gap-2" },
      Object.entries(levels).map(([key, level]) => {
        const active = activeLevel === key;
        const unavailable = Boolean(level.disabled);
        return e(
          "button",
          {
            key,
            type: "button",
            disabled: unavailable,
            "aria-current": active ? "true" : undefined,
            onClick: () => {
              if (unavailable) return;
              if (updateUrl) {
                const url = new URL(window.location.href);
                url.searchParams.set("level", key);
                url.searchParams.delete("profile");
                url.searchParams.delete("settings");
                window.history.replaceState(null, "", url.toString());
                MLH.profileSettings?.clear();
              }
              onSelect(key);
            },
            className: `w-full rounded-xl border px-4 py-2 text-left transition ${unavailable ? "cursor-not-allowed border-stone-200 bg-stone-100 opacity-50" : active ? "border-stone-400 bg-stone-100" : "border-stone-200 bg-stone-50 hover:bg-stone-100"}`,
          },
          e(
            "div",
            { className: "flex min-h-[46px] min-w-0 items-center justify-between gap-3 text-stone-900" },
            e(
              "div",
              { className: "flex min-h-[46px] min-w-[42px] items-center justify-center" },
              e(
                "span",
                { className: "flex h-[46px] w-[46px] shrink-0 items-center justify-center rounded-2xl border border-stone-200 bg-white text-[1.22rem] font-black leading-none tracking-tight text-stone-800 shadow-sm scale-[1.08]" },
                level.icon || key,
              ),
            ),
            e(
              "div",
              { className: "flex min-h-[46px] min-w-0 flex-1 flex-col justify-center pr-2" },
              e("div", { className: "whitespace-normal pb-[1px] text-[13px] font-black leading-[1.2]" }, level.label),
              level.description ? e("div", { className: "mt-[2px] whitespace-normal pb-[2px] text-[11px] leading-[1.25] text-stone-600" }, level.description) : null,
            ),
            active ? e("img", { src: "./ui-icons/tick.svg", alt: "", "aria-hidden": "true", className: "h-[22px] w-[22px] shrink-0 self-center object-contain" }) : null,
          ),
        );
      }),
    );
  }

  MLH.MenuPanelClass = MENU_PANEL_CLASS;
  MLH.MenuTitleClass = MENU_TITLE_CLASS;
  MLH.CustomiseMenuPanelClass = CUSTOMISE_MENU_PANEL_CLASS;
  MLH.ToolbarButtonClass = TOOLBAR_BUTTON_CLASS;
  MLH.PlayButtonClass = PLAY_BUTTON_CLASS;
  MLH.ClearButtonClass = CLEAR_BUTTON_CLASS;
  MLH.ConfirmButtonClass = CONFIRM_BUTTON_CLASS;
  MLH.AudioConfirmButtonClass = AUDIO_CONFIRM_BUTTON_CLASS;
  MLH.ActionButtonGroupClass = ACTION_BUTTON_GROUP_CLASS;
  MLH.PlayClearConfirmRowClass = PLAY_CLEAR_CONFIRM_ROW_CLASS;
  MLH.TypedAnswerInputBaseClass = TYPED_ANSWER_INPUT_BASE_CLASS;
  MLH.useClickAway = useClickAway;
  MLH.useClickOutside = useClickOutside;
  MLH.MenuPanel = MenuPanel;
  MLH.AppToolbar = AppToolbar;
  MLH.ToolbarButton = ToolbarButton;
  MLH.LevelButton = LevelButton;
  MLH.CustomiseButton = CustomiseButton;
  MLH.HelpButton = HelpButton;
  MLH.SkipButton = SkipButton;
  MLH.runSkipQuestion = runSkipQuestion;
  MLH.resetLevelSessionProgress = resetLevelSessionProgress;
  MLH.MenuToggleRow = MenuToggleRow;
  MLH.SelectedLevelOnlyToggle = SelectedLevelOnlyToggle;
  MLH.MenuSubheading = MenuSubheading;
  MLH.LevelMenu = LevelMenu;
  MLH.ConfirmButton = ConfirmButton;
  MLH.typedAnswerClass = typedAnswerClass;
  MLH.feedbackNotationStyle = feedbackNotationStyle;
  MLH.feedbackSvgProps = feedbackSvgProps;
  MLH.createFeedbackAdvanceHandler = createFeedbackAdvanceHandler;
})();
