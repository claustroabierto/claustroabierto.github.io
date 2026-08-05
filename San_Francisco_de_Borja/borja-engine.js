/*  MOTOR — San Francisco de Borja (3D).
 *  Intenta activar por IMAGE TARGET (MindAR): al reconocer la foto de la escultura,
 *  aparece el visor 3D. PERO MindAR es frágil en algunos celulares (se cuelga al
 *  pedir la cámara), así que el arranque tiene TIMEOUT: si la cámara no inicia
 *  (permiso denegado, MindAR falla o tarda demasiado), se cae al VISOR 3D DIRECTO
 *  para que el modelo + el audio de bienvenida funcionen igual — nunca se queda
 *  pegado en "cargando". El giro se limita al frente (el reverso del mesh no está
 *  terminado); un vaivén suave da vida y el usuario toma control al tocar.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
function fatal(msg) { const el = $("error"); if (el) { el.textContent = "⚠ " + msg; el.style.display = "block"; } console.error(msg); }

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo;
  // El subtítulo trae varios datos separados por punto medio -> uno por línea.
  $("subtitulo").textContent = (CFG.subtitulo || "").replace(/\s*·\s*/g, "\n");

  const mv = $("mv");
  mv.setAttribute("camera-orbit", CFG.orbit.inicial);
  mv.setAttribute("min-camera-orbit", CFG.orbit.min);
  mv.setAttribute("max-camera-orbit", CFG.orbit.max);

  let activated = false, scanning = false, sway = false, swayRAF = 0, t0 = 0;
  let mindar = null, renderer = null, anchor = null, fellBack = false;

  // --- Vaivén frontal ---
  function startSway() {
    sway = true; t0 = performance.now();
    const loop = () => {
      if (!sway) return;
      const t = (performance.now() - t0) / 1000;
      const a = (CFG.orbit.swayDeg || 35) * Math.sin(t * 0.5);
      mv.setAttribute("camera-orbit", `${a.toFixed(1)}deg 82deg 105%`);
      swayRAF = requestAnimationFrame(loop);
    };
    swayRAF = requestAnimationFrame(loop);
  }
  function stopSway() { sway = false; cancelAnimationFrame(swayRAF); }

  // --- Visor 3D ---
  function showViewer() {
    if (activated) return;
    activated = true;
    if (mindar && scanning) stopScan();
    $("scan").style.display = "none";
    $("viewer").classList.add("on");
    if (!mv.getAttribute("src")) mv.setAttribute("src", CFG.modelo);   // carga diferida
    startSway();
  }
  function rescan() {
    const a = $("bienvenida"); if (a) { a.pause(); a.currentTime = 0; }   // corta la bienvenida
    stopSway();
    if (mindar && !fellBack) {           // hay cámara: volver a escanear
      activated = false;
      $("viewer").classList.remove("on");
      startScan();
    } else {                             // sin cámara: reinicia la vista
      mv.setAttribute("camera-orbit", CFG.orbit.inicial);
      startSway();
    }
  }

  // --- Audio de bienvenida + botones (funcionan en ambos modos) ---
  const audio = $("bienvenida"), abtn = $("audio-btn");
  const abtnLabel = (on) => { if (abtn) abtn.textContent = on ? "⏸ Pausar bienvenida" : "🔊 Escuchar bienvenida"; };
  if (audio && abtn) {
    abtn.addEventListener("click", (e) => { e.stopPropagation(); if (audio.paused) audio.play().catch(() => {}); else audio.pause(); });
    audio.addEventListener("play", () => abtnLabel(true));
    audio.addEventListener("pause", () => abtnLabel(false));
    audio.addEventListener("ended", () => abtnLabel(false));
  }
  $("viewer").addEventListener("pointerdown", (e) => { if (e.target.closest && e.target.closest("#back3d, #audio-btn")) return; stopSway(); });
  $("back3d").addEventListener("click", (e) => { e.stopPropagation(); rescan(); });

  // --- Escaneo por image target (MindAR) ---
  function stopScan() {
    if (renderer) renderer.setAnimationLoop(null);
    try { mindar.stop(); } catch (_) {}
    scanning = false;
    $("ar").style.display = "none";
  }
  async function startScan() {
    await mindar.start();                       // puede colgar/rechazar en algunos celulares
    if (activated || fellBack) { try { mindar.stop(); } catch (_) {} return; }  // ya caímos al 3D directo
    renderer.setAnimationLoop(() => renderer.render(mindar.scene, mindar.camera));
    scanning = true;
    $("ar").style.display = "block";
    $("scan").style.display = "flex";
  }

  try {
    mindar = new MindARThree({ container: $("ar"), imageTargetSrc: CFG.targetSrc, uiScanning: "no", uiLoading: "no", filterMinCF: 0.0001, filterBeta: 0.001 });
    renderer = mindar.renderer;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    anchor = mindar.addAnchor(0);
    anchor.onTargetFound = () => showViewer();
  } catch (e) { mindar = null; }

  const estado = $("loading") && $("loading").querySelector(".estado");
  if (estado) estado.textContent = "Habilita la cámara para escanear la imagen…";

  // Intenta la cámara; si no arranca en 12 s (o falla), cae al visor 3D directo.
  let camOk = false;
  if (mindar) {
    camOk = await Promise.race([
      startScan().then(() => true).catch(() => false),
      new Promise((res) => setTimeout(() => res(false), 12000))
    ]);
  }

  if (camOk) {
    const placa = $("loading").querySelector(".creditos");
    if (placa) $("scan").appendChild(placa.cloneNode(true));
  } else {
    fellBack = true;
    if (mindar) { try { mindar.stop(); } catch (_) {} if (renderer) renderer.setAnimationLoop(null); }
    const bk = $("back3d"); if (bk) bk.style.display = "none";   // no hay a dónde "volver a escanear"
    showViewer();
  }

  $("loading").style.display = "none";
}
window.addEventListener("DOMContentLoaded", start);
