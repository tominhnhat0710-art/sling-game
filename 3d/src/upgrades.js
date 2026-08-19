/* =========================================================================
   BANG NANG CAP - day la DU LIEU, khong phai code.
   Them hoac sua nang cap thi sua o day, khong can mo file logic.
   c0 = gia cap dau tien, gr = moi cap sau dat hon bao nhieu lan.
   ========================================================================= */
export const UPGRADES = [
  { key: 'power', ico: '\u{1F680}', ten: 'Sức phóng',      mota: 'Bắn xe đi mạnh hơn ngay từ đầu',   max: 14, c0: 90,  gr: 1.44 },
  { key: 'wheel', ico: '\u{1F6DE}', ten: 'Bánh xe',        mota: 'Bám tốt hơn, lăn xa hơn, ăn bảng mạnh hơn', max: 10, c0: 120, gr: 1.46 },
  { key: 'aero',  ico: '\u{1F4A8}', ten: 'Khí động học',   mota: 'Thân xe lượn, rơi chậm hơn nên bay xa hơn', max: 9,  c0: 150, gr: 1.5  },
  { key: 'ntank', ico: '\u{1F525}', ten: 'Số bình nitro',  mota: 'Thêm lượt tăng tốc, dùng được cả khi đang lăn', max: 4,  c0: 700, gr: 2.0 },
  { key: 'npow',  ico: '\u{26A1}',  ten: 'Sức nitro',      mota: 'Mỗi lần đốt nitro mạnh hơn',       max: 9,  c0: 190, gr: 1.5  },
  { key: 'money', ico: '\u{1F4B0}', ten: 'Tiền thưởng',    mota: 'Mỗi mét bay được nhiều tiền hơn',  max: 9,  c0: 140, gr: 1.44 }
];

export const giaCap = (u, lv) => Math.round(u.c0 * Math.pow(u.gr, lv) / 5) * 5;

/* Moi cap cong them bao nhieu. Sua o day de can bang lai. */
export const BUOC = {
  power: 3.2,        // m/s moi cap
  wheelGrip: 0.10,   // an bang tang toc manh hon
  wheelRoll: 0.08,   // lan it mat toc do hon
  wheelBounce: 0.045,// nay cao hon khi cham dat. Day la don manh nhat cua Banh xe
  aero: 0.0022,      // giam can gio
  aeroGlide: 0.038,  // GIAM TRONG LUC khi dang bay, moi cap 3.8%. Cap 9 = nhe hon 34%.
                     // Da do thuc te: chi giam can gio thoi thi cap 0 va cap 9 bay xa y het
                     // nhau, nang cap coi nhu khong ton tai. Chuyen sang cho xe luon thi
                     // moi thanh mot nang cap doc duoc.
  npow: 2.6,         // m/s moi cap
  money: 0.35        // he so tien moi cap
};
