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
import { initFixedAR, mountCalibPanel, waitAssets } from "../shared/no-target-ar.js?v=5";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const step = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

/*  Controlador reutilizable de zoom + arrastre de un `stage` (marco CWxCH px)
 *  dentro de un `container`. `fitBox(bbox)` encuadra todo el marco (bbox nulo) o
 *  una región normalizada [x0,y0,x1,y1]. opts.skipSel: selector que ignora el gesto. */
function PanZoom(container, stage, CW, CH, opts = {}) {
  let s = 1, tx = 0, ty = 0, fit = 1;
  const pad = opts.pad != null ? opts.pad : 0.94;
  const apply = () => { stage.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; };
  function fitBox(bbox) {
    stage.style.width = CW + "px"; stage.style.height = CH + "px";
    const cw = container.clientWidth, ch = container.clientHeight;
    let bx0 = 0, by0 = 0, bw = CW, bh = CH;
    if (bbox) { bx0 = bbox[0] * CW; by0 = bbox[1] * CH; bw = (bbox[2] - bbox[0]) * CW; bh = (bbox[3] - bbox[1]) * CH; }
    fit = Math.min(cw / bw, ch / bh) * pad;
    s = fit; tx = cw / 2 - (bx0 + bw / 2) * s; ty = ch / 2 - (by0 + bh / 2) * s;
    apply();
  }
  const rect = () => container.getBoundingClientRect();

  const pts = new Map();
  let lastDist = 0, lastMid = { x: 0, y: 0 };
  container.addEventListener("pointerdown", (e) => {
    if (opts.skipSel && e.target.closest && e.target.closest(opts.skipSel)) return;
    container.setPointerCapture && container.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()]; lastDist = Math.hypot(a.x - b.x, a.y - b.y); lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  });
  container.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    if (pts.size === 1) { tx += e.clientX - prev.x; ty += e.clientY - prev.y; apply(); }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const ns = clamp(s * (d / (lastDist || d)), fit * 0.6, fit * 12);
      tx = mid.x - (mid.x - tx) * (ns / s) + (mid.x - lastMid.x);
      ty = mid.y - (mid.y - ty) * (ns / s) + (mid.y - lastMid.y);
      s = ns; lastDist = d; lastMid = mid; apply();
    }
  });
  const up = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; lastDist = Math.hypot(a.x - b.x, a.y - b.y); lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  };
  container.addEventListener("pointerup", up);
  container.addEventListener("pointercancel", up);
  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    const ns = clamp(s * (1 - e.deltaY * 0.0015), fit * 0.6, fit * 12);
    const r = rect();
    tx = (e.clientX - r.left) - ((e.clientX - r.left) - tx) * (ns / s);
    ty = (e.clientY - r.top) - ((e.clientY - r.top) - ty) * (ns / s);
    s = ns; apply();
  }, { passive: false });

  return { fitBox };
}

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
  mountCalibPanel(content, { scale: 0.20, x: -0.20, y: 0.50 });

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

  // --- Pop-up de detalle por item (2D, pantalla completa, independiente del tracking) ---
  const pop = $("item-pop"), popView = $("item-pop-view"), popStage = $("item-pop-stage");
  $("ip-rx").src = layers[0] || ""; $("ip-frx").src = layers[1] || "";
  const popPZ = PanZoom(popView, popStage, CW, CH, { skipSel: "#item-pop-head", pad: 0.92 });
  let popItem = null;
  const topbar = $("topbar");
  function openItem(it) {
    popItem = it;
    $("item-pop-title").textContent = it.label || "Detalle";
    pop.classList.add("on");
    if (topbar) topbar.style.display = "none";
    popPZ.fitBox(it.bbox);
  }
  function closeItem() { pop.classList.remove("on"); popItem = null; if (topbar) topbar.style.display = ""; }
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
