(function (root, factory) {
  const storage = root.MolkkyStorage || (typeof require === 'function' ? require('./storage.js') : null);
  const transfer = factory(storage);
  if (typeof module === 'object' && module.exports) {
    module.exports = transfer;
  }
  root.MolkkyTransfer = transfer;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (storage) {
  // Sauvegarde / transfert entre appareils.
  // Code texte : « MOLKKY1: » + JSON encodé en base64 (UTF-8).
  // Fichier : le même JSON, lisible.
  const APP_ID = 'molkky-score';
  const FORMAT_VERSION = 1;
  const CODE_PREFIX = 'MOLKKY1:';

  function utf8ToBase64(text) {
    const bytes = new TextEncoder().encode(text);
    let binary = '';
    const chunk = 0x8000;
    for (let i = 0; i < bytes.length; i += chunk) {
      binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
    }
    return btoa(binary);
  }

  function base64ToUtf8(b64) {
    const binary = atob(b64);
    const bytes = new Uint8Array(binary.length);
    for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
    return new TextDecoder().decode(bytes);
  }

  function buildExport(local, appVersion = '', now = Date.now()) {
    return {
      app: APP_ID,
      format: FORMAT_VERSION,
      appVersion,
      exportedAt: now,
      data: {
        history: storage.loadHistory(local),
        currentGame: storage.loadCurrentGame(local),
        prefs: storage.loadPrefs(local),
        lastSetup: storage.loadLastSetup(local),
      },
    };
  }

  function encodeExport(payload) {
    return CODE_PREFIX + utf8ToBase64(JSON.stringify(payload));
  }

  function exportFileContent(payload) {
    return JSON.stringify(payload, null, 2);
  }

  function exportFileName(now = Date.now()) {
    const d = new Date(now);
    const pad = value => String(value).padStart(2, '0');
    return `molkky-score-${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}.json`;
  }

  // Accepte le code texte ou le contenu du fichier JSON.
  // Lève une erreur au message lisible si le contenu n'est pas reconnu.
  function decodeImport(raw) {
    const text = String(raw || '').trim();
    if (!text) {
      const error = new Error('Rien à importer : colle un code ou choisis un fichier.');
      error.userMessage = true;
      throw error;
    }
    let json;
    try {
      if (text.startsWith(CODE_PREFIX)) {
        json = base64ToUtf8(text.slice(CODE_PREFIX.length).replace(/\s+/g, ''));
      } else if (text.startsWith('{')) {
        json = text;
      } else {
        throw new Error('format');
      }
      const payload = JSON.parse(json);
      return validatePayload(payload);
    } catch (err) {
      if (err && err.userMessage) throw err;
      const error = new Error('Code ou fichier non reconnu. Vérifie qu’il vient bien de Mölkky Score et qu’il est complet.');
      error.userMessage = true;
      throw error;
    }
  }

  function validatePayload(payload) {
    if (!payload || payload.app !== APP_ID || !payload.data || typeof payload.data !== 'object') {
      const error = new Error('Ce code ne vient pas de Mölkky Score.');
      error.userMessage = true;
      throw error;
    }
    if (payload.format > FORMAT_VERSION) {
      const error = new Error('Ce code vient d’une version plus récente de l’application : mets-la à jour avant d’importer.');
      error.userMessage = true;
      throw error;
    }
    const data = payload.data;
    return {
      ...payload,
      data: {
        history: Array.isArray(data.history) ? data.history : [],
        currentGame: data.currentGame || null,
        prefs: data.prefs && typeof data.prefs === 'object' ? data.prefs : null,
        lastSetup: data.lastSetup || null,
      },
    };
  }

  function countPeople(history) {
    const names = new Set();
    (history || []).forEach(game => (game.teams || []).forEach(team => {
      const players = Array.isArray(team.players) ? team.players.filter(p => p && p.name) : [];
      if (players.length) players.forEach(p => names.add(String(p.name).trim().toLocaleLowerCase('fr-FR')));
      else if (team.name) names.add(String(team.name).trim().toLocaleLowerCase('fr-FR'));
    }));
    return names.size;
  }

  function summarize(payload) {
    const history = payload.data.history || [];
    return {
      games: history.length,
      people: countPeople(history),
      hasCurrentGame: Boolean(payload.data.currentGame),
      exportedAt: payload.exportedAt || null,
      appVersion: payload.appVersion || '',
    };
  }

  function gameKey(game) {
    return game.id !== undefined ? `id:${game.id}` : `k:${game.date}-${game.winner}`;
  }

  // mode 'merge'   : ajoute les parties absentes, garde tout le reste de cet appareil ;
  // mode 'replace' : remplace historique, partie en cours, réglages et dernière configuration.
  function applyImport(payload, mode, local) {
    const incoming = payload.data;
    if (mode === 'replace') {
      storage.saveHistory(incoming.history, local);
      if (incoming.currentGame) storage.saveCurrentGame(incoming.currentGame, local, () => incoming.currentGame.savedAt || Date.now());
      else storage.clearCurrentGame(local);
      if (incoming.prefs) storage.savePrefs(incoming.prefs, local);
      if (incoming.lastSetup) storage.saveLastSetup(incoming.lastSetup, local);
      else storage.clearLastSetup(local);
      return { added: incoming.history.length, total: storage.loadHistory(local).length };
    }
    const current = storage.loadHistory(local);
    const known = new Set(current.map(gameKey));
    const additions = incoming.history.filter(game => !known.has(gameKey(game)));
    const merged = current.concat(additions).sort((a, b) => (b.date || 0) - (a.date || 0));
    storage.saveHistory(merged, local);
    if (!storage.loadLastSetup(local) && incoming.lastSetup) storage.saveLastSetup(incoming.lastSetup, local);
    return { added: additions.length, total: storage.loadHistory(local).length };
  }

  return {
    CODE_PREFIX,
    buildExport,
    encodeExport,
    exportFileContent,
    exportFileName,
    decodeImport,
    summarize,
    applyImport,
  };
});
