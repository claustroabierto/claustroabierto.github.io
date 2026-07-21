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
 *  ⚠ Textos de cada microscopía PROVISIONALES (descripción visual): el equipo debe
 *  dar los reales. Posición sobre el RA6 = preferencia (mover con align.html).
 */
window.MUSEO_CONFIG = {
  id: "relicario",
  titulo: "Relicario",
  subtitulo: "Original, rayos X y microscopía · escanea el marcador RA",
  ficha: "Relicario de oro con reliquias y esmaltes · Desliza para ver el rayos X; toca cada microscopía",

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
    "assets/micro4.webp?v=7"              // figura azul + flecha
  ],

  // 4 microscopías tocables (coords normalizadas sobre el marco) — solo para el zoom.
  hotspots: [
    { x: 0.63, y: 0.15, color: "#c8a24b", img: "assets/zoom1.webp",
      titulo: "Columna esmaltada", pigmento: "Microscopía", formula: "",
      nota: "Esmalte azul y dorado sobre la filigrana. (texto provisional — confirmar con el equipo)" },
    { x: 0.82, y: 0.32, color: "#7bd150", img: "assets/zoom2.webp",
      titulo: "Cristales verdes", pigmento: "Microscopía", formula: "",
      nota: "Formaciones cristalinas verdes. (texto provisional — confirmar con el equipo)" },
    { x: 0.82, y: 0.58, color: "#d9d2c4", img: "assets/zoom3.webp",
      titulo: "Concreción mineral", pigmento: "Microscopía", formula: "",
      nota: "Concreción porosa blanquecina. (texto provisional — confirmar con el equipo)" },
    { x: 0.60, y: 0.78, color: "#4a7bd1", img: "assets/zoom4.webp",
      titulo: "Figura azul", pigmento: "Microscopía", formula: "",
      nota: "Esmalte azul con hilos de oro y perlas. (texto provisional — confirmar con el equipo)" }
  ]
};
