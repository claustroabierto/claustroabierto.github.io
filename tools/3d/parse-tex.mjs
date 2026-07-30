import fs from "fs";
import readline from "readline";
// Uso: node parse-tex.mjs <obj> <NV> <NT> <geoDir>
const IN = process.argv[2], OUT = process.argv[5] || "/tmp/rp/borja-geo";
const NV = +(process.argv[3] || 1085696), NT = +(process.argv[4] || 1119544);
fs.mkdirSync(OUT, { recursive: true });
const pos = new Float32Array(NV*3), col = new Uint8Array(NV*3);   // por posición p
const uvv = new Float32Array(NT*2);                              // por texcoord t
let vi=0, ti=0;
const rl = readline.createInterface({ input: fs.createReadStream(IN), crlfDelay: Infinity });
for await (const line of rl) {
  const c0 = line.charCodeAt(0);
  if (c0===118 && line[1]===" ") {                 // v x y z r g b
    const p = line.split(/\s+/);
    if (vi<NV){ pos[vi*3]=+p[1];pos[vi*3+1]=+p[2];pos[vi*3+2]=+p[3];
      col[vi*3]=Math.round((p[4]!==undefined?+p[4]:1)*255); col[vi*3+1]=Math.round((p[5]!==undefined?+p[5]:1)*255); col[vi*3+2]=Math.round((p[6]!==undefined?+p[6]:1)*255); }
    vi++;
  } else if (c0===118 && line[1]==="t") {          // vt u v
    const p = line.split(/\s+/); if (ti<NT){ uvv[ti*2]=+p[1]; uvv[ti*2+1]=+p[2]; } ti++;
  }
}
// segunda pasada: caras -> vértices únicos (p,t)
const map = new Map(); const P=[],U=[],C=[],IDX=[];
const rl2 = readline.createInterface({ input: fs.createReadStream(IN), crlfDelay: Infinity });
for await (const line of rl2) {
  if (line.charCodeAt(0)!==102 || line[1]!==" ") continue;    // "f "
  const t = line.split(/\s+/); const vids=[];
  for (let k=1;k<t.length;k++){ if(!t[k])continue; const s=t[k].split("/"); const p=+s[0]-1, tt=+s[1]-1;
    if(p<0)continue; const key=p*2000000+(tt>=0?tt:0);
    let id=map.get(key);
    if(id===undefined){ id=P.length/3; map.set(key,id);
      P.push(pos[p*3],pos[p*3+1],pos[p*3+2]);
      const tv = tt>=0?tt:0; U.push(uvv[tv*2],uvv[tv*2+1]);
      C.push(col[p*3],col[p*3+1],col[p*3+2]); }
    vids.push(id);
  }
  for(let k=2;k<vids.length;k++) IDX.push(vids[0],vids[k-1],vids[k]);
}
const nV=P.length/3, nF=IDX.length/3;
fs.writeFileSync(`${OUT}/pos.bin`, Buffer.from(new Float32Array(P).buffer));
fs.writeFileSync(`${OUT}/uv.bin`,  Buffer.from(new Float32Array(U).buffer));
fs.writeFileSync(`${OUT}/col.bin`, Buffer.from(new Uint8Array(C).buffer));
fs.writeFileSync(`${OUT}/idx.bin`, Buffer.from(new Uint32Array(IDX).buffer));
fs.writeFileSync(`${OUT}/meta.json`, JSON.stringify({nV,nF}));
console.log("vértices únicos (p,t):",nV,"| triángulos:",nF);
