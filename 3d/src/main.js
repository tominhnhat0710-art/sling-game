import * as THREE from 'three';
import RAPIER from 'rapier';
import { TUNE as T } from './TUNE.js';
import { heightAt, buildWorld, destroyWorld, padX, matSanTai, setMap, layDoc } from './terrain.js';
import { buildCar, syncCar, destroyCar, wheelPos } from './car.js';
import { ChaseCam } from './camera.js';
import { Fx } from './fx.js';
import { Audio } from './audio.js';
import { UPGRADES, giaCap } from './upgrades.js';
import * as SAVE from './save.js';
import { CARS } from './cars.js';
import { taoEnv, taoComposer } from './gfx.js';
import { MAPS, MATSAN } from './maps.js';

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
rn.shadowMap.type = THREE.PCFSoftShadowMap;
/* ACES lam mau bi bac va bot: troi xanh thanh xam trang. NeutralToneMapping
   (chuan Khronos PBR Neutral) giu duoc do tuoi cua mau, dung cho kieu do hoa
   mau tuoi nay hon han. */
rn.toneMapping = THREE.NeutralToneMapping;
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

// Env map da lo mot phan anh sang nen, nen den hemisphere phai ha xuong nhieu,
// khong thi canh bi bot mau va mat het do tuong phan.
const hemi = new THREE.HemisphereLight(0xdaf1ff, 0xa8dd86, 0.32);
let envTex = null;
function capNhatEnv(m) {
  if (envTex) envTex.dispose();
  envTex = taoEnv(rn, m.troi.tren, m.troi.giua, m.troi.duoi);
  scene.environment = envTex;
}

function apMauMap(m) {
  sky.material.uniforms.cTop.value.setHex(m.troi.tren);
  sky.material.uniforms.cMid.value.setHex(m.troi.giua);
  sky.material.uniforms.cBot.value.setHex(m.troi.duoi);
  // Mau suong lay trung binh giua troi va dat, va day ra xa hon, de canh xa mo dan
  // chu khong lam ca canh bi phu mot lop trang.
  scene.fog.color.setHex(m.troi.giua).lerp(new THREE.Color(m.dat.duoi), 0.28);
  scene.fog.near = m.suong[0] * 1.6; scene.fog.far = m.suong[1] * 1.7;
  sun.color.setHex(m.nang.mau); sun.intensity = m.nang.cuong * 1.25;
  hemi.color.setHex(m.nang.hemiTroi); hemi.groundColor.setHex(m.nang.hemiDat);
  hemi.intensity = m.nang.hemiCuong * 0.3;
  world.gravity = { x: 0, y: m.trongLuc, z: 0 };
  capNhatEnv(m);
}

/* --- anh sang --- */
const sun = new THREE.DirectionalLight(0xfff2d6, 2.35);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
sun.shadow.bias = -0.0006;
sun.shadow.normalBias = 0.035;
sun.shadow.radius = 3;
const sc = sun.shadow.camera;
sc.left = -T.shadowSpan; sc.right = T.shadowSpan;
sc.top = T.shadowSpan; sc.bottom = -T.shadowSpan;
sc.near = 1; sc.far = 260;
scene.add(sun); scene.add(sun.target); scene.add(hemi);

/* --- the gioi vat ly --- */
let MAP = SAVE.mapDangChoi();
setMap(MAP);
const world = new RAPIER.World({ x: 0, y: MAP.trongLuc, z: 0 });
world.timestep = 1 / 60;
let terrain = buildWorld(scene, RAPIER, world, MAP);

const START_X = 10;
let car = buildCar(scene, RAPIER, world, SAVE.xeDangDung(), START_X, heightAt(START_X, 0) + T.slingHeight);

/* Doi map: xoa sach the gioi cu roi dung lai theo bo so cua map moi. */
function doiMap() {
  MAP = SAVE.mapDangChoi();
  destroyWorld(scene, world, terrain);
  setMap(MAP);
  terrain = buildWorld(scene, RAPIER, world, MAP);
  apMauMap(MAP);
  doiXe();
  resetRun();
}

/* Doi sang dong xe khac: xoa han xe cu khoi the gioi vat ly roi dung xe moi.
   Phai xoa that, khong thi xe cu van nam do va van va cham. */
function doiXe() {
  destroyCar(scene, world, car);
  car = buildCar(scene, RAPIER, world, SAVE.xeDangDung(), START_X, heightAt(START_X, 0) + T.slingHeight);
}
const chase = new ChaseCam(cam);
const fx = new Fx(scene);
const audio = new Audio();
SAVE.load();
let CS = SAVE.chiSo();          // chi so xe hien tai, tinh lai sau moi lan nang cap

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
const frameMat = new THREE.MeshStandardMaterial({ color: 0xd4794f, roughness: 0.6, metalness: 0.12, flatShading: true, envMapIntensity: 0.35 });
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
let nitroLeft = T.nitroCount, maxX = START_X, stillFor = 0, elapsed = 0, doneAt = 0;
let menuOpen = true, levelSuspend = 0, firstLandUp = null, nitroCd = 0;
let tienX = START_X, tienT = 0;      // moc do 'con tien duoc khong'
let dangTiepDat = false, daVeDich = false, tienThem = 0, nitroHoi = 0;
const upTmp = new THREE.Vector3();
let pv = { x: 0, y: 0, z: 0 }, impactSkip = 0, rollTick = 0;
const m4 = new THREE.Matrix4(), q1 = new THREE.Quaternion(), v1 = new THREE.Vector3(), v2 = new THREE.Vector3();
const UPV = new THREE.Vector3(0, 1, 0);

function resetRun() {
  phase = AIM; aimA = deg(42); power = 0; dragging = false;
  CS = SAVE.chiSo();
  firstLandUp = null; nitroCd = 0; tienX = START_X; tienT = 0; dangTiepDat = false;
  daVeDich = false; tienThem = 0; nitroHoi = 0;
  nitroLeft = CS.soNitro; maxX = START_X; stillFor = 0; elapsed = 0; levelSuspend = 0;
  car.body.setLinearDamping(CS.canGio);
  car.col.setRestitution(T.chassisRest);
  for (let i = 0; i < 4; i++) car.vc.setWheelFrictionSlip(i, CS.bamDuong);
  veNitroPip();
  trailPts.length = 0; trail.count = 0; lastTrail = null;
  fx.clear();
  car.body.setTranslation({ x: START_X, y: heightAt(START_X, 0) + T.slingHeight, z: 0 }, true);
  car.body.setRotation({ x: 0, y: 0, z: 0, w: 1 }, true);
  car.body.setLinvel({ x: 0, y: 0, z: 0 }, true);
  car.body.setAngvel({ x: 0, y: 0, z: 0 }, true);
  pv = { x: 0, y: 0, z: 0 };
  for (const p of terrain.pads) { p.used = false; p.mat.color.setHex(0xffffff); p.mat.emissive.setHex(0x1a8a55); }
  for (const vp of terrain.vatPham) { vp.an = false; vp.mesh.visible = true; }
  for (const c of terrain.chuongNgai) {
    if (c.song) continue;
    c.song = true; c.mesh.visible = true;
    if (c.kieu === 'lo') {
      c.col = world.createCollider(RAPIER.ColliderDesc.cylinder(0.7, 2.1)
        .setTranslation(c.x, heightAt(c.x, c.z) + 1.5, c.z)
        .setRotation({ x: 0, y: 0, z: 0.7071, w: 0.7071 }).setRestitution(0.75).setFriction(0.5));
      c.mesh.material.color.setHex(0x3a3a44);
    } else {
      c.col = world.createCollider(RAPIER.ColliderDesc.cuboid(1.2, 1.2, 1.2)
        .setTranslation(c.x, heightAt(c.x, c.z) + 1.2, c.z).setRestitution(0.1).setFriction(0.8));
    }
  }
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
  return CS.tocDoPhong * (T.powerFloor + (1 - T.powerFloor) * power);
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
  fx.burst(p.x - 1.5, p.y - 0.3, p.z, 34, { color: 0xb59a63, spread: 17, up: 11, life: 0.55, size: 0.95 });
  chase.addShake(T.shakeLaunch * (0.5 + power));
  audio.launch(power);
}

function fireNitro() {
  if (nitroLeft <= 0 || nitroCd > 0) return;
  nitroLeft--;
  nitroCd = T.nitroCooldown;
  const v = car.body.linvel(), p = car.body.translation();
  const s = Math.hypot(v.x, v.y, v.z) || 1;
  const dx = s > 2 ? v.x / s : 1, dy = s > 2 ? v.y / s : 0.3;
  car.body.setLinvel({
    x: v.x + dx * CS.sucNitro,
    y: v.y + Math.max(T.nitroLift, dy) * CS.sucNitro * 0.8,
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
  if (menuOpen) return;
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
  if (menuOpen) return;
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
  if (nitroCd > 0) nitroCd -= dt;
  {
    const vv = car.body.linvel();
    const sp0 = Math.hypot(vv.x, vv.y, vv.z);
    if (sp0 > T.speedCap) {
      const k0 = T.speedCap / sp0;
      car.body.setLinvel({ x: vv.x * k0, y: vv.y * k0, z: vv.z * k0 }, true);
    }
  }
  const p = car.body.translation(), v = car.body.linvel();
  if (p.x > maxX) maxX = p.x;

  /* --- phat hien va cham qua muc doi toc do --- */
  const r0 = car.body.rotation();
  const dv = Math.hypot(v.x - pv.x, v.y - pv.y, v.z - pv.z);
  if (impactSkip > 0) impactSkip--;
  else if (dv > T.impactMin) {
    const gy = heightAt(p.x, p.z);
    fx.burst(p.x, gy + 0.35, p.z, Math.min(40, Math.round(dv * T.dustPerImpact)),
             { color: 0xa8965f, spread: dv * 0.55, up: dv * 0.5, life: 0.9, size: 1.7 });
    chase.addShake(dv * T.shakeImpact);
    audio.thud(dv);
    levelSuspend = T.levelRecover;
    if (firstLandUp === null) {
      const r0 = car.body.rotation();
      const up0 = new THREE.Vector3(0, 1, 0).applyQuaternion(new THREE.Quaternion(r0.x, r0.y, r0.z, r0.w));
      firstLandUp = +up0.y.toFixed(2);      // 1 = banh xuong dat, -1 = nam ngua
    }
  }
  pv = { x: v.x, y: v.y, z: v.z };

  const alt = p.y - heightAt(p.x, p.z);
  let touching = false;
  for (let i = 0; i < 4; i++) if (car.vc.wheelIsInContact(i)) { touching = true; break; }
  const grounded = alt < T.groundAlt || touching;

  /* --- CHAN QUAY DIEN ---
     Do duoc truoc day: xe quay toi 51 rad/s, tuc hon 8 vong moi giay. Do la
     nguyen nhan chinh cua cam giac 'vang tung toe'. Cat tran lai. */
  {
    const av = car.body.angvel();
    const spin = Math.hypot(av.x, av.y, av.z);
    if (spin > T.spinCap) {
      const k = T.spinCap / spin;
      car.body.setAngvel({ x: av.x * k, y: av.y * k, z: av.z * k }, true);
    }
  }

  /* --- NAY CO DIEU KHIEN ---
     Khi banh vua cham dat va dang roi nhanh, dao chieu van toc doc theo TRUC DUNG,
     tac dung dung tam xe. Nho vay xe nay cao ma khong sinh momen xoay. Thung xe
     thi de gan nhu khong nay, nen khong con canh dap goc thung roi lon nhao. */
  if (touching && !dangTiepDat) {
    dangTiepDat = true;
    const vv = car.body.linvel();
    if (vv.y < -T.nayMinFall) {
      const msN = matSanTai(terrain.matSan, p.x);
      car.body.setLinvel({ x: vv.x, y: -vv.y * Math.min(0.95, CS.doNay * msN.nay), z: vv.z }, true);
      fx.burst(p.x, heightAt(p.x, p.z) + 0.3, p.z, 8,
               { color: 0xd8c9a0, spread: 4, up: 4, life: 0.45, size: 1.1 });
    }
    const av2 = car.body.angvel();
    car.body.setAngvel({ x: av2.x * T.spinDamp, y: av2.y * T.spinDamp, z: av2.z * T.spinDamp }, true);
  } else if (!touching && alt > T.groundAlt) dangTiepDat = false;

  /* Tu can bang: khi dang bay tu do thi xoay xe ve the dap dat bang banh.
     Sau moi va cham thi tam ngung levelRecover giay, nen dam vao dia hinh
     van bi lon nhao that, chi la sau do xe tu chinh lai duoc. */
  if (levelSuspend > 0) levelSuspend -= dt;
  if (T.autoLevel > 0) {
    // Do 'ngua' hien tai: 1 la dung banh, -1 la nam ngua han
    upTmp.set(0, 1, 0).applyQuaternion(qCur.set(r0.x, r0.y, r0.z, r0.w));
    const nghieng = upTmp.y;
    // Chay khi dang bay, HOAC khi xe dang nghieng/nam ngua du dang sat dat.
    // Truoc day chi chay khi dang bay nen xe lat roi la nam do luon.
    if (!grounded || nghieng < T.tuDungLen) {
      const strength = levelSuspend > 0 ? T.levelWeak : 1;
      tuCanBang(dt, v, alt, strength);
    }
  }

  /* Nang cap Khi dong hoc: xe luon, tuc la bu lai mot phan trong luc khi dang bay. */
  if (!grounded && CS.luon > 0) {
    const vv2 = car.body.linvel();
    car.body.setLinvel({ x: vv2.x, y: vv2.y - T.gravity * CS.luon * dt, z: vv2.z }, true);
  }

  // Gio cua map: day ngang khi dang bay
  if (!grounded && MAP.gio) {
    const vg = car.body.linvel();
    car.body.setLinvel({ x: vg.x + MAP.gio * 9 * dt, y: vg.y, z: vg.z }, true);
  }

  const ms = matSanTai(terrain.matSan, p.x);
  if (grounded) {
    const d = 1 - CS.maSatLan * ms.maSat;
    car.body.setLinvel({ x: v.x * d, y: v.y, z: v.z * d }, true);
    // bui bay ra khi lan nhanh
    const sp2 = Math.hypot(v.x, v.z);
    if (sp2 > T.rollDustSpeed && (rollTick++ % 3 === 0)) {
      const w = car.wp[2 + (rollTick % 2)];
      fx.burst(p.x + w[0], heightAt(p.x, p.z) + 0.25, p.z + w[2], 2,
               { color: 0xb3a473, spread: 2.5, up: 2.4, life: 0.55, size: 0.85 });
    }
  }

  /* --- CHUONG NGAI VAT --- */
  for (const c of terrain.chuongNgai) {
    if (!c.song) continue;
    if (Math.abs(p.x - c.x) > 3.4 || Math.abs(p.z - c.z) > 3.4) continue;
    const gy2 = heightAt(c.x, c.z);
    if (p.y - gy2 > 4.2) continue;
    const vv = car.body.linvel();
    const sp2 = Math.hypot(vv.x, vv.y, vv.z);
    if (c.kieu === 'thung') {
      // Thung vo ra: mat mot phan toc do, banh vun go, nhung khong lam xe lat
      c.song = false;
      try { world.removeCollider(c.col, false); } catch (e) {}
      c.mesh.visible = false;
      car.body.setLinvel({ x: vv.x * 0.74, y: vv.y * 0.9 + 2, z: vv.z * 0.8 }, true);
      fx.burst(c.x, gy2 + 1.3, c.z, 26, { color: 0xd79a56, spread: 8, up: 9, life: 0.8, size: 1.5 });
      chase.addShake(8); audio.thud(12);
      levelSuspend = T.levelRecover * 0.5;
    } else if (sp2 > 6) {
      // Lop xe: bat len cao, day them ve truoc. Day la chuong ngai co loi.
      c.song = false;
      try { world.removeCollider(c.col, false); } catch (e) {}
      c.mat = c.mesh.material;
      c.mesh.material = c.mesh.material.clone();
      c.mesh.material.color.setHex(0x6a6a78);
      car.body.setLinvel({ x: vv.x * 1.04, y: Math.abs(vv.y) * 0.4 + 11, z: vv.z }, true);
      fx.burst(c.x, gy2 + 1.6, c.z, 22, { color: 0x8a8a96, spread: 7, up: 12, life: 0.7, size: 1.3 });
      chase.addShake(9); audio.pad();
    }
  }

  /* --- VAT PHAM --- */
  for (const vp of terrain.vatPham) {
    if (vp.an) continue;
    if (Math.abs(p.x - vp.x) > T.banKinhAn) continue;
    if (Math.abs(p.y - vp.y) > T.banKinhAn || Math.abs(p.z - vp.z) > T.banKinhAn + 3) continue;
    vp.an = true; vp.mesh.visible = false;
    if (vp.loai === 'nitro') {
      if (nitroHoi >= T.nitroHoiToiDa) { vp.an = false; vp.mesh.visible = true; continue; }
      nitroHoi++;
      nitroLeft = Math.min(CS.soNitro + 1, nitroLeft + 1);
      fx.burst(vp.x, vp.y, vp.z, 20, { color: 0xff8a3d, spread: 6, up: 6, life: 0.6, size: 1.5, grav: -4 });
      audio.whoosh();
    } else if (vp.loai === 'tien') {
      tienThem += T.tienVatPham;
      fx.burst(vp.x, vp.y, vp.z, 16, { color: 0xffd45e, spread: 5, up: 6, life: 0.6, size: 1.3, grav: -4 });
      audio.pad();
    } else {
      const vv = car.body.linvel();
      car.body.setLinvel({ x: vv.x * 1.06, y: Math.max(vv.y, 0) + T.bongLift, z: vv.z }, true);
      fx.burst(vp.x, vp.y, vp.z, 24, { color: 0x6ff0c8, spread: 7, up: 4, life: 0.8, size: 1.6, grav: -2 });
      audio.best();
    }
    chase.addShake(4);
  }

  /* --- VE DICH --- */
  if (!daVeDich && p.x - START_X >= terrain.dichX) {
    daVeDich = true;
    tienThem += T.tienVeDich;
    if (SAVE.danhDauQuaDich(MAP.id)) tienThem += T.tienVeDichLanDau;
    fx.burst(p.x, p.y + 1, p.z, 60, { color: 0xffd45e, spread: 14, up: 18, life: 1.3, size: 1.9, grav: -7 });
    chase.addShake(14); audio.best();
    $('dichBanner').classList.add('on');
    setTimeout(() => $('dichBanner').classList.remove('on'), 2200);
  }

  /* --- bang tang toc: phai ROI xuong moi an --- */
  if (v.y < T.padNeedFall && alt < 4.5) {
    let usedCount = 0;
    for (const pd of terrain.pads) if (pd.used) usedCount++;
    for (const pd of terrain.pads) {
      if (pd.used || Math.abs(p.x - pd.x) > 7) continue;
      const f = Math.pow(T.padDecay, usedCount);
      pd.used = true;
      pd.mat.emissive.setHex(0x000000); pd.mat.color.setHex(0x7d8a84);
      const vv = car.body.linvel();
      car.body.setLinvel({ x: vv.x * (1 + T.padGain * f * CS.heSoBang), y: Math.abs(vv.y) * 0.35 + T.padLift * f * CS.heSoBang, z: vv.z }, true);
      impactSkip = 3; levelSuspend = T.levelRecover * 0.6;
      fx.burst(pd.x, heightAt(pd.x, 0) + 0.6, 0, 30,
               { color: 0x3ddc97, spread: 7, up: 16, life: 0.9, size: 2.0, grav: -9 });
      chase.addShake(11); audio.pad();
      break;
    }
  }

  // Con tien duoc thi con choi. Moi lan tien them stallMet met thi lam moi moc.
  if (maxX - tienX >= T.stallMet) { tienX = maxX; tienT = elapsed; }
  const bettac = (elapsed - tienT) > T.stallGiay;

  const sp = Math.hypot(v.x, v.y, v.z);
  if (grounded && sp < T.stopSpeed) stillFor++; else stillFor = 0;
  if (stillFor > T.stopFrames || bettac || elapsed > T.maxSeconds) finish();
}

const qTarget = new THREE.Quaternion(), qCur = new THREE.Quaternion(), qErr = new THREE.Quaternion();
const eTarget = new THREE.Euler();
function tuCanBang(dt, v, alt, strength = 1) {
  // Huong muc tieu: mui xe chia theo huong bay, nhung gioi han do chuc mui,
  // de xe khong bao gio nam ngua hay chui dau xuong.
  const maxP = deg(T.levelMaxPitch);
  let pitch = 0;
  if (v.x > 1) pitch = Math.max(-maxP, Math.min(maxP, Math.atan2(v.y, v.x)));

  /* KEO MUI LEN TRUOC KHI HA CANH.
     Sap cham dat thi keo dan ve nam ngang han, va tang luc chinh len.
     Roi cang nhanh thi phai bat dau keo tu cao hon. Khong co cai nay thi ban
     goc cao se cham dat bang mui xe roi lon nhao ngay lan dau. */
  const nguong = T.levelFlareAlt + Math.max(0, -v.y) * T.levelFlareSpd;
  const flare = Math.max(0, Math.min(1, 1 - alt / nguong));
  pitch *= (1 - flare);
  const boost = 1 + flare * T.levelFlareGain;

  eTarget.set(0, 0, pitch);
  qTarget.setFromEuler(eTarget);

  const r = car.body.rotation();
  qCur.set(r.x, r.y, r.z, r.w);
  qErr.copy(qTarget).multiply(qCur.invert());
  if (qErr.w < 0) qErr.set(-qErr.x, -qErr.y, -qErr.z, -qErr.w);

  const sn = Math.sqrt(Math.max(0, 1 - qErr.w * qErr.w));
  let wx = 0, wy = 0, wz = 0;
  if (sn > 1e-4) {
    const ang = 2 * Math.acos(Math.min(1, qErr.w));
    const k = T.levelGain * T.autoLevel * CS.canBang * boost * strength * ang / sn;
    wx = qErr.x * k; wy = qErr.y * k; wz = qErr.z * k;
  }
  const av = car.body.angvel();
  const b = Math.min(1, T.levelDamp * boost * strength * dt);
  car.body.setAngvel({
    x: av.x + (wx - av.x) * b,
    y: av.y + (wy - av.y) * b,
    z: av.z + (wz - av.z) * b
  }, true);
}

function finish(stoppedByPlayer = false) {
  phase = DONE;
  doneAt = performance.now();
  trail.visible = false;
  $('btnStop').style.display = 'none';
  audio.setWind(0);
  const m = Math.max(0, Math.round(maxX - START_X));
  const thuong = Math.round((m * T.tienMoiMet + tienThem) * CS.heSoTien);
  SAVE.save.tien += thuong;
  SAVE.save.soLuot++;
  SAVE.ghiKyLucMap(MAP.id, m);
  const isBest = m > SAVE.save.kyLuc;
  if (isBest) SAVE.save.kyLuc = m;
  SAVE.ghi();
  $('rDist').textContent = m.toLocaleString('vi-VN');
  $('rBest').textContent = SAVE.save.kyLuc.toLocaleString('vi-VN') + ' m';
  $('rEarn').textContent = '+' + thuong.toLocaleString('vi-VN');
  $('rBank').textContent = SAVE.save.tien.toLocaleString('vi-VN');
  $('rWhy').textContent = stoppedByPlayer ? 'Bạn tự bấm dừng' : '';
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

function veNitroPip() {
  const box = $('nitro');
  box.innerHTML = '';
  for (let i = 0; i < CS.soNitro; i++) box.appendChild(document.createElement('i'));
}

function updateHud() {
  const p = car.body.translation();
  $('dist').textContent = Math.max(0, Math.round(Math.max(maxX, p.x) - START_X)).toLocaleString('vi-VN');
  $('bestHud').textContent = SAVE.save.kyLuc.toLocaleString('vi-VN');
  const pips = $('nitro').children;
  for (let i = 0; i < pips.length; i++)
    pips[i].className = 'pip' + (i < nitroLeft ? (nitroCd > 0 ? ' cd' : ' on') : '');
  $('bar').style.display = dragging ? 'block' : 'none';
  if (dragging) $('barFill').style.width = (power * 100) + '%';
  $('btnStop').style.display = phase === FLY ? 'block' : 'none';
  $('angleBox').style.display = (phase === AIM && !menuOpen) ? 'block' : 'none';
  if (phase === AIM && !menuOpen) {
    $('angle').textContent = Math.round(aimA * 180 / Math.PI) + '°';
    $('pwr').textContent = Math.round(power * 100) + '%';
  }
  $('hint').textContent = menuOpen ? '' : (phase === AIM
    ? (dragging ? 'THẢ RA ĐỂ BẮN' : 'KÉO XUỐNG VÀ VỀ SAU, RỒI THẢ')
    : (phase === FLY && nitroLeft > 0 ? 'CHẠM ĐỂ ĐỐT NITRO' : ''));
  $('alt').textContent = Math.max(0, Math.round(p.y - heightAt(p.x, p.z))) + ' m';
  const dd = terrain.dichX - (Math.max(maxX, p.x) - START_X);
  if (phase === FLY || phase === DONE) {
    $('dichBox').style.display = 'block';
    $('dichSo').textContent = daVeDich ? 'ĐÃ QUA ĐÍCH' : (Math.max(0, Math.round(dd)) + ' m nữa');
    $('dichSo').style.color = daVeDich ? '#3ddc97' : '#ffd45e';
  } else $('dichBox').style.display = 'none';
  if (phase === FLY) {
    const ms2 = matSanTai(terrain.matSan, p.x);
    $('sanBox').style.display = ms2.mau ? 'block' : 'none';
    if (ms2.mau) { $('sanTen').textContent = 'MẶT ' + ms2.ten.toUpperCase();
      $('sanBox').style.color = '#' + ms2.mau.toString(16).padStart(6, '0'); }
  } else $('sanBox').style.display = 'none';
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
  PP.composer.render();
  requestAnimationFrame(loop);
}

/* =================== GA RA =================== */
function veXe() {
  const box = $('gXe');
  box.innerHTML = '';
  for (const c of CARS) {
    const daMua = SAVE.daMua(c.id);
    const duDk = SAVE.duDieuKien(c);
    const dangDung = SAVE.save.xe === c.id;
    const el = document.createElement('div');
    el.className = 'carc' + (dangDung ? ' sel' : '') + (daMua ? '' : ' lock');
    let trangThai;
    if (dangDung) trangThai = '<span class="tag ok">ĐANG DÙNG</span>';
    else if (daMua) trangThai = '<span class="tag">Chạm để chọn</span>';
    else if (!duDk) trangThai = '<span class="tag no">Cần kỷ lục ' + c.moKhi + ' m</span>';
    else if (SAVE.save.tien < c.gia) trangThai = '<span class="tag no">Cần ' + c.gia.toLocaleString('vi-VN') + '</span>';
    else trangThai = '<span class="tag buy">Mua ' + c.gia.toLocaleString('vi-VN') + '</span>';
    el.innerHTML =
      '<div class="cdot" style="background:#' + c.mau.toString(16).padStart(6, '0') + '"></div>' +
      '<div class="cname">' + c.ten + '</div>' +
      '<div class="cdesc">' + c.mota + '</div>' +
      '<div class="cpro">+ ' + c.manh + '</div>' +
      '<div class="ccon">- ' + c.yeu + '</div>' + trangThai;
    el.addEventListener('pointerdown', ev => ev.stopPropagation());
    el.addEventListener('click', ev => {
      ev.stopPropagation();
      audio.init();
      if (daMua) { if (SAVE.chonXe(c.id)) { doiXe(); resetRun(); audio.pad(); veGaRa(); } return; }
      if (SAVE.muaXe(c)) { doiXe(); resetRun(); audio.best(); veGaRa(); }
    });
    box.appendChild(el);
  }
}

function veMap() {
  const box = $('gMap');
  box.innerHTML = '';
  for (const m of MAPS) {
    const mo = SAVE.mapMoChua(m);
    const dangChoi = SAVE.save.map === m.id;
    const quaDich = SAVE.save.mapDaQua.includes(m.id);
    const kl = SAVE.save.kyLucMap[m.id] || 0;
    const el = document.createElement('div');
    el.className = 'mapc' + (dangChoi ? ' sel' : '') + (mo ? '' : ' lock');
    let tt;
    if (!mo) tt = '<span class="tag no">Cần kỷ lục ' + m.moKhi + ' m</span>';
    else if (dangChoi) tt = '<span class="tag ok">ĐANG CHƠI</span>';
    else tt = '<span class="tag">Chạm để chọn</span>';
    el.innerHTML =
      '<div class="msky" style="background:linear-gradient(180deg,#' + m.troi.tren.toString(16).padStart(6,'0') +
        ',#' + m.troi.giua.toString(16).padStart(6,'0') + ' 62%,#' + m.dat.tren.toString(16).padStart(6,'0') + ' 63%)"></div>' +
      '<div class="cname">' + m.ten + (quaDich ? ' <span class="cup">✓ đã qua đích</span>' : '') + '</div>' +
      '<div class="cdesc">' + m.mota + '</div>' +
      '<div class="cpro">Đích: ' + m.dich + ' m' + (kl ? ' &middot; kỷ lục của m: ' + kl + ' m' : '') + '</div>' + tt;
    el.addEventListener('pointerdown', ev => ev.stopPropagation());
    el.addEventListener('click', ev => {
      ev.stopPropagation(); audio.init();
      if (!mo || dangChoi) return;
      if (SAVE.chonMap(m.id)) { doiMap(); audio.pad(); veGaRa(); }
    });
    box.appendChild(el);
  }
}

function veGaRa() {
  CS = SAVE.chiSo();
  veMap();
  $('gMapTen').textContent = MAP.ten;
  $('gTien').textContent = SAVE.save.tien.toLocaleString('vi-VN');
  $('gKyLuc').textContent = SAVE.save.kyLuc.toLocaleString('vi-VN') + ' m';
  $('gXeTen').textContent = SAVE.xeDangDung().ten;
  veXe();
  const list = $('gUp');
  list.innerHTML = '';
  for (const u of UPGRADES) {
    const lv = SAVE.save.lv[u.key];
    const het = lv >= u.max;
    const gia = giaCap(u, lv);
    const el = document.createElement('div');
    el.className = 'up';
    let pips = '';
    for (let i = 0; i < u.max; i++) pips += '<i class="upip' + (i < lv ? ' f' : '') + '"></i>';
    el.innerHTML = '<div class="ico">' + u.ico + '</div>' +
      '<div class="mid"><div class="nm">' + u.ten + ' <span class="lv">Cấp ' + lv + '</span></div>' +
      '<div class="ds">' + u.mota + '</div><div class="pips">' + pips + '</div></div>';
    const b = document.createElement('button');
    b.className = 'buy' + (het ? ' max' : '');
    b.textContent = het ? 'TỐI ĐA' : gia.toLocaleString('vi-VN');
    b.disabled = het || SAVE.save.tien < gia;
    b.addEventListener('pointerdown', ev => ev.stopPropagation());
    b.addEventListener('click', ev => {
      ev.stopPropagation();
      if (het || SAVE.save.tien < gia) return;
      SAVE.save.tien -= gia;
      SAVE.save.lv[u.key]++;
      SAVE.ghi();
      audio.init(); audio.pad();
      veGaRa();
    });
    el.appendChild(b);
    list.appendChild(el);
  }
}

function moGaRa() {
  menuOpen = true;
  resetRun();
  veGaRa();
  $('result').classList.remove('on');
  $('garage').classList.add('on');
}

function dongGaRa() {
  $('garage').classList.remove('on');
  menuOpen = false;
  resetRun();
}

$('btnPhong').addEventListener('click', e => { e.stopPropagation(); audio.init(); dongGaRa(); });
$('btnPhong').addEventListener('pointerdown', e => e.stopPropagation());
$('btnVeGara').addEventListener('click', e => { e.stopPropagation(); moGaRa(); });
$('btnVeGara').addEventListener('pointerdown', e => e.stopPropagation());
let xoaSan = 0;
$('btnXoa').addEventListener('pointerdown', e => e.stopPropagation());
$('btnXoa').addEventListener('click', e => {
  e.stopPropagation();
  const b = $('btnXoa');
  if (!xoaSan) {
    xoaSan = 1; b.textContent = 'Chạm lần nữa để xoá thật'; b.style.color = '#ff6b6b';
    setTimeout(() => { xoaSan = 0; b.textContent = 'Xoá tiến độ'; b.style.color = ''; }, 3000);
    return;
  }
  xoaSan = 0; b.textContent = 'Xoá tiến độ'; b.style.color = '';
  SAVE.xoaHet(); veGaRa();
});

/* --- nut tat tieng --- */
let muted = false;
$('btnMute').addEventListener('click', e => {
  e.stopPropagation();
  muted = !muted;
  audio.init(); audio.setMuted(muted);
  $('btnMute').textContent = muted ? '\u{1F507}' : '\u{1F50A}';
});
$('btnMute').addEventListener('pointerdown', e => e.stopPropagation());

apMauMap(MAP);
const PP = taoComposer(rn, scene, cam, 1);
addEventListener('resize', () => PP.composer.setSize(innerWidth, innerHeight));

resetRun();
moGaRa();
$('loading').style.display = 'none';
requestAnimationFrame(loop);

/* --- cong de test tu dong --- */
window.__game = {
  get phase() { return phase; }, get maxX() { return maxX; },
  get best() { return SAVE.save.kyLuc; }, get tien() { return SAVE.save.tien; },
  get menuOpen() { return menuOpen; }, get lv() { return SAVE.save.lv; },
  get firstLandUp() { return firstLandUp; },
  get nitroLeft() { return nitroLeft; }, get elapsed() { return elapsed; },
  get stillFor() { return stillFor; }, get power() { return power; },
  get angleDeg() { return aimA * 180 / Math.PI; },
  get speed() { const v = car.body.linvel(); return Math.hypot(v.x, v.y, v.z); },
  get alt() { const p = car.body.translation(); return p.y - heightAt(p.x, p.z); },
  get resultShown() { return document.getElementById('result').classList.contains('on'); },
  get physPerFrame() { return physMs / Math.max(1, frames); },
  get fxCount() { return fx.p.length; },
  get info() {
    let tri = 0, mesh = 0;
    scene.traverse(o => {
      if (!o.isMesh && !o.isInstancedMesh) return;
      const g = o.geometry; if (!g) return;
      const n = g.index ? g.index.count / 3 : (g.attributes.position ? g.attributes.position.count / 3 : 0);
      tri += n * (o.isInstancedMesh ? o.count : 1); mesh++;
    });
    return { tris: Math.round(tri), calls: mesh };
  },
  get scene() { return scene; },
  get cam() { return cam; },
  get carPos() { const p = car.body.translation(); return { x: p.x, y: p.y, z: p.z }; },
  get groundUnderCar() { const p = car.body.translation(); return heightAt(p.x, p.z); },
  get landingX() { return predictLanding(); },
  resetRun, fireNitro, moGaRa, dongGaRa, veGaRa, doiXe, doiMap, CARS, MAPS,
  get map() { return SAVE.save.map; }, get mapDaQua() { return SAVE.save.mapDaQua.slice(); },
  get daVeDich() { return daVeDich; }, get dichX() { return terrain.dichX; },
  get soChuongNgai() { return terrain.chuongNgai.length; }, get soVatPham() { return terrain.vatPham.length; },
  get soMatSan() { return terrain.matSan.length; },
  get soDoc() { return layDoc().length; },
  get vatPhamDaAn() { return terrain.vatPham.filter(v => v.an).length; },
  get chuongNgaiDaVo() { return terrain.chuongNgai.filter(c => !c.song).length; },
  choMap(id) { SAVE.save.kyLuc = 99999; SAVE.chonMap(id); doiMap(); return true; },
  chonMapThu(id) { const m = MAPS.find(x => x.id === id); return !!m && SAVE.mapMoChua(m); },
  get xe() { return SAVE.save.xe; }, get xeDaMua() { return SAVE.save.xeDaMua.slice(); },
  chonXe(id) { if (SAVE.chonXe(id)) { doiXe(); resetRun(); return true; } return false; },
  choXe(id) { const c = CARS.find(x => x.id === id); SAVE.save.xeDaMua.push(id); SAVE.save.xe = id; doiXe(); resetRun(); return true; },
  setLv(k, v) { SAVE.save.lv[k] = v; CS = SAVE.chiSo(); },
  setAutoLevel(v) { T.autoLevel = v; },
  get heSoTien() { return CS.heSoTien; }, UPGRADES, giaCap,
  setTien(v) { SAVE.save.tien = v; },
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
    menuOpen = false;
    resetRun();
    this.dragLaunch(dx, dy);
    let n = 0, fired = 0;
    // do them: ca luot xe nam ngua bao nhieu, lat may lan, quay manh nhat bao nhieu
    let upSum = 0, upN = 0, lat = 0, truocDo = 1, spinMax = 0, batDauLat = 0;
    const _up = new THREE.Vector3();
    while (phase === FLY && n < 6000) {
      {
        const r2 = car.body.rotation();
        _up.set(0, 1, 0).applyQuaternion(new THREE.Quaternion(r2.x, r2.y, r2.z, r2.w));
        const p2 = car.body.translation();
        if (p2.y - heightAt(p2.x, p2.z) < T.groundAlt) { upSum += _up.y; upN++; if (_up.y < 0.3) batDauLat++; }
        if (truocDo > 0 && _up.y <= 0) lat++;
        truocDo = _up.y;
        const av = car.body.angvel();
        const sp2 = Math.hypot(av.x, av.y, av.z);
        if (sp2 > spinMax) spinMax = sp2;
      }
      if (nitroAtApex && nitroLeft > 0 && nitroCd <= 0) {
        const v = car.body.linvel(), p = car.body.translation();
        const alt0 = p.y - heightAt(p.x, p.z);
        const sp0 = Math.hypot(v.x, v.y, v.z);
        // giong nguoi choi biet choi: dot luc bat dau roi, va dot tiep khi dang lan cham dan
        if ((v.y < 0 && alt0 > 12) || (alt0 < T.groundAlt && sp0 < 26)) { fireNitro(); fired++; }
      }
      stepPhysics(world.timestep); n++;
    }
    return { m: Math.max(0, Math.round(maxX - START_X)), seconds: +(n / 60).toFixed(1),
             upFrac: upN ? +(upSum / upN).toFixed(2) : null,   // trung binh do 'ngua' khi sat dat
             xauFrac: upN ? +(batDauLat / upN).toFixed(2) : null, // ty le thoi gian nam ngua/nghieng hẳn
             lat, spinMax: +spinMax.toFixed(1), veDich: daVeDich,
             vatPhamAn: terrain.vatPham.filter(v => v.an).length,
             chuongNgaiVo: terrain.chuongNgai.filter(c => !c.song).length,
             angle: Math.round(aimA * 180 / Math.PI), power: +power.toFixed(2),
             nitroFired: fired, padsUsed: terrain.pads.filter(q => q.used).length, ended: phase === DONE,
             firstLandUp,
             upright: (() => { const r = car.body.rotation();
               const qq = new THREE.Quaternion(r.x, r.y, r.z, r.w);
               const up = new THREE.Vector3(0, 1, 0).applyQuaternion(qq);
               return +up.y.toFixed(2); })() };
  }
};
