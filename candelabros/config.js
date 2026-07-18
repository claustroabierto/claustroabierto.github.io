/*  CONFIG DE PIEZA — candelabros (vidrio de uranio) · MARCADOR RA
 *  El candelabro es vidrio brilloso 3D que NO rastrea como imagen y se mueve en
 *  vitrina → el target es un MARCADOR impreso (assets/marcador.jpg = foto del
 *  candelabro a cover + "RA2"), no la pieza. Al escanearlo, el candelabro sale
 *  del marcador, flota y SE ENCIENDE en UV (fluorescencia verde con glow).
 *
 *  Marcador preliminar (generado con la foto que ya teníamos) — Jimena lo pule
 *  para imprimir, como el del relicario.
 */
window.MUSEO_CONFIG = {
  id: "candelabros",
  titulo: "Candelabro de vidrio de uranio",
  subtitulo: "Fluorescencia bajo luz ultravioleta",
  ficha: "Vidrio con contenido de uranio · fluoresce verde bajo radiación UV · target: marcador RA2",

  targetSrc: "assets/targets.mind?v=2",
  targetPreview: "assets/marcador.png",   // RA2 sobre fondo BLANCO (aplanado) — probado: detecta a ~0.5 m (chico) / ~1 m (grande)

  // Título de la pieza (Arial, se muestra en MAYÚSCULAS). Color = el MISMO gris
  // sólido de "CON LUZ UV" de las comparativas (#b4b4b4), sin contorno.
  label: { text: "Reflexión por radiación de luz UV", color: "#b4b4b4", width: 1.15 },

  // El candelabro UV (recorte transparente) que sale del marcador y se enciende.
  objeto: { src: "assets/overlay.webp?v=2", aspect: 0.541, size: 0.9 },

  // Comparativas del cristal (sin / con luz UV) a los costados.
  comparativas: [
    { src: "assets/sinuv.webp", aspect: 0.590, size: 0.5, x: -0.92, y: 0.18, label: "Sin UV" },
    { src: "assets/conuv.webp", aspect: 0.635, size: 0.5, x:  0.92, y: 0.18, label: "Con UV" }
  ]
};
