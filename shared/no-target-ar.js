/*  MOTOR COMÚN — piezas SIN marcador (ex "letras RA": RA2/RA6/RA7/RA8).
 *
 *  Esos marcadores eran solo letras impresas (el objeto real no rastrea como
 *  imagen: brilla, es de volumen o se mueve en vitrina) y por ser débiles daban
 *  problemas constantes: detección floja, tracking que tiembla o se tuerce, y
 *  el contenido salía del tamaño que se imprimió el marcador. Acá se saca el
 *  tracking del todo: el contenido flota FIJO sobre la cámara en vivo (no
 *  depende de detectar nada), calibrado a mano una sola vez con el panel de
 *  ajuste (`?calib=1`) en vez de con un marcador.
 *
 *  `initFixedAR` deja lista cámara (o, en preview, sin cámara) + three.js.
 *  `content` es el grupo fijo (posición/escala calibrables) donde cada pieza
 *  cuelga sus mallas, igual que antes colgaban de `anchor.group`.
 */
import * as THREE from "three";

export async function initFixedAR({ container, fov = 45, camZ = 2.5 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.setSize(innerWidth, innerHeight);
  renderer.domElement.style.cssText = "position:fixed;inset:0;";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.01, 100);
  camera.position.set(0, 0, camZ);

  window.addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    camera.aspect = innerWidth / innerHeight;
    camera.updateProjectionMatrix();
  });

  // En preview (sin cámara real) se deja el fondo transparente/negro del
  // canvas; en la pieza real se pide la cámara y se pone de fondo, detrás
  // del canvas three.js (que queda transparente encima).
  let video = null;
  if (!window.MUSEO_PREVIEW) {
    video = document.createElement("video");
    video.autoplay = true; video.muted = true; video.playsInline = true;
    video.style.cssText = "position:fixed;inset:0;width:100%;height:100%;object-fit:cover;background:#000;";
    container.insertBefore(video, container.firstChild);
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    video.srcObject = stream;
    await video.play();
  }

  const content = new THREE.Group();
  scene.add(content);

  return { renderer, scene, camera, content, video };
}

// Panel de calibración en vivo (agregar ?calib=1 a la URL): ajusta a mano el
// tamaño y la posición del contenido fijo, sin depender de marcador ni regla
// -- copia los valores para pegarlos como los defaults de cada pieza. Queda
// disponible siempre (no se saca del código) por si algo no calza bien.
export function mountCalibPanel(content, defaults) {
  if (!new URLSearchParams(location.search).has("calib")) return;
  let S = defaults.scale, X = defaults.x, Y = defaults.y;

  const panel = document.createElement("div");
  panel.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:999;max-width:calc(100vw - 16px);"
    + "background:#171320;border:1px solid #ffffff33;border-radius:12px;padding:10px 12px;"
    + "font:12px system-ui,sans-serif;color:#f4efe6;touch-action:none;line-height:1.7;-webkit-user-select:none;user-select:none;";
  panel.innerHTML =
    '<div>SCALE <b id="cv-s"></b> '
    + '<button data-a="s" data-d="-1">−</button><button data-a="s" data-d="1">+</button> '
    + '<button data-a="s2" data-d="-1">÷2</button><button data-a="s2" data-d="1">×2</button></div>'
    + '<div>OFFSET_X <b id="cv-x"></b> <button data-a="x" data-d="-1">−</button><button data-a="x" data-d="1">+</button></div>'
    + '<div>OFFSET_Y <b id="cv-y"></b> <button data-a="y" data-d="-1">−</button><button data-a="y" data-d="1">+</button></div>'
    + '<button id="cv-copy" style="margin-top:6px;background:#c9a24b;color:#1a1206;border:0;border-radius:8px;padding:8px 10px;font-weight:700;">Copiar valores</button>';
  panel.querySelectorAll("button").forEach((b) => {
    b.style.cssText = "background:#221c30;color:#f4efe6;border:1px solid #ffffff33;border-radius:8px;padding:6px 10px;font-size:13px;margin:2px 2px 0 0;";
  });
  document.body.appendChild(panel);
  // Sin esto, tocar el panel se propaga al canvas de abajo (igual que pasaba
  // con el panel de salvilla) y descuadra lo que se está calibrando.
  ["pointerdown", "pointerup", "touchstart", "touchend", "click"].forEach((ev) =>
    panel.addEventListener(ev, (e) => e.stopPropagation()));

  const readout = () => {
    panel.querySelector("#cv-s").textContent = S.toFixed(2);
    panel.querySelector("#cv-x").textContent = X.toFixed(2);
    panel.querySelector("#cv-y").textContent = Y.toFixed(2);
  };
  const apply = () => { content.scale.setScalar(S); content.position.set(X, Y, 0); readout(); };
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const a = b.dataset.a, d = Number(b.dataset.d);
    if (a === "s") S = Math.max(0.02, S + d * 0.02);
    if (a === "s2") S = d > 0 ? S * 2 : S / 2;
    if (a === "x") X += d * 0.02;
    if (a === "y") Y += d * 0.02;
    apply();
  });
  const copyBtn = panel.querySelector("#cv-copy");
  copyBtn.addEventListener("click", () => {
    const txt = "SCALE = " + S.toFixed(2) + ", OFFSET_X = " + X.toFixed(2) + ", OFFSET_Y = " + Y.toFixed(2);
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
    copyBtn.textContent = "Copiado ✓";
    setTimeout(() => { copyBtn.textContent = "Copiar valores"; }, 1200);
  });
  apply();
}

// Espera a que terminen de bajar todas las texturas pedidas a `loader` (o
// como mucho `timeoutMs`), y encima suma un colchón fijo -- así el "cargando"
// dura lo que tardan las imágenes + 1-2s, ni más ni menos.
export function waitAssets(manager, { padMs = 1500, timeoutMs = 20000 } = {}) {
  return new Promise((resolve) => {
    const done = () => resolve();
    manager.onLoad = done;
    manager.onError = () => {}; // no colgar el "cargando" por una imagen rota
    setTimeout(done, timeoutMs);
  }).then(() => new Promise((r) => setTimeout(r, padMs)));
}
