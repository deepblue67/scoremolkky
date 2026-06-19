(function (root, factory) {
  const setupScreens = factory(root.React, root.MolkkyConstants, root.MolkkyComponents, root.MolkkyDialogs);

  if (typeof module === 'object' && module.exports) {
    module.exports = setupScreens;
  }

  root.MolkkySetupScreens = setupScreens;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (React, constants, components, dialogs) {
  const { useState } = React;
  const { TEAM_COLORS } = constants;
  const { ChipSelect, Toggle } = components;
  const { RulePopup } = dialogs;

function SetupScreen({
  onBack,
  onStart
}) {
  const [gameLabel, setGameLabel] = useState('');
  const [teams, setTeams] = useState([{
    name: 'Équipe 1',
    color: TEAM_COLORS[0],
    handicap: 0
  }, {
    name: 'Équipe 2',
    color: TEAM_COLORS[1],
    handicap: 0
  }]);
  const [targetScore, setTargetScore] = useState(50);
  const [eliminationOn, setEliminationOn] = useState(true);
  const [missLimit, setMissLimit] = useState(3);
  const [overflowGrace, setOverflowGrace] = useState(0);
  const [overflowMode, setOverflowMode] = useState('25');
  const [popup, setPopup] = useState(null);
  const addTeam = () => {
    if (teams.length >= 6) return;
    setTeams(t => [...t, {
      name: `Équipe ${t.length + 1}`,
      color: TEAM_COLORS[t.length],
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
    handicap: Math.max(0, Math.min(targetScore - 1, Number(h) || 0))
  } : team));
  const canStart = teams.every(t => t.name.trim().length > 0);
  const HelpBtn = ({
    ruleKey
  }) => React.createElement("button", {
    type: "button",
    "aria-label": "Afficher l'aide sur cette r\xE8gle",
    onClick: () => setPopup(ruleKey),
    style: {
      background: 'rgba(45,80,22,0.12)',
      border: 'none',
      borderRadius: '50%',
      width: '22px',
      height: '22px',
      cursor: 'pointer',
      color: '#2d5016',
      fontWeight: '900',
      fontSize: '13px',
      display: 'inline-flex',
      alignItems: 'center',
      justifyContent: 'center',
      flexShrink: 0
    }
  }, "?");
  const overflowDesc = {
    '25': 'Retombe à 25 (règle officielle)',
    '0': 'Retombe à 0 (mode sévère)',
    'half': 'Retombe à la moitié du score',
    'none': 'Rien ne se passe (mode débutant)'
  };
  return React.createElement("div", {
    className: "screen"
  }, popup && React.createElement(RulePopup, {
    rule: popup,
    onClose: () => setPopup(null)
  }), React.createElement("div", {
    className: "app-header"
  }, React.createElement("button", {
    className: "header-btn",
    "aria-label": "Retour \xE0 l'accueil",
    onClick: onBack
  }, "\u2190 Retour"), React.createElement("div", {
    className: "app-title"
  }, "Nouvelle partie"), React.createElement("div", {
    style: {
      width: '70px'
    }
  })), React.createElement("div", {
    className: "scroll-content setup-scroll"
  }, React.createElement("div", {
    className: "card"
  }, React.createElement("div", {
    className: "card-title"
  }, "\uD83C\uDFB2 Partie"), React.createElement("input", {
    className: "input-field",
    type: "text",
    value: gameLabel,
    placeholder: "Ex. Finale barbecue, manche 2...",
    "aria-label": "Nom de la partie",
    maxLength: 60,
    onChange: e => setGameLabel(e.target.value)
  }), React.createElement("div", {
    className: "field-hint"
  }, "Optionnel. Ce libell\xE9 sera visible dans l'historique.")), React.createElement("div", {
    className: "card"
  }, React.createElement("div", {
    className: "card-title"
  }, "\uD83D\uDC65 \xC9quipes"), teams.map((team, i) => React.createElement("div", {
    key: i,
    className: "setup-team-row",
    style: {
      marginBottom: '12px'
    }
  }, React.createElement("div", {
    className: "team-input-wrap",
    style: {
      marginBottom: '6px'
    }
  }, React.createElement("div", {
    className: "team-color-dot",
    style: {
      background: team.color
    }
  }), React.createElement("div", {
    className: "team-order-badge"
  }, i + 1), React.createElement("input", {
    className: "input-field",
    type: "text",
    value: team.name,
    placeholder: `Équipe ${i + 1}`,
    "aria-label": `Nom de l'équipe ${i + 1}`,
    onChange: e => updateName(i, e.target.value)
  }), React.createElement("div", {
    className: "team-order-controls"
  }, React.createElement("button", {
    type: "button",
    className: "order-btn",
    disabled: i === 0,
    "aria-label": `Monter ${team.name || `l'équipe ${i + 1}`}`,
    onClick: () => moveTeam(i, -1)
  }, "\u2191"), React.createElement("button", {
    type: "button",
    className: "order-btn",
    disabled: i === teams.length - 1,
    "aria-label": `Descendre ${team.name || `l'équipe ${i + 1}`}`,
    onClick: () => moveTeam(i, 1)
  }, "\u2193")), teams.length > 2 && React.createElement("button", {
    type: "button",
    className: "remove-btn",
    "aria-label": `Supprimer ${team.name || `l'équipe ${i + 1}`}`,
    onClick: () => removeTeam(i)
  }, "\xD7")), React.createElement("div", {
    className: "team-handicap-row",
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      paddingLeft: '30px'
    }
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }
  }, React.createElement("span", {
    style: {
      fontSize: '11px',
      fontWeight: '800',
      color: '#7a6a5a',
      letterSpacing: '0.5px'
    }
  }, "\u2696\uFE0F Handicap"), React.createElement(HelpBtn, {
    ruleKey: "handicap"
  })), React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginLeft: 'auto'
    }
  }, React.createElement("button", {
    type: "button",
    "aria-label": `Diminuer le handicap de ${team.name}`,
    onClick: () => updateHandicap(i, team.handicap - 5),
    style: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      border: '1.5px solid rgba(45,80,22,0.25)',
      background: 'transparent',
      color: '#2d5016',
      fontSize: '16px',
      fontWeight: '900',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1
    }
  }, "\u2212"), React.createElement("div", {
    style: {
      minWidth: '52px',
      textAlign: 'center',
      fontFamily: "'Fredoka One',cursive",
      fontSize: '16px',
      color: team.handicap > 0 ? '#2d5016' : '#bbb'
    }
  }, team.handicap > 0 ? `+${team.handicap} pts` : 'Aucun'), React.createElement("button", {
    type: "button",
    "aria-label": `Augmenter le handicap de ${team.name}`,
    onClick: () => updateHandicap(i, team.handicap + 5),
    style: {
      width: '28px',
      height: '28px',
      borderRadius: '50%',
      border: '1.5px solid rgba(45,80,22,0.25)',
      background: 'transparent',
      color: '#2d5016',
      fontSize: '16px',
      fontWeight: '900',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      lineHeight: 1
    }
  }, "+"))))), teams.length < 6 && React.createElement("button", {
    className: "btn btn-ghost btn-sm",
    onClick: addTeam,
    style: {
      marginTop: '4px'
    }
  }, "+ Ajouter une \xE9quipe")), React.createElement("div", {
    className: "card"
  }, React.createElement("div", {
    className: "card-title"
  }, "\uD83C\uDFAF Score cible"), React.createElement(ChipSelect, {
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
  })), React.createElement("div", {
    className: "card"
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: eliminationOn ? '12px' : '0'
    }
  }, React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    style: {
      fontFamily: "'Fredoka One',cursive",
      fontSize: '16px',
      color: '#2d5016',
      display: 'flex',
      alignItems: 'center',
      gap: '6px'
    }
  }, "\u274C \xC9limination par rat\xE9s ", React.createElement(HelpBtn, {
    ruleKey: "elimination"
  })), React.createElement("div", {
    style: {
      fontSize: '12px',
      color: '#7a6a5a',
      marginTop: '3px'
    }
  }, eliminationOn ? `Éliminé après ${missLimit} raté${missLimit > 1 ? 's' : ''} consécutif${missLimit > 1 ? 's' : ''}` : "Les ratés n'éliminent pas")), React.createElement(Toggle, {
    value: eliminationOn,
    onChange: setEliminationOn,
    label: "Activer l'\xE9limination par rat\xE9s"
  })), eliminationOn && React.createElement("div", null, React.createElement("div", {
    style: {
      fontSize: '12px',
      color: '#7a6a5a',
      marginBottom: '8px'
    }
  }, "Nombre de rat\xE9s avant \xE9limination :"), React.createElement(ChipSelect, {
    value: missLimit,
    onChange: setMissLimit,
    options: [{
      value: 2,
      label: '2 — Expert'
    }, {
      value: 3,
      label: '3 — Officiel'
    }, {
      value: 4,
      label: '4 — Famille'
    }]
  }))), React.createElement("div", {
    className: "card"
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '6px',
      marginBottom: '4px'
    }
  }, React.createElement("span", {
    style: {
      fontFamily: "'Fredoka One',cursive",
      fontSize: '16px',
      color: '#2d5016'
    }
  }, "\uD83D\uDCA5 D\xE9passement du score cible"), React.createElement(HelpBtn, {
    ruleKey: "overflow"
  })), React.createElement("div", {
    style: {
      fontSize: '12px',
      color: '#7a6a5a',
      marginBottom: '10px'
    }
  }, overflowDesc[overflowMode]), React.createElement(ChipSelect, {
    value: overflowMode,
    onChange: setOverflowMode,
    options: [{
      value: '25',
      label: '→ 25 pts'
    }, {
      value: '0',
      label: '→ 0 pt'
    }, {
      value: 'half',
      label: '→ Moitié'
    }, {
      value: 'none',
      label: 'Rien'
    }]
  }), overflowMode !== 'none' && React.createElement("div", {
    style: {
      marginTop: '12px'
    }
  }, React.createElement("div", {
    style: {
      fontSize: '12px',
      color: '#7a6a5a',
      marginBottom: '8px'
    }
  }, "Essais de gr\xE2ce avant p\xE9nalit\xE9 :"), React.createElement(ChipSelect, {
    value: overflowGrace,
    onChange: setOverflowGrace,
    options: [{
      value: 0,
      label: '0 — Immédiat'
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
  }))), React.createElement("button", {
    className: "btn btn-primary btn-full btn-lg",
    disabled: !canStart,
    onClick: () => onStart(teams, targetScore, {
      eliminationOn,
      missLimit,
      overflowGrace,
      overflowMode
    }, gameLabel.trim())
  }, "\uD83C\uDFC1 D\xE9marrer !")));
}

  return {
    SetupScreen,
  };
});
