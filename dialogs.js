(function (root, factory) {
  const dialogs = factory(root.React);
  if (typeof module === 'object' && module.exports) {
    module.exports = dialogs;
  }
  root.MolkkyDialogs = dialogs;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (React) {
function RulePopup({
  rule,
  onClose
}) {
  const rules = {
    elimination: {
      title: '❌ Élimination par ratés',
      color: '#e74c3c',
      icon: '🚫',
      content: [{
        heading: 'La règle',
        text: 'Un joueur qui rate N lancers consécutifs est éliminé. Tu choisis N avant la partie.'
      }, {
        heading: "Qu'est-ce qu'un raté ?",
        text: "Aucune quille renversée. Le compteur repart à zéro dès qu'une quille tombe."
      }, {
        heading: '2 ratés',
        text: 'Mode expert — punit sévèrement les erreurs.'
      }, {
        heading: '3 ratés',
        text: 'Règle officielle — équilibre entre indulgence et rigueur.'
      }, {
        heading: '4 ratés',
        text: 'Mode famille — parfait avec des enfants ou débutants.'
      }, {
        heading: 'Sans élimination',
        text: 'Les ratés ne font rien. Personne ne peut être éliminé.'
      }]
    },
    overflow: {
      title: '💥 Dépassement du score cible',
      color: '#f39c12',
      icon: '⚠️',
      content: [{
        heading: 'Le principe',
        text: "Si un joueur dépasse le score cible, il est pénalisé selon la règle choisie."
      }, {
        heading: 'Retombe à 25 (officiel)',
        text: 'Le score est ramené à 25 — moitié de 50. La règle officielle Mölkky.'
      }, {
        heading: 'Retombe à 0',
        text: "Mode sévère : le joueur repart de zéro. Plus de tension en fin de partie."
      }, {
        heading: 'Retombe à la moitié',
        text: "Le score est divisé par 2. Pénalité proportionnelle au score du joueur."
      }, {
        heading: 'Rien ne se passe',
        text: "Mode débutant : dépasser ne coûte rien, on ignore le lancer et on recommence."
      }]
    },
    handicap: {
      title: '🎯 Handicap de départ',
      color: '#3498db',
      icon: '⚖️',
      content: [{
        heading: 'Le principe',
        text: "Un joueur moins expérimenté commence avec des points d'avance."
      }, {
        heading: 'Comment ça marche',
        text: "Le joueur avec handicap démarre à X points. Il doit atteindre 50 comme les autres, mais depuis une position avancée."
      }, {
        heading: 'Exemple',
        text: "Handicap 10 → le joueur commence à 10 pts. Il n'a besoin que de 40 pts supplémentaires."
      }, {
        heading: 'Équilibre',
        text: "Idéal pour mélanger adultes et enfants, ou joueurs de niveaux différents, sans frustrer personne."
      }]
    }
  };
  const r = rules[rule];
  if (!r) return null;
  return React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,0.65)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    },
    onClick: onClose
  }, React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "rule-dialog-title",
    style: {
      background: '#fff',
      borderRadius: '24px 24px 0 0',
      padding: '24px 20px 32px',
      width: '100%',
      maxWidth: '480px',
      maxHeight: '80vh',
      overflowY: 'auto',
      animation: 'slideUp 0.3s ease'
    },
    onClick: e => e.stopPropagation()
  }, React.createElement("style", null, `@keyframes slideUp{from{transform:translateY(100%)}to{transform:translateY(0)}}`), React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      marginBottom: '18px'
    }
  }, React.createElement("span", {
    style: {
      fontSize: '28px'
    }
  }, r.icon), React.createElement("span", {
    id: "rule-dialog-title",
    style: {
      fontFamily: "'Fredoka One',cursive",
      fontSize: '18px',
      color: r.color,
      flex: 1
    }
  }, r.title), React.createElement("button", {
    type: "button",
    "aria-label": "Fermer l'aide",
    onClick: onClose,
    style: {
      background: '#f0f0f0',
      border: 'none',
      borderRadius: '50%',
      width: '32px',
      height: '32px',
      fontSize: '16px',
      cursor: 'pointer',
      fontWeight: '900',
      color: '#666'
    }
  }, "\xD7")), r.content.map((b, i) => React.createElement("div", {
    key: i,
    style: {
      marginBottom: '14px'
    }
  }, React.createElement("div", {
    style: {
      fontWeight: '900',
      color: '#2d5016',
      fontSize: '14px',
      marginBottom: '4px'
    }
  }, b.heading), React.createElement("div", {
    style: {
      fontSize: '14px',
      color: '#4a3a2a',
      lineHeight: '1.6'
    }
  }, b.text))), React.createElement("button", {
    className: "btn btn-primary btn-full",
    onClick: onClose,
    style: {
      marginTop: '8px'
    }
  }, "Compris !")));
}

function EventPopup({
  popup,
  onClose
}) {
  const {
    type,
    teamName,
    teamColor,
    data
  } = popup;
  const cfgs = {
    overflow_penalized: {
      emoji: '💥',
      bg: 'linear-gradient(135deg,#fff5e6,#ffe0b0)',
      border: '#f39c12',
      titleColor: '#c0780a',
      title: `${teamName} — dépassement pénalisé !`,
      lines: [{
        icon: '🎯',
        text: `Score visé : ${data.targetScore} pts`
      }, {
        icon: '📈',
        text: `Score atteint : ${data.scoreBefore} pts — dépassement !`
      }, {
        icon: '📉',
        text: `Nouveau score : ${data.newScore} pts`
      }],
      explanation: data.mode === '0' ? `Score ramené à 0 — mode sévère !` : data.mode === 'half' ? `Score divisé par 2 — pénalité proportionnelle.` : `En Mölkky, dépasser le score cible ramène à 25. Mieux vaut être précis qu'ambitieux !`,
      tip: `💡 Il faut maintenant marquer exactement ${data.targetScore - data.newScore} pts.`
    },
    overflow_grace: {
      emoji: '⚠️',
      bg: 'linear-gradient(135deg,#fffde6,#fff9c4)',
      border: '#f1c40f',
      titleColor: '#b7860a',
      title: `Dépassement pour ${teamName} !`,
      lines: [{
        icon: '📈',
        text: `${data.scoreBefore} + ${data.score} = ${data.scoreBefore + data.score} pts`
      }, {
        icon: '🎯',
        text: `Score cible : ${data.targetScore} pts — dépassé !`
      }, {
        icon: '🔁',
        text: `Essais de grâce restants : ${data.remaining} sur ${data.graceTotal}`
      }],
      explanation: `${data.graceTotal} essai${data.graceTotal > 1 ? 's' : ''} de grâce avant pénalité.`,
      tip: data.remaining > 0 ? `💡 Encore ${data.remaining} essai${data.remaining > 1 ? 's' : ''} !` : `⚠️ C'était le dernier essai !`
    },
    eliminated: {
      emoji: '❌',
      bg: 'linear-gradient(135deg,#fff0f0,#ffd6d6)',
      border: '#e74c3c',
      titleColor: '#c0392b',
      title: `${teamName} est éliminé(e) !`,
      lines: [{
        icon: '❌',
        text: `${data.misses} ratés consécutifs`
      }, {
        icon: '🚫',
        text: `${teamName} ne peut plus jouer`
      }],
      explanation: `Un joueur qui rate ${data.limit || 3} lancers de suite est éliminé. Un raté = aucune quille renversée. Le compteur repart à zéro dès qu'une quille tombe.`,
      tip: `💡 Les autres joueurs continuent jusqu'à la victoire.`
    }
  };
  const cfg = cfgs[type];
  if (!cfg) return null;
  return React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 3000,
      background: 'rgba(0,0,0,0.6)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    },
    onClick: onClose
  }, React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "event-dialog-title",
    style: {
      background: cfg.bg,
      border: `3px solid ${cfg.border}`,
      borderRadius: '24px 24px 0 0',
      padding: '24px 20px 36px',
      width: '100%',
      maxWidth: '480px',
      animation: 'slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)'
    },
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '12px',
      marginBottom: '16px'
    }
  }, React.createElement("span", {
    style: {
      fontSize: '40px',
      lineHeight: 1
    }
  }, cfg.emoji), React.createElement("div", {
    style: {
      flex: 1
    }
  }, React.createElement("div", {
    id: "event-dialog-title",
    style: {
      fontFamily: "'Fredoka One',cursive",
      fontSize: '20px',
      color: cfg.titleColor,
      lineHeight: 1.2
    }
  }, cfg.title), React.createElement("div", {
    style: {
      fontSize: '12px',
      color: '#888',
      marginTop: '3px',
      fontWeight: '700'
    }
  }, "Appuie n'importe o\xF9 pour continuer")), React.createElement("div", {
    style: {
      width: '10px',
      height: '10px',
      borderRadius: '50%',
      background: teamColor,
      flexShrink: 0,
      boxShadow: `0 0 0 3px ${teamColor}44`
    }
  })), React.createElement("div", {
    style: {
      background: 'rgba(255,255,255,0.7)',
      borderRadius: '12px',
      padding: '12px 14px',
      marginBottom: '14px'
    }
  }, cfg.lines.map((l, i) => React.createElement("div", {
    key: i,
    style: {
      display: 'flex',
      alignItems: 'center',
      gap: '10px',
      padding: '5px 0',
      borderBottom: i < cfg.lines.length - 1 ? '1px solid rgba(0,0,0,0.07)' : 'none'
    }
  }, React.createElement("span", {
    style: {
      fontSize: '18px',
      flexShrink: 0
    }
  }, l.icon), React.createElement("span", {
    style: {
      fontSize: '14px',
      fontWeight: '700',
      color: '#3a2a1a'
    }
  }, l.text)))), React.createElement("div", {
    style: {
      fontSize: '13px',
      color: '#5a4a3a',
      lineHeight: '1.65',
      marginBottom: '12px'
    }
  }, cfg.explanation), cfg.tip && React.createElement("div", {
    style: {
      background: 'rgba(255,255,255,0.6)',
      borderRadius: '10px',
      padding: '10px 12px',
      fontSize: '13px',
      fontWeight: '800',
      color: '#3a2a1a'
    }
  }, cfg.tip), React.createElement("button", {
    className: "btn btn-primary btn-full",
    onClick: onClose,
    style: {
      marginTop: '16px',
      fontSize: '15px'
    }
  }, "OK, j'ai compris !")));
}
function AbandonModal({
  teams,
  onClose,
  onSameTeams,
  onNewGame
}) {
  return React.createElement("div", {
    style: {
      position: 'fixed',
      inset: 0,
      zIndex: 4000,
      background: 'rgba(0,0,0,0.75)',
      display: 'flex',
      alignItems: 'flex-end',
      justifyContent: 'center'
    },
    onClick: onClose
  }, React.createElement("div", {
    role: "dialog",
    "aria-modal": "true",
    "aria-labelledby": "abandon-dialog-title",
    style: {
      background: '#1a2e0d',
      border: '1px solid rgba(255,255,255,0.1)',
      borderRadius: '24px 24px 0 0',
      padding: '28px 20px 36px',
      width: '100%',
      maxWidth: '480px',
      animation: 'slideUp 0.3s cubic-bezier(0.34,1.2,0.64,1)'
    },
    onClick: e => e.stopPropagation()
  }, React.createElement("div", {
    style: {
      textAlign: 'center',
      marginBottom: '22px'
    }
  }, React.createElement("div", {
    style: {
      fontSize: '38px',
      marginBottom: '10px'
    }
  }, "\uD83C\uDFF3\uFE0F"), React.createElement("div", {
    id: "abandon-dialog-title",
    style: {
      fontFamily: "'Fredoka One',cursive",
      fontSize: '22px',
      color: '#fff',
      marginBottom: '6px'
    }
  }, "Abandonner la partie ?"), React.createElement("div", {
    style: {
      fontSize: '13px',
      color: 'rgba(255,255,255,0.4)'
    }
  }, "Que veux-tu faire ensuite ?")), React.createElement("div", {
    style: {
      display: 'flex',
      gap: '8px',
      marginBottom: '18px',
      flexWrap: 'wrap'
    }
  }, teams.map((t, i) => React.createElement("div", {
    key: i,
    style: {
      flex: 1,
      minWidth: '70px',
      background: 'rgba(255,255,255,0.05)',
      border: `1px solid ${t.color}44`,
      borderRadius: '10px',
      padding: '8px',
      textAlign: 'center'
    }
  }, React.createElement("div", {
    style: {
      fontSize: '10px',
      fontWeight: '900',
      color: t.color,
      textTransform: 'uppercase',
      letterSpacing: '0.5px'
    }
  }, t.name), React.createElement("div", {
    style: {
      fontFamily: "'Fredoka One',cursive",
      fontSize: '22px',
      color: '#fff'
    }
  }, t.score)))), React.createElement("div", {
    style: {
      display: 'flex',
      flexDirection: 'column',
      gap: '10px'
    }
  }, React.createElement("button", {
    onClick: onSameTeams,
    style: {
      background: 'linear-gradient(135deg,#c8854a,#a0622a)',
      border: 'none',
      borderRadius: '14px',
      padding: '15px',
      color: '#fff',
      fontFamily: "'Fredoka One',cursive",
      fontSize: '16px',
      cursor: 'pointer',
      boxShadow: '0 4px 0 #6a3d10'
    }
  }, "\uD83D\uDD04 Rejouer avec les m\xEAmes \xE9quipes"), React.createElement("button", {
    onClick: onNewGame,
    style: {
      background: 'rgba(255,255,255,0.07)',
      border: '1px solid rgba(255,255,255,0.14)',
      borderRadius: '14px',
      padding: '13px',
      color: 'rgba(255,255,255,0.75)',
      fontFamily: "'Fredoka One',cursive",
      fontSize: '15px',
      cursor: 'pointer'
    }
  }, "\uD83C\uDFE0 Nouvelle partie / Accueil"), React.createElement("button", {
    onClick: onClose,
    style: {
      background: 'transparent',
      border: 'none',
      padding: '10px',
      color: 'rgba(255,255,255,0.3)',
      fontFamily: "'Nunito',sans-serif",
      fontSize: '14px',
      fontWeight: '800',
      cursor: 'pointer'
    }
  }, "Continuer la partie"))));
}

  return {
    RulePopup,
    EventPopup,
    AbandonModal,
  };
});
