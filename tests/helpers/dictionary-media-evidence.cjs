const { existsSync, readFileSync } = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const evidenceDirectory = process.env.MLH_DICTIONARY_EVIDENCE_DIR;
const defaultDirectory = path.resolve(__dirname, '../../maintenance/audio-evidence');

function archivedMediaTest(name, reports, verify) {
  const reportPaths = reports.map(report => path.resolve(evidenceDirectory || defaultDirectory, report));
  const missing = reports.filter((_, index) => !existsSync(reportPaths[index]));
  const skip = !evidenceDirectory && missing.length > 0
    ? 'Original review unavailable: ' + missing.join(', ')
    : false;

  test(name, { skip }, () => {
    verify(...reportPaths.map(report => JSON.parse(readFileSync(report, 'utf8'))));
  });
}

module.exports = { archivedMediaTest };
