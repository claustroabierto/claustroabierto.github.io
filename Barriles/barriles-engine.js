/*  MOTOR RA — Barril de vino. MindAR (image target sobre los barriles) + three.js.
 *  Al detectar el marcador aparece la infografía ARBARRIL anclada. Un botón activa
 *  la EXPERIENCIA EXTRA: un video de los barriles reventando vino con FONDO VERDE
 *  eliminado por CHROMA KEY en un shader, mostrado en frente del barril.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
function fatal(msg) { const el = $("error"); if (el) { el.textContent = "⚠ " + msg; el.style.display = "block"; } console.error(msg); }

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo || "";
  $("subtitulo").textContent = CFG.subtitulo || "";

  let mindar;
  try {
    mindar = new MindARThree({ container: $("ar"), imageTargetSrc: CFG.targetSrc, uiScanning: "no", uiLoading: "no", filterMinCF: 0.0001, filterBeta: 0.001 });
  } catch (e) { return fatal("No se pudo iniciar MindAR: " + e.message); }
  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();

  // --- Infografía ARBARRIL (aparece al detectar) ---
  const P = CFG.foto || { w: 1.2, h: 1.2, x: 0, y: 0, z: 0.02 };
  const photoTex = loader.load(CFG.fotoSrc); photoTex.colorSpace = THREE.SRGBColorSpace;
  const photoMat = new THREE.MeshBasicMaterial({ map: photoTex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(P.w, P.h), photoMat);
  photoMesh.position.set(P.x, P.y, P.z); photoMesh.renderOrder = 1; anchor.group.add(photoMesh);

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
  const V = CFG.video || { w: 1.3, h: 1.3, x: 0, y: 0, z: 0.18 };
  const vMesh = new THREE.Mesh(new THREE.PlaneGeometry(V.w, V.h), vMat);
  vMesh.position.set(V.x, V.y, V.z); vMesh.renderOrder = 2; vMesh.visible = false; anchor.group.add(vMesh);

  // --- Estado / botón ---
  let visible = false, videoMode = false;
  const btn = $("anim-btn");
  function setBtn() { if (btn) btn.textContent = videoMode ? "⤺ Ver información" : "▶ Ver animación"; }
  function startVideo() { videoMode = true; try { video.currentTime = 0; } catch (_) {} video.play().catch(() => {}); setBtn(); }
  function stopVideo() { videoMode = false; video.pause(); setBtn(); }

  anchor.onTargetFound = () => { visible = true; $("scan").style.display = "none"; if (btn) btn.classList.add("on"); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; if (btn) btn.classList.remove("on"); if (videoMode) stopVideo(); };
  if (btn) btn.addEventListener("click", (e) => { e.stopPropagation(); if (!visible) return; if (videoMode) stopVideo(); else startVideo(); });

  try { await mindar.start(); }
  catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  const placa = $("loading").querySelector(".creditos"); if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  renderer.setAnimationLoop(() => {
    // Foto visible cuando hay marcador y NO estamos en modo video.
    const wantPhoto = (visible && !videoMode) ? 1 : 0;
    photoMat.opacity += (wantPhoto - photoMat.opacity) * 0.15;
    // Video (chroma) en modo video.
    const wantVid = (visible && videoMode) ? 1 : 0;
    vMat.uniforms.op.value += (wantVid - vMat.uniforms.op.value) * 0.2;
    vMesh.visible = vMat.uniforms.op.value > 0.01;
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
