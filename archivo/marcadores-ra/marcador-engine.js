/*  MOTOR RA — piezas con MARCADOR (el target es un marcador RA impreso, no la
 *  pieza). MindAR (image tracking) + three.js. Al detectar el marcador, el
 *  objeto de la pieza "sale" del marcador: aparece ampliado, se adelanta y flota
 *  con un leve balanceo (da sensación de volumen 3D sin necesitar un mesh).
 *
 *  Reutilizable: cualquier pieza con marcador usa este motor + su config
 *  (marcador + objeto). Pensado para las piezas de volumen que no rastrean como
 *  imagen plana o que se mueven en vitrina.
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
  if (!CFG || !CFG.objeto) return fatal("No se cargó la configuración de la pieza.");
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
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();

  // El objeto que sale del marcador
  const o = CFG.objeto;
  const tex = loader.load(o.src); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const H = o.size / o.aspect;                      // alto (ancho del objeto = size)
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.size, H), mat);
  mesh.renderOrder = 5; anchor.group.add(mesh);
  // sombra suave debajo (da que "flota" sobre el marcador)
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(o.size * 0.7, o.size * 0.7 * 0.3),
    new THREE.MeshBasicMaterial({ map: makeShadow(), transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
  shadow.renderOrder = 4; anchor.group.add(shadow);
  function makeShadow() {
    const s = 64, cv = document.createElement("canvas"); cv.width = cv.height = s; const g = cv.getContext("2d");
    const gr = g.createRadialGradient(s / 2, s / 2, 0, s / 2, s / 2, s / 2);
    gr.addColorStop(0, "rgba(0,0,0,0.5)"); gr.addColorStop(1, "rgba(0,0,0,0)");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(cv); return t;
  }

  let visible = false, startT = 0;
  const clock = new THREE.Clock();
  anchor.onTargetFound = () => { visible = true; startT = clock.getElapsedTime(); $("scan").style.display = "none"; $("panel").classList.add("on"); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on"); };

  try { await mindar.start(); }
  catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  const placa = $("loading").querySelector(".creditos");
  if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  renderer.setAnimationLoop(() => {
    const now = clock.getElapsedTime();
    const t = now - startT;
    // Al detectar: el objeto sale del marcador (aparece, se adelanta) y flota.
    const appear = visible ? step(0.0, 0.7, t) : 0;
    const rise = visible ? step(0.2, 1.2, t) : 0;      // se adelanta/eleva
    const bob = Math.sin(now * 1.1) * 0.02 * appear;    // flota
    const sway = Math.sin(now * 0.7) * 0.08 * appear;   // gira suave (volumen)
    mat.opacity = appear;
    mesh.position.set(0, bob + rise * 0.03, 0.12 + rise * 0.10);
    mesh.rotation.y = sway;
    mesh.scale.setScalar(lerp(0.6, 1, appear));
    shadow.material.opacity = appear * 0.5;
    shadow.position.set(0, -H * 0.52 + bob * 0.5, 0.02);
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
