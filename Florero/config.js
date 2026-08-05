/*  CONFIG DE PIEZA — Cerámica / Florero · revelado científico, SIN marcador
 *  Ya no depende de detectar ningún target (antes RA8, letras, medía débil):
 *  el análisis del equipo flota FIJO sobre la cámara en vivo, en secuencia:
 *    1) IMAGEN DE RAYOS X — perfil + frente (rx.webp), a la izquierda
 *    2) Cara a color + tabla FRX (frx.webp): Plomo 66% / Silicio 20% / Estaño 11%
 *  Calibrar tamaño/posición en pantalla con el celular real: abrir con
 *  `?calib=1` en la URL (ver shared/no-target-ar.js).
 *
 *  Sin microscopías (el análisis solo trae rayos X + FRX).
 */
window.MUSEO_CONFIG = {
  id: "florero",
  titulo: "Florero",
  subtitulo: "Cerámica vidriada - Siglo XVIII · Esmalte melado a base de plomo y sílice, junto a óxidos metálicos (amarillo de antimonio) · Rayos X y composición química con FRX",
  ficha: "Cerámica vidriada, Siglo XVIII · Esmalte melado a base de plomo y sílice, junto a óxidos metálicos (amarillo de antimonio) · Rayos X: Plomo 66% · Silicio 20% · Estaño 11%",

  // Geometría relativa entre las capas del infográfico (medida con align.html;
  // ya no es relativa a ningún marcador, solo entre sí).
  overlay: {
    src: "assets/frx.webp?v=2",
    width: 3.11, height: 1.238, offsetX: -0.393, offsetY: 0.058
  },

  // Las dos capas del mismo marco (1226x488), apiladas en orden de aparición:
  // primero los rayos X, luego la cara a color + tabla FRX.
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
