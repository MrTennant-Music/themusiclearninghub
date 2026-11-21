(function () {
  'use strict';
  const h = React.createElement;
  const localEditor = ['127.0.0.1', 'localhost'].includes(location.hostname) && location.port === '8765';
  const endpoint = 'http://127.0.0.1:8766/audio';
  const offlineMessage = 'The local audio editor is not running. Ask to restart it, then try again.';
  async function readAudioFile(file) {
    const extension = file.name.split('.').pop().toLowerCase();
    const mime = ({ mp3: 'audio/mpeg', wav: 'audio/wav', m4a: 'audio/mp4', aac: 'audio/aac', ogg: 'audio/ogg', flac: 'audio/flac' })[extension];
    if (!mime) throw Error('Choose an MP3, WAV, M4A, AAC, OGG or FLAC audio file.');
    if (!file.size || file.size > 50 * 1024 * 1024) throw Error('Audio files must be 50 MB or smaller.');
    const src = await new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result);
      reader.onerror = () => reject(Error('This audio file could not be read.'));
      reader.readAsDataURL(file.slice(0, file.size, mime));
    });
    return { type: 'audio', src, name: file.name.replace(/\.[^.]+$/, '') };
  }
  function AudioModal({ title, onClose, children }) {
    const panel = React.useRef(null);
    React.useEffect(() => {
      const previous = document.activeElement, overflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      panel.current.querySelector('input[type="search"]')?.focus();
      return () => { document.body.style.overflow = overflow; previous?.focus(); };
    }, []);
    function keys(event) {
      if (event.key === 'Escape') { event.preventDefault(); event.stopPropagation(); onClose(); }
      if (event.key !== 'Tab') return;
      const items = Array.from(panel.current.querySelectorAll('button:not(:disabled),input:not([hidden]),a[href],audio[controls]')).filter(el => !el.hidden);
      const first = items[0], last = items[items.length - 1];
      if (event.shiftKey && (document.activeElement === first || document.activeElement === panel.current)) { event.preventDefault(); last?.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first?.focus(); }
    }
    return ReactDOM.createPortal(h('div', { className: 'ig-modal-backdrop ig-image-bank-backdrop', onClick: event => { if (event.target === event.currentTarget) onClose(); } },
      h('section', { ref: panel, role: 'dialog', 'aria-modal': true, 'aria-labelledby': 'mc-audio-dialog-title', tabIndex: -1, className: 'ig-modal ig-image-bank-modal mc-audio-editor-modal', onKeyDown: keys },
        h('h2', { id: 'mc-audio-dialog-title' }, title),
        h('button', { type: 'button', className: 'ig-modal-close', 'aria-label': 'Close audio editor', onClick: onClose }, '×'), children)), document.body);
  }
  const T = window.MusicConceptAudioTiming;
  const audioTitleLowercaseWords = new Set(['a', 'an', 'and', 'as', 'at', 'but', 'by', 'for', 'from', 'in', 'nor', 'of', 'on', 'or', 'the', 'to', 'with']);
  function titleCaseAudioTitle(value) {
    const words = String(value || '').match(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu) || [];
    let index = 0;
    return String(value || '').replace(/[\p{L}\p{N}]+(?:['’][\p{L}\p{N}]+)*/gu, word => {
      const position = index++;
      if (/^[A-Z0-9]{2,}$/.test(word)) return word;
      const lower = word.toLocaleLowerCase();
      if (position > 0 && position < words.length - 1 && audioTitleLowercaseWords.has(lower)) return lower;
      return lower.charAt(0).toLocaleUpperCase() + lower.slice(1);
    });
  }
  function audioClock(value) {
    const seconds = Math.max(0, Math.floor(value || 0));
    return Math.floor(seconds / 60) + ':' + String(seconds % 60).padStart(2, '0');
  }
  function audioDetails(clip, sound) {
    let title = clip.title || clip.name || 'Audio example';
    title = title.replace(/\s*\(SoundCloud preview\)/gi, '').replace(/^\s*\[[^\]]*cover[^\]]*\]\s*/i, '').trim();
    const credit = clip.artist || clip.credit || sound?.user?.username || '';
    const artist = credit.match(/^"([^"]+)"/)?.[1] || credit;
    if (artist) {
      for (const separator of [' by ', ' — ', ' - ']) {
        const suffix = separator + artist;
        if (title.toLowerCase().endsWith(suffix.toLowerCase())) title = title.slice(0, -suffix.length);
      }
    }
    if (artist) {
      for (const separator of [' — ', ' - ', ': ']) {
        const prefix = artist + separator;
        if (title.toLowerCase().startsWith(prefix.toLowerCase())) title = title.slice(prefix.length);
      }
    }
    const comma = title.indexOf(', ');
    if (comma > 0 && artist.toLowerCase().includes(title.slice(0, comma).toLowerCase())) title = title.slice(comma + 2);
    const portrait = window.MUSIC_CONCEPT_COMPOSER_PORTRAITS?.composers[artist] || window.MUSIC_CONCEPT_ARTIST_PORTRAITS?.artists[artist];
    const poster = clip.poster?.src ? clip.poster : null;
    const fallbackArtwork = clip.artworkFallback === 'scotland' ? './ui-icons/scotland-flag.svg' : './ui-icons/assessment-cover-quavers.svg';
    return { title, artist, portrait, poster, fallbackArtwork, artwork: poster?.src || (portrait?.status === 'portrait' ? portrait.src : fallbackArtwork) };
  }
  function AudioControls({ clip, sound, ready, playing, position, duration, muted, unavailable = false, onToggle, onSeek, onMute }) {
    const details = audioDetails(clip, sound);
    const artwork = details.poster || (details.portrait?.status === 'portrait' ? details.portrait : null);
    const scottishFallback = clip.artworkFallback === 'scotland';
    const artworkAlt = details.poster ? 'Poster for ' + clip.musicalTitle : 'Portrait of ' + details.artist;
    return h('div', { className: 'mc-audio-panel', role: 'group', 'aria-label': details.title },
      h('div', { className: 'mc-audio-track' },
        h(artwork ? 'a' : 'div', { className: 'mc-audio-artwork-wrap', ...(artwork ? { href: artwork.sourceUrl, target: '_blank', rel: 'noopener noreferrer', title: artworkAlt + ' · ' + artwork.credit + ' · ' + artwork.license, 'aria-label': artworkAlt + ' — image source (opens in a new tab)' } : {}) },
          h('img', { className: 'mc-audio-artwork' + (artwork ? (details.poster ? ' mc-audio-artwork-poster' : '') : scottishFallback ? ' mc-audio-artwork-flag' : ' mc-audio-artwork-placeholder'), src: details.artwork, alt: artwork ? artworkAlt : scottishFallback ? 'Flag of Scotland' : 'Music example', style: { objectPosition: artwork?.position, ...((details.poster || (!artwork && scottishFallback)) ? { objectFit: 'contain', background: '#fafaf9' } : {}) }, onError: event => { event.currentTarget.onerror = null; event.currentTarget.classList.remove('mc-audio-artwork-poster'); event.currentTarget.classList.add(scottishFallback ? 'mc-audio-artwork-flag' : 'mc-audio-artwork-placeholder'); event.currentTarget.src = details.fallbackArtwork; event.currentTarget.alt = scottishFallback ? 'Flag of Scotland' : 'Music example'; if (scottishFallback) { event.currentTarget.style.objectFit = 'contain'; event.currentTarget.style.background = '#fafaf9'; } } }),
          playing && h('span', { className: 'mc-audio-waves', 'aria-hidden': true }, [0, 1, 2, 3, 4].map(index => h('i', { key: index })))),
        h('div', { className: 'mc-audio-track-text' },
          h(clip.sourceUrl ? 'a' : 'span', { className: 'mc-audio-track-title', href: clip.sourceUrl || undefined, target: clip.sourceUrl ? '_blank' : undefined, rel: clip.sourceUrl ? 'noopener noreferrer' : undefined, title: details.title }, details.title),
          (clip.musicalTitle || details.artist) && h('span', { className: 'mc-audio-track-artist', title: clip.musicalTitle ? 'From ' + clip.musicalTitle : details.artist }, clip.musicalTitle ? [h('em', { key: 'from' }, 'From'), ' ' + clip.musicalTitle] : details.artist === 'Demo' ? h('em', null, 'Demo') : details.artist)),
        clip.provider === 'soundcloud' && h('a', { className: 'mc-sc-source', href: clip.sourceUrl, target: '_blank', rel: 'noopener noreferrer', title: 'Open on SoundCloud', 'aria-label': 'Open ' + details.title + ' on SoundCloud' }, h('img', { src: './ui-icons/soundcloud.svg', alt: 'SoundCloud' }))),
      unavailable && window.MUSIC_CONCEPT_AUDIO_FALLBACKS?.tracks[clip.sourceUrl] ? h(AudioFallback, { clip, error: 'Audio unavailable here.' }) : h('div', { className: 'mc-audio-controls' },
        h('button', { type: 'button', className: 'mc-audio-play-toggle', disabled: !ready, 'aria-label': (playing ? 'Pause ' : 'Play ') + details.title, onClick: event => {
          if (!false) {
            const button = event.currentTarget;
            button.getAnimations().forEach(animation => animation.cancel());
            button.animate([
              { scale: '1', offset: 0 },
              { scale: '.85', offset: .22 },
              { scale: '1.08', offset: .6 },
              { scale: '.98', offset: .82 },
              { scale: '1', offset: 1 }
            ], { duration: 320, easing: 'ease-out' });
          }
          onToggle();
        } }, h('svg', { viewBox: '0 0 24 24', width: 20, height: 20, fill: 'currentColor', 'aria-hidden': true, focusable: 'false' }, h('path', { d: playing ? 'M6 4h4v16H6zM14 4h4v16h-4z' : 'M6 3.5v17l15-8.5z' }))),
        h('input', { type: 'range', min: 0, max: duration || 1, step: 0.1, value: Math.min(position, duration || 1), disabled: !ready, 'aria-label': 'Playback position for ' + details.title, 'aria-valuetext': audioClock(position) + ' of ' + audioClock(duration), onChange: event => onSeek(Number(event.target.value)) }),
        h('span', { className: 'mc-audio-time' }, audioClock(position) + ' / ' + audioClock(duration)),
        h('button', { type: 'button', disabled: !ready, className: 'mc-audio-mute-toggle', 'aria-label': (muted ? 'Unmute ' : 'Mute ') + details.title, 'aria-pressed': muted, onClick: onMute }, h('img', { src: './ui-icons/audio-svgrepo-com.svg?v=20260722-smaller15', alt: '', 'aria-hidden': true }))));
  }
  function AudioFallback({ clip, error }) {
    const fallback = window.MUSIC_CONCEPT_AUDIO_FALLBACKS?.tracks[clip.sourceUrl];
    if (!error || !fallback) return null;
    return h('div', { className: 'mc-audio-fallback', role: 'status' },
      h('a', { href: fallback.url, target: '_blank', rel: 'noopener noreferrer', title: (fallback.matchType === 'demonstration' ? 'Alternative demonstration: ' : 'Alternative recording: ') + fallback.title + ' — ' + fallback.channel, 'aria-label': 'Listen to ' + fallback.title + ' on YouTube (opens in a new tab)' },
        h('img', { src: './ui-icons/youtube.svg', alt: '', 'aria-hidden': true }),
        h('span', null, 'Listen on YouTube'),
        h('svg', { viewBox: '0 0 24 24', width: 16, height: 16, fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, 'aria-hidden': true, focusable: 'false' },
          h('path', { d: 'M14 3h7v7M21 3 10 14M10 5H5a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-5', strokeLinecap: 'round', strokeLinejoin: 'round' }))));
  }
  function SoundCloudSectionPlayer({ clip }) {
    const frame = React.useRef(null), api = React.useRef(null), playbackWait = React.useRef(null), failPlayback = React.useRef(null);
    const [error, setError] = React.useState(''), [ready, setReady] = React.useState(false);
    const [playing, setPlaying] = React.useState(false), [position, setPosition] = React.useState(0);
    const [duration, setDuration] = React.useState(0), [muted, setMuted] = React.useState(false);
    const [sound, setSound] = React.useState(null);
    const start = clip.startSeconds || 0, end = clip.endSeconds ?? null;
    React.useLayoutEffect(() => {
      if (!window.SC?.Widget) { setError('SoundCloud could not load.'); return; }
      const widget = window.SC.Widget(frame.current), events = window.SC.Widget.Events;
      api.current = widget;
      let disposed = false, stopped = false, invalid = false;
      let loadWait;
      const clearPlaybackWait = () => { clearTimeout(playbackWait.current); playbackWait.current = null; };
      const loaded = () => widget.getDuration(milliseconds => {
        if (disposed) return;
        widget.getCurrentSound(value => { if (!disposed) setSound(value); });
        const total = milliseconds / 1000;
        if (start >= total || end !== null && end > total) { invalid = true; setError('The selected section goes beyond the end of this track.'); return; }
        clearTimeout(loadWait);
        setDuration((end ?? total) - start); setReady(true); setError('');
        // Seek on the first actual play event. Seeking while loading can make
        // SoundCloud report a play event before the pupil has pressed Play.
      });
      const play = () => {
        if (invalid) { widget.pause(); return; }
        document.querySelectorAll('audio').forEach(other => window.MLH.fadeOutAudio(other));
        document.dispatchEvent(new CustomEvent('mc-audio-play', { detail: widget }));
        const restart = stopped; stopped = false; setPlaying(true);
        widget.getPosition(value => { if (!disposed && (restart || value < start * 1000 || end !== null && value >= end * 1000)) widget.seekTo(start * 1000); });
      };
      const pause = () => { clearPlaybackWait(); if (!disposed) setPlaying(false); };
      const progress = event => {
        if (stopped || disposed) return;
        if (event.currentPosition > start * 1000 + 100) clearPlaybackWait();
        if (end !== null && event.currentPosition >= end * 1000) { stopped = true; widget.pause(); widget.seekTo(start * 1000); setPosition(0); }
        else if (event.currentPosition < start * 1000 - 200) widget.seekTo(start * 1000);
        else setPosition(Math.max(0, event.currentPosition / 1000 - start));
      };
      const finish = () => { clearPlaybackWait(); stopped = true; setPlaying(false); setPosition(0); widget.seekTo(start * 1000); };
      const failed = () => { if (!disposed) { clearTimeout(loadWait); clearPlaybackWait(); setError('This track is unavailable here.'); setPlaying(false); setReady(false); widget.pause(); } };
      failPlayback.current = failed;
      loadWait = setTimeout(failed, 15000);
      const otherPlay = event => { if (event.detail !== widget) window.MLH.fadeOutWidgetAudio(widget); };
      const bindings = [[events.READY, loaded], [events.PLAY, play], [events.PAUSE, pause], [events.PLAY_PROGRESS, progress], [events.SEEK, progress], [events.FINISH, finish], [events.ERROR, failed]];
      bindings.forEach(([event, callback]) => widget.bind(event, callback));
      document.addEventListener('mc-audio-play', otherPlay);
      return () => { disposed = true; clearTimeout(loadWait); clearPlaybackWait(); failPlayback.current = null; window.MLH.fadeOutWidgetAudio(widget); bindings.forEach(([event]) => widget.unbind(event)); document.removeEventListener('mc-audio-play', otherPlay); api.current = null; };
    }, [clip.embedUrl, start, end]);
    return h('div', { className: 'mc-audio-player' },
      h('iframe', { ref: frame, className: 'mc-sc-audio-engine', src: clip.embedUrl, title: 'SoundCloud playback: ' + clip.name, tabIndex: -1, 'aria-hidden': true, width: 300, height: 166, allow: 'autoplay; encrypted-media', referrerPolicy: 'strict-origin-when-cross-origin' }),
      h(AudioControls, { clip, sound, ready, playing, position, duration, muted, unavailable: Boolean(error),
        onToggle: () => {
          clearTimeout(playbackWait.current);
          if (!playing) playbackWait.current = setTimeout(() => failPlayback.current?.(), 10000);
          if (playing) window.MLH.fadeOutWidgetAudio(api.current);
          else api.current?.play();
        },
        onSeek: value => { setPosition(value); api.current?.seekTo((start + value) * 1000); },
        onMute: () => { api.current?.setVolume(muted ? 100 : 0); setMuted(!muted); } }),
      error && !window.MUSIC_CONCEPT_AUDIO_FALLBACKS?.tracks[clip.sourceUrl] && h('p', { className: 'mc-audio-error', role: 'alert' }, error));
  }
  function NativeSectionPlayer({ clip }) {
    const player = React.useRef(null), stopped = React.useRef(false);
    const [error, setError] = React.useState(''), [ready, setReady] = React.useState(false);
    const [playing, setPlaying] = React.useState(false), [position, setPosition] = React.useState(0);
    const [duration, setDuration] = React.useState(0), [muted, setMuted] = React.useState(false);
    const start = clip.startSeconds || 0, end = clip.endSeconds ?? null;
    React.useEffect(() => { const audio = player.current; return () => { void window.MLH.fadeOutAudio(audio); }; }, []);
    const valid = () => {
      const audio = player.current;
      if (!Number.isFinite(audio.duration)) return false;
      if (start >= audio.duration || end !== null && end > audio.duration) { setError('The selected section goes beyond the end of this track.'); setReady(false); audio.pause(); return false; }
      return true;
    };
    const reset = () => { stopped.current = true; const audio=player.current; void window.MLH.fadeOutAudio(audio).then(()=>{audio.currentTime=start;}); setPosition(0); setPlaying(false); };
    const toggle = () => {
      const audio = player.current;
      if (!audio.paused) { void window.MLH.fadeOutAudio(audio); return; }
      if (!valid()) return;
      if (stopped.current || audio.currentTime < start || end !== null && audio.currentTime >= end) audio.currentTime = start;
      audio.play().catch(() => setError('This audio could not be played. Please try again.'));
    };
    return h('div', { className: 'mc-audio-player' },
      h('audio', { ref: player, className: 'mc-native-audio-engine', src: clip.src, preload: 'metadata', 'aria-hidden': true,
        onLoadedMetadata: () => { if (valid()) { setDuration((end ?? player.current.duration) - start); setReady(true); setError(''); player.current.currentTime = start; } },
        onPlay: () => { const audio = player.current; if (!valid()) return; document.dispatchEvent(new CustomEvent('mc-audio-play')); document.querySelectorAll('audio').forEach(other => { if (other !== audio) void window.MLH.fadeOutAudio(other); }); stopped.current = false; setPlaying(true); },
        onPause: () => setPlaying(false),
        onEnded: reset,
        onError: () => { setError('This audio is unavailable.'); setReady(false); setPlaying(false); },
        onTimeUpdate: () => { const audio = player.current; if (end !== null && audio.currentTime >= end) reset(); else { if (!audio.paused && audio.currentTime < start) audio.currentTime = start; setPosition(Math.max(0, audio.currentTime - start)); } }
      }),
      h(AudioControls, { clip, ready, playing, position, duration, muted, unavailable: Boolean(error), onToggle: toggle,
        onSeek: value => { player.current.currentTime = start + value; stopped.current = false; setPosition(value); },
        onMute: () => { player.current.muted = !muted; setMuted(!muted); } }),
      error && !window.MUSIC_CONCEPT_AUDIO_FALLBACKS?.tracks[clip.sourceUrl] && h('p', { className: 'mc-audio-error', role: 'alert' }, error));
  }
  function AudioSectionEditor({clip,busy,onSave}) {
    const [start,setStart]=React.useState(T.format(clip.startSeconds || 0)),[end,setEnd]=React.useState(clip.endSeconds==null?'':T.format(clip.endSeconds));
    const [error,setError]=React.useState('');
    React.useEffect(()=>{setStart(T.format(clip.startSeconds || 0));setEnd(clip.endSeconds==null?'':T.format(clip.endSeconds));},[clip.startSeconds,clip.endSeconds]);
    const submit=async event=>{event.preventDefault();setError('');try{const section=T.normalize(T.parse(start),T.parse(end,true));await onSave({update:clip.id,...section});}catch(err){setError(err.message);}};
    return h('form',{className:'mc-audio-section-editor',onSubmit:submit,'aria-label':'Audio section for '+clip.name},
      h('div',{className:'mc-audio-section-fields'},h('label',null,'Start',h('input',{type:'text',inputMode:'decimal',value:start,placeholder:'0:00','aria-label':'Start time for '+clip.name,disabled:busy,onChange:event=>setStart(event.target.value)})),h('label',null,'End',h('input',{type:'text',inputMode:'decimal',value:end,placeholder:'End of track','aria-label':'End time for '+clip.name,disabled:busy,onChange:event=>setEnd(event.target.value)}))),
      h('p',{className:'mc-audio-section-help'},'Use minutes:seconds, e.g. 0:45. Leave End blank to play to the end.'),
      h('button',{type:'submit',className:'mc-audio-edit-button',disabled:busy},'Save section'),error&&h('p',{className:'mc-audio-error',role:'alert'},error));
  }

  let libraryCatalogue;
  function MoreAudioExamples({ concept }) {
    const [match, setMatch] = React.useState(null);
    React.useEffect(() => {
      let active = true;
      if (!libraryCatalogue) libraryCatalogue = fetch('./audio-concept-library-data.json?v=2e677102ba8d').then(response => {
        if (!response.ok) throw Error('Library unavailable');
        return response.json();
      }).catch(() => { libraryCatalogue = null; return null; });
      const key = value => value.toLowerCase().replace(/[^a-z0-9]/g, '');
      const names = new Set([concept.name, ...(concept.aliases || [])].map(key));
      libraryCatalogue.then(data => {
        const candidates = (data?.concepts || []).filter(item => item.level === concept.level && names.has(key(item.concept)) && item.files.length);
        const item = candidates.find(item => concept.categories.some(category => key(category) === key(item.category))) || candidates[0];
        if (active) setMatch(item ? { id: concept.id, path: item.path } : null);
      });
      return () => { active = false; };
    }, [concept.id]);
    if (match?.id !== concept.id) return null;
    return h('p', { className: 'mc-more-audio-examples' }, 'Listen to more examples ',
      h('a', { href: './audioconceptlibrary.html?' + new URLSearchParams({ concept: match.path }), 'aria-label': 'More ' + concept.name + ' examples in Concept Audio Library' }, 'here'), '.');
  }

  function AudioExamples({ concept, showMoreExamples = true }) {
    const [clips, setClips] = React.useState(() => window.MUSIC_CONCEPT_AUDIO?.concepts[concept.id] || []);
    const [open, setOpen] = React.useState(false), [busy, setBusy] = React.useState(false);
    const [message, setMessage] = React.useState(''), [error, setError] = React.useState('');
    const busyRef = React.useRef(false);
    const revision = React.useRef(0);
    React.useEffect(() => {
      if (!localEditor) return;
      const controller = new AbortController();
      const requestedRevision = revision.current;
      fetch(endpoint, { cache: 'no-store', signal: AbortSignal.any([controller.signal, AbortSignal.timeout(5000)]) }).then(response => {
        if (!response.ok) throw Error(); return response.json();
      }).then(data => { if (requestedRevision === revision.current) setClips(data.concepts[concept.id] || []); }).catch(() => {});
      return () => controller.abort();
    }, [concept.id]);
    async function edit() {
      if (busyRef.current) return;
      revision.current++;
      setError(''); setMessage(''); busyRef.current = true; setBusy(true);
      try {
        const response = await fetch(endpoint, { cache: 'no-store', signal: AbortSignal.timeout(5000) });
        if (!response.ok) throw Error();
        const data = await response.json(); setClips(data.concepts[concept.id] || []);
        document.querySelectorAll('audio').forEach(player => window.MLH.fadeOutAudio(player)); setOpen(true);
      } catch (_) { setError(offlineMessage); }
      finally { busyRef.current = false; setBusy(false); }
    }
    async function save(change) {
      if (busyRef.current) return;
      revision.current++;
      busyRef.current = true; setBusy(true); setError(''); setMessage('');
      try {
        let response;
        try { response = await fetch(endpoint + '/' + concept.id, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(change), signal: AbortSignal.timeout(120000) }); }
        catch (_) { throw Error('The audio could not be saved. Check that the local audio editor is running, then try again.'); }
        const data = await response.json();
        if (!response.ok) throw Error(data.error || 'The audio could not be saved.');
        setClips(data.clips); setOpen(false); setMessage(change.remove ? 'Audio example removed.' : change.update ? 'Audio section saved.' : 'Audio example saved.');
      } catch (err) { setError(err.message); throw err; }
      finally { busyRef.current = false; setBusy(false); }
    }
    if (!localEditor && !clips.length) return null;
    return h('section', { className: 'mc-audio-examples', 'aria-labelledby': 'mc-audio-examples-title' },
      h('div', { className: 'mc-audio-heading' }, h('h2', { id: 'mc-audio-examples-title', className: 'mc-section-heading' }, h('img', { src: './ui-icons/audio-svgrepo-com.svg?v=20260722-smaller15', alt: '', 'aria-hidden': true, className: 'mc-view-glyph' }), 'Audio Examples'),
        localEditor && h('button', { type: 'button', className: 'mc-audio-edit-button', disabled: busy, onClick: edit }, busy ? 'Please wait…' : 'Add audio')),
      clips.length ? h('div', { className: 'mc-audio-row', tabIndex: 0, 'aria-label': 'Saved audio examples' }, clips.map(clip => h('div', { className: 'mc-audio-card' + (localEditor ? '' : ' mc-audio-card-playback'), key: clip.id },
        h(clip.provider === 'soundcloud' ? SoundCloudSectionPlayer : NativeSectionPlayer, { key: clip.id + ':' + (clip.startSeconds || 0) + ':' + clip.endSeconds, clip }),
        localEditor && (clip.startSeconds || clip.endSeconds != null) && h('p', { className: 'mc-audio-section-caption' }, 'Section: ' + T.format(clip.startSeconds || 0) + '–' + (clip.endSeconds == null ? 'end' : T.format(clip.endSeconds))),
        localEditor && h(AudioSectionEditor, { clip, busy, onSave: save }),
        localEditor && h('button', { type: 'button', className: 'mc-audio-remove', disabled: busy, 'aria-label': 'Remove ' + clip.name, onClick: () => save({ remove: clip.id }).catch(() => {}) }, 'Remove audio')))) : h('p', { className: 'mc-audio-empty' }, 'No examples added yet.'),
      showMoreExamples && h(MoreAudioExamples, { concept }),
      message && h('p', { className: 'mc-audio-status', role: 'status' }, message),
      error && !open && h('p', { className: 'mc-audio-error', role: 'alert' }, error),
      open && h(window.IGMediaBank, { Modal: AudioModal, query: concept.name + ' music', type: 'audio', autoFocus: true, scrollFades: true,
        sources: [{ key: 'commons', label: 'Wikimedia Commons' }, { key: 'ccmixter', label: 'ccMixter' }, { key: 'archive', label: 'Internet Archive' }, { key: 'soundcloud', label: 'SoundCloud' }],
        searchSource: async (source, query, offset, signal) => {
          const response = await fetch(endpoint + '/search?' + new URLSearchParams({ source, q: query, offset: String(offset) }), { signal, cache: 'no-store' });
          const data = await response.json();
          if (!response.ok) throw Error(data.error || 'This audio source is unavailable.');
          if (source === 'ccmixter') data.images = data.images.map(item => ({ ...item, media: { ...item.media, src: endpoint + '/preview?' + new URLSearchParams({ sourceUrl: item.media.sourceUrl, sourceFile: item.media.sourceFile }) } }));
          return data;
        },
        readFile: readAudioFile, normalizeMedia: media => media,
        onClose: () => { if (!busyRef.current) setOpen(false); }, onChange: media => save({ media }) }));
  }
  window.MusicConceptAudio = AudioExamples;
})();
