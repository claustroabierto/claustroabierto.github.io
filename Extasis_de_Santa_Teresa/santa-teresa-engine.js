/*  MOTOR RA — Éxtasis de Santa Teresa (coreografía animada, motor propio).
 *  MindAR (image tracking de la pintura) + three.js. Todo lo que se muestra son
 *  recortes del "santa teresa analisis.png" del equipo.
 *
 *  Secuencia:
 *   1. RAYOS X (con rótulo) crece hasta calzar el cuadro.
 *   2. REVERSO crece SIN texto dentro del óvalo blanco del rayos X.
 *   3. Se mueve a la IZQUIERDA y allí se cruza a su versión CON texto (panel).
 *   4. Derecha: título MICROSCOPÍA y luego las 3 tarjetas una por una.
 *   5. Estático: tocar una microscopía la amplía. Sin aros; aviso abajo.
 *  + slider de transparencia del rayos X + botón Repetir.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const step = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;
function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = CFG.subtitulo || "";
  $("ficha-txt").textContent = CFG.ficha || "";

  let mindar;
  try {
    mindar = new MindARThree({ container: $("ar"), imageTargetSrc: CFG.targetSrc, uiScanning: "no", uiLoading: "no", filterMinCF: 0.0001, filterBeta: 0.001 });
  } catch (e) { return fatal("No se pudo iniciar MindAR: " + e.message); }

  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();
  const tx = (s) => { const t = loader.load(s); t.colorSpace = THREE.SRGBColorSpace; return t; };

  // Crea un plano a partir de un cfg {src, aspect, width, x, y}
  function plane(cfg, z, ro) {
    const mat = new THREE.MeshBasicMaterial({ map: tx(cfg.src), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width, cfg.width / cfg.aspect), mat);
    mesh.position.set(cfg.x, cfg.y, z); mesh.renderOrder = ro; anchor.group.add(mesh);
    return { mesh, mat, cfg };
  }

  const rx    = plane(CFG.rx, 0.001, 1);            // rayos X (con rótulo)
  const rvO   = plane(CFG.reversoOval, 0.01, 3);    // reverso sin texto (en el óvalo)
  const rvP   = plane(CFG.reversoPanel, 0.012, 4);  // reverso con texto (panel izq)
  const mTit  = plane(CFG.microTitulo, 0.02, 8);    // título MICROSCOPÍA
  const micros = (CFG.microscopias || []).map((m, i) => {
    const p = plane(m, 0.02 + i * 0.001, 10 + i); p.data = m; return p;
  });

  // --- Estado / UI ---
  let visible = false, startT = 0, rxAlpha = 1, staticReady = false;
  const clock = new THREE.Clock();
  const INTER = CFG.intervaloReveal || 0.8;
  const setCaption = (t) => { const c = $("caption"); if (c) c.textContent = t || ""; };

  anchor.onTargetFound = () => { visible = true; startT = clock.getElapsedTime(); $("scan").style.display = "none"; $("panel").classList.add("on"); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on"); closeCard(); };

  const slider = $("reveal");
  if (slider) { slider.value = 100; slider.addEventListener("input", () => { rxAlpha = slider.value / 100; }); }
  const rb = $("btn-repeat"); if (rb) rb.addEventListener("click", (e) => { e.stopPropagation(); if (visible) startT = clock.getElapsedTime(); });

  // --- Zoom al tocar una microscopía ---
  function openCard(i) {
    const m = micros[i].data;
    $("card-titulo").textContent = m.titulo || "";
    $("card-pigmento").textContent = m.pigmento || "";
    $("card-formula").textContent = m.formula || "";
    $("card-nota").textContent = m.nota || "";
    const img = $("card-img"); if (img) { img.src = m.src; img.style.display = "block"; }
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
    if (!visible || !staticReady) return;
    if (target && target.closest && target.closest("#panel, #card, #topbar, #zoom")) return;
    let best = -1, bd = Infinity;
    micros.forEach((p, i) => {
      p.mesh.getWorldPosition(_wp); _wp.project(camera); if (_wp.z > 1) return;
      const sx = (_wp.x * 0.5 + 0.5) * innerWidth, sy = (-_wp.y * 0.5 + 0.5) * innerHeight;
      const d = Math.hypot(sx - cx, sy - cy); if (d < bd) { bd = d; best = i; }
    });
    if (best >= 0 && bd < Math.min(innerWidth, innerHeight) * 0.18) openCard(best);
  }
  window.addEventListener("pointerdown", (e) => handleTap(e.clientX, e.clientY, e.target));
  window.addEventListener("touchstart", (e) => { const t = e.touches && e.touches[0]; if (t) handleTap(t.clientX, t.clientY, e.target); }, { passive: true });

  try { await mindar.start(); }
  catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  const placa = $("loading").querySelector(".creditos"); if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  // Tiempos (s desde la detección)
  const T_RX   = [0.3, 1.6];    // rayos X crece
  const T_RV   = [1.9, 3.0];    // reverso crece en el óvalo (sin texto)
  const T_MOVE = [3.3, 4.3];    // se va a la izquierda (y pasa a "con texto")
  const T_TIT  = 4.5;           // título MICROSCOPÍA
  const T_MIC0 = 5.2;           // primera tarjeta

  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime() - startT;

    // 1) rayos X
    rx.mesh.scale.setScalar(lerp(0.02, 1, step(T_RX[0], T_RX[1], t)));
    rx.mat.opacity = step(T_RX[0], T_RX[0] + 0.5, t) * rxAlpha;

    // 2/3) reverso: crece sin texto en el óvalo; al moverse cruza a "con texto".
    const grow = step(T_RV[0], T_RV[1], t);
    const mv = step(T_MOVE[0], T_MOVE[1], t);
    const ox = CFG.reversoOval.x, oy = CFG.reversoOval.y;
    const px = CFG.reversoPanel.x, py = CFG.reversoPanel.y;
    const cx = lerp(ox, px, mv), cy = lerp(oy, py, mv);
    // el "sin texto" se desvanece a mitad del viaje y aparece el panel con texto
    rvO.mesh.position.set(cx, cy, 0.01);
    rvO.mesh.scale.setScalar(grow);
    rvO.mat.opacity = grow * (1 - step(0.45, 0.75, mv));
    rvP.mesh.position.set(cx, cy, 0.012);
    rvP.mat.opacity = step(0.45, 0.8, mv);

    // 4) columna derecha: título y luego las 3 tarjetas, una por una
    mTit.mat.opacity = step(T_TIT, T_TIT + 0.5, t);
    let shown = 0;
    micros.forEach((p, i) => {
      const a = T_MIC0 + i * INTER, o = step(a, a + 0.5, t);
      p.mat.opacity = o; p.mesh.scale.setScalar(lerp(0.85, 1, o)); if (o > 0.6) shown++;
    });
    staticReady = micros.length > 0 && shown >= micros.length;

    if (t < T_RV[0]) setCaption("Rayos X: el soporte de piedra bajo la pintura…");
    else if (t < T_MOVE[1]) setCaption("El reverso de piedra, con su inscripción");
    else if (!staticReady) setCaption("Microscopía de los pigmentos…");
    else setCaption("Toca cada microscopía para ampliarla · desliza para ver el rayos X");

    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
