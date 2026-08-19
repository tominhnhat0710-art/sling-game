/* =============================================================
   TOAN BO SO DIEU CHINH GAMEPLAY - sua o day, khong sua cho khac
   Don vi: met, giay, kilogram. So to hon = manh hon.
   ============================================================= */
export const TUNE = {
  /* --- the gioi --- */
  gravity:        -22,    // luc hut. Nho lai (-14) = bay lau hon, kieu mat trang
  worldLength:    3200,   // do dai dia hinh (met)
  worldBack:      150,    // keo dai dia hinh ve phia sau vach xuat phat bao nhieu met.
                          // Can co, neu khong thi luc ngam se thay ria dia hinh cat ngang man hinh.
  worldWidth:     150,    // be rong dia hinh
  segX:           480,    // so o luoi doc theo huong bay. Cao hon = dia hinh min hon, may nang hon
  segZ:           14,

  /* --- dia hinh --- */
  hillAmp:        7.0,    // do cao doi
  hillWave:       78,     // buoc song doi. Nho lai = doi nhon, nay dien hon
  flatRunway:     45,     // doan phang o vach xuat phat

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
  bounceBase:     0.20,   // do nay cua than xe khi chua nang cap banh
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

  /* --- nitro --- */
  nitroCount:     2,
  nitroPush:      19,     // cong bao nhieu m/s moi lan dot
  nitroLift:      0.35,   // ty le day len tren
  nitroCooldown:  0.55,   // phai cho bao nhieu giay giua 2 lan dot.
                          // Khong co cai nay thi len cap cao co the doc het 6 binh trong
                          // 6 khung hinh lien, toc do no tung va game vo can bang.
  speedCap:       150,    // gioi han toc do (m/s). Chan cho vat ly khong vo va xe khong
                          // xuyen qua dia hinh khi bay qua nhanh.

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
  stallMet:       2,      // trong khoang thoi gian duoi day ma tien duoi bao nhieu met
  stallGiay:      3.0,    // thi coi nhu het luot
  stopSpeed:      1.6,    // duoi toc do nay coi nhu da dung. Ha xuong tu 2.2 de xe duoc
                          // bo lan them den luc that su gan nhu dung han.
  stopFrames:     48,
  maxSeconds:     120,   // chi la chot chan cuoi cung, binh thuong khong bao gio cham toi

  /* --- camera --- */
  camAim:         [-18.0, 9.0, 13.0], // LUC NGAM: nhin tu ben canh, xe huong sang phai man hinh.
                                      // Phai nhin tu ben moi keo sling duoc, keo tu sau duoi
                                      // xe thi khong thay minh dang keo len hay keo xuong.
  camAimLook:     [7, 0.5, 0],         // luc ngam thi ngam vao dau, so voi xe
  camFly:         [-11.5, 3.3, 0],     // LUC BAY: dan ngay sau duoi xe. Z = 0 la ngay sau duoi.
  camSide:        0.0,    // them do lech sang ben KHI DANG BAY.
                          // 0 = dan sau duoi xe, kho hon, nhap vai hon.
                          // 1 = lech han sang ben, de doc vong cung hon. 0.4 = lung chung.
  camSideDist:    17,     // khi camSide = 1 thi lech sang ben bao nhieu met
  camFlyBlend:    1.1,    // bao nhieu giay de chuyen tu goc ngam sang goc bay
  camFollow:      0.1,    // do muot cua camera. Nho = muot va tre hon
  camAltPull:     0.062,  // bay cao thi keo camera ra xa bao nhieu
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
  fovPerSpeed:    0.16,   // moi m/s thi mo them bao nhieu do. Tao cam giac toc do
  fovMax:         76,
  rollDustSpeed:  14,     // lan tren dat nhanh hon nay thi bat bui
  volume:         0.55,   // am luong chung, 0 la tat het
  tienMoiMet:     1.0,    // 1 met bay duoc thi bao nhieu tien
  windMax:        70,     // toc do ung voi tieng gio to nhat

  fogNear:        180,
  fogFar:         920,
  shadowSpan:     46,     // vung co bong do quanh xe
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
