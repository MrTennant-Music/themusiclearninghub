/* Read-only Bravura examples for the original Music Literacy Dictionary exercises. */
(function (root) {
  'use strict';
  const h = React.createElement;
  const glyphs = root.BRAVURA_SYMBOLS;
  const gap = 10;
  const middle = 72;
  const pitchIndex = pitch => Number(pitch.at(-1)) * 7 + 'CDEFGAB'.indexOf(pitch[0]);
  const accidentals = { '#': 'sharp', b: 'flat', n: 'natural' };
  const noteheads = { w: 'noteheadWhole', h: 'noteheadHalf', q: 'noteheadBlack', e: 'noteheadBlack', s: 'noteheadBlack' };
  const rests = { w: 'wholeRest', bar: 'wholeRest', h: 'halfRest', q: 'quarterRest', e: 'eighthRest', s: 'sixteenthRest' };
  const line = (key, x1, y1, x2, y2, strokeWidth = 1) => h('line', { key, x1, y1, x2, y2, strokeWidth, stroke: 'currentColor' });
  const fontGlyph = (key, symbol, x, y, fontSize = 4 * gap) => h('text', {
    key, x, y, fontSize, className: 'mc-bravura', fill: 'currentColor'
  }, glyphs[symbol]);
  function vectorGlyph(key, symbol, x, y, fontSize = 4 * gap) {
    const outlines = root.BRAVURA_WORKSHEET_OUTLINES;
    const outline = outlines?.symbols[symbol];
    if (!outline) return fontGlyph(key, symbol, x, y, fontSize);
    const scale = fontSize / outlines.unitsPerEm;
    return h('path', { key, d: outline.path, transform: 'translate(' + x + ' ' + y + ') scale(' + scale + ' ' + -scale + ')', fill: 'currentColor' });
  }
  const text = (key, content, x, y) => h('text', {
    key, x, y, className: 'mc-notation-label', fill: 'currentColor'
  }, content);
  const barSymbols = { '|': 'barlineSingle', '||': 'barlineFinal', '||>': 'barlineFinal', '|:': 'repeatLeft', ':|': 'repeatRight' };
  const standalone = { roman: 'I   IV   V', fine: 'Fine' };

  function useInkFrame(viewBox, fitInk, content) {
    const ref = React.useRef(null);
    React.useLayoutEffect(() => {
      const svg = ref.current;
      if (!svg || !fitInk) return;
      function fit() {
        if (!svg.isConnected) return;
        const ink = svg.getBBox();
        if (!ink.width || !ink.height) return;
        const padding = 4;
        const left = Math.floor(ink.x - padding);
        const top = Math.floor(ink.y - padding);
        const right = Math.ceil(ink.x + ink.width + padding);
        const bottom = Math.ceil(ink.y + ink.height + padding);
        svg.setAttribute('viewBox', [left, top, right - left, bottom - top].join(' '));
      }
      fit();
      let current = true;
      document.fonts?.ready.then(() => { if (current) fit(); });
      return () => { current = false; };
    }, [viewBox, fitInk, content]);
    return ref;
  }

  function TimeSignaturePicture({ signature, fitInk }) {
    const [top, bottom] = signature.split('/');
    // Match the Bravura numerals and their anchors in the Time Signatures activity.
    const numerals = value => Array.from(value, digit => glyphs['timeSig' + digit]).join('');
    function number(value, y) {
      const fontSize = value.length > 1 ? 52 : 56;
      const outlines = root.BRAVURA_WORKSHEET_OUTLINES;
      const symbols = Array.from(value, digit => 'timeSig' + digit);
      if (fitInk && symbols.every(symbol => outlines?.symbols[symbol])) {
        const widths = symbols.map(symbol => outlines.symbols[symbol].advance * fontSize / outlines.unitsPerEm);
        let x = 38 - widths.reduce((total, width) => total + width, 0) / 2;
        return symbols.map((symbol, index) => {
          const mark = vectorGlyph(index, symbol, x, y, fontSize);
          x += widths[index];
          return mark;
        });
      }
      return h('text', { className: 'mc-bravura', x: 38, y, textAnchor: 'middle', fontSize }, numerals(value));
    }
    const viewBox = '0 0 76 84';
    const ref = useInkFrame(viewBox, fitInk, signature);
    return h('svg', { ref, viewBox, className: 'mc-literacy-time-signature' },
      h('g', null, number(top, 24)), h('g', null, number(bottom, 63)));
  }

  function SingleSymbolPicture({ outline }) {
    function frameInk(path) {
      if (!path) return;
      const { x, y, width, height } = path.getBBox();
      path.ownerSVGElement.setAttribute('viewBox', [x, -y - height, width, height].join(' '));
    }
    return h('svg', { className: 'mc-literacy-single-symbol', viewBox: '0 -1100 1200 1500' },
      h('path', { d: outline.path, transform: 'scale(1 -1)', fill: 'currentColor', ref: frameInk }));
  }

  function LiteracyPicture({ picture, fitInk = false }) {
    const config = typeof picture === 'string' ? { symbols: picture } : picture;
    if (config.src) return h('img', { className: 'mc-literacy-closeup-image', src: config.src, alt: config.alt, width: 960, height: 480 });
    const { symbols, scores, signatures, arrow, staff, wide, closeup, labels, alt, largeSymbols, enlarged, brace,
      dotOffset, ledgerShift, stemShift, noteShift, beamOverhang, symbolOffsetY, columns = 1 } = config;
    const outline = glyphs[symbols] && root.BRAVURA_WORKSHEET_OUTLINES?.symbols[symbols];
    const sizeClass = scores ? ' mc-literacy-picture-scores' : wide ? ' mc-literacy-picture-wide' : '';
    const scaleClass = enlarged ? ' mc-literacy-picture-enlarged'
      : closeup ? ' mc-literacy-picture-closeup' : largeSymbols ? ' mc-literacy-picture-large-symbols' : '';
    return h('div', { className: 'mc-literacy-picture' + sizeClass + scaleClass,
        ...(alt ? { role: 'img', 'aria-label': alt } : { 'aria-hidden': true }) },
      scores ? h('div', { className: 'mc-literacy-picture-grid', 'data-columns': columns, style: { gridTemplateColumns: 'repeat(' + columns + ', minmax(0, 1fr))' } },
        scores.map((notation, index) => h('div', { key: index },
          Array.isArray(notation)
            ? h(GrandStaffPicture, { parts: notation, fitInk, brace })
            : h(LiteracyScore, { notation, compact: true, staff, enlarged, dotOffset, ledgerShift, stemShift, noteShift, beamOverhang, fitInk }),
          labels?.[index] && h('span', { className: 'mc-literacy-picture-label' }, labels[index]))))
      : signatures ? signatures.map((signature, index) => h(React.Fragment, { key: signature },
        index > 0 && arrow && h('span', null, '→'), h(TimeSignaturePicture, { signature, fitInk })))
      : outline ? h(SingleSymbolPicture, { outline })
      : symbols.split(' ').map((symbol, index) => glyphs[symbol]
        ? h('span', { key: index, className: 'mc-bravura', style: symbolOffsetY ? { transform: 'translateY(' + symbolOffsetY + 'px)' } : undefined }, glyphs[symbol])
        : h('span', { key: index }, standalone[symbol])));
  }

  function drawScore(notation, { compact, staff, enlarged, dotOffset = 0, stemShift = 0, noteShift = 0, beamOverhang = 0, fitInk, ledgerShift = fitInk ? 2 : 0 }) {
    const glyph = fitInk ? vectorGlyph : fontGlyph;
    const [clef, ...tokens] = notation.split(/\s+/);
    const lowerLine = middle + 2 * gap;
    const base = pitchIndex(clef === 'bass' ? 'G2' : 'E4');
    const noteY = pitch => clef === 'rhythm' ? middle : lowerLine - (pitchIndex(pitch) - base) * gap / 2;
    const events = [];
    const graphics = [];
    const instructions = [];
    const slots = tokens.reduce((sum, token) => sum + (token[0] === '[' ? token.slice(1).split(']')[0].split(',').length
      : /^(?:[A-Gr@|:=]|K:)/.test(token) ? 1 : 0), 0);
    const accidentalSpacing = tokens.some(token => !token.startsWith('K:') && /[A-G][#bn]\d/.test(token));
    const compactSpacing = accidentalSpacing ? 34 : 27;
    const compactLead = accidentalSpacing ? 55 : 43;
    const stemOffset = (enlarged ? 0.77 : 1) + stemShift;
    const width = compact ? Math.max(90, slots * compactSpacing + (staff === 'none' ? 24 : compactLead + 5)) : 720;
    const staveLines = staff === 'none' ? [] : staff === 'single' ? [middle] : [middle - 20, middle - 10, middle, middle + 10, middle + 20];
    let staveEnd = width - (compact ? 7 : 20);
    const ledgers = [];
    const spacing = compact ? compactSpacing : Math.min(72, (width - 127) / Math.max(1, slots - 1));
    let x = compact ? staff === 'none' ? (width - (slots - 1) * spacing - 12) / 2 : compactLead : 86;
    const clefSymbol = clef === 'rhythm' ? 'unpitchedPercussionClef1' : clef === 'bass' ? 'fClef' : 'gClef';
    const clefY = clef === 'rhythm' ? middle : clef === 'bass' ? middle - gap : middle + gap;
    if (staff !== 'none') graphics.push(glyph('clef', clefSymbol, compact ? 10 : 28, clefY));

    function drawNote(token, beamed = false) {
      const [note, articulation] = token.split('!');
      const [pitches, value = 'q'] = note.split('/');
      const duration = value.replace('.', '');
      const dotted = value.endsWith('.');
      const notes = pitches.split('+').map(pitch => ({ pitch, y: pitch === 'r' ? middle : noteY(pitch) })).sort((a, b) => b.y - a.y);
      const low = notes[0].y;
      const high = notes.at(-1).y;
      const up = beamed || (low + high) / 2 >= middle;
      const noteX = x + (Array.isArray(noteShift) ? noteShift[events.length] ?? 0 : noteShift);
      const stemX = noteX + (up ? 10 : -0.3) + stemOffset;
      const key = 'note-' + events.length;
      const aboveBeam = beamed && articulation && !articulation.endsWith('Below') ? articulation : null;
      if (pitches === 'r') {
        graphics.push(glyph(key, rests[duration], x, duration === 'w' || duration === 'bar' ? middle - gap : middle));
      } else {
        const ledgerHeights = new Set();
        notes.forEach(({pitch, y}, index) => {
          const sideways = index > 0 && notes[index-1].y - y === gap/2 ? (up ? 10 : -10) : 0;
          graphics.push(glyph(key + '-head-' + index, noteheads[duration], noteX + sideways, y));
          if (accidentals[pitch[1]]) graphics.push(glyph(key + '-acc-' + index, accidentals[pitch[1]], noteX - 14, y));
          if (clef !== 'rhythm') {
            for (let ledger = middle + 30; ledger <= y; ledger += gap) ledgerHeights.add(ledger);
            for (let ledger = middle - 30; ledger >= y; ledger -= gap) ledgerHeights.add(ledger);
          }
        });
        for (const y of ledgerHeights) ledgers.push(line(key + '-ledger-' + y, noteX - 4 + ledgerShift, y, noteX + 17 + ledgerShift, y));
        if (duration !== 'w' && !beamed) {
          const end = up ? high - 31 : low + 31;
          graphics.push(line(key + '-stem', stemX, up ? low : high, stemX, end, 1.2));
          if (duration === 'e' || duration === 's') graphics.push(glyph(key + '-flag', 'flag' + (duration === 'e' ? '8th' : '16th') + (up ? 'Up' : 'Down'), stemX, end));
        }
        if (articulation && !aboveBeam) {
          const below = articulation.endsWith('Below');
          const y = below ? low + 12 : Math.min(high - 11, middle - 24);
          graphics.push(glyph(key + '-mark', articulation, noteX + 3, y, 32));
        }
      }
      if (dotted) graphics.push(glyph(key + '-dot', 'augmentationDot', (pitches === 'r' ? x : noteX) + 15 + dotOffset, pitches === 'r' ? middle : low - (staff !== 'none' && low % gap === lowerLine % gap ? 5 : 0)));
      const position = { x:noteX, stemX, low, high, duration, aboveBeam };
      events.push({ x:pitches === 'r' ? x : noteX, high, low });
      x += spacing;
      return position;
    }

    tokens.forEach((token, index) => {
      const key = 'event-' + index;
      if (Object.hasOwn(barSymbols, token) || token === '=') {
        const halfHeight = staff === 'single' ? 7 : 20;
        const barX = x - spacing * .225 + gap / 2;
        const barLine = (suffix, at, weight = 1) => line(key + suffix, at, middle - halfHeight, at, middle + halfHeight, weight);
        if (barSymbols[token] === 'barlineFinal') {
          const end = token === '||>' ? staveEnd : Math.min(staveEnd, barX + 1.5);
          if (index === tokens.length - 1) staveEnd = end;
          graphics.push(barLine('', end - 6), barLine('-final', end - 1.5, 3));
        } else if (token === '=') {
          graphics.push(barLine('', barX - 2.5), barLine('-second', barX + 2.5));
        } else if (token === '|') {
          const terminal = index === tokens.length - 1;
          if (terminal) staveEnd = Math.min(staveEnd, barX + 1.5);
          graphics.push(barLine('', terminal ? staveEnd - .5 : barX));
        } else {
          const symbol = barSymbols[token];
          const outlines = root.BRAVURA_WORKSHEET_OUTLINES;
          const repeat = outlines?.symbols[symbol];
          const at = token === ':|' && index === tokens.length - 1 && repeat
            ? staveEnd - repeat.advance * (4 * gap) / outlines.unitsPerEm
            : x - spacing * .45;
          graphics.push(glyph(key, symbol, at, lowerLine));
          if (token === ':|' && repeat && events.length) {
            events.at(-1).repeatEnd = at + repeat.advance * (4 * gap) / outlines.unitsPerEm;
          }
        }
        x += spacing * .55;
      } else if (token[0] === '@') {
        const [top, bottom] = token.slice(1).split('/');
        const digits = Math.max(top.length, bottom.length);
        [top, bottom].forEach((part, row) => Array.from(part).forEach((digit, offset) =>
          graphics.push(glyph(key + row + offset, 'timeSig' + digit, x + offset * 10 + (digits - part.length) * 5, middle + (row ? 10 : -10), 31))));
        x += spacing;
      } else if (token.startsWith('K:')) {
        token.slice(2).split(',').forEach((pitch, offset) =>
          graphics.push(glyph(key + offset, accidentals[pitch[1]], x + 13 * offset, noteY(pitch))));
        x += Math.max(spacing, 32);
      } else if (token[0] === '[') {
        const [group, triplet] = token.slice(1).split(']');
        const notes = group.split(',');
        const beam = notes.some(note => /\/[es]/.test(note));
        const positions = notes.map(note => drawNote(note, beam));
        const first = positions[0], last = positions.at(-1);
        const beamY = Math.min(...positions.map(note => note.high)) - 29;
        if (beam) {
          graphics.push(line(key + '-beam', first.stemX - beamOverhang, beamY, last.stemX + beamOverhang, beamY, 4));
          positions.forEach((note, i) => {
            graphics.push(line(key + '-stem-' + i, note.stemX, note.low, note.stemX, beamY, 1.2));
            if (note.aboveBeam) graphics.push(glyph(key + '-mark-' + i, note.aboveBeam, note.x + 3, beamY - 8, 32));
            if (note.duration !== 's') return;
            const following = positions[i + 1];
            if (following?.duration === 's') {
              const left = note.stemX - (note === first ? beamOverhang : 0);
              const right = following.stemX + (following === last ? beamOverhang : 0);
              graphics.push(line(key + '-second-' + i, left, beamY + 6, right, beamY + 6, 4));
            }
            else if (positions[i - 1]?.duration !== 's') graphics.push(line(key + '-flag-' + i, note.stemX, beamY + 6, note.stemX + (following ? 10 : -10), beamY + 6, 4));
          });
        }
        if (triplet) {
          const y = beamY - (positions.some(note => note.aboveBeam) ? 23 : 9), centre = (first.stemX + last.stemX) / 2;
          graphics.push(text(key + '-number', '3', centre - 4, y - 1));
          if (!beam) graphics.push(line(key + '-left', first.stemX, y - 4, centre - 9, y - 4), line(key + '-right', centre + 8, y - 4, last.stemX, y - 4),
            line(key + '-left-end', first.stemX, y - 4, first.stemX, y + 2), line(key + '-right-end', last.stemX, y - 4, last.stemX, y + 2));
        }
      } else if (/^[A-Gr]/.test(token) && !/^a\d|^b\d/.test(token)) {
        drawNote(token);
      } else if (token[0] === '^') {
        graphics.push(glyph(key, token.slice(1), events.at(-1).x, 121));
      } else {
        instructions.push([key, token]);
      }
    });

    instructions.forEach(([key, token]) => {
      if (/^[tTs]\d+:/.test(token)) {
        const [, type, index, label] = token.match(/^([tTs])(\d+):(.+)/);
        const anchor = events[Number(index)];
        graphics.push(type === 's' ? glyph(key, label, anchor.x, 42)
          : h('text', { key, x: anchor.x + 5, y: 23, textAnchor: 'middle', className: type === 'T' ? 'mc-notation-label-emphasis' : 'mc-notation-label', fill: 'currentColor' }, label.replaceAll('_', ' ')));
        return;
      }
      const [, mark, start, end] = token.match(/^(v[12]:|o[+-]|[ab<>])(\d+)-(\d+)$/);
      const first = events[Number(start)], last = events[Number(end)];
      const x1 = first.x + 4, x2 = last.x + 7;
      if (mark === 'b') {
        const tie = root.BRAVURA_WORKSHEET_OUTLINES.symbols.tie;
        const left = first.x + 9;
        const right = last.x + 3;
        const y = Math.max(first.low, last.low) + 7;
        // The Bravura tie tips sit at −183 font units, below the glyph origin.
        graphics.push(h('path', { key, d: tie.path, fill: 'currentColor',
          transform: `translate(${left} ${y}) scale(${(right - left) / tie.advance} ${-3 / 100}) translate(0 183)` }));
      } else if (mark === 'a') {
        const notes = events.slice(Number(start), Number(end) + 1);
        const y = Math.min(...notes.map(note => note.high)) - 36;
        graphics.push(h('path', { key, d: 'M'+x1+' '+y+' Q'+((x1+x2)/2)+' '+(y-22)+' '+x2+' '+y, fill:'none', stroke:'currentColor', strokeWidth:compact ? 2.4 : 1.7 }));
      } else if (mark === '<' || mark === '>') {
        const from = x1 + 20, to = x2 - 10, opens = mark === '<';
        graphics.push(line(key + '-upper', from, opens ? 116 : 110, to, opens ? 110 : 116),
          line(key + '-lower', from, opens ? 116 : 122, to, opens ? 122 : 116));
      } else if (mark[0] === 'v') {
        const left = first.x - spacing * .4;
        const repeatEnd = mark === 'v1:' ? last.repeatEnd : undefined;
        const right = repeatEnd ?? last.x + spacing * .45;
        graphics.push(text(key + '-label', mark[1] + '.', left + 4, 43), line(key + '-top', left, 28, right, 28), line(key + '-end', left, 28, left, 43));
        if (repeatEnd !== undefined) graphics.push(line(key + '-close', right, 28, right, 43));
      } else {
        const above = mark === 'o+';
        const notes = events.slice(Number(start), Number(end) + 1);
        // Leave room below both the stave and downward stems for the label and the upturned hook.
        const y = above
          ? Math.min(...notes.map(note => note.high)) - 40
          : Math.max(lowerLine, ...notes.map(note => note.low + 31)) + 22;
        graphics.push(glyph(key + '-label', above ? 'ottavaAlta' : 'ottavaBassa', x1 - 5, y, 34),
          h('path', { key, d: 'M'+(x1+27)+' '+(y-4)+' H'+(x2+9)+' v'+(above?8:-8), stroke:'currentColor', strokeDasharray:'5 3', fill:'none' }));
      }
    });
    const stave = staveLines.map(y => line('stave' + y, compact ? 5 : 19, y, staveEnd, y));
    const viewBox = compact ? [0, enlarged ? 18 : 5, staveEnd + 7, enlarged ? 80 : 112].join(' ') : '0 -8 ' + width + ' 158';
    return { viewBox, staveEnd, stave, ledgers, graphics };
  }

  function LiteracyScore({ notation, compact = false, staff = 'full', enlarged, dotOffset, ledgerShift, stemShift, noteShift, beamOverhang, fitInk }) {
    const { viewBox, stave, ledgers, graphics } = drawScore(notation, { compact, staff, enlarged, dotOffset, ledgerShift, stemShift, noteShift, beamOverhang, fitInk });
    const ref = useInkFrame(viewBox, fitInk, notation);
    return h('svg', { ref, viewBox, className: 'mc-literacy-score', 'aria-hidden': true }, stave, ledgers, graphics);
  }

  function GrandStaffPicture({ parts, fitInk, brace = true }) {
    const [treble, bass] = parts.map(notation => drawScore(notation, { compact: true, staff: 'full', fitInk }));
    const separation = 66;
    const viewBox = '-9 5 ' + (Math.max(treble.staveEnd, bass.staveEnd) + 23) + ' 175';
    const ref = useInkFrame(viewBox, fitInk, parts);
    return h('svg', { ref, viewBox,
      className: 'mc-literacy-staves', 'aria-hidden': true },
      line('join', 5, middle - 20, 5, middle + separation + 20),
      brace && h('path', {
        d: 'M2 52 C-8 63 -1 86 -8 105 C-1 124 -8 147 2 158',
        fill: 'none', stroke: 'currentColor', strokeWidth: 1.5,
      }),
      h('g', null, treble.stave, treble.ledgers, treble.graphics),
      h('g', { transform: 'translate(0 ' + separation + ')' }, bass.stave, bass.ledgers, bass.graphics));
  }

  root.MLHLiteracyNotation = { LiteracyPicture, LiteracyScore };
})(globalThis);
