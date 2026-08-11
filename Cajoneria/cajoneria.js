/*  MOTOR — Cajonería (AR sin marcador).
 *  De fondo va la CÁMARA en vivo; encima flota la cajonera (PNG recortado) con
 *  un botón sobre cada cajón. Al tocar un cajón se abre un pop-up con animación
 *  suave que muestra la foto del contenido, con zoom por pellizco (PanZoom).
 *  Si no hay permiso de cámara, cae a un fondo oscuro (la pieza igual funciona).
 */
import { PanZoom } from "../shared/panzoom.js?v=1";

const CFG = window.MUSEO_CONFIG || {};
const $ = (id) => document.getElementById(id);

function build() {
  $("titulo").textContent = CFG.titulo || "Cajonería";
  $("subtitulo").textContent = CFG.subtitulo || "";

  const cab = $("cab");
  const bandH = CFG.bandH != null ? CFG.bandH : 0.118;

  // --- Un botón por cajón ---
  (CFG.cajones || []).forEach((c, i) => {
    const b = document.createElement("button");
    b.className = "cajon";
    b.style.top = ((c.cy - bandH / 2) * 100).toFixed(2) + "%";
    b.style.height = (bandH * 100).toFixed(2) + "%";
    b.innerHTML = `<span class="chip"><span class="dot"></span>${c.titulo || "Cajón " + (i + 1)}</span>`;
    b.addEventListener("click", () => openPop(c));
    cab.appendChild(b);
  });

  startCamera();   // AR: cámara de fondo (no bloquea; si falla queda el fondo oscuro)

  // --- Cajonera: mostrar recién cuando la imagen esté lista (evita parpadeo) ---
  const bg = new Image();
  const show = () => { cab.style.backgroundImage = `url("${CFG.fondo}")`; $("loading").style.display = "none"; };
  bg.onload = show; bg.onerror = show;
  bg.src = CFG.fondo;
}

/*  Cámara en vivo de fondo (AR sin marcador). Requiere HTTPS + permiso.
 *  No es bloqueante: si el visitante no da permiso o no hay cámara, se queda
 *  el fondo oscuro de respaldo y la cajonera se ve igual. */
async function startCamera() {
  const cam = $("cam");
  const est = document.querySelector("#loading .estado");
  if (!cam || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) return;
  try {
    if (est) est.textContent = "Esperando permiso de cámara…";
    const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: "environment" } } });
    cam.srcObject = stream;
    await cam.play().catch(() => {});
    document.body.classList.add("cam-on");
    if (est) est.textContent = "Cargando la cajonería…";
  } catch (e) {
    document.body.classList.remove("cam-on");   // sin cámara -> fondo oscuro
  }
}

/* ---------- Pop-up con zoom ---------- */
const pop = () => $("pop");
let closeT = 0;

function openPop(c) {
  clearTimeout(closeT);
  $("pop-title").innerHTML = c.titulo + (c.sub ? `<small>${c.sub}</small>` : "");
  const view = $("pop-view");
  view.innerHTML = "";

  // holder NUEVO en cada apertura => PanZoom no acumula listeners de aperturas previas
  const holder = document.createElement("div"); holder.className = "pz-holder";
  const stage = document.createElement("div"); stage.className = "pz-stage";
  const img = document.createElement("img");
  img.alt = c.titulo || "";
  stage.appendChild(img); holder.appendChild(stage); view.appendChild(holder);

  const hint = $("pop-hint"); hint.classList.remove("hide");
  const hideHint = () => hint.classList.add("hide");
  holder.addEventListener("pointerdown", hideHint, { once: true });

  img.onload = () => {
    stage.style.width = img.naturalWidth + "px";
    stage.style.height = img.naturalHeight + "px";
    const pz = PanZoom(holder, stage, img.naturalWidth, img.naturalHeight, { pad: 0.96 });
    pz.fitBox(null);
  };
  img.src = c.src;

  pop().classList.add("on");
  pop().setAttribute("aria-hidden", "false");
}

function closePop() {
  pop().classList.remove("on");
  pop().setAttribute("aria-hidden", "true");
  closeT = setTimeout(() => { $("pop-view").innerHTML = ""; }, 380);   // limpia tras la animación
}

/* ---------- Cierre del pop-up ---------- */
window.addEventListener("DOMContentLoaded", () => {
  build();
  $("pop-close").addEventListener("click", closePop);
  // tocar el fondo oscuro (fuera de la imagen/cabecera) cierra
  pop().addEventListener("pointerdown", (e) => { if (e.target === pop()) closePop(); });
  window.addEventListener("keydown", (e) => { if (e.key === "Escape" && pop().classList.contains("on")) closePop(); });
});
