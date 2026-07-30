import fs from "fs";
import readline from "readline";
import { Document, NodeIO } from "@gltf-transform/core";
import { KHRMaterialsUnlit } from "@gltf-transform/extensions";

const IN = process.argv[2], OUT = process.argv[3];
const NV = 1085696;                       // conteo exacto de vértices (grep)
let pos = new Float32Array(NV * 3), col = new Float32Array(NV * 3);
let vi = 0; const idx = [];
const rl = readline.createInterface({ input: fs.createReadStream(IN), crlfDelay: Infinity });
for await (const line of rl) {
  const c0 = line.charCodeAt(0);
  if (c0 === 118 && line[1] === " ") {          // "v "
    const p = line.split(/\s+/);
    if (vi < NV) {
      pos[vi*3]=+p[1]; pos[vi*3+1]=+p[2]; pos[vi*3+2]=+p[3];
      col[vi*3]= p[4]!==undefined?+p[4]:1; col[vi*3+1]= p[5]!==undefined?+p[5]:1; col[vi*3+2]= p[6]!==undefined?+p[6]:1;
    }
    vi++;
  } else if (c0 === 102 && line[1] === " ") {   // "f "
    const p = line.split(/\s+/); const v = [];
    for (let k=1;k<p.length;k++){ if(!p[k])continue; const a=parseInt(p[k],10)-1; if(a>=0&&a<NV)v.push(a); }
    for (let k=2;k<v.length;k++) idx.push(v[0],v[k-1],v[k]);
  }
}
console.log("vértices leídos:", vi, "| triángulos:", idx.length/3);
if (vi !== NV) { pos = pos.slice(0, Math.min(vi,NV)*3); col = col.slice(0, Math.min(vi,NV)*3); }

const doc = new Document(); const buf = doc.createBuffer();
const aPos = doc.createAccessor("POSITION").setType("VEC3").setArray(pos).setBuffer(buf);
const aCol = doc.createAccessor("COLOR_0").setType("VEC3").setArray(col).setBuffer(buf);
const aIdx = doc.createAccessor("indices").setType("SCALAR").setArray(Uint32Array.from(idx)).setBuffer(buf);
const unlit = doc.createExtension(KHRMaterialsUnlit);
const mat = doc.createMaterial("borja").setBaseColorFactor([1,1,1,1]).setRoughnessFactor(1).setMetallicFactor(0);
mat.setExtension("KHR_materials_unlit", unlit.createUnlit());
const prim = doc.createPrimitive().setAttribute("POSITION",aPos).setAttribute("COLOR_0",aCol).setIndices(aIdx).setMaterial(mat);
const mesh = doc.createMesh("borja").addPrimitive(prim);
doc.createScene().addChild(doc.createNode("borja").setMesh(mesh));
await new NodeIO().write(OUT, doc);
console.log("escrito:", OUT, (fs.statSync(OUT).size/1e6).toFixed(1), "MB");
