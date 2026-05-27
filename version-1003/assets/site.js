
(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const qs = (name) => new URLSearchParams(location.search).get(name) || '';
  const norm = (s) => String(s || '').toLowerCase();
  const escapeHtml = (str) => String(str || '').replace(/[&<>"']/g, s => ({ '&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;' }[s]));

  function showBackTop() {
    const btn = $('.back-top');
    if (!btn) return;
    const onScroll = () => btn.classList.toggle('show', window.scrollY > 500);
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  function initHeroSlider() {
    const slider = $('.hero-slider');
    if (!slider) return;
    const slides = $$('.hero-slide', slider);
    const dots = $$('.hero-dot', $('.hero-dots'));
    const prev = $('.hero-prev');
    const next = $('.hero-next');
    if (!slides.length) return;
    let index = 0;
    const set = (i) => {
      index = (i + slides.length) % slides.length;
      slides.forEach((slide, idx) => slide.classList.toggle('active', idx === index));
      dots.forEach((dot, idx) => dot.classList.toggle('active', idx === index));
    };
    const advance = () => set(index + 1);
    let timer = setInterval(advance, 6000);
    const restart = () => { clearInterval(timer); timer = setInterval(advance, 6000); };
    prev && prev.addEventListener('click', () => { set(index - 1); restart(); });
    next && next.addEventListener('click', () => { set(index + 1); restart(); });
    dots.forEach((dot, idx) => dot.addEventListener('click', () => { set(idx); restart(); }));
    slider.addEventListener('mouseenter', () => clearInterval(timer));
    slider.addEventListener('mouseleave', () => { clearInterval(timer); timer = setInterval(advance, 6000); });
    set(0);
  }

  function initPlayer() {
    const shell = $('.player-shell');
    if (!shell) return;
    const video = $('video', shell);
    const overlay = $('.player-overlay', shell);
    if (!video) return;
    const tryPlay = async () => {
      try {
        await video.play();
        overlay && overlay.classList.add('hidden');
      } catch (e) {}
    };
    overlay && overlay.addEventListener('click', tryPlay);
    video.addEventListener('play', () => overlay && overlay.classList.add('hidden'));
    video.addEventListener('pause', () => overlay && overlay.classList.remove('hidden'));
    video.addEventListener('ended', () => overlay && overlay.classList.remove('hidden'));
  }

  function initLocalSearch() {
    const input = $('[data-local-search]');
    const cards = $$('.movie-card[data-card]');
    const count = $('[data-local-count]');
    if (!input || !cards.length) return;
    const apply = () => {
      const q = norm(input.value);
      let visible = 0;
      cards.forEach(card => {
        const hit = !q || norm(card.dataset.search).includes(q);
        card.style.display = hit ? '' : 'none';
        if (hit) visible += 1;
      });
      if (count) count.textContent = String(visible);
    };
    input.addEventListener('input', apply);
    apply();
  }

  function posterMarkup(m) {
    return `
      <div class="poster poster--sm" style="--accent:${m.accent};--accent2:${m.accent2};--accent3:${m.accent3}">
        <span class="poster__id">#${m.id}</span>
        <strong>${escapeHtml(m.title)}</strong>
        <em>${escapeHtml(m.genre || '')}</em>
        <small>${m.year}</small>
      </div>`;
  }

  function renderSearchPage() {
    const root = $('#search-results');
    if (!root || !window.SITE_MOVIES) return;
    const input = $('#global-search');
    const sort = $('#sort-by');
    const type = $('#type-filter');
    const region = $('#region-filter');
    const count = $('#search-count');
    const query = qs('q');
    if (input && query) input.value = query;
    const render = () => {
      const q = norm(input ? input.value : query);
      const t = type ? type.value : 'all';
      const r = region ? region.value : 'all';
      const s = sort ? sort.value : 'score';
      let list = window.SITE_MOVIES.filter(m => {
        const hay = [m.title, m.region, m.type, m.genre, m.one_line, m.summary, (m.tags_list || []).join(' ')].join(' ');
        return (!q || norm(hay).includes(q)) && (t === 'all' || norm(m.type) === t) && (r === 'all' || norm(m.region).includes(r));
      });
      list.sort((a, b) => {
        if (s === 'year') return b.year - a.year || b.score - a.score;
        if (s === 'title') return a.title.localeCompare(b.title, 'zh-Hans-CN');
        return b.score - a.score || b.year - a.year;
      });
      if (count) count.textContent = String(list.length);
      if (!list.length) {
        root.innerHTML = '<div class="search-empty">没有找到匹配结果，请尝试更换关键词、类型或地区。</div>';
        return;
      }
      root.innerHTML = list.slice(0, 180).map(m => `
        <article class="movie-card" data-card data-search="${escapeHtml([m.title, m.region, m.type, m.genre, m.one_line, (m.tags_list || []).join(' ')].join(' '))}" style="--accent:${m.accent};--accent2:${m.accent2};--accent3:${m.accent3}">
          <a class="movie-card__poster-link" href="movies/movie-${m.id}.html">${posterMarkup(m)}</a>
          <div class="movie-card__body">
            <div class="movie-card__meta"><span>${escapeHtml(m.type)}</span><span>${m.year}</span><span>${escapeHtml(m.region)}</span></div>
            <h3><a href="movies/movie-${m.id}.html">${escapeHtml(m.title)}</a></h3>
            <p class="movie-card__line">${escapeHtml(m.one_line)}</p>
            <div class="tag-row">${(m.tags_list || []).slice(0,2).map(t => `<span class="tag">${escapeHtml(t)}</span>`).join('')}</div>
          </div>
        </article>`).join('');
    };
    input && input.addEventListener('input', render);
    sort && sort.addEventListener('change', render);
    type && type.addEventListener('change', render);
    region && region.addEventListener('change', render);
    render();
  }

  document.addEventListener('DOMContentLoaded', () => {
    showBackTop();
    initHeroSlider();
    initPlayer();
    initLocalSearch();
    renderSearchPage();
  });
})();
