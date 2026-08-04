/*  CONFIG DE PIEZA — Palio_de_Filipinas (mantón de Manila bordado)
 *  Los insectos bordados "cobran vida": EMERGEN creciendo DESDE EL CENTRO del
 *  mantón y vuelan hacia su sitio, en bucle. Motor propio (bichos-engine.js).
 *
 *  Capas nuevas del equipo (misma foto → mismo registro `mantonReg`):
 *   - fondoVacio : el mantón SIN los bichos sueltos → se superpone sobre la obra
 *     real para que los bichos animados vuelen sobre una base limpia (tipo dolorosa).
 *   - uvManton   : fluorescencia del medallón bajo luz UV.
 *   - microManton: microscopía (4 círculos de hilo 10x).
 *
 *  Registro (`mantonReg`) se ajusta A MANO con `uv.html` sobre la obra real —
 *  no tantear. `size` = ancho del overlay en unidades del mantón (1 = ancho de la obra).
 */
window.MUSEO_CONFIG = {
  id: "Palio_de_Filipinas",
  titulo: "Palio de Filipinas",
  subtitulo: "Textil de seda bordada - Siglo XVIII · Los insectos cobran vida",
  ficha: "Palio de Filipinas (textil de seda bordada, Siglo XVIII) · insectos RA · fluorescencia UV y microscopía 10x",

  targetSrc: "assets/targets.mind",
  targetPreview: "assets/target.jpg",
  fondo: "assets/manton.webp",   // solo para la demo sin cámara
  aspect: 1.462,

  // El UV usa su propio registro (ajustado a mano con uv.html: mover/escalar/GIRAR
  // porque su foto está en otro ángulo). La microscopía va SIN rotación, centrada.
  mantonReg:   { x: -0.036, y: -0.024, size: 0.959, rot: 0.0419 },   // solo UV
  microReg:    { x: -0.028, y: 0.024, size: 1, rot: -0.0209 },      // microscopía (ajustada a mano)
  uvManton:    { src: "assets/uv-manton.webp",    aspect: 1.389 },
  microManton: { src: "assets/micro-manton.webp?v=3", aspect: 1.389 },

  // 15 insectos: nacen en el CENTRO (0,0) diminutos y vuelan hacia estas posiciones.
  // spread = cuánto revolotea al llegar · flap = aleteo.
  bichos: [
    { src: "assets/sprites/mariposa.webp",         aspect: 1.311, x: -0.38, y:  0.26, size: 0.12, spread: 0.24, flap: 9.0 },
    { src: "assets/sprites/b2-00.webp",            aspect: 0.759, x: -0.15, y:  0.28, size: 0.11, spread: 0.22, flap: 8.0 },
    { src: "assets/sprites/b2-01.webp",            aspect: 0.750, x:  0.18, y:  0.27, size: 0.11, spread: 0.22, flap: 8.0 },
    { src: "assets/sprites/libelula-azul.webp",    aspect: 1.379, x:  0.40, y:  0.24, size: 0.13, spread: 0.28, flap: 11.0 },
    { src: "assets/sprites/libelula-roja.webp",    aspect: 0.707, x: -0.42, y:  0.10, size: 0.12, spread: 0.26, flap: 10.0 },
    { src: "assets/sprites/insecto-amarillo.webp", aspect: 1.093, x:  0.42, y:  0.13, size: 0.11, spread: 0.22, flap: 8.5 },
    { src: "assets/sprites/escarabajo-azul.webp",  aspect: 0.590, x: -0.44, y: -0.05, size: 0.10, spread: 0.20, flap: 7.0 },
    { src: "assets/sprites/escarabajo-morado.webp",aspect: 0.623, x:  0.44, y: -0.03, size: 0.10, spread: 0.20, flap: 7.5 },
    { src: "assets/sprites/b2-02.webp",            aspect: 0.681, x: -0.40, y: -0.16, size: 0.10, spread: 0.22, flap: 8.0 },
    { src: "assets/sprites/b2-07.webp",            aspect: 0.866, x: -0.12, y: -0.20, size: 0.10, spread: 0.20, flap: 8.0 },
    { src: "assets/sprites/b2-08.webp",            aspect: 0.634, x:  0.15, y: -0.18, size: 0.11, spread: 0.24, flap: 9.0 },
    { src: "assets/sprites/b2-04.webp",            aspect: 0.798, x:  0.40, y: -0.16, size: 0.11, spread: 0.22, flap: 7.5 },
    { src: "assets/sprites/b2-12.webp",            aspect: 1.563, x: -0.25, y: -0.28, size: 0.10, spread: 0.26, flap: 10.0 },
    { src: "assets/sprites/b2-13.webp",            aspect: 1.338, x:  0.05, y: -0.29, size: 0.13, spread: 0.24, flap: 8.5 },
    { src: "assets/sprites/b2-05.webp",            aspect: 0.855, x:  0.30, y: -0.28, size: 0.13, spread: 0.24, flap: 7.0 }
  ]
};
