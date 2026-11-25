(function () {
  'use strict';

  const colours = ['#f6c453', '#38bdf8', '#ffffff', '#a78bfa', '#4ade80'];
  const h = React.createElement;

  window.MLH.FinalConfetti = function FinalConfetti() {
    return h('div', { className: 'millionaire-final-confetti', 'aria-hidden': true },
      Array.from({ length: 60 }, (_, index) => h('span', {
        key: index,
        className: 'millionaire-final-confetti-piece',
        style: {
          left: `${(index * 37) % 100}%`,
          width: `${6 + (index % 3) * 2}px`,
          height: `${10 + (index % 4) * 2}px`,
          backgroundColor: colours[index % colours.length],
          '--confetti-fall-duration': `${3.8 + (index % 7) * .55}s`,
          '--confetti-fall-delay': `${-(index % 15) * .42}s`,
          '--confetti-fall-drift': `${((index % 9) - 4) * 12}px`,
          '--confetti-fall-rotate': `${360 + (index % 6) * 120}deg`,
        },
      })));
  };
})();
