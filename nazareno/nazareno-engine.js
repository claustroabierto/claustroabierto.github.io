/*  MOTOR RA — Jesús Nazareno (motor propio) · "SALE DEL PLANO".
 *  MindAR (image tracking sobre la pintura) + three.js. Dos planos anclados al
 *  marcador:
 *    - FONDO (fondo.webp): cubre TODO el marcador con la pintura SIN el Cristo,
 *      tapando al Cristo real → sin él habría "doble Cristo" al animar.
 *    - CRISTO (nazareno.webp): plano del Cristo recortado, en su sitio.
 *  Al detectar: ambos aparecen (pintura intacta). Luego el Cristo se DESPEGA en z
 *  (hacia el visitante), sube y crece → parallax real (está delante del fondo).
 *  Después queda en vaivén/respiración sutil (gesto/caminata). Botón = repetir.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const smooth = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = CFG.subtitulo || "";
  if ($("ficha-txt")) $("ficha-txt").textContent = CFG.ficha || "";

  let mindar;
  try {
    mindar = new MindARThree({ container: $("ar"), imageTargetSrc: CFG.targetSrc, uiScanning: "no", uiLoading: "no", filterMinCF: 0.0001, filterBeta: 0.001 });
  } catch (e) { return fatal("No se pudo iniciar MindAR: " + e.message); }

  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();
  const tx = (s) => { const t = loader.load(s); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4; return t; };

  const MW = 1.0, MH = CFG.markerH || 0.88;
  // FONDO: cubre todo el marcador
  const fondoMat = new THREE.MeshBasicMaterial({ map: tx(CFG.fondo), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(MW, MH), fondoMat);
  fondo.position.set(0, 0, 0.001); fondo.renderOrder = 1; anchor.group.add(fondo);
  // CRISTO: plano de la figura, en su sitio sobre el marco
  const F = CFG.figura || { w: MW, h: MH, x: 0, y: 0 };
  const nazMat = new THREE.MeshBasicMaterial({ map: tx(CFG.nazareno), transparent: true, opacity: 0, side: THREE.DoubleSide, depthTest: false, depthWrite: false });
  const naz = new THREE.Mesh(new THREE.PlaneGeometry(F.w, F.h), nazMat);
  naz.position.set(F.x, F.y, 0.002); naz.renderOrder = 2; anchor.group.add(naz);

  const EM = CFG.emerge || { start: 1.2, end: 2.4, z: 0.20, scale: 0.10, y: 0.03 };
  const W = CFG.walk || { dur: 3.8, dist: 0.42, step: 8.0, bob: 0.022, lean: 0.06 };

  let visible = false, startT = 0;
  const clock = new THREE.Clock();
  anchor.onTargetFound = () => { visible = true; startT = clock.getElapsedTime(); $("scan").style.display = "none"; if ($("panel")) $("panel").classList.add("on"); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; if ($("panel")) $("panel").classList.remove("on"); };
  const rb = $("btn-repeat"); if (rb) rb.addEventListener("click", (e) => { e.stopPropagation(); if (visible) startT = clock.getElapsedTime(); });

  try { await mindar.start(); }
  catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  const placa = $("loading").querySelector(".creditos"); if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  const T_APP = [0.1, 0.8];  // fondo + Cristo aparecen (pintura intacta)
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime() - startT;
    const app = visible ? smooth(T_APP[0], T_APP[1], t) : 0;
    fondoMat.opacity = app; nazMat.opacity = app;

    const em = visible ? smooth(EM.start, EM.end, t) : 0;   // 0→1 emerge (sale del plano)

    // GIRA y CAMINA hacia la izquierda tras emerger: rota en Y, avanza en -x con
    // cadencia de paso y se hunde un poco en la escena (se aleja por el camino).
    const wt = Math.max(0, t - EM.end);                      // tiempo desde que puede caminar
    const wp = smooth(0, W.dur, wt);                         // progreso 0→1 (easeInOut)
    const walking = wt > 0 && wt < W.dur;
    const step = wt * W.step;
    const walkX = -wp * W.dist * em;                         // se desplaza a la izquierda
    const zWalk = EM.z * em * (1 - 0.5 * wp);                // se acerca al plano al alejarse
    // rebote de paso mientras camina; respiración suave al terminar
    const bob = (walking ? Math.abs(Math.sin(step)) - 0.35 : Math.sin(wt * 1.5) * 0.4) * W.bob * em;
    const lean = (-W.lean * wp + (walking ? Math.sin(step * 0.5) * 0.02 : 0)) * em; // se inclina hacia el avance
    const turn = -(W.turn || 0) * wp * em;                   // gira sobre su eje (lado izq. se hunde)

    naz.position.set(F.x + walkX, F.y + EM.y * em + bob, 0.002 + zWalk);
    const s = (1 + EM.scale * em) * (1 - 0.08 * wp * em);    // encoge un poco al alejarse
    naz.scale.set(s, s, 1);
    naz.rotation.set(0, turn, lean);

    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
