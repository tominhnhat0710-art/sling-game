import * as THREE from 'three';

/* =========================================================================
   TEXTURE sinh bang canvas ngay trong may, khong tai file nao ve.
   Ly do: moi truong cua m khong tai duoc anh tu ngoai, va cach nay khong ton
   them mot KB dung luong nao ma van co hoa tiet de nhin ro vat the.
   Texture ve o dang gan trang, de nhan voi mau dinh cua dia hinh: hoa tiet
   lam dam nhung khong doi mau map.
   ========================================================================= */
function cv(n = 256) {
  const c = document.createElement('canvas');
  c.width = c.height = n;
  return { c, x: c.getContext('2d') };
}
function xong(c, lap = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(lap, lap);
  t.anisotropy = 4;
  return t;
}
const rr = (a, b) => a + Math.random() * (b - a);

/* --- hoa tiet mat dat, moi map mot kieu --- */
export function texDat(kieu) {
  const { c, x } = cv(256);
  x.fillStyle = '#ffffff'; x.fillRect(0, 0, 256, 256);

  // dam nhieu diem cho mat dat khong bi phang lét
  for (let i = 0; i < 2600; i++) {
    const g = rr(0.84, 1.0);
    x.fillStyle = `rgba(${g * 255 | 0},${g * 255 | 0},${g * 255 | 0},0.5)`;
    x.fillRect(rr(0, 256), rr(0, 256), rr(1, 3), rr(1, 3));
  }

  if (kieu === 'co') {
    // tung co: nhung net ngan huong len
    for (let i = 0; i < 900; i++) {
      const px = rr(0, 256), py = rr(0, 256), h = rr(3, 8);
      x.strokeStyle = `rgba(${rr(150, 205) | 0},${rr(190, 235) | 0},${rr(140, 190) | 0},0.55)`;
      x.lineWidth = rr(0.7, 1.6);
      x.beginPath(); x.moveTo(px, py); x.lineTo(px + rr(-2, 2), py - h); x.stroke();
    }
    for (let i = 0; i < 34; i++) {   // vai bui co to
      x.fillStyle = `rgba(120,170,110,0.13)`;
      x.beginPath(); x.ellipse(rr(0, 256), rr(0, 256), rr(7, 16), rr(5, 11), rr(0, 3), 0, 7); x.fill();
    }
  } else if (kieu === 'cat') {
    // song cat: nhung duong luon song ngang
    for (let i = 0; i < 26; i++) {
      const y0 = rr(0, 256);
      x.strokeStyle = `rgba(${rr(180, 215) | 0},${rr(150, 185) | 0},${rr(110, 150) | 0},0.5)`;
      x.lineWidth = rr(1.5, 4.5);
      x.beginPath();
      for (let px = 0; px <= 256; px += 8) x.lineTo(px, y0 + Math.sin(px / 26 + i) * rr(3, 9));
      x.stroke();
    }
    for (let i = 0; i < 500; i++) {  // hat cat lap lanh
      x.fillStyle = `rgba(255,255,255,${rr(0.1, 0.4)})`;
      x.fillRect(rr(0, 256), rr(0, 256), 1.4, 1.4);
    }
  } else if (kieu === 'tuyet') {
    for (let i = 0; i < 130; i++) {  // gon tuyet
      x.fillStyle = `rgba(${rr(200, 230) | 0},${rr(215, 240) | 0},255,0.26)`;
      x.beginPath(); x.ellipse(rr(0, 256), rr(0, 256), rr(6, 20), rr(3, 8), rr(0, 3), 0, 7); x.fill();
    }
    for (let i = 0; i < 700; i++) {  // hat tuyet lap lanh
      x.fillStyle = `rgba(255,255,255,${rr(0.4, 0.95)})`;
      x.fillRect(rr(0, 256), rr(0, 256), rr(1, 2.4), rr(1, 2.4));
    }
  } else if (kieu === 'da') {
    for (let i = 0; i < 90; i++) {   // ho thien thach nho
      const px = rr(0, 256), py = rr(0, 256), r = rr(4, 17);
      x.fillStyle = `rgba(${rr(140, 180) | 0},${rr(135, 175) | 0},${rr(165, 205) | 0},0.44)`;
      x.beginPath(); x.arc(px, py, r, 0, 7); x.fill();
      x.strokeStyle = 'rgba(255,255,255,0.34)'; x.lineWidth = 1.4;
      x.beginPath(); x.arc(px, py, r, 0, 7); x.stroke();
    }
  } else {  // may
    for (let i = 0; i < 110; i++) {
      x.fillStyle = `rgba(${rr(230, 255) | 0},${rr(200, 240) | 0},${rr(230, 255) | 0},0.28)`;
      x.beginPath(); x.arc(rr(0, 256), rr(0, 256), rr(8, 26), 0, 7); x.fill();
    }
  }
  return xong(c);
}

/* --- thung go: co van go va nep, nhin la biet la thung --- */
export function texThung() {
  const { c, x } = cv(128);
  x.fillStyle = '#c98a4b'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 4; i++) {                 // 4 tam van
    const y = i * 32;
    x.fillStyle = i % 2 ? '#c07f42' : '#d0924f';
    x.fillRect(0, y + 2, 128, 28);
    x.strokeStyle = 'rgba(90,55,25,0.55)'; x.lineWidth = 2;
    x.strokeRect(0, y + 2, 128, 28);
    for (let k = 0; k < 26; k++) {              // van go
      x.strokeStyle = `rgba(120,75,35,${rr(0.06, 0.2)})`; x.lineWidth = 1;
      x.beginPath(); x.moveTo(0, y + rr(4, 28)); x.lineTo(128, y + rr(4, 28)); x.stroke();
    }
  }
  x.strokeStyle = 'rgba(80,48,20,0.85)'; x.lineWidth = 6;
  x.strokeRect(3, 3, 122, 122);
  x.fillStyle = 'rgba(70,42,18,0.8)';
  for (const [px, py] of [[12, 12], [116, 12], [12, 116], [116, 116]]) { x.beginPath(); x.arc(px, py, 3.6, 0, 7); x.fill(); }
  return xong(c);
}

/* --- lop xe: gai lop --- */
export function texLop() {
  const { c, x } = cv(128);
  x.fillStyle = '#3a3a44'; x.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 16; i++) {
    x.fillStyle = i % 2 ? '#2b2b33' : '#46464f';
    x.fillRect(0, i * 8, 128, 5);
  }
  for (let i = 0; i < 300; i++) {
    x.fillStyle = `rgba(255,255,255,${rr(0.02, 0.09)})`;
    x.fillRect(rr(0, 128), rr(0, 128), 2, 2);
  }
  return xong(c, 2);
}

/* --- bang tang toc: mui chi huong --- */
export function texPad() {
  const { c, x } = cv(128);
  x.fillStyle = '#1f9c62'; x.fillRect(0, 0, 128, 128);
  x.fillStyle = '#8bffc4';
  for (let k = 0; k < 3; k++) {
    const y = 14 + k * 40;
    x.beginPath();
    x.moveTo(20, y); x.lineTo(64, y + 26); x.lineTo(108, y);
    x.lineTo(108, y + 12); x.lineTo(64, y + 38); x.lineTo(20, y + 12);
    x.closePath(); x.fill();
  }
  return xong(c);
}

/* --- vach dich: soc trang do --- */
export function texDich() {
  const { c, x } = cv(128);
  for (let i = 0; i < 8; i++) for (let k = 0; k < 8; k++) {
    x.fillStyle = (i + k) % 2 ? '#ffffff' : '#ff5f8a';
    x.fillRect(i * 16, k * 16, 16, 16);
  }
  return xong(c, 1);
}
