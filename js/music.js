/* music: chiptune muzika sintezuojama naršyklėje (0 baitų). Kiekvienam pasauliui - sava dermė, tempas, akordų seka ir instrumentai;
   melodija sugeneruojama iš sėklos (visada ta pati), forma A A' B A. Planuojama 0,12 s į priekį (WebAudio laikrodis - be trūkčiojimų). */
'use strict';
const SCALES = { minor: [0, 2, 3, 5, 7, 8, 10], major: [0, 2, 4, 5, 7, 9, 11], phryg: [0, 1, 4, 5, 7, 8, 10], lyd: [0, 2, 4, 6, 7, 9, 11], dorian: [0, 2, 3, 5, 7, 9, 10], harm: [0, 2, 3, 5, 7, 8, 11] };
/* temos: root (MIDI), tempas, dermė, akordai (laipsniai), švino ir boso bangos, būgnų raštas (k - būgnas, s - snare, h - lėkštė), seed */
const SONGS = {
  menu:    { root: 57, bpm: 116, sc: 'minor', prog: [0, 5, 3, 4], lead: 'square', bass: 'triangle', drums: 'k.h.s.h.k.k.s.hh', seed: 3, arp: true },
  dungeon: { root: 57, bpm: 108, sc: 'minor', prog: [0, 3, 5, 4], lead: 'square', bass: 'triangle', drums: 'k...s...k.k.s...', seed: 11, arp: false },
  forest:  { root: 55, bpm: 124, sc: 'major', prog: [0, 4, 5, 3], lead: 'square', bass: 'triangle', drums: 'k.h.s.h.k.hks.h.', seed: 23, arp: true },
  desert:  { root: 52, bpm: 104, sc: 'phryg', prog: [0, 1, 0, 6], lead: 'sawtooth', bass: 'triangle', drums: 'k..hs.h.k.k.s..h', seed: 37, arp: false },
  snow:    { root: 62, bpm: 92, sc: 'lyd', prog: [0, 4, 1, 4], lead: 'triangle', bass: 'triangle', drums: 'k.......s.......', seed: 41, arp: true },
  crystal: { root: 60, bpm: 98, sc: 'dorian', prog: [0, 3, 6, 4], lead: 'triangle', bass: 'sine', drums: 'k...h...s...h...', seed: 53, arp: true },
  hell:    { root: 50, bpm: 142, sc: 'harm', prog: [0, 5, 6, 4], lead: 'sawtooth', bass: 'square', drums: 'k.hks.hkk.hks.hs', seed: 67, arp: true },
};
const MUS = { cur: null, song: null, next: 0, step: 0, timer: null, gain: null, delay: null };
const midiHz = m => 440 * Math.pow(2, (m - 69) / 12);
function rng(seed) { let s = seed >>> 0 || 1; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; }
/* melodija: 4 taktai × 16 šešioliktinių; ritmas iš kelių raštų, natos - daugiausia akordo garsai, kartais pereinamieji */
function makePhrase(S, seed) {
  const R = rng(seed), rhythms = ['x.x.x.xxx.x.x...', 'x..x..x.x.x.x...', 'x.xxx.x.x..x.x..', 'xx.x.x..x.xx.x..', 'x...x.x.x...xxx.'], notes = [];
  for (let bar = 0; bar < 4; bar++) { const rh = rhythms[Math.floor(R() * rhythms.length)], deg = S.prog[bar]; let prev = 2;
    for (let i = 0; i < 16; i++) { if (rh[i] !== 'x') { notes.push(null); continue; }
      const chord = [0, 2, 4, 7], step = R() < .7 ? chord[Math.floor(R() * chord.length)] : prev + (R() < .5 ? 1 : -1); prev = step;
      const len = rh[i + 1] === '.' ? (rh[i + 2] === '.' ? 3 : 2) : 1; notes.push({ d: deg + step, len }); } }
  return notes;
}
function degMidi(S, d, oct) { const sc = SCALES[S.sc], n = sc.length, o = Math.floor(d / n), k = ((d % n) + n) % n; return S.root + (oct || 0) * 12 + o * 12 + sc[k]; }
function musicPlay(name) {
  if (!AC || MUS.cur === name) return; musicStop(); const S = SONGS[name]; if (!S) return;
  MUS.cur = name; MUS.song = S; MUS.step = 0; MUS.next = AC.currentTime + .08;
  MUS.A = makePhrase(S, S.seed); MUS.A2 = makePhrase(S, S.seed + 1); MUS.B = makePhrase(Object.assign({}, S, { prog: S.prog.slice().reverse() }), S.seed + 7);
  MUS.gain = AC.createGain(); MUS.gain.gain.setValueAtTime(0, AC.currentTime); MUS.gain.gain.linearRampToValueAtTime(1, AC.currentTime + 1.2); MUS.gain.connect(musBus);
  MUS.delay = AC.createDelay(); MUS.delay.delayTime.value = 60 / S.bpm * .75; const fb = AC.createGain(); fb.gain.value = .28; const wet = AC.createGain(); wet.gain.value = .35;
  MUS.delay.connect(fb); fb.connect(MUS.delay); MUS.delay.connect(wet); wet.connect(MUS.gain); MUS.wetIn = MUS.delay;
  MUS.timer = setInterval(() => musicTick(), 25);
}
function musicStop() {
  if (MUS.timer) clearInterval(MUS.timer); MUS.timer = null;
  if (MUS.gain && AC) { const g = MUS.gain; g.gain.cancelScheduledValues(AC.currentTime); g.gain.setValueAtTime(g.gain.value, AC.currentTime); g.gain.linearRampToValueAtTime(0, AC.currentTime + .4); setTimeout(() => { try { g.disconnect(); } catch (_) { } }, 600); }
  MUS.cur = null; MUS.gain = null;
}
function note(type, f, t, dur, vol, echo) {
  const o = AC.createOscillator(), g = AC.createGain(); o.type = type; o.frequency.setValueAtTime(f, t);
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(vol, t + .008); g.gain.setValueAtTime(vol, t + dur * .6); g.gain.exponentialRampToValueAtTime(.0008, t + dur);
  o.connect(g); g.connect(MUS.gain); if (echo) g.connect(MUS.wetIn); o.start(t); o.stop(t + dur + .02);
}
function drum(k, t) {
  if (k === 'k') { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; o.frequency.setValueAtTime(150, t); o.frequency.exponentialRampToValueAtTime(45, t + .12); g.gain.setValueAtTime(.32, t); g.gain.exponentialRampToValueAtTime(.001, t + .16); o.connect(g); g.connect(MUS.gain); o.start(t); o.stop(t + .2); return; }
  if (!noiseBuf) { noiseBuf = AC.createBuffer(1, AC.sampleRate, AC.sampleRate); const d = noiseBuf.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1; }
  const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = noiseBuf;
  if (k === 's') { f.type = 'bandpass'; f.frequency.value = 1800; g.gain.setValueAtTime(.16, t); g.gain.exponentialRampToValueAtTime(.001, t + .14); }
  else { f.type = 'highpass'; f.frequency.value = 7000; g.gain.setValueAtTime(.05, t); g.gain.exponentialRampToValueAtTime(.001, t + .04); }
  s.connect(f); f.connect(g); g.connect(MUS.gain); s.start(t, Math.random() * .5); s.stop(t + .2);
}
function musicTick(until) {   // until - planavimo riba (s); be jos - 0,12 s į priekį
  if (!AC || !MUS.song) return; const S = MUS.song, st = 60 / S.bpm / 4;
  while (MUS.next < (until ?? AC.currentTime + .12)) {
    const t = MUS.next, i = MUS.step % 256, sec = Math.floor(i / 64), pos = i % 64, bar = Math.floor(pos / 16), s16 = pos % 16;
    const phrase = [MUS.A, MUS.A2, MUS.B, MUS.A][sec], deg = (sec === 2 ? S.prog.slice().reverse() : S.prog)[bar];
    /* švinas */
    const n = phrase[pos]; if (n) note(S.lead, midiHz(degMidi(S, n.d, 1)), t, st * n.len * .95, S.lead === 'square' ? .045 : S.lead === 'sawtooth' ? .035 : .07, true);
    /* bosas: aštuntinės (pragare - šešioliktinės) */
    if (s16 % (S.bpm > 130 ? 2 : 4) === 0) { const oct = s16 % 8 === 0 ? -1 : -1, d = deg + (s16 === 12 ? 4 : 0); note(S.bass, midiHz(degMidi(S, d, oct)), t, st * 1.8, S.bass === 'square' ? .04 : .09); }
    /* arpedžas */
    if (S.arp && s16 % 2 === 1) { const ch = [0, 2, 4, 7][(s16 >> 1) % 4]; note('square', midiHz(degMidi(S, deg + ch, 1)), t, st * .8, .012); }
    /* būgnai */
    const dk = S.drums[s16]; if (dk !== '.') drum(dk, t);
    MUS.next += st; MUS.step++;
  }
}
/* kokia tema turi groti dabar (kviečiama kiekviename kadre) */
function musicUpdate() {
  if (!AC || save.music === false) { if (MUS.cur) musicStop(); return; }
  const inLevel = ['play', 'pause', 'replay', 'wait', 'solve'].includes(state) || (state === 'settings' && SET_FROM === 'pause');
  const want = inLevel ? worldOf(LV).name : state === 'boot' ? null : 'menu';
  if (want && want !== MUS.cur) musicPlay(want);
}
