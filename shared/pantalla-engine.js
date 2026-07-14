/*  MOTOR DE PANTALLA — Museo Ayacucho / UTEC
 *
 *  Para piezas que NO se anclan a un target: el contenido va en espacio de
 *  pantalla sobre el video de la cámara. Es la respuesta al pedido de que
 *  "se presente siempre, independientemente del target".
 *
 *  Por qué existe aparte de ar-engine.js:
 *    - Sin anclaje no hay nada que rastrear, así que no hace falta MindAR ni
 *      three.js. Este motor no los descarga: ~1MB menos en datos móviles.
 *    - Sin target no hay .mind que compilar ni foto que elegir.
 *    - La cámara acá es DECORATIVA: si el visitante niega el permiso, la pieza
 *      igual funciona (fondo oscuro + audio). El motor anclado no puede.
 *
 *  Piezas previstas: wawapampay (baile + música + letra corriendo) y
 *  san francisco de borja (audio), si se confirma que la cara no sirve de target.
 *
 *  Todo sale de window.MUSEO_CONFIG con modo: "pantalla".
 */
import { crearAudio } from "./audio.js";

const CFG = window.MUSEO_CONFIG;
const $ = (id) => document.getElementById(id);

function fatal(msg) {
  const el = $("error");
  if (!el) return console.error(msg);
  el.textContent = "⚠ " + msg;
  el.style.display = "block";
  console.error(msg);
}

async function start() {
  if (!CFG) return fatal("No se cargó la configuración de la pieza.");

  $("titulo").textContent = CFG.titulo || "";
  if ($("subtitulo")) $("subtitulo").textContent = CFG.subtitulo || "";
  if ($("ficha-txt")) $("ficha-txt").textContent = CFG.ficha || "";

  // --- Fondo de cámara (decorativo: si falla, la pieza sigue) ---
  const vid = document.createElement("video");
  vid.id = "camara";
  vid.playsInline = true;   // acá SÍ aplica: es un <video>
  vid.muted = true;         // sin esto iOS bloquea el autoplay del video
  vid.autoplay = true;
  $("ar").appendChild(vid);

  try {
    vid.srcObject = await navigator.mediaDevices.getUserMedia({
      video: { facingMode: "environment" }, audio: false
    });
    await vid.play();
  } catch (e) {
    // La cámara es decorativa: se avisa pero NO se aborta.
    document.body.classList.add("sin-camara");
    console.warn("Sin cámara, sigue sin fondo:", e.message);
  }

  // --- Personajes animados (sprite sheet horizontal) ---
  //  personajes: [{ src, frames, fps, width, x, y }]
  //  El sprite sheet es una tira horizontal de `frames` cuadros del mismo ancho.
  (CFG.personajes || []).forEach((p, i) => {
    const d = document.createElement("div");
    d.className = "personaje";
    d.style.cssText = `
      --frames:${p.frames}; --dur:${(p.frames / (p.fps || 12)).toFixed(3)}s;
      background-image:url(${p.src});
      width:${p.width || "50vw"}; aspect-ratio:${p.aspect || "1"};
      left:${p.x || "50%"}; top:${p.y || "55%"};`;
    if (p.delay) d.style.animationDelay = p.delay;
    $("ar").appendChild(d);
  });

  // --- Audio ---
  const audio = crearAudio(CFG.audio, fatal);
  audio?.mostrar(); // sin target que encontrar: el botón está desde el inicio

  // --- Letra corriendo, sincronizada al audio (estilo historias de Instagram) ---
  //  letras: [{ t: 0.5, txt: "..." }, ...]  — `t` en segundos del audio.
  //  Cada línea se muestra desde su `t` hasta el `t` de la siguiente.
  let lineas = [], cont = null;
  if (audio && (CFG.letras || []).length) {
    cont = document.createElement("div");
    cont.id = "letras";
    const inner = document.createElement("div");
    inner.className = "tira";
    cont.appendChild(inner);
    $("ar").appendChild(cont);

    lineas = CFG.letras.map((l) => {
      const d = document.createElement("div");
      d.className = "linea";
      d.textContent = l.txt;
      inner.appendChild(d);
      return { t: l.t, el: d };
    });

    // rAF y no `timeupdate`: timeupdate dispara ~4 veces por segundo y la letra
    // saltaría a destiempo. rAF sigue al audio cuadro a cuadro.
    let ultima = -1;
    const seguir = () => {
      const t = audio.el.currentTime;
      let idx = -1;
      for (let i = 0; i < lineas.length; i++) if (t >= lineas[i].t) idx = i; else break;
      if (idx !== ultima) {
        ultima = idx;
        lineas.forEach((l, i) => {
          l.el.classList.toggle("activa", i === idx);
          l.el.classList.toggle("pasada", i < idx);
        });
        // Centra la línea activa desplazando la tira.
        if (idx >= 0) {
          const y = lineas[idx].el.offsetTop + lineas[idx].el.offsetHeight / 2;
          inner.style.transform = `translateY(${cont.clientHeight / 2 - y}px)`;
        }
      }
      requestAnimationFrame(seguir);
    };
    requestAnimationFrame(seguir);
    // La letra solo aparece cuando suena la música.
    audio.el.addEventListener("play", () => cont.classList.add("on"));
  }

  if ($("loading")) $("loading").style.display = "none";
  if ($("scan")) $("scan").style.display = "none"; // no hay nada que escanear
}

window.addEventListener("DOMContentLoaded", start);
