# Museo Ayacucho — RA por QR (WebAR)

RA (realidad aumentada) sin app, por QR fijo junto a cada pieza. Exposición
**"Un claustro abierto al mundo a través del arte"** — Monasterio de Carmelitas
Descalzas (Santa Teresa), Ayacucho, en colaboración con UTEC. 14 piezas totales,
se van agregando de una en una.

- Sitio en vivo: https://claustroabierto.github.io/
- Repo: `claustroabierto/claustroabierto.github.io` (org GitHub `claustroabierto`)
- Deploy: GitHub Pages, rama `main`, root. Cada push a `main` publica solo.

## Stack

- **MindAR** (image tracking, MIT) + **three.js** para overlays 2D/animados.
- **Google model-viewer** para las piezas 3D por fotogrametría (pendientes: ver abajo).
- Sin build step, sin framework: HTML + JS plano por pieza + motor compartido.
- Hosting 100% gratis, sin dominio propio (no es requisito del museo).

## Estructura del repo

```
museo-ar/
  index.html          landing con tarjetas a cada pieza
  shared/
    ar-engine.js       motor único: carga MindAR, dibuja overlay + extras + hotspots
    styles.css
  <pieza>/             una carpeta por pieza, ej: Inmaculada_Concepción/, escapulario/, candelabros/
    index.html         boilerplate que carga shared/ar-engine.js + su config.js
    config.js          window.MUSEO_CONFIG = {...} — todo lo específico de la pieza
    assets/
      target.jpg       imagen plana que MindAR rastrea (buen contraste/detalle)
      targets.mind     tracking compilado (binario, generado — ver tools/mind-compiler)
      overlay.png      capa transparente principal (etiquetas / rayos X / etc.)
      ...              otros assets propios de esa pieza (extras[], hotspots, etc.)
  tools/
    mind-compiler/      script para generar targets.mind (ver su README)
```

## Añadir una pieza nueva

1. `cp -r Inmaculada_Concepción NUEVA` (o `escapulario`, el que tenga el layout más parecido)
2. Reemplaza `NUEVA/assets/target.jpg` por la imagen de la pieza nueva
3. Compila el tracking: `cd tools/mind-compiler && node compile.mjs ../../NUEVA/assets/target.jpg ../../NUEVA/assets/targets.mind`
4. Edita `NUEVA/config.js`: `titulo`, `overlay` (width/height/offsetX/offsetY — unidades MindAR, ancho de la pieza real = 1), `hotspots[]` (coords normalizadas 0..1 sobre el overlay), `extras[]` si hay paneles adicionales al costado
5. Agrega la tarjeta en `index.html` (raíz)
6. Prueba en un celular real (HTTPS obligatorio para cámara) antes de dar por cerrada la pieza

## Layouts de overlay (varían por pieza — decidir cuál aplica a cada una nueva)

- **Etiquetas alrededor** (Inmaculada_Concepción): overlay transparente, sin la pieza dibujada, con hotspots que apuntan a zonas de la pintura real.
- **Panel al costado** (escapulario): el overlay trae la pieza + rayos X posicionados para calzar SOBRE la obra real, y paneles extra (microscopía, tablas) quedan al costado, fuera del área rastreada.
- **Toggle antes/después** (candelabros): overlay principal alineado sobre la pieza (ej. fluorescencia UV) + `extras[]` con comparativas sin/con efecto.
- **Crossfade** (piezas sin asset transparente, solo ORIGINAL+ANALISIS compuestos): mezclar con shader/opacidad en vez de superponer capas.
- **Capas que salen de la obra** (MALTA): cada capa lleva `anim` y recorre su
  propia ventana dentro del revelado, saliendo de la obra original hacia su
  posición final. Escalonando los `delay` salen una tras otra.

### `anim` — animación por capa (opcional)

Cualquier capa (`overlay` o un `extras[]`) acepta `anim`. **Sin `anim` la capa se
comporta como siempre** (opacidad = revelado global), así que las piezas viejas
no se tocan.

```js
extras: [
  { src: "assets/analisis1.png", width: 0.5, height: 0.5,
    offsetX: -1.1, offsetY: 0.6,        // destino
    anim: {
      delay: 0.10,      // en unidades de REVELADO (0..1), no en segundos
      duration: 0.40,   // cuánto del revelado ocupa esta capa
      fromX: 0,         // origen; 0,0 = centro de la obra original (default)
      fromY: 0,
      fromScale: 0.25   // 1 = ya a tamaño final; <1 = crece al salir
    } }
]
```

Los tiempos van en unidades de revelado, no en segundos: así el slider **scrubea**
la animación (la arrastrás y ves salir las capas) y el botón toggle la reproduce
entera. Escalonar = repartir los `delay` (0.10 / 0.30 / 0.50 con `duration` 0.40
da una cascada de tres).

Regla aprendida: si el proveedor de assets ya entrega una capa transparente
recortada, usarla tal cual — no reconstruir manualmente desde la radiografía
cruda. Alinear midiendo bounding boxes (silueta del original vs. componente del
asset) para calcular `width/offsetX/offsetY`, no a ojo.

## Compilar `targets.mind`

MindAR necesita un `.mind` compilado por imagen. Ya NO se hace a mano en la
web oficial — hay un script en `tools/mind-compiler/` que corre el mismo
compilador vía Chrome headless. Ver `tools/mind-compiler/README.md`.

## Decisiones por pieza (respuestas del equipo, ronda de dudas)

- **cerámica**: el target será **las letras sobre un cubo** (Calibri), archivo
  pendiente de entrega. ⚠️ Medido: texto liso da `tracking 29` vs 92 de
  Inmaculada al mismo tamaño — no alcanza solo. La cara necesita gráfica de alto
  contraste acompañando al texto (sube a 62, supera a candelabros). Ver
  `tools/mind-compiler/README.md`. Re-medir sobre el archivo real cuando llegue.
- **MALTA**: el Cristo del museo es **oscuro** de verdad (no es la foto). Por eso
  no se anima Cristo → Virgen sobre la obra: cada análisis **sale de la original**
  y se posiciona en el lugar de los 3 análisis entregados. Los rayos X **sí**
  tienen que calzar sobre el cuadro original.
- **san francisco de borja**: el equipo propone la **cara** (foto sin fondo) como
  target, para que la gente se pare enfrente a verlo y **escucharlo**. Avisan que
  la luz no es constante ahí y hay que probarlo. ⚠️ Riesgo: MindAR rastrea
  imágenes planas; una cara esculpida es 3D y con luz variable es el peor caso.
  Alternativa recomendada: usar como target el **panel plano impreso** que ya va
  junto a la pieza (el del QR) — plano, contraste constante, y cumple igual el
  objetivo (la experiencia es audio, no calce milimétrico).
- **wawapampay**: presentar **movimiento**: animar los personajes (desde el 3D o
  desde las fotos) simulando el baile, y al costado la música sonando con **la
  letra corriendo**, estilo efecto de música de historias de Instagram.
- **Transversal**: piden que algunas piezas "se presenten siempre,
  independientemente del target". Eso choca con el tracking de imagen (sin target
  no hay anclaje) y WebXR markerless no existe en iOS Safari. Salida: **modo
  pantalla** — cámara de fondo, contenido en espacio de pantalla, sin anclar.
  Aplica a wawapampay y borja; MALTA queda mixto (rayos X anclado, resto libre).

## Pendiente / próximos pasos

Capacidades que el motor **todavía no tiene** y que estas decisiones exigen:

1. ~~**Animación por capa**~~ — ✅ hecho, ver `anim` arriba. Falta probarlo en
   celular real y, sobre todo, **faltan los assets de MALTA** para armar la pieza.
2. **Audio** — no existe. Lo piden borja y wawapampay. Ojo: **iOS exige un gesto
   del usuario** para arrancar audio; hace falta botón de "toca para escuchar",
   no autoplay.
3. **Modo pantalla** — contenido sin anclar a target (ver Transversal arriba).
4. **Letras sincronizadas** — wawapampay; necesita timings por línea.

Assets:

- **Sin meshes 3D todavía**: san francisco de borja y Wawapampay solo tienen
  fotos de fotogrametría sin procesar (proyectos Agisoft vacíos). Flujo previsto:
  Metashape/RealityScan → Blender (decimate, bake, texturas ≤1024²) →
  gltf-transform (Draco/KTX2) → `<model-viewer>`.
- **MALTA**: casi sin material fuente (revelado tipo pentimento, Cristo → Virgen oculta).
- **Bichos / dolorosa**: necesitan animación (sprite sheet / video con alpha
  "stacked" three.js), assets aún no generados.
- Assets fuente sin procesar (fotos RAW, PSD, .zip de fotogrametría) NO viven en
  este repo por peso — se comparten aparte (Drive). Solo se commitea lo ya
  procesado para cada pieza (`assets/` final de cada carpeta).

## Convenciones

- Nunca commitear `node_modules/` (raíz `.gitignore` ya lo cubre para
  cualquier subcarpeta, incluido `tools/mind-compiler/`).
- Nombres de carpeta de pieza en minúsculas, sin espacios, mismo id que
  `config.js:id`.
- Probar SIEMPRE en celular real antes de considerar una pieza terminada —
  el emulador/desktop no valida tracking de cámara.
