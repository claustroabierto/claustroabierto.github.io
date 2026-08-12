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
 *
 *  Además, cada zona del análisis (CFG.items con su `bbox`) es tocable: abre un
 *  POP-UP a pantalla completa con esa parte ampliada y explorable (pellizco/
 *  arrastre), como el Florero. La diferencia con el Florero es que aquí NO se
 *  separan las capas: el pop-up mantiene el sobrepuesto y lleva la misma
 *  barrita de rayos X, sincronizada, para cruzar original↔rayos X ya ampliado.
 */
import * as THREE from "three";
import { initFixedAR, fitContentToScreen, mountCalibPanel, waitAssets } from "../shared/no-target-ar.js?v=6";
import { PanZoom } from "../shared/panzoom.js?v=1";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const step = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo;
  // El subtitulo trae varios datos sueltos separados por un punto medio.
  // Se muestran UNO POR LINEA (el CSS usa white-space:pre-line): en un
  // celular, todo seguido en una sola linea se parte a mitad de dato y
  // se lee mal.
  $("subtitulo").textContent = (CFG.subtitulo || "")
    .replace(/\s*\u00B7\s*/g, "\n");
  $("ficha-txt").textContent = CFG.ficha || "";

  let renderer, scene, camera, content;
  try {
    ({ renderer, scene, camera, content } = await initFixedAR({ container: $("ar") }));
  } catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
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

  // Tamaño: se calcula solo para llenar la pantalla (ver shared/no-target-ar.js).
  const fitter = fitContentToScreen(content, camera);
  mountCalibPanel(fitter);

  // --- Estado / UI ---
  let visible = false, startT = 0, rxAlpha = 0.5, ready = false;
  const clock = new THREE.Clock();
  const INTER = CFG.intervaloReveal || 0.9;

  // Slider de rayos X: arranca a 50% (crossfade). "Revelar" alterna 100%/0% a
  // partir de ahí (100 → 0 → 100 → ...); "Repetir" es aparte y reinicia toda
  // la coreografía (original → rayos X → microscopías), sin tocar el slider.
  // Hay DOS barritas (la del panel y la del pop-up de detalle) sobre el mismo
  // valor: `setRx` es el único sitio que lo cambia, así no se desincronizan.
  const slider = $("reveal"), popSlider = $("ip-reveal"), popRxImg = $("ip-rx");
  const popSliderRow = $("item-pop-foot");
  function setRx(v, from) {
    rxAlpha = clamp01(v);
    if (slider && from !== slider) slider.value = rxAlpha * 100;
    if (popSlider && from !== popSlider) popSlider.value = rxAlpha * 100;
    if (popRxImg) popRxImg.style.opacity = rxAlpha;
  }
  if (slider) { slider.value = 50; slider.addEventListener("input", () => setRx(slider.value / 100, slider)); }
  if (popSlider) popSlider.addEventListener("input", () => setRx(popSlider.value / 100, popSlider));
  const toggleBtn = $("btn-toggle");
  if (toggleBtn) toggleBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    setRx(rxAlpha > 0.5 ? 0 : 1);
  });
  const rb = $("btn-repeat"); if (rb) rb.addEventListener("click", (e) => { e.stopPropagation(); if (visible) startT = clock.getElapsedTime(); });

  // Ocultar el análisis: para que el usuario pueda ver la cámara en vivo, sin
  // el sobrepuesto encima, y comparar/alinear contra la pieza real. No toca el
  // estado de la coreografía (`visible`/`startT`): al volver a mostrar, sigue
  // donde iba.
  const hideBtn = $("btn-hide");
  if (hideBtn) hideBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    content.visible = !content.visible;
    hideBtn.textContent = content.visible ? "Ocultar y ver la pieza real" : "Mostrar el análisis";
    hideBtn.classList.toggle("on", !content.visible);
  });

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
  // --- Pop-up de detalle por zona (2D, pantalla completa) ---
  // Las tres capas van apiladas dentro del stage, con el mismo marco, así que
  // el sobrepuesto se mantiene ampliado y la barrita del pop-up lo sigue
  // cruzando. Sin `items` en el config, esto queda inerte.
  const CW = CFG.fichaW || 2361, CH = CFG.fichaH || 1643;
  const items = CFG.items || [];
  const pop = $("item-pop"), popView = $("item-pop-view"), popStage = $("item-pop-stage");
  const popOpen = () => pop && pop.classList.contains("on");
  let popPZ = null, popItem = null;
  if (pop && popView && popStage) {
    const set = (id, src) => { const el = $(id); if (el) el.src = src || ""; };
    set("ip-orig", CFG.original); set("ip-rx", CFG.rxZoom || CFG.rx); set("ip-frx", (CFG.reveals || [])[0]);
    popPZ = PanZoom(popView, popStage, CW, CH, { skipSel: "#item-pop-head, #item-pop-foot", pad: 0.92 });
    $("item-pop-close").addEventListener("click", (e) => { e.stopPropagation(); closeItem(); });
    pop.addEventListener("click", (e) => { if (e.target === pop) closeItem(); });
    window.addEventListener("resize", () => { if (popOpen() && popItem) popPZ.fitBox(popItem.bbox); });
  }
  const topbar = $("topbar"), panel = $("panel");
  function openItem(it) {
    if (!popPZ) return;
    popItem = it;
    $("item-pop-title").textContent = it.label || "Detalle";
    pop.classList.add("on");
    // El fondo del pop-up no es opaco del todo: sin esconder la barra de abajo
    // se transparentan los botones y la barrita del panel justo detrás de los
    // del pop-up, y se lee como una pantalla sucia.
    if (topbar) topbar.style.display = "none";
    if (panel) panel.style.display = "none";
    // Capas visibles por item: en el detalle de la pieza sobra el FRX, que solo
    // aportaría la flecha apuntando a una tabla que queda fuera del encuadre.
    const capas = it.capas || ["orig", "rx", "frx"];
    ["orig", "rx", "frx"].forEach((c) => { const el = $("ip-" + c); if (el) el.style.display = capas.includes(c) ? "" : "none"; });
    if (popSliderRow) popSliderRow.style.display = capas.includes("rx") ? "" : "none";
    setRx(rxAlpha);                       // deja la barrita del pop-up en su sitio
    popPZ.fitBox(it.bbox);
  }
  function closeItem() {
    pop.classList.remove("on"); popItem = null;
    if (topbar) topbar.style.display = ""; if (panel) panel.style.display = "";
  }

  // Toque sobre el análisis anclado: raycast contra el marco (todas las capas
  // comparten geometría) -> UV -> ¿cayó dentro del bbox de una zona? `1 - uv.y`
  // porque los bbox se midieron en coordenadas de imagen (0,0 arriba-izquierda)
  // y la UV de three.js va al revés.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const _wp = new THREE.Vector3();
  function handleTap(cx, cy, target) {
    if (!visible || !ready || !content.visible || popOpen()) return;
    if (target && target.closest && target.closest("#panel, #card, #topbar, #zoom, #item-pop")) return;
    let best = -1, bd = Infinity;
    hits.forEach((m, i) => {
      m.getWorldPosition(_wp); _wp.project(camera); if (_wp.z > 1) return;
      const sx = (_wp.x * 0.5 + 0.5) * innerWidth, sy = (-_wp.y * 0.5 + 0.5) * innerHeight;
      const d = Math.hypot(sx - cx, sy - cy); if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0 && bd < Math.min(innerWidth, innerHeight) * 0.17) return openCard(best);
    if (!items.length || !popPZ) return;
    ndc.x = (cx / innerWidth) * 2 - 1;
    ndc.y = -(cy / innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(original.mesh)[0];
    if (!hit || !hit.uv) return;
    const nx = hit.uv.x, ny = 1 - hit.uv.y;
    const it = items.find((i) => nx >= i.bbox[0] && nx <= i.bbox[2] && ny >= i.bbox[1] && ny <= i.bbox[3]);
    if (it) openItem(it);
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
