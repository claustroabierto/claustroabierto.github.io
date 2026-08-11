/*  CONFIG DE PIEZA — Barril de vino (image target)
 *  Al apuntar la cámara a los barriles reales (marcador = TargetBarril), aparece la
 *  infografía ARBARRIL anclada, encajada con el barril. Un botón activa la
 *  EXPERIENCIA EXTRA: el video de los barriles reventando vino con FONDO VERDE
 *  eliminado por chroma key en tiempo real (shader), en frente del barril.
 *
 *  Geometría en unidades de marcador (el target es 1x1; z+ = hacia el visitante).
 *  Ajuste fino de posición/tamaño: align.html.
 */
window.MUSEO_CONFIG = {
  id: "barriles",
  titulo: "Barril de Vino",
  // 2 líneas (el subtítulo usa white-space:pre-line, el \n se ve como salto):
  subtitulo: "Madera de roble y cerezo · Siglo XIX\nSe encontró la inscripción “Mariscal Cáceres” en una de las tapas",

  targetSrc: "assets/targets.mind?v=1",   // marcador = foto de los barriles reales
  targetPreview: "assets/tgt-barril.jpg",

  fotoSrc: "assets/ARBARRIL.png?v=1",      // infografía que aparece al detectar
  videoSrc: "assets/barriles.mp4?v=1",     // animación (fondo verde -> chroma key)
  cacSrc:  "assets/caceres.jpg?v=1",       // inscripción "Mariscal Cáceres" (pop-up con zoom)

  // Planos anclados al marcador (unidades de marcador). Ajustar con align.html.
  foto:  { w: 1.30, h: 1.30, x: 0, y: 0, z: 0.02 },
  video: { w: 1.30, h: 1.30, x: 0, y: 0, z: 0.18 },   // "en frente del barril"

  // Chroma key del video. color = fondo verde (RGB 0..255, medido = 93,188,97).
  //  similarity : qué tan cerca del verde se recorta (más alto = recorta más).
  //  smoothness : suavidad del borde.
  //  spill      : DESPILL — cuánto verde se quita del borde del objeto.
  //  blackClip  : CLEAN BLACK / black clip — recorta a 0 el alfa bajo (mata verde residual).
  //  whiteClip  : CLEAN WHITE — solidifica el objeto (alfa alto -> 1).
  chroma: {
    color: [93, 188, 97],
    similarity: 0.40, smoothness: 0.10, spill: 1.1, blackClip: 0.22, whiteClip: 0.16
  }
};
