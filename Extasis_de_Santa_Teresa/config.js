/*  CONFIG DE PIEZA — Éxtasis de Santa Teresa (RA5)
 *  Todos los recortes salen del "santa teresa analisis.png" del equipo (no de las
 *  fotos crudas), así conservan su tipografía y sus tarjetas blancas.
 *
 *  Coreografía sobre la pintura real (image tracking):
 *   1. RAYOS X (con su rótulo) crece hasta calzar el cuadro.
 *   2. El REVERSO crece SIN texto dentro del ÓVALO blanco del rayos X.
 *   3. Se mueve a la IZQUIERDA y allí pasa a su versión CON texto (panel REVERSO).
 *   4. A la DERECHA: primero el título MICROSCOPÍA, luego las 3 microscopías una
 *      por una (Dorado arriba → Carnación → Azurita), cada una con su texto.
 *   5. Estático: tocar una microscopía la amplía (zoom). Sin aros; aviso abajo.
 *  + slider de transparencia (opacidad del rayos X) + botón Repetir.
 *
 *  Unidades: ancho de la pintura = 1, centro (0,0), y hacia arriba. Las posiciones
 *  se AJUSTAN A MANO con `posiciones.html` (no tantear).
 */
window.MUSEO_CONFIG = {
  id: "Extasis_de_Santa_Teresa",
  titulo: "Éxtasis de Santa Teresa",
  subtitulo: "Rayos X · el reverso de piedra · microscopía de pigmentos",
  ficha: "Óleo sobre placa de piedra · Rayos X revela el soporte; el reverso lleva la inscripción «S.ta Teresia con l'angelo»",

  targetSrc: "assets/targets.mind",
  targetPreview: "assets/target.jpg",

  // Valores AJUSTADOS A MANO por el equipo con `posiciones.html`.
  // 1) Rayos X con su rótulo (recorte del análisis).
  rx: { src: "assets/rx.webp", aspect: 0.736, width: 0.984, x: 0.007, y: 0.047 },

  // 2/3) Reverso: UN SOLO óvalo recortado (sin texto) que crece en el óvalo del
  // rayos X y luego se MUEVE a la izquierda — nunca cambia de tamaño, así la
  // transición no salta. El rótulo "REVERSO" es un elemento aparte que aparece
  // al llegar (igual que el título de microscopía).
  reversoOval:   { src: "assets/reverso-oval.webp",   aspect: 0.596, width: 0.46, x: -0.014, y: -0.003,
                   izqX: -0.892, izqY: 0.146 },
  reversoTitulo: { src: "assets/reverso-titulo.webp", aspect: 4.007, width: 0.34, x: -0.892, y: 0.60 },

  // 4) Columna de microscopía a la DERECHA (título + 3 tarjetas, en orden).
  // Las 3 comparten x (columna alineada) y el espaciado vertical es idéntico
  // (0.41 entre cada una): Dorado 0.41 · Carnación 0.00 · Azurita -0.41.
  microTitulo: { src: "assets/micro-titulo.webp", aspect: 6.255, width: 0.60, x: 0.85, y: 0.656 },
  intervaloReveal: 0.8,
  microscopias: [
    { src: "assets/micro-dorado.webp",    aspect: 1.920, width: 0.62, x: 0.92, y:  0.41, titulo: "Dorado",    pigmento: "Oro",     formula: "Au",             nota: "Detalles en pan de oro (Au); en el rayos X aparecen opacos." },
    { src: "assets/micro-carnacion.webp", aspect: 1.851, width: 0.62, x: 0.92, y:  0.00, titulo: "Carnación", pigmento: "Plomo",   formula: "Pb",             nota: "La carnación se construye con blanco de plomo (Pb)." },
    { src: "assets/micro-azurita.webp",   aspect: 1.817, width: 0.62, x: 0.92, y: -0.41, titulo: "Azurita",   pigmento: "Azurita", formula: "Cu₃(CO₃)₂(OH)₂", nota: "Azul mineral de azurita, carbonato básico de cobre." }
  ]
};
