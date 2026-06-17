const assert = require('node:assert/strict');
const constants = require('../src/constants.js');
const formatters = require('../src/formatters.js');

assert.deepEqual(constants.ACTUAL_PINS, [7, 9, 8, 10, 11, 12, 6, 5, 4, 3, 2, 1]);
assert.deepEqual(constants.SORTED_PINS, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12]);
assert.equal(constants.TEAM_COLORS.length, 6);
assert.ok(constants.TEAM_COLORS.every(color => /^#[0-9A-F]{6}$/.test(color)));

assert.equal(formatters.formatDuration(null), '—');
assert.equal(formatters.formatDuration(-1), '—');
assert.equal(formatters.formatDuration(9000), '9 sec');
assert.equal(formatters.formatDuration(65000), '1 min 05 sec');
assert.equal(formatters.formatDuration(3661000), '1h01');
assert.match(formatters.formatDate(Date.UTC(2026, 5, 17, 8, 30)), /\d{2}\/\d{2}\/2026/);

console.log('Helpers tests passed');
