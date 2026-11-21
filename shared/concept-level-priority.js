(function (root, factory) {
  const order = factory();
  if (typeof module === 'object' && module.exports) module.exports = order;
  else root.MLHConceptLevelPriority = order;
})(globalThis, function () {
  'use strict';

  // Keep each shuffled pool in order and draw two current-level items for
  // every earlier item while both pools have material.
  return function prioritise(items, isCurrent) {
    const current = [];
    const earlier = [];
    for (const item of items) (isCurrent(item) ? current : earlier).push(item);

    const ordered = [];
    let currentIndex = 0;
    let earlierIndex = 0;
    while (currentIndex < current.length && earlierIndex < earlier.length) {
      ordered.push(...current.slice(currentIndex, currentIndex + 2), earlier[earlierIndex++]);
      currentIndex += 2;
    }
    return ordered.concat(current.slice(currentIndex), earlier.slice(earlierIndex));
  };
});
