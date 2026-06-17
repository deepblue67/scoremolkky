const assert = require('node:assert/strict');
const gameState = require('../src/game-state.js');

assert.deepEqual(gameState.normalizeGameRules(), {
  eliminationOn: true,
  missLimit: 3,
  overflowGrace: 0,
  overflowMode: '25',
});

assert.deepEqual(gameState.normalizeGameRules({
  eliminationOn: false,
  missLimit: 4,
  overflowGrace: 2,
  overflowMode: 'none',
}), {
  eliminationOn: false,
  missLimit: 4,
  overflowGrace: 2,
  overflowMode: 'none',
});

const initial = gameState.createInitialGameState({
  teams: [
    { name: 'Alpha', color: '#111', handicap: 10 },
    { name: 'Beta', color: '#222' },
  ],
  targetScore: 50,
  rules: { missLimit: 4, overflowMode: 'half' },
  startedAt: 12345,
});

assert.equal(initial.startedAt, 12345);
assert.equal(initial.currentTeamIdx, 0);
assert.equal(initial.round, 1);
assert.deepEqual(initial.selectedPins, []);
assert.deepEqual(initial.throws, []);
assert.deepEqual(initial.rules, {
  eliminationOn: true,
  missLimit: 4,
  overflowGrace: 0,
  overflowMode: 'half',
});
assert.equal(initial.teams[0].score, 10);
assert.equal(initial.teams[0].misses, 0);
assert.equal(initial.teams[0].totalThrows, 0);
assert.equal(initial.teams[0].eliminated, false);
assert.deepEqual(initial.teams[0].history, []);
assert.equal(initial.teams[1].score, 0);

const reset = gameState.resetTeamsForNewGame([
  {
    name: 'Alpha',
    color: '#111',
    handicap: 10,
    score: 42,
    misses: 2,
    overflowStrikes: 1,
    totalThrows: 9,
    totalScore: 42,
    maxThrow: 12,
    overflows: 3,
    eliminated: true,
    history: [{ points: 12 }],
  },
]);

assert.equal(reset[0].handicap, 10);
assert.equal(reset[0].score, 0);
assert.equal(reset[0].misses, 0);
assert.equal(reset[0].overflowStrikes, 0);
assert.equal(reset[0].totalThrows, 0);
assert.equal(reset[0].totalScore, 0);
assert.equal(reset[0].maxThrow, 0);
assert.equal(reset[0].overflows, 0);
assert.equal(reset[0].eliminated, false);
assert.deepEqual(reset[0].history, []);

const teams = [{ name: 'Alpha' }, { name: 'Beta' }];
const throws = [
  { teamIdx: 0, points: 3 },
  { teamIdx: 1, points: 9 },
  { teamIdx: 0, points: 0, miss: true },
  { teamIdx: 1, points: 12 },
];

assert.deepEqual(gameState.getRecentThrowHistory(throws, teams, 3), [
  { key: 0, label: '+12', type: 'bonus', team: teams[1] },
  { key: 1, label: '\u2717', type: 'miss', team: teams[0] },
  { key: 2, label: '+9', type: 'bonus', team: teams[1] },
]);

const throwState = gameState.createInitialGameState({
  teams: [
    { name: 'Alpha', color: '#111' },
    { name: 'Beta', color: '#222' },
  ],
  targetScore: 50,
  rules: { eliminationOn: true, missLimit: 3, overflowMode: '25' },
  startedAt: 1000,
});
throwState.selectedPins = [5, 7];

const throwTransition = gameState.applyThrowTransition(throwState, 50);
assert.equal(throwTransition.score, 2);
assert.equal(throwTransition.newScore, 2);
assert.equal(throwTransition.nextState.currentTeamIdx, 1);
assert.equal(throwTransition.nextState.round, 1);
assert.deepEqual(throwTransition.nextState.selectedPins, []);
assert.equal(throwTransition.nextState.throws.length, 1);
assert.equal(throwTransition.nextState.throws[0].teamIdx, 0);
assert.deepEqual(throwTransition.nextState.throws[0].pins, [5, 7]);
assert.equal(throwTransition.nextState.throws[0].roundBefore, 1);
assert.equal(throwTransition.nextState.throws[0].teamBefore.score, 0);
assert.equal(throwTransition.nextState.teams[0].score, 2);
assert.deepEqual(gameState.getThrowReaction(throwTransition, 50), {
  type: 'toast',
  message: '+2 \u2192 2 pts',
});

const winnerState = gameState.createInitialGameState({
  teams: [
    { name: 'Alpha', color: '#111', handicap: 48 },
    { name: 'Beta', color: '#222' },
  ],
  targetScore: 50,
  rules: { overflowMode: '25' },
  startedAt: 1500,
});
winnerState.selectedPins = [5, 7];

const winnerTransition = gameState.applyThrowTransition(winnerState, 50);
assert.equal(gameState.getThrowReaction(winnerTransition, 50).type, 'winner');
assert.equal(gameState.getThrowReaction(winnerTransition, 50).team.name, 'Alpha');

const missState = gameState.createInitialGameState({
  teams: [
    { name: 'Alpha', color: '#111' },
    { name: 'Beta', color: '#222' },
  ],
  targetScore: 50,
  rules: { eliminationOn: true, missLimit: 1 },
  startedAt: 2000,
});

const missTransition = gameState.applyMissTransition(missState);
assert.equal(missTransition.eliminated, true);
assert.equal(missTransition.activeTeams.length, 1);
assert.equal(missTransition.activeTeams[0].name, 'Beta');
assert.equal(missTransition.nextState.currentTeamIdx, 1);
assert.equal(missTransition.nextState.round, 1);
assert.equal(missTransition.nextState.throws[0].miss, true);
assert.equal(missTransition.nextState.teams[0].eliminated, true);
const missReaction = gameState.getMissReaction(missTransition);
assert.equal(missReaction.type, 'eliminated');
assert.equal(missReaction.popup.type, 'eliminated');
assert.equal(missReaction.winnerTeam.name, 'Beta');

const emptyUndo = gameState.applyUndoTransition(missState);
assert.equal(emptyUndo.canUndo, false);
assert.equal(emptyUndo.nextState, missState);

const undoTransition = gameState.applyUndoTransition(throwTransition.nextState);
assert.equal(undoTransition.canUndo, true);
assert.equal(undoTransition.last.teamIdx, 0);
assert.equal(undoTransition.nextState.currentTeamIdx, 0);
assert.equal(undoTransition.nextState.round, 1);
assert.deepEqual(undoTransition.nextState.selectedPins, []);
assert.equal(undoTransition.nextState.throws.length, 0);
assert.equal(undoTransition.nextState.teams[0].score, 0);
assert.equal(undoTransition.nextState.teams[0].totalThrows, 0);
assert.deepEqual(undoTransition.nextState.teams[0].history, []);

console.log('Game state tests passed');
