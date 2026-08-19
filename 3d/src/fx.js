import * as THREE from 'three';
import { TUNE as T } from './TUNE.js';

/* Ho hat dung chung cho bui, khoi nitro va tia bang tang toc.
   Dung 1 InstancedMesh duy nhat nen chi ton 1 draw call cho tat ca hieu ung. */
export class Fx {
  constructor(scene) {
    this.mesh = new THREE.InstancedMesh(
      new THREE.TetrahedronGeometry(0.42, 0),      // khoi 4 mat, re va phu hop kieu low-poly
      new THREE.MeshBasicMaterial({ transparent: true, opacity: 0.92 }),
      T.fxMax
    );
    this.mesh.frustumCulled = false;
    this.mesh.instanceColor = new THREE.InstancedBufferAttribute(new Float32Array(T.fxMax * 3), 3);
    scene.add(this.mesh);

    this.p = [];                                    // hat dang song
    this.m4 = new THREE.Matrix4();
    this.q = new THREE.Quaternion();
    this.v = new THREE.Vector3();
    this.sc = new THREE.Vector3();
    this.col = new THREE.Color();
    this.axis = new THREE.Vector3(0.4, 1, 0.3).normalize();
  }

  /* n hat toa ra tu mot diem */
  burst(x, y, z, n, opt = {}) {
    const spread = opt.spread ?? 7,
          up     = opt.up ?? 6,
          life   = opt.life ?? 0.8,
          size   = opt.size ?? 1,
          grav   = opt.grav ?? -14,
          drag   = opt.drag ?? 0.94,
          color  = opt.color ?? 0xcbb894,
          dir    = opt.dir;
    for (let i = 0; i < n; i++) {
      if (this.p.length >= T.fxMax) this.p.shift();
      let vx = (Math.random() - 0.5) * spread,
          vy = Math.random() * up,
          vz = (Math.random() - 0.5) * spread;
      if (dir) { vx += dir.x; vy += dir.y; vz += dir.z; }
      this.p.push({
        x, y, z, vx, vy, vz,
        l: 1, lr: 1 / (life * (0.6 + Math.random() * 0.7)),
        s: size * (0.5 + Math.random() * 0.9),
        rot: Math.random() * 6.28, rv: (Math.random() - 0.5) * 9,
        g: grav, d: drag, c: color
      });
    }
  }

  update(dt) {
    const arr = this.p;
    for (let i = arr.length - 1; i >= 0; i--) {
      const q = arr[i];
      q.vy += q.g * dt;
      const d = Math.pow(q.d, dt * 60);
      q.vx *= d; q.vz *= d;
      q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt;
      q.rot += q.rv * dt;
      q.l -= q.lr * dt;
      if (q.l <= 0) arr.splice(i, 1);
    }
    for (let i = 0; i < arr.length; i++) {
      const q = arr[i];
      const s = q.s * Math.max(0.05, q.l);
      this.q.setFromAxisAngle(this.axis, q.rot);
      this.sc.set(s, s, s);
      this.v.set(q.x, q.y, q.z);
      this.m4.compose(this.v, this.q, this.sc);
      this.mesh.setMatrixAt(i, this.m4);
      this.col.setHex(q.c);
      this.mesh.setColorAt(i, this.col);
    }
    this.mesh.count = arr.length;
    this.mesh.instanceMatrix.needsUpdate = true;
    if (this.mesh.instanceColor) this.mesh.instanceColor.needsUpdate = true;
  }

  clear() { this.p.length = 0; this.mesh.count = 0; }
}
