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
  const { clampHandicap, maxHandicapFor } = rules;

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
  onStart
}) {
  const [gameLabel, setGameLabel] = useState('');
  const nextId = useRef(3);
  const [teams, setTeams] = useState([{
    id: 1,
    name: 'Équipe 1',
    color: TEAM_COLORS[0],
    handicap: 0
  }, {
    id: 2,
    name: 'Équipe 2',
    color: TEAM_COLORS[1],
    handicap: 0
  }]);
  const [targetScore, setTargetScoreRaw] = useState(50);
  const setTargetScore = value => {
    setTargetScoreRaw(value);
    setTeams(t => t.map(team => ({
      ...team,
      handicap: clampHandicap(team.handicap, value)
    })));
  };
  const [eliminationOn, setEliminationOn] = useState(true);
  const [missLimit, setMissLimit] = useState(3);
  const [overflowGrace, setOverflowGrace] = useState(0);
  const [overflowMode, setOverflowMode] = useState('25');
  const [popup, setPopup] = useState(null);
  const addTeam = () => {
    if (teams.length >= 6) return;
    const id = nextId.current++;
    setTeams(t => [...t, {
      id,
      name: `Équipe ${t.length + 1}`,
      color: nextFreeColor(t),
      handicap: 0
    }]);
  };
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
  const overflowDesc = {
    '25': 'Le score retombe à 25. C’est la règle officielle.',
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
  }, "Nouvelle partie"), h("span", null)), h("div", {
    className: "scroll setup-scroll"
  }, h("section", {
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
      label: 'Retombe à 25'
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
    onClick: () => onStart(teams, targetScore, {
      eliminationOn,
      missLimit,
      overflowGrace,
      overflowMode
    }, gameLabel.trim())
  }, "D\xE9marrer la partie")));
}

  return {
    SetupScreen,
  };
});
