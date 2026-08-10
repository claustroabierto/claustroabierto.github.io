/*  Compilador automático de targets.mind (MindAR) vía Chrome headless.
 *  Uso:  node compile.mjs <imagen> [imagen2 ...] <salida.mind>
 *  Corre el MISMO compilador que la herramienta web oficial, sin build nativo.
 *
 *  VARIOS TARGETS en un mismo .mind: pasa varias imágenes. Sirve para que una
 *  pieza se reconozca en más de una condición (p. ej. la foto de estudio Y una
 *  foto tomada en sala con la luz y el ángulo reales, que es lo que de verdad
 *  ve el celular del visitante). El orden importa: la imagen 1 es el ancla 0,
 *  la 2 el ancla 1, etc. Si comparten el MISMO recorte, ambas anclas usan la
 *  misma geometría y basta con duplicar el contenido en el motor.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const outPath = args.pop();
const imgPaths = args;
if (!imgPaths.length || !outPath) {
  console.error("Uso: node compile.mjs <imagen> [imagen2 ...] <salida.mind>");
  process.exit(1);
}

const dataUrls = imgPaths.map((p) => {
  const ext = path.extname(p).slice(1).toLowerCase();
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${fs.readFileSync(p).toString("base64")}`;
});

// El bundle es un ES module con imports a chunks hermanos -> se carga como
// módulo desde el CDN (necesita una página http real, no about:blank/data).
const bundleUrl = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});
try {
  const page = await browser.newPage();
  page.on("console", (m) => process.stdout.write("  [page] " + m.text() + "\n"));
  page.on("pageerror", (e) => process.stdout.write("  [pageerror] " + e.message + "\n"));
  // Página con origen http para permitir módulos cross-origin del CDN
  await page.goto("https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/", { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.evaluate(async (url) => {
    await import(url);
  }, bundleUrl);
  await page.waitForFunction("window.MINDAR && window.MINDAR.IMAGE && window.MINDAR.IMAGE.Compiler", { timeout: 30000 });

  console.log("Compilando " + imgPaths.map((p) => path.basename(p)).join(" + ") + " ...");
  const b64 = await page.evaluate(async (durls) => {
    const imgs = await Promise.all(durls.map((durl) => new Promise((res, rej) => {
      const img = new Image();
      img.onload = () => res(img); img.onerror = rej;
      img.src = durl;
    })));
    const compiler = new window.MINDAR.IMAGE.Compiler();
    const list = await compiler.compileImageTargets(imgs, (p) => console.log("progreso: " + p.toFixed(1) + "%"));
    // cuántos puntos saca cada target: sirve para comparar recortes/fotos
    list.forEach((t, i) => {
      const n = (t.matchingData || []).reduce((a, m) => a + (m.maximaPoints || []).length + (m.minimaPoints || []).length, 0);
      console.log(`target ${i}: ${imgs[i].naturalWidth}x${imgs[i].naturalHeight} · ${n} puntos de detección`);
    });
    const buffer = await compiler.exportData();
    // buffer es ArrayBuffer/Uint8Array -> base64
    const bytes = new Uint8Array(buffer);
    let bin = "";
    for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]);
    return btoa(bin);
  }, dataUrls);

  fs.writeFileSync(outPath, Buffer.from(b64, "base64"));
  console.log("OK -> " + outPath + " (" + fs.statSync(outPath).size + " bytes)");
} finally {
  await browser.close();
}
