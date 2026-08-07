/*  MOTOR — San Francisco de Borja (3D). SIN cámara ni target: el modelo 3D
 *  (<model-viewer>) se muestra directo al abrir. El giro se limita al frente (el
 *  reverso del mesh no está terminado) y un vaivén suave da vida hasta que el
 *  usuario toca. El botón "Escuchar bienvenida" abre un POP-UP con el video.
 */
(function () {
  var CFG = window.MUSEO_CONFIG || {};
  var $ = function (id) { return document.getElementById(id); };

  var t = $("titulo"); if (t) t.textContent = CFG.titulo || "";
  // El subtítulo trae datos separados por punto medio -> uno por línea.
  var s = $("subtitulo"); if (s) s.textContent = (CFG.subtitulo || "").replace(/\s*·\s*/g, "\n");

  var mv = $("mv");
  if (mv && CFG.orbit) {
    mv.setAttribute("camera-orbit", CFG.orbit.inicial);
    mv.setAttribute("min-camera-orbit", CFG.orbit.min);
    mv.setAttribute("max-camera-orbit", CFG.orbit.max);
  }

  // Ocultar la pantalla de carga cuando cargue el modelo.
  var loading = $("loading");
  function hideLoading() { if (loading) loading.style.display = "none"; }
  if (mv) mv.addEventListener("load", hideLoading);
  setTimeout(hideLoading, 12000);

  // Vaivén frontal (se corta al tocar el modelo).
  var sway = true, swayRAF = 0, t0 = performance.now();
  function loop() {
    if (!sway || !mv) return;
    var tt = (performance.now() - t0) / 1000;
    var a = ((CFG.orbit && CFG.orbit.swayDeg) || 35) * Math.sin(tt * 0.5);
    mv.setAttribute("camera-orbit", a.toFixed(1) + "deg 82deg 105%");
    swayRAF = requestAnimationFrame(loop);
  }
  swayRAF = requestAnimationFrame(loop);
  function stopSway() { sway = false; cancelAnimationFrame(swayRAF); }
  if (mv) mv.addEventListener("pointerdown", stopSway);

  // --- Pop-up de video de bienvenida ---
  var pop = $("video-pop"), vid = $("bienvenida-video");
  var openBtn = $("welcome-btn"), closeBtn = $("video-close");
  function openVideo() {
    if (!pop || !vid) return;
    stopSway();
    pop.classList.add("on");
    try { vid.currentTime = 0; } catch (_) {}
    vid.play().catch(function () {});   // el toque del botón habilita el audio
  }
  function closeVideo() {
    if (!pop || !vid) return;
    vid.pause();
    pop.classList.remove("on");
  }
  if (openBtn) openBtn.addEventListener("click", openVideo);
  if (closeBtn) closeBtn.addEventListener("click", function (e) { e.stopPropagation(); closeVideo(); });
  if (pop) pop.addEventListener("click", function (e) { if (e.target === pop) closeVideo(); });  // tocar fuera cierra
})();
