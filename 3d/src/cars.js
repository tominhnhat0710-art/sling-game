/* =========================================================================
   BANG CAC DONG XE - DU LIEU, khong phai code.
   Them xe moi thi them mot phan tu vao day, khong can mo main.js.

   Nguyen tac thiet ke: xe sau KHONG duoc chi la xe truoc manh hon.
   Moi xe phai co tinh cach rieng, manh o chuyen nay va yeu o chuyen khac,
   de nguoi choi doi xe theo cach choi chu khong chi mua xe dat nhat.

   model: de null thi game tu dung xe bang khoi hinh hoc (khong ton dung luong).
          Neu sau nay m tai duoc file .glb thi dat duong dan vao day, vi du
          'assets/cars/pickup.glb', game se tu nap thay cho xe dung san.
   ========================================================================= */
export const CARS = [
  {
    id: 'golf', model: 'xe_cu', ten: 'Xe cũ', mota: 'Xe nhỏ cũ. Chậm, nhẹ, nhưng là chỗ bắt đầu.',
    gia: 0, moKhi: 0,
    mau: 0xf2f4f8, mauPhu: 0x2a2f38,
    hinh: { dai: 1.15, cao: 0.4, rong: 0.72, kieu: 'golf', banh: 0.34, benhBanh: 0.26 },
    ct: { khoiLuong: 0.62, tocDo: 0.74, doNay: 0.62, maSatLan: 1.75, canGio: 1.5,
          luon: 0, canBang: 1.3, heSoBang: 0.7, susRest: 0.9 },
    manh: 'Rất nhẹ nên nảy tốt, cực ổn định',
    yeu: 'Phóng yếu nhất, cản gió cao nhất'
  },
  {
    id: 'co', model: 'xe_taxi', ten: 'Taxi', mota: 'Taxi thành phố. Cân bằng, mốc để so sánh.',
    gia: 1200, moKhi: 120,
    mau: 0xd8382f, mauPhu: 0x2a2f38,
    hinh: { dai: 1.55, cao: 0.48, rong: 0.82, kieu: 'hatch', banh: 0.45, benhBanh: 0.32 },
    ct: { khoiLuong: 1.0, tocDo: 1.0, doNay: 1.0, maSatLan: 1.0, canGio: 1.0,
          luon: 0, canBang: 1.0, heSoBang: 1.0, susRest: 1.0 },
    manh: 'Không giỏi gì nhưng cũng không tệ gì',
    yeu: 'Không có điểm mạnh riêng'
  },
  {
    id: 'bantai', model: 'xe_suv', ten: 'SUV', mota: 'Nặng và trơn. Bay không cao nhưng lăn rất xa và giữ tốc độ tốt.',
    gia: 5000, moKhi: 350,
    mau: 0x2f7fd8, mauPhu: 0x22303f,
    hinh: { dai: 1.95, cao: 0.5, rong: 0.86, kieu: 'pickup', banh: 0.48, benhBanh: 0.36 },
    ct: { khoiLuong: 1.45, tocDo: 0.98, doNay: 0.85, maSatLan: 0.52, canGio: 0.84,
          luon: 0, canBang: 1.25, heSoBang: 1.2, susRest: 1.0 },
    manh: 'Lăn xa nhất, ổn định nhất, mạnh sớm nhất',
    yeu: 'Phóng chậm hơn, nảy thấp'
  },
  {
    id: 'diahinh', model: 'xe_tuantra', ten: 'Xe tuần tra', mota: 'Xe cảnh sát. Bánh to, giảm xóc dài, đi xa nhờ nhiều cú nảy.',
    gia: 6500, moKhi: 500,
    mau: 0x3ddc97, mauPhu: 0x25302b,
    hinh: { dai: 1.7, cao: 0.55, rong: 0.9, kieu: 'pickup', banh: 0.68, benhBanh: 0.48 },
    ct: { khoiLuong: 1.15, tocDo: 1.08, doNay: 1.7, maSatLan: 0.7, canGio: 1.0,
          luon: 0.05, canBang: 1.15, heSoBang: 1.42, susRest: 1.7 },
    manh: 'Nảy cao nhất, ăn bảng tăng tốc mạnh nhất, mạnh nhất ở giữa game',
    yeu: 'Phóng không mạnh, cản gió hơi cao'
  },
  {
    id: 'dua', model: 'xe_ae86', ten: 'AE86', mota: 'Toyota AE86. Nhẹ và cực nhanh, nhưng khó bảo.',
    gia: 22000, moKhi: 1200,
    mau: 0xffc233, mauPhu: 0x1c1c22,
    hinh: { dai: 1.85, cao: 0.34, rong: 0.9, kieu: 'gt', banh: 0.40, benhBanh: 0.42 },
    ct: { khoiLuong: 0.72, tocDo: 1.16, doNay: 0.78, maSatLan: 1.9, canGio: 0.62,
          luon: 0.08, canBang: 0.7, heSoBang: 0.78, susRest: 0.7 },
    manh: 'Phóng mạnh nhất, ít cản gió nhất, có lượn nhẹ',
    yeu: 'Gầm thấp nên ăn bảng tăng tốc kém, lăn trên đất mất tốc độ rất nhanh'
  },
  {
    id: 'sieu', model: 'xe_rx7', ten: 'RX-7', mota: 'Mazda RX-7. Cực thấp, nhanh nhất, khó bảo nhất.',
    gia: 55000, moKhi: 1150,
    mau: 0xe8332e, mauPhu: 0x14161c,
    hinh: { dai: 2.0, cao: 0.3, rong: 0.96, kieu: 'sieu', banh: 0.42, benhBanh: 0.46 },
    ct: { khoiLuong: 0.68, tocDo: 1.24, doNay: 0.66, maSatLan: 2.3, canGio: 0.52,
          luon: 0.12, canBang: 0.62, heSoBang: 0.62, susRest: 0.62 },
    manh: 'Phóng cực mạnh, cản gió thấp nhất, có lượn',
    yeu: 'Gầm sát đất nên ăn bảng kém nhất, lăn mất tốc độ nhanh nhất'
  }
];;

export const xeTheoId = id => CARS.find(c => c.id === id) || CARS[0];
