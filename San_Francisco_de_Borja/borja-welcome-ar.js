/*  BIENVENIDA EN AR — San Francisco de Borja.
 *  Al tocar "Escuchar bienvenida" se abre la cámara en vivo y aparece el santo
 *  (video) con el FONDO GRIS ELIMINADO, flotando en el espacio del visitante.
 *
 *  El fondo gris no se puede keyar bien en vivo (tonos neutros del sujeto se
 *  confunden con el gris), así que el recorte se hace OFFLINE con relleno de
 *  huecos y se entrega como video "STACKED": color arriba + máscara (alfa) abajo,
 *  en un MP4 H.264 normal (funciona en iPhone y Android; el video con alfa nativo
 *  no sirve en iOS). Un shader recompone color+alfa sobre la cámara.
 */
import * as THREE from "three";
import { initFixedAR, fitContentToScreen } from "../shared/no-target-ar.js?v=6";

const CFG = window.MUSEO_CONFIG || {};
const $ = (id) => document.getElementById(id);

let ar = null, vid = null, running = false;

const STACKED_FRAG = [
  "uniform sampler2D map; uniform float op; varying vec2 vUv;",
  "void main(){",
  "  vec3 col = texture2D(map, vec2(vUv.x, 0.5 + vUv.y*0.5)).rgb;",   // mitad superior = color
  "  float a = texture2D(map, vec2(vUv.x, vUv.y*0.5)).r;",            // mitad inferior = máscara
  "  a = smoothstep(0.25, 0.6, a);",                                  // borde limpio
  "  if (a < 0.02) discard;",
  "  gl_FragColor = vec4(col, a * op);",
  "}"
].join("\n");

async function open() {
  const overlay = $("welcome-ar");
  overlay.classList.add("on");
  if (window.__borjaStopSway) { try { window.__borjaStopSway(); } catch (_) {} }
  if (running) { if (vid) { try { vid.currentTime = 0; } catch (_) {} vid.play().catch(() => {}); } return; }
  running = true;

  const stage = $("welcome-ar-stage");
  try {
    ar = await initFixedAR({ container: stage });
  } catch (e) {
    // Sin cámara: seguir mostrando el santo (fondo eliminado) sobre fondo oscuro.
    window.MUSEO_PREVIEW = true;
    try { ar = await initFixedAR({ container: stage }); overlay.classList.add("no-cam"); }
    catch (e2) { overlay.classList.add("no-cam"); running = false; return; }
  }
  const { renderer, scene, camera, content } = ar;

  vid = document.createElement("video");
  vid.src = CFG.videoAR || "assets/bienvenida-ar.mp4";
  vid.playsInline = true; vid.setAttribute("playsinline", ""); vid.crossOrigin = "anonymous"; vid.preload = "auto";
  vid.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;top:-10px;opacity:0;pointer-events:none;";
  document.body.appendChild(vid);

  const vtex = new THREE.VideoTexture(vid); vtex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: { map: { value: vtex }, op: { value: 1 } },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: STACKED_FRAG
  });
  // El plano tiene el aspecto del COLOR (mitad superior): 704 x 1280.
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(704 / 1280, 1.0), mat);
  content.add(plane);

  fitContentToScreen(content, camera, { fill: 0.82 });
  renderer.setAnimationLoop(() => renderer.render(scene, camera));

  vid.addEventListener("ended", close);
  vid.play().catch(() => {});
}

function close() {
  const overlay = $("welcome-ar");
  if (overlay) overlay.classList.remove("on");
  if (vid) { vid.pause(); }
  // Cortar cámara + render y limpiar el DOM que agregó initFixedAR.
  if (ar) {
    try { ar.renderer.setAnimationLoop(null); } catch (_) {}
    try { if (ar.video && ar.video.srcObject) ar.video.srcObject.getTracks().forEach((t) => t.stop()); } catch (_) {}
    try { ar.renderer.dispose(); } catch (_) {}
  }
  const stage = $("welcome-ar-stage"); if (stage) stage.innerHTML = "";
  if (vid) { try { vid.remove(); } catch (_) {} vid = null; }
  ar = null; running = false;
}

window.addEventListener("DOMContentLoaded", () => {
  const btn = $("welcome-btn"); if (btn) btn.addEventListener("click", open);
  const cb = $("welcome-ar-close"); if (cb) cb.addEventListener("click", close);
});
