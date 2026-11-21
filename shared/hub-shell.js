(function () {
  const MLH = window.MLH || {};
  const qrIconUrl = new URL("../ui-icons/qr-code-svgrepo-com.svg?v=20261106-roundest", document.currentScript.src).href;
  function decodeBase64Url(value) {
    const base64 = value.replace(/-/g, "+").replace(/_/g, "/");
    const padded = base64.padEnd(Math.ceil(base64.length / 4) * 4, "=");
    const bytes = Uint8Array.from(window.atob(padded), character => character.charCodeAt(0));
    return new TextDecoder().decode(bytes);
  }

  function encodeBase64Url(value) {
    const bytes = new TextEncoder().encode(value);
    let binary = "";
    bytes.forEach(byte => { binary += String.fromCharCode(byte); });
    return window.btoa(binary).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/g, "");
  }

  function decodeSharedSettings() {
    const encoded = new URLSearchParams(window.location.search).get("settings");
    if (!encoded) return { toggles: {}, fields: {}, buttons: {} };
    try {
      const json = decodeBase64Url(encoded);
      const parsed = JSON.parse(json);
      if (parsed?.version === 2 && (MLH.pageIdentity || (name => name))(parsed.activity) === (MLH.pageIdentity || (name => name))(window.location.pathname.split("/").pop()) && parsed.state && typeof parsed.state === "object" && !Array.isArray(parsed.state)) {
        return { version: 2, state: parsed.state, toggles: {}, fields: {}, buttons: {} };
      }
      return {
        toggles: parsed?.version === 1 && parsed.toggles && typeof parsed.toggles === "object" ? parsed.toggles : {},
        fields: parsed?.version === 1 && parsed.fields && typeof parsed.fields === "object" ? parsed.fields : {},
        buttons: parsed?.version === 1 && parsed.buttons && typeof parsed.buttons === "object" ? parsed.buttons : {},
      };
    } catch {
      return { toggles: {}, fields: {}, buttons: {} };
    }
  }

  const initialSharedSettings = decodeSharedSettings();
  // Explicit setup snapshots restore before the first question is generated.
  // Scores, answers and running sessions are deliberately not part of a setup.
  function validProfileValue(value, fallback) {
    if (fallback === null) return value === null || ["string", "number", "boolean"].includes(typeof value);
    if (Array.isArray(fallback)) return Array.isArray(value) && value.length <= 1000 && value.every(item => fallback.length === 0 || validProfileValue(item, fallback[0]));
    if (fallback && typeof fallback === "object") return value && typeof value === "object" && !Array.isArray(value) && Object.entries(fallback).every(([key, item]) => Object.hasOwn(value, key) && validProfileValue(value[key], item));
    return typeof value === typeof fallback && (typeof value !== "number" || Number.isFinite(value));
  }
  MLH.profileInitial = function profileInitial(key, initial) {
    const fallback = typeof initial === "function" ? initial() : initial;
    const value = initialSharedSettings.state?.[key];
    return initialSharedSettings.version === 2 && Object.hasOwn(initialSharedSettings.state, key) && validProfileValue(value, fallback) ? value : fallback;
  };
  MLH.useProfileState = function useProfileState(key, initial) {
    return React.useState(() => MLH.profileInitial(key, initial));
  };
  MLH.profileShareUrl = function profileShareUrl(state, href = window.location.href) {
    const url = new URL(href);
    const level = state.activeLevel ?? state.level ?? state.settings?.level ?? state.options?.level;
    if (["N3", "N4", "N5", "H", "AH"].includes(level)) url.searchParams.set("level", level);
    url.searchParams.delete("profile");
    url.searchParams.set("settings", encodeBase64Url(JSON.stringify({ version: 2, activity: url.pathname.split("/").pop(), state })));
    return url.toString();
  };
  const sharedSettings = {
    toggles: { ...initialSharedSettings.toggles },
    fields: { ...initialSharedSettings.fields },
    buttons: { ...initialSharedSettings.buttons },
    restoring: Boolean(Object.keys(initialSharedSettings.toggles).length || Object.keys(initialSharedSettings.fields).length || Object.keys(initialSharedSettings.buttons).length),
  };

  function notifySharedSettingsChanged() {
    window.dispatchEvent(new CustomEvent("mlh-profile-settings-change"));
  }

  MLH.profileSettings = {
    getToggle(label) { return sharedSettings.toggles[label]; },
    setToggle(label, value) {
      if (sharedSettings.restoring) return;
      sharedSettings.toggles[label] = Boolean(value);
      notifySharedSettingsChanged();
    },
    hasCustomSettings() {
      return Boolean(Object.keys(sharedSettings.toggles).length || Object.keys(sharedSettings.fields).length || Object.keys(sharedSettings.buttons).length);
    },
    clear() {
      sharedSettings.toggles = {};
      sharedSettings.fields = {};
      sharedSettings.buttons = {};
      sharedSettings.restoring = false;
      notifySharedSettingsChanged();
    },
    encoded() {
      const json = JSON.stringify({ version: 1, toggles: sharedSettings.toggles, fields: sharedSettings.fields, buttons: sharedSettings.buttons });
      return encodeBase64Url(json);
    },
  };

  function profileFieldKey(element) {
    const panel = element.closest("[data-menu-panel]");
    if (!panel) return null;
    const fields = Array.from(panel.querySelectorAll("select,input[type='range'],input[type='number'],input[type='checkbox']"));
    const index = fields.indexOf(element);
    return index < 0 ? null : `${element.tagName.toLowerCase()}:${element.type || "select"}:${index}`;
  }

  document.addEventListener("change", (event) => {
    const element = event.target;
    if (sharedSettings.restoring || !(element instanceof HTMLInputElement || element instanceof HTMLSelectElement)) return;
    const key = profileFieldKey(element);
    if (!key) return;
    sharedSettings.fields[key] = element.type === "checkbox" ? element.checked : element.value;
    notifySharedSettingsChanged();
  });

  document.addEventListener("click", (event) => {
    if (sharedSettings.restoring) return;
    const button = event.target.closest?.("[data-menu-panel] .hub-toggle-row button:not([data-profile-toggle])");
    if (!button) return;
    const row = button.closest(".hub-toggle-row");
    const label = row?.querySelector(".hub-toggle-label")?.textContent?.trim();
    if (!label) return;
    window.setTimeout(() => {
      sharedSettings.buttons[label] = button.textContent.trim();
      notifySharedSettingsChanged();
    }, 0);
  });

  MLH.shell = {
    scoreTileClass: "relative h-[58px] rounded-xl border border-stone-200 bg-stone-50 shadow-sm outline-none transition active:scale-[0.98] sm:h-[64px]",
    scoreTileActiveClass: "-translate-y-0.5 scale-[1.01] brightness-105 shadow-lg",
    toolbarButtonClass: "flex h-10 w-[58px] items-center justify-center rounded-xl border border-stone-300 bg-white text-sm font-semibold text-stone-800 sm:h-11 sm:w-auto sm:px-2.5",
    menuPanelClass: "absolute top-full z-[120] mt-2 inline-block w-[360px] max-w-[360px] rounded-2xl border border-stone-200 bg-white p-3 shadow-lg sm:w-fit sm:max-w-none",
    menuTitleClass: "relative -top-[4px] mb-1.5 flex h-[28px] items-center justify-center whitespace-nowrap px-8",
    pageShellClass: "overflow-x-hidden bg-stone-50 pb-10 text-black md:pb-12",
    pageContentClass: "mx-auto max-w-6xl px-3 pt-[154px] sm:px-4 sm:pt-[154px] md:px-8 md:pt-[104px]",
    mainShellClass: "relative z-0 min-h-[520px] overflow-visible rounded-2xl border border-stone-200 bg-white px-3 pb-0 pt-[10px] shadow-sm sm:min-h-[390px] sm:px-4 md:h-auto md:min-h-0 md:overflow-visible md:px-6 md:pb-6 md:pt-[14px]",
    footerShellClass: "bg-stone-50",
    questionCardMobileClass: "",
    confirmButtonClass: "hub-confirm-button rounded-xl border border-black bg-black px-[22px] py-[10px] text-sm font-bold text-white disabled:opacity-60",
    mobileConfirmButtonClass: "hub-confirm-button rounded-xl border border-black bg-black px-[22px] py-[10px] text-sm font-bold text-white disabled:opacity-60",
  };

  function useClickAway(ref, handler) {
    React.useEffect(() => {
      const onPointerDown = (event) => {
        if (!ref.current?.contains(event.target)) handler();
      };
      document.addEventListener("pointerdown", onPointerDown, true);
      return () => document.removeEventListener("pointerdown", onPointerDown, true);
    }, [ref, handler]);
  }

  function advanceFeedbackPointerDown({ feedback, onCorrect, onIncorrect }) {
    if (!feedback) return false;
    if (feedback.correct) {
      onCorrect?.();
      return true;
    }
    onIncorrect?.();
    return true;
  }

  function ProfileQrButton({ onClick, disabled = false, icon }) {
    return React.createElement("button", {
      type: "button",
      onClick,
      disabled,
      className: `inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-sm transition ${disabled ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 opacity-70" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500 hover:bg-stone-50"}`,
      "aria-label": "Share this profile by QR code",
      title: "Share",
    }, React.createElement("img", { src: icon || qrIconUrl, alt: "", "aria-hidden": "true", className: "h-4 w-4 object-contain", style: disabled ? { opacity: 0.5 } : undefined }));
  }

  function WorksheetButton({ onClick, enabled, selected = false, returnLabel = "activity" }) {
    return React.createElement("button", {
      type: "button",
      onClick,
      disabled: !enabled,
      className: `inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-sm transition ${selected ? "cursor-pointer border-black bg-black text-white hover:bg-stone-800" : enabled ? "border-stone-300 bg-white text-stone-700 hover:border-stone-500 hover:bg-stone-50" : "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 opacity-70"}`,
      "aria-label": selected ? `Return to ${returnLabel} activity` : "Create worksheet from current settings",
      "aria-pressed": selected,
      title: selected ? `Return to ${returnLabel}` : "Generate Worksheet",
    }, React.createElement("img", { src: "ui-icons/worksheet.svg?v=20261103-worksheet-svg-2", alt: "", "aria-hidden": "true", className: "h-4 w-4 object-contain", style: selected ? { filter: "invert(1)" } : !enabled ? { filter: "grayscale(1)", opacity: 0.5 } : undefined }));
  }

  function ProfileQrOverlay({ title, subtitle, shareUrl, onClose }) {
    const [copied, setCopied] = React.useState(false);
    const [copyFailed, setCopyFailed] = React.useState(false);
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=560x560&data=${encodeURIComponent(shareUrl)}`;
    async function copyLink() {
      let success=false;
      let clipboardTimeout;
      try {
        await Promise.race([navigator.clipboard.writeText(shareUrl),new Promise((_,reject)=>{clipboardTimeout=window.setTimeout(()=>reject(new Error('Clipboard unavailable')),500);})]);
        success=true;
      }
      catch {
        const field=document.createElement('textarea'),focused=document.activeElement;
        field.value=shareUrl;field.setAttribute('readonly','');field.style.position='fixed';field.style.opacity='0';
        document.body.appendChild(field);field.select();
        try { success=document.execCommand('copy'); } catch {}
        field.remove();focused?.focus();
      }
      window.clearTimeout?.(clipboardTimeout);
      setCopied(success);setCopyFailed(!success);
      if(success)window.setTimeout(()=>setCopied(false),1800);
    }
    return React.createElement("div", {
      className: "fixed inset-0 z-[1100] flex items-center justify-center bg-slate-950/70 p-6 backdrop-blur-sm",
      role: "dialog",
      "aria-modal": "true",
      "aria-label": "Share QR code",
      onPointerDown: (event) => { if (event.target === event.currentTarget) onClose(); },
    }, React.createElement("div", { className: "relative w-full max-w-2xl rounded-3xl bg-white p-10 text-center shadow-2xl" },
      React.createElement("button", { type: "button", onClick: onClose, className: "absolute right-4 top-4 inline-flex h-10 w-10 items-center justify-center rounded-full bg-stone-100 text-xl font-bold text-stone-700", "aria-label": "Close QR code" }, "×"),
      React.createElement("h2", { className: "text-3xl font-semibold text-stone-900" }, title),
      subtitle && React.createElement("p", { className: "mt-2 text-lg text-stone-600" }, subtitle),
      React.createElement("img", { className: "mx-auto mt-6 w-[min(560px,100%)] rounded-2xl border border-stone-200", src: qrUrl, alt: `QR code linking to ${title} ${subtitle}` }),
      copyFailed && React.createElement("div", { className:"mt-3" },
        React.createElement("p", { role:"status", className:"text-sm text-stone-700" }, "Select and copy this link:"),
        React.createElement("input", { "aria-label":"Share link", readOnly:true, value:shareUrl, onFocus:event=>event.target.select(), className:"mt-2 w-full rounded-xl border border-stone-300 px-3 py-2 text-sm" })),
      React.createElement("button", { type: "button", onClick: copyLink, className: "mt-5 rounded-xl bg-blue-600 px-5 py-3 text-sm font-bold text-white shadow-md transition hover:bg-blue-700" }, copied ? "Copied" : "Copy Link")
    ));
  }

  function defaultProfileShareUrl() {
    return new URL(window.location.pathname + window.location.search, window.location.href).toString();
  }

  function defaultProfileLabel() {
    const level = new URLSearchParams(window.location.search).get("level");
    return ({ N3: "National 3", N4: "National 4", N5: "National 5", H: "Higher", AH: "Advanced Higher" })[level] || "Custom";
  }

  function AppHeader({ icon, title, subtitle, children, profileTitle, profileLabel, profileShareUrl, profileState, profileUsesSharedSettings = true, profileShowLabel = true, profileShowQr = true, profileShareDisabled = false, profileQrIcon, worksheetConfig, worksheetMode = false, classroomPilotUrl, classroomPilotMode = false, classroomPilotDisabled = false, classroomPilotConfig }) {
    const [qrOpen, setQrOpen] = React.useState(false);
    const [worksheetOpening, setWorksheetOpening] = React.useState(false);
    const [, setProfileRevision] = React.useState(0);
    const worksheetHeader = MLH.worksheetHeaderMode;
    const activeWorksheetMode = worksheetMode || Boolean(worksheetHeader);
    const displayedTitle = activeWorksheetMode && worksheetHeader?.title ? worksheetHeader.title : title;
    const displayedSubtitle = activeWorksheetMode && worksheetHeader?.subtitle ? worksheetHeader.subtitle : subtitle;
    const displayedIcon = activeWorksheetMode && worksheetHeader?.icon ? worksheetHeader.icon : icon;
    const activityTitle = profileTitle || (typeof displayedTitle === "string" ? displayedTitle : "Activity");
    const hasSharedSettings = !profileState && profileUsesSharedSettings && MLH.profileSettings.hasCustomSettings();
    const shareLabel = profileShowLabel ? (hasSharedSettings ? "Custom" : (profileLabel || defaultProfileLabel())) : "";
    const shareUrlObject = new URL(profileShareUrl || defaultProfileShareUrl());
    if (hasSharedSettings) shareUrlObject.searchParams.set("settings", MLH.profileSettings.encoded());
    else shareUrlObject.searchParams.delete("settings");
    const profileUrl = profileState ? MLH.profileShareUrl(profileState, shareUrlObject.toString()) : shareUrlObject.toString();
    const shareUrl = window.HubCollections?.shareUrl?.(profileUrl) || profileUrl;
    const worksheetEnabled = activeWorksheetMode || typeof worksheetConfig === "function";
    const displayedChildren = activeWorksheetMode ? null : children;
    const displayedClassroomUrl = classroomPilotUrl || worksheetHeader?.classroomPilotUrl;
    async function createWorksheet() {
      if (!worksheetEnabled || worksheetOpening) return;
      setWorksheetOpening(true);
      try {
        const config = await worksheetConfig();
        if (!config || config.version !== 1 || typeof config.activityId !== "string" || !config.settings || typeof config.settings !== "object") return;
        const exerciseUrlObject = new URL(shareUrl);
        if (typeof config.settings.level === "string") exerciseUrlObject.searchParams.set("level", config.settings.level);
        const worksheetSourceConfig = { ...config, exerciseUrl: exerciseUrlObject.toString(), subtitle: typeof subtitle === "string" ? subtitle : (config.subtitle || "") };
        worksheetSourceConfig.pageTitle = document.title;
        const serializedWorksheetConfig = JSON.stringify(worksheetSourceConfig);
        window.sessionStorage.setItem("worksheetSourceConfig", serializedWorksheetConfig);
        if (config.activityId === "intervals") window.sessionStorage.setItem("worksheetReturnConfig", serializedWorksheetConfig);
        else window.sessionStorage.removeItem("worksheetReturnConfig");
        window.sessionStorage.setItem("worksheetReturnUrl", window.location.href);
        window.location.href = "worksheetgenerator.html";
      } catch (error) {
        console.error("The worksheet could not be prepared.", error);
        window.alert("The worksheet could not be prepared. Please try again.");
      } finally {
        setWorksheetOpening(false);
      }
    }
    React.useEffect(() => {
      const refresh = () => setProfileRevision((value) => value + 1);
      window.addEventListener("mlh-profile-settings-change", refresh);
      return () => window.removeEventListener("mlh-profile-settings-change", refresh);
    }, []);
    React.useEffect(() => {
      if (!sharedSettings.restoring) return undefined;
      let closeTimer;
      const openTimer = window.setTimeout(() => {
        const customiseButton = document.querySelector("button[data-profile-customise]");
        if (!customiseButton) return;
        customiseButton.click();
        window.setTimeout(() => {
          const panel = document.querySelector("[data-menu-panel]");
          if (panel) {
            const fields = Array.from(panel.querySelectorAll("select,input[type='range'],input[type='number'],input[type='checkbox']"));
            fields.forEach((field, index) => {
              const key = `${field.tagName.toLowerCase()}:${field.type || "select"}:${index}`;
              if (!(key in sharedSettings.fields)) return;
              if (field.type === "checkbox") field.checked = Boolean(sharedSettings.fields[key]);
              else field.value = sharedSettings.fields[key];
              field.dispatchEvent(new Event("change", { bubbles: true }));
            });
          }
          const cycleButtons = Array.from(panel?.querySelectorAll(".hub-toggle-row button:not([data-profile-toggle])") || []);
          const restoreNextButton = (index = 0, attempts = 0) => {
            if (index >= cycleButtons.length) {
              sharedSettings.restoring = false;
              notifySharedSettingsChanged();
              closeTimer = window.setTimeout(() => customiseButton.click(), 80);
              return;
            }
            const button = cycleButtons[index];
            const label = button.closest(".hub-toggle-row")?.querySelector(".hub-toggle-label")?.textContent?.trim();
            const wanted = label ? sharedSettings.buttons[label] : null;
            if (!wanted || button.textContent.trim() === wanted || attempts >= 8) {
              restoreNextButton(index + 1, 0);
              return;
            }
            button.click();
            window.setTimeout(() => restoreNextButton(index, attempts + 1), 30);
          };
          restoreNextButton();
        }, 180);
      }, 120);
      return () => { window.clearTimeout(openTimer); window.clearTimeout(closeTimer); };
    }, []);
    React.useEffect(() => {
      if (!qrOpen) return undefined;
      const closeOnEscape = (event) => { if (event.key === "Escape") setQrOpen(false); };
      window.addEventListener("keydown", closeOnEscape);
      return () => window.removeEventListener("keydown", closeOnEscape);
    }, [qrOpen]);
    return (
      React.createElement(React.Fragment, null,
        React.createElement("header", { className: "fixed left-0 right-0 top-0 z-[1000] w-full overflow-visible border-b border-stone-200 bg-white/95 py-2 shadow-sm backdrop-blur sm:py-3" },
          React.createElement("div", { className: "mx-auto flex w-full max-w-6xl flex-col gap-3 overflow-visible px-3 sm:px-4 md:flex-row md:items-center md:justify-between md:px-8", style: { minHeight: "64px" } },
            React.createElement("div", { className: "flex items-center gap-3 sm:gap-4" },
              React.createElement("div", {
                className: "flex h-14 w-14 items-center justify-center overflow-hidden rounded-2xl border border-stone-200 bg-stone-50 p-0 text-black shadow-sm"
              },
                React.createElement("img", { src: displayedIcon, alt: "", "aria-hidden": "true", className: "block h-full w-full object-contain" })
              ),
              React.createElement("div", { className: "flex h-14 flex-col justify-center" },
                React.createElement("h1", { className: "relative top-[1px] inline-flex items-center gap-2 text-[2.2rem] font-semibold leading-none tracking-tight md:text-3xl" },
                  displayedTitle,
                  profileShowQr && React.createElement(ProfileQrButton, { icon: profileQrIcon, disabled: activeWorksheetMode || profileShareDisabled, onClick: () => setQrOpen(true) }),
                  worksheetEnabled && React.createElement(WorksheetButton, { enabled: !worksheetOpening, selected: activeWorksheetMode, returnLabel: typeof displayedTitle === "string" ? displayedTitle : "activity", onClick: activeWorksheetMode ? worksheetHeader?.onExit : createWorksheet }),
                  displayedClassroomUrl && React.createElement("button", {
                    disabled: activeWorksheetMode || classroomPilotDisabled,
                    type: "button", onClick: () => {
                      const destination = new URL(displayedClassroomUrl, window.location.href);
                      if (!classroomPilotMode && typeof classroomPilotConfig === "function") {
                        destination.searchParams.set("mode", "host");
                        destination.searchParams.set("setup", JSON.stringify(classroomPilotConfig()));
                      }
                      window.location.href = destination.toString();
                    },
                    className: `inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-lg border shadow-sm transition ${activeWorksheetMode || classroomPilotDisabled ? "cursor-not-allowed border-stone-200 bg-stone-100 text-stone-400 opacity-70" : classroomPilotMode ? "border-black bg-black text-white hover:bg-stone-800" : "border-stone-300 bg-white text-stone-700 hover:border-stone-500 hover:bg-stone-50"}`,
                    "aria-pressed": classroomPilotMode,
                    "aria-label": classroomPilotMode ? "Return to individual practice" : "Host a game",
                    title: classroomPilotMode ? "Return to Individual Practice" : "Host",
                  }, React.createElement("img", { src: "ui-icons/group-button.svg?v=20261106-even-lines", alt: "", "aria-hidden": "true", className: "h-5 w-5 object-contain", style: classroomPilotMode ? { filter: "invert(1)" } : undefined }))
                ),
                React.createElement("p", { className: "relative top-[5px] whitespace-nowrap text-[1rem] leading-[1.05] text-stone-600 sm:top-0 sm:max-w-2xl sm:text-[15.36px] xl:whitespace-nowrap" }, displayedSubtitle)
              )
            ),
            React.createElement("div", { className: "relative z-50 flex flex-wrap items-center gap-2 overflow-visible md:ml-auto md:justify-end" }, displayedChildren)
          )
        ),
        profileShowQr && qrOpen && React.createElement(ProfileQrOverlay, { title: activityTitle, subtitle: shareLabel, shareUrl, onClose: () => setQrOpen(false) })
      )
    );
  }

  function FeedbackBadge({ feedback, fading, animationPrefix = "keysig" }) {
    if (!feedback) return null;
    const fadeOut = animationPrefix === "note" ? "feedbackFadeOut .28s ease-out forwards" : "feedbackOut .28s ease-out forwards";
    const { correct, partial } = feedback;
    const fadeIn = animationPrefix === "note" && !correct && !partial
      ? "hubFeedbackWrong .26s ease-out both"
      : "hubFeedbackIn .18s ease-out both";
    const colourClass = partial ? "" : correct ? "border-[#16a34a] bg-[#16a34a]" : "border-[#dc2626] bg-[#dc2626]";
    const partialStyle = partial ? { backgroundColor: "#b45309", borderColor: "#b45309", color: "#fff", whiteSpace: "nowrap" } : {};

    return (
      React.createElement("div", { className: "relative flex w-full items-center justify-center text-center" },
        React.createElement("div", {
          className: `flex h-10 min-w-[58px] max-w-[1184px] items-center justify-center rounded-xl border px-3 text-[18px] font-black text-white translate-y-[60px] sm:translate-y-0 ${colourClass}`,
          style: { ...partialStyle, animation: fading ? fadeOut : fadeIn },
        }, correct ? "Correct" : partial ? "Partially Correct" : "Incorrect")
      )
    );
  }

  function ScoreStreakPanel({
    assets,
    correct,
    attempted,
    accuracy,
    streak,
    bestStreak,
    resetScore,
    confettiKey = 0,
    autoShowMedals = false,
    autoMedalPopoverMs = 2000,
    showMedalPopover = false,
    medalEligible = null,
    medalThresholdValues = null,
    medalColourStreak = streak,
    achievementLevel = null,
    achievementActivity = null,
    scoreDisplay = null,
    streakDisplay = null,
    medalThresholdLabels = null,
    resetDisabled = false,
    scoreInteractive = true,
    showScore = true,
    dismissPopoverKey = 0,
  }) {
    const [popover, setPopover] = React.useState(null);
    const [autoPopoverKey, setAutoPopoverKey] = React.useState(0);
    const [dismissedAutoPopoverKey, setDismissedAutoPopoverKey] = React.useState(0);
    const [autoMedalEligible, setAutoMedalEligible] = React.useState(true);
    const ref = React.useRef(null);
    const achievementAttemptRef = React.useRef(null);
    const [, refreshAchievements] = React.useState(0);
    useClickAway(ref, () => {
      setPopover(null);
      setAutoPopoverKey(0);
      setDismissedAutoPopoverKey(confettiKey);
    });

    React.useEffect(() => {
      const updateMedalEligibility = () => {
        const hasCustomLevel = Array.from(document.querySelectorAll("button[data-menu-trigger]"))
          .some((button) => button.textContent.trim() === "Custom");
        setAutoMedalEligible(!hasCustomLevel);
      };
      updateMedalEligibility();
      const observer = new MutationObserver(updateMedalEligibility);
      observer.observe(document.body, { childList: true, subtree: true, characterData: true });
      return () => observer.disconnect();
    }, []);

    const scoreFill = Math.max(0, Math.min(100, scoreDisplay?.fillPercent ?? (accuracy || 0)));
    const scoreColour = scoreDisplay?.fillColor ?? (scoreFill < 50 ? "rgba(220,38,38,.38)" : scoreFill < 70 ? "rgba(255,120,0,.42)" : "rgba(22,163,74,.38)");
    const thresholdValues = Array.isArray(medalThresholdValues) && medalThresholdValues.length === 4 ? medalThresholdValues : [10, 15, 20, 30];
    const autoPopoverDuration = Math.max(360, Number(autoMedalPopoverMs) || 2000);
    const autoPopoverOutDelay = Math.max(0.28, (autoPopoverDuration - 240) / 1000);
    const thresholdBase = [
      { tier: "bronze", icon: assets.bronze, className: "text-amber-700" },
      { tier: "silver", icon: assets.silver, className: "text-slate-500" },
      { tier: "gold", icon: assets.gold, className: "text-yellow-500" },
      { tier: "diamond", icon: assets.diamond, className: "text-cyan-500" },
    ];
    const thresholds = thresholdBase.map((item, index) => ({
      ...item,
      value: thresholdValues[index],
      active: streak >= thresholdValues[index] && (index === thresholdValues.length - 1 || streak < thresholdValues[index + 1]),
    }));
    const effectiveMedalEligible = medalEligible ?? autoMedalEligible;
    const medal = effectiveMedalEligible ? thresholds.find((item, index) =>
      medalColourStreak >= item.value && (index === thresholds.length - 1 || medalColourStreak < thresholds[index + 1].value)) : null;
    React.useEffect(() => {
      const refresh = () => refreshAchievements((value) => value + 1);
      window.addEventListener("mlh-achievements-change", refresh);
      return () => window.removeEventListener("mlh-achievements-change", refresh);
    }, []);
    React.useEffect(() => {
      const previous = achievementAttemptRef.current;
      const context = `${achievementActivity}|${achievementLevel}|${effectiveMedalEligible}`;
      achievementAttemptRef.current = { context, attempted };
      // Only a newly marked answer can earn progress; switching level or settings cannot.
      if (!previous || previous.context !== context || attempted <= previous.attempted || !effectiveMedalEligible || !achievementLevel || MLH.worksheetHeaderMode) return;
      if (medalEligible == null && Array.from(document.querySelectorAll("button[data-menu-trigger]"))
        .some((button) => button.textContent.trim() === "Custom")) return;
      MLH.achievements?.record(achievementActivity || window.location.pathname, achievementLevel, streak, thresholdValues);
    }, [achievementActivity, achievementLevel, attempted, streak, effectiveMedalEligible, medalEligible, thresholdValues.join(",")]);
    const highestStreak = bestStreak || 0;
    // Open the celebration before the newly earned tile colour is painted.
    React.useLayoutEffect(() => {
      if (!effectiveMedalEligible || confettiKey <= 0) return;
      setDismissedAutoPopoverKey(0);
      setAutoPopoverKey(confettiKey);
      const timer = window.setTimeout(() => setAutoPopoverKey(0), autoPopoverDuration);
      return () => window.clearTimeout(timer);
    }, [confettiKey, effectiveMedalEligible, autoPopoverDuration]);
    React.useEffect(() => {
      if (!dismissPopoverKey) return;
      setPopover(null);
      setAutoPopoverKey(0);
      setDismissedAutoPopoverKey(confettiKey);
    }, [dismissPopoverKey]);
    const autoPopoverDismissed = confettiKey > 0 && dismissedAutoPopoverKey === confettiKey;
    const autoMedalPopover = effectiveMedalEligible && popover !== "streak" && !autoPopoverDismissed && (autoShowMedals || showMedalPopover || autoPopoverKey > 0);
    const shouldShowMedalPopover = popover === "streak" || autoMedalPopover;
    const medalStyle = !effectiveMedalEligible
      ? { backgroundColor: "#f5f5f4", color: "#a8a29e" }
      : MLH.achievements?.medals[medal?.tier] || (medal?.tier === "diamond"
      ? { backgroundColor: "rgba(34, 211, 238, .25)", color: "#06b6d4" }
      : medal?.tier === "gold"
        ? { backgroundColor: "rgba(250, 204, 21, .25)", color: "#eab308" }
        : medal?.tier === "silver"
          ? { backgroundColor: "rgba(203, 213, 225, .3)", color: "#64748b" }
          : medal?.tier === "bronze"
            ? { backgroundColor: "rgba(180, 83, 9, .2)", color: "#b45309" }
            : { backgroundColor: "#fafaf9", color: "#000000" });
    const tile = MLH.shell.scoreTileClass;
    const active = MLH.shell.scoreTileActiveClass;

    return (
      React.createElement("div", { ref, className: showScore ? "grid w-full grid-cols-2 gap-2 md:w-auto md:grid-cols-[112px_98px] lg:grid-cols-[124px_108px]" : "grid grid-cols-1" },
        showScore && React.createElement("section", {
          role: scoreInteractive ? "button" : undefined,
          tabIndex: scoreInteractive ? "0" : undefined,
          onKeyDown: scoreInteractive ? (event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); event.currentTarget.click(); } } : undefined,
          onPointerDown: scoreInteractive ? (event) => event.stopPropagation() : undefined,
          onClick: scoreInteractive ? () => setPopover((value) => value === "score" ? null : "score") : undefined,
          className: `${tile} ${popover === "score" ? active : ""}`,
        },
          React.createElement("div", { className: "absolute inset-0 overflow-hidden rounded-xl" },
            React.createElement("div", { className: "absolute bottom-0 -left-[2px] right-0 rounded-b-xl transition-all duration-700", style: { height: `${scoreFill}%`, background: scoreColour } })
          ),
          React.createElement("div", { className: "relative z-10 flex h-full flex-col items-center justify-center pt-[1px] text-center" },
            React.createElement("div", { className: "text-[12px] font-bold uppercase leading-none tracking-[0.08em] text-black sm:text-[11px]" }, scoreDisplay?.label ?? "Score"),
            React.createElement("div", { className: "mt-[3px] text-[20px] font-black leading-none tracking-tight text-black sm:text-[22px]" }, scoreDisplay?.value ?? `${correct}/${attempted}`),
            React.createElement("div", { className: "mt-[3px] text-[11px] font-medium leading-none text-stone-500 sm:text-[12px]" }, scoreDisplay?.subtitle ?? `Accuracy: ${accuracy}%`)
          ),
          scoreInteractive && popover === "score" && React.createElement("button", {
            type: "button",
            disabled: resetDisabled,
            onClick: (event) => { event.stopPropagation(); resetScore(); setPopover(null); },
            className: "fixed-popover-button score-reset-button absolute left-1/2 top-full z-[120] mt-2 flex min-w-[112px] w-full -translate-x-1/2 items-center justify-center rounded-xl border border-[#dc2626] bg-[#dc2626] px-3 py-2 text-sm font-semibold text-white shadow-[0_14px_34px_rgba(0,0,0,0.28)] sm:w-auto",
            style: { animation: "medalPopupIn .28s cubic-bezier(.22,1.25,.32,1)" },
          }, "Reset")
        ),
        React.createElement("section", {
          role: "button",
          tabIndex: "0",
          onKeyDown: (event) => { if (event.target === event.currentTarget && (event.key === "Enter" || event.key === " ")) { event.preventDefault(); event.currentTarget.click(); } },
          onPointerDown: (event) => event.stopPropagation(),
          onClick: () => setPopover((value) => value === "streak" ? null : "streak"),
          "aria-label": streakDisplay?.ariaLabel,
          className: `${tile} overflow-visible ${popover === "streak" ? active : ""}`,
          style: { backgroundColor: medalStyle.backgroundColor },
        },
          React.createElement("div", { className: "pointer-events-none absolute inset-0 overflow-hidden rounded-xl" },
            React.createElement("div", {
              className: "absolute inset-0 rounded-xl transition-colors duration-700",
              style: { backgroundColor: medalStyle.backgroundColor },
            })
          ),
          effectiveMedalEligible && confettiKey > 0 && React.createElement("div", { key: confettiKey, className: "pointer-events-none absolute inset-0 z-20 overflow-visible" },
            Array.from({ length: 18 }).map((_, index) => React.createElement("span", {
              key: index,
              className: "absolute block h-1.5 w-1 rounded-sm",
              style: {
                left: `${8 + ((index * 19) % 84)}%`,
                top: "-8px",
                backgroundColor: ["#facc15", "#38bdf8", "#fb7185", "#4ade80", "#a78bfa"][index % 5],
                animation: `confettiDrop ${0.85 + (index % 5) * 0.12}s ease-out forwards`,
                animationDelay: `${(index % 6) * 0.035}s`,
              },
            }))
          ),
          React.createElement("div", { className: "relative z-10 flex h-full flex-col items-center justify-center pt-[1px] text-center" },
            React.createElement("div", { className: "text-[12px] font-bold uppercase leading-none tracking-[0.08em] text-black sm:text-[11px]" }, streakDisplay?.label ?? "Streak"),
            React.createElement("div", { className: "mt-[3px] text-[20px] font-black leading-none tracking-tight sm:text-[22px]", style: { color: medalStyle.color } }, streakDisplay?.value ?? streak),
            streakDisplay?.subtitle !== "" && React.createElement("div", { className: "mt-[3px] text-[11px] font-medium leading-none text-stone-500 sm:text-[12px]" }, streakDisplay?.subtitle ?? `Highest: ${highestStreak}`)
          ),
          shouldShowMedalPopover && React.createElement("div", {
            className: "fixed-popover-button absolute left-1/2 top-full z-[120] mt-2 -translate-x-1/2 rounded-xl border border-stone-200 bg-white px-2.5 py-3 text-[12px] leading-none text-stone-700 shadow-lg sm:text-[13px]",
            style: { width: "max-content", animation: autoMedalPopover ? `medalPopupIn .28s cubic-bezier(.22,1.25,.32,1), medalPopupOut .24s ease-in ${autoPopoverOutDelay}s forwards` : "medalPopupIn .28s cubic-bezier(.22,1.25,.32,1)" },
          },
            !effectiveMedalEligible && React.createElement("p", {
              className: "text-center text-xs leading-snug text-stone-600",
              style: { width: "180px", whiteSpace: "normal" },
              role: "status",
            }, "Medals are unavailable with custom settings."),
            effectiveMedalEligible && React.createElement("div", { className: "flex items-end justify-center gap-3" },
              thresholds.map((item, index) => React.createElement("div", { key: item.value, className: `flex flex-col items-center justify-end ${effectiveMedalEligible && item.active ? "medal-threshold-active" : ""}` },
                React.createElement("img", { src: item.icon, alt: "", "aria-hidden": "true", className: `h-[22.8px] w-[22.8px] object-contain ${effectiveMedalEligible ? "" : "grayscale opacity-35"}` }),
                React.createElement("span", { className: `mt-1 text-[11px] font-semibold leading-none ${effectiveMedalEligible ? item.className : "text-stone-400"}` },
                  !medalThresholdLabels && item.value < 10 && React.createElement("span", { "aria-hidden": "true", className: "invisible" }, "0"),
                  medalThresholdLabels?.[index] ?? (item.value < 10
                    ? React.createElement("span", { style: { position: "relative", left: "-4px" } }, item.value)
                    : item.value)
                )
              ))
            )
          )
        )
      )
    );
  }

  MLH.AppHeader = AppHeader;
  MLH.ProfileQrButton = ProfileQrButton;
  MLH.WorksheetButton = WorksheetButton;
  MLH.ProfileQrOverlay = ProfileQrOverlay;
  MLH.FeedbackBadge = FeedbackBadge;
  MLH.ScoreStreakPanel = ScoreStreakPanel;
  MLH.advanceFeedbackPointerDown = advanceFeedbackPointerDown;
  window.MLH = MLH;
})();
