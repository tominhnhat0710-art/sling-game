/* =========================================================================
   TAI MODEL .glb THAT
   Cac model do Nathan tai ve tu Poly Pizza / Quaternius / Kenney, da duoc
   nen bang meshopt nen phai gan MeshoptDecoder vao loader.

   Nguyen tac quan trong: prop nao cung phai ve duoc bang InstancedMesh, vi
   mot map co hang tram cay va da. Vay nen moi model duoc gop thanh MOT
   BufferGeometry duy nhat cong MOT material duy nhat.
     - Model chi co 1 material  -> giu nguyen material do, giu ca texture
     - Model co nhieu material  -> nuong mau vao vertex color
   ========================================================================= */
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { MeshoptDecoder } from 'three/addons/libs/meshopt_decoder.module.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';

const loader = new GLTFLoader();
loader.setMeshoptDecoder(MeshoptDecoder);

/* Danh sach asset. Khoa dung trong maps.js / cars.js. */
export const DS = {
  xe_cu: 'assets/xe_cu.glb',
  xe_taxi: 'assets/xe_taxi.glb',
  xe_suv: 'assets/xe_suv.glb',
  xe_tuantra: 'assets/xe_tuantra.glb',
  xe_ae86: 'assets/xe_ae86.glb',
  xe_rx7: 'assets/xe_rx7.glb',
  cay_tan: 'assets/cay_tan.glb',
  cay_thong: 'assets/cay_thong.glb',
  da_nho: 'assets/da_nho.glb',
  da_cam: 'assets/da_cam.glb',
  da_to: 'assets/da_to.glb',
  da_cum: 'assets/da_cum.glb',
  da_vun: 'assets/da_vun.glb',
  co_xanh: 'assets/co_xanh.glb',
  co_pha: 'assets/co_pha.glb',
  thu_ngua: 'assets/thu_ngua.glb',
  thu_bo: 'assets/thu_bo.glb',
  thu_shiba: 'assets/thu_shiba.glb',
  canh_ho: 'assets/canh_ho.glb',
  canh_ghe: 'assets/canh_ghe.glb',
  canh_thac: 'assets/canh_thac.glb'
};

const KHO = {};        // khoa -> { scene, animations }

export function co(khoa) { return !!KHO[khoa]; }
export function lay(khoa) { return KHO[khoa]; }

/* Tai het. Model nao loi thi bo qua chu khong lam sap game: phan ve bang
   code cu van con day lam duong lui. */
export async function taiHet(nen = () => {}) {
  const keys = Object.keys(DS);
  let xong = 0;
  await Promise.all(keys.map(async k => {
    try {
      const g = await loader.loadAsync(DS[k]);
      KHO[k] = { scene: g.scene, animations: g.animations || [] };
    } catch (e) {
      console.warn('[glb] khong tai duoc', k, e && e.message);
    }
    nen(++xong / keys.length);
  }));
  return KHO;
}

/* ---------------------------------------------------------------- tien ich */

/* Tim node theo ten, khong phan biet chu hoa va dau gach. */
export function node(root, ten) {
  const c = String(ten).toLowerCase().replace(/[^a-z0-9]/g, '');
  let ra = null;
  root.traverse(o => {
    if (ra) return;
    const n = String(o.name || '').toLowerCase().replace(/[^a-z0-9]/g, '');
    if (n === c || n.startsWith(c)) ra = o;
  });
  return ra;
}

/* Lay het node co mesh, dung de tach diorama thanh tung vat the roi. */
export function cacMesh(root) {
  const ra = [];
  root.traverse(o => { if (o.isMesh) ra.push(o); });
  return ra;
}

const _b3 = new THREE.Box3(), _v3 = new THREE.Vector3(), _v3b = new THREE.Vector3();

export function hopBao(o) { o.updateMatrixWorld(true); return _b3.setFromObject(o).clone(); }

/* Chuan hoa: dat vat the ngoi tren mat dat (y=0), tam o goc, cao dung caoMuon.
   Model tai tu mang co du kieu ty le, tu 0,01 m den 120 m, nen buoc nay bat buoc. */
export function chuanHoa(o, caoMuon) {
  o.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(o);
  bb.getSize(_v3);
  const s = caoMuon / Math.max(1e-6, _v3.y);
  o.scale.multiplyScalar(s);
  o.updateMatrixWorld(true);
  const bb2 = new THREE.Box3().setFromObject(o);
  bb2.getCenter(_v3b);
  o.position.x -= _v3b.x;
  o.position.z -= _v3b.z;
  o.position.y -= bb2.min.y;
  o.updateMatrixWorld(true);
  return o;
}

/* Chuan hoa theo chieu DAI (truc dai nhat), dung cho xe: xe phai dai dungDai m. */
export function chuanHoaDai(o, daiMuon, truc = 'z') {
  o.updateMatrixWorld(true);
  const bb = new THREE.Box3().setFromObject(o);
  bb.getSize(_v3);
  const d = truc === 'x' ? _v3.x : _v3.z;
  const s = daiMuon / Math.max(1e-6, d);
  o.scale.multiplyScalar(s);
  o.updateMatrixWorld(true);
  return o;
}


/* =====================================================================
   GO LUONG TU HOA
   File nen bang meshopt luu toa do duoi dang so nguyen 16 bit CHUAN HOA
   ve khoang [-1, 1], kich thuoc that nam trong ma tran scale cua node.
   Neu cu the ma goi applyMatrix4 thi three.js doc ra so thuc nhung ghi
   lai vao mang so nguyen -> hong het, moi vat the bien thanh khoi 2x2x2.
   Day chinh la loi lam cay va da bi teo lai bang nhau.
   Buoc nay dung lai attribute thanh Float32 khong chuan hoa truoc khi bien doi.
   ===================================================================== */
function goLuongTu(geo) {
  for (const ten of ['position', 'normal', 'uv', 'uv1', 'color']) {
    const a = geo.attributes[ten];
    if (!a) continue;
    if (a.array instanceof Float32Array && !a.normalized) continue;
    const n = a.count, it = a.itemSize;
    const ra = new Float32Array(n * it);
    for (let i = 0; i < n; i++) {
      ra[i * it] = a.getX(i);
      if (it > 1) ra[i * it + 1] = a.getY(i);
      if (it > 2) ra[i * it + 2] = a.getZ(i);
      if (it > 3) ra[i * it + 3] = a.getW(i);
    }
    geo.setAttribute(ten, new THREE.BufferAttribute(ra, it));
  }
  return geo;
}

/* AO gia: dinh nam thap trong vat the thi toi hon. Lam vat the co khoi. */
function boAO(geo, manh) {
  const p = geo.attributes.position, c = geo.attributes.color;
  if (!c || !manh) return geo;
  geo.computeBoundingBox();
  const lo = geo.boundingBox.min.y, cao = Math.max(1e-6, geo.boundingBox.max.y - lo);
  for (let i = 0; i < p.count; i++) {
    const t = (p.getY(i) - lo) / cao;
    const k = 1 - manh * (1 - Math.min(1, Math.pow(t, 0.55)));
    c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k);
  }
  return geo;
}

/* Gop mot cay/da thanh { geo, mat } dung duoc cho InstancedMesh.
   opt.ao   : do manh AO gia (0 la tat)
   opt.mau  : nhuom lai toan bo ve mau nay (dung cho da tren map tuyet, sa mac)
   opt.tron : ep smooth shading thay vi flat */
export function gopDeInstance(root, opt = {}) {
  const ao = opt.ao != null ? opt.ao : 0.4;
  const ms = cacMesh(root);
  if (!ms.length) return null;

  /* Bao nhieu material khac nhau? */
  const bo = new Set();
  for (const m of ms) (Array.isArray(m.material) ? m.material : [m.material]).forEach(x => bo.add(x));
  const motMat = bo.size === 1;
  const matGoc = [...bo][0];

  root.updateMatrixWorld(true);
  const geos = [];
  for (const m of ms) {
    const g = goLuongTu(m.geometry.clone());
    g.applyMatrix4(m.matrixWorld);
    /* Bo het attribute khong dung den, neu khong mergeGeometries se bao loi
       vi cac geometry khac tap attribute. */
    const giu = motMat ? ['position', 'normal', 'uv'] : ['position', 'normal'];
    for (const k of Object.keys(g.attributes)) if (!giu.includes(k)) g.deleteAttribute(k);
    if (motMat && !g.attributes.uv) {
      g.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(g.attributes.position.count * 2), 2));
    }
    if (!g.attributes.normal) g.computeVertexNormals();
    if (!motMat) {
      const mt = Array.isArray(m.material) ? m.material[0] : m.material;
      const col = new THREE.Color(1, 1, 1);
      if (mt && mt.color) col.copy(mt.color);
      if (opt.mau) col.lerp(new THREE.Color(opt.mau), 0.72);
      const n = g.attributes.position.count;
      const arr = new Float32Array(n * 3);
      for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
      g.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    }
    if (!g.index) {
      const n = g.attributes.position.count;
      const idx = new Uint32Array(n);
      for (let i = 0; i < n; i++) idx[i] = i;
      g.setIndex(new THREE.BufferAttribute(idx, 1));
    }
    geos.push(g);
  }

  const geo = geos.length === 1 ? geos[0] : mergeGeometries(geos, false);
  if (!geo) return null;
  if (!motMat) boAO(geo, ao);

  /* Dua goc toa do ve day vat the va giua theo X/Z, de dat len dia hinh. */
  geo.computeBoundingBox();
  const bb = geo.boundingBox;
  geo.translate(-(bb.min.x + bb.max.x) / 2, -bb.min.y, -(bb.min.z + bb.max.z) / 2);
  geo.computeBoundingSphere();

  let mat;
  if (motMat) {
    mat = matGoc.clone();
    mat.envMapIntensity = opt.env != null ? opt.env : 0.3;
    if (opt.mau) mat.color = new THREE.Color(matGoc.color || 0xffffff).lerp(new THREE.Color(opt.mau), 0.72);
  } else {
    mat = new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.88, metalness: 0,
      flatShading: !opt.tron, envMapIntensity: opt.env != null ? opt.env : 0.28
    });
  }
  return { geo, mat, cao: bb.max.y - bb.min.y };
}

/* Lay chieu cao goc cua geometry sau khi gop, tien de tinh ty le. */
export function caoCua(root) {
  const bb = hopBao(root);
  return bb.max.y - bb.min.y;
}

/* Lay MOT mesh don le trong model, dung cho co: file co_xanh chua 82 bui co
   roi, neu gop het lam mot instance thi moi bui co gia 1.312 tam giac, nhan
   700 ban la 900.000 tam giac chi rieng co. */
export function motMesh(root, idx = 0) {
  const ms = cacMesh(root);
  if (!ms.length) return null;
  const m = ms[idx % ms.length];
  const g = new THREE.Group();
  const c = m.clone();
  c.position.set(0, 0, 0); c.rotation.set(0, 0, 0); c.scale.set(1, 1, 1);
  g.add(c);
  return g;
}

/* So tam giac cua mot geometry. */
export function soTamGiac(geo) {
  if (!geo) return 0;
  return Math.round((geo.index ? geo.index.count : geo.attributes.position.count) / 3);
}
