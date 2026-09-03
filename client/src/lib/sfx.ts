// Minimal synthesized sound effects for the game — no audio files to load.
// Off by default until the player turns sound on; the preference persists.
const KEY = "rtr-sound";
let ctx: AudioContext | null = null;
let enabled = (() => {
  try { return localStorage.getItem(KEY) === "on"; } catch { return false; }
})();

function ac(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const Ctor = window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!Ctor) return null;
  if (!ctx) ctx = new Ctor();
  if (ctx.state === "suspended") ctx.resume().catch(() => {});
  return ctx;
}

function tone(freq: number, ms: number, type: OscillatorType = "sine", gain = 0.05, startIn = 0) {
  if (!enabled) return;
  const c = ac();
  if (!c) return;
  const o = c.createOscillator();
  const g = c.createGain();
  o.type = type;
  o.frequency.value = freq;
  const t0 = c.currentTime + startIn;
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + 0.01);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + ms / 1000);
  o.connect(g).connect(c.destination);
  o.start(t0);
  o.stop(t0 + ms / 1000 + 0.02);
}

export const sfx = {
  isOn: () => enabled,
  set(on: boolean) {
    enabled = on;
    try { localStorage.setItem(KEY, on ? "on" : "off"); } catch { /* private mode */ }
    if (on) ac();
  },
  correct() { tone(660, 90, "triangle", 0.05); tone(990, 120, "triangle", 0.04, 0.06); },
  wrong() { tone(180, 220, "sawtooth", 0.035); },
  bank() { [523, 659, 784, 1046].forEach((f, i) => tone(f, 140, "triangle", 0.05, i * 0.07)); },
  tick() { tone(1200, 30, "square", 0.012); },
  start() { tone(440, 80, "triangle", 0.04); tone(880, 160, "triangle", 0.04, 0.1); },
  over() { tone(330, 200, "sawtooth", 0.03); tone(220, 400, "sawtooth", 0.03, 0.18); },
};
