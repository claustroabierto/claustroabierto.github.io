/*  MOTOR RA — Salvilla de plata (motor propio). SIN marcador + three.js.
 *  Igual que relicario-engine.js (base + slider + reveals + zoom), reutilizado.
 *
 *  Ya no depende de detectar ningún target (antes RA7, letras, medía débil e
 *  imprimió más chico de lo previsto): el análisis flota FIJO sobre la cámara
 *  en vivo, calibrado a mano una vez (ver shared/no-target-ar.js):
 *   1. Aparece la SALVILLA ORIGINAL (foto a color).
 *   2. Encima, la RADIOGRAFÍA — con opacidad controlada por el usuario (slider):
 *      de 0 (solo original) a 1 (solo rayos X). Arranca a 50% = crossfade.
 *   3. Aparece la tabla FRX (composición elemental).
 *
 *  original.webp / rx.webp / frx.webp son full-frame del mismo marco (la salvilla
 *  a color registrada con el disco de rayos X), así que comparten `overlay`.
 */
import * as THREE from "three";
import { initFixedAR, mountCalibPanel, waitAssets } from "../shared/no-target-ar.js?v=5";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const step = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = CFG.subtitulo || "";
  $("ficha-txt").textContent = CFG.ficha || "";

  let renderer, scene, camera, content;
  try {
    ({ renderer, scene, camera, content } = await initFixedAR({ container: $("ar") }));
  } catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  // Calibrado a mano en celular real (2026-08-04) con ?calib=1.
  mountCalibPanel(content, { scale: 0.37, x: -0.40, y: 0.57 });

  const manager = new THREE.LoadingManager();
  const loader = new THREE.TextureLoader(manager);
  const tx = (s) => { const t = loader.load(s); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };

  const OV = CFG.overlay;
  // Todas las capas son el mismo marco (full-frame) -> misma geometría.
  function layer(src, z, ro) {
    const mat = new THREE.MeshBasicMaterial({ map: tx(src), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(OV.width, OV.height), mat);
    mesh.position.set(OV.offsetX, OV.offsetY, z); mesh.renderOrder = ro; content.add(mesh);
    return { mesh, mat };
  }
  const original = layer(CFG.original, 0.001, 1);
  const rxL      = layer(CFG.rx, 0.002, 2);
  const micros   = (CFG.reveals || []).map((src, i) => layer(src, 0.003 + i * 0.001, 5 + i));

  // Discos invisibles de toque en cada hotspot (coords normalizadas sobre el marco).
  const hits = (CFG.hotspots || []).map((h, i) => {
    const lx = OV.offsetX + (h.x - 0.5) * OV.width;
    const ly = OV.offsetY + (0.5 - h.y) * OV.height;
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set(lx, ly, 0.02); m.userData = { idx: i, data: h }; content.add(m); return m;
  });

  // --- Estado / UI ---
  let visible = false, startT = 0, rxAlpha = 0.5, ready = false;
  const clock = new THREE.Clock();
  const INTER = CFG.intervaloReveal || 0.9;

  // Slider de rayos X: arranca a 50% (crossfade). "Revelar" alterna 100%/0% a
  // partir de ahí (100 → 0 → 100 → ...); "Repetir" es aparte y reinicia toda
  // la coreografía (original → rayos X → microscopías), sin tocar el slider.
  const slider = $("reveal");
  if (slider) { slider.value = 50; slider.addEventListener("input", () => { rxAlpha = slider.value / 100; }); }
  const toggleBtn = $("btn-toggle");
  if (toggleBtn) toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    rxAlpha = rxAlpha > 0.5 ? 0 : 1;
    if (slider) slider.value = rxAlpha * 100;
  });
  const rb = $("btn-repeat"); if (rb) rb.addEventListener("click", (e) => { e.stopPropagation(); if (visible) startT = clock.getElapsedTime(); });

  // --- Zoom al tocar una microscopía ---
  function openCard(i) {
    const h = hits[i].userData.data;
    if ($("card-color")) $("card-color").style.background = h.color || "#c9a24b";
    $("card-titulo").textContent = h.titulo || "";
    $("card-pigmento").textContent = h.pigmento || "";
    $("card-formula").textContent = h.formula || "";
    $("card-nota").textContent = h.nota || "";
    const img = $("card-img"); if (img) { if (h.img) { img.src = h.img; img.style.display = "block"; } else { img.removeAttribute("src"); img.style.display = "none"; } }
    const ih = $("card-imghint"); if (ih) ih.style.display = h.img ? "block" : "none";
    $("card").classList.add("on");
  }
  function closeCard() { $("card").classList.remove("on"); const z = $("zoom"); if (z) z.classList.remove("on"); }
  const cc = $("card-close"); if (cc) cc.addEventListener("click", closeCard);
  const cardImg = $("card-img"), zoom = $("zoom"), zoomImg = $("zoom-img");
  if (cardImg && zoom && zoomImg) {
    cardImg.addEventListener("click", () => { if (!cardImg.getAttribute("src")) return; zoomImg.src = cardImg.src; zoom.classList.add("on"); });
    zoom.addEventListener("click", () => zoom.classList.remove("on"));
  }
  const _wp = new THREE.Vector3();
  function handleTap(cx, cy, target) {
    if (!visible || !ready) return;
    if (target && target.closest && target.closest("#panel, #card, #topbar, #zoom")) return;
    let best = -1, bd = Infinity;
    hits.forEach((m, i) => {
      m.getWorldPosition(_wp); _wp.project(camera); if (_wp.z > 1) return;
      const sx = (_wp.x * 0.5 + 0.5) * innerWidth, sy = (-_wp.y * 0.5 + 0.5) * innerHeight;
      const d = Math.hypot(sx - cx, sy - cy); if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0 && bd < Math.min(innerWidth, innerHeight) * 0.17) openCard(best);
  }
  window.addEventListener("pointerdown", (e) => handleTap(e.clientX, e.clientY, e.target));
  window.addEventListener("touchstart", (e) => { const t = e.touches && e.touches[0]; if (t) handleTap(t.clientX, t.clientY, e.target); }, { passive: true });

  // Se muestra apenas terminan de bajar las imágenes (+ colchón fijo), sin
  // esperar a detectar nada.
  await waitAssets(manager);
  $("loading").style.display = "none";
  $("panel").classList.add("on");
  visible = true; startT = clock.getElapsedTime();

  // Tiempos (s desde el arranque): PRIMERO el original (y sostiene), LUEGO el
  // rayos X entra a su opacidad de slider, y recién después las microscopías.
  const T_ORIG = [0.2, 1.0];   // original aparece
  const T_RX   = [1.5, 2.2];   // rayos X entra (a su opacidad de slider)
  const T_MIC0 = 2.9;          // primera microscopía

  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime() - startT;

    const appO = visible ? step(T_ORIG[0], T_ORIG[1], t) : 0;
    const appR = visible ? step(T_RX[0], T_RX[1], t) : 0;
    original.mat.opacity = appO;
    rxL.mat.opacity = appR * rxAlpha;               // crossfade controlado por el usuario
    let shown = 0;
    micros.forEach((p, i) => {
      const a = T_MIC0 + i * INTER, o = visible ? step(a, a + 0.5, t) : 0;
      p.mat.opacity = o; if (o > 0.6) shown++;
    });
    ready = micros.length > 0 && shown >= micros.length;
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
