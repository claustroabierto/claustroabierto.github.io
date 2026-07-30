/*  MOTOR RA — Cerámica (motor propio) · CONGELAR AL DETECTAR + POP-UP POR ITEM.
 *  El infográfico del análisis (rayos X + cara + tabla FRX) es muy ANCHO para
 *  anclarlo a la tarjeta RA8: al acercarse a leer, el marcador sale de cuadro y
 *  MindAR pierde el tracking. Por eso: MindAR solo DETECTA el RA8; al reconocerlo,
 *  el infográfico se CONGELA en pantalla y se explora con los dedos.
 *
 *  Además, cada ELEMENTO del infográfico (las dos radiografías, la cara y la tabla
 *  FRX — definidos en CFG.items con su `bbox`) es tocable: al tocarlo se abre un
 *  POP-UP con esa parte ampliada, también explorable (pellizco/arrastre).
 *
 *  Las dos capas (rayos X y cara+tabla) son el mismo marco 1226x488: se apilan;
 *  al recortar a un bbox se ve solo el elemento correspondiente.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

/*  Controlador reutilizable de zoom + arrastre de un `stage` (marco CWxCH px)
 *  dentro de un `container`. `fitBox(bbox)` encuadra todo el marco (bbox nulo) o
 *  una región normalizada [x0,y0,x1,y1]. opts.onTap(x,y,contentPt) para toques
 *  limpios (sin arrastre ni pellizco). opts.skipSel: selector que ignora el gesto. */
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
  const toContent = (cx, cy) => { const r = rect(); return { x: (cx - r.left - tx) / s, y: (cy - r.top - ty) / s }; };

  const pts = new Map();
  let lastDist = 0, lastMid = { x: 0, y: 0 }, down = null, moved = false, multi = false;
  container.addEventListener("pointerdown", (e) => {
    if (opts.skipSel && e.target.closest && e.target.closest(opts.skipSel)) return;
    container.setPointerCapture && container.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 1) { down = { x: e.clientX, y: e.clientY }; moved = false; multi = false; }
    if (pts.size === 2) { multi = true; const [a, b] = [...pts.values()]; lastDist = Math.hypot(a.x - b.x, a.y - b.y); lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  });
  container.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    if (pts.size === 1) {
      tx += e.clientX - prev.x; ty += e.clientY - prev.y;
      if (down && Math.hypot(e.clientX - down.x, e.clientY - down.y) > 10) moved = true;
      apply();
    }
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
    if (pts.size === 0) {
      if (!multi && !moved && down && opts.onTap) opts.onTap(down.x, down.y, toContent(down.x, down.y));
      down = null; multi = false;
    } else if (pts.size === 2) {
      const [a, b] = [...pts.values()]; lastDist = Math.hypot(a.x - b.x, a.y - b.y); lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
    }
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

  let mindar;
  try {
    mindar = new MindARThree({ container: $("ar"), imageTargetSrc: CFG.targetSrc, uiScanning: "no", uiLoading: "no", filterMinCF: 0.0001, filterBeta: 0.001 });
  } catch (e) { return fatal("No se pudo iniciar MindAR: " + e.message); }
  const { renderer, scene, camera } = mindar;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const anchor = mindar.addAnchor(0);

  const CW = CFG.fichaW || 1226, CH = CFG.fichaH || 488;
  const layers = CFG.reveals || [];
  const items = CFG.items || [];

  // --- Visor congelado ---
  const ficha = $("ficha"), stage = $("ficha-stage"), rxImg = $("ficha-rx"), frxImg = $("ficha-frx");
  rxImg.src = layers[0] || ""; frxImg.src = layers[1] || "";

  // --- Pop-up de detalle por item ---
  const pop = $("item-pop"), popView = $("item-pop-view"), popStage = $("item-pop-stage");
  $("ip-rx").src = layers[0] || ""; $("ip-frx").src = layers[1] || "";
  const popPZ = PanZoom(popView, popStage, CW, CH, { skipSel: "#item-pop-head", pad: 0.92 });
  let popItem = null;
  function openItem(it) {
    popItem = it;
    $("item-pop-title").textContent = it.label || "Detalle";
    pop.classList.add("on");
    popPZ.fitBox(it.bbox);         // encuadra el elemento (el contenedor ya está visible)
  }
  function closeItem() { pop.classList.remove("on"); popItem = null; }
  $("item-pop-close").addEventListener("click", (e) => { e.stopPropagation(); closeItem(); });
  pop.addEventListener("click", (e) => { if (e.target === pop) closeItem(); });

  // Toque limpio en el visor -> ¿cayó dentro de un item? -> abre su pop-up
  function hitItem(cpt) {
    const nx = cpt.x / CW, ny = cpt.y / CH;
    return items.find((it) => nx >= it.bbox[0] && nx <= it.bbox[2] && ny >= it.bbox[1] && ny <= it.bbox[3]);
  }
  const viewPZ = PanZoom(ficha, stage, CW, CH, {
    skipSel: "#ficha-bar",
    onTap: (x, y, cpt) => { const it = hitItem(cpt); if (it) openItem(it); }
  });

  // --- Estado: escaneo / congelado ---
  let frozen = false, present = false, revealT = [];
  function reveal() {
    revealT.forEach(clearTimeout); revealT = [];
    rxImg.style.opacity = 0; frxImg.style.opacity = 0;
    revealT.push(setTimeout(() => { rxImg.style.opacity = 1; }, 80));
    revealT.push(setTimeout(() => { frxImg.style.opacity = 1; }, 730));
  }
  function freeze() {
    if (frozen) return; frozen = true;
    $("scan").style.display = "none";
    ficha.classList.add("on");
    viewPZ.fitBox(null);
    reveal();
  }
  function rescan() {
    frozen = false; closeItem();
    ficha.classList.remove("on"); $("scan").style.display = "flex";
    setTimeout(() => { if (present && !frozen) freeze(); }, 450);
  }
  anchor.onTargetFound = () => { present = true; if (!frozen) freeze(); };
  anchor.onTargetLost = () => { present = false; };
  $("ficha-rescan").addEventListener("click", (e) => { e.stopPropagation(); rescan(); });
  window.addEventListener("resize", () => {
    if (pop.classList.contains("on") && popItem) popPZ.fitBox(popItem.bbox);
    else if (frozen) viewPZ.fitBox(null);
  });

  // --- Arranque de cámara ---
  try { await mindar.start(); }
  catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  const placa = $("loading").querySelector(".creditos");
  if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  renderer.setAnimationLoop(() => renderer.render(scene, camera));
}
window.addEventListener("DOMContentLoaded", start);
