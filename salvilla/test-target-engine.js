/*  PRUEBA — Salvilla con TARGET DE IMAGEN REAL (targets_nuevo.mind), en vez
 *  del modo fijo sin target. Geometría pasada por Carlos tras usar editor.html:
 *    overlay: { width: 1.610, height: 1.120, offsetX: 0.312, offsetY: 0.084 }
 *  Como ahora la pieza real se ve directo por la cámara (ya alineada al
 *  target), NO se dibuja `original` (la foto a color) — solo el análisis:
 *  rayos X (con slider) y la tabla FRX, igual que en la pieza real.
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
const OV = { width: 1.610, height: 1.120, offsetX: 0.312, offsetY: 0.084 };

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

  function layer(src, z, ro) {
    const mat = new THREE.MeshBasicMaterial({ map: tx(src), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(OV.width, OV.height), mat);
    mesh.position.set(OV.offsetX, OV.offsetY, z); mesh.renderOrder = ro; anchor.group.add(mesh);
    return { mesh, mat };
  }
  // SIN capa "original": la pieza real ya se ve por la cámara, alineada al target.
  const rxL = layer(CFG.rx, 0.002, 2);
  const micros = (CFG.reveals || []).map((src, i) => layer(src, 0.003 + i * 0.001, 5 + i));

  const hits = (CFG.hotspots || []).map((h, i) => {
    const lx = OV.offsetX + (h.x - 0.5) * OV.width;
    const ly = OV.offsetY + (0.5 - h.y) * OV.height;
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.16, 20), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set(lx, ly, 0.02); m.userData = { idx: i, data: h }; anchor.group.add(m); return m;
  });

  let visible = false, startT = 0, rxAlpha = 0.5, ready = false;
  const clock = new THREE.Clock();
  const INTER = CFG.intervaloReveal || 0.9;

  anchor.onTargetFound = () => { visible = true; $("scan").style.display = "none"; $("panel").classList.add("on"); startT = clock.getElapsedTime(); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on"); };

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
  if (toggleBtn) toggleBtn.addEventListener("click", (e) => { e.stopPropagation(); setRx(rxAlpha > 0.5 ? 0 : 1); });
  const rb = $("btn-repeat"); if (rb) rb.addEventListener("click", (e) => { e.stopPropagation(); if (visible) startT = clock.getElapsedTime(); });

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

  // --- Pop-up de detalle: SOLO rayos X + tabla FRX (sin "orig"). ---
  const CW = CFG.fichaW || 2361, CH = CFG.fichaH || 1643;
  const items = (CFG.items || []).map((it) => ({ ...it, capas: (it.capas || []).filter((c) => c !== "orig") }));
  const pop = $("item-pop"), popView = $("item-pop-view"), popStage = $("item-pop-stage");
  const popOpen = () => pop && pop.classList.contains("on");
  let popPZ = null, popItem = null;
  if (pop && popView && popStage) {
    const set = (id, src) => { const el = $(id); if (el) el.src = src || ""; };
    set("ip-rx", CFG.rx); set("ip-frx", (CFG.reveals || [])[0]);
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
    if (topbar) topbar.style.display = "none";
    if (panel) panel.style.display = "none";
    const capas = it.capas.length ? it.capas : ["rx"];
    ["rx", "frx"].forEach((c) => { const el = $("ip-" + c); if (el) el.style.display = capas.includes(c) ? "" : "none"; });
    if (popSliderRow) popSliderRow.style.display = capas.includes("rx") ? "" : "none";
    setRx(rxAlpha);
    popPZ.fitBox(it.bbox);
  }
  function closeItem() { pop.classList.remove("on"); popItem = null; if (topbar) topbar.style.display = ""; if (panel) panel.style.display = ""; }

  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const _wp = new THREE.Vector3();
  function handleTap(cx, cy, target) {
    if (!visible || !ready || popOpen()) return;
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
    const hit = raycaster.intersectObject(rxL.mesh)[0];
    if (!hit || !hit.uv) return;
    const nx = hit.uv.x, ny = 1 - hit.uv.y;
    const it = items.find((i) => nx >= i.bbox[0] && nx <= i.bbox[2] && ny >= i.bbox[1] && ny <= i.bbox[3]);
    if (it) openItem(it);
  }
  window.addEventListener("pointerdown", (e) => handleTap(e.clientX, e.clientY, e.target));
  window.addEventListener("touchstart", (e) => { const t = e.touches && e.touches[0]; if (t) handleTap(t.clientX, t.clientY, e.target); }, { passive: true });

  try { await mindar.start(); } catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  $("loading").style.display = "none";

  const T_RX = [0.3, 1.0];
  const T_MIC0 = 1.7;
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime() - startT;
    const appR = visible ? step(T_RX[0], T_RX[1], t) : 0;
    rxL.mat.opacity = appR * rxAlpha;
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
