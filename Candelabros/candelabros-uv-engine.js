/*  MOTOR RA — candelabros (vidrio de uranio), SIN marcador.
 *  Ya no depende de detectar ningún target (antes RA2, letras+foto, medía
 *  débil y el tracking temblaba). El candelabro "sale" y flota FIJO sobre la
 *  cámara en vivo, calibrado a mano una vez (ver shared/no-target-ar.js), y SE
 *  ENCIENDE: una luz UV lo prende y fluoresce verde con un glow que late.
 *
 *  three.js. Base: relicario/marcador-engine.
 */
import * as THREE from "three";
import { initFixedAR, mountCalibPanel, waitAssets } from "../shared/no-target-ar.js?v=5";

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

  let renderer, scene, camera, content;
  try {
    ({ renderer, scene, camera, content } = await initFixedAR({ container: $("ar") }));
  } catch (e) { return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")"); }
  // Calibrado a mano en celular real (2026-08-04) con ?calib=1.
  mountCalibPanel(content, { scale: 0.23, x: -0.29, y: 0.48 });

  const manager = new THREE.LoadingManager();
  const loader = new THREE.TextureLoader(manager);
  const tx = (s) => { const t = loader.load(s); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = renderer.capabilities.getMaxAnisotropy(); return t; };

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
    // size en px del canvas -- no cambia el tamaño en pantalla (eso lo define
    // `w`, en unidades de mundo), solo cuánto detalle real tiene la textura.
    // El contenido ahora se ve más grande que antes (ya no depende de un
    // marcador chico), así que se sube para que el título no se vea pixelado.
    const size = 192, c = document.createElement("canvas"), ctx = c.getContext("2d");
    const font = `700 ${size}px Arial, "Helvetica Neue", Helvetica, sans-serif`;
    ctx.font = font; const pad = size * 0.5;
    c.width = Math.ceil(ctx.measureText(text).width) + pad * 2; c.height = size + pad;
    ctx.font = font; ctx.textAlign = "center"; ctx.textBaseline = "middle";
    ctx.fillStyle = color; ctx.fillText(text, c.width/2, c.height/2);
    const tex = new THREE.CanvasTexture(c); tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = renderer.capabilities.getMaxAnisotropy();
    const h = w * c.height / c.width;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h),
      new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
    m.renderOrder = 8; return m;
  }

  // --- El candelabro que aparece y se enciende ---
  const o = CFG.objeto;
  const H = o.size / o.aspect;
  const mat = new THREE.MeshBasicMaterial({ map: tx(o.src), transparent: true, opacity: 0, depthTest: false, depthWrite: false });
  const mesh = new THREE.Mesh(new THREE.PlaneGeometry(o.size, H), mat);
  mesh.renderOrder = 6; content.add(mesh);
  // halo de glow detrás
  const glowMat = new THREE.SpriteMaterial({ map: makeGlow(), transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, opacity: 0 });
  const glow = new THREE.Sprite(glowMat);
  glow.scale.set(o.size * 1.7, H * 1.15, 1); glow.renderOrder = 5; content.add(glow);
  // sombra suave
  const shadow = new THREE.Mesh(new THREE.PlaneGeometry(o.size * 0.8, o.size * 0.8 * 0.28),
    new THREE.MeshBasicMaterial({ map: makeGlow(), color: 0x000000, transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
  shadow.renderOrder = 4; content.add(shadow);

  // --- Comparativas del cristal (sin / con UV) a los costados ---
  // Las comparativas (sinuv/conuv) YA traen su rótulo ("SIN LUZ UV"/"CON LUZ UV")
  // impreso → no se les agrega etiqueta extra.
  const comps = (CFG.comparativas || []).map((c) => {
    const m = new THREE.Mesh(new THREE.PlaneGeometry(c.size, c.size / c.aspect),
      new THREE.MeshBasicMaterial({ map: tx(c.src), transparent: true, opacity: 0, depthTest: false, depthWrite: false }));
    m.position.set(c.x, c.y, 0.02); m.renderOrder = 7; content.add(m);
    return { m };
  });

  // --- Título de la pieza (Arial, MAYÚSCULAS, color del equipo) arriba, fijo ---
  const L = CFG.label || { text: "REFLEXIÓN POR RADIACIÓN DE LUZ UV", color: "#eafff0" };
  const title = makeLabel((L.text || "").toUpperCase(), L.width || 1.15, L.color);
  title.position.set(0, (o.size / o.aspect) * 0.5 + 0.12, 0.05);   // arriba del candelabro
  content.add(title);

  const DARK = new THREE.Color(0.16, 0.20, 0.16);   // candelabro "apagado" (antes del UV)
  const setCaption = (t) => { $("caption").textContent = t || ""; };

  let visible = false, startT = 0;
  const clock = new THREE.Clock();
  const replay = () => { if (visible) startT = clock.getElapsedTime(); };
  const rb = $("btn-repeat"); if (rb) rb.addEventListener("click", (e) => { e.stopPropagation(); replay(); });
  window.addEventListener("pointerdown", (e) => { if (visible && e.target && e.target.closest && !e.target.closest("#panel,#topbar,#error")) replay(); });

  // Se muestra apenas terminan de bajar las imágenes (+ colchón fijo), sin
  // esperar a detectar nada.
  await waitAssets(manager);
  $("loading").style.display = "none";
  $("panel").classList.add("on");
  visible = true; startT = clock.getElapsedTime();

  renderer.setAnimationLoop(() => {
    const now = clock.getElapsedTime();
    const t = now - startT;
    const appear = visible ? step(0.0, 0.6, t) : 0;     // aparece
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

    setCaption(t < 0.9 ? "El candelabro aparece…"
      : uv < 0.99 ? "Encendiendo la luz UV…"
      : "Toca para repetir la fluorescencia");
    renderer.render(scene, camera);
  });
}
window.addEventListener("DOMContentLoaded", start);
