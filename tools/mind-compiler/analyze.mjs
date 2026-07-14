/*  Analizador de calidad de targets (MindAR) — NO genera .mind, solo mide.
 *
 *  Compila una o más imágenes y reporta cuántos puntos de características
 *  extrae MindAR, que es lo que determina si un target va a rastrear bien:
 *
 *    - deteccion : puntos de matching (reconocer el target de cero, por frame)
 *    - tracking  : puntos de tracking (seguirlo una vez enganchado)
 *
 *  Más puntos = target más robusto. Pocos puntos = engancha tarde, se pierde
 *  al mover el celular, o directamente no detecta.
 *
 *  Uso:  node analyze.mjs <img1> [img2] [img3] ...
 */
import fs from "fs";
import path from "path";
import puppeteer from "puppeteer";

const imgPaths = process.argv.slice(2);
if (!imgPaths.length) {
  console.error("Uso: node analyze.mjs <img1> [img2] ...");
  process.exit(1);
}

const toDataUrl = (p) => {
  const buf = fs.readFileSync(p);
  const ext = path.extname(p).slice(1).toLowerCase();
  const mime = ext === "png" ? "image/png" : "image/jpeg";
  return `data:${mime};base64,${buf.toString("base64")}`;
};

const bundleUrl = "https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/dist/mindar-image.prod.js";

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--disable-setuid-sandbox"]
});

const results = [];
try {
  const page = await browser.newPage();
  await page.goto("https://cdn.jsdelivr.net/npm/mind-ar@1.2.5/", { waitUntil: "domcontentloaded" }).catch(() => {});
  await page.evaluate(async (url) => { await import(url); }, bundleUrl);
  await page.waitForFunction("window.MINDAR && window.MINDAR.IMAGE && window.MINDAR.IMAGE.Compiler", { timeout: 30000 });

  for (const p of imgPaths) {
    process.stdout.write(`Analizando ${path.basename(p)} ... `);
    const r = await page.evaluate(async (durl) => {
      const img = new Image();
      img.src = durl;
      await new Promise((res, rej) => { img.onload = res; img.onerror = rej; });

      const compiler = new window.MINDAR.IMAGE.Compiler();
      await compiler.compileImageTargets([img], () => {});
      const d = compiler.data[0];

      // Puntos de deteccion: por keyframe, maximos + minimos
      let deteccion = 0;
      const porKeyframe = [];
      for (const kf of (d.matchingData || [])) {
        const n = (kf.maximaPoints?.length || 0) + (kf.minimaPoints?.length || 0);
        deteccion += n;
        porKeyframe.push(n);
      }

      // Puntos de tracking: por nivel de escala
      let tracking = 0;
      const porNivel = [];
      for (const lvl of (d.trackingData || [])) {
        const n = lvl.points?.length || 0;
        tracking += n;
        porNivel.push(n);
      }

      return {
        w: img.width, h: img.height,
        deteccion, tracking,
        keyframes: porKeyframe.length,
        peorKeyframe: Math.min(...porKeyframe),
        mejorKeyframe: Math.max(...porKeyframe),
        niveles: porNivel
      };
    }, toDataUrl(p));

    r.nombre = path.basename(path.dirname(path.dirname(p))) || path.basename(p);
    r.archivo = path.basename(p);
    results.push(r);
    console.log(`deteccion=${r.deteccion}  tracking=${r.tracking}`);
  }
} finally {
  await browser.close();
}

// --- Reporte ---
console.log("\n" + "=".repeat(78));
console.log("CALIDAD DE TARGETS — MindAR");
console.log("=".repeat(78));
console.log(
  "target".padEnd(22) + "px".padEnd(12) +
  "deteccion".padStart(10) + "tracking".padStart(10) +
  "kf peor".padStart(10) + "kf mejor".padStart(10)
);
console.log("-".repeat(78));
for (const r of results) {
  console.log(
    (r.nombre + "/" + r.archivo).slice(0, 21).padEnd(22) +
    `${r.w}x${r.h}`.padEnd(12) +
    String(r.deteccion).padStart(10) +
    String(r.tracking).padStart(10) +
    String(r.peorKeyframe).padStart(10) +
    String(r.mejorKeyframe).padStart(10)
  );
}
console.log("-".repeat(78));
console.log("deteccion = reconocer el target de cero (lo critico para enganchar)");
console.log("tracking  = seguirlo ya enganchado");
console.log("kf peor   = el keyframe mas debil: manda cuando el usuario se aleja o ladea");
