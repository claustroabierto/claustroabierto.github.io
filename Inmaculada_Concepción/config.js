/*  CONFIG DE PIEZA — Inmaculada_Concepción
 *  Análisis de microscopía (versión corregida del equipo, 2026-07-17). Las 8
 *  microscopías se revelan UNA POR UNA sobre el cuadro; cada recorte ya trae su
 *  ETIQUETA y su FLECHA (líneas blancas del "sin target", NO se inventan). Al
 *  final quedan los círculos tocables para hacer zoom (como antes).
 *
 *  Los `reveals` son recortes 850x850 del overlay "sin target" (cada uno con su
 *  microscopía+etiqueta+flecha en su posición exacta), así que se superponen
 *  alineados. Los `hotspots` son los círculos tocables (misma posición).
 */
window.MUSEO_CONFIG = {
  id: "Inmaculada_Concepción",
  titulo: "La Inmaculada Concepción",
  subtitulo: "Microscopía y materialidad · pigmentos",
  ficha: "Óleo sobre lienzo · Escuela colonial · Análisis científico de pigmentos",

  targetSrc: "assets/targets.mind",
  targetPreview: "assets/target.jpg",

  // Geometría de alineación (unidades MindAR: ancho de la pintura = 1). Ajustado
  // A MANO por el equipo con `align.html` (arrastrar/escalar en vivo sobre la
  // pintura) — NO tantear estos números, usar la herramienta. Nota: las flechas de
  // Carnación y Verde en los reveals están casi a la misma altura, así que con una
  // sola transformación uniforme no se pueden clavar ambas a la vez (límite del
  // asset; el arreglo fino sería regenerar las flechas de los reveals).
  // `src` = el análisis completo corregido (fallback para la pieza AR).
  overlay: { src: "assets/overlay-nuevo.webp", width: 1.556, height: 1.556, offsetX: 0.012, offsetY: 0.061 },

  // Revelado uno por uno (recortes del "sin target", con flecha incluida).
  revelarSecuencial: true,
  intervaloReveal: 0.8,   // segundos entre cada aparición
  reveals: [
    "assets/reveal/0titulo.webp",
    "assets/reveal/1carnacion.webp?v=2",
    "assets/reveal/2verde.webp?v=2",
    "assets/reveal/3rojo1.webp?v=2",
    "assets/reveal/4rojo2.webp?v=2",
    "assets/reveal/5azul.webp",
    "assets/reveal/6amarillo.webp",
    "assets/reveal/7morado.webp",
    "assets/reveal/8blanco.webp"
  ],

  // Círculos tocables (tocar → zoom de la microscopía). Coords 0..1 sobre el
  // overlay = centro de cada círculo.
  hotspots: [
    { x: 0.235, y: 0.214, color: "#c98a6a", img: "assets/micro-carnacion.webp", titulo: "Carnación", pigmento: "Bermellón / Albayalde", formula: "HgS · PbCO₃", nota: "El tono de la piel combina bermellón (rojo) y albayalde (blanco de plomo)." },
    { x: 0.752, y: 0.214, color: "#5c7f4f", img: "assets/micro-verde.webp", titulo: "Verde", pigmento: "Malaquita", formula: "Cu₂CO₃(OH)₂", nota: "Verde mineral de cobre, muy usado en el manto y paisajes." },
    { x: 0.235, y: 0.430, color: "#e8562a", img: "assets/micro-rojo1.webp", titulo: "Rojo", pigmento: "Bermellón", formula: "HgS", nota: "Sulfuro de mercurio: el rojo más intenso del periodo colonial." },
    { x: 0.752, y: 0.430, color: "#c1431f", img: "assets/micro-rojo2.webp", titulo: "Rojo", pigmento: "Bermellón", formula: "HgS", nota: "También presente en los pliegues del manto rojo." },
    { x: 0.235, y: 0.666, color: "#5a79b0", img: "assets/micro-azul.webp", titulo: "Azul", pigmento: "Añil", formula: "C₁₆H₁₀N₂O₂", nota: "Tinte vegetal (índigo) traído del comercio colonial." },
    { x: 0.752, y: 0.666, color: "#d8b41f", img: "assets/micro-amarillo.webp", titulo: "Amarillo", pigmento: "Oropimente", formula: "As₂S₃", nota: "Sulfuro de arsénico: amarillo brillante y tóxico." },
    { x: 0.235, y: 0.884, color: "#b0446a", img: "assets/micro-morado.webp", titulo: "Morado", pigmento: "Cochinilla", formula: "C₂₂H₂₀O₁₃", nota: "Colorante del insecto cochinilla, tesoro tintóreo andino." },
    { x: 0.752, y: 0.884, color: "#d9cdb8", img: "assets/micro-blanco.webp", titulo: "Blanco", pigmento: "Albayalde", formula: "PbCO₃", nota: "Blanco de plomo, base de las luces y carnaciones." }
  ]
};
