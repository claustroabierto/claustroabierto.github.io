/*  CONFIG DE PIEZA — Wawapampay · diorama 3D (fotogrametría)
 *  Visor 3D girable (turntable) del diorama de la fiesta andina + música de fondo
 *  (YouTube, oculto) + letra en español corriendo (subtítulos sincronizados).
 *
 *  El diorama se escaneó en 360°, así que el giro es LIBRE (no como Borja). El
 *  material es unlit (la luz ya está en el color de la fotogrametría).
 */
window.MUSEO_CONFIG = {
  id: "wawapampay",
  titulo: "Wawapampay",
  subtitulo: "Fiesta andina · modelo 3D (fotogrametría)",

  modelo: "assets/wawapampay.glb?v=1",

  // Música de fondo (solo audio): https://www.youtube.com/watch?v=dYNXHx6gr50
  youtubeId: "dYNXHx6gr50",
  startSec: 81,          // arranca en 1:21 (y vuelve ahí al repetir)

  // Letra en español, sincronizada: cada línea { t: <segundos>, txt: "<verso>" }.
  // ⚠ PENDIENTE: pegar la letra real (del Video.docx) con sus tiempos. Mientras esté
  // vacía, no se muestran subtítulos (el visor + la música funcionan igual).
  letra: []
};
