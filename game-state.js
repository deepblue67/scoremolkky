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

  function createTeamState(team, targetScore) {
    // Garde-fou : un handicap ne peut jamais atteindre ou dépasser le score cible.
    const rawHandicap = Math.max(0, Number(team.handicap) || 0);
    const handicap = targetScore ? Math.min(rawHandicap, targetScore - 1) : rawHandicap;
    return {
      ...team,
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
  }) {
    return {
      gameLabel,
      teams: teams.map(team => createTeamState(team, targetScore)),
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
    const outcome = calculateThrowOutcome(team, selectedPins, targetScore, activeRules);
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
    const outcome = calculateMissOutcome(team, activeRules);
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
        message: '\uD83D\uDCA5 D\u00E9passement \u2014 lancer annul\u00E9',
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
      message: activeRules.eliminationOn ? `\u274C Rat\u00E9 ! (${newMisses}/${limit})` : '\u274C Rat\u00E9 !',
    };
  }

  return {
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
