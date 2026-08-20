/* =========================================================================
   BIEN DANG THAN XE - du lieu thuan.
   Moi xe la mot ho so cat doc nhin tu ben canh, dinh nghia bang cac diem [x, y].
   Game se dun ho so nay ra theo be ngang va vat canh, nen canh xe bat sang,
   khong con la khoi hop.

   Truc: +x la dau xe, y la chieu cao (0 la duong tam than xe).
   ========================================================================= */
export const THAN = {
  /* Xe golf: san thap, mui che tren 4 cot, khong co than kin */
  golf: {
    profile: [[-1.05,-0.42],[1.05,-0.42],[1.05,-0.06],[0.62,-0.06],[0.62,0.2],[-0.55,0.2],[-0.55,-0.06],[-1.05,-0.06]],
    mui:  { tu: -0.72, den: 0.5, cao: 1.02, day: 0.09 },
    cot:  [[-0.62, 0.9],[0.44, 0.9]],
    kinh: null, canhGio: null, vat: 0.035
  },
  /* Hatchback: mui xe doc len, kinh nghieng, noc bang, duoi cat ngan */
  hatch: {
    profile: [[-1.32,-0.5],[-1.34,-0.1],[-1.28,0.12],[-0.62,0.2],[-0.3,0.66],[0.34,0.7],[0.72,0.24],[1.3,0.16],[1.36,-0.14],[1.3,-0.5]],
    kinh: { profile: [[-0.5,0.24],[-0.24,0.6],[0.3,0.63],[0.6,0.26]], day: 0.86 },
    vat: 0.05
  },
  /* Ban tai: cabin phia truoc, thung phang phia sau */
  pickup: {
    profile: [[-1.72,-0.5],[-1.74,0.2],[-1.1,0.2],[-1.06,-0.04],[-0.2,-0.02],[0.06,0.62],[0.72,0.66],[1.0,0.2],[1.66,0.12],[1.72,-0.18],[1.64,-0.5]],
    kinh: { profile: [[-0.1,0.2],[0.12,0.58],[0.68,0.6],[0.9,0.22]], day: 0.88 },
    vat: 0.05
  },
  /* Sedan: mui dai, noc vuot ve duoi */
  sedan: {
    profile: [[-1.62,-0.48],[-1.66,0.02],[-1.2,0.16],[-0.7,0.2],[-0.34,0.6],[0.34,0.62],[0.86,0.22],[1.5,0.14],[1.62,-0.14],[1.54,-0.48]],
    kinh: { profile: [[-0.5,0.22],[-0.26,0.55],[0.3,0.57],[0.62,0.24]], day: 0.9 },
    vat: 0.055
  },
  /* Xe dua GT: rat thap, mui dai, buong lai nho, canh gio sau */
  gt: {
    profile: [[-1.78,-0.36],[-1.8,0.1],[-1.2,0.14],[-0.72,0.16],[-0.44,0.46],[0.2,0.48],[0.72,0.12],[1.62,0.0],[1.76,-0.16],[1.7,-0.36]],
    kinh: { profile: [[-0.56,0.18],[-0.38,0.42],[0.16,0.44],[0.5,0.16]], day: 0.82 },
    canhGio: { x: -1.62, cao: 0.62, rong: 1.12, day: 0.1 },
    vat: 0.05
  },
  /* Sieu xe: dang net dao, cuc thap, hong rong, canh gio to */
  sieu: {
    profile: [[-1.9,-0.3],[-1.94,0.14],[-1.3,0.18],[-0.86,0.2],[-0.52,0.44],[0.26,0.42],[0.98,0.02],[1.82,-0.1],[1.94,-0.2],[1.86,-0.3]],
    kinh: { profile: [[-0.66,0.22],[-0.46,0.4],[0.22,0.38],[0.72,0.08]], day: 0.86 },
    canhGio: { x: -1.74, cao: 0.5, rong: 1.2, day: 0.09 },
    khuechtan: { x: -1.86, cao: 0.34, rong: 1.0 },
    vat: 0.045
  }
};
