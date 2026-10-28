/* game: lygio būsena, veikėjo fizika (fiksuotas žingsnis 1/120 s), spąstai, mirtis ir prisikėlimas, vaiduoklių įrašas.
   Lygio žemėlapis - 30×17 simbolių (žr. js/levels.js): # žemė, ^ v < > spygliai, P startas, D durys (apatinė plytelė), S spyruoklė,
   = ledas (slidu), ~ plūstantis smėlis (traukia žemyn), % lava, a-z - spąstų grupės plytelės, 1-9 - žymekliai (durims, pjūklams, šaudyklėms, portalams). */
'use strict';
const PW = 10, PH = 13;   // veikėjo dėžė (px)
const PHY = { run: 118, accG: 1500, accA: 1150, fric: 1900, jumpV: 292, gUp: 960, gDown: 1850, gCut: 2600, fall: 400, coyote: .085, buffer: .11, spring: 430 };
const DT = 1 / 120;

let L = null;          // dabartinio lygio būsena
let LV = 0;            // lygio indeksas LEVELS masyve
let pl = null;         // veikėjas
const fx = [];         // dalelės
let shake = 0, flash = 0;

/* ---------- Lygio paruošimas: viskas iš duomenų, todėl po mirties - tiesiog sukuriama iš naujo ---------- */
function buildLevel(i, keep) {
  const D = LEVELS[i], m = D.map.map(r => r.padEnd(COLS, ' '));
  const S = { def: D, grid: [], kind: [], marks: {}, door: null, spawn: [2, 15], traps: [], bodies: [], falling: [], saws: [], pops: [], spikes: [], springs: [], rise: null,
    ice: new Set(), sand: new Set(), lava: [], shooters: [], shots: [], jets: [], portals: [], wind: 0, windT: 0, cq: [],
    grav: 1, mirror: false, t: 0, graves: keep ? keep.graves : [], ghosts: keep ? keep.ghosts : [], deaths: keep ? keep.deaths : 0, rec: [], won: false };
  const group = {};
  for (let r = 0; r < ROWS; r++) { S.grid.push([]); S.kind.push([]);
    for (let c = 0; c < COLS; c++) { const ch = m[r] ? m[r][c] : ' '; let solid = 0, k = '';
      if (ch === '#') solid = 1;
      else if (ch === '=') { solid = 1; S.ice.add(c + r * COLS); }
      else if (ch === '~') S.sand.add(c + r * COLS);
      else if (ch === '%') S.lava.push([c, r]);
      else if ('^v<>'.includes(ch)) S.spikes.push({ c, r, d: ch });
      else if (ch === 'P') S.spawn = [c, r];
      else if (ch === 'D') S.door = { c, r, x: c * TS, y: (r - 1) * TS, tx: c * TS, ty: (r - 1) * TS, mimic: false, open: 0 };
      else if (ch === 'S') S.springs.push({ c, r, t: 0 });
      else if (ch >= '1' && ch <= '9') S.marks[ch] = [c, r];
      else if (ch >= 'a' && ch <= 'z') { (group[ch] = group[ch] || []).push([c, r]); k = ch; }
      S.grid[r].push(solid); S.kind[r].push(k); } }
  /* spąstų grupės: kokia plytelė pradžioje (kieta / nematoma / tuščia) - pagal spąstų rūšį */
  for (const T of D.traps || []) {
    const t = Object.assign({ fired: false, timer: -1 }, T); t.tiles = T.g ? group[T.g] || [] : []; S.traps.push(t);
    for (const [c, r] of t.tiles) {
      if (T.k === 'fall' || T.k === 'hidden' || T.k === 'crumble') S.grid[r][c] = T.k === 'hidden' ? 2 : 1;   // 2 - kieta, bet nematoma, kol neatsitrenki
      else if (T.k === 'icicle' || T.k === 'mover') S.grid[r][c] = 0;
      else if (T.k === 'ghost') S.grid[r][c] = 0;
      else if (T.k === 'slide') S.grid[r][c] = 0;
      else if (T.k === 'appear' || T.k === 'pop') S.grid[r][c] = 0; }
    if (T.k === 'slide' || T.k === 'mover') S.bodies.push(t.body = { tiles: t.tiles.slice(), ox: 0, oy: 0, tx: 0, ty: 0, sp: (T.sp || (T.k === 'mover' ? 2.5 : 8)) * TS, trap: t, vis: true, loop: T.k === 'mover', ax: (T.dx || 0) * TS, ay: (T.dy || 0) * TS });
    if (T.k === 'icicle') t.hang = true;
    if (T.k === 'ghost') t.look = true;
  }
  /* sujungtos grupės plytelės be spąstų (pvz. dekoracija) - tiesiog žemė */
  for (const g in group) if (!S.traps.some(t => t.g === g)) for (const [c, r] of group[g]) S.grid[r][c] = 1;
  return S;
}
function startLevel(i, keep) {
  LV = i; L = buildLevel(i, keep); fx.length = 0;
  const [c, r] = L.spawn;
  pl = { x: c * TS + 3, y: r * TS + TS - PH, vx: 0, vy: 0, ground: true, coyote: 0, buf: 0, face: 1, dead: 0, sq: 0, st: 0, step: 0, air: 0, wasG: true, win: 0 };
  for (const t of L.traps) if (t.on === 'start') fire(t);
}
function respawn() { startLevel(LV, L); }

/* ---------- Kietumas: statinės plytelės + slenkantys kūnai ---------- */
const cellSolid = (c, r) => c < 0 || c >= COLS ? true : r < 0 || r >= ROWS ? false : L.grid[r][c] > 0;
function bodyRects() { const o = []; for (const b of L.bodies) for (const [c, r] of b.tiles) o.push([c * TS + b.ox, r * TS + b.oy, TS, TS, b]); return o; }
function hitSolid(x, y, w, h) {
  const c0 = Math.floor(x / TS), c1 = Math.floor((x + w - .001) / TS), r0 = Math.floor(y / TS), r1 = Math.floor((y + h - .001) / TS);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (cellSolid(c, r)) return { c, r };
  for (const q of bodyRects()) if (x < q[0] + q[2] && x + w > q[0] && y < q[1] + q[3] && y + h > q[1]) return { body: q[4], q };
  return null;
}
const overlap = (a, b) => a[0] < b[0] + b[2] && a[0] + a[2] > b[0] && a[1] < b[1] + b[3] && a[1] + a[3] > b[1];

/* ---------- Valdymas ---------- */
function input() {
  let x = (keys.KeyD || keys.ArrowRight || tb.right ? 1 : 0) - (keys.KeyA || keys.ArrowLeft || tb.left ? 1 : 0);
  if (!x && PAD) x = Math.sign(PAD.x);
  const j = !!(keys.Space || keys.KeyW || keys.ArrowUp || keys.KeyZ || tb.jump || PAD && PAD.jump);
  return { x: L.mirror ? -x : x, j };
}
let jumpPrev = false;

/* ---------- Žingsnis ---------- */
function step(dt) {
  L.t += dt;
  if (pl.dead > 0) { pl.dead -= dt; if (pl.dead <= 0) respawn(); stepFx(dt); return; }
  if (pl.win > 0) { pl.win += dt; stepFx(dt); stepDoor(dt); return; }
  const inp = input(), jp = inp.j && !jumpPrev; jumpPrev = inp.j;
  if (jp) { pl.buf = PHY.buffer; for (const t of L.traps) if (t.on === 'jump' && !t.fired) fire(t); }
  const g = L.grav;
  /* horizontalus judėjimas: greitas įsibėgėjimas, staigus sustojimas - valdymas turi būti tikslus */
  const onIce = pl.ground && L.grav > 0 && L.ice.has(Math.floor((pl.x + PW / 2) / TS) + Math.floor((pl.y + PH + 1) / TS) * COLS), inSand = sandTop() >= 0;
  const acc = (pl.ground ? PHY.accG : PHY.accA) * (onIce ? .28 : 1), top = inSand ? 42 : PHY.run;
  if (inp.x) { const nv = pl.vx + inp.x * acc * dt; pl.vx = Math.abs(nv) > top && Math.sign(nv) === inp.x ? inp.x * Math.max(top, Math.abs(pl.vx) - 900 * dt) : nv; pl.face = inp.x; }   // virš ribos (vėjas, ledas) - lėtėja iki jos
  else { const f = (pl.ground ? PHY.fric * (onIce ? .05 : 1) : PHY.fric * .55) * dt; pl.vx = Math.abs(pl.vx) <= f ? 0 : pl.vx - Math.sign(pl.vx) * f; }
  if (L.wind) { pl.vx = clamp(pl.vx + L.wind * dt, -PHY.run * 1.6, PHY.run * 1.6); if (Math.random() < dt * 30) fx.push({ k: 'wind', x: L.wind > 0 ? -4 : GW + 4, y: rnd(0, GH), vx: L.wind * .9, vy: 0, t: 1.2, max: 1.2 }); }
  pl.onIce = onIce; pl.inSand = inSand;
  /* šuolis: kojotės laikas, buferis, kintamas aukštis */
  pl.coyote = pl.ground || inSand ? PHY.coyote : pl.coyote - dt; pl.buf -= dt;
  if (pl.buf > 0 && pl.coyote > 0) { pl.vy = -PHY.jumpV * g * (inSand ? .62 : 1); pl.buf = 0; pl.coyote = 0; pl.ground = false; pl.sq = -1; sfx('jump'); dust(pl.x + PW / 2, g > 0 ? pl.y + PH : pl.y, 4); }
  pl.spr = (pl.spr || 0) - dt; const up = pl.vy * g < 0, gv = up ? (inp.j || pl.spr > 0 ? PHY.gUp : PHY.gCut) : PHY.gDown;   // po spyruoklės - visas aukštis
  pl.vy += gv * g * dt; if (pl.vy * g > PHY.fall) pl.vy = PHY.fall * g;
  if (inSand && pl.vy * g > 16) pl.vy = 16 * g;   // smėlis lėtai traukia žemyn
  /* judėjimas ašimis atskirai */
  moveX(pl.vx * dt); const wasG = pl.ground; pl.ground = false; moveY(pl.vy * dt);
  if (pl.ground && !wasG && pl.air > .12) { pl.sq = 1; sfx('land'); dust(pl.x + PW / 2, g > 0 ? pl.y + PH : pl.y, 5); }
  pl.air = pl.ground ? 0 : pl.air + dt; if (pl.ground && L.grav > 0) pl.lastG = [pl.x + PW / 2, pl.y + PH];
  if (pl.ground && Math.abs(pl.vx) > 20) { pl.step += dt * 9; if (pl.step > 1) { pl.step = 0; sfx('step'); } }
  pl.sq *= Math.exp(-dt * 14); pl.st += dt;
  if (pl.y > GH + 20 || pl.y < -40) return die('fall');
  const st = sandTop(); if (st >= 0 && pl.y > st + 3) return die('sand');   // paskendo smėlyje
  stepTraps(dt); if (pl.dead) return;
  stepHazards(dt); if (pl.dead) return;
  stepDoor(dt); stepFx(dt);
  if (L.rec.length < 1800 && (Math.round(L.t * 120) % 4 === 0)) L.rec.push([Math.round(pl.x), Math.round(pl.y), pl.face, pl.ground ? 0 : 1]);   // vaiduoklio įrašas (30 k/s)
}
function moveX(d) {
  if (!d) return; const s = Math.sign(d); let left = Math.abs(d);
  while (left > 0) { const k = Math.min(1, left); left -= k; const nx = pl.x + s * k;
    if (hitSolid(nx, pl.y, PW, PH)) { pl.vx = 0; break; } pl.x = nx; }
}
function moveY(d) {
  if (!d) return; const s = Math.sign(d), g = L.grav; let left = Math.abs(d);
  while (left > 0) { const k = Math.min(1, left); left -= k; const ny = pl.y + s * k, h = hitSolid(pl.x, ny, PW, PH);
    if (h) { if (s === g) { pl.ground = true; touchTiles(h); } else { bonk(h); } pl.vy = 0; break; }
    pl.y = ny; }
}
/* plūstančio smėlio paviršius (px), jei veikėjas jame; kitaip -1 */
function sandTop() {
  if (!L.sand.size) return -1; let top = -1;
  const c0 = Math.floor(pl.x / TS), c1 = Math.floor((pl.x + PW - 1) / TS), r0 = Math.floor((pl.y + 3) / TS), r1 = Math.floor((pl.y + PH - 1) / TS);
  for (let r = r0; r <= r1; r++) for (let c = c0; c <= c1; c++) if (L.sand.has(c + r * COLS)) { let rr = r; while (rr > 0 && L.sand.has(c + (rr - 1) * COLS)) rr--; const y = rr * TS; if (top < 0 || y < top) top = y; }
  return top;
}
/* stovint ant grupės plytelių - „touch" spąstai (trupančios grindys) */
function touchTiles(h) {
  if (h.c === undefined) return; const k = L.kind[h.r][h.c]; if (!k) return;
  for (const t of L.traps) if (t.g === k && t.on === 'touch') {
    if (t.each) { const key = h.c + h.r * COLS; if (L.grid[h.r][h.c] === 1 && !L.cq.some(q => q.key === key)) L.cq.push({ key, c: h.c, r: h.r, t: t.delay || .25 }); }   // trupa tik paliestos plytelės
    else if (!t.fired) fire(t); }
}
/* galva į nematomą bloką - jis pasirodo */
function bonk(h) {
  if (h.c === undefined) return; if (L.grid[h.r][h.c] === 2) { L.grid[h.r][h.c] = 1; sfx('thud'); puff(h.c * TS + 8, h.r * TS + 8, '#C9B8FF'); devilSay('heh'); }
  touchTiles(h);
}

/* ---------- Spąstai ---------- */
function trig(t) {
  if (t.fired || t.timer >= 0) return false;
  if (t.req && !L.traps.some(u => u.id === t.req && u.fired)) return false;   // grandinė: tik po kitų spąstų
  const cxp = (pl.x + PW / 2) / TS, cyp = (pl.y + PH / 2) / TS;
  if (Array.isArray(t.on)) { const [c0, r0, c1, r1] = t.on; return cxp >= c0 && cxp < c1 + 1 && cyp >= r0 && cyp < r1 + 1; }
  if (t.on === 'door' && L.door) return Math.hypot(pl.x + PW / 2 - (L.door.x + 8), pl.y + PH / 2 - (L.door.y + 16)) < (t.dist || 2.4) * TS;
  if (t.on === 'time') return L.t >= (t.at || 0);
  return false;
}
function fire(t) { if (t.fired || t.timer >= 0) return; t.timer = t.delay || 0; }
function stepTraps(dt) {
  for (const t of L.traps) {
    if (trig(t)) fire(t);
    if (t.timer >= 0 && !t.fired) { t.timer -= dt; t.shake = t.timer; if (t.timer <= 0) { t.fired = true; act(t); for (const u of L.traps) if (u.after === t.id) fire(u); } }
  }
  /* slenkantys kūnai: juda link taikinio; ant jų stovintis veikėjas važiuoja kartu; suspaustas - žūva */
  for (const b of L.bodies) {
    const dx = b.tx - b.ox, dy = b.ty - b.oy, d = Math.hypot(dx, dy); if (d < .01) continue;
    const st = Math.min(d, b.sp * dt), mx = dx / d * st, my = dy / d * st;
    const onTop = pl.ground && bodyRects().some(q => q[4] === b && pl.x < q[0] + q[2] && pl.x + PW > q[0] && Math.abs((L.grav > 0 ? pl.y + PH : pl.y) - (L.grav > 0 ? q[1] : q[1] + TS)) < 1.5);
    b.ox += mx; b.oy += my;
    if (onTop) { pl.x += mx; pl.y += my; }
    const rs = bodyRects().filter(q => q[4] === b);
    for (const q of rs) if (overlap([pl.x, pl.y, PW, PH], q)) {
      /* stumia: bandome išstumti judėjimo kryptimi, nepavyko - suspaudė */
      pl.x += mx; pl.y += my;
      if (hitSolid(pl.x, pl.y, PW, PH)) {
        if (Math.abs(mx) > Math.abs(my)) pl.x = mx > 0 ? q[0] + q[2] : q[0] - PW; else pl.y = my > 0 ? q[1] + q[3] : q[1] - PH;
        if (hitSolid(pl.x, pl.y, PW, PH)) return die('crush');
      }
      break; }
    if (Math.hypot(b.tx - b.ox, b.ty - b.oy) < .01 && b.thud) { b.thud = false; sfx('thud'); shake = Math.max(shake, .18); }
    if (b.loop && b.going && Math.hypot(b.tx - b.ox, b.ty - b.oy) < .01) { const back = b.tx === b.ax && b.ty === b.ay; b.tx = back ? 0 : b.ax; b.ty = back ? 0 : b.ay; }
  }
  /* krentantys blokai */
  for (const f of L.falling) { f.vy = Math.min(520, f.vy + 1500 * dt); f.y += f.vy * dt;
    if (f.deadly && overlap([pl.x + 1, pl.y + 1, PW - 2, PH - 2], [f.x + 1, f.y + 2, TS - 2, TS - 2]) && f.y < pl.y) return die('crush');
    const c = Math.round(f.x / TS), r = Math.floor((f.y + TS) / TS);   /* nusileidžia ant žemės ir lieka kliūtimi */
    if (f.land && r < ROWS && cellSolid(c, r) && f.y + TS >= r * TS) { f.y = (r - 1) * TS; if (r - 1 >= 0) L.grid[r - 1][c] = 1; f.gone = true; sfx('thud'); shake = Math.max(shake, .15); dust(f.x + 8, f.y + 16, 4);
      if (overlap([pl.x, pl.y, PW, PH], [f.x, f.y, TS, TS])) return die('crush'); } }
  L.falling = L.falling.filter(f => !f.gone && f.y < GH + 30);
  /* po vieną trupančios plytelės */
  for (const q of L.cq) { q.t -= dt; if (q.t <= 0 && !q.done) { q.done = true; L.grid[q.r][q.c] = 0; L.falling.push({ x: q.c * TS, y: q.r * TS, vy: 40 }); sfx('crumble'); } }
  /* varvekliai: krenta, mirtini, sudūžta į žemę */
  for (const f of L.falling) if (f.ice && cellSolid(Math.round(f.x / TS), Math.floor((f.y + 12) / TS))) { f.gone = true; sfx('crumble'); for (let i = 0; i < 6; i++) fx.push({ k: 'px', x: f.x + 8, y: f.y + 10, vx: rnd(-60, 60), vy: rnd(-90, -20), t: .4, max: .4, c: '#DDF4FF', g: 1 }); }
  /* šaudyklės ir strėlės */
  for (const s of L.shooters) { s.t -= dt; if (s.t <= 0) { s.t += s.per; const [vx, vy] = DIRV[s.d]; L.shots.push({ x: s.c * TS + 8 + vx * 8, y: s.r * TS + 8 + vy * 8, vx: vx * s.sp, vy: vy * s.sp, d: s.d }); sfx('shoot'); } }
  for (const a of L.shots) { a.x += a.vx * dt; a.y += a.vy * dt; if (cellSolid(Math.floor(a.x / TS), Math.floor(a.y / TS)) || a.x < -8 || a.x > GW + 8 || a.y < -8 || a.y > GH + 8) a.gone = true;
    else if (overlap([pl.x, pl.y, PW, PH], [a.x - 3, a.y - 2, 6, 4])) return die('arrow'); }
  L.shots = L.shots.filter(a => !a.gone);
  /* ugnies srovės: įjungta / išjungta pagal ciklą */
  for (const j of L.jets) { j.t = (j.t + dt) % (j.on + j.off); j.hot = j.t < j.on; j.warn = !j.hot && j.t > j.on + j.off - .35;
    if (j.hot) { const [vx, vy] = DIRV[j.d], len = j.len * TS, x0 = j.c * TS + 8, y0 = j.r * TS + 8, bx = vx ? (vx > 0 ? x0 + 8 : x0 - 8 - len) : x0 - 4, by = vy ? (vy > 0 ? y0 + 8 : y0 - 8 - len) : y0 - 4;
      if (overlap([pl.x, pl.y, PW, PH], [bx, by, vx ? len : 8, vy ? len : 8])) return die('fire'); } }
  /* portalai */
  for (const q of L.portals) { q.cd -= dt; const a = L.marks[q.from], b = L.marks[q.to]; if (!a || !b || q.cd > 0) continue;
    if (overlap([pl.x, pl.y, PW, PH], [a[0] * TS + 3, a[1] * TS - 10, 10, 26])) { pl.x = b[0] * TS + 3; pl.y = b[1] * TS + TS - PH; q.cd = .5; for (const r of L.portals) if (r.from === q.to) r.cd = .5; sfx('flip'); puff(pl.x + 5, pl.y + 6, '#5AF0E0'); } }
  if (L.windT > 0) { L.windT -= dt; if (L.windT <= 0) L.wind = 0; }
  /* pjūklai */
  for (const s of L.saws) { const dx = s.tx - s.x, dy = s.ty - s.y, d = Math.hypot(dx, dy);
    if (s.chase) { const ax = pl.x + PW / 2 - s.x, ay = pl.y + PH / 2 - s.y, ad = Math.hypot(ax, ay) || 1; s.x += ax / ad * s.sp * dt; s.y += ay / ad * s.sp * dt; }
    else if (d > 1) { const st = Math.min(d, s.sp * dt); s.x += dx / d * st; s.y += dy / d * st; }
    else if (s.loop) { [s.tx, s.ty, s.fx, s.fy] = [s.fx, s.fy, s.tx, s.ty]; }
    s.a += dt * 14; if (Math.random() < dt * 8) sfx('saw');
    if (Math.hypot(pl.x + PW / 2 - s.x, pl.y + PH / 2 - s.y) < s.r + 4) return die('saw'); }
  /* kylantys spygliai (visa apačia) */
  if (L.rise) { L.rise.y -= L.rise.sp * dt; if (pl.y + PH > L.rise.y + 4) return die('spike'); }
  for (const p of L.pops) p.k = Math.min(1, p.k + dt * 14);
}
const DIRV = { '>': [1, 0], '<': [-1, 0], '^': [0, -1], 'v': [0, 1] };
function act(t) {
  const M = L.marks;
  switch (t.k) {
    case 'fall': case 'crumble':
      for (const [c, r] of t.tiles) { L.grid[r][c] = 0; L.falling.push({ x: c * TS, y: r * TS, vy: t.k === 'crumble' ? 40 : 0, deadly: t.k === 'fall', land: t.k === 'fall', g: t.g }); }
      sfx(t.k === 'fall' ? 'thud' : 'crumble'); if (t.k === 'fall') shake = Math.max(shake, .12); break;
    case 'slide': t.body.tx = (t.dx || 0) * TS; t.body.ty = (t.dy || 0) * TS; t.body.thud = !!t.thud; sfx('trap'); break;
    case 'pop': for (const [c, r] of t.tiles) L.pops.push({ c, r, d: t.dir || '^', k: 0 }); sfx('spike'); break;
    case 'appear': for (const [c, r] of t.tiles) { L.grid[r][c] = 1; puff(c * TS + 8, r * TS + 8, '#C9B8FF'); } sfx('thud'); break;
    case 'vanish': for (const [c, r] of t.tiles) { L.grid[r][c] = 0; puff(c * TS + 8, r * TS + 8, '#8A7FA8'); } sfx('crumble'); break;
    case 'door': { const m = M[t.to]; if (m && L.door) { L.door.tx = m[0] * TS; L.door.ty = (m[1] - 1) * TS; } sfx('trap'); break; }
    case 'mimic': if (L.door) { L.door.mimic = true; sfx('grr'); } if (t.to && M[t.to]) L.real = { x: M[t.to][0] * TS, y: (M[t.to][1] - 1) * TS, k: 0 }; break;
    case 'saw': { const a = M[t.from], b = M[t.to] || a; if (a) L.saws.push({ x: a[0] * TS + 8, y: a[1] * TS + 8, fx: a[0] * TS + 8, fy: a[1] * TS + 8, tx: b[0] * TS + 8, ty: b[1] * TS + 8, sp: (t.sp || 6) * TS, r: t.r || 7, a: 0, loop: !!t.loop, chase: !!t.chase }); sfx('saw'); break; }
    case 'flip': L.grav = -L.grav; sfx('flip'); flash = .15; break;
    case 'mirror': L.mirror = !L.mirror; sfx('flip'); devilSay('mirror'); break;
    case 'rise': L.rise = { y: GH + 4, sp: (t.sp || 1.2) * TS, lava: !!t.lava }; sfx('trap'); break;
    case 'say': devilSay(t.say); break;
    case 'mover': t.body.tx = t.body.ax; t.body.ty = t.body.ay; t.body.going = true; break;
    case 'icicle': t.hang = false; for (const [c, r] of t.tiles) L.falling.push({ x: c * TS, y: r * TS, vy: 60, deadly: true, ice: true }); sfx('crumble'); break;
    case 'shoot': { const m = M[t.from]; if (m) L.shooters.push({ c: m[0], r: m[1], d: t.dir || '>', per: t.per || 1.2, t: t.first ?? .3, sp: (t.sp || 9) * TS }); break; }
    case 'jet': { const m = M[t.from]; if (m) L.jets.push({ c: m[0], r: m[1], d: t.dir || '^', on: t.on2 || .9, off: t.off || 1.3, t: t.ph || 0, len: t.len || 3, hot: false }); break; }
    case 'wind': L.wind = (t.force || 420) * (t.dir === '<' ? -1 : 1); L.windT = t.dur || 0; sfx('whoosh'); break;
    case 'portal': L.portals.push({ id: t.pid || t.from, from: t.from, to: t.to, cd: 0 }); if (t.both) L.portals.push({ id: (t.pid || t.from) + 'b', from: t.to, to: t.from, cd: 0 }); break;
    case 'retarget': for (const q of L.portals) if (q.from === t.from) q.to = t.to; sfx('flip'); break;
  }
  if (t.say && t.k !== 'say') devilSay(t.say);
  else if (t.k !== 'say' && t.k !== 'mirror') devil.smirk = .8;
  if (t.on === 'start' || t.quiet) return;   // nuolatiniai mechanizmai - be velniūkščio dėmesio
  const tc = t.tiles && t.tiles[0]; devilPoint(tc ? tc[0] * TS + 8 : pl.x, tc ? tc[1] * TS : pl.y);   // smigsta pažiūrėti
}

/* ---------- Pavojai: spygliai, iššokę spygliai, spyruoklės, durys ---------- */
const spikeBox = (c, r, d) => d === '^' ? [c * TS + 2, r * TS + 9, 12, 7] : d === 'v' ? [c * TS + 2, r * TS, 12, 7] : d === '<' ? [c * TS, r * TS + 2, 7, 12] : [c * TS + 9, r * TS + 2, 7, 12];
function stepHazards(dt) {
  const me = [pl.x, pl.y, PW, PH];
  for (const s of L.spikes) if (overlap(me, spikeBox(s.c, s.r, s.d))) return die('spike');
  for (const [c, r] of L.lava) if (overlap(me, [c * TS, r * TS + 6, TS, 10])) return die('lava');
  for (const p of L.pops) if (p.k > .5 && overlap(me, spikeBox(p.c, p.r, p.d))) return die('spike');
  for (const s of L.springs) { s.t = Math.max(0, s.t - dt); if (pl.vy * L.grav >= 0 && overlap(me, [s.c * TS + 2, s.r * TS + 10, 12, 6])) { pl.vy = -PHY.spring * L.grav; pl.ground = false; pl.coyote = 0; pl.spr = .5; s.t = .25; pl.sq = -1.2; sfx('jump'); } }
  const d = L.door; if (!d) return;
  const dr = [d.x + 3, d.y + 6, 10, 26];
  if (overlap(me, dr)) { if (d.mimic) return die('mimic'); if (Math.hypot(d.tx - d.x, d.ty - d.y) < 2) win(); }
  if (L.real && overlap(me, [L.real.x + 3, L.real.y + 6, 10, 26])) { L.door = Object.assign(d, { x: L.real.x, y: L.real.y, tx: L.real.x, ty: L.real.y, mimic: false }); L.real = null; win(); }
}
function stepDoor(dt) {
  const d = L.door; if (!d) return; const dx = d.tx - d.x, dy = d.ty - d.y, dd = Math.hypot(dx, dy);
  if (dd > .5) { const st = Math.min(dd, 22 * TS * dt); d.x += dx / dd * st; d.y += dy / dd * st; if (Math.random() < .5) dust(d.x + 8, d.y + 32, 1); }
  if (L.real) L.real.k = Math.min(1, L.real.k + dt * 3);
  if (pl.win) d.open = Math.min(1, d.open + dt * 6);
}

/* ---------- Mirtis ir pergalė ---------- */
function die(why) {
  if (pl.dead > 0 || pl.win) return; pl.dead = .62; L.deaths++; save.total = (save.total || 0) + 1;
  const k = LEVELS[LV].id; save.deaths[k] = (save.deaths[k] || 0) + 1; persist();
  const x = pl.x + PW / 2, y = pl.y + PH / 2;
  L.graves.push([...graveSpot(x, y), why]);
  L.ghosts.push(L.rec);
  for (let i = 0; i < 16; i++) { const a = rnd(0, TAU), v = rnd(60, 200); fx.push({ k: 'px', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 80, t: rnd(.3, .6), max: .6, c: pick(PAL.hero), g: 1 }); }
  for (let i = 0; i < 7; i++) { const a = rnd(0, TAU), v = rnd(40, 110); fx.push({ k: 'feather', x, y, vx: Math.cos(a) * v, vy: Math.sin(a) * v - 60, t: rnd(1, 1.6), max: 1.6, ph: rnd(0, TAU) }); }   // plunksnos
  fx.push({ k: 'halo', x, y: y - 8, vx: rnd(-40, 40), vy: -170, t: 1.2, max: 1.2 });   // aureolė iššoka
  fx.push({ k: 'ring', x, y, t: .3, max: .3 });
  shake = .22; flash = .08; sfx('die'); devilLaugh(why);
}
function win() {
  if (pl.win) return; pl.win = .001; pl.vx = 0; sfx('door');
  L.ghosts.push(L.rec); L.won = true;
  const k = LEVELS[LV].id; save.done[k] = Math.min(save.done[k] || 1e9, L.deaths); save.unlocked = Math.max(save.unlocked, LV + 2); persist();
  devilAngry();
}

/* Kapas nukrenta ant žemės po mirties vieta (ant spyglių - ant jų pagrindo); bedugnėje - ten, kur paskutinį kartą stovėjai */
function graveSpot(x, y) {
  const c = clamp(Math.floor(x / TS), 1, COLS - 2);
  for (let r = Math.max(0, Math.floor(y / TS)); r < ROWS; r++) {
    if (cellSolid(c, r) && L.grid[r][c] === 1) return [Math.round(clamp(x, 8, GW - 8)), r * TS];
    if (L.spikes.some(s => s.c === c && s.r === r && s.d === '^') || L.pops.some(p => p.c === c && p.r === r)) return [Math.round(clamp(x, 8, GW - 8)), r * TS + 16]; }
  const g = pl.lastG || [x, GH - 8]; return [Math.round(clamp(g[0], 8, GW - 8)), Math.round(g[1])];
}

/* ---------- Dalelės ---------- */
function dust(x, y, n) { for (let i = 0; i < n; i++) fx.push({ k: 'px', x: x + rnd(-4, 4), y, vx: rnd(-40, 40), vy: rnd(-30, -5) * L.grav, t: rnd(.2, .4), max: .4, c: pick(PAL.dust), g: 0 }); }
function puff(x, y, c) { for (let i = 0; i < 10; i++) { const a = rnd(0, TAU); fx.push({ k: 'px', x, y, vx: Math.cos(a) * 70, vy: Math.sin(a) * 70, t: .35, max: .35, c, g: 0 }); } }
function stepFx(dt) {
  for (const p of fx) { p.t -= dt; p.x += (p.vx || 0) * dt; p.y += (p.vy || 0) * dt; if (p.g) p.vy += 700 * dt; if (p.k === 'px') { p.vx *= Math.exp(-dt * 3); }
    if (p.k === 'feather') { p.vx = p.vx * Math.exp(-dt * 4) + Math.sin(p.t * 5 + p.ph) * 300 * dt; p.vy = Math.min(28, p.vy + 260 * dt); }   // sklando švytuodama
    if (p.k === 'halo') p.vy += 520 * dt; }
  for (let i = fx.length - 1; i >= 0; i--) if (fx[i].t <= 0) fx.splice(i, 1);
  shake = Math.max(0, shake - dt); flash = Math.max(0, flash - dt);
}
