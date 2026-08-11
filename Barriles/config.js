/*  CONFIG DE PIEZA — Barril de vino
 *  Contenido FIJO sobre la cámara en vivo (sin MindAR: el rastreo se colgaba al
 *  pedir la cámara en varios celulares). Al abrir aparece la infografía ARBARRIL
 *  sobre los barriles; un botón activa la EXPERIENCIA EXTRA: el video de los
 *  barriles reventando vino con FONDO VERDE eliminado por chroma key (shader).
 *
 *  El tamaño se autoescala a la pantalla (shared/no-target-ar.js). Ajuste fino con
 *  ?calib=1 en la URL. (targetSrc/targetPreview quedan sin uso; se conservan por si
 *  se vuelve al rastreo de imagen.)
 */
window.MUSEO_CONFIG = {
  id: "barriles",
  titulo: "Barril de vino",
  subtitulo: "Apunta a los barriles · toca el botón para ver la animación",

  targetSrc: "assets/targets.mind?v=1",   // marcador = foto de los barriles reales
  targetPreview: "assets/tgt-barril.jpg",

  fotoSrc: "assets/ARBARRIL.png?v=1",      // infografía que aparece al detectar
  videoSrc: "assets/barriles.mp4?v=1",     // animación (fondo verde -> chroma key)

  // Planos anclados al marcador (unidades de marcador; z+ = hacia el visitante).
  foto:  { w: 1.25, h: 1.25, x: 0, y: 0, z: 0.02 },
  video: { w: 1.30, h: 1.30, x: 0, y: 0, z: 0.18 },   // "en frente del barril"

  // Chroma key: color de fondo (RGB 0..255) + umbrales. Verde medido = 93,188,97.
  chroma: { color: [93, 188, 97], sim: 0.15, edge: 0.12, spill: 0.9 }
};
