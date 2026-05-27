(function () {
  const $ = (sel, root = document) => root.querySelector(sel);
  const $$ = (sel, root = document) => Array.from(root.querySelectorAll(sel));
  const loadScript = (src) => new Promise((resolve, reject) => {
    if ([...document.scripts].some(s => s.src === src)) return resolve();
    const s = document.createElement('script');
    s.src = src; s.async = true; s.onload = () => resolve(); s.onerror = reject; document.head.appendChild(s);
  });
  const norm = (text) => (text || '').toLowerCase().replace(/\s+/g, ' ').trim();

  function initHero() {
    const root = $('.hero-stage');
    if (!root) return;
    const slides = $$('.hero-slide', root);
    const dots = $$('.hero-dot');
    if (!slides.length) return;
    let i = slides.findIndex(s => s.classList.contains('is-active'));
    if (i < 0) i = 0;
    const show = (n) => {
      slides.forEach((s, idx) => s.classList.toggle('is-active', idx === n));
      dots.forEach((d, idx) => d.classList.toggle('active', idx === n));
      i = n;
    };
    dots.forEach((dot, idx) => dot.addEventListener('click', () => show(idx)));
    let timer = setInterval(() => show((i + 1) % slides.length), 5200);
    root.addEventListener('mouseenter', () => clearInterval(timer));
    root.addEventListener('mouseleave', () => timer = setInterval(() => show((i + 1) % slides.length), 5200));
  }

  function cardText(card) {
    return norm(card.dataset.title + ' ' + card.dataset.tags + ' ' + card.dataset.genre + ' ' + card.dataset.region + ' ' + card.dataset.year + ' ' + card.dataset.category);
  }

  function initFilters() {
    const input = $('#site-search');
    const cat = $('#category-filter');
    const cards = $$('.film-card[data-filterable="1"], .rank-item[data-filterable="1"]');
    if (!input || !cards.length) return;
    const apply = () => {
      const q = norm(input.value);
      const c = cat ? cat.value : 'all';
      let shown = 0;
      cards.forEach(card => {
        const ok = (!q || cardText(card).includes(q)) && (c === 'all' || card.dataset.category === c);
        card.style.display = ok ? '' : 'none';
        if (ok) shown++;
      });
      const empty = $('#empty-state');
      if (empty) empty.style.display = shown ? 'none' : 'block';
    };
    input.addEventListener('input', apply);
    if (cat) cat.addEventListener('change', apply);
    apply();
  }

  function initPlayer() {
    const box = $('.movie-player');
    if (!box) return;
    const video = $('video', box);
    const overlay = $('.player-overlay', box);
    if (!video) return;
    const src = video.dataset.hlsSrc || video.getAttribute('data-hls-src');
    if (!src) return;
    const start = () => { const p = video.play(); if (p && p.catch) p.catch(() => {}); if (overlay) overlay.style.display = 'none'; };
    const bind = () => {
      if (video.canPlayType('application/vnd.apple.mpegurl')) { video.src = src; return; }
      if (window.Hls && window.Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: false, maxBufferLength: 30 });
        hls.loadSource(src); hls.attachMedia(video); hls.on(Hls.Events.MANIFEST_PARSED, start); box._hls = hls; return;
      }
      video.src = src;
    };
    const ensure = async () => {
      if (!video.canPlayType('application/vnd.apple.mpegurl') && !(window.Hls && window.Hls.isSupported())) {
        await loadScript('https://cdn.jsdelivr.net/npm/hls.js@latest/dist/hls.min.js').catch(() => {});
      }
      bind();
    };
    ensure();
    if (overlay) overlay.addEventListener('click', start);
    box.addEventListener('click', (e) => { if (e.target === video || e.target.closest('.player-overlay')) return; if (video.paused) start(); });
    video.addEventListener('play', () => overlay && (overlay.style.display = 'none'));
  }

  document.addEventListener('DOMContentLoaded', () => {
    initHero();
    initFilters();
    initPlayer();
  });
})();
