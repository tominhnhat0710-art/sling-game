import * as THREE from 'three';
import { TUNE as T } from './TUNE.js';

/* Ham do cao dia hinh. Day la NGUON SU THAT DUY NHAT:
   ca hinh anh lan vat ly deu sinh ra tu ham nay, nen khong bao gio lech nhau. */
export function heightAt(x, z) {
  if (x < 0) x = 0;
  const ease = Math.min(1, Math.max(0, (x - T.flatRunway) / 140));
  const h =
      T.hillAmp        * Math.sin(x / T.hillWave)
    + T.hillAmp * 0.55 * Math.sin(x / (T.hillWave * 0.42) + 1.3)
    + T.hillAmp * 0.24 * Math.sin(x / (T.hillWave * 0.17) + 2.2)
    + 1.6              * Math.sin(z / 26 + x / 400);
  return h * ease;
}

export function slopeAt(x) {
  const d = 1.5;
  return (heightAt(x + d, 0) - heightAt(x - d, 0)) / (2 * d);
}

/* Vi tri bang tang toc thu i */
export const padX = i => T.padFirst + i * T.padEvery;

export function buildTerrain(scene, RAPIER, world) {
  /* ---- luoi hinh anh ---- */
  const geo = new THREE.PlaneGeometry(T.worldLength, T.worldWidth, T.segX, T.segZ);
  geo.rotateX(-Math.PI / 2);
  const pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) {
    const x = pos.getX(i) + T.worldLength / 2;   // doi ve goc 0 o vach xuat phat
    const z = pos.getZ(i);
    pos.setX(i, x);
    pos.setY(i, heightAt(x, z));
  }
  geo.computeVertexNormals();

  const mesh = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({
    color: 0x6aa85a, roughness: 0.95, metalness: 0, flatShading: true
  }));
  mesh.receiveShadow = true;
  scene.add(mesh);

  /* ---- collider vat ly: dung DUNG luoi tren, nen khong the lech ---- */
  const verts = new Float32Array(pos.array);      // da la [x,y,z] lien tiep
  const idx = new Uint32Array(geo.index.array);
  world.createCollider(
    RAPIER.ColliderDesc.trimesh(verts, idx).setFriction(1.1).setRestitution(0.12)
  );

  /* ---- cot moc 100 m ---- */
  const postGeo = new THREE.BoxGeometry(0.35, 7, 0.35);
  const postMat = new THREE.MeshStandardMaterial({ color: 0xf2f4f8, roughness: 0.7 });
  const nPosts = Math.floor(T.worldLength / 100);
  const posts = new THREE.InstancedMesh(postGeo, postMat, nPosts * 2);
  const m4 = new THREE.Matrix4();
  let k = 0;
  for (let i = 1; i <= nPosts; i++) {
    const x = i * 100;
    for (const z of [-16, 16]) {
      m4.makeTranslation(x, heightAt(x, z) + 3.5, z);
      posts.setMatrixAt(k++, m4);
    }
  }
  posts.count = k; posts.castShadow = true; scene.add(posts);

  /* ---- bang tang toc ---- */
  const pads = [];
  const padGeo = new THREE.BoxGeometry(9, 0.5, 13);
  for (let i = 0; padX(i) < T.worldLength - 200; i++) {
    const x = padX(i);
    const mat = new THREE.MeshStandardMaterial({
      color: 0x25e08a, emissive: 0x0e6a41, roughness: 0.4, metalness: 0.1
    });
    const p = new THREE.Mesh(padGeo, mat);
    p.position.set(x, heightAt(x, 0) + 0.25, 0);
    p.rotation.z = -Math.atan(slopeAt(x));
    p.receiveShadow = true;
    scene.add(p);
    pads.push({ x, mesh: p, mat, used: false });
  }

  /* ---- cay va da cho co chieu sau va cam giac toc do ---- */
  const rnd = (i) => { const s = Math.sin(i * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s); };

  const trunkGeo = new THREE.CylinderGeometry(0.35, 0.5, 3.2, 5);
  const leafGeo  = new THREE.ConeGeometry(2.4, 7.5, 6);
  const trunkMat = new THREE.MeshStandardMaterial({ color: 0x5b4433, roughness: 1, flatShading: true });
  const leafMat  = new THREE.MeshStandardMaterial({ color: 0x2f6b3a, roughness: 1, flatShading: true });

  const NT = 900;
  const trunks = new THREE.InstancedMesh(trunkGeo, trunkMat, NT);
  const leaves = new THREE.InstancedMesh(leafGeo,  leafMat,  NT);
  const rockGeo = new THREE.DodecahedronGeometry(1.5, 0);
  const rockMat = new THREE.MeshStandardMaterial({ color: 0x8a8f99, roughness: 1, flatShading: true });
  const rocks = new THREE.InstancedMesh(rockGeo, rockMat, 320);

  const q = new THREE.Quaternion(), sc = new THREE.Vector3(), tv = new THREE.Vector3();
  let ti = 0, ri = 0;
  for (let i = 0; i < 2600 && ti < NT; i++) {
    const x = rnd(i) * T.worldLength;
    const side = rnd(i + 5000) > 0.5 ? 1 : -1;
    const z = side * (22 + rnd(i + 9000) * (T.worldWidth / 2 - 26));
    const s = 0.7 + rnd(i + 77) * 0.8;
    const y = heightAt(x, z);
    if (rnd(i + 31) < 0.24 && ri < 320) {
      sc.set(s, s * 0.7, s);
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(i + 12) * 6.28);
      m4.compose(tv.set(x, y + 0.5 * s, z), q, sc);
      rocks.setMatrixAt(ri++, m4);
      continue;
    }
    q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), rnd(i + 3) * 6.28);
    sc.set(s, s, s);
    m4.compose(tv.set(x, y + 1.6 * s, z), q, sc);
    trunks.setMatrixAt(ti, m4);
    m4.compose(tv.set(x, y + 6.4 * s, z), q, sc);
    leaves.setMatrixAt(ti, m4);
    ti++;
  }
  trunks.count = ti; leaves.count = ti; rocks.count = ri;
  for (const m of [trunks, leaves, rocks]) { m.castShadow = true; scene.add(m); }

  return { mesh, pads };
}
