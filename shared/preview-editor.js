/*  EDITOR DE CÍRCULOS (solo en preview, no en producción) — deja arrastrar y
 *  redimensionar los aros/hotspots encima de la foto real, y copiar las
 *  coordenadas resultantes listas para pegar en config.js.
 *
 *  Funciona con los dos formatos que usan las piezas:
 *   - CFG.hotspots (normalizado 0..1 sobre CFG.overlay) -> relicario,
 *     escapulario, Inmaculada (vía shared/ar-engine.js).
 *   - CFG.microscopias (x,y directos en unidades locales) -> Éxtasis de
 *     Santa Teresa.
 *
 *  Botón "Ver animación" (por defecto) = todo normal, como en producción.
 *  Botón "Editar círculos" = pausa nada, pero superpone círculos HTML
 *  arrastrables/redimensionables sobre la posición real de cada aro.
 */
import * as THREE from "three";

function fmt(n) { return Math.round(n * 1000) / 1000; }

function waitFor(check, cb) {
  const t = setInterval(() => { if (check()) { clearInterval(t); cb(); } }, 150);
}

waitFor(() => window.MUSEO_CONFIG && window.__previewMindAR && window.__previewAnchors && window.__previewAnchors[0], init);

function init() {
  const CFG = window.MUSEO_CONFIG;
  const mindar = window.__previewMindAR;
  const anchorGroup = window.__previewAnchors[0].group;

  let items, mode; // mode: "hotspots" | "microscopias"
  if (Array.isArray(CFG.hotspots) && CFG.hotspots.length && CFG.overlay) {
    items = CFG.hotspots; mode = "hotspots";
  } else if (Array.isArray(CFG.microscopias) && CFG.microscopias.length) {
    items = CFG.microscopias; mode = "microscopias";
  } else {
    return; // esta pieza no tiene círculos editables
  }
  const OV = CFG.overlay;

  function toWorld(item) {
    if (mode === "hotspots") {
      return { lx: OV.offsetX + (item.x - 0.5) * OV.width, ly: OV.offsetY + (0.5 - item.y) * OV.height };
    }
    return { lx: item.x, ly: item.y };
  }
  function fromWorld(lx, ly) {
    if (mode === "hotspots") {
      return { x: fmt(0.5 + (lx - OV.offsetX) / OV.width), y: fmt(0.5 - (ly - OV.offsetY) / OV.height) };
    }
    return { x: fmt(lx), y: fmt(ly) };
  }

  const defaultSize = mode === "microscopias" ? 0.07 : (window.location.pathname.includes("relicario") ? 0.08 : 0.07);

  // Estado editable en vivo (arranca igual al config actual).
  const state = items.map((it) => {
    const w = toWorld(it);
    return { lx: w.lx, ly: w.ly, size: it.size || defaultSize, color: it.color || "#c9a24b", titulo: it.titulo || "" };
  });

  // --- UI: botón de modo + panel ---
  const toggleBtn = document.createElement("button");
  toggleBtn.textContent = "🔧 Editar círculos";
  toggleBtn.style.cssText = "position:fixed;right:8px;bottom:44px;z-index:99998;background:#171320e6;color:#f4efe6;border:1px solid #c9a24b88;border-radius:20px;padding:8px 12px;font:700 11px system-ui,sans-serif";
  document.body.appendChild(toggleBtn);

  const panel = document.createElement("div");
  panel.style.cssText = "display:none;position:fixed;left:8px;right:8px;bottom:80px;z-index:99997;background:#0d0b12f2;color:#f4efe6;border:1px solid #c9a24b55;border-radius:12px;padding:10px;font:11px/1.5 ui-monospace,Consolas,monospace;max-height:32vh;overflow:auto";
  document.body.appendChild(panel);

  // El panel tapaba los círculos de abajo (pidieron poder ocultarlo sin salir
  // del modo edición) — este botón lo esconde/muestra, aparte de "Editar círculos".
  const panelToggleBtn = document.createElement("button");
  panelToggleBtn.textContent = "📋 Ocultar panel";
  panelToggleBtn.style.cssText = "display:none;position:fixed;right:8px;bottom:80px;z-index:99998;background:#171320e6;color:#f4efe6;border:1px solid #c9a24b88;border-radius:20px;padding:6px 10px;font:700 11px system-ui,sans-serif";
  document.body.appendChild(panelToggleBtn);
  let panelHidden = false;
  panelToggleBtn.addEventListener("click", () => {
    panelHidden = !panelHidden;
    panelToggleBtn.textContent = panelHidden ? "📋 Mostrar panel" : "📋 Ocultar panel";
    render();
  });

  const hint = document.createElement("div");
  hint.style.cssText = "position:fixed;left:8px;top:60px;z-index:99997;background:#171320e6;color:#f4efe6;border-radius:8px;padding:6px 10px;font:11px system-ui,sans-serif;display:none";
  hint.textContent = "Arrastrá el centro para mover · arrastrá el punto del borde para agrandar/achicar";
  document.body.appendChild(hint);

  // --- Círculos DOM (uno + su handle de tamaño, por item) ---
  const layer = document.createElement("div");
  layer.style.cssText = "position:fixed;inset:0;z-index:99996;pointer-events:none;display:none";
  document.body.appendChild(layer);

  const nodes = state.map((s, i) => {
    const c = document.createElement("div");
    c.style.cssText = `position:absolute;border:2px solid ${s.color};border-radius:50%;pointer-events:auto;cursor:grab;box-shadow:0 0 0 1px #000a;display:flex;align-items:center;justify-content:center`;
    c.title = s.titulo;
    const label = document.createElement("span");
    label.textContent = String(i + 1);
    label.style.cssText = "color:#fff;font:700 11px system-ui,sans-serif;text-shadow:0 1px 3px #000;pointer-events:none";
    c.appendChild(label);

    const handle = document.createElement("div");
    handle.style.cssText = `position:absolute;width:12px;height:12px;border-radius:50%;background:${s.color};border:2px solid #fff;cursor:nwse-resize;pointer-events:auto`;
    layer.appendChild(c);
    layer.appendChild(handle);
    return { c, handle };
  });

  let active = false;

  function project(lx, ly) {
    const v = new THREE.Vector3(lx, ly, 0.03);
    v.project(mindar.camera);
    const w = mindar.renderer.domElement.clientWidth, h = mindar.renderer.domElement.clientHeight;
    return { x: (v.x * 0.5 + 0.5) * w, y: (-v.y * 0.5 + 0.5) * h };
  }
  const raycaster = new THREE.Raycaster();
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), -0.03);
  function screenToWorld(px, py) {
    const w = mindar.renderer.domElement.clientWidth, h = mindar.renderer.domElement.clientHeight;
    const ndc = new THREE.Vector2((px / w) * 2 - 1, -(py / h) * 2 + 1);
    raycaster.setFromCamera(ndc, mindar.camera);
    const pt = new THREE.Vector3();
    raycaster.ray.intersectPlane(plane, pt);
    return pt || { x: 0, y: 0 };
  }

  function render() {
    if (!active) return;
    panel.style.display = panelHidden ? "none" : "block";
    state.forEach((s, i) => {
      const center = project(s.lx, s.ly);
      const edge = project(s.lx + s.size, s.ly);
      const r = Math.max(10, Math.hypot(edge.x - center.x, edge.y - center.y));
      const { c, handle } = nodes[i];
      c.style.left = (center.x - r) + "px"; c.style.top = (center.y - r) + "px";
      c.style.width = c.style.height = (r * 2) + "px";
      handle.style.left = (center.x + r - 6) + "px"; handle.style.top = (center.y - 6) + "px";
    });
    renderPanel();
  }

  function renderPanel() {
    const out = state.map((s, i) => {
      const cfg = fromWorld(s.lx, s.ly);
      return `#${i + 1} ${(items[i].titulo || "").padEnd(20)} x:${cfg.x} y:${cfg.y} size:${fmt(s.size)}`;
    });
    panel.innerHTML =
      '<div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:8px;font-family:system-ui,sans-serif">' +
      '<b style="font-size:12px">Coordenadas editadas</b>' +
      '<div style="display:flex;gap:6px">' +
      '<button id="pe-copy" style="background:#c9a24b;color:#1a1206;border:0;border-radius:8px;padding:6px 10px;font:700 11px system-ui">Copiar JSON</button>' +
      '<button id="pe-reset" style="background:#2a2438;color:#f4efe6;border:0;border-radius:8px;padding:6px 10px;font:700 11px system-ui">Reset</button>' +
      '</div></div>' +
      '<pre style="white-space:pre-wrap;margin:0 0 8px">' + out.join("\n") + '</pre>';
    const copyBtn = document.getElementById("pe-copy");
    copyBtn.addEventListener("click", () => {
      const arr = state.map((s, i) => {
        const cfg = fromWorld(s.lx, s.ly);
        return Object.assign({}, items[i], { x: cfg.x, y: cfg.y, size: fmt(s.size) });
      });
      navigator.clipboard && navigator.clipboard.writeText(JSON.stringify(arr, null, 2));
    });
    document.getElementById("pe-reset").addEventListener("click", () => {
      state.forEach((s, i) => { const w = toWorld(items[i]); s.lx = w.lx; s.ly = w.ly; s.size = items[i].size || defaultSize; });
      render();
    });
  }

  // --- Arrastre (mover centro / redimensionar) ---
  nodes.forEach(({ c, handle }, i) => {
    let dragging = null; // "move" | "resize"
    const start = (e, type) => { e.preventDefault(); e.stopPropagation(); dragging = type; };
    c.addEventListener("pointerdown", (e) => start(e, "move"));
    handle.addEventListener("pointerdown", (e) => start(e, "resize"));
    window.addEventListener("pointermove", (e) => {
      if (!dragging || !active) return;
      const rect = mindar.renderer.domElement.getBoundingClientRect();
      const world = screenToWorld(e.clientX - rect.left, e.clientY - rect.top);
      if (dragging === "move") { state[i].lx = world.x; state[i].ly = world.y; }
      else { state[i].size = Math.max(0.01, Math.hypot(world.x - state[i].lx, world.y - state[i].ly)); }
      render();
    });
    window.addEventListener("pointerup", () => { dragging = null; });
  });

  toggleBtn.addEventListener("click", () => {
    active = !active;
    layer.style.display = active ? "block" : "none";
    panel.style.display = active && !panelHidden ? "block" : "none";
    panelToggleBtn.style.display = active ? "block" : "none";
    hint.style.display = active ? "block" : "none";
    toggleBtn.textContent = active ? "▶ Ver animación" : "🔧 Editar círculos";
    toggleBtn.style.background = active ? "#c9a24b" : "";
    toggleBtn.style.color = active ? "#1a1206" : "";
    if (active) render();
  });

  setInterval(render, 200); // sigue la cámara si hacen zoom con la rueda
}
