const assert = require('node:assert/strict');
const storage = require('../src/storage.js');
const transfer = require('../src/transfer.js');

function createMemoryStorage() {
  const data = new Map();
  return {
    get length() { return data.size; },
    key(index) { return Array.from(data.keys())[index] || null; },
    getItem(key) { return data.has(key) ? data.get(key) : null; },
    setItem(key, value) { data.set(key, String(value)); },
    removeItem(key) { data.delete(key); },
  };
}

const game = (id, date, winner, players) => ({
  id,
  date,
  winner,
  teams: [
    { name: winner, score: 50, winner: true, players },
    { name: 'Mamie', score: 31, winner: false },
  ],
});

// Appareil A : deux parties, une partie en cours, des réglages.
const a = createMemoryStorage();
storage.saveHistory([
  game(2, 2000, 'Les enfants', [{ name: 'Léo', score: 30 }, { name: 'Zoé', score: 20 }]),
  game(1, 1000, 'Papa'),
], a);
storage.saveCurrentGame({ teams: [{ name: 'X', score: 3 }, { name: 'Y', score: 0 }], currentTeamIdx: 0, targetScore: 50 }, a, () => 5);
storage.savePrefs({ pinLayout: 'field' }, a);
storage.saveLastSetup({ targetScore: 40, teams: [{ name: 'Les enfants', players: ['Léo'] }, { name: 'Papa' }] }, a);

const payload = transfer.buildExport(a, 'V1', 123);
const code = transfer.encodeExport(payload);
assert.ok(code.startsWith('MOLKKY1:'));

// Accents et caractères spéciaux survivent à l'aller-retour (code et fichier).
const decoded = transfer.decodeImport(`  ${code.slice(0, 40)}\n${code.slice(40)}  `);
assert.equal(decoded.data.history[0].teams[0].players[0].name, 'Léo');
assert.equal(transfer.decodeImport(transfer.exportFileContent(payload)).data.prefs.pinLayout, 'field');
assert.deepEqual(transfer.summarize(decoded), { games: 2, people: 4, hasCurrentGame: true, exportedAt: 123, appVersion: 'V1' });
assert.match(transfer.exportFileName(new Date(2026, 10, 7, 9, 5).getTime()), /^molkky-score-20261107-0905\.json$/);

// Contenus refusés, avec un message lisible.
assert.throws(() => transfer.decodeImport(''), /Rien à importer/);
assert.throws(() => transfer.decodeImport('bonjour'), /non reconnu/);
assert.throws(() => transfer.decodeImport('MOLKKY1:%%%'), /non reconnu/);
assert.throws(() => transfer.decodeImport('{"app":"belote","data":{}}'), /ne vient pas de Mölkky Score/);
assert.throws(() => transfer.decodeImport('{"app":"molkky-score","format":9,"data":{}}'), /plus récente/);

// Appareil B : une partie commune (id 1) et une partie à lui. Fusion.
const b = createMemoryStorage();
storage.saveHistory([game(3, 3000, 'Tonton'), game(1, 1000, 'Papa')], b);
storage.savePrefs({ helpOn: false }, b);
const merged = transfer.applyImport(decoded, 'merge', b);
assert.deepEqual(merged, { added: 1, total: 3 });
assert.deepEqual(storage.loadHistory(b).map(g => g.id), [3, 2, 1]);
assert.equal(storage.loadPrefs(b).helpOn, false, 'la fusion garde les réglages de l’appareil');
assert.equal(storage.loadCurrentGame(b), null, 'la fusion ne touche pas à la partie en cours');
assert.equal(storage.loadLastSetup(b).targetScore, 40, 'dernière configuration reprise si absente');
assert.deepEqual(transfer.applyImport(decoded, 'merge', b), { added: 0, total: 3 }, 'importer deux fois ne crée pas de doublon');

// Remplacement : copie conforme de l'appareil A.
const c = createMemoryStorage();
storage.saveHistory([game(9, 9000, 'Autre')], c);
transfer.applyImport(decoded, 'replace', c);
assert.deepEqual(storage.loadHistory(c).map(g => g.id), [2, 1]);
assert.equal(storage.loadPrefs(c).pinLayout, 'field');
assert.equal(storage.loadCurrentGame(c).teams[0].name, 'X');

console.log('Transfer tests passed');
