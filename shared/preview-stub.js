/*  PREVIEW STUB — reemplazo de MindARThree para ver las piezas SIN cámara ni
 *  marcador físico. Implementa la misma API mínima que usan todos los
 *  *-engine.js (constructor, addAnchor, start, stop) así que el motor real de
 *  cada pieza corre SIN MODIFICAR — lo que se ve acá es exactamente el mismo
 *  código que corre en producción, solo que "encuentra" el target al toque en
 *  vez de por cámara, y de fondo pone la foto real de la pieza
 *  (CFG.targetPreview) en vez del video.
 *
 *  Uso: en una copia del index.html de la pieza, el importmap apunta
 *  "mindar-image-three" acá en vez del CDN real. Ver <pieza>/preview.html.
 */
import * as THREE from "three";

function loadImage(src) {
  return new Promise((resolve) => {
    if (!src) return resolve(null);
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

// Recorre TODO el config buscando objetos con forma "overlay" (offsetX/offsetY +
// width/height) o "capa" (x/y + width[/aspect]) — los dos patrones que usan las
// piezas para plantar cosas en el espacio — y arma la caja que las contiene a
// todas. Así el encuadre del preview no depende de adivinar por pieza: cubre
// etiquetas/paneles que se extienden bien afuera de la foto plana del cuadro
// (pasaba en Inmaculada: las etiquetas de microscopía quedaban cortadas arriba).
function scanBBox(node, bbox, seen) {
  if (!node || typeof node !== "object" || seen.has(node)) return;
  seen.add(node);
  if (Array.isArray(node)) { node.forEach((n) => scanBBox(n, bbox, seen)); return; }
  const hasOverlay = typeof node.offsetX === "number" && typeof node.width === "number";
  const hasCapa = typeof node.x === "number" && typeof node.y === "number" && typeof node.width === "number";
  if (hasOverlay || hasCapa) {
    const cx = hasOverlay ? node.offsetX : node.x;
    const cy = hasOverlay ? (node.offsetY || 0) : node.y;
    const w = node.width;
    const h = hasOverlay ? (node.height || w) : (node.aspect ? node.width / node.aspect : w);
    bbox.minX = Math.min(bbox.minX, cx - w / 2); bbox.maxX = Math.max(bbox.maxX, cx + w / 2);
    bbox.minY = Math.min(bbox.minY, cy - h / 2); bbox.maxY = Math.max(bbox.maxY, cy + h / 2);
  }
  Object.values(node).forEach((v) => { if (v && typeof v === "object") scanBBox(v, bbox, seen); });
}

export class MindARThree {
  constructor(opts) {
    this.container = opts.container;
    this.renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    this.container.appendChild(this.renderer.domElement);
    // Los *-engine.js llaman renderer.setAnimationLoop(cb), que por defecto usa
    // requestAnimationFrame — el navegador lo CONGELA en pestañas en segundo
    // plano/sin foco (típico en automatización/testing), dejando la animación
    // trabada. Acá se reemplaza por un intervalo real para que la previsualización
    // avance siempre, esté o no la pestaña "visible" para el navegador.
    this.renderer.setAnimationLoop = (cb) => {
      if (this._loopId) clearInterval(this._loopId);
      if (cb) this._loopId = setInterval(() => {
        try { cb(); window.__previewTicks = (window.__previewTicks || 0) + 1; }
        catch (e) { window.__previewErr = e.message + ' | ' + e.stack; throw e; }
      }, 1000 / 30);
    };
    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(40, 1, 0.01, 100);
    this._need = 3.4; // ancho/alto visible por defecto — bien alejado (pidieron ver
    // todo más chico, no llenando la pantalla); se ajusta un poco al cargar la foto.
    this._anchors = [];
    this._onResize = () => this._resize();
    window.addEventListener("resize", this._onResize);
    // Zoom manual con la rueda del mouse / pellizco de dos dedos, para laptop.
    this.container.addEventListener("wheel", (e) => {
      e.preventDefault();
      this._need = Math.min(8, Math.max(0.8, this._need * (1 + e.deltaY * 0.001)));
      this._resize();
    }, { passive: false });
    this._resize();

    // Expuesto para la herramienta de edición de círculos (shared/preview-editor.js).
    window.__previewMindAR = this;
  }

  _resize() {
    const w = this.container.clientWidth || window.innerWidth;
    const h = this.container.clientHeight || window.innerHeight;
    this.renderer.setSize(w, h);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    const a = w / h;
    const halfV = Math.tan(THREE.MathUtils.degToRad(this.camera.fov) / 2);
    const dz = a >= 1 ? this._need / 2 / (halfV * a) : this._need / 2 / halfV;
    const lookAt = this._lookAt || { x: 0, y: 0 };
    this.camera.position.set(lookAt.x, lookAt.y, Math.max(1.4, dz));
    this.camera.lookAt(lookAt.x, lookAt.y, 0);
  }

  addAnchor() {
    const group = new THREE.Group();
    this.scene.add(group);
    const anchor = { group, onTargetFound: null, onTargetLost: null };
    this._anchors.push(anchor);
    window.__previewAnchors = this._anchors;
    return anchor;
  }

  async start() {
    const CFG = window.MUSEO_CONFIG || {};
    const img = await loadImage(CFG.targetPreview);
    if (img && img.naturalWidth) {
      const w = 1, h = img.naturalHeight / img.naturalWidth;

      // Encuadre real: caja que contiene la foto Y todo lo que la pieza planta
      // encima (overlays, capas, microscopías...), no solo la foto sola.
      const bbox = { minX: -w / 2, maxX: w / 2, minY: -h / 2, maxY: h / 2 };
      scanBBox(CFG, bbox, new Set());
      const need = Math.max(bbox.maxX - bbox.minX, bbox.maxY - bbox.minY) * 1.15;
      this._need = Math.max(need, 1.2);
      // Si la caja no queda centrada en (0,0) (p.ej. paneles bien corridos a un
      // lado), centramos la cámara en el medio real en vez de en el origen.
      this._lookAt = { x: (bbox.minX + bbox.maxX) / 2, y: (bbox.minY + bbox.maxY) / 2 };

      const tex = new THREE.TextureLoader().load(CFG.targetPreview);
      tex.colorSpace = THREE.SRGBColorSpace;
      const mesh = new THREE.Mesh(
        new THREE.PlaneGeometry(w, h),
        new THREE.MeshBasicMaterial({ map: tex, depthTest: false, depthWrite: false })
      );
      mesh.position.z = -0.08;
      mesh.renderOrder = -1;
      this.scene.add(mesh);
    }
    this._resize();
    // "Detecta" el target apenas arranca, como si ya estuviera encuadrado.
    setTimeout(() => this._anchors.forEach((a) => a.onTargetFound && a.onTargetFound()), 250);
    return true;
  }

  stop() {
    window.removeEventListener("resize", this._onResize);
  }
}
