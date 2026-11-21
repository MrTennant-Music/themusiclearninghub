(function (root) {
  "use strict";

  let activeAudio = null;
  const players = new Set();

  if (typeof document !== "undefined") {
    document.addEventListener("pointerdown", event => {
      if (event.pointerType !== "touch") return;
      const tappedPlayer = event.target?.closest?.("[data-audio-player]");
      document.querySelectorAll("[data-audio-player].is-markers-expanded").forEach(player => {
        if (player !== tappedPlayer) player.classList.remove("is-markers-expanded");
      });
      if (tappedPlayer?.querySelector("[data-marker-time]:not(:disabled)")) {
        tappedPlayer.classList.add("is-markers-expanded");
      }
    });
  }

  function formatTime(seconds) {
    if (!Number.isFinite(seconds)) return "0:00";
    const rounded = Math.max(0, Math.floor(seconds));
    return `${Math.floor(rounded / 60)}:${String(rounded % 60).padStart(2, "0")}`;
  }

  const fadePause = audio => root.MLH?.fadeOutAudio ? root.MLH.fadeOutAudio(audio) : (audio?.pause(), Promise.resolve());

  function pauseOtherPlayers(audio) {
    if (activeAudio && activeAudio !== audio) void fadePause(activeAudio);
    activeAudio = audio;
  }

  function markerLabelPositions(markers, width) {
    const gap = 2;
    const rowEnds = [];
    // Keep each label over its own cue. Crowding needs another row, not a
    // sideways shift that leaves its line underneath a different label.
    return markers.map(marker => {
      const centre = Math.max(0, Math.min(width, marker.position));
      const left = centre - marker.width / 2;
      let row = rowEnds.findIndex(end => left >= end + gap);
      if (row < 0) row = rowEnds.length;
      rowEnds[row] = centre + marker.width / 2;
      return { centre, tickOffset: 0, row };
    });
  }

  function displayedMarkers(markers = [], omitOpeningExcerptMarkers = false) {
    if (!omitOpeningExcerptMarkers) return markers;
    let awaitingFirstExcerpt = false;
    return markers.filter(marker => {
      if (/^\([ab]\)$/.test(marker.label)) { awaitingFirstExcerpt = true; return true; }
      if (awaitingFirstExcerpt && marker.label === "1") { awaitingFirstExcerpt = false; return false; }
      return true;
    });
  }

  function createPlayer(container, config) {
    const { clips, locked = false, limitPlayback = false, playConsumed = false, onConsumed, continuous = false, autoplay = false, onClipStart, onSequenceEnd, onPlaybackError } = config;
    let clipIndex = 0;
    let audio = null;
    let destroyed = false;
    let consumed = Boolean(limitPlayback && playConsumed);
    let stalledTimer = null;
    let playbackErrorReported = false;
    let seekableObjectUrl = null;
    let seekableAudioPromise = null;
    let markerObserver = null;
    let seekVersion = 0;

    function releaseSeekableAudio() {
      if (seekableObjectUrl) root.URL?.revokeObjectURL?.(seekableObjectUrl);
      seekableObjectUrl = null;
      seekableAudioPromise = null;
    }

    function clearStalledTimer() {
      if (stalledTimer) root.clearTimeout(stalledTimer);
      stalledTimer = null;
    }

    function reportPlaybackError(error) {
      clearStalledTimer();
      if (destroyed || playbackErrorReported) return;
      playbackErrorReported = true;
      onPlaybackError?.(error instanceof Error ? error : new Error("The audio could not be played."), clipIndex);
    }

    async function playCurrent() {
      if (!audio || destroyed) return false;
      playbackErrorReported = false;
      const targetAudio = audio;
      pauseOtherPlayers(targetAudio);
      try {
        if (root.MLH?.waitForAudioFade) await root.MLH.waitForAudioFade(targetAudio);
        if (destroyed || audio !== targetAudio) return false;
        await targetAudio.play();
        return true;
      } catch (error) {
        // Pausing or changing question while play() is pending intentionally
        // aborts that request; it does not mean the recording is unavailable.
        if (error?.name === "AbortError" && (destroyed || audio !== targetAudio || targetAudio.paused)) return false;
        reportPlaybackError(error);
        return false;
      }
    }

    async function loadSeekableAudioCopy() {
      if (seekableObjectUrl) return true;
      if (seekableAudioPromise) return seekableAudioPromise;
      const targetAudio = audio;
      const source = targetAudio?.currentSrc || targetAudio?.src;
      seekableAudioPromise = root.fetch(source)
        .then(response => {
          if (!response.ok) throw new Error("The audio could not be loaded for seeking.");
          return response.blob();
        })
        .then(blob => {
          if (destroyed || audio !== targetAudio) return false;
          seekableObjectUrl = root.URL.createObjectURL(blob);
          return new Promise((resolve, reject) => {
            targetAudio.addEventListener("loadedmetadata", () => resolve(true), { once: true });
            targetAudio.addEventListener("error", () => reject(targetAudio.error || new Error("The audio could not be loaded for seeking.")), { once: true });
            targetAudio.src = seekableObjectUrl;
            targetAudio.load();
          });
        })
        .finally(() => { seekableAudioPromise = null; });
      return seekableAudioPromise;
    }

    async function seekTo(seconds) {
      if (!audio?.duration) return;
      const version = ++seekVersion;
      const targetAudio = audio;
      const target = Math.min(Math.max(0, Number(seconds)), audio.duration);
      const wasPlaying = !audio.paused;
      audio.currentTime = target;
      await new Promise(resolve => root.setTimeout(resolve, 150));
      if (destroyed || audio !== targetAudio || version !== seekVersion) return;
      if (Math.abs(audio.currentTime - target) > 1 && await loadSeekableAudioCopy()) {
        if (destroyed || audio !== targetAudio || version !== seekVersion) return;
        audio.currentTime = target;
        if (wasPlaying) await playCurrent();
      }
      const progress = container.querySelector("[data-progress]");
      const elapsed = container.querySelector("[data-elapsed]");
      if (progress) progress.value = String(Math.round((audio.currentTime / audio.duration) * 1000));
      if (elapsed) elapsed.textContent = formatTime(audio.currentTime);
    }

    function render() {
      markerObserver?.disconnect();
      releaseSeekableAudio();
      const clip = clips[clipIndex];
      const markers = displayedMarkers(clip.markers, config.omitOpeningExcerptMarkers);
      container.innerHTML = `
        <div class="exam-audio-player" data-audio-player>
          ${clips.length > 1 && !continuous ? `<div class="audio-clip-tabs" role="tablist">${clips.map((item, index) => `<button type="button" class="audio-clip-tab ${index === clipIndex ? "is-active" : ""}" data-clip="${index}">${item.label}</button>`).join("")}</div>` : ""}
          <audio preload="metadata" src="${clip.file}"></audio>
          <div class="audio-controls">
            <button type="button" class="audio-play-button ${continuous ? "is-exam-sequence" : ""}" data-audio-action="toggle" ${locked || consumed || (continuous && autoplay) ? "disabled" : ""} aria-label="${continuous ? "Exam audio playing" : consumed ? "Audio already played" : "Play excerpt"}">${continuous ? "" : `<span class="audio-play-glyph hub-playback-glyph is-play" data-play-glyph aria-hidden="true"></span>`}<span data-play-label>${continuous ? `Question ${clipIndex + 1}` : "Play"}</span></button>
            <span class="audio-time" data-elapsed>0:00</span>
            <div class="audio-progress-wrap">
              <input class="audio-progress" data-progress type="range" min="0" max="1000" value="0" ${locked || limitPlayback ? "disabled" : ""} aria-label="Audio progress" />
              ${markers.length ? `<div class="audio-markers" aria-label="Audio section timestamps">${markers.map(marker => `<button type="button" class="audio-marker${config.omitOpeningExcerptMarkers && /^[12]$/.test(marker.label) ? " is-excerpt-marker" : ""}" data-marker-time="${marker.time}" ${locked || limitPlayback ? "disabled" : ""} aria-label="Go to part ${marker.label}" title="${marker.label} · ${formatTime(marker.time)}">${marker.label}</button>`).join("")}</div>` : ""}
            </div>
            <span class="audio-time" data-duration>0:00</span>
          </div>
        </div>`;
      audio = container.querySelector("audio");
      players.add(audio);
      bind(clip);
      if (autoplay) void playCurrent();
    }

    function bind(clip) {
      const playToggle = container.querySelector('[data-audio-action="toggle"]');
      const playGlyph = container.querySelector("[data-play-glyph]");
      const playLabel = container.querySelector("[data-play-label]");
      const progress = container.querySelector("[data-progress]");
      const elapsed = container.querySelector("[data-elapsed]");
      const duration = container.querySelector("[data-duration]");
      const markerRow = container.querySelector(".audio-markers");
      function positionMarkers() {
        if (destroyed || !audio?.duration || !markerRow?.clientWidth) return;
        const buttons = [...markerRow.querySelectorAll("[data-marker-time]")];
        const markers = buttons.map(button => {
          // Reserve the bold hover width so labels never move under the pointer.
          button.style.width = "";
          button.style.fontWeight = "700";
          const width = button.offsetWidth;
          button.style.fontWeight = "";
          button.style.width = `${width}px`;
          return { width, position: Math.min(1, Math.max(0, Number(button.dataset.markerTime) / audio.duration)) * markerRow.clientWidth };
        });
        const positions = markerLabelPositions(markers, markerRow.clientWidth);
        const extraHeight = Math.max(0, ...positions.map(position => position.row)) * 22;
        markerRow.dataset.markerRows = String(extraHeight / 22 + 1);
        markerRow.parentElement.style.setProperty("--audio-marker-height", `${25 + extraHeight}px`);
        positions.forEach((position, index) => {
          buttons[index].style.left = `${position.centre}px`;
          buttons[index].dataset.markerRow = String(position.row);
          buttons[index].style.setProperty("--audio-marker-row-offset", `${position.row * 22}px`);
          buttons[index].style.setProperty("--audio-marker-tick-top", `${21 + extraHeight - position.row * 22}px`);
          buttons[index].style.setProperty("--audio-marker-tick-offset", `${position.tickOffset}px`);
        });
      }
      if (markerRow && root.ResizeObserver) {
        markerObserver = new root.ResizeObserver(positionMarkers);
        markerObserver.observe(markerRow);
      }
      document.fonts?.ready.then(positionMarkers);

      function updatePlayButton(isPlaying) {
        if (continuous) {
          playLabel.textContent = `Question ${clipIndex + 1}`;
          return;
        }
        playGlyph.classList.toggle("is-play", !isPlaying);
        playGlyph.classList.toggle("is-pause", isPlaying);
        playLabel.textContent = isPlaying ? "Pause" : "Play";
        playToggle.setAttribute("aria-label", isPlaying ? "Pause excerpt" : "Play excerpt");
      }

      playToggle?.addEventListener("click", async () => {
        if (locked || consumed) return;
        if (!audio.paused) {
          void fadePause(audio);
          return;
        }
        await playCurrent();
      });
      audio.addEventListener("play", () => { clearStalledTimer(); playbackErrorReported = false; updatePlayButton(true); });
      audio.addEventListener("playing", clearStalledTimer);
      audio.addEventListener("canplay", clearStalledTimer);
      audio.addEventListener("pause", () => updatePlayButton(false));
      audio.addEventListener("error", () => reportPlaybackError(audio.error || new Error("The audio file could not be loaded.")));
      audio.addEventListener("stalled", () => {
        clearStalledTimer();
        stalledTimer = root.setTimeout(() => {
          if (audio && !audio.ended && audio.readyState < 3) reportPlaybackError(new Error("The audio stopped loading."));
        }, 8000);
      });
      audio.addEventListener("ended", () => {
        updatePlayButton(false);
        if (continuous) {
          if (clipIndex < clips.length - 1) {
            players.delete(audio);
            clipIndex += 1;
            render();
          } else {
            onSequenceEnd?.();
          }
          return;
        }
        if (!limitPlayback || consumed) return;
        consumed = true;
        playToggle.disabled = true;
        playToggle.setAttribute("aria-label", "Audio already played");
        onConsumed?.();
      });
      audio.addEventListener("play", () => onClipStart?.(clipIndex), { once: true });
      audio.addEventListener("loadedmetadata", () => {
        duration.textContent = formatTime(audio.duration);
        positionMarkers();
      });
      audio.addEventListener("timeupdate", () => {
        elapsed.textContent = formatTime(audio.currentTime);
        progress.value = audio.duration ? String(Math.round((audio.currentTime / audio.duration) * 1000)) : "0";
      });
      progress.addEventListener("input", () => {
        if (locked || limitPlayback || !audio.duration) return;
        void seekTo((Number(progress.value) / 1000) * audio.duration).catch(reportPlaybackError);
      });
      container.querySelectorAll("[data-marker-time]").forEach(marker => marker.addEventListener("click", event => {
        event.preventDefault();
        event.stopPropagation();
        if (locked || limitPlayback || !audio.duration) return;
        void seekTo(marker.dataset.markerTime).catch(reportPlaybackError);
      }));
      container.querySelectorAll("[data-clip]").forEach(button => button.addEventListener("click", () => {
        void fadePause(audio);
        players.delete(audio);
        clipIndex = Number(button.dataset.clip);
        render();
      }));
    }

    render();
    return {
      destroy() {
        if (destroyed) return;
        destroyed = true;
        markerObserver?.disconnect();
        clearStalledTimer();
        releaseSeekableAudio();
        void fadePause(audio);
        players.delete(audio);
        if (activeAudio === audio) activeAudio = null;
        container.innerHTML = "";
      },
      async retry() {
        if (!audio || destroyed) return false;
        clearStalledTimer();
        playbackErrorReported = false;
        audio.load();
        return playCurrent();
      },
    };
  }

  const api = { createPlayer, formatTime, markerLabelPositions, displayedMarkers, pauseAll() { players.forEach(audio => { void fadePause(audio); }); activeAudio = null; } };
  root.ExamAudio = api;
  if (typeof module !== "undefined" && module.exports) module.exports = api;
})(typeof window !== "undefined" ? window : globalThis);
