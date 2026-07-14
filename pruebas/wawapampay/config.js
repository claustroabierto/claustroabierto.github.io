/*  DEMO de modo pantalla — mecánica prevista para wawapampay.
 *
 *  ⚠ TODO acá es PLACEHOLDER: la voz es sintetizada con `say` de macOS, la letra
 *  es inventada y el bailarín es una silueta generada, no arte final. Sirve para
 *  validar la MECÁNICA (baile + música + letra corriendo) antes de que lleguen
 *  los assets reales.
 *
 *  Sin `targetSrc` ni `.mind`: en modo pantalla no hay nada que rastrear.
 */
window.MUSEO_CONFIG = {
  modo: "pantalla",
  id: "wawapampay-demo",
  titulo: "Wawapampay · demo de mecánica",
  subtitulo: "Placeholder — valida el efecto, no es el contenido final",
  ficha: "Baile + música + letra corriendo. Assets reales pendientes.",

  audio: {
    src: "../assets/demo-cancion.m4a",
    loop: true,
    boton: "Tocar música"
  },

  // Silueta de placeholder: tira horizontal de 8 cuadros de 200x260.
  personajes: [
    { src: "../assets/demo-bailarin.png", frames: 8, fps: 11,
      width: "42vw", aspect: "200/260", x: "27%", y: "68%" },
    { src: "../assets/demo-bailarin.png", frames: 8, fps: 9,
      width: "36vw", aspect: "200/260", x: "72%", y: "72%", delay: "-0.4s" }
  ],

  // Timings MEDIDOS sintetizando cada línea aparte y midiendo su duración real
  // (ver el commit). Para la canción real habrá que sacarlos del audio verdadero:
  // no hay forma automática, es trabajo manual línea por línea.
  letras: [
    { t: 0.00, txt: "Wawapampay, canta la tierra" },
    { t: 2.35, txt: "los pasos vuelven a sonar" },
    { t: 4.30, txt: "gira la falda, gira el viento" },
    { t: 6.78, txt: "en el claustro abierto al mundo" },
    { t: 9.05, txt: "Ayacucho baila otra vez" }
  ]
};
