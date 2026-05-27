
(function () {
  const q = (sel, root = document) => root.querySelector(sel);
  const qa = (sel, root = document) => Array.from(root.querySelectorAll(sel));

  function initMenu() {
    const btn = q('[data-menu-toggle]');
    const nav = q('[data-nav]');
    if (!btn || !nav) return;
    btn.addEventListener('click', () => nav.classList.toggle('is-open'));
  }

  function setActiveNav() {
    const path = location.pathname.split('/').pop() || 'index.html';
    qa('.site-nav a').forEach(a => {
      if (a.getAttribute('href') === path) a.classList.add('is-active');
    });
  }

  function initCarousel() {
    const root = q('[data-hero-carousel]');
    if (!root) return;
    const slides = qa('.hero-slide', root);
    const dots = qa('[data-carousel-dot]', root);
    const prev = q('[data-carousel-prev]', root);
    const next = q('[data-carousel-next]', root);
    if (!slides.length) return;
    let idx = 0;
    const show = (n) => {
      idx = (n + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('is-active', i === idx));
      dots.forEach((dot, i) => dot.classList.toggle('is-active', i === idx));
    };
    const tick = () => show(idx + 1);
    let timer = setInterval(tick, 5000);
    const reset = () => { clearInterval(timer); timer = setInterval(tick, 5000); };
    if (prev) prev.addEventListener('click', () => { show(idx - 1); reset(); });
    if (next) next.addEventListener('click', () => { show(idx + 1); reset(); });
    dots.forEach((dot, i) => dot.addEventListener('click', () => { show(i); reset(); }));
    show(0);
  }

  function normalize(str) {
    return String(str || '').toLowerCase();
  }

  function initSearch() {
    qa('[data-search-input]').forEach(input => {
      const targetSelector = input.getAttribute('data-search-target');
      const target = targetSelector ? q(targetSelector) : null;
      if (!target) return;
      const cards = qa('[data-filter-card]', target);
      const counter = target.querySelector('[data-result-count]');
      const empty = target.querySelector('[data-empty-state]');

      const apply = () => {
        const term = normalize(input.value).trim();
        let shown = 0;
        cards.forEach(card => {
          const text = normalize(card.getAttribute('data-keywords'));
          const ok = !term || text.includes(term);
          card.style.display = ok ? '' : 'none';
          if (ok) shown += 1;
        });
        if (counter) counter.textContent = shown;
        if (empty) empty.style.display = shown ? 'none' : 'block';
      };
      input.addEventListener('input', apply);
      apply();
    });
  }

  function initPlayers() {
    qa('video[data-hls-src]').forEach(video => {
      if (video.dataset.inited === '1') return;
      video.dataset.inited = '1';
      const shell = video.closest('.player-shell');
      const src = video.dataset.hlsSrc;
      const btn = shell ? q('[data-play]', shell) : null;
      const play = () => video.play().catch(() => {});
      if (btn) btn.addEventListener('click', play);
      video.addEventListener('click', play);

      if (window.Hls && Hls.isSupported()) {
        const hls = new Hls({ enableWorker: true, lowLatencyMode: true });
        hls.loadSource(src);
        hls.attachMedia(video);
        video._hls = hls;
      } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = src;
      } else {
        video.src = src;
      }
    });
  }

  function initScrollTop() {
    const btn = q('[data-back-top]');
    if (!btn) return;
    const onScroll = () => btn.style.display = window.scrollY > 500 ? 'inline-flex' : 'none';
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();
  }

  document.addEventListener('DOMContentLoaded', () => {
    initMenu();
    setActiveNav();
    initCarousel();
    initSearch();
    initPlayers();
    initScrollTop();
  });
})();
