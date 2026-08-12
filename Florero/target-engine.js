/*  PRUEBA — Florero con TARGET DE IMAGEN REAL (targets_nuevo.mind), en vez
 *  del modo fijo sin target. Geometría pasada por Carlos tras usar editor.html:
 *    overlay: { width: 4.080, height: 1.624, offsetX: -0.528, offsetY: 0.060 }
 *  El Florero nunca tuvo capa "original" separada (su análisis ya trae la
 *  cara a color dentro de frx.webp), así que se mantiene igual que antes,
 *  solo con tracking real en vez de overlay fijo.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { PanZoom } from "../shared/panzoom.js?v=1";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const step = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

// Geometría medida con editor.html contra el target nuevo (NO la del modo sin target).
const OV = { width: 4.080, height: 1.624, offsetX: -0.528, offsetY: 0.060 };

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = (CFG.subtitulo || "").replace(/\s*·\s*/g, "\n");
  $("ficha-txt").textContent = CFG.ficha || "";

  let mindar;
  try {
    mindar = new MindARThree({ container: $("ar"), imageTargetSrc: "assets/targets_nuevo.mind", uiScanning: "no", uiLoading: "no", filterMinCF: 0.0001, filterBeta: 0.001 });
  } catch (e) { return fatal("No se pudo iniciar MindAR: " + e.message); }
  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();
  const tx = (s) => { const t = loader.load(s); t.colorSpace = THREE.SRGBColorSpace; return t; };

  const CW = CFG.fichaW || 1226, CH = CFG.fichaH || 488;
  const layers = CFG.reveals || [];
  const items = CFG.items || [];

  function layer(src, z, ro) {
    const mat = new THREE.MeshBasicMaterial({ map: tx(src), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(OV.width, OV.height), mat);
    mesh.position.set(OV.offsetX, OV.offsetY, z); mesh.renderOrder = ro; anchor.group.add(mesh);
    return { mesh, mat };
  }
  const rxL = layer(layers[0], 0.001, 1);
  // En modo target NO va la cara a color del florero: la pieza real ya se ve
  // por la cámara. `frx-target.webp` = el mismo asset sin esa cara, solo la
  // flecha + la tabla FRX.
  const frxL = layer("assets/frx-target.webp?v=1", 0.002, 2);

  const pop = $("item-pop"), popView = $("item-pop-view"), popStage = $("item-pop-stage");
  // En el ZOOM sí va el asset completo (con la cara a color): ampliado ya no
  // se ve la pieza real detrás, así que se presenta la foto.
  $("ip-rx").src = layers[0] || ""; $("ip-frx").src = layers[1] || "";
  const popPZ = PanZoom(popView, popStage, CW, CH, { skipSel: "#item-pop-head", pad: 0.92 });
  let popItem = null;
  const topbar = $("topbar"), panel = $("panel");
  function openItem(it) {
    popItem = it;
    $("item-pop-title").textContent = it.label || "Detalle";
    pop.classList.add("on");
    if (topbar) topbar.style.display = "none";
    if (panel) panel.style.display = "none";
    popPZ.fitBox(it.bbox);
  }
  function closeItem() { pop.classList.remove("on"); popItem = null; if (topbar) topbar.style.display = ""; if (panel) panel.style.display = ""; }
  $("item-pop-close").addEventListener("click", (e) => { e.stopPropagation(); closeItem(); });
  pop.addEventListener("click", (e) => { if (e.target === pop) closeItem(); });

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

  let visible = false, startT = 0;
  const clock = new THREE.Clock();
  const rb = $("btn-repeat"); if (rb) rb.addEventListener("click", (e) => { e.stopPropagation(); if (visible) startT = clock.getElapsedTime(); });
  window.addEventListener("resize", () => { if (pop.classList.contains("on") && popItem) popPZ.fitBox(popItem.bbox); });

  anchor.onTargetFound = () => { visible = true; $("scan").style.display = "none"; $("panel").classList.add("on"); startT = clock.getElapsedTime(); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on"); };

  try { await mindar.start(); } catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  $("loading").style.display = "none";

  const T_RX = [0.2, 0.9], T_FRX = [1.1, 1.8];
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime() - startT;
    rxL.mat.opacity = visible ? step(T_RX[0], T_RX[1], t) : 0;
    frxL.mat.opacity = visible ? step(T_FRX[0], T_FRX[1], t) : 0;
    renderer.render(scene, camera);
  });
}
// El motor llega por import() dinámico (los dos modos viven en la misma URL) y
// ESO resuelve DESPUÉS de DOMContentLoaded: si solo se escuchara el evento, ya
// habría pasado y nunca arrancaría (se quedaba en la pantalla de créditos).
if (document.readyState === "loading") window.addEventListener("DOMContentLoaded", start);
else start();
