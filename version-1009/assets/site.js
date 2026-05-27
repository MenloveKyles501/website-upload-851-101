
(function () {
  function $(selector, root) {
    return (root || document).querySelector(selector);
  }

  function $all(selector, root) {
    return Array.from((root || document).querySelectorAll(selector));
  }

  function initMenu() {
    const button = $('[data-menu-toggle]');
    const nav = $('[data-site-nav]');
    if (!button || !nav) return;
    button.addEventListener('click', () => nav.classList.toggle('open'));
  }

  function initHeroCarousel() {
    const root = $('[data-hero-carousel]');
    if (!root) return;
    const slides = $all('[data-hero-slide]', root);
    const dots = $all('[data-hero-dot]', root);
    const prev = $('[data-hero-prev]', root);
    const next = $('[data-hero-next]', root);
    if (!slides.length) return;
    let index = 0;
    let timer = null;

    function render(nextIndex) {
      index = (nextIndex + slides.length) % slides.length;
      slides.forEach((slide, i) => slide.classList.toggle('active', i === index));
      dots.forEach((dot, i) => dot.classList.toggle('active', i === index));
    }

    function start() {
      stop();
      timer = window.setInterval(() => render(index + 1), 5500);
    }

    function stop() {
      if (timer) window.clearInterval(timer);
    }

    dots.forEach((dot, i) => dot.addEventListener('click', () => { render(i); start(); }));
    prev && prev.addEventListener('click', () => { render(index - 1); start(); });
    next && next.addEventListener('click', () => { render(index + 1); start(); });
    root.addEventListener('mouseenter', stop);
    root.addEventListener('mouseleave', start);
    render(0);
    start();
  }

  function filterCards(container, query) {
    const cards = $all('.movie-card', container);
    const q = (query || '').trim().toLowerCase();
    cards.forEach(card => {
      const text = `${card.dataset.title || ''} ${card.dataset.region || ''} ${card.dataset.genre || ''} ${card.dataset.year || ''} ${card.dataset.tags || ''}`.toLowerCase();
      card.classList.toggle('is-hidden', q && !text.includes(q));
    });
  }

  function sortCards(container, value) {
    const cards = $all('.movie-card', container);
    const parent = container;
    const comparators = {
      'year-desc': (a, b) => (parseInt(b.dataset.year || '0', 10) - parseInt(a.dataset.year || '0', 10)) || (a.dataset.title || '').localeCompare(b.dataset.title || '', 'zh-Hans-CN'),
      'title-asc': (a, b) => (a.dataset.title || '').localeCompare(b.dataset.title || '', 'zh-Hans-CN'),
      'region-asc': (a, b) => (a.dataset.region || '').localeCompare(b.dataset.region || '', 'zh-Hans-CN') || (a.dataset.title || '').localeCompare(b.dataset.title || '', 'zh-Hans-CN')
    };
    const cmp = comparators[value] || comparators['year-desc'];
    cards.sort(cmp).forEach(card => parent.appendChild(card));
  }

  function initFilters() {
    const inputs = $all('[data-filter-input]');
    inputs.forEach(input => {
      const target = document.querySelector(input.getAttribute('data-filter-target'));
      if (!target) return;
      input.addEventListener('input', () => filterCards(target, input.value));
    });

    const selects = $all('[data-sort-select]');
    selects.forEach(select => {
      const target = document.querySelector(select.getAttribute('data-sort-target'));
      if (!target) return;
      select.addEventListener('change', () => sortCards(target, select.value));
    });
  }

  function initPlayer() {
    const shells = $all('[data-player-shell]');
    if (!shells.length) return;

    shells.forEach(shell => {
      const video = $('.player-video', shell);
      const cover = $('[data-player-cover]', shell);
      const buttons = $all('[data-play-button]', shell);
      const source = shell.dataset.src;
      let hlsInstance = null;
      let loaded = false;

      async function playVideo() {
        if (!loaded) {
          if (video.canPlayType('application/vnd.apple.mpegurl')) {
            video.src = source;
          } else if (window.Hls && window.Hls.isSupported()) {
            hlsInstance = new window.Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
          } else {
            video.src = source;
          }
          loaded = true;
        }
        cover && (cover.style.display = 'none');
        try {
          await video.play();
        } catch (err) {
          console.warn(err);
        }
      }

      buttons.forEach(button => button.addEventListener('click', playVideo));
      video.addEventListener('click', () => {
        if (video.paused) playVideo();
      });
    });
  }

  function init() {
    initMenu();
    initHeroCarousel();
    initFilters();
    initPlayer();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
