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
 *   5. Estático: cada microscopía trae su aro de color (como escapulario); tocarla
 *      la amplía (zoom).
 *  + slider de transparencia (opacidad del rayos X) + botón Repetir.
 *
 *  Unidades: ancho de la pintura = 1, centro (0,0), y hacia arriba. Las posiciones
 *  se AJUSTAN A MANO con `posiciones.html` (no tantear).
 */
window.MUSEO_CONFIG = {
  id: "Extasis_de_Santa_Teresa",
  titulo: "Éxtasis de Santa Teresa",
  subtitulo: "Pintura sobre mármol - Siglo XVII · imagen de Rayos X - Microscopía y composición química FRX",
  ficha: "Éxtasis de Santa Teresa, óleo sobre mármol, inscripción posterior, Rayos X, microscopía.",

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
  // Leyenda de la inscripción, debajo del óvalo (mismo font/color que REVERSO:
  // Arial Bold #b4b4b4, regenerada con el mismo criterio — ver posiciones.html
  // si hace falta reajustar). Aparece junto con "REVERSO".
  reversoSubtitulo: { src: "assets/reverso-subtitulo.webp", aspect: 7.791, width: 0.46, x: -0.892, y: -0.31 },

  // 4) Columna de microscopía a la DERECHA (título + 3 tarjetas, en orden).
  // Las 3 comparten x (columna alineada) y el espaciado vertical es idéntico
  // (0.41 entre cada una): Dorado 0.41 · Carnación 0.00 · Azurita -0.41.
  microTitulo: { src: "assets/micro-titulo.webp", aspect: 6.255, width: 0.60, x: 0.85, y: 0.656 },
  intervaloReveal: 0.8,
  // `color` = color del círculo interactivo sobre la microscopía y del punto en
  // la tarjeta (pedido del equipo: Carnación crema/naranja suave, Azurita azul
  // oscuro; Dorado se queda dorado).
  // Nombres finales del PDF (por ubicación en la pintura, no por color):
  // Dorado->Aureola, Carnación->Rostro, Azurita->Alas.
  // x alineado en columna (0.999, promedio de la última pasada del equipo con
  // el editor — quedó un pelo a la derecha del 0.90 anterior) y size
  // uniformado (0.07). y con espaciado PAREJO (0.41 entre cada una, igual
  // que el original) centrado en 0.005 — las coordenadas sueltas del editor
  // vienen siempre con distancias ligeramente distintas por el arrastre a
  // mano, así que se normalizan al espaciado fijo en vez de copiarlas tal cual.
  microscopias: [
    // `src` = tarjeta del análisis (con su texto) que se ve en el AR.
    // `zoom` = la foto INDIVIDUAL original (sin texto), que es la que se amplía al tocar.
    { src: "assets/micro-dorado.webp",    zoom: "assets/zoom-dorado.webp",    aspect: 1.920, width: 0.62, x: 0.999, y:  0.415, size: 0.07, titulo: "Aureola", pigmento: "Oro",     formula: "Au",             nota: "Aplicado a pincel.", color: "#c9a24b" },
    { src: "assets/micro-carnacion.webp", zoom: "assets/zoom-carnacion.webp", aspect: 1.851, width: 0.62, x: 0.999, y:  0.005, size: 0.07, titulo: "Rostro",  pigmento: "Pigmento a base de Plomo Pb",  formula: "2PbCO₃ · Pb(OH)₂", nota: "Blanco de plomo o albayalde.", color: "#eab676" },
    { src: "assets/micro-azurita.webp",   zoom: "assets/zoom-azurita.webp",   aspect: 1.817, width: 0.62, x: 0.999, y: -0.405, size: 0.07, titulo: "Alas",    pigmento: "Pigmento azul a base de Cobre Cu", formula: "Cu₃(CO₃)₂(OH)₂", nota: "Azurita.", color: "#26456e" }
  ]
};
