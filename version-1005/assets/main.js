(function () {
    var menuButton = document.querySelector('[data-menu-button]');
    var mobileNav = document.querySelector('[data-mobile-nav]');

    if (menuButton && mobileNav) {
        menuButton.addEventListener('click', function () {
            mobileNav.classList.toggle('is-open');
        });
    }

    var hero = document.querySelector('[data-hero]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var thumbs = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-thumb]'));
        var current = 0;
        var timer = null;

        var activate = function (index) {
            current = (index + slides.length) % slides.length;
            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === current);
            });
            thumbs.forEach(function (thumb, thumbIndex) {
                thumb.classList.toggle('is-active', thumbIndex === current);
            });
        };

        var start = function () {
            timer = window.setInterval(function () {
                activate(current + 1);
            }, 5200);
        };

        var stop = function () {
            if (timer) {
                window.clearInterval(timer);
            }
        };

        thumbs.forEach(function (thumb) {
            thumb.addEventListener('click', function () {
                stop();
                activate(Number(thumb.getAttribute('data-hero-thumb')) || 0);
                start();
            });
        });

        hero.addEventListener('mouseenter', stop);
        hero.addEventListener('mouseleave', start);
        start();
    }

    var queryInput = document.querySelector('[data-query-input]');

    if (queryInput) {
        var params = new URLSearchParams(window.location.search);
        var q = params.get('q');
        if (q) {
            queryInput.value = q;
        }
    }

    document.querySelectorAll('[data-search-form]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            event.preventDefault();
            var input = form.querySelector('input[name="q"]');
            var value = input ? input.value.trim() : '';
            var target = 'search.html';
            if (value) {
                target += '?q=' + encodeURIComponent(value);
            }
            window.location.href = target;
        });
    });

    document.querySelectorAll('[data-filter-panel]').forEach(function (panel) {
        var input = panel.querySelector('[data-filter-input]');
        var type = panel.querySelector('[data-type-filter]');
        var year = panel.querySelector('[data-year-filter]');
        var grid = document.querySelector('[data-card-grid]');
        var cards = grid ? Array.prototype.slice.call(grid.querySelectorAll('[data-card]')) : [];

        var normalize = function (value) {
            return (value || '').toString().toLowerCase();
        };

        var apply = function () {
            var keyword = normalize(input ? input.value : '');
            var typeValue = normalize(type ? type.value : '');
            var yearValue = normalize(year ? year.value : '');

            cards.forEach(function (card) {
                var haystack = normalize([
                    card.getAttribute('data-title'),
                    card.getAttribute('data-region'),
                    card.getAttribute('data-type'),
                    card.getAttribute('data-year'),
                    card.getAttribute('data-genre'),
                    card.getAttribute('data-tags')
                ].join(' '));

                var okKeyword = !keyword || haystack.indexOf(keyword) > -1;
                var okType = !typeValue || normalize(card.getAttribute('data-type')).indexOf(typeValue) > -1;
                var okYear = !yearValue || normalize(card.getAttribute('data-year')) === yearValue;
                card.classList.toggle('is-hidden', !(okKeyword && okType && okYear));
            });
        };

        [input, type, year].forEach(function (control) {
            if (control) {
                control.addEventListener('input', apply);
                control.addEventListener('change', apply);
            }
        });

        apply();
    });

    document.querySelectorAll('[data-player]').forEach(function (box) {
        var video = box.querySelector('video');
        var button = box.querySelector('[data-play-button]');
        var stream = box.getAttribute('data-stream');
        var ready = false;
        var hlsInstance = null;

        var load = function () {
            if (!video || !stream || ready) {
                return;
            }

            if (video.canPlayType('application/vnd.apple.mpegurl')) {
                video.src = stream;
            } else if (window.Hls && window.Hls.isSupported()) {
                hlsInstance = new window.Hls({
                    maxBufferLength: 30,
                    enableWorker: true
                });
                hlsInstance.loadSource(stream);
                hlsInstance.attachMedia(video);
            } else {
                video.src = stream;
            }

            ready = true;
        };

        var play = function () {
            load();
            if (button) {
                button.classList.add('is-hidden');
            }
            var promise = video.play();
            if (promise && typeof promise.catch === 'function') {
                promise.catch(function () {});
            }
        };

        if (button) {
            button.addEventListener('click', play);
        }

        if (video) {
            video.addEventListener('click', function () {
                if (!ready) {
                    play();
                }
            });
        }

        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    });
})();
