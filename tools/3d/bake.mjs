/*  Hornea el color por vértice de un OBJ a una textura, usando el atlas UV del OBJ.
 *  Requiere puppeteer (usar node_modules de tools/mind-compiler o instalar aquí).
 *  Entrada: binarios de parse-tex.mjs en /tmp/rp/borja-geo. Salida: /tmp/rp/borja-tex.jpg
 *  Render en espacio UV (posición = uv) con los colores de vértice + grado (brillo),
 *  relleno de costuras (dilatación 3 pasadas) y JPEG 4096². */
import puppeteer from "puppeteer";import fs from "fs";
// Uso: node bake.mjs <geoDir> <outJpg>
const GEO=process.argv[2]||"/tmp/rp/borja-geo";
const OUTJPG=process.argv[3]||"/tmp/rp/borja-tex.jpg";
const html=`<!doctype html><html><head><meta charset="utf8">
<script type="importmap">{"imports":{"three":"https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js"}}</script></head>
<body><canvas id="c"></canvas><script type="module">
import * as THREE from "three";window.__err="";
async function main(){const R=4096,G=1.12,GAMMA=0.88,DESAT=0.08;const bufs={};
 for(const n of ["uv","col","idx"]){const r=await fetch("file://${GEO}/"+n+".bin");bufs[n]=await r.arrayBuffer();}
 const uv=new Float32Array(bufs.uv),col=new Uint8Array(bufs.col),idx=new Uint32Array(bufs.idx);const nV=uv.length/2;
 const posUV=new Float32Array(nV*3);for(let i=0;i<nV;i++){posUV[i*3]=uv[i*2];posUV[i*3+1]=uv[i*2+1];}
 const geo=new THREE.BufferGeometry();geo.setAttribute("position",new THREE.BufferAttribute(posUV,3));
 geo.setAttribute("color",new THREE.BufferAttribute(col,3,true));geo.setIndex(new THREE.BufferAttribute(idx,1));
 const mat=new THREE.ShaderMaterial({vertexColors:true,
  vertexShader:"varying vec3 vC;void main(){vC=color;gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0);}",
  fragmentShader:"varying vec3 vC;uniform float G,GA,DS;void main(){vec3 c=pow(vC,vec3(GA))*G;float l=dot(c,vec3(0.299,0.587,0.114));c=mix(c,vec3(l),DS);gl_FragColor=vec4(clamp(c,0.0,1.0),1.0);}",
  uniforms:{G:{value:G},GA:{value:GAMMA},DS:{value:DESAT}}});
 const scene=new THREE.Scene();scene.add(new THREE.Mesh(geo,mat));
 const cam=new THREE.OrthographicCamera(0,1,1,0,-1,1);
 const canvas=document.getElementById("c");canvas.width=R;canvas.height=R;
 const rnd=new THREE.WebGLRenderer({canvas,antialias:true,preserveDrawingBuffer:true});rnd.setSize(R,R,false);rnd.setClearColor(0x000000,0);
 const rt=new THREE.WebGLRenderTarget(R,R);rnd.setRenderTarget(rt);rnd.render(scene,cam);
 const px=new Uint8Array(R*R*4);rnd.readRenderTargetPixels(rt,0,0,R,R,px);const at=(x,y)=>(y*R+x)*4;
 for(let p=0;p<3;p++){const s=px.slice();for(let y=0;y<R;y++)for(let x=0;x<R;x++){const o=at(x,y);if(s[o+3]>0)continue;let r=0,g=0,b=0,n=0;
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=R||yy>=R)continue;const oo=at(xx,yy);if(s[oo+3]>0){r+=s[oo];g+=s[oo+1];b+=s[oo+2];n++;}}
  if(n){px[o]=r/n;px[o+1]=g/n;px[o+2]=b/n;px[o+3]=255;}}}
 const cv=document.createElement("canvas");cv.width=R;cv.height=R;cv.getContext("2d").putImageData(new ImageData(new Uint8ClampedArray(px.buffer),R,R),0,0);
 window.__jpg=cv.toDataURL("image/jpeg",0.9).split(",")[1];}
main().then(()=>window.__done=true).catch(e=>window.__err=String(e));
</script></body></html>`;
fs.writeFileSync("/tmp/rp/bake.html",html);
const b=await puppeteer.launch({headless:"new",args:["--no-sandbox","--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader","--allow-file-access-from-files"]});
const pg=await b.newPage();await pg.goto("file:///tmp/rp/bake.html",{waitUntil:"domcontentloaded"});
await pg.waitForFunction("window.__done===true||window.__err.length",{timeout:120000}).catch(()=>{});
const err=await pg.evaluate(()=>window.__err);if(err){console.log("ERR",err);process.exit(1);}
fs.writeFileSync(OUTJPG,Buffer.from(await pg.evaluate(()=>window.__jpg),"base64"));await b.close();
console.log("textura:",(fs.statSync(OUTJPG).size/1e6).toFixed(2),"MB");
