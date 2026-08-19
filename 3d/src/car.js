import * as THREE from 'three';
import { TUNE as T } from './TUNE.js';

/* Vi tri 4 banh trong he toa do than xe. Xe huong theo truc +X. */
export const wheelPos = () => [
  [ T.wheelX, T.wheelY,  T.wheelZ],
  [ T.wheelX, T.wheelY, -T.wheelZ],
  [-T.wheelX, T.wheelY,  T.wheelZ],
  [-T.wheelX, T.wheelY, -T.wheelZ]
];

export function buildCar(scene, RAPIER, world, startX, startY) {
  /* ---------- vat ly ---------- */
  const body = world.createRigidBody(
    RAPIER.RigidBodyDesc.dynamic()
      .setTranslation(startX, startY, 0)
      .setLinearDamping(T.linDamp)
      .setAngularDamping(T.angDamp)
      .setCcdEnabled(true)          // tranh xuyen qua dia hinh khi bay rat nhanh
  );
  const col = world.createCollider(
    RAPIER.ColliderDesc.cuboid(...T.chassis).setMass(T.mass).setRestitution(0.2).setFriction(0.7),
    body
  );

  const vc = world.createVehicleController(body);
  vc.indexUpAxis = 1;               // truc len la Y
  vc.setIndexForwardAxis = 0;       // truc truoc la X (ten setter dung nhu vay trong Rapier)
  const down = { x: 0, y: -1, z: 0 }, axle = { x: 0, y: 0, z: 1 };
  for (const [x, y, z] of wheelPos()) {
    vc.addWheel({ x, y, z }, down, axle, T.susRest, T.wheelRadius);
  }
  for (let i = 0; i < 4; i++) {
    vc.setWheelSuspensionStiffness(i, T.susStiff);
    vc.setWheelSuspensionCompression(i, T.susCompress);
    vc.setWheelSuspensionRelaxation(i, T.susRelax);
    vc.setWheelFrictionSlip(i, T.frictionSlip);
    vc.setWheelMaxSuspensionTravel(i, T.susRest);
  }

  /* ---------- hinh anh: xe low-poly ghep tu khoi ---------- */
  const g = new THREE.Group();
  const paint = new THREE.MeshStandardMaterial({ color: 0xd8382f, roughness: 0.32, metalness: 0.3, flatShading: true });
  const dark  = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.6, flatShading: true });
  const glass = new THREE.MeshStandardMaterial({ color: 0x9fd8ff, roughness: 0.08, metalness: 0.4, transparent: true, opacity: 0.85 });
  const lamp  = new THREE.MeshStandardMaterial({ color: 0xffe9a3, emissive: 0xffc94d, emissiveIntensity: 0.7 });

  const [hx, hy, hz] = T.chassis;
  const hull = new THREE.Mesh(new THREE.BoxGeometry(hx * 2, hy * 2, hz * 2), paint);
  hull.castShadow = true; g.add(hull);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(hx * 1.05, hy * 1.7, hz * 1.75), paint);
  cabin.position.set(-hx * 0.12, hy * 1.7, 0); cabin.castShadow = true; g.add(cabin);

  const wind = new THREE.Mesh(new THREE.BoxGeometry(hx * 0.94, hy * 1.15, hz * 1.82), glass);
  wind.position.set(-hx * 0.12, hy * 1.95, 0); g.add(wind);

  const skirt = new THREE.Mesh(new THREE.BoxGeometry(hx * 2.02, hy * 0.5, hz * 1.6), dark);
  skirt.position.y = -hy * 0.85; g.add(skirt);

  for (const z of [hz * 0.55, -hz * 0.55]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.18, 0.3, 0.42), lamp);
    l.position.set(hx * 1.02, hy * 0.1, z); g.add(l);
  }

  const wheelGeo = new THREE.CylinderGeometry(T.wheelRadius, T.wheelRadius, T.wheelWidth, 12);
  wheelGeo.rotateX(Math.PI / 2);                 // truc banh nam theo Z
  const rimGeo = new THREE.BoxGeometry(T.wheelRadius * 0.9, T.wheelRadius * 0.28, T.wheelWidth * 1.05);
  const tyreMat = new THREE.MeshStandardMaterial({ color: 0x1b1b21, roughness: 0.9, flatShading: true });
  const rimMat  = new THREE.MeshStandardMaterial({ color: 0xc9ccd6, roughness: 0.35, metalness: 0.6 });
  const wheels = [];
  for (let i = 0; i < 4; i++) {
    const w = new THREE.Group();
    const tyre = new THREE.Mesh(wheelGeo, tyreMat); tyre.castShadow = true; w.add(tyre);
    const rim = new THREE.Mesh(rimGeo, rimMat); w.add(rim);
    const rim2 = new THREE.Mesh(rimGeo, rimMat); rim2.rotation.z = Math.PI / 2; w.add(rim2);
    g.add(w); wheels.push(w);
  }
  scene.add(g);

  /* ---------- bong tron duoi xe: giup doc do cao khi bay ---------- */
  const blob = new THREE.Mesh(
    new THREE.CircleGeometry(T.blobRadius, 18),
    new THREE.MeshBasicMaterial({ color: 0x0a1a08, transparent: true, opacity: T.blobOpacity, depthWrite: false })
  );
  blob.rotation.x = -Math.PI / 2;
  scene.add(blob);

  return { body, col, vc, group: g, wheels, blob };
}

/* Dong bo hinh anh theo vat ly. Goi moi khung. */
export function syncCar(car) {
  const p = car.body.translation(), r = car.body.rotation();
  car.group.position.set(p.x, p.y, p.z);
  car.group.quaternion.set(r.x, r.y, r.z, r.w);

  const wp = wheelPos();
  for (let i = 0; i < 4; i++) {
    const susLen = car.vc.wheelSuspensionLength(i);
    const y = wp[i][1] - (susLen == null ? T.susRest : susLen);
    car.wheels[i].position.set(wp[i][0], y, wp[i][2]);
    const rot = car.vc.wheelRotation(i);
    if (rot != null) car.wheels[i].rotation.z = -rot;
  }
}
