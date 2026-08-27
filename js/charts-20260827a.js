(function () {
  'use strict';

  function track(name, properties) {
    if (typeof window.datafast !== 'function') return;
    try { window.datafast(name, properties || {}); } catch (_) {}
  }

  track('charts_page_loaded', { page: 'charts', snapshot: '2026-08-27' });

  document.querySelectorAll('[data-chart]').forEach(function (chart) {
    var id = chart.getAttribute('data-chart');
    if (!('IntersectionObserver' in window)) return;
    var observer = new IntersectionObserver(function (entries) {
      if (!entries.some(function (entry) { return entry.isIntersecting; })) return;
      chart.classList.add('is-visible');
      track('chart_view', { chart: id, snapshot: '2026-08-27' });
      observer.disconnect();
    }, { threshold: 0.35 });
    observer.observe(chart);
  });

  document.addEventListener('click', function (event) {
    var link = event.target.closest('[data-chart-source], [data-chart-nav]');
    if (!link) return;
    if (link.hasAttribute('data-chart-source')) {
      track('chart_source_click', {
        chart: link.getAttribute('data-chart-source'),
        source: link.getAttribute('data-source') || 'unknown'
      });
      return;
    }
    track('charts_navigation_click', { target: link.getAttribute('href') || 'unknown' });
  });
})();
