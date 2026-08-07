/*  CONFIG DE PIEZA — San Francisco de Borja · 3D por fotogrametría
 *  El modelo 3D aparece DIRECTO al abrir (ya no se activa con un target). Un botón
 *  "Escuchar bienvenida" abre un pop-up con el video de bienvenida.
 *
 *  El mesh solo está bien resuelto por el FRENTE (la parte de atrás de la
 *  fotogrametría quedó incompleta), así que el giro se LIMITA a un arco frontal
 *  (±55° en azimut). Un vaivén suave da vida; el usuario toma control al tocar.
 */
window.MUSEO_CONFIG = {
  id: "san_francisco_de_borja",
  titulo: "San Francisco de Borja",
  subtitulo: "Escultura policromada · modelo 3D (fotogrametría)",

  modelo: "assets/borja.glb?v=2",             // modelo 3D texturizado (unlit)
  video: "assets/bienvenida.mp4?v=1",         // video de bienvenida (pop-up)

  // Giro limitado al frente (la parte de atrás del mesh no está terminada).
  orbit: {
    inicial: "0deg 82deg 105%",
    min: "-55deg 45deg auto",
    max: "55deg 112deg auto",
    swayDeg: 38                               // amplitud del vaivén suave (azimut)
  }
};
