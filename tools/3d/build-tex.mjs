import fs from "fs";
import { Document, NodeIO } from "@gltf-transform/core";
import { KHRMaterialsUnlit, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { weld, simplify, prune, dedup } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import draco3d from "draco3dgltf";

// Uso: node build-tex.mjs <geoDir> <texJpg> <outHi.glb> <outLo.glb> <rotXsign> <hiRatio> <loRatio>
const GEO=process.argv[2]||"/tmp/rp/borja-geo";
const TEXJPG=process.argv[3]||"/tmp/rp/borja-tex.jpg";
const OUT_HI=process.argv[4]||"/tmp/rp/borja.glb";
const OUT_LO=process.argv[5]||"/tmp/rp/borja-lo.glb";
const ROTX=+(process.argv[6]===undefined?-1:process.argv[6]);   // signo de rotación en X (0 = ninguna)
const HI_RATIO=+(process.argv[7]||0.25), LO_RATIO=+(process.argv[8]||0.09);
const pos=new Float32Array(fs.readFileSync(`${GEO}/pos.bin`).buffer.slice());
const uv =new Float32Array(fs.readFileSync(`${GEO}/uv.bin`).buffer.slice());
const idx=new Uint32Array(fs.readFileSync(`${GEO}/idx.bin`).buffer.slice());
const tex=fs.readFileSync(TEXJPG);
// min/max de POSITION

function baseDoc(){
 const doc=new Document(); const buf=doc.createBuffer();
 const aPos=doc.createAccessor("POSITION").setType("VEC3").setArray(pos.slice()).setBuffer(buf);
 const aUV=doc.createAccessor("TEXCOORD_0").setType("VEC2").setArray(uv.slice()).setBuffer(buf);
 const aIdx=doc.createAccessor("idx").setType("SCALAR").setArray(idx.slice()).setBuffer(buf);
 const image=doc.createTexture("borja").setImage(tex).setMimeType("image/jpeg");
 const unlit=doc.createExtension(KHRMaterialsUnlit);
 const mat=doc.createMaterial("borja").setBaseColorFactor([1,1,1,1]).setMetallicFactor(0).setRoughnessFactor(1).setBaseColorTexture(image);
 mat.setExtension("KHR_materials_unlit",unlit.createUnlit());
 const prim=doc.createPrimitive().setAttribute("POSITION",aPos).setAttribute("TEXCOORD_0",aUV).setIndices(aIdx).setMaterial(mat);
 const mesh=doc.createMesh("borja").addPrimitive(prim);
 const th=ROTX*Math.PI/2, q=ROTX===0?[0,0,0,1]:[Math.sin(th/2),0,0,Math.cos(th/2)];
 doc.createScene().addChild(doc.createNode("borja").setMesh(mesh).setRotation(q));
 return doc;
}

await MeshoptSimplifier.ready;
const enc=await draco3d.createEncoderModule(), dec=await draco3d.createDecoderModule();

// HI: ~500k tri + Draco -> borja.glb
{
 const doc=baseDoc();
 await doc.transform(dedup(), weld(), simplify({simplifier:MeshoptSimplifier,ratio:HI_RATIO,error:0.004}), prune());
 const after=doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices().getCount()/3;
 doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({method:KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER});
 const io=new NodeIO().registerExtensions([KHRMaterialsUnlit,KHRDracoMeshCompression]).registerDependencies({"draco3d.encoder":enc,"draco3d.decoder":dec});
 await io.write(OUT_HI,doc);
 console.log("HI:",Math.round(after),"tri |",(fs.statSync(OUT_HI).size/1e6).toFixed(2),"MB");
}
// LO: ~180k tri, sin Draco (para USDZ) -> borja-lo.glb
{
 const doc=baseDoc();
 await doc.transform(dedup(), weld(), simplify({simplifier:MeshoptSimplifier,ratio:LO_RATIO,error:0.006}), prune());
 const after=doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices().getCount()/3;
 const io=new NodeIO().registerExtensions([KHRMaterialsUnlit]);
 await io.write(OUT_LO,doc);
 console.log("LO:",Math.round(after),"tri |",(fs.statSync(OUT_LO).size/1e6).toFixed(2),"MB");
}
