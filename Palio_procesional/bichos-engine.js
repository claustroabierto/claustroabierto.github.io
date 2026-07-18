/*  MOTOR RA — Palio_procesional / mantón de Manila (insectos que cobran vida)
 *  MindAR (image tracking) + three.js.
 *
 *  Experiencia:
 *   - Al detectar el mantón se superpone el FONDO LIMPIO (mantón sin los bichos
 *     sueltos) sobre la obra real, y los insectos EMERGEN desde el CENTRO: nacen
 *     diminutos en (0,0), crecen y vuelan hacia su sitio, y revolotean en bucle.
 *   - Botón "Luz UV": fluorescencia del medallón.
 *   - Botón "Microscopía": los 4 círculos de hilo 10x.
 *   - Tocar el mantón: los insectos vuelan más amplio (enjambre).
 *
 *  Los 3 overlays de mantón completo comparten `mantonReg` (mismo registro, se
 *  ajusta con uv.html). El mantón real lo pone la cámara.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

function fatal(msg) {
  const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg);
}

async function start() {
  if (!CFG || !CFG.bichos) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = CFG.subtitulo || "";
  $("ficha-txt").textContent = CFG.ficha || "";

  let mindar;
  try {
    mindar = new MindARThree({
      container: $("ar"), imageTargetSrc: CFG.targetSrc,
      uiScanning: "no", uiLoading: "no", filterMinCF: 0.0001, filterBeta: 0.001
    });
  } catch (e) { return fatal("No se pudo iniciar MindAR: " + e.message); }

  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();
  const tex = (s) => { const t = loader.load(s); t.colorSpace = THREE.SRGBColorSpace; return t; };

  // --- Overlays de mantón completo (fondo limpio, UV, microscopía) ---
  // Los tres comparten registro (misma foto). `size` = ancho en unidades del mantón.
  const R = CFG.mantonReg || { x: 0, y: 0, size: 1 };
  function makeOverlay(cfg, z, ro) {
    if (!cfg) return null;
    const mat = new THREE.MeshBasicMaterial({ map: tex(cfg.src), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(R.size, R.size / cfg.aspect), mat);
    mesh.position.set(R.x, R.y, z); mesh.renderOrder = ro; mesh.visible = false;
    anchor.group.add(mesh);
    return { mesh, mat };
  }
  // NO se superpone el mantón: la base es la obra real (cámara). Solo se muestran,
  // uno a la vez, los bichos O el UV O la microscopía.
  const uvOv  = makeOverlay(CFG.uvManton, 0.05, 20);     // encima de los bichos
  const micOv = makeOverlay(CFG.microManton, 0.06, 21);

  // --- Insectos (nacen en el centro y vuelan a su sitio) ---
  const bichos = CFG.bichos.map((b, i) => {
    const mat = new THREE.MeshBasicMaterial({ map: tex(b.src), transparent: true, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.renderOrder = 2 + i; anchor.group.add(mesh);
    return { ...b, mesh, mat, ph: i * 1.7, fx: 0.33 + i * 0.028, fy: 0.26 + i * 0.022, cur: null };
  });

  // Emergen DESDE EL CENTRO: nacen diminutos en (0,0), salen en ABANICO (arco) a
  // su sitio, y ahí vagabundean/aletean en bucle. mt = tiempo desde la detección.
  function trans(b, i, now, mt) {
    const stg = i * 0.14;
    const grow = smooth(stg, stg + 1.2, mt);          // tamaño 0 → 1
    const out  = smooth(stg + 0.15, stg + 1.7, mt);   // sale del centro 0 → 1
    const move = smooth(stg + 1.5, stg + 2.5, mt);    // empieza a vagabundear
    const baseScale = b.size * (0.02 + 0.98 * grow);
    const sx = baseScale * b.aspect;
    // trayectoria recta desde el centro + un ARCO perpendicular que pica a mitad
    // de vuelo (los bichos se abren en abanico, no en línea).
    const bx0 = lerp(0, b.x, out), by0 = lerp(0, b.y, out);
    const nrm = Math.hypot(b.x, b.y) || 1;
    const arc = Math.sin(out * Math.PI) * 0.09 * (i % 2 ? 1 : -1);
    const ax = -b.y / nrm * arc, ay = b.x / nrm * arc;
    // vagabundeo orgánico: dos frecuencias (no mecánico) alrededor del sitio.
    const amp = b.spread * (mode === "enjambre" ? 1.0 : 0.42);
    const ox = (Math.sin(now * b.fx + b.ph) * 0.72 + Math.sin(now * b.fx * 0.43 + b.ph * 2.1) * 0.28) * amp * move;
    const oy = (Math.sin(now * b.fy + b.ph * 1.3) * 0.6 + Math.sin(now * b.fy * 0.37 + b.ph) * 0.22) * amp * 0.75 * move;
    const flapv = Math.sin(now * b.flap + b.ph);
    const sy = baseScale * (1 + flapv * 0.14 * (0.35 + 0.65 * move));
    // banqueo: se inclina según hacia dónde se mueve + micro-aleteo.
    const vx = Math.cos(now * b.fx + b.ph) * b.fx;
    const rot = -clamp(vx * 0.22, -0.28, 0.28) * move + flapv * 0.03;
    const z = 0.02 + move * (0.05 + 0.03 * Math.sin(now * b.fx + b.ph));
    return { x: bx0 + ax + ox, y: by0 + ay + oy, z, sx, sy, rot };
  }

  // --- Estado ---
  let mode = "revolotea", visible = false, lastTap = -1, startT = 0;
  let uvOn = false, uvMix = 0, micOn = false, micMix = 0;
  const clock = new THREE.Clock();
  const setCaption = (t) => { $("caption").textContent = t || ""; };
  const normalCap = () => (mode === "enjambre"
    ? "Los bordados vuelan por todo el mantón"
    : "Los insectos nacen del centro y revolotean · toca el mantón para que vuelen más");
  function refreshCaption() {
    setCaption(uvOn ? "Bajo luz UV el medallón fluoresce"
      : micOn ? "Microscopía 10x del hilo bordado"
      : normalCap());
  }

  anchor.onTargetFound = () => {
    visible = true; startT = clock.getElapsedTime(); bichos.forEach(b => b.cur = null);
    $("scan").style.display = "none"; $("panel").classList.add("on"); refreshCaption();
  };
  anchor.onTargetLost = () => {
    visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on");
  };

  const toggleMode = () => { mode = mode === "revolotea" ? "enjambre" : "revolotea"; refreshCaption(); };
  // Botón UV y botón Microscopía (mutuamente excluyentes; ocultan los insectos).
  const uvBtn = $("btn-uv"), micBtn = $("btn-modo");
  if (uvBtn) uvBtn.addEventListener("click", (e) => {
    e.stopPropagation(); uvOn = !uvOn; if (uvOn) micOn = false;
    uvBtn.classList.toggle("on", uvOn); if (micBtn) micBtn.classList.toggle("on", micOn); refreshCaption();
  });
  if (micBtn) micBtn.addEventListener("click", (e) => {
    e.stopPropagation(); micOn = !micOn; if (micOn) uvOn = false;
    micBtn.classList.toggle("on", micOn); if (uvBtn) uvBtn.classList.toggle("on", uvOn); refreshCaption();
  });
  // Repetir: apaga UV/micro y vuelve a lanzar la emergencia desde el centro.
  const repeatBtn = $("btn-repeat");
  if (repeatBtn) repeatBtn.addEventListener("click", (e) => {
    e.stopPropagation(); if (!visible) return;
    uvOn = false; micOn = false;
    if (uvBtn) uvBtn.classList.remove("on"); if (micBtn) micBtn.classList.remove("on");
    startT = clock.getElapsedTime(); bichos.forEach(b => b.cur = null);
    refreshCaption();
  });
  function handleTap(el) {
    if (!visible) return;
    if (el && el.closest && el.closest("#panel, #topbar, #error")) return;
    if (uvOn || micOn) return;   // en modo UV/micro el toque no cambia el enjambre
    const now = performance.now(); if (now - lastTap < 350) return; lastTap = now; toggleMode();
  }
  window.addEventListener("pointerdown", (e) => handleTap(e.target));
  window.addEventListener("touchstart", (e) => handleTap(e.target), { passive: true });

  try { await mindar.start(); }
  catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  const placa = $("loading").querySelector(".creditos");
  if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  renderer.setAnimationLoop(() => {
    const now = clock.getElapsedTime();
    const mt = now - startT;
    uvMix = lerp(uvMix, uvOn ? 1 : 0, 0.1);
    micMix = lerp(micMix, micOn ? 1 : 0, 0.1);
    if (uvOv) { uvOv.mat.opacity = uvMix; uvOv.mesh.visible = uvMix > 0.01; }
    if (micOv) { micOv.mat.opacity = micMix; micOv.mesh.visible = micMix > 0.01; }
    const bichosVis = Math.max(0, 1 - Math.max(uvMix, micMix));   // se ocultan en UV/micro
    for (let i = 0; i < bichos.length; i++) {
      const b = bichos[i], t = trans(b, i, now, mt);
      if (!b.cur) b.cur = { ...t };
      for (const k of ["x", "y", "z", "sx", "sy", "rot"]) b.cur[k] = lerp(b.cur[k], t[k], 0.14);
      b.mesh.position.set(b.cur.x, b.cur.y, b.cur.z);
      b.mesh.scale.set(b.cur.sx, b.cur.sy, 1);
      b.mesh.rotation.z = b.cur.rot;
      b.mat.opacity = bichosVis;
      b.mesh.visible = bichosVis > 0.01;
    }
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
