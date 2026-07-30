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

  const EM = CFG.emerge || { start: 1.2, end: 2.4, z: 0.18, scale: 0.08, y: 0.02 };
  const P = CFG.pace || { dist: 0.40, omega: 0.9, step: 8.0, bob: 0.02, flip: 6 };

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

    // CAMINATA EN BUCLE tras emerger: vaivén izquierda↔derecha. Primero va a la
    // izquierda mirando a la izquierda; en cada extremo la imagen se REFLEJA (espejo
    // horizontal, scale.x negativo) y camina al otro lado mirando hacia allá.
    const tw = Math.max(0, t - EM.end);                      // tiempo de vaivén
    const ph = P.omega * tw;
    const paceX = -P.dist * Math.sin(ph) * em;               // 0→izq→centro→der→… (arranca a la izq)
    const dir = Math.cos(ph);                                // >0 va a la izq · <0 va a la der
    const face = Math.tanh((P.flip || 6) * dir);             // +1 normal (mira izq) · -1 espejo (mira der) · ~0 al voltear
    const step = tw * P.step;
    const bob = (Math.abs(Math.sin(step)) - 0.35) * P.bob * em;  // rebote de pisada
    const wob = Math.sin(step) * 0.012 * em;                 // bamboleo leve

    naz.position.set(F.x + paceX, F.y + EM.y * em + bob, 0.002 + EM.z * em);
    const s = 1 + EM.scale * em;
    naz.scale.set(s * face, s, 1);                           // face = ±1 → reflejo horizontal
    naz.rotation.set(0, 0, wob);

    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
