(function (root, factory) {
  const components = factory(root.React);
  if (typeof module === 'object' && module.exports) {
    module.exports = components;
  }
  root.MolkkyComponents = components;
})(typeof globalThis !== 'undefined' ? globalThis : this, function (React) {
function FieldDiagram() {
  const SLOT = 42,
    R = 17,
    ROW_H = 42;
  const rows = [{
    pins: [7, 9, 8],
    startX: SLOT * 0.5
  }, {
    pins: [5, 11, 12, 6],
    startX: 0
  }, {
    pins: [3, 10, 4],
    startX: SLOT * 0.5
  }, {
    pins: [1, 2],
    startX: SLOT * 1.0
  }];
  const totalW = 4 * SLOT,
    totalH = rows.length * ROW_H + R * 2;
  return React.createElement("div", {
    className: "field-diagram"
  }, React.createElement("div", {
    className: "field-title"
  }, "Disposition des quilles"), React.createElement("div", {
    style: {
      display: 'flex',
      justifyContent: 'center',
      padding: '6px 0 2px',
      position: 'relative',
      zIndex: 1
    }
  }, React.createElement("svg", {
    viewBox: `0 0 ${totalW} ${totalH}`,
    style: {
      width: '100%',
      maxWidth: '210px',
      height: 'auto',
      overflow: 'visible'
    }
  }, React.createElement("defs", null, React.createElement("radialGradient", {
    id: "pinG",
    cx: "38%",
    cy: "32%",
    r: "60%"
  }, React.createElement("stop", {
    offset: "0%",
    stopColor: "#e8c98a"
  }), React.createElement("stop", {
    offset: "100%",
    stopColor: "#b87d3a"
  }))), rows.flatMap((row, ri) => row.pins.map((num, ci) => {
    const cx = row.startX + ci * SLOT + SLOT / 2;
    const cy = ri * ROW_H + R + 2;
    return React.createElement("g", {
      key: num
    }, React.createElement("circle", {
      cx: cx + 1,
      cy: cy + 1.5,
      r: R,
      fill: "rgba(0,0,0,0.25)"
    }), React.createElement("circle", {
      cx: cx,
      cy: cy,
      r: R,
      fill: "url(#pinG)",
      stroke: "#8a5a22",
      strokeWidth: 1.5
    }), React.createElement("ellipse", {
      cx: cx - R * 0.3,
      cy: cy - R * 0.3,
      rx: R * 0.28,
      ry: R * 0.18,
      fill: "rgba(255,255,255,0.32)",
      transform: `rotate(-35,${cx},${cy})`
    }), React.createElement("text", {
      x: cx,
      y: cy + 6,
      textAnchor: "middle",
      fontFamily: "'Fredoka One',cursive",
      fontSize: num >= 10 ? 12 : 14,
      fill: "#3a1e08",
      fontWeight: "bold"
    }, num));
  })))), React.createElement("div", {
    className: "distance-line"
  }, "3,5 m"), React.createElement("div", {
    className: "throwing-zone"
  }, React.createElement("div", {
    className: "thrower-icon"
  }, "\uD83E\uDDD1"), React.createElement("div", {
    className: "m\xF6lkky-icon"
  }), React.createElement("span", {
    style: {
      color: 'rgba(255,255,255,0.3)',
      fontSize: '11px',
      fontWeight: '800',
      letterSpacing: '1px',
      textTransform: 'uppercase'
    }
  }, "Zone de lancer")));
}
function ChipSelect({
  options,
  value,
  onChange
}) {
  return React.createElement("div", {
    style: {
      display: 'flex',
      gap: '6px',
      flexWrap: 'wrap'
    }
  }, options.map(opt => React.createElement("button", {
    key: opt.value,
    onClick: () => onChange(opt.value),
    style: {
      padding: '7px 13px',
      borderRadius: '20px',
      border: '2px solid',
      borderColor: value === opt.value ? '#2d5016' : 'rgba(45,80,22,0.2)',
      background: value === opt.value ? '#2d5016' : 'transparent',
      color: value === opt.value ? 'white' : '#2d5016',
      fontFamily: "'Nunito',sans-serif",
      fontWeight: '800',
      fontSize: '13px',
      cursor: 'pointer',
      transition: 'all 0.15s',
      WebkitTapHighlightColor: 'transparent'
    }
  }, opt.label)));
}
function Toggle({
  value,
  onChange,
  label = 'Activer ou désactiver'
}) {
  return React.createElement("button", {
    type: "button",
    role: "switch",
    "aria-checked": value,
    "aria-label": label,
    onClick: () => onChange(!value),
    style: {
      width: '52px',
      height: '28px',
      border: 'none',
      padding: 0,
      borderRadius: '14px',
      flexShrink: 0,
      background: value ? 'linear-gradient(135deg,#4a7c2f,#2d5016)' : '#ccc',
      position: 'relative',
      cursor: 'pointer',
      transition: 'background 0.25s',
      boxShadow: 'inset 0 1px 3px rgba(0,0,0,0.2)'
    }
  }, React.createElement("div", {
    style: {
      position: 'absolute',
      top: '3px',
      left: value ? '27px' : '3px',
      width: '22px',
      height: '22px',
      borderRadius: '50%',
      background: 'white',
      transition: 'left 0.25s',
      boxShadow: '0 2px 4px rgba(0,0,0,0.25)'
    }
  }));
}

  return {
    FieldDiagram,
    ChipSelect,
    Toggle,
  };
});
