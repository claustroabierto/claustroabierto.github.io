import fs from "fs";
import { Document, NodeIO } from "@gltf-transform/core";
import { KHRMaterialsUnlit, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { weld, simplify, prune, dedup } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import draco3d from "draco3dgltf";

const GEO="/tmp/rp/borja-geo";
const pos=new Float32Array(fs.readFileSync(`${GEO}/pos.bin`).buffer.slice());
const uv =new Float32Array(fs.readFileSync(`${GEO}/uv.bin`).buffer.slice());
const idx=new Uint32Array(fs.readFileSync(`${GEO}/idx.bin`).buffer.slice());
const tex=fs.readFileSync("/tmp/rp/borja-tex.jpg");
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
 const th=-Math.PI/2, q=[Math.sin(th/2),0,0,Math.cos(th/2)];   // -90° X (parar)
 doc.createScene().addChild(doc.createNode("borja").setMesh(mesh).setRotation(q));
 return doc;
}

await MeshoptSimplifier.ready;
const enc=await draco3d.createEncoderModule(), dec=await draco3d.createDecoderModule();

// HI: ~500k tri + Draco -> borja.glb
{
 const doc=baseDoc();
 await doc.transform(dedup(), weld(), simplify({simplifier:MeshoptSimplifier,ratio:0.25,error:0.004}), prune());
 const after=doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices().getCount()/3;
 doc.createExtension(KHRDracoMeshCompression).setRequired(true).setEncoderOptions({method:KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER});
 const io=new NodeIO().registerExtensions([KHRMaterialsUnlit,KHRDracoMeshCompression]).registerDependencies({"draco3d.encoder":enc,"draco3d.decoder":dec});
 await io.write("/tmp/rp/borja.glb",doc);
 console.log("HI:",Math.round(after),"tri |",(fs.statSync("/tmp/rp/borja.glb").size/1e6).toFixed(2),"MB");
}
// LO: ~180k tri, sin Draco (para USDZ) -> borja-lo.glb
{
 const doc=baseDoc();
 await doc.transform(dedup(), weld(), simplify({simplifier:MeshoptSimplifier,ratio:0.09,error:0.006}), prune());
 const after=doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices().getCount()/3;
 const io=new NodeIO().registerExtensions([KHRMaterialsUnlit]);
 await io.write("/tmp/rp/borja-lo.glb",doc);
 console.log("LO:",Math.round(after),"tri |",(fs.statSync("/tmp/rp/borja-lo.glb").size/1e6).toFixed(2),"MB");
}
