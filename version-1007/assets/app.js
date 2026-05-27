(function () {
    function ready(fn) {
        if (document.readyState === "loading") {
            document.addEventListener("DOMContentLoaded", fn);
        } else {
            fn();
        }
    }

    function text(value) {
        return String(value == null ? "" : value).replace(/[&<>"']/g, function (ch) {
            return {
                "&": "&amp;",
                "<": "&lt;",
                ">": "&gt;",
                "\"": "&quot;",
                "'": "&#39;"
            }[ch];
        });
    }

    function setupMenu() {
        var button = document.querySelector("[data-nav-toggle]");
        var menu = document.querySelector("[data-mobile-nav]");
        if (!button || !menu) {
            return;
        }
        button.addEventListener("click", function () {
            menu.classList.toggle("open");
        });
    }

    function setupHero() {
        var slides = Array.prototype.slice.call(document.querySelectorAll("[data-hero-slide]"));
        if (!slides.length) {
            return;
        }
        var dots = Array.prototype.slice.call(document.querySelectorAll("[data-hero-dot]"));
        var prev = document.querySelector("[data-hero-prev]");
        var next = document.querySelector("[data-hero-next]");
        var index = 0;
        var timer;

        function show(nextIndex) {
            index = (nextIndex + slides.length) % slides.length;
            slides.forEach(function (slide, i) {
                slide.classList.toggle("active", i === index);
            });
            dots.forEach(function (dot, i) {
                dot.classList.toggle("active", i === index);
            });
        }

        function restart() {
            window.clearInterval(timer);
            timer = window.setInterval(function () {
                show(index + 1);
            }, 5000);
        }

        dots.forEach(function (dot, i) {
            dot.addEventListener("click", function () {
                show(i);
                restart();
            });
        });
        if (prev) {
            prev.addEventListener("click", function () {
                show(index - 1);
                restart();
            });
        }
        if (next) {
            next.addEventListener("click", function () {
                show(index + 1);
                restart();
            });
        }
        restart();
    }

    function setupLocalFilter() {
        var input = document.querySelector("[data-local-filter]");
        var cards = Array.prototype.slice.call(document.querySelectorAll("[data-card]"));
        if (!input || !cards.length) {
            return;
        }
        input.addEventListener("input", function () {
            var q = input.value.trim().toLowerCase();
            cards.forEach(function (card) {
                var haystack = [
                    card.getAttribute("data-title"),
                    card.getAttribute("data-tags"),
                    card.getAttribute("data-region"),
                    card.getAttribute("data-year"),
                    card.getAttribute("data-category")
                ].join(" ").toLowerCase();
                card.style.display = !q || haystack.indexOf(q) !== -1 ? "" : "none";
            });
        });
    }

    function setupPlayer() {
        var shell = document.querySelector("[data-player]");
        if (!shell) {
            return;
        }
        var video = shell.querySelector("video");
        var button = shell.querySelector("[data-player-button]");
        var status = shell.querySelector("[data-player-status]");
        var stream = shell.getAttribute("data-stream");
        var loaded = false;
        var hls = null;

        function setStatus(message, keep) {
            if (!status) {
                return;
            }
            status.textContent = message || "";
            status.classList.toggle("show", Boolean(message));
            if (message && !keep) {
                window.setTimeout(function () {
                    status.classList.remove("show");
                }, 2200);
            }
        }

        function markPlaying() {
            shell.classList.add("is-playing");
            setStatus("");
        }

        function markPaused() {
            shell.classList.remove("is-playing");
        }

        function playVideo() {
            var playTask = video.play();
            if (playTask && typeof playTask.then === "function") {
                playTask.then(markPlaying).catch(function () {
                    setStatus("点击播放器继续播放", true);
                });
            } else {
                markPlaying();
            }
        }

        function loadStream(callback) {
            if (loaded) {
                callback();
                return;
            }
            if (!stream) {
                setStatus("播放暂不可用", true);
                return;
            }
            loaded = true;
            setStatus("正在加载视频", true);
            if (window.Hls && window.Hls.isSupported()) {
                hls = new window.Hls({
                    enableWorker: true,
                    lowLatencyMode: true
                });
                hls.loadSource(stream);
                hls.attachMedia(video);
                hls.on(window.Hls.Events.MANIFEST_PARSED, function () {
                    callback();
                });
                hls.on(window.Hls.Events.ERROR, function (event, data) {
                    if (data && data.fatal) {
                        setStatus("播放遇到网络波动", true);
                        if (data.type === window.Hls.ErrorTypes.NETWORK_ERROR) {
                            hls.startLoad();
                        } else if (data.type === window.Hls.ErrorTypes.MEDIA_ERROR) {
                            hls.recoverMediaError();
                        }
                    }
                });
            } else if (video.canPlayType("application/vnd.apple.mpegurl")) {
                video.src = stream;
                video.addEventListener("loadedmetadata", callback, { once: true });
            } else {
                setStatus("播放暂不可用，请更换浏览器", true);
            }
        }

        function togglePlay() {
            if (video.paused) {
                loadStream(playVideo);
            } else {
                video.pause();
            }
        }

        if (button) {
            button.addEventListener("click", togglePlay);
        }
        video.addEventListener("click", togglePlay);
        video.addEventListener("play", markPlaying);
        video.addEventListener("pause", markPaused);
        window.addEventListener("pagehide", function () {
            if (hls) {
                hls.destroy();
            }
        });
    }

    function cardTemplate(item) {
        return [
            "<a class=\"movie-card\" href=\"" + text(item.url) + "\">",
            "<div class=\"poster-wrap\">",
            "<img src=\"" + text(item.cover) + "\" alt=\"" + text(item.title) + "\" loading=\"lazy\">",
            "<span class=\"poster-shade\"></span>",
            "<span class=\"play-dot\">▶</span>",
            "<span class=\"duration\">" + text(item.duration) + "</span>",
            "</div>",
            "<div class=\"card-body\">",
            "<h3>" + text(item.title) + "</h3>",
            "<p>" + text(item.oneLine) + "</p>",
            "<div class=\"card-meta\"><span>" + text(item.category) + "</span><span>" + text(item.region) + "</span><span>" + text(item.year) + "</span></div>",
            "</div>",
            "</a>"
        ].join("");
    }

    function setupSearchPage() {
        var input = document.getElementById("searchInput");
        var grid = document.getElementById("searchResults");
        var title = document.getElementById("searchTitle");
        if (!input || !grid || !window.SEARCH_INDEX) {
            return;
        }
        var params = new URLSearchParams(window.location.search);
        var currentFilter = params.get("q") || "";
        input.value = currentFilter;

        function render() {
            var q = input.value.trim().toLowerCase();
            var source = window.SEARCH_INDEX;
            var result = source.filter(function (item) {
                if (!q) {
                    return true;
                }
                return [
                    item.title,
                    item.oneLine,
                    item.category,
                    item.region,
                    item.type,
                    item.genre,
                    item.tags,
                    item.year
                ].join(" ").toLowerCase().indexOf(q) !== -1;
            }).slice(0, 96);
            title.textContent = q ? "搜索结果" : "精选推荐";
            if (result.length) {
                grid.innerHTML = result.map(cardTemplate).join("");
            } else {
                grid.innerHTML = "<div class=\"empty-state\">没有找到相关视频，换个关键词试试。</div>";
            }
        }

        input.addEventListener("input", render);
        Array.prototype.slice.call(document.querySelectorAll("[data-search-filter]")).forEach(function (button) {
            button.addEventListener("click", function () {
                input.value = button.getAttribute("data-search-filter") || "";
                render();
            });
        });
        render();
    }

    ready(function () {
        setupMenu();
        setupHero();
        setupLocalFilter();
        setupPlayer();
        setupSearchPage();
    });
})();
