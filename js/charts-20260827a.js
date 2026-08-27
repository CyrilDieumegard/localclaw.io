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

  function setupAdoptionTooltip() {
    var plot = document.querySelector('.charts-adoption-plot');
    if (!plot) return;

    var days = Array.prototype.slice.call(plot.querySelectorAll('.charts-adoption-day'));
    var tooltip = plot.querySelector('[data-adoption-tooltip]');
    if (!days.length || !tooltip) return;

    var dateNode = tooltip.querySelector('[data-tooltip-date]');
    var openNode = tooltip.querySelector('[data-tooltip-open]');
    var closedNode = tooltip.querySelector('[data-tooltip-closed]');
    var deltaNode = tooltip.querySelector('[data-tooltip-delta]');
    var dateFormatter = new Intl.DateTimeFormat('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      timeZone: 'UTC'
    });
    var activeDay = null;
    var touchPinned = false;
    var tracked = false;

    function clamp(value, minimum, maximum) {
      return Math.max(minimum, Math.min(maximum, value));
    }

    function positionTooltip(day) {
      var plotRect = plot.getBoundingClientRect();
      var dayRect = day.getBoundingClientRect();
      var openShare = Number(day.getAttribute('data-open'));
      var tooltipWidth = tooltip.offsetWidth;
      var tooltipHeight = tooltip.offsetHeight;
      var anchorX = dayRect.left - plotRect.left + (dayRect.width / 2);
      var boundaryY = plotRect.height * (openShare / 100);
      var left = clamp(anchorX - (tooltipWidth / 2), 8, plotRect.width - tooltipWidth - 8);
      var top = boundaryY - tooltipHeight - 11;

      if (top < 8) top = boundaryY + 11;
      top = clamp(top, 8, plotRect.height - tooltipHeight - 8);
      tooltip.style.left = Math.round(left) + 'px';
      tooltip.style.top = Math.round(top) + 'px';
    }

    function show(day, input) {
      if (!day) return;
      if (activeDay && activeDay !== day) activeDay.classList.remove('is-active');
      activeDay = day;
      activeDay.classList.add('is-active');

      var dateValue = day.getAttribute('data-date');
      var deltaValue = day.getAttribute('data-delta');
      var delta = deltaValue === '' ? null : Number(deltaValue);
      dateNode.dateTime = dateValue;
      dateNode.textContent = dateFormatter.format(new Date(dateValue + 'T00:00:00Z'));
      openNode.textContent = day.getAttribute('data-open') + '%';
      closedNode.textContent = day.getAttribute('data-closed') + '%';
      deltaNode.textContent = delta === null
        ? 'First day in range'
        : (delta > 0 ? '+' : '') + delta.toFixed(1) + ' pts open vs previous day';
      tooltip.setAttribute('aria-hidden', 'false');
      positionTooltip(day);

      if (!tracked) {
        tracked = true;
        track('chart_detail_view', {
          chart: 'open-weight-token-share-over-time',
          input: input || 'pointer'
        });
      }
    }

    function showAt(clientX, input) {
      var rect = plot.getBoundingClientRect();
      var relativeX = clamp(clientX - rect.left, 0, rect.width - 1);
      var index = clamp(Math.floor((relativeX / rect.width) * days.length), 0, days.length - 1);
      show(days[index], input);
    }

    function hide() {
      if (activeDay) activeDay.classList.remove('is-active');
      activeDay = null;
      tooltip.setAttribute('aria-hidden', 'true');
    }

    plot.addEventListener('pointermove', function (event) {
      if (event.pointerType === 'touch') return;
      touchPinned = false;
      showAt(event.clientX, event.pointerType || 'mouse');
    });

    plot.addEventListener('pointerleave', function () {
      if (!touchPinned) hide();
    });

    plot.addEventListener('pointerdown', function (event) {
      if (event.pointerType !== 'touch') return;
      touchPinned = true;
      showAt(event.clientX, 'touch');
    });

    plot.addEventListener('focus', function () {
      if (!activeDay) show(days[days.length - 1], 'keyboard');
    });

    plot.addEventListener('blur', function () {
      if (!touchPinned) hide();
    });

    document.addEventListener('pointerdown', function (event) {
      if (plot.contains(event.target)) return;
      touchPinned = false;
      hide();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key !== 'Escape') return;
      touchPinned = false;
      hide();
    });
  }

  setupAdoptionTooltip();

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
