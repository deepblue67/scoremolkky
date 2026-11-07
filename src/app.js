// Source of truth for the Molkky React app.
// Edit this file, then run: node scripts/build.js [VERSION]


function _extends() { _extends = Object.assign ? Object.assign.bind() : function (target) { for (var i = 1; i < arguments.length; i++) { var source = arguments[i]; for (var key in source) { if (Object.prototype.hasOwnProperty.call(source, key)) { target[key] = source[key]; } } } return target; }; return _extends.apply(this, arguments); }
const {
  useState,
  useEffect,
  useRef,
  useMemo
} = React;
const {
  formatDate,
  formatDuration
} = MolkkyFormatters;
const {
  calculateThrowScore,
  previewScoreAfterThrow
} = MolkkyRules;
const {
  loadCurrentGame,
  saveCurrentGame,
  clearCurrentGame,
  loadHistory,
  saveHistory,
  addGameToHistory,
  clearAll: clearStoredData,
  estimateStorageSize,
  formatStorageSize
} = MolkkyStorage;
const APP_VERSION = 'V20261107_1225';
const {
  FieldDiagram,
  Icon
} = MolkkyComponents;
const h = React.createElement;
const {
  GameScoreboard,
  GameTurnPanel
} = MolkkyGameComponents;
const {
  normalizeGameRules,
  createInitialGameState,
  applyThrowTransition,
  applyMissTransition,
  applyUndoTransition,
  getThrowReaction,
  getMissReaction
} = MolkkyGameState;
const {
  EventPopup,
  AbandonModal
} = MolkkyDialogs;
const {
  SetupScreen
} = MolkkySetupScreens;
// Gagnant identifié par drapeau (nouvelles parties) ou par nom (anciennes parties).
function isTeamWinner(game, team) {
  return typeof team.winner === 'boolean' ? team.winner : team.name === game.winner;
}
function GameScreen({
  teams: initialTeams,
  targetScore,
  rules,
  gameLabel = '',
  onEnd,
  onPause,
  resumeState
}) {
  const initialRules = normalizeGameRules(rules);
  const initState = (forceFresh = false) => !forceFresh && resumeState || createInitialGameState({
    teams: initialTeams,
    targetScore,
    rules: initialRules,
    gameLabel
  });
  const [state, setState] = useState(initState);
  const stateRef = useRef(state);
  const [winner, setWinner] = useState(null);
  const [toast, setToast] = useState({
    msg: '',
    show: false
  });
  const [eventPopup, setEventPopup] = useState(null);
  const [abandonOpen, setAbandonOpen] = useState(false);
  const toastTimer = useRef(null);
  const pendingTimers = useRef([]);
  useEffect(() => {
    // Une partie terminée n'est plus sauvegardée : elle part dans l'historique.
    if (!winner && !state.finished) saveCurrentGame(state);
  }, [state, winner]);
  useEffect(() => () => {
    clearPendingTimers();
    clearTimeout(toastTimer.current);
  }, []);

  // Source de vérité synchrone : chaque action lit l'état le plus récent,
  // même si deux appuis arrivent avant le rendu suivant.
  function commit(nextState) {
    stateRef.current = nextState;
    setState(nextState);
  }
  function schedule(fn, delay) {
    const id = setTimeout(() => {
      pendingTimers.current = pendingTimers.current.filter(timerId => timerId !== id);
      fn();
    }, delay);
    pendingTimers.current.push(id);
    return id;
  }
  function clearPendingTimers() {
    pendingTimers.current.forEach(clearTimeout);
    pendingTimers.current = [];
  }
  function showToast(msg) {
    clearTimeout(toastTimer.current);
    setToast({
      msg,
      show: true
    });
    toastTimer.current = setTimeout(() => setToast(t => ({
      ...t,
      show: false
    })), 2000);
  }
  function declareWinner(team, teams, startedAt, label, delay) {
    schedule(() => {
      clearCurrentGame();
      setEventPopup(null);
      setWinner({
        team,
        teams,
        duration: Date.now() - (startedAt || Date.now()),
        gameLabel: label || gameLabel
      });
    }, delay);
  }
  function togglePin(pin) {
    const s = stateRef.current;
    if (s.finished) return;
    const has = s.selectedPins.includes(pin);
    // Le message du lancer précédent ne doit pas masquer l'aperçu du nouveau.
    clearTimeout(toastTimer.current);
    setToast(t => t.show ? {
      ...t,
      show: false
    } : t);
    commit({
      ...s,
      selectedPins: has ? s.selectedPins.filter(p => p !== pin) : [...s.selectedPins, pin]
    });
  }
  function confirmThrow() {
    const s = stateRef.current;
    const result = applyThrowTransition(s, targetScore, initialRules);
    if (!result.canPlay) return;
    commit(result.nextState);
    const reaction = getThrowReaction(result, targetScore);
    if (reaction.type === 'winner') {
      declareWinner(reaction.team, result.newTeams, s.startedAt, s.gameLabel, 300);
    } else if (reaction.type === 'popup') {
      schedule(() => setEventPopup(reaction.popup), reaction.delay || 50);
    } else if (reaction.type === 'toast') {
      showToast(reaction.message);
    }
  }
  function confirmMiss() {
    const s = stateRef.current;
    const result = applyMissTransition(s, initialRules);
    if (!result.canPlay) return;
    commit(result.nextState);
    const reaction = getMissReaction(result);
    if (reaction.type === 'eliminated') {
      schedule(() => setEventPopup(reaction.popup), reaction.popupDelay || 50);
      if (reaction.winnerTeam) {
        declareWinner(reaction.winnerTeam, result.newTeams, s.startedAt, s.gameLabel, reaction.winnerDelay || 2200);
      }
    } else if (reaction.type === 'toast') {
      showToast(reaction.message);
    }
  }
  function undoLast() {
    const result = applyUndoTransition(stateRef.current);
    if (!result.canUndo) return;
    clearPendingTimers();
    setEventPopup(null);
    commit(result.nextState);
    showToast('Lancer annulé');
  }
  function restartFresh() {
    clearPendingTimers();
    clearCurrentGame();
    setEventPopup(null);
    setAbandonOpen(false);
    setWinner(null);
    commit(initState(true));
  }
  const {
    teams,
    currentTeamIdx,
    selectedPins,
    throws,
    round
  } = state;
  const currentTeam = teams[currentTeamIdx];
  const throwScore = calculateThrowScore(selectedPins);
  if (winner) return React.createElement(WinScreen, {
    winner: winner,
    targetScore: targetScore,
    onNewGame: onEnd,
    onRematch: restartFresh
  });
  const activeRules = state.rules || initialRules;
  const scorePreview = previewScoreAfterThrow(currentTeam.score, throwScore, targetScore, activeRules, currentTeam.overflowStrikes || 0);
  return React.createElement("div", {
    className: "screen game-layout"
  }, eventPopup && React.createElement(EventPopup, {
    popup: eventPopup,
    onClose: () => setEventPopup(null)
  }), abandonOpen && React.createElement(AbandonModal, {
    teams: state.teams,
    onClose: () => setAbandonOpen(false),
    onSameTeams: restartFresh,
    onPause: () => {
      clearPendingTimers();
      saveCurrentGame(stateRef.current);
      onPause();
    },
    onAbandon: () => {
      if (!window.confirm('Abandonner et effacer cette partie ?')) return;
      clearPendingTimers();
      clearCurrentGame();
      onEnd();
    }
  }), React.createElement(GameScoreboard, {
    teams: state.teams,
    currentTeamIdx: currentTeamIdx,
    targetScore: targetScore,
    rules: state.rules
  }), React.createElement(GameTurnPanel, {
    currentTeam: currentTeam,
    round: round,
    selectedPins: selectedPins,
    throwScore: throwScore,
    willOverflow: scorePreview.overflow,
    overflowLabel: scorePreview.label,
    displayAfter: scorePreview.displayScore,
    targetScore: targetScore,
    throwHistory: state.throws,
    teams: state.teams,
    canUndo: throws.length > 0,
    locked: Boolean(state.finished),
    toast: toast,
    onTogglePin: togglePin,
    onConfirmMiss: confirmMiss,
    onUndoLast: undoLast,
    onConfirmThrow: confirmThrow,
    onAbandon: () => setAbandonOpen(true)
  }));
}
function Topbar({
  title,
  onBack,
  backLabel = 'Retour',
  right = null
}) {
  return h("div", {
    className: "topbar"
  }, onBack ? h("button", {
    type: "button",
    className: "icon-btn",
    "aria-label": backLabel,
    onClick: onBack
  }, h(Icon, {
    name: "back",
    size: 24
  })) : h("span", null), h("div", {
    className: "topbar-title"
  }, title), right || h("span", null));
}

// Classement : gagnant d'abord, puis par score, les éliminées en dernier.
function rankTeams(teams, isWinner) {
  return teams.map((team, index) => ({
    team,
    index
  })).sort((a, b) => {
    const wa = isWinner(a.team) ? 1 : 0;
    const wb = isWinner(b.team) ? 1 : 0;
    if (wa !== wb) return wb - wa;
    const ea = a.team.eliminated ? 1 : 0;
    const eb = b.team.eliminated ? 1 : 0;
    if (ea !== eb) return ea - eb;
    return (b.team.score || 0) - (a.team.score || 0);
  }).map(entry => entry.team);
}

function StatGrid({
  items
}) {
  return h("div", {
    className: "stat-grid"
  }, items.map(item => h("div", {
    key: item.label,
    className: "stat"
  }, h("div", {
    className: "stat-value num"
  }, item.value), h("div", {
    className: "stat-label"
  }, item.label))));
}

function WinScreen({
  winner,
  targetScore,
  onNewGame,
  onRematch
}) {
  const {
    team,
    teams,
    duration,
    gameLabel
  } = winner;
  const misses = team.history ? team.history.filter(entry => entry.miss).length : 0;
  // Même calcul que l'historique : points marqués / nombre total de lancers.
  const avgScore = team.totalThrows > 0 ? (team.totalScore / team.totalThrows).toFixed(1).replace('.', ',') : '0';
  const wonByElimination = team.score !== targetScore;
  useEffect(() => {
    addGameToHistory({
      id: Date.now(),
      date: Date.now(),
      label: gameLabel || '',
      duration,
      targetScore,
      winner: team.name,
      winnerColor: team.color,
      winnerIdx: teams.findIndex(t => t === team || t.name === team.name),
      teams: teams.map(t => ({
        winner: t.name === team.name,
        eliminated: Boolean(t.eliminated),
        name: t.name,
        color: t.color,
        score: t.score,
        totalThrows: t.totalThrows || 0,
        totalScore: t.totalScore || 0,
        maxThrow: t.maxThrow || 0,
        overflows: t.overflows || 0,
        misses: t.history ? t.history.filter(entry => entry.miss).length : 0
      }))
    });
  }, []);
  const ranked = rankTeams(teams, t => t.name === team.name);
  const stats = [{
    label: 'Lancers',
    value: team.totalThrows || 0
  }, {
    label: 'Moyenne',
    value: avgScore
  }, {
    label: 'Meilleur lancer',
    value: team.maxThrow || 0
  }, {
    label: 'Ratés',
    value: misses
  }, {
    label: 'Dépassements',
    value: team.overflows || 0
  }, {
    label: 'Durée',
    value: duration ? formatDuration(duration) : '—'
  }];
  return h("div", {
    className: "screen"
  }, h("div", {
    className: "scroll"
  }, h("div", {
    className: "win"
  }, h("div", null, h("div", {
    className: "win-kicker"
  }, h(Icon, {
    name: "trophy",
    size: 22
  }), "Victoire !"), h("div", {
    className: "win-team",
    style: {
      '--team': team.color
    }
  }, team.name), h("div", {
    className: "win-sub"
  }, gameLabel ? `${gameLabel}, ` : '', wonByElimination ? 'par élimination des autres équipes' : `pile ${targetScore} points`)), h("ol", {
    className: "ranking",
    "aria-label": "Classement"
  }, ranked.map((t, i) => h("li", {
    key: `${t.name}-${i}`
  }, h("span", {
    className: "rank num"
  }, i + 1), h("span", {
    className: "name"
  }, h("span", {
    className: "dot",
    style: {
      '--team': t.color
    }
  }), h("span", null, t.name)), t.eliminated ? h("span", {
    className: "out"
  }, "\xE9limin\xE9e") : h("span", {
    className: "score num"
  }, t.score)))), h(StatGrid, {
    items: stats
  }), h("div", {
    className: "win-actions"
  }, h("button", {
    type: "button",
    className: "btn btn-secondary",
    onClick: onRematch
  }, h(Icon, {
    name: "refresh"
  }), "Revanche"), h("button", {
    type: "button",
    className: "btn btn-primary",
    onClick: onNewGame
  }, h(Icon, {
    name: "home"
  }), "Accueil")))));
}

function PlayerStatsScreen({
  player,
  history,
  onBack
}) {
  const games = history.filter(g => (g.teams || []).some(t => t.name === player.name));
  const records = games.map(g => ({
    game: g,
    team: (g.teams || []).find(t => t.name === player.name)
  })).filter(r => r.team);
  const wins = records.filter(r => isTeamWinner(r.game, r.team)).length;
  const totalThrows = records.reduce((a, r) => a + (r.team.totalThrows || 0), 0);
  const totalScore = records.reduce((a, r) => a + (r.team.totalScore || 0), 0);
  const maxThrow = Math.max(...records.map(r => r.team.maxThrow || 0), 0);
  const totalMisses = records.reduce((a, r) => a + (r.team.misses || 0), 0);
  const totalOverflows = records.reduce((a, r) => a + (r.team.overflows || 0), 0);
  const avgScore = totalThrows > 0 ? (totalScore / totalThrows).toFixed(1).replace('.', ',') : '—';
  const winStreak = (() => {
    let current = 0;
    let best = 0;
    records.forEach(r => {
      if (isTeamWinner(r.game, r.team)) {
        current += 1;
        best = Math.max(best, current);
      } else current = 0;
    });
    return best;
  })();
  const winPct = games.length ? Math.round(wins / games.length * 100) : 0;
  return h("div", {
    className: "screen"
  }, h(Topbar, {
    title: player.name,
    onBack
  }), h("div", {
    className: "scroll"
  }, h("section", {
    className: "section",
    style: {
      '--team': player.color
    }
  }, h("div", {
    className: "big-rate num"
  }, winPct, " %"), h("div", {
    className: "detail-sub"
  }, "de victoires, ", wins, " sur ", games.length, " partie", games.length > 1 ? 's' : ''), h("div", {
    className: "bar"
  }, h("span", {
    style: {
      width: `${winPct}%`
    }
  }))), h("section", {
    className: "section"
  }, h(StatGrid, {
    items: [{
      label: 'Lancers',
      value: totalThrows
    }, {
      label: 'Moyenne',
      value: avgScore
    }, {
      label: 'Record',
      value: maxThrow || '—'
    }, {
      label: 'Ratés',
      value: totalMisses
    }, {
      label: 'Dépassements',
      value: totalOverflows
    }, {
      label: 'Série de victoires',
      value: winStreak
    }]
  })), h("section", {
    className: "section"
  }, h("h2", {
    className: "section-title"
  }, "Parties"), records.map(({
    game,
    team
  }, i) => h("div", {
    key: i,
    className: "row"
  }, h("div", null, h("div", {
    className: "row-label"
  }, isTeamWinner(game, team) ? 'Victoire' : 'Défaite', game.label ? ` · ${game.label}` : ''), h("div", {
    className: "row-sub"
  }, formatDate(game.date), " \xB7 ", team.totalThrows || 0, " lancers")), h("div", {
    className: "num",
    style: {
      fontSize: '26px',
      fontWeight: 600
    }
  }, team.score))))));
}

function GameDetailScreen({
  game,
  onBack
}) {
  const ranked = rankTeams(game.teams || [], t => isTeamWinner(game, t));
  return h("div", {
    className: "screen"
  }, h(Topbar, {
    title: "D\xE9tail de la partie",
    onBack
  }), h("div", {
    className: "scroll"
  }, h("div", {
    className: "detail-head"
  }, h("div", {
    className: "detail-title"
  }, game.label || 'Partie sans nom'), h("div", {
    className: "detail-sub"
  }, formatDate(game.date), game.duration ? ` · ${formatDuration(game.duration)}` : '', game.targetScore ? ` · cible ${game.targetScore}` : '')), ranked.map((t, i) => {
    const isWinner = isTeamWinner(game, t);
    return h("div", {
      key: i,
      className: `detail-team ${isWinner ? 'is-winner' : ''}`,
      style: {
        '--team': t.color
      }
    }, h("div", {
      className: "detail-team-head"
    }, h("span", {
      className: "name"
    }, h("span", {
      className: "dot"
    }), t.name, isWinner && h(Icon, {
      name: "trophy",
      size: 18
    })), h("span", {
      className: "num"
    }, t.score)), h(StatGrid, {
      items: [{
        label: 'Lancers',
        value: t.totalThrows || '—'
      }, {
        label: 'Moyenne',
        value: t.totalThrows > 0 ? (t.totalScore / t.totalThrows).toFixed(1).replace('.', ',') : '—'
      }, {
        label: 'Record',
        value: t.maxThrow || '—'
      }, {
        label: 'Ratés',
        value: t.misses !== undefined ? t.misses : '—'
      }, {
        label: 'Dépassements',
        value: t.overflows !== undefined ? t.overflows : '—'
      }, {
        label: 'Résultat',
        value: isWinner ? '1er' : t.eliminated ? 'éliminée' : `${i + 1}e`
      }]
    }));
  })));
}

function HistoryScreen({
  onBack
}) {
  const [history, setHistory] = useState(loadHistory);
  const [selected, setSelected] = useState(null);
  const [tab, setTab] = useState('parties');
  const [statPlayer, setStatPlayer] = useState(null);
  function deleteGame(id, e) {
    e.stopPropagation();
    if (!window.confirm('Supprimer cette partie de l’historique ?')) return;
    const next = history.filter(g => g.id !== id);
    saveHistory(next);
    setHistory(next);
  }
  function clearAll() {
    if (window.confirm("Effacer tout l'historique ?")) {
      saveHistory([]);
      setHistory([]);
      setSelected(null);
    }
  }
  function openGameWithKeyboard(game, event) {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      setSelected(game);
    }
  }
  const globalStats = useMemo(() => {
    if (!history.length) return null;
    const wins = {};
    history.forEach(g => {
      wins[g.winner] = (wins[g.winner] || 0) + 1;
    });
    const topWinner = Object.entries(wins).sort((a, b) => b[1] - a[1])[0];
    const durations = history.filter(g => g.duration);
    const avgDuration = durations.length ? durations.reduce((a, g) => a + g.duration, 0) / durations.length : 0;
    const longestGame = durations.length ? Math.max(...durations.map(g => g.duration)) : 0;
    const ps = {};
    history.forEach(g => {
      (g.teams || []).forEach(t => {
        if (!ps[t.name]) ps[t.name] = {
          name: t.name,
          color: t.color,
          games: 0,
          wins: 0,
          totalThrows: 0,
          totalScore: 0
        };
        const p = ps[t.name];
        p.games++;
        if (isTeamWinner(g, t)) p.wins++;
        p.totalThrows += t.totalThrows || 0;
        p.totalScore += t.totalScore || 0;
      });
    });
    return {
      topWinner,
      avgDuration,
      longestGame,
      playerStats: Object.values(ps).sort((a, b) => b.wins - a.wins || b.wins / b.games - a.wins / a.games),
      total: history.length
    };
  }, [history]);
  if (selected) return h(GameDetailScreen, {
    game: selected,
    onBack: () => setSelected(null)
  });
  if (statPlayer) return h(PlayerStatsScreen, {
    player: statPlayer,
    history: history,
    onBack: () => setStatPlayer(null)
  });
  return h("div", {
    className: "screen"
  }, h(Topbar, {
    title: tab === 'parties' ? 'Historique' : 'Statistiques',
    onBack,
    right: history.length > 0 && tab === 'parties' ? h("button", {
      type: "button",
      className: "icon-btn is-danger",
      "aria-label": "Effacer tout l'historique",
      onClick: clearAll
    }, h(Icon, {
      name: "trash"
    })) : null
  }), h("div", {
    className: "tabs",
    role: "tablist"
  }, h("button", {
    type: "button",
    role: "tab",
    className: `tab ${tab === 'parties' ? 'is-on' : ''}`,
    "aria-selected": tab === 'parties',
    onClick: () => setTab('parties')
  }, "Parties"), h("button", {
    type: "button",
    role: "tab",
    className: `tab ${tab === 'stats' ? 'is-on' : ''}`,
    "aria-selected": tab === 'stats',
    onClick: () => setTab('stats')
  }, "Statistiques")), h("div", {
    className: "scroll"
  }, history.length === 0 ? h("div", {
    className: "empty"
  }, h("strong", null, "Aucune partie termin\xE9e"), "Les parties gagn\xE9es apparaissent ici.") : tab === 'parties' ? h("div", null, h("div", {
    className: "list-count"
  }, history.length, " partie", history.length > 1 ? 's' : '', " termin\xE9e", history.length > 1 ? 's' : ''), history.map(game => h("div", {
    key: game.id,
    className: "history-item",
    role: "button",
    tabIndex: 0,
    "aria-label": `${game.label || 'Partie sans nom'}, gagnée par ${game.winner}`,
    onClick: () => setSelected(game),
    onKeyDown: event => openGameWithKeyboard(game, event)
  }, h("div", {
    className: "history-game-label"
  }, game.label || 'Partie sans nom'), h("div", {
    className: "history-item-date"
  }, formatDate(game.date), game.duration > 0 ? ` · ${formatDuration(game.duration)}` : ''), h("div", {
    className: "history-item-teams"
  }, rankTeams(game.teams || [], t => isTeamWinner(game, t)).map((t, i) => h("span", {
    key: i,
    className: `history-team-pill ${isTeamWinner(game, t) ? 'is-winner' : ''}`
  }, h("span", {
    className: "dot",
    style: {
      '--team': t.color
    }
  }), t.name, h("span", {
    className: "num"
  }, t.score), isTeamWinner(game, t) && h(Icon, {
    name: "trophy",
    size: 16
  })))), h("button", {
    type: "button",
    className: "history-delete",
    "aria-label": `Supprimer la partie gagnée par ${game.winner}`,
    onClick: e => deleteGame(game.id, e)
  }, h(Icon, {
    name: "trash",
    size: 18
  }))))) : globalStats ? h("div", null, h("div", {
    className: "summary-grid"
  }, [{
    label: 'Parties jouées',
    value: globalStats.total
  }, {
    label: 'Le plus de victoires',
    value: globalStats.topWinner ? globalStats.topWinner[0] : '—'
  }, {
    label: 'Durée moyenne',
    value: formatDuration(globalStats.avgDuration)
  }, {
    label: 'Partie la plus longue',
    value: formatDuration(globalStats.longestGame)
  }].map(s => h("div", {
    key: s.label,
    className: "summary"
  }, h("div", {
    className: "summary-value num"
  }, s.value), h("div", {
    className: "summary-label"
  }, s.label)))), h("h2", {
    className: "section-title"
  }, "Classement"), globalStats.playerStats.map((p, rank) => h("button", {
    key: p.name,
    type: "button",
    className: "player-row",
    "aria-label": `Statistiques de ${p.name}`,
    onClick: () => setStatPlayer(p),
    style: {
      '--team': p.color
    }
  }, h("span", {
    className: "rank num"
  }, rank + 1), h("span", null, h("span", {
    className: "player-name"
  }, h("span", {
    className: "dot"
  }), h("span", null, p.name)), h("span", {
    className: "player-meta"
  }, p.games, " partie", p.games > 1 ? 's' : '', " \xB7 moyenne ", p.totalThrows > 0 ? (p.totalScore / p.totalThrows).toFixed(1).replace('.', ',') : '—')), h("span", {
    className: "player-wins"
  }, h("span", {
    className: "num"
  }, p.wins), h("small", null, "victoire", p.wins > 1 ? 's' : '')), h(Icon, {
    name: "chevron",
    size: 18
  })))) : null));
}

function SettingsScreen({
  onBack
}) {
  const [storageSize, setStorageSize] = useState('…');
  useEffect(() => {
    setStorageSize(formatStorageSize(estimateStorageSize()));
  }, []);
  function clearAll() {
    if (window.confirm('Effacer tout l\'historique et la partie en cours ?')) {
      clearStoredData();
      window.location.reload();
    }
  }
  function checkUpdate() {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.getRegistration('./sw.js').then(reg => {
        if (reg) {
          reg.update().then(() => alert('Vérification effectuée.\nVersion installée : ' + APP_VERSION + '\nSi une nouvelle version existe, elle sera active au prochain lancement.'));
        } else {
          alert('Mode hors ligne pas encore actif : recharge la page une fois connecté.');
        }
      });
    } else {
      alert('Ce navigateur ne gère pas le mode hors ligne.');
    }
  }
  return h("div", {
    className: "screen"
  }, h(Topbar, {
    title: "R\xE9glages",
    onBack,
    backLabel: "Retour \xE0 l'accueil"
  }), h("div", {
    className: "scroll"
  }, h("section", {
    className: "section"
  }, h("h2", {
    className: "section-title"
  }, "Application"), h("div", {
    className: "row"
  }, h("div", null, h("div", {
    className: "row-label"
  }, "Version")), h("span", {
    className: "version-badge"
  }, APP_VERSION)), h("div", {
    className: "row"
  }, h("div", null, h("div", {
    className: "row-label"
  }, "Mise \xE0 jour"), h("div", {
    className: "row-sub"
  }, "Chercher une nouvelle version")), h("button", {
    type: "button",
    className: "btn btn-secondary btn-sm",
    onClick: checkUpdate
  }, "V\xE9rifier")), h("div", {
    className: "row"
  }, h("div", null, h("div", {
    className: "row-label"
  }, "Hors ligne"), h("div", {
    className: "row-sub"
  }, "Jouer sans connexion")), h("span", {
    className: "row-value"
  }, 'serviceWorker' in navigator ? 'Disponible' : 'Indisponible'))), h("section", {
    className: "section"
  }, h("h2", {
    className: "section-title"
  }, "Donn\xE9es"), h("div", {
    className: "row"
  }, h("div", null, h("div", {
    className: "row-label"
  }, "Espace utilis\xE9"), h("div", {
    className: "row-sub"
  }, "Historique et partie en cours, sur cet appareil")), h("span", {
    className: "row-value"
  }, storageSize)), h("div", {
    className: "row"
  }, h("div", null, h("div", {
    className: "row-label"
  }, "Tout effacer"), h("div", {
    className: "row-sub"
  }, "Historique et partie en cours")), h("button", {
    type: "button",
    className: "btn btn-danger btn-sm",
    onClick: clearAll
  }, "Effacer"))), h("section", {
    className: "section"
  }, h("h2", {
    className: "section-title"
  }, "R\xE8gle officielle"), h("div", {
    className: "row"
  }, h("div", {
    className: "row-label"
  }, "Score cible"), h("span", {
    className: "row-value"
  }, "50 pile")), h("div", {
    className: "row"
  }, h("div", {
    className: "row-label"
  }, "D\xE9passement"), h("span", {
    className: "row-value"
  }, "retour \xE0 25")), h("div", {
    className: "row"
  }, h("div", {
    className: "row-label"
  }, "\xC9limination"), h("span", {
    className: "row-value"
  }, "3 rat\xE9s de suite")), h("div", {
    className: "row"
  }, h("div", {
    className: "row-label"
  }, "Origine"), h("span", {
    className: "row-value"
  }, "Finlande, 1996")))));
}

function HomeScreen({
  onSetup,
  onHistory,
  onSettings,
  onResume,
  onClearSaved,
  historyCount,
  savedGame
}) {
  const [rulesOpen, setRulesOpen] = useState(false);
  const rules = [['1', 'quille tombée : on marque son numéro'], ['2 à 12', 'quilles tombées : on marque le nombre de quilles'], ['50', 'pile pour gagner'], ['+ de 50', 'on retombe à 25'], ['3', 'ratés de suite : élimination'], ['↻', 'les quilles sont relevées là où elles sont tombées']];
  return h("div", {
    className: "screen"
  }, h("div", {
    className: "scroll"
  }, h("div", {
    className: "home"
  }, h("div", {
    className: "home-head"
  }, h("div", null, h("h1", {
    className: "wordmark"
  }, "M\xF6lkky"), h("p", {
    className: "home-tagline"
  }, "Feuille de score"))), savedGame && h("div", {
    className: "resume"
  }, h("div", null, h("div", {
    className: "resume-title"
  }, "Partie en cours"), h("div", {
    className: "resume-sub"
  }, savedGame.gameLabel ? `${savedGame.gameLabel} · ` : '', "round ", savedGame.round, " \xB7 ", formatDate(savedGame.savedAt))), h("div", {
    className: "resume-teams"
  }, (savedGame.teams || []).map((t, i) => h("span", {
    key: i,
    className: "resume-team"
  }, h("span", {
    className: "dot",
    style: {
      '--team': t.color
    }
  }), t.name, h("span", {
    className: "num"
  }, t.score)))), h("div", {
    className: "resume-actions"
  }, h("button", {
    type: "button",
    className: "btn btn-primary",
    "aria-label": "Reprendre la partie en cours",
    onClick: onResume
  }, h(Icon, {
    name: "play"
  }), "Reprendre"), h("button", {
    type: "button",
    className: "btn btn-danger",
    "aria-label": "Effacer la partie en cours",
    onClick: () => {
      if (window.confirm('Effacer la partie en cours ?')) {
        clearCurrentGame();
        onClearSaved();
      }
    }
  }, h(Icon, {
    name: "trash"
  })))), h("button", {
    type: "button",
    className: `btn ${savedGame ? 'btn-secondary' : 'btn-primary'} btn-block btn-lg`,
    onClick: onSetup
  }, h(Icon, {
    name: "plus"
  }), "Nouvelle partie"), h("div", {
    className: "home-actions"
  }, historyCount > 0 && h("button", {
    type: "button",
    className: "btn btn-secondary",
    "aria-label": `Ouvrir l'historique, ${historyCount} parties`,
    onClick: onHistory
  }, h(Icon, {
    name: "clock"
  }), "Historique", h("span", {
    className: "count num"
  }, historyCount)), h("button", {
    type: "button",
    className: "btn btn-secondary",
    "aria-label": "Ouvrir les r\xE9glages",
    onClick: onSettings
  }, h(Icon, {
    name: "sliders"
  }), "R\xE9glages")), h(FieldDiagram, null), h("div", {
    className: "rules"
  }, h("button", {
    type: "button",
    className: "rules-toggle",
    "aria-expanded": rulesOpen,
    onClick: () => setRulesOpen(o => !o)
  }, "R\xE8gles du jeu", h(Icon, {
    name: "chevron"
  })), rulesOpen && h("ul", {
    className: "rules-list"
  }, rules.map(([n, text]) => h("li", {
    key: n
  }, h("span", {
    className: "num"
  }, n), h("span", null, text))))))));
}

function App() {
  const [screen, setScreen] = useState('home');
  const [gameConfig, setGameConfig] = useState(null);
  const [resumeState, setResumeState] = useState(null);
  const [histCount, setHistCount] = useState(() => loadHistory().length);
  const [savedGame, setSavedGame] = useState(() => loadCurrentGame());
  function startGame(teams, targetScore, rules, gameLabel = '') {
    clearCurrentGame();
    setResumeState(null);
    setGameConfig({
      teams,
      targetScore,
      rules,
      gameLabel
    });
    setScreen('game');
  }
  function resumeGame() {
    const s = loadCurrentGame();
    if (!s) return;
    setResumeState(s);
    setGameConfig({
      teams: s.teams,
      targetScore: s.targetScore,
      rules: s.rules,
      gameLabel: s.gameLabel || ''
    });
    setScreen('game');
  }
  function endGame() {
    setHistCount(loadHistory().length);
    setSavedGame(null);
    setResumeState(null);
    setScreen('home');
  }
  function pauseGame() {
    setResumeState(null);
    setScreen('home');
  }
  function goHistory() {
    setHistCount(loadHistory().length);
    setScreen('history');
  }
  useEffect(() => {
    if (screen === 'home') setSavedGame(loadCurrentGame());
  }, [screen]);
  if (screen === 'home') return React.createElement(HomeScreen, {
    onSetup: () => setScreen('setup'),
    onHistory: goHistory,
    onSettings: () => setScreen('settings'),
    onResume: resumeGame,
    onClearSaved: () => setSavedGame(null),
    historyCount: histCount,
    savedGame: savedGame
  });
  if (screen === 'setup') return React.createElement(SetupScreen, {
    onBack: () => setScreen('home'),
    onStart: startGame
  });
  if (screen === 'game' && gameConfig) return React.createElement(GameScreen, _extends({}, gameConfig, {
    onEnd: endGame,
    onPause: pauseGame,
    resumeState: resumeState
  }));
  if (screen === 'history') return React.createElement(HistoryScreen, {
    onBack: () => {
      setHistCount(loadHistory().length);
      setScreen('home');
    }
  });
  if (screen === 'settings') return React.createElement(SettingsScreen, {
    onBack: () => setScreen('home')
  });
  return null;
}
ReactDOM.createRoot(document.getElementById('root')).render(React.createElement(App, null));
