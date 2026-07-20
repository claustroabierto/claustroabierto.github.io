/*  MOTOR RA REUTILIZABLE — Museo Ayacucho / UTEC
 *  MindAR (image tracking) + three.js. Data-driven desde window.MUSEO_CONFIG.
 *  Cubre: rastreo de imagen, overlay de "características flotantes", slider de
 *  revelado (interactivo), hotspots táctiles y etiqueta de respaldo.
 *
 *  El mismo motor servirá para las demás piezas; cada pieza solo trae su config.js.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

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

  // Rellenar textos de la ficha (capa de respaldo "letras RA")
  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = CFG.subtitulo || "";
  $("ficha-txt").textContent = CFG.ficha || "";

  let mindar;
  try {
    mindar = new MindARThree({
      container: $("ar"),
      imageTargetSrc: CFG.targetSrc,
      uiScanning: "no",   // usamos nuestra propia UI
      uiLoading: "no",
      filterMinCF: 0.0001, // suaviza el jitter
      filterBeta: 0.001
    });
  } catch (e) {
    return fatal("No se pudo iniciar MindAR: " + e.message);
  }

  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // nitidez en pantallas retina
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();

  // --- Capas de overlay (la principal + extras opcionales) ---
  const fadeMats = []; // todos los materiales que aparecen con el revelado
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
  // Revelado uno por uno (opcional): si la pieza trae `revelarSecuencial` + `reveals`,
  // el AR muestra los recortes CON su flecha apareciendo en secuencia (igual que la
  // demo), en vez del overlay combinado. Comparten geometría/offset del overlay.
  const seq = !!(CFG.revelarSecuencial && CFG.reveals && CFG.reveals.length);
  const seqMats = [];
  if (seq) {
    CFG.reveals.forEach((src, i) => {
      const tex = loader.load(src); tex.colorSpace = THREE.SRGBColorSpace;
      const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(ov.width, ov.height), mat);
      mesh.position.set(ov.offsetX, ov.offsetY, 0.001 + i * 0.001);
      mesh.renderOrder = i;
      anchor.group.add(mesh);
      seqMats.push(mat);
    });
  } else {
    addLayer(ov, 0.001);
    (CFG.extras || []).forEach((ex, i) => addLayer(ex, 0.002 + i * 0.001));
  }

  // --- Hotspots (anillo visual + disco invisible de toque, más grande) ---
  const hotMeshes = [];  // aros visuales (pulsan)
  const hitMeshes = [];  // discos invisibles para el raycast (área de toque amplia)
  const ringGeo = new THREE.RingGeometry(0.05, 0.07, 40);
  const hitGeo = new THREE.CircleGeometry(0.11, 24);
  (CFG.hotspots || []).forEach((h, i) => {
    const lx = ov.offsetX + (h.x - 0.5) * ov.width;
    const ly = ov.offsetY + (0.5 - h.y) * ov.height; // y invertida
    const mat = new THREE.MeshBasicMaterial({ color: h.color || "#ffffff", transparent: true, opacity: 0.95, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.set(lx, ly, 0.006);
    ring.userData = { idx: i, base: 1 };
    anchor.group.add(ring);
    hotMeshes.push(ring);

    const hit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    hit.position.set(lx, ly, 0.007);
    hit.userData = { idx: i };
    anchor.group.add(hit);
    hitMeshes.push(hit);
  });

  // --- Estado de detección + UI ---
  let visible = false;
  let seqStart = 0;   // instante en que arrancó el revelado secuencial
  anchor.onTargetFound = () => { visible = true; $("scan").style.display = "none"; $("panel").classList.add("on"); if (seq) seqStart = performance.now(); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on"); closeCard(); };

  // Slider de revelado (interactivo): 0 = pintura limpia, 1 = análisis completo.
  // En modo secuencial no aplica: el revelado se anima solo y el botón REPITE.
  const slider = $("reveal");
  let reveal = 0;
  slider.addEventListener("input", () => { reveal = slider.value / 100; });
  $("btn-toggle").addEventListener("click", () => {
    if (seq) { if (visible) seqStart = performance.now(); return; }
    reveal = reveal > 0.5 ? 0 : 1;
    slider.value = reveal * 100;
  });
  if (seq) {
    slider.style.display = "none";
    $("btn-toggle").textContent = "Repetir";
    const ph = slider.closest("#panel") && slider.closest("#panel").querySelector(".hint");
    if (ph) ph.textContent = CFG.hintSeq || "Las microscopías aparecen una por una · toca cada círculo ● para ver el detalle";
  }

  // --- Toque sobre hotspots (proyección a pantalla + distancia; robusto en iOS) ---
  const _wp = new THREE.Vector3();
  function handleTap(clientX, clientY, target) {
    if (!visible) return;
    // ignorar toques sobre la UI (panel, tarjeta, barra)
    if (target && target.closest && target.closest("#panel, #card, #topbar, #zoom")) return;
    let best = -1, bestD = Infinity;
    hitMeshes.forEach((m) => {
      m.getWorldPosition(_wp);
      _wp.project(camera);                 // -> NDC
      if (_wp.z > 1) return;               // detrás de cámara
      const sx = (_wp.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-_wp.y * 0.5 + 0.5) * window.innerHeight;
      const d = Math.hypot(sx - clientX, sy - clientY);
      if (d < bestD) { bestD = d; best = m.userData.idx; }
    });
    const thresh = Math.min(window.innerWidth, window.innerHeight) * 0.13;
    if (best >= 0 && bestD < thresh) openCard(best);
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
    // Microscopía opcional (hotspot.img): se muestra en la tarjeta y se puede
    // agrandar. Sin img, la tarjeta queda como antes (solo texto).
    const cardImg = $("card-img"), imgHint = $("card-imghint");
    if (cardImg) {
      if (h.img) { cardImg.src = h.img; cardImg.style.display = "block"; if (imgHint) imgHint.style.display = "block"; }
      else { cardImg.removeAttribute("src"); cardImg.style.display = "none"; if (imgHint) imgHint.style.display = "none"; }
    }
    $("card").classList.add("on");
    // resaltar el anillo elegido
    hotMeshes.forEach((m, k) => m.userData.base = k === i ? 1.6 : 1);
  }
  function closeCard() {
    $("card").classList.remove("on");
    const zoom = $("zoom"); if (zoom) zoom.classList.remove("on");
    hotMeshes.forEach((m) => m.userData.base = 1);
  }
  $("card-close").addEventListener("click", closeCard);

  // Tocar la microscopía la agranda a pantalla completa; tocar el fondo cierra.
  const cardImg = $("card-img"), zoom = $("zoom"), zoomImg = $("zoom-img");
  if (cardImg && zoom && zoomImg) {
    cardImg.addEventListener("click", () => {
      if (!cardImg.getAttribute("src")) return;
      zoomImg.src = cardImg.src;
      zoom.classList.add("on");
    });
    zoom.addEventListener("click", () => zoom.classList.remove("on"));
  }

  // --- Arranque de cámara ---
  try {
    await mindar.start();
  } catch (e) {
    return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")");
  }
  // Los créditos acompañan también el escaneo: la carga dura unos segundos,
  // pero encuadrar la obra puede llevar mucho más. Clonamos la placa dentro de
  // #scan para no duplicar el markup en cada pieza; se oculta sola al detectar
  // la obra, porque el motor apaga #scan entero.
  const placa = $("loading").querySelector(".creditos");
  if (placa) $("scan").appendChild(placa.cloneNode(true));

  $("loading").style.display = "none";

  // --- Bucle de render ---
  const clock = new THREE.Clock();
  const INTER = CFG.intervaloReveal || 0.8;
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    if (seq) {
      // Revelado uno por uno: cada recorte (con su flecha) aparece en su turno.
      const et = (performance.now() - seqStart) / 1000;
      let shown = 0;
      seqMats.forEach((m, i) => {
        const o = visible ? step(0.4 + i * INTER, 0.4 + i * INTER + 0.55, et) : 0;
        m.opacity += (o - m.opacity) * 0.3;
        if (o > 0.5) shown++;
      });
      // Los círculos ya se dibujan en los recortes → ocultamos los anillos (evita
      // el doble círculo); los discos de toque invisibles siguen activos.
      const prog = seqMats.length ? shown / seqMats.length : 0;
      hotMeshes.forEach((m) => { m.material.opacity = 0; });
      void prog;
    } else {
      // fade de todas las capas según revelado
      fadeMats.forEach((m) => { m.opacity += (reveal - m.opacity) * 0.15; });
      // pulso de los anillos, escalado por revelado
      hotMeshes.forEach((m) => {
        const pulse = 1 + Math.sin(t * 3 + m.userData.idx) * 0.12;
        const s = pulse * m.userData.base;
        m.scale.set(s, s, s);
        m.material.opacity = 0.15 + reveal * 0.85;
      });
    }
    renderer.render(scene, camera);
  });
}

window.addEventListener("DOMContentLoaded", start);
