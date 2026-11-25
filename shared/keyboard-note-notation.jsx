(function (root) {
  const SHARED_SYMBOLS = window.BRAVURA_SYMBOLS ?? {};
  const SHARED_CONFIG = window.SHARED_NOTATION_CONFIG ?? { symbols: {}, drawing: {} };
  const STAFF = { left:247, right:689, trebleTop:84, bassTop:225, gap:18.9 };
  const NOTE = { x:468, rx:12.2, stemLength:62 };
  const yForStep = (top, step) => top + STAFF.gap * 4 - step * (STAFF.gap / 2);
  const stemDown = (step) => step > 4;

  function sharedActualSymbolKey(key) {
    if (key === "flatInScore") return "flat";
    if (key === "naturalInScore") return "natural";
    if (key === "sharpInScore") return "sharp";
    return key;
  }

  function sharedSymbolConfig(key) {
    const symbols = SHARED_CONFIG.symbols ?? {};
    return symbols[key] ?? symbols[sharedActualSymbolKey(key)] ?? {
      fontSizeScale: 3.4,
      xOffsetScale: 0,
      yOffsetScale: 0,
      widthScale: 1,
      heightScale: 1,
      opticalXOffset: 0,
      opticalYOffset: 0,
    };
  }

  function sharedSymbolForKey(key) {
    return SHARED_SYMBOLS[sharedActualSymbolKey(key)] ?? "";
  }

  function CalibratedSymbol({ symbolKey, x, y, colour = "currentColor", opacity = 1, lineGap = STAFF.gap, filter = null, settingOverrides = {} }) {
    const glyph = sharedSymbolForKey(symbolKey);
    if (!glyph) return null;
    const settings = { ...sharedSymbolConfig(symbolKey), ...settingOverrides };
    const adjustedX = x + lineGap * Number(settings.xOffsetScale || 0) + Number(settings.opticalXOffset || 0);
    const adjustedY = y + lineGap * Number(settings.yOffsetScale || 0) + Number(settings.opticalYOffset || 0);
    const fontSize = lineGap * Number(settings.fontSizeScale || 3.4);
    const widthScale = Number(settings.widthScale || 1);
    const heightScale = Number(settings.heightScale || 1);
    return (
      <text
        className="music-symbol"
        x={adjustedX}
        y={adjustedY}
        fill={colour}
        opacity={opacity}
        fontSize={fontSize}
        textAnchor="middle"
        style={filter ? { filter } : undefined}
        transform={`translate(${adjustedX} ${adjustedY}) scale(${widthScale} ${heightScale}) translate(${-adjustedX} ${-adjustedY})`}
        pointerEvents="none"
      >
        {glyph}
      </text>
    );
  }

  function Staff({ clef, top, visible, left = STAFF.left, right = STAFF.right }) {
    if (!visible) return null;
    const isTreble = clef === "treble";
    return (
      <g>
        {[0, 1, 2, 3, 4].map((line) => (
          <line key={line} x1={left} x2={right} y1={top + line * STAFF.gap} y2={top + line * STAFF.gap} stroke="url(#staffLineFade)" strokeWidth="1.5" />
        ))}
        <CalibratedSymbol symbolKey={isTreble ? "gClef" : "fClef"} x={left + 52} y={yForStep(top, isTreble ? 2 : 6)} />
      </g>
    );
  }

  function LedgerLines({ note, colour, enabled }) {
    if (!note || !enabled) return null;
    const top = note.clef === "treble" ? STAFF.trebleTop : STAFF.bassTop;
    const lines = [];
    if (note.step <= -2) lines.push(-2);
    if (note.step <= -4) lines.push(-4);
    if (note.step >= 10) lines.push(10);
    if (note.step >= 12) lines.push(12);

    return (
      <g pointerEvents="none">
        {(() => {
          const settings = sharedSymbolConfig("ledgerLines");
          const xOffset = STAFF.gap * Number(settings.xOffsetScale || 0) + Number(settings.opticalXOffset || 0);
          const yOffset = STAFF.gap * Number(settings.yOffsetScale || 0) + Number(settings.opticalYOffset || 0);
          const halfWidth = (STAFF.gap * Number(SHARED_CONFIG.drawing?.ledgerLineWidthScale || 2.4) * Number(settings.widthScale || 1)) / 2;
          const thickness = Math.max(1, STAFF.gap * Number(SHARED_CONFIG.drawing?.ledgerLineThicknessScale || 0.11) * Number(settings.heightScale || 1));
          return lines.map((step) => {
            const y = yForStep(top, step) + yOffset;
            return <line key={step} x1={NOTE.x - halfWidth + xOffset} x2={NOTE.x + halfWidth + xOffset} y1={y} y2={y} stroke={colour} strokeWidth={thickness} strokeLinecap="butt" />;
          });
        })()}
      </g>
    );
  }

  function Accidental({ note, colour }) {
    if (!note?.accidental) return null;
    const top = note.clef === "treble" ? STAFF.trebleTop : STAFF.bassTop;
    const y = yForStep(top, note.step);
    const isSharp = note.accidental === "sharp";
    const symbolKey = note.accidental + "InScore";
    const ledgerOffset = y < 95 || y > 285 ? -6 : 0;
    const isLedgerLineNote = note.step <= -2 || note.step >= 10;
    const flatLedgerLineOffset = !isSharp && isLedgerLineNote ? -3 : 0;
    const sharpLedgerLineOffset = isSharp && isLedgerLineNote ? -3 : 0;
    const x = isSharp ? NOTE.x - 44 + ledgerOffset + sharpLedgerLineOffset : NOTE.x - 41 + ledgerOffset + flatLedgerLineOffset;

    return (
      <CalibratedSymbol symbolKey={symbolKey} x={x} y={y} colour={colour} />
    );
  }

  function Crotchet({ note, colour, ledgerEnabled }) {
    if (!note) return null;
    const top = note.clef === "treble" ? STAFF.trebleTop : STAFF.bassTop;
    const y = yForStep(top, note.step);
    const down = stemDown(note.step);

    return (
      <g pointerEvents="none">
        <LedgerLines note={note} colour={colour} enabled={ledgerEnabled} />
        <Accidental note={note} colour={colour} />
        <CalibratedSymbol symbolKey={down ? "quarterNoteStemDown" : "quarterNoteStemUp"} x={NOTE.x} y={y} colour={colour} />
      </g>
    );
  }

  function WrittenNote({note,hideLabel=false,showNoteNames=false}) {
    const bass=note.clef==="bass";
    const top=bass?STAFF.bassTop:STAFF.trebleTop;
    const labels=bass?"GBDFA":"EGBDF";
    const spaces=bass?"ACEG":"FACE";
    return <svg className="keyboard-stave" viewBox="220 0 520 240" role="img" aria-label={hideLabel?"Written note":`Written note ${note.label}, octave ${note.octave ?? (4 + Math.floor((note.step + 2) / 7))}`}>
      <defs><linearGradient id="staffLineFade" x1="247" y1="0" x2="689" y2="0" gradientUnits="userSpaceOnUse"><stop offset="0%" stopColor="currentColor"/><stop offset="84%" stopColor="currentColor"/><stop offset="100%" stopColor="currentColor" stopOpacity="0"/></linearGradient></defs>
      <g transform={note.clef === "bass" ? `translate(0 ${STAFF.trebleTop-STAFF.bassTop})` : undefined}><Staff clef={note.clef} top={note.clef === "bass" ? STAFF.bassTop : STAFF.trebleTop} visible={true}/><Crotchet note={note} colour="currentColor" ledgerEnabled={true}/>
        {showNoteNames&&<g fontSize="12" fontWeight="700" dominantBaseline="middle" textAnchor="middle" aria-hidden="true">
          {Array.from(labels,(label,index)=><text key={index} x={STAFF.left-11} y={yForStep(top,index*2)}>{label}</text>)}
          {Array.from(spaces,(label,index)=><text key={index} x={STAFF.left+7} y={yForStep(top,index*2+1)}>{label}</text>)}
        </g>}
      </g>
    </svg>;
  }
  root.MLH.KeyboardWrittenNote = WrittenNote;
})(window);
