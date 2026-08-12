/*  CONFIG DE PIEZA — Relicario, SIN marcador · motor propio (relicario-engine.js)
 *  Ya no depende de detectar ningún target (antes RA6, letras, medía débil):
 *
 *   1. Aparece el RELICARIO ORIGINAL (foto a color).
 *   2. Encima, la RADIOGRAFÍA con opacidad por SLIDER (0 = original, 1 = rayos X;
 *      arranca a 50% = crossfade). El usuario mezcla original ↔ rayos X.
 *   3. Las 4 MICROSCOPÍAS aparecen una por una, cada una con su flecha.
 *   4. Tocar una microscopía la amplía (zoom).
 *
 *  Todo flota FIJO sobre la cámara en vivo. Calibrar tamaño/posición con el
 *  celular real: abrir con `?calib=1` en la URL.
 *
 *  original.webp y rx.webp = RELICARIOORIGINAL/RX (registrados entre sí, fondo
 *  transparente) colocados donde estaba el rayos X del composite, así las flechas
 *  de las microscopías (micro1..4, recortes del composite del equipo) apuntan bien.
 *
 *  Textos de cada microscopía confirmados por el equipo (2026-08-03, "Modificaciones
 *  de Texto RA"). Geometría de las capas (full-frame) medida/movida con align.html.
 */
window.MUSEO_CONFIG = {
  id: "relicario",
  titulo: "Relicario",
  subtitulo: "plata dorada - Siglo XVIII · imagen de Rayos X - Microscopía",
  ficha: "Relicario, Siglo XVIII, plata dorada, pigmentos, papel y plumas.",

  overlay: {
    src: "assets/original.webp?v=7",      // lo que muestra align.html
    width: 1.55,
    height: 1.636,
    offsetX: 0.36,
    offsetY: 0.0
  },

  original: "assets/original.webp?v=7",   // foto a color (base)
  rx:       "assets/rx-sin-rotulo.webp?v=1", // radiografía (opacidad por slider), ya sin el rótulo al pie

  // Los rótulos "IMAGEN DE RAYOS X" y "MICROSCOPÍA · 10x de aumento" venían
  // horneados AL PIE de rx.webp / micro1.webp, justo donde el panel de botones
  // los tapa. Se extrajeron a assets propios (bbox medido por píxel) para poder
  // colocarlos ARRIBA, cada uno encima de su grupo. Coordenadas normalizadas
  // sobre el marco 1754x1851: w/h = tamaño, x/y = centro.
  rotulos: [
    { src: "assets/rotulo-rx.webp?v=1",     w: 0.492, h: 0.042, x: 0.272, y: 0.030 },
    { src: "assets/rotulo-micro1.webp?v=1", w: 0.344, h: 0.072, x: 0.760, y: 0.045 }
  ],

  intervaloReveal: 0.9,
  reveals: [
    "assets/micro1-sin-rotulo.webp?v=1",  // columna esmaltada + flecha (el título salió a `rotulos`)
    "assets/micro2.webp?v=7",             // cristales verdes + flecha
    "assets/micro3.webp?v=7",             // concreción mineral + flecha
    "assets/micro4.webp?v=8"              // figura azul + flecha
  ],

  // 4 microscopías tocables (coords normalizadas sobre el marco). Textos y nombres
  // finales confirmados por el equipo (pg3-4 de "Modificaciones de Texto RA"):
  // reemplazan los provisionales (Columna esmaltada/Cristales verdes/Concreción
  // mineral/Figura azul -> Columna policromada/Plumas/Fragmento de hueso/Azul de añil).
  // x alineado en 2 columnas (1&4 = 0.628 · 2&3 = 0.824) y size uniformado (0.08),
  // a partir de lo que pasaron con el editor de círculos del preview.
  hotspots: [
    { x: 0.628, y: 0.15, size: 0.08, color: "#c8a24b", img: "assets/zoom1.webp",
      titulo: "Columna policromada", pigmento: "Microscopía a 10× de aumento", formula: "",
      nota: "Detalle de columna policromada." },
    { x: 0.824, y: 0.338, size: 0.08, color: "#7bd150", img: "assets/zoom2.webp",
      titulo: "Plumas", pigmento: "Microscopía a 10× de aumento", formula: "",
      nota: "Detalle de plumas de colibrí al interior del relicario." },
    { x: 0.824, y: 0.606, size: 0.08, color: "#d9d2c4", img: "assets/zoom3.webp",
      titulo: "Fragmento de hueso", pigmento: "Microscopía a 10× de aumento", formula: "",
      nota: "Detalle de una de las reliquias (posiblemente San Lorenzo)." },
    { x: 0.628, y: 0.785, size: 0.08, color: "#4a7bd1", img: "assets/zoom4.webp",
      titulo: "Azul de añil", pigmento: "Microscopía a 10× de aumento", formula: "",
      nota: "Detalle de hilos de oro y perlas, junto a restos de pigmento azul añil o índigo de origen vegetal." }
  ]
};
