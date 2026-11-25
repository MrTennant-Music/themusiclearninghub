// Adapted from the owner-supplied Performing Assessment Recorder.
// Source: https://kpss-performing-assessment-recorder.bobby-tennant.chatgpt.site/
// The Hub includes only the Senior Phase Performing template.
(() => {
      "use strict";

      const STORAGE_KEY = "mlh:assessment-recorder:senior-phase:v1";
      const RECORDER_VIEW_KEY = "mlh:assessment-recorder:pupil-view";
      const SHEET_ZOOM_KEY = "mlh:assessment-recorder:sheet-zoom";
      const MIN_SHEET_ZOOM = 60;
      const MAX_SHEET_ZOOM = 140;
      const BAND_OPTIONS = [
        { id: "excellent", label: "Excellent", range: "9–10", score: 10 },
        { id: "secure", label: "Secure", range: "7–8", score: 8 },
        { id: "mainly", label: "Mainly accurate", range: "5–6", score: 6 },
        { id: "inconsistent", label: "Inconsistent", range: "3–4", score: 4 },
        { id: "poor", label: "Poor", range: "0–2", score: 2 }
      ];

      const INSTRUMENT_OPTIONS = [
        { value: "Glockenspiel", label: "Glockenspiel" },
        { value: "Keyboard", label: "Keyboard" },
        { value: "Bass guitar", label: "Bass guitar" },
        { value: "Guitar", label: "Guitar" },
        { value: "Drum kit", label: "Drum kit" },
        { value: "Voice", label: "Voice" }
      ];

      const SENIOR_TEMPLATE = {
        criteria: [
          ["Melodic accuracy / intonation", "Accuracy of notes and intonation."],
          ["Rhythmic accuracy", "Accuracy of rhythms and note lengths."],
          ["Tempo and flow", "Appropriate tempo, fluency and continuity."],
          ["Mood and character", "Communication of the music's mood and character."],
          ["Tone", "Development and control of instrumental or vocal sound."],
          ["Dynamics", "Observation and control of dynamics."]
        ]
      };

      const app = document.getElementById("app");
      const importFile = document.getElementById("recorderImportFile");
      let importInProgress = false;
      let toastTimer;
      let sheetZoom = loadSheetZoom();
      let view = { mode: "dashboard", classId: null, assessmentId: null, pupilId: null, filter: "all" };
      let pupilSort = { key: null, direction: "ascending" };
      let pupilSearch = "";
      let pupilFilters = {};
      const pupilFilterFields = {level:"Level", teacher:"Teacher", assessor:"Assessor", instrument:"Instrument", progress:"Assessment Status"};
      const pupilProgressLabels = {complete:"Complete", partial:"Partially complete", untouched:"Not started"};
      const pupilIndex = new Map();
      const sheetPreviewObserver = typeof IntersectionObserver === "function" ? new IntersectionObserver(([entry], observer) => {
        if (!entry.isIntersecting) return;
        const preview = entry.target;
        observer.unobserve(preview);
        preview.querySelector(".recorder-preview-feedback:last-child").addEventListener("animationend", event => {
          if (event.animationName !== "recorder-preview-mark") return;
          setTimeout(() => {
            if (!preview.isConnected) return;
            preview.classList.remove("is-playing");
            requestAnimationFrame(() => requestAnimationFrame(() => preview.classList.add("is-playing")));
          }, 2500);
        });
        preview.classList.add("has-animation", "is-playing");
      }) : null;
      let disposeDateMenu;
      let disposeFilterMenu;
      let savedSnapshot = null;
      let state = loadState();

      function newId(prefix) {
        const value = globalThis.crypto && crypto.randomUUID
          ? crypto.randomUUID()
          : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
        return `${prefix}-${value}`;
      }

      function defaultState() {
        return { version: 1, classes: [], savedAt: null };
      }

      function loadState() {
        try {
          savedSnapshot = localStorage.getItem(STORAGE_KEY);
          const parsed = JSON.parse(savedSnapshot);
          if (parsed && parsed.version === 1 && Array.isArray(parsed.classes)) return normaliseAssessmentData(parsed);
        } catch (error) {
          console.warn("Could not read saved assessment data.", error);
        }
        return defaultState();
      }

      function normaliseAssessmentData(saved) {
        saved.classes.forEach(klass => {
          (klass.pupils || []).forEach(pupil => {
            delete pupil.time;
            if (pupil.date && !isRosterDate(pupil.date)) pupil.date = "";
          });
          (klass.assessments || []).forEach(assessment => {
            if (assessment.title === "Prelims") assessment.title = "Performance Assessment";
            Object.values(assessment.records || {}).forEach(record => {
              (record.seniorPhase?.instruments || []).forEach(instrument => {
                instrument.name = (instrument.name || "").replace(/^Drum Kit$/i, "Drum kit").replace(/^Bass Guitar$/i, "Bass guitar");
              });
            });
          });
        });
        return saved;
      }

      function isRosterDate(value) {
        if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
        const date = new Date(value);
        return Number.isFinite(+date) && date.toISOString().slice(0, 10) === value;
      }

      function readAssessmentBackup(text) {
        const data = JSON.parse(text.replace(/^\uFEFF/, ""));
        const isObject = value => value !== null && typeof value === "object" && !Array.isArray(value);
        const isOptionalText = value => value == null || typeof value === "string";
        const optionalList = (rows, validRow, max) => rows == null || Array.isArray(rows) && rows.length <= max && rows.every(validRow);
        const validScore = (value, maximum) => value == null || value === "" ||
          (typeof value === "number" || typeof value === "string" && value.trim() !== "") &&
          Number.isFinite(Number(value)) && Number(value) >= 0 && Number(value) <= maximum;
        const validList = (rows, validRow) => Array.isArray(rows) && rows.every(row =>
          isObject(row) && typeof row.id === "string" && row.id.trim() && !Object.hasOwn(Object.prototype, row.id) && validRow(row)
        ) && new Set(rows.map(row => row.id)).size === rows.length;
        const validPiece = piece => isObject(piece) && isOptionalText(piece.title) && isOptionalText(piece.comment) &&
          validScore(piece.score, 10) && (piece.ratings == null || isObject(piece.ratings));
        const validInstrument = instrument => isObject(instrument) && isOptionalText(instrument.name) && optionalList(instrument.pieces, validPiece, 8);
        const validRecord = record => {
          if (!isObject(record) || !validScore(record.score, 60) ||
              (record.locked != null && typeof record.locked !== "boolean")) return false;
          const phase = record.seniorPhase;
          return phase == null || isObject(phase) && isOptionalText(phase.qualificationLevel) &&
            optionalList(phase.instruments, validInstrument, 2);
        };
        const validPupil = pupil => typeof pupil.name === "string" &&
          (pupil.date == null || pupil.date === "" || isRosterDate(pupil.date)) &&
          ["teacher", "assessor", "teachingClass", "session"].every(key => isOptionalText(pupil[key]));
        const validClass = klass => {
          if (typeof klass.name !== "string" || !isOptionalText(klass.assessor) || !validList(klass.pupils, validPupil)) return false;
          const pupilIds = new Set(klass.pupils.map(pupil => pupil.id));
          return validList(klass.assessments, assessment => typeof assessment.title === "string" &&
            isOptionalText(assessment.qualificationLevel) && (assessment.records == null || isObject(assessment.records) &&
            Object.entries(assessment.records).every(([id, record]) => pupilIds.has(id) && validRecord(record))));
        };
        if (!isObject(data) || data.version !== 1 || !validList(data.classes, validClass)) throw new Error("Invalid assessment backup");
        return normaliseAssessmentData(data);
      }

      function mergeBackupClasses(existing, imported) {
        const classes = new Map(existing.map(klass => [klass.id, klass]));
        for (const klass of imported) classes.set(klass.id, klass);
        return [...classes.values()];
      }

      async function saveState(message = "Saved locally", nextState = state) {
        const baseState = state;
        try {
          const locks = globalThis.navigator?.locks;
          const save = () => writeState(message, nextState, baseState);
          return locks ? await locks.request(STORAGE_KEY, save) : save();
        } catch (error) {
          console.warn("Could not save assessment data.", error);
          showToast("Changes could not be saved in this browser. Download a copy before leaving.", 8000);
          return false;
        }
      }

      function writeState(message, nextState, baseState) {
        if (state !== baseState || localStorage.getItem(STORAGE_KEY) !== savedSnapshot) {
          showToast("Assessment data changed while you were editing. This change was not saved. Keep a copy of your changes before refreshing.", 12000);
          return false;
        }
        const savedAt = new Date().toISOString();
        const snapshot = JSON.stringify({...nextState,savedAt});
        localStorage.setItem(STORAGE_KEY, snapshot);
        savedSnapshot = snapshot;
        state = nextState;
        state.savedAt = savedAt;
        if (message) showToast(message);
        return true;
      }

      function esc(value) {
        return String(value ?? "")
          .replaceAll("&", "&amp;")
          .replaceAll("<", "&lt;")
          .replaceAll(">", "&gt;")
          .replaceAll('"', "&quot;")
          .replaceAll("'", "&#039;");
      }

      function showToast(message, duration = 2100) {
        const recipients = [document.getElementById("toast"), app.querySelector(".recorder-start-guide[open] .recorder-start-status")].filter(Boolean);
        for (const recipient of recipients) {
          recipient.textContent = message;
          recipient.classList.add("show");
        }
        clearTimeout(toastTimer);
        toastTimer = setTimeout(() => recipients.forEach(recipient => recipient.classList.remove("show")), duration);
      }

      function currentClass() {
        return state.classes.find((item) => item.id === view.classId) || null;
      }

      function currentAssessment() {
        const klass = currentClass();
        return klass?.assessments.find((item) => item.id === view.assessmentId) || null;
      }

      function currentPupil() {
        const klass = currentClass();
        return klass?.pupils.find((item) => item.id === view.pupilId) || null;
      }

      function restoreRecorderView() {
        let saved;
        try {
          saved = JSON.parse(sessionStorage.getItem(RECORDER_VIEW_KEY));
        } catch {
          return;
        }
        if (!saved) return;
        const {classId, assessmentId, date} = saved;
        const klass = state.classes.find(item => item.id === classId);
        if (!klass?.assessments.some(item => item.id === assessmentId)) return;
        const pupilId = klass.pupils.find(item => item.id === saved.pupilId)?.id ?? null;
        view = {...view, mode:pupilId === null ? "dashboard" : "assessment", classId, assessmentId, pupilId, date};
      }

      function rememberRecorderView() {
        try {
          const {classId, assessmentId, date} = view;
          if (assessmentId) {
            const pupilId = view.mode === "assessment" ? view.pupilId : null;
            sessionStorage.setItem(RECORDER_VIEW_KEY, JSON.stringify({classId, assessmentId, pupilId, date}));
          } else {
            sessionStorage.removeItem(RECORDER_VIEW_KEY);
          }
        } catch {
          // Assessment records are saved independently of this tab's view.
        }
      }

      function ensureRecord(assessment, pupil) {
        assessment.records ||= {};
        if (!assessment.records[pupil.id]) {
          assessment.records[pupil.id] = { score: "", updatedAt: null };
        }
        const record = assessment.records[pupil.id];
        if (!record.seniorPhase) ensureSeniorRecord(record).qualificationLevel = assessment.qualificationLevel || "";
        return record;
      }

      function calculatedMark(ratings) {
        const values = Object.values(ratings || {})
          .map((bandId) => BAND_OPTIONS.find((band) => band.id === bandId)?.score)
          .filter((score) => Number.isFinite(score));
        if (!values.length) return "";
        return Math.floor(values.reduce((total, score) => total + score, 0) / values.length);
      }

      function newSeniorInstrument() {
        return {
          name: "",
          pieces: Array.from({ length: 8 }, () => ({
            title: "",
            score: "",
            comment: "",
            ratings: {}
          }))
        };
      }

      function ensureSeniorRecord(record) {
        record.seniorPhase ||= {
          qualificationLevel: "",
          instruments: [newSeniorInstrument(), newSeniorInstrument()]
        };
        record.seniorPhase.instruments ||= [];
        while (record.seniorPhase.instruments.length < 2) {
          record.seniorPhase.instruments.push(newSeniorInstrument());
        }
        record.seniorPhase.instruments = record.seniorPhase.instruments.slice(0, 2);
        record.seniorPhase.instruments.forEach((instrument) => {
          instrument.name ||= "";
          instrument.pieces ||= [];
          while (instrument.pieces.length < 8) {
            instrument.pieces.push({ title: "", score: "", comment: "", ratings: {} });
          }
          instrument.pieces = instrument.pieces.slice(0, 8);
          instrument.pieces.forEach((piece) => {
            piece.title ||= "";
            piece.comment ||= "";
            piece.ratings ||= {};
            if (piece.score === null || piece.score === undefined) piece.score = "";
          });
        });
        return record.seniorPhase;
      }

      function seniorInstrumentScaledMark(instrument) {
        const enteredMarks = (instrument?.pieces || [])
          .map((piece) => piece.score)
          .filter((score) => score !== "" && score !== null && score !== undefined)
          .map(Number)
          .filter(Number.isFinite);
        if (!enteredMarks.length) return "";
        return (enteredMarks.reduce((total, mark) => total + mark, 0) / enteredMarks.length) * 3;
      }

      function seniorInstrumentRawTotal(instrument) {
        const marks = (instrument?.pieces || [])
          .filter(piece => piece.score !== "" && piece.score != null)
          .map(piece => Number(piece.score))
          .filter(Number.isFinite);
        return marks.length ? marks.reduce((total, mark) => total + mark, 0) : "";
      }

      function seniorTotalMark(record) {
        const marks = (record?.seniorPhase?.instruments || [])
          .map(seniorInstrumentScaledMark)
          .filter((mark) => mark !== "");
        if (!marks.length) return "";
        return marks.reduce((total, mark) => total + Math.round(mark), 0);
      }

      function formatSeniorMark(mark) {
        return mark === "" ? "—" : String(Math.round(mark));
      }

      function syncSeniorScore(record) {
        const total = seniorTotalMark(record);
        record.score = total === "" ? "" : Math.round(total);
        syncCompletionDate(record);
      }

      function syncCompletionDate(record) {
        const complete = recordStatus(record) === "complete";
        if (complete && !record.completedAt) record.completedAt = new Date().toISOString();
        if (!complete) delete record.completedAt;
      }

      function recordStatus(record) {
        const completeInstruments = (record?.seniorPhase?.instruments || [])
          .filter((instrument) => seniorInstrumentScaledMark(instrument) !== "" &&
            (instrument.pieces || []).every(piece =>
              !(piece.title?.trim() || piece.comment?.trim() || Object.values(piece.ratings || {}).some(Boolean)) ||
              (piece.score !== "" && piece.score != null && Number.isFinite(Number(piece.score)))
            )).length;
        return completeInstruments === 2 ? "complete" : "incomplete";
      }

      function assessmentRowProgress(record) {
        if (recordStatus(record) === "complete") return "complete";
        const senior = record?.seniorPhase;
        const started = (senior?.instruments || []).some(instrument =>
          (instrument.pieces || []).some(piece =>
            piece.comment?.trim() ||
            (piece.score !== "" && piece.score != null) || Object.values(piece.ratings || {}).some(Boolean)
          )
        );
        return started ? "partial" : "untouched";
      }

      function seniorInstrumentField(instrument, instrumentIndex) {
        return `
          <input
            class="ocr-instrument-name"
            data-senior-instrument-name="${instrumentIndex}"
            list="seniorInstrumentSuggestions${instrumentIndex}"
            value="${esc(instrument.name)}"
            placeholder="Specify instrument"
            aria-label="Instrument ${instrumentIndex + 1} or voice"
            autocomplete="off"
          >
          <datalist id="seniorInstrumentSuggestions${instrumentIndex}">
            ${INSTRUMENT_OPTIONS.map((option) => `<option value="${esc(option.value)}"></option>`).join("")}
          </datalist>
        `;
      }

      function surnameForSort(name) {
        const parts = name.trim().split(/\s+/);
        return parts[parts.length - 1] || name;
      }

      function sortableHeading(key, label) {
        const active = pupilSort.key === key;
        const direction = active ? pupilSort.direction : "none";
        const indicator = `<svg xmlns="http://www.w3.org/2000/svg" width="12" height="16" viewBox="0 0 12 16" focusable="false" aria-hidden="true">${active ? `<path fill="currentColor" d="${direction === 'ascending' ? 'M1 11 6 4l5 7Z' : 'M1 5h10l-5 7Z'}"/>` : '<path d="m2 5 3-3 3 3M5 2v12m-3-3 3 3 3-3" fill="none" stroke="currentColor" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>'}</svg>`;
        return `
          <th
            aria-sort="${direction}"
          >
            <button class="sort-header" type="button" data-sort="${key}" aria-label="Sort by ${label}">
              <span>${label}</span><span class="sort-indicator" aria-hidden="true">${indicator}</span>
            </button>
          </th>
        `;
      }

      function lockedHeading(label) {
        return `<th class="locked-column"><span>${label}</span></th>`;
      }

      function sessionLabel(klass, assessment) {
        return klass.prelimRosterKey && klass.assessments.length === 1 ? klass.name : `${klass.name} · ${assessment.title}`;
      }

      function rosterDates(klass) {
        const dates = new Set(klass.pupils.map(pupil => pupil.date || ""));
        const undated = dates.delete("");
        const sorted = [...dates].sort();
        if (undated) sorted.push("");
        return sorted;
      }

      function dateParts(date) {
        if (date === "all") return {label:"All Dates"};
        if (!date) return {label:"Unassigned"};
        const day = new Intl.DateTimeFormat("en-GB", {weekday:"long", timeZone:"UTC"}).format(new Date(date));
        return {label:day, description:window.AssessmentPrelimRoster.formatDate(date)};
      }

      function rosterDateGroups() {
        const entries = state.classes.flatMap(item => item.assessments.map(entry => ({item, entry})));
        return entries.map(({item, entry}) => {
          const dates = rosterDates(item);
          const choices = dates.some(Boolean) ? [...dates, "all"] : ["all"];
          return {
            heading:entries.length > 1 ? sessionLabel(item, entry) : "",
            choices:choices.map(date => ({
              classId:item.id, assessmentId:entry.id, date, ...dateParts(date),
              active:item.id === view.classId && entry.id === view.assessmentId && date === view.date
            }))
          };
        });
      }

      function dashboardToolbarHtml({hasDates = false, hasPupils = false} = {}) {
        const hasOtherRosters = state.classes.some(klass => klass.assessments.some(assessment =>
          klass.id !== view.classId || assessment.id !== view.assessmentId));
        const pickerTitle = hasDates ? "Date" : "Roster";
        const {label, description} = hasDates ? dateParts(view.date) : {label:pickerTitle};
        return `<div class="recorder-toolbar" aria-label="Assessment toolbar">
          ${view.assessmentId && (hasDates || hasOtherRosters) ? `<details class="assessment-picker">
            <summary id="rosterPicker" class="${window.MLH.ToolbarButtonClass} recorder-picker-trigger" title="${pickerTitle}"><img src="./ui-icons/${hasDates ? "calendar" : "list"}.svg" alt=""><span>${esc(label)}</span>${description ? `<span class="recorder-toolbar-selection">${esc(description)}</span>` : ""}</summary>
            <div id="recorderDateMenu" data-menu-title="${pickerTitle}"></div>
          </details>` : ""}
          <button class="button utility-button kp-green" type="button" data-download-class-assessments>Download</button>
          <button class="button utility-button secondary" type="button" data-clear-all-data>Delete All</button>
          ${hasPupils ? `<label class="recorder-pupil-search">
            <img src="./ui-icons/search.svg" alt="">
            <input id="recorderPupilSearch" type="search" placeholder="Search" aria-label="Search" aria-controls="recorderPupilRows" autocomplete="off" value="${esc(pupilSearch)}">
          </label>
          <details class="assessment-picker">
            <summary class="${window.MLH.ToolbarButtonClass} recorder-picker-trigger" id="rosterFilter">
              <img src="./ui-icons/filter.svg?v=65c8d15c5394" alt=""><span data-pupil-filter-label>${pupilFilterLabel()}</span>
            </summary>
            <div id="recorderFilterMenu"></div>
          </details>` : ""}
          <span class="recorder-export-status" role="status" aria-live="polite"></span>
        </div>`;
      }

      function setupDialogHtml() {
        return `
              <dialog class="recorder-start-guide" aria-labelledby="recorderSetupTitle">
                <h2 id="recorderSetupTitle" tabindex="-1" autofocus>Digital Performance Assessment</h2>
                <p>Give each performance your full attention. The recorder keeps marks and feedback together, totals marks as you assess, and produces an individual assessment sheet ready to share with each pupil.</p>
                <svg class="recorder-sheet-preview" viewBox="34 51 990 563" width="990" height="563" role="img" aria-label="Example piano assessment for Jamie Campbell playing Für Elise, with all six criteria rated, a mark of 8 out of 10 and written feedback.">
                  <svg x="338" y="54" width="382" height="69" viewBox="338 17 382 69" overflow="hidden">
                    <image href="./assessment-recorder/mark-sheet-preview.jpg?v=35018fed7aef" width="1058" height="614"></image>
                  </svg>
                  <svg x="43" y="133" width="972" height="481" viewBox="43 133 972 481" overflow="hidden">
                    <image href="./assessment-recorder/mark-sheet-preview.jpg?v=35018fed7aef" width="1058" height="614"></image>
                  </svg>
                  <rect x="71" y="313" width="150" height="27" fill="#fff" aria-hidden="true"></rect>
                  <g class="recorder-preview-covers" fill="#fff" aria-hidden="true">
                    <rect class="recorder-preview-mark" x="394" y="404" width="27" height="25" style="--reveal-at:.55s"></rect>
                    <rect class="recorder-preview-mark" x="457" y="439" width="26" height="25" fill="#d2d2d2" style="--reveal-at:.78s"></rect>
                    <rect class="recorder-preview-mark" x="457" y="475" width="26" height="25" fill="#d2d2d2" style="--reveal-at:1.01s"></rect>
                    <rect class="recorder-preview-mark" x="457" y="510" width="26" height="25" fill="#d2d2d2" style="--reveal-at:1.24s"></rect>
                    <rect class="recorder-preview-mark" x="457" y="546" width="26" height="25" fill="#d2d2d2" style="--reveal-at:1.47s"></rect>
                    <rect class="recorder-preview-mark" x="520" y="581" width="26" height="25" style="--reveal-at:1.7s"></rect>
                    <rect class="recorder-preview-mark" x="716" y="468" width="23" height="32" style="--reveal-at:2.1s"></rect>
                    <rect class="recorder-preview-feedback" x="773" y="366" width="188" height="22" style="--reveal-at:.55s"></rect>
                    <rect class="recorder-preview-feedback" x="773" y="389" width="166" height="22" style="--reveal-at:1.35s"></rect>
                    <rect class="recorder-preview-feedback" x="773" y="411" width="210" height="22" style="--reveal-at:2.15s"></rect>
                    <rect class="recorder-preview-feedback" x="773" y="434" width="73" height="19" style="--reveal-at:2.95s;--typing-time:.35s;--typing-steps:8"></rect>
                  </g>
                </svg>
                <h2>Set Up</h2>
                <ol>
                  <li>Download <a class="recorder-start-workbook" href="./assessment-recorder/assessment-roster-template.xlsx" download="The Music Learning Hub - Digital Performance Assessment.xlsx"><img src="./ui-icons/file-excel.svg?v=2" alt="">The Music Learning Hub - Digital Performance Assessment</a>.</li>
                  <li>Enter each pupil’s details including their name, instruments and pieces.</li>
                  <li>Choose <strong>Import</strong> below to upload the completed spreadsheet.</li>
                </ol>
                <button class="button utility-button secondary recorder-start-import" type="button" data-import-assessments><img src="./ui-icons/download.svg" class="rotate-180" alt="">Import</button>
                <p class="recorder-start-status" role="status"></p>
              </dialog>
        `;
      }

      function dashboardHtml() {
        const klass = currentClass();
        const assessment = currentAssessment();
        const records = assessment?.records || {};
        const hasDates = Boolean(klass?.pupils.some(pupil => pupil.date));
        const hasOrder = Boolean(klass?.pupils.some(pupil => pupil.order));
        const columnCount = hasOrder ? 8 : 7;

        const visiblePupils = klass && assessment ? pupilsInRunningOrder(klass) : [];

        const sortValue = (pupil) => {
          const record = assessment ? records[pupil.id] : null;
          if (pupilSort.key === "pupil") return surnameForSort(pupil.name);
          if (pupilSort.key === "level") return ({"National 5":1, "Higher":2, "Advanced Higher":3})[(record?.seniorPhase?.qualificationLevel ?? assessment?.qualificationLevel)] ?? null;
          if (pupilSort.key === "instrument1") return record?.seniorPhase?.instruments?.[0]?.name || "";
          if (pupilSort.key === "mark1") return seniorInstrumentScaledMark(record?.seniorPhase?.instruments?.[0]);
          if (pupilSort.key === "instrument2") return record?.seniorPhase?.instruments?.[1]?.name || "";
          if (pupilSort.key === "mark2") return seniorInstrumentScaledMark(record?.seniorPhase?.instruments?.[1]);
          if (pupilSort.key === "totalMark") return seniorTotalMark(record);
          return "";
        };

        visiblePupils.sort((a, b) => {
            if (!pupilSort.key) return 0;

            const aValue = sortValue(a);
            const bValue = sortValue(b);
            const aBlank = aValue === "" || aValue == null;
            const bBlank = bValue === "" || bValue == null;
            if (aBlank !== bBlank) return aBlank ? 1 : -1;

            const result = typeof aValue === "number"
              ? aValue - bValue
              : String(aValue).localeCompare(String(bValue), "en-GB", { numeric: true, sensitivity: "base" });
            if (result) return pupilSort.direction === "ascending" ? result : -result;
            return a.name.localeCompare(b.name, "en-GB", { sensitivity: "base" });
          });

        const pupilRows = visiblePupils.map((pupil) => {
            const record = assessment ? records[pupil.id] : null;
            const instruments = record?.seniorPhase?.instruments || [];
            const instrument1Mark = seniorInstrumentScaledMark(instruments[0]);
            const instrument2Mark = seniorInstrumentScaledMark(instruments[1]);
            const totalMark = seniorTotalMark(record);
            const formattedMark = (mark, maximum) => mark === "" ? "—" : `${Math.round(mark)}/${maximum}`;
            const markColour = (mark, threshold) => mark === "" ? "" : Math.round(mark) >= threshold ? "mark-threshold-met" : "mark-threshold-below";
            const progress = assessmentRowProgress(record);
            const progressLabel = pupilProgressLabels[progress];
            const level = record?.seniorPhase?.qualificationLevel ?? assessment.qualificationLevel ?? "";
            const day = hasDates ? dateParts(pupil.date).label : "";
            indexPupilDetails(pupil, record, assessment, klass, {day, level, instruments, progressLabel, instrument1Mark, instrument2Mark, totalMark});
            const subtitle = [
              pupil.date ? `<time datetime="${esc(pupil.date)}">${esc(day)}</time>` : esc(day),
              esc(pupil.teacher)
            ].filter(Boolean).join(" • ");
            return `
              <tr class="pupil-progress-${progress}" data-pupil-id="${esc(pupil.id)}" tabindex="0" role="button" aria-label="${pupil.name ? `Open assessment for ${esc(pupil.name)}` : "Open unnamed assessment"}" aria-description="${progressLabel}">
                ${hasOrder ? `<td class="order-cell">${esc(pupil.order) || "–"}</td>` : ""}
                <td class="name-cell">
                  ${esc(pupil.name)}
                  ${subtitle ? `<span class="roster-pupil-subtitle">${subtitle}</span>` : ""}
                </td>
                <td class="roster-detail-cell roster-level-cell">${esc(displayRosterLevel(level) || "—")}</td>
                <td class="roster-detail-cell">${esc(instruments[0]?.name || "—")}</td>
                <td class="mark-cell ${markColour(instrument1Mark, 15)}"><strong>${formattedMark(instrument1Mark, 30)}</strong></td>
                <td class="roster-detail-cell">${esc(instruments[1]?.name || "—")}</td>
                <td class="mark-cell ${markColour(instrument2Mark, 15)}"><strong>${formattedMark(instrument2Mark, 30)}</strong></td>
                <td class="mark-cell ${markColour(totalMark, 30)}"><strong>${formattedMark(totalMark, 60)}</strong></td>
              </tr>
            `;
          }).join("");

        return `
          <main class="main">
            ${state.classes.length ? dashboardToolbarHtml({hasDates, hasPupils:visiblePupils.length > 0}) : ""}

            <section class="table-card card">
                <div class="table-wrap">
                  <table class="senior-dashboard-table">
                    <colgroup>
                      ${hasOrder ? '<col style="width:7%">' : ""}<col style="width:${hasOrder ? 23 : 30}%"><col style="width:15%">
                      <col style="width:14%"><col style="width:8%"><col style="width:13%"><col style="width:8%"><col style="width:12%">
                    </colgroup>
                    <thead>
                      <tr>
                        ${hasOrder ? lockedHeading("Order") : ""}
                        ${sortableHeading("pupil", "Pupil")}
                        ${sortableHeading("level", "Level")}
                        ${lockedHeading("Instrument 1")}
                        ${lockedHeading("Mark")}
                        ${lockedHeading("Instrument 2")}
                        ${lockedHeading("Mark")}
                        ${sortableHeading("totalMark", "Total Mark")}
                      </tr>
                    </thead>
                    <tbody id="recorderPupilRows">
                      ${pupilRows || `<tr><td colspan="${columnCount}" class="empty-panel">No pupils available.</td></tr>`}
                      ${pupilRows ? `<tr data-pupil-search-empty hidden><td colspan="${columnCount}" class="empty-panel" role="status">No matching pupils.</td></tr>` : ""}
                    </tbody>
                  </table>
                </div>
            </section>
            ${state.classes.length ? `
              <button class="button utility-button secondary recorder-add-pupil" type="button" data-add-pupil>
                <svg width="20" height="20" viewBox="0 0 32 32" fill="none" stroke="currentColor" stroke-width="1.68" stroke-linecap="round" aria-hidden="true"><path d="M7 16h18M16 7v18"/></svg>
                Add Pupil
              </button>
            ` : setupDialogHtml()}
          </main>
        `;
      }

      function hasExtraPieceContent(instrument) {
        return (instrument.pieces || []).slice(4, 8).some(piece => piece.title || piece.comment ||
          (piece.score !== "" && piece.score != null) || Object.values(piece.ratings || {}).some(Boolean));
      }

      function usesExtraPieces(instrument) {
        return Boolean(instrument.extraPieces || hasExtraPieceContent(instrument));
      }

      function seniorInstrumentPageHtml(template, seniorPhase, instrumentIndex, continuation = false) {
        const instrument = seniorPhase.instruments[instrumentIndex];
        const scaledMark = seniorInstrumentScaledMark(instrument);
        const rawTotal = seniorInstrumentRawTotal(instrument);
        const offset = continuation ? 4 : 0;
        const showTotals = continuation || !usesExtraPieces(instrument);
        const pieces = instrument.pieces.slice(offset, offset + 4).map((piece, localIndex) => {
          const pieceIndex = offset + localIndex;
          const ratingRows = template.criteria.map(([criterion], criterionIndex) => {
            const selected = piece.ratings?.[criterionIndex] || "";
            return `
              <tr>
                <th class="ocr-criterion" scope="row">${esc(criterion)}</th>
                ${BAND_OPTIONS.map((band, bandIndex) => `
                  <td class="ocr-rating-cell ${bandIndex === 1 || bandIndex === 3 ? "ocr-shaded" : ""}">
                    <button
                      class="ocr-rating-button"
                      type="button"
                      data-senior-rating="${instrumentIndex}:${pieceIndex}:${criterionIndex}:${esc(band.id)}"
                      aria-pressed="${selected === band.id}"
                      aria-label="Instrument ${instrumentIndex + 1}, piece ${pieceIndex + 1}, ${esc(criterion)}: ${esc(band.label)}, ${esc(band.range)}"
                    >✓</button>
                  </td>
                `).join("")}
              </tr>
            `;
          }).join("");

          return `
            <tr>
              <th class="ocr-piece-title" colspan="6">
                Piece ${pieceIndex + 1} —
                <input
                  class="ocr-piece-title-input"
                  data-senior-piece-field="title"
                  data-instrument-index="${instrumentIndex}"
                  data-piece-index="${pieceIndex}"
                  value="${esc(piece.title)}"
                  aria-label="Instrument ${instrumentIndex + 1}, piece ${pieceIndex + 1} title"
                >
              </th>
              <td class="ocr-piece-mark-cell" rowspan="7">
                <div class="ocr-piece-mark-control">
                  <input
                    class="ocr-piece-mark-input"
                    data-senior-piece-field="score"
                    data-instrument-index="${instrumentIndex}"
                    data-piece-index="${pieceIndex}"
                    type="number"
                    inputmode="decimal"
                    min="0"
                    max="10"
                    step="1"
                    value="${esc(piece.score)}"
                    aria-label="Instrument ${instrumentIndex + 1}, piece ${pieceIndex + 1} mark out of 10"
                  >
                  <div class="ocr-piece-mark-steppers" aria-label="Adjust piece mark">
                    <button type="button" data-senior-score-step="-1" data-instrument-index="${instrumentIndex}" data-piece-index="${pieceIndex}" aria-label="Decrease piece mark">▼</button>
                    <button type="button" data-senior-score-step="1" data-instrument-index="${instrumentIndex}" data-piece-index="${pieceIndex}" aria-label="Increase piece mark">▲</button>
                  </div>
                </div>
              </td>
              <td class="ocr-piece-comment-cell" rowspan="7">
                <textarea
                  class="ocr-piece-comment-input"
                  data-senior-piece-field="comment"
                  data-instrument-index="${instrumentIndex}"
                  data-piece-index="${pieceIndex}"
                  aria-label="Instrument ${instrumentIndex + 1}, piece ${pieceIndex + 1} comments"
                >${esc(piece.comment)}</textarea>
              </td>
            </tr>
            ${ratingRows}
            <tr class="ocr-separator"><td colspan="8"></td></tr>
          `;
        }).join("");

        return `
          <article class="senior-paper senior-instrument-paper" data-instrument-index="${instrumentIndex}" aria-label="Instrument ${instrumentIndex + 1} assessment sheet${continuation ? ", pieces 5–8" : ", pieces 1–4"}">
            <table class="senior-ocr-table">
              <colgroup>
                <col style="width:34%">
                ${BAND_OPTIONS.map(() => '<col style="width:6.5%">').join("")}
                <col style="width:8%">
                <col style="width:25.5%">
              </colgroup>
              <thead>
                <tr>
                  <th class="ocr-instrument-heading">
                    Instrument ${instrumentIndex + 1} / voice:
                    ${continuation ? `<div class="ocr-instrument-carried" data-instrument-carried="${instrumentIndex}">${esc(instrument.name)}</div>` : `${seniorInstrumentField(instrument, instrumentIndex)}
                      <label class="extra-pieces-control" data-extra-pieces-control><input type="checkbox" data-extra-pieces="${instrumentIndex}" ${usesExtraPieces(instrument) ? "checked" : ""}>Pieces 5–8</label>`}
                  </th>
                  ${BAND_OPTIONS.map((band, bandIndex) => `
                    <th class="ocr-band-heading ${bandIndex === 1 || bandIndex === 3 ? "ocr-shaded" : ""}">
                      <span class="ocr-vertical-heading">(${esc(band.range)}) ${esc(band.label)}</span>
                    </th>
                  `).join("")}
                  <th class="ocr-mark-heading"><span class="ocr-vertical-heading">Mark /10</span></th>
                  <th class="ocr-comments-heading">Comments</th>
                </tr>
              </thead>
              <tbody>
                ${pieces}
                ${showTotals ? `<tr>
                  <th class="ocr-total-label" colspan="7">TOTAL MARK – instrument ${instrumentIndex + 1} or voice</th>
                  <td class="ocr-total-value raw">${esc(rawTotal)}</td>
                </tr>
                <tr>
                  <th class="ocr-total-label" colspan="7">FINAL SCALED MARK – instrument ${instrumentIndex + 1} or voice</th>
                  <td class="ocr-total-value">${scaledMark === "" ? "" : esc(Math.round(scaledMark))}<strong>/30</strong></td>
                </tr>` : ""}
              </tbody>
            </table>
          </article>
        `;
      }

      function seniorAssessmentHtml(pupil, template, record, dayPupils, {includeCover = false} = {}) {
        const locked = record.locked === true;
        const seniorPhase = ensureSeniorRecord(record);
        const instrumentMarks = seniorPhase.instruments.map(seniorInstrumentScaledMark);
        const totalMark = seniorTotalMark(record);
        const position = dayPupils.findIndex(item => item.id === pupil.id);
        const pupilArrow = (direction, neighbour) => `
          <button class="${window.MLH.ToolbarButtonClass} sheet-pupil-arrow" type="button"
            data-pupil-direction="${direction}" data-open-pupil="${esc(neighbour?.id)}"
            aria-label="${direction === "previous" ? "Previous pupil" : "Next pupil"}" ${neighbour ? "" : "disabled"}>
            <img src="./ui-icons/next.svg" alt="" class="h-[27.8px] w-[27.8px]${direction === "previous" ? " rotate-180" : ""}">
          </button>`;
        const levelOptions = [
          ["National 5", "National 5"],
          ["Higher", "Higher"],
          ["Advanced Higher", "Advanced Higher"]
        ].map(([value, label]) => `
          <button
            class="ocr-level-option"
            type="button"
            data-senior-level-option="${esc(value)}"
            aria-pressed="${seniorPhase.qualificationLevel === value}"
            aria-label="Set qualification level to ${esc(value)}"
          >
            <span class="ocr-level-box" aria-hidden="true">✓</span>
            <span>${esc(label)}</span>
          </button>
        `).join("");

        return `
          <main class="sheet-main">
            <nav class="sheet-toolbar senior-sheet-toolbar" aria-label="Assessment sheet controls">
              <div class="sheet-pupil-context">
                <button class="${window.MLH.ToolbarButtonClass} gap-2" type="button" data-back-dashboard>
                  <img src="./ui-icons/next.svg" alt="" aria-hidden="true" class="h-[27.8px] w-[27.8px] rotate-180">
                  <span>Back</span>
                </button>
                ${!includeCover ? `
                  <button class="${window.MLH.ToolbarButtonClass} sheet-edit-lock" type="button"
                    data-toggle-sheet-lock aria-pressed="${locked}" title="${locked ? "Unlock assessment" : "Lock assessment"}">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
                      <rect x="5" y="10" width="14" height="11" rx="2"/>
                      <path d="${locked ? "M8 10V7a4 4 0 1 1 8 0v3" : "M8 10V7a4 4 0 0 1 7.8-1.3"}M12 15v1.5"/>
                    </svg>
                    <span>${locked ? "Locked" : "Unlocked"}</span>
                  </button>` : ""}
              </div>
              <div class="sheet-toolbar-group">
                ${pupilArrow("previous", dayPupils[position - 1])}
                <div class="sheet-pupil-details">
                  ${position >= 0 ? `<span class="sheet-position" aria-hidden="true">${position + 1}/${dayPupils.length}</span><span class="sr-only">Pupil ${position + 1} of ${dayPupils.length}</span>` : ""}
                  <strong class="sheet-pupil-name">${esc(pupil.name)}</strong>
                  ${!includeCover ? `<button class="sheet-edit-details" type="button" data-edit-prelim-pupil${locked ? " disabled" : ""}>Edit</button>` : ""}
                </div>
                ${pupilArrow("next", dayPupils[position + 1])}
              </div>
              <div class="sheet-toolbar-actions">
                <a class="button utility-button secondary" href="./assessment-recorder/music-performance-summary-statements.pdf" target="_blank" rel="noopener">Summary Statements</a>
              </div>
            </nav>

            <fieldset class="sheet-scroll" aria-label="Senior phase performing assessment for ${esc(pupil.name)}"${locked ? " disabled" : ""}>
              <div class="senior-pages">
                ${includeCover ? `<article class="senior-paper senior-cover" aria-label="Performing assessment cover sheet">
                  <section class="ocr-cover-marks" aria-label="Scaled marks">
                    <div class="ocr-cover-mark">
                      <span>Instrument 1</span>
                      <div class="ocr-cover-score"><span>${instrumentMarks[0] === "" ? "" : esc(Math.round(instrumentMarks[0]))}</span><span>/30</span></div>
                    </div>
                    <div class="ocr-cover-mark">
                      <span>Instrument 2</span>
                      <div class="ocr-cover-score"><span>${instrumentMarks[1] === "" ? "" : esc(Math.round(instrumentMarks[1]))}</span><span>/30</span></div>
                    </div>
                    <div class="ocr-cover-mark">
                      <span>Total</span>
                      <div class="ocr-cover-score"><span class="calculated-value">${totalMark === "" ? "0" : esc(Math.round(totalMark))}</span><span>/60</span></div>
                    </div>
                  </section>

                  <h2 class="ocr-cover-title">Music: Performing Assessment</h2>
                  <img class="ocr-cover-quavers" src="./ui-icons/assessment-cover-quavers.svg" alt="" aria-hidden="true">

                  <div class="ocr-cover-details">
                  <section class="ocr-cover-field" aria-label="Qualification level">
                    <span class="ocr-cover-field-label">Level</span>
                    <div class="ocr-level-options">${levelOptions}</div>
                  </section>

                  <label class="ocr-cover-field">
                    <span class="ocr-cover-field-label">Name</span>
                    <input class="ocr-cover-name" value="${esc(pupil.name)}" disabled aria-label="Pupil name">
                  </label>
                  </div>
                </article>` : ""}

                ${seniorPhase.instruments.map((instrument, instrumentIndex) =>
                  seniorInstrumentPageHtml(template, seniorPhase, instrumentIndex) +
                  (usesExtraPieces(instrument) ? seniorInstrumentPageHtml(template, seniorPhase, instrumentIndex, true) : "")
                ).join("")}
              </div>
            </fieldset>
          </main>
        `;
      }

      // Reuse the assessment renderer with a fresh record; never copy the current pupil's data.
      let assessmentWorksheetPreparing = false;
      function assessmentWorksheetOptions() {
        return {...Object.fromEntries([...app.querySelectorAll("[data-worksheet-option]")].map(input => [input.dataset.worksheetOption, input.checked])), title:app.querySelector("[data-worksheet-title]").value};
      }

      function blankAssessmentTemplateHtml(options = {cover:true, instrument1:true, instrument2:true, extraPieces:false, level:true, name:true, scores:true, quavers:true}) {
        const blankRecord = {};
        ensureSeniorRecord(blankRecord).instruments.forEach(instrument => { instrument.extraPieces = Boolean(options.extraPieces); });
        const blankPupil = {id:"blank-template", name:""};
        const markup = seniorAssessmentHtml(blankPupil, SENIOR_TEMPLATE, blankRecord, [], {includeCover:true});
        const documentCopy = new DOMParser().parseFromString(markup, "text/html");
        const pages = [...documentCopy.querySelectorAll(".senior-paper")];
        pages.forEach(page => {
          page.querySelectorAll(".ocr-rating-button, .ocr-piece-mark-steppers, [data-extra-pieces-control], datalist").forEach(control => control.remove());
          page.querySelectorAll(".ocr-level-option").forEach(button => {
            const field = documentCopy.createElement("div");
            field.className = "ocr-level-option";
            field.innerHTML = button.innerHTML;
            field.querySelector(".ocr-level-box").textContent = "";
            button.replaceWith(field);
          });
          page.querySelectorAll("input, textarea, select").forEach(control => {
            const field = documentCopy.createElement("div");
            field.className = control.className;
            field.classList.add("blank-template-field");
            control.replaceWith(field);
          });
          page.querySelectorAll(".ocr-cover-score > span:first-child").forEach(value => value.textContent = "");
          page.querySelectorAll(".ocr-total-value.raw").forEach(value => value.textContent = "");
        });
        pages[0].querySelector(".ocr-cover-title").textContent = options.title ?? "Music: Performing Assessment";
        if (!options.level) pages[0].querySelector('[aria-label="Qualification level"]').remove();
        if (!options.name) pages[0].querySelector("label.ocr-cover-field").remove();
        if (!options.scores) pages[0].querySelector(".ocr-cover-marks").remove();
        if (!options.quavers) pages[0].querySelector(".ocr-cover-quavers").remove();
        const chosen = pages.filter(page => page.classList.contains("senior-cover") ? options.cover : options[`instrument${Number(page.dataset.instrumentIndex) + 1}`]);
        return chosen.map(page => page.outerHTML).join("");
      }

      function closeAssessmentWorksheet() {
        document.body.classList.remove("assessment-blank-template");
        window.MLH.worksheetHeaderMode = null;
        render();
      }

      window.MLH.openAssessmentWorksheet = () => {
        if (view.mode !== "dashboard") return;
        document.body.classList.add("assessment-blank-template");
        window.MLH.worksheetHeaderMode = {
          title:"Digital Performance Assessment",
          icon:"./app-icons/performing-assessment-icon.svg", onExit:closeAssessmentWorksheet
        };
        window.MLH.renderAssessmentHeader(true);
        app.innerHTML = `<div class="assessment-worksheet-builder worksheet-builder">
          <div class="assessment-worksheet-settings">
            <div class="assessment-worksheet-intro"><h2><img src="./app-icons/performing-assessment-icon.svg" alt="">Digital Performance Assessment</h2><p>Generate blank performing assessment templates.</p></div>
            <section class="assessment-worksheet-customise"><h2><img src="./ui-icons/customise.svg" alt="">Customise</h2><p>Adjust the worksheet content.</p>
              <label for="assessmentWorksheetTitle">Title</label><input id="assessmentWorksheetTitle" data-worksheet-title value="Music: Performing Assessment">
              <fieldset class="assessment-worksheet-options"><legend>Pages</legend>
                <label><input type="checkbox" class="worksheet-checkbox" data-worksheet-option="cover" checked>Cover Page</label>
                <label><input type="checkbox" class="worksheet-checkbox" data-worksheet-option="instrument1" checked>Instrument 1</label>
                <label><input type="checkbox" class="worksheet-checkbox" data-worksheet-option="instrument2" checked>Instrument 2</label>
                <label><input type="checkbox" class="worksheet-checkbox" data-worksheet-option="extraPieces">Pieces 5-8</label>
              </fieldset>
              <fieldset class="assessment-worksheet-options" id="assessmentCoverOptions"><legend>Cover Page</legend>
                <label><input type="checkbox" class="worksheet-checkbox" data-worksheet-option="level" checked>Level</label>
                <label><input type="checkbox" class="worksheet-checkbox" data-worksheet-option="name" checked>Name</label>
                <label><input type="checkbox" class="worksheet-checkbox" data-worksheet-option="scores" checked>Scores</label>
                <label><input type="checkbox" class="worksheet-checkbox" data-worksheet-option="quavers" checked>Graphic</label>
              </fieldset>
              <div class="assessment-worksheet-actions"><button type="button" data-download-blank-template><img src="./ui-icons/download.svg" alt="" aria-hidden="true">Download</button><button type="button" data-print-blank-template><img src="./ui-icons/worksheet.svg?v=20261103-worksheet-svg-2" alt="" aria-hidden="true">Print</button></div>
              <p class="assessment-worksheet-error" role="alert" hidden></p>
            </section>
          </div>
          <section class="worksheet-preview-panel" aria-label="Worksheet preview"><h2><img src="./ui-icons/worksheet.svg?v=20261103-worksheet-svg-2" alt="">Preview</h2><p>Updates automatically as you change the options.</p><div class="assessment-template-preview"><div class="senior-pages">${blankAssessmentTemplateHtml()}</div></div></section>
        </div>`;
        const extraPiecesOption = app.querySelector('[data-worksheet-option="extraPieces"]');
        extraPiecesOption.defaultChecked = false;
        extraPiecesOption.checked = false;
        app.querySelectorAll("[data-worksheet-option]").forEach(input => input.addEventListener("change", updateAssessmentWorksheetPreview));
        app.querySelector("[data-worksheet-title]").addEventListener("input", updateAssessmentWorksheetPreview);
        updateAssessmentWorksheetPreview();
      };

      function updateAssessmentWorksheetPreview() {
        const options = assessmentWorksheetOptions();
        document.getElementById("assessmentCoverOptions").disabled = !options.cover;
        const hasPages = options.cover || options.instrument1 || options.instrument2;
        app.querySelector(".assessment-template-preview .senior-pages").innerHTML = hasPages
          ? blankAssessmentTemplateHtml(options)
          : '<p class="assessment-template-empty">Select at least one sheet to preview.</p>';
        app.querySelectorAll(".assessment-worksheet-actions button").forEach(button => { button.disabled = !hasPages || assessmentWorksheetPreparing; });
      };

      let assessmentPdfAssetsPromise;
      async function assessmentPdfAssets() {
        if (!assessmentPdfAssetsPromise) assessmentPdfAssetsPromise = (async () => {
          const encode = buffer => {
            const bytes = new Uint8Array(buffer); let binary = "";
            for (let offset=0; offset<bytes.length; offset+=32768) binary += String.fromCharCode(...bytes.subarray(offset,offset+32768));
            return btoa(binary);
          };
          const getFont = async file => {
            const response = await fetch(new URL(`./fonts/${file}`, document.baseURI));
            if (!response.ok) throw new Error("The assessment fonts could not be loaded.");
            return encode(await response.arrayBuffer());
          };
          const [regular,bold] = await Promise.all([getFont("Trebuchet%20MS.ttf"),getFont("Trebuchet%20MS%20Bold.ttf")]);
          const image = new Image(); image.src = new URL("./ui-icons/assessment-cover-quavers.svg",document.baseURI).href;
          await image.decode();
          const canvas = document.createElement("canvas"); canvas.width=800;canvas.height=800;
          canvas.getContext("2d").drawImage(image,0,0,800,800);
          return {fonts:{regular,bold},graphic:canvas.toDataURL("image/png")};
        })().catch(error => { assessmentPdfAssetsPromise=null; throw error; });
        return assessmentPdfAssetsPromise;
      }

      async function newAssessmentPdf() {
        if (!window.jspdf || !window.AssessmentPdf) throw new Error("The PDF tools could not be loaded. Refresh the page and try again.");
        const assets = await assessmentPdfAssets();
        return {pdf:window.AssessmentPdf.create(window.jspdf.jsPDF,assets.fonts),graphic:assets.graphic};
      }

      function drawAssessmentPdfPages(pdf,graphic,record,pupilName,title,{blank=false,options={cover:true,instrument1:true,instrument2:true}}={}) {
        const phase = ensureSeniorRecord(record);
        if (options.cover) window.AssessmentPdf.cover(pdf,{pupilName,level:phase.qualificationLevel,title,instruments:phase.instruments,blank,options,graphic});
        phase.instruments.forEach((instrument,instrumentIndex) => {
          if (!options[`instrument${instrumentIndex+1}`]) return;
          const extended = options.extraPages !== false && usesExtraPieces(instrument);
          window.AssessmentPdf.instrument(pdf,{instrument,instrumentIndex,extended,pupilName,level:phase.qualificationLevel,title,blank});
          if (extended) window.AssessmentPdf.instrument(pdf,{instrument,instrumentIndex,continuation:true,extended,pupilName,level:phase.qualificationLevel,title,blank});
        });
        window.AssessmentPdf.additionalComments(pdf,{pupilName,level:phase.qualificationLevel,title});
      }

      async function outputBlankAssessmentPdf(mode) {
        const buttons = [...app.querySelectorAll(".assessment-worksheet-actions button")];
        if (assessmentWorksheetPreparing || buttons.some(button => button.disabled)) return;
        const error = app.querySelector(".assessment-worksheet-error");
        error.hidden = true;
        let printWindow;
        try {
          if (mode === "print") {
            printWindow = window.open("", "_blank");
            if (!printWindow) throw new Error("Allow pop-ups for the Hub, then try Print again.");
            printWindow.document.body.textContent = "Preparing worksheet for printing…";
          }
          assessmentWorksheetPreparing = true;
          buttons.forEach(button => { button.disabled = true; });
          const active = app.querySelector(mode === "print" ? "[data-print-blank-template]" : "[data-download-blank-template]");
          active.textContent = "Preparing…";
          const options = assessmentWorksheetOptions();
          const record = {};
          ensureSeniorRecord(record).instruments.forEach(instrument => { instrument.extraPieces = Boolean(options.extraPieces); });
          const {pdf,graphic} = await newAssessmentPdf();
          drawAssessmentPdfPages(pdf,graphic,record,"",options.title,{blank:true,options});
          if (printWindow) {
            const url = URL.createObjectURL(pdf.output("blob"));
            printWindow.addEventListener("load", () => setTimeout(() => { try { printWindow.focus(); printWindow.print(); } catch {} }, 500), {once:true});
            printWindow.location.replace(url);
            setTimeout(() => URL.revokeObjectURL(url), 300000);
          } else pdf.save("Blank Performing Assessment.pdf");
        } catch (failure) {
          printWindow?.close();
          error.textContent = failure.message || "The worksheet PDF could not be created. Please try again.";
          error.hidden = false;
        } finally {
          assessmentWorksheetPreparing = false;
          buttons.forEach(button => { button.innerHTML = button.matches("[data-print-blank-template]") ? '<img src="./ui-icons/worksheet.svg?v=20261103-worksheet-svg-2" alt="" aria-hidden="true">Print' : '<img src="./ui-icons/download.svg" alt="" aria-hidden="true">Download'; });
          if (app.querySelector(".assessment-worksheet-builder")) updateAssessmentWorksheetPreview();
        }
      }

      function classAssessmentScoreRows(klass, assessment) {
        return [
          ["Name", "Level", "Instrument 1", "Instrument 1 raw mark", "Instrument 1 scaled /30", "Instrument 2", "Instrument 2 raw mark", "Instrument 2 scaled /30", "Final score /60"],
          ...klass.pupils.map(pupil => {
            const record = assessment.records?.[pupil.id] || {};
            const senior = record.seniorPhase || {};
            const instruments = [senior.instruments?.[0], senior.instruments?.[1]];
            const marks = instruments.map(instrument => {
              const scaled = seniorInstrumentScaledMark(instrument);
              return scaled === "" ? ["", ""] : [seniorInstrumentRawTotal(instrument), Math.round(scaled)];
            });
            const total = seniorTotalMark(record);
            return [pupil.name, senior.qualificationLevel ?? assessment.qualificationLevel ?? "", instruments[0]?.name || "", ...marks[0], instruments[1]?.name || "", ...marks[1], total === "" ? "" : Math.round(total)];
          })
        ];
      }

      let spreadsheetTemplatePromise;
      async function newAssessmentSpreadsheet(klass, assessment) {
        if (!window.JSZip || !window.AssessmentSpreadsheet) throw new Error("The spreadsheet tools could not be loaded. Refresh and try again.");
        if (!spreadsheetTemplatePromise) spreadsheetTemplatePromise = fetch(new URL('./assessment-recorder/assessment-scores-template.xlsx?v=2',document.baseURI))
          .then(response => { if (!response.ok) throw new Error('The spreadsheet template could not be loaded.'); return response.arrayBuffer(); })
          .catch(error => { spreadsheetTemplatePromise=null; throw error; });
        return window.AssessmentSpreadsheet.create(window.JSZip,await spreadsheetTemplatePromise,classAssessmentScoreRows(klass,assessment),{className:klass.name,assessmentName:assessment.title});
      }

      let classAssessmentExportBusy = false;
      function classExportPlan(klass, assessment, mode, options) {
        const pupils = pupilsInRunningOrder(klass, mode === "download" ? "all" : options.date ?? "all").filter(pupil =>
          options.pupilId === "all" || pupil.id === options.pupilId);
        const includePdf = mode === "print" || options.pdf;
        const includeScores = mode === "download" && options.scores;
        const pageCount = includePdf ? pupils.reduce((count,pupil) => {
          const instruments = assessment.records?.[pupil.id]?.seniorPhase?.instruments || [];
          return count + Number(options.cover) + [0,1].reduce((sum,index) => sum +
            (options[`instrument${index+1}`] ? 1 + Number(options.extraPages && usesExtraPieces(instruments[index] || {})) : 0),0);
        },0) : 0;
        return {pupils,includePdf,includeScores,pageCount,valid:Boolean(pupils.length && (includePdf || includeScores) && (!includePdf || pageCount))};
      }

      function assessmentExportSources(mode) {
        if (mode === "download") {
          return state.classes.flatMap(klass => klass.assessments.map(assessment => ({klass, assessment})));
        }
        const klass = currentClass(), assessment = currentAssessment();
        return klass && assessment ? [{klass, assessment}] : [];
      }

      function exportPupilKey(klass, assessment, pupil) {
        return JSON.stringify([klass.id, assessment.id, pupil.id]);
      }

      function assessmentExportGroups(sources, mode, options) {
        return sources.flatMap(({klass, assessment}) => {
          let {pupilId} = options;
          if (pupilId !== "all") {
            pupilId = klass.pupils.find(pupil => exportPupilKey(klass, assessment, pupil) === options.pupilId)?.id;
            if (pupilId === undefined) return [];
          }
          const plan = classExportPlan(klass, assessment, mode, {...options, pupilId});
          return plan.valid ? [{klass:{...klass, pupils:plan.pupils}, assessment, ...plan}] : [];
        });
      }

      function classExportDialogOptions() {
        const checked = id => document.getElementById(id).checked;
        return {pupilId:document.getElementById("classExportPupils").value,date:view.date,pdf:checked("classExportPdf"),scores:checked("classExportScores"),cover:true,instrument1:true,instrument2:true,extraPages:true};
      }

      function refreshClassExportDialog() {
        const form = document.getElementById("classExportForm");
        const mode = form.dataset.mode;
        const options = classExportDialogOptions();
        const sources = assessmentExportSources(mode);
        const groups = assessmentExportGroups(sources,mode,options);
        const count = groups.reduce((total,group) => total + group.pupils.length,0);
        document.getElementById("classExportSubmit").disabled = !groups.length;
        document.getElementById("classExportPdfCount").textContent = `(${count})`;
        const error = document.getElementById("classExportError");
        error.hidden = Boolean(groups.length);
        error.textContent = groups.length ? "" : mode === "download" && !options.pdf && !options.scores
          ? "Select at least one file." : "No pupils match this selection.";
      }

      function openClassExportDialog(mode) {
        const sources = assessmentExportSources(mode);
        if (classAssessmentExportBusy || !sources.some(({klass}) => klass.pupils.length)) return;
        const form = document.getElementById("classExportForm");
        form.reset(); form.dataset.mode = mode;
        document.querySelectorAll("details.assessment-picker[open]").forEach(menu => menu.open=false);
        const label = mode === "print" ? "Print" : "Download";
        document.getElementById("classExportTitle").textContent = label;
        document.getElementById("classExportSubmit").textContent = label;
        document.getElementById("classExportFiles").hidden = mode === "print";
        const pupilOptions = sources.map(({klass, assessment}) => {
          const pupils = pupilsInRunningOrder(klass, mode === "download" ? "all" : view.date);
          const options = pupils.map(pupil => `<option value="${esc(exportPupilKey(klass, assessment, pupil))}">${esc(pupil.name)}</option>`).join("");
          return sources.length > 1 && options ? `<optgroup label="${esc(sessionLabel(klass, assessment))}">${options}</optgroup>` : options;
        }).join("");
        const allLabel = mode === "download" ? "All Pupils" : "All";
        document.getElementById("classExportPupils").innerHTML = `<option value="all">${allLabel}</option>${pupilOptions}`;
        refreshClassExportDialog();
        document.getElementById("classExportDialog").showModal();
      }
      document.getElementById("classExportForm").addEventListener("change",refreshClassExportDialog);
      document.getElementById("classExportForm").addEventListener("submit",event => {
        event.preventDefault();
        const mode = event.currentTarget.dataset.mode, options = classExportDialogOptions();
        if (!assessmentExportGroups(assessmentExportSources(mode),mode,options).length) return;
        document.getElementById("classExportDialog").close();
        outputClassAssessments(mode,options);
      });

      async function outputClassAssessments(mode, options) {
        if (classAssessmentExportBusy) return;
        const sources = JSON.parse(JSON.stringify(assessmentExportSources(mode)));
        const groups = assessmentExportGroups(sources,mode,options);
        if (!groups.length) return;
        const pupilCount = groups.reduce((total,group) => total + group.pupils.length,0);
        const fileCount = groups.reduce((total,group) => total +
          (group.includePdf ? group.pupils.length : 0) + Number(group.includeScores),0);
        const buttons = [...app.querySelectorAll("[data-download-class-assessments], [data-clear-all-data]")];
        const status = app.querySelector(".recorder-export-status");
        const safeFilename = value => value.replace(/[<>:"/\\|?*\x00-\x1f]/g, "_");
        let printWindow;
        classAssessmentExportBusy = true;
        buttons.forEach(button => button.disabled = true);
        try {
          if (mode === "print") {
            printWindow = window.open("", "_blank");
            if (!printWindow) throw new Error("Allow pop-ups for the Hub, then try Print again.");
            printWindow.document.body.textContent = "Preparing assessment sheets…";
          }
          const needsZip = mode === "download" && fileCount > 1;
          if (needsZip && !window.JSZip) throw new Error("The export tools could not be loaded. Refresh the page and try again.");
          const files = [];
          let prepared;
          let processedPupils = 0;
          for (const [groupIndex, {klass,assessment,pupils,includePdf,includeScores}] of groups.entries()) {
            const filename = safeFilename(`${klass.name} - ${assessment.title}`);
            const folder = groups.length > 1 ? `${groupIndex + 1} - ${filename}/` : "";
            for (const [pupilIndex,pupil] of (includePdf ? pupils : []).entries()) {
              // Each download starts a fresh document; printing retains a combined document.
              if (!printWindow || !prepared) prepared = await newAssessmentPdf();
              status.textContent = `Preparing ${++processedPupils} of ${pupilCount}…`;
              const record = ensureRecord(assessment,pupil);
              drawAssessmentPdfPages(prepared.pdf,prepared.graphic,record,pupil.name,assessment.title,{options});
              if (!printWindow) {
                const name = safeFilename(`${String(pupilIndex+1).padStart(2,"0")} - ${pupil.name} - ${assessment.title}.pdf`);
                files.push({name:folder+name,type:"application/pdf",data:prepared.pdf.output("arraybuffer")});
              }
            }
            if (includeScores) {
              files.push({name:`${folder}${filename} - Scores.xlsx`,type:"application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                data:await newAssessmentSpreadsheet(klass,assessment)});
            }
          }
          if (printWindow) {
            const url = URL.createObjectURL(prepared.pdf.output("blob"));
            printWindow.addEventListener("load", () => setTimeout(() => { try { printWindow.focus(); printWindow.print(); } catch {} }, 500), {once:true});
            printWindow.location.replace(url);
            setTimeout(() => URL.revokeObjectURL(url), 300000);
          } else if (needsZip) {
            const zip = new window.JSZip();
            files.forEach(file => zip.file(file.name, file.data));
            const [{klass,assessment}] = groups;
            const filename = groups.length > 1 ? "Digital Performance Assessment" : safeFilename(`${klass.name} - ${assessment.title}`);
            download(`${filename}.zip`, "application/zip", await zip.generateAsync({type:"blob", compression:"DEFLATE"}));
          } else {
            const [file] = files;
            download(file.name,file.type,file.data);
          }
          status.textContent = mode === "print" ? "Assessment sheets ready." : "Selected files downloaded.";
        } catch (error) {
          printWindow?.close();
          status.textContent = error.message || "The assessments could not be exported. Please try again.";
        } finally {
          classAssessmentExportBusy = false;
          buttons.forEach(button => button.disabled = false);
        }
      }

      function pupilsInRunningOrder(klass, date = view.date, {includeUnassigned = true} = {}) {
        const pupils = klass.pupils.filter(pupil => date === "all" || (pupil.date || "") === date ||
          (includeUnassigned && !pupil.date));
        return pupils.sort(window.AssessmentPrelimRoster.compareSchedule);
      }

      function normalisePupilSearch(value) {
        return value.normalize("NFD").replace(/\p{M}/gu, "").toLocaleLowerCase("en-GB");
      }

      function displayRosterLevel(level) {
        return level === "Advanced Higher" ? "Adv. Higher" : level;
      }

      function indexPupilDetails(pupil, record, assessment, klass, details) {
        const {day, level, instruments, progressLabel, instrument1Mark, instrument2Mark, totalMark} = details;
        const fields = {
          level:[level],
          teacher:[pupil.teacher],
          assessor:[pupil.assessor ?? klass.assessor],
          instrument:[...instruments.map(instrument => instrument.name), record?.instrument],
          progress:[progressLabel]
        };
        const marks = [instrument1Mark, instrument2Mark, totalMark].map((mark, index) =>
          mark === "" ? "" : `${Math.round(mark)}/${index === 2 ? 60 : 30}`);
        const searchText = [
          pupil.name, pupil.date, window.AssessmentPrelimRoster.formatDate(pupil.date),
          day, displayRosterLevel(level),
          pupil.order ? `Order ${pupil.order}` : "", pupil.session, pupil.teachingClass, klass.name, assessment.title,
          ...Object.values(fields).flat(), ...marks, record?.instrument, record?.piece, record?.comment,
          ...instruments.flatMap(instrument => (instrument.pieces || []).flatMap(piece => [
            piece.title, piece.comment, piece.score,
            ...Object.values(piece.ratings || {}).map(id => BAND_OPTIONS.find(band => band.id === id)?.label)
          ]))
        ].join(" ");
        pupilIndex.set(pupil.id, {searchText:normalisePupilSearch(searchText), fields});
      }

      function pupilFilterOptions() {
        return Object.entries(pupilFilterFields).map(([key, label]) => {
          const value = pupilFilters[key] || "";
          const options = new Map();
          const candidates = [value, ...Array.from(pupilIndex.values()).flatMap(entry => entry.fields[key])];
          for (const candidate of candidates) {
            if (typeof candidate === "string" && candidate) {
              const normalised = normalisePupilSearch(candidate);
              if (!options.has(normalised)) options.set(normalised, candidate);
            }
          }
          return {key, label, value, options:[...options.values()].sort((a,b) => a.localeCompare(b, "en-GB"))};
        }).filter(field => field.options.length);
      }

      function pupilFilterLabel() {
        const selected = Object.values(pupilFilters).filter(Boolean).length;
        return selected ? `Filter (${selected})` : "Filter";
      }

      function filterPupilRows() {
        const label = app.querySelector("[data-pupil-filter-label]");
        if (label) label.textContent = pupilFilterLabel();
        app.querySelector("#rosterFilter")?.classList.toggle("has-active-filters", Object.values(pupilFilters).some(Boolean));
        const empty = app.querySelector("[data-pupil-search-empty]");
        if (!empty) return;
        const words = normalisePupilSearch(pupilSearch).trim().split(/\s+/).filter(Boolean);
        const filters = Object.entries(pupilFilters).filter(([,value]) => value)
          .map(([field,value]) => [field, normalisePupilSearch(value)]);
        let match = false;
        for (const row of app.querySelectorAll("[data-pupil-id]")) {
          const {searchText, fields} = pupilIndex.get(row.dataset.pupilId);
          row.hidden = !words.every(word => searchText.includes(word)) ||
            !filters.every(([field,value]) => fields[field].some(candidate =>
              typeof candidate === "string" && normalisePupilSearch(candidate) === value));
          if (!row.hidden) match = true;
        }
        empty.hidden = match;
      }

      function assessmentHtml() {
        const klass = currentClass();
        const assessment = currentAssessment();
        const pupil = currentPupil();
        if (!klass || !assessment || !pupil) {
          view.mode = "dashboard";
          return dashboardHtml();
        }

        const record = ensureRecord(assessment, pupil);
        const dayPupils = pupilsInRunningOrder(klass, pupil.date || "", {includeUnassigned:false});
        return seniorAssessmentHtml(pupil, SENIOR_TEMPLATE, record, dayPupils);
      }

      function fitPupilName(name) {
        name.style.fontSize = "";
        name.style.whiteSpace = "nowrap";
        const text = document.createRange();
        text.selectNodeContents(name);
        const textWidth = text.getBoundingClientRect().width;
        const availableWidth = name.getBoundingClientRect().width;
        if (textWidth > availableWidth) {
          const fontSize = parseFloat(getComputedStyle(name).fontSize);
          name.style.fontSize = `${Math.max(16, Math.floor(fontSize * availableWidth / textWidth))}px`;
        }
        name.style.whiteSpace = "";
      }

      function loadSheetZoom() {
        try {
          const zoom = Number(sessionStorage.getItem(SHEET_ZOOM_KEY));
          if (Number.isInteger(zoom) && zoom >= MIN_SHEET_ZOOM && zoom <= MAX_SHEET_ZOOM) return zoom;
        } catch {
          // The current tab can still zoom when browser storage is unavailable.
        }
        return 100;
      }

      function applySheetZoom() {
        const sheet = app.querySelector(".sheet-scroll");
        if (!sheet) return;
        const pages = sheet.querySelector(".senior-pages");
        pages.style.setProperty("--recorder-sheet-width", `${sheet.clientWidth}px`);
        pages.style.setProperty("--recorder-sheet-scale", sheetZoom / 100);
      }

      function renderRecorderHeader(sheetMode) {
        window.MLH.renderAssessmentHeader(false, !sheetMode, sheetMode ? {
          percent:sheetZoom, min:MIN_SHEET_ZOOM, max:MAX_SHEET_ZOOM,
          onStep(direction) {
            sheetZoom = Math.min(MAX_SHEET_ZOOM, Math.max(MIN_SHEET_ZOOM, sheetZoom + direction * 10));
            try {
              sessionStorage.setItem(SHEET_ZOOM_KEY, String(sheetZoom));
            } catch {
              // Keep the new zoom for the current page when storage is unavailable.
            }
            applySheetZoom();
            renderRecorderHeader(true);
          }
        } : null);
      }

      function render() {
        if (!currentAssessment()) {
          const first = state.classes.find(klass => klass.assessments.length);
          view.classId = first?.id || null;
          view.assessmentId = first?.assessments[0].id || null;
        }
        const klass = currentClass();
        const dates = klass ? rosterDates(klass) : [];
        if (view.date !== "all" && (!dates.some(Boolean) || !dates.includes(view.date))) {
          view.date = dates.find(Boolean) || "all";
        }
        pupilIndex.clear();
        const content = view.mode === "assessment" ? assessmentHtml() : dashboardHtml();
        const sheetMode = view.mode === "assessment";
        rememberRecorderView();
        const sidebarClass = sheetMode ? "sidebar-hidden" : "";
        renderRecorderHeader(sheetMode);
        disposeDateMenu?.();
        disposeFilterMenu?.();
        sheetPreviewObserver?.disconnect();
        app.innerHTML = `<div class="app-shell ${sheetMode ? "sheet-mode" : ""} ${sidebarClass}">${content}</div>`;
        const setupDialog = app.querySelector(".recorder-start-guide");
        if (setupDialog) {
          setupDialog.addEventListener("cancel", event => event.preventDefault());
          setupDialog.showModal();
        }
        const sheetPreview = app.querySelector(".recorder-sheet-preview");
        if (sheetPreview && sheetPreviewObserver) {
          sheetPreviewObserver.observe(sheetPreview);
        }
        if (sheetMode && sheetZoom !== 100) applySheetZoom();
        const pupilName = app.querySelector(".sheet-pupil-name");
        if (pupilName) {
          fitPupilName(pupilName);
          if (document.fonts?.status === "loading") document.fonts.ready.then(() => {
            if (pupilName.isConnected) fitPupilName(pupilName);
          });
        }
        const dateMenu = app.querySelector("#recorderDateMenu");
        disposeDateMenu = dateMenu ? window.MLH.renderAssessmentDateMenu(dateMenu, rosterDateGroups(), selectRosterDate) : null;
        const filterMenu = app.querySelector("#recorderFilterMenu");
        disposeFilterMenu = filterMenu ? window.MLH.renderAssessmentFilterMenu(filterMenu, pupilFilterOptions()) : null;
        filterPupilRows();
      }

      function selectRosterDate({classId, assessmentId, date}) {
        if (classId !== view.classId || assessmentId !== view.assessmentId) pupilFilters = {};
        view = { mode:"dashboard", classId, assessmentId, date, pupilId:null, filter:"all" };
        pupilSort = { key:null, direction:"ascending" };
        render();
        app.querySelector("#rosterPicker")?.focus();
      }

      function openPupil(pupilId, fromRoster = false) {
        view.mode = "assessment";
        view.pupilId = pupilId;
        render();
        if (fromRoster) app.querySelector("[data-back-dashboard]")?.focus({preventScroll:true});
        window.scrollTo({ top: 0, behavior: "smooth" });
      }

      function updateSeniorPieceField(element, {restoreInvalid = false} = {}) {
        const assessment = currentAssessment();
        const pupil = currentPupil();
        if (!assessment || !pupil) return;
        const record = ensureRecord(assessment, pupil);
        const seniorPhase = ensureSeniorRecord(record);
        const instrumentIndex = Number(element.dataset.instrumentIndex);
        const pieceIndex = Number(element.dataset.pieceIndex);
        const piece = seniorPhase.instruments[instrumentIndex]?.pieces[pieceIndex];
        if (!piece) return;
        const field = element.dataset.seniorPieceField;
        if (field === "score" && element.validity?.badInput) {
          if (restoreInvalid) element.value = piece.score;
          return;
        }
        let value = element.value;
        if (field === "score" && value !== "") {
          value = Math.max(0, Math.min(10, Number(value)));
          element.value = value;
        }
        if (value === piece[field]) return;
        piece[field] = value;
        if (field === "score") {
          syncSeniorScore(record);
          app.querySelectorAll(`.senior-instrument-paper[data-instrument-index="${instrumentIndex}"]`).forEach(page => {
            const raw = page.querySelector(".ocr-total-value.raw");
            const scaled = page.querySelector(".ocr-total-value:not(.raw)");
            const instrument = seniorPhase.instruments[instrumentIndex];
            if (raw) raw.textContent = seniorInstrumentRawTotal(instrument);
            const mark = seniorInstrumentScaledMark(instrument);
            if (scaled) scaled.innerHTML = `${mark === "" ? "" : Math.round(mark)}<strong>/30</strong>`;
          });
        } else {
          syncCompletionDate(record);
        }
        record.updatedAt = new Date().toISOString();
        saveState("");
      }

      app.addEventListener("click", async (event) => {
        const target = event.target.closest("button, tr[data-pupil-id]");
        if (!target || target.matches(":disabled")) return;
        if (target.matches("[data-toggle-sheet-lock]")) {
          const pupil = currentPupil();
          const assessment = currentAssessment();
          if (!pupil || !assessment) return;
          const record = ensureRecord(assessment, pupil);
          const previousLock = record.locked;
          record.locked = previousLock !== true;
          target.disabled = true;
          app.querySelector(".sheet-scroll").disabled = true;
          app.querySelector("[data-edit-prelim-pupil]").disabled = true;
          if (!await saveState("")) record.locked = previousLock;
          if (target.isConnected) {
            render();
            app.querySelector("[data-toggle-sheet-lock]")?.focus({preventScroll:true});
          }
          return;
        }
        if (target.matches("[data-download-class-assessments]")) {
          if (assessmentExportSources("download").some(({klass}) => klass.pupils.length)) openClassExportDialog("download");
          else downloadAssessmentBackup();
          return;
        }
        if (target.matches("[data-import-assessments]")) {
          if (importInProgress) return;
          if (state.classes.length) document.getElementById("recorderConfirmDialog").showModal();
          else importFile.click();
          return;
        }
        if (target.matches("[data-clear-all-data]")) {
          document.getElementById("recorderClearDataDialog").showModal();
          return;
        }
        if (target.matches("[data-add-pupil]")) { openPrelimPupilDialog(true); return; }
        if (target.matches("[data-clear-pupil-filters]")) {
          pupilFilters = {};
          app.querySelectorAll("[data-pupil-filter]").forEach(select => { select.value = ""; });
          filterPupilRows();
          return;
        }
        if (target.matches("[data-edit-prelim-pupil]")) { openPrelimPupilDialog(); return; }
        if (target.matches("[data-close-blank-template]")) {
          closeAssessmentWorksheet();
          return;
        }
        if (target.matches("[data-print-blank-template]")) { outputBlankAssessmentPdf("print"); return; }
        if (target.matches("[data-download-blank-template]")) { outputBlankAssessmentPdf("download"); return; }

        if (target.matches("[data-senior-level-option]")) {
          const record = ensureRecord(currentAssessment(), currentPupil());
          const seniorPhase = ensureSeniorRecord(record);
          const selectedLevel = target.dataset.seniorLevelOption;
          seniorPhase.qualificationLevel = seniorPhase.qualificationLevel === selectedLevel ? "" : selectedLevel;
          record.updatedAt = new Date().toISOString();
          saveState("");
          render();
          return;
        }
        if (target.dataset.sort) {
          pupilSort = {
            key: target.dataset.sort,
            direction: pupilSort.key === target.dataset.sort && pupilSort.direction === "ascending"
              ? "descending"
              : "ascending"
          };
          render();
          app.querySelector(`[data-sort="${target.dataset.sort}"]`)?.focus({preventScroll:true});
          return;
        }

        if (target.dataset.pupilId) { openPupil(target.dataset.pupilId, true); return; }
        if (target.dataset.openPupil) {
          openPupil(target.dataset.openPupil);
          const arrows = [...app.querySelectorAll("[data-pupil-direction]:enabled")];
          const nextFocus = arrows.find(arrow => arrow.dataset.pupilDirection === target.dataset.pupilDirection) ||
            arrows[0] || app.querySelector("[data-back-dashboard]");
          nextFocus?.focus({preventScroll:true});
          return;
        }
        if (target.matches("[data-back-dashboard]")) {
          const pupilId = view.pupilId;
          view.mode = "dashboard";
          view.pupilId = null;
          render();
          const row = [...app.querySelectorAll("tr[data-pupil-id]:not([hidden])")].find(item => item.dataset.pupilId === pupilId);
          (row || app.querySelector("#recorderPupilSearch"))?.focus({preventScroll:true});
          return;
        }

        if (target.dataset.seniorRating) {
          const [instrumentIndex, pieceIndex, criterionIndex, bandId] = target.dataset.seniorRating.split(":");
          const record = ensureRecord(currentAssessment(), currentPupil());
          const seniorPhase = ensureSeniorRecord(record);
          const piece = seniorPhase.instruments[Number(instrumentIndex)]?.pieces[Number(pieceIndex)];
          if (!piece) return;
          piece.ratings ||= {};
          if (piece.ratings[criterionIndex] === bandId) delete piece.ratings[criterionIndex];
          else piece.ratings[criterionIndex] = bandId;
          piece.score = calculatedMark(piece.ratings);
          syncSeniorScore(record);
          record.updatedAt = new Date().toISOString();
          saveState("");
          render();
          app.querySelector(`[data-senior-rating="${target.dataset.seniorRating}"]`)?.focus({preventScroll:true});
          return;
        }

        if (target.dataset.seniorScoreStep) {
          const record = ensureRecord(currentAssessment(), currentPupil());
          const seniorPhase = ensureSeniorRecord(record);
          const instrumentIndex = Number(target.dataset.instrumentIndex);
          const pieceIndex = Number(target.dataset.pieceIndex);
          const piece = seniorPhase.instruments[instrumentIndex]?.pieces[pieceIndex];
          if (!piece) return;
          const step = Number(target.dataset.seniorScoreStep);
          const currentScore = piece.score === "" || piece.score == null ? null : Number(piece.score);
          if (currentScore == null && step < 0) return;
          const score = Math.max(0, Math.min(10, (currentScore ?? 0) + step));
          if (score === currentScore) return;
          piece.score = score;
          syncSeniorScore(record);
          record.updatedAt = new Date().toISOString();
          saveState("");
          render();
          app.querySelector(`[data-senior-score-step="${step}"][data-instrument-index="${instrumentIndex}"][data-piece-index="${pieceIndex}"]`)?.focus({preventScroll:true});
          return;
        }

      });

      app.addEventListener("keydown", (event) => {
        if (event.key === "Escape" && event.target.id === "recorderPupilSearch" && pupilSearch) {
          event.preventDefault();
          event.stopPropagation();
          event.target.value = pupilSearch = "";
          filterPupilRows();
          return;
        }
        const row = event.target.closest("tr[data-pupil-id]");
        if (row && (event.key === "Enter" || event.key === " ")) {
          event.preventDefault();
          openPupil(row.dataset.pupilId, true);
        }
      });

      app.addEventListener("change", (event) => {
        const target = event.target;
        if (target.matches("[data-pupil-filter]")) {
          pupilFilters[target.dataset.pupilFilter] = target.value;
          filterPupilRows();
          return;
        }
        if (target.matches("[data-extra-pieces]")) {
          const record = ensureRecord(currentAssessment(), currentPupil());
          const instrument = ensureSeniorRecord(record).instruments[Number(target.dataset.extraPieces)];
          if (!target.checked && hasExtraPieceContent(instrument)) {
            target.checked = true;
            showToast("Clear pieces 5–8 before hiding the extra page.");
            return;
          }
          instrument.extraPieces = target.checked;
          record.updatedAt = new Date().toISOString();
          saveState("");
          render();
          return;
        }
        if (target.matches("[data-senior-instrument-name]")) {
          const record = ensureRecord(currentAssessment(), currentPupil());
          const instrument = ensureSeniorRecord(record).instruments[Number(target.dataset.seniorInstrumentName)];
          instrument.name = target.value.trim().replace(/^Drum Kit$/i, "Drum kit").replace(/^Bass Guitar$/i, "Bass guitar");
          if (INSTRUMENT_OPTIONS.some((option) => option.value === instrument.name)) delete instrument.nameMode;
          record.updatedAt = new Date().toISOString();
          saveState("");
          return;
        }
        if (target.matches("[data-senior-piece-field]")) {
          updateSeniorPieceField(target);
          return;
        }
      });

      app.addEventListener("input", (event) => {
        if (event.target.id === "recorderPupilSearch") {
          pupilSearch = event.target.value;
          filterPupilRows();
          return;
        }
        if (event.target.matches("[data-senior-piece-field]")) updateSeniorPieceField(event.target);
        if (event.target.matches("[data-senior-instrument-name]")) {
          const record = ensureRecord(currentAssessment(), currentPupil());
          const instrument = ensureSeniorRecord(record).instruments[Number(event.target.dataset.seniorInstrumentName)];
          instrument.name = event.target.value.trim().replace(/^Drum Kit$/i, "Drum kit").replace(/^Bass Guitar$/i, "Bass guitar");
          app.querySelectorAll(`[data-instrument-carried="${event.target.dataset.seniorInstrumentName}"]`).forEach(label => { label.textContent = instrument.name; });
          if (INSTRUMENT_OPTIONS.some(option => option.value === instrument.name)) delete instrument.nameMode;
          record.updatedAt = new Date().toISOString();
          saveState("");
        }
      });

      app.addEventListener("wheel", (event) => {
        if (event.target.matches('input[type="number"]')) event.target.blur();
      }, { passive: true });

      app.addEventListener("focusout", ({target}) => {
        if (target.matches('[data-senior-piece-field="score"]') && target.validity.badInput) {
          updateSeniorPieceField(target, {restoreInvalid:true});
        }
      });

      document.addEventListener("click", (event) => {
        document.querySelectorAll("details.assessment-picker[open]").forEach((picker) => {
          if (!picker.contains(event.target)) picker.removeAttribute("open");
        });

        const button = event.target.closest("[data-close-dialog]");
        if (button) document.getElementById(button.dataset.closeDialog).close();

      });

      function downloadAssessmentBackup() {
        download(`Performance Assessments - ${new Date().toISOString().slice(0, 10)}.json`, "application/json", JSON.stringify(state, null, 2));
      }

      const prelimPupilDialog = document.getElementById("prelimPupilDialog");
      const prelimPupilForm = prelimPupilDialog.querySelector("form");
      const prelimAdditionalDetails = prelimPupilForm.querySelector(".prelim-additional-details");
      const prelimPupilFields = ["date", "order", "name", "teacher", "assessor"];

      prelimAdditionalDetails.addEventListener("invalid", () => { prelimAdditionalDetails.open = true; }, true);

      function openPrelimPupilDialog(adding = false) {
        const pupil = adding ? {date:view.date === "all" ? "" : view.date} : currentPupil();
        const record = adding ? {} : currentAssessment()?.records?.[pupil?.id];
        if (!pupil || !record || record.locked) return;
        prelimAdditionalDetails.open = false;
        prelimPupilForm.dataset.mode = adding ? "add" : "edit";
        document.getElementById("prelimPupilTitle").textContent = adding ? "Add Pupil" : "Edit Details";
        const submit = prelimPupilForm.querySelector('[type="submit"]');
        submit.textContent = adding ? "Add Pupil" : "Save";
        for (const field of prelimPupilFields) prelimPupilForm.elements[field].value = pupil[field] ?? "";
        prelimPupilForm.elements.level.value = record.seniorPhase?.qualificationLevel || "";
        document.getElementById("prelimPupilInstruments").innerHTML = [0, 1].map(index => {
          const instrument = record.seniorPhase?.instruments?.[index];
          return `<fieldset aria-labelledby="prelim-instrument-label-${index}">
            <label><span id="prelim-instrument-label-${index}">Instrument ${index + 1}</span><input name="instrument-${index}" value="${esc(instrument?.name)}"></label>
            ${Array.from({length:8}, (_, piece) => `<label><span>Piece ${piece + 1}</span>
              <input name="piece-${index}-${piece}" value="${esc(instrument?.pieces?.[piece]?.title)}"></label>`).join("")}
          </fieldset>`;
        }).join("");
        prelimPupilDialog.showModal();
      }

      prelimPupilForm.addEventListener("submit", async event => {
        event.preventDefault();
        const submit = prelimPupilForm.querySelector('[type="submit"]');
        if (submit.disabled) return;
        const adding = prelimPupilForm.dataset.mode === "add";
        const klass = currentClass() || (adding ? prelimRosterClass([], "Roster", null, new Date().toISOString()) : null);
        const pupil = adding ? {id:newId("pupil")} : currentPupil();
        const assessment = currentAssessment() || klass?.assessments[0];
        if (!klass || !pupil || !assessment) return;
        const get = field => prelimPupilForm.elements[field].value.trim();
        const details = Object.fromEntries(prelimPupilFields.map(field => [field, get(field)]));
        details.order = details.order === "" ? "" : Number(details.order);
        const updatedPupil = {...pupil, ...details};
        const record = adding ? {} : structuredClone(assessment.records[pupil.id]);
        if (record.locked) return;
        const phase = ensureSeniorRecord(record);
        phase.qualificationLevel = get("level");
        phase.instruments.forEach((instrument, index) => {
          instrument.name = get(`instrument-${index}`);
          instrument.pieces.forEach((piece, number) => { piece.title = get(`piece-${index}-${number}`); });
        });
        record.updatedAt = new Date().toISOString();
        syncSeniorScore(record);
        const updatedAssessment = {...assessment, updatedAt: record.updatedAt, records:{...assessment.records, [pupil.id]:record}};
        const updatedClass = {...klass,
          pupils: adding ? [...klass.pupils, updatedPupil] : klass.pupils.map(item => item.id === pupil.id ? updatedPupil : item),
          assessments: klass.assessments.map(item => item.id === assessment.id ? updatedAssessment : item)
        };
        const classes = mergeBackupClasses(state.classes, [updatedClass]);
        submit.disabled = true;
        const saved = await saveState(adding ? "Pupil added." : "Roster details saved.", {...state, classes});
        submit.disabled = false;
        if (!saved) return;
        if (adding) {
          view.classId = klass.id;
          view.assessmentId = assessment.id;
        }
        if (view.date !== "all" && updatedPupil.date && (adding || updatedPupil.date !== pupil.date)) {
          view.date = updatedPupil.date;
        }
        prelimPupilDialog.close();
        render();
        app.querySelector(adding ? "[data-add-pupil]" : "[data-edit-prelim-pupil]")?.focus();
      });

      function prelimRosterClass(roster, name, rosterKey, createdAt, classId = newId("class")) {
        const pupils = [];
        const records = {};
        for (const pupil of roster) {
          const id = newId("pupil");
          pupils.push({ id, name: pupil.name, teachingClass: pupil.teachingClass, teacher: pupil.teacher,
            date: pupil.date || "", order: pupil.order, assessor: pupil.assessor, session: pupil.session });
          const instruments = pupil.instruments.map(({ name, pieces }) => {
            const instrument = newSeniorInstrument();
            instrument.name = name;
            pieces.forEach((title, index) => { instrument.pieces[index].title = title; });
            return instrument;
          });
          records[id] = { score: "", updatedAt: null, seniorPhase: { qualificationLevel: pupil.level, instruments } };
        }
        return {
          id: classId, name, createdAt, prelimRosterKey: rosterKey,
          pupils, assessments: [{ id: newId("assessment"), title: "Performance Assessment", qualificationLevel: "", createdAt, updatedAt: createdAt, records }]
        };
      }

      function matchingWorkbookRoster(classes, name, key) {
        const workbooks = classes.filter(klass => klass.prelimRosterKey);
        const fileNameKey = value => value.normalize("NFC").toLocaleLowerCase("en-GB");
        const named = workbooks.filter(klass => fileNameKey(klass.name) === fileNameKey(name));
        if (named.length === 1) return named[0];
        const matches = (named.length ? named : workbooks).filter(klass => klass.prelimRosterKey === key);
        if (matches.length === 1) return matches[0];
        if (named.length || matches.length) throw new Error("More than one saved roster matches this spreadsheet. No rosters were replaced.");
        return null;
      }

      async function importPrelimRoster(file) {
        const roster = await window.AssessmentPrelimRoster.read(await file.arrayBuffer(), window.JSZip);
        const encodedRoster = new TextEncoder().encode(JSON.stringify(roster));
        const digest = await globalThis.crypto?.subtle?.digest("SHA-256", encodedRoster);
        const key = digest
          ? "workbook:" + Array.from(new Uint8Array(digest), byte => byte.toString(16).padStart(2, "0")).join("")
          : newId("workbook");
        const name = file.name.replace(/\.xlsx$/i, "").trim() || "Roster";
        const existing = matchingWorkbookRoster(state.classes, name, key);
        const klass = prelimRosterClass(roster, name, key, new Date().toISOString(), existing?.id);
        const classes = mergeBackupClasses(state.classes, [klass]);
        const message = existing ? "Roster replaced." : `${roster.length} ${roster.length === 1 ? "pupil" : "pupils"} imported.`;
        if (!await saveState(message, {...state, classes})) return;
        view = { mode: "dashboard", classId: klass.id, assessmentId: klass.assessments[0].id, pupilId: null, filter: "all" };
        pupilSort = { key: null, direction: "ascending" };
        pupilSearch = "";
        pupilFilters = {};
        render();
        app.querySelector("#rosterPicker")?.focus();
      }

      const clearDataDialog = document.getElementById("recorderClearDataDialog");
      clearDataDialog.querySelector("form").addEventListener("submit", async event => {
        event.preventDefault();
        const confirmButton = clearDataDialog.querySelector('button[type="submit"]');
        if (confirmButton.disabled) return;
        confirmButton.disabled = true;
        const cleared = await saveState("All assessment data deleted.", defaultState());
        confirmButton.disabled = false;
        clearDataDialog.close();
        if (!cleared) return;
        view = {mode:"dashboard", classId:null, assessmentId:null, pupilId:null, date:"all", filter:"all"};
        pupilSort = {key:null, direction:"ascending"};
        pupilSearch = "";
        pupilFilters = {};
        render();
      });
      document.getElementById("recorderImportConfirm").addEventListener("submit", event => {
        event.preventDefault();
        document.getElementById("recorderConfirmDialog").close();
        if (!importInProgress) importFile.click();
      });
      importFile.addEventListener("change", async () => {
        const [file] = importFile.files;
        importFile.value = "";
        if (!file || importInProgress) return;
        importInProgress = true;
        try {
          if (/\.xlsx$/i.test(file.name)) await importPrelimRoster(file);
          else await importAssessmentBackup(file);
        } catch (error) {
          showToast(error.message || "The assessment file could not be imported.", 10000);
        } finally {
          importInProgress = false;
        }
      });

      async function importAssessmentBackup(file) {
        let backup;
        try {
          backup = readAssessmentBackup(await file.text());
        } catch {
          showToast("Choose a valid Digital Performance Assessment JSON backup.", 8000);
          return;
        }

        if (!backup.classes.length) {
          showToast("This backup contains no assessment data.");
          return;
        }
        const classes = mergeBackupClasses(state.classes, backup.classes);
        if (await saveState("Backup imported.", {...state, classes})) render();
      }

      function download(name, type, content) {
        const blob = new Blob([content], { type });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = name;
        document.body.append(link);
        link.click();
        link.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
      }

      restoreRecorderView();
      render();
    })();



// Native dialogs retain keyboard focus and Escape handling; match backdrop dismissal to Hub overlays.
document.querySelectorAll('.recorder-dialog').forEach(dialog => {
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
});
