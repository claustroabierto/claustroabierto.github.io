/*  MOTOR RA — Barril de vino. MindAR (image target sobre los barriles) + three.js.
 *  Al DETECTAR el marcador aparece la infografía ARBARRIL anclada (encaja con el
 *  barril). Un botón activa la EXPERIENCIA EXTRA: el video de los barriles
 *  reventando vino con FONDO VERDE eliminado por CHROMA KEY en un shader
 *  (despill + clean black/white), mostrado en frente del barril.
 *
 *  CLAVE anti-cuelgue: el <video> NO se carga hasta DESPUÉS de arrancar la cámara.
 *  Precargarlo antes competía con la cámara de MindAR por el decodificador de video
 *  del celular y `mindar.start()` se colgaba (bucle de "cargando").
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";
import { PanZoom } from "../shared/panzoom.js?v=1";

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

  // --- Infografía ARBARRIL (aparece al detectar, anclada al barril) ---
  const P = CFG.foto || { w: 1.25, h: 1.25, x: 0, y: 0, z: 0.02 };
  const photoTex = loader.load(CFG.fotoSrc); photoTex.colorSpace = THREE.SRGBColorSpace;
  const photoMat = new THREE.MeshBasicMaterial({ map: photoTex, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const photoMesh = new THREE.Mesh(new THREE.PlaneGeometry(P.w, P.h), photoMat);
  photoMesh.position.set(P.x, P.y, P.z); photoMesh.renderOrder = 1; anchor.group.add(photoMesh);

  // --- Video con chroma key (carga DIFERIDA: recién tras arrancar la cámara) ---
  const video = document.createElement("video");
  video.loop = true; video.playsInline = true; video.setAttribute("playsinline", ""); video.crossOrigin = "anonymous";
  video.preload = "none";   // NO cargar todavía
  video.style.cssText = "position:fixed;width:1px;height:1px;left:-10px;top:-10px;opacity:0;pointer-events:none;";
  document.body.appendChild(video);
  const vTex = new THREE.VideoTexture(video); vTex.colorSpace = THREE.SRGBColorSpace;

  const K = CFG.chroma || {};
  const col = K.color || [93, 188, 97];
  const vMat = new THREE.ShaderMaterial({
    transparent: true, depthTest: false, depthWrite: false,
    uniforms: {
      map: { value: vTex },
      keyColor: { value: new THREE.Color(col[0] / 255, col[1] / 255, col[2] / 255) },
      similarity: { value: K.similarity != null ? K.similarity : 0.40 },
      smoothness: { value: K.smoothness != null ? K.smoothness : 0.10 },
      spill: { value: K.spill != null ? K.spill : 1.1 },
      blackClip: { value: K.blackClip != null ? K.blackClip : 0.22 },
      whiteClip: { value: K.whiteClip != null ? K.whiteClip : 0.16 },
      op: { value: 0 }
    },
    vertexShader: "varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }",
    fragmentShader: [
      "uniform sampler2D map; uniform vec3 keyColor;",
      "uniform float similarity, smoothness, spill, blackClip, whiteClip, op; varying vec2 vUv;",
      "void main(){",
      "  vec3 c = texture2D(map, vUv).rgb;",
      "  float greenness = c.g - max(c.r, c.b);",              // cuánto domina el verde
      "  float keyGreen  = keyColor.g - max(keyColor.r, keyColor.b);",
      "  float d = clamp(greenness / max(keyGreen, 0.001), 0.0, 2.0);",   // 1 = verde puro
      "  float keyed = smoothstep(similarity, similarity + smoothness, d);",
      "  float a = 1.0 - keyed;",
      "  a = clamp((a - blackClip) / max(1.0 - whiteClip - blackClip, 0.001), 0.0, 1.0);",  // clean black / clean white
      "  c.g -= max(greenness, 0.0) * spill;",                 // despill (quita el verde del borde)
      "  c = clamp(c, 0.0, 1.0);",
      "  a *= op;",
      "  if (a < 0.01) discard;",
      "  gl_FragColor = vec4(c, a);",
      "}"
    ].join("\n")
  });
  const V = CFG.video || { w: 1.30, h: 1.30, x: 0, y: 0, z: 0.18 };
  const vMesh = new THREE.Mesh(new THREE.PlaneGeometry(V.w, V.h), vMat);
  vMesh.position.set(V.x, V.y, V.z); vMesh.renderOrder = 2; vMesh.visible = false; anchor.group.add(vMesh);

  // --- Estado / botones ---
  let visible = false, videoMode = false;
  const btns = $("btns"), btn = $("anim-btn");
  function setBtn() { if (btn) btn.textContent = videoMode ? "⤺ Ocultar la animación" : "▶ Toca para ver la animación de los barriles"; }
  function startVideo() { videoMode = true; try { video.currentTime = 0; } catch (_) {} video.play().catch(() => {}); setBtn(); }
  function stopVideo() { videoMode = false; video.pause(); setBtn(); }

  anchor.onTargetFound = () => { visible = true; $("scan").style.display = "none"; if (btns) btns.classList.add("on"); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; if (btns) btns.classList.remove("on"); if (videoMode) stopVideo(); };
  if (btn) btn.addEventListener("click", (e) => { e.stopPropagation(); if (!visible) return; if (videoMode) stopVideo(); else startVideo(); });

  // --- Pop-up de la inscripción "Mariscal Cáceres" (zoom por pellizco) ---
  const cacBtn = $("cac-btn"), cacPop = $("cac-pop");
  function openCac() {
    const view = $("cac-view"); view.innerHTML = "";
    const holder = document.createElement("div"); holder.className = "pz-holder";
    const stage = document.createElement("div"); stage.className = "pz-stage";
    const img = document.createElement("img"); img.alt = "Inscripción Mariscal Cáceres";
    stage.appendChild(img); holder.appendChild(stage); view.appendChild(holder);
    const hint = $("cac-hint"); hint.classList.remove("hide");
    holder.addEventListener("pointerdown", () => hint.classList.add("hide"), { once: true });
    img.onload = () => {
      stage.style.width = img.naturalWidth + "px"; stage.style.height = img.naturalHeight + "px";
      PanZoom(holder, stage, img.naturalWidth, img.naturalHeight, { pad: 0.94 }).fitBox(null);
    };
    img.src = CFG.cacSrc;
    cacPop.classList.add("on"); cacPop.setAttribute("aria-hidden", "false");
  }
  let cacT = 0;
  function closeCac() { cacPop.classList.remove("on"); cacPop.setAttribute("aria-hidden", "true"); clearTimeout(cacT); cacT = setTimeout(() => { $("cac-view").innerHTML = ""; }, 380); }
  if (cacBtn) cacBtn.addEventListener("click", (e) => { e.stopPropagation(); openCac(); });
  $("cac-close").addEventListener("click", closeCac);
  cacPop.addEventListener("pointerdown", (e) => { if (e.target === cacPop) closeCac(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && cacPop.classList.contains("on")) closeCac(); });

  try { await mindar.start(); }
  catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }

  // Cámara ya arrancada -> AHORA sí precargar el video (sin competir con MindAR).
  video.preload = "auto"; video.src = CFG.videoSrc; video.load();

  const placa = $("loading").querySelector(".creditos"); if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  renderer.setAnimationLoop(() => {
    const wantPhoto = (visible && !videoMode) ? 1 : 0;
    photoMat.opacity += (wantPhoto - photoMat.opacity) * 0.15;
    const wantVid = (visible && videoMode) ? 1 : 0;
    vMat.uniforms.op.value += (wantVid - vMat.uniforms.op.value) * 0.2;
    vMesh.visible = vMat.uniforms.op.value > 0.01;
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
