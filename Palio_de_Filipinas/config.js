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
  // Los 4 círculos venían casi en las esquinas: en el celular quedaban lejísimos
  // del medallón (el de arriba a la derecha caía ya sobre la pared). En el propio
  // webp se acercaron al centro al 75% de su distancia al medallón — más cerca ya
  // le pisan el anillo. Es el MISMO recorte de cada círculo, solo trasladado
  // (traslación entera, webp lossless): centros 1600x1152 (296,296)/(1305,295)/
  // (300,751)/(1291,749) → (419,354)/(1176,354)/(422,696)/(1165,694). El título
  // "MICROSCOPÍA / 10x de aumento" se quedó donde estaba.
  microManton: { src: "assets/micro-manton.webp?v=4", aspect: 1.389 },

  // RECTÁNGULO DE LA TELA dentro del marcador. Ningún bicho puede salir de aquí
  // (el motor recorta posición y amplitud de revoloteo contra esta caja).
  // OJO — el campo NO es cuadrado: el marcador mide 1 de ancho pero 1/aspect de
  // alto (0.684), así que "y" solo llega a ±0.342, la mitad que "x". Además la
  // tela no llena el target (medido sobre target.jpg: el 6.5% derecho y el 2%
  // de arriba son pared), por eso x1 no es 0.5 e y1 no es 0.342.
  // Tela: x -0.500..0.435 · y -0.342..0.328. Aquí va con 0.012 de margen.
  bounds: { x0: -0.488, x1: 0.423, y0: -0.330, y1: 0.316 },

  // 15 insectos: nacen en el CENTRO (0,0) diminutos y vuelan hacia estas posiciones.
  // spread = cuánto revolotea al llegar · flap = aleteo.
  // Las posiciones están calculadas para que ni en reposo ni revoloteando el
  // sprite (contando su giro y su aleteo) se salga de `bounds`.
  bichos: [
    { src: "assets/sprites/mariposa.webp",         aspect: 1.311, x: -0.291, y:  0.165, size: 0.12, spread: 0.24, flap: 9.0 },
    { src: "assets/sprites/b2-00.webp",            aspect: 0.759, x: -0.150, y:  0.187, size: 0.11, spread: 0.22, flap: 8.0 },
    { src: "assets/sprites/b2-01.webp",            aspect: 0.750, x:  0.180, y:  0.187, size: 0.11, spread: 0.22, flap: 8.0 },
    { src: "assets/sprites/libelula-azul.webp",    aspect: 1.379, x:  0.197, y:  0.146, size: 0.13, spread: 0.28, flap: 11.0 },
    { src: "assets/sprites/libelula-roja.webp",    aspect: 0.707, x: -0.318, y:  0.100, size: 0.12, spread: 0.26, flap: 10.0 },
    { src: "assets/sprites/insecto-amarillo.webp", aspect: 1.093, x:  0.254, y:  0.130, size: 0.11, spread: 0.22, flap: 8.5 },
    { src: "assets/sprites/escarabajo-azul.webp",  aspect: 0.590, x: -0.359, y: -0.050, size: 0.10, spread: 0.20, flap: 7.0 },
    { src: "assets/sprites/escarabajo-morado.webp",aspect: 0.623, x:  0.292, y: -0.030, size: 0.10, spread: 0.20, flap: 7.5 },
    { src: "assets/sprites/b2-02.webp",            aspect: 0.681, x: -0.346, y: -0.160, size: 0.10, spread: 0.22, flap: 8.0 },
    { src: "assets/sprites/b2-07.webp",            aspect: 0.866, x: -0.120, y: -0.200, size: 0.10, spread: 0.20, flap: 8.0 },
    { src: "assets/sprites/b2-08.webp",            aspect: 0.634, x:  0.150, y: -0.180, size: 0.11, spread: 0.24, flap: 9.0 },
    { src: "assets/sprites/b2-04.webp",            aspect: 0.798, x:  0.270, y: -0.160, size: 0.11, spread: 0.22, flap: 7.5 },
    { src: "assets/sprites/b2-12.webp",            aspect: 1.563, x: -0.250, y: -0.185, size: 0.10, spread: 0.26, flap: 10.0 },
    { src: "assets/sprites/b2-13.webp",            aspect: 1.338, x:  0.050, y: -0.171, size: 0.13, spread: 0.24, flap: 8.5 },
    { src: "assets/sprites/b2-05.webp",            aspect: 0.855, x:  0.247, y: -0.180, size: 0.13, spread: 0.24, flap: 7.0 }
  ]
};
