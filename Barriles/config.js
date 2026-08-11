/*  CONFIG DE PIEZA — Barril de vino (SIN marcador / manual)
 *
 *  Los barriles reales no rastrean bien como imagen (madera oscura, poco
 *  detalle, brillan), así que se saca el tracking: el contenido flota FIJO
 *  sobre la cámara en vivo (shared/no-target-ar.js) y las dos experiencias se
 *  activan MANUALMENTE con botones, sin depender de detectar nada.
 *
 *  Por defecto se ve la infografía ARBARRIL sobre la cámara. Dos botones:
 *   · "acercarte a la inscripción de Cáceres" -> pop-up con zoom (caceres.jpg).
 *   · "ver la animación de los barriles"       -> video con FONDO VERDE quitado
 *     por chroma key (shader), en el mismo lugar que la infografía.
 */
window.MUSEO_CONFIG = {
  id: "barriles",
  titulo: "Barril de Vino",
  // 2 líneas (el subtítulo usa white-space:pre-line, el \n se ve como salto):
  subtitulo: "Madera de roble y cerezo · Siglo XIX\nSe encontró la inscripción “Mariscal Cáceres” en una de las tapas",

  fotoSrc: "assets/ARBARRIL.png?v=1",   // infografía (contenido por defecto)
  videoSrc: "assets/barriles.mp4?v=1",  // animación (fondo verde -> chroma key)
  cacSrc:  "assets/caceres.jpg?v=1",    // inscripción "Mariscal Cáceres" (pop-up con zoom)

  fill: 0.98,   // cuánto de la pantalla ocupa el contenido (1 = todo el ancho)

  // Chroma key del video. color = fondo verde (RGB 0..255, medido = 93,188,97).
  //  similarity : qué tan cerca del verde se recorta (más alto = recorta más).
  //  smoothness : suavidad del borde.
  //  spill      : DESPILL — cuánto verde se quita del borde del objeto.
  //  blackClip  : CLEAN BLACK / black clip — recorta a 0 el alfa bajo.
  //  whiteClip  : CLEAN WHITE — solidifica el objeto (alfa alto -> 1).
  chroma: {
    color: [93, 188, 97],
    similarity: 0.40, smoothness: 0.10, spill: 1.1, blackClip: 0.22, whiteClip: 0.16
  }
};
