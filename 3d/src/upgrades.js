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
/* Buoc tang moi cap. Da HA XUONG so voi ban truoc, vi do duoc la cap toi da bay
   toi 2.400 m, tuc la mot cu phong an gon ca map, khong con gi de choi.
   Muc tieu moi: cap 0 khoang 200-300 m, cap toi da khoang 1.000-1.300 m,
   tuc chenh khoang 4 lan chu khong phai 8 lan. */
export const BUOC = {
  power: 1.55,       // m/s moi cap. Truoc 3.2
  wheelGrip: 0.07,   // an bang tang toc manh hon
  wheelRoll: 0.06,   // lan it mat toc do hon
  wheelBounce: 0.026,// nay cao hon khi cham dat
  aero: 0.0016,      // giam can gio
  aeroGlide: 0.019,  // GIAM TRONG LUC khi dang bay. Cap 9 = nhe hon 17%. Truoc la 34%.
  npow: 1.25,        // m/s moi cap. Truoc 2.6
  money: 0.4         // he so tien moi cap. Tang len de bu lai tam xa ngan hon
};
