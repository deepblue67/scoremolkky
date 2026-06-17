(function (root, factory) {
  const formatters = factory();
  if (typeof module === 'object' && module.exports) {
    module.exports = formatters;
  }
  root.MolkkyFormatters = formatters;
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
  function formatDate(ts) {
    const date = new Date(ts);
    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  function formatDuration(ms) {
    if (!ms || ms < 0) return '—';

    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);

    if (minutes > 59) return `${Math.floor(minutes / 60)}h${String(minutes % 60).padStart(2, '0')}`;
    if (minutes > 0) return `${minutes} min ${String(seconds).padStart(2, '0')} sec`;
    return `${seconds} sec`;
  }

  return {
    formatDate,
    formatDuration,
  };
});
