/*  MOTOR RA — Salvilla de plata (motor propio). MindAR (marcador RA7) + three.js.
 *  Igual que relicario-engine.js (base + slider + reveals + zoom), reutilizado.
 *
 *  El target es el CUBO RA7 (letras), así que el análisis flota anclado a él:
 *   1. Aparece la SALVILLA ORIGINAL (foto a color).
 *   2. Encima, la RADIOGRAFÍA — con opacidad controlada por el usuario (slider):
 *      de 0 (solo original) a 1 (solo rayos X). Arranca a 50% = crossfade.
 *   3. Aparece la tabla FRX (composición elemental).
 *
 *  original.webp / rx.webp / frx.webp son full-frame del mismo marco (la salvilla
 *  a color registrada con el disco de rayos X), así que comparten `overlay`.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

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

  let mindar;
  try {
    mindar = new MindARThree({ container: $("ar"), imageTargetSrc: CFG.targetSrc, uiScanning: "no", uiLoading: "no", filterMinCF: 0.0001, filterBeta: 0.001 });
  } catch (e) { return fatal("No se pudo iniciar MindAR: " + e.message); }

  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();
  const tx = (s) => { const t = loader.load(s); t.colorSpace = THREE.SRGBColorSpace; return t; };

  // El target RA7 se imprimió más chico de lo previsto (3cm) y, como todo el
  // tamaño de la pieza está en unidades "ancho del target = 1", el análisis
  // salía chico en pantalla. En vez de tocar cada medida a mano (y que quede
  // atado a ESTE tamaño de impresión en particular), todo el contenido vive
  // en un grupo aparte (`content`) al que se le compensa la escala cada
  // cuadro según la distancia real cámara↔target: MindAR no sabe de
  // centímetros, solo mide esa distancia en sus propias unidades, así que
  // "target chico" y "cámara lejos" son exactamente lo mismo para este
  // cálculo. `REF` = la distancia a la que el tamaño queda "normal" (1x) —
  // ajustar probando con el target real hasta que cubra bien la pantalla a
  // la distancia en que la gente sostiene el celular.
  const content = new THREE.Group();
  anchor.group.add(content);
  const REF = 1.4, MIN_SCALE = 1, MAX_SCALE = 4;
  const _camPos = new THREE.Vector3(), _ancPos = new THREE.Vector3();

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
  anchor.onTargetFound = () => { visible = true; startT = clock.getElapsedTime(); $("scan").style.display = "none"; $("panel").classList.add("on"); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on"); closeCard(); };

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

  try { await mindar.start(); }
  catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  const placa = $("loading").querySelector(".creditos"); if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  // Tiempos (s desde la detección): PRIMERO el original (y sostiene), LUEGO el
  // rayos X entra a su opacidad de slider, y recién después las microscopías.
  const T_ORIG = [0.2, 1.0];   // original aparece
  const T_RX   = [1.5, 2.2];   // rayos X entra (a su opacidad de slider)
  const T_MIC0 = 2.9;          // primera microscopía

  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime() - startT;

    // Compensación de escala por distancia (ver comentario más arriba):
    // multiplicar por la distancia real cancela la división por distancia
    // que hace la proyección en pantalla, así el tamaño aparente queda
    // igual sin importar qué tan lejos/cerca esté el celular del target.
    // No aplica en el preview sin cámara: ahí la "distancia" es un número
    // inventado por la cámara falsa para encuadrar bonito, no una medida
    // real, así que compensarla solo lo desencuadra sin decir nada del
    // tamaño real de impresión — este ajuste hay que probarlo en el celular.
    if (visible && !window.__previewMindAR) {
      camera.getWorldPosition(_camPos);
      content.getWorldPosition(_ancPos);
      const dist = _camPos.distanceTo(_ancPos);
      content.scale.setScalar(THREE.MathUtils.clamp(dist / REF, MIN_SCALE, MAX_SCALE));
    }

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
