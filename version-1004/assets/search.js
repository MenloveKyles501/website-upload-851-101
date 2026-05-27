(function () {
  var input = document.querySelector('[data-search-input]');
  var form = document.querySelector('[data-search-form]');
  var results = document.querySelector('[data-search-results]');
  var summary = document.querySelector('[data-search-summary]');
  var params = new URLSearchParams(window.location.search);
  var initial = params.get('q') || '';

  function escapeHtml(value) {
    return String(value || '')
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  function card(item) {
    var tags = (item.tags || []).slice(0, 4).map(function (tag) {
      return '<span>' + escapeHtml(tag) + '</span>';
    }).join('');

    return '<article class="movie-card">' +
      '<a class="poster-wrap" href="' + item.url + '">' +
        '<img src="' + item.cover + '" alt="' + escapeHtml(item.title) + '" loading="lazy">' +
        '<span class="poster-badge">' + escapeHtml(item.year) + '</span>' +
        '<span class="poster-play">▶</span>' +
      '</a>' +
      '<div class="movie-card-body">' +
        '<div class="movie-meta-line"><span>' + escapeHtml(item.region) + '</span><span>' + escapeHtml(item.type) + '</span></div>' +
        '<h3><a href="' + item.url + '">' + escapeHtml(item.title) + '</a></h3>' +
        '<p>' + escapeHtml(item.oneLine) + '</p>' +
        '<div class="tag-row">' + tags + '</div>' +
      '</div>' +
    '</article>';
  }

  function search(query) {
    var keyword = String(query || '').trim().toLowerCase();
    var list = window.SEARCH_INDEX || [];

    if (!keyword) {
      results.innerHTML = '';
      summary.textContent = '输入关键词开始搜索';
      return;
    }

    var found = list.filter(function (item) {
      var text = [item.title, item.region, item.type, item.year, item.genre, item.oneLine, (item.tags || []).join(' ')].join(' ').toLowerCase();
      return text.indexOf(keyword) !== -1;
    }).slice(0, 80);

    summary.textContent = found.length ? '搜索结果' : '没有找到匹配内容';
    results.innerHTML = found.map(card).join('');
  }

  if (!input || !form || !results || !summary) {
    return;
  }

  input.value = initial;
  search(initial);

  form.addEventListener('submit', function (event) {
    event.preventDefault();
    var query = input.value.trim();
    var url = query ? './search.html?q=' + encodeURIComponent(query) : './search.html';
    history.replaceState(null, '', url);
    search(query);
  });

  input.addEventListener('input', function () {
    search(input.value);
  });
})();
