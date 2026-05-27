(function () {
  function initializePlayer(streamUrl) {
    var video = document.querySelector('[data-player-video]');
    var launch = document.querySelector('[data-player-launch]');
    var stage = document.querySelector('.player-stage');
    var ready = false;
    var hls = null;

    function attach() {
      if (!video || ready) {
        return;
      }
      ready = true;
      video.controls = true;
      if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = streamUrl;
      } else if (window.Hls && window.Hls.isSupported()) {
        hls = new Hls({
          enableWorker: true,
          lowLatencyMode: true
        });
        hls.loadSource(streamUrl);
        hls.attachMedia(video);
      } else {
        video.src = streamUrl;
      }
      video.load();
    }

    function play(event) {
      if (event) {
        event.preventDefault();
      }
      attach();
      if (launch) {
        launch.classList.add('is-hidden');
      }
      var result = video.play();
      if (result && result.catch) {
        result.catch(function () {});
      }
    }

    if (launch) {
      launch.addEventListener('click', play);
    }

    if (stage) {
      stage.addEventListener('click', function (event) {
        if (!ready && event.target === stage) {
          play(event);
        }
      });
    }

    if (video) {
      video.addEventListener('play', function () {
        if (launch) {
          launch.classList.add('is-hidden');
        }
      });
      window.addEventListener('beforeunload', function () {
        if (hls) {
          hls.destroy();
        }
      });
    }
  }

  window.initializePlayer = initializePlayer;
})();
