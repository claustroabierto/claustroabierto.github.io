/*  Genera borja.usdz para Quick Look (AR iOS) desde borja-lo.glb.
 *  Textura como EMISSIVE (se ve a plena luz, sin depender de la iluminación de la
 *  escena). Requiere puppeteer. model-viewer lo referencia con ios-src. */
import puppeteer from "puppeteer";import fs from "fs";
const html=`<!doctype html><html><head><meta charset="utf8">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js","three/addons/":"https://cdn.jsdelivr.net/npm/three@0.160.0/examples/jsm/"}}</script>
</head><body><script type="module">
import * as THREE from "three";import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";import { USDZExporter } from "three/addons/exporters/USDZExporter.js";
window.__err="";async function main(){
 const gltf=await new GLTFLoader().loadAsync("file:///tmp/rp/borja-lo.glb");const scene=new THREE.Scene();
 gltf.scene.traverse(o=>{if(o.isMesh){const tex=o.material.map;if(tex)tex.colorSpace=THREE.SRGBColorSpace;
  o.material=new THREE.MeshStandardMaterial({color:0x000000,emissive:0xffffff,emissiveMap:tex,emissiveIntensity:1,roughness:1,metalness:0});}});
 scene.add(gltf.scene);const out=new Uint8Array(await new USDZExporter().parse(scene));
 let bin="";const CH=0x8000;for(let i=0;i<out.length;i+=CH)bin+=String.fromCharCode.apply(null,out.subarray(i,i+CH));window.__usdz=btoa(bin);}
main().then(()=>window.__done=true).catch(e=>window.__err=String(e&&e.stack||e));
</script></body></html>`;
fs.writeFileSync("/tmp/rp/usdz.html",html);
const b=await puppeteer.launch({headless:"new",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--allow-file-access-from-files"]});
const pg=await b.newPage();await pg.goto("file:///tmp/rp/usdz.html",{waitUntil:"domcontentloaded"});
await pg.waitForFunction("window.__done===true||window.__err.length",{timeout:120000}).catch(()=>{});
const err=await pg.evaluate(()=>window.__err);if(err){console.log("ERR",err);process.exit(1);}
fs.writeFileSync("/tmp/rp/borja.usdz",Buffer.from(await pg.evaluate(()=>window.__usdz),"base64"));await b.close();
console.log("USDZ:",(fs.statSync("/tmp/rp/borja.usdz").size/1e6).toFixed(2),"MB");
