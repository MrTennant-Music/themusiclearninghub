(function (root) {
  'use strict';
  // Official 2027 Music timetable, version 02 (August 2026):
  // https://www.sqa.org.uk/sqa/files_ccc/nq-2027-exam-timetable.pdf
  const EXAM_DATE = '2027-05-11';
  const ukDate = new Intl.DateTimeFormat('en-GB', {
    timeZone: 'Europe/London', year: 'numeric', month: '2-digit', day: '2-digit',
  });

  function countdown(now = new Date()) {
    const parts = Object.fromEntries(ukDate.formatToParts(now).map(part => [part.type, part.value]));
    // Compare calendar dates, rather than 24-hour periods spanning a DST change.
    const today = Date.UTC(Number(parts.year), Number(parts.month) - 1, Number(parts.day));
    const days = Math.round((Date.parse(EXAM_DATE + 'T00:00:00Z') - today) / 86400000);
    if (days < 0) return { days, compact: 'Past', full: 'Exams have taken place' };
    if (days === 0) return { days, compact: 'Today', full: 'Exam day today' };
    const label = `${days} ${days === 1 ? 'day' : 'days'}`;
    return { days, compact: label, full: label };
  }

  if (typeof module !== 'undefined' && module.exports) module.exports = { EXAM_DATE, countdown };
  if (!root.document) return;
  function update() {
    const value = countdown();
    root.document.querySelectorAll('[data-exam-countdown]').forEach(node => {
      const label = value[node.getAttribute('data-exam-countdown')];
      if (node.textContent !== label) node.textContent = label;
    });
  }
  update();
  root.setInterval(update, 30000);
  root.document.addEventListener('visibilitychange', update);
  root.document.addEventListener('click', event => {
    if (event.target.closest('[data-open="examDatesOverlay"], #moreDropdown')) update();
  });
})(typeof window !== 'undefined' ? window : globalThis);
