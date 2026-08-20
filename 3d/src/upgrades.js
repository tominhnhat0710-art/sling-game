/* =========================================================================
   BANG NANG CAP - day la DU LIEU, khong phai code.
   Them hoac sua nang cap thi sua o day, khong can mo file logic.
   c0 = gia cap dau tien, gr = moi cap sau dat hon bao nhieu lan.
   ========================================================================= */
export const UPGRADES = [
  { key: 'power', ico: '\u{1F680}', ten: 'Sức phóng',      mota: 'Bắn xe đi mạnh hơn ngay từ đầu',   max: 30, c0: 80,  gr: 1.26 },
  { key: 'wheel', ico: '\u{1F6DE}', ten: 'Bánh xe',        mota: 'Bám tốt hơn, lăn xa hơn, ăn bảng mạnh hơn', max: 24, c0: 110, gr: 1.27 },
  { key: 'motor', ico: '\u{2699}',  ten: 'Động cơ lăn',    mota: 'Xe tự bò thêm khi đã chạm đất, leo được dốc lên', max: 24, c0: 130, gr: 1.28 },
  { key: 'aero',  ico: '\u{1F4A8}', ten: 'Khí động học',   mota: 'Thân xe lượn, rơi chậm hơn nên bay xa hơn', max: 22, c0: 140, gr: 1.29 },
  { key: 'ntank', ico: '\u{1F525}', ten: 'Số bình nitro',  mota: 'Thêm lượt tăng tốc, dùng được cả khi đang lăn', max: 8,  c0: 620, gr: 1.72 },
  { key: 'npow',  ico: '\u{26A1}',  ten: 'Sức nitro',      mota: 'Mỗi lần đốt nitro mạnh hơn',       max: 22, c0: 175, gr: 1.29 },
  { key: 'money', ico: '\u{1F4B0}', ten: 'Tiền thưởng',    mota: 'Mỗi mét bay được nhiều tiền hơn',  max: 20, c0: 130, gr: 1.27 }
];

export const giaCap = (u, lv) => Math.round(u.c0 * Math.pow(u.gr, lv) / 5) * 5;

/* Moi cap cong them bao nhieu. Sua o day de can bang lai. */
/* Buoc tang moi cap. Da HA XUONG so voi ban truoc, vi do duoc la cap toi da bay
   toi 2.400 m, tuc la mot cu phong an gon ca map, khong con gi de choi.
   Muc tieu moi: cap 0 khoang 200-300 m, cap toi da khoang 1.000-1.300 m,
   tuc chenh khoang 4 lan chu khong phai 8 lan. */
export const BUOC = {
  /* Nhieu cap hon nen moi cap phai cong it hon, neu khong cap toi da lai bay
     het ca map trong mot cu. Tong cong o cap toi da tuong duong ban truoc,
     nhung chia thanh 2-3 lan nhieu buoc hon nen choi lau hon nhieu. */
  power: 0.62,       // 30 cap x 0.62 = +18.6 m/s
  wheelGrip: 0.028,  // an bang tang toc manh hon
  wheelRoll: 0.026,  // lan it mat toc do hon
  wheelBounce: 0.011,// nay cao hon khi cham dat
  motorLuc: 0.075,   // moi cap +7,5% luc dong co lan
  motorGiay: 0.22,   // moi cap +0,30 giay nhien lieu
  aero: 0.0007,      // giam can gio
  aeroGlide: 0.0072, // GIAM TRONG LUC khi dang bay
  npow: 0.50,        // m/s moi cap
  money: 0.17        // he so tien moi cap
};
