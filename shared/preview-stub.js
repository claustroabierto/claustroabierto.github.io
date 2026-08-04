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
    this._need = 2.6; // ancho/alto visible por defecto (algunas piezas tienen paneles
    // laterales bien anchos, ej. Santa Teresa/Escapulario) — mejor que sobre margen a
    // que se corten; se ajusta un poco al cargar la foto de fondo.
    this._anchors = [];
    this._onResize = () => this._resize();
    window.addEventListener("resize", this._onResize);
    this._resize();
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
    this.camera.position.set(0, 0, Math.max(1.4, dz));
    this.camera.lookAt(0, 0, 0);
  }

  addAnchor() {
    const group = new THREE.Group();
    this.scene.add(group);
    const anchor = { group, onTargetFound: null, onTargetLost: null };
    this._anchors.push(anchor);
    return anchor;
  }

  async start() {
    const CFG = window.MUSEO_CONFIG || {};
    const img = await loadImage(CFG.targetPreview);
    if (img && img.naturalWidth) {
      const w = 1, h = img.naturalHeight / img.naturalWidth;
      // Margen generoso: varias piezas tienen paneles/columnas que se extienden bien
      // más allá del ancho de la foto (microscopías al costado, etc.).
      this._need = Math.max(Math.max(w, h) * 1.4, 2.4);
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
