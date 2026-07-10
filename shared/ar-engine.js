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

  // --- Overlay de características flotantes ---
  const ov = CFG.overlay;
  const ovTex = loader.load(ov.src);
  ovTex.colorSpace = THREE.SRGBColorSpace;
  const overlayMat = new THREE.MeshBasicMaterial({ map: ovTex, transparent: true, opacity: 0 });
  const overlay = new THREE.Mesh(new THREE.PlaneGeometry(ov.width, ov.height), overlayMat);
  overlay.position.set(ov.offsetX, ov.offsetY, 0.001);
  anchor.group.add(overlay);

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
  anchor.onTargetFound = () => { visible = true; $("scan").style.display = "none"; $("panel").classList.add("on"); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on"); closeCard(); };

  // Slider de revelado (interactivo): 0 = pintura limpia, 1 = análisis completo
  const slider = $("reveal");
  let reveal = 0;
  slider.addEventListener("input", () => { reveal = slider.value / 100; });
  $("btn-toggle").addEventListener("click", () => {
    reveal = reveal > 0.5 ? 0 : 1;
    slider.value = reveal * 100;
  });

  // --- Toque sobre hotspots (raycasting) ---
  const ray = new THREE.Raycaster();
  const ptr = new THREE.Vector2();
  renderer.domElement.addEventListener("pointerdown", (ev) => {
    if (!visible) return;
    const r = renderer.domElement.getBoundingClientRect();
    ptr.x = ((ev.clientX - r.left) / r.width) * 2 - 1;
    ptr.y = -((ev.clientY - r.top) / r.height) * 2 + 1;
    ray.setFromCamera(ptr, camera);
    const hit = ray.intersectObjects(hitMeshes, false)[0];
    if (hit) openCard(hit.object.userData.idx);
  });

  function openCard(i) {
    const h = CFG.hotspots[i];
    $("card-color").style.background = h.color;
    $("card-titulo").textContent = h.titulo;
    $("card-pigmento").textContent = h.pigmento;
    $("card-formula").textContent = h.formula;
    $("card-nota").textContent = h.nota || "";
    $("card").classList.add("on");
    // resaltar el anillo elegido
    hotMeshes.forEach((m, k) => m.userData.base = k === i ? 1.6 : 1);
  }
  function closeCard() {
    $("card").classList.remove("on");
    hotMeshes.forEach((m) => m.userData.base = 1);
  }
  $("card-close").addEventListener("click", closeCard);

  // --- Arranque de cámara ---
  try {
    await mindar.start();
  } catch (e) {
    return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")");
  }
  $("loading").style.display = "none";

  // Pedir mayor resolución de cámara para que el fondo se vea nítido (best-effort)
  try {
    const track = mindar.video?.srcObject?.getVideoTracks?.()[0];
    if (track && track.applyConstraints) {
      await track.applyConstraints({ width: { ideal: 1920 }, height: { ideal: 1080 } }).catch(() => {});
    }
  } catch (e) { /* si el dispositivo no lo permite, seguimos igual */ }

  // --- Bucle de render ---
  const clock = new THREE.Clock();
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    // fade del overlay según revelado
    overlayMat.opacity += (reveal - overlayMat.opacity) * 0.15;
    // pulso de los anillos, escalado por revelado
    hotMeshes.forEach((m) => {
      const pulse = 1 + Math.sin(t * 3 + m.userData.idx) * 0.12;
      const s = pulse * m.userData.base;
      m.scale.set(s, s, s);
      m.material.opacity = 0.15 + reveal * 0.85;
    });
    renderer.render(scene, camera);
  });
}

window.addEventListener("DOMContentLoaded", start);
