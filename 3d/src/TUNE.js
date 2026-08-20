/* =============================================================
   TOAN BO SO DIEU CHINH GAMEPLAY - sua o day, khong sua cho khac
   Don vi: met, giay, kilogram. So to hon = manh hon.
   ============================================================= */
export const TUNE = {
  /* --- the gioi --- */
  gravity:        -22,    // luc hut. Nho lai (-14) = bay lau hon, kieu mat trang
  worldLength:    4000,   // do dai dia hinh (met). Phai dai hon tam xa xa nhat co the
                          // dat duoc, neu khong xe se bay ra khoi ria ban do.
  worldBack:      150,    // keo dai dia hinh ve phia sau vach xuat phat bao nhieu met.
                          // Can co, neu khong thi luc ngam se thay ria dia hinh cat ngang man hinh.
  worldWidth:     300,    // be rong dia hinh. Rong ra de the gioi trong do so hon
  segX:           560,    // so o luoi doc theo huong bay. Cao hon = dia hinh min hon, may nang hon
  segZ:           52,     // o luoi ngang. Cao de vach thung lung va go hai ben ro net

  /* --- dia hinh --- */
  hillAmp:        7.0,    // do cao doi
  hillWave:       78,     // buoc song doi. Nho lai = doi nhon, nay dien hon
  flatRunway:     26,     // doan phang o vach xuat phat

  /* --- phong xe kieu sling: keo va tha --- */
  launchSpeed:    52,     // toc do phong khi keo cang toi da (m/s)
  aimMin:         3,      // goc thap nhat (do). Gan nhu ban la sat dat.
  aimMax:         88,     // goc cao nhat. Gan nhu ban thang dung len troi.
                          // De rong het co, sling thi phai chinh duoc tu sat dat toi thang dung.
  pullMax:        190,    // keo bao nhieu diem tren man hinh la cang toi da.
                          // Nho lai = nhay hon nhung kho chinh; to len = phai keo dai hon.
  pullMin:        16,     // keo ngan hon nay thi khong tinh, tranh cham nham la ban mat
  powerFloor:     0.35,   // keo it nhat van con bao nhieu % luc
  bandWidth:      0.16,   // do day cua day sling tren hinh
  slingHeight:    5.6,    // do cao cua tui sling so voi mat dat. Phai du cao, neu khong thi
                          // keo xuong la xe chui xuong duoi dat.
  slingSpan:      2.1,    // hai cot sling cach nhau bao nhieu
  slingPull:      4.2,    // keo cang toi da thi xe lui ve sau bao nhieu met

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
  /* --- NAY --- Chia lam hai thu khac nhau:
     chassisRest la do nay cua CAI THUNG xe. Phai de RAT THAP. Truoc day de 0.2 roi
     cong nang cap len tan 0.88, va do la nguyen nhan xe vang tung toe: thung xe dap
     goc xuong dat thi nay lech, sinh momen xoay, xe lon nhao khong kiem soat duoc.
     nayBanh la do nay CO DIEU KHIEN qua banh xe: khi banh cham dat, game tu dao
     chieu van toc doc theo truc dung. Vi tac dung dung tam xe nen khong sinh momen
     xoay, xe nay cao ma van giu duoc the dung banh. */
  chassisRest:    0.06,   // do nay cua thung xe. De thap, dung tang.
  nayBase:        0.34,   // nay co dieu khien khi chua nang cap
  nayMax:         0.76,   // tran cua nay co dieu khien. Chuoi nay la nguon tam xa lon nhat
  nayMinFall:     3.5,    // roi nhanh hon nay (m/s) thi moi tinh la mot cu nay
  bounceBase:     0.20,   // (khong con dung, giu lai cho tuong thich)
  linDamp:        0.05,   // can gio. Cao = mat toc do nhanh.
                          // Phai du lon, neu khong thi nang cap Khi dong hoc khong co tac dung
                          // gi do luon (da do thuc te: 0.02 thi cap 0 va cap 9 bay xa y het nhau).
  angDamp:        0.06,   // can quay. Cao = it lon nhao

  /* --- tu can bang khi bay (de xe dap dat bang banh) --- */
  autoLevel:      1.0,    // 0 = tat han, xe lon nhao tu do nhu truoc.
                          // 1 = luon tu chinh lai de dap dat bang banh xe.
  levelMaxPitch:  32,     // mui xe duoc chuc theo huong bay toi da bao nhieu do.
                          // De thap thi xe gan nhu luon nam ngang.
  levelGain:      4.2,    // luc chinh manh bao nhieu
  levelDamp:      7.0,    // toc do bat kip huong muc tieu
  levelRecover:   0.55,   // sau khi va cham thi mat bao nhieu giay moi chinh lai duoc.
                          // Nho co do tre nay, dam vao dia hinh van bi lon nhao that su.

  /* Sap ha canh thi keo xe ve nam ngang han, giong may bay keo mui len truoc khi
     tiep dat. Khong co cai nay thi ban goc cao se cham dat bang mui xe roi lon nhao. */
  levelFlareAlt:  22,     // duoi do cao nay thi bat dau keo ve nam ngang (met)
  levelFlareSpd:  0.85,   // roi cang nhanh thi phai keo som hon bao nhieu
  levelFlareGain: 3.2,    // gan dat thi luc chinh manh len bao nhieu lan

  /* Sau va cham thi KHONG tat han viec giu thang bang nua, chi lam yeu di.
     Tat han la nguyen nhan xe lat roi khong bao gio tu dung len duoc. */
  levelWeak:      0.42,   // trong luc vua va cham thi luc giu con bao nhieu phan
  spinCap:        7.5,    // gioi han toc do quay (rad/s). 51 rad/s la xe quay nhu chong chong.
  spinDamp:       0.5,    // cham dat thi nhan toc do quay voi so nay, cho no thoi quay
  tuDungLen:      0.45,   // xe nghieng qua muc nay thi luon tu chinh, ke ca dang sat dat

  /* --- nitro --- */
  nitroCount:     2,
  nitroPush:      19,     // cong bao nhieu m/s moi lan dot
  nitroLift:      0.35,   // ty le day len tren
  nitroCooldown:  0.55,   // phai cho bao nhieu giay giua 2 lan dot.
                          // Khong co cai nay thi len cap cao co the doc het 6 binh trong
                          // 6 khung hinh lien, toc do no tung va game vo can bang.
  speedCap:       86,    // gioi han toc do (m/s). Chan cho vat ly khong vo va xe khong
                          // xuyen qua dia hinh khi bay qua nhanh.

  /* --- bang tang toc --- */
  padEvery:       115,    // khoang cach giua cac bang (met)
  padFirst:        90,
  padGain:        0.17,   // bang dau tien cong 17% toc do
  padAltAn:       7.0,    // do cao toi da con an duoc bang. Truoc 4.5 nen hay bay vuot qua
  padLanNgang:    0.55,   // lan ngang qua bang thi an bao nhieu phan so voi roi tu tren
  padDay:         6.5,    // luc day thang them, de lan ngang qua van thay ro
  padDecay:       0.62,   // bang sau chi con 62% suc bang truoc
  padLift:        5.5,    // day len bao nhieu m/s
  padNeedFall:    -4.0,   // phai ROI xuong bang moi an duoc, toc do roi toi thieu (m/s).
                          // Nho co dieu nay, ban thap la dat de truot khong an duoc bang,
                          // nen ban vong cung cao moi la cach choi dung.

  /* --- ma sat khi lan tren dat --- */
  /* ---- DONG CO LAN: xe khong bao gio chet cung tai cho nua ----
     Day la co che m yeu cau. Khi banh dang cham dat va con nhien lieu thi xe
     tu bo them mot luc ve phia truoc. Doc len cung leo duoc. Nang cap Banh xe
     va Dong co lan quyet dinh luc bo va so giay nhien lieu. */
  dongCoGiaToc:   9.5,    // m/s^2 luc bo co ban khi dang lan
  dongCoGiay:     1.8,    // so giay nhien lieu co ban
  dongCoTran:     22,     // chi bo khi toc do ngang duoi muc nay
  dongCoDoc:      1.35,   // doc len thi bo manh hon bao nhieu lan
  dongCoNguong:   0.7,    // chi bo khi xe dung banh (up.y tren muc nay)

  groundDrag:     0.0058, // moi khung mat bao nhieu % toc do khi sat dat.
                          // Day la thu ngan khong cho xe lan mai khong dung.
                          // Ha tu 0.007 xuong de xe tron hon, lan them mot doan truoc khi dung.
                          // Ha xuong 0.0042 thi tron qua, luot chay tan 60 giay moi dung.
  groundAlt:      3.2,    // duoi do cao nay coi nhu dang sat dat.
                          // Phai de rong rai, vi xe rat hay nam ngua tua vao cot moc hoac
                          // tang da, luc do tam xe cach mat dat kha xa ma van la da dung.

  /* --- ket thuc luot --- */
  /* Ket thuc luot khi xe khong tien them duoc nua, thay vi cat bang dong ho.
     Cat bang dong ho lam nguoi choi bi ngat giua luc con dang bay, rat vo ly. */
  stallMet:        8,     // tien duoc it hon muc nay trong stallGiay giay thi ket thuc luot
  stallGiay:      3.0,    // thi coi nhu het luot
  stopSpeed:      1.6,    // duoi toc do nay coi nhu da dung. Ha xuong tu 2.2 de xe duoc
                          // bo lan them den luc that su gan nhu dung han.
  stopFrames:     48,
  maxSeconds:     90,     // chan tren tuyet doi cho mot luot

  /* --- camera --- */
  camAim:         [-18.0, 9.0, 13.0], // LUC NGAM: nhin tu ben canh, xe huong sang phai man hinh.
                                      // Phai nhin tu ben moi keo sling duoc, keo tu sau duoi
                                      // xe thi khong thay minh dang keo len hay keo xuong.
  camAimLook:     [7, 0.5, 0],         // luc ngam thi ngam vao dau, so voi xe
  camFly:         [-7.2, 2.3, 0],      // LUC BAY: dan ngay sau duoi xe. Z = 0 la ngay sau duoi.
                                      // Keo gan tu -11.5 vao -7.2 cho nhap vai hon.
  camSide:        0.0,    // them do lech sang ben KHI DANG BAY.
                          // 0 = dan sau duoi xe, kho hon, nhap vai hon.
                          // 1 = lech han sang ben, de doc vong cung hon. 0.4 = lung chung.
  camSideDist:    17,     // khi camSide = 1 thi lech sang ben bao nhieu met
  camFlyBlend:    1.1,    // bao nhieu giay de chuyen tu goc ngam sang goc bay
  camFollow:      0.135,  // do muot cua camera. Cao hon = bam xe sat hon, nhap vai hon
  camAltPull:     0.03,   // bay cao thi keo camera ra xa bao nhieu. Ha xuong de camera
                          // khong bi lui ra xa moi lan bay cao, giu cam giac ngoi sau xe.
  camPullY:       0.32,   // phan keo ra do ap vao chieu cao. De thap thi camera khong bi
                          // chuc xuong nhin tu tren khi xe bay cao
  camLookAhead:   0.3,    // nhin truoc theo huong bay
  camLookUp:      2.2,    // nang diem ngam len. Dat thap de camera hoi chuc xuong, nhin
                          // duoc mat dat phia truoc qua noc xe

  /* --- hinh anh --- */
  /* --- hieu ung (Giai doan 2) --- */
  fxMax:          420,    // so hat toi da cung luc. Cao hon = day dac hon, may nang hon
  dustPerImpact:  2.4,    // so hat bui sinh ra tren mot don vi luc va cham
  impactMin:      4.5,    // va cham nhe hon nay thi khong tinh (m/s doi toc do)
  shakeImpact:    0.5,    // rung camera moi don vi luc va cham
  shakeLaunch:    9,      // rung camera luc phong
  shakeMax:       26,     // gioi han rung, tranh nhin khong noi
  shakeDecay:     6.5,    // rung tat nhanh cham the nao
  fovBase:        60,     // goc mo camera luc dung yen
  fovPerSpeed:    0.22,   // moi m/s thi mo them bao nhieu do. Tao cam giac toc do
  fovMax:         76,
  rollDustSpeed:  14,     // lan tren dat nhanh hon nay thi bat bui
  volume:         0.55,   // am luong chung, 0 la tat het
  tienMoiMet:     1.0,    // 1 met bay duoc thi bao nhieu tien
  tienVatPham:    120,    // an mot dong tien tren duong duoc bao nhieu
  tienVeDich:     300,    // thuong khi qua duoc vach dich
  tienVeDichLanDau: 1500, // thuong them cho lan dau qua dich cua moi map
  bongLift:       15,     // bong bay day xe len bao nhieu m/s
  nitroHoiToiDa:  2,      // moi luot chi hoi duoc toi da bao nhieu binh nitro tu vat pham.
                          // Khong gioi han thi an nitro lien tuc la bay vo tan.
  banKinhAn:      7.0,    // ban kinh an vat pham (met). Nho qua thi bay ca luot khong an duoc gi.
  windMax:        70,     // toc do ung voi tieng gio to nhat

  fogNear:        180,
  fogFar:         920,
  /* ---- NGAN SACH TAM GIAC CHO PROP MODEL THAT ----
     Model tai tu mang nang hon hinh ve bang code, nen so ban phai tu co lai.
     Ha ba so nay xuong neu iPhone nong hoac tut khung hinh. */
  nganSachCay:  190000,
  nganSachDa:    90000,
  nganSachCo:   130000,

  shadowSpan:     34,     // vung co bong do quanh xe
  sunOffset:      [-14, 96, 16],  // huong nang. Gan nhu tren dinh dau, de bong do nam ngay
                                  // duoi xe chu khong lech ra mot chuc, tranh nhin thay 2 bong
  guideDots:      60,     // So hat cua duong ngam du bao. De 0 la tat.
                          // Ve HET duong bay cho tan diem roi. Hat cuoi cung chinh la cho
                          // xe se cham dat. O goc nhin ba phan tu, cac hat lui dan ve phia
                          // duong chan troi nen doc duoc ca huong lan tam xa.
  beaconPulse:    2.4,    // toc do nhay cua cot sang diem roi
  beaconHeight:   22,     // chieu cao cot sang diem roi (met)
  beaconGrow:     0.075,  // cot cao them theo khoang cach, de ban xa van thay ro
  trailPoints:    170,    // so diem toi da cua vet bay
  trailSpacing:   2.2,    // cach nhau bao nhieu met thi tha 1 diem. Dat theo khoang cach
                          // chu khong theo khung hinh, de vet luon deu du may nhanh hay cham
  blobRadius:     1.7,    // ban kinh dom bong doc do cao
  blobOpacity:    0.24
};
