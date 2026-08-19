import * as THREE from 'three';
import { TUNE as T } from './TUNE.js';

/* Vi tri 4 banh trong he toa do than xe. Xe huong theo truc +X. */
export function wheelPos(h) {
  const wx = h.dai * 0.72, wz = h.rong * 0.98, wy = -h.cao * 0.62;
  return [[wx, wy, wz], [wx, wy, -wz], [-wx, wy, wz], [-wx, wy, -wz]];
}

/* ---------- hinh xe dung bang khoi, moi kieu mot dang khac nhau ----------
   Khong dung file .glb vi hai ly do: khong ton dung luong tai ve, va m kiem
   soat duoc dang xe nen 4 xe nhin ra khac nhau ngay. Neu sau nay co file .glb
   thi dat duong dan vao cars.js, ham nay se khong duoc goi. */
function dungThanXe(def) {
  const h = def.hinh;
  const g = new THREE.Group();
  const son  = new THREE.MeshStandardMaterial({ color: def.mau, roughness: 0.34, metalness: 0.32, flatShading: true });
  const den  = new THREE.MeshStandardMaterial({ color: def.mauPhu, roughness: 0.62, flatShading: true });
  const kinh = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.85 });
  const lamp = new THREE.MeshStandardMaterial({ color: 0xffe9a3, emissive: 0xffc94d, emissiveIntensity: 0.75 });
  const add = (geo, mat, x, y, z, ry) => {
    const m = new THREE.Mesh(geo, mat);
    m.position.set(x, y, z); if (ry) m.rotation.z = ry;
    m.castShadow = true; g.add(m); return m;
  };
  const box = (a, b, c) => new THREE.BoxGeometry(a, b, c);

  const L = h.dai * 2, H = h.cao * 2, W = h.rong * 2;

  if (h.kieu === 'pickup') {
    add(box(L, H, W), son, 0, 0, 0);                              // khung
    add(box(L * 0.42, H * 1.5, W * 0.95), son, L * 0.16, H * 0.98, 0);   // cabin
    add(box(L * 0.36, H * 1.0, W * 0.9), kinh, L * 0.16, H * 1.2, 0);
    add(box(L * 0.44, H * 0.55, W), den, -L * 0.27, H * 0.5, 0);   // thung sau
    add(box(L * 0.02, H * 0.5, W * 0.96), den, -L * 0.49, H * 0.5, 0);
    add(box(L * 0.08, H * 0.7, W * 1.04), den, L * 0.47, -H * 0.1, 0); // can truoc
  } else if (h.kieu === 'dua') {
    add(box(L * 0.98, H, W), son, 0, 0, 0);
    add(box(L * 0.3, H * 1.15, W * 0.62), son, -L * 0.02, H * 0.92, 0);  // buong lai thap
    add(box(L * 0.24, H * 0.8, W * 0.58), kinh, -L * 0.02, H * 1.05, 0);
    add(box(L * 0.3, H * 0.16, W * 1.22), den, -L * 0.44, H * 1.15, 0);  // canh gio sau
    add(box(H * 0.2, H * 1.0, W * 0.12), den, -L * 0.44, H * 0.62, W * 0.5);
    add(box(H * 0.2, H * 1.0, W * 0.12), den, -L * 0.44, H * 0.62, -W * 0.5);
    add(box(L * 0.26, H * 0.3, W * 1.1), son, L * 0.44, -H * 0.25, 0);   // mui det
  } else if (h.kieu === 'diahinh') {
    add(box(L * 0.9, H * 0.9, W * 0.86), son, 0, H * 0.15, 0);
    add(box(L * 0.5, H * 1.25, W * 0.8), son, -L * 0.02, H * 1.0, 0);
    add(box(L * 0.44, H * 0.9, W * 0.84), kinh, -L * 0.02, H * 1.2, 0);
    add(box(L * 1.0, H * 0.28, W * 0.3), den, 0, -H * 0.42, 0);          // khung gam
    add(box(L * 0.16, H * 0.3, W * 1.02), den, L * 0.5, H * 0.1, 0);
    add(box(L * 0.16, H * 0.3, W * 1.02), den, -L * 0.5, H * 0.1, 0);
    add(box(L * 0.55, H * 0.14, W * 1.06), den, 0, H * 1.72, 0);         // gia noc
  } else {
    add(box(L, H, W), son, 0, 0, 0);                                     // hatch
    add(box(L * 0.55, H * 1.6, W * 0.94), son, -L * 0.06, H * 0.95, 0);
    add(box(L * 0.48, H * 1.05, W * 0.98), kinh, -L * 0.06, H * 1.12, 0);
    add(box(L * 1.01, H * 0.32, W * 0.86), den, 0, -H * 0.52, 0);
  }
  // den truoc
  for (const z of [W * 0.3, -W * 0.3]) add(box(L * 0.05, H * 0.3, W * 0.2), lamp, L * 0.5, H * 0.06, z);
  return g;
}

export function buildCar(scene, RAPIER, world, def, startX, startY) {
  const h = def.hinh;
  const ct = def.ct;

  /* ---------- vat ly ---------- */
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(startX, startY, 0)
      .setLinearDamping(T.linDamp)
      .setAngularDamping(T.angDamp)
      .setCcdEnabled(true)
  );
  const col = world.createCollider(
    RAPIER.ColliderDesc.cuboid(h.dai, h.cao, h.rong)
      .setMass(T.mass * ct.khoiLuong)
      .setRestitution(T.chassisRest).setFriction(0.7),
    body
  );

  const vc = world.createVehicleController(body);
  vc.indexUpAxis = 1;
  vc.setIndexForwardAxis = 0;
  const down = { x: 0, y: -1, z: 0 }, axle = { x: 0, y: 0, z: 1 };
  const wp = wheelPos(h);
  const susRest = T.susRest * ct.susRest;
  for (const [x, y, z] of wp) vc.addWheel({ x, y, z }, down, axle, susRest, h.banh);
  for (let i = 0; i < 4; i++) {
    vc.setWheelSuspensionStiffness(i, T.susStiff);
    vc.setWheelSuspensionCompression(i, T.susCompress);
    vc.setWheelSuspensionRelaxation(i, T.susRelax);
    vc.setWheelFrictionSlip(i, T.frictionSlip);
    vc.setWheelMaxSuspensionTravel(i, susRest);
  }

  /* ---------- hinh ---------- */
  const g = dungThanXe(def);

  const wheelGeo = new THREE.CylinderGeometry(h.banh, h.banh, h.benhBanh, 12);
  wheelGeo.rotateX(Math.PI / 2);
  const rimGeo = new THREE.BoxGeometry(h.banh * 0.9, h.banh * 0.26, h.benhBanh * 1.05);
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x1b1b21, roughness: 0.92, flatShading: true });
  const rimMat = new THREE.MeshStandardMaterial({ color: 0xc9ccd6, roughness: 0.35, metalness: 0.6 });
  const wheels = [];
  for (let i = 0; i < 4; i++) {
    const w = new THREE.Group();
    const tyre = new THREE.Mesh(wheelGeo, tyreMat); tyre.castShadow = true; w.add(tyre);
    const r1 = new THREE.Mesh(rimGeo, rimMat); w.add(r1);
    const r2 = new THREE.Mesh(rimGeo, rimMat); r2.rotation.z = Math.PI / 2; w.add(r2);
    g.add(w); wheels.push(w);
  }
  scene.add(g);

  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(T.blobRadius * (h.dai / 1.55), 18),
    new THREE.MeshBasicMaterial({ color: 0x0a1a08, transparent: true, opacity: T.blobOpacity, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  scene.add(blob);

  return { body, col, vc, group: g, wheels, blob, def, wp, susRest };
}

/* Xoa het xe cu khoi the gioi va khoi canh, de doi sang xe khac. */
export function destroyCar(scene, world, car) {
  world.removeVehicleController(car.vc);
  world.removeRigidBody(car.body);
  scene.remove(car.group);
  scene.remove(car.blob);
  car.group.traverse(o => {
    if (o.geometry) o.geometry.dispose();
    if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
  });
  car.blob.geometry.dispose(); car.blob.material.dispose();
}

export function syncCar(car) {
  const p = car.body.translation(), r = car.body.rotation();
  car.group.position.set(p.x, p.y, p.z);
  car.group.quaternion.set(r.x, r.y, r.z, r.w);
  for (let i = 0; i < 4; i++) {
    const susLen = car.vc.wheelSuspensionLength(i);
    const y = car.wp[i][1] - (susLen == null ? car.susRest : susLen);
    car.wheels[i].position.set(car.wp[i][0], y, car.wp[i][2]);
    const rot = car.vc.wheelRotation(i);
    if (rot != null) car.wheels[i].rotation.z = -rot;
  }
}
