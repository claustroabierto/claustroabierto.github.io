/*  CONFIG DE PIEZA — Salvilla de plata (RA7)
 *  Igual que escapulario: el composite del equipo (rayos X + tabla FRX) se usa
 *  como overlay transparente, posicionado para que el disco de rayos X caiga
 *  SOBRE la salvilla real y la tabla de composición quede al costado.
 *
 *  ⚠ NOMBRE PROVISIONAL: "Salvilla_de_plata" no está confirmado contra el Excel
 *  (TAREAS.xlsx, col "Nombres oficiales"). Confirmar y renombrar si difiere.
 *
 *  ⚠ TARGET: se usa la FOTO de la salvilla como image-target. Midió muy bien
 *  (detección 3793, a la altura de escapulario), pero es plata BRILLOSA: hay que
 *  probar en el museo si el reflejo la tumba.
 *  PLAN B si falla — marcador denso impreso (assets/marcador.jpg/.mind, foto de
 *  la pieza + banda "RA7", detección 3043): cambiar targetSrc→marcador.mind y
 *  targetPreview→marcador.jpg, y RE-ALINEAR el overlay con align.html (la foto de
 *  la pieza ocupa solo el cuadro superior del marcador, así que los offsets
 *  cambian). El diseño final del marcador para imprimir lo pule Jimena.
 *
 *  Geometría MEDIDA por bbox de las siluetas (no a ojo) y verificada con un
 *  render de la composición. Ajuste fino sobre la pieza real con align.html.
 *  Unidades: ancho de la salvilla = 1, centro (0,0), y hacia arriba.
 */
window.MUSEO_CONFIG = {
  id: "Salvilla_de_plata",
  titulo: "Salvilla de plata",
  subtitulo: "Rayos X sobre la pieza · composición elemental (FRX)",
  ficha: "Salvilla de plata repujada · Fluorescencia de rayos X: Plata 90% · Cobre 7% · Oro 1%",

  targetSrc: "assets/targets.mind",
  targetPreview: "assets/target.jpg",

  // Disco de rayos X (izq) + panel FRX (der) en un solo overlay transparente.
  // El disco cae sobre la pieza; el panel queda al costado derecho.
  // Valores medidos (disco=pieza), corregidos por el 4% de margen del target
  // (×0.926). offsetY POSITIVO: el disco está por debajo del centro del composite,
  // así que se sube el overlay para centrarlo sobre la pieza (verificado con
  // render; antes estaba en -0.074 y el disco quedaba bajo). Fino: align.html.
  overlay: {
    src: "assets/overlay.webp",
    width: 1.646,
    height: 1.145,
    offsetX: 0.270,
    offsetY: 0.074
  },

  // Sin microscopías: el análisis del equipo solo trae rayos X + tabla FRX.
  hotspots: []
};
