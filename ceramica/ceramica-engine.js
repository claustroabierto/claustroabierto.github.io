/*  MOTOR RA — Cerámica (motor propio) · CONGELAR AL DETECTAR.
 *  El infográfico del análisis (rayos X + cara + tabla FRX) es muy ANCHO para
 *  anclarlo a la tarjeta RA8: al acercarse a leer, el marcador sale de cuadro y
 *  MindAR pierde el tracking (sin marcador no hay seguimiento de cámara), así que
 *  el usuario perdía la RA. Solución elegida: MindAR solo DETECTA el RA8; al
 *  reconocerlo, el infográfico se CONGELA en pantalla y se explora con los dedos
 *  (pellizcar = acercar, arrastrar = mover). La tarjeta ya no necesita estar a la
 *  vista. El botón "volver a escanear" reinicia (repite el revelado).
 *
 *  Las dos capas (rayos X y cara+tabla) son el mismo marco 1226x488: se apilan y
 *  aparecen en secuencia (primero los rayos X, luego la cara + composición).
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

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
  const anchor = mindar.addAnchor(0);   // solo para disparar onTargetFound/Lost

  // --- Infográfico congelable (capas DOM, mismo marco apilado) ---
  const ficha = $("ficha"), stage = $("ficha-stage"), rxImg = $("ficha-rx"), frxImg = $("ficha-frx");
  const layers = CFG.reveals || [];
  rxImg.src = layers[0] || "";   // 1) rayos X (perfil + frente + título)
  frxImg.src = layers[1] || "";  // 2) cara a color + tabla FRX + flecha
  const CW = CFG.fichaW || 1226, CH = CFG.fichaH || 488; // aspecto natural del marco

  // Transformación del visor (translate + scale, origen 0,0)
  let scaleV = 1, tx = 0, ty = 0, fit = 1;
  const applyT = () => { stage.style.transform = `translate(${tx}px,${ty}px) scale(${scaleV})`; };
  function fitStage() {
    stage.style.width = CW + "px"; stage.style.height = CH + "px";
    const vw = window.innerWidth, vh = window.innerHeight;
    fit = Math.min(vw * 0.96 / CW, (vh - 120) * 0.98 / CH);
    scaleV = fit; tx = (vw - CW * scaleV) / 2; ty = (vh - CH * scaleV) / 2 - 24;
    applyT();
  }

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
    fitStage();
    reveal();
  }
  function rescan() {
    frozen = false;
    ficha.classList.remove("on");
    $("scan").style.display = "flex";
    // Si la tarjeta sigue a la vista, vuelve a congelar (repite el revelado).
    setTimeout(() => { if (present && !frozen) freeze(); }, 450);
  }
  anchor.onTargetFound = () => { present = true; if (!frozen) freeze(); };
  anchor.onTargetLost = () => { present = false; };
  $("ficha-rescan").addEventListener("click", (e) => { e.stopPropagation(); rescan(); });
  window.addEventListener("resize", () => { if (frozen) fitStage(); });

  // --- Pellizco (zoom) + arrastre (pan) sobre el visor ---
  const pts = new Map();
  let lastDist = 0, lastMid = { x: 0, y: 0 };
  ficha.addEventListener("pointerdown", (e) => {
    if (e.target.closest && e.target.closest("#ficha-bar")) return; // no arrastrar desde la barra
    ficha.setPointerCapture && ficha.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()]; lastDist = Math.hypot(a.x - b.x, a.y - b.y); lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  });
  ficha.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    if (pts.size === 1) { tx += e.clientX - prev.x; ty += e.clientY - prev.y; applyT(); }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const ns = clamp(scaleV * (d / (lastDist || d)), fit * 0.6, fit * 9);
      // zoom alrededor del punto medio + arrastre del punto medio
      tx = mid.x - (mid.x - tx) * (ns / scaleV) + (mid.x - lastMid.x);
      ty = mid.y - (mid.y - ty) * (ns / scaleV) + (mid.y - lastMid.y);
      scaleV = ns; lastDist = d; lastMid = mid; applyT();
    }
  });
  const up = (e) => { pts.delete(e.pointerId); if (pts.size === 2) { const [a, b] = [...pts.values()]; lastDist = Math.hypot(a.x - b.x, a.y - b.y); lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; } };
  ficha.addEventListener("pointerup", up);
  ficha.addEventListener("pointercancel", up);
  // Rueda (escritorio / pruebas): zoom alrededor del cursor.
  ficha.addEventListener("wheel", (e) => {
    if (!frozen) return; e.preventDefault();
    const ns = clamp(scaleV * (1 - e.deltaY * 0.0015), fit * 0.6, fit * 9);
    tx = e.clientX - (e.clientX - tx) * (ns / scaleV);
    ty = e.clientY - (e.clientY - ty) * (ns / scaleV);
    scaleV = ns; applyT();
  }, { passive: false });
  // Doble toque: alterna entre encajado y 2×.
  let lastTap = 0;
  ficha.addEventListener("pointerup", (e) => {
    if (e.target.closest && e.target.closest("#ficha-bar")) return;
    const now = performance.now();
    if (now - lastTap < 300 && pts.size === 0) {
      if (scaleV > fit * 1.3) { fitStage(); }
      else { const ns = fit * 2.2; tx = e.clientX - (e.clientX - tx) * (ns / scaleV); ty = e.clientY - (e.clientY - ty) * (ns / scaleV); scaleV = ns; applyT(); }
    }
    lastTap = now;
  });

  // --- Arranque de cámara ---
  try { await mindar.start(); }
  catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  const placa = $("loading").querySelector(".creditos");
  if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  // Render mínimo: solo para mostrar la cámara en el modo escaneo.
  renderer.setAnimationLoop(() => renderer.render(scene, camera));
}
window.addEventListener("DOMContentLoaded", start);
