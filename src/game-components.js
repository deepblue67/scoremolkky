(function (root, factory) {
  const gameComponents = factory(root.React, root.MolkkyConstants);

  if (typeof module === 'object' && module.exports) {
    module.exports = gameComponents;
  }

  root.MolkkyGameComponents = gameComponents;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (React, constants) {
  const { SORTED_PINS } = constants;
  const { useEffect, useRef } = React;

  function MatchHistorySheet({
    throws,
    teams,
    onClose,
  }) {
    const rounds = (throws || []).reduce((acc, entry, index) => {
      const round = entry.roundBefore || 1;
      if (!acc[round]) acc[round] = [];
      acc[round].push({
        ...entry,
        displayIndex: index + 1,
      });
      return acc;
    }, {});
    const sortedRounds = Object.keys(rounds).map(Number).sort((a, b) => a - b);

    function eventLabel(entry) {
      if (entry.miss) return entry.eliminated ? 'Raté · élimination' : 'Raté';
      if (entry.penalized) return 'Dépassement · pénalité';
      if (entry.overflow) return 'Dépassement';
      return entry.pins && entry.pins.length === 1 ? `Quille ${entry.pins[0]}` : `${entry.pins.length} quilles`;
    }

    function eventClass(entry) {
      if (entry.eliminated || entry.penalized) return 'danger';
      if (entry.miss || entry.overflow) return 'warning';
      return 'normal';
    }

    return React.createElement("div", {
      className: "match-history-overlay",
      onClick: onClose
    }, React.createElement("div", {
      className: "match-history-sheet",
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": "match-history-title",
      onClick: e => e.stopPropagation()
    }, React.createElement("div", {
      className: "match-history-header"
    }, React.createElement("div", null, React.createElement("div", {
      id: "match-history-title",
      className: "match-history-title"
    }, "Coups joués"), React.createElement("div", {
      className: "match-history-subtitle"
    }, throws.length, " coup", throws.length > 1 ? 's' : '', " dans cette partie")), React.createElement("button", {
      type: "button",
      className: "match-history-close",
      "aria-label": "Fermer l'historique des coups",
      onClick: onClose
    }, "\u00D7")), throws.length === 0 ? React.createElement("div", {
      className: "match-history-empty"
    }, "Aucun coup joué pour l'instant.") : React.createElement("div", {
      className: "match-history-list"
    }, sortedRounds.map(round => React.createElement("section", {
      key: round,
      className: "match-history-round"
    }, React.createElement("div", {
      className: "match-history-round-title"
    }, "Round ", round), rounds[round].map(entry => {
      const team = teams[entry.teamIdx] || entry.teamBefore || {};
      const scoreAfter = entry.scoreAfter !== undefined ? entry.scoreAfter : entry.scoreBefore;
      return React.createElement("div", {
        key: `${round}-${entry.displayIndex}`,
        className: `match-history-row ${eventClass(entry)}`,
        style: {
          '--team-color': team.color || '#c8854a'
        }
      }, React.createElement("div", {
        className: "match-history-team"
      }, React.createElement("span", {
        className: "match-history-dot"
      }), React.createElement("span", null, team.name || `Équipe ${entry.teamIdx + 1}`)), React.createElement("div", {
        className: "match-history-event"
      }, React.createElement("strong", null, eventLabel(entry)), React.createElement("span", null, entry.miss ? `Score ${entry.scoreBefore}` : `${entry.scoreBefore} → ${scoreAfter}`)), React.createElement("div", {
        className: "match-history-points"
      }, entry.miss ? "\u2717" : `+${entry.points}`));
    }))))));
  }

  function GameScoreboard({
    teams,
    currentTeamIdx,
    targetScore,
    rules,
  }) {
    const scoreboardRef = useRef(null);
    const activeRules = rules || {
      eliminationOn: true,
      missLimit: 3,
    };

    useEffect(() => {
      const board = scoreboardRef.current;
      if (!board) return;
      const activeCard = board.querySelector(`[data-team-index="${currentTeamIdx}"]`);
      if (activeCard && typeof activeCard.scrollIntoView === 'function') {
        activeCard.scrollIntoView({
          behavior: 'smooth',
          block: 'nearest',
          inline: 'center',
        });
      }
    }, [currentTeamIdx, teams.length]);

    return React.createElement("div", {
      className: "scoreboard",
      ref: scoreboardRef
    }, teams.map((team, i) => {
      const remaining = targetScore - team.score;
      const isPlayable = remaining > 0 && remaining <= 12;
      return React.createElement("div", {
      key: i,
      "data-team-index": i,
      className: `team-score-card ${i === currentTeamIdx ? 'active' : ''} ${team.eliminated ? 'eliminated' : ''}`
    }, i === currentTeamIdx && React.createElement("div", {
      className: "active-arrow"
    }, "\u25BC"), team.eliminated && React.createElement("div", {
      className: "elim-badge"
    }, "\u274C"), React.createElement("div", {
      className: "team-score-top"
    }, React.createElement("div", {
      className: "team-name-label",
      style: {
        color: team.color
      }
    }, team.name), isPlayable && React.createElement("div", {
      className: "team-playable-badge",
      style: {
        color: team.color,
        borderColor: `${team.color}66`,
        background: `${team.color}18`
      }
    }, "jouable")), React.createElement("div", {
      className: "team-score-metrics"
    }, React.createElement("div", {
      className: "team-score-metric"
    }, React.createElement("div", {
      className: "team-score-metric-label"
    }, "Score"), React.createElement("div", {
      className: "team-score-value team-score-current-value"
    }, team.score)), React.createElement("div", {
      className: `team-score-metric team-score-metric-remain ${isPlayable ? 'playable' : ''}`,
      style: {
        '--team-color': team.color
      }
    }, React.createElement("div", {
      className: "team-score-metric-label"
    }, "Reste"), React.createElement("div", {
      className: "team-score-value team-score-remain-value"
    }, remaining))), team.overflowStrikes > 0 && React.createElement("div", {
      style: {
        fontSize: '10px',
        color: '#f39c12',
        fontWeight: '800',
        marginTop: '3px'
      }
    }, "\u26A0\uFE0F ", '💥'.repeat(team.overflowStrikes)), !team.eliminated && activeRules.eliminationOn && React.createElement("div", {
      className: "miss-indicator"
    }, Array.from({
      length: activeRules.missLimit || 3
    }).map((_, j) => React.createElement("div", {
      key: j,
      className: `miss-dot ${j < team.misses ? 'filled' : ''}`
    }))));
    }));
  }

  function GameTurnPanel({
    currentTeam,
    round,
    selectedPins,
    throwScore,
    willOverflow,
    overflowLabel,
    displayAfter,
    recentHistory,
    throwHistory,
    teams,
    canUndo,
    onTogglePin,
    onConfirmMiss,
    onUndoLast,
    onConfirmThrow,
    onAbandon,
  }) {
    const [historyOpen, setHistoryOpen] = React.useState(false);
    const hasSelection = selectedPins.length > 0;
    const selectedLabel = hasSelection ? selectedPins.length === 1 ? `Quille ${selectedPins[0]}` : `${selectedPins.length} quilles` : 'Aucune quille';
    return React.createElement("div", {
      className: "game-main",
      style: {
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        minHeight: 0
      }
    }, React.createElement("div", {
      className: "current-turn"
    }, React.createElement("div", {
      className: "turn-label"
    }, "Tour de ", React.createElement("span", {
      className: "turn-team-name",
      style: {
        color: currentTeam.color
      }
    }, currentTeam.name), React.createElement("span", {
      className: "turn-round-badge",
      style: {
        color: 'rgba(255,255,255,0.3)',
        fontSize: '14px'
      }
    }, " \xB7 Round ", round))), React.createElement("div", {
      className: "score-preview-bar",
      style: {
        paddingTop: '10px'
      }
    }, React.createElement("div", {
      className: `score-preview-inner ${hasSelection ? 'has-selection' : ''}`
    }, React.createElement("div", {
      className: "score-col score-col-side"
    }, React.createElement("span", {
      className: "score-col-label"
    }, "Mon score"), React.createElement("span", {
      className: "score-col-value"
    }, currentTeam.score)), React.createElement("div", {
      className: "score-col score-col-main"
    }, React.createElement("span", {
      className: "score-col-label"
    }, selectedLabel), React.createElement("span", {
      className: `score-col-value throw-value ${hasSelection ? 'active' : ''}`
    }, hasSelection ? `+${throwScore}` : '\u2014')), React.createElement("div", {
      className: "score-col score-col-side"
    }, React.createElement("span", {
      className: "score-col-label"
    }, hasSelection && willOverflow ? overflowLabel : 'Apr\xE8s'), React.createElement("span", {
      className: `score-col-value ${hasSelection ? willOverflow ? 'overflow' : 'after' : ''}`
    }, hasSelection ? displayAfter : '\u2014')))), React.createElement("div", {
      className: "pins-grid-container"
    }, React.createElement("div", {
      className: "pins-grid"
    }, SORTED_PINS.map(pin => React.createElement("button", {
      key: pin,
      className: `pin-btn ${selectedPins.includes(pin) ? 'selected' : ''}`,
      "aria-pressed": selectedPins.includes(pin),
      "aria-label": `Quille ${pin}`,
      onClick: () => onTogglePin(pin)
    }, React.createElement("span", {
      className: "check-mark",
      "aria-hidden": "true"
    }, "\u2713"), pin)))), React.createElement("div", {
      className: "miss-bar"
    }, React.createElement("button", {
      className: "miss-bar-btn",
      "aria-label": "Valider un lancer rat\xE9 sans quille renvers\xE9e",
      onClick: onConfirmMiss
    }, "\u2717 \xA0 Rat\xE9")), React.createElement("div", {
      className: "bottom-action-row"
    }, React.createElement("button", {
      className: "abandon-btn",
      "aria-label": "Annuler le dernier lancer",
      onClick: onUndoLast,
      disabled: !canUndo,
      style: {
        opacity: canUndo ? 1 : 0.25,
        borderColor: 'rgba(255,255,255,0.15)',
        color: 'rgba(255,255,255,0.55)',
        background: 'rgba(255,255,255,0.06)'
      }
    }, React.createElement("span", {
      className: "abandon-btn-icon"
    }, "\u21A9"), React.createElement("span", {
      className: "abandon-btn-label"
    }, "Annuler")), React.createElement("button", {
      className: "validate-btn",
      "aria-label": "Valider le lancer s\xE9lectionn\xE9",
      disabled: selectedPins.length === 0,
      onClick: onConfirmThrow
    }, "\u2713  Valider"), React.createElement("button", {
      className: "abandon-btn",
      "aria-label": "Ouvrir les options d'abandon de partie",
      onClick: onAbandon
    }, React.createElement("span", {
      className: "abandon-btn-icon"
    }, "\uD83C\uDFF3"), React.createElement("span", {
      className: "abandon-btn-label"
    }, "Abandonner"))), React.createElement("div", {
      className: "match-history-access"
    }, React.createElement("button", {
      type: "button",
      className: "match-history-access-btn",
      "aria-label": `Afficher l'historique des coups, ${(throwHistory || []).length} coups joués`,
      onClick: () => setHistoryOpen(true)
    }, "Coups jou\xE9s", React.createElement("span", null, (throwHistory || []).length))), historyOpen && React.createElement(MatchHistorySheet, {
      throws: throwHistory || [],
      teams: teams || [],
      onClose: () => setHistoryOpen(false)
    }), React.createElement("div", {
      style: {
        flexShrink: 0,
        height: 'max(4px,env(safe-area-inset-bottom))'
      }
    }));
  }

  return {
    GameScoreboard,
    GameTurnPanel,
  };
});
