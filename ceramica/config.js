/*  CONFIG DE PIEZA — Cerámica (RA8) · revelado científico
 *  Vasija-cara vidriada (objeto de volumen): no rastrea como imagen, así que el
 *  target es un MARCADOR RA denso (foto de la cara + "RA8", detección 2020, por
 *  encima del piso que funciona). El RA8 entregado (letras solas) es débil.
 *
 *  Al escanear el marcador, el análisis del equipo se despliega ALREDEDOR de la
 *  cara (el composite es un infográfico horizontal), en secuencia:
 *    1) IMAGEN DE RAYOS X — perfil + frente (rx.webp), a la izquierda
 *    2) Cara + tabla FRX (frx.webp): composición Plomo 66% / Silicio 20% / Estaño
 *
 *  CLAVE: la cara del marcador ES la cara limpia del composite (misma imagen), así
 *  que la capa cae EXACTA sobre el marcador — sin ajuste de alineación. Los rayos
 *  X quedan a la izquierda y la tabla FRX a la derecha. Geometría medida (cara del
 *  composite -> cara del marcador) y verificada con render. Fino: align.html.
 *
 *  Sin microscopías (el análisis solo trae rayos X + FRX).
 */
window.MUSEO_CONFIG = {
  id: "ceramica",
  titulo: "Cerámica vidriada",
  subtitulo: "Rayos X y composición (FRX) · escanea el marcador",
  ficha: "Vasija con rostro, vidriado plúmbeo · Rayos X (perfil y frente) y fluorescencia: Plomo 66% · Silicio 20% · Estaño 11%",

  targetSrc: "assets/targets.mind",       // el MARCADOR (compilado, detección 2020)
  targetPreview: "assets/marcador.jpg",

  // El composite alineado para que su cara limpia caiga sobre la cara del marcador.
  overlay: {
    src: "assets/frx.webp?v=2",           // la capa con la cara (lo que muestra align.html)
    width: 3.11,
    height: 1.238,
    offsetX: -0.341,
    offsetY: 0.208
  },

  // Revelado en secuencia: rayos X y luego la composición.
  revelarSecuencial: true,
  intervaloReveal: 0.9,
  reveals: [
    "assets/rx.webp?v=2",                 // 1) rayos X perfil + frente + título
    "assets/frx.webp?v=2"                 // 2) cara (sobre el marcador) + tabla FRX
  ],
  hintSeq: "Aparece el rayos X y luego la composición (FRX) · toca Repetir para verlo de nuevo",

  hotspots: []
};
