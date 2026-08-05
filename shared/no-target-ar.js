/*  MOTOR COMÚN — piezas SIN marcador (ex "letras RA": RA2/RA6/RA7/RA8).
 *
 *  Esos marcadores eran solo letras impresas (el objeto real no rastrea como
 *  imagen: brilla, es de volumen o se mueve en vitrina) y por ser débiles daban
 *  problemas constantes: detección floja, tracking que tiembla o se tuerce, y
 *  el contenido salía del tamaño que se imprimió el marcador. Acá se saca el
 *  tracking del todo: el contenido flota FIJO sobre la cámara en vivo.
 *
 *  TAMAÑO: se calcula SOLO para que la pieza ocupe todo el ancho de la pantalla
 *  (`fitContentToScreen`), en vez de un número calibrado a mano. Acá la cámara
 *  es NUESTRA (fov/distancia conocidos, no los de MindAR), así que la cuenta da
 *  exacta en cualquier celular y se rehace sola al rotar.
 *
 *  Por qué llenar la pantalla y no dejarlo chico: a mitad de tamaño se estaban
 *  metiendo ~1226px de imagen dentro de ~456px de pantalla, y comprimir tanto es
 *  lo que rompe las letras y las líneas finas (se ven "pixeleadas"). A pantalla
 *  completa las tres piezas tienen resolución de sobra (medido: Florero 1.0x,
 *  salvilla 2.0x, relicario 1.5x), así que se ve más grande Y más limpio.
 */
import * as THREE from "three";

export async function initFixedAR({ container, fov = 45, camZ = 2.5 } = {}) {
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 3));
  renderer.setSize(innerWidth, innerHeight);
  renderer.domElement.style.cssText = "position:fixed;inset:0;width:100%;height:100%;";
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(fov, innerWidth / innerHeight, 0.01, 100);
  camera.position.set(0, 0, camZ);

  window.addEventListener("resize", () => {
    renderer.setSize(innerWidth, innerHeight);
    renderer.domElement.style.width = "100%";
    renderer.domElement.style.height = "100%";
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
    // Avisa qué está esperando: si no, el "cargando" parece trabado mientras
    // el navegador espera que el visitante responda el permiso de cámara.
    const estado = document.querySelector("#loading .estado");
    if (estado) estado.textContent = "Esperando permiso de cámara…";
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
    if (estado) estado.textContent = "Preparando la realidad aumentada…";
    video.srcObject = stream;
    await video.play();
  }

  const content = new THREE.Group();
  scene.add(content);

  return { renderer, scene, camera, content, video };
}

// Cuánto mundo se ve a la distancia del contenido (z=0), con NUESTRA cámara.
function viewSize(camera) {
  const h = 2 * camera.position.z * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2);
  return { w: h * camera.aspect, h };
}

/*  Escala y centra el contenido para que ocupe toda la pantalla, midiendo su
 *  caja real (Box3) en vez de pedir medidas a mano — así sirve igual para una
 *  pieza ancha (Florero) que para una cuadrada (relicario), sin configurar nada.
 *  `user` permite retocar encima (x1 = como lo calcula solo); los offsets van en
 *  fracciones de pantalla, así significan lo mismo en cualquier celular.
 *  Llamar DESPUÉS de agregar todas las mallas al `content`.
 */
export function fitContentToScreen(content, camera, opts = {}) {
  const fill = opts.fill != null ? opts.fill : 0.98;
  const user = { scale: 1, x: 0, y: 0 };
  const _box = new THREE.Box3(), _size = new THREE.Vector3(), _center = new THREE.Vector3();

  function apply() {
    // Medir SIEMPRE sin transformar, si no la caja se mide sobre sí misma.
    content.scale.setScalar(1);
    content.position.set(0, 0, 0);
    content.updateMatrixWorld(true);
    _box.setFromObject(content);
    if (_box.isEmpty()) return;
    _box.getSize(_size); _box.getCenter(_center);

    const view = viewSize(camera);
    const s = Math.min(view.w * fill / _size.x, view.h * fill / _size.y) * user.scale;
    content.scale.setScalar(s);
    // Centrar la caja real en pantalla (no el origen: los overlays traen su
    // propio offsetX/offsetY horneado) y recién ahí aplicar el retoque manual.
    content.position.set(-_center.x * s + user.x * view.w, -_center.y * s + user.y * view.h, 0);
  }

  apply();
  window.addEventListener("resize", apply);
  return { apply, user };
}

/*  Panel de ajuste en vivo (agregar ?calib=1 a la URL). Ya NO define el tamaño
 *  base — eso lo calcula `fitContentToScreen`. Esto es solo para retocar encima
 *  si algo no calza: SCALE x1.00 = como lo calcula solo.
 */
export function mountCalibPanel(fitter) {
  if (!new URLSearchParams(location.search).has("calib")) return;
  const { user, apply } = fitter;

  const panel = document.createElement("div");
  panel.style.cssText = "position:fixed;left:8px;bottom:8px;z-index:999;max-width:calc(100vw - 16px);"
    + "background:#171320;border:1px solid #ffffff33;border-radius:12px;padding:10px 12px;"
    + "font:12px system-ui,sans-serif;color:#f4efe6;touch-action:none;line-height:1.7;-webkit-user-select:none;user-select:none;";
  panel.innerHTML =
    '<div>SCALE x<b id="cv-s"></b> '
    + '<button data-a="s" data-d="-1">−</button><button data-a="s" data-d="1">+</button></div>'
    + '<div>OFFSET_X <b id="cv-x"></b> <button data-a="x" data-d="-1">−</button><button data-a="x" data-d="1">+</button></div>'
    + '<div>OFFSET_Y <b id="cv-y"></b> <button data-a="y" data-d="-1">−</button><button data-a="y" data-d="1">+</button></div>'
    + '<button id="cv-copy" style="margin-top:6px;background:#c9a24b;color:#1a1206;border:0;border-radius:8px;padding:8px 10px;font-weight:700;">Copiar valores</button>';
  panel.querySelectorAll("button").forEach((b) => {
    b.style.cssText = "background:#221c30;color:#f4efe6;border:1px solid #ffffff33;border-radius:8px;padding:6px 10px;font-size:13px;margin:2px 2px 0 0;";
  });
  document.body.appendChild(panel);
  // Sin esto, tocar el panel se propaga al canvas de abajo y descuadra lo que
  // se está calibrando.
  ["pointerdown", "pointerup", "touchstart", "touchend", "click"].forEach((ev) =>
    panel.addEventListener(ev, (e) => e.stopPropagation()));

  const readout = () => {
    panel.querySelector("#cv-s").textContent = user.scale.toFixed(2);
    panel.querySelector("#cv-x").textContent = user.x.toFixed(2);
    panel.querySelector("#cv-y").textContent = user.y.toFixed(2);
  };
  panel.addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    const a = b.dataset.a, d = Number(b.dataset.d);
    if (a === "s") user.scale = Math.max(0.1, user.scale + d * 0.05);
    if (a === "x") user.x += d * 0.02;
    if (a === "y") user.y += d * 0.02;
    apply(); readout();
  });
  const copyBtn = panel.querySelector("#cv-copy");
  copyBtn.addEventListener("click", () => {
    const txt = "scale: " + user.scale.toFixed(2) + ", x: " + user.x.toFixed(2) + ", y: " + user.y.toFixed(2);
    if (navigator.clipboard) navigator.clipboard.writeText(txt).catch(() => {});
    copyBtn.textContent = "Copiado ✓";
    setTimeout(() => { copyBtn.textContent = "Copiar valores"; }, 1200);
  });
  readout();
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
