(function (root, factory) {
  const setupScreens = factory(root.React, root.MolkkyConstants, root.MolkkyComponents, root.MolkkyDialogs, root.MolkkyRules);

  if (typeof module === 'object' && module.exports) {
    module.exports = setupScreens;
  }

  root.MolkkySetupScreens = setupScreens;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (React, constants, components, dialogs, rules) {
  const { useState, useRef } = React;
  const { TEAM_COLORS } = constants;
  const { ChipSelect, Toggle, Icon } = components;
  const h = React ? React.createElement : null;
  const { RulePopup } = dialogs;
  const { clampHandicap, maxHandicapFor, overflowResetScore } = rules;
  const MAX_PLAYERS = 6;

  // Première couleur non utilisée (évite deux équipes de la même couleur).
  function nextFreeColor(teams) {
    const used = new Set(teams.map(team => team.color));
    return TEAM_COLORS.find(color => !used.has(color)) || TEAM_COLORS[teams.length % TEAM_COLORS.length];
  }

  function normalizeName(name) {
    return String(name || '').trim().toLocaleLowerCase('fr-FR');
  }

  function findDuplicateNames(teams) {
    const seen = new Set();
    const duplicates = new Set();
    teams.forEach(team => {
      const key = normalizeName(team.name);
      if (!key) return;
      if (seen.has(key)) duplicates.add(key);
      seen.add(key);
    });
    return duplicates;
  }

  function HelpBtn({
    ruleKey,
    onOpen
  }) {
    return h("button", {
      type: "button",
      className: "help-btn",
      "aria-label": "Afficher l'aide sur cette r\xE8gle",
      onClick: () => onOpen(ruleKey)
    }, h(Icon, {
      name: "help"
    }));
  }

function SetupScreen({
  onBack,
  onStart,
  lastSetup = null,
  knownNames = []
}) {
  // Réglages par défaut, ou ceux de la dernière partie lancée.
  function defaultTeams() {
    return [{
      id: 1,
      name: 'Équipe 1',
      color: TEAM_COLORS[0],
      handicap: 0,
      players: []
    }, {
      id: 2,
      name: 'Équipe 2',
      color: TEAM_COLORS[1],
      handicap: 0,
      players: []
    }];
  }
  function teamsFromLastSetup(setup) {
    const result = [];
    setup.teams.slice(0, 6).forEach((team, index) => {
      const colorOk = TEAM_COLORS.includes(team.color) && !result.some(t => t.color === team.color);
      result.push({
        id: index + 1,
        name: team.name,
        color: colorOk ? team.color : nextFreeColor(result),
        handicap: clampHandicap(team.handicap, setup.targetScore || 50),
        players: Array.isArray(team.players) ? team.players.filter(p => typeof p === 'string' && p.trim()).slice(0, MAX_PLAYERS) : []
      });
    });
    return result;
  }
  const initial = lastSetup || {};
  const [gameLabel, setGameLabel] = useState('');
  const nextId = useRef(lastSetup ? lastSetup.teams.length + 1 : 3);
  const [teams, setTeams] = useState(() => lastSetup ? teamsFromLastSetup(lastSetup) : defaultTeams());
  const [targetScore, setTargetScoreRaw] = useState(initial.targetScore || 50);
  const setTargetScore = value => {
    setTargetScoreRaw(value);
    setTeams(t => t.map(team => ({
      ...team,
      handicap: clampHandicap(team.handicap, value)
    })));
  };
  const [eliminationOn, setEliminationOn] = useState(initial.eliminationOn !== undefined ? initial.eliminationOn : true);
  const [missLimit, setMissLimit] = useState(initial.missLimit || 3);
  const [overflowGrace, setOverflowGrace] = useState(initial.overflowGrace || 0);
  const [overflowMode, setOverflowMode] = useState(initial.overflowMode || '25');
  const [format, setFormat] = useState(initial.format || 1);
  const [startRule, setStartRule] = useState(initial.startRule || 'loser');
  const [drafts, setDrafts] = useState({});
  const [popup, setPopup] = useState(null);
  function resetAll() {
    nextId.current = 3;
    setTeams(defaultTeams());
    setTargetScoreRaw(50);
    setEliminationOn(true);
    setMissLimit(3);
    setOverflowGrace(0);
    setOverflowMode('25');
    setFormat(1);
    setStartRule('loser');
    setDrafts({});
    setGameLabel('');
  }
  const addTeam = () => {
    if (teams.length >= 6) return;
    const id = nextId.current++;
    setTeams(t => [...t, {
      id,
      name: `Équipe ${t.length + 1}`,
      color: nextFreeColor(t),
      handicap: 0,
      players: []
    }]);
  };
  function addPlayer(teamId) {
    const name = String(drafts[teamId] || '').trim();
    if (!name) return;
    setTeams(t => t.map(team => team.id === teamId && team.players.length < MAX_PLAYERS && !team.players.some(p => p.toLocaleLowerCase('fr-FR') === name.toLocaleLowerCase('fr-FR')) ? {
      ...team,
      players: [...team.players, name]
    } : team));
    setDrafts(d => ({
      ...d,
      [teamId]: ''
    }));
  }
  function removePlayer(teamId, index) {
    setTeams(t => t.map(team => team.id === teamId ? {
      ...team,
      players: team.players.filter((_, i) => i !== index)
    } : team));
  }
  const removeTeam = i => {
    if (teams.length <= 2) return;
    setTeams(t => t.filter((_, idx) => idx !== i));
  };
  const moveTeam = (from, direction) => {
    const to = from + direction;
    if (to < 0 || to >= teams.length) return;
    setTeams(t => {
      const next = [...t];
      const [team] = next.splice(from, 1);
      next.splice(to, 0, team);
      return next;
    });
  };
  const updateName = (i, name) => setTeams(t => t.map((team, idx) => idx === i ? {
    ...team,
    name
  } : team));
  const updateHandicap = (i, h) => setTeams(t => t.map((team, idx) => idx === i ? {
    ...team,
    handicap: clampHandicap(h, targetScore)
  } : team));
  const duplicateNames = findDuplicateNames(teams);
  const hasEmptyName = teams.some(t => t.name.trim().length === 0);
  const canStart = !hasEmptyName && duplicateNames.size === 0;
  const maxHandicap = maxHandicapFor(targetScore);
  const resetScore = overflowResetScore(targetScore);
  const overflowDesc = {
    '25': targetScore === 50 ? 'Le score retombe à 25, la moitié de la cible. C’est la règle officielle.' : `Le score retombe à ${resetScore}, la moitié de la cible.`,
    '0': 'Le score retombe à 0. Mode sévère.',
    'half': 'Le score retombe à la moitié.',
    'none': 'Le lancer est ignoré. Mode débutant.'
  };
  return h("div", {
    className: "screen"
  }, popup && h(RulePopup, {
    rule: popup,
    onClose: () => setPopup(null)
  }), h("div", {
    className: "topbar"
  }, h("button", {
    type: "button",
    className: "icon-btn",
    "aria-label": "Retour \xE0 l'accueil",
    onClick: onBack
  }, h(Icon, {
    name: "back",
    size: 24
  })), h("div", {
    className: "topbar-title"
  }, "Nouvelle partie"), h("button", {
    type: "button",
    className: "icon-btn",
    "aria-label": "Remettre les r\xE9glages par d\xE9faut",
    title: "R\xE9glages par d\xE9faut",
    onClick: resetAll
  }, h(Icon, {
    name: "refresh",
    size: 22
  }))), h("datalist", {
    id: "known-names"
  }, knownNames.map(name => h("option", {
    key: name,
    value: name
  }))), h("div", {
    className: "scroll setup-scroll"
  }, lastSetup && h("p", {
    className: "setup-memo"
  }, "R\xE9glages de la derni\xE8re partie repris. ", h("button", {
    type: "button",
    className: "link-btn",
    onClick: resetAll
  }, "Tout remettre \xE0 z\xE9ro")), h("section", {
    className: "section"
  }, h("h2", {
    className: "section-title"
  }, "\xC9quipes"), h("p", {
    className: "section-note"
  }, "Dans l'ordre de passage. 2 \xE0 6 \xE9quipes."), h("div", {
    className: "team-list"
  }, teams.map((team, i) => h("div", {
    key: team.id || i,
    className: "team-item setup-team-row"
  }, h("div", {
    className: "team-line"
  }, h("span", {
    className: "team-color-dot",
    style: {
      background: team.color
    }
  }), h("input", {
    className: "field",
    type: "text",
    value: team.name,
    placeholder: `Équipe ${i + 1}`,
    "aria-label": `Nom de l'équipe ${i + 1}`,
    "aria-invalid": duplicateNames.has(normalizeName(team.name)) || !team.name.trim(),
    maxLength: 30,
    list: "known-names",
    autoComplete: "off",
    onChange: e => updateName(i, e.target.value)
  }), h("div", {
    className: "order-btns"
  }, h("button", {
    type: "button",
    className: "order-btn",
    disabled: i === 0,
    "aria-label": `Monter ${team.name || `l'équipe ${i + 1}`}`,
    onClick: () => moveTeam(i, -1)
  }, h(Icon, {
    name: "up",
    size: 18
  })), h("button", {
    type: "button",
    className: "order-btn",
    disabled: i === teams.length - 1,
    "aria-label": `Descendre ${team.name || `l'équipe ${i + 1}`}`,
    onClick: () => moveTeam(i, 1)
  }, h(Icon, {
    name: "down",
    size: 18
  }))), h("button", {
    type: "button",
    className: "remove-btn",
    disabled: teams.length <= 2,
    "aria-label": `Supprimer ${team.name || `l'équipe ${i + 1}`}`,
    onClick: () => removeTeam(i)
  }, h(Icon, {
    name: "x",
    size: 18
  }))), h("div", {
    className: "team-handicap"
  }, h("span", {
    className: "team-handicap-label"
  }, "Handicap", h(HelpBtn, {
    ruleKey: "handicap",
    onOpen: setPopup
  })), h("div", {
    className: "stepper"
  }, h("button", {
    type: "button",
    className: "stepper-btn",
    "aria-label": `Diminuer le handicap de ${team.name}`,
    disabled: team.handicap <= 0,
    onClick: () => updateHandicap(i, team.handicap - 5)
  }, h(Icon, {
    name: "minus",
    size: 18
  })), h("span", {
    className: `stepper-value ${team.handicap > 0 ? 'num' : 'is-zero'}`
  }, team.handicap > 0 ? `+${team.handicap} pts` : 'Aucun'), h("button", {
    type: "button",
    className: "stepper-btn",
    "aria-label": `Augmenter le handicap de ${team.name}`,
    disabled: team.handicap >= maxHandicap,
    onClick: () => updateHandicap(i, team.handicap + 5)
  }, h(Icon, {
    name: "plus",
    size: 18
  })))), h("div", {
    className: "team-players"
  }, team.players.map((player, pi) => h("span", {
    key: `${player}-${pi}`,
    className: "player-chip"
  }, h("span", {
    className: "player-chip-order num"
  }, pi + 1), player, h("button", {
    type: "button",
    className: "player-chip-remove",
    "aria-label": `Retirer ${player} de ${team.name}`,
    onClick: () => removePlayer(team.id, pi)
  }, h(Icon, {
    name: "x",
    size: 14
  })))), team.players.length < MAX_PLAYERS && h("form", {
    className: "player-add",
    onSubmit: e => {
      e.preventDefault();
      addPlayer(team.id);
    }
  }, h("input", {
    className: "field field-sm",
    type: "text",
    value: drafts[team.id] || '',
    placeholder: team.players.length ? 'Joueur suivant' : 'Ajouter un joueur (facultatif)',
    "aria-label": `Ajouter un joueur à ${team.name}`,
    maxLength: 24,
    list: "known-names",
    autoComplete: "off",
    enterKeyHint: "done",
    onChange: e => {
      const value = e.target.value;
      setDrafts(d => ({
        ...d,
        [team.id]: value
      }));
    }
  }), h("button", {
    type: "submit",
    className: "stepper-btn",
    "aria-label": `Valider le joueur pour ${team.name}`,
    disabled: !String(drafts[team.id] || '').trim()
  }, h(Icon, {
    name: "plus",
    size: 18
  }))))))), duplicateNames.size > 0 && h("div", {
    className: "field-error",
    role: "alert"
  }, "Deux \xE9quipes portent le m\xEAme nom. Renomme-en une pour d\xE9marrer."), teams.length < 6 && h("button", {
    type: "button",
    className: "btn btn-secondary btn-block add-team",
    onClick: addTeam
  }, h(Icon, {
    name: "plus"
  }), "Ajouter une \xE9quipe")), h("section", {
    className: "section"
  }, h("h2", {
    className: "section-title"
  }, "Score cible"), h(ChipSelect, {
    label: "Score cible",
    value: targetScore,
    onChange: setTargetScore,
    options: [{
      value: 30,
      label: '30'
    }, {
      value: 40,
      label: '40'
    }, {
      value: 50,
      label: '50 (officiel)'
    }, {
      value: 75,
      label: '75'
    }]
  })), h("section", {
    className: "section"
  }, h("div", {
    className: "setting-head"
  }, h("h2", {
    className: "section-title",
    style: {
      marginBottom: 0
    }
  }, "\xC9limination par rat\xE9s", h(HelpBtn, {
    ruleKey: "elimination",
    onOpen: setPopup
  })), h(Toggle, {
    value: eliminationOn,
    onChange: setEliminationOn,
    label: "Activer l'\xE9limination par rat\xE9s"
  })), h("p", {
    className: "setting-desc"
  }, eliminationOn ? `Une équipe est éliminée après ${missLimit} ratés de suite.` : "Les ratés n'éliminent personne."), eliminationOn && h(ChipSelect, {
    label: "Nombre de rat\xE9s avant \xE9limination",
    value: missLimit,
    onChange: setMissLimit,
    options: [{
      value: 2,
      label: '2 (expert)'
    }, {
      value: 3,
      label: '3 (officiel)'
    }, {
      value: 4,
      label: '4 (famille)'
    }]
  })), h("section", {
    className: "section"
  }, h("div", {
    className: "setting-head"
  }, h("h2", {
    className: "section-title",
    style: {
      marginBottom: 0
    }
  }, "D\xE9passement de la cible", h(HelpBtn, {
    ruleKey: "overflow",
    onOpen: setPopup
  }))), h("p", {
    className: "setting-desc"
  }, overflowDesc[overflowMode]), h(ChipSelect, {
    label: "Pénalité de dépassement",
    value: overflowMode,
    onChange: setOverflowMode,
    options: [{
      value: '25',
      label: `Retombe à ${resetScore}`
    }, {
      value: '0',
      label: 'Retombe à 0'
    }, {
      value: 'half',
      label: 'Moitié'
    }, {
      value: 'none',
      label: 'Rien'
    }]
  }), overflowMode !== 'none' && h("div", null, h("div", {
    className: "setting-sub"
  }, "Essais de gr\xE2ce avant la p\xE9nalit\xE9"), h(ChipSelect, {
    label: "Essais de gr\xE2ce",
    value: overflowGrace,
    onChange: setOverflowGrace,
    options: [{
      value: 0,
      label: 'Aucun'
    }, {
      value: 1,
      label: '+1 essai'
    }, {
      value: 2,
      label: '+2 essais'
    }, {
      value: 3,
      label: '+3 essais'
    }]
  }))), h("section", {
    className: "section"
  }, h("h2", {
    className: "section-title"
  }, "Format"), h(ChipSelect, {
    label: "Format de la partie",
    value: format,
    onChange: setFormat,
    options: [{
      value: 1,
      label: 'Partie simple'
    }, {
      value: 2,
      label: '2 manches gagnantes'
    }, {
      value: 3,
      label: '3 manches gagnantes'
    }]
  }), h("div", {
    className: "setting-sub"
  }, format > 1 ? 'Qui commence la manche suivante ?' : 'Qui commence la revanche ?'), h(ChipSelect, {
    label: "Qui commence la partie suivante",
    value: startRule,
    onChange: setStartRule,
    options: [{
      value: 'loser',
      label: 'Le dernier du classement'
    }, {
      value: 'rotate',
      label: 'Chacun son tour'
    }]
  })), h("section", {
    className: "section"
  }, h("h2", {
    className: "section-title"
  }, "Nom de la partie"), h("input", {
    className: "field",
    type: "text",
    value: gameLabel,
    placeholder: "Facultatif, ex. Finale du barbecue",
    "aria-label": "Nom de la partie",
    maxLength: 60,
    onChange: e => setGameLabel(e.target.value)
  }), h("div", {
    className: "field-hint"
  }, "Il appara\xEEtra dans l'historique."))), h("div", {
    className: "start-bar"
  }, h("button", {
    type: "button",
    className: "btn btn-primary btn-block btn-lg",
    disabled: !canStart,
    onClick: () => onStart(teams.map(team => ({
      ...team,
      name: team.name.trim(),
      // Un joueur tapé mais pas encore validé est ajouté au démarrage.
      players: String(drafts[team.id] || '').trim() && team.players.length < MAX_PLAYERS ? [...team.players, String(drafts[team.id]).trim()] : team.players
    })), targetScore, {
      eliminationOn,
      missLimit,
      overflowGrace,
      overflowMode
    }, gameLabel.trim(), {
      format,
      startRule
    })
  }, "D\xE9marrer la partie")));
}

  return {
    SetupScreen,
  };
});
