(function (root, factory) {
  const constants = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = constants;
  }
  root.MolkkyConstants = constants;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  const TEAM_COLORS = ['#E74C3C', '#3498DB', '#2ECC71', '#F39C12', '#9B59B6', '#1ABC9C'];
  const ACTUAL_PINS = [7, 9, 8, 10, 11, 12, 6, 5, 4, 3, 2, 1];
  const SORTED_PINS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  return {
    TEAM_COLORS,
    ACTUAL_PINS,
    SORTED_PINS,
  };
});
