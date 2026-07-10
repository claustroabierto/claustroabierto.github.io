/*  CONFIG DE PIEZA — inmaculada
 *  Este es el ÚNICO archivo que cambia por pieza. El motor (shared/ar-engine.js)
 *  es el mismo para todas. Copia esta carpeta, cambia el config y los assets.
 *
 *  Coordenadas de hotspots: normalizadas 0..1 sobre la imagen del OVERLAY
 *  (x: 0=izq,1=der ; y: 0=arriba,1=abajo). Fáciles de reajustar a ojo.
 */
window.MUSEO_CONFIG = {
  id: "inmaculada",
  titulo: "La Inmaculada Concepción",
  subtitulo: "Microscopía y materialidad · pigmentos",
  ficha: "Óleo sobre lienzo · Escuela colonial · Análisis científico de pigmentos",

  // Archivo de tracking (se genera con el compilador de MindAR, ver tools/README)
  targetSrc: "assets/targets.mind",
  targetPreview: "assets/target.jpg", // imagen que el visitante debe enfocar

  // --- Geometría de alineación (en unidades MindAR: ancho de la pintura = 1) ---
  // La pintura rastreada mide 1 (ancho) x 1.412 (alto).
  // El overlay 850x850 contiene la pintura en un rect de 537px de ancho.
  overlay: {
    src: "assets/overlay.png",
    width: 1.583,   // 850/537
    height: 1.583,  // overlay cuadrado
    offsetX: 0.012, // centro overlay vs centro pintura
    offsetY: 0.018
  },

  // --- Hotspots interactivos (tocar para ver el pigmento) ---
  hotspots: [
    { x: 0.235, y: 0.214, color: "#c98a6a", titulo: "Carnación", pigmento: "Bermellón / Albayalde", formula: "HgS · PbCO₃", nota: "El tono de la piel combina bermellón (rojo) y albayalde (blanco de plomo)." },
    { x: 0.752, y: 0.214, color: "#5c7f4f", titulo: "Verde", pigmento: "Malaquita", formula: "Cu₂CO₃(OH)₂", nota: "Verde mineral de cobre, muy usado en el manto y paisajes." },
    { x: 0.235, y: 0.430, color: "#e8562a", titulo: "Rojo", pigmento: "Bermellón", formula: "HgS", nota: "Sulfuro de mercurio: el rojo más intenso del periodo colonial." },
    { x: 0.752, y: 0.430, color: "#c1431f", titulo: "Rojo", pigmento: "Bermellón", formula: "HgS", nota: "También presente en los pliegues del manto rojo." },
    { x: 0.235, y: 0.666, color: "#5a79b0", titulo: "Azul", pigmento: "Añil", formula: "C₁₆H₁₀N₂O₂", nota: "Tinte vegetal (índigo) traído del comercio colonial." },
    { x: 0.752, y: 0.666, color: "#d8b41f", titulo: "Amarillo", pigmento: "Oropimente", formula: "As₂S₃", nota: "Sulfuro de arsénico: amarillo brillante y tóxico." },
    { x: 0.235, y: 0.884, color: "#b0446a", titulo: "Morado", pigmento: "Cochinilla", formula: "C₂₂H₂₀O₁₃", nota: "Colorante del insecto cochinilla, tesoro tintóreo andino." },
    { x: 0.752, y: 0.884, color: "#d9cdb8", titulo: "Blanco", pigmento: "Albayalde", formula: "PbCO₃", nota: "Blanco de plomo, base de las luces y carnaciones." }
  ]
};
