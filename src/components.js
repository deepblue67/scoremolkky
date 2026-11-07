(function (root, factory) {
  const components = factory(root.React);
  if (typeof module === 'object' && module.exports) {
    module.exports = components;
  }
  root.MolkkyComponents = components;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (React) {
  const h = React ? React.createElement : null;

  // ── Icônes (traits 2px, couleur héritée) ─────────────────────
  const ICON_PATHS = {
    back: ['M15 18l-6-6 6-6'],
    undo: ['M9 14L4 9l5-5', 'M4 9h10.5a5.5 5.5 0 0 1 0 11H11'],
    pause: ['M8 5v14', 'M16 5v14'],
    list: ['M9 6h12', 'M9 12h12', 'M9 18h12', 'M4 6h.01', 'M4 12h.01', 'M4 18h.01'],
    trash: ['M3 6h18', 'M8 6V4h8v2', 'M19 6l-1 14H6L5 6', 'M10 11v6', 'M14 11v6'],
    check: ['M20 6L9 17l-5-5'],
    x: ['M18 6L6 18', 'M6 6l12 12'],
    sliders: ['M4 21v-7', 'M4 10V3', 'M12 21v-9', 'M12 8V3', 'M20 21v-5', 'M20 12V3', 'M1 14h6', 'M9 8h6', 'M17 16h6'],
    clock: ['M12 7v5l3 2', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z'],
    play: ['M7 4l13 8-13 8z'],
    trophy: ['M8 21h8', 'M12 17v4', 'M7 4h10v5a5 5 0 0 1-10 0z', 'M17 5h3v2a3 3 0 0 1-3 3', 'M7 5H4v2a3 3 0 0 0 3 3'],
    refresh: ['M20 11a8 8 0 1 0-2.3 5.7', 'M20 4v7h-7'],
    plus: ['M12 5v14', 'M5 12h14'],
    minus: ['M5 12h14'],
    up: ['M12 19V5', 'M5 12l7-7 7 7'],
    down: ['M12 5v14', 'M19 12l-7 7-7-7'],
    help: ['M9.5 9a2.5 2.5 0 0 1 5 .5c0 1.5-2.5 2-2.5 3.5', 'M12 17h.01', 'M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z'],
    flag: ['M5 21V4', 'M5 4h11l-2 4 2 4H5'],
    home: ['M3 11l9-8 9 8', 'M5 9.5V21h14V9.5'],
    chevron: ['M6 9l6 6 6-6'],
    chart: ['M5 20v-8', 'M12 20V5', 'M19 20v-11', 'M3 20h18'],
    exportData: ['M12 15V3', 'M7 8l5-5 5 5', 'M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4'],
    importData: ['M12 3v12', 'M7 10l5 5 5-5', 'M4 15v4a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-4'],
    book: ['M4 19.5V5a2 2 0 0 1 2-2h14v16H6.5a2.5 2.5 0 0 0 0 5H20', 'M8 7h8', 'M8 11h6'],
    copy: ['M9 9h11v11H9z', 'M5 15H4V4h11v1'],
    share: ['M12 3v12', 'M8 7l4-4 4 4', 'M5 11v9h14v-9'],
    file: ['M6 3h8l4 4v14H6z', 'M14 3v4h4'],
    phone: ['M8 2h8a2 2 0 0 1 2 2v16a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z', 'M11 18h2'],
  };

  function Icon({
    name,
    size = 20,
    className = ''
  }) {
    const paths = ICON_PATHS[name] || [];
    return h("svg", {
      className: `icon ${className}`.trim(),
      width: size,
      height: size,
      viewBox: "0 0 24 24",
      fill: "none",
      stroke: "currentColor",
      strokeWidth: 2,
      strokeLinecap: "round",
      strokeLinejoin: "round",
      "aria-hidden": "true",
      focusable: "false"
    }, paths.map((d, i) => h("path", {
      key: i,
      d
    })));
  }

  // ── Disposition officielle des quilles (vue de dessus) ───────
  function FieldDiagram() {
    const rows = [[7, 9, 8], [5, 11, 12, 6], [3, 10, 4], [1, 2]];
    return h("figure", {
      className: "formation",
      "aria-label": "Disposition de départ des quilles"
    }, h("div", {
      className: "formation-pins"
    }, rows.map((row, ri) => h("div", {
      key: ri,
      className: "formation-row"
    }, row.map(num => h("span", {
      key: num,
      className: "wood-disc formation-pin"
    }, num))))), h("figcaption", {
      className: "formation-caption"
    }, h("span", {
      className: "formation-line",
      "aria-hidden": "true"
    }), h("span", null, "Lancer \xE0 3,5 m"), h("span", {
      className: "formation-line",
      "aria-hidden": "true"
    })));
  }

  function ChipSelect({
    options,
    value,
    onChange,
    label
  }) {
    return h("div", {
      className: "chips",
      role: "group",
      "aria-label": label
    }, options.map(opt => h("button", {
      key: opt.value,
      type: "button",
      className: `chip ${value === opt.value ? 'is-on' : ''}`,
      "aria-pressed": value === opt.value,
      onClick: () => onChange(opt.value)
    }, opt.label)));
  }

  function Toggle({
    value,
    onChange,
    label = 'Activer ou désactiver'
  }) {
    return h("button", {
      type: "button",
      role: "switch",
      className: `switch ${value ? 'is-on' : ''}`,
      "aria-checked": value,
      "aria-label": label,
      onClick: () => onChange(!value)
    }, h("span", {
      className: "switch-thumb"
    }));
  }

  // Feuille modale du bas d'écran, utilisée par toutes les fenêtres.
  function Sheet({
    labelledBy,
    onClose,
    tone = '',
    className = '',
    children
  }) {
    return h("div", {
      className: "sheet-backdrop",
      onClick: onClose
    }, h("div", {
      role: "dialog",
      "aria-modal": "true",
      "aria-labelledby": labelledBy,
      className: `sheet ${tone ? `sheet-${tone}` : ''} ${className}`.trim(),
      onClick: e => e.stopPropagation()
    }, children));
  }

  return {
    Icon,
    FieldDiagram,
    ChipSelect,
    Toggle,
    Sheet,
  };
});
