/*  CONFIG DE PIEZA — Cerámica (RA8) · revelado científico
 *  Vasija-cara vidriada (objeto de volumen): no rastrea como imagen, así que el
 *  target es el MARCADOR RA8 (letras "RA⁸", assets/ra8-target.jpg). ⚠ Mide DÉBIL
 *  (letras solas, ~647 como RA7): IMPRIMIRLO GRANDE para que enganche a distancia.
 *
 *  Al escanear el RA8, el análisis del equipo flota anclado a él (infográfico
 *  horizontal), en secuencia:
 *    1) IMAGEN DE RAYOS X — perfil + frente (rx.webp), a la izquierda
 *    2) Cara a color + tabla FRX (frx.webp): Plomo 66% / Silicio 20% / Estaño 11%
 *
 *  El RA8 son solo letras (no hay nada que "alinear"): la cara del composite se
 *  centra sobre el marcador por PREFERENCIA (la pieza queda sobre la tarjeta, los
 *  rayos X a la izquierda y la tabla FRX a la derecha). Mover con align.html.
 *
 *  Antes se usó un marcador DENSO (foto de la cara + "RA8", detección 2020) y la
 *  cara caía exacta sobre él; se conserva marcador.jpg/.mind por si se vuelve.
 *  Sin microscopías (el análisis solo trae rayos X + FRX).
 */
window.MUSEO_CONFIG = {
  id: "ceramica",
  titulo: "Cerámica vidriada",
  subtitulo: "Rayos X y composición (FRX) · escanea el marcador",
  ficha: "Vasija con rostro, vidriado plúmbeo · Rayos X (perfil y frente) y fluorescencia: Plomo 66% · Silicio 20% · Estaño 11%",

  targetSrc: "assets/targets.mind?v=3",    // MARCADOR RA8 (letras, compilado)
  targetPreview: "assets/ra8-target.jpg",

  // ⚠ MODO CONGELAR (ceramica-engine.js): el infográfico es muy ancho para anclarlo
  // al RA8 (al acercarse a leer, el marcador sale de cuadro y se pierde el tracking).
  // Por eso MindAR solo DETECTA el RA8 y el motor CONGELA el infográfico en pantalla
  // (visor 2D con pellizco/arrastre). La geometría `overlay` de abajo YA NO se usa
  // (se conserva por si se vuelve al modo anclado + align.html).
  overlay: {
    src: "assets/frx.webp?v=2",
    width: 3.11, height: 1.238, offsetX: -0.393, offsetY: 0.058
  },

  // Las dos capas del mismo marco (1226x488) que apila el visor congelado, en orden
  // de aparición: primero los rayos X, luego la cara a color + tabla FRX.
  reveals: [
    "assets/rx.webp?v=2",                 // 1) rayos X perfil + frente + título
    "assets/frx.webp?v=2"                 // 2) cara a color + tabla FRX + flecha
  ],

  // Elementos tocables del infográfico: al tocar cada uno se abre un pop-up con esa
  // parte ampliada (explorable con los dedos). `bbox` = [x0,y0,x1,y1] normalizados
  // (0..1) sobre el marco 1226x488, medidos de las capas del PSD.
  items: [
    { label: "Rayos X — vista de perfil",  bbox: [0.006, 0.176, 0.245, 0.920] },
    { label: "Rayos X — vista frontal",    bbox: [0.276, 0.209, 0.485, 0.926] },
    { label: "Cara vidriada (color real)", bbox: [0.515, 0.176, 0.737, 0.920] },
    { label: "Composición elemental (FRX)", bbox: [0.762, 0.283, 0.945, 0.857] }
  ],

  hotspots: []
};
