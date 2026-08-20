/* =========================================================================
   DONG VAT
   Model ngua / bo / shiba cua Quaternius co san 24 den 26 clip animation.
   T dung ba clip: Eating khi dung yen gam co, Idle khi nghi, Gallop khi xe
   lao tới thì chạy tán loạn.

   Day la thu Nathan noi dang thieu: canh vat co PHAN UNG, khong phai cay
   dung im. Mesh co xuong nen KHONG instance duoc, moi con la mot mesh rieng,
   vi vay so luong phai it: 8 den 12 con moi map.
   ========================================================================= */
import * as THREE from 'three';
import { clone as cloneSkin } from 'three/addons/utils/SkeletonUtils.js';
import * as GLB from './glb.js';
import { TUNE as T } from './TUNE.js';

const NGHI = 'Idle', AN = 'Eating', CHAY = 'Gallop';

function timClip(list, ten) {
  // Ten trong file co hai dang: 'Gallop' va 'AnimalArmature|Gallop'
  let c = list.find(a => a.name === ten);
  if (!c) c = list.find(a => a.name.split('|').pop() === ten);
  if (!c) c = list.find(a => a.name.toLowerCase().includes(ten.toLowerCase()));
  return c || null;
}

export function dungThu(scene, map, heightAt, DAI, rnd) {
  const ra = [];
  const ds = map.thu;
  if (!ds || !ds.length) return ra;

  let i = 0;
  for (const cai of ds) {
    if (!GLB.co(cai.model)) continue;
    const g0 = GLB.lay(cai.model);
    for (let k = 0; k < cai.so; k++, i++) {
      let root;
      try { root = cloneSkin(g0.scene); } catch (e) { continue; }

      GLB.chuanHoa(root, cai.cao * (0.85 + rnd(i * 3.7 + 90) * 0.3));
      root.traverse(o => { if (o.isMesh || o.isSkinnedMesh) { o.castShadow = true; o.frustumCulled = false; } });

      const x = 110 + rnd(i * 5.3 + 11) * Math.max(200, DAI - 220);
      const ben = rnd(i + 640) > 0.5 ? 1 : -1;
      const z = ben * (19 + rnd(i + 811) * 42);
      root.position.set(x, heightAt(x, z), z);
      root.rotation.y = rnd(i + 5) * 6.28;
      scene.add(root);

      const mixer = new THREE.AnimationMixer(root);
      const cl = {};
      for (const ten of [NGHI, AN, CHAY]) {
        const c = timClip(g0.animations, ten);
        if (c) { cl[ten] = mixer.clipAction(c); cl[ten].setLoop(THREE.LoopRepeat); }
      }
      const dau = cl[AN] || cl[NGHI] || Object.values(cl)[0];
      if (dau) { dau.play(); dau.time = rnd(i + 77) * 2; }

      ra.push({
        root, mixer, cl, hienTai: dau,
        x, z, y: root.position.y, huong: root.rotation.y,
        chay: false, tocDo: 0, banKinh: cai.banKinh || 34,
        nhanh: cai.nhanh || 9
      });
    }
  }
  return ra;
}

/* Doi clip co lam mo dan, khong bi giat. */
function doiClip(t, moi) {
  if (!moi || t.hienTai === moi) return;
  if (t.hienTai) t.hienTai.fadeOut(0.25);
  moi.reset().fadeIn(0.25).play();
  t.hienTai = moi;
}

export function capNhatThu(list, dt, xeX, xeZ, heightAt) {
  for (const t of list) {
    t.mixer.update(dt);
    const dx = t.x - xeX, dz = t.z - xeZ;
    const kc = Math.hypot(dx, dz);

    /* Chi tinh toan cho con o gan, con o xa thi bo qua cho khoi ton CPU. */
    if (kc > 220) continue;

    if (!t.chay && kc < t.banKinh) {
      t.chay = true;
      t.huong = Math.atan2(dz, dx) + (Math.random() - 0.5) * 0.7;
      doiClip(t, t.cl[CHAY] || t.hienTai);
    }
    if (t.chay) {
      t.tocDo = Math.min(t.nhanh, t.tocDo + dt * 14);
      t.x += Math.cos(t.huong) * t.tocDo * dt;
      t.z += Math.sin(t.huong) * t.tocDo * dt;
      /* Khong cho chay ra khoi be rong the gioi */
      const gh = T.worldWidth / 2 - 6;
      if (Math.abs(t.z) > gh) { t.z = Math.sign(t.z) * gh; t.huong = Math.atan2(0, Math.cos(t.huong)); }
      if (kc > t.banKinh * 4.5) {
        t.chay = false; t.tocDo = 0;
        doiClip(t, t.cl[AN] || t.cl[NGHI] || t.hienTai);
      }
    }
    t.root.position.set(t.x, heightAt(t.x, t.z), t.z);
    /* Model huong theo +Z, game huong theo +X, nen lech mot goc vuong. */
    t.root.rotation.y = -t.huong + Math.PI / 2;
  }
}

export function xoaThu(scene, list) {
  for (const t of list) {
    t.mixer.stopAllAction();
    scene.remove(t.root);
    t.root.traverse(o => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) (Array.isArray(o.material) ? o.material : [o.material]).forEach(m => m.dispose());
    });
  }
  list.length = 0;
}
