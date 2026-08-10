/*  CONFIG DE PIEZA — Jesús Nazareno · "SALE DEL PLANO"
 *  Pintura colonial del Cristo camino al Calvario (con pan de oro). El equipo
 *  entregó la obra separada en dos capas: el FONDO sin el Cristo (fondo.webp) y
 *  el CRISTO recortado con transparencia (nazareno.webp).
 *
 *  MARCADOR = SOLO EL LIENZO (lienzo.jpg, recorte de marcador.jpg en
 *  x84,y92 1156x990). Antes el marcador era la foto entera (marcador.jpg,
 *  1337x1177) e incluía el MARCO DORADO TALLADO y un poco de pared. Por eso
 *  "a veces no reconocía" aunque sea una pintura: el oro es especular (sus
 *  puntos cambian con cada luz y cada ángulo) y el tallado es un patrón que se
 *  repite, así que esos puntos no sobreviven en sala; y la pared ni siquiera
 *  está siempre igual. Medido: la foto entera daba 4529 puntos y el lienzo solo
 *  da 4063 — se pierde un 10% de puntos quitando el 27% de la imagen, o sea que
 *  lo quitado era lo menos denso, y lo que queda es un 23% más denso por Mpx.
 *
 *  FALTA la otra mitad del arreglo: compilar un .mind con DOS targets, este
 *  recorte + una foto del cuadro tomada EN SALA con celular (misma luz, mismo
 *  ángulo del visitante) recortada al mismo rectángulo. `compile.mjs` ya acepta
 *  varias imágenes; al compartir recorte, ambas anclas usan esta misma geometría.
 *
 *  Experiencia (motor propio nazareno-engine.js): al detectar la pintura, el
 *  FONDO limpio se superpone exacto sobre la obra real (tapa al Cristo pintado) y
 *  el CRISTO recortado queda en su sitio → se ve la pintura intacta. Luego el
 *  Cristo se DESPEGA del plano y avanza hacia el visitante (parallax real, porque
 *  es un plano en z delante del fondo) con un vaivén sutil (gesto/caminata). Sin
 *  la capa de fondo habría "doble Cristo" al moverse; por eso se tapa con fondo.webp.
 *
 *  Geometría: el marcador (el lienzo, 1156x990) mide 1 de ancho y markerH de alto
 *  en unidades MindAR. Como el marcador ya NO es la foto entera, el fondo (que sí
 *  es la foto entera) es más grande que el marcador y va desplazado: eso es
 *  `fondoPlano`. `figura` = plano del Cristo. Todo esto se obtuvo convirtiendo los
 *  valores anteriores de unidades-foto-entera a unidades-lienzo (×1337/1156), no
 *  volviendo a medir a ojo. Ajuste fino: mover con align si hiciera falta.
 */
window.MUSEO_CONFIG = {
  id: "jesus_nazareno",
  titulo: "Jesús Nazareno",
  subtitulo: "Óleo sobre lienzo - Siglo XVIII · La imagen cobra vida y peregrina con la Santa Cruz camino al calvario",
  ficha: "Óleo sobre lienzo, siglo XVIII · La imagen de Jesús Nazareno abandona la pintura y peregrina de un lado al otro, camino al Calvario.",

  targetSrc: "assets/targets.mind?v=2",      // SOLO el lienzo, sin marco ni pared
  targetPreview: "assets/lienzo.jpg",

  markerH: 0.8564,                           // alto del lienzo (990/1156) en unidades de marcador

  fondo: "assets/fondo.webp?v=1",            // pintura SIN el Cristo (cubre la obra real)
  nazareno: "assets/nazareno.webp?v=1",      // Cristo recortado (el que sale y se anima)

  // El fondo es la FOTO ENTERA (marco incluido), así que desborda al marcador:
  // más ancho, más alto y con un pelo de desplazamiento. Sigue tapando al Cristo
  // pintado exactamente igual que antes; solo cambian las unidades.
  fondoPlano: { w: 1.1566, h: 1.0182, x: 0.0056, y: -0.0013 },

  // Plano del Cristo sobre el lienzo (unidades de marcador).
  figura: { w: 1.0502, h: 0.9542, x: 0.0114, y: -0.0013 },

  // Animación "sale del plano" (segundos desde la detección): el Cristo emerge en z
  // (hacia el visitante), sube un poco y crece...
  emerge: { start: 1.2, end: 2.4, z: 0.2082, scale: 0.08, y: 0.0231 },
  // ...y luego CAMINA de un lado a otro EN BUCLE: primero a la izquierda mirando a la
  // izquierda; al llegar al extremo la imagen se REFLEJA (espejo horizontal) y camina a
  // la derecha mirando a la derecha; y así sin fin. `dist` = alcance a cada lado (anchos
  // de marco), `omega` = velocidad del vaivén, `step`/`bob` = cadencia de paso, `flip` =
  // qué tan rápido voltea en los extremos (más alto = giro más seco).
  pace: { dist: 0.4626, omega: 0.9, step: 8.0, bob: 0.0231, flip: 6 }
};
