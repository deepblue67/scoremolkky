(function (root, factory) {
  const rules = root.MolkkyRules || (typeof require === 'function' ? require('./rules.js') : null);
  const gameState = factory(rules);

  if (typeof module === 'object' && module.exports) {
    module.exports = gameState;
  }

  root.MolkkyGameState = gameState;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (rules) {
  const {
    calculateThrowOutcome,
    calculateMissOutcome,
    getNextActiveTeamIndex,
  } = rules;

  function normalizeGameRules(rules) {
    return {
      eliminationOn: rules && rules.eliminationOn !== undefined ? rules.eliminationOn : true,
      missLimit: rules && rules.missLimit !== undefined ? rules.missLimit : 3,
      overflowGrace: rules && rules.overflowGrace !== undefined ? rules.overflowGrace : 0,
      overflowMode: rules && rules.overflowMode !== undefined ? rules.overflowMode : '25',
    };
  }

  function normalizePlayers(players) {
    return Array.isArray(players)
      ? players.map(name => String(name || '').trim()).filter(Boolean)
      : [];
  }

  function createTeamState(team, targetScore, index = 0) {
    // Garde-fou : un handicap ne peut jamais atteindre ou dépasser le score cible.
    const rawHandicap = Math.max(0, Number(team.handicap) || 0);
    const handicap = targetScore ? Math.min(rawHandicap, targetScore - 1) : rawHandicap;
    return {
      ...team,
      id: team.id !== undefined ? team.id : `t${index + 1}`,
      players: normalizePlayers(team.players),
      playerIdx: 0,
      handicap,
      score: handicap,
      misses: 0,
      overflowStrikes: 0,
      totalThrows: 0,
      totalScore: 0,
      maxThrow: 0,
      overflows: 0,
      eliminated: false,
      history: [],
    };
  }

  function resetTeamsForNewGame(teams) {
    return teams.map(team => ({
      ...team,
      score: team.handicap || 0,
      playerIdx: 0,
      misses: 0,
      overflowStrikes: 0,
      totalThrows: 0,
      totalScore: 0,
      maxThrow: 0,
      overflows: 0,
      eliminated: false,
      history: [],
    }));
  }

  function createInitialGameState({
    teams,
    targetScore,
    rules,
    gameLabel = '',
    startedAt = Date.now(),
    match = null,
    startRule = 'loser',
  }) {
    return {
      gameLabel,
      match,
      startRule,
      teams: teams.map((team, index) => createTeamState(team, targetScore, index)),
      currentTeamIdx: 0,
      selectedPins: [],
      throws: [],
      round: 1,
      startedAt,
      targetScore,
      rules: normalizeGameRules(rules),
      finished: false,
    };
  }

  function blocked(state, reason) {
    return {
      canPlay: false,
      reason,
      nextState: state,
    };
  }

  function getRecentThrowHistory(throws, teams, limit = 8) {
    return throws.slice(-limit).reverse().map((entry, i) => ({
      key: i,
      label: entry.miss ? '\u2717' : `+${entry.points}`,
      type: entry.miss ? 'miss' : entry.points > 8 ? 'bonus' : 'normal',
      team: teams[entry.teamIdx],
    }));
  }

  // Joueur qui lance pour cette équipe (null si l'équipe n'a pas de joueurs).
  function currentPlayerName(team) {
    const players = (team && team.players) || [];
    if (!players.length) return null;
    return players[(team.playerIdx || 0) % players.length];
  }

  function advancePlayer(team) {
    const players = team.players || [];
    if (!players.length) return team;
    return {
      ...team,
      playerIdx: ((team.playerIdx || 0) + 1) % players.length,
    };
  }

  function cloneTeamForUndo(team) {
    return {
      ...team,
      history: [...(team.history || [])],
    };
  }

  function getNextRound(currentRound, currentTeamIdx, nextTeamIdx) {
    return nextTeamIdx <= currentTeamIdx ? currentRound + 1 : currentRound;
  }

  function applyThrowTransition(state, targetScore, fallbackRules) {
    if (state.finished) return blocked(state, 'finished');
    if (!Array.isArray(state.selectedPins) || state.selectedPins.length === 0) return blocked(state, 'no-pins');
    const activeRules = state.rules || fallbackRules || normalizeGameRules();
    const {
      teams,
      currentTeamIdx,
      selectedPins,
      throws,
      round,
    } = state;
    const team = teams[currentTeamIdx];
    const teamBefore = cloneTeamForUndo(team);
    const rawOutcome = calculateThrowOutcome(team, selectedPins, targetScore, activeRules);
    const outcome = {
      ...rawOutcome,
      updatedTeam: advancePlayer(rawOutcome.updatedTeam),
    };
    const player = currentPlayerName(team);
    const newTeams = teams.map((entry, i) => i === currentTeamIdx ? outcome.updatedTeam : entry);
    const nextIdx = getNextActiveTeamIndex(newTeams, currentTeamIdx);

    const won = outcome.newScore === targetScore && !outcome.overflow;

    return {
      ...outcome,
      canPlay: true,
      team,
      teamBefore,
      activeRules,
      newTeams,
      nextState: {
        ...state,
        finished: won,
        teams: newTeams,
        currentTeamIdx: nextIdx,
        selectedPins: [],
        throws: [...throws, {
          teamIdx: currentTeamIdx,
          player,
          pins: [...selectedPins],
          points: outcome.score,
          teamBefore,
          roundBefore: round,
          scoreBefore: team.score,
          scoreAfter: outcome.updatedTeam.score,
          missesBefore: team.misses,
          missesAfter: outcome.updatedTeam.misses,
          overflow: outcome.overflow,
          penalized: outcome.penalized,
          overflowStrikesAfter: outcome.updatedTeam.overflowStrikes || 0,
        }],
        round: getNextRound(round, currentTeamIdx, nextIdx),
      },
    };
  }

  function applyMissTransition(state, fallbackRules) {
    if (state.finished) return blocked(state, 'finished');
    const activeRules = state.rules || fallbackRules || normalizeGameRules();
    const {
      teams,
      currentTeamIdx,
      throws,
      round,
    } = state;
    const team = teams[currentTeamIdx];
    const teamBefore = cloneTeamForUndo(team);
    const rawOutcome = calculateMissOutcome(team, activeRules);
    const outcome = {
      ...rawOutcome,
      updatedTeam: advancePlayer(rawOutcome.updatedTeam),
    };
    const player = currentPlayerName(team);
    const newTeams = teams.map((entry, i) => i === currentTeamIdx ? outcome.updatedTeam : entry);
    const nextIdx = getNextActiveTeamIndex(newTeams, currentTeamIdx);
    const activeTeams = newTeams.filter(entry => !entry.eliminated);

    return {
      ...outcome,
      canPlay: true,
      team,
      teamBefore,
      activeRules,
      newTeams,
      activeTeams,
      nextState: {
        ...state,
        finished: outcome.eliminated && activeTeams.length <= 1,
        teams: newTeams,
        currentTeamIdx: nextIdx,
        selectedPins: [],
        throws: [...throws, {
          teamIdx: currentTeamIdx,
          player,
          pins: [],
          points: 0,
          teamBefore,
          roundBefore: round,
          scoreBefore: team.score,
          scoreAfter: outcome.updatedTeam.score,
          missesBefore: team.misses,
          missesAfter: outcome.updatedTeam.misses,
          eliminated: outcome.eliminated,
          missLimit: outcome.limit,
          miss: true,
        }],
        round: getNextRound(round, currentTeamIdx, nextIdx),
      },
    };
  }

  function applyUndoTransition(state) {
    const { throws, teams } = state;
    if (!throws.length) {
      return {
        canUndo: false,
        nextState: state,
      };
    }

    const last = throws[throws.length - 1];
    const team = teams[last.teamIdx];
    const restored = last.teamBefore || {
      ...team,
      score: last.scoreBefore,
      misses: last.missesBefore,
      eliminated: false,
      totalThrows: Math.max(0, team.totalThrows - 1),
      history: (team.history || []).slice(0, -1),
    };

    return {
      canUndo: true,
      last,
      restored,
      nextState: {
        ...state,
        teams: teams.map((entry, i) => i === last.teamIdx ? restored : entry),
        currentTeamIdx: last.teamIdx,
        selectedPins: [],
        finished: false,
        throws: throws.slice(0, -1),
        round: last.roundBefore || state.round,
      },
    };
  }

  function getThrowReaction(result, targetScore) {
    const {
      team,
      score,
      newScore,
      overflow,
      penalized,
      updatedTeam,
      activeRules,
    } = result;
    const overflowStrikes = updatedTeam.overflowStrikes || 0;

    if (newScore === targetScore && !overflow) {
      return {
        type: 'winner',
        team: updatedTeam,
      };
    }

    if (penalized) {
      return {
        type: 'popup',
        delay: 50,
        popup: {
          type: 'overflow_penalized',
          teamName: team.name,
          teamColor: team.color,
          data: {
            scoreBefore: team.score + score,
            newScore,
            targetScore,
            mode: activeRules.overflowMode || '25',
          },
        },
      };
    }

    if (overflow && activeRules.overflowMode !== 'none') {
      return {
        type: 'popup',
        delay: 50,
        popup: {
          type: 'overflow_grace',
          teamName: team.name,
          teamColor: team.color,
          data: {
            score,
            scoreBefore: team.score,
            targetScore,
            strikesUsed: overflowStrikes,
            graceTotal: activeRules.overflowGrace,
            remaining: activeRules.overflowGrace - overflowStrikes,
          },
        },
      };
    }

    if (overflow && activeRules.overflowMode === 'none') {
      return {
        type: 'toast',
        message: 'D\u00E9passement : lancer ignor\u00E9',
      };
    }

    return {
      type: 'toast',
      message: `+${score} \u2192 ${newScore} pts`,
    };
  }

  function getMissReaction(result) {
    const {
      team,
      newMisses,
      eliminated,
      activeRules,
      activeTeams,
    } = result;
    const limit = activeRules.missLimit || 3;

    if (eliminated) {
      const winnerTeam = activeTeams.length === 1 ? activeTeams[0] : null;
      return {
        type: 'eliminated',
        popupDelay: 50,
        winnerDelay: 2200,
        winnerTeam,
        popup: {
          type: 'eliminated',
          teamName: team.name,
          teamColor: team.color,
          data: {
            misses: newMisses,
            limit,
            winnerName: winnerTeam ? winnerTeam.name : null,
          },
        },
      };
    }

    return {
      type: 'toast',
      message: activeRules.eliminationOn ? `Rat\u00E9 (${newMisses}/${limit})` : 'Rat\u00E9',
    };
  }

  // Bilan par joueur d'une équipe, calculé à partir des coups joués.
  function summarizePlayers(throws, teamIdx, team) {
    const fallback = team && team.name ? team.name : `Équipe ${teamIdx + 1}`;
    const byName = new Map();
    const order = normalizePlayers(team && team.players);
    order.forEach(name => byName.set(name, null));
    (throws || []).filter(entry => entry.teamIdx === teamIdx).forEach(entry => {
      const name = entry.player || fallback;
      const current = byName.get(name) || {
        name,
        throws: 0,
        score: 0,
        misses: 0,
        maxThrow: 0,
        overflows: 0,
      };
      current.throws += 1;
      current.score += entry.points || 0;
      if (entry.miss) current.misses += 1;
      if (entry.overflow) current.overflows += 1;
      current.maxThrow = Math.max(current.maxThrow, entry.points || 0);
      byName.set(name, current);
    });
    return Array.from(byName.entries()).map(([name, stats]) => stats || {
      name,
      throws: 0,
      score: 0,
      misses: 0,
      maxThrow: 0,
      overflows: 0,
    });
  }

  // Ordre de passage de la partie suivante (revanche ou manche suivante).
  // rule 'loser'  : la dernière équipe du classement commence ;
  // rule 'rotate' : l'équipe qui suivait la première commence.
  // L'ordre circulaire est toujours conservé.
  function orderTeamsForNextGame(teams, rule, rankedIds) {
    if (!Array.isArray(teams) || teams.length < 2) return teams;
    let starterIdx = 1;
    if (rule === 'loser' && Array.isArray(rankedIds) && rankedIds.length) {
      const loserId = rankedIds[rankedIds.length - 1];
      const found = teams.findIndex(team => team.id === loserId);
      starterIdx = found >= 0 ? found : 1;
    }
    return teams.slice(starterIdx).concat(teams.slice(0, starterIdx));
  }

  function createMatch(teams, winsNeeded, now = Date.now()) {
    if (!winsNeeded || winsNeeded < 2) return null;
    const wins = {};
    teams.forEach((team, index) => {
      wins[team.id !== undefined ? team.id : `t${index + 1}`] = 0;
    });
    return {
      id: now,
      winsNeeded,
      wins,
      manche: 1,
      winnerId: null,
    };
  }

  function recordMancheWin(match, winnerId) {
    if (!match) return null;
    const wins = {
      ...match.wins,
      [winnerId]: (match.wins[winnerId] || 0) + 1,
    };
    const over = wins[winnerId] >= match.winsNeeded;
    return {
      ...match,
      wins,
      winnerId: over ? winnerId : null,
    };
  }

  function nextManche(match) {
    return match ? {
      ...match,
      manche: match.manche + 1,
    } : null;
  }

  return {
    normalizePlayers,
    currentPlayerName,
    summarizePlayers,
    orderTeamsForNextGame,
    createMatch,
    recordMancheWin,
    nextManche,
    normalizeGameRules,
    createInitialGameState,
    createTeamState,
    resetTeamsForNewGame,
    getRecentThrowHistory,
    applyThrowTransition,
    applyMissTransition,
    applyUndoTransition,
    getThrowReaction,
    getMissReaction,
  };
});
