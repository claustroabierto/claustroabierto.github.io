# Museo Ayacucho · RA (WebAR) — guía técnica

Motor único reutilizable (MindAR + three.js). Cada pieza = una carpeta en `piezas/`
con su `index.html` + `config.js` + `assets/`. El motor está en `shared/`.

## 1. Generar el archivo de tracking `targets.mind` (una vez por pieza)

MindAR necesita un `.mind` compilado desde la imagen objetivo.

**Opción rápida (recomendada, 2 min):**
1. Abre el compilador oficial: https://hiukim.github.io/mind-ar-js-doc/tools/compile
2. Arrastra `piezas/inmaculada/assets/target.jpg` (ya está lista, 1100px).
3. Pulsa **Start** y espera. Descarga el `targets.mind`.
4. Cópialo a `piezas/inmaculada/assets/targets.mind`.

Consejo de calidad: el objetivo rastrea mejor con imágenes de **mucho detalle y
contraste** (esta pintura es ideal). Si el museo mueve/re-cuelga la obra, el target
sigue valiendo mientras la pintura no cambie.

## 2. Probar en local (con tu celular en la misma red)

WebAR exige **HTTPS** para la cámara. Para probar en el teléfono desde tu PC:

```bash
# desde la carpeta museo-ar/
npx --yes http-server -S -C cert.pem -K key.pem -p 8443
```
…o más simple, súbelo directo a GitHub Pages (ya es HTTPS) y escanéalo.
En escritorio (Chrome) puedes probar la carga apuntando a `localhost` sin HTTPS,
pero el tracking real necesita la cámara del móvil.

## 3. Publicar en GitHub Pages (gratis, URL permanente)

1. Crea una cuenta GitHub dedicada al museo (ej. usuario `museoayacucho`).
   La URL saldrá de ese **usuario**, no del correo (usa un correo estable/compartido).
2. Repo público `museo-ar` → sube el contenido de esta carpeta.
3. Settings → Pages → Deploy from branch `main` / root.
4. Cada pieza queda en:  `https://museoayacucho.github.io/museo-ar/piezas/inmaculada/`
5. Genera el QR de esa URL (cualquier generador de QR) y ese es el que va junto a la obra.

> Si el museo tiene dominio propio, se apunta por CNAME y el QR usa el dominio.
> Si algún `.glb`/video pesa mucho, se sirve por jsDelivr (CDN gratis sobre el repo).

## 4. Añadir una pieza nueva

```bash
cp -r piezas/inmaculada piezas/NUEVA
# edita piezas/NUEVA/config.js  (título, hotspots, overlay)
# reemplaza assets/ (target.jpg, overlay.png, targets.mind)
```

## Estructura de overlay / hotspots
- `config.overlay`: alinea la capa de "características flotantes" sobre la pintura.
  `width/height` en unidades MindAR (ancho de la pintura = 1); `offsetX/Y` centran.
- `config.hotspots[]`: coordenadas **normalizadas 0..1** sobre la imagen del overlay
  (x izq→der, y arriba→abajo). Fáciles de reajustar a ojo si algún ● queda corrido.
