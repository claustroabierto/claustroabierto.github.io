/*  PRUEBA — Relicario con TARGET DE IMAGEN REAL (targets_nuevo.mind), en vez
 *  del modo fijo sin target. Geometría pasada por Carlos tras usar editor.html:
 *    overlay: { width: 1.330, height: 1.404, offsetX: 0.246, offsetY: -0.222 }
 *  Como ahora la pieza real se ve directo por la cámara (ya alineada al
 *  target), NO se dibuja `original` (la foto a color) — solo el análisis:
 *  rayos X (con slider) y las 4 microscopías con sus flechas.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const step = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

// Geometría medida con editor.html contra el target nuevo (NO la del modo sin target).
const OV = { width: 1.330, height: 1.404, offsetX: 0.246, offsetY: -0.222 };

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

  const hotMeshes = [];
  const hits = (CFG.hotspots || []).map((h, i) => {
    const lx = OV.offsetX + (h.x - 0.5) * OV.width;
    const ly = OV.offsetY + (0.5 - h.y) * OV.height;
    const size = h.size || 0.08;
    const m = new THREE.Mesh(new THREE.CircleGeometry(size * 2, 20), new THREE.MeshBasicMaterial({ visible: false }));
    m.position.set(lx, ly, 0.02); m.userData = { idx: i, data: h }; anchor.group.add(m);

    const ringMat = new THREE.MeshBasicMaterial({ color: h.color || "#ffffff", transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(size * 0.75, size, 40), ringMat);
    ring.position.set(lx, ly, 0.021); ring.renderOrder = 20 + i; ring.userData = { idx: i };
    anchor.group.add(ring); hotMeshes.push(ring);
    return m;
  });

  let visible = false, startT = 0, rxAlpha = 0.5, ready = false;
  const clock = new THREE.Clock();
  const INTER = CFG.intervaloReveal || 0.9;

  anchor.onTargetFound = () => { visible = true; $("scan").style.display = "none"; $("panel").classList.add("on"); startT = clock.getElapsedTime(); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on"); };

  const slider = $("reveal");
  if (slider) { slider.value = 50; slider.addEventListener("input", () => { rxAlpha = slider.value / 100; }); }
  const toggleBtn = $("btn-toggle");
  if (toggleBtn) toggleBtn.addEventListener("click", (e) => { e.stopPropagation(); rxAlpha = rxAlpha > 0.5 ? 0 : 1; if (slider) slider.value = rxAlpha * 100; });
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
    hotMeshes.forEach((m) => {
      const pulse = 1 + Math.sin(t * 3) * 0.12;
      m.scale.setScalar(pulse);
      m.material.opacity += ((ready ? 0.9 : 0) - m.material.opacity) * 0.15;
    });
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
