import { NodeIO } from "@gltf-transform/core";
import { KHRMaterialsUnlit, KHRDracoMeshCompression } from "@gltf-transform/extensions";
import draco3d from "draco3dgltf";
const [IN,OUT,sign]=process.argv.slice(2); const s=parseFloat(sign);
const io=new NodeIO().registerExtensions([KHRMaterialsUnlit,KHRDracoMeshCompression])
 .registerDependencies({"draco3d.encoder":await draco3d.createEncoderModule(),"draco3d.decoder":await draco3d.createDecoderModule()});
const doc=await io.read(IN);
const th=s*Math.PI/2, q=[Math.sin(th/2),0,0,Math.cos(th/2)]; // rot sobre X
doc.getRoot().listNodes().forEach(n=>n.setRotation(q));
await io.write(OUT,doc);console.log("escrito",OUT);
