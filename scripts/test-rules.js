const assert = require('node:assert/strict');
const rules = require('../src/rules.js');

assert.equal(rules.calculateThrowScore([]), 0);
assert.equal(rules.calculateThrowScore([12]), 12);
assert.equal(rules.calculateThrowScore([12, 7]), 2);
assert.equal(rules.calculateThrowScore([1, 2, 3, 4]), 4);

assert.equal(rules.calculateOverflowPenalty(53, '25'), 25);
assert.equal(rules.calculateOverflowPenalty(53, '0'), 0);
assert.equal(rules.calculateOverflowPenalty(53, 'half'), 26);
assert.equal(rules.calculateOverflowPenalty(53, 'none'), null);

assert.equal(rules.getNextActiveTeamIndex([{ eliminated: false }, { eliminated: false }], 0), 1);
assert.equal(rules.getNextActiveTeamIndex([{ eliminated: false }, { eliminated: true }, { eliminated: false }], 0), 2);
assert.equal(rules.getNextActiveTeamIndex([{ eliminated: true }, { eliminated: true }], 0), 0);

assert.deepEqual(rules.previewScoreAfterThrow(20, 8, 30, { overflowMode: '25' }), {
  overflow: false,
  displayScore: 28,
  label: 'Après',
});

assert.deepEqual(rules.previewScoreAfterThrow(28, 5, 30, { overflowMode: 'none' }), {
  overflow: true,
  displayScore: 28,
  label: '🚫 Ignoré',
});

assert.deepEqual(rules.previewScoreAfterThrow(28, 5, 30, { overflowMode: '0' }), {
  overflow: true,
  displayScore: 0,
  label: '⚠️ → 0',
});

assert.deepEqual(rules.previewScoreAfterThrow(28, 5, 30, { overflowMode: 'half' }), {
  overflow: true,
  displayScore: 16,
  label: '⚠️ → moitié',
});

const baseTeam = {
  name: 'Alpha',
  score: 28,
  misses: 2,
  overflowStrikes: 0,
  totalThrows: 4,
  totalScore: 28,
  maxThrow: 12,
  overflows: 0,
  history: [],
};

assert.deepEqual(rules.calculateThrowOutcome(baseTeam, [1], 30, { overflowMode: '25', overflowGrace: 0 }), {
  score: 1,
  scoreBefore: 28,
  newScore: 29,
  overflow: false,
  penalized: false,
  updatedTeam: {
    ...baseTeam,
    score: 29,
    misses: 0,
    overflowStrikes: 0,
    totalThrows: 5,
    totalScore: 29,
    maxThrow: 12,
    overflows: 0,
    history: [{ pins: [1], points: 1, overflow: false, penalized: false }],
  },
});

assert.equal(
  rules.calculateThrowOutcome(baseTeam, [5], 30, { overflowMode: '25', overflowGrace: 0 }).updatedTeam.score,
  25
);

assert.equal(
  rules.calculateThrowOutcome(baseTeam, [5], 30, { overflowMode: '0', overflowGrace: 0 }).updatedTeam.score,
  0
);

assert.equal(
  rules.calculateThrowOutcome(baseTeam, [5], 30, { overflowMode: 'half', overflowGrace: 0 }).updatedTeam.score,
  16
);

const graceOutcome = rules.calculateThrowOutcome(baseTeam, [5], 30, { overflowMode: '25', overflowGrace: 1 });
assert.equal(graceOutcome.updatedTeam.score, 28);
assert.equal(graceOutcome.updatedTeam.overflowStrikes, 1);
assert.equal(graceOutcome.penalized, false);

const secondGraceOutcome = rules.calculateThrowOutcome(graceOutcome.updatedTeam, [5], 30, { overflowMode: '25', overflowGrace: 1 });
assert.equal(secondGraceOutcome.updatedTeam.score, 25);
assert.equal(secondGraceOutcome.updatedTeam.overflowStrikes, 0);
assert.equal(secondGraceOutcome.penalized, true);

const ignoredOverflow = rules.calculateThrowOutcome(baseTeam, [5], 30, { overflowMode: 'none', overflowGrace: 0 });
assert.equal(ignoredOverflow.updatedTeam.score, 28);
assert.equal(ignoredOverflow.updatedTeam.overflowStrikes, 0);
assert.equal(ignoredOverflow.updatedTeam.overflows, 1);

const firstMiss = rules.calculateMissOutcome({ ...baseTeam, misses: 0 }, { eliminationOn: true, missLimit: 3 });
assert.equal(firstMiss.newMisses, 1);
assert.equal(firstMiss.eliminated, false);
assert.equal(firstMiss.updatedTeam.misses, 1);
assert.equal(firstMiss.updatedTeam.totalThrows, 5);

const eliminatedMiss = rules.calculateMissOutcome({ ...baseTeam, misses: 2 }, { eliminationOn: true, missLimit: 3 });
assert.equal(eliminatedMiss.newMisses, 3);
assert.equal(eliminatedMiss.eliminated, true);
assert.equal(eliminatedMiss.updatedTeam.eliminated, true);
assert.equal(eliminatedMiss.updatedTeam.misses, 2);

const nonEliminatingMiss = rules.calculateMissOutcome({ ...baseTeam, misses: 12 }, { eliminationOn: false, missLimit: 3 });
assert.equal(nonEliminatingMiss.eliminated, false);
assert.equal(nonEliminatingMiss.updatedTeam.misses, 13);

console.log('Rules tests passed');
