/*  AUDIO COMPARTIDO — Museo Ayacucho / UTEC
 *
 *  Lo usan los dos motores (ar-engine.js anclado y pantalla-engine.js).
 *  Crea el <audio> y su botón; ningún index.html de pieza se toca.
 *
 *  iOS NO deja arrancar audio sin un gesto del usuario, así que nunca hay
 *  autoplay: siempre hay botón. El botón ES el gesto.
 *
 *  ⚠ SIN RESOLVER: el interruptor de silencio de iOS puede dejar esto mudo.
 *  Correr pruebas/audio.html en un iPhone real con el silencio puesto. Si el
 *  veredicto pide <video>, el cambio es acá y les sirve a los dos motores.
 *
 *  config:  audio: { src, loop, boton: "Escuchar", pausarAlPerder: false }
 */

export function crearAudio(cfg, onError) {
  if (!cfg || !cfg.src) return null;

  const el = new Audio(cfg.src);
  el.loop = !!cfg.loop;
  el.preload = "auto";
  // OJO: no seteamos playsInline — es propiedad de <video>; en <audio> no hace
  // nada (verificado: devuelve undefined). Importaría solo si hubiera que
  // migrar a un <video> oculto por lo del silencio de iOS.

  const btn = document.createElement("button");
  btn.id = "btn-audio";
  btn.innerHTML = `<span class="ico">▶</span><span class="txt"></span>`;
  btn.querySelector(".txt").textContent = cfg.boton || "Escuchar";
  document.body.appendChild(btn);

  const sync = () => {
    const son = !el.paused && !el.ended;
    btn.classList.toggle("playing", son);
    btn.querySelector(".ico").textContent = son ? "❚❚" : "▶";
  };
  btn.addEventListener("click", async (e) => {
    e.stopPropagation();
    try {
      if (el.paused) await el.play(); // el gesto que iOS exige
      else el.pause();
    } catch (err) {
      onError?.("No se pudo reproducir el audio. (" + err.message + ")");
    }
    sync();
  });
  ["play", "pause", "ended"].forEach((ev) => el.addEventListener(ev, sync));

  return {
    el,
    btn,
    mostrar: () => btn.classList.add("on"),
    ocultar: () => btn.classList.remove("on"),
    // Por defecto el audio NO se corta al perder el target: el tracking
    // parpadea (peor con luz variable) y el audio tartamudearía. El botón
    // sigue a la vista mientras suene, para poder pararlo.
    alPerderTarget: () => {
      if (cfg.pausarAlPerder) el.pause();
      if (el.paused) btn.classList.remove("on");
    }
  };
}
