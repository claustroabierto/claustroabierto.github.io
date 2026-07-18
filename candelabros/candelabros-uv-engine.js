/*  MOTOR RA — candelabros (vidrio de uranio) con MARCADOR RA.
 *  El candelabro es vidrio brilloso 3D que NO rastrea como imagen y se mueve en
 *  vitrina → el target es un MARCADOR impreso (foto del candelabro + "RA2"), no
 *  la pieza. Al escanearlo, el candelabro "sale" del marcador, flota, y SE
 *  ENCIENDE: una luz UV lo prende y fluoresce verde con un glow que late.
 *
 *  MindAR (image tracking del marcador) + three.js. Base: relicario/marcador-engine.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const step = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

function fatal(msg) { const el = $("error"); el.textContent = "⚠ " + msg; el.style.display = "block"; console.error(msg); }

async function start() {
  if (!CFG || !CFG.objeto) return fatal("No se cargó la configuración de la pieza.");
  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = CFG.subtitulo || "";
  $("ficha-txt").textContent = CFG.ficha || "";

  let mindar;
  try {
    mindar = new MindARThree({
      container: $("ar"), imageTargetSrc: CFG.targetSrc,
      uiScanning: "no", uiLoading: "no", filterMinCF: 0.0001, filterBeta: 0.001
    });
  } catch (e) { return fatal("No se pudo iniciar MindAR: " + e.message); }

  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();
  const tx = (s) => { const t = loader.load(s); t.colorSpace = THREE.SRGBColorSpace; return t; };

  // --- Glow verde radial (halo de fluorescencia) ---
  function makeGlow() {
    const s = 128, cv = document.createElement("canvas"); cv.width = cv.height = s;
    const g = cv.getContext("2d");
    const gr = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    gr.addColorStop(0, "rgba(120,255,120,0.9)");
    gr.addColorStop(0.4, "rgba(57,255,20,0.35)");
    gr.addColorStop(1, "rgba(57,255,20,0)");
    g.fillStyle = gr; g.fillRect(0, 0, s, s);
    const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace; return t;
  }
  // --- Etiqueta en ARIAL, color SÓLIDO (mismo gris que "CON LUZ UV"), sin contorno ---
  function makeLabel(text, w, color) {
    color = color || "#b4b4b4";
    const size = 96, c = document.createElement("canvas"), ctx = c.getContext("2d");
    const font = `700 ${size}px Arial, "Helvetica Neue", Helvetica, sans-serif`;
    ctx.font = font; const pad = size * 0.5;
    c.width = Math.ceil(ctx.measureText(text).width) + pad * 2; c.height = size + pad;
    ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = color; ctx.fillText(text, c.width/2, c.height/2);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4;
    const h = w * c.height / c.width;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
    m.renderOrder = 8; return m;
  }

  // --- El candelabro que sale del marcador y se enciende ---
  const o = CFG.objeto;
  const H = o.size / o.aspect;
  const mat = new THREE.MeshBasicMaterial({ map: tx(o.src), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.size, H), mat);
  mesh.renderOrder = 6; anchor.group.add(mesh);
  // halo de glow detrás
  const glowMat = new THREE.SpriteMaterial({ map: makeGlow(), transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, opacity: 0 });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(o.size * 1.7, H * 1.15, 1); glow.renderOrder = 5; anchor.group.add(glow);
  // sombra suave
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(o.size * 0.8, o.size * 0.8 * 0.28),
    new THREE.MeshBasicMaterial({ map: makeGlow(), color: 0x000000, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
  shadow.renderOrder = 4; anchor.group.add(shadow);

  // --- Comparativas del cristal (sin / con UV) a los costados ---
  // Las comparativas (sinuv/conuv) YA traen su rótulo ("SIN LUZ UV"/"CON LUZ UV")
  // impreso → no se les agrega etiqueta extra.
  const comps = (CFG.comparativas || []).map((c) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(c.size, c.size / c.aspect),
      new THREE.MeshBasicMaterial({ map: tx(c.src), transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
    m.position.set(c.x, c.y, 0.02); m.renderOrder = 7; anchor.group.add(m);
    return { m };
  });

  // --- Título de la pieza (Arial, MAYÚSCULAS, color del equipo) arriba, fijo ---
  const L = CFG.label || { text: "REFLEXIÓN POR RADIACIÓN DE LUZ UV", color: "#eafff0" };
  const title = makeLabel((L.text || "").toUpperCase(), L.width || 1.15, L.color);
  title.position.set(0, (o.size / o.aspect) * 0.5 + 0.12, 0.05);   // arriba del candelabro
  anchor.group.add(title);

  const DARK = new THREE.Color(0.16, 0.20, 0.16);   // candelabro "apagado" (antes del UV)
  const setCaption = (t) => { $("caption").textContent = t || ""; };

  let visible = false, startT = 0;
  const clock = new THREE.Clock();
  anchor.onTargetFound = () => { visible = true; startT = clock.getElapsedTime(); $("scan").style.display = "none"; $("panel").classList.add("on"); };
  anchor.onTargetLost = () => { visible = false; $("scan").style.display = "flex"; $("panel").classList.remove("on"); };
  const replay = () => { if (visible) startT = clock.getElapsedTime(); };
  const rb = $("btn-repeat"); if (rb) rb.addEventListener("click", (e) => { e.stopPropagation(); replay(); });
  window.addEventListener("pointerdown", (e) => { if (visible && e.target && e.target.closest && !e.target.closest("#panel,#topbar,#error")) replay(); });

  try { await mindar.start(); }
  catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  const placa = $("loading").querySelector(".creditos");
  if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  // Suavizado del pose: el marcador RA2 es débil (pocas features) → el tracking
  // tiembla y la escala oscila. Interpolamos posición/rotación/escala del anchor
  // hacia el valor rastreado (menos jitter, con un poco de lag — aceptable porque
  // el candelabro FLOTA, no calza pixel a pixel).
  const _p = new THREE.Vector3(), _q = new THREE.Quaternion(), _s = new THREE.Vector3();
  const sp = new THREE.Vector3(), sq = new THREE.Quaternion(), ss = new THREE.Vector3();
  let sInit = false;

  renderer.setAnimationLoop(() => {
    const now = clock.getElapsedTime();
    const t = now - startT;
    if (visible) {
      anchor.group.matrix.decompose(_p, _q, _s);
      if (!sInit) { sp.copy(_p); sq.copy(_q); ss.copy(_s); sInit = true; }
      else { sp.lerp(_p, 0.18); sq.slerp(_q, 0.18); ss.lerp(_s, 0.18); }
      anchor.group.matrix.compose(sp, sq, ss);
      anchor.group.matrixWorldNeedsUpdate = true;
    } else sInit = false;
    const appear = visible ? step(0.0, 0.6, t) : 0;     // sale del marcador
    const rise = visible ? step(0.2, 1.1, t) : 0;       // se adelanta/eleva
    const uv = visible ? step(0.9, 2.3, t) : 0;         // la luz UV se "prende"
    const bob = Math.sin(now * 1.1) * 0.02 * appear;
    const sway = Math.sin(now * 0.7) * 0.06 * appear;
    const pulse = 0.72 + 0.28 * (Math.sin(now * 2.6) * 0.5 + 0.5);   // latido de la fluorescencia

    // candelabro: aparece apagado y se enciende (color oscuro -> verde pleno)
    mat.opacity = appear;
    mat.color.copy(DARK).lerp(new THREE.Color(1, 1, 1), uv);
    mesh.position.set(0, bob + rise * 0.04, 0.12 + rise * 0.10);
    mesh.rotation.y = sway;
    mesh.scale.setScalar(lerp(0.6, 1, appear));
    // glow + sombra
    glowMat.opacity = uv * pulse * 0.85;
    glow.position.set(0, bob + rise * 0.04, 0.11 + rise * 0.10);
    const gs = pulse; glow.scale.set(o.size * 1.7 * gs, H * 1.15 * gs, 1);
    shadow.material.opacity = appear * 0.45;
    shadow.position.set(0, -H * 0.52 + bob * 0.5, 0.02);
    // título + comparativas
    title.material.opacity = appear;
    for (const c of comps) { c.m.material.opacity = step(1.4, 2.2, t) * (visible ? 1 : 0); }

    setCaption(t < 0.9 ? "El candelabro sale del marcador…"
      : uv < 0.99 ? "Encendiendo la luz UV…"
      : "El vidrio de uranio fluoresce verde bajo luz UV · toca para repetir");
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
