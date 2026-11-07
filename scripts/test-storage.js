const assert = require('node:assert/strict');
const storage = require('../src/storage.js');

function createMemoryStorage() {
  const data = new Map();
  return {
    get length() {
      return data.size;
    },
    key(index) {
      return Array.from(data.keys())[index] || null;
    },
    getItem(key) {
      return data.has(key) ? data.get(key) : null;
    },
    setItem(key, value) {
      data.set(key, String(value));
    },
    removeItem(key) {
      data.delete(key);
    },
  };
}

const local = createMemoryStorage();

assert.equal(storage.loadCurrentGame(local), null);
local.setItem(storage.KEY_CURRENT, '{broken');
assert.equal(storage.loadCurrentGame(local), null);

storage.saveCurrentGame({
  gameLabel: 'Finale du vendredi',
  teams: [{ name: 'Alpha', score: 0 }, { name: 'Beta', score: 12 }],
  currentTeamIdx: 1,
  targetScore: 50,
}, local, () => 1234);

assert.deepEqual(storage.loadCurrentGame(local), {
  gameLabel: 'Finale du vendredi',
  teams: [{ name: 'Alpha', score: 0 }, { name: 'Beta', score: 12 }],
  currentTeamIdx: 1,
  targetScore: 50,
  savedAt: 1234,
});

storage.clearCurrentGame(local);
assert.equal(storage.loadCurrentGame(local), null);

storage.saveHistory([
  { winner: 'Alpha', teams: [{ name: 'Alpha', score: 50 }, { name: 'Beta', score: 24 }] },
  { winner: 42, teams: [] },
], local);

assert.equal(storage.loadHistory(local).length, 1);

storage.addGameToHistory({
  label: 'Demi-finale',
  winner: 'Beta',
  teams: [{ name: 'Alpha', score: 30 }, { name: 'Beta', score: 50 }],
}, local);

assert.deepEqual(storage.loadHistory(local).map(game => game.winner), ['Beta', 'Alpha']);
assert.equal(storage.loadHistory(local)[0].label, 'Demi-finale');
assert.match(storage.formatStorageSize(storage.estimateStorageSize(local)), /o|Ko/);

local.setItem(storage.KEY_CURRENT, JSON.stringify({
  teams: [{ name: 'Solo', score: 12 }],
  currentTeamIdx: 0,
  targetScore: 50,
}));
assert.equal(storage.loadCurrentGame(local), null);

local.setItem(storage.KEY_CURRENT, JSON.stringify({
  teams: [{ name: 'Alpha', score: 12 }, { name: 'Beta', score: 'not-a-number' }],
  currentTeamIdx: 0,
  targetScore: 50,
}));
assert.equal(storage.loadCurrentGame(local), null);

local.setItem(storage.KEY_HISTORY, JSON.stringify({ not: 'an array' }));
assert.deepEqual(storage.loadHistory(local), []);

const manyGames = Array.from({ length: 210 }, (_, index) => ({
  winner: `Winner ${index}`,
  teams: [{ name: 'Alpha', score: 50 }, { name: 'Beta', score: index }],
}));
storage.saveHistory(manyGames, local);
assert.equal(storage.loadHistory(local).length, 200);
assert.equal(storage.loadHistory(local)[0].winner, 'Winner 0');
assert.equal(storage.loadHistory(local)[199].winner, 'Winner 199');

storage.addGameToHistory({
  winner: 'Fresh',
  teams: [{ name: 'Fresh', score: 50 }, { name: 'Old', score: 1 }],
}, local);
assert.equal(storage.loadHistory(local).length, 200);
assert.equal(storage.loadHistory(local)[0].winner, 'Fresh');

storage.clearAll(local);
assert.equal(storage.loadCurrentGame(local), null);
assert.deepEqual(storage.loadHistory(local), []);

// Préférences : valeurs par défaut, puis fusion.
assert.deepEqual(storage.loadPrefs(local), { helpOn: true, wakeLock: true, pinLayout: 'numeric' });
storage.savePrefs({ pinLayout: 'field' }, local);
assert.deepEqual(storage.loadPrefs(local), { helpOn: true, wakeLock: true, pinLayout: 'field' });
local.setItem(storage.KEY_PREFS, '{oops');
assert.equal(storage.loadPrefs(local).helpOn, true);

// Derniers réglages : validés au chargement.
assert.equal(storage.loadLastSetup(local), null);
storage.saveLastSetup({ targetScore: 40, teams: [{ name: 'A', players: ['Léo'] }, { name: 'B' }] }, local);
assert.equal(storage.loadLastSetup(local).targetScore, 40);
storage.saveLastSetup({ teams: [{ name: 'Seule' }] }, local);
assert.equal(storage.loadLastSetup(local), null);

// Noms connus : équipes et joueurs, sans doublon ni nom par défaut.
assert.deepEqual(storage.collectKnownNames([
  { teams: [{ name: 'Les enfants', players: [{ name: 'Léo' }, { name: 'Emma' }] }, { name: 'Équipe 2' }] },
  { teams: [{ name: 'les enfants' }, { name: 'Papa' }] },
], { teams: [{ name: 'Mamie', players: ['emma', 'Zoé'] }] }), ['Emma', 'Léo', 'Les enfants', 'Mamie', 'Papa', 'Zoé']);

console.log('Storage tests passed');
