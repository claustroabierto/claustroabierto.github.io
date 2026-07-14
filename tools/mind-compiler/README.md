# Compilador de `targets.mind`

Genera el archivo de tracking que MindAR necesita para reconocer cada pieza,
usando el mismo compilador que la herramienta web oficial pero por línea de
comandos (Chrome headless vía Puppeteer, sin subir nada a internet).

## Setup (una vez)

```bash
cd tools/mind-compiler
npm install
```

## Uso

```bash
node compile.mjs <imagen_target.jpg> <salida/targets.mind>
```

Ejemplo real:

```bash
node compile.mjs ../../Inmaculada_Concepción/assets/target.jpg ../../Inmaculada_Concepción/assets/targets.mind
```

La imagen debe ser el target plano de la pieza (buen contraste y detalle;
~1000-1200px de lado mayor). El script descarga el compilador de MindAR desde
jsDelivr en tiempo de ejecución, así que requiere conexión a internet.

## Medir la calidad de un target (antes de comprometerse)

`analyze.mjs` compila una o más imágenes y reporta cuántos puntos de
características extrae MindAR, sin generar el `.mind`. Sirve para decidir si una
imagen candidata va a rastrear bien **antes** de producir assets o mandar a
imprimir.

```bash
node analyze.mjs <img1> [img2] ...
node analyze.mjs ../../escapulario/assets/target.jpg    # una pieza que ya funciona
```

Reporta por target:

- **deteccion** — puntos de matching: reconocer el target de cero. Es lo crítico
  para que enganche.
- **tracking** — puntos de tracking: seguirlo una vez enganchado.
- **kf peor** — el keyframe más débil. Es el que manda cuando el usuario se aleja
  o ladea el celular, o sea el que rompe la experiencia en sala.

### Referencia (piezas en producción)

| target | px | deteccion | tracking | kf peor |
|---|---|---|---|---|
| Inmaculada_Concepción | 1100x1553 | 4505 | 88 | 86 |
| escapulario | 1000x1378 | 3794 | 72 | 117 |
| candelabros | 1000x2015 | 1832 | 54 | 57 |

candelabros es el piso conocido que **sí** funciona: `tracking 54`. Un candidato
muy por debajo de eso es señal de alarma.

Ojo al comparar: el conteo sube con el área de la imagen, así que compará a
igualdad de megapíxeles. Inmaculada reescalada a 0.64MP (673x950) mantiene
`deteccion 3530 / tracking 92` — casi no baja. Si un candidato del mismo tamaño
saca mucho menos, el problema es el target, no la resolución.

### Hallazgo: el texto liso no alcanza como target

Medido con `make-sample.mjs` (genera muestras sintéticas de cara de cubo), a
igualdad de área (0.64MP):

| muestra | deteccion | tracking | kf peor |
|---|---|---|---|
| solo texto (sans humanista) | 1490 | 29 | 27 |
| texto + gráfica de alto contraste | 2335 | 62 | 42 |

Solo texto da `tracking 29` — la mitad de candelabros y 3.2x menos que Inmaculada
al mismo tamaño. El texto es mal target por diseño: trazo suave, poco contraste
y sobre todo **se repite a sí mismo** (el emparejador confunde una letra con otra
igual).

Agregarle gráfica de alto contraste a la misma cara **duplica el tracking (29 ->
62)** y supera a candelabros. Conclusión: el texto puede ir, pero no puede cargar
el tracking solo — la cara necesita ornamento, patrón geométrico o logo.

Pendiente de medir: una cara de cubo es un plano de un objeto 3D. MindAR rastrea
imágenes planas; el efecto de la geometría del cubo se suma a lo anterior y no
está cuantificado acá.
