/*  CONFIG DE PIEZA — San Francisco de Borja · 3D por fotogrametría
 *  La experiencia se ACTIVA escaneando la imagen (foto de la escultura,
 *  assets/sfb-target.jpg, detección 1833). Al detectarla, MindAR se detiene y
 *  aparece un visor 3D (<model-viewer>) con el modelo.
 *
 *  El mesh solo está bien resuelto por el FRENTE (la parte de atrás de la
 *  fotogrametría quedó incompleta), así que el giro se LIMITA a un arco frontal
 *  (±55° en azimut). Un vaivén suave dentro de ese arco da vida; el usuario toma
 *  control al tocar.
 */
window.MUSEO_CONFIG = {
  id: "borja",
  titulo: "San Francisco de Borja",
  subtitulo: "Escultura en 3D · escanea la imagen para activar",

  targetSrc: "assets/targets.mind?v=1",       // la foto de la escultura (image target)
  targetPreview: "assets/sfb-target.jpg",
  modelo: "assets/borja.glb?v=2",             // modelo 3D texturizado (unlit)

  // Giro limitado al frente (la parte de atrás del mesh no está terminada).
  orbit: {
    inicial: "0deg 82deg 105%",
    min: "-55deg 45deg auto",
    max: "55deg 112deg auto",
    swayDeg: 38                               // amplitud del vaivén suave (azimut)
  }
};
