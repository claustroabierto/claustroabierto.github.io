/*  MOTOR PROVISIONAL — pieza cuya RA todavía no está hecha.
 *
 *  Sirve para RESERVAR LA URL: así el equipo puede mandar a imprimir el QR hoy,
 *  y cuando la RA esté lista se reemplaza este motor por el de la pieza sin
 *  tocar el QR ya pegado en la sala.
 *
 *  Hace lo mismo que las demás hasta donde puede: pantalla de carga
 *  institucional (con créditos y logos) y la cámara en vivo de fondo. Lo único
 *  que cambia es que, en vez del análisis, muestra un aviso de que la pieza
 *  está en preparación -- así el visitante que escanee hoy entiende qué pasa
 *  en vez de ver una pantalla vacía o un error.
 *
 *  La cámara NO bloquea: se pide en paralelo y el aviso aparece igual pasado
 *  el tiempo de portada. Si esperáramos la respuesta del permiso, un visitante
 *  que no lo conteste (o que lo rechace en un celular que no avisa) se queda
 *  con el "cargando" para siempre -- y acá no hay nada que dependa de la
 *  cámara todavía.
 *
 *  No usa MindAR ni three.js: no hay nada que rastrear ni que dibujar aún.
 */
const CFG = window.MUSEO_CONFIG || {};
const $ = (id) => document.getElementById(id);

function start() {
  $("titulo").textContent = CFG.titulo || "";
  // Mismo criterio que el resto: un dato por línea (#subtitulo usa pre-line).
  $("subtitulo").textContent = (CFG.subtitulo || "").replace(/\s*·\s*/g, "\n");

  // Cámara de fondo, en paralelo y sin bloquear nada.
  if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
    navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } })
      .then((stream) => {
        const video = document.createElement("video");
        video.autoplay = true; video.muted = true; video.playsInline = true;
        video.style.cssText = "position:fixed;inset:0;width:100%;height:100%;object-fit:cover;background:#000;";
        $("ar").appendChild(video);
        video.srcObject = stream;
        return video.play().catch(() => {});   // algunos navegadores exigen gesto
      })
      .catch((e) => { console.warn("Sin cámara (la pieza no la necesita todavía):", e.message); });
  }

  // Un respiro para que la portada (y los créditos) alcancen a leerse, y se
  // pasa al aviso pase lo que pase con el permiso de cámara.
  setTimeout(() => {
    $("loading").style.display = "none";
    $("proxima").classList.add("on");
  }, 2000);
}

window.addEventListener("DOMContentLoaded", start);
