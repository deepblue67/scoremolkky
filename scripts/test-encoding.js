const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const ROOT = path.resolve(__dirname, '..');
const FILES = [
  'index.html',
  'sw.js',
  'README.md',
  'src/app.js',
  'src/components.js',
  'src/game-components.js',
  'src/game-state.js',
  'src/dialogs.js',
  'src/setup-screen.js',
  'src/rules.js',
  'src/storage.js',
  'components.js',
  'game-components.js',
  'game-state.js',
  'dialogs.js',
  'setup-screen.js',
  'styles.css',
  'fonts.css',
  'manifest.webmanifest',
];

const MOJIBAKE_PATTERNS = [
  /Ã[\u0080-\u00BF]/,
  /Â[\u0080-\u00BF]/,
  /â[€œ€ž€\u0080-\u00BF]/,
  /ðŸ/,
  /ï»¿/,
  /\uFFFD/,
];

for (const file of FILES) {
  const fullPath = path.join(ROOT, file);
  const text = fs.readFileSync(fullPath, 'utf8');

  for (const pattern of MOJIBAKE_PATTERNS) {
    const match = text.match(pattern);
    assert.equal(
      match,
      null,
      `${file} contains likely mojibake near "${match && text.slice(Math.max(0, match.index - 20), match.index + 40)}"`
    );
  }
}

console.log('Encoding tests passed');
