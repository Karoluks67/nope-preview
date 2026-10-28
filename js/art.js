/* art: visa grafika piešiama ranka kaip pikselių žemėlapiai (be paveikslėlių): veikėjas su suspaudimu/ištempimu, velniūkštis su nuotaikomis,
   plytelės su automatiniais kraštais, deglai su pikselinėmis šviesos dėmėmis (raštas, ne permatomi diskai), 4 pasaulių paletės. */
'use strict';
const PAL = {
  hero: ['#FFFFFF', '#EEF0FF', '#C2C6EC', '#FFD45A'],
  dust: ['#8F86A8', '#B4ABCB', '#6F6688'],
};
/* Pasauliai (po 10 lygių): požemis, žalumynai, dykuma, sniegynai, kristalų urvai, pragaras. Spalvos: bg* - fonas, top/hi/mid/lo/mor/deep - plytelės,
   acc/acc2 - samanos, žolė, kaktusai, ledas, kristalai, lava; light - šviesos šaltiniai; amb - aplinkos dalelės */
const WORLD = [
  { name: 'dungeon', bg: '#120E19', bgA: '#1B1526', bgB: '#17121F', bgL: '#221B2F', top: '#A898C8', hi: '#8778A6', mid: '#655782', lo: '#463B5E', mor: '#2C2440', deep: '#221B31', acc: '#5E8F3E', acc2: '#7FB04F', light: '#FF9B3A', light2: '#FFD27A', amb: '#8F86A8', node: '#A898C8' },
  { name: 'forest', bg: '#0E1A14', bgA: '#14261C', bgB: '#11201A', bgL: '#1C3626', top: '#9BD45F', hi: '#9A7148', mid: '#7A5536', lo: '#5A3C25', mor: '#3A2618', deep: '#2C1C12', acc: '#4F9A3A', acc2: '#8FD45A', light: '#D8F56A', light2: '#F6FFB8', amb: '#D8F56A', node: '#9BD45F' },
  { name: 'desert', bg: '#3A1E2E', bgA: '#4A2636', bgB: '#552E3C', bgL: '#7A4048', top: '#FBE3A0', hi: '#EDBE70', mid: '#CE9352', lo: '#A06A3C', mor: '#7A4A2A', deep: '#5A3220', acc: '#5E9A44', acc2: '#8CC45E', light: '#FFB45A', light2: '#FFE7A0', amb: '#F2C98A', node: '#FBE3A0' },
  { name: 'snow', bg: '#122036', bgA: '#182A44', bgB: '#15253E', bgL: '#22375A', top: '#FFFFFF', hi: '#DDEAF6', mid: '#8EA9C4', lo: '#6A86A6', mor: '#4E6888', deep: '#3A5070', acc: '#BFE8FF', acc2: '#FFFFFF', light: '#9FE0FF', light2: '#E6FAFF', amb: '#FFFFFF', node: '#DDEAF6' },
  { name: 'crystal', bg: '#110E22', bgA: '#191430', bgB: '#15112A', bgL: '#261E46', top: '#B89AF0', hi: '#8E74C8', mid: '#6A55A0', lo: '#4C3C7A', mor: '#33285A', deep: '#241C44', acc: '#5AF0E0', acc2: '#FF7AE0', light: '#5AF0E0', light2: '#D8FFFA', amb: '#5AF0E0', node: '#B89AF0' },
  { name: 'hell', bg: '#1A0707', bgA: '#250B0B', bgB: '#200909', bgL: '#3A1210', top: '#FF9A4A', hi: '#8A3A2A', mid: '#6A2A22', lo: '#4A1C18', mor: '#2E100E', deep: '#200A08', acc: '#FF5A1F', acc2: '#FFD84A', light: '#FF7A2A', light2: '#FFE07A', amb: '#FF8A3A', node: '#FF9A4A' },
];
const worldOf = i => WORLD[Math.min(WORLD.length - 1, Math.floor(i / 10))], WN = WORLD.length;
const OUT = '#0B0A10';

/* ---------- Pikselių žemėlapiai ---------- */
function drawMap(rows, x, y, pal, flip) {
  const w = rows[0].length;
  for (let r = 0; r < rows.length; r++) for (let c = 0; c < w; c++) {
    const ch = rows[r][c]; if (ch === '.') continue; const col = pal[ch]; if (!col) continue;
    ctx.fillStyle = col; ctx.fillRect(Math.round(x + (flip ? w - 1 - c : c)), Math.round(y + r), 1, 1);
  }
}
/* Veikėjas - angeliukas „Lumi": baltas, apvalus, su skruostais, aureole ir sparneliais. Normalus 12×11, ištemptas 10×13, suspaustas 14×9
   (atskiri piešiniai - pikseliai lieka tinklelyje). E/e - akis su blizgesiu, p - skruostai, h - šviesa iš viršaus kairės */
const HERO = {
  n: ['...kkkkkk...', '.kkhhwwwwkk.', '.khwwwwwwwsk', 'khwwwwwwwwsk', 'kwwwEewwEesk', 'kwwwEEwwEEsk', 'kwpwEEwwEEpk', 'kwwwwwwwwssk', 'kswwwwwwssdk', '.kssssssddk.', '..kkkkkkkk..'],
  s: ['..kkkkkk..', '.khhwwwwk.', 'khwwwwwwsk', 'khwwwwwwsk', 'kwwEewEesk', 'kwwEEwEEsk', 'kwpEEwEEpk', 'kwwwwwwwsk', 'kwwwwwwssk', 'kswwwwssdk', 'kssssssddk', '.ksssdddk.', '..kkkkkk..'],
  q: ['...kkkkkkkk...', '.kkhhwwwwwwkk.', 'khwwwwwwwwwwsk', 'kwwwwEewwEewsk', 'kwpwwEEwwEEpsk', 'kwwwwwwwwwwssk', 'kswwwwwwwwssdk', '.kssssssssddk.', '..kkkkkkkkkk..'],
};
const HERO_P = { k: '#1B1A33', h: '#FFFFFF', w: '#EEF0FF', s: '#C2C6EC', d: '#8F95C9', E: '#1B1A33', e: '#FFFFFF', p: '#FF9AB8' };
const HERO_G = { k: 'rgba(200,210,255,.2)', h: 'rgba(255,255,255,.32)', w: 'rgba(230,236,255,.26)', s: 'rgba(200,210,255,.2)', d: 'rgba(180,190,255,.16)', E: 'rgba(30,24,60,.35)', e: 'rgba(255,255,255,.4)', p: 'rgba(255,154,184,.3)' };
/* sparneliai (kairysis; dešinysis - veidrodinis): suglausti, aukštyn, žemyn */
const WING = { f: ['.kk.', 'khhk', 'khwk', '.kwk', '..k.'], u: ['kk...', 'khk..', 'khhk.', '.khwk', '..kwk', '...k.'], d: ['...k.', '..kwk', '.khwk', 'khhk.', 'khk..', 'kk...'] };
const WING_P = { k: '#1B1A33', h: '#FFFFFF', w: '#D6DAF4' };
function drawHalo(cx, y, t, ghost) {   // aukso žiedas plūduriuoja; blizgesys bėga ratu
  const b = Math.round(Math.sin(t * 4)), x = Math.round(cx - 4), yy = Math.round(y + b), g = ghost ? 'rgba(255,212,90,.35)' : '#FFD45A', hi = ghost ? 'rgba(255,241,168,.4)' : '#FFF1A8';
  if (!ghost) { ctx.fillStyle = '#9A6E14'; ctx.fillRect(x + 1, yy + 2, 6, 1); }
  ctx.fillStyle = g; ctx.fillRect(x + 1, yy - 1, 6, 1); ctx.fillRect(x, yy, 1, 1); ctx.fillRect(x + 7, yy, 1, 1); ctx.fillRect(x + 1, yy + 1, 6, 1);
  const k = Math.floor(t * 6) % 12; if (k < 6) { ctx.fillStyle = hi; ctx.fillRect(x + 1 + k, yy - 1, 1, 1); }
}
function drawHero(x, y, o) {   // x, y - dėžės kairys viršus (10×13); o: { face, sq (-1 ištemptas … 1 suspaustas), run, ground, blink, ghost, grav, t, vy }
  const m = o.sq > .35 ? HERO.q : o.sq < -.35 ? HERO.s : HERO.n, w = m[0].length, h = m.length, flip = o.face < 0, t = o.t ?? gt;
  const feet = o.ground ? 2 : 1, bob = o.ground && o.run ? (Math.floor(o.run) % 2) : 0, up = (o.grav || 1) > 0;
  let rows = m; if (o.blink) { const er = m.map((r, k) => /[Ee]/.test(r) ? k : -1).filter(k => k >= 0), last = er[er.length - 1]; rows = m.map((r, k) => k === last ? r.replace(/[Ee]/g, 'k') : r.replace(/[Ee]/g, 'w')); }   // mirksi: akis - linija apačioje
  const pal = o.ghost ? HERO_G : HERO_P, bx = Math.round(x + PW / 2 - w / 2), by = up ? Math.round(y + PH - feet - h) + bob : Math.round(y + feet);
  /* sparneliai už kūno: ant žemės suglausti, ore plasnoja (kylant - aukštyn) */
  const wf = o.ground ? 'f' : (o.vy || 0) * (o.grav || 1) < -40 ? 'u' : Math.floor(t * 12) % 2 ? 'u' : 'd', wm = up ? WING[wf] : WING[wf].slice().reverse(), wy = by + (up ? 3 : h - 3 - wm.length);
  const wp = o.ghost ? { k: pal.k, h: pal.h, w: pal.w } : WING_P;
  drawMap(wm, bx - wm[0].length + 1, wy, wp); drawMap(wm, bx + w - 1, wy, wp, true);
  drawMap(up ? rows : rows.slice().reverse(), bx, by, pal, flip);
  ctx.fillStyle = pal.k; const f = Math.floor(o.run || 0) % 4;   // kojytės
  if (up) { const fy = Math.round(y + PH - feet);
    if (o.ground) { const a = f === 1 ? -1 : f === 3 ? 1 : 0; ctx.fillRect(bx + 3 + a, fy, 2, feet); ctx.fillRect(bx + w - 5 - a, fy, 2, feet); }
    else { ctx.fillRect(bx + 3, fy, 2, 1); ctx.fillRect(bx + w - 5, fy, 2, 1); } }
  else { ctx.fillRect(bx + 3, Math.round(y), 2, feet); ctx.fillRect(bx + w - 5, Math.round(y), 2, feet); }
  if (!o.noHalo) drawHalo(bx + w / 2, up ? by - 4 : by + h + 3, t, o.ghost);   // aureolė virš galvos
}

/* Velniūkštis „Nopis" - angeliuko „brolis" tuo pačiu stiliumi: apvalus raudonas kūnelis 14×13, maži rageliai, pusiau primerktos gudrios akys,
   skruostai, sparneliai ir uodegytė su strėlyte. Išdykęs, ne baisus. Nuotaikos keičia akis ir burną: idle, smirk, laugh, angry */
const DEV = {
  base: ['.kk........kk.', '.kHk......kHk.', '..khkkkkkkhk..', '.krllrrrrrrrk.', 'krlrrrrrrrrrrk', 'krrrkkrrkkrrdk', 'krrrEerrEerrdk', 'krrrEErrEErrdk', 'krprrrrrrrrpdk', 'krrrkrrrrkrrdk', 'kdrrrkkkkrrddk', '.kddrrrrrrddk.', '..kkkkkkkkkk..'],
  face: {
    idle: ['krrrkkrrkkrrdk', 'krrrEerrEerrdk', 'krrrEErrEErrdk', 'krprrrrrrrrpdk', 'krrrkrrrrkrrdk', 'kdrrrkkkkrrddk'],
    smirk: ['krrkkrrrrkkrdk', 'krrrEerrEerrdk', 'krrrEErrEErrdk', 'krprrrrrrrrpdk', 'krrrrrrrrkrrdk', 'kdrrrrkkkrrddk'],
    laugh: ['krrrrrrrrrrrdk', 'krrkrkrrkrkrdk', 'krrrrrrrrrrrdk', 'krpkkkkkkkkpdk', 'krrrkMMMMkrrdk', 'kdrrrkkkkrrddk'],
    angry: ['krrkkrrrrkkrdk', 'krrrkEkkEkrrdk', 'krrrEErrEErrdk', 'krprrrrrrrrpdk', 'krrrrkkkkrrrdk', 'kdrrkrrrrkrddk'],
  },
};
const DEV_P = { k: '#2A0E14', H: '#FFF4D6', h: '#E0C79A', r: '#F0524A', l: '#FF8A7A', d: '#C23A35', E: '#2A0E14', e: '#FFFFFF', p: '#B8283A', M: '#FF9AB8' };
/* sparneliai (kairysis; dešinysis - veidrodinis): šikšnosparnio, maži kaip angeliuko - aukštyn, vidurys, žemyn */
const DWING = [['k....', 'kk...', 'kmk.k', 'kmmkk', '.kmmk', '..kk.'], ['.....', 'kk...', 'kmkk.', 'kmmmk', '.kmmk', '..kk.'], ['.....', '.....', '..kk.', '.kmmk', 'kmmmk', 'kk.kk']];
const DWING_P = { k: '#2A0E14', m: '#9A2430' };
function drawDevil(x, y, mood, t, o) {   // x, y - kairys viršus (14×13 kūnas); o: { fly, face (-1/1) }
  o = o || {}; x = Math.round(x); y = Math.round(y);
  const rows = DEV.base.slice(), f = DEV.face[mood] || DEV.face.idle;
  for (let k = 0; k < 6; k++) rows[5 + k] = f[k];
  let dx = 0, dy = 0;
  if (mood === 'laugh') { dy = Math.floor(t * 14) % 2 ? -1 : 0; }
  else if (mood === 'angry') dx = Math.floor(t * 24) % 2 ? 1 : 0;
  else dy = Math.round(Math.sin(t * 3));
  /* sparneliai: skrendant plasnoja */
  const wf = o.fly ? [0, 1, 2, 1][Math.floor(t * 12) % 4] : 1, wm = DWING[wf];
  drawMap(wm, x - 4 + dx, y + 4 + dy, DWING_P); drawMap(wm, x + 13 + dx, y + 4 + dy, DWING_P, true);
  /* uodegytė su strėlyte - siūbuoja */
  const sw = Math.round(Math.sin(t * 4) * 1.5), tx = x + 10 + dx, ty = y + 12 + dy;
  ctx.fillStyle = DEV_P.k; ctx.fillRect(tx, ty, 2, 1); ctx.fillRect(tx + 2, ty - 1 + (sw > 0 ? 1 : 0), 1, 1); ctx.fillRect(tx + 3, ty - 2 + sw, 1, 1);
  ctx.fillStyle = DEV_P.r; ctx.fillRect(tx + 3, ty - 4 + sw, 3, 2); ctx.fillRect(tx + 4, ty - 5 + sw, 1, 1); ctx.fillStyle = DEV_P.k; ctx.fillRect(tx + 6, ty - 3 + sw, 1, 1);
  drawMap(rows, x + dx, y + dy, DEV_P, (o.face || 1) < 0 && mood !== 'laugh');
  if (mood === 'angry' && Math.floor(t * 6) % 2) { ctx.fillStyle = '#C8C4D0'; ctx.fillRect(x + 1, y - 2, 2, 1); ctx.fillRect(x + 11, y - 3, 2, 1); ctx.fillRect(x + 2, y - 5, 1, 1); ctx.fillRect(x + 12, y - 6, 1, 1); }   // garai iš pykčio
}
/* Velniūkštis lygyje: skraido viršuje, smigsta prie spąstų, nuskrenda prie kapo pasijuokti, pralaimėjęs - pyksta ir nuskrenda */
const devil = { x: 400, y: 30, vx: 0, vy: 0, tx: 400, ty: 30, mood: 'idle', moodT: 0, say: '', sayT: 0, smirk: 0, t: 0, face: -1, mode: 'roam', modeT: 0, ha: [] };
function devilReset() { Object.assign(devil, { x: GW - 40, y: 26, vx: 0, vy: 0, mood: 'idle', moodT: 0, say: '', sayT: 0, mode: 'roam', modeT: 0, ha: [] }); }
function devilSay(k) { const s = TR(k); if (!s) return; devil.say = s; devil.sayT = 1.6; }
function devilLaugh(why) {
  devil.mood = 'laugh'; devil.moodT = 1.5; devil.say = TR('laugh'); devil.sayT = 1.5; devil.mode = 'gloat'; devil.modeT = 1.5;
  const g = L && L.graves[L.graves.length - 1]; if (g) { devil.tx = clamp(g[0] - 8 + (g[0] > GW / 2 ? -26 : 26), 20, GW - 36); devil.ty = clamp(g[1] - 52, 28, GH - 60); }
  setTimeout(() => sfx('laugh'), 120);
}
function devilAngry() { devil.mood = 'angry'; devil.moodT = 2; devil.say = TR('angry'); devil.sayT = 1.8; devil.mode = 'flee'; devil.modeT = 2; sfx('grr'); }
function devilPoint(x, y) { if (devil.mode === 'gloat') return; devil.smirk = 1; devil.mode = 'swoop'; devil.modeT = .9; devil.tx = clamp(x - 8, 20, GW - 36); devil.ty = clamp(y - 60, 28, GH - 70); }
function stepDevil(dt) {
  const d = devil; d.t += dt; d.moodT -= dt; d.sayT -= dt; d.smirk -= dt; d.modeT -= dt;
  if (d.moodT <= 0) d.mood = d.smirk > 0 ? 'smirk' : 'idle';
  if (d.modeT <= 0 && d.mode !== 'flee') d.mode = 'roam';
  if (d.mode === 'roam') {   // lėtai sklando viršuje, laikosi atokiau nuo angeliuko
    const px = typeof pl !== 'undefined' && pl ? pl.x : 240; d.tx = clamp(GW / 2 + Math.sin(d.t * .37) * 170 + (Math.abs(px - d.x) < 60 ? (d.x > px ? 60 : -60) : 0), 24, GW - 40); d.ty = 34 + Math.sin(d.t * .9) * 10;
  } else if (d.mode === 'flee') { d.tx = GW + 60; d.ty = -40; }
  const k = d.mode === 'flee' ? 2.2 : d.mode === 'roam' ? 1.6 : 5;   // spyruoklinis judėjimas - sklandūs posūkiai
  d.vx += ((d.tx - d.x) * k * k - d.vx * 2 * k * .8) * dt; d.vy += ((d.ty - d.y) * k * k - d.vy * 2 * k * .8) * dt;
  d.x += d.vx * dt; d.y += d.vy * dt; if (Math.abs(d.vx) > 8) d.face = Math.sign(d.vx);
  if (d.mood === 'laugh' && Math.random() < dt * 5) d.ha.push({ x: d.x + rnd(0, 16), y: d.y - 2, t: .7 });   // „HA" raidės kyla
  for (const h of d.ha) { h.t -= dt; h.y -= 26 * dt; } d.ha = d.ha.filter(h => h.t > 0);
}
function drawDevilActor() {
  const d = devil; if (d.x > GW + 30 || d.y < -40) return;
  drawDevil(d.x, d.y, d.mood, d.t, { fly: true, face: d.face });
  for (const h of d.ha) { ctx.globalAlpha = Math.min(1, h.t * 3); text('HA', h.x, h.y, 1, '#FF6A55', .5); ctx.globalAlpha = 1; }
  drawDevilActorBubble();
}
function drawDevilActorBubble() {
  const d = devil;
  if (d.sayT > 0) {   // kalbos burbulas virš jo (neišlenda už ekrano)
    const s = d.say, w = textW(s, 1) + 10, bx = Math.round(clamp(d.x + 8 - w / 2, 4, GW - w - 4)), by = Math.round(clamp(d.y - 20, 2, GH - 20)), pop = d.sayT > 1.4 ? 1 : 0;
    ctx.fillStyle = OUT; ctx.fillRect(bx - 1 - pop, by - 1 - pop, w + 2 + pop * 2, 15 + pop * 2); ctx.fillStyle = '#F4F1FF'; ctx.fillRect(bx - pop, by - pop, w + pop * 2, 13 + pop * 2);
    const tx = Math.round(clamp(d.x + 8, bx + 3, bx + w - 4)); ctx.fillStyle = '#F4F1FF'; ctx.fillRect(tx - 1, by + 13, 3, 1); ctx.fillRect(tx, by + 14, 1, 1); ctx.fillStyle = OUT; ctx.fillRect(tx - 2, by + 13, 1, 1); ctx.fillRect(tx + 2, by + 13, 1, 1); ctx.fillRect(tx - 1, by + 14, 1, 1); ctx.fillRect(tx + 1, by + 14, 1, 1); ctx.fillRect(tx, by + 15, 1, 1);
    text(s, bx + 5, by + 3, 1, d.mood === 'laugh' ? '#D9362F' : '#1A1420', 0, null);
  }
}

/* ---------- Plytelės: plytos su skiediniu, šviesus viršus, tamsūs kraštai, samanos/žolė; kešuojama į drobę ---------- */
function tileArt(g, c, r, x, y, W, e, seed, ice) {   // e: { up, dn, lf, rt } - ar kaimynas tuščias; ice - ledo plytelė
  const h = (a, b) => hash(c * 7 + a, r * 13 + b, seed || 0), P = (a, b, w, hh, col) => { g.fillStyle = col; g.fillRect(x + a, y + b, w, hh); };
  if (ice) {   // ledas: šviesiai mėlynas, įstrižas blizgesys
    P(0, 0, 16, 16, '#9ED8F5'); P(0, 12, 16, 4, '#7CBFE6');
    for (let k = 0; k < 16; k++) if ((k + c * 5) % 9 < 2) { P(k, 2 + (k % 3), 1, 1, '#E6F8FF'); P(Math.min(15, k + 1), 3 + (k % 3), 1, 1, '#E6F8FF'); }
    if (e.up) { P(0, 0, 16, 2, '#FFFFFF'); P(0, 2, 16, 1, '#CDEFFF'); } if (e.dn) P(0, 15, 16, 1, '#4E8FB8'); if (e.lf) P(0, 0, 1, 16, '#4E8FB8'); if (e.rt) P(15, 0, 1, 16, '#4E8FB8');
    return;
  }
  P(0, 0, 16, 16, W.mid);
  if (W.name === 'dungeon') {   // plytos 16×8, kas antra eilė pasislinkusi per pusę
    for (let k = 0; k < 2; k++) { const by = k * 8, jn = ((r * 2 + k) % 2) ? 7 : 15;
      P(0, by + 7, 16, 1, W.mor); P(jn, by, 1, 7, W.mor);
      for (let i = 0; i < 16; i++) if (i !== jn && i !== (jn + 1) % 16) P(i, by, 1, 1, W.hi);
      P((jn + 15) % 16, by + 1, 1, 6, W.lo);
      for (let i = 0; i < 16; i++) if (h(i, k) < .1) P(i, by + 2 + Math.floor(h(i, k + 5) * 4), 1, 1, W.lo); }
    if (h(4, 4) < .18) { const cx = 3 + Math.floor(h(5, 5) * 9); P(cx, 3, 1, 3, W.lo); P(cx + 1, 5, 1, 2, W.lo); }
  } else if (W.name === 'forest') {   // žemė: tamsūs grumstai, akmenukai, šaknys
    for (let i = 0; i < 22; i++) P(Math.floor(h(i, 1) * 15), Math.floor(h(i, 2) * 15), 2, 1, h(i, 3) < .5 ? W.lo : W.hi);
    if (h(6, 6) < .3) { const sx = 2 + Math.floor(h(7, 7) * 10), sy = 5 + Math.floor(h(8, 8) * 7); P(sx, sy, 3, 2, '#8A8478'); P(sx, sy, 3, 1, '#B5AE9E'); }
    if (h(9, 9) < .25) { const rx = 1 + Math.floor(h(9, 1) * 13); P(rx, 0, 1, 6, '#4A2E1A'); P(rx + 1, 5, 1, 3, '#4A2E1A'); }
  } else if (W.name === 'desert') {   // smiltainis: horizontalūs sluoksniai
    for (let k = 0; k < 4; k++) { const by = k * 4; P(0, by, 16, 1, (k + r) % 2 ? W.hi : W.mid); for (let i = 0; i < 16; i++) if (h(i, k) < .14) P(i, by + 1 + Math.floor(h(i, k + 9) * 3), 1, 1, W.lo); P(0, by + 3, 16, 1, W.lo); }
    if (h(3, 3) < .08) { P(6, 6, 4, 3, '#E9D9B0'); P(7, 7, 2, 1, W.lo); }   // kriauklė
  } else if (W.name === 'snow') {   // ledinė uola: be siūlių, šalti atspalviai ir įtrūkimai (be „kafliukų" tinklelio)
    for (let i = 0; i < 9; i++) { const bx = Math.floor(h(i, 1) * 13), by = Math.floor(h(i, 2) * 13); P(bx, by, 3, 2, h(i, 3) < .5 ? W.lo : W.hi); }
    for (let i = 0; i < 8; i++) P(Math.floor(h(i, 5) * 15), Math.floor(h(i, 6) * 15), 1, 1, '#B8CCE0');
    if (h(4, 4) < .4) { const cx = 3 + Math.floor(h(5, 5) * 9); P(cx, 4, 1, 4, W.mor); P(cx + 1, 7, 1, 3, W.mor); P(cx - 1, 9, 1, 2, W.mor); }
  } else if (W.name === 'crystal') {   // violetinė uola su įaugusiais kristalais
    for (let i = 0; i < 12; i++) P(Math.floor(h(i, 1) * 15), Math.floor(h(i, 2) * 15), 1, 1, h(i, 3) < .5 ? W.lo : W.hi);
    if (h(6, 6) < .45) { const kx = 2 + Math.floor(h(7, 7) * 10), ky = 4 + Math.floor(h(8, 8) * 8), cc = h(9, 9) < .5 ? W.acc : W.acc2; P(kx, ky, 1, 3, cc); P(kx + 1, ky - 1, 1, 5, cc); P(kx + 2, ky, 1, 3, cc); P(kx + 1, ky - 1, 1, 2, '#FFFFFF'); }
  } else {   // pragaras: bazaltas su švytinčiais plyšiais
    for (let i = 0; i < 14; i++) P(Math.floor(h(i, 1) * 15), Math.floor(h(i, 2) * 15), 2, 1, h(i, 3) < .5 ? W.lo : W.hi);
    if (h(4, 4) < .45) { let cx = 2 + Math.floor(h(5, 5) * 11), cy = 3; for (let k = 0; k < 6; k++) { P(cx, cy, 1, 2, k % 2 ? W.acc : '#FFB02E'); cx += h(k, 6) < .5 ? 1 : -1; cy += 2; if (cy > 13) break; } }
  }
  /* kraštai: tamsus kontūras, kur kaimynas tuščias */
  if (e.dn) { P(0, 15, 16, 1, W.deep); P(1, 14, 14, 1, W.lo); } if (e.lf) P(0, 0, 1, 16, W.deep); if (e.rt) P(15, 0, 1, 16, W.deep);
  if (e.up) {   // viršus pagal pasaulį: samanos / žolė / smėlis / sniegas / kristalai / įkaitęs kraštas
    P(0, 0, 16, 2, W.top); P(0, 2, 16, 1, W.hi);
    if (W.name === 'dungeon') { for (let i = 0; i < 16; i++) if (h(i, 9) < .28) { P(i, 0, 1, 1, W.acc); if (h(i, 10) < .4) P(i, 1, 1, 1 + Math.floor(h(i, 11) * 3), W.acc); } for (let i = 0; i < 16; i++) if (h(i, 12) < .1) P(i, 0, 1, 1, W.acc2); }
    if (W.name === 'forest') { P(0, 0, 16, 4, W.acc); for (let i = 0; i < 16; i++) { if (h(i, 9) < .5) P(i, -1, 1, 1, W.acc2); if (h(i, 10) < .5) P(i, 0, 1, 1, W.acc2); if (h(i, 11) < .35) P(i, 4, 1, 1 + Math.floor(h(i, 13) * 2), W.acc); }
      if (h(14, 14) < .12) { const fx = 2 + Math.floor(h(15, 15) * 11); P(fx, -3, 1, 3, '#2E6A24'); P(fx - 1, -4, 3, 1, h(16, 16) < .5 ? '#FFD45A' : '#FF8AC0'); } }   // gėlytė
    if (W.name === 'desert') { P(0, 0, 16, 3, W.top); for (let i = 0; i < 16; i++) if ((i + c * 3) % 6 < 2) P(i, 3, 1, 1, W.hi); }
    if (W.name === 'snow') { P(0, -1, 16, 4, '#FFFFFF'); P(0, 3, 16, 1, '#D6E6F4'); for (let i = 0; i < 16; i++) if (h(i, 9) < .35) P(i, -2, 1, 1, '#FFFFFF'); for (let i = 0; i < 16; i++) if (h(i, 10) < .25) P(i, 4, 1, 1 + Math.floor(h(i, 11) * 2), '#E6F0FA'); }
    if (W.name === 'crystal') { P(0, 0, 16, 1, W.acc); for (let i = 0; i < 16; i++) if (h(i, 9) < .18) { P(i, -2, 1, 2, h(i, 10) < .5 ? W.acc : W.acc2); } }
    if (W.name === 'hell') { P(0, 0, 16, 1, '#FFD84A'); P(0, 1, 16, 1, W.acc); P(0, 2, 16, 1, '#B83A1A'); }
    if (e.lf) P(0, 0, 1, 3, W.deep); if (e.rt) P(15, 0, 1, 3, W.deep);
  }
}
/* Fonai pagal pasaulį (piešiami vieną kartą į lygio drobę) */
function worldBg(g, W, seed) {
  const R = (x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x, y, w, h); };
  R(0, 0, GW, GH, W.bg);
  if (W.name === 'dungeon') {
    for (let y = 0; y < GH; y += 8) { const off = (y / 8) % 2 ? 12 : 0; for (let x = -off; x < GW; x += 24) { R(x + 1, y + 1, 22, 6, hash(x, y, 3) < .5 ? W.bgA : W.bgB); if (hash(x, y, 4) < .3) R(x + 1, y + 1, 22, 1, W.bgL); } }
    for (let i = 0; i < 5; i++) { const x = Math.floor(hash(i, 2, seed) * GW); R(x, 0, 2, 20 + Math.floor(hash(i, 3, seed) * 40), '#2A2238'); R(x - 1, 0, 4, 2, '#2A2238'); }   // grandinės / šaknys
  } else if (W.name === 'forest') {
    for (let y = 0; y < GH; y += 2) R(0, y, GW, 2, y < 90 ? '#10201A' : y < 180 ? W.bg : '#0B140F');
    for (let i = 0; i < 16; i++) { const x = Math.floor(hash(i, 1, 7) * GW), w = 8 + Math.floor(hash(i, 2, 7) * 16); R(x, 0, w, GH, i % 2 ? W.bgA : W.bgB); R(x, 0, 2, GH, W.bgL); for (let k = 0; k < 4; k++) R(x + 2 + (k % 2) * 4, 30 + k * 50 + Math.floor(hash(i, k, 8) * 20), 3, 2, W.bgL); }
    for (let i = 0; i < 40; i++) { const x = Math.floor(hash(i, 4, 7) * GW), y = Math.floor(hash(i, 5, 7) * 40); R(x - 10, y, 22, 10, '#173322'); R(x - 6, y + 10, 14, 4, '#173322'); }   // lapija viršuje
    for (let i = 0; i < 10; i++) { const x = Math.floor(hash(i, 6, 7) * GW); for (let y = 0; y < 30 + hash(i, 7, 7) * 60; y += 3) R(x + (y % 6 ? 0 : 1), y, 1, 3, '#2E5A2A'); }   // vijokliai
  } else if (W.name === 'desert') {
    const sky = ['#2E1A36', '#3A1E3A', '#4E2440', '#6A2E44', '#8A3C44', '#B05A44', '#D4804A'];
    for (let y = 0; y < GH; y += 2) { const k = Math.min(sky.length - 1, Math.floor(y / GH * sky.length * 1.1)); R(0, y, GW, 2, sky[k]); if (k > 0 && y % 8 === 0) for (let x = (y % 16); x < GW; x += 4) R(x, y, 1, 1, sky[k - 1]); }
    for (let yy = -22; yy <= 22; yy++) { const w = Math.round(Math.sqrt(484 - yy * yy)); R(360 - w, 120 + yy, w * 2, 1, yy < -12 ? '#FFE0A0' : yy < 4 ? '#FFC070' : '#FF9A5A'); }   // saulė
    for (let k = 0; k < 3; k++) for (let x = 0; x < GW; x++) { const y = 170 + k * 26 + Math.round(Math.sin(x / (40 + k * 17) + k * 2) * (10 - k * 2)); R(x, y, 1, GH - y, ['#7A3E3E', '#8E4E3E', '#A8623E'][k]); }
    for (const [px, sz] of [[80, 26], [118, 16]]) for (let k = 0; k < sz; k++) R(px - k, 168 - sz + k, k * 2 + 1, 1, k % 3 ? '#6A3236' : '#5A2A30');   // piramidės
  } else if (W.name === 'snow') {
    for (let y = 0; y < GH; y += 2) R(0, y, GW, 2, y < 100 ? '#0E1A30' : y < 170 ? W.bg : '#1A2C48');
    for (let i = 0; i < 80; i++) R(Math.floor(hash(i, 1, 4) * GW), Math.floor(hash(i, 2, 4) * 120), 1, 1, hash(i, 3, 4) < .3 ? '#FFFFFF' : '#8FA8D8');
    for (let m = 0; m < 6; m++) { const cx = 20 + m * 90 + Math.floor(hash(m, 1, 5) * 40), h2 = 60 + Math.floor(hash(m, 2, 5) * 50); for (let k = 0; k < h2; k++) { const y = 200 - h2 + k; R(cx - k, y, k * 2 + 1, 1, k < h2 * .25 ? '#E6F0FA' : W.bgL); } }
    for (let i = 0; i < 26; i++) { const x = Math.floor(hash(i, 3, 5) * GW), y = 196 + Math.floor(hash(i, 4, 5) * 20); for (let k = 0; k < 12; k++) R(x - (k >> 1), y + k, (k >> 1) * 2 + 1, 1, '#182A44'); }
  } else if (W.name === 'crystal') {
    for (let y = 0; y < GH; y += 2) R(0, y, GW, 2, y < 140 ? W.bg : '#160F2A');
    for (let i = 0; i < 9; i++) { const x = Math.floor(hash(i, 1, 6) * GW), w = 10 + Math.floor(hash(i, 2, 6) * 14), h2 = 60 + Math.floor(hash(i, 3, 6) * 120), up = i % 2;
      for (let k = 0; k < h2; k++) { const ww = k < w ? k : w; const y = up ? k : GH - k; R(x - ww / 2, y, ww, 1, k < w ? '#2C2050' : '#221840'); } R(x, up ? 0 : GH - h2, 1, h2, '#3A2C68'); }
    for (let i = 0; i < 60; i++) R(Math.floor(hash(i, 4, 6) * GW), Math.floor(hash(i, 5, 6) * GH), 1, 1, hash(i, 6, 6) < .5 ? '#3E8C8A' : '#8A3E7E');
  } else {   // pragaras
    for (let y = 0; y < GH; y += 2) R(0, y, GW, 2, y < 80 ? '#140505' : y < 180 ? W.bg : y < 230 ? '#2A0A08' : '#3A0E08');
    for (let i = 0; i < 12; i++) { const x = Math.floor(hash(i, 1, 3) * GW), h2 = 50 + Math.floor(hash(i, 2, 3) * 100); for (let k = 0; k < h2; k++) { const w = Math.max(1, Math.round((k / h2) * 14)); R(x - w / 2, GH - h2 + k, w, 1, '#250A0A'); } }
    for (let y = 230; y < GH; y += 2) for (let x = (y / 2) % 2 * 2; x < GW; x += 4) if (hash(x, y, 7) < (y - 230) / 50) R(x, y, 2, 2, '#7A1E0E');   // lavos švytėjimas apačioje
  }
}
/* Lygio fonas + statinės plytelės į drobę (perpiešiama tik pasikeitus tinkleliui) */
function bakeLevel() {
  const W = worldOf(LV), c = L.cache || (L.cache = document.createElement('canvas')); c.width = GW; c.height = GH; const g = c.getContext('2d');
  worldBg(g, W, LV);
  /* šviesos šaltiniai fone: tik tuščiose vietose virš grindų */
  L.lights = [];
  for (let c0 = 3; c0 < COLS - 2; c0 += 7) for (let r0 = 2; r0 < ROWS - 2; r0++) {
    const ok = !L.grid[r0][c0] && !L.grid[r0 + 1][c0] && !L.kind[r0][c0] && !L.sand.has(c0 + r0 * COLS) && L.grid.slice(r0 + 2, Math.min(ROWS, r0 + 6)).some(row => row[c0]);
    if (ok && hash(c0, r0, 5) < .55) { L.lights.push([c0 * TS + 8, r0 * TS + 6]); break; } }
  for (const [x, y] of L.lights) lightPool(g, x, y, W, 1);
  /* plūstantis smėlis */
  for (const k of L.sand) { const cc = k % COLS, rr = Math.floor(k / COLS), top = !L.sand.has(k - COLS);
    g.fillStyle = '#7A4A26'; g.fillRect(cc * TS, rr * TS, 16, 16); g.fillStyle = '#5E3818'; for (let i = 0; i < 7; i++) g.fillRect(cc * TS + Math.floor(hash(i, k, 2) * 13), rr * TS + 3 + Math.floor(hash(i, k, 3) * 12), 4, 1);
    g.fillStyle = '#9A6436'; for (let i = 0; i < 4; i++) g.fillRect(cc * TS + Math.floor(hash(i, k, 4) * 13), rr * TS + 4 + Math.floor(hash(i, k, 5) * 10), 2, 1);
    if (top) { g.fillStyle = '#B07A42'; g.fillRect(cc * TS, rr * TS, 16, 2); g.fillStyle = '#5E3818'; g.fillRect(cc * TS, rr * TS + 2, 16, 1); } }   // plūstantis smėlis - tamsesnis už kopas
  /* plytelės */
  const fake = new Set(); for (const t of L.traps) if (t.k === 'ghost') for (const [c, r] of t.tiles) fake.add(c + r * COLS);   // netikros grindys atrodo tikros
  const solid = (c, r) => c < 0 || c >= COLS || r >= ROWS ? true : r < 0 ? false : L.grid[r][c] === 1 || fake.has(c + r * COLS);
  for (let r = 0; r < ROWS; r++) for (let c = 0; c < COLS; c++) if (solid(c, r)) {
    tileArt(g, c, r, c * TS, r * TS, W, { up: !solid(c, r - 1), dn: !solid(c, r + 1), lf: !solid(c - 1, r), rt: !solid(c + 1, r) }, 0, L.ice.has(c + r * COLS));
    if (!solid(c, r + 1) && r + 1 < ROWS) { g.fillStyle = 'rgba(0,0,0,.28)'; g.fillRect(c * TS, (r + 1) * TS, 16, 2);
      if (W.name === 'snow' && hash(c, r, 21) < .7) { g.fillStyle = '#DDF4FF'; const n = 1 + Math.floor(hash(c, r, 22) * 3); for (let k = 0; k < n; k++) { const ix = c * TS + 2 + Math.floor(hash(c, k, 23) * 12), il = 2 + Math.floor(hash(k, r, 24) * 4); for (let q = 0; q < il; q++) g.fillRect(ix, (r + 1) * TS + q, q < il - 1 ? 2 : 1, 1); } } }   // varvekliai po iškyšomis
  }
  L.baked = gridSig();
}
const gridSig = () => L.grid.map(r => r.join('')).join('');
/* Pikselinė šviesos dėmė: koncentriniai žiedai su šachmatų raštu (ne permatomas diskas) */
function lightPool(g, x, y, W, k) {
  for (let ring = 2; ring >= 1; ring--) { const R = ring * 13 * k;
    for (let yy = -R; yy <= R; yy += 2) for (let xx = -R; xx <= R; xx += 2) { const d = Math.hypot(xx, yy); if (d > R || (ring === 2 && d < R - 13 * k)) continue;
      if (ring === 2 && (xx + yy) % 4) continue; g.fillStyle = ring === 1 ? W.light : W.bgL; g.globalAlpha = ring === 1 ? (d < 7 ? .14 : .08) : .55; g.fillRect(x + xx, y + yy, 2, 2); } }
  g.globalAlpha = 1;
}
function drawTorch(x, y, t, W) {
  const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); }, f = Math.floor(t * 9 + x) % 3;
  if (W.name === 'forest') {   // šviečiantis grybas
    R(-1, 2, 3, 6, '#E8E0C8'); R(-1, 7, 3, 1, OUT); R(-4, -1, 9, 3, OUT); R(-3, -2, 7, 3, '#7AE05A'); R(-2, -2, 2, 1, W.light2); if (f === 0) R(2, -1, 1, 1, W.light2); return; }
  if (W.name === 'snow') {   // ledinis žibintas
    R(-2, -3, 5, 8, OUT); R(-1, -2, 3, 6, f ? W.light : W.light2); R(-2, -5, 5, 2, '#5A6E88'); R(0, 5, 1, 4, '#5A6E88'); return; }
  if (W.name === 'crystal') {   // švytintis kristalas
    R(-1, -2, 3, 9, OUT); R(0, -3, 1, 11, OUT); R(0, -2, 1, 9, f ? W.light : W.light2); R(-1, 0, 1, 5, W.light); R(1, 1, 1, 4, '#3AB8B0'); return; }
  /* deglas / žarijų dubuo */
  R(-2, 2, 5, 2, OUT); R(-1, 3, 3, 6, W.name === 'hell' || W.name === 'desert' ? '#3A2A2A' : '#6A4A2C'); R(-1, 9, 3, 1, OUT);
  const fl = [[0, 0, 1, 2], [-1, 1, 3, 2], [0, -1, 1, 3]][f];
  R(-1, -1, 3, 3, W.light); R(fl[0], -1 - fl[3], fl[2], fl[3], W.light);
  R(0, 0, 1, 2, W.light2); R(0, -1 - (f === 2 ? 1 : 0), 1, 1, W.light2);
  if (Math.floor(t * 3 + x) % 7 === 0) R(f - 1, -5 - f, 1, 1, W.light);   // kibirkštis
}

/* ---------- Aplinkos dalelės: dulkės, jonvabaliai, smėlis, snaigės, kibirkštėlės, žarijos ---------- */
const AMB = [];
function ambStep(W, dt) {
  const want = W.name === 'snow' ? 70 : W.name === 'forest' ? 26 : W.name === 'hell' ? 40 : W.name === 'desert' ? 30 : 24;
  while (AMB.length < want) AMB.push({ x: rnd(0, GW), y: rnd(0, GH), p: rnd(0, TAU), s: rnd(.5, 1.5) });
  AMB.length = Math.min(AMB.length, want);
  for (const a of AMB) { a.p += dt * a.s;
    if (W.name === 'snow') { a.y += 18 * a.s * dt; a.x += Math.sin(a.p) * 10 * dt; }
    else if (W.name === 'hell') { a.y -= 22 * a.s * dt; a.x += Math.sin(a.p * 2) * 8 * dt; }
    else if (W.name === 'desert') { a.x += 60 * a.s * dt; a.y += Math.sin(a.p) * 4 * dt; }
    else if (W.name === 'forest') { a.x += Math.sin(a.p) * 12 * dt; a.y += Math.cos(a.p * .7) * 8 * dt; }
    else { a.x += Math.sin(a.p * .5) * 4 * dt; a.y += 3 * dt; }
    if (a.y > GH + 4) a.y = -4; if (a.y < -4) a.y = GH + 4; if (a.x > GW + 4) a.x = -4; if (a.x < -4) a.x = GW + 4; }
}
function ambDraw(W) {
  for (const a of AMB) { const x = Math.round(a.x), y = Math.round(a.y);
    if (W.name === 'snow') { ctx.fillStyle = a.s > 1.1 ? '#FFFFFF' : '#B8D0EC'; ctx.fillRect(x, y, a.s > 1.2 ? 2 : 1, a.s > 1.2 ? 2 : 1); }
    else if (W.name === 'hell') { ctx.fillStyle = Math.sin(a.p * 3) > 0 ? '#FFB02E' : '#FF5A1F'; ctx.fillRect(x, y, 1, 1); }
    else if (W.name === 'desert') { ctx.fillStyle = 'rgba(242,201,138,.55)'; ctx.fillRect(x, y, 3, 1); }
    else if (W.name === 'forest') { if (Math.sin(a.p * 2) > .2) { ctx.fillStyle = W.light; ctx.fillRect(x, y, 1, 1); ctx.fillStyle = 'rgba(216,245,106,.25)'; ctx.fillRect(x - 1, y, 3, 1); ctx.fillRect(x, y - 1, 1, 3); } }
    else if (W.name === 'crystal') { if (Math.sin(a.p * 2.5) > .6) { ctx.fillStyle = a.s > 1 ? W.acc : W.acc2; ctx.fillRect(x, y - 1, 1, 3); ctx.fillRect(x - 1, y, 3, 1); } }
    else { ctx.fillStyle = 'rgba(180,170,210,.35)'; ctx.fillRect(x, y, 1, 1); } }
}

/* ---------- Nauji objektai: lava, varvekliai, šaudyklės, strėlės, ugnies srovės, portalai, smėlio raibuliai ---------- */
function drawLava(c, r, t, top) {
  const x = c * TS, y = r * TS; ctx.fillStyle = '#C8301A'; ctx.fillRect(x, y + (top ? 4 : 0), 16, top ? 12 : 16); ctx.fillStyle = '#FF5A1F'; ctx.fillRect(x, y + (top ? 6 : 2), 16, 4);
  if (top) for (let i = 0; i < 16; i++) { const yy = y + 3 + Math.round(Math.sin(t * 3 + (x + i) * .4) * 1.2); ctx.fillStyle = '#FFD84A'; ctx.fillRect(x + i, yy, 1, 1); ctx.fillStyle = '#FF8A2A'; ctx.fillRect(x + i, yy + 1, 1, 2); }
  const b = (t * 1.3 + c * .37) % 1; if (b < .3) { ctx.fillStyle = '#FFD84A'; ctx.fillRect(x + 4 + (c * 5) % 8, y + 10 - Math.round(b * 20), 2, 2); }
}
function drawIcicle(c, r, shake) {
  const x = c * TS + (shake ? (Math.floor(gt * 40) % 2 ? 1 : -1) : 0), y = r * TS;
  ctx.fillStyle = OUT; for (let k = 0; k < 12; k++) { const w = Math.max(1, 6 - Math.floor(k / 2)); ctx.fillRect(x + 8 - (w >> 1) - 1, y + k, w + 2, 1); }
  for (let k = 0; k < 11; k++) { const w = Math.max(1, 6 - Math.floor(k / 2)) - 1; ctx.fillStyle = k < 3 ? '#FFFFFF' : '#BFE8FF'; ctx.fillRect(x + 8 - (w >> 1), y + k, w, 1); ctx.fillStyle = '#E6F8FF'; if (w > 2) ctx.fillRect(x + 8 - (w >> 1), y + k, 1, 1); }
}
function drawShooter(s, W) {
  const x = s.c * TS, y = s.r * TS, [vx, vy] = DIRV[s.d];
  ctx.fillStyle = OUT; ctx.fillRect(x, y, 16, 16); ctx.fillStyle = W.lo; ctx.fillRect(x + 1, y + 1, 14, 14); ctx.fillStyle = W.hi; ctx.fillRect(x + 1, y + 1, 14, 1);
  ctx.fillStyle = '#3A2A1A'; ctx.fillRect(x + 4, y + 4, 8, 8); ctx.fillStyle = OUT; ctx.fillRect(x + 6 + vx * 5, y + 6 + vy * 5, 4, 4);
  ctx.fillStyle = s.t < .25 ? '#FF6A55' : '#8A2A20'; ctx.fillRect(x + 7, y + 7, 2, 2);   // įspėjimas prieš šūvį
}
function drawArrow(a) {
  const x = Math.round(a.x), y = Math.round(a.y), [vx, vy] = DIRV[a.d];
  ctx.fillStyle = OUT; if (vx) ctx.fillRect(x - 5, y - 1, 11, 3); else ctx.fillRect(x - 1, y - 5, 3, 11);
  ctx.fillStyle = '#C8A270'; if (vx) ctx.fillRect(x - 4, y, 8, 1); else ctx.fillRect(x, y - 4, 1, 8);
  ctx.fillStyle = '#E8E4F4'; if (vx) ctx.fillRect(x + vx * 4, y - 1 + 1, 2 * vx, 1), ctx.fillRect(x + vx * 3, y - 1, 1, 3); else ctx.fillRect(x - 1, y + vy * 3, 3, 1), ctx.fillRect(x, y + vy * 4, 1, 2 * vy);
  ctx.fillStyle = '#E0443A'; if (vx) ctx.fillRect(x - vx * 5, y - 1, 2, 3); else ctx.fillRect(x - 1, y - vy * 5, 3, 2);
}
function drawJet(j, t) {
  const x = j.c * TS, y = j.r * TS, [vx, vy] = DIRV[j.d];
  ctx.fillStyle = OUT; ctx.fillRect(x + 3, y + 3, 10, 10); ctx.fillStyle = '#5A5A66'; ctx.fillRect(x + 4, y + 4, 8, 8); ctx.fillStyle = j.warn ? '#FF8A2A' : '#2A1A1A'; ctx.fillRect(x + 6 + vx * 3, y + 6 + vy * 3, 4, 4);
  if (!j.hot) { if (j.warn && Math.random() < .5) { ctx.fillStyle = '#FFB02E'; ctx.fillRect(x + 7 + vx * 9 + rnd(-2, 2), y + 7 + vy * 9 + rnd(-2, 2), 1, 1); } return; }
  const len = j.len * TS;
  for (let k = 0; k < len; k += 2) { const w = 4 + Math.round(Math.sin(t * 30 + k * .7) * 1.5) + (k < 6 ? -1 : 0), col = k < len * .3 ? '#FFF1A8' : k < len * .65 ? '#FFB02E' : '#FF5A1F';
    const px = x + 8 + vx * (8 + k), py = y + 8 + vy * (8 + k); ctx.fillStyle = col; if (vx) ctx.fillRect(px, py - (w >> 1), 2, w); else ctx.fillRect(px - (w >> 1), py, w, 2); }
}
function drawPortal(m, t, col) {
  const x = m[0] * TS + 8, y = m[1] * TS + 2;
  for (let a = 0; a < 20; a++) { const q = a / 20 * TAU + t * 3, rx = Math.round(Math.cos(q) * 6), ry = Math.round(Math.sin(q) * 11); ctx.fillStyle = a % 2 ? col : '#FFFFFF'; ctx.fillRect(x + rx, y + ry, 1, 1); }
  ctx.fillStyle = 'rgba(90,240,224,.25)'; ctx.fillRect(x - 4, y - 8, 9, 17);
}
function drawSandRipples(t) {
  for (const k of L.sand) { if (L.sand.has(k - COLS)) continue; const c = k % COLS, r = Math.floor(k / COLS), o = Math.floor(t * 6 + c * 3) % 8;
    ctx.fillStyle = '#D29A58'; ctx.fillRect(c * TS + o, r * TS + 1, 3, 1); ctx.fillRect(c * TS + (o + 8) % 16, r * TS + 2, 2, 1);
    if ((Math.floor(t * 2) + c) % 5 === 0) { ctx.fillStyle = '#3E2410'; ctx.fillRect(c * TS + 7, r * TS + 6, 2, 2); } }   // sūkurys
}

/* ---------- Objektai ---------- */
function drawSpike(c, r, d, W, k) {   // k - iššokimo eiga 0..1
  const x = c * TS, y = r * TS, e = Math.round((1 - (k ?? 1)) * 8);
  for (let i = 0; i < 3; i++) { const bx = 2 + i * 4;
    for (let s = 0; s < 6; s++) { const w = Math.max(1, 4 - Math.floor(s * 4 / 6)), o = Math.floor((4 - w) / 2);
      const col = s === 0 ? '#5C5870' : w <= 1 ? '#F4F1FF' : (o + 1 < 2 ? '#B8B4CC' : '#8B87A0');
      ctx.fillStyle = OUT;
      if (d === '^') { ctx.fillRect(x + bx + o - 1, y + 15 - s + e, w + 2, 1); ctx.fillStyle = col; ctx.fillRect(x + bx + o, y + 15 - s + e, w, 1); }
      else if (d === 'v') { ctx.fillRect(x + bx + o - 1, y + s - e, w + 2, 1); ctx.fillStyle = col; ctx.fillRect(x + bx + o, y + s - e, w, 1); }
      else if (d === '<') { ctx.fillRect(x + s - e, y + bx + o - 1, 1, w + 2); ctx.fillStyle = col; ctx.fillRect(x + s - e, y + bx + o, 1, w); }
      else { ctx.fillRect(x + 15 - s + e, y + bx + o - 1, 1, w + 2); ctx.fillStyle = col; ctx.fillRect(x + 15 - s + e, y + bx + o, 1, w); } } }
}
function drawDoor(d, t, W) {
  const x = Math.round(d.x), y = Math.round(d.y);
  if (d.mimic) {   // durys virto pabaisa: dantys, akis
    ctx.fillStyle = OUT; ctx.fillRect(x + 1, y + 2, 14, 30); ctx.fillStyle = '#7A1420'; ctx.fillRect(x + 2, y + 4, 12, 27);
    ctx.fillStyle = '#2A0608'; ctx.fillRect(x + 4, y + 12, 8, 16);
    const ch = Math.floor(t * 8) % 2;
    ctx.fillStyle = '#F4F1E8'; for (let i = 0; i < 4; i++) { ctx.fillRect(x + 4 + i * 2, y + 12 + ch, 1, 3); ctx.fillRect(x + 5 + i * 2, y + 25 - ch, 1, 3); }
    ctx.fillStyle = '#FFE36B'; ctx.fillRect(x + 5, y + 7, 2, 2); ctx.fillRect(x + 9, y + 7, 2, 2); ctx.fillStyle = OUT; ctx.fillRect(x + 6, y + 8, 1, 1); ctx.fillRect(x + 10, y + 8, 1, 1);
    return;
  }
  /* akmeninė arka, medinės durys, žibintas viršuje */
  ctx.fillStyle = OUT; ctx.fillRect(x, y + 3, 16, 29); ctx.fillRect(x + 2, y + 1, 12, 2);
  ctx.fillStyle = W.hi; ctx.fillRect(x + 1, y + 4, 14, 28); ctx.fillRect(x + 3, y + 2, 10, 2);
  ctx.fillStyle = W.lo; ctx.fillRect(x + 1, y + 30, 14, 2);
  const o = Math.round((d.open || 0) * 9);
  ctx.fillStyle = '#1A0F08'; ctx.fillRect(x + 3, y + 5, 10, 27);
  if (o < 10) { ctx.fillStyle = '#8A5A2E'; ctx.fillRect(x + 3 + o, y + 5, 10 - o, 27); ctx.fillStyle = '#6A4220'; for (let i = 0; i < 3; i++) if (x + 5 + i * 3 >= x + 3 + o) ctx.fillRect(x + 5 + i * 3, y + 6, 1, 25);
    ctx.fillStyle = '#B07A3E'; ctx.fillRect(x + 3 + o, y + 5, 10 - o, 1); if (o < 6) { ctx.fillStyle = '#FFD27A'; ctx.fillRect(x + 10, y + 18, 2, 2); } }
  else { ctx.fillStyle = '#FFE7A0'; ctx.fillRect(x + 5, y + 8, 6, 22); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 7, y + 10, 2, 18); }
  const b = Math.floor(t * 2) % 2; ctx.fillStyle = b ? W.light2 : W.light; ctx.fillRect(x + 7, y, 2, 2);
}
function drawSpring(s, W) {
  const x = s.c * TS, y = s.r * TS, k = s.t > 0 ? 3 : 0;
  if (W && W.name === 'forest') {   // šokinėjimo grybas
    ctx.fillStyle = OUT; ctx.fillRect(x + 5, y + 9, 6, 7); ctx.fillStyle = '#F0E6D0'; ctx.fillRect(x + 6, y + 10, 4, 6);
    ctx.fillStyle = OUT; ctx.fillRect(x + 1, y + 4 + k, 14, 6 - k); ctx.fillRect(x + 2, y + 3 + k, 12, 1); ctx.fillStyle = '#E0443A'; ctx.fillRect(x + 2, y + 4 + k, 12, 5 - k);
    ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + 4, y + 5 + k, 2, 1); ctx.fillRect(x + 9, y + 6 + k, 2, 1); return; }
  ctx.fillStyle = OUT; ctx.fillRect(x + 2, y + 9 - k, 12, 7 + k); ctx.fillStyle = '#8B87A0'; for (let i = 0; i < 2 + (k ? 1 : 0); i++) ctx.fillRect(x + 4, y + 12 - k + i * 2, 8, 1);
  ctx.fillStyle = '#E0443A'; ctx.fillRect(x + 3, y + 10 - k, 10, 2); ctx.fillStyle = '#FF8A7A'; ctx.fillRect(x + 3, y + 10 - k, 10, 1);
  ctx.fillStyle = '#5C5870'; ctx.fillRect(x + 3, y + 15, 10, 1);
}
function drawSaw(s, t) {
  const R = s.r + 1, a = s.a;
  for (let yy = -R - 2; yy <= R + 2; yy++) for (let xx = -R - 2; xx <= R + 2; xx++) {
    const d = Math.hypot(xx, yy), ang = Math.atan2(yy, xx) - a, tooth = (Math.floor((ang / TAU) * 10 + 10) % 2) === 0;
    let col = null; if (d <= R - 3) col = d < 2 ? OUT : d < 3 ? '#5C5870' : (xx + yy) % 3 === 0 ? '#B8B4CC' : '#9A96B0';
    else if (d <= R) col = '#D8D4E8'; else if (d <= R + 2 && tooth) col = '#F4F1FF';
    else if (d <= R + 2.6 && (tooth || d <= R + 1)) col = OUT;
    if (col) { ctx.fillStyle = col; ctx.fillRect(Math.round(s.x + xx), Math.round(s.y + yy), 1, 1); } }
}
/* Antkapis 9×10 ant žemės kauburėlio: apvalus viršus, įrėžtas kryžius; x - centras, y - žemės paviršius; kas trečias šiek tiek pakrypęs */
const GRAVE = ['..kkkkk..', '.kHHHHHk.', 'kHLLLLLSk', 'kLLLDLLSk', 'kLLDDDLSk', 'kLLLDLLSk', 'kLLLDLLSk', 'kLLLLLLSk', 'kSLLLLSSk', 'kkkkkkkkk'];
const GRAVE_P = { k: OUT, H: '#D9D3E6', L: '#A79FBD', S: '#716989', D: '#4C4563' };
function drawGrave(x, y, i, age) {
  const drop = age !== undefined && age < .15 ? Math.round((1 - age / .15) * 6) : 0, low = i % 3 === 1;
  const rows = low ? GRAVE.filter((r, k) => k !== 6) : GRAVE;   // kas trečias - žemesnis, su samanomis
  drawMap(rows, x - 4, y - 1 - rows.length - drop, GRAVE_P);
  if (low) { ctx.fillStyle = '#5E8F3E'; ctx.fillRect(x - 3, y - 11 - drop, 2, 1); ctx.fillRect(x - 4, y - 10 - drop, 1, 2); }
  ctx.fillStyle = OUT; ctx.fillRect(x - 6, y - 2, 13, 2); ctx.fillStyle = '#4A3424'; ctx.fillRect(x - 5, y - 2, 11, 1); ctx.fillStyle = '#6A4C34'; ctx.fillRect(x - 4, y - 2, 3, 1); ctx.fillRect(x + 2, y - 2, 2, 1);
  ctx.fillStyle = '#5E8F3E'; ctx.fillRect(x - 6, y - 3, 1, 1); ctx.fillRect(x + 5, y - 3, 1, 1);
}
function drawRise(r, t) {   // kylanti spyglių siena (arba lava) per visą plotį
  const y = Math.round(r.y);
  if (r.lava) { ctx.fillStyle = '#C8301A'; ctx.fillRect(0, y + 3, GW, GH - y); ctx.fillStyle = '#FF5A1F'; ctx.fillRect(0, y + 5, GW, 4);
    for (let x = 0; x < GW; x++) { const yy = y + Math.round(Math.sin(t * 4 + x * .25) * 1.5); ctx.fillStyle = '#FFD84A'; ctx.fillRect(x, yy, 1, 1); ctx.fillStyle = '#FF8A2A'; ctx.fillRect(x, yy + 1, 1, 2); } return; }
  ctx.fillStyle = '#2A0608'; ctx.fillRect(0, y + 6, GW, GH - y);
  for (let x = 0; x < GW; x += 8) { const b = (Math.floor(t * 10) + x / 8) % 2;
    ctx.fillStyle = OUT; ctx.fillRect(x + 2, y - 1, 4, 8); ctx.fillStyle = b ? '#F4F1FF' : '#B8B4CC'; ctx.fillRect(x + 3, y, 2, 7); ctx.fillRect(x + 2, y + 4, 4, 3); }
  ctx.fillStyle = '#7A1420'; ctx.fillRect(0, y + 7, GW, 2);
}
