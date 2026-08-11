/*  CONFIG DE PIEZA — Cajonería (experiencia interactiva 2D, sin cámara)
 *
 *  El FondoCajones aparece como imagen de fondo. Sobre cada cajón hay un botón;
 *  al tocarlo se abre un pop-up (animación suave) con la foto del contenido de
 *  ese cajón, con zoom por pellizco para ver el detalle.
 *
 *  Coordenadas: fracción 0..1 sobre la imagen del fondo (mismo aspecto que
 *  fondo.jpg = 2200x1650). cy = centro vertical del cajón (donde va el rótulo).
 *  Para reordenar qué contenido va en qué cajón, solo cambia el `src` de cada
 *  entrada — el orden del array es de arriba (cajón 1) hacia abajo (cajón 6).
 */
window.MUSEO_CONFIG = {
  id: "cajoneria",
  titulo: "Cajonería",
  subtitulo: "Toca un cajón para ver lo que guarda",

  fondo: "assets/fondo.png?v=2",   // cajonera recortada (PNG transparente) sobre fondo vacío
  aspect: 2200 / 1650,        // 4:3

  xCenter: 0.492,             // centro horizontal del rótulo de los cajones
  bandH: 0.118,               // alto clicable de cada cajón (fracción del alto)

  cajones: [
    { titulo: "Joyería",           src: "assets/joyeria.jpg?v=1",  cy: 0.203 },
    { titulo: "Metales",           src: "assets/metales.jpg?v=1",  cy: 0.328 },
    { titulo: "Metales II",        src: "assets/metales2.jpg?v=1", cy: 0.443 },
    { titulo: "Monedas y exvotos", src: "assets/monedas.jpg?v=1",  cy: 0.547 },
    { titulo: "Textil",            src: "assets/textil.jpg?v=1",   cy: 0.667 }
    // El 6º cajón (cy ~0.78) queda SIN botón a propósito: no tiene contenido.
  ]
};
