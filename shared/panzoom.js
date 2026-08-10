/*  Zoom (pellizco/rueda) + arrastre de un `stage` de CWxCH px dentro de un
 *  `container`. Lo usan los pop-up de detalle que amplían una zona del
 *  infográfico (Florero, salvilla): el stage lleva las capas apiladas como
 *  <img> superpuestos y esto solo mueve/escala el conjunto.
 *
 *  fitBox(bbox) encuadra todo el marco (bbox nulo) o una región normalizada
 *  [x0,y0,x1,y1]. opts.skipSel: selector cuyos toques NO son gesto (la cabecera,
 *  los botones). opts.pad: cuánto del contenedor ocupa el encuadre (0.94 por
 *  defecto, deja un respiro alrededor).
 *
 *  OJO: `touch-action:none` tiene que estar en el CSS del elemento que recibe
 *  el gesto (el container Y el stage), no solo en un padre — no se hereda, y
 *  sin eso Chrome/Android se queda con el pellizco y cancela los eventos.
 */
export function PanZoom(container, stage, CW, CH, opts = {}) {
  const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
  let s = 1, tx = 0, ty = 0, fit = 1;
  const pad = opts.pad != null ? opts.pad : 0.94;
  const apply = () => { stage.style.transform = `translate(${tx}px,${ty}px) scale(${s})`; };
  function fitBox(bbox) {
    stage.style.width = CW + "px"; stage.style.height = CH + "px";
    const cw = container.clientWidth, ch = container.clientHeight;
    let bx0 = 0, by0 = 0, bw = CW, bh = CH;
    if (bbox) { bx0 = bbox[0] * CW; by0 = bbox[1] * CH; bw = (bbox[2] - bbox[0]) * CW; bh = (bbox[3] - bbox[1]) * CH; }
    fit = Math.min(cw / bw, ch / bh) * pad;
    s = fit; tx = cw / 2 - (bx0 + bw / 2) * s; ty = ch / 2 - (by0 + bh / 2) * s;
    apply();
  }
  const rect = () => container.getBoundingClientRect();

  const pts = new Map();
  let lastDist = 0, lastMid = { x: 0, y: 0 };
  container.addEventListener("pointerdown", (e) => {
    if (opts.skipSel && e.target.closest && e.target.closest(opts.skipSel)) return;
    container.setPointerCapture && container.setPointerCapture(e.pointerId);
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) { const [a, b] = [...pts.values()]; lastDist = Math.hypot(a.x - b.x, a.y - b.y); lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  });
  container.addEventListener("pointermove", (e) => {
    if (!pts.has(e.pointerId)) return;
    const prev = pts.get(e.pointerId);
    if (pts.size === 1) { tx += e.clientX - prev.x; ty += e.clientY - prev.y; apply(); }
    pts.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pts.size === 2) {
      const [a, b] = [...pts.values()];
      const d = Math.hypot(a.x - b.x, a.y - b.y), mid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
      const ns = clamp(s * (d / (lastDist || d)), fit * 0.6, fit * 12);
      tx = mid.x - (mid.x - tx) * (ns / s) + (mid.x - lastMid.x);
      ty = mid.y - (mid.y - ty) * (ns / s) + (mid.y - lastMid.y);
      s = ns; lastDist = d; lastMid = mid; apply();
    }
  });
  const up = (e) => {
    if (!pts.has(e.pointerId)) return;
    pts.delete(e.pointerId);
    if (pts.size === 2) { const [a, b] = [...pts.values()]; lastDist = Math.hypot(a.x - b.x, a.y - b.y); lastMid = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 }; }
  };
  container.addEventListener("pointerup", up);
  container.addEventListener("pointercancel", up);
  container.addEventListener("wheel", (e) => {
    e.preventDefault();
    const ns = clamp(s * (1 - e.deltaY * 0.0015), fit * 0.6, fit * 12);
    const r = rect();
    tx = (e.clientX - r.left) - ((e.clientX - r.left) - tx) * (ns / s);
    ty = (e.clientY - r.top) - ((e.clientY - r.top) - ty) * (ns / s);
    s = ns; apply();
  }, { passive: false });

  return { fitBox };
}
