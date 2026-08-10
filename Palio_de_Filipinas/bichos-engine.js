/*  MOTOR RA — Palio_de_Filipinas / mantón de Manila (insectos que cobran vida)
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
  // El subtitulo trae varios datos sueltos separados por un punto medio.
  // Se muestran UNO POR LINEA (el CSS usa white-space:pre-line): en un
  // celular, todo seguido en una sola linea se parte a mitad de dato y
  // se lee mal.
  $("subtitulo").textContent = (CFG.subtitulo || "")
    .replace(/\s*\u00B7\s*/g, "\n");
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
  function makeOverlay(cfg, z, ro, reg) {
    if (!cfg) return null;
    const R = reg || { x: 0, y: 0, size: 1, rot: 0 };
    const mat = new THREE.MeshBasicMaterial({ map: tex(cfg.src), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(R.size, R.size / cfg.aspect), mat);
    mesh.position.set(R.x, R.y, z); mesh.rotation.z = R.rot || 0; mesh.renderOrder = ro; mesh.visible = false;
    anchor.group.add(mesh);
    return { mesh, mat };
  }
  // NO se superpone el mantón: la base es la obra real (cámara). Solo se muestran,
  // uno a la vez, los bichos O el UV O la microscopía. Cada overlay con su registro.
  const uvOv  = makeOverlay(CFG.uvManton, 0.05, 20, CFG.mantonReg);     // UV: registro ajustado (con giro)
  const micOv = makeOverlay(CFG.microManton, 0.06, 21, CFG.microReg);  // micro: centrado, sin giro

  // --- Insectos (nacen en el centro y vuelan a su sitio) ---
  // NINGUNO puede salir de la tela: el campo NO es cuadrado (el marcador mide 1
  // de ancho pero 1/aspect de alto, así que "y" llega a ±0.342 y "x" a ±0.5) y
  // además la tela no llena el target. `CFG.bounds` es el rectángulo real de la
  // tela; de ahí sale, por bicho, la caja donde puede estar su CENTRO (restando
  // medio sprite ya girado y aleteando) y el tope de su revoloteo.
  const BN = CFG.bounds || { x0: -0.5, x1: 0.5, y0: -0.5 / CFG.aspect, y1: 0.5 / CFG.aspect };
  const ROT_MAX = 0.31;    // banqueo máximo que aplica trans()
  const FLAP_MAX = 1.14;   // el aleteo estira el alto hasta +14%
  const OY = 0.615;        // |oy| máximo por unidad de amplitud (0.82 * 0.75)
  const AMP = { revolotea: 0.42, enjambre: 0.75 };   // multiplicador de `spread` por modo

  const bichos = CFG.bichos.map((b, i) => {
    const mat = new THREE.MeshBasicMaterial({ map: tex(b.src), transparent: true, depthTest: false, depthWrite: false });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
    mesh.renderOrder = 2 + i; anchor.group.add(mesh);
    // media caja del sprite girado (proyección de un rectángulo rotado)
    const hx = (b.size * b.aspect) / 2, hy = (b.size * FLAP_MAX) / 2;
    const hxr = hx * Math.cos(ROT_MAX) + hy * Math.sin(ROT_MAX);
    const hyr = hx * Math.sin(ROT_MAX) + hy * Math.cos(ROT_MAX);
    // El 0 en los min/max garantiza que el centro (donde nacen) siempre entra en
    // la caja, aunque un sprite fuera más grande que la tela.
    const box = {
      x0: Math.min(BN.x0 + hxr, 0), x1: Math.max(BN.x1 - hxr, 0),
      y0: Math.min(BN.y0 + hyr, 0), y1: Math.max(BN.y1 - hyr, 0)
    };
    const px = clamp(b.x, box.x0, box.x1), py = clamp(b.y, box.y0, box.y1);
    return {
      ...b, x: px, y: py, mesh, mat, box,
      roomX: Math.min(px - box.x0, box.x1 - px),   // sitio libre a cada lado
      roomY: Math.min(py - box.y0, box.y1 - py),
      ph: i * 1.7, fx: 0.33 + i * 0.028, fy: 0.26 + i * 0.022, cur: null
    };
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
    // La amplitud se recorta al sitio libre hasta el borde de la tela, por eje:
    // pedir `spread` no alcanza para salirse, y en enjambre tampoco.
    const want = b.spread * AMP[mode];
    const ampX = Math.min(want, b.roomX);
    const ampY = Math.min(want, b.roomY / OY);
    const ox = (Math.sin(now * b.fx + b.ph) * 0.72 + Math.sin(now * b.fx * 0.43 + b.ph * 2.1) * 0.28) * ampX * move;
    const oy = (Math.sin(now * b.fy + b.ph * 1.3) * 0.6 + Math.sin(now * b.fy * 0.37 + b.ph) * 0.22) * ampY * 0.75 * move;
    const flapv = Math.sin(now * b.flap + b.ph);
    const sy = baseScale * (1 + flapv * 0.14 * (0.35 + 0.65 * move));
    // banqueo: se inclina según hacia dónde se mueve + micro-aleteo.
    const vx = Math.cos(now * b.fx + b.ph) * b.fx;
    const rot = -clamp(vx * 0.22, -0.28, 0.28) * move + flapv * 0.03;
    const z = 0.02 + move * (0.05 + 0.03 * Math.sin(now * b.fx + b.ph));
    // Recorte final: cubre también el ARCO de la salida (que no depende de la
    // amplitud). La caja es convexa, así que el suavizado por lerp del bucle
    // tampoco puede sacar al bicho de la tela.
    return {
      x: clamp(bx0 + ax + ox, b.box.x0, b.box.x1),
      y: clamp(by0 + ay + oy, b.box.y0, b.box.y1),
      z, sx, sy, rot
    };
  }

  // --- Estado ---
  let mode = "revolotea", visible = false, lastTap = -1, startT = 0;
  let uvOn = false, uvMix = 0, micOn = false, micMix = 0, overlayMix = 0;
  const clock = new THREE.Clock();
  const setCaption = (t) => { $("caption").textContent = t || ""; };
  const normalCap = () => (mode === "enjambre"
    ? "Los bordados vuelan por todo el mantón"
    : "Los insectos salen del textil y revolotean. Toca la pantalla para hacerlos volar.");
  function refreshCaption() {
    setCaption(uvOn ? "Bajo luz UV el medallón fluoresce"
      : micOn ? "Microscopía de los bordados en hilos de seda (10×)"
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
    uvMix = lerp(uvMix, uvOn ? 1 : 0, 0.12);
    micMix = lerp(micMix, micOn ? 1 : 0, 0.12);
    // "overlayMix" = 1 mientras haya UV o micro. Al pasar de UV a micro se mantiene
    // en 1 (uvOn||micOn sigue true), así los bichos NO parpadean en el cruce.
    overlayMix = lerp(overlayMix, (uvOn || micOn) ? 1 : 0, 0.14);
    if (uvOv) { uvOv.mat.opacity = uvMix; uvOv.mesh.visible = uvMix > 0.01; }
    if (micOv) { micOv.mat.opacity = micMix; micOv.mesh.visible = micMix > 0.01; }
    const bichosVis = Math.max(0, 1 - overlayMix);   // ocultos si hay UV o micro (sin parpadeo)
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
