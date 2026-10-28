/* ui: pagrindinis ciklas, įžanga, titulinis, lygių pasirinkimas, žaidimo HUD su velniūkščiu, pauzė, pergalės pakartojimas (visi bandymai vienu metu) */
'use strict';
const LEVELS = LEVELS_ALL;
const COL = { ink: OUT, panel: '#1E1828', panel2: '#2A2238', edge: '#4A3E62', txt: '#F4F1FF', dim: '#8F86A8', acc: '#FFC94A', red: '#E0443A', good: '#7FD65A' };
let state = 'boot', stT = 0, gt = 0, replay = null, bootDone = false;

/* ---------- UI elementai ---------- */
function panel(x, y, w, h, c, e) { ctx.fillStyle = OUT; ctx.fillRect(x - 1, y - 1, w + 2, h + 3); ctx.fillStyle = e || COL.edge; ctx.fillRect(x, y, w, h); ctx.fillStyle = c || COL.panel; ctx.fillRect(x + 1, y + 1, w - 2, h - 2); }
function btn(x, y, w, h, label, col, fn, sc, id) {
  const hv = hover && hover.x === x && hover.y === y, sel = padSel === id && id !== undefined;
  panel(x, y + (hv ? -1 : 0), w, h, hv || sel ? '#3A3050' : col || COL.panel2, sel ? COL.acc : COL.edge);
  ctx.fillStyle = 'rgba(255,255,255,.12)'; ctx.fillRect(x + 1, y + 1 + (hv ? -1 : 0), w - 2, 1);
  const s = fitSc(label, w - 8, sc || 1); text(label, x + w / 2, y + h / 2 - 3 * s + (hv ? -1 : 0), s, COL.txt, .5);
  button(x, y, w, h, fn, id);
}
let padSel = null;
/* NOPE! logotipas: didelės kampuotos raidės su gradientu, kontūru ir šešėliu */
const LOGO_M = {
  N: ['##...##', '###..##', '####.##', '##.####', '##..###', '##...##', '##...##'], O: ['.#####.', '##...##', '##...##', '##...##', '##...##', '##...##', '.#####.'],
  P: ['######.', '##...##', '##...##', '######.', '##.....', '##.....', '##.....'], E: ['#######', '##.....', '##.....', '#####..', '##.....', '##.....', '#######'], '!': ['##', '##', '##', '##', '##', '..', '##'],
};
const LOGO_C = ['#FFE36B', '#FFD04A', '#FFB72E', '#FF9A1F', '#FF7F1C', '#F0631E', '#D9362F'];
function drawLogo(cx, y, s, t) {
  const word = 'NOPE!', ws = [...word].map(ch => LOGO_M[ch][0].length), tot = ws.reduce((a, b) => a + b + 1, -1) * s;
  for (const pass of [0, 1, 2]) { let x = Math.round(cx - tot / 2);
    [...word].forEach((ch, i) => { const m = LOGO_M[ch], wob = Math.round(Math.sin(t * 3 + i * .9) * 1.5);
      for (let r = 0; r < 7; r++) for (let c = 0; c < m[r].length; c++) { if (m[r][c] !== '#') continue; const px = x + c * s, py = y + r * s + wob;
        if (pass === 0) { ctx.fillStyle = 'rgba(0,0,0,.5)'; ctx.fillRect(px + 2, py + 3, s, s); }
        else if (pass === 1) { ctx.fillStyle = OUT; ctx.fillRect(px - 2, py - 2, s + 4, s + 4); }
        else { ctx.fillStyle = LOGO_C[r]; ctx.fillRect(px, py, s, s); if (r === 0) { ctx.fillStyle = '#FFF6C8'; ctx.fillRect(px, py, s, 1); } } }
      x += (m[0].length + 1) * s; }); }
}
function drawTouch() {
  if (!touchUI) return; const Lt = tbLayout();
  for (const k of ['left', 'right', 'jump']) { const [x, y, w, h] = Lt[k], on = tb[k];
    ctx.globalAlpha = on ? .85 : .45; panel(x, y + (on ? 2 : 0), w, h, on ? '#4A3E62' : '#1E1828'); ctx.globalAlpha = 1;
    const cx = x + w / 2, cy = y + h / 2 + (on ? 2 : 0); ctx.fillStyle = '#F4F1FF';
    for (let i = 0; i < 10; i++) { const hw = Math.round(i * .9);
      if (k === 'left') ctx.fillRect(cx - 5 + i, cy - hw, 1, hw * 2 + 1); else if (k === 'right') ctx.fillRect(cx + 5 - i, cy - hw, 1, hw * 2 + 1); else ctx.fillRect(cx - hw, cy - 6 + i, hw * 2 + 1, 1); } }
}
function skull(x, y) { ctx.fillStyle = OUT; ctx.fillRect(x, y + 1, 9, 7); ctx.fillRect(x + 1, y, 7, 9); ctx.fillStyle = '#F4F1FF'; ctx.fillRect(x + 1, y + 1, 7, 5); ctx.fillRect(x + 2, y + 6, 5, 2); ctx.fillStyle = OUT; ctx.fillRect(x + 2, y + 3, 2, 2); ctx.fillRect(x + 5, y + 3, 2, 2); ctx.fillRect(x + 3, y + 7, 1, 1); ctx.fillRect(x + 5, y + 7, 1, 1); }
function lvName(i) { return (Math.floor(i / 10) + 1) + '-' + (i % 10 + 1); }

/* ---------- Žaidimo piešimas ---------- */
function drawPlay(dt) {
  const W = worldOf(LV); ambStep(W, dt);
  if (!L.cache || L.baked !== gridSig()) bakeLevel();
  ctx.save(); if (shake > 0) ctx.translate(Math.round(rnd(-2, 2) * shake * 8), Math.round(rnd(-2, 2) * shake * 8));
  ctx.drawImage(L.cache, 0, 0);
  for (const [x, y] of L.lights) drawTorch(x, y, gt, W);
  L.graves.forEach((g, i) => drawGrave(g[0], g[1], i, pl.dead > 0 && i === L.graves.length - 1 ? .62 - pl.dead : 9));   // naujausias kapas nukrenta
  for (const s of L.spikes) drawSpike(s.c, s.r, s.d, W);
  for (const p of L.pops) drawSpike(p.c, p.r, p.d, W, p.k);
  for (const s of L.springs) drawSpring(s, W);
  drawSandRipples(gt);
  for (const [c, r] of L.lava) drawLava(c, r, gt, !L.lava.some(q => q[0] === c && q[1] === r - 1));
  for (const t of L.traps) if (t.k === 'icicle' && t.hang) for (const [c, r] of t.tiles) drawIcicle(c, r, t.timer > 0);
  for (const s of L.shooters) drawShooter(s, W);
  for (const j of L.jets) drawJet(j, gt);
  for (const q of L.portals) { const a = L.marks[q.from]; if (a) drawPortal(a, gt, q.to === q.from ? '#FF7AE0' : '#5AF0E0'); }
  const mark = [];
  for (const b of L.bodies) for (const [c, r] of b.tiles) tileArt(ctx, c, r, Math.round(c * TS + b.ox), Math.round(r * TS + b.oy), W, { up: true, dn: true, lf: true, rt: true });
  for (const t of L.traps) if (t.timer > 0 && !t.fired && (t.k === 'fall' || t.k === 'crumble')) for (const [c, r] of t.tiles) mark.push([c, r]);   // drebėjimas prieš krentant
  for (const q of L.cq) if (!q.done) mark.push([q.c, q.r]);
  for (const [c, r] of mark) { const o = Math.floor(gt * 40) % 2 ? 1 : -1; tileArt(ctx, c, r, c * TS + o, r * TS, W, { up: !cellSolid(c, r - 1), dn: true, lf: true, rt: true }); }
  for (const f of L.falling) { if (f.ice) drawIcicle(f.x / TS, f.y / TS); else tileArt(ctx, Math.round(f.x / TS), Math.round(f.y / TS), Math.round(f.x), Math.round(f.y), W, { up: true, dn: true, lf: true, rt: true }); }
  for (const a of L.shots) drawArrow(a);
  if (L.door) drawDoor(L.door, gt, W);
  if (L.real) { ctx.globalAlpha = L.real.k; drawDoor({ x: L.real.x, y: L.real.y, open: 0 }, gt, W); ctx.globalAlpha = 1; }
  for (const s of L.saws) drawSaw(s, gt);
  if (L.rise) drawRise(L.rise, gt);
  if (pl.dead <= 0 && !(pl.win > .35)) { const blink = (gt % 3.1) < .12; drawHero(pl.x, pl.y, { face: pl.face, sq: pl.sq, run: pl.ground && Math.abs(pl.vx) > 10 ? pl.st * 12 : 0, ground: pl.ground, blink, grav: L.grav, vy: pl.vy }); }
  else if (pl.win > 0 && pl.win <= .35) { ctx.globalAlpha = 1 - pl.win / .35; drawHero(pl.x, pl.y, { face: pl.face, sq: 0, ground: true, grav: L.grav }); ctx.globalAlpha = 1; }
  drawParticles(fx);
  ambDraw(W);
  ctx.restore();
  drawDevilActor();
  if (flash > 0) { ctx.fillStyle = `rgba(255,255,255,${(flash * 3).toFixed(2)})`; ctx.fillRect(0, 0, GW, GH); }
  if (L.mirror) { const b = Math.floor(gt * 3) % 2; text('<>', 240, 22, 1, b ? COL.acc : COL.dim, .5); }
}
function drawHud() {
  /* viršuje kairėje: lygis ir mirtys; dešinėje - velniūkštis ir pauzė */
  panel(6, 5, 92, 18, COL.panel); text(T('level') + ' ' + lvName(LV), 12, 10, 1, COL.txt, 0);
  panel(102, 5, 46, 18, COL.panel); skull(108, 9); text(L.deaths, 121, 10, 1, L.deaths ? COL.acc : COL.txt, 0);
  btn(GW - 26, 5, 20, 18, 'II', COL.panel, pauseGame, 1);
  if (LV === 0 && L.t < 6 && L.deaths === 0 && !touchUI) text(T('hint'), 240, 40, 1, COL.dim, .5);
  if (L.deaths === 0 && L.t < 1.6) {   // lygio pradžia: įslenkanti juosta su numeriu ir pasaulio pavadinimu
    const k = L.t < .25 ? smooth(L.t / .25) : L.t > 1.3 ? 1 - smooth((L.t - 1.3) / .3) : 1, W = worldOf(LV), y = 112, w = Math.round(260 * k);
    ctx.fillStyle = OUT; ctx.fillRect(240 - w / 2 - 1, y - 1, w + 2, 38); ctx.fillStyle = COL.panel; ctx.fillRect(240 - w / 2, y, w, 36); ctx.fillStyle = W.node; ctx.fillRect(240 - w / 2, y, w, 1); ctx.fillRect(240 - w / 2, y + 35, w, 1);
    if (k > .8) { text(lvName(LV), 240, y + 5, 2, COL.txt, .5); const nm = T('wn')[Math.floor(LV / 10)]; text(nm, 240, y + 24, fitSc(nm, 240, 1), W.node, .5); } }
  /* po 5 mirčių - galima praleisti lygį už reklamą */
  if (L.deaths >= 5 && !pl.win) btn(152, 5, 80, 18, T('skip'), '#3A2A1A', skipLevel, 1);
  drawTouch();
}

/* ---------- Pergalės pakartojimas: visi bandymai vienu metu ---------- */
function startReplay() {
  const gh = L.ghosts.filter(g => g.length > 2);
  if (gh.length <= 1) { replay = { t: 0, max: 1.4, ghosts: [], flawless: true, cache: L.cache }; return; }
  const len = Math.max(...gh.map(g => g.length));
  replay = { t: 0, max: Math.min(8, len / 30 + .8), ghosts: gh, cache: L.cache, graves: L.graves.slice(), deaths: L.deaths };
}
function drawReplay(dt) {
  replay.t += dt; const W = worldOf(LV);
  ctx.drawImage(replay.cache, 0, 0); for (const [x, y] of L.lights) drawTorch(x, y, gt, W);
  for (const s of L.spikes) drawSpike(s.c, s.r, s.d, W);
  if (L.door) drawDoor(L.door, gt, W);
  ctx.fillStyle = 'rgba(11,10,16,.35)'; ctx.fillRect(0, 0, GW, GH);
  if (replay.flawless) { const k = Math.min(1, replay.t * 4), s = k < 1 ? 4 : 3; text(T('flawless'), 240, 110, s, COL.good, .5); }
  else {
    const f = Math.floor(replay.t * 30);
    replay.ghosts.forEach((g, i) => {
      const last = i === replay.ghosts.length - 1;
      if (f < g.length) { const [x, y, face, air] = g[f]; drawHero(x, y, { face, sq: 0, ground: !air, run: air ? 0 : f / 2.5, ghost: !last }); }
      else if (!last && f < g.length + 8) { const [x, y] = g[g.length - 1]; ctx.fillStyle = '#F4F1FF'; const R = (f - g.length) * 2; for (let a = 0; a < 8; a++) ctx.fillRect(Math.round(x + 5 + Math.cos(a) * R), Math.round(y + 6 + Math.sin(a) * R), 1, 1); }
    });
    text(T('replay'), 240, 26, 2, COL.txt, .5); skull(222, 46); text('× ' + replay.deaths, 236, 47, 1, COL.acc, 0);
  }
  if (replay.t > .6) { text(T('anyKey'), 240, GH - 22, 1, Math.floor(gt * 2) % 2 ? COL.txt : COL.dim, .5); button(0, 0, GW, GH, nextLevel); }
  if (replay.t >= replay.max) nextLevel();
}
function nextLevel() {
  if (state !== 'replay') return; state = 'wait';
  const n = LV + 1;
  Poki.commercial().then(() => {
    if (n >= LEVELS.length || n % 10 === 0) { state = 'worldClear'; stT = 0; return; }
    playLevel(n);
  });
}
function playLevel(i) { startLevel(i); state = 'play'; stT = 0; devilReset(); tbOn = true; Poki.start(); }
function skipLevel() { Poki.rewarded().then(ok => { if (ok) { save.unlocked = Math.max(save.unlocked, LV + 2); persist(); L.ghosts = []; state = 'replay'; replay = { t: 0, max: .01, ghosts: [], flawless: false, cache: L.cache }; nextLevel(); } else Poki.start(); }); }
function pauseGame() { if (state !== 'play') return; state = 'pause'; Poki.stop(); }
function resumeGame() { state = 'play'; Poki.start(); }
function onBlur() { if (state === 'play' && !pl.win && !pl.dead) pauseGame(); }

/* ---------- Ekranai (titulinis, žemėlapis, įžanga - js/screens.js) ---------- */
function startGame() { const i = Math.min(LEVELS.length - 1, Math.max(0, save.unlocked - 1)); startLevelWipe(i); }
function toggleSound() { save.sfx = !save.sfx; persist(); setVol(); }
function drawPause() {
  ctx.fillStyle = 'rgba(7,6,11,.72)'; ctx.fillRect(0, 0, GW, GH);
  text(T('paused'), 240, 54, 3, COL.txt, .5);
  btn(170, 92, 140, 28, T('resume'), '#7A4A16', resumeGame, 2, 0);
  btn(170, 128, 140, 22, T('restart'), COL.panel2, () => { respawn(); state = 'play'; Poki.start(); }, 1, 1);
  btn(170, 156, 140, 22, T('map'), COL.panel2, () => { Poki.stop(); wipe(() => { state = 'map'; mapW = Math.floor(LV / 10); mapSel = LV % 10; mapWalk = null; tbOn = false; }); }, 1, 2);
  btn(170, 184, 140, 22, T('settings'), COL.panel2, () => openSettings('pause'), 1, 3);
}
/* ---------- Klaviatūra ir pultelis meniu ---------- */
function onKey(k) {
  if (state === 'boot' || WIPE) return;
  if (state === 'settings') { if (k === 'Escape') closeSettings(); return; }
  if (state === 'map') { if (k === 'ArrowRight' || k === 'KeyD') mapMove(1); else if (k === 'ArrowLeft' || k === 'KeyA') mapMove(-1); else if (k === 'ArrowUp' || k === 'KeyW' || k === 'PageUp' || k === 'KeyE') mapWorld(1); else if (k === 'ArrowDown' || k === 'KeyS' || k === 'PageDown' || k === 'KeyQ') mapWorld(-1); else if (['Space', 'Enter', 'KeyZ'].includes(k)) mapClick(mapSel); else if (k === 'Escape') wipe(() => { state = 'title'; }); return; }
  if (state === 'play') { if (k === 'Escape' || k === 'KeyP') pauseGame(); else if (k === 'KeyR' && !pl.dead && !pl.win) respawn(); return; }
  if (state === 'pause' && (k === 'Escape' || k === 'KeyP')) { resumeGame(); return; }
  if (state === 'replay') { if (replay.t > .6) nextLevel(); return; }
  if (state === 'title' && ['Space', 'Enter', 'KeyZ'].includes(k)) startGame();
}

/* ---------- Pagrindinis ciklas ---------- */
let last = performance.now(), acc = 0;
function frame(now) {
  requestAnimationFrame(frame);
  let dt = Math.min(.05, (now - last) / 1000); last = now; gt += dt;
  BTN = BTN_NEXT; BTN_NEXT = []; PAD = padRead();
  if (PAD && PAD.start && !padPrev.start) { if (state === 'play') pauseGame(); else if (state === 'pause') resumeGame(); else if (state === 'title') startGame(); else if (state === 'map') mapClick(mapSel); }
  if (PAD && state === 'map' && !mapWalk) { if (PAD.x > 0 && !(padPrev.x > 0)) mapMove(1); else if (PAD.x < 0 && !(padPrev.x < 0)) mapMove(-1); if (PAD.ok && !padPrev.ok) mapClick(mapSel); }
  if (PAD && PAD.ok && !padPrev.ok && state === 'title') startGame();
  if (PAD && PAD.ok && !padPrev.ok && state === 'replay' && replay.t > .6) nextLevel();
  ctx.setTransform(1, 0, 0, 1, 0, 0);
  if (state === 'boot') { if (drawIntro(dt)) { state = 'title'; anyInput = false; } }
  else if (state === 'title') { tbOn = false; drawTitle(dt); }
  else if (state === 'map') { tbOn = false; drawMapScreen(dt); }
  else if (state === 'settings') { drawSettingsBehind(dt); drawSettings(dt); }
  else if (state === 'play' || state === 'pause') {
    if (state === 'play') { acc += dt; while (acc >= DT) { step(DT); acc -= DT; } if (pl.win > .7 && state === 'play') { Poki.stop(); startReplay(); state = 'replay'; } }
    stepDevil(dt); drawPlay(dt); drawHud(); if (state === 'pause') drawPause();
  }
  else if (state === 'replay') { drawReplay(dt); }
  else if (state === 'wait') { if (replay) ctx.drawImage(replay.cache, 0, 0); }
  else if (state === 'worldClear') drawWorldClear(dt);
  drawWipe(dt); musicUpdate();
  if (Poki.adShow) { ctx.fillStyle = '#000'; ctx.fillRect(0, 0, GW, GH); text('AD (LOCAL TEST)', 240, 130, 2, '#fff', .5); }
  padPrev = PAD ? Object.assign({}, PAD) : {};
  present();
}
async function boot() {
  requestAnimationFrame(frame);
  const [font] = await Promise.all([loadJson('assets/font.json'), Poki.init()]);
  fontInit(font); loadSave(); langInit();
  bootDone = true; Poki.loaded();
}
boot();
