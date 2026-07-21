/*  CONFIG DE PIEZA — Relicario (RA6) · revelado científico
 *  El relicario es un medallón de oro con reliquias (objeto de volumen y
 *  brilloso): no rastrea como imagen, así que el target es el MARCADOR RA6.
 *  El marcador denso (foto de la pieza + RA6) NO enganchó en el museo, así que se
 *  usa el CUBO RA6 (las letras "RA⁶", assets/ra6-target.jpg). ⚠ Mide débil
 *  (detección 651) — hay que IMPRIMIRLO GRANDE para que enganche a distancia de
 *  visita. El análisis flota anclado al RA6 (ya no cae sobre una foto).
 *
 *  Al escanear el marcador, el análisis del equipo aparece EN SECUENCIA sobre la
 *  pieza (igual que salvilla + Inmaculada):
 *    1) IMAGEN DE RAYOS X del relicario (rx.webp)
 *    2) 4 MICROSCOPÍAS con flechas (micro.webp) — tocables para ampliar (zoom)
 *  Todo son recortes del "RELICARIO con analisis.png" del equipo (su tipografía).
 *
 *  Geometría MEDIDA (rayos X del composite alineado sobre el relicario del
 *  marcador) y verificada con render. Ajuste fino sobre la pieza: align.html.
 *
 *  ⚠ Reemplaza el piloto anterior (objeto flotando, marcador-engine.js). Ahora
 *  usa el motor compartido (shared/ar-engine.js).
 *  ⚠ Los textos de cada microscopía son PROVISIONALES (descripción visual): el
 *  equipo debe dar los reales (como los pigmentos de Inmaculada). Mapeo círculo→
 *  microscopía raw también a confirmar con Jimena.
 */
window.MUSEO_CONFIG = {
  id: "relicario",
  titulo: "Relicario",
  subtitulo: "Rayos X y microscopía · escanea el marcador",
  ficha: "Relicario de oro con reliquias y esmaltes · Imagen de rayos X y microscopía de sus componentes",

  targetSrc: "assets/targets.mind?v=2",   // MARCADOR RA6 (letras), compilado de ra6-target.jpg
  targetPreview: "assets/ra6-target.jpg",

  // El análisis flota anclado al RA6 (cuadrado). El rayos X queda centrado sobre
  // el marcador y las microscopías se despliegan a la derecha. Elegido con render;
  // como el RA6 son solo letras, la posición es una preferencia (no hay nada que
  // "alinear") — moverla con align.html si el equipo la quiere más arriba/abajo.
  overlay: {
    src: "assets/rx.webp?v=3",            // lo que muestra align.html
    width: 1.55,
    height: 1.636,
    offsetX: 0.36,
    offsetY: 0.0
  },

  // Revelado en secuencia: primero el rayos X, luego CADA microscopía una por
  // una con su flecha (como Inmaculada). El título "MICROSCOPÍA" entra con la 1a.
  revelarSecuencial: true,
  intervaloReveal: 0.9,
  reveals: [
    "assets/rx.webp?v=3",                 // 1) IMAGEN DE RAYOS X (limpio, de I00002)
    "assets/micro1.webp?v=4",             // 2) columna esmaltada + flecha (+ título)
    "assets/micro2.webp?v=4",             // 3) cristales verdes + flecha
    "assets/micro3.webp?v=4",             // 4) concreción mineral + flecha
    "assets/micro4.webp?v=4"              // 5) figura azul + flecha
  ],
  hintSeq: "Aparece el rayos X y luego cada microscopía una por una · toca cada círculo ● para ampliarlo",

  // 4 microscopías tocables (coords normalizadas sobre el composite). El anillo
  // se oculta en modo secuencial (el círculo ya está dibujado); al tocar, la
  // tarjeta muestra la microscopía y se amplía a pantalla completa (card.img).
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
