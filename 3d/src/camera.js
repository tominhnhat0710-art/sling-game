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
    this.pos = new THREE.Vector3();
    this.look = new THREE.Vector3();
    this.blend = 0;               // 0 = goc ngam, 1 = goc bay
    this._p = new THREE.Vector3();
    this._l = new THREE.Vector3();
    this._first = true;
  }

  reset(carPos) {
    this.blend = 0;
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
    this._p.set(
      (a[0] * (1 - b) + f[0] * b) * pull,
      (a[1] * (1 - b) + f[1] * b) * pullY,
      (a[2] * (1 - b) + f[2] * b) * pull
    );
    this._p.x += carPos.x; this._p.y += carPos.y; this._p.z += carPos.z;

    // khong cho camera chui xuong duoi dat
    const gy = heightAt(this._p.x, this._p.z) + 2.5;
    if (this._p.y < gy) this._p.y = gy;

    this._l.set(
      carPos.x + vel.x * T.camLookAhead + 6,
      carPos.y + vel.y * T.camLookAhead * 0.4 + T.camLookUp,
      carPos.z + vel.z * T.camLookAhead
    );

    const k = this._first ? 1 : T.camFollow;
    this.pos.lerp(this._p, k);
    this.look.lerp(this._l, k);
    this._first = false;

    this.cam.position.copy(this.pos);
    this.cam.lookAt(this.look);
  }
}
