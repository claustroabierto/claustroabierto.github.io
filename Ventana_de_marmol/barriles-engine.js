/*  MOTOR — Barril de vino, SIN marcador (manual).
 *  Los barriles reales no rastrean bien como imagen, así que se saca el tracking
 *  (antes MindAR): el contenido flota FIJO sobre la cámara en vivo
 *  (shared/no-target-ar.js) y las dos experiencias se activan a mano con botones.
 *
 *  Por defecto se ve la infografía ARBARRIL. Un botón reproduce la ANIMACIÓN
 *  (video con fondo verde eliminado por CHROMA KEY en un shader: despill +
 *  clean black/white), en el mismo lugar que la infografía. El otro botón abre
 *  la inscripción "Mariscal Cáceres" en un pop-up con zoom (PanZoom).
 */
import * as THREE from "three";
import { initFixedAR, fitContentToScreen, mountCalibPanel, waitAssets } from "../shared/no-target-ar.js?v=6";
import { PanZoom } from "../shared/panzoom.js?v=1";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
function fatal(msg) { const el = $("error"); if (el) { el.textContent = "⚠ " + msg; el.style.display = "block"; } console.error(msg); }

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo || "";
  $("subtitulo").textContent = CFG.subtitulo || "";   // pre-line: el \n se ve como 2 líneas

  let renderer, scene, camera, content;
  try {
    ({ renderer, scene, camera, content } = await initFixedAR({ container: $("ar") }));
  } catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }

  const manager = new THREE.LoadingManager();
  const loader = new THREE.TextureLoader(manager);

  // --- Infografía ARBARRIL: contenido por defecto, fijo sobre la cámara ---
  const fotoTex = loader.load(CFG.fotoSrc); fotoTex.colorSpace = THREE.SRGBColorSpace;
  fotoTex.anisotropy = renderer.capabilities.getMaxAnisotropy();
  const fotoMat = new THREE.MeshBasicMaterial({ map: fotoTex, transparent: true, opacity: 1, depthTest: false, depthWrite: false });
  const fotoMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), fotoMat);   // ARBARRIL es cuadrada (850x850)
  fotoMesh.position.set(0, 0, 0.01); fotoMesh.renderOrder = 1; content.add(fotoMesh);

  // --- Video con chroma key (mismo plano 1x1; carga DIFERIDA tras la cámara) ---
  const video = document.createElement("video");
  video.loop = true; video.playsInline = true; video.setAttribute("playsinline", ""); video.muted = true; video.crossOrigin = "anonymous";
  video.preload = "none";   // NO cargar todavía (evita competir con la cámara al inicio)
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
      "  float greenness = c.g - max(c.r, c.b);",
      "  float keyGreen  = keyColor.g - max(keyColor.r, keyColor.b);",
      "  float d = clamp(greenness / max(keyGreen, 0.001), 0.0, 2.0);",
      "  float keyed = smoothstep(similarity, similarity + smoothness, d);",
      "  float a = 1.0 - keyed;",
      "  a = clamp((a - blackClip) / max(1.0 - whiteClip - blackClip, 0.001), 0.0, 1.0);",
      "  c.g -= max(greenness, 0.0) * spill;",
      "  c = clamp(c, 0.0, 1.0);",
      "  a *= op;",
      "  if (a < 0.01) discard;",
      "  gl_FragColor = vec4(c, a);",
      "}"
    ].join("\n")
  });
  const vMesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), vMat);
  vMesh.position.set(0, 0, 0.02); vMesh.renderOrder = 2; vMesh.visible = false; content.add(vMesh);

  // Tamaño: se calcula solo para llenar la pantalla (ambos planos son cuadrados).
  const fitter = fitContentToScreen(content, camera, { fill: CFG.fill != null ? CFG.fill : 0.98 });
  mountCalibPanel(fitter);

  // --- Botones (manuales, siempre disponibles) ---
  let videoMode = false;
  const btns = $("btns"), btn = $("anim-btn");
  function setBtn() { if (btn) btn.textContent = videoMode ? "⤺ Ocultar la animación" : "▶ Toca para ver la animación de los barriles"; }
  function startVideo() { videoMode = true; try { video.currentTime = 0; } catch (_) {} video.play().catch(() => {}); setBtn(); }
  function stopVideo() { videoMode = false; video.pause(); setBtn(); }
  if (btn) btn.addEventListener("click", (e) => { e.stopPropagation(); videoMode ? stopVideo() : startVideo(); });

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

  // Se muestra apenas terminan de bajar las imágenes (sin esperar a detectar nada).
  await waitAssets(manager);
  // Cámara ya arriba -> AHORA sí precargar el video (sin competir con la cámara).
  video.preload = "auto"; video.src = CFG.videoSrc; video.load();
  $("loading").style.display = "none";
  if (btns) btns.classList.add("on");

  renderer.setAnimationLoop(() => {
    const wantVid = videoMode ? 1 : 0;
    vMat.uniforms.op.value += (wantVid - vMat.uniforms.op.value) * 0.2;
    vMesh.visible = vMat.uniforms.op.value > 0.01;
    const wantFoto = videoMode ? 0 : 1;   // la infografía se oculta mientras corre la animación
    fotoMat.opacity += (wantFoto - fotoMat.opacity) * 0.15;
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
