/*  MOTOR RA — Barril de vino. Contenido FIJO sobre la cámara en vivo (sin MindAR:
 *  el rastreo de imagen se colgaba al pedir la cámara en varios celulares). Usa el
 *  mismo enfoque que Florero/salvilla (shared/no-target-ar.js): la cámara se toma
 *  directo y el contenido se autoescala para llenar la pantalla.
 *
 *  Al abrir aparece la infografía ARBARRIL sobre los barriles. Un botón activa la
 *  EXPERIENCIA EXTRA: el video de los barriles reventando vino con FONDO VERDE
 *  eliminado por CHROMA KEY en un shader (three.js VideoTexture).
 */
import * as THREE from "three";
import { initFixedAR, fitContentToScreen, mountCalibPanel, waitAssets } from "../shared/no-target-ar.js?v=6";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
function fatal(msg) { const el = $("error"); if (el) { el.textContent = "⚠ " + msg; el.style.display = "block"; } console.error(msg); }

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo || "";
  $("subtitulo").textContent = CFG.subtitulo || "";

  let renderer, scene, camera, content;
  try {
    ({ renderer, scene, camera, content } = await initFixedAR({ container: $("ar") }));
  } catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }

  const manager = new THREE.LoadingManager();
  const loader = new THREE.TextureLoader(manager);

  // --- Infografía ARBARRIL ---
  const photoTex = loader.load(CFG.fotoSrc); photoTex.colorSpace = THREE.SRGBColorSpace;
  const photoMat = new THREE.MeshBasicMaterial({ map: photoTex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), photoMat);
  photoMesh.renderOrder = 1; content.add(photoMesh);

  // --- Video con chroma key (experiencia extra) ---
  const video = document.createElement("video");
  video.src = CFG.videoSrc; video.loop = true; video.playsInline = true; video.setAttribute("playsinline", "");
  video.preload = "auto"; video.crossOrigin = "anonymous";
  video.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;top:-10px;opacity:0;pointer-events:none;";
  document.body.appendChild(video);
  const vTex = new THREE.VideoTexture(video); vTex.colorSpace = THREE.SRGBColorSpace;

  const K = CFG.chroma || { color: [93, 188, 97], sim: 0.15, edge: 0.12, spill: 0.9 };
  const vMat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      map: { value: vTex },
      keyColor: { value: new THREE.Color(K.color[0] / 255, K.color[1] / 255, K.color[2] / 255) },
      sim: { value: K.sim }, edge: { value: K.edge }, spill: { value: K.spill }, op: { value: 0 }
    },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: [
      "uniform sampler2D map; uniform vec3 keyColor; uniform float sim,edge,spill,op; varying vec2 vUv;",
      "void main(){",
      "  vec4 c = texture2D(map, vUv);",
      "  float g = c.g - max(c.r, c.b);",              // cuánto domina el verde
      "  float m = smoothstep(sim, sim + edge, g);",   // 1 = fondo verde, 0 = objeto
      "  float a = (1.0 - m) * op;",                    // op = fade in/out
      "  float rb = max(c.r, c.b); c.g = mix(c.g, min(c.g, rb), m * spill);",  // despill
      "  if (a < 0.02) discard;",
      "  gl_FragColor = vec4(c.rgb, a);",
      "}"
    ].join("\n")
  });
  const vMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), vMat);
  vMesh.position.z = 0.01; vMesh.renderOrder = 2; content.add(vMesh);

  // Autoescala a la pantalla + panel de calibración (?calib=1).
  const fitter = fitContentToScreen(content, camera);
  mountCalibPanel(fitter);

  // --- Botón: alterna info <-> animación ---
  let videoMode = false;
  const btn = $("anim-btn");
  function setBtn() { if (btn) btn.textContent = videoMode ? "⤺ Ver información" : "▶ Ver animación"; }
  if (btn) btn.addEventListener("click", (e) => {
    e.stopPropagation();
    videoMode = !videoMode;
    if (videoMode) { try { video.currentTime = 0; } catch (_) {} video.play().catch(() => {}); }
    else video.pause();
    setBtn();
  });

  await waitAssets(manager);
  $("loading").style.display = "none";
  $("scan").style.display = "none";
  if (btn) btn.classList.add("on");   // sin detección: el botón está siempre disponible

  renderer.setAnimationLoop(() => {
    const wantPhoto = videoMode ? 0 : 1;
    photoMat.opacity += (wantPhoto - photoMat.opacity) * 0.15;
    const wantVid = videoMode ? 1 : 0;
    vMat.uniforms.op.value += (wantVid - vMat.uniforms.op.value) * 0.2;
    vMesh.visible = vMat.uniforms.op.value > 0.01;
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
