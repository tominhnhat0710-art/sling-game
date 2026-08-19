import * as THREE from 'three';
import RAPIER from 'rapier';
import { TUNE as T } from './TUNE.js';
import { heightAt, buildTerrain, padX } from './terrain.js';
import { buildCar, syncCar, wheelPos } from './car.js';
import { ChaseCam } from './camera.js';
import { Fx } from './fx.js';
import { Audio } from './audio.js';

const $ = id => document.getElementById(id);
const AIM = 0, FLY = 2, DONE = 3;
const deg = d => d * Math.PI / 180;

/* =================== KHOI TAO =================== */
await RAPIER.init();

const scene = new THREE.Scene();
const FOG = 0x9fc4e6;
scene.fog = new THREE.Fog(FOG, T.fogNear, T.fogFar);

const cam = new THREE.PerspectiveCamera(T.fovBase, innerWidth / innerHeight, 0.4, 5000);
const rn = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
rn.setSize(innerWidth, innerHeight);
rn.setPixelRatio(Math.min(devicePixelRatio, 2));
rn.shadowMap.enabled = true;
rn.shadowMap.type = THREE.PCFShadowMap;
rn.toneMapping = THREE.ACESFilmicToneMapping;
rn.toneMappingExposure = 1.05;
document.body.appendChild(rn.domElement);

/* --- troi gradient, di theo camera --- */
const sky = new THREE.Mesh(
  new THREE.SphereGeometry(1, 20, 14),
  new THREE.ShaderMaterial({
    uniforms: { cTop: { value: new THREE.Color(0x2c5896) },
                cMid: { value: new THREE.Color(0x9fc4e6) },
                cBot: { value: new THREE.Color(0xe7d6b8) } },
    vertexShader: 'varying vec3 vP; void main(){ vP = position; gl_Position = projectionMatrix * modelViewMatrix * vec4(position,1.0); }',
    fragmentShader: `uniform vec3 cTop, cMid, cBot; varying vec3 vP;
      void main(){ float h = normalize(vP).y;
        vec3 c = h > 0.0 ? mix(cMid, cTop, pow(h, 0.62)) : mix(cMid, cBot, pow(-h, 0.45));
        gl_FragColor = vec4(c, 1.0); }`,
    side: THREE.BackSide, depthWrite: false, fog: false
  })
);
sky.scale.setScalar(2400); scene.add(sky);

/* --- anh sang --- */
scene.add(new THREE.HemisphereLight(0xbdd8ff, 0x4c6b3c, 0.62));
const sun = new THREE.DirectionalLight(0xfff2d6, 2.35);
sun.castShadow = true;
sun.shadow.mapSize.set(1024, 1024);
sun.shadow.bias = -0.0012;
const sc = sun.shadow.camera;
sc.left = -T.shadowSpan; sc.right = T.shadowSpan;
sc.top = T.shadowSpan; sc.bottom = -T.shadowSpan;
sc.near = 1; sc.far = 260;
scene.add(sun); scene.add(sun.target);

/* --- the gioi vat ly --- */
const world = new RAPIER.World({ x: 0, y: T.gravity, z: 0 });
world.timestep = 1 / 60;
const terrain = buildTerrain(scene, RAPIER, world);

const START_X = 10;
const car = buildCar(scene, RAPIER, world, START_X, heightAt(START_X, 0) + T.slingHeight);
const chase = new ChaseCam(cam);
const fx = new Fx(scene);
const audio = new Audio();

/* --- duong ngam du bao --- */
const dotGeo = new THREE.SphereGeometry(0.34, 7, 5);
const dotMat = new THREE.MeshBasicMaterial({ color: 0xffe08a, transparent: true, opacity: 0.8 });
const NDOT = Math.max(1, T.guideDots);
const guide = new THREE.InstancedMesh(dotGeo, dotMat, NDOT);
guide.frustumCulled = false; scene.add(guide);

/* --- cot sang bao diem roi du kien --- */
const ring = new THREE.Group();
const beaconMat = new THREE.MeshBasicMaterial({ color: 0xffb037, transparent: true, opacity: 0.34,
                                                depthWrite: false, depthTest: false, fog: false,
                                                side: THREE.DoubleSide });
const beacon = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.6, 1, 12, 1, true), beaconMat);
ring.add(beacon);
const disc = new THREE.Mesh(
  new THREE.RingGeometry(2.2, 3.6, 26),
  new THREE.MeshBasicMaterial({ color: 0xffc247, transparent: true, opacity: 0.9,
                                side: THREE.DoubleSide, depthWrite: false, depthTest: false, fog: false })
);
disc.rotation.x = -Math.PI / 2; disc.position.y = 0.18; ring.add(disc);
ring.renderOrder = 999; beacon.renderOrder = 999; disc.renderOrder = 1000;
scene.add(ring);

/* --- GIAN PHONG SLING ---
   Hai cot dung, xe nam trong tui giua hai cot. Keo cang thi xe lui ve sau va hai
   day cao su cang theo, doi mau tu xanh sang do. Tui phai o tren cao, neu de sat
   dat thi keo xuong la xe chui xuong duoi mat dat. */
const GY = heightAt(START_X, 0);
const ANCHOR = new THREE.Vector3(START_X, GY + T.slingHeight, 0);
const sling = new THREE.Group(); scene.add(sling);
const frameMat = new THREE.MeshStandardMaterial({ color: 0x4a4f5c, roughness: 0.7, metalness: 0.3, flatShading: true });
for (const z of [T.slingSpan, -T.slingSpan]) {
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.42, T.slingHeight + 0.9, 7), frameMat);
  post.position.set(START_X, GY + (T.slingHeight + 0.9) / 2, z);
  post.castShadow = true; sling.add(post);
  const cap = new THREE.Mesh(new THREE.SphereGeometry(0.42, 8, 6), frameMat);
  cap.position.set(START_X, GY + T.slingHeight + 0.9, z); sling.add(cap);
}
const bandMat = new THREE.MeshStandardMaterial({ color: 0x3ddc97, roughness: 0.45, emissive: 0x0a3a26, flatShading: true });
const bands = [];
for (let i = 0; i < 2; i++) {
  const bd = new THREE.Mesh(new THREE.CylinderGeometry(1, 1, 1, 6), bandMat);
  sling.add(bd); bands.push(bd);
}

/* --- vet bay --- */
const trail = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.3, 6, 5),
  new THREE.MeshBasicMaterial({ color: 0xffa33a, transparent: true, opacity: 0.55 }),
  Math.max(1, T.trailPoints)
);
trail.frustumCulled = false; scene.add(trail);
const trailPts = [];

/* =================== TRANG THAI =================== */
let phase = AIM;
let aimA = deg(42), power = 0;
let dragging = false, dragSx = 0, dragSy = 0, dragX = 0, dragY = 0;
let nitroLeft = T.nitroCount, maxX = START_X, stillFor = 0, elapsed = 0, best = 0, doneAt = 0;
let pv = { x: 0, y: 0, z: 0 }, impactSkip = 0, rollTick = 0;
const m4 = new THREE.Matrix4(), q1 = new THREE.Quaternion(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
const UPV = new THREE.Vector3(0, 1, 0);

function resetRun() {
  phase = AIM; aimA = deg(42); power = 0; dragging = false;
  nitroLeft = T.nitroCount; maxX = START_X; stillFor = 0; elapsed = 0;
  trailPts.length = 0; trail.count = 0; lastTrail = null;
  fx.clear();
  car.body.setTranslation({ x: START_X, y: heightAt(START_X, 0) + T.slingHeight, z: 0 }, true);
  car.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  car.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  car.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  pv = { x: 0, y: 0, z: 0 };
  for (const p of terrain.pads) { p.used = false; p.mat.color.setHex(0x25e08a); p.mat.emissive.setHex(0x0e6a41); }
  chase.reset(car.body.translation());
  cam.fov = T.fovBase; cam.updateProjectionMatrix();
  $('result').classList.remove('on');
  guide.visible = true; ring.visible = true; trail.visible = false;
  for (const bd of bands) bd.visible = true;
}

/* =================== SLING: KEO VA THA =================== */
/* Anh xa cu keo tren man hinh sang huong ban.
   Luc ngam camera nhin tu ben canh, xe huong sang phai man hinh, nen:
     keo sang TRAI  -> ban ra TRUOC   (giong ban sung cao su)
     keo XUONG      -> ban LEN CAO
   Keo cang bao nhieu thi luc manh bao nhieu. */
function updateAimFromDrag() {
  const dx = dragX - dragSx, dy = dragY - dragSy;
  const len = Math.hypot(dx, dy);
  power = Math.min(1, len / T.pullMax);
  const right = -dx;       // keo trai thi ban phai
  const up = dy;           // keo xuong thi ban len
  if (len > 2) {
    let a = Math.atan2(up, right);
    a = Math.max(deg(T.aimMin), Math.min(deg(T.aimMax), a));
    aimA = a;
  }
}

function launchSpeedNow() {
  return T.launchSpeed * (T.powerFloor + (1 - T.powerFloor) * power);
}

function doLaunch() {
  const sp = launchSpeedNow();
  car.body.setLinvel({ x: Math.cos(aimA) * sp, y: Math.sin(aimA) * sp, z: 0 }, true);
  car.body.applyTorqueImpulse({ x: 0, y: 0, z: -T.mass * 2.6 * (0.5 + power) }, true);
  phase = FLY;
  guide.visible = false; ring.visible = false; trail.visible = true;
  for (const bd of bands) bd.visible = false;
  pv = car.body.linvel();
  impactSkip = 3;
  const p = car.body.translation();
  fx.burst(p.x - 1.5, p.y - 0.3, p.z, 26, { color: 0xb59a63, spread: 10, up: 8, life: 0.8, size: 1.9 });
  chase.addShake(T.shakeLaunch * (0.5 + power));
  audio.launch(power);
}

function fireNitro() {
  if (nitroLeft <= 0) return;
  nitroLeft--;
  const v = car.body.linvel(), p = car.body.translation();
  const s = Math.hypot(v.x, v.y, v.z) || 1;
  const dx = s > 2 ? v.x / s : 1, dy = s > 2 ? v.y / s : 0.3;
  car.body.setLinvel({
    x: v.x + dx * T.nitroPush,
    y: v.y + Math.max(T.nitroLift, dy) * T.nitroPush * 0.8,
    z: v.z * 0.6
  }, true);
  impactSkip = 3;
  fx.burst(p.x - dx * 2, p.y - dy * 2, p.z, 34, {
    color: 0xff7a2f, spread: 5, up: 2.5, life: 0.7, size: 2.3, grav: 2,
    dir: { x: -dx * 13, y: -dy * 13, z: 0 }
  });
  chase.addShake(7);
  audio.whoosh();
}

/* =================== DIEU KHIEN =================== */
function onDown(e) {
  audio.init();
  if (phase === AIM) {
    dragging = true;
    dragSx = dragX = e.clientX; dragSy = dragY = e.clientY;
    power = 0;
  } else if (phase === FLY) {
    fireNitro();
  } else if (phase === DONE) {
    if (performance.now() - doneAt < 800) return;   // tranh cham lung lam mat man ket qua
    resetRun();
  }
}
function onMove(e) {
  if (!dragging) return;
  const oldP = power;
  dragX = e.clientX; dragY = e.clientY;
  updateAimFromDrag();
  if (Math.abs(power - oldP) > 0.07) audio.stretch(power);
}
function onUp() {
  if (!dragging) return;
  dragging = false;
  const len = Math.hypot(dragX - dragSx, dragY - dragSy);
  if (len < T.pullMin) { power = 0; return; }        // cham nham thi khong ban
  doLaunch();
}
addEventListener('pointerdown', e => { if (e.target.tagName === 'BUTTON') return; e.preventDefault(); onDown(e); }, { passive: false });
addEventListener('pointermove', e => { if (dragging) { e.preventDefault(); onMove(e); } }, { passive: false });
addEventListener('pointerup', onUp);
addEventListener('pointercancel', () => { dragging = false; power = 0; });
addEventListener('keydown', e => {
  if (e.code !== 'Space' && e.code !== 'Enter') return;
  e.preventDefault(); audio.init();
  if (phase === AIM) { power = 1; doLaunch(); }
  else if (phase === FLY) fireNitro();
  else if (phase === DONE && performance.now() - doneAt > 800) resetRun();
});
addEventListener('resize', () => {
  cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  rn.setSize(innerWidth, innerHeight);
});

/* =================== VAT LY =================== */
function stepPhysics(dt) {
  for (let i = 0; i < 4; i++) {
    car.vc.setWheelBrake(i, 0);
    car.vc.setWheelEngineForce(i, 0);
  }
  car.vc.updateVehicle(world.timestep);
  world.step();

  if (phase !== FLY) return;
  pushTrail();
  elapsed += dt;
  const p = car.body.translation(), v = car.body.linvel();
  if (p.x > maxX) maxX = p.x;

  /* --- phat hien va cham qua muc doi toc do --- */
  const dv = Math.hypot(v.x - pv.x, v.y - pv.y, v.z - pv.z);
  if (impactSkip > 0) impactSkip--;
  else if (dv > T.impactMin) {
    const gy = heightAt(p.x, p.z);
    fx.burst(p.x, gy + 0.35, p.z, Math.min(40, Math.round(dv * T.dustPerImpact)),
             { color: 0xa8965f, spread: dv * 0.55, up: dv * 0.5, life: 0.9, size: 1.7 });
    chase.addShake(dv * T.shakeImpact);
    audio.thud(dv);
  }
  pv = { x: v.x, y: v.y, z: v.z };

  const alt = p.y - heightAt(p.x, p.z);
  let touching = false;
  for (let i = 0; i < 4; i++) if (car.vc.wheelIsInContact(i)) { touching = true; break; }
  const grounded = alt < T.groundAlt || touching;

  if (grounded) {
    const d = 1 - T.groundDrag;
    car.body.setLinvel({ x: v.x * d, y: v.y, z: v.z * d }, true);
    // bui bay ra khi lan nhanh
    const sp2 = Math.hypot(v.x, v.z);
    if (sp2 > T.rollDustSpeed && (rollTick++ % 3 === 0)) {
      const wp = wheelPos();
      const w = wp[2 + (rollTick % 2)];
      fx.burst(p.x + w[0], heightAt(p.x, p.z) + 0.25, p.z + w[2], 2,
               { color: 0xb3a473, spread: 2.5, up: 2.4, life: 0.55, size: 0.85 });
    }
  }

  /* --- bang tang toc: phai ROI xuong moi an --- */
  if (v.y < T.padNeedFall && alt < 4.5) {
    let usedCount = 0;
    for (const pd of terrain.pads) if (pd.used) usedCount++;
    for (const pd of terrain.pads) {
      if (pd.used || Math.abs(p.x - pd.x) > 7) continue;
      const f = Math.pow(T.padDecay, usedCount);
      pd.used = true;
      pd.mat.color.setHex(0x6a7d74); pd.mat.emissive.setHex(0x000000);
      const vv = car.body.linvel();
      car.body.setLinvel({ x: vv.x * (1 + T.padGain * f), y: Math.abs(vv.y) * 0.35 + T.padLift * f, z: vv.z }, true);
      impactSkip = 3;
      fx.burst(pd.x, heightAt(pd.x, 0) + 0.6, 0, 30,
               { color: 0x3ddc97, spread: 7, up: 16, life: 0.9, size: 2.0, grav: -9 });
      chase.addShake(11); audio.pad();
      break;
    }
  }

  const sp = Math.hypot(v.x, v.y, v.z);
  if (grounded && sp < T.stopSpeed) stillFor++; else stillFor = 0;
  if (stillFor > T.stopFrames || elapsed > T.maxSeconds) finish();
}

function finish(stoppedByPlayer = false) {
  phase = DONE;
  doneAt = performance.now();
  trail.visible = false;
  $('btnStop').style.display = 'none';
  audio.setWind(0);
  const m = Math.max(0, Math.round(maxX - START_X));
  const isBest = m > best; if (isBest) best = m;
  $('rDist').textContent = m.toLocaleString('en-US');
  $('rBest').textContent = best.toLocaleString('en-US') + ' m';
  $('rWhy').textContent = stoppedByPlayer ? 'Ban tu bam dung' : '';
  $('rNew').style.display = isBest ? 'block' : 'none';
  if (isBest) audio.best();
  setTimeout(() => $('result').classList.add('on'), 600);
}

/* =================== VE =================== */
function predictLanding() {
  const p = car.body.translation();
  const sp = launchSpeedNow();
  const vx = Math.cos(aimA) * sp, vy = Math.sin(aimA) * sp;
  let t = 0;
  for (let i = 0; i < 700; i++) {
    t += 0.03;
    const x = p.x + vx * t;
    const y = p.y + vy * t + 0.5 * T.gravity * t * t;
    if (y <= heightAt(x, 0)) return x;
  }
  return p.x + vx * t;
}

/* Keo cang thi xe lui ve sau doc theo huong nguoc voi huong ban, va mui xe
   chia theo dung huong sap bay. Day la phan lam cu keo co cam giac that. */
function placeCarInSling() {
  const back = T.slingPull * power;
  const x = ANCHOR.x - Math.cos(aimA) * back;
  const y = Math.max(heightAt(x, 0) + 0.95, ANCHOR.y - Math.sin(aimA) * back);
  car.body.setTranslation({ x, y, z: 0 }, true);
  car.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  car.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  v1.set(Math.cos(aimA), Math.sin(aimA), 0);
  q1.setFromUnitVectors(new THREE.Vector3(1, 0, 0), v1);
  car.body.setRotation({ x: q1.x, y: q1.y, z: q1.z, w: q1.w }, true);
}

function drawAimHelpers() {
  placeCarInSling();
  const p = car.body.translation();
  const sp = launchSpeedNow();
  const vx = Math.cos(aimA) * sp, vy = Math.sin(aimA) * sp;

  // duong ngam
  let n = 0;
  if (T.guideDots > 0) {
    for (let i = 1; i <= T.guideDots; i++) {
      const t = i * 0.058;
      const x = p.x + vx * t;
      const y = p.y + vy * t + 0.5 * T.gravity * t * t;
      if (y < heightAt(x, 0) - 1) break;
      const s = 0.55 + i / T.guideDots * 1.85;
      m4.makeScale(s, s, s); m4.setPosition(x, y, 0);
      guide.setMatrixAt(n++, m4);
    }
  }
  guide.count = n;
  guide.instanceMatrix.needsUpdate = true;

  // cot sang diem roi
  const lx = predictLanding();
  const dist = Math.max(1, lx - p.x);
  ring.position.set(lx, heightAt(lx, 0), 0);
  // Cot phai to ra theo khoang cach, neu khong thi ban xa la cot mong nhu soi chi
  // va lan mat vao rung cay o duong chan troi.
  const h = T.beaconHeight + dist * T.beaconGrow;
  const w = 1 + dist * 0.019;
  beacon.scale.set(w, h, w);
  beacon.position.y = h / 2;
  const puls = 0.72 + 0.28 * Math.sin(performance.now() / 1000 * T.beaconPulse * 3.14);
  beaconMat.opacity = 0.30 + 0.24 * puls;
  disc.scale.setScalar(1 + dist * 0.022);
  disc.material.opacity = 0.6 + 0.35 * puls;

  // hai day cao su tu dinh cot toi xe
  const hue = 0.36 * (1 - power);                    // xanh -> vang -> do
  bandMat.color.setHSL(hue, 0.82, 0.52);
  bandMat.emissive.setHSL(hue, 0.8, 0.12);
  for (let i = 0; i < 2; i++) {
    const z = i ? -T.slingSpan : T.slingSpan;
    v1.set(START_X, ANCHOR.y + 0.9, z);              // dinh cot
    v2.set(p.x - v1.x, p.y - v1.y, p.z - v1.z);      // vector tu dinh cot toi xe
    const L2 = Math.max(0.2, v2.length());
    v2.normalize();
    q1.setFromUnitVectors(UPV, v2);
    bands[i].quaternion.copy(q1);
    bands[i].position.set(v1.x + v2.x * L2 / 2, v1.y + v2.y * L2 / 2, v1.z + v2.z * L2 / 2);
    bands[i].scale.set(T.bandWidth, L2, T.bandWidth);
  }
}

let lastTrail = null;
function pushTrail() {
  if (T.trailPoints <= 0) return;
  const p = car.body.translation();
  if (lastTrail) {
    const dx = p.x - lastTrail[0], dy = p.y - lastTrail[1], dz = p.z - lastTrail[2];
    if (dx * dx + dy * dy + dz * dz < T.trailSpacing * T.trailSpacing) return;
  }
  lastTrail = [p.x, p.y, p.z];
  trailPts.push(p.x, p.y, p.z);
  if (trailPts.length > T.trailPoints * 3) trailPts.splice(0, 3);
  const n = trailPts.length / 3;
  for (let i = 0; i < n; i++) {
    const age = i / n;
    const sz = 0.30 + age * 0.58;
    m4.makeScale(sz, sz, sz);
    m4.setPosition(trailPts[i * 3], trailPts[i * 3 + 1], trailPts[i * 3 + 2]);
    trail.setMatrixAt(i, m4);
  }
  trail.count = n;
  trail.instanceMatrix.needsUpdate = true;
}

function updateHud() {
  const p = car.body.translation();
  $('dist').textContent = Math.max(0, Math.round(Math.max(maxX, p.x) - START_X)).toLocaleString('en-US');
  $('bestHud').textContent = best.toLocaleString('en-US');
  const pips = $('nitro').children;
  for (let i = 0; i < pips.length; i++) pips[i].className = 'pip' + (i < nitroLeft ? ' on' : '');
  $('bar').style.display = dragging ? 'block' : 'none';
  if (dragging) $('barFill').style.width = (power * 100) + '%';
  $('btnStop').style.display = phase === FLY ? 'block' : 'none';
  $('angleBox').style.display = phase === AIM ? 'block' : 'none';
  if (phase === AIM) {
    $('angle').textContent = Math.round(aimA * 180 / Math.PI) + '°';
    $('pwr').textContent = Math.round(power * 100) + '%';
  }
  $('hint').textContent = phase === AIM
    ? (dragging ? 'THA RA DE BAN' : 'KEO XUONG VA VE SAU, ROI THA')
    : (phase === FLY && nitroLeft > 0 ? 'CHAM DE DOT NITRO' : '');
  $('alt').textContent = Math.max(0, Math.round(p.y - heightAt(p.x, p.z))) + ' m';
}

/* =================== VONG LAP =================== */
let last = 0, acc = 0, physMs = 0, frames = 0;
function loop(ts) {
  const dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60;
  last = ts; acc += dt;

  const t0 = performance.now();
  let steps = 0;
  while (acc >= world.timestep && steps < 5) { stepPhysics(world.timestep); acc -= world.timestep; steps++; }
  physMs += performance.now() - t0; frames++;

  syncCar(car);
  const p = car.body.translation(), v = car.body.linvel();
  const speed = Math.hypot(v.x, v.y, v.z);

  // dom bong chieu theo huong nang
  const alt = Math.max(0, p.y - heightAt(p.x, p.z));
  const sox = T.sunOffset[0] / T.sunOffset[1], soz = T.sunOffset[2] / T.sunOffset[1];
  const bx = p.x - sox * alt, bz = p.z - soz * alt;
  car.blob.position.set(bx, heightAt(bx, bz) + 0.14, bz);
  const k = Math.max(0.45, 1 - alt / 60);
  car.blob.scale.setScalar(k);
  car.blob.material.opacity = T.blobOpacity * k;

  if (phase === AIM) drawAimHelpers();
  fx.update(dt);

  chase.update(p, v, phase === FLY || phase === DONE, dt);
  sky.position.copy(cam.position);

  // mo goc camera theo toc do, tao cam giac nhanh
  const fovTarget = phase === FLY
    ? Math.min(T.fovMax, T.fovBase + speed * T.fovPerSpeed)
    : T.fovBase;
  if (Math.abs(cam.fov - fovTarget) > 0.05) {
    cam.fov += (fovTarget - cam.fov) * Math.min(1, dt * 4);
    cam.updateProjectionMatrix();
  }

  audio.setWind(phase === FLY ? speed : 0);

  sun.position.set(p.x + T.sunOffset[0], p.y + T.sunOffset[1], p.z + T.sunOffset[2]);
  sun.target.position.set(p.x, p.y, p.z);

  updateHud();
  rn.render(scene, cam);
  requestAnimationFrame(loop);
}

/* --- nut tat tieng --- */
let muted = false;
$('btnMute').addEventListener('click', e => {
  e.stopPropagation();
  muted = !muted;
  audio.init(); audio.setMuted(muted);
  $('btnMute').textContent = muted ? '\u{1F507}' : '\u{1F50A}';
});
$('btnMute').addEventListener('pointerdown', e => e.stopPropagation());

resetRun();
$('loading').style.display = 'none';
requestAnimationFrame(loop);

/* --- cong de test tu dong --- */
window.__game = {
  get phase() { return phase; }, get maxX() { return maxX; }, get best() { return best; },
  get nitroLeft() { return nitroLeft; }, get elapsed() { return elapsed; },
  get stillFor() { return stillFor; }, get power() { return power; },
  get angleDeg() { return aimA * 180 / Math.PI; },
  get speed() { const v = car.body.linvel(); return Math.hypot(v.x, v.y, v.z); },
  get alt() { const p = car.body.translation(); return p.y - heightAt(p.x, p.z); },
  get resultShown() { return document.getElementById('result').classList.contains('on'); },
  get physPerFrame() { return physMs / Math.max(1, frames); },
  get fxCount() { return fx.p.length; },
  get info() { return { tris: rn.info.render.triangles, calls: rn.info.render.calls }; },
  get carPos() { const p = car.body.translation(); return { x: p.x, y: p.y, z: p.z }; },
  get groundUnderCar() { const p = car.body.translation(); return heightAt(p.x, p.z); },
  get landingX() { return predictLanding(); },
  resetRun, fireNitro,
  setCam(aim, look) { if (aim) T.camAim = aim; if (look) T.camAimLook = look; chase.reset(car.body.translation()); },
  setDots(n) { T.guideDots = n; },
  beaconScreen() {
    const v = new THREE.Vector3().copy(ring.position); v.y += 8;
    v.project(cam);
    return { x: Math.round((v.x * 0.5 + 0.5) * innerWidth), y: Math.round((-v.y * 0.5 + 0.5) * innerHeight),
             visible: ring.visible, inFront: v.z < 1 };
  },
  stopNow() { if (phase === FLY) finish(true); },
  /* gia lap mot cu keo tha: dx, dy la so diem keo tren man hinh */
  dragLaunch(dx, dy) {
    dragging = true; dragSx = 200; dragSy = 400; dragX = 200 + dx; dragY = 400 + dy;
    updateAimFromDrag(); dragging = false;
    if (Math.hypot(dx, dy) < T.pullMin) return false;
    doLaunch(); return true;
  },
  setPull(dx, dy) { dragging = true; dragSx = 200; dragSy = 400; dragX = 200 + dx; dragY = 400 + dy; updateAimFromDrag(); dragging = false; },
  simulate(dx, dy, nitroAtApex = true) {
    resetRun();
    this.dragLaunch(dx, dy);
    let n = 0, fired = 0;
    while (phase === FLY && n < 6000) {
      if (nitroAtApex && nitroLeft > 0) {
        const v = car.body.linvel(), p = car.body.translation();
        if (v.y < 0 && (p.y - heightAt(p.x, p.z)) > 12) { fireNitro(); fired++; }
      }
      stepPhysics(world.timestep); n++;
    }
    return { m: Math.max(0, Math.round(maxX - START_X)), seconds: +(n / 60).toFixed(1),
             angle: Math.round(aimA * 180 / Math.PI), power: +power.toFixed(2),
             nitroFired: fired, padsUsed: terrain.pads.filter(q => q.used).length, ended: phase === DONE };
  }
};
