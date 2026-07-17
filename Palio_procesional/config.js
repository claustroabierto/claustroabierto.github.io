/*  CONFIG DE PIEZA — bichos (mantón de Manila bordado)
 *  Los insectos bordados del mantón "cobran vida": emergen creciendo desde su
 *  sitio y revolotean. Motor propio (bichos-engine.js). Sprites recortados de
 *  "RA de bichos.png" y "RA de bichos parte 2.png" (el equipo los entregó ya
 *  recortados con transparencia).
 *
 *  Por ahora SOLO insectos (las aves eran de perfil y no se animaban bien).
 *  Coordenadas en el espacio del mantón: ancho = 1, alto = 1/aspect, centro 0.
 */
window.MUSEO_CONFIG = {
  id: "Palio_procesional",
  titulo: "Mantón de Manila",
  subtitulo: "Los bordados cobran vida",
  ficha: "Mantón de seda bordado · insectos · fluorescencia bajo luz UV y microscopía 10x",

  targetSrc: "assets/targets.mind",
  targetPreview: "assets/target.jpg",
  fondo: "assets/manton.webp",   // solo para la demo sin cámara
  aspect: 1.462,

  // Revelado bajo luz UV: el medallón central fluoresce (flores azules).
  medallonUV: { src: "assets/medallon-uv.webp", aspect: 0.997, x: 0.005, y: 0.025, size: 0.37 },

  // 15 insectos distribuidos alrededor del medallón (centro despejado para el UV).
  // Todos vista superior → revolotean y aletean. spread = cuánto revolotea.
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
