/*  CONFIG DE PIEZA — candelabros (vidrio de uranio), SIN marcador
 *  Ya no depende de detectar ningún target (antes RA2, letras+foto, medía
 *  débil y el tracking temblaba). El candelabro flota FIJO sobre la cámara en
 *  vivo y SE ENCIENDE en UV (fluorescencia verde con glow). Calibrar
 *  tamaño/posición con el celular real: abrir con `?calib=1` en la URL.
 */
window.MUSEO_CONFIG = {
  id: "candelabros",
  titulo: "Candelabros",
  subtitulo: "Cristal de Uranio U - mediados del Siglo XX · Fluorescencia bajo luz ultravioleta UV",
  ficha: "Cristal de Uranio, mediados del Siglo XX · emite niveles bajos de radiación · fluoresce verde intenso brillante al recibir luz UV",

  // Título de la pieza (Arial, se muestra en MAYÚSCULAS), en negro (igual que
  // "CON/SIN LUZ UV" de las comparativas), sin contorno.
  label: { text: "Reflexión por radiación de luz UV", color: "#000000", width: 1.15 },

  // El candelabro UV (recorte transparente) que sale del marcador y se enciende.
  objeto: { src: "assets/overlay.webp?v=2", aspect: 0.541, size: 0.9 },

  // Comparativas del cristal (sin / con luz UV) a los costados.
  comparativas: [
    { src: "assets/sinuv.webp", aspect: 0.590, size: 0.5, x: -0.92, y: 0.18, label: "Sin UV" },
    { src: "assets/conuv.webp", aspect: 0.635, size: 0.5, x:  0.92, y: 0.18, label: "Con UV" }
  ]
};
