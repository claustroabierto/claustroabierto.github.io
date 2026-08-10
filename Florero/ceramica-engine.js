/*  MOTOR RA — Cerámica / Florero (motor propio). SIN marcador + three.js.
 *
 *  Ya no depende de detectar ningún target (antes RA8, letras, débil): el
 *  análisis del equipo (rayos X + cara a color + tabla FRX) flota FIJO sobre
 *  la cámara en vivo, calibrado a mano una vez (ver shared/no-target-ar.js).
 *  Las dos capas (rx.webp / frx.webp) son el MISMO marco 1226x488, apiladas:
 *  primero aparecen los rayos X, luego la cara a color + tabla FRX.
 *
 *  Cada región del infográfico (definida en CFG.items con su `bbox`) es
 *  tocable: al tocarla se abre un POP-UP a pantalla completa con esa parte
 *  ampliada y explorable (pellizco/arrastre).
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

  const CW = CFG.fichaW || 1226, CH = CFG.fichaH || 488;
  const layers = CFG.reveals || [];
  const items = CFG.items || [];
  const OV = CFG.overlay;

  // --- Infográfico fijo (las dos capas apiladas, en vivo) ---
  function layer(src, z, ro) {
    const mat = new THREE.MeshBasicMaterial({ map: tx(src), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(OV.width, OV.height), mat);
    mesh.position.set(OV.offsetX, OV.offsetY, z); mesh.renderOrder = ro; content.add(mesh);
    return { mesh, mat };
  }
  const rxL = layer(layers[0], 0.001, 1);
  const frxL = layer(layers[1], 0.002, 2);

  // Tamaño: se calcula solo para llenar la pantalla (ver shared/no-target-ar.js).
  const fitter = fitContentToScreen(content, camera);
  mountCalibPanel(fitter);

  // --- Pop-up de detalle por item (2D, pantalla completa, independiente del tracking) ---
  const pop = $("item-pop"), popView = $("item-pop-view"), popStage = $("item-pop-stage");
  $("ip-rx").src = layers[0] || ""; $("ip-frx").src = layers[1] || "";
  const popPZ = PanZoom(popView, popStage, CW, CH, { skipSel: "#item-pop-head", pad: 0.92 });
  let popItem = null;
  const topbar = $("topbar"), panel = $("panel");
  function openItem(it) {
    popItem = it;
    $("item-pop-title").textContent = it.label || "Detalle";
    pop.classList.add("on");
    // El fondo del pop-up no es opaco del todo: sin esconder la barra de abajo
    // se transparentan sus botones detrás del detalle.
    if (topbar) topbar.style.display = "none";
    if (panel) panel.style.display = "none";
    popPZ.fitBox(it.bbox);
  }
  function closeItem() {
    pop.classList.remove("on"); popItem = null;
    if (topbar) topbar.style.display = ""; if (panel) panel.style.display = "";
  }
  $("item-pop-close").addEventListener("click", (e) => { e.stopPropagation(); closeItem(); });
  pop.addEventListener("click", (e) => { if (e.target === pop) closeItem(); });

  // Toque sobre el infográfico anclado: raycast contra la capa superior (misma
  // geometría/posición que la de abajo) -> UV -> ¿cayó dentro del bbox de un
  // item? -> abre su pop-up. `1 - uv.y` porque los bbox se midieron en
  // coordenadas de imagen (0,0 arriba-izquierda) y la UV de three.js va al revés.
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function handleTap(cx, cy, target) {
    if (!visible || pop.classList.contains("on")) return;
    if (target && target.closest && target.closest("#panel, #topbar, #item-pop")) return;
    ndc.x = (cx / innerWidth) * 2 - 1;
    ndc.y = -(cy / innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(frxL.mesh)[0];
    if (!hit || !hit.uv) return;
    const nx = hit.uv.x, ny = 1 - hit.uv.y;
    const it = items.find((i) => nx >= i.bbox[0] && nx <= i.bbox[2] && ny >= i.bbox[1] && ny <= i.bbox[3]);
    if (it) openItem(it);
  }
  window.addEventListener("pointerdown", (e) => handleTap(e.clientX, e.clientY, e.target));
  window.addEventListener("touchstart", (e) => { const t = e.touches && e.touches[0]; if (t) handleTap(t.clientX, t.clientY, e.target); }, { passive: true });

  // --- Estado ---
  let visible = false, startT = 0;
  const clock = new THREE.Clock();
  const rb = $("btn-repeat"); if (rb) rb.addEventListener("click", (e) => { e.stopPropagation(); if (visible) startT = clock.getElapsedTime(); });
  window.addEventListener("resize", () => { if (pop.classList.contains("on") && popItem) popPZ.fitBox(popItem.bbox); });

  // Se muestra apenas terminan de bajar las imágenes (+ colchón fijo), sin
  // esperar a detectar nada.
  await waitAssets(manager);
  $("loading").style.display = "none";
  $("panel").classList.add("on");
  visible = true; startT = clock.getElapsedTime();

  const T_RX = [0.2, 0.9], T_FRX = [1.1, 1.8];
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime() - startT;
    rxL.mat.opacity = visible ? step(T_RX[0], T_RX[1], t) : 0;
    frxL.mat.opacity = visible ? step(T_FRX[0], T_FRX[1], t) : 0;
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
