
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

/*  Editor genérico para alinear el overlay actual de una pieza contra el
 *  NUEVO target de imagen (target_nuevo.jpg / targets_nuevo.mind), ahora que
 *  la sala no tiene luz externa y una foto real podría rastrear bien.
 *  Cada pieza trae su propio EDITOR_CFG (ver editor.html en su carpeta):
 *    { targetSrc, refSrc, refAspect, start:{width,offsetX,offsetY} }
 *  `refSrc` = la MISMA foto a color que ya usa el overlay actual (para que
 *  el resultado sirva tal cual en el config real), NO el target recortado.
 */
const CFG = window.EDITOR_CFG;
if (!CFG) document.getElementById("error").textContent = "Falta EDITOR_CFG";

let W = CFG.start.width, X = CFG.start.offsetX, Y = CFG.start.offsetY;
const START = { W, X, Y };
const NUDGE = { x: 0.006, y: 0.006, w: 0.01 };

function fatal(msg) { const el = document.getElementById("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

async function start() {
  let mindar;
  try {
    mindar = new MindARThree({ container: document.getElementById("ar"), imageTargetSrc: CFG.targetSrc, uiScanning: "no", uiLoading: "no" });
  } catch (e) { return fatal("No se pudo iniciar MindAR: " + e.message); }
  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();
  const tex = loader.load(CFG.refSrc); tex.colorSpace = THREE.SRGBColorSpace;
  const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), mat);
  const grupo = new THREE.Group();
  grupo.add(mesh);
  anchor.group.add(grupo);

  anchor.onTargetFound = () => { document.getElementById("scan").style.display = "none"; };
  anchor.onTargetLost = () => { document.getElementById("scan").style.display = "flex"; };

  function apply() {
    grupo.scale.set(W, W * CFG.refAspect, 1);
    grupo.position.set(X, Y, 0);
    document.getElementById("pw").textContent = W.toFixed(3);
    document.getElementById("px").textContent = X.toFixed(3);
    document.getElementById("py").textContent = Y.toFixed(3);
  }
  apply();

  try { await mindar.start(); } catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  renderer.setAnimationLoop(() => renderer.render(scene, camera));

  // --- arrastre (mover) + pellizco (escalar), en el plano del target ---
  const pts = new Map(); let pinchStart = 0, Wstart = W;
  const canvas = renderer.domElement;
  canvas.style.touchAction = "none";
  canvas.addEventListener("pointerdown", (e) => {
    canvas.setPointerCapture(e.pointerId); pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()]; pinchStart = Math.hypot(a.x - b.x, a.y - b.y); Wstart = W; }
  });
  canvas.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    if (pts.size === 1) {
      // mover en unidades del target (ancho del target = 1 en X, y en Y según aspect)
      X += (e.clientX - prev.x) / innerWidth * 1.4;
      Y -= (e.clientY - prev.y) / innerHeight * 1.4;
      apply();
    }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()]; const d = Math.hypot(a.x - b.x, a.y - b.y);
      if (pinchStart > 0) { W = Math.max(0.1, Wstart * (d / pinchStart)); apply(); }
    }
  });
  function up(e) { pts.delete(e.pointerId); if (pts.size < 2) pinchStart = 0; }
  canvas.addEventListener("pointerup", up); canvas.addEventListener("pointercancel", up);
  canvas.addEventListener("wheel", (e) => { e.preventDefault(); W = Math.max(0.1, W * (1 - e.deltaY * 0.0012)); apply(); }, { passive: false });

  document.querySelectorAll(".bar button[data-k]").forEach((b) => b.addEventListener("click", () => {
    const k = b.dataset.k, d = +b.dataset.d;
    if (k === "x") X += d * NUDGE.x; if (k === "y") Y += d * NUDGE.y; if (k === "w") W += d * NUDGE.w;
    apply();
  }));
  document.getElementById("reset").addEventListener("click", () => { W = START.W; X = START.X; Y = START.Y; apply(); });
  const copyBtn = document.getElementById("copy");
  let copyT = 0;
  copyBtn.addEventListener("click", async () => {
    const txt = `overlay: { width: ${W.toFixed(3)}, height: ${(W * CFG.refAspect).toFixed(3)}, offsetX: ${X.toFixed(3)}, offsetY: ${Y.toFixed(3)} },`;
    try { await navigator.clipboard.writeText(txt); } catch { const ta = document.createElement("textarea"); ta.value = txt; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); }
    copyBtn.textContent = "✓ copiado"; clearTimeout(copyT); copyT = setTimeout(() => copyBtn.textContent = "⧉ Copiar", 1500);
  });
}
window.addEventListener("DOMContentLoaded", start);
