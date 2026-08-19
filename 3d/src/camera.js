import * as THREE from 'three';
import { TUNE as T } from './TUNE.js';
import { heightAt } from './terrain.js';

/* Camera goc nhin thu ba.
   Luc ngam: dung sau duoi xe cho ra dang.
   Luc bay: tu chuyen ra goc ba phan tu lech han sang ben, de nguoi choi doc duoc
   vong cung dang bay. Day la chi tiet quan trong nhat cua ca giai doan nay:
   neu camera dan sau duoi xe thi khong ai biet minh dang bay tot hay te. */
export class ChaseCam {
  constructor(cam) {
    this.cam = cam;
    this.shake = 0;
    this._s = new THREE.Vector3();
    this.pos = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.blend = 0;               // 0 = goc ngam, 1 = goc bay
    this._p = new THREE.Vector3();
    this._l = new THREE.Vector3();
    this._first = true;
  }

  addShake(amount) { this.shake = Math.min(T.shakeMax, this.shake + amount); }

  reset(carPos) {
    this.blend = 0;
    this.shake = 0;
    this._first = true;
    this.update(carPos, { x: 0, y: 0, z: 0 }, 0, 1 / 60);
  }

  update(carPos, vel, flying, dt) {
    // chuyen dan sang goc bay
    const target = flying ? 1 : 0;
    const rate = dt / T.camFlyBlend;
    this.blend += Math.sign(target - this.blend) * Math.min(rate, Math.abs(target - this.blend));
    const b = this.blend * this.blend * (3 - 2 * this.blend);   // lam min hai dau

    const a = T.camAim, f = T.camFly;
    const alt = Math.max(0, carPos.y - heightAt(carPos.x, carPos.z));
    const speed = Math.hypot(vel.x, vel.y, vel.z);
    // bay cao hoac nhanh thi keo camera ra xa de van thay duoc xe
    const pull = 1 + alt * T.camAltPull + speed * 0.012;

    // Keo ra xa chu yeu theo chieu ngang. Neu keo ca chieu cao thi camera se chuc
    // xuong nhin tu tren khi xe bay cao, va nguoi choi mat cam giac do cao.
    const pullY = 1 + (pull - 1) * T.camPullY;
    // Do lech sang ben chi ap dung khi dang bay, va do camSide quyet dinh.
    // camSide = 0 thi camera dan ngay sau duoi xe.
    const zSide = (a[2] * (1 - b) + f[2] * b) + T.camSide * T.camSideDist * b;
    this._p.set(
      (a[0] * (1 - b) + f[0] * b) * pull,
      (a[1] * (1 - b) + f[1] * b) * pullY,
      zSide * pull
    );
    this._p.x += carPos.x; this._p.y += carPos.y; this._p.z += carPos.z;

    // khong cho camera chui xuong duoi dat
    const gy = heightAt(this._p.x, this._p.z) + 2.5;
    if (this._p.y < gy) this._p.y = gy;

    // Diem ngam: luc ngam thi ngam ra truoc it, de xe khong bi day sang le man hinh.
    // Luc bay thi ngam theo huong bay.
    const al = T.camAimLook;
    this._l.set(
      carPos.x + (al[0] * (1 - b)) + (vel.x * T.camLookAhead + 6) * b,
      carPos.y + (al[1] * (1 - b)) + (vel.y * T.camLookAhead * 0.4 + T.camLookUp) * b,
      carPos.z + (al[2] * (1 - b)) + (vel.z * T.camLookAhead) * b
    );

    const k = this._first ? 1 : T.camFollow;
    this.pos.lerp(this._p, k);
    this.look.lerp(this._l, k);
    this._first = false;

    this.cam.position.copy(this.pos);

    // rung camera: cong mot do lech ngau nhien nho, tat dan
    if (this.shake > 0.02) {
      const a = this.shake * 0.05;
      this._s.set((Math.random() - 0.5) * a, (Math.random() - 0.5) * a, (Math.random() - 0.5) * a);
      this.cam.position.add(this._s);
      this.shake -= this.shake * Math.min(1, T.shakeDecay * dt);
    } else this.shake = 0;

    this.cam.lookAt(this.look);
  }
}
