import * as THREE from 'three';
import { TUNE as T } from './TUNE.js';
import { MATSAN, VATPHAM } from './maps.js';

/* Map dang choi. Phai goi setMap() truoc khi dung heightAt(). */
export let MAP = null;
export function setMap(m) { MAP = m; }

const rnd = i => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

/* Do cao dia hinh. NGUON SU THAT DUY NHAT: ca hinh anh lan vat ly deu sinh tu day. */
export function heightAt(x, z) {
  const d = MAP.dia;
  if (x < 0) x = 0;
  const ease = Math.min(1, Math.max(0, (x - T.flatRunway) / 140));
  const h =
      d.bien        * Math.sin(x / d.buoc)
    + d.bien * 0.55 * Math.sin(x / (d.buoc * 0.42) + 1.3)
    + d.bien * 0.24 * Math.sin(x / (d.buoc * 0.17) + 2.2)
    + d.bien * d.nham * Math.sin(x / (d.buoc * 0.075) + 4.1)
    + 1.6           * Math.sin(z / 26 + x / 400);
  return h * ease;
}
export function slopeAt(x) { const d = 1.5; return (heightAt(x + d, 0) - heightAt(x - d, 0)) / (2 * d); }
export const padX = i => T.padFirst + i * T.padEvery;

/* ---------- mat san: chia duong thanh cac doan tron / dinh / nhun ---------- */
function sinhMatSan() {
  const ds = [];
  const s = MAP.san;
  let x = 160;
  let i = 0;
  while (x < T.worldLength - 120) {
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
function dungCay(kieu, mauLa, mauThan) {
  const g = new THREE.Group();
  const laMat = new THREE.MeshStandardMaterial({ color: mauLa, roughness: 0.85, flatShading: true });
  const thanMat = new THREE.MeshStandardMaterial({ color: mauThan, roughness: 0.95, flatShading: true });
  if (kieu === 'thong') {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, 3.4, 6), thanMat));
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Mesh(new THREE.ConeGeometry(2.5 - k * 0.6, 3.2, 6), laMat);
      c.position.y = 3.0 + k * 1.7; g.add(c);
    }
  } else if (kieu === 'xuongrong') {
    g.add(new THREE.Mesh(new THREE.CapsuleGeometry(0.85, 3.6, 3, 6), laMat)).position.y = 2.4;
    const a = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.4, 3, 6), laMat);
    a.position.set(1.25, 3.0, 0); a.rotation.z = -0.5; g.add(a);
    const b2 = new THREE.Mesh(new THREE.CapsuleGeometry(0.5, 1.2, 3, 6), laMat);
    b2.position.set(-1.15, 2.5, 0); b2.rotation.z = 0.55; g.add(b2);
  } else if (kieu === 'tinhthe') {
    for (let k = 0; k < 3; k++) {
      const c = new THREE.Mesh(new THREE.OctahedronGeometry(1.1 + k * 0.5, 0), laMat);
      c.position.set((rnd(k * 7) - 0.5) * 1.6, 1.0 + k * 1.5, (rnd(k * 11) - 0.5) * 1.6);
      c.scale.y = 1.9; g.add(c);
    }
  } else if (kieu === 'bongbong') {
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.12, 0.12, 2.6, 5), thanMat)).position.y = 1.3;
    for (let k = 0; k < 3; k++) {
      const s = new THREE.Mesh(new THREE.SphereGeometry(1.15 - k * 0.18, 8, 6), laMat);
      s.position.set((rnd(k * 3.3) - 0.5) * 1.5, 3.4 + k * 1.15, (rnd(k * 9.1) - 0.5) * 1.5);
      g.add(s);
    }
  } else {  // tron: cay tan tron, de thuong nhat
    g.add(new THREE.Mesh(new THREE.CylinderGeometry(0.36, 0.5, 2.8, 5), thanMat)).position.y = 1.4;
    const s1 = new THREE.Mesh(new THREE.SphereGeometry(1.9, 8, 6), laMat); s1.position.y = 4.1; g.add(s1);
    const s2 = new THREE.Mesh(new THREE.SphereGeometry(1.35, 7, 5), laMat); s2.position.set(1.3, 3.4, 0.4); g.add(s2);
    const s3 = new THREE.Mesh(new THREE.SphereGeometry(1.2, 7, 5), laMat); s3.position.set(-1.15, 3.6, -0.5); g.add(s3);
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
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
  const LEN = T.worldLength + T.worldBack;
  const geo = new THREE.PlaneGeometry(LEN, T.worldWidth, T.segX, T.segZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  const cols = new Float32Array(pos.count * 3);
  const cTren = new THREE.Color(map.dat.tren), cDuoi = new THREE.Color(map.dat.duoi);
  const tmp = new THREE.Color();
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + LEN / 2 - T.worldBack;
    const z = pos.getZ(i);
    pos.setX(i, x);
    const y = heightAt(x, z);
    pos.setY(i, y);
    const t = Math.max(0, Math.min(1, (y + map.dia.bien) / (map.dia.bien * 2.2)));
    tmp.copy(cDuoi).lerp(cTren, t);
    cols[i * 3] = tmp.r; cols[i * 3 + 1] = tmp.g; cols[i * 3 + 2] = tmp.b;
  }
  geo.setAttribute('color', new THREE.BufferAttribute(cols, 3));
  geo.computeVertexNormals();
  const mesh = them(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    vertexColors: true, roughness: 0.92, metalness: 0, flatShading: true
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
    const g2 = new THREE.PlaneGeometry(dai, 40, n, 4);
    g2.rotateX(-Math.PI / 2);
    const p2 = g2.attributes.position;
    for (let i = 0; i < p2.count; i++) {
      const x = p2.getX(i) + d.tu + dai / 2, z = p2.getZ(i);
      p2.setX(i, x); p2.setY(i, heightAt(x, z) + 0.09);
    }
    g2.computeVertexNormals();
    them(new THREE.Mesh(g2, new THREE.MeshStandardMaterial({
      color: ms.mau, roughness: d.loai === 'bang' ? 0.12 : 0.9,
      metalness: d.loai === 'bang' ? 0.35 : 0, transparent: true, opacity: 0.92, flatShading: true
    })));
  }

  /* ---- bang tang toc ---- */
  const pads = [];
  const padGeo = new THREE.BoxGeometry(9, 0.5, 13);
  for (let i = 0; padX(i) < T.worldLength - 200; i++) {
    const x = padX(i);
    const mat = new THREE.MeshStandardMaterial({ color: 0x2ce88f, emissive: 0x1a8a55, roughness: 0.35 });
    const p = them(new THREE.Mesh(padGeo, mat));
    p.position.set(x, heightAt(x, 0) + 0.25, 0);
    p.rotation.z = -Math.atan(slopeAt(x));
    p.receiveShadow = true;
    pads.push({ x, mesh: p, mat, used: false });
  }

  /* ---- CHUONG NGAI VAT ---- */
  const chuongNgai = [];
  {
    const thungGeo = new THREE.BoxGeometry(2.4, 2.4, 2.4);
    const thungMat = new THREE.MeshStandardMaterial({ color: 0xc98a4b, roughness: 0.8, flatShading: true });
    const loGeo = new THREE.TorusGeometry(1.5, 0.62, 6, 10);
    const loMat = new THREE.MeshStandardMaterial({ color: 0x3a3a44, roughness: 0.9, flatShading: true });
    let x = 70, i = 0;
    while (x < T.worldLength - 150) {
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
    const geoNitro = new THREE.ConeGeometry(1.0, 2.2, 7);
    const geoTien = new THREE.CylinderGeometry(1.1, 1.1, 0.3, 12);
    const geoBong = new THREE.SphereGeometry(1.15, 9, 7);
    /* Vat pham xep thanh CHUM 3 den 5 cai mot hang, cung do cao va cung z.
       Truoc day rai le te thi bay ca luot chi an duoc 0 den 2 cai, gan nhu vo nghia.
       Xep thanh hang thi bay dung tuyen la quet duoc ca chum, thay ro cong suc ngam. */
    let x = 55, i = 0;
    while (x < T.worldLength - 100) {
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
          color: vp.mau, emissive: vp.mau, emissiveIntensity: 0.45, roughness: 0.3, metalness: 0.2
        })));
        m.position.set(xx, yy, z);
        if (loai === 'tien') m.rotation.z = Math.PI / 2;
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
        new THREE.MeshStandardMaterial({ color: k % 2 ? 0xffffff : 0xff5f8a, roughness: 0.6 }));
      f.position.set(dichX, dy + 10.2, -8 + k * 2); dich.add(f);
    }
    them(dich);
  }

  /* ---- cot moc 100 m ---- */
  {
    const postGeo = new THREE.BoxGeometry(0.4, 7, 0.4);
    const postMat = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.6 });
    const n = Math.floor(T.worldLength / 100);
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
    for (let variant = 0; variant < 2; variant++) {
      const proto = dungCay(map.cay.kieu, mau[variant], map.cay.than);
      const merged = nhapGeo(gopGroup(proto));
      const N = Math.round(210 * map.cay.matDo);
      const im = them(new THREE.InstancedMesh(merged, new THREE.MeshStandardMaterial({
        vertexColors: true, roughness: 0.88, flatShading: true
      }), Math.max(1, N)));
      let c = 0;
      for (let i = variant; i < 2400 && c < N; i += 2) {
        const x = rnd(i * 1.7) * T.worldLength;
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
  {
    const N = Math.round(150 * map.da.matDo);
    const im = them(new THREE.InstancedMesh(new THREE.DodecahedronGeometry(1.4, 0),
      new THREE.MeshStandardMaterial({ color: map.da.mau, roughness: 0.95, flatShading: true }), Math.max(1, N)));
    let c = 0;
    for (let i = 0; i < 1400 && c < N; i++) {
      const x = rnd(i * 2.9 + 400) * T.worldLength;
      const side = rnd(i + 700) > 0.5 ? 1 : -1;
      const z = side * (20 + rnd(i + 1300) * (T.worldWidth / 2 - 24));
      const s = 0.55 + rnd(i + 33) * 0.9;
      q.setFromAxisAngle(UP, rnd(i + 8) * 6.28); sc.set(s, s * 0.66, s);
      m4.compose(tv.set(x, heightAt(x, z) + s * 0.3, z), q, sc);
      im.setMatrixAt(c++, m4);
    }
    im.count = c; im.castShadow = true;
  }
  {
    const N = Math.round(240 * map.hoa.matDo);
    const proto = new THREE.Group();
    const st = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.5, 3),
      new THREE.MeshStandardMaterial({ color: 0x5fae4e })); st.position.y = 0.25; proto.add(st);
    const hd = new THREE.Mesh(new THREE.SphereGeometry(0.26, 5, 4),
      new THREE.MeshStandardMaterial({ color: 0xffffff })); hd.position.y = 0.58; proto.add(hd);
    const merged = nhapGeo(gopGroup(proto));
    const im = them(new THREE.InstancedMesh(merged, new THREE.MeshStandardMaterial({
      vertexColors: true, roughness: 0.8, flatShading: true
    }), Math.max(1, N)));
    im.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(Math.max(1, N) * 3), 3);
    const cc = new THREE.Color();
    let c = 0;
    for (let i = 0; i < N * 2 && c < N; i++) {
      const x = rnd(i * 3.1 + 900) * T.worldLength;
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
