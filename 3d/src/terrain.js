import * as THREE from 'three';
import { TUNE as T } from './TUNE.js';
import { MATSAN, VATPHAM } from './maps.js';
import { texDat, texThung, texLop, texPad, texDich } from './tex.js';

/* Map dang choi. Phai goi setMap() truoc khi dung heightAt(). */
export let MAP = null;
export let DAI = 4000;
export function setMap(m) { MAP = m; DAI = m.dai || T.worldLength; tinhDoc(); tinhVuc(); }

const rnd = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* --- nhieu ngau nhien nhung ON DINH theo seed cua map ---
   Truoc day dia hinh chi la tong may ham sin nen lap lai deu deu, di mot doan la
   nhan ra minh dang lap lai canh cu. Them nhieu co seed thi moi map co dang doi
   rieng va khong doan truoc duoc. */
function bam(n) { const v = Math.sin(n * 12.9898) * 43758.5453; return v - Math.floor(v); }
function nhieu1(x, seed) {
  const i = Math.floor(x), f = x - i;
  const a = bam(i + seed * 91.7), b = bam(i + 1 + seed * 91.7);
  const u = f * f * (3 - 2 * f);
  return a + (b - a) * u;
}
function fbm(x, seed) {
  return nhieu1(x / 41, seed) * 0.5 + nhieu1(x / 15, seed + 7) * 0.31 + nhieu1(x / 5.5, seed + 19) * 0.19;
}
/* nhieu 2 chieu: cho dia hinh co hinh khoi ngang, khong con la mot dai phang keo dai */
function nhieu2(x, z, seed) {
  const ix = Math.floor(x), iz = Math.floor(z), fx = x - ix, fz = z - iz;
  const h = (a, b) => bam(a * 127.1 + b * 311.7 + seed * 74.7);
  const ux = fx * fx * (3 - 2 * fx), uz = fz * fz * (3 - 2 * fz);
  const a = h(ix, iz), b = h(ix + 1, iz), c = h(ix, iz + 1), d = h(ix + 1, iz + 1);
  return (a + (b - a) * ux) + ((c + (d - c) * ux) - (a + (b - a) * ux)) * uz;
}
function fbm2(x, z, seed) {
  return nhieu2(x / 55, z / 55, seed) * 0.52
       + nhieu2(x / 22, z / 22, seed + 11) * 0.30
       + nhieu2(x / 9, z / 9, seed + 23) * 0.18;
}
/* Vach thung lung hai ben: lam khung cho canh, tao chieu sau va bong lon */
function vachTai(x, z) {
  const d = MAP.dia;
  const rong = d.longRong || 62;          // nua be rong hanh lang chay xe
  const cao = d.caoVach || 34;            // do cao vach
  const t = Math.max(0, (Math.abs(z) - rong) / 46);
  if (t <= 0) return 0;
  const e = Math.min(1.35, t * t);
  const gan = 0.62 + 0.38 * (fbm2(x, z, (MAP.seed || 1) + 5) * 2 - 1) * 1.1;
  return cao * e * Math.max(0.25, gan);
}

/* --- CAC DOAN DOC: cham hoan toan ngau nhien, dat theo bo so cua map.
   Moi doan doc la mot mat nghieng dan len roi ngat dot ngot o dinh, tao thanh
   cai bat nhay that su. Day la phan 've ra' chu khong phai ngau nhien. */
let DOC = [];
function tinhDoc() {
  DOC = [];
  const d = MAP.doc;
  if (!d) return;
  const vung = DAI - 240;
  for (let i = 0; i < d.so; i++) {
    const x = 190 + (i + bam(i + MAP.seed) * 0.55) * (vung / d.so);
    const dai = d.dai[0] + bam(i + MAP.seed + 31) * (d.dai[1] - d.dai[0]);
    const cao = d.cao[0] + bam(i + MAP.seed + 57) * (d.cao[1] - d.cao[0]);
    DOC.push({ x, dai, cao });
  }
}
export const layDoc = () => DOC;

/* --- VUC: nhung doan mat dat sut sau dot ngot. Bay qua duoc thi bay rat xa,
   khong qua duoc thi roi xuong day. Day la thu tao do trồi sut that su. */
let VUC = [];
function tinhVuc() {
  VUC = [];
  const v = MAP.vuc;
  if (!v) return;
  const vung = DAI - 320;
  for (let i = 0; i < v.so; i++) {
    const x = 260 + (i + 0.4 + bam(i + MAP.seed + 77) * 0.4) * (vung / v.so);
    const rong = 34 + bam(i + MAP.seed + 101) * 46;
    const sau = v.sau[0] + bam(i + MAP.seed + 123) * (v.sau[1] - v.sau[0]);
    VUC.push({ x, rong, sau });
  }
}
export const layVuc = () => VUC;
function vucTai(x) {
  let h = 0;
  for (const c of VUC) {
    const d = Math.abs(x - c.x);
    if (d > c.rong) continue;
    const t = 1 - d / c.rong;
    h -= c.sau * t * t * (3 - 2 * t);
  }
  return h;
}

function docTai(x) {
  let h = 0;
  for (const r of DOC) {
    if (x <= r.x - r.dai || x >= r.x + 6) continue;
    if (x < r.x) {
      const t = (x - (r.x - r.dai)) / r.dai;
      h += r.cao * t * t * (3 - 2 * t);         // len muot
    } else {
      const t = 1 - (x - r.x) / 6;
      h += r.cao * Math.max(0, t) * 0.55;        // xuong dot, thanh mep bat nhay
    }
  }
  return h;
}

/* Do cao dia hinh. NGUON SU THAT DUY NHAT: ca hinh anh lan vat ly deu sinh tu day. */
export function heightAt(x, z) {
  const d = MAP.dia;
  if (x < 0) x = 0;
  /* Muot hoa doan chuyen tu san phang sang doi nui. Neu dung ham thang thi cho
     giao nhau co do doc gia, va thuat toan to mau se to no thanh mot vet dat nau la. */
  const te = Math.min(1, Math.max(0, (x - T.flatRunway) / 150));
  const ease = te * te * (3 - 2 * te);
  const h =
      d.bien        * Math.sin(x / d.buoc)
    + d.bien * 0.55 * Math.sin(x / (d.buoc * 0.42) + 1.3)
    + d.bien * 0.24 * Math.sin(x / (d.buoc * 0.17) + 2.2)
    + d.bien * d.nham * Math.sin(x / (d.buoc * 0.075) + 4.1)
    + d.bien * (MAP.nhieu || 0) * (fbm(x, MAP.seed || 1) * 2 - 1)
    + 1.6           * Math.sin(z / 26 + x / 400);
  /* hinh khoi ngang: bang 0 tren duong chay (z=0) nen khong doi can bang game,
     nhung tang dan ra hai ben nen dia hinh co go, ranh va thanh bo ro rang */
  const kz = Math.min(1, Math.abs(z) / 34);
  const ngang = d.bien * 1.05 * kz * (fbm2(x, z, (MAP.seed || 1) + 3) * 2 - 1);
  return (h + docTai(x) + vucTai(x) + ngang) * ease + vachTai(x, z) * ease;
}
export function slopeAt(x) { const d = 1.5; return (heightAt(x + d, 0) - heightAt(x - d, 0)) / (2 * d); }
export const padX = i => T.padFirst + i * T.padEvery;

/* ---------- mat san: chia duong thanh cac doan tron / dinh / nhun ---------- */
function sinhMatSan() {
  const ds = [];
  const s = MAP.san;
  let x = 160;
  let i = 0;
  while (x < DAI - 120) {
    const r = rnd(i * 3.7 + 11);
    const tong = s.bang + s.cat + s.nhun;
    let loai = null;
    if (tong > 0.01 && r < Math.min(0.82, tong * 0.8)) {
      const r2 = rnd(i * 5.1 + 29) * tong;
      loai = r2 < s.bang ? 'bang' : (r2 < s.bang + s.cat ? 'cat' : 'nhun');
    }
    const dai = 40 + rnd(i + 71) * 75;
    if (loai) ds.push({ tu: x, den: x + dai, loai });
    x += dai + 26 + rnd(i + 91) * 74;
    i++;
  }
  return ds;
}
export function matSanTai(ds, x) {
  for (const d of ds) if (x >= d.tu && x <= d.den) return MATSAN[d.loai];
  return MATSAN.binhthuong;
}

/* ---------- cay coi, moi map mot kieu, dang tron cho de thuong ---------- */
function dungCay(kieu, mauLa, mauThan, bien = 0) {
  const g = new THREE.Group();
  const laMat = new THREE.MeshStandardMaterial({ color: mauLa, roughness: 0.86, flatShading: true });
  const laMat2 = new THREE.MeshStandardMaterial({
    color: new THREE.Color(mauLa).multiplyScalar(1.22), roughness: 0.86, flatShading: true });
  const thanMat = new THREE.MeshStandardMaterial({ color: mauThan, roughness: 0.95, flatShading: true });
  const r = i => { const v = Math.sin((i + bien * 13.7) * 91.3) * 43758.5453; return v - Math.floor(v); };

  if (kieu === 'thong' || kieu === 'tron') {
    /* Thong nhieu tang: moi tang la mot vanh la XOE RA va HOI CHUI XUONG, giong
       tan thong that. Truoc day chi la 3 hinh non long nhau nen trong nhu cai chop. */
    const cao = 3.0 + r(1) * 1.4;
    const th = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.34, cao * 1.5, 6), thanMat);
    th.position.y = cao * 0.75; g.add(th);
    const soTang = 5 + Math.floor(r(2) * 3);
    for (let k = 0; k < soTang; k++) {
      const t = k / (soTang - 1);
      const y = cao * 0.55 + t * cao * 1.15;
      const bk = (2.35 - t * 1.75) * (0.88 + r(k + 3) * 0.24);
      const day = 0.5 - t * 0.2;
      const canh = new THREE.Mesh(new THREE.ConeGeometry(bk, day * 2.6, 7, 1, true),
        k % 2 ? laMat : laMat2);
      canh.position.y = y;
      canh.rotation.y = r(k + 9) * 6.28;
      g.add(canh);
      // vanh duoi xoe ra, tao mep tan la
      const mep = new THREE.Mesh(new THREE.ConeGeometry(bk * 1.16, day * 1.1, 7),
        k % 2 ? laMat2 : laMat);
      mep.position.y = y - day * 0.95;
      mep.rotation.y = canh.rotation.y + 0.4;
      g.add(mep);
    }
    const ngon = new THREE.Mesh(new THREE.ConeGeometry(0.42, 1.1, 6), laMat2);
    ngon.position.y = cao * 1.78; g.add(ngon);
  } else if (kieu === 'xuongrong') {
    const b = new THREE.Mesh(new THREE.CapsuleGeometry(0.8, 3.4, 3, 8), laMat);
    b.position.y = 2.4; g.add(b);
    for (const [dx, dy, rz, ln] of [[1.2, 3.0, -0.55, 1.5], [-1.1, 2.4, 0.6, 1.3], [0.9, 1.7, -0.75, 0.9]]) {
      const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.46, ln, 3, 7), laMat2);
      a.position.set(dx, dy, (r(4) - 0.5) * 0.5); a.rotation.z = rz; g.add(a);
    }
    const hoa = new THREE.Mesh(new THREE.SphereGeometry(0.3, 6, 5),
      new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.7, flatShading: true }));
    hoa.position.y = 4.3; g.add(hoa);
  } else if (kieu === 'tinhthe') {
    for (let k = 0; k < 5; k++) {
      const h2 = 1.2 + r(k) * 2.6;
      const c = new THREE.Mesh(new THREE.ConeGeometry(0.5 + r(k + 2) * 0.5, h2, 5), k % 2 ? laMat : laMat2);
      c.position.set((r(k * 3) - 0.5) * 2.2, h2 * 0.5, (r(k * 7) - 0.5) * 2.2);
      c.rotation.z = (r(k + 5) - 0.5) * 0.5; g.add(c);
    }
  } else {  // bongbong
    const th = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.14, 2.4, 5), thanMat);
    th.position.y = 1.2; g.add(th);
    for (let k = 0; k < 5; k++) {
      const bk = 0.55 + r(k) * 0.75;
      const s2 = new THREE.Mesh(new THREE.SphereGeometry(bk, 7, 6), k % 2 ? laMat : laMat2);
      s2.position.set((r(k * 5) - 0.5) * 2.0, 2.6 + k * 0.62, (r(k * 11) - 0.5) * 1.8);
      g.add(s2);
    }
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

/* Da khong deu: keo lech tung dinh cua khoi 20 mat, moi bien mot dang khac. */
function dungDa(bien, banKinh) {
  const g = new THREE.IcosahedronGeometry(banKinh, 0);
  const p2 = g.attributes.position;
  const r = i => { const v = Math.sin((i + bien * 37.1) * 127.3) * 43758.5453; return v - Math.floor(v); };
  for (let i = 0; i < p2.count; i++) {
    const k = 0.62 + r(i) * 0.72;
    p2.setXYZ(i, p2.getX(i) * k, p2.getY(i) * (k * 0.82), p2.getZ(i) * k);
  }
  g.computeVertexNormals();
  return g;
}

/* Bui co: ba la co det xoe ra. Day la thu lam mat dat trong co suc song. */
function dungCoTuft(bien) {
  const g = new THREE.Group();
  const r = i => { const v = Math.sin((i + bien * 53.9) * 71.7) * 43758.5453; return v - Math.floor(v); };
  const mat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.9, flatShading: true, side: THREE.DoubleSide });
  for (let k = 0; k < 3; k++) {
    const h2 = 0.5 + r(k) * 0.55;
    const la = new THREE.Mesh(new THREE.ConeGeometry(0.09, h2, 3), mat);
    la.position.set((r(k + 1) - 0.5) * 0.3, h2 * 0.5, (r(k + 4) - 0.5) * 0.3);
    la.rotation.z = (r(k + 7) - 0.5) * 0.85;
    la.rotation.x = (r(k + 11) - 0.5) * 0.6;
    g.add(la);
  }
  return g;
}

/* =======================================================================
   VAT PHAM: phai NHIN RA duoc no la cai gi. Truoc day nitro la mot cai
   hinh non, tien la mot cai dia mong, bong la mot qua cau tron - khong ai
   doan ra duoc. Gio dung tung cai thanh mot vat the that.
   ======================================================================= */

/* Binh nitro: than tru, hai dau bo tron, co co dai, van trang, van o dinh */
function dungBinhNitro() {
  const g = new THREE.Group();
  const than = new THREE.MeshStandardMaterial({ color: 0xff6a1f, roughness: 0.32, metalness: 0.35 });
  const den  = new THREE.MeshStandardMaterial({ color: 0x2c2f38, roughness: 0.5, metalness: 0.6 });
  const bac  = new THREE.MeshStandardMaterial({ color: 0xe8eef5, roughness: 0.25, metalness: 0.8 });

  const b = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 2.0, 12), than);
  g.add(b);
  for (const y of [1.0, -1.0]) {                       // hai dau bo tron
    const c = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 6,
      0, Math.PI * 2, 0, Math.PI / 2), than);
    c.position.y = y; if (y < 0) c.rotation.x = Math.PI; g.add(c);
  }
  for (const y of [0.42, -0.42]) {                     // hai dai sat
    const d = new THREE.Mesh(new THREE.CylinderGeometry(0.66, 0.66, 0.18, 12), bac);
    d.position.y = y; g.add(d);
  }
  const co = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.26, 0.5, 8), den);
  co.position.y = 1.72; g.add(co);
  const van = new THREE.Mesh(new THREE.TorusGeometry(0.24, 0.075, 6, 10), bac);
  van.position.y = 1.98; van.rotation.x = Math.PI / 2; g.add(van);
  return g;
}

/* Dong xu: vanh day, mat trong lom, co mot thanh ngang nhu chu S */
function dungDongXu() {
  const g = new THREE.Group();
  const vang  = new THREE.MeshStandardMaterial({ color: 0xffc93c, roughness: 0.22, metalness: 0.9 });
  const vangD = new THREE.MeshStandardMaterial({ color: 0xd99a10, roughness: 0.3, metalness: 0.85 });
  const than = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.26, 20), vangD);
  than.rotation.x = Math.PI / 2; g.add(than);
  const vanh = new THREE.Mesh(new THREE.TorusGeometry(1.0, 0.15, 7, 22), vang);
  g.add(vanh);
  for (const z of [0.15, -0.15]) {                     // mat dong xu hai ben
    const m = new THREE.Mesh(new THREE.CircleGeometry(0.9, 20), vang);
    m.position.z = z; if (z < 0) m.rotation.y = Math.PI; g.add(m);
  }
  for (const z of [0.2, -0.2]) {                       // dau tien dap noi
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.2, 1.05, 0.1), vangD);
    t.position.z = z; g.add(t);
    const t2 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.19, 0.1), vangD);
    t2.position.set(0, 0.3, z); g.add(t2);
    const t3 = new THREE.Mesh(new THREE.BoxGeometry(0.62, 0.19, 0.1), vangD);
    t3.position.set(0, -0.3, z); g.add(t3);
  }
  return g;
}

/* Lo xo nhun: bon vong xoay xep len nhau tren mot de tron. Nhin la biet nhay. */
function dungLoXo() {
  const g = new THREE.Group();
  const xanh = new THREE.MeshStandardMaterial({ color: 0x3ff0c0, roughness: 0.25, metalness: 0.55 });
  const de   = new THREE.MeshStandardMaterial({ color: 0x1d5f52, roughness: 0.6, metalness: 0.3 });
  const d = new THREE.Mesh(new THREE.CylinderGeometry(1.0, 1.1, 0.26, 16), de);
  d.position.y = -0.9; g.add(d);
  for (let k = 0; k < 4; k++) {
    const v = new THREE.Mesh(new THREE.TorusGeometry(0.72 - k * 0.06, 0.15, 6, 16), xanh);
    v.position.y = -0.62 + k * 0.42; v.rotation.x = Math.PI / 2;
    v.rotation.z = k * 0.4; g.add(v);
  }
  const mu = new THREE.Mesh(new THREE.SphereGeometry(0.62, 12, 8), xanh);
  mu.position.y = 1.16; mu.scale.y = 0.66; g.add(mu);
  return g;
}

/* Gop mot Group thanh mot BufferGeometry duy nhat de dung InstancedMesh. */
function gopGroup(g) {
  const geos = [];
  g.updateMatrixWorld(true);
  g.traverse(o => {
    if (!o.isMesh) return;
    const gg = o.geometry.clone();
    gg.applyMatrix4(o.matrixWorld);
    const col = new THREE.Color(o.material.color);
    const n = gg.attributes.position.count;
    const arr = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) { arr[i * 3] = col.r; arr[i * 3 + 1] = col.g; arr[i * 3 + 2] = col.b; }
    gg.setAttribute('color', new THREE.BufferAttribute(arr, 3));
    for (const k of Object.keys(gg.attributes)) if (!['position', 'normal', 'color'].includes(k)) gg.deleteAttribute(k);
    geos.push(gg);
  });
  return geos;
}

/* AO gia: dinh nao nam thap trong vat the thi toi hon. Rat re, va la thu lam
   cay/da/nha trong co khoi va "dinh xuong dat" thay vi phang nhu bia carton. */
function boAO(geos, manh = 0.42) {
  let lo = Infinity, hi = -Infinity;
  for (const g of geos) {
    const p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y < lo) lo = y; if (y > hi) hi = y; }
  }
  const cao = Math.max(0.001, hi - lo);
  for (const g of geos) {
    const p = g.attributes.position, c = g.attributes.color;
    if (!c) continue;
    for (let i = 0; i < p.count; i++) {
      const t = (p.getY(i) - lo) / cao;
      const k = 1 - manh * (1 - Math.min(1, Math.pow(t, 0.55)));
      c.setXYZ(i, c.getX(i) * k, c.getY(i) * k, c.getZ(i) * k);
    }
  }
  return geos;
}

function nhapGeo(geos) {
  let tong = 0, idx = 0;
  for (const g of geos) { tong += g.attributes.position.count; idx += g.index ? g.index.count : g.attributes.position.count; }
  const pos = new Float32Array(tong * 3), nor = new Float32Array(tong * 3), col = new Float32Array(tong * 3);
  const ind = new Uint32Array(idx);
  let vo = 0, io = 0;
  for (const g of geos) {
    const n = g.attributes.position.count;
    pos.set(g.attributes.position.array, vo * 3);
    nor.set(g.attributes.normal.array, vo * 3);
    col.set(g.attributes.color.array, vo * 3);
    if (g.index) { for (let i = 0; i < g.index.count; i++) ind[io + i] = g.index.array[i] + vo; io += g.index.count; }
    else { for (let i = 0; i < n; i++) ind[io + i] = i + vo; io += n; }
    vo += n;
  }
  const out = new THREE.BufferGeometry();
  out.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  out.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
  out.setAttribute('color', new THREE.BufferAttribute(col, 3));
  out.setIndex(new THREE.BufferAttribute(ind, 1));
  return out;
}

/* ================== DUNG CA THE GIOI CHO MOT MAP ================== */
export function buildWorld(scene, RAPIER, world, map) {
  setMap(map);
  const rac = [];                       // moi thu can xoa khi doi map
  const them = o => { scene.add(o); rac.push(o); return o; };

  /* ---- dia hinh ---- */
  const LEN = DAI + T.worldBack;
  const geo = new THREE.PlaneGeometry(LEN, T.worldWidth, T.segX, T.segZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const cTren = new THREE.Color(map.dat.tren), cDuoi = new THREE.Color(map.dat.duoi);
  const cDoc = new THREE.Color(map.datDoc || map.dat.duoi);
  const cDa = new THREE.Color(map.datDa || map.dat.duoi);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + LEN / 2 - T.worldBack;
    const z = pos.getZ(i);
    pos.setX(i, x);
    const y = heightAt(x, z);
    pos.setY(i, y);

    /* Mau mat dat theo DO CAO va DO DOC.
       Cho bang phang thi la co, suon doc thi lo dat nau, doc gat thi lo da.
       Day la thu lam dia hinh khong con la mot mang mau duy nhat, va la khac biet
       lon nhat so voi may tam anh mau m gui. */
    const t = Math.max(0, Math.min(1, (y + map.dia.bien) / (map.dia.bien * 2.2)));
    tmp.copy(cDuoi).lerp(cTren, t);
    const dx = heightAt(x + 3, z) - heightAt(x - 3, z);
    const dz = heightAt(x, z + 3) - heightAt(x, z - 3);
    const doDoc = Math.sqrt(dx * dx + dz * dz) / 6;          // 0 la phang
    const kDat = Math.max(0, Math.min(1, (doDoc - 0.44) / 0.42));
    const kDa  = Math.max(0, Math.min(1, (doDoc - 0.95) / 0.5));
    tmp.lerp(cDoc, kDat * 0.85).lerp(cDa, kDa * 0.8);
    /* van mau tan nhe tren cho phang, de dong bang khong con la mot mang mau duy nhat */
    const vet = fbm2(x * 0.9, z * 0.9, (map.seed || 1) + 31) * 2 - 1;
    const to  = nhieu2(x / 130, z / 130, (map.seed || 1) + 47) * 2 - 1;   // van lon
    tmp.offsetHSL(vet * 0.02 + to * 0.03, vet * 0.06 - 0.05 + to * 0.09, vet * 0.06 + to * 0.05);

    /* ---- LOI XE: mot vet dat mon chay doc giua map ----
       Anh m gui nao cung co mot duong mon, mot long suoi hay mot dai da vach
       ngang canh. Khong co no thi mat dat chi la mot mang mau khong loi ra loi vao. */
    const tim = 5 + 13 * (nhieu2(x / 210, 0, (map.seed || 1) + 61) * 2 - 1);
    const bAn = Math.abs(z - tim);
    const kLoi = Math.max(0, Math.min(1, 1 - (bAn - 5.5) / 7));
    if (kLoi > 0) tmp.lerp(cDoc, kLoi * 0.78).offsetHSL(0, -0.05 * kLoi, -0.03 * kLoi);
    cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const tDat = texDat(map.texDat || 'co');
  /* Truoc day lap LEN/7 = gan 300 lan, gay moire lap lanh nhu dom dom.
     Ha xuong con 1 lan moi 26 m, cong voi mipmap va anisotropy thi mat dat min. */
  tDat.repeat.set(LEN / 26, T.worldWidth / 26);
  const mesh = them(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, map: tDat, roughness: 0.95, metalness: 0, flatShading: true, envMapIntensity: 0.22
  })));
  mesh.receiveShadow = true;

  const verts = new Float32Array(pos.array);
  const idx = new Uint32Array(geo.index.array);
  const colDat = world.createCollider(
    RAPIER.ColliderDesc.trimesh(verts, idx).setFriction(1.1).setRestitution(0.05)
  );

  /* ---- mat san: ve thanh dai mau tren dat ---- */
  const matSan = sinhMatSan();
  for (const d of matSan) {
    const ms = MATSAN[d.loai];
    const dai = d.den - d.tu, n = Math.max(4, Math.round(dai / 6));
    /* lay dung buoc luoi cua dia hinh: dinh trung nhau nen khong bao gio xuyen qua dat */
    const bx = LEN / T.segX, bz = T.worldWidth / T.segZ;
    const nx = Math.max(2, Math.round(dai / bx)), nz = 10;
    const g2 = new THREE.PlaneGeometry(nx * bx, nz * bz, nx, nz);
    g2.rotateX(-Math.PI / 2);
    const p2 = g2.attributes.position;
    /* luoi dia hinh nam tai x = k*bx - worldBack va z = j*bz - worldWidth/2.
       Phai bat dinh dung vao do, khong phai vao boi so cua bx/bz. */
    const snapX = v => Math.round((v + T.worldBack) / bx) * bx - T.worldBack;
    const snapZ = v => Math.round((v + T.worldWidth / 2) / bz) * bz - T.worldWidth / 2;
    const x0 = snapX(d.tu + dai / 2);
    for (let i = 0; i < p2.count; i++) {
      const x = snapX(p2.getX(i) + x0);
      const z = snapZ(p2.getZ(i));
      p2.setX(i, x); p2.setZ(i, z); p2.setY(i, heightAt(x, z) + 0.12);
    }
    g2.computeVertexNormals();
    them(new THREE.Mesh(g2, new THREE.MeshStandardMaterial({
      color: ms.mau, roughness: d.loai === 'bang' ? 0.1 : 0.92,
      metalness: d.loai === 'bang' ? 0.5 : 0, transparent: true, opacity: 0.92, flatShading: true,
      envMapIntensity: d.loai === 'bang' ? 1.4 : 0.22
    })));
  }

  /* ---- bang tang toc ---- */
  const pads = [];
  const texPadShared = texPad();
  /* Bang tang toc that: mot cai DOC NGHIENG co thanh chan hai ben va vien phat
     sang, khong con la mot tam phang chim trong dat nhu truoc. */
  const padSau = new THREE.Shape();
  padSau.moveTo(-6.0, 0); padSau.lineTo(4.2, 0); padSau.lineTo(5.4, 2.55);
  padSau.lineTo(5.4, 3.0); padSau.lineTo(-6.0, 0.5); padSau.lineTo(-6.0, 0);
  const padGeo = new THREE.ExtrudeGeometry(padSau,
    { depth: 22, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.16, bevelSegments: 1 });
  padGeo.translate(0, 0, -11);   // hinh nghieng theo huong bay (X), be day 13 m theo Z
  const rayGeo = new THREE.BoxGeometry(10.6, 0.5, 0.62);   // thanh chan
  const vienGeo = new THREE.BoxGeometry(10.2, 0.16, 0.3);
  for (let i = 0; padX(i) < DAI - 200; i++) {
    const x = padX(i);
    const mat = new THREE.MeshStandardMaterial({ map: texPadShared, emissive: 0x1a8a55,
      emissiveIntensity: 0.42, roughness: 0.42, envMapIntensity: 0.5 });
    const nhom = new THREE.MeshStandardMaterial({ color: 0xd7dee8, roughness: 0.35, metalness: 0.7 });
    const vienMat = new THREE.MeshBasicMaterial({ color: 0x62ffc0 });
    const grp = them(new THREE.Group());
    const p = new THREE.Mesh(padGeo, mat);
    p.castShadow = true; p.receiveShadow = true; grp.add(p);
    for (const z of [11.1, -11.1]) {                 // thanh chan hai ben
      const r = new THREE.Mesh(rayGeo, nhom);
      r.position.set(-0.3, 1.0, z); r.rotation.z = 0.17; r.castShadow = true; grp.add(r);
      const vi = new THREE.Mesh(vienGeo, vienMat);
      vi.position.set(-0.3, 1.32, z); vi.rotation.z = 0.17; grp.add(vi);
    }
    /* Ba mui nhon chi ve phia truoc tren mat doc, de nhin la biet day la bang
       tang toc chu khong phai mot tam tham mau xanh. */
    for (let k = 0; k < 3; k++) {
      const mn = new THREE.Mesh(new THREE.ConeGeometry(1.5, 2.4, 4),
        new THREE.MeshBasicMaterial({ color: 0xeafff6 }));
      mn.rotation.x = -Math.PI / 2; mn.rotation.y = Math.PI / 4;
      mn.position.set(-3.4 + k * 3.1, 0.62 + k * 0.72, 0);
      mn.rotation.z = 0.24; mn.scale.set(1, 1, 0.22); grp.add(mn);
    }
    grp.position.set(x, heightAt(x, 0) + 0.06, 0);
    grp.rotation.z = -Math.atan(slopeAt(x));
    pads.push({ x, mesh: grp, mat, used: false });
  }

  /* ---- CHUONG NGAI VAT ---- */
  const chuongNgai = [];
  {
    const thungGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
    const thungMat = new THREE.MeshStandardMaterial({ map: texThung(), roughness: 0.85, envMapIntensity: 0.3 });
    const loGeo = new THREE.TorusGeometry(1.5, 0.62, 6, 10);
    const loMat = new THREE.MeshStandardMaterial({ map: texLop(), roughness: 0.9, envMapIntensity: 0.3 });
    let x = 70, i = 0;
    while (x < DAI - 150) {
      const laLo = rnd(i * 2.3 + 5) < 0.42;
      const z = (rnd(i * 4.1 + 17) - 0.5) * 12;
      const y = heightAt(x, z);
      if (laLo) {
        const m = them(new THREE.Mesh(loGeo, loMat));
        m.position.set(x, y + 1.5, z); m.rotation.y = Math.PI / 2; m.castShadow = true;
        const c = world.createCollider(
          RAPIER.ColliderDesc.cylinder(0.7, 2.1).setTranslation(x, y + 1.5, z)
            .setRotation({ x: 0, y: 0, z: 0.7071, w: 0.7071 }).setRestitution(0.75).setFriction(0.5)
        );
        chuongNgai.push({ kieu: 'lo', x, z, mesh: m, col: c, song: true });
      } else {
        const m = them(new THREE.Mesh(thungGeo, thungMat));
        m.position.set(x, y + 1.2, z); m.castShadow = true;
        const c = world.createCollider(
          RAPIER.ColliderDesc.cuboid(1.2, 1.2, 1.2).setTranslation(x, y + 1.2, z)
            .setRestitution(0.1).setFriction(0.8)
        );
        chuongNgai.push({ kieu: 'thung', x, z, mesh: m, col: c, song: true });
      }
      x += (44 + rnd(i + 61) * 58) / Math.max(0.25, map.chuongNgai);
      i++;
    }
  }

  /* ---- VAT PHAM ---- */
  const vatPham = [];
  {
    /* Ba vat the dung san roi gop lai, moi loai chi ton 1 draw call.
       Kem mot vong sang duoi chan de nhin thay tu xa tren moi nen. */
    const geoNitro = nhapGeo(boAO(gopGroup(dungBinhNitro()), 0.2));
    const geoTien  = nhapGeo(boAO(gopGroup(dungDongXu()), 0.15));
    const geoBong  = nhapGeo(boAO(gopGroup(dungLoXo()), 0.2));
    const geoHao   = new THREE.TorusGeometry(1.9, 0.11, 6, 20);
    /* Vat pham xep thanh CHUM 3 den 5 cai mot hang, cung do cao va cung z.
       Truoc day rai le te thi bay ca luot chi an duoc 0 den 2 cai, gan nhu vo nghia.
       Xep thanh hang thi bay dung tuyen la quet duoc ca chum, thay ro cong suc ngam. */
    let x = 55, i = 0;
    while (x < DAI - 100) {
      const r = rnd(i * 6.7 + 3);
      const loai = r < 0.34 ? 'nitro' : (r < 0.74 ? 'tien' : 'bong');
      const vp = VATPHAM[loai];
      const z = (rnd(i * 8.3 + 41) - 0.5) * 9;
      const cao = 2.5 + rnd(i + 23) * 20;
      const soCai = loai === 'tien' ? 3 + Math.floor(rnd(i + 5) * 3) : 1;
      const g3 = loai === 'nitro' ? geoNitro : (loai === 'tien' ? geoTien : geoBong);
      for (let k = 0; k < soCai; k++) {
        const xx = x + k * 9;
        const yy = heightAt(xx, z) + cao;
        const m = them(new THREE.Mesh(g3, new THREE.MeshStandardMaterial({
          vertexColors: true, roughness: 0.3, metalness: 0.45,
          emissive: vp.mau, emissiveIntensity: 0.16, envMapIntensity: 1.1
        })));
        m.position.set(xx, yy, z);
        m.castShadow = true;
        const hao = new THREE.Mesh(geoHao, new THREE.MeshBasicMaterial({
          color: vp.mau, transparent: true, opacity: 0.5 }));
        hao.rotation.x = Math.PI / 2; hao.position.y = -1.5; m.add(hao);
        vatPham.push({ loai, x: xx, y: yy, z, mesh: m, an: false, bk: vp.bk });
      }
      x += soCai * 9 + (34 + rnd(i + 13) * 46) / Math.max(0.25, map.vatPham);
      i++;
    }
  }

  /* ---- DICH DEN ---- */
  const dichX = map.dich;
  const dich = new THREE.Group();
  {
    const dy = heightAt(dichX, 0);
    const texDichShared = texDich();
    const cotMat = new THREE.MeshStandardMaterial({ color: 0xff5f8a, roughness: 0.5, flatShading: true });
    const bangMat = new THREE.MeshStandardMaterial({ color: 0xffd45e, emissive: 0x7a5a12, roughness: 0.4 });
    for (const z of [9, -9]) {
      const c = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.7, 13, 8), cotMat);
      c.position.set(dichX, dy + 6.5, z); c.castShadow = true; dich.add(c);
    }
    const b = new THREE.Mesh(new THREE.BoxGeometry(1.0, 2.6, 19), bangMat);
    b.position.set(dichX, dy + 12.2, 0); dich.add(b);
    for (let k = 0; k < 9; k++) {
      const f = new THREE.Mesh(new THREE.BoxGeometry(0.3, 1.5, 1.5),
        new THREE.MeshStandardMaterial({ map: texDichShared, roughness: 0.6 }));
      f.position.set(dichX, dy + 10.2, -8 + k * 2); dich.add(f);
    }
    them(dich);
  }

  /* ---- cot moc 100 m ---- */
  {
    const postGeo = new THREE.BoxGeometry(0.4, 7, 0.4);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6, envMapIntensity: 0.3 });
    const n = Math.floor(DAI / 100);
    const posts = them(new THREE.InstancedMesh(postGeo, postMat, n * 2));
    const m4 = new THREE.Matrix4(); let k = 0;
    for (let i = 1; i <= n; i++) for (const z of [-17, 17]) {
      m4.makeTranslation(i * 100, heightAt(i * 100, z) + 3.5, z);
      posts.setMatrixAt(k++, m4);
    }
    posts.count = k; posts.castShadow = true;
  }

  /* ---- cay, da, hoa: dung InstancedMesh nen chi 3 draw call ---- */
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), sc = new THREE.Vector3(), tv = new THREE.Vector3();
  const UP = new THREE.Vector3(0, 1, 0);
  {
    const mau = map.cay.la;
    for (let variant = 0; variant < 3; variant++) {
      const mauV = new THREE.Color(mau[variant % mau.length]).offsetHSL(0, 0, (variant - 1) * 0.05);
      const proto = dungCay(map.cay.kieu, mauV.getHex(), map.cay.than, variant + 1);
      const merged = nhapGeo(boAO(gopGroup(proto)));
      const N = Math.round(150 * map.cay.matDo);
      const im = them(new THREE.InstancedMesh(merged, new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.9, flatShading: true, envMapIntensity: 0.25
      }), Math.max(1, N)));
      let c = 0;
      for (let i = variant; i < 3200 && c < N; i += 3) {
        const x = rnd(i * 1.7) * DAI;
        const side = rnd(i + 5000) > 0.5 ? 1 : -1;
        const z = side * (24 + rnd(i + 9000) * (T.worldWidth / 2 - 28));
        const s = 0.75 + rnd(i + 77) * 0.8;
        q.setFromAxisAngle(UP, rnd(i + 3) * 6.28); sc.set(s, s * (0.85 + rnd(i + 5) * 0.4), s);
        m4.compose(tv.set(x, heightAt(x, z), z), q, sc);
        im.setMatrixAt(c++, m4);
      }
      im.count = c; im.castShadow = true;
    }
  }
  for (let bien = 0; bien < 3; bien++) {
    const N = Math.round(80 * map.da.matDo);
    const mauD = new THREE.Color(map.da.mau).offsetHSL(0, 0, (bien - 1) * 0.045);
    const im = them(new THREE.InstancedMesh(dungDa(bien + 1, 1.4),
      new THREE.MeshStandardMaterial({ color: mauD, roughness: 0.95, flatShading: true, envMapIntensity: 0.3 }), Math.max(1, N)));
    let c = 0;
    for (let i = bien; i < 1800 && c < N; i += 3) {
      const x = rnd(i * 2.9 + 400) * DAI;
      const side = rnd(i + 700) > 0.5 ? 1 : -1;
      const z = side * (16 + rnd(i + 1300) * (T.worldWidth / 2 - 20));
      const s = 0.5 + rnd(i + 33) * 1.1;
      q.setFromAxisAngle(UP, rnd(i + 8) * 6.28); sc.set(s, s * (0.6 + rnd(i + 44) * 0.5), s);
      m4.compose(tv.set(x, heightAt(x, z) + s * 0.28, z), q, sc);
      im.setMatrixAt(c++, m4);
    }
    im.count = c; im.castShadow = true;
  }
  {
    const N = Math.round(130 * map.hoa.matDo);
    /* Hoa thanh CHUM 4 bong tren 4 cuong, khong con la mot qua cau don. */
    const proto = new THREE.Group();
    const cuongMat = new THREE.MeshStandardMaterial({ color: 0x64ad52 });
    const bongMat = new THREE.MeshStandardMaterial({ color: 0xffffff });
    for (let k = 0; k < 4; k++) {
      const hh = 0.42 + ((k * 37) % 11) / 11 * 0.34;
      const ox = ((k * 53) % 7) / 7 * 0.5 - 0.25, oz = ((k * 91) % 5) / 5 * 0.5 - 0.25;
      const st = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.045, hh, 3), cuongMat);
      st.position.set(ox, hh / 2, oz); proto.add(st);
      const hd = new THREE.Mesh(new THREE.SphereGeometry(0.15, 5, 4), bongMat);
      hd.position.set(ox, hh + 0.1, oz); proto.add(hd);
      for (let c2 = 0; c2 < 4; c2++) {
        const canh = new THREE.Mesh(new THREE.SphereGeometry(0.1, 4, 3), bongMat);
        canh.position.set(ox + Math.cos(c2 * 1.57) * 0.16, hh + 0.08, oz + Math.sin(c2 * 1.57) * 0.16);
        proto.add(canh);
      }
    }
    const merged = nhapGeo(boAO(gopGroup(proto)));
    const im = them(new THREE.InstancedMesh(merged, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.85, flatShading: true, envMapIntensity: 0.25
    }), Math.max(1, N)));
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, N) * 3), 3);
    const cc = new THREE.Color();
    let c = 0;
    for (let i = 0; i < N * 2 && c < N; i++) {
      const x = rnd(i * 3.1 + 900) * DAI;
      const z = (rnd(i + 2100) - 0.5) * (T.worldWidth * 0.82);
      if (Math.abs(z) < 9) continue;
      const s = 0.8 + rnd(i + 44) * 1.1;
      q.setFromAxisAngle(UP, rnd(i + 6) * 6.28); sc.set(s, s, s);
      m4.compose(tv.set(x, heightAt(x, z), z), q, sc);
      im.setMatrixAt(c, m4);
      cc.setHex(map.hoa.mau[Math.floor(rnd(i + 55) * map.hoa.mau.length) % map.hoa.mau.length]);
      im.setColorAt(c, cc);
      c++;
    }
    im.count = c;
  }

  /* ---- DAY NUI XA: hai ben va phia truoc, chi la bong nui nhung la thu lam
     the gioi trong do so va co chieu sau that. Rat re: vai tram tam giac. ---- */
  if (map.nuiXa) {
    const nx = map.nuiXa;
    for (let lop = 0; lop < nx.xa; lop++) {
      const xaZ = T.worldWidth * 0.62 + lop * 120;
      const caoLop = nx.cao * (1 - lop * 0.16);
      const mauLop = new THREE.Color(nx.mau).lerp(new THREE.Color(map.troi.giua), 0.28 + lop * 0.2);
      for (const ben of [1, -1]) {
        const n = Math.max(8, Math.round(DAI / 300));
        const pts = [];
        for (let i = 0; i <= n; i++) {
          const px = (i / n) * (DAI + 600) - 300;
          const hh = caoLop * (0.45 + 0.55 * Math.abs(Math.sin(px / (260 + lop * 90) + lop * 2 + ben)));
          pts.push(px, hh, 0);
        }
        // dung mot dai tam giac dang rang cua
        const v = [], idx = [];
        for (let i = 0; i <= n; i++) {
          v.push(pts[i * 3], 0, 0, pts[i * 3], pts[i * 3 + 1], 0);
        }
        for (let i = 0; i < n; i++) {
          const a = i * 2, b2 = i * 2 + 1, c2 = i * 2 + 2, d2 = i * 2 + 3;
          idx.push(a, c2, b2, b2, c2, d2);
        }
        const g4 = new THREE.BufferGeometry();
        g4.setAttribute('position', new THREE.Float32BufferAttribute(v, 3));
        g4.setIndex(idx); g4.computeVertexNormals();
        const m4x = them(new THREE.Mesh(g4, new THREE.MeshBasicMaterial({ color: mauLop, fog: true })));
        m4x.position.set(0, -4 + lop * 2, ben * xaZ);
        m4x.rotation.y = ben > 0 ? 0 : Math.PI;
        if (ben < 0) m4x.position.x = DAI;
      }
    }
  }

  /* ---- THEM VAT THE: bui cay, dong da, hang rao, cot moc lon ---- */
  {
    // bui cay thap, rai day hai ben
    const buiGeo = new THREE.SphereGeometry(1.0, 6, 5);
    const NB = Math.round(340 * (map.cay.matDo || 1));
    const bui = them(new THREE.InstancedMesh(buiGeo,
      // pha mau bui cay ve phia mau dat cua map, neu khong thi bui xanh nam tren
      // tuyet trang trong nhu nhung cai dia nhua
      new THREE.MeshStandardMaterial({
        color: new THREE.Color(map.cay.la[1]).lerp(new THREE.Color(map.dat.tren), 0.42),
        roughness: 0.9, flatShading: true, envMapIntensity: 0.22 }),
      Math.max(1, NB)));
    let c = 0;
    for (let i = 0; i < NB * 2 && c < NB; i++) {
      const x = rnd(i * 5.3 + 1700) * DAI;
      const z = (rnd(i + 3100) - 0.5) * (T.worldWidth * 0.88);
      if (Math.abs(z) < 14) continue;
      const sx2 = 0.7 + rnd(i + 12) * 1.5;
      q.setFromAxisAngle(UP, rnd(i + 4) * 6.28); sc.set(sx2 * 1.3, sx2 * 0.72, sx2 * 1.1);
      m4.compose(tv.set(x, heightAt(x, z) + sx2 * 0.4, z), q, sc);
      bui.setMatrixAt(c++, m4);
    }
    bui.count = c; bui.castShadow = true;

    // dong da to: cum 3 tang da, tao diem nhan
    const daGeo = new THREE.DodecahedronGeometry(2.6, 0);
    const ND = 90;
    const dong = them(new THREE.InstancedMesh(daGeo,
      new THREE.MeshStandardMaterial({ color: map.da.mau, roughness: 0.94, flatShading: true, envMapIntensity: 0.3 }),
      ND));
    c = 0;
    for (let i = 0; i < ND * 3 && c < ND; i++) {
      const x = rnd(i * 7.1 + 2600) * DAI;
      const z = (rnd(i + 4400) - 0.5) * (T.worldWidth * 0.9);
      if (Math.abs(z) < 20) continue;
      const s2 = 0.8 + rnd(i + 21) * 1.6;
      q.setFromAxisAngle(UP, rnd(i + 9) * 6.28); sc.set(s2, s2 * 0.7, s2 * 0.9);
      m4.compose(tv.set(x, heightAt(x, z) + s2 * 0.6, z), q, sc);
      dong.setMatrixAt(c++, m4);
    }
    dong.count = c; dong.castShadow = true;

    // hang rao doc hai ben hanh lang, giup doc toc do va gioi han duong bay
    const coc = new THREE.BoxGeometry(0.2, 1.5, 0.2);
    const NR = Math.round(DAI / 9) * 2;
    const rao = them(new THREE.InstancedMesh(coc,
      new THREE.MeshStandardMaterial({ color: 0xf3ede0, roughness: 0.7, envMapIntensity: 0.3 }), NR));
    c = 0;
    for (let x = 60; x < DAI - 20 && c < NR - 2; x += 9) {
      for (const z of [26, -26]) {
        m4.makeTranslation(x, heightAt(x, z) + 0.75, z);
        rao.setMatrixAt(c++, m4);
      }
    }
    rao.count = c; rao.castShadow = true;
  }

  /* ---- BUI CO: hang nghin bui nho phu mat dat. Day la thu duy nhat lam mat dat
     trong co suc song thay vi mot mang mau. Ba bien the, mau nhat dan theo do cao. ---- */
  const viTriVat = [];   // ghi lai de dat dom bong tiep dat
  for (let bien = 0; bien < 3; bien++) {
    const proto = dungCoTuft(bien + 1);
    const merged = nhapGeo(boAO(gopGroup(proto)));
    const N = Math.round(700 * (map.hoa.matDo || 1));
    const mauCo = new THREE.Color(map.dat.tren).offsetHSL(0.03, 0.18, 0.06 + bien * 0.05);
    const im = them(new THREE.InstancedMesh(merged, new THREE.MeshStandardMaterial({
      color: mauCo, roughness: 0.92, flatShading: true, envMapIntensity: 0.18,
      side: THREE.DoubleSide
    }), Math.max(1, N)));
    let c = 0;
    for (let i = bien; i < N * 4 && c < N; i += 3) {
      const x = rnd(i * 1.13 + 5000) * DAI;
      const z = (rnd(i + 6100) - 0.5) * (T.worldWidth * 0.95);
      if (Math.abs(z) < 3.5) continue;
      const s2 = 0.8 + rnd(i + 17) * 1.5;
      q.setFromAxisAngle(UP, rnd(i + 6) * 6.28); sc.set(s2, s2 * (0.8 + rnd(i + 3) * 0.9), s2);
      m4.compose(tv.set(x, heightAt(x, z), z), q, sc);
      im.setMatrixAt(c++, m4);
    }
    im.count = c;
  }

  /* ---- DOM BONG TIEP DAT: mot dia toi mo duoi chan cay va da.
     Khong co no thi vat the trong nhu dang noi tren mat dat. Day la cach re de co
     hieu ung bong tiep xuc ma khong phai bat SSAO (rat nang tren dien thoai). ---- */
  {
    const dia = new THREE.CircleGeometry(1, 10);
    dia.rotateX(-Math.PI / 2);
    const NS = 900;
    const im = them(new THREE.InstancedMesh(dia, new THREE.MeshBasicMaterial({
      color: 0x000000, transparent: true, opacity: 0.13, depthWrite: false
    }), NS));
    let c = 0;
    for (let i = 0; i < 3200 && c < NS; i += 3) {
      const x = rnd(i * 1.7) * DAI;
      const side = rnd(i + 5000) > 0.5 ? 1 : -1;
      const z = side * (24 + rnd(i + 9000) * (T.worldWidth / 2 - 28));
      const s2 = (0.75 + rnd(i + 77) * 0.8) * 2.1;
      q.setFromAxisAngle(UP, 0); sc.set(s2, 1, s2);
      m4.compose(tv.set(x, heightAt(x, z) + 0.06, z), q, sc);
      im.setMatrixAt(c++, m4);
    }
    im.count = c;
  }

  return { mesh, pads, matSan, chuongNgai, vatPham, dich, dichX, rac, colDat };
}

/* Xoa sach the gioi cu de dung map khac. */
export function destroyWorld(scene, world, W) {
  for (const c of W.chuongNgai) if (c.song) { try { world.removeCollider(c.col, false); } catch (e) {} }
  try { world.removeCollider(W.colDat, false); } catch (e) {}
  for (const o of W.rac) {
    scene.remove(o);
    o.traverse && o.traverse(k => {
      if (k.geometry) k.geometry.dispose();
      if (k.material) (Array.isArray(k.material) ? k.material : [k.material]).forEach(m => m.dispose());
    });
    if (o.isMesh || o.isInstancedMesh) {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    }
  }
}
