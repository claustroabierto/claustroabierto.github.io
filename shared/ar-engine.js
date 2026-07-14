/*  MOTOR RA REUTILIZABLE — Museo Ayacucho / UTEC
 *  MindAR (image tracking) + three.js. Data-driven desde window.MUSEO_CONFIG.
 *  Cubre: rastreo de imagen, overlay de "características flotantes", slider de
 *  revelado (interactivo), hotspots táctiles y etiqueta de respaldo.
 *
 *  El mismo motor servirá para las demás piezas; cada pieza solo trae su config.js.
 */
import * as THREE from "three";
import { MindARThree } from "mindar-image-three";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

function fatal(msg) {
  const el = $("error");
  el.textContent = "⚠ " + msg;
  el.style.display = "block";
  console.error(msg);
}

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");

  // Rellenar textos de la ficha (capa de respaldo "letras RA")
  $("titulo").textContent = CFG.titulo;
  $("subtitulo").textContent = CFG.subtitulo || "";
  $("ficha-txt").textContent = CFG.ficha || "";

  let mindar;
  try {
    mindar = new MindARThree({
      container: $("ar"),
      imageTargetSrc: CFG.targetSrc,
      uiScanning: "no",   // usamos nuestra propia UI
      uiLoading: "no",
      filterMinCF: 0.0001, // suaviza el jitter
      filterBeta: 0.001
    });
  } catch (e) {
    return fatal("No se pudo iniciar MindAR: " + e.message);
  }

  const { renderer, scene, camera } = mindar;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); // nitidez en pantallas retina
  scene.add(new THREE.AmbientLight(0xffffff, 1.4));

  const anchor = mindar.addAnchor(0);
  const loader = new THREE.TextureLoader();

  // --- Capas de overlay (la principal + extras opcionales) ---
  //
  //  Sin `anim`, la capa se comporta como siempre: opacidad = revelado global.
  //  Con `anim`, la capa recorre su PROPIA ventana dentro del revelado y además
  //  se mueve/escala desde un origen hasta su posición final. Eso permite que
  //  cada análisis "salga de la obra original" y se acomode en su lugar,
  //  escalonando varias capas con distintos `delay`.
  //
  //  anim: {
  //    delay:     0.0,   // en unidades de revelado (0..1), no en segundos
  //    duration:  1.0,   // cuánto del revelado ocupa esta capa
  //    fromX/fromY: 0,   // origen; por defecto el centro de la obra original
  //    fromScale: 1      // 1 = ya a tamaño final; <1 = crece al salir
  //  }
  const layers = [];
  function addLayer(cfg, z) {
    const tex = loader.load(cfg.src);
    tex.colorSpace = THREE.SRGBColorSpace;
    const mat = new THREE.MeshBasicMaterial({ map: tex, transparent: true, opacity: 0 });
    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(cfg.width, cfg.height), mat);
    mesh.position.set(cfg.offsetX, cfg.offsetY, z);
    anchor.group.add(mesh);

    const a = cfg.anim;
    layers.push({
      mat, mesh, z,
      anim: a && {
        delay: a.delay ?? 0,
        duration: Math.max(1e-6, a.duration ?? 1), // evita división por cero
        fromX: a.fromX ?? 0,                       // 0,0 = centro de la obra original
        fromY: a.fromY ?? 0,
        fromScale: a.fromScale ?? 1,
        toX: cfg.offsetX,
        toY: cfg.offsetY
      }
    });
    return mesh;
  }
  const ov = CFG.overlay;
  addLayer(ov, 0.001);
  (CFG.extras || []).forEach((ex, i) => addLayer(ex, 0.002 + i * 0.001));

  // --- Hotspots (anillo visual + disco invisible de toque, más grande) ---
  const hotMeshes = [];  // aros visuales (pulsan)
  const hitMeshes = [];  // discos invisibles para el raycast (área de toque amplia)
  const ringGeo = new THREE.RingGeometry(0.05, 0.07, 40);
  const hitGeo = new THREE.CircleGeometry(0.11, 24);
  (CFG.hotspots || []).forEach((h, i) => {
    const lx = ov.offsetX + (h.x - 0.5) * ov.width;
    const ly = ov.offsetY + (0.5 - h.y) * ov.height; // y invertida
    const mat = new THREE.MeshBasicMaterial({ color: h.color || "#ffffff", transparent: true, opacity: 0.95, side: THREE.DoubleSide });
    const ring = new THREE.Mesh(ringGeo, mat);
    ring.position.set(lx, ly, 0.006);
    ring.userData = { idx: i, base: 1 };
    anchor.group.add(ring);
    hotMeshes.push(ring);

    const hit = new THREE.Mesh(hitGeo, new THREE.MeshBasicMaterial({ visible: false, side: THREE.DoubleSide }));
    hit.position.set(lx, ly, 0.007);
    hit.userData = { idx: i };
    anchor.group.add(hit);
    hitMeshes.push(hit);
  });

  // --- Audio (opcional: solo si la pieza lo declara en su config) ---
  //
  //  iOS NO deja arrancar audio sin un gesto del usuario, así que nunca hay
  //  autoplay: siempre hay un botón. El botón ES el gesto.
  //
  //  Por defecto el audio NO se pausa al perder el target: el tracking puede
  //  parpadear (peor aún en piezas con luz variable) y el audio tartamudearía.
  //  Una vez que arranca, sigue hasta que el usuario lo pare.
  //
  //  audio: { src, loop, boton: "Escuchar", pausarAlPerder: false }
  let audioEl = null, btnAudio = null;
  if (CFG.audio && CFG.audio.src) {
    audioEl = new Audio(CFG.audio.src);
    audioEl.loop = !!CFG.audio.loop;
    audioEl.preload = "auto";
    // OJO: no seteamos playsInline acá — es propiedad de <video>, en <audio> no
    // hace nada. Importaría solo si hubiera que migrar a un <video> oculto.
    // SIN RESOLVER: el interruptor de silencio de iOS puede dejar esto mudo.
    // Correr pruebas/audio.html en un iPhone real con el silencio puesto.

    btnAudio = document.createElement("button");
    btnAudio.id = "btn-audio";
    btnAudio.innerHTML = `<span class="ico">▶</span><span class="txt"></span>`;
    btnAudio.querySelector(".txt").textContent = CFG.audio.boton || "Escuchar";
    document.body.appendChild(btnAudio);

    const syncBtn = () => {
      const son = !audioEl.paused && !audioEl.ended;
      btnAudio.classList.toggle("playing", son);
      btnAudio.querySelector(".ico").textContent = son ? "❚❚" : "▶";
    };
    btnAudio.addEventListener("click", async (e) => {
      e.stopPropagation();
      try {
        if (audioEl.paused) await audioEl.play(); // el gesto que iOS exige
        else audioEl.pause();
      } catch (err) {
        fatal("No se pudo reproducir el audio. (" + err.message + ")");
      }
      syncBtn();
    });
    ["play", "pause", "ended"].forEach((ev) => audioEl.addEventListener(ev, syncBtn));
  }

  // --- Estado de detección + UI ---
  let visible = false;
  anchor.onTargetFound = () => {
    visible = true;
    $("scan").style.display = "none";
    $("panel").classList.add("on");
    if (btnAudio) btnAudio.classList.add("on");
  };
  anchor.onTargetLost = () => {
    visible = false;
    $("scan").style.display = "flex";
    $("panel").classList.remove("on");
    closeCard();
    if (audioEl) {
      if (CFG.audio.pausarAlPerder) audioEl.pause();
      // El botón sigue a la vista mientras suene, para poder pararlo.
      if (audioEl.paused) btnAudio.classList.remove("on");
    }
  };

  // Slider de revelado (interactivo): 0 = pintura limpia, 1 = análisis completo
  const slider = $("reveal");
  let reveal = 0;
  slider.addEventListener("input", () => { reveal = slider.value / 100; });
  $("btn-toggle").addEventListener("click", () => {
    reveal = reveal > 0.5 ? 0 : 1;
    slider.value = reveal * 100;
  });

  // --- Toque sobre hotspots (proyección a pantalla + distancia; robusto en iOS) ---
  const _wp = new THREE.Vector3();
  function handleTap(clientX, clientY, target) {
    if (!visible) return;
    // ignorar toques sobre la UI (panel, tarjeta, barra, botón de audio)
    if (target && target.closest && target.closest("#panel, #card, #topbar, #btn-audio")) return;
    let best = -1, bestD = Infinity;
    hitMeshes.forEach((m) => {
      m.getWorldPosition(_wp);
      _wp.project(camera);                 // -> NDC
      if (_wp.z > 1) return;               // detrás de cámara
      const sx = (_wp.x * 0.5 + 0.5) * window.innerWidth;
      const sy = (-_wp.y * 0.5 + 0.5) * window.innerHeight;
      const d = Math.hypot(sx - clientX, sy - clientY);
      if (d < bestD) { bestD = d; best = m.userData.idx; }
    });
    const thresh = Math.min(window.innerWidth, window.innerHeight) * 0.13;
    if (best >= 0 && bestD < thresh) openCard(best);
  }
  window.addEventListener("pointerdown", (e) => handleTap(e.clientX, e.clientY, e.target));
  window.addEventListener("touchstart", (e) => {
    const t = e.touches && e.touches[0];
    if (t) handleTap(t.clientX, t.clientY, e.target);
  }, { passive: true });

  function openCard(i) {
    const h = CFG.hotspots[i];
    $("card-color").style.background = h.color;
    $("card-titulo").textContent = h.titulo;
    $("card-pigmento").textContent = h.pigmento;
    $("card-formula").textContent = h.formula;
    $("card-nota").textContent = h.nota || "";
    $("card").classList.add("on");
    // resaltar el anillo elegido
    hotMeshes.forEach((m, k) => m.userData.base = k === i ? 1.6 : 1);
  }
  function closeCard() {
    $("card").classList.remove("on");
    hotMeshes.forEach((m) => m.userData.base = 1);
  }
  $("card-close").addEventListener("click", closeCard);

  // --- Arranque de cámara ---
  try {
    await mindar.start();
  } catch (e) {
    return fatal("No se pudo acceder a la cámara. Requiere HTTPS y permiso. (" + e.message + ")");
  }
  $("loading").style.display = "none";

  // --- Bucle de render ---
  const clock = new THREE.Clock();
  let revealSmooth = 0; // sigue al revelado con suavizado (histórico: lerp 0.15)
  renderer.setAnimationLoop(() => {
    const t = clock.getElapsedTime();
    revealSmooth += (reveal - revealSmooth) * 0.15;

    layers.forEach((L) => {
      if (!L.anim) {
        // Comportamiento histórico exacto: la capa sigue al revelado global.
        L.mat.opacity = revealSmooth;
        return;
      }
      // Progreso dentro de la ventana propia de la capa, con suavizado.
      const p = clamp((revealSmooth - L.anim.delay) / L.anim.duration, 0, 1);
      const e = p * p * (3 - 2 * p); // smoothstep: arranca y frena suave
      L.mat.opacity = e;
      L.mesh.position.set(
        L.anim.fromX + (L.anim.toX - L.anim.fromX) * e,
        L.anim.fromY + (L.anim.toY - L.anim.fromY) * e,
        L.z
      );
      const s = L.anim.fromScale + (1 - L.anim.fromScale) * e;
      L.mesh.scale.set(s, s, 1);
    });
    // pulso de los anillos, escalado por revelado
    hotMeshes.forEach((m) => {
      const pulse = 1 + Math.sin(t * 3 + m.userData.idx) * 0.12;
      const s = pulse * m.userData.base;
      m.scale.set(s, s, s);
      m.material.opacity = 0.15 + reveal * 0.85;
    });
    renderer.render(scene, camera);
  });
}

window.addEventListener("DOMContentLoaded", start);
