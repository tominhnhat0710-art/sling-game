import { UPGRADES, BUOC } from './upgrades.js';
import { TUNE as T } from './TUNE.js';
import { CARS, xeTheoId } from './cars.js';

const KEY = 'bayxa3d.save.v1';

function moi() {
  const lv = {};
  for (const u of UPGRADES) lv[u.key] = 0;
  return { tien: 0, kyLuc: 0, soLuot: 0, lv, xe: CARS[0].id, xeDaMua: [CARS[0].id] };
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
      if (!Array.isArray(save.xeDaMua) || !save.xeDaMua.length) save.xeDaMua = [CARS[0].id];
      if (!save.xeDaMua.includes(save.xe)) save.xe = CARS[0].id;
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
export const xeDangDung = () => xeTheoId(save.xe);

/* Da mua xe chua, va da du dieu kien mo chua */
export function daMua(id) { return save.xeDaMua.includes(id); }
export function duDieuKien(c) { return save.kyLuc >= c.moKhi; }
export function muaXe(c) {
  if (daMua(c.id) || save.tien < c.gia || !duDieuKien(c)) return false;
  save.tien -= c.gia; save.xeDaMua.push(c.id); save.xe = c.id; ghi(); return true;
}
export function chonXe(id) { if (daMua(id)) { save.xe = id; ghi(); return true; } return false; }

/* Chi so cuoi cung = nang cap chung NHAN voi he so rieng cua tung dong xe. */
export function chiSo() {
  const lv = save.lv;
  const ct = xeDangDung().ct;
  return {
    tocDoPhong: (T.launchSpeed + BUOC.power * lv.power) * ct.tocDo,
    heSoBang:   (1 + BUOC.wheelGrip * lv.wheel) * ct.heSoBang,
    maSatLan:   T.groundDrag * Math.max(0.35, 1 - BUOC.wheelRoll * lv.wheel) * ct.maSatLan,
    bamDuong:   T.frictionSlip * (1 + 0.06 * lv.wheel),
    // Tran 0.75 truoc day chan mat ban sac cua Xe dia hinh: len cap cao thi moi xe
    // deu bi ep ve cung mot do nay. Nang tran len de he so rieng cua xe con y nghia.
    doNay:      Math.min(0.88, (T.bounceBase + BUOC.wheelBounce * lv.wheel) * ct.doNay),
    canGio:     Math.max(0.003, (T.linDamp - BUOC.aero * lv.aero) * ct.canGio),
    luon:       BUOC.aeroGlide * lv.aero + ct.luon,
    soNitro:    T.nitroCount + lv.ntank,
    sucNitro:   T.nitroPush + BUOC.npow * lv.npow,
    heSoTien:   1 + BUOC.money * lv.money,
    canBang:    ct.canBang
  };
}
