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

  function setupChartDetailTooltips() {
    document.querySelectorAll('.charts-figure').forEach(function (figure) {
      var targets = Array.prototype.slice.call(figure.querySelectorAll('[data-chart-detail]'));
      if (!targets.length) return;

      var tooltip = document.createElement('div');
      var titleNode = document.createElement('span');
      var valueNode = document.createElement('strong');
      var noteNode = document.createElement('p');
      var activeTarget = null;
      var pinnedTarget = null;
      var tracked = false;

      tooltip.className = 'charts-detail-tooltip';
      tooltip.setAttribute('role', 'status');
      tooltip.setAttribute('aria-live', 'polite');
      tooltip.setAttribute('aria-hidden', 'true');
      tooltip.appendChild(titleNode);
      tooltip.appendChild(valueNode);
      tooltip.appendChild(noteNode);
      figure.appendChild(tooltip);

      function clamp(value, minimum, maximum) {
        return Math.max(minimum, Math.min(maximum, value));
      }

      function positionTooltip(target, clientX, clientY) {
        var figureRect = figure.getBoundingClientRect();
        var targetRect = target.getBoundingClientRect();
        var tooltipWidth = tooltip.offsetWidth;
        var tooltipHeight = tooltip.offsetHeight;
        var anchorX = typeof clientX === 'number' ? clientX : targetRect.left + (targetRect.width / 2);
        var anchorY = typeof clientY === 'number' ? clientY : targetRect.top;
        var left = clamp(anchorX - figureRect.left - (tooltipWidth / 2), 8, figureRect.width - tooltipWidth - 8);
        var top = anchorY - figureRect.top - tooltipHeight - 12;

        if (top < 8) top = targetRect.bottom - figureRect.top + 10;
        top = clamp(top, 8, figureRect.height - tooltipHeight - 8);
        tooltip.style.left = Math.round(left) + 'px';
        tooltip.style.top = Math.round(top) + 'px';
      }

      function show(target, input, clientX, clientY) {
        if (activeTarget && activeTarget !== target) {
          activeTarget.classList.remove('is-active');
          activeTarget.setAttribute('aria-pressed', 'false');
        }
        activeTarget = target;
        activeTarget.classList.add('is-active');
        activeTarget.setAttribute('aria-pressed', pinnedTarget === target ? 'true' : 'false');
        titleNode.textContent = target.getAttribute('data-detail-title') || '';
        valueNode.textContent = target.getAttribute('data-detail-value') || '';
        noteNode.textContent = target.getAttribute('data-detail-note') || '';
        tooltip.setAttribute('aria-hidden', 'false');
        positionTooltip(target, clientX, clientY);

        if (!tracked) {
          tracked = true;
          track('chart_detail_view', {
            chart: figure.getAttribute('data-chart') || 'unknown',
            input: input || 'pointer'
          });
        }
      }

      function hide() {
        if (activeTarget) {
          activeTarget.classList.remove('is-active');
          activeTarget.setAttribute('aria-pressed', 'false');
        }
        activeTarget = null;
        tooltip.setAttribute('aria-hidden', 'true');
        tooltip.style.left = '8px';
        tooltip.style.top = '8px';
      }

      targets.forEach(function (target) {
        target.addEventListener('pointerenter', function (event) {
          if (event.pointerType === 'touch') return;
          if (!pinnedTarget) show(target, event.pointerType || 'mouse', event.clientX, event.clientY);
        });
        target.addEventListener('pointermove', function (event) {
          if (event.pointerType === 'touch' || pinnedTarget) return;
          show(target, event.pointerType || 'mouse', event.clientX, event.clientY);
        });
        target.addEventListener('pointerleave', function () {
          if (!pinnedTarget) hide();
        });
        target.addEventListener('focus', function () {
          show(target, 'keyboard');
        });
        target.addEventListener('blur', function () {
          if (!pinnedTarget) hide();
        });
        target.addEventListener('click', function (event) {
          event.preventDefault();
          if (pinnedTarget === target) {
            pinnedTarget = null;
            hide();
            return;
          }
          pinnedTarget = target;
          show(target, event.pointerType || 'selection', event.clientX || undefined, event.clientY || undefined);
          activeTarget.setAttribute('aria-pressed', 'true');
        });
        target.addEventListener('keydown', function (event) {
          if (event.key !== 'Enter' && event.key !== ' ') return;
          event.preventDefault();
          target.click();
        });
      });

      document.addEventListener('pointerdown', function (event) {
        if (figure.contains(event.target)) return;
        pinnedTarget = null;
        hide();
      });
      document.addEventListener('keydown', function (event) {
        if (event.key !== 'Escape') return;
        pinnedTarget = null;
        hide();
      });
      window.addEventListener('resize', function () {
        if (activeTarget) positionTooltip(activeTarget);
      });
    });
  }

  function setupDonutChart() {
    var chart = document.querySelector('[data-donut-chart]');
    if (!chart) return;

    var donut = chart.querySelector('.charts-donut');
    var buttons = Array.prototype.slice.call(chart.querySelectorAll('[data-donut-segment]'));
    var valueNode = chart.querySelector('[data-donut-value]');
    var labelNode = chart.querySelector('[data-donut-label]');
    var segments = [
      { label: 'Under 1B', value: '83%', end: 83 },
      { label: '1B–100B', value: '16%', end: 99 },
      { label: 'Above 100B', value: '1%', end: 100 }
    ];
    var selectedIndex = 0;
    var hoverIndex = null;
    var tracked = false;

    function select(index, lock, input) {
      var safeIndex = Math.max(0, Math.min(segments.length - 1, index));
      if (lock) selectedIndex = safeIndex;
      hoverIndex = lock ? null : safeIndex;
      chart.setAttribute('data-active', String(safeIndex));
      valueNode.textContent = segments[safeIndex].value;
      labelNode.textContent = segments[safeIndex].label;
      buttons.forEach(function (button, buttonIndex) {
        button.setAttribute('aria-pressed', String(buttonIndex === safeIndex));
      });
      donut.setAttribute('aria-label', segments[safeIndex].label + ': ' + segments[safeIndex].value + ' of downloads. Use the arrow keys or select a category.');

      if (input !== 'initial' && !tracked) {
        tracked = true;
        track('chart_detail_view', {
          chart: 'downloads-by-parameter-count',
          input: input || 'pointer'
        });
      }
    }

    function resetHover() {
      if (hoverIndex === null) return;
      hoverIndex = null;
      select(selectedIndex, true, 'reset');
    }

    function selectFromPointer(event, lock) {
      var rect = donut.getBoundingClientRect();
      var x = event.clientX - rect.left - (rect.width / 2);
      var y = event.clientY - rect.top - (rect.height / 2);
      var degrees = (Math.atan2(y, x) * 180 / Math.PI + 450) % 360;
      var percentage = degrees / 3.6;
      var index = percentage < segments[0].end ? 0 : percentage < segments[1].end ? 1 : 2;
      select(index, lock, event.pointerType || 'pointer');
    }

    buttons.forEach(function (button, index) {
      button.addEventListener('pointerenter', function (event) {
        if (event.pointerType !== 'touch') select(index, false, event.pointerType || 'mouse');
      });
      button.addEventListener('pointerleave', resetHover);
      button.addEventListener('focus', function () { select(index, false, 'keyboard'); });
      button.addEventListener('blur', resetHover);
      button.addEventListener('click', function () { select(index, true, 'selection'); });
    });

    donut.addEventListener('pointermove', function (event) {
      if (event.pointerType !== 'touch') selectFromPointer(event, false);
    });
    donut.addEventListener('pointerleave', resetHover);
    donut.addEventListener('pointerdown', function (event) {
      selectFromPointer(event, true);
    });
    donut.addEventListener('keydown', function (event) {
      if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
      event.preventDefault();
      var direction = event.key === 'ArrowRight' ? 1 : -1;
      select((selectedIndex + direction + segments.length) % segments.length, true, 'keyboard');
    });

    select(0, true, 'initial');
    tracked = false;
  }

  setupChartDetailTooltips();
  setupDonutChart();

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
