# Archivo — código retirado

Nada de acá se usa en el sitio y **nada lo enlaza**. Se conserva como historial
de lo que se probó y porque hay soluciones reutilizables a futuro.

Si algo de esto vuelve a hacer falta, está entero: son archivos completos, no
recortes.

---

## `marcadores-ra/` — la etapa de los marcadores impresos

**Qué era.** Cuatro piezas (Florero, salvilla, relicario, Candelabros) no se
podían rastrear por su propia foto: el objeto brilla, tiene volumen o se mueve
en la vitrina. La solución fue imprimir un **marcador** aparte (una tarjeta con
las letras "RA" y un número: RA2, RA6, RA7, RA8) y anclar el análisis a él.

**Por qué se retiró.** Los marcadores de letras solas dan muy pocos puntos de
reconocimiento. Medido con el compilador real de MindAR: **~379–651 puntos**,
contra **1832** que es el piso conocido que funciona bien. En la práctica eso
significaba detección floja, tracking que tiembla o se tuerce, y el contenido
salía del tamaño con que se hubiera impreso el marcador (una impresión a 3 cm
en vez de la prevista dejaba el análisis diminuto).

Se reemplazó por el enfoque de `shared/no-target-ar.js`: **sin rastreo**, el
contenido flota fijo sobre la cámara en vivo y se dimensiona solo para llenar
la pantalla. Se acabaron los tres problemas de una.

Contenido:

| Archivo | Qué es |
|---|---|
| `prueba-ra6/` | Banco de pruebas: ¿el RA6 pelado alcanza para detectar? |
| `marcador-engine.js` | Motor genérico para piezas ancladas a un marcador impreso |
| `comprobador/` | Herramienta que mide los puntos de detección de una imagen con el compilador real de MindAR. **Sigue siendo útil**: sirve para evaluar cualquier futuro image target. |
| `assets/<pieza>/` | Los marcadores impresos (RA6/RA7/RA8.png), sus versiones compiladas y las variantes densas que se probaron |

**Lección que conviene no perder:** los PNG de los marcadores vienen con fondo
**transparente**. Hay que aplanarlos sobre blanco antes de compilar el `.mind`,
si no el target sale roto. Y un marcador **denso** (con una foto o patrón en la
cara, no solo letras) detecta bastante mejor.

---

## `alineacion-marcadores/` — herramientas de encuadre a mano

Páginas para ubicar el overlay sobre la pieza arrastrando y escalando en vivo,
que copiaban los valores listos para pegar en el `config.js`. La regla del
proyecto era **no tantear números a ojo**, y estas lo resolvían.

**Por qué se retiraron.** Estas tres (Florero, salvilla, relicario) leen
`CFG.targetPreview`, que era la foto del marcador. Al sacar los marcadores ese
campo dejó de existir en sus configs, así que **estas tres quedaron rotas**.

⚠ Las de las otras piezas **siguen vivas y funcionando** en sus carpetas, porque
esas piezas sí rastrean la obra real: `Inmaculada_Concepcion/align.html`,
`Palio_de_Filipinas/uv.html` y `editor.html`,
`Virgen_de_la_Soledad/ajuste.html`, `Extasis_de_Santa_Teresa/posiciones.html`.

Si alguna vez hace falta reencuadrar Florero, salvilla o relicario, el patrón
para adaptarlas está acá.

---

## `previsualizacion/` — ver las piezas sin cámara ni marcador

**Qué era.** `preview-stub.js` reemplaza a MindAR con la misma API mínima, así
que **el motor real de cada pieza corre sin modificar**: en vez de esperar la
cámara, "detecta" al instante y pone de fondo la foto de la obra. Servía para
revisar textos, animaciones y posiciones desde la computadora, sin celular ni
imprimir nada.

**Por qué se retiró.** Con las piezas ya sin marcador, abrir la pieza real es
igual de directo. Además `indice.html` (el índice que las listaba) apuntaba a
rutas que ya no existen.

El truco de fondo es reutilizable: **sustituir una dependencia pesada por un
doble que respeta su API**, para poder probar sin el hardware.

---

## Qué NO está acá

- `qrs_museo.zip` y `qr-codes/` siguen en la raíz: se usan.
- `tools/qr-generator/` y `tools/mind-compiler/` siguen en `tools/`: se usan.
- `demo-creditos.html` sigue en la raíz: sirve para comparar tamaños de logo y
  ubicación de créditos. Se puede archivar cuando esté cerrado el tema.
