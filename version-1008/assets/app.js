(function () {
  const hlsUrl = "https://cdn.jsdelivr.net/npm/hls.js@1.5.18/dist/hls.min.js";
  let hlsPromise = null;

  function ready(callback) {
    if (document.readyState === "loading") {
      document.addEventListener("DOMContentLoaded", callback);
      return;
    }
    callback();
  }

  function escapeHtml(value) {
    return String(value || "").replace(/[&<>"]/g, function (char) {
      return {
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;"
      }[char];
    });
  }

  function loadHls() {
    if (window.Hls) {
      return Promise.resolve(window.Hls);
    }
    if (!hlsPromise) {
      hlsPromise = new Promise(function (resolve, reject) {
        const script = document.createElement("script");
        script.src = hlsUrl;
        script.async = true;
        script.onload = function () {
          resolve(window.Hls);
        };
        script.onerror = reject;
        document.head.appendChild(script);
      });
    }
    return hlsPromise;
  }

  function initMobileMenu() {
    const toggle = document.querySelector("[data-mobile-toggle]");
    const panel = document.querySelector("[data-mobile-panel]");
    if (!toggle || !panel) {
      return;
    }
    toggle.addEventListener("click", function () {
      const open = panel.classList.toggle("is-open");
      document.body.classList.toggle("no-scroll", open);
      toggle.setAttribute("aria-expanded", String(open));
    });
  }

  function initGlobalSearch() {
    document.querySelectorAll(".global-search").forEach(function (form) {
      form.addEventListener("submit", function (event) {
        const input = form.querySelector("input[name='q']");
        if (!input || !input.value.trim()) {
          event.preventDefault();
        }
      });
    });
  }

  function initHero() {
    const hero = document.querySelector("[data-hero]");
    if (!hero) {
      return;
    }
    const slides = Array.from(hero.querySelectorAll(".hero-slide"));
    const dots = Array.from(hero.querySelectorAll(".hero-dot"));
    const prev = hero.querySelector("[data-hero-prev]");
    const next = hero.querySelector("[data-hero-next]");
    let current = Math.max(0, slides.findIndex(function (slide) {
      return slide.classList.contains("is-active");
    }));
    let timer = null;

    function show(index) {
      current = (index + slides.length) % slides.length;
      slides.forEach(function (slide, slideIndex) {
        slide.classList.toggle("is-active", slideIndex === current);
      });
      dots.forEach(function (dot, dotIndex) {
        dot.classList.toggle("is-active", dotIndex === current);
      });
    }

    function start() {
      stop();
      timer = window.setInterval(function () {
        show(current + 1);
      }, 5600);
    }

    function stop() {
      if (timer) {
        window.clearInterval(timer);
        timer = null;
      }
    }

    dots.forEach(function (dot, index) {
      dot.addEventListener("click", function () {
        show(index);
        start();
      });
    });
    if (prev) {
      prev.addEventListener("click", function () {
        show(current - 1);
        start();
      });
    }
    if (next) {
      next.addEventListener("click", function () {
        show(current + 1);
        start();
      });
    }
    hero.addEventListener("mouseenter", stop);
    hero.addEventListener("mouseleave", start);
    show(current);
    start();
  }

  function initLocalFilters() {
    document.querySelectorAll("[data-filter-scope]").forEach(function (scope) {
      const input = scope.querySelector("[data-filter-input]");
      const chips = Array.from(scope.querySelectorAll("[data-filter-chip]"));
      const selects = Array.from(scope.querySelectorAll("[data-filter-select]"));
      const grid = scope.querySelector("[data-filter-grid]");
      const empty = scope.querySelector("[data-filter-empty]");
      if (!grid) {
        return;
      }
      const cards = Array.from(grid.querySelectorAll("[data-movie-card]"));
      let active = "all";

      function apply() {
        const keyword = input ? input.value.trim().toLowerCase() : "";
        const selectValues = selects.map(function (select) {
          return {
            key: select.getAttribute("data-filter-select"),
            value: select.value
          };
        });
        let visible = 0;
        cards.forEach(function (card) {
          const haystack = [
            card.dataset.title,
            card.dataset.region,
            card.dataset.type,
            card.dataset.genre,
            card.dataset.tags,
            card.dataset.year
          ].join(" ").toLowerCase();
          const matchesKeyword = !keyword || haystack.indexOf(keyword) !== -1;
          const matchesChip = active === "all" || haystack.indexOf(active.toLowerCase()) !== -1;
          const matchesSelects = selectValues.every(function (item) {
            return !item.value || String(card.dataset[item.key] || "") === item.value;
          });
          const show = matchesKeyword && matchesChip && matchesSelects;
          card.classList.toggle("is-hidden", !show);
          if (show) {
            visible += 1;
          }
        });
        if (empty) {
          empty.classList.toggle("is-visible", visible === 0);
        }
      }

      if (input) {
        input.addEventListener("input", apply);
      }
      selects.forEach(function (select) {
        select.addEventListener("change", apply);
      });
      chips.forEach(function (chip) {
        chip.addEventListener("click", function () {
          active = chip.getAttribute("data-filter-chip") || "all";
          chips.forEach(function (item) {
            item.classList.toggle("is-active", item === chip);
          });
          apply();
        });
      });
      apply();
    });
  }

  function movieCard(movie) {
    const tags = Array.isArray(movie.tags) ? movie.tags.slice(0, 3).join(" · ") : "";
    return [
      '<article class="movie-card">',
      '<a class="card-link" href="video/' + escapeHtml(movie.id) + '.html">',
      '<span class="poster-wrap">',
      '<img src="./' + escapeHtml(movie.cover) + '" alt="' + escapeHtml(movie.title) + '" loading="lazy">',
      '<span class="corner-badge">' + escapeHtml(movie.year) + '</span>',
      '<span class="score-badge">' + escapeHtml(movie.score) + '分</span>',
      '<span class="poster-overlay"><span class="play-badge">▶</span></span>',
      '</span>',
      '<strong class="card-title">' + escapeHtml(movie.title) + '</strong>',
      '<span class="card-meta">' + escapeHtml(movie.region) + ' · ' + escapeHtml(movie.type) + '</span>',
      '<span class="card-desc">' + escapeHtml(movie.oneLine || tags) + '</span>',
      '</a>',
      '</article>'
    ].join("");
  }

  function initSearchPage() {
    const results = document.querySelector("[data-search-results]");
    if (!results || !window.siteMovies) {
      return;
    }
    const params = new URLSearchParams(window.location.search);
    const query = (params.get("q") || "").trim();
    const input = document.querySelector("[data-search-page-input]");
    const empty = document.querySelector("[data-search-empty]");
    if (input) {
      input.value = query;
    }

    function render(value) {
      const keyword = value.trim().toLowerCase();
      const matched = window.siteMovies.filter(function (movie) {
        const haystack = [
          movie.title,
          movie.region,
          movie.type,
          movie.year,
          movie.genre,
          Array.isArray(movie.tags) ? movie.tags.join(" ") : "",
          movie.oneLine
        ].join(" ").toLowerCase();
        return !keyword || haystack.indexOf(keyword) !== -1;
      }).slice(0, 180);
      results.innerHTML = matched.map(movieCard).join("");
      if (empty) {
        empty.classList.toggle("is-visible", matched.length === 0);
      }
    }

    if (input) {
      input.addEventListener("input", function () {
        render(input.value);
      });
    }
    render(query);
  }

  function initPlayers() {
    document.querySelectorAll("[data-player]").forEach(function (player) {
      const video = player.querySelector("video");
      const button = player.querySelector("[data-play-button]");
      const source = player.getAttribute("data-source") || (video && video.getAttribute("data-source"));
      let initialized = false;
      let hlsInstance = null;

      if (!video || !source) {
        return;
      }

      function playVideo() {
        player.classList.add("is-started");
        const playPromise = video.play();
        if (playPromise && typeof playPromise.catch === "function") {
          playPromise.catch(function () {});
        }
      }

      function attachSource() {
        if (initialized) {
          playVideo();
          return;
        }
        initialized = true;
        if (video.canPlayType("application/vnd.apple.mpegurl")) {
          video.src = source;
          video.addEventListener("loadedmetadata", playVideo, { once: true });
          video.load();
          return;
        }
        loadHls().then(function (Hls) {
          if (Hls && Hls.isSupported()) {
            hlsInstance = new Hls({
              enableWorker: true,
              lowLatencyMode: true
            });
            hlsInstance.loadSource(source);
            hlsInstance.attachMedia(video);
            hlsInstance.on(Hls.Events.MANIFEST_PARSED, playVideo);
            return;
          }
          video.src = source;
          video.addEventListener("loadedmetadata", playVideo, { once: true });
          video.load();
        }).catch(function () {
          video.src = source;
          video.addEventListener("loadedmetadata", playVideo, { once: true });
          video.load();
        });
      }

      if (button) {
        button.addEventListener("click", attachSource);
      }
      video.addEventListener("click", function () {
        if (video.paused) {
          attachSource();
        } else {
          video.pause();
        }
      });
      window.addEventListener("beforeunload", function () {
        if (hlsInstance) {
          hlsInstance.destroy();
        }
      });
    });
  }

  ready(function () {
    initMobileMenu();
    initGlobalSearch();
    initHero();
    initLocalFilters();
    initSearchPage();
    initPlayers();
  });
})();
