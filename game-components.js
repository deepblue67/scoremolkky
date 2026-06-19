(function (root, factory) {
  const gameComponents = factory(root.React, root.MolkkyConstants);

  if (typeof module === 'object' && module.exports) {
    module.exports = gameComponents;
  }

  root.MolkkyGameComponents = gameComponents;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (React, constants) {
  const { SORTED_PINS } = constants;

  function GameScoreboard({
    teams,
    currentTeamIdx,
    targetScore,
    rules,
  }) {
    const activeRules = rules || {
      eliminationOn: true,
      missLimit: 3,
    };

    return React.createElement("div", {
      className: "scoreboard"
    }, teams.map((team, i) => React.createElement("div", {
      key: i,
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
    }, team.name), React.createElement("div", {
      className: "team-score-remain"
    }, targetScore - team.score, " pts")), React.createElement("div", {
      className: "team-score-value"
    }, team.score), team.overflowStrikes > 0 && React.createElement("div", {
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
    }))))));
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
    canUndo,
    onTogglePin,
    onConfirmMiss,
    onUndoLast,
    onConfirmThrow,
    onAbandon,
  }) {
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
      style: {
        color: currentTeam.color
      }
    }, currentTeam.name), React.createElement("span", {
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
    }, "Abandonner"))), recentHistory.length > 0 && React.createElement("div", {
      className: "history-strip"
    }, React.createElement("span", {
      className: "history-label"
    }, "R\xE9cent :"), recentHistory.map(h => React.createElement("div", {
      key: h.key,
      className: `history-chip ${h.type}`,
      style: {
        borderLeft: `3px solid ${h.team.color}`
      }
    }, h.label))), React.createElement("div", {
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
