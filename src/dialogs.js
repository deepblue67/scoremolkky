(function (root, factory) {
  const dialogs = factory(root.React, root.MolkkyComponents);
  if (typeof module === 'object' && module.exports) {
    module.exports = dialogs;
  }
  root.MolkkyDialogs = dialogs;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (React, components) {
  const h = React ? React.createElement : null;
  const { Icon, Sheet } = components || {};

  const RULES_HELP = {
    elimination: {
      title: 'Élimination par ratés',
      blocks: [
        ['La règle', 'Une équipe qui rate N lancers de suite est éliminée. Tu choisis N avant la partie.'],
        ["Qu'est-ce qu'un raté ?", "Aucune quille renversée. Le compteur repart à zéro dès qu'une quille tombe."],
        ['2 ratés', 'Mode expert : chaque erreur coûte cher.'],
        ['3 ratés', 'Règle officielle.'],
        ['4 ratés', 'Mode famille, idéal avec des enfants ou des débutants.'],
        ['Sans élimination', 'Les ratés ne font rien. Personne ne peut être éliminé.'],
      ],
    },
    overflow: {
      title: 'Dépassement du score cible',
      blocks: [
        ['Le principe', 'Une équipe qui dépasse le score cible est pénalisée selon la règle choisie.'],
        ['Retombe à 25', 'La règle officielle du Mölkky.'],
        ['Retombe à 0', 'Mode sévère : on repart de zéro.'],
        ['Retombe à la moitié', 'Le score obtenu est divisé par deux.'],
        ['Rien', 'Mode débutant : le lancer est ignoré, le score ne bouge pas.'],
        ['Essais de grâce', 'Nombre de dépassements tolérés (score inchangé) avant que la pénalité ne tombe.'],
      ],
    },
    handicap: {
      title: 'Handicap de départ',
      blocks: [
        ['Le principe', "Une équipe moins expérimentée commence avec des points d'avance."],
        ['Exemple', "Handicap de 10 avec une cible à 50 : l'équipe démarre à 10 et doit encore marquer exactement 40 points."],
        ['Pourquoi', 'Pour mélanger adultes et enfants, ou des joueurs de niveaux différents, sans frustrer personne.'],
      ],
    },
  };

  function RulePopup({
    rule,
    onClose
  }) {
    const r = RULES_HELP[rule];
    if (!r) return null;
    return h(Sheet, {
      labelledBy: "rule-dialog-title",
      onClose
    }, h("div", {
      className: "sheet-head"
    }, h("div", {
      id: "rule-dialog-title",
      className: "sheet-title"
    }, r.title), h("button", {
      type: "button",
      className: "sheet-close",
      "aria-label": "Fermer l'aide",
      onClick: onClose
    }, h(Icon, {
      name: "x"
    }))), r.blocks.map(([title, text]) => h("div", {
      key: title,
      className: "rule-block"
    }, h("h3", null, title), h("p", null, text))), h("div", {
      className: "sheet-actions"
    }, h("button", {
      type: "button",
      className: "btn btn-primary btn-block",
      onClick: onClose
    }, "Compris")));
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
    const penaltyText = data.mode === '0' ? 'Le score retombe à 0.' : data.mode === 'half' ? 'Le score retombe à la moitié.' : 'Le score retombe à 25, comme le veut la règle.';
    const cfgs = {
      overflow_penalized: {
        tone: 'danger',
        title: `${teamName} dépasse ${data.targetScore}`,
        facts: [['Score atteint', data.scoreBefore], ['Nouveau score', data.newScore]],
        text: penaltyText,
        tip: `Il faut maintenant marquer exactement ${data.targetScore - data.newScore} points.`
      },
      overflow_grace: {
        tone: 'warn',
        title: `${teamName} dépasse ${data.targetScore}`,
        facts: [['Lancer', `${data.scoreBefore} + ${data.score} = ${data.scoreBefore + data.score}`], ['Score conservé', data.scoreBefore], ['Essais de grâce restants', `${data.remaining} sur ${data.graceTotal}`]],
        text: 'Essai de grâce : le score ne bouge pas.',
        tip: data.remaining > 0 ? `Encore ${data.remaining} essai${data.remaining > 1 ? 's' : ''} avant la pénalité.` : 'Prochain dépassement : pénalité.'
      },
      eliminated: {
        tone: 'danger',
        title: `${teamName} est éliminée`,
        facts: [['Ratés consécutifs', `${data.misses} sur ${data.limit || 3}`]],
        text: `Une équipe qui rate ${data.limit || 3} lancers de suite est éliminée.`,
        tip: data.winnerName ? `${data.winnerName} remporte la partie.` : 'Les autres équipes continuent.'
      }
    };
    const cfg = cfgs[type];
    if (!cfg) return null;
    return h(Sheet, {
      labelledBy: "event-dialog-title",
      onClose,
      tone: cfg.tone
    }, h("div", {
      className: "sheet-head"
    }, h("div", {
      id: "event-dialog-title",
      className: "sheet-title",
      style: {
        color: teamColor
      }
    }, cfg.title)), h("ul", {
      className: "fact-list"
    }, cfg.facts.map(([label, value]) => h("li", {
      key: label
    }, h("span", null, label), h("strong", {
      className: "num"
    }, value)))), h("p", {
      className: "sheet-text",
      style: {
        marginTop: '12px'
      }
    }, cfg.text), cfg.tip && h("div", {
      className: "tip"
    }, cfg.tip), h("div", {
      className: "sheet-actions"
    }, h("button", {
      type: "button",
      className: "btn btn-primary btn-block btn-lg",
      onClick: onClose
    }, "OK, continuer")));
  }

  function AbandonModal({
    teams,
    onClose,
    onSameTeams,
    onPause,
    onAbandon
  }) {
    return h(Sheet, {
      labelledBy: "abandon-dialog-title",
      onClose
    }, h("div", {
      className: "sheet-head"
    }, h("div", null, h("div", {
      id: "abandon-dialog-title",
      className: "sheet-title"
    }, "Partie en pause"), h("div", {
      className: "sheet-sub"
    }, "La partie est sauvegard\xE9e automatiquement."))), h("div", {
      className: "pause-scores"
    }, teams.map((t, i) => h("span", {
      key: i,
      className: "pause-score"
    }, h("span", {
      className: "dot",
      style: {
        '--team': t.color
      }
    }), t.name, h("span", {
      className: "num"
    }, t.score)))), h("div", {
      className: "sheet-actions"
    }, h("button", {
      type: "button",
      className: "btn btn-primary btn-block btn-lg",
      onClick: onClose
    }, h(Icon, {
      name: "play"
    }), "Reprendre la partie"), h("button", {
      type: "button",
      className: "btn btn-secondary btn-block",
      onClick: onPause
    }, h(Icon, {
      name: "home"
    }), "Retour \xE0 l'accueil"), h("button", {
      type: "button",
      className: "btn btn-secondary btn-block",
      onClick: onSameTeams
    }, h(Icon, {
      name: "refresh"
    }), "Recommencer la partie"), h("button", {
      type: "button",
      className: "btn btn-danger btn-block",
      onClick: onAbandon
    }, h(Icon, {
      name: "flag"
    }), "Abandonner la partie")));
  }

  return {
    RulePopup,
    EventPopup,
    AbandonModal,
  };
});
