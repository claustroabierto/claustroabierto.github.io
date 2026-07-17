/*  MOTOR RA — dolorosa (parallax 2.5D + fuego vivo, específico de esta pieza)
 *  MindAR (image tracking) + three.js.
 *
 *  Qué lo hace distinto de la 1ª versión (que era demasiado pasiva):
 *   - Las velas NO cambian de brillo: arden con LLAMA PROCEDURAL (shader) que se
 *     estira, se inclina y parpadea de FORMA, con un glow cálido que late.
 *   - La Virgen SALE del cuadro: movimiento autónomo hacia el visitante (crece y
 *     se adelanta SIN compensar el tamaño), visible de frente sin mover el celu.
 *   - Parallax más agresivo: al mover el celular los cirios se despegan fuerte.
 *   - Luz cálida direccional: las capas se tiñen más cálido cerca de las llamas.
 *
 *  La separación base sí se compensa por (D0-z)/D0 para que el PRIMER instante
 *  (recién detectada) calce con el cuadro; el movimiento de "salida" de la
 *  Virgen va ENCIMA y sin compensar, para que se note que se adelanta.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp01 = (v) => Math.min(1, Math.max(0, v));
const step = (a, b, t) => { const x = clamp01((t - a) / (b - a)); return x * x * (3 - 2 * x); };
const lerp = (a, b, t) => a + (b - a) * t;

const LIT = new THREE.Color(1.00, 0.96, 0.90);   // luz de las velas (cálida)
const UNLIT = new THREE.Color(0.50, 0.55, 0.72); // hornacina en penumbra fría

// --- Shader de llama procedural (additive) -----------------------------------
// Dibuja una llama con forma: núcleo claro, cuerpo naranja, punta roja. Se
// mueve/estira con ruido temporal, así que titila de FORMA, no de brillo plano.
const FLAME_VERT = `
  varying vec2 vUv;
  void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }
`;
const FLAME_FRAG = `
  precision highp float;
  varying vec2 vUv;
  uniform float uTime;
  uniform float uSeed;
  uniform float uAlive;
  float hash(float n){ return fract(sin(n)*43758.5453123); }
  float vnoise(float x){ float i=floor(x), f=fract(x); return mix(hash(i),hash(i+1.0),f*f*(3.0-2.0*f)); }
  void main(){
    vec2 uv = vUv - vec2(0.5, 0.42);         // origen en la base de la llama
    float t = uTime*1.0 + uSeed*10.0;
    // bailoteo lateral, más arriba se inclina más
    float sway = (vnoise(t*2.7) - 0.5) * 0.42;
    uv.x -= sway * clamp(uv.y+0.15, 0.0, 1.0);
    // altura viva de la llama
    float h = 0.34 + vnoise(t*4.3 + 5.0) * 0.12;
    // ancho que se afina hacia la punta
    float w = 0.115 * (1.0 - clamp(uv.y/h, 0.0, 1.0)) * (1.0 - clamp(uv.y/h,0.0,1.0));
    float side = 1.0 - smoothstep(0.0, max(w, 0.001), abs(uv.x));
    float vmask = smoothstep(-0.12, -0.04, uv.y) * (1.0 - smoothstep(h*0.5, h, uv.y));
    float body = side * vmask;
    // color por altura dentro de la llama
    vec3 col = mix(vec3(1.0,0.98,0.75), vec3(1.0,0.55,0.12), smoothstep(-0.05,0.14,uv.y));
    col = mix(col, vec3(1.0,0.28,0.06), smoothstep(0.12,0.30,uv.y));
    float breathe = 0.82 + vnoise(t*7.0)*0.36;   // parpadeo de intensidad
    float a = body * breathe * uAlive;
    gl_FragColor = vec4(col * a, a);
  }
`;

function fatal(msg) {
  const el = $("error");
  el.textContent = "⚠ " + msg;
  el.style.display = "block";
  console.error(msg);
}

async function start() {
  if (!CFG || !CFG.layers) return fatal("No se cargó la configuración de la pieza.");

  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = CFG.subtitulo || "";
  $("ficha-txt").textContent = CFG.ficha || "";

  let mindar;
  try {
    mindar = new MindARThree({
      container: $("ar"),
      imageTargetSrc: CFG.targetSrc,
      uiScanning: "no",
      uiLoading: "no",
      filterMinCF: 0.0001,
      filterBeta: 0.001
    });
  } catch (e) {
    return fatal("No se pudo iniciar MindAR: " + e.message);
  }

  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));

  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();
  const H = 1 / CFG.aspect;
  const D0 = CFG.nominalDistance || 2.0;
  const SEP = CFG.separacion || [0.8, 3.0];

  // --- Capas de imagen (parallax) ---
  const layers = CFG.layers.map((cfg, i) => {
    const tex = loader.load(cfg.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({
      map: tex, transparent: true, opacity: 0,
      depthTest: false, depthWrite: false
    });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, H), mat);
    mesh.renderOrder = i;
    anchor.group.add(mesh);
    const layer = { key: cfg.key, mesh, mat, z: cfg.z || 0, salida: cfg.salida || 0, col: new THREE.Color() };

    // Textura alterna (velas apagadas = pintura original con su llama). Se
    // dibuja como mesh hijo → hereda el parallax; el loop cruza su opacidad.
    if (cfg.srcApagada) {
      const texAlt = loader.load(cfg.srcApagada);
      texAlt.colorSpace = THREE.SRGBColorSpace;
      const matAlt = new THREE.MeshBasicMaterial({ map: texAlt, transparent: true, opacity: 0, depthTest: false, depthWrite: false });
      const meshAlt = new THREE.Mesh(new THREE.PlaneGeometry(1, H), matAlt);
      meshAlt.renderOrder = i;
      mesh.add(meshAlt);          // hijo: hereda posición/escala/z de la capa
      layer.matAlt = matAlt;
    }
    return layer;
  });
  const velasLayer = layers.find((l) => l.key === "velas");
  const velasMesh = velasLayer ? velasLayer.mesh : anchor.group;

  // --- Llamas procedurales + glow (additive) ---
  // Se parentan al PLANO DE VELAS (no al anchor): así heredan su posición,
  // escala y profundidad durante toda la animación y quedan siempre pegadas a
  // la mecha, sin importar la separación. Coordenadas de config = espacio local
  // de ese plano (ancho 1, x∈[-0.5,0.5]).
  const flames = (CFG.flames || []).map((f, i) => {
    const uniforms = { uTime: { value: 0 }, uSeed: { value: i * 3.17 + 0.5 }, uAlive: { value: 0 } };
    const fmat = new THREE.ShaderMaterial({
      vertexShader: FLAME_VERT, fragmentShader: FLAME_FRAG, uniforms,
      transparent: true, blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false
    });
    const fmesh = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 0.22), fmat);
    fmesh.position.set(f.x, f.y + 0.03, 0.02);   // local; +0.03 → la base nace en la punta
    fmesh.renderOrder = 20;
    velasMesh.add(fmesh);

    // Glow: halo radial cálido que late (da la luz que "baña" alrededor).
    const gmat = new THREE.SpriteMaterial({
      map: makeGlow(), color: 0xffb45a, transparent: true,
      blending: THREE.AdditiveBlending, depthTest: false, depthWrite: false, opacity: 0.0
    });
    const glow = new THREE.Sprite(gmat);
    glow.position.set(f.x, f.y + 0.01, 0.015);
    glow.scale.set(0.24, 0.24, 1);
    glow.renderOrder = 19;
    velasMesh.add(glow);

    return { uniforms, fmat, gmat, glow };
  });

  // Textura de glow radial (generada, sin assets externos).
  function makeGlow() {
    const s = 64, cv = document.createElement("canvas"); cv.width = cv.height = s;
    const g = cv.getContext("2d");
    const grd = g.createRadialGradient(s/2, s/2, 0, s/2, s/2, s/2);
    grd.addColorStop(0, "rgba(255,255,255,1)");
    grd.addColorStop(0.35, "rgba(255,190,110,0.55)");
    grd.addColorStop(1, "rgba(255,150,60,0)");
    g.fillStyle = grd; g.fillRect(0, 0, s, s);
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; return tex;
  }

  // --- Estado ---
  let visible = false;
  let startT = 0;
  let lit = true;
  let litMix = 1;
  const clock = new THREE.Clock();

  const setCaption = (t) => { $("caption").textContent = t || ""; };
  const updateBoton = () => { $("btn-velas").textContent = lit ? "Apagar velas" : "Encender velas"; };
  const replay = () => { startT = clock.getElapsedTime(); };

  anchor.onTargetFound = () => {
    visible = true;
    $("scan").style.display = "none";
    $("panel").classList.add("on");
    replay();
  };
  anchor.onTargetLost = () => {
    visible = false;
    $("scan").style.display = "flex";
    $("panel").classList.remove("on");
  };

  // --- Interacción ---
  let lastTap = -1;
  const toggleVelas = () => { lit = !lit; updateBoton(); };
  $("btn-velas").addEventListener("click", (e) => { e.stopPropagation(); toggleVelas(); });
  $("btn-repeat").addEventListener("click", (e) => { e.stopPropagation(); if (visible) replay(); });
  function handleTap(targetEl) {
    if (!visible) return;
    if (targetEl && targetEl.closest && targetEl.closest("#panel, #topbar, #error")) return;
    const now = performance.now();
    if (now - lastTap < 350) return;
    lastTap = now;
    toggleVelas();
  }
  window.addEventListener("pointerdown", (e) => handleTap(e.target));
  window.addEventListener("touchstart", (e) => handleTap(e.target), { passive: true });
  updateBoton();

  // --- Arranque de cámara ---
  try {
    await mindar.start();
  } catch (e) {
    return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")");
  }
  const placa = $("loading").querySelector(".creditos");
  if (placa) $("scan").appendChild(placa.cloneNode(true));
  $("loading").style.display = "none";

  // --- Bucle de render ---
  renderer.setAnimationLoop(() => {
    const now = clock.getElapsedTime();
    const t = now - startT;

    litMix = lerp(litMix, lit ? 1 : 0, 0.06);
    const appear = step(0.0, 0.5, t);
    const sep = step(SEP[0], SEP[1], t);

    // Titileo global de la luz que baña las capas (color, no forma).
    const flick =
      0.06 * (Math.sin(now * 11.3) + 1) / 2 +
      0.04 * (Math.sin(now * 17.7 + 1.3) + 1) / 2 +
      0.03 * (Math.sin(now * 29.1 + 2.7) + 1) / 2;

    for (const L of layers) {
      // La capa con textura alterna (velas) hace crossfade: encendido muestra
      // la versión sin llama (+ procedural); apagado, la pintura original.
      if (L.matAlt) {
        L.mat.opacity = appear * litMix;            // sin llama (encendido)
        L.matAlt.opacity = appear * (1 - litMix);   // con llama pintada (apagado)
      } else {
        L.mat.opacity = appear;
      }
      // separación compensada (calza de frente) + salida autónoma SIN compensar
      const baseS = lerp(1, (D0 - L.z) / D0, sep);
      const out = L.salida ? (0.5 - 0.5 * Math.cos(now * 0.7)) * L.salida * sep : 0; // 0..salida, lento
      const s = baseS * (1 + out * 0.9);   // crece de verdad al adelantarse
      L.mesh.position.set(0, out * 0.10, L.z * sep + out);
      L.mesh.scale.set(s, s, 1);
      // luz cálida: más cálida cuanto más cerca de la base de las velas
      L.col.copy(UNLIT).lerp(LIT, litMix);
      const warm = 1 - flick * litMix * 0.6;
      L.mat.color.setRGB(L.col.r * warm, L.col.g * warm, L.col.b * warm);
      if (L.matAlt) L.matAlt.color.setRGB(L.col.r * warm, L.col.g * warm, L.col.b * warm);
    }

    // Llamas + glow: viven mientras las velas están encendidas.
    for (const f of flames) {
      f.uniforms.uTime.value = now;
      const alive = litMix * appear;
      f.uniforms.uAlive.value = alive;            // el shader multiplica todo por esto (fade real)
      f.glow.material.opacity = alive * (0.55 + flick * 3.0); // el halo late
      const gs = 0.24 * (0.92 + flick * 1.4);
      f.glow.scale.set(gs, gs, 1);
      f.fmat.visible = alive > 0.02;
      f.gmat.visible = alive > 0.02;
    }

    if (t < SEP[1]) setCaption("El cuadro cobra vida…");
    else setCaption(lit
      ? "La Virgen se adelanta · mueve el celular para ver la profundidad · toca para apagar las velas"
      : "Velas apagadas · toca para encenderlas");

    renderer.render(scene, camera);
  });
}

window.addEventListener("DOMContentLoaded", start);
