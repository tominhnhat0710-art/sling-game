import * as THREE from 'three';
import { EffectComposer } from 'three/addons/postprocessing/EffectComposer.js';
import { RenderPass } from 'three/addons/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'three/addons/postprocessing/UnrealBloomPass.js';
import { OutputPass } from 'three/addons/postprocessing/OutputPass.js';

/* =========================================================================
   PIPELINE HINH ANH
   Ba thu tao ra buoc nhay lon nhat, theo dung thu tu quan trong:

   1. BAN DO MOI TRUONG (environment map). Son xe phan chieu troi va dat.
      Day la thu duy nhat lam vat the trong nhu co that thay vi nhu nhua.
      m sinh no tu chinh cai vom troi cua map, nen moi map co phan chieu rieng.
   2. BLOOM. Vat pham, bang tang toc, cot dich phat sang lan ra, khong con la
      khoi mau phang.
   3. BONG DO MEM va do phan giai cao hon.
   ========================================================================= */

export function taoEnv(rn, mauTren, mauGiua, mauDuoi) {
  const s = new THREE.Scene();
  const g = new THREE.SphereGeometry(1, 24, 16);
  const m = new THREE.ShaderMaterial({
    uniforms: { a: { value: new THREE.Color(mauTren) },
                b: { value: new THREE.Color(mauGiua) },
                c: { value: new THREE.Color(mauDuoi) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 a,b,c; varying vec3 vP;
      void main(){ float h = normalize(vP).y;
        vec3 col = h > 0.0 ? mix(b, a, pow(h, 0.6)) : mix(b, c, pow(-h, 0.4));
        gl_FragColor = vec4(col * 0.5, 1.0); }`,   // toi lai: env map de PHAN CHIEU, khong phai de chieu sang
    side: THREE.BackSide, depthWrite: false
  });
  s.add(new THREE.Mesh(g, m));
  // them mot vung sang manh lam "mat troi" de son xe co diem loe
  const sun = new THREE.Mesh(new THREE.SphereGeometry(0.14, 12, 10),
    new THREE.MeshBasicMaterial({ color: 0xffffff }));
  sun.position.set(-0.24, 0.82, 0.3).multiplyScalar(0.94);
  sun.scale.setScalar(0.8);
  s.add(sun);

  const pm = new THREE.PMREMGenerator(rn);
  pm.compileEquirectangularShader();
  const rt = pm.fromScene(s, 0.05);
  pm.dispose();
  g.dispose(); m.dispose();
  return rt.texture;
}

export function taoComposer(rn, scene, cam, manh = 1) {
  const c = new EffectComposer(rn);
  c.addPass(new RenderPass(scene, cam));
  /* Nguong 0.86 lam CA CANH bi loe trang, vi troi sang da vuot nguong do.
     Bloom chi nen an vao vat phat sang thuc su: vat pham, bang tang toc, cot dich.
     Nen nguong phai cao han len va cuong do phai nho. */
  const bloom = new UnrealBloomPass(new THREE.Vector2(innerWidth, innerHeight), 0.22 * manh, 0.35, 1.25);
  c.addPass(bloom);
  c.addPass(new OutputPass());
  return { composer: c, bloom };
}

/* Chat lieu son xe: co lop bong phu (clearcoat) nen bat sang o canh, giong son that. */
export function sonXe(mau) {
  return new THREE.MeshPhysicalMaterial({
    color: mau, roughness: 0.28, metalness: 0.55,
    clearcoat: 1.0, clearcoatRoughness: 0.08,
    envMapIntensity: 1.25
  });
}
export function kinhXe() {
  return new THREE.MeshPhysicalMaterial({
    color: 0x0d1a26, roughness: 0.06, metalness: 0.1,
    transparent: true, opacity: 0.62, envMapIntensity: 2.2,
    clearcoat: 1.0, clearcoatRoughness: 0.03
  });
}
export function kimLoai(mau, tho = 0.35) {
  return new THREE.MeshStandardMaterial({ color: mau, roughness: tho, metalness: 0.9, envMapIntensity: 1.1 });
}
export function nhuaDen() {
  return new THREE.MeshStandardMaterial({ color: 0x14161c, roughness: 0.62, metalness: 0.15, envMapIntensity: 0.6 });
}
