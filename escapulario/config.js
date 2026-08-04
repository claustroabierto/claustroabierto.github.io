/*  CONFIG DE PIEZA — escapulario
 *  Igual que inmaculada: overlay transparente (el asset entregado) con la
 *  radiografía cayendo SOBRE la pieza y los globitos de microscopía al costado,
 *  tocables. Geometría calculada para que el rayos X calce sobre la obra.
 */
window.MUSEO_CONFIG = {
  id: "escapulario",
  titulo: "Escapulario bordado",
  subtitulo: "Rayos X sobre la pieza · composición química",
  ficha: "Bordado con hilos metálicos · Imagen de rayos X y fluorescencia (FRX)",

  targetSrc: "assets/targets.mind",
  targetPreview: "assets/target.jpg",

  // El asset completo (rayos X izq + microscopía der). Posicionado para que el
  // rayos X quede sobre la pieza rastreada (pieza = ancho 1).
  overlay: {
    src: "assets/overlay.webp",
    width: 2.082,
    height: 2.076,
    offsetX: 0.566,   // corre el asset a la derecha -> rayos X sobre la pieza, globitos al costado
    offsetY: -0.135
  },

  // Globitos de microscopía tocables (coords normalizadas sobre el asset).
  hotspots: [
    { x: 0.560, y: 0.290, color: "#8a4a36", img: "assets/micro-muestra1.webp", titulo: "Muestra 1 · zona roja",  pigmento: "Fluorescencia de rayos X", formula: "Ag 48% · Cu 50% · Au 2%",  nota: "Hilo metálico sobre tejido rojo: aleación de plata y cobre con dorado escaso." },
    { x: 0.568, y: 0.571, color: "#8b7b58", img: "assets/micro-muestra2.webp", titulo: "Muestra 2 · entorchado", pigmento: "Fluorescencia de rayos X", formula: "Ag 52% · Cu 43% · Au 5%",  nota: "Hilo entorchado: plata y cobre casi a partes iguales, con algo de oro." },
    { x: 0.570, y: 0.849, color: "#9a8a5f", img: "assets/micro-muestra3.webp", titulo: "Muestra 3 · dorado",     pigmento: "Fluorescencia de rayos X", formula: "Ag 94% · Cu 1% · Au 5%",   nota: "Hilo dorado de alta pureza de plata: laminilla metálica muy fina." }
  ]
};
