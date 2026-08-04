/*  CONFIG DE PIEZA — escapulario
 *  Igual que inmaculada: overlay transparente (el asset entregado) con la
 *  radiografía cayendo SOBRE la pieza y los globitos de microscopía al costado,
 *  tocables. Geometría calculada para que el rayos X calce sobre la obra.
 *
 *  `overlay` (título + boceto de rayos X) y `microReveals` (título +
 *  fotos/recuadros de microscopía) son recortes del MISMO "overlay.webp"
 *  original (con el mismo ancho/alto/offset, así calzan exactos) — se
 *  separaron porque antes compartían una sola capa y la microscopía se
 *  desvanecía junto con el rayos X al mover el slider "Revelar" (pedido del
 *  equipo: deben ser independientes). Recortes generados con PIL a partir de
 *  los bounding boxes de cada elemento (ver overlay.webp original).
 */
window.MUSEO_CONFIG = {
  id: "escapulario",
  titulo: "Escapulario",
  subtitulo: "Bordado con hilos metálicos, lana y seda - Siglo XVIII · imagen de Rayos X - composición química FRX",
  ficha: "Escapulario, siglo XVIII, bordado con hilos metálicos, lana y seda. Imagen de Rayos X. Identificación de elementos químicos.",

  targetSrc: "assets/targets.mind",
  targetPreview: "assets/target.jpg",

  // Rayos X (título + boceto) — el único que se controla con el slider
  // "Revelar". Misma geometría que el overlay.webp original.
  overlay: {
    src: "assets/reveal/rayosx.webp",
    width: 2.082,
    height: 2.076,
    offsetX: 0.566,   // corre el asset a la derecha -> rayos X sobre la pieza, globitos al costado
    offsetY: -0.135
  },

  // Microscopía (título + 3 fotos + sus recuadros) — aparece SOLA, uno por
  // uno, independiente del slider de arriba. Orden: título, foto1, recuadro1
  // (con el encabezado "Fluorescencia de Rayos X"), foto2, recuadro2, foto3,
  // recuadro3.
  microReveals: [
    "assets/reveal/microtitulo.webp",
    "assets/reveal/detalle1-foto.webp",
    "assets/reveal/detalle1-box.webp",
    "assets/reveal/detalle2-foto.webp",
    "assets/reveal/detalle2-box.webp",
    "assets/reveal/detalle3-foto.webp",
    "assets/reveal/detalle3-box.webp"
  ],
  intervaloReveal: 0.8,

  // Globitos de microscopía tocables (coords normalizadas sobre el asset).
  hotspots: [
    { x: 0.560, y: 0.290, color: "#8a4a36", img: "assets/micro-muestra1.webp", titulo: "Detalle 1", pigmento: "Fluorescencia de rayos X", formula: "Ag 48% - Cu 50% - Au 2%", nota: "Hilos de lana roja bordada con hilos metálicos de plata dorada" },
    { x: 0.568, y: 0.571, color: "#8b7b58", img: "assets/micro-muestra2.webp", titulo: "Detalle 2", pigmento: "Fluorescencia de rayos X", formula: "Ag 52% - Cu 43% - Au 5%", nota: "Hilos metálicos entorchados de plata dorada" },
    { x: 0.570, y: 0.849, color: "#9a8a5f", img: "assets/micro-muestra3.webp", titulo: "Detalle 3", pigmento: "Fluorescencia de rayos X", formula: "Ag 94% - Cu 1% - Au 5%", nota: "Hilos metálicos laminados de plata dorada" }
  ]
};
