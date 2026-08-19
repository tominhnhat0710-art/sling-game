import { UPGRADES } from './upgrades.js';
import { TUNE as T } from './TUNE.js';
import { BUOC } from './upgrades.js';

const KEY = 'bayxa3d.save.v1';

function moi() {
  const lv = {};
  for (const u of UPGRADES) lv[u.key] = 0;
  return { tien: 0, kyLuc: 0, soLuot: 0, lv };
}

export let save = moi();

/* Neu trinh duyet chan localStorage thi van choi duoc, chi la mat tien do khi dong app. */
export function load() {
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const d = JSON.parse(raw);
      save = Object.assign(moi(), d);
      save.lv = Object.assign(moi().lv, d.lv || {});
    }
  } catch (e) { /* bo qua */ }
  return save;
}

export function ghi() {
  try { localStorage.setItem(KEY, JSON.stringify(save)); } catch (e) { /* bo qua */ }
}

export function xoaHet() {
  save = moi();
  ghi();
  return save;
}

/* Chi so xe sau khi nang cap. Moi cho trong game phai lay so tu day, khong lay
   truc tiep tu TUNE, de nang cap co tac dung that. */
export function chiSo() {
  const lv = save.lv;
  return {
    tocDoPhong: T.launchSpeed + BUOC.power * lv.power,
    heSoBang:   1 + BUOC.wheelGrip * lv.wheel,
    maSatLan:   T.groundDrag * Math.max(0.35, 1 - BUOC.wheelRoll * lv.wheel),
    bamDuong:   T.frictionSlip * (1 + 0.06 * lv.wheel),
    doNay:      Math.min(0.62, T.bounceBase + BUOC.wheelBounce * lv.wheel),
    canGio:     Math.max(0.004, T.linDamp - BUOC.aero * lv.aero),
    luon:       BUOC.aeroGlide * lv.aero,   // giam bao nhieu % trong luc khi bay
    soNitro:    T.nitroCount + lv.ntank,
    sucNitro:   T.nitroPush + BUOC.npow * lv.npow,
    heSoTien:   1 + BUOC.money * lv.money
  };
}
