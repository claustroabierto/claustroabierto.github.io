/*  Wawapampay — visor 3D + música de fondo (YouTube) + letra corriendo.
 *  model-viewer muestra el diorama (auto-rotate). Un reproductor de YouTube oculto
 *  da la música de fondo (arranca al tocar ▶, por la política de autoplay).
 *  El usuario puede MOVER la música con la barra de tiempo (#seek). Si CFG.letra
 *  tiene líneas {t,txt}, se muestran sincronizadas; las líneas con txt vacío limpian
 *  el subtítulo en los intervalos solo-instrumentales.
 */
(function () {
  var CFG = window.MUSEO_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  // Ocultar la pantalla de carga cuando cargue el modelo.
  var mv = $("mv"), loading = $("loading");
  function hideLoading() { if (loading) loading.style.display = "none"; }
  if (mv) mv.addEventListener("load", hideLoading);
  setTimeout(hideLoading, 12000);

  // --- Reproductor ---
  var player = null, ready = false, playing = false, duration = 0, seeking = false;
  var btn = $("music-btn"), seek = $("seek"), timeEl = $("time");
  var START = CFG.startSec || 0;

  function fmt(s) {
    s = Math.max(0, Math.floor(s || 0));
    var m = Math.floor(s / 60), r = s % 60;
    return m + ":" + (r < 10 ? "0" : "") + r;
  }
  function setBtn() { if (btn) btn.textContent = playing ? "⏸" : "▶"; }
  function grabDuration() {
    if (!duration && player && player.getDuration) {
      duration = player.getDuration() || 0;
      if (seek && duration) seek.max = duration;
    }
  }

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("yt", {
      videoId: CFG.youtubeId,
      playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, start: START },
      events: {
        onReady: function () { ready = true; grabDuration(); },
        onStateChange: function (e) {
          playing = (e.data === YT.PlayerState.PLAYING);
          setBtn(); grabDuration();
          // Repetir desde el minuto de inicio (no desde 0).
          if (e.data === YT.PlayerState.ENDED) { player.seekTo(START, true); player.playVideo(); }
        }
      }
    });
  };
  (function loadAPI() {
    var s = document.createElement("script");
    s.src = "https://www.youtube.com/iframe_api";
    document.head.appendChild(s);
  })();

  if (btn) btn.addEventListener("click", function () {
    if (!ready || !player) return;
    if (playing) player.pauseVideo();
    else player.playVideo();   // el gesto del toque habilita el audio
  });

  // --- Barra de tiempo: el usuario arrastra para mover la música ---
  if (seek) {
    seek.addEventListener("input", function () {
      seeking = true;
      if (timeEl) timeEl.textContent = fmt(seek.value) + " / " + fmt(duration);
    });
    var commit = function () {
      if (ready && player) player.seekTo(Number(seek.value), true);
      seeking = false;
    };
    seek.addEventListener("change", commit);
  }

  // --- Bucle: actualiza barra/tiempo + letra ---
  var letra = (CFG.letra || []).slice().sort(function (a, b) { return a.t - b.t; });
  var box = $("letra"), lastIdx = -2;
  setInterval(function () {
    if (!player || !player.getCurrentTime) return;
    grabDuration();
    var t = player.getCurrentTime();
    if (seek && !seeking && duration) seek.value = t;
    if (timeEl && !seeking) timeEl.textContent = fmt(t) + " / " + fmt(duration);

    if (box && letra.length) {
      // Última línea cuyo tiempo ya pasó (según la posición actual, arrastrable).
      var i = -1;
      for (var k = 0; k < letra.length; k++) { if (letra[k].t <= t) i = k; else break; }
      if (i !== lastIdx) {
        lastIdx = i;
        var txt = (i >= 0) ? letra[i].txt : "";
        if (txt) { box.textContent = txt; box.classList.add("on"); }
        else { box.classList.remove("on"); }   // vacío / instrumental → sin letra
      }
    }
  }, 200);
})();
