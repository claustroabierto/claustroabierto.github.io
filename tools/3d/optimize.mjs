import { NodeIO } from "@gltf-transform/core";
import { KHRMaterialsUnlit, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import { weld, simplify, prune, dedup } from "@gltf-transform/functions";
import { MeshoptSimplifier } from "meshoptimizer";
import draco3d from "draco3dgltf";
import fs from "fs";

const IN = process.argv[2], OUT = process.argv[3], RATIO = parseFloat(process.argv[4]||"0.10");
const io = new NodeIO().registerExtensions([KHRMaterialsUnlit, KHRDracoMeshCompression])
  .registerDependencies({ "draco3d.encoder": await draco3d.createEncoderModule(), "draco3d.decoder": await draco3d.createDecoderModule() });
const doc = await io.read(IN);
await MeshoptSimplifier.ready;
const before = doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices().getCount()/3;
await doc.transform(
  dedup(),
  weld(),
  simplify({ simplifier: MeshoptSimplifier, ratio: RATIO, error: 0.006 }),
  prune()
);
const after = doc.getRoot().listMeshes()[0].listPrimitives()[0].getIndices().getCount()/3;
// material unlit (fotogrametría: la luz ya está en el color por vértice)
const unlit = doc.createExtension(KHRMaterialsUnlit);
doc.getRoot().listMaterials().forEach(m => { m.setMetallicFactor(0).setRoughnessFactor(1).setBaseColorFactor([1,1,1,1]); m.setExtension("KHR_materials_unlit", unlit.createUnlit()); });
// compresión Draco
doc.createExtension(KHRDracoMeshCompression).setRequired(true)
  .setEncoderOptions({ method: KHRDracoMeshCompression.EncoderMethod.EDGEBREAKER, encodeSpeed: 5, decodeSpeed: 5 });
await io.write(OUT, doc);
console.log("triángulos:", Math.round(before), "->", Math.round(after), "| GLB:", (fs.statSync(OUT).size/1e6).toFixed(2), "MB");
