(function (root, factory) {
  const gameComponents = factory(root.React, root.MolkkyConstants, root.MolkkyComponents);

  if (typeof module === 'object' && module.exports) {
    module.exports = gameComponents;
  }

  root.MolkkyGameComponents = gameComponents;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (React, constants, components) {
  const { SORTED_PINS } = constants;
  // Disposition de départ sur le terrain, vue depuis la zone de lancer.
  const FIELD_ROWS = [[7, 9, 8], [5, 11, 12, 6], [3, 10, 4], [1, 2]];
  const { Icon, Sheet } = components;
  const h = React ? React.createElement : null;
  const { useEffect, useRef, useState } = React || {};

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

    return h(Sheet, {
      labelledBy: "match-history-title",
      onClose,
      className: "match-history-sheet"
    }, h("div", {
      className: "sheet-head"
    }, h("div", null, h("div", {
      id: "match-history-title",
      className: "sheet-title"
    }, "Coups jou\xE9s"), h("div", {
      className: "sheet-sub"
    }, throws.length, " coup", throws.length > 1 ? 's' : '', " dans cette partie")), h("button", {
      type: "button",
      className: "sheet-close",
      "aria-label": "Fermer l'historique des coups",
      onClick: onClose
    }, h(Icon, {
      name: "x"
    }))), throws.length === 0 ? h("div", {
      className: "match-history-empty"
    }, "Aucun coup jou\xE9 pour l'instant.") : h("div", {
      className: "match-history-list"
    }, sortedRounds.map(round => h("section", {
      key: round,
      className: "match-history-round"
    }, h("div", {
      className: "match-history-round-title"
    }, "Round ", round), rounds[round].map(entry => {
      const team = teams[entry.teamIdx] || entry.teamBefore || {};
      const scoreAfter = entry.scoreAfter !== undefined ? entry.scoreAfter : entry.scoreBefore;
      return h("div", {
        key: `${round}-${entry.displayIndex}`,
        className: `match-history-row ${eventClass(entry)}`
      }, h("div", {
        className: "match-history-team"
      }, h("span", {
        className: "dot",
        style: {
          '--team': team.color
        }
      }), h("span", null, team.name || `Équipe ${entry.teamIdx + 1}`)), h("div", {
        className: "match-history-event"
      }, h("strong", null, eventLabel(entry)), h("span", null, entry.miss ? `Score ${entry.scoreBefore}` : `${entry.scoreBefore} → ${scoreAfter}`)), h("div", {
        className: "match-history-points num"
      }, entry.miss ? "✗" : `+${entry.points}`));
    })))));
  }

  function MissDots({
    misses,
    limit
  }) {
    const isLast = misses === limit - 1;
    return h("span", {
      className: `misses ${isLast ? 'is-last' : ''}`,
      "aria-label": `${misses} raté${misses > 1 ? 's' : ''} sur ${limit}`
    }, Array.from({
      length: limit
    }).map((_, j) => h("span", {
      key: j,
      className: `miss-dot ${j < misses ? 'filled' : ''}`
    })));
  }

  function GameScoreboard({
    teams,
    currentTeamIdx,
    targetScore,
    rules,
    match,
  }) {
    const activeRules = rules || {
      eliminationOn: true,
      missLimit: 3,
    };
    const wins = match && match.wins ? match.wins : null;

    return h("div", {
      className: "scoreboard",
      "data-count": teams.length
    }, teams.map((team, i) => {
      const remaining = targetScore - team.score;
      const isPlayable = remaining > 0 && remaining <= 12;
      const isActive = i === currentTeamIdx;
      return h("div", {
        key: i,
        "data-team-index": i,
        "aria-current": isActive ? 'true' : undefined,
        className: `score-tile team-score-card ${isActive ? 'is-active active' : ''} ${team.eliminated ? 'is-out eliminated' : ''} ${isPlayable ? 'is-playable' : ''}`,
        style: {
          '--team': team.color
        }
      }, h("div", {
        className: "tile-head"
      }, h("span", {
        className: "tile-name"
      }, team.name, wins && wins[team.id] > 0 && h("span", {
        className: "tile-wins num",
        "aria-label": `${wins[team.id]} manche${wins[team.id] > 1 ? 's' : ''} gagnée${wins[team.id] > 1 ? 's' : ''}`
      }, wins[team.id])), team.eliminated ? h("span", {
        className: "tile-status"
      }, "\xE9limin\xE9e") : activeRules.eliminationOn && h(MissDots, {
        misses: team.misses || 0,
        limit: activeRules.missLimit || 3
      })), h("div", {
        className: "tile-body"
      }, h("span", {
        className: "tile-score num team-score-current-value"
      }, team.score), h("span", {
        className: "tile-remain"
      }, "reste", h("span", {
        className: "num"
      }, remaining))));
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
    targetScore,
    throwHistory,
    teams,
    canUndo,
    locked,
    toast,
    onTogglePin,
    onConfirmMiss,
    onUndoLast,
    onConfirmThrow,
    onAbandon,
    rules,
    match,
    prefs,
    currentPlayer,
  }) {
    const [historyOpen, setHistoryOpen] = useState(false);
    const activeRules = rules || {};
    const missLimit = activeRules.missLimit || 3;
    const lastChance = Boolean(activeRules.eliminationOn) && (currentTeam.misses || 0) === missLimit - 1;
    const remaining = targetScore - currentTeam.score;
    const helpOn = !prefs || prefs.helpOn !== false;
    const helpActive = helpOn && remaining >= 1 && remaining <= 12;
    const fieldLayout = prefs && prefs.pinLayout === 'field';
    const pinClass = pin => {
      const classes = ['wood-disc', 'pin-btn', 'num'];
      if (selectedPins.includes(pin)) classes.push('selected');
      if (helpActive && pin === remaining) classes.push('is-target');
      if (helpActive && pin > remaining) classes.push('is-over');
      return classes.join(' ');
    };
    const renderPin = pin => h("button", {
      key: pin,
      type: "button",
      className: pinClass(pin),
      "aria-pressed": selectedPins.includes(pin),
      "aria-label": `Quille ${pin}`,
      disabled: locked,
      onClick: () => onTogglePin(pin)
    }, pin);
    const hasSelection = selectedPins.length > 0;
    const playedCount = (throwHistory || []).length;
    const selectedLabel = hasSelection ? selectedPins.length === 1 ? `Quille ${selectedPins[0]}` : `${selectedPins.length} quilles` : helpActive ? `Il faut ${remaining}` : 'Ce lancer';
    const afterLabel = hasSelection && willOverflow ? overflowLabel : 'Apr\xE8s';
    const wins = hasSelection && !willOverflow && displayAfter === targetScore;
    return h("div", {
      className: "game-main"
    }, h("div", {
      className: "turnbar"
    }, h("div", {
      className: "turn-label"
    }, h("div", {
      className: "turn-main"
    }, h("span", {
      className: "turn-prefix"
    }, "Tour de "), h("span", {
      className: "turn-team-name",
      style: {
        color: currentTeam.color
      }
    }, currentTeam.name)), h("div", {
      className: "turn-meta"
    }, currentPlayer && h("span", {
      className: "turn-player"
    }, currentPlayer, " lance"), lastChance ? h("span", {
      className: "turn-alert",
      role: "status"
    }, "Dernier essai") : h("span", {
      className: "turn-round"
    }, match ? `manche ${match.manche} · ` : '', "round ", round))), h("button", {
      type: "button",
      className: "history-btn",
      "aria-label": `Afficher l'historique des coups, ${playedCount} coups joués`,
      onClick: () => setHistoryOpen(true)
    }, h(Icon, {
      name: "list",
      size: 18
    }), h("span", {
      className: "num"
    }, playedCount))), h("div", {
      className: "preview-wrap"
    }, h("div", {
      className: `toast ${toast && toast.show ? 'show' : ''}`,
      role: "status",
      "aria-live": "polite"
    }, toast ? toast.msg : ''), h("div", {
      className: `preview ${hasSelection ? 'has-selection' : ''}`
    }, h("div", {
      className: "preview-col"
    }, h("span", {
      className: "preview-label"
    }, "Score"), h("span", {
      className: "preview-value num"
    }, currentTeam.score)), h("div", {
      className: "preview-col preview-col-main"
    }, h("span", {
      className: "preview-label"
    }, selectedLabel), h("span", {
      className: "preview-value num"
    }, hasSelection ? `+${throwScore}` : '—')), h("div", {
      className: "preview-col"
    }, h("span", {
      className: "preview-label"
    }, wins ? 'Victoire' : afterLabel), h("span", {
      className: `preview-value num score-col-value ${hasSelection ? willOverflow ? 'is-overflow overflow' : wins ? 'is-win' : 'is-after' : ''}`
    }, hasSelection ? displayAfter : '—')))), h("div", {
      className: "pins-grid-container"
    }, fieldLayout ? h("div", {
      className: "pins-grid is-field",
      style: {
        '--team': currentTeam.color
      }
    }, FIELD_ROWS.map((row, ri) => h("div", {
      key: ri,
      className: "pins-row"
    }, row.map(renderPin)))) : h("div", {
      className: "pins-grid",
      style: {
        '--team': currentTeam.color
      }
    }, SORTED_PINS.map(renderPin))), h("div", {
      className: "miss-bar"
    }, h("button", {
      type: "button",
      className: `miss-bar-btn ${lastChance ? 'is-last' : ''}`,
      "aria-label": lastChance ? "Valider un lancer rat\xE9 sans quille renvers\xE9e : \xE9limine l'\xE9quipe" : "Valider un lancer rat\xE9 sans quille renvers\xE9e",
      disabled: locked,
      onClick: onConfirmMiss
    }, h(Icon, {
      name: "x"
    }), "Rat\xE9", h("small", null, lastChance ? "\xE9limine l'\xE9quipe" : "aucune quille"))), h("div", {
      className: "bottom-action-row"
    }, h("button", {
      type: "button",
      className: "side-btn",
      "aria-label": "Annuler le dernier lancer",
      onClick: onUndoLast,
      disabled: !canUndo
    }, h(Icon, {
      name: "undo"
    }), "Annuler"), h("button", {
      type: "button",
      className: "validate-btn",
      "aria-label": "Valider le lancer s\xE9lectionn\xE9",
      disabled: locked || selectedPins.length === 0,
      onClick: onConfirmThrow
    }, h(Icon, {
      name: "check",
      size: 22
    }), "Valider"), h("button", {
      type: "button",
      className: "side-btn",
      "aria-label": "Mettre la partie en pause",
      disabled: locked,
      onClick: onAbandon
    }, h(Icon, {
      name: "pause"
    }), "Pause")), historyOpen && h(MatchHistorySheet, {
      throws: throwHistory || [],
      teams: teams || [],
      onClose: () => setHistoryOpen(false)
    }));
  }

  return {
    GameScoreboard,
    GameTurnPanel,
  };
});
