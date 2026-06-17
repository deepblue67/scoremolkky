(function (root, factory) {
  const storage = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = storage;
  }
  root.MolkkyStorage = storage;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const KEY_CURRENT = 'molky_current_game_v2';
  const KEY_HISTORY = 'molky_history_v2';
  const MAX_HISTORY = 50;

  function isObject(value) {
    return value !== null && typeof value === 'object' && !Array.isArray(value);
  }

  function parseJson(raw, fallback) {
    if (!raw) return fallback;
    try {
      return JSON.parse(raw);
    } catch {
      return fallback;
    }
  }

  function validTeam(team) {
    return isObject(team) && typeof team.name === 'string' && Number.isFinite(Number(team.score));
  }

  function validCurrentGame(game) {
    return isObject(game) &&
      Array.isArray(game.teams) &&
      game.teams.length >= 2 &&
      game.teams.every(validTeam) &&
      Number.isFinite(Number(game.currentTeamIdx)) &&
      Number.isFinite(Number(game.targetScore));
  }

  function validHistoryEntry(entry) {
    return isObject(entry) &&
      Array.isArray(entry.teams) &&
      entry.teams.length >= 2 &&
      entry.teams.every(validTeam) &&
      typeof entry.winner === 'string';
  }

  function loadCurrentGame(storage = localStorage) {
    try {
      const game = parseJson(storage.getItem(KEY_CURRENT), null);
      return validCurrentGame(game) ? game : null;
    } catch {
      return null;
    }
  }

  function saveCurrentGame(game, storage = localStorage, now = Date.now) {
    try {
      storage.setItem(KEY_CURRENT, JSON.stringify({
        ...game,
        savedAt: now(),
      }));
    } catch {}
  }

  function clearCurrentGame(storage = localStorage) {
    try {
      storage.removeItem(KEY_CURRENT);
    } catch {}
  }

  function loadHistory(storage = localStorage) {
    try {
      const history = parseJson(storage.getItem(KEY_HISTORY), []);
      return Array.isArray(history) ? history.filter(validHistoryEntry).slice(0, MAX_HISTORY) : [];
    } catch {
      return [];
    }
  }

  function saveHistory(history, storage = localStorage) {
    try {
      const safeHistory = Array.isArray(history) ? history.filter(validHistoryEntry).slice(0, MAX_HISTORY) : [];
      storage.setItem(KEY_HISTORY, JSON.stringify(safeHistory));
    } catch {}
  }

  function addGameToHistory(game, storage = localStorage) {
    const history = loadHistory(storage);
    saveHistory([game, ...history], storage);
  }

  function clearAll(storage = localStorage) {
    clearCurrentGame(storage);
    try {
      storage.removeItem(KEY_HISTORY);
    } catch {}
  }

  function estimateStorageSize(storage = localStorage) {
    try {
      let bytes = 0;
      for (let i = 0; i < storage.length; i += 1) {
        const key = storage.key(i);
        const value = storage.getItem(key) || '';
        bytes += (key.length + value.length) * 2;
      }
      return bytes;
    } catch {
      return null;
    }
  }

  function formatStorageSize(bytes) {
    if (!Number.isFinite(bytes)) return '—';
    return bytes > 1024 ? `${(bytes / 1024).toFixed(1)} Ko` : `${bytes} o`;
  }

  return {
    KEY_CURRENT,
    KEY_HISTORY,
    loadCurrentGame,
    saveCurrentGame,
    clearCurrentGame,
    loadHistory,
    saveHistory,
    addGameToHistory,
    clearAll,
    estimateStorageSize,
    formatStorageSize,
  };
});
