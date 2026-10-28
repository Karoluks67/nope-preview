/* screens: įžanga, titulinis (gyva scena: angeliukas eina, grindys įgriūva į spyglius, velniūkštis juokiasi, grindys sugrįžta),
   pasaulių žemėlapis (vingiuotas takas per peizažą, lygių akmenys, angeliukas vaikšto, gale - velniūkščio pilis), pikselinė apskritimo užuolaida */
'use strict';

/* ---------- Dalelės (bendros: žaidimas, titulinis, žemėlapis) ---------- */
function drawParticles(list) {
  for (const p of list) { const k = p.t / p.max;
    if (p.k === 'px') { ctx.fillStyle = p.c; const s = k > .5 ? 2 : 1; ctx.fillRect(Math.round(p.x), Math.round(p.y), s, s); }
    else if (p.k === 'feather') { const sw = Math.sin(p.t * 5 + p.ph) > 0, x = Math.round(p.x), y = Math.round(p.y); ctx.globalAlpha = Math.min(1, k * 2); ctx.fillStyle = '#1B1A33'; ctx.fillRect(x - 1, y, 5, 2); ctx.fillStyle = '#FFFFFF'; ctx.fillRect(x + (sw ? 0 : 1), y, 3, 1); ctx.fillStyle = '#C2C6EC'; ctx.fillRect(x + (sw ? 2 : 0), y + 1, 1, 1); ctx.globalAlpha = 1; }
    else if (p.k === 'halo') { ctx.globalAlpha = Math.min(1, k * 3); drawHalo(p.x, p.y, gt * 3); ctx.globalAlpha = 1; }
    else if (p.k === 'ring') { const R = Math.round((1 - k) * 22); ctx.fillStyle = '#F4F1FF'; for (let a = 0; a < 24; a++) { const q = a / 24 * TAU; ctx.fillRect(Math.round(p.x + Math.cos(q) * R), Math.round(p.y + Math.sin(q) * R), 1, 1); } }
    else if (p.k === 'wind') { ctx.fillStyle = 'rgba(230,236,255,.45)'; ctx.fillRect(Math.round(p.x), Math.round(p.y), 8, 1); }
    else if (p.k === 'star') { ctx.fillStyle = k > .5 ? '#FFF1A8' : '#FFD45A'; const x = Math.round(p.x), y = Math.round(p.y); ctx.fillRect(x, y - 1, 1, 3); ctx.fillRect(x - 1, y, 3, 1); }
  }
}
function stepParticles(list, dt) {
  for (const p of list) { p.t -= dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.g) p.vy += 700 * dt; if (p.k === 'px') p.vx *= Math.exp(-dt * 3);
    if (p.k === 'feather') { p.vx = p.vx * Math.exp(-dt * 4) + Math.sin(p.t * 5 + p.ph) * 300 * dt; p.vy = Math.min(28, p.vy + 260 * dt); }
    if (p.k === 'halo') p.vy += 520 * dt; }
  for (let i = list.length - 1; i >= 0; i--) if (list[i].t <= 0) list.splice(i, 1);
}
function burst(list, x, y) {   // angeliuko „pūkštelėjimas": plunksnos, aureolė, žiedas
  for (let i = 0; i < 12; i++) { const a = rnd(0, TAU), v = rnd(60, 180); list.push({ k: 'px', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, t: rnd(.3, .6), max: .6, c: pick(PAL.hero), g: 1 }); }
  for (let i = 0; i < 6; i++) { const a = rnd(0, TAU), v = rnd(40, 100); list.push({ k: 'feather', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: rnd(1, 1.5), max: 1.5, ph: rnd(0, TAU) }); }
  list.push({ k: 'halo', x, y: y - 8, vx: rnd(-30, 30), vy: -170, t: 1.1, max: 1.1 }); list.push({ k: 'ring', x, y, t: .3, max: .3 });
}

/* ---------- Pikselinė apskritimo užuolaida tarp ekranų ---------- */
let WIPE = null;
function wipe(fn, cx, cy) { if (WIPE) return; WIPE = { t: 0, fn, cx: cx ?? GW / 2, cy: cy ?? GH / 2, done: false }; sfx('whoosh'); }
function drawWipe(dt) {
  if (!WIPE) return; WIPE.t += dt; const D = .32, Rm = Math.hypot(GW, GH);
  if (!WIPE.done && WIPE.t >= D) { WIPE.done = true; WIPE.fn(); if (state === 'play' && pl) { WIPE.cx = pl.x + PW / 2; WIPE.cy = pl.y + PH / 2; } }
  const k = WIPE.t < D ? 1 - smooth(WIPE.t / D) : smooth((WIPE.t - D) / D), R = Math.round(k * Rm);
  ctx.fillStyle = '#07060B';
  for (let y = 0; y < GH; y += 2) { const dy = y + 1 - WIPE.cy, hw = R > Math.abs(dy) ? Math.round(Math.sqrt(R * R - dy * dy) / 2) * 2 : -1;
    if (hw < 0) ctx.fillRect(0, y, GW, 2); else { const x0 = Math.round(WIPE.cx - hw), x1 = Math.round(WIPE.cx + hw); ctx.fillRect(0, y, Math.max(0, x0), 2); ctx.fillRect(x1, y, GW - x1, 2); } }
  if (WIPE.t >= D * 2) WIPE = null;
}

/* ---------- Titulinis: gyva scena ---------- */
let TITLE_BG = null, titleT = 0, titleFx = [], titleDev = null;
const TT = { trapC: 17, floorR: 14, spikeR: 15 };
function titleBg() {
  const W = WORLD[0]; TITLE_BG = document.createElement('canvas'); TITLE_BG.width = GW; TITLE_BG.height = GH; const g = TITLE_BG.getContext('2d');
  g.fillStyle = W.bg; g.fillRect(0, 0, GW, GH);
  for (let y = 0; y < GH; y += 8) { const off = (y / 8) % 2 ? 12 : 0; for (let x = -off; x < GW; x += 24) { g.fillStyle = hash(x, y, 3) < .5 ? W.bgA : W.bgB; g.fillRect(x + 1, y + 1, 22, 6); if (hash(x, y, 4) < .3) { g.fillStyle = W.bgL; g.fillRect(x + 1, y + 1, 22, 1); } } }
  lightPool(g, 56, 150, W, 1); lightPool(g, 424, 150, W, 1);
  const isPit = (c, r) => (c === TT.trapC || c === TT.trapC + 1) && r === TT.floorR;
  for (let c = 0; c < COLS; c++) for (let r = TT.floorR; r < ROWS; r++) { if (isPit(c, r)) continue; const pit = c === TT.trapC || c === TT.trapC + 1;
    if (pit && r === TT.spikeR) continue;   // duobė: dugne - spygliai
    tileArt(g, c, r, c * TS, r * TS, W, { up: r === TT.floorR || (pit && r === TT.spikeR + 1), dn: false, lf: !pit && (c === TT.trapC + 2) && r === TT.spikeR, rt: !pit && c === TT.trapC - 1 && r === TT.spikeR }); }
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(TT.trapC * TS, TT.floorR * TS, 32, 32);
}
function drawTitle(dt) {
  const W = WORLD[0]; if (!TITLE_BG) titleBg(); titleT += dt;
  if (!titleDev) { titleDev = Object.assign({}, devil, { x: 400, y: 150, ha: [] }); }
  ctx.drawImage(TITLE_BG, 0, 0); drawTorch(56, 150, gt, W); drawTorch(424, 150, gt, W);
  /* scena: 6,5 s ciklas */
  const T0 = 6.5, c = titleT % T0, tx = TT.trapC * TS, fy = TT.floorR * TS;
  for (let i = 0; i < 2; i++) drawSpike(TT.trapC + i, TT.spikeR, '^', W);
  const walkEnd = 2.7, x0 = 28, x1 = tx + 11 - PW / 2;
  let hx = x0 + (x1 - x0) * clamp((c - .4) / (walkEnd - .4), 0, 1), hy = fy - PH, fallT = c - 3.0;
  /* įgriūvančios plytelės: drebėjimas -> kritimas -> sugrįžimas */
  for (let i = 0; i < 2; i++) { let ox = 0, oy = 0;
    if (c > walkEnd && c < 3.0) ox = Math.floor(gt * 40) % 2 ? 1 : -1;
    else if (c >= 3.0 && c < 5.2) { const ft = c - 3.0; oy = Math.min(80, 0.5 * 900 * ft * ft) + i * 3; }
    else if (c >= 5.2 && c < 5.8) { const k = 1 - smooth((c - 5.2) / .6); oy = k * 80; }
    if (oy < 70) tileArt(ctx, TT.trapC + i, TT.floorR, tx + i * TS + ox, fy + oy, W, { up: true, dn: true, lf: i === 0, rt: i === 1 }); }
  if (c > 3.0 && c - dt <= 3.0) sfx('crumble');
  let alive = c < 3.25;
  if (c >= 3.0) hy = fy - PH + Math.min(14, 0.5 * 1100 * fallT * fallT);
  if (c >= 3.25 && c - dt < 3.25) { burst(titleFx, x1 + PW / 2, fy + 10); sfx('die'); titleDev.mood = 'laugh'; titleDev.moodT = 1.6; titleDev.say = TR('laugh'); titleDev.sayT = 1.5; setTimeout(() => sfx('laugh'), 150); }
  if (c > .4 && c < 3.25) { const appear = c < .55; if (appear && c - dt <= .4) { for (let i = 0; i < 8; i++) titleFx.push({ k: 'star', x: x0 + 5 + rnd(-8, 8), y: fy - 8 + rnd(-8, 8), t: .4, max: .4, vx: rnd(-20, 20), vy: rnd(-30, 0) }); }
    drawHero(hx, hy, { face: 1, sq: c > walkEnd && c < 3 ? .5 : 0, ground: c < 3.0, run: c < walkEnd ? gt * 12 : 0, vy: c > 3 ? 200 : 0 }); }
  ctx.fillStyle = W.bg; ctx.fillRect(tx, fy + 32, 32, 16);
  stepParticles(titleFx, dt); drawParticles(titleFx);
  /* velniūkštis: tyko dešinėje, juoktis atskrenda virš duobės */
  const d = titleDev; d.t += dt; d.moodT -= dt; d.sayT -= dt; if (d.moodT <= 0) d.mood = c > 2.2 && c < 3.2 ? 'smirk' : 'idle';
  const gx = d.mood === 'laugh' ? tx + 8 : 380 + Math.sin(d.t * .8) * 20, gy = d.mood === 'laugh' ? fy - 66 : 160 + Math.sin(d.t * 1.7) * 8;
  d.vx = (d.vx || 0) + ((gx - d.x) * 9 - (d.vx || 0) * 4.8) * dt; d.vy = (d.vy || 0) + ((gy - d.y) * 9 - (d.vy || 0) * 4.8) * dt; d.x += d.vx * dt; d.y += d.vy * dt;
  if (d.mood === 'laugh' && Math.random() < dt * 5) d.ha.push({ x: d.x + rnd(0, 16), y: d.y - 2, t: .7 }); for (const h of d.ha) { h.t -= dt; h.y -= 26 * dt; } d.ha = d.ha.filter(h => h.t > 0);
  if (d.sayT > 0) { const keepDev = Object.assign({}, devil); Object.assign(devil, d, { x: 372, y: 104 }); devil.ha = []; const t0 = devil.t; drawDevilActorBubble(); Object.assign(devil, keepDev); }   // kalba didysis velniūkštis
  for (const h of d.ha) { ctx.globalAlpha = Math.min(1, h.t * 3); text('HA', 372 + (h.x % 60), h.y - 40, 1, '#FF6A55', .5); ctx.globalAlpha = 1; }   // HA kyla nuo didžiojo velniūkščio
  /* dideli personažai šalia meniu (piešiami mažoje drobėje ir padidinami sveiku masteliu) */
  bigSprite(() => drawHero(14, 16, { face: 1, sq: 0, ground: true, blink: (gt % 3.3) < .12, t: gt }), 52, 78, 4);
  bigSprite(() => drawDevil(12, 10 + Math.round(Math.sin(gt * 2.2) * 2), c > 3.2 && c < 4.8 ? 'laugh' : 'smirk', gt, { fly: true, face: -1 }), 330, 70, 4);
  /* logotipas ir meniu */
  drawLogo(240, 20, 7, gt);
  btn(180, 92, 120, 30, T('play'), '#7A4A16', startGame, 2, 0);
  btn(180, 128, 120, 22, T('map'), COL.panel2, openMap, 1, 1);
  if (save.total) { skull(206, 160); text(T('total') + ' ' + save.total, 218, 161, 1, COL.dim, 0); }
  iconBtn(GW - 30, 8, 'gear', () => openSettings('title')); iconBtn(GW - 56, 8, 'snd', quickMute);
}

/* sprite'o padidinimas: fn piešia į 40×40 drobę, ji padidinama s kartų (pikseliai aštrūs) */
const BIG = document.createElement('canvas'); BIG.width = 40; BIG.height = 40; const BIGX = BIG.getContext('2d');
function bigSprite(fn, x, y, s) {
  BIGX.clearRect(0, 0, 40, 40); const keep = ctx; ctx = BIGX; try { fn(); } finally { ctx = keep; }
  ctx.imageSmoothingEnabled = false; ctx.drawImage(BIG, 0, 0, 40, 40, Math.round(x), Math.round(y), 40 * s, 40 * s);
}
/* ---------- Pasaulių žemėlapis ---------- */
const MAPN = [[44, 214], [88, 186], [132, 212], [180, 188], [222, 154], [268, 172], [314, 146], [352, 176], [396, 150], [436, 104]];
let mapSel = 0, mapW = 0, mapWalk = null, MAP_BG = {}, mapFx = [], mapDev = null, mapLaughT = 4;
const mapNodes = w => MAPN.map(([x, y], i) => [x + Math.round((hash(i, w, 9) - .5) * 10), y + Math.round((hash(i, w, 10) - .5) * 10)]);
function openMap() { wipe(() => { state = 'map'; mapW = clamp(Math.floor((save.unlocked - 1) / 10), 0, WN - 1); mapSel = clamp(save.unlocked - 1 - mapW * 10, 0, 9); mapWalk = null; tbOn = false; }); }
function mapBg(w) {
  if (MAP_BG[w]) return MAP_BG[w]; const W = WORLD[w], c = document.createElement('canvas'); c.width = GW; c.height = GH; const g = c.getContext('2d');
  /* žemė su tekstūra ir šešėliu kraštuose */
  mapGround(g, w);
  /* takas tarp akmenų (Catmull-Rom), taškuotas */
  const N = mapNodes(w), pts = [];
  for (let i = 0; i < N.length - 1; i++) { const p0 = N[Math.max(0, i - 1)], p1 = N[i], p2 = N[i + 1], p3 = N[Math.min(N.length - 1, i + 2)];
    for (let s = 0; s < 1; s += .02) { const t2 = s * s, t3 = t2 * s, f = (a, b, c2, d) => .5 * (2 * b + (-a + c2) * s + (2 * a - 5 * b + 4 * c2 - d) * t2 + (-a + 3 * b - 3 * c2 + d) * t3); pts.push([f(p0[0], p1[0], p2[0], p3[0]), f(p0[1], p1[1], p2[1], p3[1])]); } }
  for (const [x, y] of pts) { g.fillStyle = W.deep; g.fillRect(Math.round(x) - 3, Math.round(y) - 1, 7, 5); }
  for (const [x, y] of pts) { g.fillStyle = W.mor; g.fillRect(Math.round(x) - 2, Math.round(y) - 1, 5, 3); }
  pts.forEach(([x, y], k) => { if (k % 4 === 0) { g.fillStyle = W.hi; g.fillRect(Math.round(x), Math.round(y), 1, 1); } });
  /* peizažas: objektai ne ant tako */
  const far = (x, y) => pts.every(p => Math.hypot(p[0] - x, p[1] - y) > 16) && y > 44;
  const props = []; for (let i = 0; i < 260; i++) { const x = 8 + Math.floor(hash(i, w, 5) * (GW - 16)), y = 44 + Math.floor(hash(i, w, 6) * (GH - 52)); if (!far(x, y) || props.some(q => Math.hypot(q[0] - x, q[1] - y) < 13)) continue; props.push([x, y, i]); }
  props.sort((a, b) => a[1] - b[1]); for (const [x, y, i] of props) mapProp(g, w, x, y, i);   // tolimesni - pirmiau
  g.fillStyle = 'rgba(0,0,0,.35)'; g.fillRect(0, 0, GW, 2); g.fillRect(0, GH - 2, GW, 2); g.fillRect(0, 0, 2, GH); g.fillRect(GW - 2, 0, 2, GH);
  return MAP_BG[w] = c;
}
/* Peizažo objektai pagal pasaulį (piešiami tiesiai į drobę g) */
/* Žemės raštas pagal pasaulį: grindinys, žolė, kopų raibuliai, sniegas, kristalų gyslos, lavos upės */
function mapGround(g, w) {
  const W = WORLD[w], R = (x, y, ww, hh, c) => { g.fillStyle = c; g.fillRect(x, y, ww, hh); };
  R(0, 0, GW, GH, W.bgA);
  if (w === 0) { for (let y = 0; y < GH; y += 12) for (let x = ((y / 12) % 2) * 8; x < GW; x += 16) { R(x + 1, y + 1, 14, 10, hash(x, y, 1) < .5 ? W.bgB : W.bgA); R(x + 1, y + 1, 14, 1, W.bgL); } }   // grindinys
  else if (w === 1) { R(0, 0, GW, GH, '#1C3A22'); for (let i = 0; i < 1400; i++) { const x = Math.floor(hash(i, 1, 2) * GW), y = Math.floor(hash(i, 2, 2) * GH); R(x, y, 1, 2, hash(i, 3, 2) < .5 ? '#2A5230' : '#16301C'); } for (let i = 0; i < 60; i++) R(Math.floor(hash(i, 4, 2) * GW), Math.floor(hash(i, 5, 2) * GH), 1, 1, hash(i, 6, 2) < .5 ? '#FFD45A' : '#FF8AC0'); }
  else if (w === 2) { R(0, 0, GW, GH, '#C98F4E'); for (let y = 0; y < GH; y += 5) for (let x = 0; x < GW; x++) { const yy = y + Math.round(Math.sin(x / 9 + y) * 1.5); if ((x + y) % 3 === 0) R(x, yy, 1, 1, '#E0AE68'); } for (let i = 0; i < 300; i++) R(Math.floor(hash(i, 1, 3) * GW), Math.floor(hash(i, 2, 3) * GH), 1, 1, '#A8723C'); }
  else if (w === 3) { R(0, 0, GW, GH, '#DDEAF6'); for (let i = 0; i < 900; i++) R(Math.floor(hash(i, 1, 4) * GW), Math.floor(hash(i, 2, 4) * GH), 2, 1, hash(i, 3, 4) < .5 ? '#C4D8EA' : '#FFFFFF'); for (let i = 0; i < 12; i++) { const x = Math.floor(hash(i, 5, 4) * GW), y = Math.floor(hash(i, 6, 4) * GH); R(x - 14, y - 4, 28, 8, '#9ED8F5'); R(x - 10, y - 4, 20, 2, '#E6F8FF'); } }   // ledo ežerėliai
  else if (w === 4) { R(0, 0, GW, GH, '#1E1838'); for (let i = 0; i < 40; i++) { let x = Math.floor(hash(i, 1, 5) * GW), y = Math.floor(hash(i, 2, 5) * GH); const c = hash(i, 3, 5) < .5 ? '#2E6A78' : '#6A2E68'; for (let k = 0; k < 14; k++) { R(x, y, 2, 1, c); x += 2; y += hash(i, k, 6) < .5 ? 1 : -1; } } for (let i = 0; i < 500; i++) R(Math.floor(hash(i, 4, 5) * GW), Math.floor(hash(i, 5, 5) * GH), 1, 1, '#2A2250'); }
  else { R(0, 0, GW, GH, '#2A0C0A'); for (let i = 0; i < 700; i++) R(Math.floor(hash(i, 1, 6) * GW), Math.floor(hash(i, 2, 6) * GH), 2, 1, hash(i, 3, 6) < .5 ? '#3A1210' : '#1E0806');
    for (let k = 0; k < 3; k++) { let y = 60 + k * 80; for (let x = 0; x < GW; x += 2) { y += Math.round(Math.sin(x / 30 + k * 3) * 1.2); R(x, y, 2, 6, '#C8301A'); R(x, y + 1, 2, 2, '#FF5A1F'); } } }   // lavos upės
}
function mapProp(g, w, x, y, i) {
  const W = WORLD[w], R = (a, b, ww, hh, col) => { g.fillStyle = col; g.fillRect(x + a, y + b, ww, hh); }, v = hash(i, w, 8);
  if (w === 0) { if (v < .35) { R(-4, -14, 9, 16, OUT); R(-3, -13, 7, 14, W.mid); R(-3, -13, 2, 14, W.hi); R(-4, -16, 9, 3, W.top); R(-4, 1, 9, 2, W.lo); } else if (v < .7) { R(-5, -1, 11, 4, OUT); R(-4, -1, 9, 3, W.lo); R(-2, -3, 4, 3, '#C9C2D8'); R(-1, -2, 1, 1, OUT); R(1, -2, 1, 1, OUT); } else { R(-1, -9, 3, 10, '#6A4A2C'); R(-2, -12, 5, 4, '#FF9B3A'); R(-1, -13, 3, 2, '#FFD27A'); } }   // kolonos, kaukolės, deglai
  else if (w === 1) { if (v < .75) { const h = 14 + Math.floor(v * 8); R(-1, -3, 3, 6, '#5A3C25'); R(-7, -h, 15, h - 2, OUT); R(-6, -h + 1, 13, h - 4, W.acc); R(-5, -h + 1, 5, 4, W.acc2); R(-6, -5, 13, 2, '#2E5A24'); R(2, -h + 6, 2, 2, '#2E5A24'); } else { R(-3, -4, 7, 5, OUT); R(-2, -4, 5, 3, '#E0443A'); R(-1, -1, 3, 2, '#F0E6D0'); R(-1, -3, 1, 1, '#FFFFFF'); } }   // medžiai, grybai
  else if (w === 2) { if (v < .5) { R(-2, -14, 5, 16, OUT); R(-1, -13, 3, 14, W.acc); R(-1, -13, 1, 14, W.acc2); R(-6, -9, 4, 2, OUT); R(-6, -11, 2, 4, OUT); R(-5, -10, 1, 2, W.acc); R(3, -7, 4, 2, OUT); R(5, -10, 2, 5, OUT); R(5, -9, 1, 3, W.acc); } else if (v < .8) { R(-9, -2, 19, 4, '#B07A42'); R(-6, -4, 13, 2, '#C98F4E'); R(-3, -5, 7, 1, '#E8B96A'); } else { R(-3, -2, 7, 3, '#E9D9B0'); R(-2, -3, 2, 1, '#E9D9B0'); R(2, -3, 2, 1, '#E9D9B0'); } }   // kaktusai, kopos, kaulai
  else if (w === 3) { R(-1, -1, 3, 3, '#4A3424'); R(-5, -9, 11, 9, OUT); R(-4, -8, 9, 7, '#2E5A4A'); R(-3, -12, 7, 4, OUT); R(-2, -11, 5, 3, '#2E5A4A'); R(-2, -12, 5, 1, '#FFFFFF'); R(-4, -8, 9, 1, '#FFFFFF'); }   // apsnigtos eglės
  else if (w === 4) { const c2 = v < .5 ? W.acc : W.acc2, hh = 9 + Math.floor(v * 8); R(-2, -hh, 5, hh + 1, OUT); R(-1, -hh + 1, 3, hh - 1, c2); R(-1, -hh + 1, 1, hh - 1, '#FFFFFF'); R(0, -hh - 1, 1, 2, OUT); R(2, -6, 4, 7, OUT); R(3, -5, 2, 5, c2); R(-6, -4, 4, 5, OUT); R(-5, -3, 2, 3, c2); }   // kristalų spiečiai
  else { if (v < .4) { R(-7, -1, 15, 5, OUT); R(-6, 0, 13, 3, W.acc); R(-4, 0, 5, 1, W.acc2); } else if (v < .8) { R(-3, -12, 7, 13, OUT); R(-2, -11, 5, 12, '#3A1210'); R(-2, -11, 1, 12, '#5A1E14'); R(-1, -13, 3, 2, OUT); } else { R(-2, -6, 5, 7, OUT); R(-1, -5, 3, 5, '#5A5A66'); R(-1, -9, 3, 4, '#FF7A2A'); R(0, -10, 1, 2, '#FFE07A'); } }   // lavos baseinai, uolos, žarijų dubenys
}
function nodeOpen(n) { return n < LEVELS.length && n < save.unlocked; }
function drawMapScreen(dt) {
  const W = WORLD[mapW], N = mapNodes(mapW);
  ctx.drawImage(mapBg(mapW), 0, 0); ambStep(W, dt); ambDraw(W);
  /* pilis gale (velniūkščio) */
  const [cxp, cyp] = N[9]; castle(cxp, cyp - 6, W);
  /* lygių akmenys */
  N.forEach(([x, y], i) => { const n = mapW * 10 + i, open = nodeOpen(n), d = n < LEVELS.length ? save.done[LEVELS[n].id] : undefined, cur = i === mapSel;
    if (i === 9) return;
    ctx.fillStyle = OUT; ctx.fillRect(x - 7, y - 4, 15, 11); ctx.fillRect(x - 6, y - 5, 13, 13);
    ctx.fillStyle = open ? (d !== undefined ? '#FFD45A' : W.node) : '#4A4458'; ctx.fillRect(x - 6, y - 4, 13, 10); ctx.fillRect(x - 5, y - 5, 11, 12);
    ctx.fillStyle = open ? (d !== undefined ? '#B07A1A' : W.lo) : '#2E2A38'; ctx.fillRect(x - 6, y + 4, 13, 2); ctx.fillRect(x - 5, y + 6, 11, 1);
    if (open) text(i + 1, x + 1, y - 2, 1, d !== undefined ? '#5A3A0A' : OUT, .5, null);
    else { ctx.fillStyle = '#7A7290'; ctx.fillRect(x - 2, y - 1, 5, 4); ctx.fillRect(x - 1, y - 3, 1, 2); ctx.fillRect(x + 1, y - 3, 1, 2); }
    if (d === 0) { ctx.fillStyle = '#FFF1A8'; ctx.fillRect(x + 5, y - 7, 1, 3); ctx.fillRect(x + 4, y - 6, 3, 1); }   // be mirčių - žvaigždutė
    if (cur) { const p = Math.floor(gt * 4) % 2; ctx.fillStyle = '#FFFFFF'; for (const [a, b] of [[-9, -7], [9, -7], [-9, 8], [9, 8]]) ctx.fillRect(x + a - (a < 0 ? p : -p), y + b, 2, 1); }
    button(x - 9, y - 9, 18, 18, () => mapClick(i)); });
  button(cxp - 14, cyp - 30, 28, 30, () => mapClick(9));
  /* angeliukas ant pasirinkto akmens (eina taku) */
  let ax, ay;
  if (mapWalk) { mapWalk.t += dt * 4; const k = smooth(mapWalk.t), a = N[mapWalk.from], b = N[mapWalk.to]; ax = lerp(a[0], b[0], k); ay = lerp(a[1], b[1], k) - Math.sin(k * Math.PI) * 6; if (mapWalk.t >= 1) mapWalk = null; }
  else { [ax, ay] = N[mapSel]; }
  drawHero(ax - PW / 2, ay - 6 - PH, { face: mapWalk ? Math.sign(N[mapWalk.to][0] - N[mapWalk.from][0]) || 1 : 1, sq: 0, ground: !mapWalk, run: mapWalk ? gt * 12 : 0 });
  /* velniūkštis sklando virš žemėlapio ir kas kelias sekundes nusijuokia */
  if (!mapDev) mapDev = { x: 300, y: 70, vx: 0, vy: 0, t: 0, mood: 'idle', moodT: 0, say: '', sayT: 0, ha: [], face: -1 };
  const d = mapDev; d.t += dt; d.moodT -= dt; d.sayT -= dt; mapLaughT -= dt; if (d.moodT <= 0) d.mood = 'idle';
  if (mapLaughT <= 0) { mapLaughT = rnd(5, 9); d.mood = 'laugh'; d.moodT = 1.4; d.say = TR('laugh'); d.sayT = 1.4; sfx('laugh'); }
  const gx = d.mood === 'laugh' ? ax + (ax > 240 ? -40 : 30) : 240 + Math.sin(d.t * .4) * 170, gy = d.mood === 'laugh' ? ay - 60 : 66 + Math.sin(d.t * 1.1) * 14;
  d.vx += ((gx - d.x) * 6 - d.vx * 4) * dt; d.vy += ((gy - d.y) * 6 - d.vy * 4) * dt; d.x += d.vx * dt; d.y += d.vy * dt; if (Math.abs(d.vx) > 8) d.face = Math.sign(d.vx);
  if (d.mood === 'laugh' && Math.random() < dt * 5) d.ha.push({ x: d.x + rnd(0, 16), y: d.y - 2, t: .7 }); for (const h of d.ha) { h.t -= dt; h.y -= 26 * dt; } d.ha = d.ha.filter(h => h.t > 0);
  const keep = Object.assign({}, devil); Object.assign(devil, d); drawDevilActor(); Object.assign(devil, keep);
  /* antraštė: pasaulio pavadinimas, perjungimas */
  ctx.fillStyle = OUT; ctx.fillRect(118, 5, 244, 33); ctx.fillRect(110, 12, 8, 20); ctx.fillRect(362, 12, 8, 20);   // juosta su kaspinų galais
  ctx.fillStyle = W.deep; ctx.fillRect(111, 13, 7, 18); ctx.fillRect(362, 13, 7, 18); ctx.fillStyle = COL.panel; ctx.fillRect(119, 6, 242, 31); ctx.fillStyle = W.node; ctx.fillRect(119, 6, 242, 1); ctx.fillRect(119, 36, 242, 1);
  text(T('wn')[mapW], 240, 10, fitSc(T('wn')[mapW], 224, 2), W.node, .5); text(T('world') + ' ' + (mapW + 1) + ' / ' + WN, 240, 27, 1, COL.dim, .5);
  if (mapW > 0) btn(80, 10, 24, 24, '<', COL.panel2, () => mapWorld(-1), 2);
  if (mapW < WN - 1) btn(376, 10, 24, 24, '>', COL.panel2, () => mapWorld(1), 2);
  btn(8, 8, 60, 20, T('menu'), COL.panel2, () => wipe(() => { state = 'title'; }), 1); iconBtn(GW - 30, 8, 'gear', () => openSettings('map'));
  /* apačioje: pasirinktas lygis ir ŽAISTI */
  const n = mapW * 10 + mapSel, open = nodeOpen(n);
  panel(8, GH - 30, 150, 22, COL.panel); text(T('level') + ' ' + lvName(n), 16, GH - 24, 1, COL.txt, 0);
  if (n < LEVELS.length && save.done[LEVELS[n].id] !== undefined) { skull(116, GH - 25); text(save.done[LEVELS[n].id], 129, GH - 24, 1, COL.acc, 0); }
  if (open) btn(GW - 110, GH - 32, 102, 26, T('play'), '#7A4A16', () => startLevelWipe(n), 2);
  else if (n >= LEVELS.length) text(T('soon'), GW - 60, GH - 24, 1, COL.dim, .5);
  stepParticles(mapFx, dt); drawParticles(mapFx);
}
function castle(x, y, W) {   // velniūkščio pilis su vėliava - kiekvieno pasaulio pabaiga
  const R = (a, b, w, h, c) => { ctx.fillStyle = c; ctx.fillRect(x + a, y + b, w, h); };
  R(-13, -22, 27, 24, OUT); R(-12, -21, 25, 22, '#3A2A3A'); R(-12, -21, 25, 2, '#5A4256');
  for (let i = 0; i < 4; i++) R(-13 + i * 7, -26, 5, 5, OUT), R(-12 + i * 7, -25, 3, 4, '#3A2A3A');
  R(-3, -9, 7, 11, OUT); R(-2, -8, 5, 10, '#120A10'); R(-7, -16, 3, 3, '#FFB45A'); R(5, -16, 3, 3, '#FFB45A');
  const f = Math.floor(gt * 4) % 2; R(0, -40, 1, 15, OUT); R(1, -40, 7, 5, '#D9362F'); R(1 + 7, -39 + f, 2, 3, '#D9362F');
}
function mapClick(i) {
  const n = mapW * 10 + i; if (i === mapSel && !mapWalk) { if (nodeOpen(n)) startLevelWipe(n); return; }
  if (!nodeOpen(n)) { sfx('nope'); return; }
  mapWalk = { from: mapSel, to: i, t: 0 }; mapSel = i; sfx('step');
}
function mapMove(d) { const i = mapSel + d; if (i < 0 || i > 9) { if (i > 9 && mapW < WN - 1 && nodeOpen((mapW + 1) * 10)) mapWorld(1); else if (i < 0 && mapW > 0) mapWorld(-1); return; } if (!nodeOpen(mapW * 10 + i)) { sfx('nope'); return; } mapWalk = { from: mapSel, to: i, t: 0 }; mapSel = i; sfx('step'); }
function mapWorld(d) { const w = mapW + d; if (w < 0 || w >= WN) return; wipe(() => { mapW = w; mapSel = 0; mapWalk = null; while (mapSel < 9 && nodeOpen(w * 10 + mapSel + 1)) mapSel++; }); }
function startLevelWipe(n) { wipe(() => playLevel(n)); }

/* ---------- Įžanga ---------- */
let introT = 0;
function drawIntro(dt) {
  introT += dt; ctx.fillStyle = WORLD[0].bg; ctx.fillRect(0, 0, GW, GH);
  const k = smooth(introT / .35), s = introT < .35 ? 9 : 7;
  ctx.globalAlpha = k; drawLogo(240, 90 - (s - 7) * 6, s, gt); ctx.globalAlpha = 1;
  if (introT > .7) { const p = smooth((introT - .7) / .3); drawDevil(232, 210 - Math.round(p * 46), introT > 1.15 ? 'laugh' : 'smirk', gt, { fly: true }); }
  if (introT > 1.2 && introT - dt <= 1.2) sfx('laugh');
  return bootDone && (introT > 2.3 || anyInput && introT > .3);
}
function drawWorldClear(dt) {
  const w = clamp(Math.floor(LV / 10), 0, WN - 1); ctx.drawImage(mapBg(w), 0, 0); ctx.fillStyle = 'rgba(7,6,11,.55)'; ctx.fillRect(0, 0, GW, GH);
  text(T('worldClear'), 240, 50, 3, COL.acc, .5); drawDevil(232, 100, 'angry', gt, { fly: true });
  if (Math.random() < dt * 20) mapFx.push({ k: 'star', x: rnd(40, 440), y: rnd(20, 120), vx: 0, vy: 30, t: .8, max: .8 }); stepParticles(mapFx, dt); drawParticles(mapFx);
  btn(180, 170, 120, 26, T('map'), '#7A4A16', openMap, 2, 0);
}
