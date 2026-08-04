/*  CONFIG DE PIEZA — Inmaculada_Concepcion
 *  Análisis de microscopía (versión corregida del equipo, 2026-07-17). Las
 *  microscopías se revelan UNA POR UNA sobre el cuadro; cada recorte ya trae su
 *  ETIQUETA y su FLECHA (líneas blancas del "sin target", NO se inventan). Al
 *  final quedan los círculos tocables para hacer zoom (como antes).
 *
 *  Los `reveals` son recortes 850x850 del overlay "sin target" (cada uno con su
 *  microscopía+etiqueta+flecha en su posición exacta), así que se superponen
 *  alineados. Los `hotspots` son los círculos tocables (misma posición).
 */
window.MUSEO_CONFIG = {
  id: "Inmaculada_Concepcion",
  titulo: "Inmaculada Concepción",
  subtitulo: "Óleo sobre lienzo - Siglo XVIII · Identificación de pigmentos históricos · Microscopía y composición química con FRX",
  ficha: "Óleo sobre lienzo, siglo XVIII · Identificación de pigmentos históricos",
  hintSeq: "Análisis de pigmentos con FRX y microscopía · Toca cada círculo para ampliar",

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
    "assets/reveal/0titulo.webp?v=3",
    "assets/reveal/1carnacion.webp?v=2",
    "assets/reveal/2verde.webp?v=2",
    "assets/reveal/3rojo1.webp?v=2",
    "assets/reveal/5azul.webp",
    "assets/reveal/6amarillo.webp",
    "assets/reveal/7morado.webp",
    "assets/reveal/8blanco.webp"
  ],

  // Círculos tocables (tocar → zoom de la microscopía). Coords 0..1 sobre el
  // overlay = centro de cada círculo.
  // x uniformado por columna (izq 0.232 / der 0.757) y size uniformado (0.051)
  // a partir de lo que ajustaron a mano con el editor de círculos del preview.
  // Nombres/textos finales del PDF (por ubicación anatómica/compositiva, no por
  // color): Carnación->Rostro, Verde->Manto(verdigris), Rojo1->Manto(bermellón),
  // Azul->Nube, Amarillo->Blonda, Morado->Querubín, Blanco->Huerto.
  // Rojo2 (el rojo de la derecha) se quitó por completo a pedido del equipo:
  // ni reveal ni círculo.
  hotspots: [
    { x: 0.232, y: 0.245, size: 0.051, color: "#c98a6a", img: "assets/micro-carnacion.webp", titulo: "Rostro", pigmento: "Bermellón / Albayalde", formula: "HgS · PbCO₃", nota: "Detalle del rostro con craqueladuras y pinceladas de óleo de albayalde mezclado con bermellón." },
    { x: 0.757, y: 0.242, size: 0.051, color: "#5c7f4f", img: "assets/micro-verde.webp", titulo: "Manto", pigmento: "Verdigris", formula: "Cu(C₁₉H₂₉COO)₂", nota: "Detalle del manto con pigmento verde de verdigrís (acetato de cobre)." },
    { x: 0.232, y: 0.459, size: 0.051, color: "#e8562a", img: "assets/micro-rojo1.webp", titulo: "Manto", pigmento: "Bermellón", formula: "HgS", nota: "Detalle del interior del manto de la Virgen con pigmento bermellón o cinabrio que es un sulfuro de mercurio." },
    { x: 0.232, y: 0.687, size: 0.051, color: "#5a79b0", img: "assets/micro-azul.webp", titulo: "Nube", pigmento: "Añil", formula: "C₁₆H₁₀N₂O₂", nota: "Detalle del cielo y las nubes con pigmento de índigo (Indigofera tinctoria) y carga de carbonato de calcio." },
    { x: 0.757, y: 0.690, size: 0.051, color: "#d8b41f", img: "assets/micro-amarillo.webp", titulo: "Blonda", pigmento: "Oropimente", formula: "As₂S₃", nota: "Detalle de la blonda de hilos metálicos representada con oropimente (trisulfuro de arsénico)." },
    { x: 0.232, y: 0.909, size: 0.051, color: "#b0446a", img: "assets/micro-morado.webp", titulo: "Querubín", pigmento: "Carmín", formula: "C₂₂H₂₀O₁₃", nota: "Detalle del ala del querubín con pigmento carmín, obtenido de Dactylopius coccus (cochinilla)." },
    { x: 0.757, y: 0.914, size: 0.051, color: "#d9cdb8", img: "assets/micro-blanco.webp", titulo: "Huerto", pigmento: "Albayalde", formula: "PbCO₃", nota: "Detalle del cerco del huerto (hortus conclusus) con pigmento blanco de plomo o albayalde." }
  ]
};
