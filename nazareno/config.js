/*  CONFIG DE PIEZA — Jesús Nazareno · "SALE DEL PLANO"
 *  Pintura colonial del Cristo camino al Calvario (con pan de oro). El equipo
 *  entregó la obra separada en dos capas: el FONDO sin el Cristo (fondo.webp) y
 *  el CRISTO recortado con transparencia (nazareno.webp). El marcador de tracking
 *  es la pintura completa reconstruida (fondo + Cristo = marcador.jpg, 4531 pts).
 *
 *  Experiencia (motor propio nazareno-engine.js): al detectar la pintura, el
 *  FONDO limpio se superpone exacto sobre la obra real (tapa al Cristo pintado) y
 *  el CRISTO recortado queda en su sitio → se ve la pintura intacta. Luego el
 *  Cristo se DESPEGA del plano y avanza hacia el visitante (parallax real, porque
 *  es un plano en z delante del fondo) con un vaivén sutil (gesto/caminata). Sin
 *  la capa de fondo habría "doble Cristo" al moverse; por eso se tapa con fondo.webp.
 *
 *  Geometría: el marcador (1337x1177) mide 1 de ancho y markerH de alto en unidades
 *  MindAR. `figura` = plano del Cristo (medido del bbox alfa del recorte, normalizado
 *  al marco). Ajuste fino: mover con align si hiciera falta.
 */
window.MUSEO_CONFIG = {
  id: "nazareno",
  titulo: "Jesús Nazareno",
  subtitulo: "El Cristo sale de la pintura · apunta al cuadro",
  ficha: "Cristo camino al Calvario · pintura colonial con pan de oro. La figura se despega del plano y avanza hacia ti.",

  targetSrc: "assets/targets.mind?v=1",      // la pintura completa (fondo+Cristo)
  targetPreview: "assets/marcador.jpg",

  markerH: 0.880,                            // alto del marco (1177/1337) en unidades de marcador

  fondo: "assets/fondo.webp?v=1",            // pintura SIN el Cristo (cubre la obra real)
  nazareno: "assets/nazareno.webp?v=1",      // Cristo recortado (el que sale y se anima)

  // Plano del Cristo sobre el marco (unidades de marcador). Medido del bbox del recorte.
  figura: { w: 0.908, h: 0.825, x: 0.005, y: 0.000 },

  // Animación "sale del plano" (segundos desde la detección): el Cristo emerge en z
  // (hacia el visitante), sube un poco y crece; luego queda en vaivén sutil.
  emerge: { start: 1.4, end: 3.1, z: 0.22, scale: 0.12, y: 0.045 }
};
