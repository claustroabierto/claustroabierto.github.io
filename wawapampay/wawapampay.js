/*  Wawapampay — visor 3D + música de fondo (YouTube) + letra corriendo.
 *  model-viewer muestra el diorama (auto-rotate). Un reproductor de YouTube oculto
 *  da la música de fondo (arranca al tocar "Música", por la política de autoplay).
 *  Si CFG.letra tiene líneas {t,txt}, se muestran sincronizadas con la canción.
 */
(function () {
  var CFG = window.MUSEO_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  // Ocultar la pantalla de carga cuando cargue el modelo.
  var mv = $("mv"), loading = $("loading");
  function hideLoading() { if (loading) loading.style.display = "none"; }
  if (mv) mv.addEventListener("load", hideLoading);
  setTimeout(hideLoading, 12000);

  // --- Música de fondo (YouTube IFrame API, oculto) ---
  var player = null, ready = false, playing = false;
  var btn = $("music-btn");

  window.onYouTubeIframeAPIReady = function () {
    player = new YT.Player("yt", {
      videoId: CFG.youtubeId,
      playerVars: { controls: 0, disablekb: 1, playsinline: 1, rel: 0, loop: 1, playlist: CFG.youtubeId },
      events: {
        onReady: function () { ready = true; },
        onStateChange: function (e) {
          playing = (e.data === YT.PlayerState.PLAYING);
          if (btn) btn.textContent = playing ? "⏸ Música" : "🎵 Música";
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

  // --- Letra corriendo (subtítulos sincronizados con la música) ---
  var letra = (CFG.letra || []).slice().sort(function (a, b) { return a.t - b.t; });
  var box = $("letra"), lastIdx = -1;
  if (letra.length) {
    setInterval(function () {
      if (!player || !playing || !player.getCurrentTime) return;
      var t = player.getCurrentTime();
      var i = -1;
      for (var k = 0; k < letra.length; k++) { if (letra[k].t <= t) i = k; else break; }
      if (i !== lastIdx) {
        lastIdx = i;
        if (i >= 0) { box.textContent = letra[i].txt; box.classList.add("on"); }
        else { box.classList.remove("on"); }
      }
    }, 200);
  }
})();
