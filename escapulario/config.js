/*  CONFIG DE PIEZA — escapulario
 *  "Rayos X sobre la pieza": se rastrea el escapulario y, al deslizar, su
 *  radiografía se superpone EXACTAMENTE encima (crossfade).
 *  Ajusta width/height/offset si la radiografía no calza perfecto sobre la obra.
 */
window.MUSEO_CONFIG = {
  id: "escapulario",
  titulo: "Escapulario bordado",
  subtitulo: "Radiografía sobre la pieza",
  ficha: "Bordado con hilos metálicos (plata, cobre, oro) · Imagen de rayos X",

  targetSrc: "assets/targets.mind",
  targetPreview: "assets/target.jpg",

  // Radiografía superpuesta sobre la pieza (pieza rastreada = ancho 1).
  overlay: {
    src: "assets/xray.png",
    width: 1.00,
    height: 1.378,   // = 1255/911 (aspecto del original)
    offsetX: 0.00,
    offsetY: 0.00
  },

  hotspots: []
};
