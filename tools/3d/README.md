# Pipeline 3D (fotogrametría → model-viewer + AR iOS)

Sin Blender. Para un OBJ de fotogrametría con **color por vértice** y **atlas UV**
(como `Copia de borja.obj`, ~2M triángulos). Requiere `npm i` aquí y puppeteer
(está en `../mind-compiler/node_modules`; correr los `*.mjs` con puppeteer desde ahí
o instalarlo). Los pasos escriben en `/tmp/rp`.

1. **parse-tex.mjs** `<obj>` → binarios (pos/uv/col/idx) en `/tmp/rp/borja-geo`.
   Vértices únicos (posición,uv); color por posición.
2. **bake.mjs** → hornea el color de vértice a `/tmp/rp/borja-tex.jpg` (4096², usa el
   atlas UV; grado de brillo + relleno de costuras). Material final = **unlit** (la luz
   ya está en la foto).
3. **build-tex.mjs** → GLB texturizado + rotación (-90° X para pararlo) + `simplify`
   (meshopt) + Draco. Saca `borja.glb` (HI ~500k tri) y `borja-lo.glb` (para USDZ).
4. **usdz.mjs** → `borja.usdz` desde `borja-lo.glb` con la textura como **emissive**
   (se ve a plena luz en Quick Look de iOS). `model-viewer` usa `ios-src` = ese USDZ.

Reutilizable para **Wawapampay** cuando llegue su mesh.
