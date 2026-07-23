/*  CONFIG DE PIEZA — Cerámica (RA8) · revelado científico
 *  Vasija-cara vidriada (objeto de volumen): no rastrea como imagen, así que el
 *  target es el MARCADOR RA8 (letras "RA⁸", assets/ra8-target.jpg). ⚠ Mide DÉBIL
 *  (letras solas, ~647 como RA7): IMPRIMIRLO GRANDE para que enganche a distancia.
 *
 *  Al escanear el RA8, el análisis del equipo flota anclado a él (infográfico
 *  horizontal), en secuencia:
 *    1) IMAGEN DE RAYOS X — perfil + frente (rx.webp), a la izquierda
 *    2) Cara a color + tabla FRX (frx.webp): Plomo 66% / Silicio 20% / Estaño 11%
 *
 *  El RA8 son solo letras (no hay nada que "alinear"): la cara del composite se
 *  centra sobre el marcador por PREFERENCIA (la pieza queda sobre la tarjeta, los
 *  rayos X a la izquierda y la tabla FRX a la derecha). Mover con align.html.
 *
 *  Antes se usó un marcador DENSO (foto de la cara + "RA8", detección 2020) y la
 *  cara caía exacta sobre él; se conserva marcador.jpg/.mind por si se vuelve.
 *  Sin microscopías (el análisis solo trae rayos X + FRX).
 */
window.MUSEO_CONFIG = {
  id: "ceramica",
  titulo: "Cerámica vidriada",
  subtitulo: "Rayos X y composición (FRX) · escanea el marcador",
  ficha: "Vasija con rostro, vidriado plúmbeo · Rayos X (perfil y frente) y fluorescencia: Plomo 66% · Silicio 20% · Estaño 11%",

  targetSrc: "assets/targets.mind?v=3",    // MARCADOR RA8 (letras, compilado)
  targetPreview: "assets/ra8-target.jpg",

  // El composite anclado al RA8: la cara centrada sobre el marcador (preferencia),
  // rayos X a la izquierda y tabla FRX a la derecha. `overlay` = geometría (align.html).
  overlay: {
    src: "assets/frx.webp?v=2",           // la capa con la cara (lo que muestra align.html)
    width: 3.11,
    height: 1.238,
    offsetX: -0.393,
    offsetY: 0.058
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
