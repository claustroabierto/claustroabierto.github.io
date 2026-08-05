/*  CONFIG DE PIEZA — Wawapampay · diorama 3D (fotogrametría)
 *  Visor 3D girable (turntable) del diorama de la fiesta andina + música de fondo
 *  (YouTube, oculto) + letra en español corriendo (subtítulos sincronizados).
 *
 *  El diorama se escaneó en 360°, así que el giro es LIBRE (no como Borja). El
 *  material es unlit (la luz ya está en el color de la fotogrametría).
 */
window.MUSEO_CONFIG = {
  id: "wawapampay",
  titulo: "Wawa pampay",
  subtitulo: "Tipos y costumbres ayacuchanas - Principios del Siglo XX · Madera, maguey, tela y pasta · Modelo 3D . velorio de un niño",

  modelo: "assets/wawapampay.glb?v=1",

  // Música de fondo (solo audio): https://www.youtube.com/watch?v=dYNXHx6gr50
  youtubeId: "dYNXHx6gr50",
  startSec: 110,         // arranca en 1:50 ("inicio del video"); la voz entra en 1:55

  // Letra en español ("Entierro de niño", traducción del canto tradicional andino),
  // sincronizada con TIEMPOS REALES del video (segundos absolutos, del documento del
  // equipo). Los { txt: "" } LIMPIAN el subtítulo en los intervalos SOLO instrumentales
  // (2:19-2:24, 2:48-2:52, el largo 3:15-3:48, 4:11-4:15 y el final tras 4:43): ahí no
  // hay canto, así que no debe verse ninguna letra.
  letra: [
    { t: 115, txt: "Con mi niño que ha partido al cielo," },
    { t: 118, txt: "¿en dónde ya te has encontrado?" },
    { t: 122, txt: "Con mi niño que ha partido al cielo," },
    { t: 125, txt: "¿en dónde ya te has encontrado?" },
    { t: 128, txt: "Ya lo encontré en el caminito a la gloria," },
    { t: 134, txt: "ya lo encontré ingresando a la gloria." },
    { t: 140, txt: "" },
    { t: 144, txt: "Con mi niño que ha partido al cielo," },
    { t: 147, txt: "¿en dónde ya te has encontrado?" },
    { t: 151, txt: "Con mi niño que ha partido al cielo," },
    { t: 154, txt: "¿en dónde ya te has encontrado?" },
    { t: 157, txt: "Ya lo encontré en el caminito a la gloria," },
    { t: 162, txt: "ya lo encontré ingresando a la gloria." },
    { t: 169, txt: "" },
    { t: 172, txt: "Mi florecita, mis rositas, ahora ya me estoy yendo." },
    { t: 178, txt: "Mi florecita, mis rositas, ahora ya me estoy marchando." },
    { t: 184, txt: "Tú nada más cuida a mi madre," },
    { t: 187, txt: "tú nada más cuida a mi padre." },
    { t: 190, txt: "Tú nada más cuida a mi madre," },
    { t: 193, txt: "tú nada más cuida a mi padre." },
    { t: 196, txt: "" },
    { t: 228, txt: "De mi madrina, de mi padrino," },
    { t: 231, txt: "la ropita que me han colocado." },
    { t: 234, txt: "De mi madrina, de mi padrino," },
    { t: 237, txt: "la ropita que me han colocado." },
    { t: 240, txt: "Sólo esas me llevo," },
    { t: 243, txt: "tapándome bien mi cuerpito." },
    { t: 245, txt: "Sólo esas me llevo," },
    { t: 248, txt: "tapándome bien mi cuerpito." },
    { t: 252, txt: "" },
    { t: 255, txt: "De mi madre, de mi padre," },
    { t: 258, txt: "la ropita que me han comprado." },
    { t: 261, txt: "De mi madre, de mi padre," },
    { t: 263, txt: "la ropita que me han comprado." },
    { t: 267, txt: "En el colgadorcito se las he dejado," },
    { t: 271, txt: "en la perchita se las he dejado." },
    { t: 275, txt: "En el colgadorcito se las he dejado," },
    { t: 279, txt: "en la perchita se las he dejado." },
    { t: 284, txt: "" }
  ]
};
