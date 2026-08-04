/*  CONFIG DE PIEZA — Relicario (RA6) · motor propio (relicario-engine.js)
 *  El target es el CUBO RA6 (letras "RA⁶", assets/ra6-target.jpg). ⚠ Mide débil
 *  (detección 651): IMPRIMIRLO GRANDE para que enganche a distancia de visita.
 *  El marcador denso (foto + RA6) NO enganchó en el museo -> se usa el RA6 pelado.
 *
 *  Experiencia (anclada al RA6, motor propio):
 *   1. Aparece el RELICARIO ORIGINAL (foto a color).
 *   2. Encima, la RADIOGRAFÍA con opacidad por SLIDER (0 = original, 1 = rayos X;
 *      arranca a 50% = crossfade). El usuario mezcla original ↔ rayos X.
 *   3. Las 4 MICROSCOPÍAS aparecen una por una, cada una con su flecha.
 *   4. Tocar una microscopía la amplía (zoom).
 *
 *  original.webp y rx.webp = RELICARIOORIGINAL/RX (registrados entre sí, fondo
 *  transparente) colocados donde estaba el rayos X del composite, así las flechas
 *  de las microscopías (micro1..4, recortes del composite del equipo) apuntan bien.
 *
 *  Textos de cada microscopía confirmados por el equipo (2026-08-03, "Modificaciones
 *  de Texto RA"). Posición sobre el RA6 = preferencia (mover con align.html).
 */
window.MUSEO_CONFIG = {
  id: "relicario",
  titulo: "Relicario",
  subtitulo: "imagen de Rayos X - Microscopía",
  ficha: "Relicario, Siglo XVIII, plata dorada, pigmentos, papel y plumas.",

  targetSrc: "assets/targets.mind?v=2",   // MARCADOR RA6 (letras)
  targetPreview: "assets/ra6-target.jpg",

  // Geometría de las capas (full-frame) sobre el RA6. Todo se posiciona igual.
  // Como el RA6 son solo letras, la posición es preferencia -> align.html.
  overlay: {
    src: "assets/original.webp?v=7",      // lo que muestra align.html
    width: 1.55,
    height: 1.636,
    offsetX: 0.36,
    offsetY: 0.0
  },

  original: "assets/original.webp?v=7",   // foto a color (base)
  rx:       "assets/rx.webp?v=7",         // radiografía (opacidad por slider)

  intervaloReveal: 0.9,
  reveals: [
    "assets/micro1.webp?v=7",             // columna esmaltada + flecha (+ título)
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
