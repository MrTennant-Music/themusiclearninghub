/* Label/pin placement model reconstructed from Wordwall Label nK/n8.
   Source evidence and deliberate Hub integration differences are recorded in
   music-games/assets/labelled-diagram/reconstruction.md. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  else root.IGDiagramModel = api;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  'use strict';
  const image = Object.freeze({ x: 228, y: 47, width: 505, height: 505 });
  const colours = ['#499cdb', '#bc2d32', '#ee7d25', '#3d814a', '#b754cb', '#292dce', '#60b882', '#d94c20'];
  function displayImage(source) {
    // Keep the user's linked bass image transparent without moving its pins.
    if (typeof source === 'string' && /^https:\/\/upload\.wikimedia\.org\/wikipedia\/commons\/7\/78\/E-Bass_diagonal\.png(?:[?#]|$)/.test(source)) {
      return './music-games/assets/labelled-diagram/user-bass/bass-transparent.png';
    }

    // Recognise only the exact original drumkit photograph, including saved
    // copies, so other diagram images retain their own appearance.
    if (typeof source === 'string' && source.length === 220483) {
      let hash = 2166136261;
      for (let i = 0; i < source.length; i++) hash = Math.imul(hash ^ source.charCodeAt(i), 16777619);
      if ((hash >>> 0) === 1158922603) return './music-games/assets/labelled-diagram/drumkit-transparent.png';
    }
    return source;
  }
  function assign(placements, labelId, targetId) {
    const next = { ...placements };
    delete next[labelId];
    if (targetId != null) {
      for (const id of Object.keys(next)) if (next[id] === targetId) delete next[id];
      next[labelId] = targetId;
    }
    return next;
  }
  function target(item, box = image) {
    return { x: box.x + (Number.isFinite(Number(item.x)) ? Number(item.x) : 50) * box.width / 100, y: box.y + (Number.isFinite(Number(item.y)) ? Number(item.y) : 50) * box.height / 100 };
  }
  function arrange(items, placements, previousOrder = items.map(item => item.id)) {
    const byId = new Map(items.map(item => [item.id, item]));
    const order = previousOrder.filter(id => byId.has(id));
    items.forEach(item => { if (!order.includes(item.id)) order.push(item.id); });
    const groups = [order.filter((_, i) => i % 2 === 0), order.filter((_, i) => i % 2 === 1)];
    const targetSides = new Map(items.slice().sort((a, b) => a.x - b.x).map((item, i) => [item.id, i < Math.ceil(items.length / 2) ? 0 : 1]));
    // n8.$k: exchange assigned labels with the opposite group when their pins
    // cross the image's spatial partition; keep both columns balanced.
    for (let side = 0; side < 2; side++) {
      groups[side].forEach((id, index) => {
        if (placements[id] && targetSides.get(placements[id]) !== side) {
          const other = 1 - side;
          const swap = groups[other].findIndex(candidate => !placements[candidate] || targetSides.get(placements[candidate]) === side);
          if (swap >= 0) [groups[side][index], groups[other][swap]] = [groups[other][swap], groups[side][index]];
        }
      });
    }
    // n8.$d/$e: compare connector intersections, or the distance from an
    // unassigned slot to its neighbour's pin, before exchanging label slots.
    groups.forEach((group, side) => {
      const gap = 10, height = Math.min(110, (470 - gap * (group.length - 1)) / Math.max(1, group.length));
      const span = height * group.length + gap * (group.length - 1);
      const centres = new Map(group.map((id, index) => [id, { x: side ? 863.5 : 96.5, y: 77 + (470 - span) / 2 + height / 2 + index * (height + gap) }]));
      function compare(a, b) {
        const pa = centres.get(a), pb = centres.get(b);
        const ta = placements[a] && target(byId.get(placements[a]));
        const tb = placements[b] && target(byId.get(placements[b]));
        if (ta && tb) {
          const dyA = ta.y - pa.y, dxA = pa.x - ta.x;
          const dyB = tb.y - pb.y, dxB = pa.x - tb.x;
          const determinant = dyA * dxB - dyB * dxA;
          if (determinant === 0) return 0;
          const intersectionX = (dxB * (dyA * pa.x + dxA * pa.y) - dxA * (dyB * pa.x + dxB * pb.y)) / determinant;
          return (!side && intersectionX > pa.x && intersectionX < Math.min(ta.x, tb.x)) || (side && intersectionX < pa.x && intersectionX > Math.max(ta.x, tb.x)) ? 1 : -1;
        }
        if (!ta && !tb) return Math.sign(pa.y - pb.y);
        if (!ta) return Math.sign(Math.abs(pa.y - tb.y) - Math.abs(pb.y - tb.y)) * Math.sign(pa.y - pb.y);
        return -compare(b, a);
      }
      for (let pass = 0; pass < group.length; pass++) {
        let changed = false;
        for (let a = 0; a < group.length - 1; a++) for (let b = a + 1; b < group.length; b++) {
          if (compare(group[a], group[b]) === 1) {
            const first = group[a], second = group[b], firstPosition = centres.get(first);
            centres.set(first, centres.get(second)); centres.set(second, firstPosition);
            [group[a], group[b]] = [second, first]; changed = true;
          }
        }
        if (!changed) break;
      }
    });
    const slots = {};
    groups.forEach((group, side) => {
      const gap = 10, height = Math.min(110, (470 - gap * (group.length - 1)) / Math.max(1, group.length));
      const span = height * group.length + gap * (group.length - 1);
      group.forEach((id, row) => { slots[id] = { side, x: side ? 783 : 16, y: 77 + (470 - span) / 2 + row * (height + gap), width: 161, height }; });
    });
    const nextOrder = [];
    for (let i = 0; i < Math.ceil(order.length / 2); i++) for (const group of groups) if (group[i]) nextOrder.push(group[i]);
    return { slots, order: nextOrder };
  }
  function isCorrectTarget(items, labelId, targetId) {
    const label=items.find(item=>item.id===labelId);
    if(!label||!items.some(item=>item.id===targetId))return false;
    return labelId===targetId||!!label.acceptedTargetIds?.includes(targetId);
  }
  function score(items, placements) {
    const answers = items.map(item => {
      const label = items.find(candidate => placements[candidate.id] === item.id);
      return { prompt: item.prompt || item.answer, expected: item.answer, answer: label?.answer || '', correct: isCorrectTarget(items,label?.id,item.id), targetId: item.id, labelId: label?.id || null };
    });
    return { correct: answers.filter(answer => answer.correct).length, total: items.length, answers };
  }
  function nearest(items, point, radius = 24) {
    return items.map(item => ({ item, distance: Math.hypot(target(item).x - point.x, target(item).y - point.y) }))
      .filter(row => row.distance <= radius).sort((a, b) => a.distance - b.distance)[0]?.item.id ?? null;
  }
  function scenePoint(rect, client, viewBox = {x:0,y:0,width:960,height:600}) {
    const scale = Math.min(rect.width / viewBox.width, rect.height / viewBox.height) || 1;
    const left = rect.left + (rect.width - viewBox.width * scale) / 2;
    const top = rect.top + (rect.height - viewBox.height * scale) / 2;
    return {x:viewBox.x + (client.clientX-left)/scale,y:viewBox.y + (client.clientY-top)/scale};
  }
  function lines(text, maxCharacters = 13) {
    const explicitLines = String(text).split(/\r?\n|,\s*(?=Fret \d+\s*$)/i);
    if (explicitLines.length > 1) return explicitLines.map(line => line.trim());
    const result = [], words = String(text).split(/\s+/);
    for (const word of words) {
      if (result.length && result.at(-1).length + word.length + 1 <= maxCharacters) result[result.length - 1] += ' ' + word;
      else result.push(word);
    }
    return result;
  }
  return Object.freeze({ image, colours, displayImage, assign, target, arrange, isCorrectTarget, score, nearest, lines, scenePoint });
});
