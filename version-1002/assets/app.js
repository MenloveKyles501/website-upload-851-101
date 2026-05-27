(function () {
    var menuButton = document.querySelector('[data-menu-toggle]');
    var mobilePanel = document.querySelector('[data-mobile-panel]');

    if (menuButton && mobilePanel) {
        menuButton.addEventListener('click', function () {
            mobilePanel.classList.toggle('is-open');
        });
    }

    document.querySelectorAll('[data-search-form]').forEach(function (form) {
        form.addEventListener('submit', function (event) {
            var input = form.querySelector('input[name="q"]');
            var value = input ? input.value.trim() : '';

            if (!value) {
                event.preventDefault();
                window.location.href = 'browse.html';
            }
        });
    });

    var hero = document.querySelector('[data-hero]');

    if (hero) {
        var slides = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-slide]'));
        var dots = Array.prototype.slice.call(hero.querySelectorAll('[data-hero-dot]'));
        var previous = hero.querySelector('[data-hero-prev]');
        var next = hero.querySelector('[data-hero-next]');
        var active = 0;

        function showSlide(index) {
            if (!slides.length) {
                return;
            }

            active = (index + slides.length) % slides.length;

            slides.forEach(function (slide, slideIndex) {
                slide.classList.toggle('is-active', slideIndex === active);
            });

            dots.forEach(function (dot, dotIndex) {
                dot.classList.toggle('is-active', dotIndex === active);
            });
        }

        if (previous) {
            previous.addEventListener('click', function () {
                showSlide(active - 1);
            });
        }

        if (next) {
            next.addEventListener('click', function () {
                showSlide(active + 1);
            });
        }

        dots.forEach(function (dot, index) {
            dot.addEventListener('click', function () {
                showSlide(index);
            });
        });

        window.setInterval(function () {
            showSlide(active + 1);
        }, 5200);
    }

    var filterBar = document.querySelector('[data-filter-bar]');

    if (filterBar) {
        var filterInput = filterBar.querySelector('[data-filter-input]');
        var yearSelect = filterBar.querySelector('[data-filter-year]');
        var genreSelect = filterBar.querySelector('[data-filter-genre]');
        var categorySelect = filterBar.querySelector('[data-filter-category]');
        var cards = Array.prototype.slice.call(document.querySelectorAll('[data-movie-card]'));
        var params = new URLSearchParams(window.location.search);
        var query = params.get('q') || '';

        if (filterInput && query) {
            filterInput.value = query;
        }

        function normalize(value) {
            return (value || '').toString().trim().toLowerCase();
        }

        function filterCards() {
            var keyword = normalize(filterInput ? filterInput.value : '');
            var year = normalize(yearSelect ? yearSelect.value : '');
            var genre = normalize(genreSelect ? genreSelect.value : '');
            var category = normalize(categorySelect ? categorySelect.value : '');

            cards.forEach(function (card) {
                var haystack = normalize(card.getAttribute('data-search'));
                var cardYear = normalize(card.getAttribute('data-year'));
                var cardGenre = normalize(card.getAttribute('data-genre'));
                var matchKeyword = !keyword || haystack.indexOf(keyword) !== -1;
                var matchYear = !year || cardYear === year;
                var matchGenre = !genre || cardGenre === genre || haystack.indexOf(genre) !== -1;
                var matchCategory = !category || haystack.indexOf(category) !== -1;

                card.classList.toggle('is-hidden', !(matchKeyword && matchYear && matchGenre && matchCategory));
            });
        }

        [filterInput, yearSelect, genreSelect, categorySelect].forEach(function (control) {
            if (control) {
                control.addEventListener('input', filterCards);
                control.addEventListener('change', filterCards);
            }
        });

        filterCards();
    }

    var video = document.getElementById('movieVideo');
    var playButton = document.querySelector('[data-play-button]');

    if (video && playButton) {
        var source = video.getAttribute('data-src');
        var hlsInstance = null;
        var loaded = false;

        function attachSource() {
            if (loaded || !source) {
                return;
            }

            loaded = true;

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
        }

        function startPlayback() {
            attachSource();
            playButton.classList.add('is-hidden');

            var playPromise = video.play();

            if (playPromise && typeof playPromise.catch === 'function') {
                playPromise.catch(function () {});
            }
        }

        playButton.addEventListener('click', startPlayback);
        video.addEventListener('click', function () {
            if (video.paused) {
                startPlayback();
            }
        });
        video.addEventListener('play', function () {
            playButton.classList.add('is-hidden');
        });
        video.addEventListener('ended', function () {
            playButton.classList.remove('is-hidden');
        });
        window.addEventListener('beforeunload', function () {
            if (hlsInstance) {
                hlsInstance.destroy();
            }
        });
    }
})();
