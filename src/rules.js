(function (root, factory) {
  const rules = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = rules;
  }
  root.MolkkyRules = rules;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function calculateThrowScore(pins) {
    if (!Array.isArray(pins) || pins.length === 0) return 0;
    return pins.length === 1 ? pins[0] : pins.length;
  }

  function calculateOverflowPenalty(currentScore, mode) {
    if (mode === '0') return 0;
    if (mode === 'half') return Math.floor(currentScore / 2);
    if (mode === 'none') return null;
    return 25;
  }

  function getNextActiveTeamIndex(teams, currentIndex) {
    if (!Array.isArray(teams) || teams.length === 0) return currentIndex;
    for (let i = 1; i <= teams.length; i += 1) {
      const nextIndex = (currentIndex + i) % teams.length;
      if (!teams[nextIndex].eliminated) return nextIndex;
    }
    return currentIndex;
  }

  function previewScoreAfterThrow(teamScore, throwScore, targetScore, rules) {
    const activeRules = rules || {};
    const afterRaw = teamScore + throwScore;

    if (afterRaw <= targetScore) {
      return {
        overflow: false,
        displayScore: afterRaw,
        label: 'Après',
      };
    }

    if (activeRules.overflowMode === 'none') {
      return {
        overflow: true,
        displayScore: teamScore,
        label: '🚫 Ignoré',
      };
    }

    const mode = activeRules.overflowMode || '25';
    const label = mode === '0' ? '⚠️ → 0' : mode === 'half' ? '⚠️ → moitié' : '⚠️ Dépasse';

    return {
      overflow: true,
      displayScore: calculateOverflowPenalty(afterRaw, mode),
      label,
    };
  }

  function calculateThrowOutcome(team, pins, targetScore, rules) {
    const activeRules = rules || {};
    const score = calculateThrowScore(pins);
    const scoreBefore = Number(team.score) || 0;
    let newScore = scoreBefore + score;
    let overflow = false;
    let penalized = false;
    let overflowStrikes = team.overflowStrikes || 0;

    if (newScore > targetScore) {
      overflow = true;
      if (activeRules.overflowMode === 'none') {
        newScore = scoreBefore;
      } else {
        overflowStrikes += 1;
        if (overflowStrikes > (activeRules.overflowGrace || 0)) {
          newScore = calculateOverflowPenalty(scoreBefore + score, activeRules.overflowMode || '25');
          overflowStrikes = 0;
          penalized = true;
        } else {
          newScore = scoreBefore;
        }
      }
    } else {
      overflowStrikes = 0;
    }

    const updatedTeam = {
      ...team,
      score: newScore,
      misses: overflow ? team.misses : 0,
      overflowStrikes,
      totalThrows: (team.totalThrows || 0) + 1,
      totalScore: (team.totalScore || 0) + score,
      maxThrow: Math.max(team.maxThrow || 0, score),
      overflows: (team.overflows || 0) + (overflow ? 1 : 0),
      history: [...(team.history || []), {
        pins: [...(pins || [])],
        points: score,
        overflow,
        penalized,
      }],
    };

    return {
      score,
      scoreBefore,
      newScore,
      overflow,
      penalized,
      updatedTeam,
    };
  }

  function calculateMissOutcome(team, rules) {
    const activeRules = rules || {};
    const limit = activeRules.missLimit || 3;
    const newMisses = (team.misses || 0) + 1;
    const eliminated = Boolean(activeRules.eliminationOn && newMisses >= limit);
    const updatedTeam = {
      ...team,
      misses: eliminated ? team.misses : newMisses,
      eliminated,
      totalThrows: (team.totalThrows || 0) + 1,
      history: [...(team.history || []), {
        pins: [],
        points: 0,
        miss: true,
      }],
    };

    return {
      limit,
      newMisses,
      eliminated,
      updatedTeam,
    };
  }

  return {
    calculateThrowScore,
    calculateOverflowPenalty,
    getNextActiveTeamIndex,
    previewScoreAfterThrow,
    calculateThrowOutcome,
    calculateMissOutcome,
  };
});
