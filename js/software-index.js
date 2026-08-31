(function () {
  'use strict';

  var directory = document.getElementById('directory');
  if (!directory) return;

  var search = directory.querySelector('[data-software-search]');
  var platform = directory.querySelector('[data-software-platform]');
  var use = directory.querySelector('[data-software-use]');
  var filters = Array.from(directory.querySelectorAll('[data-software-filter]'));
  var resets = Array.from(directory.querySelectorAll('[data-software-reset]'));
  var count = directory.querySelector('[data-software-count]');
  var list = directory.querySelector('[data-software-list]');
  var empty = directory.querySelector('[data-software-empty]');
  var activeRole = 'all';

  function normalize(value) {
    return value.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase();
  }

  function words(value) {
    return normalize(value).match(/[a-z0-9]+/g) || [];
  }

  var rows = Array.from(directory.querySelectorAll('[data-software-row]')).map(function (element) {
    return {
      element: element,
      roles: (element.dataset.type || '').split(/\s+/),
      platforms: (element.dataset.platforms || '').split(/\s+/),
      uses: (element.dataset.uses || '').split(/\s+/),
      words: words(element.textContent + ' ' + (element.dataset.keywords || ''))
    };
  });

  if (!search || !platform || !use || !count || !list || !empty || !rows.length) return;

  function render() {
    var terms = words(search.value);
    var visible = 0;

    rows.forEach(function (row) {
      var matches = (activeRole === 'all' || row.roles.includes(activeRole)) &&
        (platform.value === 'all' || row.platforms.includes(platform.value)) &&
        (use.value === 'all' || row.uses.includes(use.value)) &&
        terms.every(function (term) {
          return row.words.some(function (word) { return word.startsWith(term); });
        });
      row.element.hidden = !matches;
      if (matches) visible += 1;
    });

    list.hidden = visible === 0;
    empty.hidden = visible !== 0;
    count.textContent = 'Showing ' + visible + ' of ' + rows.length + ' tools';
    filters.forEach(function (button) {
      button.setAttribute('aria-pressed', String(button.dataset.softwareFilter === activeRole));
    });
    resets.forEach(function (button) {
      button.disabled = !search.value && platform.value === 'all' && use.value === 'all' && activeRole === 'all';
    });
  }

  function reset() {
    search.value = '';
    platform.value = 'all';
    use.value = 'all';
    activeRole = 'all';
    render();
  }

  filters.forEach(function (button) {
    button.addEventListener('click', function () {
      activeRole = button.dataset.softwareFilter;
      render();
    });
    button.disabled = false;
  });

  resets.forEach(function (button) {
    button.addEventListener('click', function () {
      reset();
      search.focus();
    });
  });

  search.addEventListener('input', render);
  search.addEventListener('search', render);
  platform.addEventListener('change', render);
  use.addEventListener('change', render);
  search.disabled = platform.disabled = use.disabled = false;

  // Guide links must still reveal their destination when filters have hidden it.
  function revealLinkedSoftware(hash) {
    var row = rows.find(function (item) { return '#' + item.element.id === hash; });
    if (!row || !row.element.hidden) return null;
    reset();
    return row.element;
  }

  document.querySelectorAll('a[href^="#software-"]').forEach(function (anchor) {
    anchor.addEventListener('click', function (event) {
      if (event.button || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      revealLinkedSoftware(anchor.getAttribute('href'));
    });
  });
  window.addEventListener('hashchange', function () {
    var revealed = revealLinkedSoftware(window.location.hash);
    if (revealed) revealed.scrollIntoView({ block: 'start' });
  });

  render();
  revealLinkedSoftware(window.location.hash);
})();
