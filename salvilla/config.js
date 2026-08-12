/*  CONFIG DE PIEZA — Salvilla de plata, SIN marcador
 *  Ya no depende de detectar ningún target (antes RA7, letras, medía débil e
 *  imprimió más chico de lo previsto). El análisis del equipo (rayos X de la
 *  salvilla + tabla FRX) flota FIJO sobre la cámara en vivo, en secuencia:
 *  primero el rayos X con su nombre, luego la composición. Calibrar
 *  tamaño/posición con el celular real: abrir con `?calib=1` en la URL.
 *
 *  ⚠ NOMBRE PROVISIONAL: "Salvilla_de_plata" no está confirmado contra el Excel
 *  (TAREAS.xlsx, col "Nombres oficiales"). Confirmar y renombrar si difiere.
 */
window.MUSEO_CONFIG = {
  id: "salvilla",
  titulo: "Salvilla de plata",
  subtitulo: "plata repujada - Siglo XVII · imagen de Rayos X - composición química FRX",
  ficha: "Salvilla, Siglo XVII, plata repujada · Fluorescencia de rayos X (FRX): Plata 90% · Cobre 7% · Oro 1%",

  // Geometría relativa entre las capas del análisis (medida con align.html;
  // ya no es relativa a ningún marcador, solo entre sí).
  overlay: {
    src: "assets/original.webp?v=3",     // lo que muestra align.html
    width: 1.70,
    height: 1.183,
    offsetX: 0.351,
    offsetY: -0.024
  },

  // Motor propio (salvilla-engine.js): la salvilla a color de base, el rayos X
  // encima con opacidad por slider (crossfade), y luego la tabla FRX.
  original: "assets/original.webp?v=3",  // salvilla a color (registrada con el disco de rayos X)
  rx:       "assets/rx-ar.png",          // rayos X (opacidad por slider) + "IMAGEN DE RAYOS X" en NEGRO
  // Versión del rayos X para el pop-up de zoom (fondo oscuro del pop-up): el
  // título ahí va en gris claro, no negro, porque negro sobre negro se pierde.
  // Es la MISMA imagen, solo el rótulo cambia de color — por eso es un archivo
  // aparte en vez de una sola capa reusada.
  rxZoom:   "assets/rx.webp?v=3",

  intervaloReveal: 0.9,
  reveals: [
    "assets/frx.webp?v=4"                // tabla FRX (Ag/Cu/Au) + flecha, aparece al final
  ],

  // Marco común de las tres capas, en píxeles (para el pop-up de detalle).
  fichaW: 2361, fichaH: 1643,

  // Zonas tocables: al tocar cada una se abre un pop-up con esa parte ampliada
  // y explorable con los dedos (igual que el Florero), PERO manteniendo el
  // sobrepuesto: dentro del pop-up sigue la barrita original↔rayos X.
  // `bbox` = [x0,y0,x1,y1] normalizados sobre el marco 2361x1643, medidos del
  // contenido real de rx.webp / frx.webp (no a ojo). El bbox del FRX deja fuera
  // la flecha a propósito: si se incluyera, el encuadre se iría a la mitad
  // vacía del marco y la tabla quedaría chica.
  // `capas` = qué se dibuja en ese detalle (por defecto las tres). En el rayos X
  // sobra la flecha que apunta a la tabla; en la tabla sobra la pieza.
  // El pop-up de la tabla usa el MISMO fondo oscuro que el de la pieza (pedido
  // explícito del museo: no una plancha clara aparte). El propio frx.webp ya
  // trae sus celdas con fondo opaco (gris/blanco) detrás del texto negro, así
  // que se lee igual sobre el fondo oscuro.
  items: [
    { label: "Imagen de rayos X",           bbox: [0.030, 0.080, 0.622, 0.975], capas: ["orig", "rx"] },
    { label: "Composición elemental (FRX)", bbox: [0.674, 0.238, 0.909, 0.665], capas: ["frx"] }
  ],

  // Sin microscopías tocables: el análisis solo trae rayos X + tabla FRX.
  hotspots: []
};
