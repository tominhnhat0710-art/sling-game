import * as THREE from 'three';
import { TUNE as T } from './TUNE.js';
import { THAN } from './bodies.js';
import { sonXe, kinhXe, kimLoai, nhuaDen } from './gfx.js';

/* Vi tri 4 banh trong he toa do than xe. Xe huong theo truc +X. */
export function wheelPos(h) {
  const wx = h.dai * 0.72, wz = h.rong * 0.98, wy = -h.cao * 0.62;
  return [[wx, wy, wz], [wx, wy, -wz], [-wx, wy, wz], [-wx, wy, -wz]];
}

/* ---------- HINH XE dun tu bien dang cat doc ----------
   Thay vi ghep khoi hop, m lay ho so cat doc cua xe (nhin tu ben canh) roi
   dun ra theo be ngang, co vat canh. Canh vat lam anh sang bat vao vien xe,
   day chinh la thu lam xe khong con trong nhu cai hop. Cong voi son co lop
   bong phu va phan chieu moi truong thi hinh dang doc ra ngay la xe gi. */
function dunHinh(diem, day, vat) {
  const sh = new THREE.Shape();
  sh.moveTo(diem[0][0], diem[0][1]);
  for (let i = 1; i < diem.length; i++) sh.lineTo(diem[i][0], diem[i][1]);
  sh.closePath();
  const g = new THREE.ExtrudeGeometry(sh, {
    depth: day, bevelEnabled: true, bevelThickness: vat, bevelSize: vat,
    bevelSegments: 2, curveSegments: 2
  });
  g.translate(0, 0, -day / 2 - vat / 2);
  g.computeVertexNormals();
  return g;
}

function dungThanXe(def, mt) {
  const h = def.hinh;
  const B = THAN[h.kieu] || THAN.hatch;
  const g = new THREE.Group();
  const tyle = h.dai / 1.55;                    // co ban theo chieu dai than xe
  const rong = h.rong * 2;

  const son = mt.son, den = mt.den, kinh = mt.kinh, lamp = mt.lamp, crom = mt.crom;
  const add = (geo, mat) => { const m = new THREE.Mesh(geo, mat); m.castShadow = true; g.add(m); return m; };

  // than chinh
  const than = add(dunHinh(B.profile, rong * 0.92, B.vat), son);
  than.scale.set(tyle, tyle, 1);

  // kinh
  if (B.kinh) {
    const k = add(dunHinh(B.kinh.profile, rong * B.kinh.day, B.vat * 0.6), kinh);
    k.scale.set(tyle, tyle, 1);
    k.position.y = 0.02 * tyle;
    k.castShadow = false;
  }

  // mui che cua xe golf
  if (B.mui) {
    const m = add(new THREE.BoxGeometry((B.mui.den - B.mui.tu) * tyle, B.mui.day * tyle, rong * 0.92), son);
    m.position.set((B.mui.tu + B.mui.den) / 2 * tyle, B.mui.cao * tyle, 0);
    for (const [cx, cy] of B.cot) for (const cz of [rong * 0.4, -rong * 0.4]) {
      const c = add(new THREE.CylinderGeometry(0.055 * tyle, 0.055 * tyle, cy * tyle, 6), crom);
      c.position.set(cx * tyle, cy * tyle * 0.5, cz);
    }
  }

  // canh gio sau
  if (B.canhGio) {
    const w = add(new THREE.BoxGeometry(0.42 * tyle, B.canhGio.day * tyle, rong * B.canhGio.rong), son);
    w.position.set(B.canhGio.x * tyle, B.canhGio.cao * tyle, 0);
    for (const cz of [rong * 0.34, -rong * 0.34]) {
      const st = add(new THREE.BoxGeometry(0.1 * tyle, (B.canhGio.cao - 0.12) * tyle, 0.09 * tyle), den);
      st.position.set(B.canhGio.x * tyle, (B.canhGio.cao * 0.55) * tyle, cz);
    }
  }
  if (B.khuechtan) {
    const d = add(new THREE.BoxGeometry(0.3 * tyle, B.khuechtan.cao * tyle, rong * B.khuechtan.rong), den);
    d.position.set(B.khuechtan.x * tyle, -0.22 * tyle, 0);
  }

  // den truoc va den sau
  for (const cz of [rong * 0.3, -rong * 0.3]) {
    const l = add(new THREE.BoxGeometry(0.1 * tyle, 0.16 * tyle, 0.34 * tyle), lamp);
    l.position.set((B.profile[Math.floor(B.profile.length / 2)] ? h.dai * 0.97 : h.dai), -0.04 * tyle, cz);
    const r = add(new THREE.BoxGeometry(0.08 * tyle, 0.12 * tyle, 0.3 * tyle),
      new THREE.MeshStandardMaterial({ color: 0xff3b30, emissive: 0xd01b12, emissiveIntensity: 0.8, roughness: 0.4 }));
    r.position.set(-h.dai * 0.97, -0.02 * tyle, cz);
  }

  // ganh be duoi cho xe co than kin
  if (!B.mui) {
    const sk = add(new THREE.BoxGeometry(h.dai * 1.86, 0.16 * tyle, rong * 0.8), den);
    sk.position.y = -h.cao * 0.86;
  }
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
  const mt = {
    son: sonXe(def.mau), den: nhuaDen(), kinh: kinhXe(),
    crom: kimLoai(0xd8dde6, 0.22),
    lamp: new THREE.MeshStandardMaterial({ color: 0xfff3cf, emissive: 0xffd98a, emissiveIntensity: 1.4, roughness: 0.25 })
  };
  const g = dungThanXe(def, mt);

  const wheelGeo = new THREE.CylinderGeometry(h.banh, h.banh, h.benhBanh, 18);
  wheelGeo.rotateX(Math.PI / 2);
  const lopMat = new THREE.MeshStandardMaterial({ color: 0x121318, roughness: 0.82, metalness: 0.05, envMapIntensity: 0.35 });
  const vanhMat = kimLoai(0xdfe4ec, 0.18);
  const wheels = [];
  for (let i = 0; i < 4; i++) {
    const w = new THREE.Group();
    const lop = new THREE.Mesh(wheelGeo, lopMat); lop.castShadow = true; w.add(lop);
    // vanh: dia trung tam cong 5 nan hoa, nhin ra la banh xe chu khong phai cai lu
    const dia = new THREE.Mesh(new THREE.CylinderGeometry(h.banh * 0.58, h.banh * 0.58, h.benhBanh * 1.04, 14), vanhMat);
    dia.rotation.x = Math.PI / 2; w.add(dia);
    for (let k = 0; k < 5; k++) {
      const nan = new THREE.Mesh(new THREE.BoxGeometry(h.banh * 0.9, h.banh * 0.15, h.benhBanh * 1.06), vanhMat);
      nan.rotation.z = k * Math.PI / 5; w.add(nan);
    }
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
