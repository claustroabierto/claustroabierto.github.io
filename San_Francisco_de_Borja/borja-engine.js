/*  MOTOR — San Francisco de Borja (3D). MindAR (image target) + <model-viewer>.
 *  MindAR SOLO detecta la foto de la escultura; al reconocerla, se detiene la
 *  cámara y aparece el visor 3D (model-viewer) con el modelo. El giro se limita
 *  al frente (la parte de atrás del mesh no está terminada); un vaivén suave da
 *  vida y el usuario toma control al tocar. "Volver a escanear" reinicia.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = CFG.subtitulo || "";

  const mv = $("mv");
  mv.setAttribute("camera-orbit", CFG.orbit.inicial);
  mv.setAttribute("min-camera-orbit", CFG.orbit.min);
  mv.setAttribute("max-camera-orbit", CFG.orbit.max);

  let mindar, anchor;
  try {
    mindar = new MindARThree({ container: $("ar"), imageTargetSrc: CFG.targetSrc, uiScanning: "no", uiLoading: "no", filterMinCF: 0.0001, filterBeta: 0.001 });
  } catch (e) { return fatal("No se pudo iniciar MindAR: " + e.message); }
  const { renderer, scene, camera } = mindar;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  anchor = mindar.addAnchor(0);

  let activated = false, scanning = false, sway = false, swayRAF = 0, t0 = 0;
  const renderLoop = () => renderer.render(scene, camera);

  async function startScan() {
    if (scanning) return;
    try { await mindar.start(); } catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
    renderer.setAnimationLoop(renderLoop);
    scanning = true;
    $("ar").style.display = "block";
    $("scan").style.display = "flex";
  }
  function stopScan() {
    renderer.setAnimationLoop(null);
    try { mindar.stop(); } catch (_) {}
    scanning = false;
    $("ar").style.display = "none";
  }

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

  function activate() {
    if (activated) return;
    activated = true;
    stopScan();
    $("scan").style.display = "none";
    $("viewer").classList.add("on");
    if (!mv.getAttribute("src")) mv.setAttribute("src", CFG.modelo);  // carga diferida del modelo
    startSway();
  }
  function rescan() {
    activated = false;
    stopSway();
    $("viewer").classList.remove("on");
    startScan();
  }
  anchor.onTargetFound = () => activate();

  // El usuario toma control del giro al tocar el visor (se corta el vaivén).
  $("viewer").addEventListener("pointerdown", (e) => { if (e.target.closest && e.target.closest("#back3d")) return; stopSway(); });
  $("back3d").addEventListener("click", (e) => { e.stopPropagation(); rescan(); });

  await startScan();
  const placa = $("loading").querySelector(".creditos");
  if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";
}
window.addEventListener("DOMContentLoaded", start);
