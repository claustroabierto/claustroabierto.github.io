/*  MOTOR RA — Escapulario (motor propio, bifurcado de shared/ar-engine.js).
 *  MindAR (image tracking) + three.js, igual que antes, MÁS el pop-up de
 *  detalle con zoom (pellizco/arrastre) que ya tienen salvilla/Florero:
 *   - Tocar el boceto de rayos X (fuera de los círculos) amplía la pieza.
 *   - Tocar "Toca para agrandar" en la tarjeta de una muestra amplía esa
 *     muestra (foto + tabla FRX juntas) en vez de la fotito chica de antes.
 *  El pop-up es independiente del tracking: una vez abierto se queda como
 *  está aunque MindAR pierda el target (son imágenes ya cargadas, no la
 *  cámara en vivo). Al cerrar, si el target se sigue detectando continúa
 *  normal; si se perdió, vuelve el cartel de "apunta la cámara" como siempre.
 *
 *  Se bifurcó en vez de tocar shared/ar-engine.js porque ese motor también
 *  lo usa Inmaculada, que no debía tocarse.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { PanZoom } from "../shared/panzoom.js?v=1";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const step = (a, b, t) => { const x = clamp((t - a) / (b - a), 0, 1); return x * x * (3 - 2 * x); };

function fatal(msg) {
  const el = $("error");
  el.textContent = "⚠ " + msg;
  el.style.display = "block";
  console.error(msg);
}

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");

  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = (CFG.subtitulo || "").replace(/\s*·\s*/g, "\n");
  $("ficha-txt").textContent = CFG.ficha || "";

  let mindar;
  try {
    mindar = new MindARThree({
      container: $("ar"),
      imageTargetSrc: CFG.targetSrc,
      uiScanning: "no",
      uiLoading: "no",
      filterMinCF: 0.0001,
      filterBeta: 0.001
    });
  } catch (e) {
    return fatal("No se pudo iniciar MindAR: " + e.message);
  }

  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();

  const fadeMats = [];
  let mainMesh = null; // el boceto de rayos X (ov) -> se usa para el raycast del pop-up
  function addLayer(cfg, z) {
    const tex = loader.load(cfg.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width, cfg.height), mat);
    mesh.position.set(cfg.offsetX, cfg.offsetY, z);
    anchor.group.add(mesh);
    fadeMats.push(mat);
    return mesh;
  }
  const ov = CFG.overlay;
  mainMesh = addLayer(ov, 0.001);
  (CFG.extras || []).forEach((ex, i) => addLayer(ex, 0.002 + i * 0.001));

  const hasMicro = !!(CFG.microReveals && CFG.microReveals.length);
  const microMats = [];
  if (hasMicro) {
    CFG.microReveals.forEach((src, i) => {
      const tex = loader.load(src); tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(ov.width, ov.height), mat);
      mesh.position.set(ov.offsetX, ov.offsetY, 0.003 + i * 0.001);
      mesh.renderOrder = i;
      anchor.group.add(mesh);
      microMats.push(mat);
    });
  }

  const hotMeshes = [];
  const hitMeshes = [];
  (CFG.hotspots || []).forEach((h, i) => {
    const lx = ov.offsetX + (h.x - 0.5) * ov.width;
    const ly = ov.offsetY + (0.5 - h.y) * ov.height;
    const size = h.size || 0.07;
    const mat = new THREE.MeshBasicMaterial({ color: h.color || "#ffffff", transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
    const ring = new THREE.Mesh(new THREE.RingGeometry(size * 0.7, size, 40), mat);
    ring.position.set(lx, ly, 0.006);
    ring.renderOrder = 30 + i;
    ring.userData = { idx: i, base: 1 };
    anchor.group.add(ring);
    hotMeshes.push(ring);

    const hit = new THREE.Mesh(new THREE.CircleGeometry(Math.max(size * 1.6, 0.11), 24), new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    hit.position.set(lx, ly, 0.007);
    hit.userData = { idx: i };
    anchor.group.add(hit);
    hitMeshes.push(hit);
  });

  let visible = false;
  let microReady = false;
  let microStart = 0;
  anchor.onTargetFound = () => {
    visible = true; $("scan").style.display = "none"; $("panel").classList.add("on");
    if (hasMicro) microStart = performance.now();
  };
  // No cerramos el pop-up ni la tarjeta acá: si el visitante está viendo el
  // zoom y el teléfono se mueve, la imagen ya está cargada y no depende de
  // seguir rastreando. Solo se actualiza el estado de escaneo de atrás.
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on"); };

  const slider = $("reveal");
  let reveal = 0.5;
  slider.addEventListener("input", () => { reveal = slider.value / 100; });
  $("btn-toggle").addEventListener("click", () => { reveal = reveal > 0.5 ? 0 : 1; slider.value = reveal * 100; });
  const btnRepeat = $("btn-repeat");
  if (btnRepeat) btnRepeat.addEventListener("click", () => { if (visible && hasMicro) microStart = performance.now(); });

  // --- Pop-up de detalle (2D, pantalla completa): zoom a la pieza o a una
  // muestra, independiente del tracking una vez abierto. ---
  const CW = CFG.fichaW || 1500, CH = CFG.fichaH || 1495;
  const items = CFG.items || [];
  const byKey = {}; items.forEach((it) => { byKey[it.key] = it; });
  const pop = $("item-pop"), popView = $("item-pop-view"), popStage = $("item-pop-stage");
  let popPZ = null, popItem = null;
  const popOpen = () => pop && pop.classList.contains("on");
  if (pop && popView && popStage && items.length) {
    const set = (id, src) => { const el = $(id); if (el) el.src = src || ""; };
    set("ip-boceto", CFG.overlay.src);
    (CFG.microReveals || []).forEach((src, i) => {
      // microReveals[0] = título (no hace falta en el pop-up); de ahí en
      // adelante van foto1, box1, foto2, box2, foto3, box3 en ese orden.
      if (i === 0) return;
      const n = Math.ceil(i / 2), tipo = i % 2 === 1 ? "foto" : "box";
      const el = $(`ip-d${n}-${tipo}`);
      if (el) el.src = src;
    });
    popPZ = PanZoom(popView, popStage, CW, CH, { skipSel: "#item-pop-head", pad: 0.92 });
    $("item-pop-close").addEventListener("click", (e) => { e.stopPropagation(); closeItem(); });
    pop.addEventListener("click", (e) => { if (e.target === pop) closeItem(); });
    window.addEventListener("resize", () => { if (popOpen() && popItem) popPZ.fitBox(popItem.bbox); });
  }
  const topbar = $("topbar"), panel = $("panel");
  function openItem(it) {
    if (!popPZ || !it) return;
    popItem = it;
    $("item-pop-title").textContent = it.label || "Detalle";
    ["boceto", "d1-foto", "d1-box", "d2-foto", "d2-box", "d3-foto", "d3-box"].forEach((c) => {
      const el = $("ip-" + c); if (el) el.style.display = it.capas.some((k) => c === k || c.startsWith(k + "-")) ? "" : "none";
    });
    pop.classList.add("on");
    if (topbar) topbar.style.display = "none";
    if (panel) panel.style.display = "none";
    popPZ.fitBox(it.bbox);
  }
  function closeItem() {
    if (!pop) return;
    pop.classList.remove("on"); popItem = null;
    if (topbar) topbar.style.display = ""; if (panel) panel.style.display = "";
  }

  // --- Toque sobre hotspots (proyección a pantalla + distancia) ---
  const _wp = new THREE.Vector3();
  const raycaster = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  function handleTap(clientX, clientY, target) {
    if (!visible || popOpen()) return;
    if (hasMicro && !microReady) return;
    if (target && target.closest && target.closest("#panel, #card, #topbar, #zoom, #item-pop")) return;
    let best = -1, bestD = Infinity;
    hitMeshes.forEach((m) => {
      m.getWorldPosition(_wp);
      _wp.project(camera);
      if (_wp.z > 1) return;
      const sx = (_wp.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-_wp.y * 0.5 + 0.5) * window.innerHeight;
      const d = Math.hypot(sx - clientX, sy - clientY);
      if (d < bestD) { bestD = d; best = m.userData.idx; }
    });
    const thresh = Math.min(window.innerWidth, window.innerHeight) * 0.13;
    if (best >= 0 && bestD < thresh) return openCard(best);
    // No cayó en un círculo: ¿tocó dentro de alguna zona (pieza o un
    // detalle ya revelado)? -> amplía esa zona. Mismo raycast+bbox que
    // salvilla/Florero, contra el marco completo (mainMesh cubre las 4 zonas).
    if (!items.length || !mainMesh) return;
    ndc.x = (clientX / window.innerWidth) * 2 - 1;
    ndc.y = -(clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(ndc, camera);
    const hit = raycaster.intersectObject(mainMesh)[0];
    if (!hit || !hit.uv) return;
    const nx = hit.uv.x, ny = 1 - hit.uv.y;
    const it = items.find((i) => nx >= i.bbox[0] && nx <= i.bbox[2] && ny >= i.bbox[1] && ny <= i.bbox[3]);
    if (it) openItem(it);
  }
  window.addEventListener("pointerdown", (e) => handleTap(e.clientX, e.clientY, e.target));
  window.addEventListener("touchstart", (e) => {
    const t = e.touches && e.touches[0];
    if (t) handleTap(t.clientX, t.clientY, e.target);
  }, { passive: true });

  function openCard(i) {
    const h = CFG.hotspots[i];
    $("card-color").style.background = h.color;
    $("card-titulo").textContent = h.titulo;
    $("card-pigmento").textContent = h.pigmento;
    $("card-formula").textContent = h.formula;
    $("card-nota").textContent = h.nota || "";
    const cardImg = $("card-img"), imgHint = $("card-imghint");
    if (cardImg) {
      if (h.img) { cardImg.src = h.img; cardImg.style.display = "block"; if (imgHint) imgHint.style.display = "block"; }
      else { cardImg.removeAttribute("src"); cardImg.style.display = "none"; if (imgHint) imgHint.style.display = "none"; }
    }
    cardImg.dataset.detalle = "d" + (i + 1); // para saber qué item-pop abrir al ampliar
    $("card").classList.add("on");
    hotMeshes.forEach((m, k) => m.userData.base = k === i ? 1.6 : 1);
  }
  function closeCard() {
    $("card").classList.remove("on");
    hotMeshes.forEach((m) => m.userData.base = 1);
  }
  $("card-close").addEventListener("click", closeCard);

  // Tocar la foto de la tarjeta amplía esa muestra (foto + tabla FRX juntas,
  // con zoom real) en vez de la fotito chica de antes.
  const cardImg = $("card-img");
  if (cardImg) {
    cardImg.addEventListener("click", () => {
      if (!cardImg.getAttribute("src")) return;
      const key = cardImg.dataset.detalle;
      if (key && byKey[key]) openItem(byKey[key]);
    });
  }

  try { await mindar.start(); } catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  const placa = $("loading").querySelector(".creditos");
  if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  const clock = new THREE.Clock();
  const INTER = CFG.intervaloReveal || 0.8;
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    fadeMats.forEach((m) => { m.opacity += (reveal - m.opacity) * 0.15; });

    if (hasMicro) {
      const et = (performance.now() - microStart) / 1000;
      let shown = 0;
      microMats.forEach((m, i) => {
        const o = visible ? step(0.2 + i * INTER, 0.2 + i * INTER + 0.5, et) : 0;
        m.opacity += (o - m.opacity) * 0.3;
        if (o > 0.5) shown++;
      });
      microReady = microMats.length > 0 && shown >= microMats.length;
      hotMeshes.forEach((m) => {
        const pulse = 1 + Math.sin(t * 3) * 0.12;
        const s = pulse * m.userData.base;
        m.scale.set(s, s, s);
        m.material.opacity += ((microReady ? 0.9 : 0) - m.material.opacity) * 0.15;
      });
    } else {
      hotMeshes.forEach((m) => {
        const pulse = 1 + Math.sin(t * 3) * 0.12;
        const s = pulse * m.userData.base;
        m.scale.set(s, s, s);
        m.material.opacity = 0.15 + reveal * 0.85;
      });
    }
    renderer.render(scene, camera);
  });
}

window.addEventListener("DOMContentLoaded", start);
