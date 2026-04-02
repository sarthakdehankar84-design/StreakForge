// ─── Web Audio synthesizer for StreakForge Focus Timer ────────────────────────
// All sounds are generated via Web Audio API — no external files required.

const SOUND_KEY = "sf_sound_enabled";

export const getSoundEnabled = (): boolean => {
  const stored = localStorage.getItem(SOUND_KEY);
  return stored === null ? true : stored === "true";
};

export const setSoundEnabled = (enabled: boolean): void => {
  localStorage.setItem(SOUND_KEY, String(enabled));
};

let _ctx: AudioContext | null = null;

function getCtx(): AudioContext {
  if (!_ctx || _ctx.state === "closed") {
    _ctx = new AudioContext();
  }
  if (_ctx.state === "suspended") {
    _ctx.resume();
  }
  return _ctx;
}

// ─── Soft Tick (last 5 seconds of Pomodoro) ──────────────────────────────────
export function playTick(): void {
  if (!getSoundEnabled()) return;
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;

    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = "sine";
    osc.frequency.setValueAtTime(1050, t);
    osc.frequency.exponentialRampToValueAtTime(900, t + 0.06);

    gain.gain.setValueAtTime(0, t);
    gain.gain.linearRampToValueAtTime(0.18, t + 0.01);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.09);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start(t);
    osc.stop(t + 0.1);
  } catch (_) {
    // Silently ignore if audio context unavailable
  }
}

// ─── Completion Chime (session end) ──────────────────────────────────────────
// Three ascending tones in a pleasing major chord (C5 → E5 → G5)
export function playCompletionChime(): void {
  if (!getSoundEnabled()) return;
  try {
    const ctx = getCtx();

    const notes = [523.25, 659.25, 783.99]; // C5, E5, G5
    notes.forEach((freq, i) => {
      const t = ctx.currentTime + i * 0.18;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = "sine";
      osc.frequency.setValueAtTime(freq, t);

      // Add a subtle second harmonic for warmth
      const osc2 = ctx.createOscillator();
      osc2.type = "sine";
      osc2.frequency.setValueAtTime(freq * 2, t);

      const gain2 = ctx.createGain();
      gain2.gain.setValueAtTime(0.04, t);

      gain.gain.setValueAtTime(0, t);
      gain.gain.linearRampToValueAtTime(0.22, t + 0.015);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.65);

      osc.connect(gain);
      osc2.connect(gain2);
      gain.connect(ctx.destination);
      gain2.connect(ctx.destination);

      osc.start(t);
      osc.stop(t + 0.7);
      osc2.start(t);
      osc2.stop(t + 0.7);
    });

    // Final sustain tone on G5 with longer tail
    const tFinal = ctx.currentTime + notes.length * 0.18;
    const oscFinal = ctx.createOscillator();
    const gainFinal = ctx.createGain();
    oscFinal.type = "sine";
    oscFinal.frequency.setValueAtTime(783.99, tFinal);
    gainFinal.gain.setValueAtTime(0.14, tFinal);
    gainFinal.gain.exponentialRampToValueAtTime(0.001, tFinal + 1.1);
    oscFinal.connect(gainFinal);
    gainFinal.connect(ctx.destination);
    oscFinal.start(tFinal);
    oscFinal.stop(tFinal + 1.2);
  } catch (_) {}
}

// ─── Break Bell (switching to break mode) ────────────────────────────────────
// Warm bell tone — slightly detuned double oscillator for richness
export function playBreakBell(): void {
  if (!getSoundEnabled()) return;
  try {
    const ctx = getCtx();
    const t = ctx.currentTime;

    // Primary tone — A4
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = "sine";
    osc1.frequency.setValueAtTime(440, t);

    // Slightly detuned second oscillator for bell shimmer
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = "sine";
    osc2.frequency.setValueAtTime(443.5, t); // 3.5 Hz beat frequency

    // 3rd harmonic — subtle
    const osc3 = ctx.createOscillator();
    const gain3 = ctx.createGain();
    osc3.type = "sine";
    osc3.frequency.setValueAtTime(880, t);

    gain1.gain.setValueAtTime(0, t);
    gain1.gain.linearRampToValueAtTime(0.18, t + 0.01);
    gain1.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    gain2.gain.setValueAtTime(0, t);
    gain2.gain.linearRampToValueAtTime(0.14, t + 0.01);
    gain2.gain.exponentialRampToValueAtTime(0.001, t + 1.4);

    gain3.gain.setValueAtTime(0, t);
    gain3.gain.linearRampToValueAtTime(0.05, t + 0.01);
    gain3.gain.exponentialRampToValueAtTime(0.001, t + 0.8);

    osc1.connect(gain1); gain1.connect(ctx.destination);
    osc2.connect(gain2); gain2.connect(ctx.destination);
    osc3.connect(gain3); gain3.connect(ctx.destination);

    [osc1, osc2, osc3].forEach((o) => { o.start(t); o.stop(t + 1.5); });
  } catch (_) {}
}
