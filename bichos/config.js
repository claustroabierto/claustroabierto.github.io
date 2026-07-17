/*  CONFIG DE PIEZA — bichos (mantón de Manila bordado)
 *  Los insectos y aves bordados del mantón "cobran vida" y vuelan. Motor propio
 *  (bichos-engine.js). Los sprites salen de "RA de bichos.png" (el equipo los
 *  entregó ya recortados con transparencia); las fotos y microscopías, del Drive.
 *
 *  Coordenadas en el espacio del mantón: ancho = 1, alto = 1/aspect. Centro en 0.
 *  x∈[-0.5,0.5] izq→der ; y sube positivo. size = alto del sprite (el ancho sale
 *  de su aspect, sin deformar).
 */
window.MUSEO_CONFIG = {
  id: "bichos",
  titulo: "Mantón de Manila",
  subtitulo: "Los bordados cobran vida",
  ficha: "Mantón de seda bordado · insectos y aves · fluorescencia bajo luz UV y microscopía 10x",

  targetSrc: "assets/targets.mind",
  targetPreview: "assets/target.jpg",
  fondo: "assets/manton.webp",   // solo para la demo sin cámara
  aspect: 1.462,                 // ancho/alto del mantón (target 1300x889)

  // Revelado bajo luz UV: el medallón central del mantón fluoresce (flores
  // azules). El overlay (capa 1.png del equipo) cae sobre el medallón real.
  medallonUV: { src: "assets/medallon-uv.webp", aspect: 0.997, x: -0.02, y: 0.05, size: 0.33 },

  // Los bichos: posición base sobre el mantón + su vuelo. `spread` = cuánto se
  // aleja volando; `flap` = velocidad de aleteo (aves lento, insectos rápido).
  // tipo "ave" (vista de perfil) → emerge y se mece suave en su sitio, sin
  // aletear ni volar lejos. tipo "insecto" (vista superior) → revolotea y aletea.
  bichos: [
    { src: "assets/sprites/ave-paraiso.webp",     tipo: "ave",     aspect: 0.833, x:  0.06, y: -0.02, size: 0.30, spread: 0.05, flap: 2.4 },
    { src: "assets/sprites/ave-blanca.webp",      tipo: "ave",     aspect: 0.964, x: -0.37, y:  0.03, size: 0.17, spread: 0.05, flap: 2.6 },
    { src: "assets/sprites/mariposa.webp",        tipo: "insecto", aspect: 1.311, x: -0.31, y:  0.17, size: 0.13, spread: 0.26, flap: 9.0 },
    { src: "assets/sprites/libelula-azul.webp",   tipo: "insecto", aspect: 1.379, x:  0.34, y:  0.15, size: 0.14, spread: 0.30, flap: 11.0 },
    { src: "assets/sprites/libelula-roja.webp",   tipo: "insecto", aspect: 0.707, x: -0.29, y: -0.17, size: 0.13, spread: 0.28, flap: 10.0 },
    { src: "assets/sprites/insecto-amarillo.webp",tipo: "insecto", aspect: 1.093, x:  0.31, y: -0.15, size: 0.12, spread: 0.24, flap: 8.5 },
    { src: "assets/sprites/escarabajo-azul.webp", tipo: "insecto", aspect: 0.590, x:  0.19, y:  0.25, size: 0.11, spread: 0.22, flap: 7.0 },
    { src: "assets/sprites/escarabajo-morado.webp",tipo:"insecto", aspect: 0.623, x: -0.15, y: -0.26, size: 0.11, spread: 0.22, flap: 7.5 }
  ]
};
