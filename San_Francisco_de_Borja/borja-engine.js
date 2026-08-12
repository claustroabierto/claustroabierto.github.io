/*  MOTOR — San Francisco de Borja (3D). SIN cámara ni target: el modelo 3D
 *  (<model-viewer>) se muestra directo al abrir. El giro se limita al frente (el
 *  reverso del mesh no está terminado) y un vaivén suave da vida hasta que el
 *  usuario toca. El botón "Escuchar bienvenida" abre la bienvenida en AR
 *  (video del santo con el fondo eliminado, sobre la cámara) -> borja-welcome-ar.js
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

  // Botón "Ver en AR": mostrarlo SOLO si el dispositivo soporta AR
  // (iPhone Quick Look vía USDZ / Android Scene Viewer o WebXR vía GLB).
  var arBtn = $("ar-btn");
  function updateAR() {
    var ok = !!(mv && mv.canActivateAR);
    if (arBtn) arBtn.classList.toggle("show", ok);
    document.body.classList.toggle("ar-ok", ok);   // sube el botón de bienvenida
  }
  if (arBtn && mv) arBtn.addEventListener("click", function () {
    try { mv.activateAR(); } catch (e) {}           // abre Quick Look (iOS) / Scene Viewer (Android)
  });
  if (mv) {
    mv.addEventListener("load", updateAR);
    mv.addEventListener("ar-status", updateAR);
    updateAR();
    setTimeout(updateAR, 1500);   // canActivateAR puede tardar en resolverse
  }

  // Vaivén frontal (se corta al tocar el modelo).
  var sway = true, swayRAF = 0, t0 = performance.now();
  function loop() {
    if (!sway || !mv) return;
    var tt = (performance.now() - t0) / 1000;
    var a = ((CFG.orbit && CFG.orbit.swayDeg) || 35) * Math.sin(tt * 0.5);
    mv.setAttribute("camera-orbit", a.toFixed(1) + "deg 82deg 190%");
    swayRAF = requestAnimationFrame(loop);
  }
  swayRAF = requestAnimationFrame(loop);
  function stopSway() { sway = false; cancelAnimationFrame(swayRAF); }
  if (mv) mv.addEventListener("pointerdown", stopSway);
  // La bienvenida (video del santo en AR) la maneja borja-welcome-ar.js; le
  // dejamos cómo cortar el vaivén al abrirse.
  window.__borjaStopSway = stopSway;
})();
