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
  startSec: 81,          // arranca en 1:21 (y vuelve ahí al repetir)

  // Letra en español ("Entierro de niño", traducción del canto tradicional andino),
  // sincronizada: cada línea { t: <segundos del video>, txt: "<verso>" }.
  // ⚠ TIEMPOS ESTIMADOS (parejos, arrancando cerca de startSec). Afinar los `t`
  // reales tocando al ritmo con Wawa_pampay/letra-tool.html.
  letra: [
    { t: 82,  txt: "Con mi niño que ha partido al cielo," },
    { t: 87,  txt: "¿en dónde ya te has encontrado?" },
    { t: 92,  txt: "Con mi niño que ha partido al cielo," },
    { t: 97,  txt: "¿en dónde ya te has encontrado?" },
    { t: 102, txt: "Ya lo encontré en el caminito a la gloria," },
    { t: 107, txt: "ya lo encontré ingresando a la gloria." },
    { t: 112, txt: "Mi florecita, mis rositas, ahora ya me estoy yendo." },
    { t: 117, txt: "Mi florecita, mis rositas, ahora ya me estoy marchando." },
    { t: 122, txt: "Tú nada más cuida a mi madre," },
    { t: 127, txt: "tú nada más cuida a mi padre." },
    { t: 132, txt: "Tú nada más cuida a mi madre," },
    { t: 137, txt: "tú nada más cuida a mi padre." },
    { t: 142, txt: "De mi madrina, de mi padrino," },
    { t: 147, txt: "la ropita que me han colocado." },
    { t: 152, txt: "De mi madrina, de mi padrino," },
    { t: 157, txt: "la ropita que me han colocado." },
    { t: 162, txt: "Sólo esas me llevo," },
    { t: 167, txt: "tapándome bien mi cuerpito." },
    { t: 172, txt: "Sólo esas me llevo," },
    { t: 177, txt: "tapándome bien mi cuerpito." },
    { t: 182, txt: "De mi madre, de mi padre," },
    { t: 187, txt: "la ropita que me han comprado." },
    { t: 192, txt: "De mi madre, de mi padre," },
    { t: 197, txt: "la ropita que me han comprado." },
    { t: 202, txt: "En el colgadorcito se las he dejado," },
    { t: 207, txt: "en la perchita se las he dejado." },
    { t: 212, txt: "En el colgadorcito se las he dejado," },
    { t: 217, txt: "en la perchita se las he dejado." }
  ]
};
