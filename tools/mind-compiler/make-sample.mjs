/*  Genera muestras sinteticas de target para probar calidad de tracking.
 *  Renderiza HTML con Chrome headless -> PNG.  Uso: node make-sample.mjs
 */
import puppeteer from "puppeteer";

const TEXTO = `CERÁMICA
DE AYACUCHO

Monasterio de Carmelitas
Descalzas · Santa Teresa

Un claustro abierto al
mundo a través del arte`;

// Sans humanista tipo Calibri (Calibri no existe en macOS; Avenir es el analogo
// mas cercano: humanista, trazo suave, bordes redondeados).
const muestras = [
  {
    nombre: "sample-texto-solo.png",
    desc: "Solo texto liso — lo que describieron",
    html: `<div style="width:800px;height:800px;background:#fff;display:flex;
      align-items:center;justify-content:center;font-family:Avenir,Helvetica,sans-serif;
      font-size:44px;line-height:1.5;color:#111;text-align:center;white-space:pre;
      letter-spacing:0.5px">${TEXTO}</div>`
  },
  {
    nombre: "sample-texto-rico.png",
    desc: "Texto + grafica de alto contraste — la alternativa",
    html: `<div style="width:800px;height:800px;background:#fff;position:relative;
      font-family:Avenir,Helvetica,sans-serif;overflow:hidden">
      <div style="position:absolute;inset:0;background:
        repeating-linear-gradient(45deg,#111 0 18px,#fff 0 36px);opacity:.14"></div>
      <div style="position:absolute;top:40px;left:40px;width:150px;height:150px;
        background:#111;clip-path:polygon(50% 0,100% 38%,82% 100%,18% 100%,0 38%)"></div>
      <div style="position:absolute;top:40px;right:40px;width:150px;height:150px;
        border:14px solid #111;border-radius:50%;
        background:conic-gradient(#111 0 25%,#fff 0 50%,#111 0 75%,#fff 0)"></div>
      <div style="position:absolute;bottom:40px;left:40px;width:150px;height:150px;
        background:conic-gradient(from 45deg,#111 0 25%,#fff 0 50%,#111 0 75%,#fff 0)"></div>
      <div style="position:absolute;bottom:40px;right:40px;width:150px;height:150px;
        background:#111;border-radius:50% 0 50% 0"></div>
      <div style="position:absolute;inset:0;display:flex;align-items:center;
        justify-content:center;font-size:44px;line-height:1.5;color:#111;
        text-align:center;white-space:pre;font-weight:600">${TEXTO}</div>
    </div>`
  }
];

const browser = await puppeteer.launch({ headless: "new", args: ["--no-sandbox"] });
const page = await browser.newPage();
await page.setViewport({ width: 800, height: 800, deviceScaleFactor: 1 });
for (const m of muestras) {
  await page.setContent(`<body style="margin:0">${m.html}</body>`);
  await page.screenshot({ path: m.nombre });
  console.log(`OK -> ${m.nombre}  (${m.desc})`);
}
await browser.close();
