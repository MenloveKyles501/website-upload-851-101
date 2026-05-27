(function () {
  function attachSource(video, source) {
    if (!video || !source) {
      return;
    }

    if (video.canPlayType('application/vnd.apple.mpegurl')) {
      video.src = source;
      return;
    }

    if (window.Hls && window.Hls.isSupported()) {
      var hls = new Hls({
        enableWorker: true,
        lowLatencyMode: false
      });
      hls.loadSource(source);
      hls.attachMedia(video);
      return;
    }

    video.src = source;
  }

  window.initPlayer = function (source) {
    var video = document.querySelector('[data-player]');
    var cover = document.querySelector('.player-cover');
    var loaded = false;

    function ensureLoaded() {
      if (!loaded) {
        attachSource(video, source);
        loaded = true;
      }
    }

    function startPlayback() {
      ensureLoaded();

      if (cover) {
        cover.classList.add('is-hidden');
      }

      if (video) {
        var playing = video.play();
        if (playing && playing.catch) {
          playing.catch(function () {});
        }
      }
    }

    if (video) {
      ensureLoaded();
      video.addEventListener('click', function () {
        if (video.paused) {
          startPlayback();
        }
      });
      video.addEventListener('play', function () {
        if (cover) {
          cover.classList.add('is-hidden');
        }
      });
    }

    if (cover) {
      cover.addEventListener('click', startPlayback);
    }
  };
})();
