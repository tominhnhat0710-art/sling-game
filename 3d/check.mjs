/* Kiem tra nhanh truoc khi mo trinh duyet. Chay: node check.mjs
   Bat loi cu phap (vi du thieu mot dau phay trong TUNE.js) va thieu khoa,
   khong phai cho trinh duyet timeout 90 giay moi biet. */
import { readdirSync } from 'fs';
import { execFileSync } from 'child_process';

let loi = 0;
for (const f of readdirSync('./src').filter(f => f.endsWith('.js'))) {
  try { execFileSync(process.execPath, ['--check', 'src/' + f], { stdio: 'pipe' }); console.log('  ok   cu phap src/' + f); }
  catch (e) { loi++; console.log('  LOI  src/' + f + '\n' + String(e.stderr).split('\n').slice(0, 3).map(l => '       ' + l).join('\n')); }
}
if (!loi) {
  try {
    const { TUNE } = await import('./src/TUNE.js');
    const { UPGRADES, BUOC } = await import('./src/upgrades.js');
    const can = ['gravity','launchSpeed','aimMin','aimMax','pullMax','pullMin','powerFloor',
      'slingHeight','slingSpan','slingPull','chassis','mass','wheelRadius','bounceBase',
      'autoLevel','levelMaxPitch','levelGain','levelDamp','levelRecover','levelFlareAlt',
      'levelFlareSpd','levelFlareGain','nitroCount','nitroPush','nitroCooldown','speedCap',
      'padGain','padDecay','padNeedFall','groundDrag','groundAlt','stopSpeed','stopFrames',
      'maxSeconds','camAim','camAimLook','camFly','camSide','fxMax','fovBase','volume',
      'tienMoiMet','worldLength','worldBack','trailPoints','guideDots'];
    const thieu = can.filter(k => TUNE[k] === undefined);
    console.log(thieu.length ? '  THIEU KHOA TUNE: ' + thieu.join(', ') : '  ok   TUNE du ' + can.length + ' khoa');
    const bk = ['power','wheelGrip','wheelRoll','wheelBounce','aero','aeroGlide','npow','money'];
    const tb = bk.filter(k => BUOC[k] === undefined);
    console.log(tb.length ? '  THIEU BUOC: ' + tb.join(', ') : '  ok   BUOC du, ' + UPGRADES.length + ' nang cap');
    for (const u of UPGRADES) if (!u.key || !u.ten || !u.max || !u.c0) { loi++; console.log('  LOI  nang cap thieu truong: ' + JSON.stringify(u)); }
    if (thieu.length || tb.length) loi++;
  } catch (e) { loi++; console.log('  LOI  khi nap du lieu: ' + e.message); }
}
console.log(loi ? '\nCO ' + loi + ' LOI, dung mo trinh duyet' : '\nTAT CA OK');
process.exit(loi ? 1 : 0);
