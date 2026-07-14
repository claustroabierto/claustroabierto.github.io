/* Verifica el motor de pantalla end-to-end: que cargue sin errores, que NO
 * descargue three/MindAR, que los sprites animen y — lo importante — que la
 * letra siga al audio de verdad, comparando contra los timings del config.
 */
import puppeteer from "puppeteer";
import http from "http";
import fs from "fs";
import path from "path";

import { fileURLToPath } from "url";
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "../..");
const MIME = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css",
               ".m4a": "audio/mp4", ".png": "image/png" };
// OJO: hay que soportar Range. Sin eso los <audio>/<video> no pueden hacer seek
// y el test daria un falso positivo (todas las muestras en t=0). GitHub Pages
// si soporta Range, asi que esto ademas imita mejor produccion.
const srv = http.createServer((req, res) => {
  const f = path.join(ROOT, req.url.split("?")[0]);
  if (!fs.existsSync(f) || fs.statSync(f).isDirectory()) { res.writeHead(404); return res.end(); }
  const size = fs.statSync(f).size;
  const tipo = MIME[path.extname(f)] || "application/octet-stream";
  const range = req.headers.range;
  if (range) {
    const m = /bytes=(\d*)-(\d*)/.exec(range);
    const ini = m[1] ? parseInt(m[1]) : 0;
    const fin = m[2] ? parseInt(m[2]) : size - 1;
    res.writeHead(206, {
      "Content-Type": tipo, "Accept-Ranges": "bytes",
      "Content-Range": `bytes ${ini}-${fin}/${size}`,
      "Content-Length": fin - ini + 1
    });
    return fs.createReadStream(f, { start: ini, end: fin }).pipe(res);
  }
  res.writeHead(200, { "Content-Type": tipo, "Accept-Ranges": "bytes", "Content-Length": size });
  fs.createReadStream(f).pipe(res);
});
await new Promise((r) => srv.listen(8098, r));

const browser = await puppeteer.launch({
  headless: "new",
  args: ["--no-sandbox", "--use-fake-ui-for-media-stream", "--use-fake-device-for-media-stream",
         "--autoplay-policy=no-user-gesture-required"]
});
const page = await browser.newPage();
const errs = [], pedidos = [];
page.on("pageerror", (e) => errs.push("pageerror: " + e.message));
page.on("request", (r) => pedidos.push(r.url()));
// El motor crea el audio con `new Audio()` y no lo mete al DOM, asi que no se
// puede seleccionar. Lo capturamos envolviendo el constructor ANTES de cargar.
// Asi medimos contra audio.currentTime real y no contra un reloj de pared.
await page.evaluateOnNewDocument(() => {
  const Orig = window.Audio;
  window.Audio = function (...a) { const el = new Orig(...a); window.__audio = el; return el; };
  window.Audio.prototype = Orig.prototype;
});
await page.goto("http://localhost:8098/pruebas/wawapampay/index.html", { waitUntil: "networkidle0" });

console.log("1. CARGA");
console.log(errs.length ? "   ✗ " + errs.join("\n   ✗ ") : "   ✓ sin errores de JS");
const pesados = pedidos.filter((u) => /three|mindar/i.test(u));
console.log(`   ${pesados.length === 0 ? "✓ NO descarga three.js ni MindAR" : "✗ descargo: " + pesados.join(", ")}`);
console.log(`   ${await page.$("#camara") ? "✓" : "✗"} elemento de camara creado`);

console.log("\n2. SPRITES");
const sp = await page.evaluate(() => {
  const ps = [...document.querySelectorAll(".personaje")];
  return ps.map((p) => {
    const s = getComputedStyle(p);
    return { anim: s.animationName, dur: s.animationDuration, timing: s.animationTimingFunction,
             w: Math.round(p.getBoundingClientRect().width), h: Math.round(p.getBoundingClientRect().height) };
  });
});
sp.forEach((s, i) => console.log(`   personaje ${i}: ${s.anim} · ${s.dur} · ${s.timing.slice(0, 14)} · ${s.w}x${s.h}px`));
console.log(`   ${sp.length === 2 && sp.every((s) => s.anim === "sprite" && s.w > 0) ? "✓ ambos animan con tamano real" : "✗ sprites mal"}`);

console.log("\n3. LETRA SINCRONIZADA (lo importante)");
const CFG = await page.evaluate(() => window.MUSEO_CONFIG.letras);
await page.evaluate(() => document.getElementById("btn-audio").click());
await new Promise((r) => setTimeout(r, 400));

// Muestrea la linea activa contra el currentTime REAL del audio, incluyendo
// saltos (seek) para probar momentos exactos alrededor de cada cambio.
const traza = await page.evaluate(async (letras) => {
  const out = [];
  const activa = () => document.querySelector("#letras .linea.activa")?.textContent ?? null;
  const esperada = (t) => {
    let x = null;
    for (const l of letras) if (t >= l.t) x = l.txt; else break;
    return x;
  };
  const a = window.__audio;
  // PAUSA antes de muestrear: si sigue reproduciendo, currentTime avanza durante
  // la espera y las muestras caen sobre el limite entre lineas, midiendo un
  // empate de milisegundos en vez del comportamiento. El rAF del motor corre
  // igual con el audio pausado, asi que la lectura es valida y determinista.
  a.pause();
  // Momentos justo antes y despues de cada cambio de linea: lo mas exigente.
  const puntos = letras.flatMap((l) => [l.t - 0.15, l.t + 0.15]).filter((t) => t > 0);
  for (const t of puntos) {
    a.currentTime = t;
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    await new Promise((r) => setTimeout(r, 60));
    const real = a.currentTime;
    out.push({ t: +real.toFixed(2), pedido: +t.toFixed(2), activa: activa(), esperada: esperada(real) });
  }
  return out;
}, CFG);

// GUARDA: si los saltos no se aplican, todas las muestras caen en el mismo
// instante y el test acertaria sin probar nada. Antes paso exactamente eso.
const saltoOk = traza.every((r) => Math.abs(r.t - r.pedido) < 0.25);
const distintos = new Set(traza.map((r) => r.t)).size;
console.log(`   salto de audio: ${distintos} instantes distintos muestreados`);
if (!saltoOk || distintos < traza.length - 1) {
  console.log("   ✗ LOS SALTOS NO SE APLICAN — el test no esta probando nada (falso positivo)");
  traza.forEach((r) => console.log(`      pedido ${r.pedido}s -> quedo en ${r.t}s`));
  await browser.close(); srv.close(); process.exit(1);
}

const comp = traza.filter((r) => r.esperada !== null);
const aciertos = comp.filter((r) => r.activa === r.esperada).length;
console.log("\n   t(s)   linea activa                      esperada");
traza.forEach((r) => {
  const m = r.activa === r.esperada ? "✓" : "✗";
  console.log(`   ${m} ${String(r.t).padEnd(6)} ${String(r.activa).slice(0, 32).padEnd(34)} ${String(r.esperada).slice(0, 30)}`);
});
console.log(`\n   ${aciertos}/${comp.length} muestras con la linea correcta`);
console.log(`   ${aciertos === comp.length ? "✓ la letra sigue al audio EXACTO en cada cambio" : "✗ la letra NO sincroniza"}`);

const vis = await page.evaluate(() => getComputedStyle(document.getElementById("letras")).opacity);
console.log(`   ${vis === "1" ? "✓" : "✗"} la letra es visible al sonar (opacity ${vis})`);

await browser.close();
srv.close();
