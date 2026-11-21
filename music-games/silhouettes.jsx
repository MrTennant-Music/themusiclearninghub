/* Shared Music Games glyphs: a 48-unit canvas, rounded geometry and quiet colour accents. */
(() => {
  const ink = 'currentColor';
  const paper = '#ffffff';
  const mist = '#e8eff5';
  const teal = '#53b6a2';
  const amber = '#edba61';
  const coral = '#df8b88';
  const blue = '#7faad5';
  const line = {fill:'none',stroke:ink,strokeWidth:2.5,strokeLinecap:'round',strokeLinejoin:'round'};
  const shapes = {
    'quiz': <>
      <rect x="9" y="5" width="30" height="38" rx="5" fill={ink}/>
      <rect x="12" y="8" width="24" height="32" rx="2.5" fill={paper}/>
      <path d="M17 14h14" {...line}/>
      <rect x="16" y="20" width="5" height="5" rx="1.5" fill={mist}/><path d="M25 22.5h6" {...line}/>
      <rect x="16" y="30" width="5" height="5" rx="1.5" fill={teal}/><path d="m25 32 2.5 2.5 5-5" {...line}/>
    </>,
    'true-or-false': <>
      <rect x="4" y="11" width="23" height="28" rx="5" fill={ink}/>
      <rect x="7" y="14" width="17" height="22" rx="2.5" fill={teal}/>
      <rect x="23" y="7" width="21" height="28" rx="5" fill={paper}/>
      <rect x="24.5" y="8.5" width="18" height="25" rx="3.5" fill={coral} stroke={ink} strokeWidth="3"/>
      <path d="m10.5 25 3.5 3.5 6-7" fill="none" stroke={paper} strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="m30 17 7 8m0-8-7 8" {...line}/>
    </>,
    'match-up': <>
      <rect x="5" y="8" width="17" height="25" rx="4" fill={ink}/>
      <rect x="8" y="11" width="11" height="19" rx="1.5" fill={amber}/>
      <rect x="26" y="15" width="17" height="25" rx="4" fill={ink}/>
      <rect x="29" y="18" width="11" height="19" rx="1.5" fill={teal}/>
      <path d="M18 25.5h12m-4-4 4 4-4 4" {...line}/>
    </>,
    'matching-pairs': <>{[amber,teal,blue,coral].flatMap((colour,row)=>Array.from({length:4},(_,column)=><rect key={`${row}-${column}`} x={5+column*10} y={5+row*10} width="8" height="8" rx="2" fill={colour}/>))}</>,
    'group-sort': <>
      <path d="M24 15v5H13v5m11-5h11v5" {...line}/>
      <rect x="17" y="5" width="14" height="11" rx="3" fill={ink}/>
      <rect x="5" y="24" width="17" height="18" rx="4" fill={ink}/>
      <rect x="26" y="24" width="17" height="18" rx="4" fill={ink}/>
      <rect x="8" y="27" width="11" height="12" rx="1.5" fill={amber}/>
      <rect x="29" y="27" width="11" height="12" rx="1.5" fill={teal}/>
      <path d="M11 32h5m16 0h5" {...line}/>
    </>,
    'rank-order': <>
      <path d="M9 8v31m-4-4 4 4 4-4" {...line}/>
      <rect x="18" y="7" width="25" height="8" rx="2.5" fill={ink}/>
      <rect x="18" y="20" width="20" height="8" rx="2.5" fill={blue}/>
      <rect x="18" y="33" width="15" height="8" rx="2.5" fill={teal}/>
    </>,
    'complete-the-sentence': <>
      <rect x="5" y="8" width="38" height="32" rx="5" fill={ink}/>
      <rect x="8" y="11" width="32" height="26" rx="2.5" fill={paper}/>
      <path d="M13 17h22M13 31h22M13 24h4m15 0h3" {...line}/>
      <rect x="21" y="20" width="7" height="8" rx="1.5" fill={amber}/>
      <path d="M21 28h7" {...line}/>
    </>,
    'type-the-answer': <>
      <rect x="3" y="11" width="42" height="27" rx="5" fill={ink}/>
      {[0,1].flatMap(row=>Array.from({length:5},(_,column)=><rect key={`${row}-${column}`} x={8+column*7} y={16+row*7} width="4" height="4" rx="1" fill={row===0&&column===2?teal:mist}/>))}
      <rect x="15" y="30" width="18" height="3" rx="1.5" fill={teal}/>
    </>,
    'wordsearch': <>
      <rect x="5" y="5" width="30" height="32" rx="4" fill={ink}/>
      <rect x="8" y="8" width="24" height="26" rx="1.5" fill={paper}/>
      <rect x="10" y="11" width="20" height="5" rx="2.5" fill={teal}/>
      {[0,1].flatMap(row=>Array.from({length:3},(_,column)=><rect key={`${row}-${column}`} x={11+column*7} y={20+row*8} width="4" height="3" rx="1" fill={blue}/>))}
      <circle cx="31" cy="30" r="9" fill={paper} stroke={ink} strokeWidth="3"/>
      <circle cx="31" cy="30" r="5.5" fill={amber}/>
      <path d="m38 37 6 6" fill="none" stroke={ink} strokeWidth="4" strokeLinecap="round"/>
    </>,
    'crossword': <>
      <path d="M19 5h10v14h14v10H29v14H19V29H5V19h14z" fill={ink} stroke={ink} strokeWidth="3" strokeLinejoin="round"/>
      <rect x="21" y="7" width="6" height="10" rx="1" fill={mist}/>
      <rect x="7" y="21" width="10" height="6" rx="1" fill={teal}/>
      <rect x="21" y="21" width="6" height="6" rx="1" fill={amber}/>
      <rect x="31" y="21" width="10" height="6" rx="1" fill={teal}/>
      <rect x="21" y="31" width="6" height="10" rx="1" fill={mist}/>
      <path d="M19 12h10M12 19v10m24-10v10M19 36h10" fill="none" stroke={ink} strokeWidth="2"/>
    </>,
    'labelled-diagram': <>
      <rect x="5" y="7" width="33" height="34" rx="5" fill={ink}/>
      <rect x="8" y="10" width="27" height="28" rx="2.5" fill={mist}/>
      <circle cx="15" cy="17" r="3" fill={amber}/>
      <path d="m10 34 8-11 5 6 4-4 6 9z" fill={blue}/>
      <path d="M24 24h8l5-7h6" fill="none" stroke={paper} strokeWidth="5.5" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M24 24h8l5-7h6" {...line}/>
      <circle cx="24" cy="24" r="3.5" fill={teal} stroke={ink} strokeWidth="2"/>
      <rect x="36" y="12" width="10" height="9" rx="2.5" fill={teal} stroke={ink} strokeWidth="2"/>
    </>,
    // Retain the legacy glyph for existing authored activities.
    'gameshow-quiz': <>
      <path d="M14 8h20v12a10 10 0 0 1-20 0z" fill={amber} stroke={ink} strokeWidth="3" strokeLinejoin="round"/>
      <path d="M14 12H7v6a8 8 0 0 0 9 8m18-14h7v6a8 8 0 0 1-9 8M24 31v8m-9 2h18" {...line}/>
    </>
  };
  window.IGTemplateSilhouette = function TemplateSilhouette({id}) {
    return <svg viewBox="0 0 48 48" aria-hidden="true" focusable="false" fill="none" xmlns="http://www.w3.org/2000/svg">{shapes[id] || shapes.quiz}</svg>;
  };
})();
