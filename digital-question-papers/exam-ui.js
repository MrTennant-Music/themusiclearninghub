(function (root) {
  "use strict";

  const $ = selector => document.querySelector(selector);
  const escapeHtml = value => String(value ?? "").replace(/[&<>'"]/g, character => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character]);
  const escapeRegExp = value => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const USER_ANSWER_GLIMMER_DURATION = 8000;

  function syncUserAnswerGlimmer(target) {
    const elapsed = root.performance?.now?.() ?? Date.now();
    target.style.setProperty("--user-answer-glimmer-delay", `${-(elapsed % USER_ANSWER_GLIMMER_DURATION)}ms`);
  }

  function bindRemovalGesture(target, remove) {
    let lastTouchEnd = 0;
    const removeOnce = event => {
      if (target.closest(".is-practice-checked")) {
        event?.preventDefault();
        return;
      }
      // Clearing a field/tick is idempotent. A preceding contextmenu event
      // must not suppress the second tap after the browser forwards a click.
      event?.preventDefault();
      remove();
    };
    target.addEventListener("dblclick", removeOnce);
    target.addEventListener("contextmenu", removeOnce);
    target.addEventListener("touchend", event => {
      const now = Date.now();
      if (now - lastTouchEnd <= 350) {
        lastTouchEnd = 0;
        removeOnce(event);
        return;
      }
      lastTouchEnd = now;
    }, { passive: false });
    target.addEventListener("keydown", event => {
      if (event.shiftKey && ["Delete", "Backspace"].includes(event.key)) removeOnce(event);
    });
  }

  function bindTickRemoval(input, remove, isSelected = () => input.checked) {
    const label = input.closest("label") || input;
    const locked = () => input.disabled || !!input.closest(".is-practice-checked");
    const clear = event => {
      event.preventDefault();
      if (!locked()) remove();
    };
    if (input.type === "radio") {
      input.addEventListener("click", event => {
        // Native radio pre-activation has already set checked=true here. Read
        // the saved answer to distinguish selecting from tapping an old tick.
        if (locked() || !isSelected()) return;
        event.preventDefault();
        // Safari can restore radio checkedness after the event's microtask
        // checkpoint. Use the next task so native click rollback finishes first.
        setTimeout(() => { if (!locked()) remove(); }, 0);
      });
    }
    label.addEventListener("contextmenu", clear);
    label.addEventListener("keydown", event => {
      if (event.shiftKey && ["Delete", "Backspace"].includes(event.key)) clear(event);
    });
  }

  function capitaliseInitialText(value) {
    return String(value || "").replace(/^(\s*)(\p{Ll})/u, (match, spacing, letter) => `${spacing}${letter.toUpperCase()}`);
  }

  function capitaliseInitialAnswer(field) {
    const nextValue = capitaliseInitialText(field.value);
    if (nextValue === field.value) return;
    const selectionStart = field.selectionStart;
    const selectionEnd = field.selectionEnd;
    field.value = nextValue;
    if (selectionStart !== null && selectionEnd !== null) field.setSelectionRange(selectionStart, selectionEnd);
  }

  function hasAnswerContent(value) {
    if (Array.isArray(value)) return value.some(hasAnswerContent);
    if (value && typeof value === "object") return Object.values(value).some(hasAnswerContent);
    return Boolean(String(value ?? "").trim());
  }

  function clearTransientNotationState() {
    document.querySelectorAll(".question-card").forEach(card => {
      Object.keys(card.dataset).forEach(key => {
        if (key.startsWith("q3Current") || key === "q3Higher2024RhythmOverrides") delete card.dataset[key];
      });
    });
  }

  let paperTextQuestionId = "";

  function normalisePaperTextKey(value) {
    return String(value ?? "")
      .replace(/^[•·]\s*/, "")
      .replace(/[‘’]/g, "'")
      .replace(/[“”]/g, '"')
      .replace(/[–—]/g, "-")
      .replace(/\s+([,.;:!?])/g, "$1")
      .replace(/\s+/g, " ")
      .trim()
      .toLocaleLowerCase("en-GB");
  }

  function sourceBoldPhrasesForText(text) {
    const paperMap = root.InteractiveExamSourceBold?.[paper?.id];
    if (!paperMap) return null;
    const key = normalisePaperTextKey(text);
    if (paperTextQuestionId) return paperMap[paperTextQuestionId]?.[key] ?? null;
    const matches = Object.values(paperMap).flatMap(questionMap => questionMap?.[key] || []);
    return matches.length ? [...new Set(matches)] : null;
  }

  function sourceStyledPaperText(source, typography = {}) {
    const style = root.InteractiveExamSourceStyles?.[paper?.id]?.[paperTextQuestionId]?.[normalisePaperTextKey(source)] || (typography.sourceSymbols ? { bold: [], italic: [] } : null);
    if (!style || typography.plain) return null;
    const ranges = [];
    for (const kind of ["bold", "italic"]) {
      for (const phrase of style[kind] || []) {
        let start = -1;
        for (let occurrence = 0; occurrence <= phrase.occurrence; occurrence++) {
          start = source.indexOf(phrase.text, start + 1);
          if (start < 0) return null;
        }
        ranges.push({ kind, start, end: start + phrase.text.length });
      }
    }
    for (const symbol of typography.sourceSymbols || []) {
      let start = -1;
      for (let occurrence = 0; occurrence <= symbol.occurrence; occurrence++) {
        start = source.indexOf(symbol.text, start + 1);
        if (start < 0) return null;
      }
      if (start < 0 || !(symbol.scale > 0 && symbol.scale <= 3)) return null;
      ranges.push({ kind: "source-symbol", start, end: start + symbol.text.length, scale: symbol.scale });
    }
    const boundaries = [...new Set([0, source.length, ...ranges.flatMap(range => [range.start, range.end])])].sort((a, b) => a - b);
    return boundaries.slice(0, -1).map((start, index) => {
      const end = boundaries[index + 1];
      let markup = escapeHtml(source.slice(start, end)).replace(/\n/g, "<br />");
      if (typography.sourceOrdinals) markup = markup.replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1<sup>$2</sup>');
      if (ranges.some(range => range.kind === "italic" && range.start <= start && range.end >= end)) markup = `<em>${markup}</em>`;
      if (ranges.some(range => range.kind === "bold" && range.start <= start && range.end >= end)) markup = `<strong class="paper-emphasis">${markup}</strong>`;
      const symbol = ranges.find(range => range.kind === "source-symbol" && range.start <= start && range.end >= end);
      if (symbol) markup = `<strong class="paper-emphasis paper-source-symbol" style="font-size:${symbol.scale}em;line-height:1">${markup}</strong>`;
      return markup;
    }).join("");
  }

  function sourceLineBreaksForText(text) {
    const key = String(text ?? "").normalize("NFKC").toLowerCase().replace(/[^a-z0-9]/g, "");
    return root.InteractiveExamSourceLineBreaks?.[paper?.id]?.[paperTextQuestionId]?.[key];
  }

  function sourceLineBreakMarkup(text, markup) {
    const boundaries = sourceLineBreaksForText(text);
    if (!boundaries?.length) return markup;
    // Insert reviewed source breaks after emphasis has been applied. This
    // preserves exact phrase matching, italics, ordinals and escaped wording.
    const template = document.createElement("template");
    template.innerHTML = markup;
    template.content.querySelectorAll("br").forEach(br => br.replaceWith(document.createTextNode(" ")));
    const walker = document.createTreeWalker(template.content, NodeFilter.SHOW_TEXT);
    const nodes = [];
    while (walker.nextNode()) nodes.push(walker.currentNode);
    const plain = nodes.map(node => node.textContent).join("");
    const remaining = new Set(boundaries), breaks = new Set();
    let offset = 0;
    for (let index = 0; index < plain.length; index++) {
      const normal = plain[index].normalize("NFKC").toLowerCase().replace(/[^a-z0-9]/g, "");
      if (normal && remaining.has(offset)) {
        // Opening punctuation belongs to the following printed line, even
        // when emphasis splits the parenthesis and its word across nodes.
        const opening = plain.slice(0, index).match(/(?:^|\s)([([{“‘"]+\s*)$/);
        breaks.add(opening ? index - opening[1].length : index);
        remaining.delete(offset);
      }
      offset += normal.length;
    }
    let position = 0;
    for (const node of nodes) {
      const fragment = document.createDocumentFragment();
      let start = 0;
      for (let index = 0; index < node.textContent.length; index++) {
        if (breaks.has(position + index)) {
          fragment.append(document.createTextNode(node.textContent.slice(start, index)), document.createElement("br"));
          start = index;
        }
      }
      fragment.append(document.createTextNode(node.textContent.slice(start)));
      position += node.textContent.length;
      node.replaceWith(fragment);
    }
    return template.innerHTML;
  }

  function paperTextMarkup(text, boldPhrases = [], typography = {}) {
    return sourceLineBreakMarkup(text, unwrappedPaperTextMarkup(text, boldPhrases, typography));
  }

  function unwrappedPaperTextMarkup(text, boldPhrases = [], typography = {}) {
    const source = String(text ?? "");
    const sourceStyle = sourceStyledPaperText(source, typography);
    if (sourceStyle !== null) return sourceStyle;
    const sourceBoldPhrases = typography.plain ? [] : sourceBoldPhrasesForText(source);
    const phrases = [...new Set((typography.plain ? [] : sourceBoldPhrases ?? boldPhrases).filter(Boolean))].sort((a, b) => b.length - a.length);
    const escapedPaperText = value => {
      let markup = escapeHtml(value).replace(/\n/g, "<br />");
      if (typography.sourceOrdinals) markup = markup.replace(/\b(\d+)(st|nd|rd|th)\b/g, '$1<sup>$2</sup>');
      for (const phrase of typography.italicPhrases || []) markup = markup.replace(new RegExp(`\\b${escapeRegExp(escapeHtml(phrase))}\\b`, 'g'), '<em>$&</em>');
      return markup;
    };
    if (!phrases.length) return escapedPaperText(source);
    const phraseSet = new Set(phrases);
    const phrasePattern = phrase => `${/^[A-Za-z0-9]/.test(phrase) ? "\\b" : ""}${escapeRegExp(phrase)}${/[A-Za-z0-9]$/.test(phrase) ? "\\b" : ""}`;
    const pattern = new RegExp(`(${phrases.map(phrasePattern).join("|")})`, "g");
    return source.split(pattern).map(part => phraseSet.has(part) ? `<strong class="paper-emphasis">${escapedPaperText(part)}</strong>` : escapedPaperText(part)).join("");
  }
  let engine;
  let paper;
  let audioPlayer;
  let allQuestionAudioPlayers = [];
  let showingAllQuestions = false;
  let selectedStartMode = "practice";
  let modePickerForExistingAttempt = false;
  let modePickerHasProgress = false;
  let pendingModeChange = null;
  let pendingPaperId = null;
  let returnToModePickerAfterCancel = false;
  let pendingQuestionCheck = null;
  let discardCurrentPaperOnUnload = false;
  let feedbackPrintState = null;
  let failedAudioPlayer = null;
  let audioErrorContext = "exam";

  function renderPaperSelectors() {
    $("[data-back-to-papers]").href = "digitalquestionpapers.html?level=" + encodeURIComponent(paper.levelCode);
    $("[data-back-to-papers]").setAttribute("aria-label", "Back to " + paper.level + " papers");
  }

  function destroyAudioPlayers() {
    audioPlayer?.destroy();
    audioPlayer = null;
    allQuestionAudioPlayers.forEach(player => player.destroy());
    allQuestionAudioPlayers = [];
  }

  function createRecoverableAudioPlayer(container, config) {
    let player;
    player = root.ExamAudio.createPlayer(container, {
      ...config,
      // Q6 section cues already identify the opening playing. Hide only the
      // first numeric 1 after each section, preserving calibrated source cues.
      omitOpeningExcerptMarkers: paper.levelCode === "AH" && paper.questions.some(question =>
        String(question.number) === "6" && question.audio?.clips.some(clip => config.clips.some(item => item.file === clip.file))),
      onPlaybackError: error => openStandardAudioErrorModal(error, player),
    });
    return player;
  }

  function showScreen(name) {
    closePaperMenus();
    document.querySelectorAll("[data-screen]").forEach(screen => screen.hidden = screen.dataset.screen !== name);
    document.body.dataset.view = name;
    root.scrollTo({ top: 0, behavior: "smooth" });
  }

  function currentQuestion() { return paper.questions.find(question => question.id === engine.attempt.currentQuestion) || engine.visibleQuestions()[0]; }

  function questionIsComplete(question) { return engine.questionState(question) === "answered"; }

  function lastUnlockedQuestionIndex(questions) {
    const firstIncomplete = questions.findIndex(question => !questionIsComplete(question));
    return firstIncomplete === -1 ? questions.length - 1 : firstIncomplete;
  }

  function canShowAllQuestions() {
    if (engine.attempt.mode === "exam") return true;
    const questions = engine.visibleQuestions();
    return !engine.attempt.questionsLocked || lastUnlockedQuestionIndex(questions) === questions.length - 1;
  }

  function formatTimer(seconds) {
    const safeSeconds = Math.max(0, Number(seconds) || 0);
    return `${Math.floor(safeSeconds / 60)}:${String(safeSeconds % 60).padStart(2, "0")}`;
  }

  function renderToolbarStats() {
    const remainingSeconds = engine?.attempt?.timer?.remainingSeconds ?? paper.estimatedMinutes * 60;
    const submitted = engine?.attempt?.status === "submitted" && engine.attempt.result;
    const timerCard = $("[data-toolbar-duration]").closest(".exam-header-stat");
    const headerStats = timerCard.closest(".exam-header-stats");
    const timerEnabled = Boolean(engine?.attempt?.timer?.enabled);
    const timerVisible = timerEnabled && !submitted;
    $("[data-toolbar-duration]").textContent = formatTimer(remainingSeconds);
    timerCard.hidden = !timerVisible;
    headerStats.classList.toggle("is-timer-hidden", !timerVisible);
    timerCard.classList.toggle("is-urgent", timerVisible && remainingSeconds <= 30);
  }

  function renderCustomiseMenu() {
    const options = document.querySelectorAll("[data-mode-option]");
    if (options.length && engine?.attempt) {
      options.forEach(option => {
        const active = option.dataset.modeOption === engine.attempt.mode;
        option.classList.toggle("is-active", active);
        option.setAttribute("aria-pressed", String(active));
      });
    }
    const resetButton = $("[data-reset-paper]");
    if (resetButton && engine?.attempt) {
      const examIsActive = engine.attempt.mode === "exam" && engine.attempt.examStarted && engine.attempt.status === "active";
      resetButton.querySelector("span").textContent = examIsActive ? "End" : "Restart";
      resetButton.setAttribute("aria-label", examIsActive ? "End Exam Mode" : "Restart paper");
    }
  }

  function renderNavigator() {
    if (!engine?.attempt) return;
    const navigator = $("[data-question-navigator]");
    const questions = engine.visibleQuestions();
    const reviewingResults = engine.attempt.status === "submitted";
    const lastUnlocked = lastUnlockedQuestionIndex(questions);
    const current = currentQuestion();
    $("[data-current-question-label]").textContent = showingAllQuestions ? "All Questions" : `Question ${current.number}`;
    navigator.innerHTML = questions.map((question, index) => {
      const state = engine.questionState(question);
      const isCurrent = !showingAllQuestions && question.id === engine.attempt.currentQuestion;
      const locked = reviewingResults ? false : engine.attempt.mode === "exam" ? index > (engine.attempt.examUnlockedQuestionIndex ?? -1) : Boolean(engine.attempt.questionsLocked) && index > lastUnlocked;
      const stateLabel = state === "partial" ? "Partially answered" : state === "answered" ? "Answered" : "Not attempted";
      const subtitle = `<span class="navigator-status">${stateLabel}</span>`;
      return `<button type="button" class="navigator-item is-${state} ${isCurrent ? "is-current" : ""} ${locked ? "is-locked" : ""}" data-go-question="${question.id}" aria-label="Question ${question.number}, ${stateLabel}${locked ? ", locked" : ""}" aria-current="${isCurrent ? "step" : "false"}" ${locked ? "disabled aria-disabled=\"true\"" : ""}>
        <span class="navigator-question-glyph" aria-hidden="true">${question.number}</span>
        <span class="navigator-copy"><span class="navigator-label">Question ${question.number}</span>${subtitle}</span>
        <span class="navigator-marks">${question.marks} ${question.marks === 1 ? "mark" : "marks"}</span>
      </button>`;
    }).join("");
    navigator.querySelectorAll("[data-go-question]").forEach(button => button.addEventListener("click", () => {
      if (reviewingResults) {
        showResultQuestion(button.dataset.goQuestion);
        return;
      }
      if (engine.attempt.mode === "exam") {
        closePaperMenus();
        document.querySelector(`[data-all-question="${button.dataset.goQuestion}"]`)?.scrollIntoView({ behavior: "smooth", block: "start" });
        return;
      }
      showingAllQuestions = false;
      closePaperMenus();
      engine.goToQuestion(button.dataset.goQuestion);
    }));
    const showAllButton = $("[data-show-all-questions]");
    showAllButton.disabled = reviewingResults ? showingAllQuestions : !canShowAllQuestions() || engine.attempt.mode === "exam";
    showAllButton.setAttribute("aria-disabled", String(showAllButton.disabled));
  }

  function updateQuestionActions() {
    const questions = engine.visibleQuestions();
    const question = currentQuestion();
    const index = questions.findIndex(item => item.id === question.id);
    const complete = questionIsComplete(question);
    const next = $("[data-next-question]");
    const bottomNext = $("[data-bottom-next-question]");
    const submits = [...document.querySelectorAll("[data-submit-paper]")];
    const checkAnswers = $("[data-check-question]");
    const checked = engine.isQuestionChecked(question.id);
    const nextDisabled = Boolean(engine.attempt.questionsLocked) && !complete;
    next.disabled = nextDisabled;
    bottomNext.disabled = nextDisabled;
    submits.forEach(submit => { submit.disabled = false; });
    checkAnswers.hidden = engine.attempt.mode !== "practice" || checked;
    checkAnswers.disabled = false;
    checkAnswers.setAttribute("aria-disabled", String(checkAnswers.disabled));
    checkAnswers.title = "Mark and lock this question";
  }

  function flowArrowMarkup(config) {
    const inset = config.shaftInset;
    const points = `0,${inset} 72,${inset} 72,0 100,50 72,100 72,${100-inset} 0,${100-inset}`;
    const innerTransform = `translate(${300/config.width} ${300/config.height}) scale(${(config.width-6)/config.width} ${(config.height-6)/config.height})`;
    return `<span class="answer-option-flow-arrow" style="width:${config.width}px;height:${config.height}px" aria-hidden="true"><svg class="answer-option-flow-arrow-shape" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><polygon points="${points}" />${config.hollow ? `<polygon class="is-inner" points="${points}" transform="${innerTransform}" />` : ''}</svg></span>`;
  }

  function musicGuideArrowMarkup(vertical) {
    // Position the HTML wrapper, keeping the SVG's own viewport at its origin.
    // Capturing an SVG positioned outside its answer card loses the arrow.
    return `<span class="music-guide-arrow ${vertical ? "is-vertical" : ""}" aria-hidden="true"><svg width="52" height="28" viewBox="0 0 52 28" aria-hidden="true" focusable="false"><path d="M0 8 H35 V1 L51 14 L35 27 V20 H0 Z" /></svg></span>`;
  }

  function optionMarkup(subquestion, value, checkbox = false) {
    const selected = checkbox ? (Array.isArray(value) ? value : []) : value;
    const limitId = `${subquestion.id}-selection-limit`;
    const removalId = `${subquestion.id}-removal-help`;
    const hasChordOptions = subquestion.options.some(item => item.secondaryLabel);
    const options = `<div class="answer-options ${checkbox ? "answer-options-checkbox" : ""} ${hasChordOptions ? "chord-answer-options" : ""}">${subquestion.options.map(item => {
      const checked = checkbox ? selected.includes(item.value) : selected === item.value;
      const optionText = item.notationScore
        ? `<span class="answer-option-copy answer-option-score" data-option-score="${escapeHtml(subquestion.id)}-${escapeHtml(item.value)}"></span>`
        : Array.isArray(item.flowParts)
        ? `<span class="answer-option-copy answer-option-flow">${item.flowParts.map((part, index) => `${index ? flowArrowMarkup(subquestion.flowArrow) : ''}<span class="answer-option-flow-box">${String(part).split("|").map(line => `<span>${escapeHtml(line)}</span>`).join("")}</span>`).join("")}</span>`
        : item.stackedFraction
        ? `<span class="answer-option-copy answer-option-fraction"><span>${escapeHtml(item.stackedFraction[0])}</span><span>${escapeHtml(item.stackedFraction[1])}</span></span>`
        : item.secondaryLabel
        ? `<span class="answer-option-copy chord-option-copy${subquestion.sourceChordWeight === 400 ? " has-regular-source-chords" : ""}">${String(item.label).split(/\s+/).map(cell => `<span>${escapeHtml(cell)}</span>`).join("")}${String(item.secondaryLabel).split(/\s+/).map(cell => `<span>${escapeHtml(cell)}</span>`).join("")}</span>`
        : Array.isArray(item.columns)
        ? `<span class="answer-option-copy source-option-columns">${item.columns.map(text=>`<span>${paperTextMarkup(text)}</span>`).join("")}</span>`
        : `<span class="answer-option-copy">${paperTextMarkup(item.label)}</span>`;
      const accessibleOptionLabel = item.secondaryLabel ? `${item.label}, ${item.secondaryLabel}` : item.label;
      return `<label class="answer-option ${item.secondaryLabel ? "chord-answer-option" : ""} ${item.flowParts ? "answer-option-with-flow" : ""} ${checked ? "is-selected" : ""}"><input type="${checkbox ? "checkbox" : "radio"}" name="${subquestion.id}" value="${escapeHtml(item.value)}" aria-label="${escapeHtml(accessibleOptionLabel)}" aria-keyshortcuts="Shift+Delete" ${checked ? "checked" : ""} />${optionText}</label>`;
    }).join("")}</div>`;
    const describedBy = checkbox ? `${limitId} ${removalId}` : removalId;
    return `<fieldset class="answer-fieldset" data-tick-heading="${escapeHtml(subquestion.tickHeading || "Tick")}" aria-describedby="${describedBy}"><legend class="visually-hidden">${escapeHtml(subquestion.prompt)}</legend>${options}</fieldset><span class="visually-hidden" id="${removalId}">Tap or click a ticked box once to remove the tick. Keyboard users can press Shift and Delete.</span>${checkbox ? `<span class="visually-hidden" id="${limitId}">Tick ${subquestion.maxSelections} boxes.</span><p class="answer-error" data-selection-error role="status" hidden>You can tick no more than ${subquestion.maxSelections} boxes.</p>` : ""}`;
  }

  function inputMarkup(subquestion, value, question) {
    const displayedValue = subquestion.capitaliseAnswer ? capitaliseInitialText(value) : value;
    const answerLabel = subquestion.prompt || (subquestion.promptLines || []).join(" ") || [...(subquestion.inlineAnswer?.beforeLines || []), subquestion.inlineAnswer?.before, subquestion.inlineAnswer?.after].filter(Boolean).join(" ");
    const beforeAnswerLines = Array.isArray(subquestion.beforeAnswerLines)
      ? `<div class="subquestion-before-answer-lines">${subquestion.beforeAnswerLines.map(line => `<span>${paperTextMarkup(line, subquestion.boldPhrases)}</span>`).join("")}</div>`
      : "";
    if (subquestion.type === "radio") return optionMarkup(subquestion, value, false);
    if (subquestion.type === "checkbox") return optionMarkup(subquestion, value, true);
    if (subquestion.type === "short-text" && subquestion.inlineAnswer) {
      const periodOnly = String(subquestion.inlineAnswer.after || "").trim() === ".";
      return `<div class="sentence-answer${periodOnly ? " sentence-answer-period" : ""}">${(subquestion.inlineAnswer.beforeLines || []).map(line => `<span class="sentence-answer-lead">${paperTextMarkup(line, subquestion.inlineAnswer.boldPhrases ?? subquestion.boldPhrases)}</span>`).join("")}<span>${paperTextMarkup(subquestion.inlineAnswer.before, subquestion.inlineAnswer.boldPhrases ?? subquestion.boldPhrases)}</span><label class="visually-hidden" for="${subquestion.id}">${escapeHtml(answerLabel)}</label><input id="${subquestion.id}" class="text-answer short-answer-line" type="text" value="${escapeHtml(displayedValue || "")}" autocomplete="off" autocapitalize="${subquestion.capitaliseAnswer ? "sentences" : "none"}" /><span>${paperTextMarkup(subquestion.inlineAnswer.after, subquestion.inlineAnswer.boldPhrases ?? subquestion.boldPhrases)}</span></div>`;
    }
    if (subquestion.type === "short-text" && subquestion.answerStyle === "reason") return `<label class="visually-hidden" for="${subquestion.id}">${escapeHtml(answerLabel)}</label><textarea id="${subquestion.id}" class="text-answer extended-answer-box" rows="4" autocapitalize="sentences">${escapeHtml(value || "")}</textarea>`;
    if (subquestion.type === "short-text") {
      const answerPrompt = subquestion.answerPrompt
        ? `<div class="subquestion-answer-prompt"><span class="subquestion-answer-prompt-label">${escapeHtml(subquestion.answerPromptLabel || "")}</span><span>${paperTextMarkup(subquestion.answerPrompt, subquestion.boldPhrases)}</span>${subquestion.markOnAnswerPrompt ? `<strong class="subquestion-heading-marks" data-subquestion-mark="${escapeHtml(subquestion.id)}">${paperMarkMarkup(subquestion.marks)}</strong>` : ""}</div>`
        : "";
      if (Number(subquestion.answerLines) > 1) {
        const values=String(value||'').split('\n');
        return `${answerPrompt}<div id="${subquestion.id}" class="short-answer-line multiline-short-answer" role="group" aria-label="${escapeHtml(answerLabel)}">${Array.from({length:Number(subquestion.answerLines)},(_,index)=>`<label><span class="visually-hidden">${escapeHtml(answerLabel)} Answer line ${index+1}</span><input class="text-answer" data-numbered-answer-line type="text" value="${escapeHtml(values[index]||'')}" autocomplete="off" autocapitalize="sentences" /></label>`).join('')}</div>`;
      }
      if (Number(subquestion.numberedAnswerLines) > 1) {
        const lineCount = Number(subquestion.numberedAnswerLines);
        const values = String(value || "").split("\n");
        const lines = Array.from({ length: lineCount }, (_, index) => `<label class="numbered-short-answer-row"><span aria-hidden="true">${index + 1}.</span><span class="visually-hidden">${escapeHtml(answerLabel)} Answer ${index + 1}</span><input class="text-answer numbered-short-answer-input" data-numbered-answer-line type="text" value="${escapeHtml(values[index] || "")}" autocomplete="off" autocapitalize="sentences" /></label>`).join("");
        return `${answerPrompt}<div class="numbered-short-answer">${lines}</div>`;
      }
      return `${answerPrompt}<label class="visually-hidden" for="${subquestion.id}">${escapeHtml(answerLabel)}</label><input id="${subquestion.id}" class="text-answer short-answer-line" type="text" value="${escapeHtml(value || "")}" autocomplete="off" autocapitalize="sentences" />`;
    }
    if (subquestion.type === "concept-lines") {
      const bank = `<div class="higher-concept-bank">${(subquestion.conceptBank || []).map(item => `<span>${paperTextMarkup(item.label)}</span>`).join("")}</div>`;
      const conceptMarkAttribute = paper.levelCode === "AH" && question?.subquestions?.length > 1 ? `data-subquestion-mark="${escapeHtml(subquestion.id)}"` : `data-question-total-mark="${escapeHtml(question?.id || "")}"`;
      const prompt = `<div class="higher-concept-answer-prompt"><span>${paperTextMarkup(subquestion.prompt, subquestion.boldPhrases)}</span><strong class="subquestion-heading-marks" ${conceptMarkAttribute}>${paperMarkMarkup(subquestion.marks)}</strong></div>`;
      const lineCount = Number(subquestion.lines || subquestion.marks);
      const existingLines = Array.isArray(value) ? value : String(value || "").split("\n");
      const lines = Array.from({ length: lineCount }, (_, index) => `<label class="higher-concept-line"><span class="visually-hidden">Answer line ${index + 1}</span><input id="${subquestion.id}-line-${index + 1}" class="text-answer" type="text" data-concept-line value="${escapeHtml(existingLines[index] || "")}" autocomplete="off" autocapitalize="sentences" /></label>`).join("");
      const sourceReplayCount = Number(subquestion.afterAnswerLinesBeforePrompt || 0);
      const sourceReplay = sourceReplayCount > 0 && Array.isArray(subquestion.afterAnswerLines)
        ? `<div class="subquestion-after-answer-lines is-before-prompt">${subquestion.afterAnswerLines.slice(0, sourceReplayCount).map(line => `<span class="${/^Here is /i.test(line) ? "source-replay-cue" : "source-paragraph"}">${paperTextMarkup(line, subquestion.afterAnswerBoldPhrases ?? subquestion.boldPhrases)}</span>`).join("")}</div>`
        : "";
      if (beforeAnswerLines) return `${bank}${beforeAnswerLines}${sourceReplay}${prompt}<div class="higher-concept-lines" role="group" aria-label="${escapeHtml(answerLabel)}">${lines}</div>`;
      return `${bank}${sourceReplay}${prompt}<div class="higher-concept-lines" role="group" aria-label="${escapeHtml(answerLabel)}">${lines}</div>`;
    }
    if (subquestion.type === "comparison-grid") {
      const selected = value || {};
      const columns = ["a", "b", "c"];
      const columnHeadings = columns.map(id => {
        const column = subquestion.columns?.find(column => column.id === id);
        const label = column?.label || `Column ${id.toUpperCase()}`;
        const subtitle = column?.sublabel || (id === 'c' ? '5 features common to both' : `Excerpt ${id === 'a' ? 1 : 2}`);
        return `<th>${escapeHtml(label)}<br />${id === 'c' ? `<strong>${escapeHtml(subtitle)}</strong>` : `<span>${escapeHtml(subtitle)}</span>`}</th>`;
      }).join('');
      const sourceCategories = subquestion.categories || (subquestion.groups || []).map(group => ({ label: group.label, rows: group.concepts.map(concept => concept.label) }));
      const categories = sourceCategories.map(category => category.rows.map((row, rowIndex) => `<tr>${rowIndex === 0 ? `<th scope="rowgroup" rowspan="${category.rows.length}">${escapeHtml(category.label).replaceAll("/", "/<wbr>")}</th>` : ""}<th scope="row">${sourceLineBreakMarkup(row, escapeHtml(row))}</th>${columns.map(column => `<td class="comparison-column-${column}"><label><span class="visually-hidden">${escapeHtml(row)}, Column ${column.toUpperCase()}</span><input type="checkbox" data-comparison-column="${column}" value="${escapeHtml(row)}" ${(selected[column] || []).includes(row) ? "checked" : ""} /></label></td>`).join("")}</tr>`).join("")).join("");
      return `<div class="higher-comparison-wrap"><table class="higher-comparison-grid${subquestion.comparisonRoughWorkShaded === false ? ' has-plain-rough-work' : ''}${subquestion.comparisonColumnHeaderBold ? ' has-bold-column-headings' : ''}"><thead><tr><th aria-hidden="true"></th><th>Concepts</th>${columnHeadings}</tr></thead><tbody>${categories}</tbody><tfoot><tr><td class="comparison-footer-spacer" colspan="4" aria-hidden="true"></td><td class="comparison-marks-footer${subquestion.comparisonFooterBold ? ' has-bold-source-total' : ''}">5 marks</td></tr></tfoot></table></div>`;
    }
    if (subquestion.type === "lyric-placement") {
      const features = `<ul class="higher-lyric-features${subquestion.featuresBullets === false ? " is-unbulleted" : ""}" role="list">${(subquestion.features || []).map(feature => `<li>${feature.boldBefore ? `<strong>${escapeHtml(feature.before || "")}</strong>` : escapeHtml(feature.before || "")}<u><strong>${escapeHtml(feature.word)}</strong></u>${feature.boldAfter ? `<strong>${escapeHtml(feature.after || "")}</strong>` : escapeHtml(feature.after || "")}</li>`).join("")}</ul>`;
      const playback = Array.isArray(subquestion.playbackLines) ? `<div class="higher-lyric-playback">${subquestion.playbackLines.map(line => `<p>${paperTextMarkup(line, ["three times"])}</p>`).join("")}</div>` : "";
      const rows = (subquestion.lyrics || subquestion.lyricLines || []).map((lyric, index) => { const line = String(index + 1); return `<tr><th scope="row">${subquestion.lyricItalicLines?.includes(index + 1) ? `<em>${escapeHtml(lyric)}</em>` : escapeHtml(lyric)}</th><td><div class="higher-lyrics-answer-cell"><span>${line}</span><label class="visually-hidden" for="${subquestion.id}-line-${line}">Feature at lyric line ${line}</label><input id="${subquestion.id}-line-${line}" class="text-answer" type="text" data-lyric-line="${line}" value="${escapeHtml(value?.[line] || "")}" autocomplete="off" autocapitalize="sentences" /></div></td></tr>`; }).join("");
      return `${features}${playback}<div class="higher-lyric-instruction-row"><p class="higher-lyric-instruction">Insert the <strong>five</strong> underlined words at the point where they occur.<br />${paperTextMarkup("Insert each word once only.")}</p><strong class="higher-lyric-marks" data-question-total-mark="${escapeHtml(question?.id || "")}">${paperMarkMarkup(subquestion.marks)}</strong></div><div class="higher-lyrics-wrap"><table class="higher-lyrics-table"><tbody>${rows}</tbody></table></div><p class="q8-end-paper">[END OF QUESTION PAPER]</p>`;
    }
    if (subquestion.type === "structured-review") {
      if (subquestion.roughWork && subquestion.finalAnswerField) {
        const endOfPaper = subquestion.endOfPaper === false ? "" : `<p class="q8-end-paper">[END OF QUESTION PAPER]</p>`;
        const finalLines = Array.isArray(value?.final) ? value.final : String(value?.final || "").split("\n");
        const lineCount = Math.max(7, Number(subquestion.finalAnswerLines || 0));
        const answerLines = Array.from({ length: lineCount }, (_, index) => `<label class="q8-final-answer-line"><span class="visually-hidden">Final answer line ${index + 1}</span><input id="${subquestion.id}-final-${index + 1}" class="text-answer" type="text" data-final-answer-line value="${escapeHtml(finalLines[index] || "")}" autocomplete="off" autocapitalize="sentences" /></label>`).join("");
        const finalSourceHeading = subquestion.sourceHeadingPosition === "final" ? `<h3 class="ah-source-heading" ${subquestion.hideFinalHeading ? `id="${subquestion.id}-final-answer-heading"` : ""}><span>${subquestion.sourcePartLabel ? `<span class="ah-source-part-label">${escapeHtml(subquestion.sourcePartLabel)}</span>` : ""}${escapeHtml(subquestion.sourceHeading)}</span>${subquestion.finalAnswerIntro ? "" : `<strong data-subquestion-mark="${escapeHtml(subquestion.id)}">${paperMarkMarkup(subquestion.marks)}</strong>`}</h3>` : "";
        const finalHeading = subquestion.hideFinalHeading ? "" : `<div class="q8-final-answer-heading-row"><h3 id="${subquestion.id}-final-answer-heading">${escapeHtml(subquestion.finalAnswerHeading || "Final answer")}</h3></div>`;
        const finalAnswerText = subquestion.finalAnswerIntro?.join(' ');
        const finalAnswerParagraphs = finalAnswerText && sourceLineBreaksForText(finalAnswerText)
          ? `<p>${sourceLineBreakMarkup(finalAnswerText, subquestion.finalAnswerIntro.map(line => unwrappedPaperTextMarkup(line, subquestion.boldPhrases)).join(' '))}</p>`
          : subquestion.finalAnswerIntro?.map(line => `<p>${paperTextMarkup(line, subquestion.boldPhrases)}</p>`).join('');
        const finalAnswerIntro = subquestion.finalAnswerIntro ? `<div class="ah-final-answer-intro"><div>${finalAnswerParagraphs}</div><strong data-subquestion-mark="${escapeHtml(subquestion.id)}">${paperMarkMarkup(subquestion.marks)}</strong></div>` : '';
        const roughWorkContent = subquestion.roughWorkLines
          ? `<div class="ah-ruled-rough-work"><div class="ah-rough-work-rules" aria-hidden="true">${Array.from({ length: Number(subquestion.roughWorkLines) }, () => '<div></div>').join('')}</div>${subquestion.headings.map(heading => `<label class="visually-hidden" for="${subquestion.id}-rough-${heading.id}">Rough work: ${escapeHtml(heading.roughWorkLabel || heading.label)}</label><textarea id="${subquestion.id}-rough-${heading.id}" data-heading="${heading.id}" aria-label="Rough work: ${escapeHtml(heading.roughWorkLabel || heading.label)}" autocapitalize="sentences">${escapeHtml(value?.[heading.id] || '')}</textarea>`).join('')}</div>`
          : subquestion.roughWorkColumns
          ? `<table class="ah-rough-work-table"><thead><tr><th>Categories</th>${subquestion.roughWorkColumns.map(label => `<th>${escapeHtml(label)}</th>`).join("")}</tr></thead><tbody>${subquestion.headings.map(heading => `<tr><th scope="row"${subquestion.roughWorkCategoryWeight === 700 ? ' class="ah-source-category-bold"' : ""}>${escapeHtml(heading.roughWorkLabel || heading.label).replaceAll("/", "/<wbr>")}</th>${subquestion.roughWorkColumns.map((label,index) => `<td><textarea data-heading="${heading.id}-${index}" aria-label="Rough work: ${escapeHtml(heading.roughWorkLabel || heading.label)}, ${escapeHtml(label)}">${escapeHtml(value?.[`${heading.id}-${index}`] || "")}</textarea></td>`).join("")}</tr>`).join("")}</tbody></table>`
          : `<div class="q8-rough-work-table">${subquestion.headings.map(heading => `<label><span>${escapeHtml(heading.roughWorkLabel || heading.label)}</span><textarea data-heading="${heading.id}" aria-label="Rough work: ${escapeHtml(heading.roughWorkLabel || heading.label)}" autocapitalize="sentences">${escapeHtml(value?.[heading.id] || "")}</textarea></label>`).join("")}</div>`;
        const roughWorkLead = subquestion.roughWorkIntro
          ? `<div class="ah-rough-work-intro"><p>${paperTextMarkup(subquestion.roughWorkIntro, subquestion.roughWorkBoldPhrases)}</p>${Array.isArray(subquestion.roughWorkBullets) ? `<ul>${subquestion.roughWorkBullets.map(item => `<li>${paperTextMarkup(item, subquestion.roughWorkBoldPhrases)}</li>`).join('')}</ul>` : ''}</div>`
          : '';
        const roughWork = subquestion.hideRoughWork ? "" : `<section class="q8-rough-work" aria-labelledby="${subquestion.id}-rough-work-heading"><h3 id="${subquestion.id}-rough-work-heading">${escapeHtml(subquestion.roughWorkHeading || 'Rough work')}</h3>${roughWorkLead}${subquestion.roughWorkSheet ? `<div class="ah-rough-work-sheet">${roughWorkContent}</div>` : roughWorkContent}</section>`;
        return `<div class="q8-answer-workspace">${roughWork}<section class="q8-final-answer" aria-labelledby="${subquestion.id}-final-answer-heading">${finalHeading}${finalSourceHeading}${finalAnswerIntro}<div class="q8-final-answer-lines" role="group" aria-label="Final answer lines">${answerLines}</div>${endOfPaper}</section></div>`;
      }
      return `<div class="structured-answer">${subquestion.headings.map(heading => `<label><span>${escapeHtml(heading.label)}</span><textarea data-heading="${heading.id}" rows="4" autocapitalize="sentences">${escapeHtml(value?.[heading.id] || "")}</textarea></label>`).join("")}</div>`;
    }
    if (subquestion.type === "notation-choice") return `<div data-notation-container></div>`;
    return "";
  }

  function questionIntroMarkup(question) {
    paperTextQuestionId = question?.id || paperTextQuestionId;
    const paragraphs = Array.isArray(question.intro) ? question.intro : [question.intro];
    const lastTextIndex = paragraphs.reduce((lastIndex, text, index) => text ? index : lastIndex, -1);
    const paragraphMarkup = (text, index) => {
      if (!text) return `<p class="question-intro-spacer" aria-hidden="true"></p>`;
      const totalMarksIndex = Number.isInteger(question.introTotalMarksIndex) ? question.introTotalMarksIndex : lastTextIndex;
      const isTotalMarksRow = question.introTotalMarks && index === totalMarksIndex;
      if (!isTotalMarksRow) {
        const textMarkup = paperTextMarkup(text, question.introBoldPhrases);
        const partLabel = question.introPartLabels?.[index] || (index === (question.introPartLabelIndex ?? 0) ? question.introPartLabel : "");
        if (partLabel) return `<p class="question-intro-part-line"><span class="question-intro-part-label">${escapeHtml(partLabel)}</span><span>${textMarkup}</span></p>`;
        return `<p class="${question.introIndent ? "question-intro-indented" : ""}">${textMarkup}</p>`;
      }
      const marks = Number(question.introTotalMarks);
      return `<p class="question-intro-mark-row"><span>${paperTextMarkup(text, question.introBoldPhrases)}</span><strong class="question-intro-marks" ${question.id ? `data-question-total-mark="${escapeHtml(question.id)}"` : ""}>${paperMarkMarkup(marks)}</strong></p>`;
    };
    if (Array.isArray(question.introHeadingRowRange) || Array.isArray(question.introCompactRange) || Array.isArray(question.introCompactRanges) || Array.isArray(question.introBulletRange)) {
      const headingRange = question.introHeadingRowRange || [];
      const compactRanges = Array.isArray(question.introCompactRanges)
        ? question.introCompactRanges
        : (Array.isArray(question.introCompactRange) ? [question.introCompactRange] : []);
      const bulletRange = question.introBulletRange || [];
      return paragraphs.map((text, index) => {
        if (index === bulletRange[0]) return `<ul class="question-intro-list">${paragraphs.slice(bulletRange[0], bulletRange[1] + 1).map(item => `<li>${paperTextMarkup(item, question.introBoldPhrases, { plain: question.introBulletEmphasis === false })}</li>`).join("")}</ul>`;
        if (index > bulletRange[0] && index <= bulletRange[1]) return "";
        if (index === headingRange[0]) return `<div class="question-intro-heading-row">${paragraphs.slice(headingRange[0], headingRange[1] + 1).map(item => `<span>${paperTextMarkup(item, question.introBoldPhrases)}</span>`).join("")}</div>`;
        if (index > headingRange[0] && index <= headingRange[1]) return "";
        const compactRange = compactRanges.find(range => index >= range[0] && index <= range[1]);
        if (compactRange && index === compactRange[0]) return `<div class="question-intro-compact-lines">${paragraphs.slice(compactRange[0], compactRange[1] + 1).map((item, itemIndex) => paragraphMarkup(item, compactRange[0] + itemIndex)).join("")}</div>`;
        if (compactRange) return "";
        return paragraphMarkup(text, index);
      }).join("");
    }
    if (!Array.isArray(question.introBulletRange)) return paragraphs.map((text, index) => paragraphMarkup(text, index) + (question.scoreIntroIndex === index ? sharedNotationMarkup(question) : "")).join("");
    const [bulletStart, bulletEnd] = question.introBulletRange;
    return paragraphs.map((text, index) => {
      if (index === bulletStart) return `<ul class="question-intro-list">${paragraphs.slice(bulletStart, bulletEnd + 1).map(item => `<li>${paperTextMarkup(item, question.introBoldPhrases, { plain: question.introBulletEmphasis === false })}</li>`).join("")}</ul>`;
      if (index > bulletStart && index <= bulletEnd) return "";
      return paragraphMarkup(text, index);
    }).join("");
  }

  function paperOpeningMarkup(question) {
    if (Number(question?.number) !== 1 || !Array.isArray(paper.openingInstructions)) return "";
    return `<div class="paper-opening-instructions">${paper.openingInstructions.map(line => `<p>${escapeHtml(line)}</p>`).join("")}</div>`;
  }

  function questionOutroMarkup(question, includeMovedOutro = false) {
    if (!question.outro) return "";
    if (question.outroPosition === "before-score" && !includeMovedOutro) return "";
    return questionIntroMarkup({
      id: question.id,
      intro: question.outro,
      introBoldPhrases: question.outroBoldPhrases,
      introTotalMarks: question.outroTotalMarks,
      introCompactRange: question.outroCompactRange,
    });
  }

  function styleReasonGroupsMarkup(question) {
    const groups = [];
    for (let index = 0; index < question.subquestions.length; index += 2) {
      const styleQuestion = question.subquestions[index];
      const reasonQuestion = question.subquestions[index + 1];
      const styleValue = engine.attempt.answers[styleQuestion.id];
      const reasonValue = engine.attempt.answers[reasonQuestion.id];
      groups.push(`<div class="q7-question-group">
        <div class="q7-group-heading"><span>${escapeHtml(styleQuestion.groupStart.label)}</span><span>${escapeHtml(styleQuestion.groupStart.prompt)}</span></div>
        <div class="q7-prompt-row"><span>${escapeHtml(styleQuestion.label)}</span><span>${paperTextMarkup(styleQuestion.prompt, styleQuestion.boldPhrases)}</span><strong data-subquestion-mark="${styleQuestion.id}">${paperMarkMarkup(styleQuestion.marks)}</strong></div>
        <div class="q7-prompt-row"><span>${escapeHtml(reasonQuestion.label)}</span><span>${paperTextMarkup(reasonQuestion.prompt, reasonQuestion.boldPhrases)}</span><strong data-subquestion-mark="${reasonQuestion.id}">${paperMarkMarkup(reasonQuestion.marks)}</strong></div>
        <div class="q7-playback-lines">${styleQuestion.instructionLines.map(line => `<span>${paperTextMarkup(line)}</span>`).join("")}</div>
        <section class="subquestion q7-style-options" data-subquestion="${styleQuestion.id}">${inputMarkup(styleQuestion, styleValue)}</section>
        <section class="subquestion q7-reason-entry" data-subquestion="${reasonQuestion.id}"><label for="${reasonQuestion.id}"><span>Reason</span><textarea id="${reasonQuestion.id}" class="text-answer q7-reason-answer" rows="1" autocapitalize="sentences">${escapeHtml(reasonValue || "")}</textarea></label></section>
      </div>`);
    }
    return groups.join("");
  }

  function subquestionsMarkup(question) {
    paperTextQuestionId = question?.id || paperTextQuestionId;
    if (question.layout === "style-reason-groups") return styleReasonGroupsMarkup(question);
    const renderedSubquestions = question.subquestions.map((subquestion, subquestionIndex) => {
      const groupStart = subquestion.groupStart ? `<div class="subquestion-group-heading"><strong>${paperTextMarkup(subquestion.groupStart.label)}</strong><span>${paperTextMarkup(subquestion.groupStart.prompt)}</span></div>` : "";
      const conceptPromptEmbedded = subquestion.type === "concept-lines";
      const showMarks = question.showPartMarks !== false && !conceptPromptEmbedded && !subquestion.markOnAnswerPrompt && !subquestion.sourceHeading;
      const showQuestionTotal = !conceptPromptEmbedded && !showMarks && question.totalMarksOnLastPart && subquestionIndex === question.subquestions.length - 1;
      const showHeading = Boolean(subquestion.label) && subquestion.type !== "structured-review";
      const promptMatchesLabel = subquestion.prompt === subquestion.label;
      const value = engine.attempt.answers[subquestion.id];
      const inlineAnswer = Boolean(subquestion.inlineAnswer);
      const inlineAnswerBelowPrompt = inlineAnswer && subquestion.inlineAnswerPlacement === "below-prompt";
      const inlineNotationControls = subquestion.type === "notation-choice" && Boolean(subquestion.inlineNotationControls);
      const promptBoldPhrases = subquestion.promptBoldPhrases ?? subquestion.boldPhrases;
      const promptMarkup = subquestion.promptParts?.symbol === "bracket"
        ? sourceLineBreakMarkup(subquestion.prompt, `<span>${paperTextMarkup(subquestion.promptParts.before, promptBoldPhrases, subquestion)} <span class="source-bracket-symbol" role="img" aria-label="bracket sign"></span> ${paperTextMarkup(subquestion.promptParts.after, promptBoldPhrases, subquestion)}</span>`)
        : Array.isArray(subquestion.promptLines) && (!sourceLineBreaksForText(subquestion.prompt) || normalisePaperTextKey(subquestion.promptLines.join(" ")) !== normalisePaperTextKey(subquestion.prompt))
        ? `<div class="subquestion-prompt-lines">${subquestion.promptLines.map(line => line ? `<span>${paperTextMarkup(line, promptBoldPhrases, subquestion)}</span>` : `<span class="subquestion-prompt-spacer" aria-hidden="true"></span>`).join("")}</div>`
        : Array.isArray(subquestion.promptLines)
        ? `<span>${sourceLineBreakMarkup(subquestion.prompt, subquestion.promptLines.map(line => unwrappedPaperTextMarkup(line, promptBoldPhrases, subquestion)).join(" "))}</span>`
        : `<span>${paperTextMarkup(subquestion.prompt, promptBoldPhrases, subquestion)}</span>`;
      const conceptLeadMarkup = conceptPromptEmbedded && Array.isArray(subquestion.leadLines)
        ? `<div class="subquestion-prompt-lines">${subquestion.leadLines.map(line => `<span>${paperTextMarkup(line, subquestion.boldPhrases)}</span>`).join("")}</div>`
        : "";
      const headingQuestion = subquestion.hidePrompt
        ? ""
        : subquestion.type === "structured-review"
        ? subquestion.roughWork ? "" : `<h3 class="final-answer-heading">${escapeHtml(subquestion.prompt)}</h3>`
        : conceptPromptEmbedded
          ? conceptLeadMarkup
        : inlineAnswer && !inlineAnswerBelowPrompt
          ? inputMarkup(subquestion, value)
          : promptMatchesLabel
            ? ""
            : `${promptMarkup}${subquestion.scoreHint && subquestion.scoreHintPlacement === "prompt" ? `<span class="score-apply-hint score-apply-hint-inline">${escapeHtml(subquestion.scoreHint)}</span>` : ""}${inlineNotationControls ? `<div class="inline-notation-controls" data-notation-container></div>` : ""}`;
      const partScore = subquestion.inlineScore ? `<div class="shared-notation-panel" data-part-score="${escapeHtml(subquestion.id)}"></div>` : "";
      const sourceHeading = subquestion.sourceHeading && subquestion.sourceHeadingPosition !== "final" ? `<h3 class="ah-source-heading"><span>${escapeHtml(subquestion.sourceHeading)}</span><strong data-subquestion-mark="${escapeHtml(subquestion.id)}">${paperMarkMarkup(subquestion.marks)}</strong></h3>` : "";
      const leadLines = subquestion.leadIntro ? `<div class="question-intro subquestion-source-intro">${questionIntroMarkup(subquestion.leadIntro)}</div>` : subquestion.type !== "concept-lines" && subquestion.leadLines ? `<div class="subquestion-before-answer-lines">${subquestion.leadLines.map(line => `<p>${paperTextMarkup(line, subquestion.boldPhrases)}</p>`).join("")}</div>` : "";
      const instruction = subquestion.instruction ? `<p class="subquestion-instruction"><span>${paperTextMarkup(subquestion.instruction)}</span></p>` : "";
      const answerReference = subquestion.answerReference
        ? `<div class="answer-reference"><p>${paperTextMarkup(subquestion.answerReference.heading)}</p><div class="answer-reference-grid">${subquestion.answerReference.rows.map(row => `<span>${escapeHtml(row[0])}</span><span>${escapeHtml(row[1])}</span>`).join("")}</div><div class="answer-reference-footer"><p>${paperTextMarkup(subquestion.answerReference.footer)}</p></div></div>`
        : "";
      const sourceBeforeAnswerCount = subquestion.type === "concept-lines" ? 0 : Number(subquestion.afterAnswerLinesBeforeAnswer || 0);
      const sourceBeforeAnswerLines = sourceBeforeAnswerCount > 0 && Array.isArray(subquestion.afterAnswerLines)
        ? `<div class="subquestion-after-answer-lines is-before-answer">${subquestion.afterAnswerLines.slice(0, sourceBeforeAnswerCount).map(line => `<span class="${/^Here is /i.test(line) ? "source-replay-cue" : "source-paragraph"}">${paperTextMarkup(line, subquestion.afterAnswerBoldPhrases ?? subquestion.boldPhrases)}</span>`).join("")}</div>`
        : "";
      const sourceAfterAnswerStart = subquestion.type === "concept-lines" ? Number(subquestion.afterAnswerLinesBeforePrompt || 0) : sourceBeforeAnswerCount;
      const afterAnswerLines = Array.isArray(subquestion.afterAnswerLines) && sourceAfterAnswerStart < subquestion.afterAnswerLines.length
        ? `<div class="subquestion-after-answer-lines">${subquestion.afterAnswerLines.slice(sourceAfterAnswerStart).map(line => `<span class="${/^Here is /i.test(line) ? "source-replay-cue" : "source-paragraph"}">${paperTextMarkup(line, subquestion.afterAnswerBoldPhrases ?? subquestion.boldPhrases)}</span>`).join("")}</div>`
        : "";
      const beforeAnswerLines = subquestion.type !== "concept-lines" && Array.isArray(subquestion.beforeAnswerLines)
        ? `<div class="subquestion-before-answer-lines">${subquestion.beforeAnswerLines.map(line => `<span class="${/^Here is /i.test(line) ? "source-replay-cue" : "source-paragraph"}">${paperTextMarkup(line, subquestion.beforeAnswerBoldPhrases ?? subquestion.boldPhrases)}</span>`).join("")}</div>`
        : "";
      const guideArrow = ["music-guide", "music-guide-vertical"].includes(question.layout) && subquestionIndex < question.subquestions.length - 1
        ? musicGuideArrowMarkup(question.layout === "music-guide-vertical")
        : "";
      return `${groupStart}<section class="subquestion subquestion-${subquestion.type} ${showHeading ? "has-part-label" : ""} ${subquestion.letteredConcept ? "is-lettered-concept" : ""} ${subquestion.conceptLayout === "flush" ? "is-flush-concept" : ""} ${subquestion.answerStyle ? `answer-style-${subquestion.answerStyle}` : ""}" data-subquestion="${subquestion.id}">
        ${sourceHeading}${leadLines}${subquestion.scoreBeforePrompt ? partScore : ""}${subquestion.scoreFollowingLines ? `<div class="subquestion-before-answer-lines">${subquestion.scoreFollowingLines.map(line => `<p>${paperTextMarkup(line)}</p>`).join("")}</div>` : ""}
        ${showHeading || headingQuestion || showMarks || showQuestionTotal ? `<div class="subquestion-heading"><span class="subquestion-heading-label"${subquestion.sourceLabelWeight === 400 ? ' style="font-weight:400"' : ""}>${showHeading ? paperTextMarkup(subquestion.label) : ""}</span><div class="subquestion-heading-question">${headingQuestion}</div>${showMarks ? `<strong class="subquestion-heading-marks ${subquestion.markAlign === "prompt-end" ? "is-prompt-end" : ""}" data-subquestion-mark="${subquestion.id}">${paperMarkMarkup(subquestion.marks)}</strong>` : showQuestionTotal ? `<strong class="subquestion-heading-marks" data-question-total-mark="${escapeHtml(question.id)}">${paperMarkMarkup(question.marks)}</strong>` : ""}</div>` : ""}
        ${instruction}
        ${answerReference}
        ${beforeAnswerLines}
        ${sourceBeforeAnswerLines}
        ${subquestion.controlsAfterScore ? "" : inlineAnswerBelowPrompt ? inputMarkup(subquestion, value, question) : inlineAnswer || inlineNotationControls || subquestion.answerInScore ? "" : inputMarkup(subquestion, value, question)}
        ${subquestion.scoreBeforePrompt ? "" : partScore}
        ${subquestion.controlsAfterScore ? inputMarkup(subquestion, value, question) : ""}
        ${afterAnswerLines}
        ${guideArrow}
      </section>`;
    });
    const guideBoxCount = Number(question.guideBoxSubquestions || 0);
    if (guideBoxCount > 0 && guideBoxCount < renderedSubquestions.length) {
      const guideBoxStart = Math.max(0, Number(question.guideBoxStartIndex || 0));
      const guideIntro = question.guideIntro
        ? `<div class="ah-guide-source-intro"><div class="subquestion-group-heading"><strong>${paperTextMarkup(question.guideIntro.label)}</strong><span>${paperTextMarkup(question.guideIntro.prompt)}</span></div><div class="ah-guide-source-lines">${question.guideIntro.lines.map(line => `<p>${paperTextMarkup(line)}</p>`).join("")}</div></div>`
        : "";
      return `${renderedSubquestions.slice(0, guideBoxStart).join("")}${guideIntro}<div class="higher-guide-box">${renderedSubquestions.slice(guideBoxStart, guideBoxStart + guideBoxCount).join("")}</div>${renderedSubquestions.slice(guideBoxStart + guideBoxCount).join("")}`;
    }
    return renderedSubquestions.join("");
  }

  function sharedNotationMarkup(question) {
    return question.score?.sharedNotation ? `<div class="shared-notation-panel" data-shared-notation="${escapeHtml(question.score.sharedNotation)}"></div>` : "";
  }

  function questionPartsMarkup(question) {
    const score = Number.isInteger(question.scoreIntroIndex) ? "" : sharedNotationMarkup(question);
    const parts = subquestionsMarkup(question);
    const beforeScoreOutro = question.outroPosition === "before-score"
      ? `<div class="question-outro question-outro-before-score">${questionOutroMarkup(question, true)}</div>`
      : "";
    const beforeScore = question.scorePosition === "after"
      ? `${parts}${beforeScoreOutro}${score}`
      : `${score}${beforeScoreOutro}${parts}`;
    return `${contentHeadingMarkup(question)}${beforeScore}`;
  }

  function contentHeadingMarkup(question) {
    if (!question.contentHeading || /\(continued\)\s*$/i.test(question.contentHeading)) return "";
    return `<h3 class="question-continuation question-content-heading">${escapeHtml(question.contentHeading)}</h3>`;
  }

  function renderPartScores(card, question, onChange = null, review = {}) {
    question.subquestions.forEach(part => {
      const container = card.querySelector(`[data-part-score="${part.id}"]`);
      if (container) root.ExamNotation.renderSharedScore(container, { ...question, score: part.inlineScore }, engine.attempt.answers, onChange, review, card);
      (part.options || []).filter(option => option.notationScore).forEach(option => {
        const host = card.querySelector(`[data-option-score="${part.id}-${option.value}"]`);
        if (host) root.ExamNotation.renderSharedScore(host, { ...question, score: option.notationScore }, {}, null);
      });
    });
  }

  function renderSharedNotation(card, question) {
    if (!root.ExamNotation?.renderSharedScore) return;
    const onChange = (subquestionId, value, options = {}) => {
      engine.setAnswer(subquestionId, value);
      if (options.rerender !== false) renderSharedNotation(card, question);
    };
    const container = card.querySelector("[data-shared-notation]");
    if (container) root.ExamNotation.renderSharedScore(container, question, engine.attempt.answers, onChange, {}, card);
    renderPartScores(card, question, onChange);
  }

  function bindSubquestion(card, subquestion) {
    const syncTypedAnswerStyle = field => {
      const hasAnswer = Boolean(field.value.trim());
      field.classList.toggle("has-user-answer", hasAnswer);
      if (hasAnswer) syncUserAnswerGlimmer(field);
    };
    let rerenderNotationControl = null;
    if (subquestion.type === "radio") {
      card.querySelectorAll('input[type="radio"]').forEach(input => {
        const label = input.closest(".answer-option");
        if (input.checked) syncUserAnswerGlimmer(input);
        input.addEventListener("change", () => {
          card.querySelectorAll(".answer-option").forEach(option => option.classList.toggle("is-selected", option.contains(input) && input.checked));
          if (input.checked) syncUserAnswerGlimmer(input);
          engine.setAnswer(subquestion.id, input.value);
        });
        bindTickRemoval(input, () => {
          if (!input.checked) return;
          input.checked = false;
          label.classList.remove("is-selected");
          engine.setAnswer(subquestion.id, "");
        }, () => engine.attempt.answers[subquestion.id] === input.value);
      });
    } else if (subquestion.type === "checkbox") {
      const syncCheckboxes = () => {
        const checked = [...card.querySelectorAll('input[type="checkbox"]:checked')];
        card.querySelectorAll(".answer-option").forEach(label => label.classList.toggle("is-selected", label.querySelector("input").checked));
        checked.forEach(syncUserAnswerGlimmer);
        engine.setAnswer(subquestion.id, checked.map(item => item.value));
      };
      card.querySelectorAll('input[type="checkbox"]').forEach(input => {
        const label = input.closest(".answer-option");
        if (input.checked) syncUserAnswerGlimmer(input);
        input.addEventListener("change", () => {
          const checked = [...card.querySelectorAll('input[type="checkbox"]:checked')];
          const error = card.querySelector("[data-selection-error]");
          if (checked.length > subquestion.maxSelections) {
            input.checked = false;
            if (error) error.hidden = false;
            return;
          }
          if (error) error.hidden = true;
          syncCheckboxes();
        });
        bindTickRemoval(input, () => {
          if (!input.checked) return;
          input.checked = false;
          const error = card.querySelector("[data-selection-error]");
          if (error) error.hidden = true;
          syncCheckboxes();
        });
      });
    } else if (subquestion.type === "short-text") {
      const numberedInputs = [...card.querySelectorAll("[data-numbered-answer-line]")];
      if (numberedInputs.length) {
        const saveLines = () => engine.setAnswer(subquestion.id, numberedInputs.map(input => input.value).join("\n"));
        numberedInputs.forEach(input => {
          input.setAttribute("aria-keyshortcuts", "Shift+Delete");
          syncTypedAnswerStyle(input);
          input.addEventListener("input", () => { capitaliseInitialAnswer(input); syncTypedAnswerStyle(input); saveLines(); });
          bindRemovalGesture(input, () => { if (!input.value) return; input.value = ""; syncTypedAnswerStyle(input); saveLines(); });
        });
        return;
      }
      const input = card.querySelector("input.text-answer, textarea.text-answer");
      if (input) {
        input.setAttribute("aria-keyshortcuts", "Shift+Delete");
        syncTypedAnswerStyle(input);
        input.addEventListener("input", () => {
          if (!subquestion.inlineAnswer || subquestion.capitaliseAnswer) capitaliseInitialAnswer(input);
          syncTypedAnswerStyle(input);
          engine.setAnswer(subquestion.id, input.value);
        });
        bindRemovalGesture(input, () => {
          if (!input.value) return;
          input.value = "";
          syncTypedAnswerStyle(input);
          engine.setAnswer(subquestion.id, "");
        });
      }
    } else if (subquestion.type === "concept-lines") {
      const inputs = [...card.querySelectorAll("[data-concept-line]")];
      const updateConceptLines = () => engine.setAnswer(subquestion.id, inputs.map(input => input.value).join("\n"));
      inputs.forEach(input => {
        input.setAttribute("aria-keyshortcuts", "Shift+Delete");
        syncTypedAnswerStyle(input);
        input.addEventListener("input", () => {
          capitaliseInitialAnswer(input);
          syncTypedAnswerStyle(input);
          updateConceptLines();
        });
        bindRemovalGesture(input, () => {
          if (!input.value) return;
          input.value = "";
          syncTypedAnswerStyle(input);
          updateConceptLines();
        });
      });
    } else if (subquestion.type === "comparison-grid") {
      const updateComparison = () => {
        const next = { a: [], b: [], c: [] };
        card.querySelectorAll("[data-comparison-column]:checked").forEach(input => next[input.dataset.comparisonColumn].push(input.value));
        engine.setAnswer(subquestion.id, next);
      };
      card.querySelectorAll("[data-comparison-column]").forEach(input => {
        input.setAttribute("aria-keyshortcuts", "Shift+Delete");
        input.addEventListener("change", updateComparison);
        bindTickRemoval(input, () => {
          if (!input.checked) return;
          input.checked = false;
          updateComparison();
        });
      });
    } else if (subquestion.type === "lyric-placement") {
      const updateLyrics = () => {
        const next = {};
        card.querySelectorAll("[data-lyric-line]").forEach(input => { if (input.value.trim()) next[input.dataset.lyricLine] = input.value; });
        engine.setAnswer(subquestion.id, next);
      };
      card.querySelectorAll("[data-lyric-line]").forEach(input => {
        input.setAttribute("aria-keyshortcuts", "Shift+Delete");
        syncTypedAnswerStyle(input);
        input.addEventListener("input", () => { syncTypedAnswerStyle(input); updateLyrics(); });
        bindRemovalGesture(input, () => {
          if (!input.value) return;
          input.value = "";
          syncTypedAnswerStyle(input);
          updateLyrics();
        });
      });
    } else if (subquestion.type === "structured-review") {
      const updateStructuredAnswer = () => {
        const value = {};
        card.querySelectorAll("textarea").forEach(field => { value[field.dataset.heading] = field.value; });
        const finalLines = [...card.querySelectorAll("[data-final-answer-line]")].map(field => field.value);
        if (finalLines.length) value.final = finalLines.join("\n");
        engine.setAnswer(subquestion.id, value);
      };
      card.querySelectorAll("textarea, [data-final-answer-line]").forEach(field => {
        field.setAttribute("aria-keyshortcuts", "Shift+Delete");
        syncTypedAnswerStyle(field);
        field.addEventListener("input", () => {
          capitaliseInitialAnswer(field);
          syncTypedAnswerStyle(field);
          updateStructuredAnswer();
        });
        bindRemovalGesture(field, () => {
          if (!field.value) return;
          field.value = "";
          syncTypedAnswerStyle(field);
          updateStructuredAnswer();
        });
      });
    } else if (subquestion.type === "notation-choice") {
      const notationContainer = card.querySelector("[data-notation-container]");
      rerenderNotationControl = value => root.ExamNotation.render(notationContainer, subquestion, value, nextValue => {
        engine.setAnswer(subquestion.id, nextValue);
        const questionCard = card.closest(".question-card");
        const question = paper.questions.find(item => item.subquestions.some(part => part.id === subquestion.id));
        if (questionCard && question) renderSharedNotation(questionCard, question);
      });
      rerenderNotationControl(engine.attempt.answers[subquestion.id]);
    }

  }

  function paperMarkMarkup(marks) {
    return `<span aria-hidden="true">${marks}</span><span class="visually-hidden">${marks} ${marks === 1 ? "mark" : "marks"}</span>`;
  }

  function renderQuestion() {
    destroyAudioPlayers();
    $("[data-results-paper]").innerHTML = "";
    const paperToolbar = $(".exam-paper-toolbar");
    paperToolbar?.remove();
    showingAllQuestions = false;
    $(".exam-header-audio").hidden = false;
    $("[data-single-question-area]").hidden = false;
    $("[data-all-questions-area]").hidden = true;
    $("[data-all-questions-area]").innerHTML = "";
    let question = currentQuestion();
    if (!question) return;
    const visible = engine.visibleQuestions();
    let index = visible.findIndex(item => item.id === question.id);
    const lastUnlocked = lastUnlockedQuestionIndex(visible);
    if (engine.attempt.questionsLocked && index > lastUnlocked) {
      engine.goToQuestion(visible[lastUnlocked].id);
      return;
    }
    engine.attempt.currentQuestion = question.id;
    const questionCard = $("[data-single-question-area] .question-card");
    const paperActions = $("[data-single-question-area] .question-actions");
    const paperWidth = questionCard.getBoundingClientRect().width;
    if (paperWidth) questionCard.style.setProperty("--checked-paper-min-height", `${paperWidth * 297 / 210}px`);
    if (paperToolbar) questionCard.prepend(paperToolbar);
    if (paperActions.parentElement !== questionCard) questionCard.append(paperActions);
    const checked = engine.isQuestionChecked(question.id);
    const questionResult = checked ? root.ExamMarking.markPaper(paper, engine.attempt.answers).questionBreakdown.find(item => item.id === question.id) : null;
    questionCard.className = `question-card question-${question.id} paper-level-${String(paper.levelCode || "").toLocaleLowerCase("en-GB")} ${question.layout ? `question-layout-${question.layout}` : ""} ${question.score?.sharedNotation === "n5-2024-q3" ? "n5-2024-q3-layout" : ""} ${question.score?.sharedNotation === "n5-2023-q3" ? "n5-2023-q3-layout" : ""} ${question.score?.sharedNotation === "n5-2022-q3" ? "n5-2022-q3-layout" : ""} ${question.score?.sharedNotation === "n5-2019-q3" ? "n5-2019-q3-layout" : ""} ${checked ? "marked-question-card is-practice-checked" : ""}`;
    questionCard.dataset.paperId = paper.id;
    $("[data-question-heading]").textContent = `Question ${question.number}`;
    $("[data-question-heading]").removeAttribute("aria-label");
    $("[data-paper-opening]").innerHTML = paperOpeningMarkup(question);
    $("[data-question-intro]").innerHTML = questionIntroMarkup(question);
    const parts = $("[data-subquestions]");
    parts.innerHTML = questionPartsMarkup(question);
    $("[data-question-outro]").innerHTML = questionOutroMarkup(question);
    const sharedNotation = parts.closest(".question-card").querySelector("[data-shared-notation]");
    if (checked && root.ExamNotation?.renderSharedScore) {
      const notationReview = Object.fromEntries(question.subquestions.filter(subquestion => subquestion.type === "notation-choice" || subquestion.answerInScore).map(subquestion => [subquestion.id, questionResult.parts.find(part => part.id === subquestion.id)?.status]));
      if (sharedNotation) root.ExamNotation.renderSharedScore(sharedNotation, question, engine.attempt.answers, null, notationReview);
      renderPartScores(questionCard, question, null, notationReview);
    } else {
      renderSharedNotation(parts.closest(".question-card"), question);
    }
    question.subquestions.forEach(subquestion => bindSubquestion(parts.querySelector(`[data-subquestion="${subquestion.id}"]`), subquestion));
    if (checked) applyPracticeQuestionMarking(questionCard, question, questionResult);
    audioPlayer = createRecoverableAudioPlayer($("[data-audio-container]"), {
      clips: question.audio.clips,
      mode: engine.attempt.mode,
      limitPlayback: Boolean(engine.attempt.audioLimitEnabled),
      playConsumed: Boolean(engine.attempt.audioLimitEnabled && engine.attempt.audioPlayCounts?.[question.id]),
      onConsumed: () => engine.setPlayCounts({ ...engine.attempt.audioPlayCounts, [question.id]: 1 }),
    });
    const previous = $("[data-previous-question]");
    const next = $("[data-next-question]");
    previous.hidden = false;
    previous.classList.remove("is-invisible-placeholder");
    previous.disabled = index === 0;
    $("[data-bottom-previous-question]").hidden = false;
    $("[data-bottom-previous-question]").disabled = index === 0;
    if (index > 0) $("[data-previous-label]").textContent = "Previous";
    const isLastQuestion = index === visible.length - 1;
    $(".exam-question-navigation").classList.toggle("is-submit-visible", isLastQuestion);
    next.hidden = isLastQuestion;
    $("[data-bottom-next-question]").hidden = isLastQuestion;
    if (index < visible.length - 1) $("[data-next-label]").textContent = "Next";
    document.querySelectorAll("[data-submit-paper]").forEach(submit => { submit.hidden = !isLastQuestion; });
    renderNavigator();
    updateQuestionActions();
  }

  function renderAllQuestions() {
    if (!canShowAllQuestions()) return;
    destroyAudioPlayers();
    $("[data-results-paper]").innerHTML = "";
    const paperToolbar = $(".exam-paper-toolbar");
    paperToolbar?.remove();
    showingAllQuestions = true;
    const activeExam = engine.attempt.mode === "exam" && engine.attempt.examStarted;
    $(".exam-header-audio").hidden = !activeExam;
    const singleArea = $("[data-single-question-area]");
    const allArea = $("[data-all-questions-area]");
    const setExamSubmitVisibility = visible => {
      const topSubmit = $(".question-submit-button");
      const bottomSubmit = allArea.querySelector("[data-all-submit-paper]");
      topSubmit.hidden = !visible;
      if (bottomSubmit) bottomSubmit.hidden = !visible;
      $(".exam-question-navigation").classList.toggle("is-submit-visible", visible);
    };
    singleArea.hidden = true;
    // Keep the single-question shell, but remove stale answers and score targets.
    singleArea.querySelectorAll("[data-paper-opening], [data-question-intro], [data-subquestions], [data-question-outro]").forEach(container => { container.innerHTML = ""; });
    allArea.hidden = false;
    allArea.innerHTML = engine.visibleQuestions().map(question => `<article class="question-card all-question-card question-${question.id} paper-level-${String(paper.levelCode || "").toLocaleLowerCase("en-GB")} ${question.layout ? `question-layout-${question.layout}` : ""}" data-paper-id="${escapeHtml(paper.id)}" data-all-question="${question.id}">
      <div data-all-question-audio></div>
      <div class="paper-marks-heading">MARKS</div>
      ${paperOpeningMarkup(question)}
      <header class="question-header"><h2>Question ${question.number}</h2></header>
      <div class="question-intro">${questionIntroMarkup(question)}</div>
      <div class="subquestions">${questionPartsMarkup(question)}</div>
      <div class="question-outro">${questionOutroMarkup(question)}</div>
    </article>`).join("") + `<div class="question-actions all-question-actions"><span></span><button class="button button-dark" type="button" data-all-submit-paper>Submit</button></div>`;
    const firstPaper = allArea.querySelector(".all-question-card");
    const lastPaper = allArea.querySelector(".all-question-card:last-of-type");
    const allPaperActions = allArea.querySelector(".all-question-actions");
    if (firstPaper && paperToolbar) firstPaper.prepend(paperToolbar);
    if (lastPaper && allPaperActions) {
      lastPaper.classList.add("has-paper-actions");
      lastPaper.append(allPaperActions);
    }
    engine.visibleQuestions().forEach((question, questionIndex) => {
      const card = allArea.querySelector(`[data-all-question="${question.id}"]`);
      const locked = activeExam && questionIndex > (engine.attempt.examUnlockedQuestionIndex ?? 0);
      card.classList.toggle("is-exam-locked", locked);
      card.inert = locked;
      const checked = engine.isQuestionChecked(question.id);
      card.classList.toggle("marked-question-card", checked);
      card.classList.toggle("is-practice-checked", checked);
      const questionResult = checked ? root.ExamMarking.markPaper(paper, engine.attempt.answers).questionBreakdown.find(item => item.id === question.id) : null;
      if (checked && root.ExamNotation?.renderSharedScore) {
        const notationReview = Object.fromEntries(questionResult.parts.map(part => [part.id, part.status]));
        const sharedNotation = card.querySelector("[data-shared-notation]");
        if (sharedNotation) root.ExamNotation.renderSharedScore(sharedNotation, question, engine.attempt.answers, null, notationReview);
        renderPartScores(card, question, null, notationReview);
      } else {
        renderSharedNotation(card, question);
      }
      question.subquestions.forEach(subquestion => bindSubquestion(card.querySelector(`[data-subquestion="${subquestion.id}"]`), subquestion));
      if (checked) applyPracticeQuestionMarking(card, question, questionResult);
      if (!activeExam) allQuestionAudioPlayers.push(createRecoverableAudioPlayer(card.querySelector("[data-all-question-audio]"), { clips: question.audio.clips }));
    });
    if (activeExam) {
      const clips = engine.visibleQuestions().map((question, index) => ({ ...question.audio.clips[0], label: `Question ${index + 1}` }));
      audioPlayer = root.ExamAudio.createPlayer($("[data-audio-container]"), {
        clips,
        continuous: true,
        autoplay: true,
        limitPlayback: true,
        onClipStart: index => {
          engine.unlockExamQuestion(index);
          const card = allArea.querySelector(`[data-all-question="${paper.questions[index].id}"]`);
          allArea.querySelectorAll("[data-all-question]").forEach((item, itemIndex) => {
            const isLocked = itemIndex > index;
            item.classList.toggle("is-exam-locked", isLocked);
            item.inert = isLocked;
          });
          if (index === engine.visibleQuestions().length - 1) setExamSubmitVisibility(true);
          card?.scrollIntoView({ behavior: "smooth", block: "start" });
        },
        onPlaybackError: openAudioErrorModal,
      });
    }
    $("[data-next-question]").hidden = !activeExam;
    $("[data-previous-question]").hidden = false;
    $("[data-previous-question]").disabled = true;
    $("[data-previous-question]").classList.add("is-invisible-placeholder");
    setExamSubmitVisibility(!activeExam || (engine.attempt.examUnlockedQuestionIndex ?? 0) === engine.visibleQuestions().length - 1);
    allArea.querySelector("[data-all-submit-paper]")?.addEventListener("click", openSubmitModal);
    renderNavigator();
    closePaperMenus();
  }

  function renderPrintPaper() {
    if (document.body.dataset.printFeedback === "true") return;
    const printArea = $("[data-print-paper]");
    if (!printArea) return;
    printArea.innerHTML = `<header class="print-paper-header"><h1>${escapeHtml(paper.title)}</h1><span>Total marks: ${paper.totalMarks}</span></header>${paper.questions.map(question => `<article class="question-card print-question-card question-${question.id} ${question.layout ? `question-layout-${question.layout}` : ""}" data-paper-id="${escapeHtml(paper.id)}" data-print-question="${question.id}">
      <div class="paper-marks-heading">MARKS</div>
      <header class="question-header"><h2>Question ${question.number}</h2></header>
      <div class="question-intro">${questionIntroMarkup(question)}</div>
      <div class="subquestions">${questionPartsMarkup(question)}</div>
      <div class="question-outro">${questionOutroMarkup(question)}</div>
    </article>`).join("")}`;
    paper.questions.forEach(question => {
      const card = printArea.querySelector(`[data-print-question="${question.id}"]`);
      const notation = card?.querySelector("[data-shared-notation]");
      if (notation && root.ExamNotation?.renderSharedScore) root.ExamNotation.renderSharedScore(notation, question, engine.attempt.answers, null);
      renderPartScores(card, question);
    });
  }

  function openShareNameModal() {
    if (engine?.attempt?.status !== "submitted" || !engine.attempt.result) return;
    const overlay = $("[data-share-name-overlay]");
    const input = $("[data-share-name-input]");
    input.value = "";
    overlay.classList.add("is-open");
    input.focus();
  }

  function closeShareNameModal() {
    $("[data-share-name-overlay]")?.classList.remove("is-open");
  }

  function restoreAfterFeedbackPrint() {
    if (!feedbackPrintState) return;
    document.body.removeAttribute("data-print-feedback");
    document.body.removeAttribute("data-pdf-feedback");
    $("[data-feedback-export-name]").hidden = true;
    showingAllQuestions = feedbackPrintState.showingAllQuestions;
    engine.attempt.currentQuestion = feedbackPrintState.currentQuestion;
    feedbackPrintState = null;
    renderResultsPaper();
    renderNavigator();
    updateResultNavigation();
  }

  function createFeedbackPdfWindow() {
    const pdfWindow = root.open("", "_blank");
    if (!pdfWindow) throw new Error("Allow pop-ups for The Music Learning Hub, then try Share again.");
    pdfWindow.document.title = "Preparing feedback PDF…";
    pdfWindow.document.body.innerHTML = '<p style="font: 16px system-ui; padding: 24px;">Preparing your feedback PDF…</p>';
    return pdfWindow;
  }

  let feedbackTickSvgSource = "";

  function freezeFeedbackChoices(clonedDocument, scope = clonedDocument) {
    if (!clonedDocument) return;
    scope.querySelectorAll('input[type="radio"], input[type="checkbox"]').forEach(input => {
      const comparisonCell = input.closest('.higher-comparison-grid td');
      // WebKit gives disabled transparent comparison inputs an oklab system
      // colour. Use the surrounding paper cell's colour before copying styles:
      // html2canvas cannot parse oklab, including its derived border colours.
      if (comparisonCell) input.style.color = 'inherit';
      const computed = clonedDocument.defaultView.getComputedStyle(input);
      const tickColor = comparisonCell?.classList.contains('is-user-correct')
        ? computed.getPropertyValue('--green').trim()
        : comparisonCell?.classList.contains('is-user-incorrect')
        ? computed.getPropertyValue('--red').trim() : computed.color;
      const box = clonedDocument.createElement("span");
      for (let index = 0; index < computed.length; index++) {
        const property = computed[index];
        box.style.setProperty(property, computed.getPropertyValue(property));
      }
      box.className = input.className;
      box.setAttribute("data-feedback-choice", input.checked ? "checked" : "empty");
      box.style.display = "inline-flex";
      box.style.alignItems = "center";
      box.style.justifyContent = "center";
      if (comparisonCell) {
        // html2canvas has already materialised the label's masked pseudo-
        // element by onclone. Remove that unsupported solid rectangle and
        // make the replacement for the deliberately transparent input visible.
        input.closest('label')?.querySelectorAll('html2canvaspseudoelement').forEach(node => node.remove());
        box.setAttribute('data-feedback-comparison', input.dataset.comparisonColumn);
        box.style.opacity = '1';
        box.style.background = 'transparent';
      }
      if (input.checked && feedbackTickSvgSource) {
        const parsed = new DOMParser().parseFromString(feedbackTickSvgSource, "image/svg+xml");
        const tick = clonedDocument.importNode(parsed.documentElement, true);
        const size = Math.max(1, Math.min(28, Number.parseFloat(computed.width) - 4, Number.parseFloat(computed.height) - 4));
        tick.setAttribute("width", size);
        tick.setAttribute("height", size);
        tick.style.transform = "translate(.5px, -1px)";
        tick.querySelectorAll("[stroke]").forEach(path => { if (path.getAttribute("stroke") !== "none") path.setAttribute("stroke", tickColor); });
        box.append(tick);
      }
      // html2canvas cannot parse a pseudo-element inserted into a native void
      // input in current Chromium. Freeze the printed box only in its clone.
      input.replaceWith(box);
    });
  }

  function freezeFeedbackTextareas(clonedDocument, scope = clonedDocument) {
    if (!clonedDocument) return;
    scope.querySelectorAll('textarea').forEach(field => {
      const computed = clonedDocument.defaultView.getComputedStyle(field);
      const answer = clonedDocument.createElement('div');
      for (let index = 0; index < computed.length; index++) {
        const property = computed[index];
        answer.style.setProperty(property, computed.getPropertyValue(property));
      }
      answer.className = field.className;
      answer.id = field.id;
      answer.setAttribute('data-feedback-textarea', 'true');
      for (const attribute of ['aria-label', 'aria-describedby', 'data-heading']) {
        if (field.hasAttribute(attribute)) answer.setAttribute(attribute, field.getAttribute(attribute));
      }
      // html2canvas paints a native textarea as a single input line. Static
      // text preserves the fitted box, explicit newlines and normal wrapping.
      answer.style.whiteSpace = 'pre-wrap';
      answer.style.overflowWrap = 'anywhere';
      answer.style.resize = 'none';
      answer.textContent = field.value;
      field.replaceWith(answer);
    });
  }

  function outlineFeedbackBravuraGlyphs(clonedDocument, scope = clonedDocument) {
    freezeFeedbackChoices(clonedDocument, scope);
    freezeFeedbackTextareas(clonedDocument, scope);
    // Canvas text decoration does not reliably propagate from u to its nested
    // strong text. Keep the source feature's underline on the painted text too.
    scope.querySelectorAll('.higher-lyric-features u > strong').forEach(node => { node.style.textDecorationLine = 'underline'; });
    const outlineSet = root.BRAVURA_WORKSHEET_OUTLINES;
    const glyphToKey = new Map(Object.entries(root.BRAVURA_SYMBOLS || {}).map(([key, glyph]) => [glyph, key]));
    if (!outlineSet?.symbols || !clonedDocument) return;
    const svgNamespace = "http://www.w3.org/2000/svg";
    scope.querySelectorAll("text.q3-music-glyph, text.notation-glyph").forEach(textElement => {
      const glyphs = [...(textElement.textContent?.trim() || "")];
      const symbolKey = glyphToKey.get(glyphs.join(""));
      const outlines = glyphs.map(glyph => outlineSet.symbols[glyphToKey.get(glyph)]);
      const x = Number(textElement.getAttribute("x"));
      const y = Number(textElement.getAttribute("y"));
      const computedFontSize = clonedDocument.defaultView?.getComputedStyle(textElement).fontSize;
      const fontSize = Number(textElement.getAttribute("font-size")) || Number.parseFloat(computedFontSize);
      if (symbolKey === "tie") {
        const tieGroup = clonedDocument.createElementNS(svgNamespace, "g");
        const tiePath = clonedDocument.createElementNS(svgNamespace, "path");
        ["class", "transform", "opacity", "fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap", "pointer-events", "style"].forEach(attribute => {
          if (textElement.hasAttribute(attribute)) tieGroup.setAttribute(attribute, textElement.getAttribute(attribute));
        });
        tiePath.setAttribute("d", "M -10 0 Q 0 5 10 0 Q 0 3.6 -10 0 Z");
        tieGroup.append(tiePath);
        textElement.replaceWith(tieGroup);
        return;
      }
      if (!outlines.length || outlines.some(outline => !outline) || !Number.isFinite(x) || !Number.isFinite(y) || !Number.isFinite(fontSize)) return;
      const anchor = textElement.getAttribute("text-anchor") || "start";
      const advance = outlines.reduce((sum, outline) => sum + outline.advance, 0);
      const anchorOffset = anchor === "middle" ? advance / 2 : anchor === "end" ? advance : 0;
      const scale = fontSize / outlineSet.unitsPerEm;
      const outerGroup = clonedDocument.createElementNS(svgNamespace, "g");
      const outlineGroup = clonedDocument.createElementNS(svgNamespace, "g");
      ["class", "transform", "opacity", "fill", "stroke", "stroke-width", "stroke-linejoin", "stroke-linecap", "pointer-events", "style"].forEach(attribute => {
        if (textElement.hasAttribute(attribute)) outerGroup.setAttribute(attribute, textElement.getAttribute(attribute));
      });
      const computed = clonedDocument.defaultView?.getComputedStyle(textElement);
      if (computed?.color) outerGroup.style.color = computed.color;
      if (computed?.fill) outerGroup.style.fill = computed.fill;
      outlineGroup.setAttribute("transform", `translate(${x} ${y}) scale(${scale} ${-scale}) translate(${-anchorOffset} 0)`);
      let offset = 0;
      for (const outline of outlines) {
        const path = clonedDocument.createElementNS(svgNamespace, "path");
        path.setAttribute("d", outline.path);
        if (offset) path.setAttribute("transform", `translate(${offset} 0)`);
        outlineGroup.append(path);
        offset += outline.advance;
      }
      outerGroup.append(outlineGroup);
      textElement.replaceWith(outerGroup);
    });
  }

  function feedbackPdfBreakpoints(element, canvas, fullPageCapacity, captureScale) {
    // Font text bounds include Bravura's very large ascender/descender metrics.
    // Measure the actual exported vector ink in an invisible clone instead.
    const clone = element.cloneNode(true);
    Object.assign(clone.style, { position: "absolute", left: "-20000px", top: "0", width: `${element.getBoundingClientRect().width}px`, margin: "0", visibility: "hidden", pointerEvents: "none" });
    element.parentElement.append(clone);
    try {
      outlineFeedbackBravuraGlyphs(document, clone);
      return measureFeedbackPdfBreakpoints(clone, canvas, fullPageCapacity, captureScale);
    } finally { clone.remove(); }
  }

  function measureFeedbackPdfBreakpoints(element, canvas, fullPageCapacity, captureScale) {
    const elementRect = element.getBoundingClientRect();
    if (!elementRect.height) return [];
    // Canvas height is rounded up before rasterisation. Deriving scale from
    // that rounded height drifts by pixels near the end of a long question.
    const scale = Number.isFinite(captureScale) && captureScale > 0 ? captureScale : canvas.height / elementRect.height;
    const points = new Set([canvas.height]);
    const protectedRanges = [];
    const range = node => {
      const rect = node.getBoundingClientRect();
      return { start: Math.max(0, (rect.top - elementRect.top) * scale), end: Math.min(canvas.height, (rect.bottom - elementRect.top) * scale), height: rect.height * scale };
    };
    const protect = (start, end) => {
      if (end <= start) return;
      protectedRanges.push({ start, end });
      points.add(Math.max(0, Math.floor(start)));
      points.add(Math.min(canvas.height, Math.ceil(end)));
    };
    // Row-spanning comparison headings belong with their complete category.
    // Protecting only individual rows can bisect the centred heading text.
    const selectors = [".question-intro > *", ".subquestion", ".inline-answer-feedback", ".question-outro > *", ".question-review-footer", ".q8-rough-work", ".q8-final-answer", "p", "li", "tr", "th[rowspan]", "td[rowspan]", "svg", ".answer-option"];
    element.querySelectorAll(selectors.join(",")).forEach(node => {
      const box = range(node);
      if (!box.height) return;
      points.add(Math.floor(box.start));
      points.add(Math.ceil(box.end));
      if (node.tagName.toLowerCase() === "svg") {
        const leaves = [...node.querySelectorAll("text,line,path,polygon,polyline,rect,circle,ellipse,image")];
        const rows = [...new Set([...node.querySelectorAll(".q3-staff-line")].map(line => {
          const box = range(line);
          return Math.round((box.start + box.end) * 50) / 100;
        }))].sort((a, b) => a - b);
        const systems = [];
        for (let index = 0; index + 4 < rows.length;) {
          const gap = rows[index + 1] - rows[index];
          if (gap > 0 && [2, 3, 4].every(n => Math.abs(rows[index + n] - rows[index] - n * gap) < scale)) {
            systems.push({ centre: (rows[index] + rows[index + 4]) / 2, start: rows[index], end: rows[index + 4] });
            index += 5;
          } else index += 1;
        }
        if (systems.length) {
          // Attach lyrics, guide boxes and musical symbols to the nearest staff.
          // A grand-staff barline spans both staves and prevents a split there.
          leaves.forEach(leaf => {
            const leafBox = range(leaf);
            if (!leafBox.height || leafBox.height >= fullPageCapacity) return;
            const centre = (leafBox.start + leafBox.end) / 2;
            const system = systems.reduce((nearest, candidate) => Math.abs(candidate.centre - centre) < Math.abs(nearest.centre - centre) ? candidate : nearest);
            system.start = Math.min(system.start, leafBox.start - 2);
            system.end = Math.max(system.end, leafBox.end + 2);
          });
          systems.forEach(system => protect(Math.max(box.start, system.start), Math.min(box.end, system.end)));
        } else if (box.height <= fullPageCapacity - 2) protect(box.start, box.end);
        else leaves.forEach(leaf => {
          const leafBox = range(leaf);
          if (leafBox.height > 0 && leafBox.height < fullPageCapacity) protect(Math.max(box.start, leafBox.start - 2), Math.min(box.end, leafBox.end + 2));
        });
        const part = node.closest?.('.subquestion');
        if (part?.querySelector?.('.shared-notation-panel svg') === node) {
          const lead = part.previousElementSibling;
          const start = lead?.classList.contains('subquestion-group-heading') ? range(lead).start : range(part).start;
          const end = systems.length ? systems[0].end : box.end;
          // Long scores may span pages. Their short introduction must still
          // stay with the first complete staff rather than ending a page alone.
          if (end - start <= fullPageCapacity - 2) protect(start, end);
        }
      } else if (box.height <= fullPageCapacity - 2 && (!node.classList.contains("subquestion") || box.height < fullPageCapacity * .6)) {
        // Keep an answer with its feedback whenever that whole block fits.
        // Adjacent category rows share a one-pixel border via a negative
        // margin. That border overlap must not join every row into one
        // unbreakable block. Keep the first row's raised Tick heading too.
        const sharedBorder = node.matches?.(".question-layout-category-groups .subquestion");
        const raisedHeading = node.matches?.(".question-layout-category-groups .subquestion:first-child");
        protect(Math.max(0, box.start + (raisedHeading ? -44 * scale : sharedBorder ? scale : 0)), box.end - (sharedBorder ? scale : 0));
      }
    });
    // A framed guide may span pages, but its opening and closing borders
    // belong with their answer rows, never alone at either page boundary.
    element.querySelectorAll('.higher-guide-box').forEach(guide => {
      if (!guide.matches?.('.higher-guide-box')) return;
      const parts = [...guide.querySelectorAll('.subquestion')];
      const firstPart = parts[0], lastPart = parts.at(-1);
      if (!lastPart) return;
      const opening = range(guide).start, firstEnd = range(firstPart).end;
      if (firstEnd - opening <= fullPageCapacity - 2) protect(opening, firstEnd);
      const end = range(guide).end;
      const start = Math.max(range(lastPart).start, end - (fullPageCapacity - 2));
      protect(start, end);
    });
    // A long written answer can fit on a page even when it exceeds the normal
    // short-part limit above. Keep its heading, response and feedback together
    // without pulling an earlier rough-work sheet into the same range.
    element.querySelectorAll('.q8-final-answer').forEach(answer => {
      const feedback = answer.closest('.subquestion')?.querySelector('.inline-answer-feedback');
      if (!feedback) return;
      const start = range(answer).start, end = range(feedback).end;
      if (end - start <= fullPageCapacity - 2) protect(start, end);
    });
    // A part can contain a long score before its short written question.
    // Keep that trailing prompt and answer with their feedback even when the
    // complete score-and-question section exceeds the short-part limit.
    element.querySelectorAll('.inline-answer-feedback').forEach(feedback => {
      const heading = feedback.closest?.('.subquestion')?.querySelector?.('.subquestion-heading');
      if (!heading) return;
      const start = range(heading).start, end = range(feedback).end;
      if (end - start <= fullPageCapacity - 2) protect(start, end);
    });
    // The final answer and the paper's bottom padding/corners belong together.
    // Otherwise a few leftover pixels can create a decorations-only last page.
    const last = [...element.querySelectorAll(".inline-answer-feedback, .question-review-footer, .end-of-paper, svg")]
      .map(range).filter(box => box.height).sort((a, b) => a.end - b.end).at(-1);
    if (last) {
      const tailStart = Math.max(last.start, last.end - 120 * scale);
      if (canvas.height - tailStart < fullPageCapacity) protect(tailStart, canvas.height);
      // A final lyric table must not leave only its marking feedback on a
      // separate page. Carry its last row (or the last score system) with it.
      const answerTail = [...element.querySelectorAll("tr, svg")]
        .filter(node => !node.closest?.(".inline-answer-feedback"))
        .map(range).filter(box => box.height && box.end <= last.start + 1)
        .sort((a, b) => a.end - b.end).at(-1);
      if (answerTail && last.start - answerTail.end < 200 * scale) {
        const answerStart = Math.max(answerTail.start, answerTail.end - 120 * scale);
        if (canvas.height - answerStart < fullPageCapacity) protect(answerStart, canvas.height);
      }
    }
    // Adjacent blocks can meet at a fractional canvas pixel. Rounding the
    // preceding end up and the following start down would erase their shared
    // break and join otherwise page-sized answers into an oversized range.
    // Keep the preceding block's final border pixel on its original page.
    const pixelRanges = protectedRanges.map(box => ({
      start: protectedRanges.some(previous => Math.abs(previous.end - box.start) < .001)
        ? Math.ceil(box.start) : Math.floor(box.start),
      end: Math.ceil(box.end),
    }));
    return [...points]
      .filter(point => point > 0 && point <= canvas.height && !pixelRanges.some(box => point > box.start && point < box.end))
      .sort((left, right) => left - right);
  }

  async function buildFeedbackPdf() {
    if (!root.html2canvas || !root.jspdf?.jsPDF) throw new Error("The PDF tools could not be loaded. Reload the page and try again.");
    await document.fonts?.load?.("32px Bravura");
    await document.fonts?.ready;
    if (!feedbackTickSvgSource) {
      const response = await root.fetch(new URL("../ui-icons/prtick.svg", root.location.href));
      if (!response.ok) throw new Error("The answer tick could not be loaded. Reload the page and try again.");
      feedbackTickSvgSource = await response.text();
    }
    const images = [...document.querySelectorAll(".results-summary img, [data-results-paper] img")];
    await Promise.all(images.map(image => image.complete && image.decode ? image.decode().catch(() => {}) : Promise.resolve()));
    const pages = [$(".results-summary"), ...document.querySelectorAll("[data-results-paper] .marked-question-card")].filter(Boolean);
    if (!pages.length) throw new Error("The feedback could not be prepared.");
    const { jsPDF } = root.jspdf;
    const pdf = new jsPDF({ unit: "mm", format: "a4", orientation: "portrait" });
    pdf.setProperties({ title: `${paper.title} Feedback`, subject: "Digital Past Paper feedback" });
    const top = 8;
    const bottom = 289;
    const maxWidth = 194;
    const maxHeight = bottom - top;
    const gap = 5;
    let cursorY = top;
    let pageHasContent = false;
    const captureScale = 2.5;
    for (let index = 0; index < pages.length; index += 1) {
      const page = pages[index];
      const canvas = await root.html2canvas(page, {
        scale: captureScale,
        backgroundColor: "#fff",
        useCORS: true,
        logging: false,
        onclone: clonedDocument => outlineFeedbackBravuraGlyphs(clonedDocument),
      });
      const breakpoints = feedbackPdfBreakpoints(page, canvas, Math.floor(maxHeight * canvas.width / maxWidth), captureScale);
      // Some score-only answer rows are hidden in the captured view. Select
      // the first visible block by its position, including a shared score.
      let firstContent = [...page.querySelectorAll(".subquestion, [data-shared-notation] > svg")]
        .filter(node => node.getBoundingClientRect().height > 0)
        .sort((a, b) => a.getBoundingClientRect().top - b.getBoundingClientRect().top)[0];
      if (firstContent?.tagName.toLowerCase() !== "svg" && firstContent?.querySelector("svg")) firstContent = firstContent.querySelector("svg");
      const firstContentTop = firstContent ? (firstContent.getBoundingClientRect().top - page.getBoundingClientRect().top) * captureScale : 0;
      const firstContentEnd = firstContent ? breakpoints.find(point => point > firstContentTop + 80) || 0 : 0;
      // Do not leave just a new question's heading/introduction at the bottom
      // of the previous page when its first answer/staff needs a fresh page.
      if (pageHasContent && cursorY > top && firstContentEnd > (bottom - cursorY) * canvas.width / maxWidth) {
        pdf.addPage();
        cursorY = top;
      }
      let sourceY = 0;
      while (sourceY < canvas.height) {
        let availableHeight = bottom - cursorY;
        if (pageHasContent && availableHeight < 60) {
          pdf.addPage();
          cursorY = top;
          availableHeight = maxHeight;
        }
        const pixelCapacity = Math.max(1, Math.floor(availableHeight * canvas.width / maxWidth));
        let sourceEnd = Math.min(canvas.height, sourceY + pixelCapacity);
        if (sourceEnd < canvas.height) {
          const safeBreak = breakpoints.filter(point => point > sourceY + 1 && point <= sourceEnd).at(-1);
          if (safeBreak) sourceEnd = safeBreak;
        }
        const sliceHeight = Math.max(1, sourceEnd - sourceY);
        const slice = document.createElement("canvas");
        slice.width = canvas.width;
        slice.height = sliceHeight;
        slice.getContext("2d").drawImage(canvas, 0, sourceY, canvas.width, sliceHeight, 0, 0, canvas.width, sliceHeight);
        const renderedHeight = sliceHeight * maxWidth / canvas.width;
        pdf.addImage(slice.toDataURL("image/png"), "PNG", (210 - maxWidth) / 2, cursorY, maxWidth, renderedHeight, undefined, "FAST");
        cursorY += renderedHeight + gap;
        sourceY = sourceEnd;
        pageHasContent = true;
        if (sourceY < canvas.height) {
          pdf.addPage();
          cursorY = top;
        }
      }
    }
    return pdf.output("blob");
  }

  async function shareFeedback(name) {
    if (engine?.attempt?.status !== "submitted" || !engine.attempt.result) return;
    let pdfWindow;
    try {
      pdfWindow = createFeedbackPdfWindow();
    } catch (error) {
      root.alert(error.message);
      return;
    }
    const nameLine = $("[data-feedback-export-name]");
    nameLine.textContent = name ? `Name: ${name}` : "";
    nameLine.hidden = !name;
    feedbackPrintState = { showingAllQuestions, currentQuestion: engine.attempt.currentQuestion };
    showingAllQuestions = true;
    renderResultsPaper();
    document.body.dataset.pdfFeedback = "true";
    try {
      await new Promise(resolve => root.requestAnimationFrame(() => root.requestAnimationFrame(resolve)));
      const blob = await buildFeedbackPdf();
      const url = URL.createObjectURL(blob);
      restoreAfterFeedbackPrint();
      pdfWindow.location.replace(url);
      root.setTimeout(() => URL.revokeObjectURL(url), 300000);
    } catch (error) {
      restoreAfterFeedbackPrint();
      pdfWindow.document.title = "Feedback PDF unavailable";
      pdfWindow.document.body.innerHTML = `<p style="font: 16px system-ui; padding: 24px;">${escapeHtml(error.message)}</p>`;
    }
  }

  function paperShareUrl() {
    const url = new URL("./digitalquestionpapers.html", root.location.href);
    if (!paper) {
      const requestedLevel = new URLSearchParams(root.location.search).get("level");
      url.searchParams.set("level", ["N5", "H", "AH"].includes(requestedLevel) ? requestedLevel : "N5");
      return url.toString();
    }
    url.searchParams.set("paper", paper.id);
    if (!showingAllQuestions && engine?.attempt) {
      const question = currentQuestion();
      if (question) url.searchParams.set("question", question.id);
    }
    return url.toString();
  }

  function openQrOverlay() {
    const overlay = $("[data-qr-overlay]");
    const shareUrl = paperShareUrl();
    const title = paper ? `${paper.level} • ${paper.year}` : $("[data-chooser-level]").textContent;
    $("[data-qr-title]").textContent = title;
    const image = $("[data-qr-image]");
    image.src = `https://api.qrserver.com/v1/create-qr-code/?size=560x560&data=${encodeURIComponent(shareUrl)}`;
    image.alt = `QR code linking to ${title}`;
    overlay.classList.add("is-open");
    overlay.querySelector("[data-close-qr]")?.focus();
  }

  function closeQrOverlay() { $("[data-qr-overlay]")?.classList.remove("is-open"); }

  async function copyPaperLink() {
    const button = $("[data-copy-paper-link]");
    try {
      await navigator.clipboard.writeText(paperShareUrl());
      button.textContent = "Copied";
      root.setTimeout(() => { button.textContent = "Copy Link"; }, 1800);
    } catch {
      button.textContent = "Copy unavailable";
    }
  }

  function acceptedAnswerDisplay(subquestion) {
    const answer = subquestion.answerDisplay
      || (subquestion.answers?.length ? subquestion.answers.join(" and ") : subquestion.answer)
      || "See the marking guidance";
    if (subquestion.type === "notation-choice") return answer;
    return String(answer).replace(/^(\s*)([a-z])/, (_, spacing, letter) => `${spacing}${letter.toUpperCase()}`);
  }

  function correctAnswerLabel(subquestion) {
    const answer = acceptedAnswerDisplay(subquestion);
    const hasMultipleAnswers = Number(subquestion.requiredResponses || 0) > 1
      || Array.isArray(subquestion.answers) && subquestion.answers.length > 1
      || /[,;]|\bor\b|\band\b/i.test(answer);
    return hasMultipleAnswers ? "Correct answers:" : "Correct answer:";
  }

  function partResult(id) {
    return engine.attempt.result.questionBreakdown.flatMap(question => question.parts).find(part => part.id === id);
  }

  function structuredAnswerGuidanceMarkup(subquestion, part) {
    if (!subquestion.finalAnswerField || !subquestion.headings?.length) return "";
    const isComparison = subquestion.markingProfile === "advanced-comparison";
    const isConclusion = subquestion.markingProfile === "advanced-conclusion";
    const guidanceHeadings = isComparison ? [
      { id: "similarities", label: "Similarities", concepts: subquestion.similarities || [] },
      { id: "differences", label: "Differences", concepts: subquestion.differences || [] },
    ] : subquestion.headings;
    const headings = guidanceHeadings.map(heading => {
      const awardedConcepts = new Set(isComparison ? Object.values(part?.matchedConcepts || {}).flat() : part?.matchedConcepts?.[heading.id] || []);
      const concepts = (heading.concepts || []).map(concept => `<li${awardedConcepts.has(concept.label) ? ' class="is-awarded-concept"' : ""}>${escapeHtml(concept.label)}</li>`).join("");
      return `<section><h4>${escapeHtml(heading.label)}</h4><ul>${concepts}</ul>${heading.additionalGuidance?.length ? `<div class="q8-heading-guidance"><b>Additional guidance</b><ul>${heading.additionalGuidance.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></div>` : ""}</section>`;
    }).join("");
    const generalGuidance = subquestion.additionalGuidance?.length ? `<section class="q8-general-guidance"><h4>Additional guidance</h4><ul>${subquestion.additionalGuidance.map(item => `<li>${escapeHtml(item)}</li>`).join("")}</ul></section>` : "";
    const comparisonRule = (isComparison || isConclusion) && subquestion.answerDisplay ? `<p class="q8-comparison-marking-rule">${escapeHtml(subquestion.answerDisplay)}</p>` : "";
    const conclusionFeedback = isConclusion ? `<section class="q8-conclusion-feedback"><h4>Period and justification</h4><ul>${(part?.conclusionDetails || [{excerpt:1},{excerpt:2}]).map(detail => `<li${detail.justified ? ' class="is-awarded-concept"' : ''}><b>Excerpt ${detail.excerpt}:</b> ${!detail.identified ? 'The correct period has not been identified.' : detail.justified ? `Correct period, supported by ${escapeHtml(detail.reasons.join('; '))}.` : 'Correct period identified, but no accepted justification was found in your conclusion. State the supporting musical evidence in this part.'}</li>`).join('')}</ul></section><div class="q8-feedback-answer-bank" role="group" aria-label="Accepted period justifications">${(subquestion.styles || []).map((style,index) => `<section><h4>Excerpt ${index+1}: ${escapeHtml(style.answers.join(' / '))}</h4><ul>${(style.reasonConcepts || []).map(reason => `<li${part?.conclusionDetails?.[index]?.reasons?.includes(reason.label) ? ' class="is-awarded-concept"' : ''}>${escapeHtml(reason.label)}</li>`).join('')}</ul></section>`).join('')}</div>` : '';
    return `${comparisonRule}${conclusionFeedback}<div class="q8-feedback-answer-bank" role="group" aria-label="Answers and additional guidance from the marking instructions">${headings}${generalGuidance}</div>`;
  }

  function highlightedFinalAnswerMarkup(value, matchedEvidence = {}) {
    const source = String(value || "");
    const ranges = Object.values(matchedEvidence).flat().sort((left, right) => left.start - right.start || left.end - right.end);
    let cursor = 0;
    let markup = "";
    ranges.forEach(range => {
      if (range.start < cursor || range.end <= range.start) return;
      markup += escapeHtml(source.slice(cursor, range.start));
      markup += `<mark class="q8-earned-answer">${escapeHtml(source.slice(range.start, range.end))}</mark>`;
      cursor = range.end;
    });
    return markup + escapeHtml(source.slice(cursor));
  }

  function feedbackRegionLabel(subquestion, siblings = []) {
    const match = String(subquestion.id || "").match(/^q(\d+)([a-z]?)(\d+|i{1,3}|iv|v|vi)?$/i);
    const label = String(subquestion.label || "").trim();
    if (!match) return `Feedback for ${label || subquestion.prompt || "this answer"}`;
    const parent = match[2] && match[3] && /^\((?:i{1,3}|iv|v|vi)\)$/i.test(label) ? ` (${match[2]})` : "";
    const index = siblings.findIndex(part => part.id === subquestion.id);
    const answer = !label && siblings.length > 1 && index >= 0 ? `, answer ${index + 1}` : "";
    return `Feedback for Question ${match[1]}${parent}${label ? ` ${label}` : answer}`;
  }

  function inlineFeedbackMarkup(subquestion, part, siblings = []) {
    const hasPartialCredit = part.status === "partial" || part.marks > 0 && part.marks < part.maxMarks;
    const state = part.status === "correct" ? "correct" : hasPartialCredit ? "partial" : part.status === "unanswered" ? "unanswered" : "incorrect";
    const title = state === "correct" ? "Correct" : state === "partial" ? "Partially correct" : state === "unanswered" ? "Not answered" : "Incorrect";
    const headingLabels = Object.fromEntries((subquestion.headings || []).map(heading => [heading.id, heading.label]));
    const headingCap = subquestion.maxMarksPerHeading || 2;
    const cappedHeadings = subquestion.markingProfile ? [] : Object.entries(part.validConceptCounts || {}).filter(([, count]) => count > headingCap);
    const capExplanation = subquestion.conceptsPerMark && part.marks < part.maxMarks
      ? `<p class="q8-heading-cap-explanation">Two valid concepts earn one mark in each category.</p>`
      : part.marks < part.maxMarks && cappedHeadings.length
      ? `<p class="q8-heading-cap-explanation">${cappedHeadings.map(([heading, count]) => `You identified ${count} valid concepts under <b>${escapeHtml(headingLabels[heading] || heading)}</b>, but only ${headingCap} marks can be awarded from one heading.`).join(" ")} To achieve full marks, include valid concepts from at least 3 headings.</p>`
      : "";
    const sentenceNotice = ["advanced-comparison", "advanced-conclusion"].includes(subquestion.markingProfile)
      ? `<p class="q8-heading-cap-explanation">Answers to Question 6(b) must be written in <strong>sentences</strong>.</p>`
      : "";
    const additionalAnswerExplanation = part.additionalAnswers
      ? `<p class="q8-heading-cap-explanation">${part.additionalAnswers} ${part.additionalAnswers === 1 ? "mark was" : "marks were"} deducted for additional ${part.additionalAnswers === 1 ? "answer" : "answers"} beyond the number requested.</p>`
      : "";
    return `<aside class="inline-answer-feedback is-${state}" data-feedback-for="${escapeHtml(subquestion.id)}" aria-label="${escapeHtml(`${feedbackRegionLabel(subquestion, siblings)}: ${title}`)}">
      <div class="inline-feedback-heading"><strong>${title}</strong></div>
      ${sentenceNotice}
      ${capExplanation}
      ${additionalAnswerExplanation}
      ${part.status !== "correct" && !subquestion.finalAnswerField ? `<p class="inline-correct-answer"><b>${correctAnswerLabel(subquestion)}</b> ${escapeHtml(acceptedAnswerDisplay(subquestion))}</p>` : ""}
      ${subquestion.definition ? `<p class="inline-answer-definition">${escapeHtml(subquestion.definition)}</p>` : ""}
      ${structuredAnswerGuidanceMarkup(subquestion, part)}
    </aside>`;
  }

  function applyReviewMark(markElement, awardedMarks, availableMarks) {
    if (!markElement) return;
    const fullMarks = awardedMarks >= availableMarks;
    markElement.classList.add(fullMarks ? "is-awarded" : "is-not-awarded");
    const accessibleLabel = fullMarks
      ? `${awardedMarks} out of ${availableMarks} marks awarded`
      : `Maximum ${availableMarks} marks; ${awardedMarks} awarded`;
    markElement.removeAttribute("aria-label");
    markElement.innerHTML = `<span class="visually-hidden">${accessibleLabel}</span>${fullMarks ? `<span aria-hidden="true">${availableMarks}</span>` : `<span class="unachieved-maximum-mark" aria-hidden="true">${availableMarks}</span>${availableMarks > 1 && awardedMarks > 0 ? `<span class="subquestion-earned-marks" aria-hidden="true">${awardedMarks}</span>` : ""}`}`;
  }

  function uncreditedConceptMarkup(value) {
    return String(value || "").split(/(\s*(?:[,;•]|\band\b)\s*)/gi).map(part => {
      if (!part || /^\s*$/.test(part) || /^\s*(?:[,;•]|and)\s*$/i.test(part)) return escapeHtml(part);
      return `<span class="higher-concept-answer-incorrect">${escapeHtml(part)}</span>`;
    }).join("");
  }

  function conceptLineFeedbackMarkup(value, correctRanges) {
    const source = String(value || "");
    const ranges = [...correctRanges].sort((left, right) => left.start - right.start || left.end - right.end);
    let cursor = 0;
    let markup = "";
    ranges.forEach(range => {
      const start = Math.max(cursor, Number(range.start || 0));
      const end = Math.min(source.length, Number(range.end || 0));
      if (end <= start) return;
      markup += uncreditedConceptMarkup(source.slice(cursor, start));
      markup += `<span class="higher-concept-answer-correct">${escapeHtml(source.slice(start, end))}</span>`;
      cursor = end;
    });
    return markup + uncreditedConceptMarkup(source.slice(cursor));
  }

  function applyConceptLineMarking(section, part) {
    const fields = [...section.querySelectorAll("[data-concept-line]")];
    const correctEvidence = part.correctEvidence || part.matchedEvidence || [];
    let offset = 0;
    fields.forEach(field => {
      const value = String(field.value || "");
      const fieldStart = offset;
      const fieldEnd = fieldStart + value.length;
      const hasAnswer = Boolean(value.trim());
      const localCorrectRanges = correctEvidence.filter(evidence => evidence.start >= fieldStart && evidence.end <= fieldEnd)
        .map(evidence => ({ start: evidence.start - fieldStart, end: evidence.end - fieldStart }));
      const line = field.closest(".higher-concept-line");
      line?.querySelector(".higher-concept-line-marked-answer")?.remove();
      field.classList.remove("is-user-correct", "is-user-incorrect");
      field.classList.toggle("has-marked-concept-answer", hasAnswer);
      if (hasAnswer && line) {
        const markedAnswer = document.createElement("span");
        markedAnswer.className = "higher-concept-line-marked-answer";
        markedAnswer.setAttribute("aria-hidden", "true");
        markedAnswer.innerHTML = conceptLineFeedbackMarkup(value, localCorrectRanges);
        field.after(markedAnswer);
      }
      offset = fieldEnd + 1;
    });
  }

  function applyInlineMarking(card, subquestion, part) {
    const section = card.querySelector(`[data-subquestion="${subquestion.id}"]`);
    if (!section || !part) return;
    const partMark = card.querySelector(`[data-subquestion-mark="${subquestion.id}"]`);
    applyReviewMark(partMark, part.marks, part.maxMarks);
    const expected = new Set((subquestion.type === "checkbox" ? subquestion.answers : [subquestion.answer]).filter(Boolean).map(String));
    const chosen = new Set((Array.isArray(part.value) ? part.value : [part.value]).filter(value => value !== undefined && value !== null && String(value) !== "").map(String));

    if (["radio", "checkbox"].includes(subquestion.type)) {
      section.querySelectorAll(".answer-option").forEach(option => {
        const input = option.querySelector("input");
        const isExpected = expected.has(input.value);
        const isChosen = chosen.has(input.value);
        option.classList.toggle("is-review-correct", isChosen && isExpected);
        option.classList.toggle("is-user-correct", isChosen && isExpected);
        option.classList.toggle("is-user-incorrect", isChosen && !isExpected);
      });
    } else if (subquestion.type === "concept-lines") {
      applyConceptLineMarking(section, part);
    } else if (subquestion.type === "short-text") {
      const fields = section.querySelectorAll("input, textarea");
      fields.forEach(field => {
        field.classList.add(part.status === "correct" ? "is-user-correct" : part.status === "unanswered" ? "is-unanswered" : "is-user-incorrect");
      });
    } else if (subquestion.type === "comparison-grid") {
      const correct = new Set(part.selectedCorrect || []);
      section.querySelectorAll('[data-comparison-column="c"]').forEach(input => {
        const cell = input.closest("td");
        if (!input.checked) return;
        cell.classList.add(correct.has(root.ExamMarking.normalise(input.value)) ? "is-user-correct" : "is-user-incorrect");
      });
      section.querySelectorAll('[data-comparison-column="a"], [data-comparison-column="b"]').forEach(input => input.closest("td")?.classList.add("is-unmarked-rough-work"));
    } else if (subquestion.type === "lyric-placement") {
      const correctLines = new Set(Object.values(part.matchedLines || {}).flat().map(String));
      section.querySelectorAll("[data-lyric-line]").forEach(input => {
        if (!input.value.trim()) return;
        input.classList.add(correctLines.has(input.dataset.lyricLine) ? "is-user-correct" : "is-user-incorrect");
      });
    } else if (subquestion.type === "notation-choice") {
      section.querySelectorAll(".notation-tool-button").forEach(button => {
        const expectedValues = subquestion.acceptedAnswers || [subquestion.answer];
        const isExpected = expectedValues.map(String).includes(button.dataset.value);
        const hasAnswer = Boolean(String(part.value || "").replace(/_/g, "").replace(/,/g, ""));
        const representsPlacementTool = ["note-entry", "repeat-sign", "barline-entry"].includes(subquestion.notationTool);
        button.classList.toggle("is-review-correct", isExpected || representsPlacementTool && part.status === "unanswered");
        button.classList.toggle("is-user-correct", part.status === "correct" && (isExpected || representsPlacementTool));
        button.classList.toggle("is-user-incorrect", hasAnswer && part.status !== "correct" && (button.classList.contains("is-selected") || representsPlacementTool));
      });
    } else if (subquestion.type === "structured-review") {
      const finalAnswer = section.querySelector(".q8-final-answer-lines") || section.querySelector('[data-heading="final"]');
      if (finalAnswer) {
        const markedAnswer = document.createElement("div");
        markedAnswer.id = `${subquestion.id}-final`;
        markedAnswer.className = "q8-marked-final-answer";
        markedAnswer.setAttribute("role", "textbox");
        markedAnswer.setAttribute("aria-readonly", "true");
        markedAnswer.setAttribute("aria-label", "Marked final answer. Words which earned marks are green.");
        markedAnswer.innerHTML = highlightedFinalAnswerMarkup(part.value?.final, part.matchedEvidence);
        finalAnswer.replaceWith(markedAnswer);
      }
      section.querySelector(".q8-rough-work")?.classList.add("is-unmarked-rough-work");
    }

    section.querySelectorAll("input, textarea, button").forEach(control => {
      if (control.matches("input, button")) control.disabled = true;
      if (control.matches("textarea")) control.readOnly = true;
      control.removeAttribute("aria-keyshortcuts");
    });
    const siblings = paper.questions.find(question => question.subquestions.some(item => item.id === subquestion.id))?.subquestions || [];
    section.insertAdjacentHTML("beforeend", inlineFeedbackMarkup(subquestion, part, siblings));
  }

  function arrangeMusicGuideFeedback(card, question) {
    if (!["music-guide", "music-guide-vertical"].includes(question.layout)) return;
    const feedbackItems = Array.from(card.querySelectorAll(".inline-answer-feedback"));
    if (!feedbackItems.length) return;
    const feedbackList = document.createElement("div");
    feedbackList.className = "music-guide-feedback-list";
    feedbackItems.forEach((feedback, index) => {
      const number = document.createElement("span");
      number.className = "music-guide-feedback-number";
      number.textContent = question.subquestions[index]?.label || String(index + 1);
      feedback.querySelector(".inline-feedback-heading")?.prepend(number);
      feedbackList.append(feedback);
    });
    card.querySelector(".subquestions")?.append(feedbackList);
  }

  function fitMarkedAnswerContent(card) {
    const fit = () => {
      if (!card.isConnected || !card.getBoundingClientRect().width) return;
      // Read-only rough work and reasons must retain every line in the marked
      // paper and its captured PDF. Preserve the source height until needed.
      card.querySelectorAll('textarea').forEach(field => {
        if (!field.value || field.scrollHeight <= field.clientHeight + 1) return;
        const style = root.getComputedStyle(field);
        const height = Math.ceil(field.scrollHeight + parseFloat(style.borderTopWidth || 0) + parseFloat(style.borderBottomWidth || 0));
        field.style.height = `${height}px`;
        field.style.overflowY = 'hidden';
        field.scrollTop = 0;
        if (style.position === 'absolute') field.parentElement.style.minHeight = `${height}px`;
      });
      // A marked concept line already has per-phrase colours. Let that visible
      // overlay wrap instead of cutting off the tail of a longer response.
      card.querySelectorAll('.higher-concept-line-marked-answer').forEach(answer => {
        if (answer.scrollWidth <= answer.clientWidth + 1) return;
        const field = answer.previousElementSibling;
        const height = field.offsetHeight;
        Object.assign(answer.style, { position: 'relative', inset: 'auto', display: 'block', minHeight: `${height}px`, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', overflow: 'visible' });
        Object.assign(field.style, { position: 'absolute', inset: '0' });
      });
      card.querySelectorAll('input.text-answer:not(.has-marked-concept-answer)').forEach(field => {
        if (!field.value || field.scrollWidth <= field.clientWidth + 1 || field.closest('svg')) return;
        const style = root.getComputedStyle(field), bounds = { width: field.offsetWidth, height: field.offsetHeight };
        const answer = document.createElement('div');
        answer.className = `${field.className} paper-expanded-answer`;
        answer.id = field.id;
        answer.setAttribute('role', 'textbox');
        answer.setAttribute('aria-readonly', 'true');
        answer.tabIndex = 0;
        const label = field.getAttribute('aria-label') || [...field.labels || []].map(label => label.textContent.trim()).join(' ');
        if (label) answer.setAttribute('aria-label', label);
        for (const attribute of ['aria-describedby', 'data-numbered-answer-line', 'data-lyric-line']) {
          if (field.hasAttribute(attribute)) answer.setAttribute(attribute, field.getAttribute(attribute));
        }
        for (const property of ['font', 'color', '-webkit-text-fill-color', 'padding', 'border', 'border-radius', 'box-shadow', 'text-align', 'background-color', 'margin']) answer.style.setProperty(property, style.getPropertyValue(property));
        Object.assign(answer.style, { display: 'inline-block', verticalAlign: 'bottom', width: `${bounds.width}px`, maxWidth: '100%', height: 'auto', minHeight: `${bounds.height}px`, whiteSpace: 'pre-wrap', overflowWrap: 'anywhere', overflow: 'visible', boxSizing: 'border-box' });
        answer.textContent = field.value;
        field.replaceWith(answer);
      });
    };
    fit();
    // Results are first assembled while their screen is hidden. Font loading
    // can also change the last line, so remeasure after both become visible.
    root.requestAnimationFrame(fit);
    document.fonts?.ready?.then(fit);
  }

  function applyPracticeQuestionMarking(card, question, questionResult) {
    if (!questionResult) return;
    applyReviewMark(card.querySelector(`[data-question-total-mark="${question.id}"]`), questionResult.marks, questionResult.maxMarks);
    question.subquestions.forEach(subquestion => {
      applyInlineMarking(card, subquestion, questionResult.parts.find(part => part.id === subquestion.id));
    });
    arrangeMusicGuideFeedback(card, question);
    fitMarkedAnswerContent(card);
  }

  function renderResultsPaper() {
    const resultsPaper = $("[data-results-paper]");
    destroyAudioPlayers();
    document.body.dataset.resultsLayout = showingAllQuestions ? "all" : "single";
    $(".exam-header-audio").hidden = showingAllQuestions;
    const questions = showingAllQuestions ? paper.questions : [currentQuestion()];
    resultsPaper.innerHTML = questions.map(question => {
      return `<article class="question-card all-question-card marked-question-card ${showingAllQuestions ? "" : "has-paper-actions"} question-${question.id} paper-level-${String(paper.levelCode || "").toLocaleLowerCase("en-GB")} ${question.layout ? `question-layout-${question.layout}` : ""}" data-paper-id="${escapeHtml(paper.id)}" data-result-question="${question.id}">
        ${showingAllQuestions ? "<div data-result-question-audio></div>" : ""}
        <div class="paper-marks-heading">MARKS</div>
        ${paperOpeningMarkup(question)}
        <header class="question-header"><h2>Question ${question.number}</h2></header>
        <div class="question-intro">${questionIntroMarkup(question)}</div>
        <div class="subquestions">${questionPartsMarkup(question)}</div>
        <div class="question-outro">${questionOutroMarkup(question)}</div>
        ${showingAllQuestions ? "" : `<div class="question-review-footer">
          <button class="button button-primary question-navigation-button" type="button" data-result-bottom-previous aria-label="Previous question" title="Previous"><img class="question-nav-arrow is-previous" src="../ui-icons/next.svg" alt="" aria-hidden="true" /></button>
          <button class="button button-primary question-navigation-button" type="button" data-result-bottom-next aria-label="Next question" title="Next"><img class="question-nav-arrow" src="../ui-icons/next.svg" alt="" aria-hidden="true" /></button>
        </div>`}
      </article>`;
    }).join("");

    questions.forEach(question => {
      const card = resultsPaper.querySelector(`[data-result-question="${question.id}"]`);
      const questionResult = engine.attempt.result.questionBreakdown.find(item => item.id === question.id);
      applyReviewMark(card.querySelector(`[data-question-total-mark="${question.id}"]`), questionResult.marks, questionResult.maxMarks);
      const sharedNotation = card.querySelector("[data-shared-notation]");
      const notationReview = Object.fromEntries(question.subquestions.filter(subquestion => subquestion.type === "notation-choice" || subquestion.answerInScore).map(subquestion => [subquestion.id, partResult(subquestion.id)?.status]));
      if (sharedNotation && root.ExamNotation?.renderSharedScore) root.ExamNotation.renderSharedScore(sharedNotation, question, engine.attempt.answers, null, notationReview);
      renderPartScores(card, question, null, notationReview);
      const feedbackAudio = card.querySelector("[data-result-question-audio]");
      if (feedbackAudio) allQuestionAudioPlayers.push(createRecoverableAudioPlayer(feedbackAudio, { clips: question.audio.clips }));
      if (!showingAllQuestions) audioPlayer = createRecoverableAudioPlayer($("[data-audio-container]"), { clips: question.audio.clips });
      question.subquestions.forEach(subquestion => {
        const section = card.querySelector(`[data-subquestion="${subquestion.id}"]`);
        if (subquestion.type === "notation-choice") {
          const notationContainer = section?.querySelector("[data-notation-container]");
          if (notationContainer) root.ExamNotation?.render(notationContainer, subquestion, engine.attempt.answers[subquestion.id], () => {});
        }
        applyInlineMarking(card, subquestion, partResult(subquestion.id));
      });
      arrangeMusicGuideFeedback(card, question);
      fitMarkedAnswerContent(card);
      if (!showingAllQuestions) {
        const questionIndex = paper.questions.findIndex(item => item.id === question.id);
        const bottomPrevious = card.querySelector("[data-result-bottom-previous]");
        const bottomNext = card.querySelector("[data-result-bottom-next]");
        bottomPrevious.disabled = questionIndex <= 0;
        bottomNext.disabled = questionIndex >= paper.questions.length - 1;
        bottomPrevious.addEventListener("click", () => showResultQuestion(paper.questions[questionIndex - 1].id));
        bottomNext.addEventListener("click", () => showResultQuestion(paper.questions[questionIndex + 1].id));
      }
    });
  }

  function updateResultNavigation() {
    const questions = engine.visibleQuestions();
    const index = questions.findIndex(question => question.id === engine.attempt.currentQuestion);
    const previous = $("[data-previous-question]");
    const next = $("[data-next-question]");
    previous.hidden = false;
    previous.classList.remove("is-invisible-placeholder");
    next.hidden = false;
    previous.disabled = showingAllQuestions || index <= 0;
    next.disabled = showingAllQuestions || index < 0 || index >= questions.length - 1;
    $(".question-submit-button").hidden = true;
    $(".exam-question-navigation").classList.remove("is-submit-visible");
  }

  function showResultQuestion(questionId) {
    if (!paper.questions.some(question => question.id === questionId)) return;
    showingAllQuestions = false;
    engine.attempt.currentQuestion = questionId;
    root.ExamStorage.saveSubmitted(paper.id, engine.attempt);
    closePaperMenus();
    renderResultsPaper();
    renderNavigator();
    updateResultNavigation();
    $("[data-results-paper]").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function showAllResultQuestions() {
    showingAllQuestions = true;
    closePaperMenus();
    renderResultsPaper();
    renderNavigator();
    updateResultNavigation();
    $("[data-results-paper]").scrollIntoView({ behavior: "smooth", block: "start" });
  }

  function renderResults() {
    root.ExamAudio.pauseAll();
    destroyAudioPlayers();
    const result = engine.attempt.result;
    const paperToolbar = $(".exam-paper-toolbar");
    if (paperToolbar) $(".exam-primary-shell").prepend(paperToolbar);
    $("[data-single-question-area]").querySelectorAll("[data-paper-opening], [data-question-intro], [data-subquestions], [data-question-outro]").forEach(container => { container.innerHTML = ""; });
    $("[data-all-questions-area]").innerHTML = "";
    showingAllQuestions = false;
    engine.attempt.currentQuestion = paper.questions[0].id;
    renderToolbarStats();
    $("[data-results-score]").innerHTML = `<span class="result-score-earned">${result.score}</span><span class="result-score-total">/${paper.totalMarks}</span>`;
    const performanceClass = result.score < 15 ? "is-score-low" : result.score < 20 ? "is-score-middle" : "is-score-high";
    const scoreStat = $("[data-results-score-stat]");
    scoreStat.classList.remove("is-score-low", "is-score-middle", "is-score-high");
    scoreStat.classList.add(performanceClass);
    $("[data-results-percentage]").textContent = `${result.percentage}%`;
    const completedAt = new Date(engine.attempt.completedAt);
    $("[data-feedback-export-date]").textContent = `Completed: ${new Intl.DateTimeFormat("en-GB", { day: "2-digit", month: "2-digit", year: "numeric" }).format(completedAt)}`;
    $("[data-feedback-export-time]").textContent = `• ${new Intl.DateTimeFormat("en-GB", { hour: "2-digit", minute: "2-digit", hour12: false }).format(completedAt)}`;
    const questionPerformance = result.questionBreakdown.map(questionResult => ({
      ...questionResult,
      number: paper.questions.find(question => question.id === questionResult.id)?.number || questionResult.id,
      percentage: questionResult.maxMarks ? questionResult.marks / questionResult.maxMarks : 0,
    }));
    const formatQuestions = questions => questions.map(question => `<span class="result-question-entry"><span>Question ${escapeHtml(question.number)}</span><span class="result-question-marks">${question.marks} of ${question.maxMarks} marks</span></span>`).join("");
    if (result.score === 0) {
      const emptyQuestion = '<span class="result-question-entry"><span>–</span><span class="result-question-marks" aria-hidden="true">&nbsp;</span></span>';
      $("[data-results-best-question]").innerHTML = emptyQuestion;
      $("[data-results-weakest-question]").innerHTML = emptyQuestion;
    } else {
      const bestPercentage = Math.max(...questionPerformance.map(question => question.percentage));
      const weakestPercentage = Math.min(...questionPerformance.map(question => question.percentage));
      const bestQuestion = questionPerformance
        .filter(question => question.percentage === bestPercentage)
        .reduce((best, question) => question.maxMarks > best.maxMarks ? question : best);
      $("[data-results-best-question]").innerHTML = formatQuestions([bestQuestion]);
      const weakestQuestion = questionPerformance
        .filter(question => question.percentage === weakestPercentage)
        .reduce((weakest, question) => question.maxMarks > weakest.maxMarks ? question : weakest);
      $("[data-results-weakest-question]").innerHTML = formatQuestions([weakestQuestion]);
    }
    const markingInstructions = $("[data-marking-instructions]");
    markingInstructions.hidden = !paper.markingInstructionsPath;
    if (paper.markingInstructionsPath) markingInstructions.href = paper.markingInstructionsPath;
    $("[data-review-notice]").hidden = !result.reviewMarks;
    renderResultsPaper();
    renderNavigator();
    updateResultNavigation();
    showScreen("results");
  }

  function focusMarkingSummary(heading, summary) {
    if (!heading) return;
    heading.tabIndex = -1;
    heading.setAttribute("aria-label", summary);
    // Run after the closing dialog restores its old opener.
    root.requestAnimationFrame(() => {
      if (!heading.isConnected || heading.closest("[hidden]")) return;
      heading.focus({ preventScroll: true });
      heading.scrollIntoView({ block: "center", behavior: "instant" });
    });
  }

  function onEngineChange(attempt, reason) {
    if (reason === "submit" || reason === "restore-submit") {
      const savedQuestion = attempt.currentQuestion;
      renderResults();
      if (reason === "submit") {
        root.ExamStorage.saveSubmitted(paper.id, attempt);
        focusMarkingSummary($("[data-screen='results'] .results-heading"), `Results. Score ${attempt.result.score} of ${attempt.result.totalMarks} marks.`);
      }
      if (reason === "restore-submit" && root.performance?.getEntriesByType?.("navigation")?.[0]?.type === "reload") {
        showResultQuestion(savedQuestion);
      }
      return;
    }
    if (reason === "timer") {
      renderToolbarStats();
      return;
    }
    if (reason === "exam-unlock") {
      renderNavigator();
      return;
    }
    if (reason === "exam-begin") {
      document.body.dataset.examActive = "true";
      renderToolbarStats();
      renderCustomiseMenu();
      showScreen("exam");
      renderAllQuestions();
      return;
    }
    if (reason === "mode-practice") {
      document.body.dataset.examActive = "false";
      renderToolbarStats();
      renderCustomiseMenu();
      renderQuestion();
      return;
    }
    if (reason === "timer-setting") {
      renderToolbarStats();
      renderCustomiseMenu();
      return;
    }
    if (reason === "audio-limit") {
      renderCustomiseMenu();
      if (showingAllQuestions) renderAllQuestions();
      else renderQuestion();
      return;
    }
    if (reason === "questions-locked") {
      renderCustomiseMenu();
      if (showingAllQuestions && canShowAllQuestions()) renderAllQuestions();
      else renderQuestion();
      return;
    }
    if (reason === "answer") {
      renderNavigator();
      updateQuestionActions();
      return;
    }
    if (reason === "audio") {
      renderNavigator();
      return;
    }
    renderToolbarStats();
    showScreen("exam");
    renderQuestion();
    if (reason === "question-check") {
      const question = currentQuestion();
      const result = root.ExamMarking.markPaper(paper, attempt.answers).questionBreakdown.find(item => item.id === question.id);
      focusMarkingSummary($("[data-single-question-area] [data-question-heading]"), `Question ${question.number} checked. ${result.marks} of ${result.maxMarks} marks. Feedback follows each answer.`);
    }
  }

  function startAttempt(mode) {
    clearTransientNotationState();
    root.ExamStorage.deleteDraft(paper.id);
    root.ExamStorage.deleteSubmitted(paper.id);
    feedbackPrintState = null;
    document.body.dataset.examActive = String(mode === "exam");
    engine.start(mode, false);
    renderCustomiseMenu();
    if (mode === "exam") engine.beginExamSession();
  }

  function openSubmitModal() {
    const unanswered = paper.questions.filter(question => !questionIsComplete(question)).length;
    $("[data-submit-message]").textContent = unanswered
      ? "Some questions are not fully answered. You can still submit, or keep working and review the paper."
      : "All questions have been answered. After submission, your answers will be locked.";
    $("[data-submit-overlay]").classList.add("is-open");
  }
  function closeSubmitModal() { $("[data-submit-overlay]").classList.remove("is-open"); }
  function openQuestionCheckModal() {
    const question = currentQuestion();
    if (!question || engine.attempt.mode !== "practice" || engine.isQuestionChecked(question.id)) return;
    pendingQuestionCheck = question.id;
    $("[data-check-question-overlay]").classList.add("is-open");
  }
  function closeQuestionCheckModal() {
    pendingQuestionCheck = null;
    $("[data-check-question-overlay]").classList.remove("is-open");
  }
  function openResetModal() {
    closePaperMenus();
    const examIsActive = engine?.attempt?.mode === "exam" && engine.attempt.examStarted && engine.attempt.status === "active";
    $("[data-reset-title]").textContent = examIsActive ? "End Exam Mode" : "Restart";
    $("[data-reset-message]").innerHTML = examIsActive
      ? "This will end Exam Mode and <strong>clear your current progress</strong>."
      : "This will <strong>permanently clear all of your answers</strong> and reset the paper to the start.";
    $("[data-confirm-reset]").textContent = examIsActive ? "End" : "Restart";
    $("[data-reset-overlay]").classList.add("is-open");
  }
  function closeResetModal() { $("[data-reset-overlay]").classList.remove("is-open"); }
  function openAudioErrorModal(error) {
    if (engine?.attempt?.mode !== "exam" || engine.attempt.status !== "active") return;
    engine.stopTimer();
    audioErrorContext = "exam";
    failedAudioPlayer = audioPlayer;
    $("[data-audio-error-practice]").textContent = "Exit Exam Mode";
    const detail = error?.message ? " " + error.message : "";
    $("[data-audio-error-message]").textContent = "The exam audio could not be played. The timer has been paused." + detail;
    $("[data-audio-error-overlay]").classList.add("is-open");
  }
  function openStandardAudioErrorModal(error, player) {
    audioErrorContext = "standard";
    failedAudioPlayer = player;
    $("[data-audio-error-practice]").textContent = "Close";
    const detail = error?.message ? " " + error.message : "";
    $("[data-audio-error-message]").textContent = "The audio could not be played. Please try again." + detail;
    $("[data-audio-error-overlay]").classList.add("is-open");
  }
  function closeAudioErrorModal() {
    $("[data-audio-error-overlay]").classList.remove("is-open");
    failedAudioPlayer = null;
  }
  function openBlankModePicker(existingAttempt = false) {
    modePickerForExistingAttempt = existingAttempt;
    const hasAttemptedAnswers = existingAttempt && Object.values(engine?.attempt?.answers || {}).some(hasAnswerContent);
    modePickerHasProgress = hasAttemptedAnswers;
    selectedStartMode = "exam";
    $("[data-mode-progress-warning]").hidden = !hasAttemptedAnswers;
    $("[data-start-overlay]").classList.add("is-open");
  }

  function closeActiveModePicker() {
    if (!modePickerForExistingAttempt) return;
    $("[data-start-overlay]").classList.remove("is-open");
    modePickerForExistingAttempt = false;
  }

  function openModeChangeConfirmation(mode, returnToPicker = false) {
    pendingModeChange = mode;
    returnToModePickerAfterCancel = returnToPicker;
    $("[data-mode-warning-title]").textContent = "Exam Mode";
    $("[data-mode-warning-message]").textContent = "This will clear your current progress.";
    $("[data-confirm-mode-change]").textContent = "Start";
    $("[data-mode-warning-overlay]").classList.add("is-open");
  }

  function closeModeChangeConfirmation() {
    $("[data-mode-warning-overlay]").classList.remove("is-open");
    if (returnToModePickerAfterCancel) $("[data-start-overlay]").classList.add("is-open");
    pendingModeChange = null;
    returnToModePickerAfterCancel = false;
  }

  function openNewPaperConfirmation(paperId) {
    pendingPaperId = paperId;
    closePaperMenus();
    $("[data-new-paper-overlay]").classList.add("is-open");
  }

  function closeNewPaperConfirmation() {
    $("[data-new-paper-overlay]").classList.remove("is-open");
    pendingPaperId = null;
  }

  function closePaperMenus() {
    const focusedMenu = document.activeElement?.closest?.("[data-exam-menu]");
    const opener = focusedMenu ? document.querySelector(`[data-exam-menu-trigger="${focusedMenu.dataset.examMenu}"]`) : null;
    document.querySelectorAll("[data-exam-menu]").forEach(menu => { menu.hidden = true; });
    document.querySelectorAll("[data-exam-menu-trigger]").forEach(trigger => trigger.setAttribute("aria-expanded", "false"));
    // Escape or selecting an option must not leave focus in a hidden menu.
    // Closing from another visible control leaves that control's focus alone.
    opener?.focus();
  }

  function bindPaperMenus() {
    document.querySelectorAll("[data-exam-menu-trigger]").forEach(trigger => trigger.addEventListener("click", event => {
      event.stopPropagation();
      const menu = document.querySelector(`[data-exam-menu="${trigger.dataset.examMenuTrigger}"]`);
      const shouldOpen = menu.hidden;
      closePaperMenus();
      menu.hidden = !shouldOpen;
      trigger.setAttribute("aria-expanded", String(shouldOpen));
    }));
    document.querySelectorAll("[data-exam-menu] button[data-selection-label]:not(:disabled)").forEach(option => option.addEventListener("click", () => {
      if (option.dataset.paperId && option.dataset.paperId !== paper.id) {
        openNewPaperConfirmation(option.dataset.paperId);
        return;
      }
      const menu = option.closest("[data-exam-menu]");
      const label = document.querySelector(`[data-exam-menu-trigger="${menu.dataset.examMenu}"] [data-exam-selection-label]`);
      if (label && option.dataset.selectionLabel) label.textContent = option.dataset.selectionLabel;
      closePaperMenus();
    }));
    document.addEventListener("click", event => {
      if (!event.target.closest("[data-exam-menu-anchor]")) closePaperMenus();
    });
  }

  function bindEvents() {
    document.querySelector("[data-exam-mode-warning] li").textContent = `Audio and ${paper.estimatedMinutes}-minute timer start immediately.`;
    bindPaperMenus();
    $("[data-previous-question]").addEventListener("click", () => {
      const questions = engine.visibleQuestions();
      const index = questions.findIndex(item => item.id === currentQuestion().id);
      if (engine.attempt.status === "submitted") {
        if (!showingAllQuestions && index > 0) showResultQuestion(questions[index - 1].id);
        return;
      }
      if (index > 0) engine.goToQuestion(questions[index - 1].id);
    });
    const goNext = () => {
      const questions = engine.visibleQuestions();
      const index = questions.findIndex(item => item.id === currentQuestion().id);
      if (engine.attempt.status === "submitted") {
        if (!showingAllQuestions && index < questions.length - 1) showResultQuestion(questions[index + 1].id);
        return;
      }
      if (index < questions.length - 1) engine.goToQuestion(questions[index + 1].id);
    };
    $("[data-next-question]").addEventListener("click", goNext);
    $("[data-bottom-previous-question]").addEventListener("click", () => $("[data-previous-question]").click());
    $("[data-bottom-next-question]").addEventListener("click", () => $("[data-next-question]").click());
    document.querySelectorAll("[data-submit-paper]").forEach(submit => submit.addEventListener("click", openSubmitModal));
    $("[data-check-question]").addEventListener("click", openQuestionCheckModal);
    $("[data-cancel-check-question]").addEventListener("click", closeQuestionCheckModal);
    $("[data-confirm-check-question]").addEventListener("click", () => {
      const questionId = pendingQuestionCheck;
      closeQuestionCheckModal();
      if (questionId) engine.checkQuestion(questionId);
    });
    $("[data-check-question-overlay]").addEventListener("click", event => { if (event.target === event.currentTarget) closeQuestionCheckModal(); });
    $("[data-retry-exam-audio]").addEventListener("click", async () => {
      const retryButton = $("[data-retry-exam-audio]");
      retryButton.disabled = true;
      const resumed = await (failedAudioPlayer || audioPlayer)?.retry?.();
      retryButton.disabled = false;
      if (!resumed) return;
      closeAudioErrorModal();
      if (audioErrorContext === "exam") engine.startTimer();
    });
    $("[data-audio-error-practice]").addEventListener("click", () => {
      if (audioErrorContext !== "exam") {
        closeAudioErrorModal();
        return;
      }
      closeAudioErrorModal();
      root.ExamAudio.pauseAll();
      engine.convertExamToPractice();
    });
    $("[data-cancel-submit]").addEventListener("click", closeSubmitModal);
    $("[data-confirm-submit]").addEventListener("click", () => { closeSubmitModal(); engine.submit(); });
    $("[data-submit-overlay]").addEventListener("click", event => { if (event.target === event.currentTarget) closeSubmitModal(); });
    document.querySelectorAll("[data-mode-option]").forEach(option => option.addEventListener("click", () => {
      closePaperMenus();
      const requestedMode = option.dataset.modeOption;
      if (requestedMode === engine.attempt.mode) return;
      openBlankModePicker(true);
    }));
    $("[data-cancel-mode-change]").addEventListener("click", closeModeChangeConfirmation);
    $("[data-confirm-mode-change]").addEventListener("click", () => {
      $("[data-mode-warning-overlay]").classList.remove("is-open");
      root.ExamAudio.pauseAll();
      const mode = pendingModeChange || "exam";
      pendingModeChange = null;
      returnToModePickerAfterCancel = false;
      modePickerForExistingAttempt = false;
      modePickerHasProgress = false;
      startAttempt(mode);
    });
    $("[data-cancel-new-paper]").addEventListener("click", closeNewPaperConfirmation);
    $("[data-confirm-new-paper]").addEventListener("click", () => {
      const nextPaperId = pendingPaperId;
      if (!nextPaperId) return closeNewPaperConfirmation();
      $("[data-new-paper-overlay]").classList.remove("is-open");
      pendingPaperId = null;
      discardCurrentPaperOnUnload = true;
      root.ExamAudio.pauseAll();
      engine.destroy();
      root.ExamStorage.deleteDraft(paper.id);
      root.ExamStorage.deleteSubmitted(paper.id);
      // The destination restores edited work; an unedited paper opens at Q1.
      root.location.href = "digitalquestionpapers.html?paper=" + encodeURIComponent(nextPaperId);
    });
    $("[data-new-paper-overlay]").addEventListener("click", event => { if (event.target === event.currentTarget) closeNewPaperConfirmation(); });
    $("[data-cancel-start]").addEventListener("click", closeActiveModePicker);
    $("[data-cancel-start-button]").addEventListener("click", closeActiveModePicker);
    $("[data-show-all-questions]").addEventListener("click", () => {
      if (engine.attempt.status === "submitted") {
        showAllResultQuestions();
        return;
      }
      if (canShowAllQuestions()) renderAllQuestions();
    });
    $("[data-reset-paper]").addEventListener("click", openResetModal);
    $("[data-cancel-reset]").addEventListener("click", closeResetModal);
    $("[data-confirm-reset]").addEventListener("click", () => {
      closeResetModal();
      clearTransientNotationState();
      root.ExamStorage.deleteDraft(paper.id);
      root.ExamStorage.deleteSubmitted(paper.id);
      root.ExamAudio.pauseAll();
      engine.destroy();
      selectedStartMode = "practice";
      startAttempt("practice");
    });
    $("[data-reset-overlay]").addEventListener("click", event => { if (event.target === event.currentTarget) closeResetModal(); });
    $("[data-results-new-attempt]").addEventListener("click", openResetModal);
    $("[data-share-feedback]").addEventListener("click", openShareNameModal);
    $("[data-cancel-share-name]").addEventListener("click", closeShareNameModal);
    $("[data-share-name-overlay]").addEventListener("click", event => { if (event.target === event.currentTarget) closeShareNameModal(); });
    $("[data-share-name-form]").addEventListener("submit", event => {
      event.preventDefault();
      const name = $("[data-share-name-input]").value.trim();
      closeShareNameModal();
      shareFeedback(name);
    });
    document.addEventListener("keydown", event => {
      if (event.key !== "Escape") return;
      closeSubmitModal();
      closeQuestionCheckModal();
      closeResetModal();
      closeShareNameModal();
      closeQrOverlay();
      closePaperMenus();
      closeActiveModePicker();
    });
    root.addEventListener("beforeprint", renderPrintPaper);
    root.addEventListener("afterprint", () => {
      restoreAfterFeedbackPrint();
      const printArea = $("[data-print-paper]");
      if (printArea) printArea.innerHTML = "";
    });
  }

  function bindStartOverlay() {
    $("[data-start-attempt]").addEventListener("click", () => {
      if (!selectedStartMode) return;
      $("[data-start-overlay]").classList.remove("is-open");
      if (modePickerForExistingAttempt && engine?.attempt) {
        if (modePickerHasProgress) {
          openModeChangeConfirmation(selectedStartMode, true);
          return;
        }
        modePickerForExistingAttempt = false;
        modePickerHasProgress = false;
        root.ExamAudio.pauseAll();
        startAttempt(selectedStartMode);
        return;
      }
      startAttempt(selectedStartMode);
    });
  }

  // Dictionary links open the exact question in Practice or in saved feedback.
  // Restoring a link never clears an existing draft or submitted attempt.
  function openLinkedQuestion() {
    const questionId = new URLSearchParams(root.location.search).get("question");
    if (!paper.questions.some(question => question.id === questionId)) return;
    if (engine.attempt?.status === "submitted") {
      showResultQuestion(questionId);
      return;
    }
    if (engine.attempt?.mode === "exam") return;
    selectedStartMode = "practice";
    showingAllQuestions = false;
    $("[data-start-overlay]").classList.remove("is-open");
    if (!engine.attempt) engine.start("practice", false);
    engine.goToQuestion(questionId);
  }

  function renderPaperChooser(requestedLevel) {
    const levels = {N5:"National 5",H:"Higher",AH:"Advanced Higher"};
    const level = Object.hasOwn(levels, requestedLevel) ? requestedLevel : "N5";
    const entries = Object.values(root.InteractiveExamPaperRegistry || {}).filter(entry=>entry.levelCode===level).sort((a,b)=>Number(a.year)-Number(b.year));
    document.body.dataset.view = "papers";
    $(".exam-primary-shell").hidden = true;
    $("[data-paper-chooser]").hidden = false;
    $("[data-chooser-level]").textContent = levels[level];
    $("[data-chooser-level-options]").innerHTML = Object.entries(levels).map(([code,label])=>
      '<a class="exam-menu-option '+(code===level?'is-active':'')+'" href="digitalquestionpapers.html?level='+code+'"'+(code===level?' aria-current="page"':'')+'>'
      + '<span class="exam-menu-glyph">'+code+'</span><span class="exam-menu-copy"><strong>'+label+'</strong></span>'
      + (code===level?'<img class="exam-menu-tick" src="../ui-icons/tick.svg" alt="" aria-hidden="true" />':'')+'</a>'
    ).join("");
    $("[data-open-qr]").hidden = false;
    $("[data-open-qr]").setAttribute("aria-label", "Share " + levels[level] + " question papers by QR code");
    $("[data-paper-list]").style.setProperty("--paper-list-rows", String(Math.ceil(entries.length / 2)));
    $("[data-paper-list]").innerHTML = entries.map(entry=>{
      const status=root.ExamStorage?.paperStatus(entry.id) || "";
      const statusText=status==="completed"?"Completed":status==="in-progress"?"In progress":"";
      return '<a class="exam-paper-choice" href="digitalquestionpapers.html?paper='+encodeURIComponent(entry.id)+'"'+(status?' data-paper-status="'+escapeHtml(status)+'"':'')+'>'
        + '<span class="exam-menu-glyph" aria-hidden="true">'+escapeHtml(entry.levelCode)+'</span>'
        + '<span class="exam-paper-choice-copy"><strong>'+escapeHtml(entry.year)+'</strong><span>'+escapeHtml(entry.level)+' Music</span></span>'
        + (statusText?'<span class="exam-paper-choice-status">'+statusText+'</span>':'')
        + '<svg class="exam-paper-choice-arrow" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round" /></svg></a>';
    }).join("");
  }

  function installDialogAccessibility() {
    let active = null;
    let restoreFocus = null;
    let lastOutsideFocus = document.activeElement;
    const inertStates = new Map();
    const focusable = dialog => [...dialog.querySelectorAll('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), [tabindex]:not([tabindex="-1"])')].filter(node => node.getClientRects().length && !node.closest("[inert]"));
    document.addEventListener("focusin", event => {
      if (!event.target.closest(".exam-overlay")) lastOutsideFocus = event.target;
    });
    const restoreBackground = () => { inertStates.forEach((value, node) => { node.inert = value; }); inertStates.clear(); };
    const synchronise = () => {
      const next = [...document.querySelectorAll(".exam-overlay.is-open")].at(-1) || null;
      if (next === active) return;
      const previous = active;
      restoreBackground();
      active = next;
      if (next) {
        if (!previous) {
          const menu = lastOutsideFocus?.closest?.("[data-exam-menu]");
          restoreFocus = menu ? document.querySelector(`[data-exam-menu-trigger="${menu.dataset.examMenu}"]`) : lastOutsideFocus;
        }
        [...document.body.children].forEach(node => {
          if (node === next || node.contains(next) || ["SCRIPT", "STYLE"].includes(node.tagName)) return;
          inertStates.set(node, node.inert);
          node.inert = true;
        });
        if (!next.contains(document.activeElement)) {
          const first = focusable(next)[0];
          if (first) first.focus();
          else { next.tabIndex = -1; next.focus(); }
        }
      } else if (previous) {
        const target = restoreFocus?.isConnected && restoreFocus.getClientRects().length ? restoreFocus : document.querySelector('[data-exam-menu-trigger="customise"]');
        target?.focus();
        restoreFocus = null;
      }
    };
    document.querySelectorAll(".exam-overlay").forEach(dialog => new MutationObserver(synchronise).observe(dialog, { attributes: true, attributeFilter: ["class"] }));
    document.addEventListener("keydown", event => {
      if (!active) return;
      if (event.key === "Tab") {
        const fields = focusable(active);
        const first = fields[0], last = fields.at(-1);
        if (!first) { event.preventDefault(); active.focus(); return; }
        if (event.shiftKey && (document.activeElement === first || !active.contains(document.activeElement))) { event.preventDefault(); last.focus(); }
        else if (!event.shiftKey && (document.activeElement === last || !active.contains(document.activeElement))) { event.preventDefault(); first.focus(); }
      } else if (event.key === "Escape") {
        const cancel = active.querySelector('[data-cancel-submit], [data-cancel-check-question], [data-cancel-reset], [data-cancel-share-name], [data-close-qr], [data-cancel-start], [data-cancel-mode-change], [data-cancel-new-paper]');
        if (cancel) { event.preventDefault(); event.stopImmediatePropagation(); cancel.click(); }
      }
    }, true);
    synchronise();
  }

  function initialise() {
    installDialogAccessibility();
    $("[data-open-qr]").addEventListener("click", openQrOverlay);
    $("[data-close-qr]").addEventListener("click", closeQrOverlay);
    $("[data-copy-paper-link]").addEventListener("click", copyPaperLink);
    $("[data-qr-overlay]").addEventListener("click", event => { if (event.target === event.currentTarget) closeQrOverlay(); });
    const params = new URLSearchParams(root.location.search);
    const navigationType = root.performance?.getEntriesByType?.("navigation")?.[0]?.type || "navigate";
    const id = params.get("paper");
    if (!id) {
      renderPaperChooser(params.get("level"));
      bindPaperMenus();
      document.addEventListener("keydown", event => { if (event.key === "Escape") { closeQrOverlay(); closePaperMenus(); } });
      root.addEventListener("pageshow", () => renderPaperChooser(params.get("level")));
      return;
    }
    paper = root.InteractiveExamPapers?.[id];
    if (!paper) {
      $("main").innerHTML = '<section class="empty-state"><h1>Paper unavailable</h1><p>This paper is not currently available.</p><a class="button" href="digitalquestionpapers.html">Choose another paper</a></section>';
      return;
    }
    engine = new root.ExamEngineCore.ExamEngine(paper, onEngineChange);
    renderPaperSelectors();
    renderToolbarStats();
    bindEvents();
    bindStartOverlay();
    const submitted = root.ExamStorage.loadSubmitted(paper.id);
    const draft = root.ExamStorage.loadDraft(paper.id);
    if (root.ExamEngineCore.validateAttempt(paper, submitted, "submitted")) {
      selectedStartMode = submitted.mode;
      $("[data-start-overlay]").classList.remove("is-open");
      engine.restoreSubmitted(submitted);
    } else {
      if (submitted) root.ExamStorage.deleteSubmitted(paper.id);
      if (root.ExamEngineCore.validateAttempt(paper, draft, "active") && draft.mode === "practice" && engine.resume(draft, { navigationType })) {
        selectedStartMode = "practice";
        $("[data-start-overlay]").classList.remove("is-open");
      } else if (draft) root.ExamStorage.deleteDraft(paper.id);
    }
    // A stale question URL must not override the question saved on refresh.
    if (navigationType !== "reload" || !engine.attempt) openLinkedQuestion();
    if (!engine.attempt) {
      selectedStartMode = "practice";
      startAttempt("practice");
    }
    renderCustomiseMenu();
    root.addEventListener("pageshow", event => {
      if (event.persisted && engine.attempt?.status === "active" && engine.attempt.mode === "practice") {
        engine.resume(engine.attempt, { navigationType: "back_forward" });
      }
    });
    root.addEventListener("beforeunload", event => {
      if (engine.attempt?.mode === "exam" && engine.attempt.examStarted && engine.attempt.status === "active") {
        root.ExamStorage.deleteDraft(paper.id);
        event.preventDefault();
        event.returnValue = "";
        return;
      }
      root.ExamAudio.pauseAll();
      if (!discardCurrentPaperOnUnload) engine.persist();
      engine.destroy();
    });
  }

  root.ExamUI = { initialise };
  document.addEventListener("DOMContentLoaded", () => {
    Promise.resolve(root.InteractiveExamPaperReady).then(initialise, initialise);
  });
})(window);
