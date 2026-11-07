(function (root, factory) {
  const guide = factory(root.React, root.MolkkyComponents);
  if (typeof module === 'object' && module.exports) {
    module.exports = guide;
  }
  root.MolkkyGuide = guide;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (React, components) {
  const h = React ? React.createElement : null;
  const { Icon } = components || {};

  // ── Maquettes : vraies classes de l'application, sans interaction ──
  function Shot({
    label,
    children
  }) {
    return h("figure", {
      className: "guide-shot",
      "aria-label": label
    }, h("div", {
      className: "guide-shot-screen",
      "aria-hidden": "true",
      inert: ""
    }, children));
  }

  function Disc({
    n,
    state = '',
    team
  }) {
    return h("span", {
      className: `wood-disc pin-btn guide-pin ${state}`,
      style: team ? {
        '--team': team
      } : undefined
    }, n);
  }

  function Tile({
    name,
    color,
    score,
    target = 50,
    active,
    misses = 0
  }) {
    const remaining = target - score;
    return h("div", {
      className: `score-tile ${active ? 'is-active' : ''} ${remaining <= 12 ? 'is-playable' : ''}`,
      style: {
        '--team': color
      }
    }, h("div", {
      className: "tile-head"
    }, h("span", {
      className: "tile-name"
    }, name), h("span", {
      className: `misses ${misses === 2 ? 'is-last' : ''}`
    }, [0, 1, 2].map(i => h("span", {
      key: i,
      className: `miss-dot ${i < misses ? 'filled' : ''}`
    })))), h("div", {
      className: "tile-body"
    }, h("span", {
      className: "tile-score num"
    }, score), h("span", {
      className: "tile-remain"
    }, "reste", h("span", {
      className: "num"
    }, remaining))));
  }

  function Callout({
    n,
    style
  }) {
    return h("span", {
      className: "guide-callout num",
      style
    }, n);
  }

  function InstallShot() {
    return h(Shot, {
      label: "Menu Partager de Safari"
    }, h("div", {
      className: "guide-share"
    }, h("div", {
      className: "guide-share-head"
    }, h(Icon, {
      name: "share",
      size: 18
    }), "Partager"), ['Copier', 'Ajouter aux favoris', "Sur l'écran d'accueil", 'Imprimer'].map((label, i) => h("div", {
      key: label,
      className: `guide-share-row ${i === 2 ? 'is-hit' : ''}`
    }, label, i === 2 && h(Callout, {
      n: 2
    })))));
  }

  function SetupShot() {
    return h(Shot, {
      label: "Écran Nouvelle partie"
    }, h("div", {
      className: "guide-pad"
    }, h("div", {
      className: "section-title guide-small-title"
    }, "\xC9quipes", h(Callout, {
      n: 1
    })), [['Les enfants', '#F2654F', ['Léo', 'Emma']], ['Papa', '#4FA6F0', []]].map(([name, color, players]) => h("div", {
      key: name,
      className: "team-item"
    }, h("div", {
      className: "guide-team-line"
    }, h("span", {
      className: "team-color-dot",
      style: {
        background: color
      }
    }), h("span", {
      className: "field guide-field"
    }, name)), players.length > 0 && h("div", {
      className: "team-players"
    }, players.map((p, i) => h("span", {
      key: p,
      className: "player-chip guide-chip"
    }, h("span", {
      className: "player-chip-order num"
    }, i + 1), p)), h(Callout, {
      n: 2
    })))), h("div", {
      className: "section-title guide-small-title",
      style: {
        marginTop: '12px'
      }
    }, "Score cible", h(Callout, {
      n: 3
    })), h("div", {
      className: "chips"
    }, ['30', '40', '50 (officiel)', '75'].map(label => h("span", {
      key: label,
      className: `chip guide-chip ${label.startsWith('50') ? 'is-on' : ''}`
    }, label)))));
  }

  function GameShot() {
    return h(Shot, {
      label: "Écran de jeu"
    }, h("div", {
      className: "scoreboard guide-scoreboard",
      "data-count": "2"
    }, h(Tile, {
      name: "Les enfants",
      color: "#F2654F",
      score: 23,
      active: true
    }), h(Tile, {
      name: "Papa",
      color: "#4FA6F0",
      score: 31,
      misses: 1
    })), h("div", {
      className: "guide-callouts-row"
    }, h(Callout, {
      n: 1
    })), h("div", {
      className: "turnbar guide-turnbar"
    }, h("div", {
      className: "turn-label"
    }, h("div", {
      className: "turn-main"
    }, h("span", {
      className: "turn-prefix"
    }, "Tour de "), h("span", {
      className: "turn-team-name",
      style: {
        color: '#F2654F'
      }
    }, "Les enfants")), h("div", {
      className: "turn-meta"
    }, h("span", {
      className: "turn-player"
    }, "L\xE9o lance"), h("span", {
      className: "turn-round"
    }, "round 4"))), h(Callout, {
      n: 2
    })), h("div", {
      className: "preview has-selection guide-preview"
    }, h("div", {
      className: "preview-col"
    }, h("span", {
      className: "preview-label"
    }, "Score"), h("span", {
      className: "preview-value num"
    }, "23")), h("div", {
      className: "preview-col preview-col-main"
    }, h("span", {
      className: "preview-label"
    }, "2 quilles"), h("span", {
      className: "preview-value num"
    }, "+2")), h("div", {
      className: "preview-col"
    }, h("span", {
      className: "preview-label"
    }, "Apr\xE8s"), h("span", {
      className: "preview-value num is-after"
    }, "25"))), h("div", {
      className: "guide-pins"
    }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => h(Disc, {
      key: n,
      n,
      state: n === 3 || n === 8 ? 'selected' : '',
      team: '#F2654F'
    })), h(Callout, {
      n: 3,
      style: {
        position: 'absolute',
        right: '-4px',
        top: '-6px'
      }
    })), h("div", {
      className: "guide-actions"
    }, h("span", {
      className: "miss-bar-btn guide-miss"
    }, h(Icon, {
      name: "x",
      size: 16
    }), "Rat\xE9", h(Callout, {
      n: 5
    })), h("div", {
      className: "guide-action-row"
    }, h("span", {
      className: "side-btn"
    }, h(Icon, {
      name: "undo",
      size: 16
    }), "Annuler"), h("span", {
      className: "validate-btn"
    }, h(Icon, {
      name: "check",
      size: 18
    }), "Valider", h(Callout, {
      n: 4
    })), h("span", {
      className: "side-btn"
    }, h(Icon, {
      name: "pause",
      size: 16
    }), "Pause"))));
  }

  function EndgameShot() {
    return h(Shot, {
      label: "Aide en fin de partie"
    }, h("div", {
      className: "turnbar guide-turnbar"
    }, h("div", {
      className: "turn-label"
    }, h("div", {
      className: "turn-main"
    }, h("span", {
      className: "turn-team-name",
      style: {
        color: '#4FA6F0'
      }
    }, "Papa")), h("div", {
      className: "turn-meta"
    }, h("span", {
      className: "turn-alert"
    }, "Dernier essai"), h(Callout, {
      n: 3
    })))), h("div", {
      className: "preview guide-preview"
    }, h("div", {
      className: "preview-col"
    }, h("span", {
      className: "preview-label"
    }, "Score"), h("span", {
      className: "preview-value num"
    }, "43")), h("div", {
      className: "preview-col preview-col-main"
    }, h("span", {
      className: "preview-label"
    }, "Il faut 7", h(Callout, {
      n: 1
    })), h("span", {
      className: "preview-value num"
    }, "—")), h("div", {
      className: "preview-col"
    }, h("span", {
      className: "preview-label"
    }, "Apr\xE8s"), h("span", {
      className: "preview-value num"
    }, "—"))), h("div", {
      className: "guide-pins"
    }, [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(n => h(Disc, {
      key: n,
      n,
      state: n === 7 ? 'is-target' : n > 7 ? 'is-over' : ''
    })), h(Callout, {
      n: 2,
      style: {
        position: 'absolute',
        right: '-4px',
        bottom: '-6px'
      }
    })));
  }

  function WinShot() {
    return h(Shot, {
      label: "Écran de victoire d'une manche"
    }, h("div", {
      className: "guide-pad"
    }, h("div", {
      className: "win-kicker"
    }, h(Icon, {
      name: "trophy",
      size: 18
    }), "Manche 1 gagn\xE9e"), h("div", {
      className: "win-team guide-win-team",
      style: {
        '--team': '#F2654F'
      }
    }, "Les enfants"), h("div", {
      className: "match-board",
      style: {
        marginTop: '10px'
      }
    }, h("div", {
      className: "match-board-title"
    }, "Match en 2 manches gagnantes", h(Callout, {
      n: 1
    })), h("div", {
      className: "match-board-teams"
    }, h("span", {
      className: "match-board-team"
    }, h("span", {
      className: "dot",
      style: {
        '--team': '#F2654F'
      }
    }), "Les enfants", h("span", {
      className: "num"
    }, "1")), h("span", {
      className: "match-board-team"
    }, h("span", {
      className: "dot",
      style: {
        '--team': '#4FA6F0'
      }
    }), "Papa", h("span", {
      className: "num"
    }, "0")))), h("div", {
      className: "win-actions",
      style: {
        marginTop: '12px'
      }
    }, h("span", {
      className: "btn btn-secondary"
    }, "Arr\xEAter"), h("span", {
      className: "btn btn-primary"
    }, "Manche 2", h(Callout, {
      n: 2
    })))));
  }

  function HistoryShot() {
    return h(Shot, {
      label: "Historique et statistiques"
    }, h("div", {
      className: "guide-pad"
    }, h("div", {
      className: "tabs guide-tabs"
    }, h("span", {
      className: "tab"
    }, "Parties"), h("span", {
      className: "tab is-on"
    }, "Statistiques", h(Callout, {
      n: 2
    }))), [['1', 'Léo', '#F2654F', '4 parties · moyenne 7,2', 3], ['2', 'Papa', '#4FA6F0', '4 parties · moyenne 6,1', 1]].map(([rank, name, color, meta, wins]) => h("div", {
      key: name,
      className: "player-row",
      style: {
        '--team': color
      }
    }, h("span", {
      className: "rank num"
    }, rank), h("span", null, h("span", {
      className: "player-name"
    }, h("span", {
      className: "dot"
    }), h("span", null, name)), h("span", {
      className: "player-meta"
    }, meta)), h("span", {
      className: "player-wins"
    }, h("span", {
      className: "num"
    }, wins), h("small", null, "victoires")), h(Icon, {
      name: "chevron",
      size: 16
    })))));
  }

  function SettingsShot() {
    return h(Shot, {
      label: "Réglages"
    }, h("div", {
      className: "guide-pad"
    }, h("div", {
      className: "row"
    }, h("div", null, h("div", {
      className: "row-label"
    }, "Aide en fin de partie"), h("div", {
      className: "row-sub"
    }, "Quille gagnante entour\xE9e")), h("span", {
      className: "switch is-on"
    }, h("span", {
      className: "switch-thumb"
    })), h(Callout, {
      n: 1
    })), h("div", {
      className: "row"
    }, h("div", null, h("div", {
      className: "row-label"
    }, "Garder l'\xE9cran allum\xE9")), h("span", {
      className: "switch is-on"
    }, h("span", {
      className: "switch-thumb"
    }))), h("div", {
      className: "nav-group",
      style: {
        marginTop: '10px'
      }
    }, h("div", {
      className: "nav-row"
    }, h("span", {
      className: "nav-row-icon"
    }, h(Icon, {
      name: "exportData",
      size: 20
    })), h("span", {
      className: "nav-row-text"
    }, h("span", {
      className: "row-label"
    }, "Exporter mes donn\xE9es")), h(Callout, {
      n: 2
    })), h("div", {
      className: "nav-row"
    }, h("span", {
      className: "nav-row-icon"
    }, h(Icon, {
      name: "importData",
      size: 20
    })), h("span", {
      className: "nav-row-text"
    }, h("span", {
      className: "row-label"
    }, "Importer des donn\xE9es")), h(Callout, {
      n: 3
    })))));
  }

  // ── Contenu du guide ───────────────────────────────────────
  const SECTIONS = [{
    id: 'installer',
    title: "Installer l'application",
    Shot: InstallShot,
    steps: [['Ouvre l’adresse de l’application dans Safari', ' sur l’iPhone ou l’iPad, puis touche le bouton Partager.'], ['Choisis « Sur l’écran d’accueil »', '. L’icône Mölkky apparaît comme une vraie application, en plein écran.'], ['Elle marche sans réseau', ' : après la première ouverture, tout est gardé sur l’appareil. Pratique au fond du jardin.']]
  }, {
    id: 'preparer',
    title: 'Préparer la partie',
    Shot: SetupShot,
    steps: [['Équipes', ' : de 2 à 6, dans l’ordre de passage (flèches pour réordonner). Les derniers noms utilisés sont proposés pendant la saisie.'], ['Joueurs (facultatif)', ' : ajoute les prénoms de chaque équipe. L’application dira qui lance et fera tourner les joueurs. Les statistiques seront tenues par personne.'], ['Règles', ' : score cible (50 officiel), élimination après 2, 3 ou 4 ratés, pénalité de dépassement, essais de grâce, handicap pour les plus jeunes.'], ['Format', ' : partie simple ou match en 2 ou 3 manches gagnantes, et qui commence la partie suivante.'], ['La configuration est mémorisée', ' : la prochaine fois, tout est déjà rempli. L’icône en haut à droite remet tout à zéro.']]
  }, {
    id: 'jouer',
    title: 'Jouer un lancer',
    Shot: GameShot,
    steps: [['Le tableau', ' montre le score et ce qu’il reste à marquer pour chaque équipe. L’équipe qui joue est encadrée ; les points rouges comptent les ratés.'], ['La barre du tour', ' indique l’équipe, le joueur qui lance, la manche et le round. Le bouton à droite liste tous les coups joués.'], ['Touche les quilles tombées', '. Une seule quille : on marque son numéro. Plusieurs : on marque le nombre de quilles. L’aperçu montre le score après le lancer.'], ['Valider', ' enregistre le lancer et passe à l’équipe suivante. Annuler revient en arrière, autant de fois que nécessaire.'], ['Raté', ' : aucune quille tombée. Pause permet de revenir à l’accueil sans perdre la partie, de la recommencer ou de l’abandonner.']]
  }, {
    id: 'fin',
    title: 'La fin de partie',
    Shot: EndgameShot,
    steps: [['Il faut 7', ' : quand il reste 12 points ou moins, l’aperçu affiche ce qu’il faut marquer et la quille gagnante est entourée de vert.'], ['Quilles atténuées', ' : seules, elles feraient dépasser le score cible. Au-delà, on retombe à la moitié de la cible (25 pour 50).'], ['Dernier essai', ' : l’équipe est à un raté de l’élimination. Le bouton Raté le rappelle aussi.']]
  }, {
    id: 'victoire',
    title: 'Victoire, revanche et matchs',
    Shot: WinShot,
    steps: [['Le score du match', ' s’affiche entre les manches, avec le classement de la manche.'], ['Manche suivante ou revanche', ' : l’ordre de passage suit le choix fait au départ (le dernier du classement commence, ou chacun son tour).']]
  }, {
    id: 'historique',
    title: 'Historique et statistiques',
    Shot: HistoryShot,
    steps: [['Historique', ' : depuis l’accueil, toutes les parties terminées, chaque manche à part. Touche une partie pour son détail.'], ['Statistiques', ' : classement par joueur (victoires, moyenne par lancer), et le détail de chacun en le touchant.']]
  }, {
    id: 'reglages',
    title: 'Réglages et sauvegarde',
    Shot: SettingsShot,
    steps: [['Pendant la partie', ' : aide en fin de partie, écran toujours allumé, quilles dans l’ordre 1 à 12 ou comme sur le terrain.'], ['Exporter', ' : copie le code ou envoie le fichier (AirDrop, message, mail) à l’autre appareil.'], ['Importer', ' : sur l’autre appareil, colle le code ou ouvre le fichier, puis touche « Ajouter à mes parties ». Seules les parties manquantes sont ajoutées.'], ['Remplacer', ' rend l’appareil identique à l’autre : historique, partie en cours et réglages.']]
  }];

  function GuideScreen({
    onBack,
    appVersion = ''
  }) {
    return h("div", {
      className: "screen"
    }, h("div", {
      className: "topbar"
    }, h("button", {
      type: "button",
      className: "icon-btn",
      "aria-label": "Retour aux r\xE9glages",
      onClick: onBack
    }, h(Icon, {
      name: "back",
      size: 24
    })), h("div", {
      className: "topbar-title"
    }, "Guide d'utilisation"), h("span", null)), h("div", {
      className: "scroll guide"
    }, h("header", {
      className: "guide-head"
    }, h("div", {
      className: "guide-mark"
    }, h("span", {
      className: "wood-disc guide-mark-pin"
    }, "12"), h("div", null, h("div", {
      className: "wordmark guide-wordmark"
    }, "M\xF6lkky Score"), h("div", {
      className: "home-tagline"
    }, "Feuille de score pour iPhone, iPad et ordinateur"))), appVersion && h("div", {
      className: "detail-sub"
    }, "Version ", appVersion)), h("nav", {
      className: "guide-toc",
      "aria-label": "Sommaire du guide"
    }, h("ol", null, SECTIONS.map((section, i) => h("li", {
      key: section.id
    }, h("a", {
      href: `#guide-${section.id}`,
      onClick: e => {
        e.preventDefault();
        const target = document.getElementById(`guide-${section.id}`);
        if (target) target.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        });
      }
    }, h("span", {
      className: "num"
    }, i + 1), section.title))))), SECTIONS.map((section, i) => h("section", {
      key: section.id,
      id: `guide-${section.id}`,
      className: "guide-section"
    }, h("h2", {
      className: "guide-title"
    }, h("span", {
      className: "guide-title-num num"
    }, i + 1), section.title), h(section.Shot), h("ol", {
      className: "guide-steps"
    }, section.steps.map(([strong, rest], j) => h("li", {
      key: j
    }, h("span", {
      className: "guide-step-num num"
    }, j + 1), h("p", null, h("strong", null, strong), rest)))))), h("p", {
      className: "guide-foot"
    }, "Bonnes parties !")));
  }

  return {
    GuideScreen,
  };
});
