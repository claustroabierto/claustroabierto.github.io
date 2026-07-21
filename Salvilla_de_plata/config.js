/*  CONFIG DE PIEZA — Salvilla de plata (RA7)
 *  El target es el CUBO RA7 (letras "RA⁷", assets/ra7-target.jpg). ⚠ Mide débil
 *  (detección 647): IMPRIMIRLO GRANDE para que enganche a distancia de visita.
 *  El análisis del equipo (rayos X de la salvilla + tabla FRX) flota anclado al
 *  RA7, en secuencia: primero el rayos X con su nombre, luego la composición.
 *
 *  ⚠ NOMBRE PROVISIONAL: "Salvilla_de_plata" no está confirmado contra el Excel
 *  (TAREAS.xlsx, col "Nombres oficiales"). Confirmar y renombrar si difiere.
 *
 *  Antes se usaba la foto de la salvilla como image-target (midió 3793) y el
 *  disco caía sobre la pieza real; se conserva target.jpg + marcador.jpg/.mind
 *  por si se vuelve. La posición del análisis sobre el RA7 es preferencia (no hay
 *  nada que "alinear" en las letras): moverla con align.html.
 */
window.MUSEO_CONFIG = {
  id: "Salvilla_de_plata",
  titulo: "Salvilla de plata",
  subtitulo: "Rayos X y composición (FRX) · escanea el marcador RA",
  ficha: "Salvilla de plata repujada · Fluorescencia de rayos X: Plata 90% · Cobre 7% · Oro 1%",

  targetSrc: "assets/targets.mind?v=2",    // MARCADOR RA7 (letras)
  targetPreview: "assets/ra7-target.jpg",

  // El análisis (rayos X + FRX) anclado al RA7: el disco centrado sobre el
  // marcador y la tabla FRX al costado. Elegido con render (opción B).
  // `overlay` define la geometría (y es lo que muestra align.html).
  overlay: {
    src: "assets/rx.webp",
    width: 1.70,
    height: 1.183,
    offsetX: 0.351,
    offsetY: -0.024
  },

  revelarSecuencial: true,
  intervaloReveal: 0.9,        // pausa entre el rayos X y el panel FRX
  reveals: [
    "assets/rx.webp",          // 1) rayos X + "IMAGEN DE RAYOS X"
    "assets/frx.webp?v=2"      // 2) panel FRX (Ag/Cu/Au) + flecha completa
  ],
  hintSeq: "Primero aparece el rayos X, luego su composición (FRX) · toca Repetir para verlo de nuevo",

  // Sin microscopías: el análisis del equipo solo trae rayos X + tabla FRX.
  hotspots: []
};
