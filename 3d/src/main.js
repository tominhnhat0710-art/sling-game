import * as THREE from 'three';
import RAPIER from 'rapier';
import { TUNE as T } from './TUNE.js';
import { heightAt, buildTerrain, padX } from './terrain.js';
import { buildCar, syncCar } from './car.js';
import { ChaseCam } from './camera.js';

const $ = id => document.getElementById(id);
const AIM = 0, POWER = 1, FLY = 2, DONE = 3;

/* =================== KHOI TAO =================== */
await RAPIER.init();

const scene = new THREE.Scene();
const FOG = 0x9fc4e6;
scene.fog = new THREE.Fog(FOG, T.fogNear, T.fogFar);

const cam = new THREE.PerspectiveCamera(60, innerWidth / innerHeight, 0.4, 5000);
const rn = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
rn.setSize(innerWidth, innerHeight);
rn.setPixelRatio(Math.min(devicePixelRatio, 2));
rn.shadowMap.enabled = true;
rn.shadowMap.type = THREE.PCFShadowMap;     // r185: PCFSoftShadowMap da deprecated
rn.toneMapping = THREE.ACESFilmicToneMapping;
rn.toneMappingExposure = 1.05;
document.body.appendChild(rn.domElement);

/* --- troi gradient, luon di theo camera --- */
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
const car = buildCar(scene, RAPIER, world, START_X, heightAt(START_X, 0) + 1.4);
const chase = new ChaseCam(cam);

/* --- duong ngam: chuoi diem du bao vong cung --- */
const dotGeo = new THREE.SphereGeometry(0.30, 7, 5);
const dotMat = new THREE.MeshBasicMaterial({ color: 0xffe08a });
const NDOT = 44;
const guide = new THREE.InstancedMesh(dotGeo, dotMat, NDOT);
guide.frustumCulled = false; scene.add(guide);

/* --- vet bay: chuoi cau nho, vi duong ke 1 pixel gan nhu vo hinh tren dien thoai --- */
const trail = new THREE.InstancedMesh(
  new THREE.SphereGeometry(0.3, 6, 5),
  new THREE.MeshBasicMaterial({ color: 0xffa33a }),
  T.trailPoints
);
trail.frustumCulled = false; scene.add(trail);
const trailPts = [];

/* =================== TRANG THAI =================== */
let phase = AIM, aimA = 0.5, aimDir = 1, pwr = 0, pwrDir = 1;
let nitroLeft = T.nitroCount, maxX = START_X, stillFor = 0, elapsed = 0, best = 0;
const m4 = new THREE.Matrix4(), v3 = new THREE.Vector3();

function resetRun() {
  phase = AIM; aimA = deg(T.aimMin) + 0.2; aimDir = 1; pwr = 0; pwrDir = 1;
  nitroLeft = T.nitroCount; maxX = START_X; stillFor = 0; elapsed = 0;
  trailPts.length = 0; trail.count = 0; lastTrail = null;
  car.body.setTranslation({ x: START_X, y: heightAt(START_X, 0) + 1.4, z: 0 }, true);
  car.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  car.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  car.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  for (const p of terrain.pads) { p.used = false; p.mat.color.setHex(0x25e08a); p.mat.emissive.setHex(0x0e6a41); }
  chase.reset(car.body.translation());
  $('result').classList.remove('on');
  guide.visible = true; trail.visible = false;
}
const deg = d => d * Math.PI / 180;

/* =================== DIEU KHIEN =================== */
function tap() {
  if (phase === AIM) { phase = POWER; return; }
  if (phase === POWER) {
    const sp = T.launchSpeed * (T.powerFloor + (1 - T.powerFloor) * pwr);
    car.body.setLinvel({ x: Math.cos(aimA) * sp, y: Math.sin(aimA) * sp, z: 0 }, true);
    car.body.applyTorqueImpulse({ x: 0, y: 0, z: -T.mass * 2.6 * (0.5 + pwr) }, true);
    phase = FLY; guide.visible = false; trail.visible = true;
    return;
  }
  if (phase === FLY && nitroLeft > 0) {
    nitroLeft--;
    const v = car.body.linvel();
    const s = Math.hypot(v.x, v.y, v.z) || 1;
    const dx = s > 2 ? v.x / s : 1, dy = s > 2 ? v.y / s : 0.3;
    car.body.setLinvel({
      x: v.x + dx * T.nitroPush,
      y: v.y + Math.max(T.nitroLift, dy) * T.nitroPush * 0.8,
      z: v.z * 0.6
    }, true);
    return;
  }
  if (phase === DONE) resetRun();
}
addEventListener('pointerdown', e => { if (e.target.tagName !== 'BUTTON') { e.preventDefault(); tap(); } }, { passive: false });
addEventListener('keydown', e => { if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(); } });
addEventListener('resize', () => {
  cam.aspect = innerWidth / innerHeight; cam.updateProjectionMatrix();
  rn.setSize(innerWidth, innerHeight);
});

/* =================== VAT LY MOI KHUNG =================== */
function stepPhysics(dt) {
  // giu xe dung yen truoc khi phong
  const braking = phase === AIM || phase === POWER;
  for (let i = 0; i < 4; i++) {
    car.vc.setWheelBrake(i, braking ? 900 : 0);
    car.vc.setWheelEngineForce(i, 0);
  }

  car.vc.updateVehicle(world.timestep);
  world.step();

  if (phase !== FLY) return;
  pushTrail();
  elapsed += dt;
  const p = car.body.translation(), v = car.body.linvel();
  if (p.x > maxX) maxX = p.x;

  // giu xe khong troi ra khoi hanh lang
  if (Math.abs(p.z) > 30) car.body.setLinvel({ x: v.x, y: v.y, z: v.z * 0.4 }, true);

  const alt = p.y - heightAt(p.x, p.z);
  let touching = false;
  for (let i = 0; i < 4; i++) if (car.vc.wheelIsInContact(i)) { touching = true; break; }
  const grounded = alt < T.groundAlt || touching;

  // Ma sat khi lan sat dat. Day la thu lam cho ban vong cung cao la chien thuat dung,
  // con truot la dat thi mat toc do rat nhanh.
  if (grounded) {
    const d = 1 - T.groundDrag;
    car.body.setLinvel({ x: v.x * d, y: v.y, z: v.z * d }, true);
  }

  // Bang tang toc: phai ROI xuong bang moi an duoc, khong truot ngang qua la an.
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
      break;
    }
  }

  // Ket thuc luot. Khong dua vao banh xe co cham dat khong, vi xe rat hay nam ngua
  // sau khi lon nhao, luc do khong banh nao cham dat va luot se khong bao gio ket thuc.
  const sp = Math.hypot(v.x, v.y, v.z);
  if (grounded && sp < T.stopSpeed) stillFor++; else stillFor = 0;
  if (stillFor > T.stopFrames || elapsed > T.maxSeconds) finish();
}

function finish() {
  phase = DONE;
  trail.visible = false;
  const m = Math.max(0, Math.round(maxX - START_X));
  const isBest = m > best; if (isBest) best = m;
  $('rDist').textContent = m.toLocaleString('en-US');
  $('rBest').textContent = best.toLocaleString('en-US') + ' m';
  $('rNew').style.display = isBest ? 'block' : 'none';
  setTimeout(() => $('result').classList.add('on'), 600);
}

/* =================== VE MOI KHUNG =================== */
function drawGuide() {
  // du bao vong cung theo cong thuc nem, bo qua can gio: du de nguoi choi uoc luong
  const p = car.body.translation();
  const sp = T.launchSpeed * (phase === POWER ? (T.powerFloor + (1 - T.powerFloor) * pwr) : 1);
  const vx = Math.cos(aimA) * sp, vy = Math.sin(aimA) * sp;
  let n = 0;
  for (let i = 1; i <= NDOT; i++) {
    const t = i * 0.062;
    const x = p.x + vx * t;
    const y = p.y + vy * t + 0.5 * T.gravity * t * t;
    if (y < heightAt(x, 0) - 1) break;
    const s = 0.62 + i / NDOT * 1.25;
    m4.makeScale(s, s, s); m4.setPosition(x, y, 0);
    guide.setMatrixAt(n++, m4);
  }
  guide.count = n;
  guide.instanceMatrix.needsUpdate = true;
}

let lastTrail = null;
function pushTrail() {
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
    const age = i / n;                          // 0 = cu nhat, 1 = moi nhat
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
  $('bar').style.display = phase === POWER ? 'block' : 'none';
  if (phase === POWER) $('barFill').style.width = (pwr * 100) + '%';
  const hints = { 0: 'CHAM DE CHON GOC', 1: 'CHAM DE PHONG', 2: nitroLeft > 0 ? 'CHAM DE DOT NITRO' : '', 3: '' };
  $('hint').textContent = hints[phase] || '';
  $('alt').textContent = Math.max(0, Math.round(p.y - heightAt(p.x, p.z))) + ' m';
}

/* =================== VONG LAP =================== */
let last = 0, acc = 0, physMs = 0, frames = 0;
function loop(ts) {
  const dt = last ? Math.min(0.05, (ts - last) / 1000) : 1 / 60;
  last = ts; acc += dt;

  if (phase === AIM) {
    aimA += T.aimSweep * aimDir * dt;
    if (aimA > deg(T.aimMax)) aimDir = -1;
    if (aimA < deg(T.aimMin)) aimDir = 1;
  }
  if (phase === POWER) {
    pwr += T.powerSweep * pwrDir * dt;
    if (pwr > 1) { pwr = 1; pwrDir = -1; }
    if (pwr < 0) { pwr = 0; pwrDir = 1; }
  }

  const t0 = performance.now();
  let steps = 0;
  while (acc >= world.timestep && steps < 5) { stepPhysics(world.timestep); acc -= world.timestep; steps++; }
  physMs += performance.now() - t0; frames++;

  syncCar(car);
  const p = car.body.translation(), v = car.body.linvel();

  // Dom bong: chieu theo huong nang de trung voi bong that, thay vi thang xuong duoi.
  const alt = Math.max(0, p.y - heightAt(p.x, p.z));
  const sox = T.sunOffset[0] / T.sunOffset[1], soz = T.sunOffset[2] / T.sunOffset[1];
  const bx = p.x - sox * alt, bz = p.z - soz * alt;
  car.blob.position.set(bx, heightAt(bx, bz) + 0.14, bz);
  const k = Math.max(0.45, 1 - alt / 60);
  car.blob.scale.setScalar(k);
  car.blob.material.opacity = T.blobOpacity * k;

  if (phase === AIM || phase === POWER) drawGuide();

  chase.update(p, v, phase === FLY || phase === DONE, dt);
  sky.position.copy(cam.position);

  // den di theo xe de bong do luon co
  sun.position.set(p.x + T.sunOffset[0], p.y + T.sunOffset[1], p.z + T.sunOffset[2]);
  sun.target.position.set(p.x, p.y, p.z);

  updateHud();
  rn.render(scene, cam);
  requestAnimationFrame(loop);
}

/* cho khung dau tien roi moi bo man cho */
resetRun();
$('loading').style.display = 'none';
requestAnimationFrame(loop);

// de test tu dong doc duoc trang thai
window.__game = {
  get phase() { return phase; }, get maxX() { return maxX; }, get best() { return best; },
  get nitroLeft() { return nitroLeft; }, get elapsed() { return elapsed; },
  get stillFor() { return stillFor; },
  get speed() { const v = car.body.linvel(); return Math.hypot(v.x, v.y, v.z); },
  get alt() { const p = car.body.translation(); return p.y - heightAt(p.x, p.z); },
  get resultShown() { return document.getElementById('result').classList.contains('on'); },
  get physPerFrame() { return physMs / Math.max(1, frames); },
  get info() { return { tris: rn.info.render.triangles, calls: rn.info.render.calls }; },
  get carPos() { const p = car.body.translation(); return { x: p.x, y: p.y, z: p.z }; },
  get groundUnderCar() { const p = car.body.translation(); return heightAt(p.x, p.z); },
  tap, resetRun,
  launchAt(angleDeg, power) { phase = POWER; aimA = deg(angleDeg); pwr = power; tap(); },
  /* Chay ca luot bang vat ly thuan, khong ve hinh. Dung de tu dong can bang so. */
  simulate(angleDeg, power, nitroAtApex = true) {
    resetRun();
    phase = POWER; aimA = deg(angleDeg); pwr = power; tap();
    let n = 0, fired = 0;
    const t0 = performance.now();
    while (phase === FLY && n < 6000) {
      if (nitroAtApex && nitroLeft > 0) {
        const v = car.body.linvel(), p = car.body.translation();
        if (v.y < 0 && (p.y - heightAt(p.x, p.z)) > 12) { tap(); fired++; }
      }
      stepPhysics(world.timestep);
      n++;
    }
    const padsUsed = terrain.pads.filter(q => q.used).length;
    return { m: Math.max(0, Math.round(maxX - START_X)), frames: n, seconds: +(n / 60).toFixed(1),
             nitroFired: fired, padsUsed, msPerStep: +((performance.now() - t0) / Math.max(1, n)).toFixed(3),
             ended: phase === DONE };
  }
};
