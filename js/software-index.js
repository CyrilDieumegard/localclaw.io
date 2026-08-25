(function () {
  'use strict';

  var search = document.querySelector('[data-software-search]');
  var filters = Array.prototype.slice.call(document.querySelectorAll('[data-software-filter]'));
  var rows = Array.prototype.slice.call(document.querySelectorAll('[data-software-row]'));
  if (!search || !rows.length) return;

  var active = 'all';

  function render() {
    var query = search.value.trim().toLowerCase();
    var visible = 0;

    rows.forEach(function (row) {
      var types = (row.dataset.type || '').split(/\s+/);
      var matchesType = active === 'all' || types.includes(active);
      var matchesQuery = !query || row.textContent.toLowerCase().includes(query);
      row.hidden = !(matchesType && matchesQuery);
      if (!row.hidden) visible += 1;
    });

    var empty = document.querySelector('[data-software-empty]');
    if (empty) empty.hidden = visible !== 0;
  }

  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      active = button.dataset.softwareFilter;
      filters.forEach(function (item) {
        item.setAttribute('aria-pressed', String(item === button));
      });
      render();
    });
  });

  search.addEventListener('input', render);
})();
