(function (root, factory) {
  const constants = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = constants;
  }
  root.MolkkyConstants = constants;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  // Couleurs d'équipe choisies pour rester lisibles sur le fond épicéa (pas de vert).
  const TEAM_COLORS = ['#F2654F', '#4FA6F0', '#F2C14E', '#B590F2', '#36C7BC', '#F27BB4'];
  const ACTUAL_PINS = [7, 9, 8, 10, 11, 12, 6, 5, 4, 3, 2, 1];
  const SORTED_PINS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return {
    TEAM_COLORS,
    ACTUAL_PINS,
    SORTED_PINS,
  };
});
