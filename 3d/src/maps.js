/* =========================================================================
   BANG MAP - DU LIEU. Them map moi thi them mot phan tu, khong mo main.js.

   Moi map la MOT BO SO sinh ra dia hinh, cong mot bang mau va mot kieu anh sang.
   Do la ly do mot nguoi lam duoc 5 map: khong dung 5 dia hinh bang tay, chi doi 5
   bo so. Thu tu quan trong nhat lam map khac cam giac:
     1. Bang mau va anh sang  (re nhat, hieu qua nhat)
     2. Hinh dang dia hinh    (doi thoai cho bay dai, nhon cho nay dien)
     3. Trong luc va gio
     4. Mat san tron hay dinh, chuong ngai vat, vat pham
   ========================================================================= */
export const MAPS = [
  {
    id: 'dongco', ten: 'Đồng cỏ', moKhi: 0, dich: 830,
    mota: 'Đồi cỏ thoai thoải, nắng đẹp. Chỗ để tập.',
    troi: { tren: 0x63b8f5, giua: 0xc3e8ff, duoi: 0xfff0cf },
    dat:  { tren: 0x8ed964, duoi: 0x4e9c4c, vien: 0xc4f593 },
    datDoc: 0x9c7b4e, datDa: 0x9aa3ad,
    nang: { mau: 0xfff8e6, cuong: 2.5, hemiTroi: 0xdaf1ff, hemiDat: 0xa8dd86, hemiCuong: 1.05 },
    suong: [300, 1200], trongLuc: -22, gio: 0,
    seed: 11, nhieu: 0.6, texDat: 'co',
    doc: { so: 7, cao: [5, 10], dai: [26, 44] },
    dai: 1900, vuc: { so: 2, sau: [7, 12] }, nuiXa: { cao: 46, mau: 0x6f9c66, xa: 2 },
    dia:  { bien: 6.5, buoc: 82, nham: 0.22, longRong: 60, caoVach: 30 },
    cay:  { kieu: 'tron', matDo: 1.0, la: [0x5fcf62, 0x46b352], than: 0x9c7550 },
    da:   { mau: 0xb9c2cc, matDo: 0.7 },
    hoa:  { matDo: 1.2, mau: [0xffe36e, 0xff8fc7, 0xfff6ff] },
    san:  { bang: 0, cat: 0.25, nhun: 0.2 },
    chuongNgai: 1.1, vatPham: 1.0
  },
  {
    id: 'samac', ten: 'Sa mạc', moKhi: 620, dich: 1520,
    mota: 'Cồn cát dài, trời chói. Cát hút chân nhưng dốc cát bắn rất xa.',
    troi: { tren: 0x4fb6f0, giua: 0xffe3b0, duoi: 0xffd08a },
    dat:  { tren: 0xf2c877, duoi: 0xcf914d, vien: 0xffe7ad },
    datDoc: 0xc4813f, datDa: 0xa8886a,
    nang: { mau: 0xfff2d0, cuong: 3.0, hemiTroi: 0xffeccf, hemiDat: 0xe8c68a, hemiCuong: 1.15 },
    suong: [340, 1400], trongLuc: -21, gio: 0.6,
    seed: 27, nhieu: 0.55, texDat: 'cat',
    doc: { so: 6, cao: [7, 14], dai: [34, 60] },
    dai: 2900, vuc: { so: 3, sau: [10, 18] }, nuiXa: { cao: 62, mau: 0xd0a05e, xa: 2 },
    dia:  { bien: 8.5, buoc: 120, nham: 0.12, longRong: 72, caoVach: 22 },
    cay:  { kieu: 'xuongrong', matDo: 0.45, la: [0x63bd6a, 0x4e9c56], than: 0x8a7a52 },
    da:   { mau: 0xd8b98a, matDo: 1.1 },
    hoa:  { matDo: 0.35, mau: [0xffb86e, 0xff8f6e, 0xfff0c0] },
    san:  { bang: 0, cat: 1.4, nhun: 0.15 },
    chuongNgai: 1.5, vatPham: 1.1
  },
  {
    id: 'tuyet', ten: 'Núi tuyết', moKhi: 1150, dich: 660,
    mota: 'Đồi tuyết dốc. Mặt băng cực trơn, lăn mãi không dừng.',
    troi: { tren: 0x3f9de0, giua: 0xbfe4fb, duoi: 0xf2f8ff },
    dat:  { tren: 0xe4f1fd, duoi: 0x93b8d8, vien: 0xffffff },
    datDoc: 0x8fa8bd, datDa: 0x6f8296,
    nang: { mau: 0xf0f8ff, cuong: 2.7, hemiTroi: 0xeaf6ff, hemiDat: 0xcfe4f5, hemiCuong: 1.25 },
    suong: [280, 1200], trongLuc: -23, gio: -0.4,
    seed: 43, nhieu: 1.0, texDat: 'tuyet',
    doc: { so: 9, cao: [6, 13], dai: [22, 38] },
    dai: 1500, vuc: { so: 4, sau: [12, 22] }, nuiXa: { cao: 96, mau: 0xb9d4e8, xa: 3 },
    dia:  { bien: 11, buoc: 68, nham: 0.4, longRong: 56, caoVach: 44 },
    cay:  { kieu: 'thong', matDo: 0.9, la: [0x6fd0a8, 0x4fae86], than: 0x8b6f56 },
    da:   { mau: 0xdfeaf5, matDo: 0.9 },
    hoa:  { matDo: 0.3, mau: [0xbff0ff, 0xffffff, 0xd9c7ff] },
    san:  { bang: 1.6, cat: 0.1, nhun: 0.2 },
    chuongNgai: 1.9, vatPham: 1.2
  },
  {
    id: 'mattrang', ten: 'Mặt trăng', moKhi: 1600, dich: 1420,
    mota: 'Trọng lực thấp, bay lâu gấp đôi. Hố thiên thạch to.',
    troi: { tren: 0x241f5e, giua: 0x8f88e0, duoi: 0xdcc9ff },
    dat:  { tren: 0xaba3d6, duoi: 0x6d6499, vien: 0xd8d2f5 },
    datDoc: 0x7d739f, datDa: 0x5d5578,
    nang: { mau: 0xffffff, cuong: 2.9, hemiTroi: 0xcfd8ff, hemiDat: 0xa9a3c9, hemiCuong: 1.0 },
    suong: [420, 1700], trongLuc: -13.5, gio: 0,   // -9.5 thi bay tan 100 giay moi luot, qua dai
    seed: 59, nhieu: 1.25, texDat: 'da',
    doc: { so: 8, cao: [8, 16], dai: [30, 52] },
    dai: 2700, vuc: { so: 5, sau: [16, 30] }, nuiXa: { cao: 84, mau: 0x8b83b4, xa: 3 },
    dia:  { bien: 14, buoc: 110, nham: 0.55, longRong: 58, caoVach: 52 },
    cay:  { kieu: 'tinhthe', matDo: 0.55, la: [0x9ff0ff, 0xc79fff], than: 0x6f6a94 },
    da:   { mau: 0xb8b2d4, matDo: 1.4 },
    hoa:  { matDo: 0.5, mau: [0x9ff0ff, 0xffa8e8, 0xfff6a8] },
    san:  { bang: 0.4, cat: 0.3, nhun: 0.5 },
    chuongNgai: 2.3, vatPham: 1.3
  },
  {
    id: 'daomay', ten: 'Đảo mây', moKhi: 2000, dich: 1830,
    mota: 'Trên tầng mây. Mặt mây nhún bật rất cao, gió đẩy đi xa.',
    troi: { tren: 0x62aef7, giua: 0xffcbe8, duoi: 0xfff0cf },
    dat:  { tren: 0xffbfe4, duoi: 0xb583d6, vien: 0xfff0fa },
    datDoc: 0xd88fc0, datDa: 0xa06fb0,
    nang: { mau: 0xfff0f6, cuong: 2.8, hemiTroi: 0xffe6f5, hemiDat: 0xd8bde8, hemiCuong: 1.3 },
    suong: [360, 1500], trongLuc: -17, gio: 1.4,
    seed: 71, nhieu: 0.8, texDat: 'may',
    doc: { so: 8, cao: [5, 11], dai: [24, 40] },
    dai: 3300, vuc: { so: 4, sau: [12, 24] }, nuiXa: { cao: 74, mau: 0xe8b8dc, xa: 3 },
    dia:  { bien: 9, buoc: 95, nham: 0.3, longRong: 54, caoVach: 38 },
    cay:  { kieu: 'bongbong', matDo: 0.8, la: [0xffb3e6, 0xb3e0ff], than: 0xe8c9ef },
    da:   { mau: 0xf0dcff, matDo: 0.6 },
    hoa:  { matDo: 1.4, mau: [0xfff0a8, 0xffb3e6, 0xb3f0ff] },
    san:  { bang: 0.5, cat: 0.05, nhun: 1.8 },
    chuongNgai: 1.7, vatPham: 1.4
  }
];

export const mapTheoId = id => MAPS.find(m => m.id === id) || MAPS[0];

/* Cac loai mat san. Nhan vao chi so xe khi xe dang o tren mat do. */
export const MATSAN = {
  binhthuong: { ten: 'thường', mau: null,      maSat: 1.0,  bam: 1.0, nay: 1.0 },
  // Bang de 0.18 thi truot gan nhu vo tan, do duoc 7 tren 80 luot chay qua 100 giay.
  // 0.28 van truot hon mat thuong 3,5 lan nhung luot choi khong keo dai vo ly.
  bang:       { ten: 'băng',   mau: 0xc9ecff,  maSat: 0.28, bam: 0.4, nay: 0.9 },
  cat:        { ten: 'cát',    mau: 0xf0cf87,  maSat: 3.2,  bam: 1.3, nay: 0.7 },
  nhun:       { ten: 'nhún',   mau: 0xffb0dc,  maSat: 0.8,  bam: 0.9, nay: 1.9 }
};

/* Vat pham an duoc */
export const VATPHAM = {
  nitro: { mau: 0xff8a3d, ten: 'Nitro', bk: 1.5 },
  tien:  { mau: 0xffd45e, ten: 'Tiền',  bk: 1.3 },
  bong:  { mau: 0x6ff0c8, ten: 'Bóng bay', bk: 1.7 }
};
