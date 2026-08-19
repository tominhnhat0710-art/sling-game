/* =============================================================
   TOAN BO SO DIEU CHINH GAMEPLAY - sua o day, khong sua cho khac
   Don vi: met, giay, kilogram. So to hon = manh hon.
   ============================================================= */
export const TUNE = {
  /* --- the gioi --- */
  gravity:        -22,    // luc hut. Nho lai (-14) = bay lau hon, kieu mat trang
  worldLength:    3200,   // do dai dia hinh (met)
  worldWidth:     150,    // be rong dia hinh
  segX:           480,    // so o luoi doc theo huong bay. Cao hon = dia hinh min hon, may nang hon
  segZ:           14,

  /* --- dia hinh --- */
  hillAmp:        7.0,    // do cao doi
  hillWave:       78,     // buoc song doi. Nho lai = doi nhon, nay dien hon
  flatRunway:     45,     // doan phang o vach xuat phat

  /* --- phong xe --- */
  launchSpeed:    52,     // toc do phong co ban (m/s)
  aimMin:         14,     // goc thap nhat (do)
  aimMax:         72,     // goc cao nhat
  aimSweep:       0.85,   // toc do quet kim ngam
  powerSweep:     1.5,    // toc do chay thanh luc
  powerFloor:     0.55,   // bam luc te nhat con lai bao nhieu %

  /* --- xe --- */
  chassis:        [1.55, 0.48, 0.82],  // nua kich thuoc than xe
  mass:           360,
  wheelRadius:    0.45,
  wheelWidth:     0.32,
  wheelX:         1.12,   // banh cach tam bao nhieu theo huong truoc sau
  wheelZ:         0.80,   // theo huong ngang
  wheelY:         -0.30,  // diem treo giam xoc
  susRest:        0.45,   // hanh trinh giam xoc
  susStiff:       28,
  susCompress:    1.6,
  susRelax:       2.6,
  frictionSlip:   2.4,    // do bam. Cao = it truot
  linDamp:        0.02,   // can gio. Cao = mat toc do nhanh
  angDamp:        0.06,   // can quay. Cao = it lon nhao

  /* --- nitro --- */
  nitroCount:     2,
  nitroPush:      19,     // cong bao nhieu m/s moi lan dot
  nitroLift:      0.35,   // ty le day len tren

  /* --- bang tang toc --- */
  padEvery:       185,    // khoang cach giua cac bang (met)
  padFirst:       120,
  padGain:        0.26,   // bang dau tien cong 26% toc do
  padDecay:       0.75,   // bang sau chi con 75% suc bang truoc
  padLift:        5.5,    // day len bao nhieu m/s
  padNeedFall:    -4.0,   // phai ROI xuong bang moi an duoc, toc do roi toi thieu (m/s).
                          // Nho co dieu nay, ban thap la dat de truot khong an duoc bang,
                          // nen ban vong cung cao moi la cach choi dung.

  /* --- ma sat khi lan tren dat --- */
  groundDrag:     0.007,  // moi khung mat bao nhieu % toc do khi sat dat.
                          // Day la thu ngan khong cho xe lan mai khong dung.
  groundAlt:      3.2,    // duoi do cao nay coi nhu dang sat dat.
                          // Phai de rong rai, vi xe rat hay nam ngua tua vao cot moc hoac
                          // tang da, luc do tam xe cach mat dat kha xa ma van la da dung.

  /* --- ket thuc luot --- */
  stopSpeed:      2.2,    // duoi toc do nay coi nhu da dung
  stopFrames:     40,
  maxSeconds:     35,

  /* --- camera --- */
  camAim:         [-15.5, 4.2, 9.0],   // vi tri camera luc ngam, so voi xe
  camFly:         [-8.0, 3.0, 17.0],   // vi tri camera luc bay: lech han sang ben de thay duoc vong cung
  camFlyBlend:    1.1,    // bao nhieu giay de chuyen tu goc ngam sang goc bay
  camFollow:      0.085,  // do muot cua camera. Nho = muot va tre hon
  camAltPull:     0.05,   // bay cao thi keo camera ra xa bao nhieu
  camPullY:       0.3,    // phan keo ra do ap vao chieu cao. De thap thi camera khong bi
                          // chuc xuong nhin tu tren khi xe bay cao
  camLookAhead:   0.32,   // nhin truoc theo huong bay
  camLookUp:      4.2,    // nang diem ngam len, de duong chan troi khong bi tut xuong day

  /* --- hinh anh --- */
  fogNear:        180,
  fogFar:         920,
  shadowSpan:     46,     // vung co bong do quanh xe
  sunOffset:      [-14, 96, 16],  // huong nang. Gan nhu tren dinh dau, de bong do nam ngay
                                  // duoi xe chu khong lech ra mot chuc, tranh nhin thay 2 bong
  trailPoints:    170,    // so diem toi da cua vet bay
  trailSpacing:   1.6,    // cach nhau bao nhieu met thi tha 1 diem. Dat theo khoang cach
                          // chu khong theo khung hinh, de vet luon deu du may nhanh hay cham
  blobRadius:     1.7,    // ban kinh dom bong doc do cao
  blobOpacity:    0.24
};
